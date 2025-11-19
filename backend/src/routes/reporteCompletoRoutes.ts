/**
 * Rutas para el reporte completo
 */

import express from 'express';
import { obtenerReporteCompleto } from '../controllers/reporteCompletoController';
import { authenticateToken } from '../middleware/authMiddleware';
import { validarAccesoGranja } from '../middleware/validarAccesoGranja';
import { validateEnterprisePlan } from '../middleware/validatePlanLimits';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener reporte completo (requiere plan ENTERPRISE y validar acceso a granja)
router.get('/granja/:idGranja/reporte-completo', validarAccesoGranja, validateEnterprisePlan, obtenerReporteCompleto);

export default router;

