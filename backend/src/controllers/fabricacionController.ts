/**
 * Controlador de Fabricaciones
 * Gestiona las fabricaciones y sus detalles
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { crearFabricacion, obtenerFabricacionesGranja, obtenerFabricacion, eliminarFabricacion, editarFabricacion, obtenerEstadisticasFabricaciones, eliminarTodasLasFabricaciones, restaurarFabricacion, obtenerFabricacionesEliminadas } from '../services/fabricacionService';

interface FabricacionRequest extends Request {
  userId?: string;
}

/**
 * Obtener todas las fabricaciones de una granja
 */
export async function obtenerFabricaciones(req: FabricacionRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;
    const { desde, hasta, descripcionFormula } = req.query;

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

    // Verificar que la granja pertenece al usuario
    const granja = await prisma.granja.findFirst({
      where: { id: idGranja, idUsuario: userId }
    });

    if (!granja) {
      return res.status(404).json({ error: 'Granja no encontrada' });
    }

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

    // Verificar que la fabricación pertenece a una granja del usuario
    const granja = await prisma.granja.findFirst({
      where: { id: fabricacion.idGranja, idUsuario: userId }
    });

    if (!granja) {
      return res.status(403).json({ error: 'Acceso denegado' });
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

    // Verificar que la fabricación pertenece al usuario
    const fabricacionActual = await prisma.fabricacion.findUnique({
      where: { id: idFabricacion },
      include: {
        granja: {
          select: {
            idUsuario: true
          }
        }
      }
    });

    if (!fabricacionActual) {
      return res.status(404).json({ error: 'Fabricación no encontrada' });
    }

    if (fabricacionActual.granja.idUsuario !== userId) {
      return res.status(403).json({ error: 'Acceso denegado' });
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
 * Restaurar una fabricación eliminada
 */
export async function restaurarFabricacionCtrl(req: FabricacionRequest, res: Response) {
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

    const resultado = await restaurarFabricacion(idFabricacion, userId);

    res.json(resultado);
  } catch (error: any) {
    console.error('Error restaurando fabricación:', error);
    res.status(500).json({ error: error.message || 'Error al restaurar fabricación' });
  }
}

/**
 * Obtener fabricaciones eliminadas de una granja
 */
export async function obtenerFabricacionesEliminadasCtrl(req: FabricacionRequest, res: Response) {
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

    const fabricacionesEliminadas = await obtenerFabricacionesEliminadas(idGranja);

    res.json(fabricacionesEliminadas);
  } catch (error: any) {
    console.error('Error obteniendo fabricaciones eliminadas:', error);
    res.status(500).json({ error: 'Error al obtener fabricaciones eliminadas' });
  }
}

