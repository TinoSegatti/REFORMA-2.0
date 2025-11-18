/**
 * Constantes de Planes de Suscripción
 * Define los límites detallados de cada plan según las especificaciones del negocio
 */

export enum PlanSuscripcion {
  DEMO = 'DEMO',           // Gratuito - 30 días
  STARTER = 'STARTER',     // $35/mes o $350/año
  BUSINESS = 'BUSINESS',   // $99/mes o $990/año
  ENTERPRISE = 'ENTERPRISE' // $229/mes o $2,290/año
}

export enum PeriodoFacturacion {
  MENSUAL = 'MENSUAL',
  ANUAL = 'ANUAL'
}

/**
 * Límites detallados por módulo/funcionalidad
 */
export interface LimitesPlanDetallados {
  // Límites numéricos (null = ilimitado)
  maxMateriasPrimas: number | null;
  maxProveedores: number | null;
  maxPiensos: number | null;
  maxCompras: number | null;
  maxFormulas: number | null;
  maxFabricaciones: number | null;
  maxGranjas: number | null;
  maxUsuarios: number | null;
  maxArchivosHistoricos: number | null;
  
  // Funcionalidades booleanas
  permiteGraficosAvanzados: boolean;
  permiteGraficosFormulas: boolean;
  permiteGraficosFabricaciones: boolean;
  permiteReportesPDF: boolean;
  permiteImportacionCSV: boolean;
  permiteImportacionCSVCompleta: boolean;
  permiteMultiplesUsuarios: boolean;
  permiteDatosPermanentes: boolean;
  permiteMultiplesPlantas: boolean;
  permiteHistorialCompleto: boolean;
  permiteHistorialFormulas: boolean;
  permiteRestaurarFabricaciones: boolean;
  permiteCapacitacionPersonalizada: boolean;
  permiteSoporteDirecto: boolean;
  permiteAlertasWhatsApp: boolean;
  permiteGestionIA: boolean;
  
  // Precios
  precioMensual: number;
  precioAnual: number;
  
  // Descripción
  descripcion: string;
  nombre: string;
}

/**
 * Configuración completa de todos los planes
 */
export const LIMITES_PLANES: Record<PlanSuscripcion, LimitesPlanDetallados> = {
  [PlanSuscripcion.DEMO]: {
    maxMateriasPrimas: 10,
    maxProveedores: 10,
    maxPiensos: 10,
    maxCompras: 10,
    maxFormulas: 5,
    maxFabricaciones: 5,
    maxGranjas: 1,
    maxUsuarios: 1,
    maxArchivosHistoricos: 3,
    
    permiteGraficosAvanzados: false,
    permiteGraficosFormulas: false,
    permiteGraficosFabricaciones: false,
    permiteReportesPDF: false,
    permiteImportacionCSV: true,
    permiteImportacionCSVCompleta: false, // Solo 1 vez cuando está vacío
    permiteMultiplesUsuarios: false,
    permiteDatosPermanentes: false, // Se eliminan en 30 días
    permiteMultiplesPlantas: false,
    permiteHistorialCompleto: true,
    permiteHistorialFormulas: false,
    permiteRestaurarFabricaciones: false,
    permiteCapacitacionPersonalizada: false,
    permiteSoporteDirecto: false,
    permiteAlertasWhatsApp: false,
    permiteGestionIA: false,
    
    precioMensual: 0,
    precioAnual: 0,
    descripcion: 'Plan de demostración gratuito - 30 días',
    nombre: 'Demo Gratuita'
  },
  
  [PlanSuscripcion.STARTER]: {
    maxMateriasPrimas: 20,
    maxProveedores: 30,
    maxPiensos: 15,
    maxCompras: 2000,
    maxFormulas: 30,
    maxFabricaciones: 1000,
    maxGranjas: 2,
    maxUsuarios: 2,
    maxArchivosHistoricos: null, // No disponible
    
    permiteGraficosAvanzados: false, // Solo básicos en panel principal
    permiteGraficosFormulas: false,
    permiteGraficosFabricaciones: false,
    permiteReportesPDF: false,
    permiteImportacionCSV: true,
    permiteImportacionCSVCompleta: false, // Solo materias primas y proveedores
    permiteMultiplesUsuarios: true, // Máx 2
    permiteDatosPermanentes: true,
    permiteMultiplesPlantas: true, // Máx 2
    permiteHistorialCompleto: false, // Solo precios y compras
    permiteHistorialFormulas: false,
    permiteRestaurarFabricaciones: false,
    permiteCapacitacionPersonalizada: false,
    permiteSoporteDirecto: false,
    permiteAlertasWhatsApp: false,
    permiteGestionIA: false,
    
    precioMensual: 50750, // $35 USD * 1450 ARS
    precioAnual: 507500, // $350 USD * 1450 ARS
    descripcion: 'Plan Starter - Ideal para pequeñas operaciones',
    nombre: 'Starter'
  },
  
  [PlanSuscripcion.BUSINESS]: {
    maxMateriasPrimas: 500,
    maxProveedores: 500,
    maxPiensos: 100,
    maxCompras: 8000,
    maxFormulas: 100,
    maxFabricaciones: 5000,
    maxGranjas: 5,
    maxUsuarios: 5,
    maxArchivosHistoricos: 180,
    
    permiteGraficosAvanzados: true,
    permiteGraficosFormulas: true,
    permiteGraficosFabricaciones: true,
    permiteReportesPDF: true, // 6 tipos de reportes
    permiteImportacionCSV: true,
    permiteImportacionCSVCompleta: true,
    permiteMultiplesUsuarios: true, // Máx 5
    permiteDatosPermanentes: true,
    permiteMultiplesPlantas: true, // Máx 5
    permiteHistorialCompleto: true,
    permiteHistorialFormulas: true,
    permiteRestaurarFabricaciones: true,
    permiteCapacitacionPersonalizada: true, // Virtual + manual
    permiteSoporteDirecto: true, // Respuesta en 24hs
    permiteAlertasWhatsApp: false,
    permiteGestionIA: false,
    
    precioMensual: 143550, // $99 USD * 1450 ARS
    precioAnual: 1435500, // $990 USD * 1450 ARS
    descripcion: 'Plan Business - Para operaciones profesionales',
    nombre: 'Business'
  },
  
  [PlanSuscripcion.ENTERPRISE]: {
    maxMateriasPrimas: null, // Ilimitado
    maxProveedores: null,
    maxPiensos: null,
    maxCompras: null,
    maxFormulas: null,
    maxFabricaciones: null,
    maxGranjas: 25, // Personalizado
    maxUsuarios: 25, // Personalizado
    maxArchivosHistoricos: null, // Ilimitado
    
    permiteGraficosAvanzados: true,
    permiteGraficosFormulas: true,
    permiteGraficosFabricaciones: true,
    permiteReportesPDF: true, // Todos los reportes
    permiteImportacionCSV: true,
    permiteImportacionCSVCompleta: true,
    permiteMultiplesUsuarios: true, // Máx 25 personalizado
    permiteDatosPermanentes: true,
    permiteMultiplesPlantas: true, // Máx 25 personalizado
    permiteHistorialCompleto: true,
    permiteHistorialFormulas: true,
    permiteRestaurarFabricaciones: true,
    permiteCapacitacionPersonalizada: true, // Presencial + virtual
    permiteSoporteDirecto: true, // Respuesta en menos de 24hs
    permiteAlertasWhatsApp: true,
    permiteGestionIA: true,
    
    precioMensual: 332050, // $229 USD * 1450 ARS
    precioAnual: 3320500, // $2,290 USD * 1450 ARS
    descripcion: 'Plan Enterprise - Solución completa y escalable',
    nombre: 'Enterprise'
  }
};

/**
 * Obtiene los límites detallados de un plan
 */
export function obtenerLimitesPlan(plan: PlanSuscripcion): LimitesPlanDetallados {
  return LIMITES_PLANES[plan];
}

/**
 * Obtiene el precio de un plan según el período
 */
export function obtenerPrecioPlan(plan: PlanSuscripcion, periodo: PeriodoFacturacion): number {
  const limites = LIMITES_PLANES[plan];
  return periodo === PeriodoFacturacion.ANUAL ? limites.precioAnual : limites.precioMensual;
}

/**
 * Verifica si un plan permite una funcionalidad específica
 */
export function planPermiteFuncionalidad(plan: PlanSuscripcion, funcionalidad: keyof Omit<LimitesPlanDetallados, 'precioMensual' | 'precioAnual' | 'descripcion' | 'nombre' | 'maxMateriasPrimas' | 'maxProveedores' | 'maxPiensos' | 'maxCompras' | 'maxFormulas' | 'maxFabricaciones' | 'maxGranjas' | 'maxUsuarios' | 'maxArchivosHistoricos'>): boolean {
  const limites = LIMITES_PLANES[plan];
  return limites[funcionalidad] === true;
}

/**
 * Obtiene el límite numérico de un recurso para un plan
 */
export function obtenerLimiteRecurso(plan: PlanSuscripcion, recurso: 'maxMateriasPrimas' | 'maxProveedores' | 'maxPiensos' | 'maxCompras' | 'maxFormulas' | 'maxFabricaciones' | 'maxGranjas' | 'maxUsuarios' | 'maxArchivosHistoricos'): number | null {
  const limites = LIMITES_PLANES[plan];
  return limites[recurso];
}
