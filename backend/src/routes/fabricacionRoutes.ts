/**
 * Rutas de Fabricaciones
 */

import express from 'express';
import {
  obtenerFabricaciones,
  crearNuevaFabricacion,
  obtenerFabricacionDetalle,
  eliminarFabricacionCtrl,
  obtenerEstadisticas
} from '../controllers/fabricacionController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/:idGranja', obtenerFabricaciones);
router.post('/', crearNuevaFabricacion);
router.get('/detalle/:idFabricacion', obtenerFabricacionDetalle);
router.get('/:idGranja/estadisticas', obtenerEstadisticas);
router.delete('/:idFabricacion', eliminarFabricacionCtrl);

export default router;

