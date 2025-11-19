/**
 * Controlador de Fabricaciones
 * Gestiona las fabricaciones y sus detalles
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { crearFabricacion, obtenerFabricacionesGranja, obtenerFabricacion, eliminarFabricacion, editarFabricacion, obtenerEstadisticasFabricaciones, eliminarTodasLasFabricaciones, obtenerFabricacionesEliminadas, verificarExistenciasFabricacion } from '../services/fabricacionService';
import { buildCsv } from '../utils/csvUtils';
import { validarAccesoGranjaPorId } from '../middleware/validarAccesoGranja';

interface FabricacionRequest extends Request {
  userId?: string;
}

/**
 * Obtener todas las fabricaciones de una granja
 */
export async function obtenerFabricaciones(req: FabricacionRequest, res: Response) {
  try {
    const { idGranja } = req.params;
    const { desde, hasta, descripcionFormula } = req.query;

    // El middleware validarAccesoGranja ya validó el acceso
    const filters = {
      desde: desde as string | undefined,
      hasta: hasta as string | undefined,
      descripcionFormula: descripcionFormula as string | undefined
    };

    const fabricaciones = await obtenerFabricacionesGranja(idGranja, filters);

    res.json(fabricaciones);
  } catch (error: any) {
    console.error('Error obteniendo fabricaciones:', error);
    res.status(500).json({ error: 'Error al obtener fabricaciones' });
  }
}

/**
 * Crear una nueva fabricación
 */
export async function crearNuevaFabricacion(req: FabricacionRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja, idFormula, descripcionFabricacion, cantidadFabricacion, fechaFabricacion, observaciones } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!idGranja || !idFormula || !cantidadFabricacion || !descripcionFabricacion) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    if (cantidadFabricacion <= 0) {
      return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
    }

    // El middleware validarAccesoGranja ya validó el acceso (busca idGranja en el body)

    // Crear la fabricación
    const fabricacion = await crearFabricacion({
      idGranja,
      idUsuario: userId,
      idFormula,
      descripcionFabricacion,
      cantidadFabricacion,
      fechaFabricacion: new Date(fechaFabricacion),
      observaciones
    });

    res.status(201).json(fabricacion);
  } catch (error: any) {
    console.error('Error creando fabricación:', error);
    res.status(500).json({ error: 'Error al crear fabricación', detalle: error.message });
  }
}

/**
 * Obtener una fabricación específica con sus detalles
 */
export async function obtenerFabricacionDetalle(req: FabricacionRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idFabricacion } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const fabricacion = await obtenerFabricacion(idFabricacion);

    if (!fabricacion) {
      return res.status(404).json({ error: 'Fabricación no encontrada' });
    }

    // Validar acceso a la granja de la fabricación
    const validacion = await validarAccesoGranjaPorId(userId!, fabricacion.idGranja);
    if (!validacion.tieneAcceso) {
      return res.status(403).json({ error: validacion.error || 'Acceso denegado' });
    }

    res.json(fabricacion);
  } catch (error: any) {
    console.error('Error obteniendo fabricación:', error);
    res.status(500).json({ error: 'Error al obtener fabricación' });
  }
}

/**
 * Editar una fabricación
 */
export async function editarFabricacionCtrl(req: FabricacionRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idFabricacion } = req.params;
    const { idFormula, descripcionFabricacion, cantidadFabricacion, fechaFabricacion, observaciones } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar que la fabricación existe
    const fabricacionActual = await prisma.fabricacion.findUnique({
      where: { id: idFabricacion },
      select: {
        idGranja: true
      }
    });

    if (!fabricacionActual) {
      return res.status(404).json({ error: 'Fabricación no encontrada' });
    }

    // Validar acceso a la granja de la fabricación
    const validacion = await validarAccesoGranjaPorId(userId!, fabricacionActual.idGranja);
    if (!validacion.tieneAcceso) {
      return res.status(403).json({ error: validacion.error || 'Acceso denegado' });
    }

    // Validar cantidad
    if (cantidadFabricacion !== undefined && cantidadFabricacion <= 0) {
      return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
    }

    // Editar fabricación
    const fabricacion = await editarFabricacion(idFabricacion, {
      idFormula,
      descripcionFabricacion,
      cantidadFabricacion,
      fechaFabricacion: fechaFabricacion ? new Date(fechaFabricacion) : undefined,
      observaciones
    });

    res.json(fabricacion);
  } catch (error: any) {
    console.error('Error editando fabricación:', error);
    res.status(500).json({ error: 'Error al editar fabricación', detalle: error.message });
  }
}

/**
 * Eliminar una fabricación
 */
export async function eliminarFabricacionCtrl(req: FabricacionRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idFabricacion } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar que la fabricación pertenece al usuario
    const fabricacion = await prisma.fabricacion.findUnique({
      where: { id: idFabricacion },
      include: {
        granja: {
          select: {
            idUsuario: true
          }
        }
      }
    });

    if (!fabricacion) {
      return res.status(404).json({ error: 'Fabricación no encontrada' });
    }

    if (fabricacion.granja.idUsuario !== userId) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // Eliminar fabricación (revierte inventario automáticamente)
    const resultado = await eliminarFabricacion(idFabricacion, userId);

    res.json(resultado);
  } catch (error: any) {
    console.error('Error eliminando fabricación:', error);
    res.status(500).json({ error: 'Error al eliminar fabricación' });
  }
}

/**
 * Obtener estadísticas de fabricaciones
 */
export async function obtenerEstadisticas(req: FabricacionRequest, res: Response) {
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

    const estadisticas = await obtenerEstadisticasFabricaciones(idGranja);

    res.json(estadisticas);
  } catch (error: any) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
}

/**
 * Eliminar TODAS las fabricaciones de una granja
 * Solo para administradores
 */
export async function eliminarTodasLasFabricacionesCtrl(req: FabricacionRequest, res: Response) {
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
      return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador para eliminar todas las fabricaciones.' });
    }

    // Verificar que la granja pertenece al usuario
    const granja = await prisma.granja.findFirst({
      where: { id: idGranja, idUsuario: userId }
    });

    if (!granja) {
      return res.status(404).json({ error: 'Granja no encontrada' });
    }

    // Verificar confirmación
    if (confirmacion !== 'SI DESEO ELIMINAR TODAS LAS FABRICACIONES REGISTRADAS') {
      return res.status(400).json({ error: 'Confirmación incorrecta. Debe escribir exactamente: "SI DESEO ELIMINAR TODAS LAS FABRICACIONES REGISTRADAS"' });
    }

    const resultado = await eliminarTodasLasFabricaciones(idGranja, userId);

    res.json(resultado);
  } catch (error: any) {
    console.error('Error eliminando todas las fabricaciones:', error);
    res.status(500).json({ error: error.message || 'Error al eliminar todas las fabricaciones' });
  }
}

/**
 * Obtener fabricaciones eliminadas de una granja
 * NOTA: Las fabricaciones ahora se eliminan permanentemente, esta función siempre retorna un array vacío
 * @deprecated Se mantiene por compatibilidad pero ya no hay fabricaciones eliminadas
 */
export async function obtenerFabricacionesEliminadasCtrl(req: FabricacionRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar acceso a la granja
    const validacion = await validarAccesoGranjaPorId(userId, idGranja);
    if (!validacion.tieneAcceso) {
      return res.status(403).json({ error: validacion.error || 'Acceso denegado' });
    }

    // Las fabricaciones ahora se eliminan permanentemente, no hay eliminadas
    res.json([]);
  } catch (error: any) {
    console.error('Error obteniendo fabricaciones eliminadas:', error);
    res.status(500).json({ error: 'Error al obtener fabricaciones eliminadas' });
  }
}

/**
 * Verificar existencias antes de crear una fabricación
 */
export async function verificarExistenciasFabricacionCtrl(req: FabricacionRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja, idFormula, cantidadFabricacion } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!idGranja || !idFormula || !cantidadFabricacion) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    if (cantidadFabricacion <= 0) {
      return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
    }

    // Verificar que la granja pertenece al usuario
    const granja = await prisma.granja.findFirst({
      where: { id: idGranja, idUsuario: userId }
    });

    if (!granja) {
      return res.status(404).json({ error: 'Granja no encontrada' });
    }

    // Verificar existencias
    const resultado = await verificarExistenciasFabricacion({
      idGranja,
      idFormula,
      cantidadFabricacion
    });

    res.json(resultado);
  } catch (error: any) {
    console.error('Error verificando existencias:', error);
    res.status(500).json({ error: 'Error al verificar existencias', detalle: error.message });
  }
}

export async function exportarFabricacionesCtrl(req: FabricacionRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const validation = await prisma.granja.findFirst({
      where: { id: idGranja, idUsuario: userId }
    });

    if (!validation) {
      return res.status(404).json({ error: 'Granja no encontrada' });
    }

    const fabricaciones = await prisma.fabricacion.findMany({
      where: { idGranja },
      orderBy: { fechaFabricacion: 'desc' },
      include: {
        formula: {
          include: {
            animal: true,
          },
        },
        usuario: true,
        detallesFabricacion: {
          include: {
            materiaPrima: true,
          },
        },
      },
    });

    const filas: Array<Record<string, any>> = [];

    for (const fabricacion of fabricaciones) {
      filas.push({
        tipo: 'CABECERA',
        idFabricacion: fabricacion.id,
        descripcionFabricacion: fabricacion.descripcionFabricacion,
        codigoFormula: fabricacion.formula?.codigoFormula ?? '',
        descripcionFormula: fabricacion.formula?.descripcionFormula ?? '',
        codigoAnimal: fabricacion.formula?.animal?.codigoAnimal ?? '',
        nombreAnimal: fabricacion.formula?.animal?.descripcionAnimal ?? '',
        cantidadFabricacion: fabricacion.cantidadFabricacion,
        costoTotalFabricacion: fabricacion.costoTotalFabricacion,
        costoPorKilo: fabricacion.costoPorKilo,
        fechaFabricacion: fabricacion.fechaFabricacion.toISOString(),
        sinExistencias: fabricacion.sinExistencias ? 'SI' : 'NO',
        observaciones: fabricacion.observaciones ?? '',
        usuario: fabricacion.usuario ? `${fabricacion.usuario.nombreUsuario} ${fabricacion.usuario.apellidoUsuario}` : '',
      });

      for (const detalle of fabricacion.detallesFabricacion) {
        filas.push({
          tipo: 'DETALLE',
          idFabricacion: fabricacion.id,
          codigoMateriaPrima: detalle.materiaPrima?.codigoMateriaPrima ?? '',
          nombreMateriaPrima: detalle.materiaPrima?.nombreMateriaPrima ?? '',
          cantidadUsada: detalle.cantidadUsada,
          precioUnitario: detalle.precioUnitario,
          costoParcial: detalle.costoParcial,
        });
      }
    }

    const csv = buildCsv({
      fields: [
        'tipo',
        'idFabricacion',
        'descripcionFabricacion',
        'codigoFormula',
        'descripcionFormula',
        'codigoAnimal',
        'nombreAnimal',
        'cantidadFabricacion',
        'costoTotalFabricacion',
        'costoPorKilo',
        'fechaFabricacion',
        'sinExistencias',
        'observaciones',
        'usuario',
        'codigoMateriaPrima',
        'nombreMateriaPrima',
        'cantidadUsada',
        'precioUnitario',
        'costoParcial',
      ],
      data: filas,
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="fabricaciones_${idGranja}.csv"`);
    res.send(csv);
  } catch (error: any) {
    console.error('Error exportando fabricaciones:', error);
    res.status(500).json({ error: 'Error al exportar fabricaciones' });
  }
}

