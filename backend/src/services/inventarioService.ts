/**
 * Servicio de Inventario
 * Gestiona todos los cálculos automáticos del sistema de inventario
 */

import prisma from '../lib/prisma';

interface CalcularInventarioParams {
  idGranja: string;
  idMateriaPrima: string;
}

/**
 * Calcula cantidad_acumulada
 * Suma total de todas las compras registradas de esa materia prima
 */
export async function calcularCantidadAcumulada(params: CalcularInventarioParams): Promise<number> {
  const { idGranja, idMateriaPrima } = params;

  const resultado = await prisma.$queryRaw<[{ cantidad: unknown }]>`
    SELECT COALESCE(SUM(cd."cantidadComprada"), 0) as cantidad
    FROM t_compra_detalle cd
    INNER JOIN t_compra_cabecera cc ON cd."idCompra" = cc.id
    WHERE cc."idGranja" = ${idGranja}
      AND cd."idMateriaPrima" = ${idMateriaPrima}
      AND cc."activo" = true
  `;

  const sumaCompras = Number(resultado[0]?.cantidad || 0);

  // Incluir base de inicialización persistida
  const ini = await prisma.inventarioInicial.findUnique({
    where: { idGranja_idMateriaPrima: { idGranja, idMateriaPrima } }
  });
  const baseInicial = Number(ini?.cantidadInicial || 0);

  return baseInicial + sumaCompras;
}

/**
 * Calcula cantidad_sistema
 * Diferencia entre lo adquirido (compras) y lo fabricado
 */
export async function calcularCantidadSistema(params: CalcularInventarioParams): Promise<number> {
  const { idGranja, idMateriaPrima } = params;

  // Entradas totales (compras)
  const cantidadAcumulada = await calcularCantidadAcumulada(params);

  // Salidas totales (fabricaciones)
  const cantidadUsada = await prisma.$queryRaw<[{ cantidad: number }]>`
    SELECT COALESCE(SUM(df."cantidadUsada"), 0) as cantidad
    FROM t_detalle_fabricacion df
    INNER JOIN t_fabricacion f ON df."idFabricacion" = f.id
    WHERE f."idGranja" = ${idGranja}
      AND df."idMateriaPrima" = ${idMateriaPrima}
      AND f."activo" = true
  `;

  const cantidad_usada_total = cantidadUsada[0]?.cantidad || 0;

  return cantidadAcumulada - cantidad_usada_total;
}

/**
 * Calcula precio_almacen
 * Promedio ponderado de todas las compras
 */
export async function calcularPrecioAlmacen(params: CalcularInventarioParams): Promise<number> {
  const { idGranja, idMateriaPrima } = params;

  // Promedio simple de precios unitarios (no ponderado) + incluir inicialización como 1 evento si existe
  const comprasAgg = await prisma.$queryRaw<[{ 
    suma_precios: number,
    cantidad_eventos: number
  }]>`
    SELECT 
      COALESCE(SUM(cd."precioUnitario"), 0) as suma_precios,
      COUNT(cd.id) as cantidad_eventos
    FROM t_compra_detalle cd
    INNER JOIN t_compra_cabecera cc ON cd."idCompra" = cc.id
    WHERE cc."idGranja" = ${idGranja}
      AND cd."idMateriaPrima" = ${idMateriaPrima}
      AND cc."activo" = true
  `;

  const rawAgg = comprasAgg[0] || ({} as any);
  const suma_precios = Number((rawAgg as any).suma_precios ?? 0);
  const cantidad_eventos = Number((rawAgg as any).cantidad_eventos ?? 0);

  // Usar inventario inicial persistido como primer evento
  const ini = await prisma.inventarioInicial.findUnique({
    where: { idGranja_idMateriaPrima: { idGranja, idMateriaPrima } }
  });
  const tieneInicializacion = !!ini && (ini.cantidadInicial > 0 || ini.precioInicial > 0);
  const precioInicial = Number(ini?.precioInicial || 0);

  if (!tieneInicializacion && cantidad_eventos === 0) return 0;

  const sumaTotal = suma_precios + (tieneInicializacion ? precioInicial : 0);
  const eventosTotales = cantidad_eventos + (tieneInicializacion ? 1 : 0);

  if (eventosTotales === 0) return 0;
  return sumaTotal / eventosTotales;
}

/**
 * Calcula merma
 * Diferencia entre cantidad_sistema y cantidad_real
 */
export function calcularMerma(cantidadSistema: number, cantidadReal: number): number {
  return cantidadSistema - cantidadReal;
}

/**
 * Calcula valor_stock
 * Cantidad real multiplicada por el precio almacen
 */
export function calcularValorStock(cantidadReal: number, precioAlmacen: number): number {
  const cantidadNoNegativa = Math.max(0, cantidadReal);
  return cantidadNoNegativa * precioAlmacen;
}

/**
 * Recalcula TODO el inventario de una materia prima
 * Se ejecuta después de compras o cambios manuales
 */
export async function recalcularInventario(params: CalcularInventarioParams) {
  const { idGranja, idMateriaPrima } = params;

  // Calcular valores automáticos
  const cantidad_acumulada = await calcularCantidadAcumulada(params);
  const cantidad_sistema = await calcularCantidadSistema(params);
  const precio_almacen = await calcularPrecioAlmacen(params);

  // Obtener cantidad_real actual (no se calcula, es manual)
  const inventarioActual = await prisma.inventario.findUnique({
    where: {
      idGranja_idMateriaPrima: {
        idGranja,
        idMateriaPrima
      }
    }
  });

  // Mantener la diferencia manual real - sistema
  const diferenciaManual = inventarioActual
    ? (inventarioActual.cantidadReal - inventarioActual.cantidadSistema)
    : 0;
  // Si no existe inventario, diferenciaManual = 0 → real = sistema
  const cantidad_real = cantidad_sistema + diferenciaManual;

  // Calcular valores derivados
  const merma = calcularMerma(cantidad_sistema, cantidad_real);
  const valor_stock = calcularValorStock(cantidad_real, precio_almacen);

  // Actualizar o crear inventario
  await prisma.inventario.upsert({
    where: {
      idGranja_idMateriaPrima: {
        idGranja,
        idMateriaPrima
      }
    },
    create: {
      idGranja,
      idMateriaPrima,
      cantidadAcumulada: cantidad_acumulada,
      cantidadSistema: cantidad_sistema,
      cantidadReal: cantidad_real,
      merma,
      precioAlmacen: precio_almacen,
      valorStock: valor_stock
    },
    update: {
      cantidadAcumulada: cantidad_acumulada,
      cantidadSistema: cantidad_sistema,
      cantidadReal: cantidad_real,
      merma,
      precioAlmacen: precio_almacen,
      valorStock: valor_stock
    }
  });

  return {
    cantidad_acumulada,
    cantidad_sistema,
    cantidad_real,
    merma,
    precio_almacen,
    valor_stock
  };
}

/**
 * Actualiza cantidad_real manualmente y recalcula inventario
 */
export async function actualizarCantidadReal(
  idGranja: string,
  idMateriaPrima: string,
  cantidadReal: number
) {
  if (cantidadReal < 0) {
    throw new Error('La cantidad real no puede ser negativa');
  }

  const params = { idGranja, idMateriaPrima };
  
  // Recalcular valores automáticos
  const cantidad_acumulada = await calcularCantidadAcumulada(params);
  const cantidad_sistema = await calcularCantidadSistema(params);
  const precio_almacen = await calcularPrecioAlmacen(params);

  // Calcular valores derivados con la nueva cantidad real
  const merma = calcularMerma(cantidad_sistema, cantidadReal);
  const valor_stock = calcularValorStock(cantidadReal, precio_almacen);

  // Optimistic concurrency con campo version
  const existente = await prisma.inventario.findUnique({
    where: {
      idGranja_idMateriaPrima: { idGranja, idMateriaPrima }
    }
  });

  if (!existente) {
    await prisma.inventario.create({
      data: {
        idGranja,
        idMateriaPrima,
        cantidadAcumulada: cantidad_acumulada,
        cantidadSistema: cantidad_sistema,
        cantidadReal: cantidadReal,
        merma,
        precioAlmacen: precio_almacen,
        valorStock: valor_stock,
        // version inicia en 0 por default
      }
    });
    return;
  }

  const updated = await prisma.$executeRawUnsafe(
    `UPDATE "t_inventario"
     SET "cantidadAcumulada" = $1,
         "cantidadSistema" = $2,
         "cantidadReal" = $3,
         "merma" = $4,
         "precioAlmacen" = $5,
         "valorStock" = $6,
         "version" = "version" + 1
     WHERE "idGranja" = $7 AND "idMateriaPrima" = $8 AND "version" = $9`,
    cantidad_acumulada,
    cantidad_sistema,
    cantidadReal,
    merma,
    precio_almacen,
    valor_stock,
    idGranja,
    idMateriaPrima,
    existente.version
  );

  // updated es el número de filas afectadas en PG
  if ((updated as unknown as number) === 0) {
    throw new Error('Conflicto de actualización: el inventario fue modificado por otro usuario. Recargue y reintente.');
  }
}

/**
 * Obtiene el inventario completo de una granja
 */
export async function obtenerInventarioGranja(idGranja: string) {
  return await prisma.inventario.findMany({
    where: { idGranja },
    include: {
      materiaPrima: {
        select: {
          codigoMateriaPrima: true,
          nombreMateriaPrima: true,
          precioPorKilo: true
        }
      }
    },
    orderBy: {
      materiaPrima: {
        nombreMateriaPrima: 'asc'
      }
    }
  });
}

export async function sincronizarCantidadRealConSistema(idGranja: string, idMateriaPrima: string) {
  // Obtener inventario actual
  const inv = await prisma.inventario.findUnique({
    where: {
      idGranja_idMateriaPrima: {
        idGranja,
        idMateriaPrima
      }
    }
  });

  if (!inv) {
    // Si no existe, ejecutar un recálculo completo que lo cree
    await recalcularInventario({ idGranja, idMateriaPrima });
    return;
  }

  // Preservar el ajuste manual del usuario manteniendo constante la diferencia (real - sistema)
  const diferenciaManual = inv.cantidadReal - inv.cantidadSistema; // puede ser positiva o negativa
  const cantidadReal = inv.cantidadSistema + diferenciaManual;
  const valorStock = cantidadReal * inv.precioAlmacen;
  // Nota: en este servicio merma se definió como (sistema - real)
  const merma = inv.cantidadSistema - cantidadReal;

  await prisma.inventario.update({
    where: {
      idGranja_idMateriaPrima: {
        idGranja,
        idMateriaPrima
      }
    },
    data: {
      cantidadReal,
      merma,
      valorStock
    }
  });
}



