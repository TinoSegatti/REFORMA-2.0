/**
 * Rutas de Materias Primas
 */

import express from 'express';
import {
  obtenerMateriasPrimas,
  crearMateriaPrima,
  actualizarMateriaPrima,
  eliminarMateriaPrima
} from '../controllers/materiaPrimaController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/:idGranja', obtenerMateriasPrimas);
router.post('/:idGranja', crearMateriaPrima);
router.put('/:idGranja/:id', actualizarMateriaPrima);
router.delete('/:idGranja/:id', eliminarMateriaPrima);

export default router;


