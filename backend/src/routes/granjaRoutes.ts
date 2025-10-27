/**
 * Rutas de Granjas
 */

import express from 'express';
import {
  obtenerGranjas,
  crearGranja,
  actualizarGranja,
  eliminarGranja,
  obtenerGranja
} from '../controllers/granjaController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', obtenerGranjas);
router.post('/', crearGranja);
router.get('/:idGranja', obtenerGranja);
router.put('/:idGranja', actualizarGranja);
router.delete('/:idGranja', eliminarGranja);

export default router;

