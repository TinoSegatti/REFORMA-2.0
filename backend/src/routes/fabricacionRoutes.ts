/**
 * Rutas de Fabricaciones
 */

import express from 'express';
import {
  obtenerFabricaciones,
  crearNuevaFabricacion,
  obtenerFabricacionDetalle,
  editarFabricacionCtrl,
  eliminarFabricacionCtrl,
  obtenerEstadisticas,
  eliminarTodasLasFabricacionesCtrl,
  restaurarFabricacionCtrl,
  obtenerFabricacionesEliminadasCtrl
} from '../controllers/fabricacionController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/:idGranja', obtenerFabricaciones);
router.post('/', crearNuevaFabricacion);
router.get('/detalle/:idFabricacion', obtenerFabricacionDetalle);
router.put('/:idFabricacion', editarFabricacionCtrl);
router.get('/:idGranja/estadisticas', obtenerEstadisticas);
router.delete('/:idGranja/todas', eliminarTodasLasFabricacionesCtrl);
router.delete('/:idFabricacion', eliminarFabricacionCtrl);
router.post('/:idFabricacion/restaurar', restaurarFabricacionCtrl);
router.get('/:idGranja/eliminadas', obtenerFabricacionesEliminadasCtrl);

export default router;

