/**
 * Middleware para validar importaciones CSV según el plan del usuario
 * 
 * Reglas:
 * - DEMO: Solo Materias Primas, Proveedores
 * - STARTER: Solo Materias Primas, Proveedores
 * - BUSINESS / ENTERPRISE: Materias Primas, Proveedores, Fórmulas, Piensos
 * - Siempre solo si no hay datos previos
 * - Bloquear importación de tablas que intervienen en cálculos (Compras, Fabricaciones, Inventario)
 */

import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { obtenerPlanEfectivo } from './validatePlanLimits';
import { obtenerLimitesPlan, PlanSuscripcion } from '../constants/planes';

export interface ImportRequest extends Request {
  userId?: string;
}

type TablaImportable = 'materias-primas' | 'proveedores' | 'formulas' | 'piensos' | 'compras' | 'fabricaciones' | 'inventario';

/**
 * Middleware para validar importación CSV según plan y tipo de tabla
 */
export function validateImportacionCSV(tabla: TablaImportable) {
  return async (req: ImportRequest, res: Response, next: NextFunction) => {
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

      // Verificar que el plan permite importación CSV
      if (!limites.permiteImportacionCSV) {
        return res.status(403).json({
          error: 'La importación CSV no está disponible en tu plan',
          plan: plan,
          puedeUpgrade: true
        });
      }

      // Tablas que intervienen en cálculos - BLOQUEADAS para todos los planes
      const tablasBloqueadas: TablaImportable[] = ['compras', 'fabricaciones', 'inventario'];
      if (tablasBloqueadas.includes(tabla)) {
        return res.status(403).json({
          error: `La importación de ${tabla} no está permitida. Esta tabla interviene en cálculos del sistema y solo puede ser gestionada manualmente.`,
          tabla: tabla
        });
      }

      // Validar según plan qué tablas se pueden importar
      let tablasPermitidas: TablaImportable[] = [];
      
      if (plan === PlanSuscripcion.DEMO || plan === PlanSuscripcion.STARTER) {
        // DEMO y STARTER: Solo Materias Primas y Proveedores
        tablasPermitidas = ['materias-primas', 'proveedores'];
      } else if (plan === PlanSuscripcion.BUSINESS || plan === PlanSuscripcion.ENTERPRISE) {
        // BUSINESS y ENTERPRISE: Materias Primas, Proveedores, Fórmulas, Piensos
        tablasPermitidas = ['materias-primas', 'proveedores', 'formulas', 'piensos'];
      }

      if (!tablasPermitidas.includes(tabla)) {
        return res.status(403).json({
          error: `La importación de ${tabla} no está disponible en tu plan ${plan}`,
          plan: plan,
          tablasPermitidas: tablasPermitidas,
          puedeUpgrade: plan !== PlanSuscripcion.ENTERPRISE
        });
      }

      // Validar que solo se puede importar 1 vez cuando está vacío
      let tieneDatosPrevios = false;
      
      switch (tabla) {
        case 'materias-primas':
          tieneDatosPrevios = (await prisma.materiaPrima.count({ where: { idGranja: granjaId } })) > 0;
          break;
        case 'proveedores':
          tieneDatosPrevios = (await prisma.proveedor.count({ where: { idGranja: granjaId } })) > 0;
          break;
        case 'formulas':
          tieneDatosPrevios = (await prisma.formulaCabecera.count({ where: { idGranja: granjaId } })) > 0;
          break;
        case 'piensos':
          tieneDatosPrevios = (await prisma.animal.count({ where: { idGranja: granjaId } })) > 0;
          break;
      }

      if (tieneDatosPrevios) {
        return res.status(400).json({
          error: `Ya existen ${tabla} registrados. La importación solo está disponible cuando la tabla está vacía.`,
          tabla: tabla
        });
      }

      next();
    } catch (error: any) {
      console.error('Error validando importación CSV:', error);
      return res.status(500).json({ error: 'Error validando importación CSV' });
    }
  };
}

