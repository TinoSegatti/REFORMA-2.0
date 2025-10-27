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

  const resultado = await prisma.$queryRaw<[{ cantidad: number }]>`
    SELECT COALESCE(SUM(cd.cantidad_comprada), 0) as cantidad
    FROM t_compra_detalle cd
    INNER JOIN t_compra_cabecera cc ON cd.id_compra = cc.id
    WHERE cc.id_granja = ${idGranja}
      AND cd.id_materia_prima = ${idMateriaPrima}
  `;

  return resultado[0]?.cantidad || 0;
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
    SELECT COALESCE(SUM(df.cantidad_usada), 0) as cantidad
    FROM t_detalle_fabricacion df
    INNER JOIN t_fabricacion f ON df.id_fabricacion = f.id
    WHERE f.id_granja = ${idGranja}
      AND df.id_materia_prima = ${idMateriaPrima}
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

  const resultado = await prisma.$queryRaw<[{ 
    total_dinero: number, 
    total_cantidad: number 
  }]>`
    SELECT 
      COALESCE(SUM(cd.cantidad_comprada * cd.precio_unitario), 0) as total_dinero,
      COALESCE(SUM(cd.cantidad_comprada), 0) as total_cantidad
    FROM t_compra_detalle cd
    INNER JOIN t_compra_cabecera cc ON cd.id_compra = cc.id
    WHERE cc.id_granja = ${idGranja}
      AND cd.id_materia_prima = ${idMateriaPrima}
  `;

  const { total_dinero = 0, total_cantidad = 0 } = resultado[0] || {};

  if (total_cantidad === 0) return 0;
  
  return total_dinero / total_cantidad;
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
  return cantidadReal * precioAlmacen;
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

  // Si no existe inventario, usar cantidad_sistema como cantidad_real inicial
  const cantidad_real = inventarioActual?.cantidadReal || cantidad_sistema;

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

  // Actualizar inventario
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
      cantidadReal: cantidadReal,
      merma,
      precioAlmacen: precio_almacen,
      valorStock: valor_stock
    },
    update: {
      cantidadAcumulada: cantidad_acumulada,
      cantidadSistema: cantidad_sistema,
      cantidadReal: cantidadReal,
      merma,
      precioAlmacen: precio_almacen,
      valorStock: valor_stock
    }
  });
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



