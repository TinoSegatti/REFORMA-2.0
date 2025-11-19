/**
 * Middleware para validar acceso a granjas
 * Permite acceso si el usuario es el dueño de la granja o si es empleado del dueño
 */

import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from './authMiddleware';

/**
 * Función auxiliar para validar acceso a una granja específica
 * Útil para validar acceso cuando el idGranja viene de un recurso relacionado
 */
export async function validarAccesoGranjaPorId(
  userId: string,
  granjaId: string
): Promise<{ tieneAcceso: boolean; error?: string }> {
  try {
    // Obtener información del usuario
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        esUsuarioEmpleado: true,
        idUsuarioDueño: true,
        activoComoEmpleado: true
      }
    });

    if (!usuario) {
      return { tieneAcceso: false, error: 'Usuario no encontrado' };
    }

    // Obtener información de la granja
    const granja = await prisma.granja.findUnique({
      where: { id: granjaId },
      select: {
        id: true,
        idUsuario: true,
        activa: true
      }
    });

    if (!granja) {
      return { tieneAcceso: false, error: 'Granja no encontrada' };
    }

    if (!granja.activa) {
      return { tieneAcceso: false, error: 'Granja inactiva' };
    }

    // Verificar acceso
    let tieneAcceso = false;

    if (usuario.esUsuarioEmpleado && usuario.idUsuarioDueño) {
      // Si es empleado, verificar que la granja pertenece a su dueño
      if (granja.idUsuario === usuario.idUsuarioDueño && usuario.activoComoEmpleado) {
        tieneAcceso = true;
      }
    } else {
      // Si es dueño, verificar que la granja le pertenece
      if (granja.idUsuario === usuario.id) {
        tieneAcceso = true;
      }
    }

    if (!tieneAcceso) {
      return {
        tieneAcceso: false,
        error: usuario.esUsuarioEmpleado
          ? 'Esta granja no pertenece a tu empleador'
          : 'Esta granja no te pertenece'
      };
    }

    return { tieneAcceso: true };
  } catch (error) {
    console.error('Error validando acceso a granja:', error);
    return { tieneAcceso: false, error: 'Error verificando acceso a granja' };
  }
}

/**
 * Middleware para validar que el usuario tiene acceso a la granja
 * - Si es dueño: verifica que la granja le pertenece
 * - Si es empleado: verifica que la granja pertenece a su dueño
 */
export async function validarAccesoGranja(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Obtener ID de granja de los parámetros o del body
    const granjaId = req.params.idGranja || req.params.id || req.body.idGranja || req.body.id;

    if (!granjaId) {
      return res.status(400).json({ error: 'ID de granja no proporcionado' });
    }

    // Obtener información del usuario
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        esUsuarioEmpleado: true,
        idUsuarioDueño: true,
        activoComoEmpleado: true
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Obtener información de la granja
    const granja = await prisma.granja.findUnique({
      where: { id: granjaId },
      select: {
        id: true,
        idUsuario: true,
        activa: true
      }
    });

    if (!granja) {
      return res.status(404).json({ error: 'Granja no encontrada' });
    }

    if (!granja.activa) {
      return res.status(404).json({ error: 'Granja inactiva' });
    }

    // Verificar acceso
    let tieneAcceso = false;

    if (usuario.esUsuarioEmpleado && usuario.idUsuarioDueño) {
      // Si es empleado, verificar que la granja pertenece a su dueño
      if (granja.idUsuario === usuario.idUsuarioDueño && usuario.activoComoEmpleado) {
        tieneAcceso = true;
      }
    } else {
      // Si es dueño, verificar que la granja le pertenece
      if (granja.idUsuario === usuario.id) {
        tieneAcceso = true;
      }
    }

    if (!tieneAcceso) {
      return res.status(403).json({ 
        error: 'No tienes permiso para acceder a esta granja',
        detalles: usuario.esUsuarioEmpleado 
          ? 'Esta granja no pertenece a tu empleador' 
          : 'Esta granja no te pertenece'
      });
    }

    // Agregar información de la granja al request para uso posterior
    (req as any).granjaId = granjaId;
    (req as any).esEmpleado = usuario.esUsuarioEmpleado;

    next();
  } catch (error) {
    console.error('Error validando acceso a granja:', error);
    return res.status(500).json({ error: 'Error verificando acceso a granja' });
  }
}

/**
 * Middleware para validar acceso a granja cuando el ID viene en el path
 * Útil para rutas como /api/granjas/:idGranja/...
 */
export function validarAccesoGranjaPorParametro(paramName: string = 'idGranja') {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Temporalmente mover el parámetro a req.params.idGranja para que validarAccesoGranja lo encuentre
    const originalIdGranja = req.params.idGranja;
    req.params.idGranja = req.params[paramName] || req.params.idGranja;
    
    try {
      await validarAccesoGranja(req, res, next);
    } finally {
      // Restaurar el valor original
      req.params.idGranja = originalIdGranja;
    }
  };
}

