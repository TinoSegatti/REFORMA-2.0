/**
 * Rutas para el reporte completo
 */

import express from 'express';
import { obtenerReporteCompleto } from '../controllers/reporteCompletoController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener reporte completo
router.get('/granja/:idGranja/reporte-completo', obtenerReporteCompleto);

export default router;

