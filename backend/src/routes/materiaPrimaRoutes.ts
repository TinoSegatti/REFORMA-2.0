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
import { validarAccesoGranja } from '../middleware/validarAccesoGranja';
import { validateMateriasPrimasLimit } from '../middleware/validatePlanLimits';
import { validateImportacionCSV } from '../middleware/validateImportacionCSV';
import { uploadCsv } from '../middleware/uploadMiddleware';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Todas las rutas requieren validar acceso a granja
router.post('/:idGranja/import', validarAccesoGranja, uploadCsv.single('file'), validateImportacionCSV('materias-primas'), importarMateriasPrimas);
router.get('/:idGranja/export', validarAccesoGranja, exportarMateriasPrimas);
router.get('/:idGranja', validarAccesoGranja, obtenerMateriasPrimas);
router.post('/:idGranja', validarAccesoGranja, validateMateriasPrimasLimit, crearMateriaPrima);
router.put('/:idGranja/:id', validarAccesoGranja, actualizarMateriaPrima);
router.delete('/:idGranja/:id', validarAccesoGranja, eliminarMateriaPrima);

export default router;


