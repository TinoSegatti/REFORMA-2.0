/**
 * Middleware para validar límites de plan
 * Verifica que no se excedan los límites del plan del usuario
 */

import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { obtenerLimitesPlan, PlanSuscripcion } from '../constants/planes';

export interface ValidatedRequest extends Request {
  userId?: string;
}

/**
 * Middleware para verificar límites de registros en una tabla
 */
export function validateTableLimit(tablaName: string, idField: string, granjaField: string = 'idGranja') {
  return async (req: ValidatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      // Obtener plan del usuario
      const usuario = await prisma.usuario.findUnique({
        where: { id: userId },
        select: { planSuscripcion: true }
      });

      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const limites = obtenerLimitesPlan(usuario.planSuscripcion as PlanSuscripcion);
      const maxRegistros = limites.maxRegistrosPorTabla;

      // Obtener granja de la petición
      const granjaId = req.body[granjaField] || req.params[granjaField];

      if (!granjaId) {
        return res.status(400).json({ error: 'ID de granja no proporcionado' });
      }

      // Contar registros actuales en la tabla para esta granja
      const count = await (prisma as any)[tablaName].count({
        where: { [granjaField]: granjaId }
      });

      // Verificar límite
      if (count >= maxRegistros) {
        return res.status(403).json({
          error: `Límite de ${maxRegistros} registros alcanzado para esta tabla en tu plan`,
          limite: maxRegistros,
          actual: count,
          plan: usuario.planSuscripcion
        });
      }

      next();
    } catch (error: any) {
      console.error('Error validando límite de plan:', error);
      return res.status(500).json({ error: 'Error validando límite de plan' });
    }
  };
}

/**
 * Middleware para verificar límite de granjas
 */
export async function validateGranjasLimit(req: ValidatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Obtener plan del usuario
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { planSuscripcion: true }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const limites = obtenerLimitesPlan(usuario.planSuscripcion as PlanSuscripcion);
    const maxGranjas = limites.maxGranjas;

    // Contar granjas actuales
    const granjasCount = await prisma.granja.count({
      where: { idUsuario: userId, activa: true }
    });

    // Verificar límite
    if (granjasCount >= maxGranjas) {
      return res.status(403).json({
        error: `Límite de ${maxGranjas} granja(s) alcanzado en tu plan`,
        limite: maxGranjas,
        actual: granjasCount,
        plan: usuario.planSuscripcion
      });
    }

    next();
  } catch (error: any) {
    console.error('Error validando límite de granjas:', error);
    return res.status(500).json({ error: 'Error validando límite de granjas' });
  }
}


