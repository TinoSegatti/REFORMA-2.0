/**
 * Controlador de Granjas
 * Gestiona las granjas de cada usuario
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { obtenerLimitesPlan, PlanSuscripcion } from '../constants/planes';
import { obtenerPlantasAccesibles } from '../services/usuarioEmpleadoService';

interface GranjaRequest extends Request {
  userId?: string;
}

/**
 * Obtener granjas del usuario
 * Si es empleado, incluye las granjas de su dueño
 */
export async function obtenerGranjas(req: GranjaRequest, res: Response) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Obtener información del usuario
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        esUsuarioEmpleado: true,
        idUsuarioDueño: true,
        activoComoEmpleado: true
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    let granjas;

    if (usuario.esUsuarioEmpleado && usuario.idUsuarioDueño && usuario.activoComoEmpleado) {
      // Si es empleado, obtener las granjas de su dueño
      const plantasAccesibles = await obtenerPlantasAccesibles(userId);
      granjas = await prisma.granja.findMany({
        where: {
          id: { in: plantasAccesibles.map(p => p.id) },
          activa: true
        },
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
    } else {
      // Si es dueño, obtener sus propias granjas
      granjas = await prisma.granja.findMany({
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
    }

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
    const maxGranjas = limites.maxGranjas;
    
    // Si es ilimitado, permitir
    if (maxGranjas === null) {
      // Continuar con la creación
    } else {
      const granjasCount = await prisma.granja.count({
        where: { idUsuario: userId, activa: true }
      });

      if (granjasCount >= maxGranjas) {
        return res.status(403).json({
          error: `Límite de ${maxGranjas} granja(s) alcanzado en tu plan`,
          limite: maxGranjas,
          actual: granjasCount
        });
      }
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
 * NOTA: El middleware validarAccesoGranja ya validó el acceso
 */
export async function actualizarGranja(req: GranjaRequest, res: Response) {
  try {
    const { idGranja } = req.params;
    const { nombreGranja, descripcion } = req.body;

    // El middleware validarAccesoGranja ya validó el acceso
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
 * NOTA: El middleware validarAccesoGranja ya validó el acceso
 * IMPORTANTE: Solo el dueño puede eliminar granjas, no los empleados
 */
export async function eliminarGranja(req: GranjaRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar si es empleado (los empleados no pueden eliminar granjas)
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { esUsuarioEmpleado: true }
    });

    if (usuario?.esUsuarioEmpleado) {
      return res.status(403).json({ error: 'Los empleados no pueden eliminar granjas' });
    }

    // El middleware validarAccesoGranja ya validó el acceso
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
 * NOTA: El middleware validarAccesoGranja ya validó el acceso, así que solo obtenemos la granja
 */
export async function obtenerGranja(req: GranjaRequest, res: Response) {
  try {
    const { idGranja } = req.params;

    // El middleware validarAccesoGranja ya validó el acceso, así que obtenemos la granja directamente
    const granja = await prisma.granja.findUnique({
      where: { id: idGranja },
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

    if (!granja || !granja.activa) {
      return res.status(404).json({ error: 'Granja no encontrada' });
    }

    res.json(granja);
  } catch (error: any) {
    console.error('Error obteniendo granja:', error);
    res.status(500).json({ error: 'Error al obtener granja' });
  }
}

