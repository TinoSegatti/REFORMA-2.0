/**
 * Controlador de Compras
 * Gestiona las compras de materias primas
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import {
  crearCompra,
  obtenerComprasGranja,
  obtenerEstadisticasCompras,
  obtenerGastoPorProveedor,
  obtenerHistorialPrecios,
  obtenerUltimoPrecio,
  agregarItemCompra,
  editarItemCompra,
  eliminarItemCompra,
  eliminarCompra,
  eliminarTodasLasCompras,
  restaurarCompra,
  obtenerComprasEliminadas
} from '../services/compraService';

interface CompraRequest extends Request {
  userId?: string;
}

/**
 * Registrar una nueva compra
 */
export async function registrarCompra(req: CompraRequest, res: Response) {
  try {
    const userId = req.userId;
    const idGranjaParam = (req.params as any)?.idGranja;
    const { idProveedor, numeroFactura, fechaCompra, totalFactura, observaciones, detalles } = req.body;
    const idGranja = idGranjaParam || req.body.idGranja;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!idGranja) {
      return res.status(400).json({ error: 'idGranja es requerido' });
    }

    // Verificar que la granja pertenece al usuario
    const granja = await prisma.granja.findFirst({
      where: { id: idGranja, idUsuario: userId }
    });

    if (!granja) {
      return res.status(404).json({ error: 'Granja no encontrada' });
    }

    const detallesArray = Array.isArray(detalles) ? detalles : [];

    // Validar detalles solo si existen
    for (const detalle of detallesArray) {
      if (!detalle.idMateriaPrima || !detalle.cantidadComprada || (!detalle.precioUnitario && !detalle.subtotal)) {
        return res.status(400).json({ error: 'Cada detalle debe tener materia prima, cantidad y precio unitario o subtotal' });
      }

      if (detalle.cantidadComprada <= 0) {
        return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
      }

      // Calcular precio unitario si viene subtotal
      if (detalle.subtotal && !detalle.precioUnitario) {
        detalle.precioUnitario = detalle.subtotal / detalle.cantidadComprada;
      }

      if (detalle.precioUnitario < 0) {
        return res.status(400).json({ error: 'El precio unitario debe ser válido' });
      }
    }

    // Validar total solo si hay detalles (si no hay, permitimos total provisorio)
    if (detallesArray.length > 0) {
      const totalCalculado = detallesArray.reduce((sum, d) => {
        const subtotal = d.subtotal || (d.cantidadComprada * d.precioUnitario);
        return sum + subtotal;
      }, 0);

      if (totalFactura && Math.abs(totalFactura - totalCalculado) > 0.001) {
        return res.status(400).json({ error: `El total de la factura (${totalFactura}) no coincide con la suma de subtotales (${totalCalculado.toFixed(2)})` });
      }
    }

    // Crear la compra
    const compra = await crearCompra({
      idGranja,
      idUsuario: userId,
      idProveedor,
      numeroFactura,
      fechaCompra: new Date(fechaCompra),
      observaciones,
      totalFactura: Array.isArray(detalles) && detalles.length === 0 ? (typeof totalFactura === 'number' ? totalFactura : 0) : undefined,
      detalles: detallesArray.map((d: any) => ({
        idMateriaPrima: d.idMateriaPrima,
        cantidadComprada: d.cantidadComprada,
        precioUnitario: d.precioUnitario || (d.subtotal! / d.cantidadComprada),
        subtotal: d.subtotal
      }))
    });

    res.status(201).json(compra);
  } catch (error: any) {
    console.error('Error registrando compra:', error);
    res.status(500).json({ error: 'Error al registrar compra', detalle: error.message });
  }
}

/**
 * Obtener historial de compras de una granja con filtros
 */
export async function obtenerCompras(req: CompraRequest, res: Response) {
  try {
    const userId = req.userId;
    const idGranjaParam = (req.params as any)?.idGranja;
    const idGranja = idGranjaParam || req.body.idGranja;
    const { desde, hasta, materiaPrima, proveedor, numeroFactura } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!idGranja) {
      return res.status(400).json({ error: 'idGranja es requerido' });
    }

    // Verificar que la granja pertenece al usuario
    const granja = await prisma.granja.findFirst({
      where: { id: idGranja, idUsuario: userId }
    });

    if (!granja) {
      return res.status(404).json({ error: 'Granja no encontrada' });
    }

    const compras = await obtenerComprasGranja(idGranja, {
      desde: desde as string,
      hasta: hasta as string,
      materiaPrima: materiaPrima as string,
      proveedor: proveedor as string,
      numeroFactura: numeroFactura as string
    });

    res.json(compras);
  } catch (error: any) {
    console.error('Error obteniendo compras:', error);
    res.status(500).json({ error: 'Error al obtener compras' });
  }
}

/**
 * Obtener estadísticas de compras
 */
export async function obtenerEstadisticas(req: CompraRequest, res: Response) {
  try {
    const userId = req.userId;
    const idGranjaParam = (req.params as any)?.idGranja;
    const idGranja = idGranjaParam || req.body.idGranja;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!idGranja) {
      return res.status(400).json({ error: 'idGranja es requerido' });
    }

    const granja = await prisma.granja.findFirst({
      where: { id: idGranja, idUsuario: userId }
    });

    if (!granja) {
      return res.status(404).json({ error: 'Granja no encontrada' });
    }

    const stats = await obtenerEstadisticasCompras(idGranja);
    res.json(stats);
  } catch (error: any) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
}

/**
 * Obtener gasto total por proveedor
 */
export async function obtenerGastosPorProveedor(req: CompraRequest, res: Response) {
  try {
    const userId = req.userId;
    const idGranjaParam = (req.params as any)?.idGranja;
    const idGranja = idGranjaParam || req.body.idGranja;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!idGranja) {
      return res.status(400).json({ error: 'idGranja es requerido' });
    }

    const granja = await prisma.granja.findFirst({
      where: { id: idGranja, idUsuario: userId }
    });

    if (!granja) {
      return res.status(404).json({ error: 'Granja no encontrada' });
    }

    const gastos = await obtenerGastoPorProveedor(idGranja);
    res.json(gastos);
  } catch (error: any) {
    console.error('Error obteniendo gastos por proveedor:', error);
    res.status(500).json({ error: 'Error al obtener gastos por proveedor' });
  }
}

/**
 * Obtener historial de cambios de precio de una materia prima
 */
export async function obtenerHistorialPreciosMateriaPrima(req: CompraRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idMateriaPrima } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const materiaPrima = await prisma.materiaPrima.findFirst({
      where: { id: idMateriaPrima },
      include: {
        granja: {
          select: { idUsuario: true }
        }
      }
    });

    if (!materiaPrima || materiaPrima.granja.idUsuario !== userId) {
      return res.status(404).json({ error: 'Materia prima no encontrada' });
    }

    const historial = await obtenerHistorialPrecios(idMateriaPrima);
    res.json(historial);
  } catch (error: any) {
    console.error('Error obteniendo historial de precios:', error);
    res.status(500).json({ error: 'Error al obtener historial de precios' });
  }
}

/**
 * Obtener último precio comprado de una materia prima
 */
export async function obtenerUltimoPrecioMateriaPrima(req: CompraRequest, res: Response) {
  try {
    const userId = req.userId;
    const idGranjaParam = (req.params as any)?.idGranja;
    const idGranja = idGranjaParam || req.body.idGranja;
    const { idMateriaPrima } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!idGranja) {
      return res.status(400).json({ error: 'idGranja es requerido' });
    }

    const granja = await prisma.granja.findFirst({
      where: { id: idGranja, idUsuario: userId }
    });

    if (!granja) {
      return res.status(404).json({ error: 'Granja no encontrada' });
    }

    const ultimoPrecio = await obtenerUltimoPrecio(idGranja, idMateriaPrima);
    res.json({ ultimoPrecio });
  } catch (error: any) {
    console.error('Error obteniendo último precio:', error);
    res.status(500).json({ error: 'Error al obtener último precio' });
  }
}

/**
 * Obtener una compra por ID con todos sus detalles
 */
export async function obtenerCompraPorId(req: CompraRequest, res: Response) {
  try {
    const userId = req.userId;
    const idGranjaParam = (req.params as any)?.idGranja;
    const idGranja = idGranjaParam || req.body.idGranja;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!idGranja) {
      return res.status(400).json({ error: 'idGranja es requerido' });
    }

    const granja = await prisma.granja.findFirst({
      where: { id: idGranja, idUsuario: userId }
    });

    if (!granja) {
      return res.status(404).json({ error: 'Granja no encontrada' });
    }

    const compra = await prisma.compraCabecera.findUnique({
      where: { id },
      include: {
        proveedor: true,
        comprasDetalle: {
          include: {
            materiaPrima: true
          },
          orderBy: {
            materiaPrima: {
              codigoMateriaPrima: 'asc'
            }
          }
        }
      }
    });

    if (!compra || compra.idGranja !== idGranja) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    res.json(compra);
  } catch (error: any) {
    console.error('Error obteniendo compra:', error);
    res.status(500).json({ error: 'Error al obtener compra' });
  }
}

/**
 * Agregar item a una compra existente
 */
export async function agregarItem(req: CompraRequest, res: Response) {
  try {
    const userId = req.userId;
    const idGranjaParam = (req.params as any)?.idGranja;
    const idGranja = idGranjaParam || req.body.idGranja;
    const { id } = req.params;
    const { idMateriaPrima, cantidadComprada, precioUnitario, subtotal } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!idGranja) {
      return res.status(400).json({ error: 'idGranja es requerido' });
    }

    // Validar campos
    if (!idMateriaPrima || !cantidadComprada || (!precioUnitario && !subtotal)) {
      return res.status(400).json({ error: 'Campos requeridos: idMateriaPrima, cantidadComprada, y (precioUnitario o subtotal)' });
    }

    const precioFinal = precioUnitario || (subtotal / cantidadComprada);

    // Verificar que la compra pertenece a la granja del usuario
    const compra = await prisma.compraCabecera.findUnique({
      where: { id },
      include: { granja: true }
    });

    if (!compra || compra.idGranja !== idGranja || compra.granja.idUsuario !== userId) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    const nuevoItem = await agregarItemCompra(id, idMateriaPrima, cantidadComprada, precioFinal);

    res.status(201).json(nuevoItem);
  } catch (error: any) {
    console.error('Error agregando item:', error);
    res.status(500).json({ error: 'Error al agregar item', detalle: error.message });
  }
}

/**
 * Agregar múltiples items de compra en un solo insert
 */
export async function agregarMultiplesItems(req: CompraRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja, id } = req.params;
    const { items } = req.body; // Array de { idMateriaPrima, cantidadComprada, precioUnitario, subtotal? }

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de items' });
    }

    // Verificar que la compra pertenece al usuario
    const compra = await prisma.compraCabecera.findUnique({
      where: { id },
      include: { granja: true }
    });

    if (!compra || compra.idGranja !== idGranja || compra.granja.idUsuario !== userId) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    // Validar que no haya duplicados en el array de items
    const idsMateriasPrimas = items.map((item: any) => item.idMateriaPrima);
    const idsUnicos = new Set(idsMateriasPrimas);
    if (idsUnicos.size !== idsMateriasPrimas.length) {
      return res.status(400).json({ error: 'No se pueden agregar materias primas duplicadas en el mismo lote' });
    }

    // Verificar que no existan ya estos items
    const itemsExistentes = await prisma.compraDetalle.findMany({
      where: {
        idCompra: id,
        idMateriaPrima: { in: idsMateriasPrimas }
      },
      include: {
        materiaPrima: true
      }
    });

    if (itemsExistentes.length > 0) {
      const mpDuplicadas = itemsExistentes.map(d => d.materiaPrima.codigoMateriaPrima);
      return res.status(400).json({ 
        error: `Las siguientes materias primas ya están en la compra: ${mpDuplicadas.join(', ')}` 
      });
    }

    // Procesar todos los items
    const itemsProcesados = await Promise.all(
      items.map(async (item: any) => {
        const cantidadComprada = parseFloat(item.cantidadComprada);
        const precioUnitario = parseFloat(item.precioUnitario);
        const subtotalCalculado = cantidadComprada * precioUnitario;

        // Validar subtotal si viene
        if (item.subtotal !== undefined) {
          const subtotalRecibido = parseFloat(item.subtotal);
          if (Math.abs(subtotalCalculado - subtotalRecibido) > 0.001) {
            throw new Error(`El subtotal del item no coincide: esperado ${subtotalCalculado.toFixed(2)}, recibido ${subtotalRecibido.toFixed(2)}`);
          }
        }

        // Obtener materia prima y precio anterior
        const materiaPrima = await prisma.materiaPrima.findUnique({
          where: { id: item.idMateriaPrima }
        });

        if (!materiaPrima) {
          throw new Error(`Materia prima ${item.idMateriaPrima} no encontrada`);
        }

        const precioAnterior = materiaPrima.precioPorKilo || 0;

        return {
          idCompra: id,
          idMateriaPrima: item.idMateriaPrima,
          cantidadComprada,
          precioUnitario,
          subtotal: subtotalCalculado,
          precioAnteriorMateriaPrima: precioAnterior
        };
      })
    );

    // Crear todos los items en una transacción
    await prisma.$transaction(async (tx) => {
      // Crear items
      await tx.compraDetalle.createMany({
        data: itemsProcesados
      });

      // Actualizar precios de materias primas
      for (const item of itemsProcesados) {
        await tx.materiaPrima.update({
          where: { id: item.idMateriaPrima },
          data: { precioPorKilo: item.precioUnitario }
        });

        // Registrar historial de precio si cambió
        if (item.precioAnteriorMateriaPrima !== item.precioUnitario) {
          const diferenciaPorcentual = item.precioAnteriorMateriaPrima > 0
            ? ((item.precioUnitario - item.precioAnteriorMateriaPrima) / item.precioAnteriorMateriaPrima) * 100
            : 0;
          await tx.registroPrecio.create({
            data: {
              idMateriaPrima: item.idMateriaPrima,
              precioAnterior: item.precioAnteriorMateriaPrima,
              precioNuevo: item.precioUnitario,
              diferenciaPorcentual,
              motivo: `Actualización por compra - Agregar múltiples items en compra ${id}`
            }
          });
        }
      }
    });

    // Recalcular inventario para todas las materias primas afectadas
    const materiasPrimasAfectadas = new Set(itemsProcesados.map(i => i.idMateriaPrima));
    for (const idMateriaPrima of materiasPrimasAfectadas) {
      const { recalcularInventario, sincronizarCantidadRealConSistema } = await import('../services/inventarioService');
      await recalcularInventario({ idGranja, idMateriaPrima });
      await sincronizarCantidadRealConSistema(idGranja, idMateriaPrima);
      
      const { recalcularFormulasPorMateriaPrima } = await import('../services/formulaService');
      await recalcularFormulasPorMateriaPrima(idMateriaPrima);
    }

    // Actualizar total de la compra
    const todosLosItems = await prisma.compraDetalle.findMany({
      where: { idCompra: id }
    });

    const nuevoTotal = todosLosItems.reduce((sum, item) => sum + item.subtotal, 0);

    await prisma.compraCabecera.update({
      where: { id },
      data: { totalFactura: nuevoTotal }
    });

    res.status(201).json({ 
      mensaje: `${items.length} items agregados exitosamente`,
      agregados: items.length,
      nuevoTotal
    });
  } catch (error: any) {
    console.error('Error agregando múltiples items:', error);
    res.status(500).json({ error: error.message || 'Error al agregar items' });
  }
}

/**
 * Editar un item de compra
 */
export async function editarItem(req: CompraRequest, res: Response) {
  try {
    const userId = req.userId;
    const idGranjaParam = (req.params as any)?.idGranja;
    const idGranja = idGranjaParam || req.body.idGranja;
    const { id, detalleId } = req.params;
    const { cantidadComprada, precioUnitario, subtotal } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!idGranja) {
      return res.status(400).json({ error: 'idGranja es requerido' });
    }

    if (!cantidadComprada || (!precioUnitario && !subtotal)) {
      return res.status(400).json({ error: 'Campos requeridos: cantidadComprada y (precioUnitario o subtotal)' });
    }

    const precioFinal = precioUnitario || (subtotal / cantidadComprada);

    // Verificar que la compra pertenece a la granja del usuario
    const compra = await prisma.compraCabecera.findUnique({
      where: { id },
      include: { granja: true }
    });

    if (!compra || compra.idGranja !== idGranja || compra.granja.idUsuario !== userId) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    const itemActualizado = await editarItemCompra(detalleId, cantidadComprada, precioFinal);

    res.json(itemActualizado);
  } catch (error: any) {
    console.error('Error editando item:', error);
    res.status(500).json({ error: 'Error al editar item', detalle: error.message });
  }
}

/**
 * Eliminar un item de compra
 */
export async function eliminarItem(req: CompraRequest, res: Response) {
  try {
    const userId = req.userId;
    const idGranjaParam = (req.params as any)?.idGranja;
    const idGranja = idGranjaParam || req.body.idGranja;
    const { id, detalleId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!idGranja) {
      return res.status(400).json({ error: 'idGranja es requerido' });
    }

    // Verificar que la compra pertenece a la granja del usuario
    const compra = await prisma.compraCabecera.findUnique({
      where: { id },
      include: { granja: true }
    });

    if (!compra || compra.idGranja !== idGranja || compra.granja.idUsuario !== userId) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    const resultado = await eliminarItemCompra(detalleId);

    res.json(resultado);
  } catch (error: any) {
    console.error('Error eliminando item:', error);
    res.status(500).json({ error: 'Error al eliminar item', detalle: error.message });
  }
}

/**
 * Eliminar una compra (solo si no tiene items)
 */
export async function eliminarCompraEndpoint(req: CompraRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja, id } = req.params; // la ruta define ':id'
    const idCompra = id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!idCompra) {
      return res.status(400).json({ error: 'ID de compra inválido' });
    }

    // Verificar que la compra pertenece a una granja del usuario
    const compra = await prisma.compraCabecera.findUnique({
      where: { id: idCompra },
      include: {
        granja: {
          select: { idUsuario: true }
        },
        comprasDetalle: true
      }
    });

    if (!compra) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    if (compra.granja.idUsuario !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta compra' });
    }

    if (idGranja && compra.idGranja !== idGranja) {
      return res.status(403).json({ error: 'La compra no pertenece a esta granja' });
    }

    if (compra.comprasDetalle.length > 0) {
      return res.status(400).json({ error: 'No se puede eliminar una compra que tiene items. Elimine primero todos los items.' });
    }

    const resultado = await eliminarCompra(idCompra, userId);

    res.json(resultado);
  } catch (error: any) {
    console.error('Error eliminando compra:', error);
    res.status(500).json({ error: 'Error al eliminar compra', detalle: error.message });
  }
}

/**
 * Editar cabecera de compra (solo campos de cabecera, no items)
 */
export async function editarCabeceraCompra(req: CompraRequest, res: Response) {
  try {
    const userId = req.userId;
    const idGranjaParam = (req.params as any)?.idGranja;
    const idGranja = idGranjaParam || req.body.idGranja;
    const { id } = req.params;
    const { numeroFactura, fechaCompra, observaciones, idProveedor } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!idGranja) {
      return res.status(400).json({ error: 'idGranja es requerido' });
    }

    // Verificar que la compra pertenece a la granja del usuario
    const compra = await prisma.compraCabecera.findUnique({
      where: { id },
      include: { granja: true }
    });

    if (!compra || compra.idGranja !== idGranja || compra.granja.idUsuario !== userId) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    const compraActualizada = await prisma.compraCabecera.update({
      where: { id },
      data: {
        numeroFactura,
        fechaCompra: fechaCompra ? new Date(fechaCompra) : undefined,
        observaciones,
        idProveedor
      },
      include: {
        proveedor: true,
        comprasDetalle: {
          include: {
            materiaPrima: true
          }
        }
      }
    });

    res.json(compraActualizada);
  } catch (error: any) {
    console.error('Error editando cabecera:', error);
    res.status(500).json({ error: 'Error al editar cabecera de compra', detalle: error.message });
  }
}

/**
 * Eliminar TODAS las compras de una granja
 * Solo para administradores
 */
export async function eliminarTodasLasComprasCtrl(req: CompraRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;
    const { confirmacion } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar que el usuario es administrador
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { tipoUsuario: true }
    });

    if (!usuario || usuario.tipoUsuario !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador para eliminar todas las compras.' });
    }

    // Verificar que la granja pertenece al usuario
    const granja = await prisma.granja.findFirst({
      where: { id: idGranja, idUsuario: userId }
    });

    if (!granja) {
      return res.status(404).json({ error: 'Granja no encontrada' });
    }

    // Verificar confirmación
    if (confirmacion !== 'SI DESEO ELIMINAR TODAS LAS COMPRAS REGISTRADAS') {
      return res.status(400).json({ error: 'Confirmación incorrecta. Debe escribir exactamente: "SI DESEO ELIMINAR TODAS LAS COMPRAS REGISTRADAS"' });
    }

    const resultado = await eliminarTodasLasCompras(idGranja, userId);

    res.json(resultado);
  } catch (error: any) {
    console.error('Error eliminando todas las compras:', error);
    res.status(500).json({ error: error.message || 'Error al eliminar todas las compras' });
  }
}

/**
 * Restaurar una compra eliminada
 */
export async function restaurarCompraCtrl(req: CompraRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja, id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar que la compra pertenece a una granja del usuario
    const compra = await prisma.compraCabecera.findUnique({
      where: { id },
      include: {
        granja: {
          select: { idUsuario: true }
        }
      }
    });

    if (!compra) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    if (compra.granja.idUsuario !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para restaurar esta compra' });
    }

    const resultado = await restaurarCompra(id, userId);

    res.json(resultado);
  } catch (error: any) {
    console.error('Error restaurando compra:', error);
    res.status(500).json({ error: error.message || 'Error al restaurar compra' });
  }
}

/**
 * Obtener compras eliminadas de una granja
 */
export async function obtenerComprasEliminadasCtrl(req: CompraRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar que la granja pertenece al usuario
    const granja = await prisma.granja.findFirst({
      where: { id: idGranja, idUsuario: userId }
    });

    if (!granja) {
      return res.status(404).json({ error: 'Granja no encontrada' });
    }

    const comprasEliminadas = await obtenerComprasEliminadas(idGranja);

    res.json(comprasEliminadas);
  } catch (error: any) {
    console.error('Error obteniendo compras eliminadas:', error);
    res.status(500).json({ error: 'Error al obtener compras eliminadas' });
  }
}
