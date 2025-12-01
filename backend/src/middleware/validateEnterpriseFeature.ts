/**
 * Middleware para validar que el usuario tiene plan ENTERPRISE
 * Solo usuarios con plan ENTERPRISE pueden acceder a funcionalidades de CORINA
 * Los empleados heredan el plan del dueño
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import { prisma } from '../config/database';

/**
 * Obtiene el plan efectivo del usuario (si es empleado, hereda el plan del dueño)
 */
export async function obtenerPlanEfectivo(idUsuario: string): Promise<string | null> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: idUsuario },
    select: {
      planSuscripcion: true,
      esUsuarioEmpleado: true,
      idUsuarioDueño: true,
    },
  });

  if (!usuario) {
    return null;
  }

  // Si es empleado, obtener el plan del dueño
  if (usuario.esUsuarioEmpleado && usuario.idUsuarioDueño) {
    const dueño = await prisma.usuario.findUnique({
      where: { id: usuario.idUsuarioDueño },
      select: { planSuscripcion: true },
    });
    return dueño?.planSuscripcion || null;
  }

  return usuario.planSuscripcion;
}

export async function validateEnterpriseFeature(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const planEfectivo = await obtenerPlanEfectivo(req.userId);

    if (!planEfectivo) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (planEfectivo !== 'ENTERPRISE') {
      return res.status(403).json({
        error: 'Esta funcionalidad está disponible solo para usuarios con plan ENTERPRISE',
        planActual: planEfectivo,
      });
    }

    next();
  } catch (error: any) {
    console.error('Error validando plan ENTERPRISE:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

