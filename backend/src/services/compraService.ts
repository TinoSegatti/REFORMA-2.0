/**
 * Servicio de Compras
 * Gestiona compras y actualización automática de precios
 */

import prisma from '../lib/prisma';
import { recalcularInventario, sincronizarCantidadRealConSistema } from './inventarioService';
import { recalcularFormulasPorMateriaPrima } from './formulaService';
import { registrarAuditoria } from './auditoriaService';
import { TablaOrigen } from '@prisma/client';

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
    incluirEliminadas?: boolean;
  }
) {
  const where: any = { 
    idGranja,
    // Por defecto, solo mostrar compras activas
    activo: filters?.incluirEliminadas ? undefined : true,
  };

  // Construir filtro de fechas correctamente
  // Nota: Los inputs de fecha vienen como YYYY-MM-DD y debemos considerar todo el día
  if (filters?.desde || filters?.hasta) {
    where.fechaCompra = {};
    if (filters?.desde) {
      // Establecer inicio del día (00:00:00) en UTC para incluir todo el día
      // Si viene como "YYYY-MM-DD", crear fecha en UTC para evitar problemas de zona horaria
      const desdeStr = filters.desde.includes('T') ? filters.desde : `${filters.desde}T00:00:00.000Z`;
      const desdeDate = new Date(desdeStr);
      console.log('[DEBUG] Filtro desde:', filters.desde, '→', desdeDate.toISOString());
      where.fechaCompra.gte = desdeDate;
    }
    if (filters?.hasta) {
      // Establecer fin del día (23:59:59) en UTC para incluir todo el día
      // Si viene como "YYYY-MM-DD", crear fecha fin del día en UTC
      const hastaStr = filters.hasta.includes('T') ? filters.hasta : `${filters.hasta}T23:59:59.999Z`;
      const hastaDate = new Date(hastaStr);
      console.log('[DEBUG] Filtro hasta:', filters.hasta, '→', hastaDate.toISOString());
      where.fechaCompra.lte = hastaDate;
    }
    console.log('[DEBUG] where.fechaCompra completo:', {
      gte: where.fechaCompra.gte ? where.fechaCompra.gte.toISOString() : undefined,
      lte: where.fechaCompra.lte ? where.fechaCompra.lte.toISOString() : undefined
    });
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

  // Debug: mostrar where de forma legible
  const whereDebug: any = { ...where };
  if (whereDebug.fechaCompra) {
    whereDebug.fechaCompra = {
      gte: whereDebug.fechaCompra.gte?.toISOString(),
      lte: whereDebug.fechaCompra.lte?.toISOString()
    };
  }
  console.log('[DEBUG] Query where completo:', JSON.stringify(whereDebug, null, 2));
  
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
          id: true,
          cantidadComprada: true,
          precioUnitario: true,
          subtotal: true,
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
  
  console.log('[DEBUG] Compras encontradas:', compras.length);
  if (compras.length > 0 && where.fechaCompra) {
    console.log('[DEBUG] Ejemplo de fecha de compra encontrada:', compras[0].fechaCompra.toISOString());
  }

  // Filtrar por materia prima en detalle (post-query)
  // Nota: Para este filtro necesitamos los detalles completos, así que hacemos una consulta adicional
  if (filters?.materiaPrima) {
    // Asegurar que el filtro de activo se aplique también aquí
    const whereConActivo = {
      ...where,
      activo: filters?.incluirEliminadas ? undefined : true,
    };
    
    const comprasConDetalles = await prisma.compraCabecera.findMany({
      where: whereConActivo,
      include: {
        proveedor: {
          select: {
            codigoProveedor: true,
            nombreProveedor: true
          }
        },
        comprasDetalle: {
          select: {
            id: true,
            cantidadComprada: true,
            precioUnitario: true,
            subtotal: true,
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

    return comprasFiltradas;
  }

  return compras;
}

/**
 * Obtiene estadísticas de compras
 */
export async function obtenerEstadisticasCompras(idGranja: string) {
  // Cantidad total comprada por materia prima (suma de todas las cantidades compradas)
  const cantidadPorMateria = await prisma.$queryRaw<Array<{
    codigo: string;
    nombre: string;
    cantidad_total: unknown;
    veces_comprada: unknown;
  }>>`
    SELECT
      mp."codigoMateriaPrima" as codigo,
      mp."nombreMateriaPrima" as nombre,
      COALESCE(SUM(cd."cantidadComprada"), 0) as cantidad_total,
      COUNT(DISTINCT cd.id) as veces_comprada
    FROM t_compra_detalle cd
    INNER JOIN t_compra_cabecera cc ON cd."idCompra" = cc.id
    INNER JOIN t_materia_prima mp ON cd."idMateriaPrima" = mp.id
    WHERE cc."idGranja" = ${idGranja}
      AND cc."activo" = true
    GROUP BY mp.id, mp."codigoMateriaPrima", mp."nombreMateriaPrima"
    ORDER BY cantidad_total DESC
    LIMIT 10
  `;

  const totalCompras = await prisma.compraCabecera.count({
    where: { 
      idGranja,
      activo: true
    }
  });

  return {
    frecuenciaPorMateria: cantidadPorMateria.map(item => ({
      codigo: item.codigo,
      nombre: item.nombre,
      vecesComprada: Number(item.veces_comprada || 0),
      cantidadTotal: Number(item.cantidad_total || 0)
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
      compra: { 
        idGranja,
        activo: true
      }
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

  // Validar que no haya fabricaciones que usen esta materia prima
  const fabricacionesCount = await prisma.detalleFabricacion.count({
    where: {
      idMateriaPrima: detalle.idMateriaPrima,
      fabricacion: {
        idGranja: detalle.compra.idGranja
      }
    }
  });

  if (fabricacionesCount > 0) {
    throw new Error('No se puede eliminar este item de compra porque hay fabricaciones que utilizan esta materia prima. Elimine primero todas las fabricaciones relacionadas.');
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
 * Eliminar una compra (soft delete)
 * Solo si no tiene items (validar antes)
 */
export async function eliminarCompra(idCompra: string, idUsuario: string) {
  // Obtener la compra con todos sus detalles
  const compra = await prisma.compraCabecera.findUnique({
    where: { id: idCompra },
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
    }
  });

  if (!compra) {
    throw new Error('Compra no encontrada');
  }

  // Validar que no tenga items
  if (compra.comprasDetalle.length > 0) {
    throw new Error('No se puede eliminar una compra que tiene items. Elimine primero todos los items.');
  }

  // Validar que no haya fabricaciones activas en la granja (aunque no haya items, verificar por seguridad)
  const fabricacionesCount = await prisma.fabricacion.count({
    where: { 
      idGranja: compra.idGranja,
      activo: true
    }
  });

  if (fabricacionesCount > 0) {
    throw new Error('No se puede eliminar esta compra porque existen fabricaciones registradas en la granja. Elimine primero todas las fabricaciones.');
  }

  // Soft delete: marcar como inactiva en lugar de eliminar
  await prisma.compraCabecera.update({
    where: { id: idCompra },
    data: {
      activo: false,
      fechaEliminacion: new Date(),
      eliminadoPor: idUsuario,
    },
  });

  // Registrar en auditoría
  await registrarAuditoria({
    idUsuario,
    idGranja: compra.idGranja,
    tablaOrigen: TablaOrigen.COMPRA,
    idRegistro: idCompra,
    accion: 'DELETE',
    descripcion: `Compra eliminada: Factura ${compra.numeroFactura || 'N/A'}`,
    datosAnteriores: compra,
  });

  return { mensaje: 'Compra eliminada exitosamente' };
}

/**
 * Eliminar TODAS las compras de una granja (soft delete)
 * Solo para administradores
 * Esta operación afectará el inventario
 */
export async function eliminarTodasLasCompras(idGranja: string, idUsuario: string) {
  // Obtener todas las compras activas de la granja
  const compras = await prisma.compraCabecera.findMany({
    where: { 
      idGranja,
      activo: true
    },
    include: {
      comprasDetalle: true
    }
  });

  // Verificar que todas las compras no tengan items
  const comprasConItems = compras.filter(c => c.comprasDetalle.length > 0);
  if (comprasConItems.length > 0) {
    throw new Error(`No se pueden eliminar todas las compras porque ${comprasConItems.length} compra(s) tienen items. Elimine primero todos los items.`);
  }

  // Verificar que no haya fabricaciones activas en la granja
  const fabricacionesCount = await prisma.fabricacion.count({
    where: { 
      idGranja,
      activo: true
    }
  });

  if (fabricacionesCount > 0) {
    throw new Error('No se pueden eliminar todas las compras porque existen fabricaciones registradas en la granja. Elimine primero todas las fabricaciones.');
  }
  // Obtener solo las materias primas que realmente tenían compras ANTES de eliminarlas
  // Esto es necesario porque después de marcar las compras como inactivas, no podemos
  // obtener sus detalles fácilmente desde compras activas
  const idsMateriasPrimasAfectadas = await prisma.$queryRaw<Array<{ idMateriaPrima: string }>>`
    SELECT DISTINCT cd."idMateriaPrima"
    FROM t_compra_detalle cd
    INNER JOIN t_compra_cabecera cc ON cd."idCompra" = cc.id
    WHERE cc."idGranja" = ${idGranja}
      AND cc."activo" = true
  `;
  // Soft delete: marcar todas las compras como inactivas
  const resultado = await prisma.compraCabecera.updateMany({
    where: { 
      idGranja,
      activo: true
    },
    data: {
      activo: false,
      fechaEliminacion: new Date(),
      eliminadoPor: idUsuario,
    },
  });
  // Registrar en auditoría
  await registrarAuditoria({
    idUsuario,
    idGranja,
    tablaOrigen: TablaOrigen.COMPRA,
    idRegistro: 'BULK',
    accion: 'BULK_DELETE',
    descripcion: `Eliminación masiva de ${resultado.count} compras`,
  });

  // Recalcular inventario solo para las materias primas que realmente tenían compras
  // Ejecutar en paralelo para evitar ciclo infinito y mejorar rendimiento
  if (idsMateriasPrimasAfectadas.length > 0) {
    await Promise.all(
      idsMateriasPrimasAfectadas.map((mp) =>
        recalcularInventario({ idGranja, idMateriaPrima: mp.idMateriaPrima })
      )
    );
  }

  return { 
    mensaje: 'Todas las compras eliminadas exitosamente',
    eliminadas: resultado.count
  };
}

/**
 * Restaurar una compra eliminada (soft restore)
 */
export async function restaurarCompra(idCompra: string, idUsuario: string) {
  // Verificar que la compra existe y está eliminada
  const compra = await prisma.compraCabecera.findUnique({
    where: { id: idCompra },
    include: {
      comprasDetalle: true
    }
  });

  if (!compra) {
    throw new Error('Compra no encontrada');
  }

  if (compra.activo) {
    throw new Error('La compra ya está activa');
  }

  // Restaurar la compra
  await prisma.compraCabecera.update({
    where: { id: idCompra },
    data: {
      activo: true,
      fechaEliminacion: null,
      eliminadoPor: null,
    },
  });

  // Recalcular inventario para todas las materias primas afectadas
  const materiasPrimasAfectadas = new Set<string>();
  for (const detalle of compra.comprasDetalle) {
    materiasPrimasAfectadas.add(detalle.idMateriaPrima);
  }

  for (const idMateriaPrima of materiasPrimasAfectadas) {
    await recalcularInventario({ idGranja: compra.idGranja, idMateriaPrima });
  }

  // Registrar en auditoría
  await registrarAuditoria({
    idUsuario,
    idGranja: compra.idGranja,
    tablaOrigen: TablaOrigen.COMPRA,
    idRegistro: idCompra,
    accion: 'RESTORE',
    descripcion: `Compra restaurada: Factura ${compra.numeroFactura || 'N/A'}`,
    datosNuevos: { activo: true },
  });

  return { mensaje: 'Compra restaurada exitosamente' };
}

/**
 * Obtener compras eliminadas de una granja
 */
export async function obtenerComprasEliminadas(idGranja: string) {
  return await prisma.compraCabecera.findMany({
    where: {
      idGranja,
      activo: false,
    },
    include: {
      proveedor: {
        select: {
          codigoProveedor: true,
          nombreProveedor: true,
        },
      },
      usuario: {
        select: {
          nombreUsuario: true,
          apellidoUsuario: true,
          email: true,
        },
      },
    },
    orderBy: {
      fechaEliminacion: 'desc',
    },
  });
}

/**
 * Eliminar todos los items de una compra
 */
/**
 * Obtiene compras con totales inconsistentes (suma de subtotales no coincide con totalFactura)
 */
export async function obtenerComprasConTotalesInconsistentes(idGranja: string) {
  // Obtener todas las compras activas con sus detalles
  const compras = await prisma.compraCabecera.findMany({
    where: {
      idGranja,
      activo: true
    },
    include: {
      proveedor: {
        select: {
          codigoProveedor: true,
          nombreProveedor: true
        }
      },
      comprasDetalle: {
        select: {
          id: true,
          subtotal: true
        }
      }
    },
    orderBy: {
      fechaCompra: 'desc'
    }
  });

  // Filtrar compras donde la suma de subtotales no coincide con totalFactura
  const comprasInconsistentes = compras.filter((compra) => {
    // Si no tiene detalles, no puede tener inconsistencia (o tiene total provisorio)
    if (!compra.comprasDetalle || compra.comprasDetalle.length === 0) {
      return false;
    }

    // Calcular suma de subtotales
    const sumaSubtotales = compra.comprasDetalle.reduce(
      (sum, detalle) => sum + Number(detalle.subtotal || 0),
      0
    );

    // Comparar con totalFactura (con tolerancia de 0.01 para redondeos)
    const diferencia = Math.abs(Number(compra.totalFactura || 0) - sumaSubtotales);
    return diferencia > 0.01; // Si la diferencia es mayor a 1 centavo, es inconsistente
  });

  // Retornar solo los campos necesarios para la card
  return comprasInconsistentes.map((compra) => ({
    id: compra.id,
    numeroFactura: compra.numeroFactura,
    fechaCompra: compra.fechaCompra,
    totalFactura: compra.totalFactura,
    sumaSubtotales: compra.comprasDetalle.reduce(
      (sum, detalle) => sum + Number(detalle.subtotal || 0),
      0
    ),
    diferencia: Math.abs(Number(compra.totalFactura || 0) - compra.comprasDetalle.reduce(
      (sum, detalle) => sum + Number(detalle.subtotal || 0),
      0
    )),
    proveedor: compra.proveedor
  }));
}

export async function eliminarTodosLosItemsCompra(idCompra: string) {
  // Obtener la compra con todos sus detalles
  const compra = await prisma.compraCabecera.findUnique({
    where: { id: idCompra },
    include: {
      comprasDetalle: {
        include: {
          materiaPrima: {
            select: {
              id: true,
              codigoMateriaPrima: true,
              nombreMateriaPrima: true
            }
          }
        }
      }
    }
  });

  if (!compra) {
    throw new Error('Compra no encontrada');
  }

  if (compra.comprasDetalle.length === 0) {
    return { mensaje: 'La compra no tiene items para eliminar' };
  }

  // Validar que no haya fabricaciones que usen las materias primas de esta compra
  const idsMateriasPrimas = compra.comprasDetalle.map(d => d.idMateriaPrima);
  const fabricacionesCount = await prisma.detalleFabricacion.count({
    where: {
      idMateriaPrima: { in: idsMateriasPrimas },
      fabricacion: {
        idGranja: compra.idGranja,
        activo: true
      }
    }
  });

  if (fabricacionesCount > 0) {
    throw new Error('No se pueden eliminar los items de esta compra porque hay fabricaciones que utilizan estas materias primas. Elimine primero todas las fabricaciones relacionadas.');
  }

  // Guardar datos antes de eliminar
  const idGranja = compra.idGranja;
  const materiasPrimasAfectadas = Array.from(new Set(idsMateriasPrimas));
  const cantidadItems = compra.comprasDetalle.length;

  // Eliminar todos los items
  await prisma.compraDetalle.deleteMany({
    where: { idCompra }
  });

  // Recalcular inventario para todas las materias primas afectadas en paralelo (optimización)
  await Promise.all(
    materiasPrimasAfectadas.map(async (idMateriaPrima) => {
      await recalcularInventario({ idGranja, idMateriaPrima });
      await sincronizarCantidadRealConSistema(idGranja, idMateriaPrima);
      
      // Obtener último precio e inventario inicial en paralelo para determinar precio a usar
      const [ultimoPrecio, ini] = await Promise.all([
        obtenerUltimoPrecio(idGranja, idMateriaPrima),
        prisma.inventarioInicial.findUnique({
          where: {
            idGranja_idMateriaPrima: {
              idGranja,
              idMateriaPrima
            }
          }
        })
      ]);

      // Ajustar precioPorKilo de la materia prima al último precio vigente (o a la base de inicialización si no quedan compras)
      const precioFinal = ultimoPrecio !== null ? ultimoPrecio : Number(ini?.precioInicial || 0);
      await prisma.materiaPrima.update({
        where: { id: idMateriaPrima },
        data: { precioPorKilo: precioFinal }
      });

      await recalcularFormulasPorMateriaPrima(idMateriaPrima);
    })
  );

  // NO actualizar totalFactura - es un dato de la cabecera que viene de la factura original
  // y no debe cambiar automáticamente al eliminar items. Solo debe cambiar si el usuario
  // edita manualmente la cabecera.

  return { 
    mensaje: cantidadItems + ' items eliminados exitosamente',
    itemsEliminados: cantidadItems
  };
}

