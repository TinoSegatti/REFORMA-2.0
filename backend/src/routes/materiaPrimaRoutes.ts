/**
 * Rutas de Materias Primas
 */

import express from 'express';
import {
  obtenerMateriasPrimas,
  crearMateriaPrima,
  actualizarMateriaPrima,
  eliminarMateriaPrima,
  importarMateriasPrimas,
  exportarMateriasPrimas
} from '../controllers/materiaPrimaController';
import { authenticateToken } from '../middleware/authMiddleware';
import { uploadCsv } from '../middleware/uploadMiddleware';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.post('/:idGranja/import', uploadCsv.single('file'), importarMateriasPrimas);
router.get('/:idGranja/export', exportarMateriasPrimas);
router.get('/:idGranja', obtenerMateriasPrimas);
router.post('/:idGranja', crearMateriaPrima);
router.put('/:idGranja/:id', actualizarMateriaPrima);
router.delete('/:idGranja/:id', eliminarMateriaPrima);

export default router;


