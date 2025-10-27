/**
 * Constantes de Planes de Suscripción
 * Define los límites de cada plan
 */

export enum PlanSuscripcion {
  PLAN_0 = 'PLAN_0', // gratis - 1 granja, 10 registros por tabla
  PLAN_1 = 'PLAN_1', // 1 granja, 50 registros por tabla
  PLAN_2 = 'PLAN_2', // 1 granja, 50 registros por tabla
  PLAN_3 = 'PLAN_3', // 1 granja, 100 registros por tabla
  PLAN_4 = 'PLAN_4', // 1 granja, 200 registros por tabla
}

export interface LimitePlan {
  maxGranjas: number;
  maxRegistrosPorTabla: number;
  precio: number;
  descripcion: string;
}

export const LIMITES_PLANES: Record<PlanSuscripcion, LimitePlan> = {
  [PlanSuscripcion.PLAN_0]: {
    maxGranjas: 1,
    maxRegistrosPorTabla: 10,
    precio: 0,
    descripcion: 'Plan Gratis - 1 granja, 10 registros por tabla'
  },
  [PlanSuscripcion.PLAN_1]: {
    maxGranjas: 1,
    maxRegistrosPorTabla: 50,
    precio: 0, // Definir precio
    descripcion: 'Plan Básico - 1 granja, 50 registros por tabla'
  },
  [PlanSuscripcion.PLAN_2]: {
    maxGranjas: 1,
    maxRegistrosPorTabla: 50,
    precio: 0, // Definir precio
    descripcion: 'Plan Intermedio - 1 granja, 50 registros por tabla'
  },
  [PlanSuscripcion.PLAN_3]: {
    maxGranjas: 1,
    maxRegistrosPorTabla: 100,
    precio: 0, // Definir precio
    descripcion: 'Plan Avanzado - 1 granja, 100 registros por tabla'
  },
  [PlanSuscripcion.PLAN_4]: {
    maxGranjas: 1,
    maxRegistrosPorTabla: 200,
    precio: 0, // Definir precio
    descripcion: 'Plan Empresarial - 1 granja, 200 registros por tabla'
  }
};

/**
 * Obtiene los límites de un plan
 */
export function obtenerLimitesPlan(plan: PlanSuscripcion): LimitePlan {
  return LIMITES_PLANES[plan];
}


