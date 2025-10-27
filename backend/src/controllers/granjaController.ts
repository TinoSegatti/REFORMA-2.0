/**
 * Controlador de Granjas
 * Gestiona las granjas de cada usuario
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { obtenerLimitesPlan, PlanSuscripcion } from '../constants/planes';

interface GranjaRequest extends Request {
  userId?: string;
}

/**
 * Obtener granjas del usuario
 */
export async function obtenerGranjas(req: GranjaRequest, res: Response) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const granjas = await prisma.granja.findMany({
      where: { idUsuario: userId, activa: true },
      orderBy: { fechaCreacion: 'desc' },
      include: {
        _count: {
          select: {
            materiasPrimas: true,
            proveedores: true,
            piensos: true,
            formulasCab: true
          }
        }
      }
    });

    res.json(granjas);
  } catch (error: any) {
    console.error('Error obteniendo granjas:', error);
    res.status(500).json({ error: 'Error al obtener granjas' });
  }
}

/**
 * Crear nueva granja
 */
export async function crearGranja(req: GranjaRequest, res: Response) {
  try {
    const userId = req.userId;
    const { nombreGranja, descripcion } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!nombreGranja) {
      return res.status(400).json({ error: 'El nombre de la granja es requerido' });
    }

    // Obtener plan del usuario
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { planSuscripcion: true }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar límite de granjas
    const limites = obtenerLimitesPlan(usuario.planSuscripcion as PlanSuscripcion);
    const granjasCount = await prisma.granja.count({
      where: { idUsuario: userId, activa: true }
    });

    if (granjasCount >= limites.maxGranjas) {
      return res.status(403).json({
        error: `Límite de ${limites.maxGranjas} granja(s) alcanzado en tu plan`,
        limite: limites.maxGranjas,
        actual: granjasCount
      });
    }

    // Crear granja
    const granja = await prisma.granja.create({
      data: {
        idUsuario: userId,
        nombreGranja,
        descripcion,
        activa: true
      }
    });

    res.status(201).json(granja);
  } catch (error: any) {
    console.error('Error creando granja:', error);
    res.status(500).json({ error: 'Error al crear granja' });
  }
}

/**
 * Actualizar granja
 */
export async function actualizarGranja(req: GranjaRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;
    const { nombreGranja, descripcion } = req.body;

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

    const granjaActualizada = await prisma.granja.update({
      where: { id: idGranja },
      data: { nombreGranja, descripcion }
    });

    res.json(granjaActualizada);
  } catch (error: any) {
    console.error('Error actualizando granja:', error);
    res.status(500).json({ error: 'Error al actualizar granja' });
  }
}

/**
 * Eliminar granja (soft delete)
 */
export async function eliminarGranja(req: GranjaRequest, res: Response) {
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

    // Soft delete
    await prisma.granja.update({
      where: { id: idGranja },
      data: { activa: false }
    });

    res.json({ mensaje: 'Granja eliminada exitosamente' });
  } catch (error: any) {
    console.error('Error eliminando granja:', error);
    res.status(500).json({ error: 'Error al eliminar granja' });
  }
}

/**
 * Obtener una granja específica
 */
export async function obtenerGranja(req: GranjaRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const granja = await prisma.granja.findFirst({
      where: { id: idGranja, idUsuario: userId, activa: true },
      include: {
        _count: {
          select: {
            materiasPrimas: true,
            proveedores: true,
            piensos: true,
            formulasCab: true,
            inventario: true
          }
        }
      }
    });

    if (!granja) {
      return res.status(404).json({ error: 'Granja no encontrada' });
    }

    res.json(granja);
  } catch (error: any) {
    console.error('Error obteniendo granja:', error);
    res.status(500).json({ error: 'Error al obtener granja' });
  }
}

