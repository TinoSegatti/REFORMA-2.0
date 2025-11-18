/**
 * Pruebas unitarias para constantes de planes
 */

import {
  PlanSuscripcion,
  PeriodoFacturacion,
  LIMITES_PLANES,
  obtenerLimitesPlan,
  obtenerPrecioPlan,
  obtenerLimiteRecurso,
  planPermiteFuncionalidad,
} from '../planes';

describe('Constantes de Planes', () => {
  describe('LIMITES_PLANES', () => {
    it('debe tener todos los planes definidos', () => {
      expect(LIMITES_PLANES[PlanSuscripcion.DEMO]).toBeDefined();
      expect(LIMITES_PLANES[PlanSuscripcion.STARTER]).toBeDefined();
      expect(LIMITES_PLANES[PlanSuscripcion.BUSINESS]).toBeDefined();
      expect(LIMITES_PLANES[PlanSuscripcion.ENTERPRISE]).toBeDefined();
    });

    it('DEMO debe tener precio 0', () => {
      const demo = LIMITES_PLANES[PlanSuscripcion.DEMO];
      expect(demo.precioMensual).toBe(0);
      expect(demo.precioAnual).toBe(0);
    });

    it('STARTER debe tener precios correctos', () => {
      const starter = LIMITES_PLANES[PlanSuscripcion.STARTER];
      expect(starter.precioMensual).toBe(35);
      expect(starter.precioAnual).toBe(350);
    });

    it('BUSINESS debe tener precios correctos', () => {
      const business = LIMITES_PLANES[PlanSuscripcion.BUSINESS];
      expect(business.precioMensual).toBe(99);
      expect(business.precioAnual).toBe(990);
    });

    it('ENTERPRISE debe tener precios correctos', () => {
      const enterprise = LIMITES_PLANES[PlanSuscripcion.ENTERPRISE];
      expect(enterprise.precioMensual).toBe(229);
      expect(enterprise.precioAnual).toBe(2290);
    });

    it('DEMO debe tener límites restringidos', () => {
      const demo = LIMITES_PLANES[PlanSuscripcion.DEMO];
      expect(demo.maxMateriasPrimas).toBe(10);
      expect(demo.maxProveedores).toBe(10);
      expect(demo.maxGranjas).toBe(1);
      expect(demo.permiteDatosPermanentes).toBe(false);
    });

    it('ENTERPRISE debe tener límites ilimitados donde corresponde', () => {
      const enterprise = LIMITES_PLANES[PlanSuscripcion.ENTERPRISE];
      expect(enterprise.maxMateriasPrimas).toBeNull();
      expect(enterprise.maxProveedores).toBeNull();
      expect(enterprise.maxCompras).toBeNull();
      expect(enterprise.maxFormulas).toBeNull();
      expect(enterprise.maxFabricaciones).toBeNull();
    });

    it('STARTER debe tener funcionalidades limitadas', () => {
      const starter = LIMITES_PLANES[PlanSuscripcion.STARTER];
      expect(starter.permiteGraficosFormulas).toBe(false);
      expect(starter.permiteReportesPDF).toBe(false);
      expect(starter.permiteHistorialCompleto).toBe(false);
    });

    it('BUSINESS debe tener todas las funcionalidades principales', () => {
      const business = LIMITES_PLANES[PlanSuscripcion.BUSINESS];
      expect(business.permiteGraficosFormulas).toBe(true);
      expect(business.permiteReportesPDF).toBe(true);
      expect(business.permiteHistorialCompleto).toBe(true);
      expect(business.permiteDatosPermanentes).toBe(true);
    });

    it('ENTERPRISE debe tener todas las funcionalidades incluyendo IA', () => {
      const enterprise = LIMITES_PLANES[PlanSuscripcion.ENTERPRISE];
      expect(enterprise.permiteAlertasWhatsApp).toBe(true);
      expect(enterprise.permiteGestionIA).toBe(true);
      expect(enterprise.permiteCapacitacionPersonalizada).toBe(true);
    });
  });

  describe('obtenerLimitesPlan', () => {
    it('debe retornar los límites del plan DEMO', () => {
      const limites = obtenerLimitesPlan(PlanSuscripcion.DEMO);
      expect(limites.nombre).toBe('Demo Gratuita');
      expect(limites.maxMateriasPrimas).toBe(10);
    });

    it('debe retornar los límites del plan STARTER', () => {
      const limites = obtenerLimitesPlan(PlanSuscripcion.STARTER);
      expect(limites.nombre).toBe('Starter');
      expect(limites.precioMensual).toBe(35);
    });
  });

  describe('obtenerPrecioPlan', () => {
    it('debe retornar precio mensual correcto', () => {
      expect(obtenerPrecioPlan(PlanSuscripcion.STARTER, PeriodoFacturacion.MENSUAL)).toBe(35);
      expect(obtenerPrecioPlan(PlanSuscripcion.BUSINESS, PeriodoFacturacion.MENSUAL)).toBe(99);
      expect(obtenerPrecioPlan(PlanSuscripcion.ENTERPRISE, PeriodoFacturacion.MENSUAL)).toBe(229);
    });

    it('debe retornar precio anual correcto', () => {
      expect(obtenerPrecioPlan(PlanSuscripcion.STARTER, PeriodoFacturacion.ANUAL)).toBe(350);
      expect(obtenerPrecioPlan(PlanSuscripcion.BUSINESS, PeriodoFacturacion.ANUAL)).toBe(990);
      expect(obtenerPrecioPlan(PlanSuscripcion.ENTERPRISE, PeriodoFacturacion.ANUAL)).toBe(2290);
    });

    it('DEMO siempre debe ser 0', () => {
      expect(obtenerPrecioPlan(PlanSuscripcion.DEMO, PeriodoFacturacion.MENSUAL)).toBe(0);
      expect(obtenerPrecioPlan(PlanSuscripcion.DEMO, PeriodoFacturacion.ANUAL)).toBe(0);
    });
  });

  describe('obtenerLimiteRecurso', () => {
    it('debe retornar límite numérico correcto', () => {
      expect(obtenerLimiteRecurso(PlanSuscripcion.DEMO, 'maxMateriasPrimas')).toBe(10);
      expect(obtenerLimiteRecurso(PlanSuscripcion.STARTER, 'maxProveedores')).toBe(30);
      expect(obtenerLimiteRecurso(PlanSuscripcion.ENTERPRISE, 'maxMateriasPrimas')).toBeNull();
    });
  });

  describe('planPermiteFuncionalidad', () => {
    it('debe retornar true para funcionalidades permitidas', () => {
      expect(planPermiteFuncionalidad(PlanSuscripcion.BUSINESS, 'permiteReportesPDF')).toBe(true);
      expect(planPermiteFuncionalidad(PlanSuscripcion.ENTERPRISE, 'permiteGestionIA')).toBe(true);
    });

    it('debe retornar false para funcionalidades no permitidas', () => {
      expect(planPermiteFuncionalidad(PlanSuscripcion.DEMO, 'permiteReportesPDF')).toBe(false);
      expect(planPermiteFuncionalidad(PlanSuscripcion.STARTER, 'permiteGraficosFormulas')).toBe(false);
    });
  });
});

