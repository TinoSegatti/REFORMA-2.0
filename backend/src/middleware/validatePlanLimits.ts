/**
 * Middleware para validar límites de plan
 * Verifica que no se excedan los límites del plan del usuario
 */

import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { obtenerLimitesPlan, PlanSuscripcion } from '../constants/planes';
import { AuthRequest } from './authMiddleware';

export interface ValidatedRequest extends Request {
  userId?: string;
}

/**
 * Obtiene el plan efectivo del usuario (si es empleado, usa el plan del dueño)
 * Exportada para uso en otros middlewares
 */
export async function obtenerPlanEfectivo(userId: string): Promise<{ plan: PlanSuscripcion; esEmpleado: boolean }> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    select: {
      planSuscripcion: true,
      esUsuarioEmpleado: true,
      idUsuarioDueño: true,
      activoComoEmpleado: true
    }
  });

  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }

  // Si es empleado activo, usar el plan del dueño
  if (usuario.esUsuarioEmpleado && usuario.idUsuarioDueño && usuario.activoComoEmpleado) {
    const dueño = await prisma.usuario.findUnique({
      where: { id: usuario.idUsuarioDueño },
      select: { planSuscripcion: true }
    });

    if (dueño) {
      return { plan: dueño.planSuscripcion as PlanSuscripcion, esEmpleado: true };
    }
  }

  return { plan: usuario.planSuscripcion as PlanSuscripcion, esEmpleado: false };
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
      // Nota: maxRegistrosPorTabla no existe en LimitesPlanDetallados
      // Este middleware está deprecado, usar los middlewares específicos
      const maxRegistros = 1000; // Valor temporal, este middleware no se usa

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

    // Obtener plan efectivo (si es empleado, usar plan del dueño)
    const { plan } = await obtenerPlanEfectivo(userId);
    const limites = obtenerLimitesPlan(plan);
    const maxGranjas = limites.maxGranjas;

    // Si es ilimitado, permitir
    if (maxGranjas === null) {
      return next();
    }

    // Obtener el ID del dueño real (si es empleado)
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        esUsuarioEmpleado: true,
        idUsuarioDueño: true,
        activoComoEmpleado: true
      }
    });

    const idUsuarioReal = usuario?.esUsuarioEmpleado && usuario?.idUsuarioDueño && usuario?.activoComoEmpleado
      ? usuario.idUsuarioDueño
      : userId;

    // Contar granjas actuales del dueño
    const granjasCount = await prisma.granja.count({
      where: { idUsuario: idUsuarioReal, activa: true }
    });

    // Verificar límite
    if (granjasCount >= maxGranjas) {
      return res.status(403).json({
        error: `Has alcanzado el límite de ${maxGranjas} granja(s) de tu plan ${plan}`,
        limite: maxGranjas,
        actual: granjasCount,
        plan: plan,
        puedeUpgrade: plan !== PlanSuscripcion.ENTERPRISE
      });
    }

    next();
  } catch (error: any) {
    console.error('Error validando límite de granjas:', error);
    return res.status(500).json({ error: 'Error validando límite de granjas' });
  }
}

/**
 * Middleware para validar límite de materias primas
 */
export async function validateMateriasPrimasLimit(req: ValidatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const granjaId = req.body.idGranja || req.params.idGranja;
    if (!granjaId) {
      return res.status(400).json({ error: 'ID de granja no proporcionado' });
    }

    // Obtener plan efectivo
    const { plan } = await obtenerPlanEfectivo(userId);
    const limites = obtenerLimitesPlan(plan);
    const maxMateriasPrimas = limites.maxMateriasPrimas;

    // Si es ilimitado, permitir
    if (maxMateriasPrimas === null) {
      return next();
    }

    // Contar materias primas actuales en la granja
    const count = await prisma.materiaPrima.count({
      where: { idGranja: granjaId, activa: true }
    });

    // Verificar límite
    if (count >= maxMateriasPrimas) {
      return res.status(403).json({
        error: `Has alcanzado el límite de ${maxMateriasPrimas} materias primas de tu plan ${plan}`,
        limite: maxMateriasPrimas,
        actual: count,
        plan: plan,
        puedeUpgrade: plan !== PlanSuscripcion.ENTERPRISE
      });
    }

    next();
  } catch (error: any) {
    console.error('Error validando límite de materias primas:', error);
    return res.status(500).json({ error: 'Error validando límite de materias primas' });
  }
}

/**
 * Middleware para validar límite de proveedores
 */
export async function validateProveedoresLimit(req: ValidatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const granjaId = req.body.idGranja || req.params.idGranja;
    if (!granjaId) {
      return res.status(400).json({ error: 'ID de granja no proporcionado' });
    }

    // Obtener plan efectivo
    const { plan } = await obtenerPlanEfectivo(userId);
    const limites = obtenerLimitesPlan(plan);
    const maxProveedores = limites.maxProveedores;

    // Si es ilimitado, permitir
    if (maxProveedores === null) {
      return next();
    }

    // Contar proveedores actuales en la granja
    const count = await prisma.proveedor.count({
      where: { idGranja: granjaId, activo: true }
    });

    // Verificar límite
    if (count >= maxProveedores) {
      return res.status(403).json({
        error: `Has alcanzado el límite de ${maxProveedores} proveedores de tu plan ${plan}`,
        limite: maxProveedores,
        actual: count,
        plan: plan,
        puedeUpgrade: plan !== PlanSuscripcion.ENTERPRISE
      });
    }

    next();
  } catch (error: any) {
    console.error('Error validando límite de proveedores:', error);
    return res.status(500).json({ error: 'Error validando límite de proveedores' });
  }
}

/**
 * Middleware para validar límite de piensos
 */
export async function validatePiensosLimit(req: ValidatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const granjaId = req.body.idGranja || req.params.idGranja;
    if (!granjaId) {
      return res.status(400).json({ error: 'ID de granja no proporcionado' });
    }

    // Obtener plan efectivo
    const { plan } = await obtenerPlanEfectivo(userId);
    const limites = obtenerLimitesPlan(plan);
    const maxPiensos = limites.maxPiensos;

    // Si es ilimitado, permitir
    if (maxPiensos === null) {
      return next();
    }

    // Contar piensos actuales en la granja
    const count = await prisma.animal.count({
      where: { idGranja: granjaId }
    });

    // Verificar límite
    if (count >= maxPiensos) {
      return res.status(403).json({
        error: `Has alcanzado el límite de ${maxPiensos} piensos de tu plan ${plan}`,
        limite: maxPiensos,
        actual: count,
        plan: plan,
        puedeUpgrade: plan !== PlanSuscripcion.ENTERPRISE
      });
    }

    next();
  } catch (error: any) {
    console.error('Error validando límite de piensos:', error);
    return res.status(500).json({ error: 'Error validando límite de piensos' });
  }
}

/**
 * Middleware para validar límite de compras
 */
export async function validateComprasLimit(req: ValidatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const granjaId = req.body.idGranja || req.params.idGranja;
    if (!granjaId) {
      return res.status(400).json({ error: 'ID de granja no proporcionado' });
    }

    // Obtener plan efectivo
    const { plan } = await obtenerPlanEfectivo(userId);
    const limites = obtenerLimitesPlan(plan);
    const maxCompras = limites.maxCompras;

    // Si es ilimitado, permitir
    if (maxCompras === null) {
      return next();
    }

    // Contar compras actuales en la granja
    const count = await prisma.compraCabecera.count({
      where: { idGranja: granjaId, activo: true }
    });

    // Verificar límite
    if (count >= maxCompras) {
      return res.status(403).json({
        error: `Has alcanzado el límite de ${maxCompras} compras de tu plan ${plan}`,
        limite: maxCompras,
        actual: count,
        plan: plan,
        puedeUpgrade: plan !== PlanSuscripcion.ENTERPRISE
      });
    }

    next();
  } catch (error: any) {
    console.error('Error validando límite de compras:', error);
    return res.status(500).json({ error: 'Error validando límite de compras' });
  }
}

/**
 * Middleware para validar límite de fórmulas
 */
export async function validateFormulasLimit(req: ValidatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const granjaId = req.body.idGranja || req.params.idGranja;
    if (!granjaId) {
      return res.status(400).json({ error: 'ID de granja no proporcionado' });
    }

    // Obtener plan efectivo
    const { plan } = await obtenerPlanEfectivo(userId);
    const limites = obtenerLimitesPlan(plan);
    const maxFormulas = limites.maxFormulas;

    // Si es ilimitado, permitir
    if (maxFormulas === null) {
      return next();
    }

    // Contar fórmulas actuales en la granja
    const count = await prisma.formulaCabecera.count({
      where: { idGranja: granjaId, activa: true }
    });

    // Verificar límite
    if (count >= maxFormulas) {
      return res.status(403).json({
        error: `Has alcanzado el límite de ${maxFormulas} fórmulas de tu plan ${plan}`,
        limite: maxFormulas,
        actual: count,
        plan: plan,
        puedeUpgrade: plan !== PlanSuscripcion.ENTERPRISE
      });
    }

    next();
  } catch (error: any) {
    console.error('Error validando límite de fórmulas:', error);
    return res.status(500).json({ error: 'Error validando límite de fórmulas' });
  }
}

/**
 * Middleware para validar límite de fabricaciones
 */
export async function validateFabricacionesLimit(req: ValidatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const granjaId = req.body.idGranja || req.params.idGranja;
    if (!granjaId) {
      return res.status(400).json({ error: 'ID de granja no proporcionado' });
    }

    // Obtener plan efectivo
    const { plan } = await obtenerPlanEfectivo(userId);
    const limites = obtenerLimitesPlan(plan);
    const maxFabricaciones = limites.maxFabricaciones;

    // Si es ilimitado, permitir
    if (maxFabricaciones === null) {
      return next();
    }

    // Contar fabricaciones actuales en la granja
    const count = await prisma.fabricacion.count({
      where: { idGranja: granjaId, activo: true }
    });

    // Verificar límite
    if (count >= maxFabricaciones) {
      return res.status(403).json({
        error: `Has alcanzado el límite de ${maxFabricaciones} fabricaciones de tu plan ${plan}`,
        limite: maxFabricaciones,
        actual: count,
        plan: plan,
        puedeUpgrade: plan !== PlanSuscripcion.ENTERPRISE
      });
    }

    next();
  } catch (error: any) {
    console.error('Error validando límite de fabricaciones:', error);
    return res.status(500).json({ error: 'Error validando límite de fabricaciones' });
  }
}

/**
 * Middleware para validar que el usuario tiene plan ENTERPRISE
 * Usado para funcionalidades premium como el Reporte Completo
 */
export async function validateEnterprisePlan(req: ValidatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Obtener plan efectivo (si es empleado, usar plan del dueño)
    const { plan } = await obtenerPlanEfectivo(userId);

    // Verificar que el plan es ENTERPRISE
    if (plan !== PlanSuscripcion.ENTERPRISE) {
      return res.status(403).json({
        error: 'Esta funcionalidad está disponible solo para el plan ENTERPRISE',
        plan: plan,
        requierePlan: PlanSuscripcion.ENTERPRISE,
        puedeUpgrade: true
      });
    }

    next();
  } catch (error: any) {
    console.error('Error validando plan ENTERPRISE:', error);
    return res.status(500).json({ error: 'Error validando plan' });
  }
}

/**
 * Middleware para validar límite de archivos históricos
 * - STARTER: Bloqueado (null)
 * - DEMO: Máximo 3
 * - BUSINESS: Máximo 180
 * - ENTERPRISE: Ilimitado (null)
 */
export async function validateArchivosHistoricosLimit(req: ValidatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const granjaId = req.body.idGranja || req.params.idGranja;
    if (!granjaId) {
      return res.status(400).json({ error: 'ID de granja no proporcionado' });
    }

    // Obtener plan efectivo (si es empleado, usar plan del dueño)
    const { plan } = await obtenerPlanEfectivo(userId);
    const limites = obtenerLimitesPlan(plan);
    const maxArchivosHistoricos = limites.maxArchivosHistoricos;

    // STARTER no tiene acceso a archivos históricos
    if (maxArchivosHistoricos === null && plan === PlanSuscripcion.STARTER) {
      return res.status(403).json({
        error: 'Los archivos históricos no están disponibles en el plan STARTER',
        plan: plan,
        puedeUpgrade: true
      });
    }

    // Si es ilimitado (ENTERPRISE), permitir
    if (maxArchivosHistoricos === null) {
      return next();
    }

    // Contar archivos históricos actuales en la granja
    const count = await prisma.archivoCabecera.count({
      where: { idGranja: granjaId }
    });

    // Verificar límite
    if (count >= maxArchivosHistoricos) {
      return res.status(403).json({
        error: `Has alcanzado el límite de ${maxArchivosHistoricos} archivos históricos de tu plan ${plan}`,
        limite: maxArchivosHistoricos,
        actual: count,
        plan: plan,
        puedeUpgrade: plan !== PlanSuscripcion.ENTERPRISE
      });
    }

    next();
  } catch (error: any) {
    console.error('Error validando límite de archivos históricos:', error);
    return res.status(500).json({ error: 'Error validando límite de archivos históricos' });
  }
}

