/**
 * Servicio de Compras
 * Gestiona compras y actualización automática de precios
 */

import prisma from '../lib/prisma';
import { recalcularInventario } from './inventarioService';
import { recalcularFormulasPorMateriaPrima } from './formulaService';

interface CrearCompraParams {
  idGranja: string;
  idUsuario: string;
  idProveedor: string;
  numeroFactura?: string;
  fechaCompra: Date;
  observaciones?: string;
  detalles: Array<{
    idMateriaPrima: string;
    cantidadComprada: number;
    precioUnitario: number;
  }>;
}

/**
 * Registra una nueva compra y actualiza el sistema completo
 */
export async function crearCompra(params: CrearCompraParams) {
  const { idGranja, idUsuario, idProveedor, fechaCompra, observaciones, detalles } = params;

  // Calcular total de la factura
  const totalFactura = detalles.reduce(
    (suma, detalle) => suma + detalle.cantidadComprada * detalle.precioUnitario,
    0
  );

  // Crear la cabecera de compra
  const compra = await prisma.compraCabecera.create({
    data: {
      idGranja,
      idUsuario,
      idProveedor,
      fechaCompra,
      totalFactura,
      observaciones,
      comprasDetalle: {
        create: detalles.map(detalle => ({
          ...detalle,
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

    // 3. Actualizar precio de la materia prima
    await prisma.materiaPrima.update({
      where: { id: detalle.idMateriaPrima },
      data: {
        precioPorKilo: detalle.precioUnitario
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

    // 5. Recalcular inventario
    await recalcularInventario({
      idGranja,
      idMateriaPrima: detalle.idMateriaPrima
    });

    // 6. Recalcular todas las fórmulas que usan esta materia prima
    await recalcularFormulasPorMateriaPrima(detalle.idMateriaPrima);
  }

  return compra;
}

/**
 * Obtiene el historial de compras de una granja
 */
export async function obtenerComprasGranja(idGranja: string) {
  return await prisma.compraCabecera.findMany({
    where: { idGranja },
    include: {
      proveedor: {
        select: {
          codigoProveedor: true,
          nombreProveedor: true
        }
      },
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
      p.codigo_proveedor,
      p.nombre_proveedor,
      COALESCE(SUM(cc.total_factura), 0) as total_gastado,
      COUNT(cc.id) as cantidad_compras
    FROM t_proveedor p
    LEFT JOIN t_compra_cabecera cc ON p.id = cc.id_proveedor AND cc.id_granja = ${idGranja}
    WHERE p.id_granja = ${idGranja}
      AND p.activo = true
    GROUP BY p.id, p.codigo_proveedor, p.nombre_proveedor
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
 * Eliminar una compra y revertir todos los cambios
 * Esto revertirá: inventario, precios y fórmulas
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

  // Por cada materia prima en la compra:
  for (const detalle of compra.comprasDetalle) {
    // 1. Eliminar el registro de precio (si existe)
    await prisma.registroPrecio.deleteMany({
      where: { 
        idMateriaPrima: detalle.idMateriaPrima,
        motivo: {
          contains: `Factura ${compra.numeroFactura || 'N/A'}`
        }
      }
    });

    // 2. Restaurar el precio anterior de la materia prima
    // Si había un precio anterior registrado, restaurarlo
    const ultimoRegistro = await prisma.registroPrecio.findFirst({
      where: { idMateriaPrima: detalle.idMateriaPrima },
      orderBy: { fechaCambio: 'desc' }
    });

    if (ultimoRegistro) {
      await prisma.materiaPrima.update({
        where: { id: detalle.idMateriaPrima },
        data: { precioPorKilo: ultimoRegistro.precioAnterior }
      });
    } else {
      // Si no hay registro previo, establecer precio a 0 o dejar el actual
      // (dependiendo de la lógica de negocio)
    }

    // 3. Recalcular inventario
    await recalcularInventario({
      idGranja: compra.idGranja,
      idMateriaPrima: detalle.idMateriaPrima
    });

    // 4. Recalcular todas las fórmulas que usan esta materia prima
    await recalcularFormulasPorMateriaPrima(detalle.idMateriaPrima);
  }

  // 5. Eliminar la compra (cascada eliminará los detalles)
  await prisma.compraCabecera.delete({
    where: { id: idCompra }
  });

  return { mensaje: 'Compra eliminada exitosamente' };
}



