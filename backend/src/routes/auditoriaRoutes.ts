/**
 * Rutas de Auditoría
 */

import express from 'express';
import {
  obtenerAuditoriaCtrl,
  obtenerEstadisticasAuditoriaCtrl
} from '../controllers/auditoriaController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de auditoría
router.get('/granja/:idGranja', obtenerAuditoriaCtrl);
router.get('/granja/:idGranja/estadisticas', obtenerEstadisticasAuditoriaCtrl);

export default router;

