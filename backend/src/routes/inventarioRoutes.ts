/**
 * Rutas de Inventario
 */

import express from 'express';
import {
  obtenerInventario,
  actualizarCantidadRealInventario,
  recalcularInventarioGranja,
  obtenerEstadisticasInventario
} from '../controllers/inventarioController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/:idGranja', obtenerInventario);
router.put('/:idGranja/:idMateriaPrima/cantidad-real', actualizarCantidadRealInventario);
router.post('/:idGranja/recalcular', recalcularInventarioGranja);
router.get('/:idGranja/estadisticas', obtenerEstadisticasInventario);

export default router;

