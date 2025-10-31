/**
 * Servicio de Compras
 * Gestiona compras y actualización automática de precios
 */

import prisma from '../lib/prisma';
import { recalcularInventario, sincronizarCantidadRealConSistema } from './inventarioService';
import { recalcularFormulasPorMateriaPrima } from './formulaService';

interface CrearCompraParams {
  idGranja: string;
  idUsuario: string;
  idProveedor: string;
  numeroFactura?: string;
  fechaCompra: Date;
  observaciones?: string;
  totalFactura?: number; // permitir total provisorio cuando no hay detalles
  detalles: Array<{
    idMateriaPrima: string;
    cantidadComprada: number;
    precioUnitario: number;
    subtotal?: number; // Opcional: si viene, validamos que coincida
  }>;
}

/**
 * Registra una nueva compra y actualiza el sistema completo
 */
export async function crearCompra(params: CrearCompraParams) {
  const { idGranja, idUsuario, idProveedor, numeroFactura, fechaCompra, observaciones, detalles } = params;

  // Validar y calcular subtotales y total (sin tolerancia por redondeos)
  let totalFacturaCalculado = 0;
  for (const detalle of detalles) {
    const subtotalCalculado = detalle.cantidadComprada * detalle.precioUnitario;
    if (detalle.subtotal !== undefined) {
      if (Math.abs(detalle.subtotal - subtotalCalculado) > 0.001) {
        throw new Error(`El subtotal del item no coincide: esperado ${subtotalCalculado.toFixed(2)}, recibido ${detalle.subtotal.toFixed(2)}`);
      }
    }
    totalFacturaCalculado += subtotalCalculado;
  }

  // Si no hay detalles, usar total provisorio provisto o 0
  const totalFactura = detalles.length === 0 ? (params.totalFactura ?? 0) : totalFacturaCalculado;

  // Crear la cabecera de compra
  const compra = await prisma.compraCabecera.create({
    data: {
      idGranja,
      idUsuario,
      idProveedor,
      numeroFactura,
      fechaCompra,
      totalFactura,
      observaciones,
      comprasDetalle: {
        create: detalles.map(detalle => ({
          idMateriaPrima: detalle.idMateriaPrima,
          cantidadComprada: detalle.cantidadComprada,
          precioUnitario: detalle.precioUnitario,
          subtotal: detalle.cantidadComprada * detalle.precioUnitario,
          precioAnteriorMateriaPrima: 0 // Se actualizará después
        }))
      }
    },
    include: {
      comprasDetalle: true
    }
  });

  // Por cada materia prima comprada:
  for (const detalle of compra.comprasDetalle) {
    // 1. Registrar precio anterior para auditoría
    const materiaPrimaActual = await prisma.materiaPrima.findUnique({
      where: { id: detalle.idMateriaPrima }
    });

    const precioAnterior = materiaPrimaActual?.precioPorKilo || 0;

    // 2. Actualizar detalle con precio anterior
    await prisma.compraDetalle.update({
      where: { id: detalle.id },
      data: {
        precioAnteriorMateriaPrima: precioAnterior
      }
    });

    // 3. Actualizar precio unitario de la materia prima al último precio comprado
    await prisma.materiaPrima.update({
      where: { id: detalle.idMateriaPrima },
      data: {
        precioPorKilo: detalle.precioUnitario // Último precio comprado
      }
    });

    // 4. Registrar cambio de precio para auditoría
    if (precioAnterior !== detalle.precioUnitario) {
      const diferenciaPorcentual = precioAnterior > 0 
        ? ((detalle.precioUnitario - precioAnterior) / precioAnterior) * 100
        : 0;

      await prisma.registroPrecio.create({
        data: {
          idMateriaPrima: detalle.idMateriaPrima,
          precioAnterior,
          precioNuevo: detalle.precioUnitario,
          diferenciaPorcentual,
          motivo: `Actualización por compra - Factura ${params.numeroFactura || 'N/A'}`
        }
      });
    }

    // 5. Recalcular inventario (actualizará precioAlmacen como promedio ponderado)
    await recalcularInventario({
      idGranja,
      idMateriaPrima: detalle.idMateriaPrima
    });

    // 5.1 Sincronizar cantidadReal con cantidadSistema tras compras
    await sincronizarCantidadRealConSistema(idGranja, detalle.idMateriaPrima);

    // 6. Recalcular todas las fórmulas que usan esta materia prima
    await recalcularFormulasPorMateriaPrima(detalle.idMateriaPrima);
  }

  return compra;
}

/**
 * Obtiene el historial de compras de una granja con filtros
 */
export async function obtenerComprasGranja(
  idGranja: string,
  filters?: {
    desde?: string;
    hasta?: string;
    materiaPrima?: string;
    proveedor?: string;
    numeroFactura?: string;
  }
) {
  const where: any = { idGranja };

  if (filters?.desde) {
    where.fechaCompra = { ...where.fechaCompra, gte: new Date(filters.desde) };
  }
  if (filters?.hasta) {
    where.fechaCompra = { ...where.fechaCompra, lte: new Date(filters.hasta) };
  }
  if (filters?.numeroFactura) {
    where.numeroFactura = { contains: filters.numeroFactura, mode: 'insensitive' };
  }
  if (filters?.proveedor) {
    where.proveedor = {
      OR: [
        { codigoProveedor: { contains: filters.proveedor, mode: 'insensitive' } },
        { nombreProveedor: { contains: filters.proveedor, mode: 'insensitive' } }
      ]
    };
  }

  let compras = await prisma.compraCabecera.findMany({
    where,
    include: {
      proveedor: {
        select: {
          codigoProveedor: true,
          nombreProveedor: true
        }
      },
      comprasDetalle: {
        select: {
          id: true // Solo necesitamos el ID para contar items
        }
      }
    },
    orderBy: {
      fechaCompra: 'desc'
    }
  });

  // Filtrar por materia prima en detalle (post-query)
  // Nota: Para este filtro necesitamos los detalles completos, así que hacemos una consulta adicional
  if (filters?.materiaPrima) {
    const comprasConDetalles = await prisma.compraCabecera.findMany({
      where,
      include: {
        comprasDetalle: {
          include: {
            materiaPrima: {
              select: {
                codigoMateriaPrima: true,
                nombreMateriaPrima: true
              }
            }
          }
        }
      },
      orderBy: {
        fechaCompra: 'desc'
      }
    });

    const comprasFiltradas = comprasConDetalles.filter(compra =>
      compra.comprasDetalle.some(detalle =>
        detalle.materiaPrima.codigoMateriaPrima.toLowerCase().includes(filters.materiaPrima!.toLowerCase()) ||
        detalle.materiaPrima.nombreMateriaPrima.toLowerCase().includes(filters.materiaPrima!.toLowerCase())
      )
    );

    // Devolver solo los IDs de detalles para mantener consistencia
    return comprasFiltradas.map(compra => ({
      ...compra,
      comprasDetalle: compra.comprasDetalle.map(d => ({ id: d.id }))
    }));
  }

  return compras;
}

/**
 * Obtiene estadísticas de compras
 */
export async function obtenerEstadisticasCompras(idGranja: string) {
  // Frecuencia de compras por materia prima (cuántas veces se compró cada MP)
  const frecuenciaPorMateria = await prisma.$queryRaw<Array<{
    codigo: string;
    nombre: string;
    vecesComprada: number;
  }>>`
    SELECT
      mp."codigoMateriaPrima" as codigo,
      mp."nombreMateriaPrima" as nombre,
      COUNT(DISTINCT cd.id) as veces_comprada
    FROM t_compra_detalle cd
    INNER JOIN t_compra_cabecera cc ON cd."idCompra" = cc.id
    INNER JOIN t_materia_prima mp ON cd."idMateriaPrima" = mp.id
    WHERE cc."idGranja" = ${idGranja}
    GROUP BY mp.id, mp."codigoMateriaPrima", mp."nombreMateriaPrima"
    ORDER BY veces_comprada DESC
    LIMIT 10
  `;

  const totalCompras = await prisma.compraCabecera.count({
    where: { idGranja }
  });

  return {
    frecuenciaPorMateria: frecuenciaPorMateria.map(item => ({
      codigo: item.codigo,
      nombre: item.nombre,
      vecesComprada: Number(item.vecesComprada)
    })),
    totalCompras
  };
}

/**
 * Obtiene el gasto total por proveedor en una granja
 */
export async function obtenerGastoPorProveedor(idGranja: string) {
  return await prisma.$queryRaw<Array<{
    id_proveedor: string;
    codigo_proveedor: string;
    nombre_proveedor: string;
    total_gastado: number;
    cantidad_compras: number;
  }>>`
    SELECT 
      p.id as id_proveedor,
      p."codigoProveedor" as codigo_proveedor,
      p."nombreProveedor" as nombre_proveedor,
      COALESCE(SUM(cc."totalFactura"), 0) as total_gastado,
      COUNT(cc.id) as cantidad_compras
    FROM t_proveedor p
    LEFT JOIN t_compra_cabecera cc ON p.id = cc."idProveedor" AND cc."idGranja" = ${idGranja}
    WHERE p."idGranja" = ${idGranja}
      AND p.activo = true
    GROUP BY p.id, p."codigoProveedor", p."nombreProveedor"
    ORDER BY total_gastado DESC
  `;
}

/**
 * Obtiene el historial de cambios de precio de una materia prima
 */
export async function obtenerHistorialPrecios(idMateriaPrima: string) {
  return await prisma.registroPrecio.findMany({
    where: { idMateriaPrima },
    orderBy: {
      fechaCambio: 'desc'
    }
  });
}

/**
 * Obtener último precio comprado de una materia prima
 */
export async function obtenerUltimoPrecio(idGranja: string, idMateriaPrima: string): Promise<number | null> {
  const ultimaCompra = await prisma.compraDetalle.findFirst({
    where: {
      materiaPrima: { id: idMateriaPrima },
      compra: { idGranja }
    },
    orderBy: {
      compra: {
        fechaCompra: 'desc'
      }
    },
    include: {
      compra: true
    }
  });

  return ultimaCompra?.precioUnitario || null;
}

/**
 * Agregar un item a una compra existente
 */
export async function agregarItemCompra(
  idCompra: string,
  idMateriaPrima: string,
  cantidadComprada: number,
  precioUnitario: number
) {
  // Obtener compra
  const compra = await prisma.compraCabecera.findUnique({
    where: { id: idCompra },
    include: { comprasDetalle: true }
  });

  if (!compra) {
    throw new Error('Compra no encontrada');
  }

  // Evitar duplicados de materia prima en el mismo comprobante
  const yaExiste = await prisma.compraDetalle.findFirst({
    where: {
      idCompra,
      idMateriaPrima
    }
  });
  if (yaExiste) {
    throw new Error('Esta materia prima ya está incluida en la factura');
  }

  // Obtener precio anterior
  const materiaPrima = await prisma.materiaPrima.findUnique({
    where: { id: idMateriaPrima }
  });

  const precioAnterior = materiaPrima?.precioPorKilo || 0;

  // Crear detalle
  const subtotal = cantidadComprada * precioUnitario;
  const nuevoDetalle = await prisma.compraDetalle.create({
    data: {
      idCompra,
      idMateriaPrima,
      cantidadComprada,
      precioUnitario,
      subtotal,
      precioAnteriorMateriaPrima: precioAnterior
    }
  });

  // Actualizar precio unitario de la materia prima al último precio comprado
  await prisma.materiaPrima.update({
    where: { id: idMateriaPrima },
    data: { precioPorKilo: precioUnitario }
  });

  // Registrar historial de precio si cambió
  if (precioAnterior !== precioUnitario) {
    const diferenciaPorcentual = precioAnterior > 0
      ? ((precioUnitario - precioAnterior) / precioAnterior) * 100
      : 0;
    await prisma.registroPrecio.create({
      data: {
        idMateriaPrima,
        precioAnterior,
        precioNuevo: precioUnitario,
        diferenciaPorcentual,
        motivo: `Actualización por compra - Agregar item en compra ${idCompra}`
      }
    });
  }

  // Recalcular inventario completo con la regla global y sincronizar cantidadReal
  await recalcularInventario({ idGranja: compra.idGranja, idMateriaPrima });
  await sincronizarCantidadRealConSistema(compra.idGranja, idMateriaPrima);

  await recalcularFormulasPorMateriaPrima(idMateriaPrima);

  return nuevoDetalle;
}

/**
 * Editar un item de compra (rollback + aplicar nuevo)
 */
export async function editarItemCompra(
  idDetalle: string,
  cantidadComprada: number,
  precioUnitario: number
) {
  // Obtener detalle actual
  const detalleActual = await prisma.compraDetalle.findUnique({
    where: { id: idDetalle },
    include: {
      compra: true,
      materiaPrima: true
    }
  });

  if (!detalleActual) {
    throw new Error('Detalle de compra no encontrado');
  }

  const deltaCantidad = cantidadComprada - detalleActual.cantidadComprada;

  // Calcular subtotal
  const subtotalCalculado = cantidadComprada * precioUnitario;

  // Actualizar detalle
  await prisma.compraDetalle.update({
    where: { id: idDetalle },
    data: {
      cantidadComprada,
      precioUnitario,
      subtotal: subtotalCalculado
    }
  });

  // Actualizar precio unitario de materia prima (último precio)
  await prisma.materiaPrima.update({
    where: { id: detalleActual.idMateriaPrima },
    data: { precioPorKilo: precioUnitario }
  });

  // Recalcular inventario según regla global y sincronizar cantidadReal
  await recalcularInventario({ idGranja: detalleActual.compra.idGranja, idMateriaPrima: detalleActual.idMateriaPrima });
  await sincronizarCantidadRealConSistema(detalleActual.compra.idGranja, detalleActual.idMateriaPrima);

  await recalcularFormulasPorMateriaPrima(detalleActual.idMateriaPrima);

  return detalleActual;
}

/**
 * Eliminar un item de compra
 */
export async function eliminarItemCompra(idDetalle: string) {
  // Obtener detalle
  const detalle = await prisma.compraDetalle.findUnique({
    where: { id: idDetalle },
    include: {
      compra: true
    }
  });

  if (!detalle) {
    throw new Error('Detalle de compra no encontrado');
  }

  // Guardar datos antes de eliminar
  const { idCompra, idMateriaPrima, compra } = detalle;

  // Eliminar detalle
  await prisma.compraDetalle.delete({
    where: { id: idDetalle }
  });

  // Recalcular inventario según regla global y sincronizar cantidadReal
  await recalcularInventario({ idGranja: compra.idGranja, idMateriaPrima });
  await sincronizarCantidadRealConSistema(compra.idGranja, idMateriaPrima);

  // Ajustar precioPorKilo de la materia prima al último precio vigente (o a la base de inicialización si no quedan compras)
  const ultimoPrecio = await obtenerUltimoPrecio(compra.idGranja, idMateriaPrima);
  if (ultimoPrecio !== null) {
    await prisma.materiaPrima.update({
      where: { id: idMateriaPrima },
      data: { precioPorKilo: ultimoPrecio }
    });
  } else {
    // Si no quedan compras: usar precioInicial de inventario inicial como fallback
    const ini = await prisma.inventarioInicial.findUnique({
      where: {
        idGranja_idMateriaPrima: {
          idGranja: compra.idGranja,
          idMateriaPrima
        }
      }
    });
    const fallback = Number(ini?.precioInicial || 0);
    await prisma.materiaPrima.update({
      where: { id: idMateriaPrima },
      data: { precioPorKilo: fallback }
    });
  }

  await recalcularFormulasPorMateriaPrima(idMateriaPrima);

  return { mensaje: 'Item eliminado exitosamente' };
}

/**
 * Eliminar una compra y revertir todos los cambios
 * Solo si no tiene items (validar antes)
 */
export async function eliminarCompra(idCompra: string) {
  // Obtener la compra con todos sus detalles
  const compra = await prisma.compraCabecera.findUnique({
    where: { id: idCompra },
    include: {
      comprasDetalle: true
    }
  });

  if (!compra) {
    throw new Error('Compra no encontrada');
  }

  // Validar que no tenga items
  if (compra.comprasDetalle.length > 0) {
    throw new Error('No se puede eliminar una compra que tiene items. Elimine primero todos los items.');
  }

  // Eliminar la compra (cascada eliminará los detalles si quedan)
  await prisma.compraCabecera.delete({
    where: { id: idCompra }
  });

  return { mensaje: 'Compra eliminada exitosamente' };
}
