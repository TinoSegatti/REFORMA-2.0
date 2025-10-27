/**
 * Rutas de Fórmulas
 */

import express from 'express';
import {
  crearNuevaFormula,
  obtenerFormulas,
  obtenerFormulaDetalle,
  recalcularFormula,
  actualizarFormula,
  eliminarFormula
} from '../controllers/formulaController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.post('/', crearNuevaFormula);
router.get('/:idGranja', obtenerFormulas);
router.get('/detalle/:idFormula', obtenerFormulaDetalle);
router.post('/:idFormula/recalcular', recalcularFormula);
router.put('/:idFormula', actualizarFormula);
router.delete('/:idFormula', eliminarFormula);

export default router;

