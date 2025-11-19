/**
 * Rutas de Animales
 */

import express from 'express';
import {
  obtenerAnimales,
  crearAnimal,
  actualizarAnimal,
  eliminarAnimal,
  importarAnimales,
  exportarAnimales
} from '../controllers/animalController';
import { authenticateToken } from '../middleware/authMiddleware';
import { validarAccesoGranja } from '../middleware/validarAccesoGranja';
import { validateImportacionCSV } from '../middleware/validateImportacionCSV';
import { uploadCsv } from '../middleware/uploadMiddleware';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.post('/:idGranja/import', validarAccesoGranja, uploadCsv.single('file'), validateImportacionCSV('piensos'), importarAnimales);
router.get('/:idGranja/export', validarAccesoGranja, exportarAnimales);
router.get('/:idGranja', validarAccesoGranja, obtenerAnimales);
router.post('/:idGranja', validarAccesoGranja, crearAnimal);
router.put('/:idGranja/:id', validarAccesoGranja, actualizarAnimal);
router.delete('/:idGranja/:id', validarAccesoGranja, eliminarAnimal);

export default router;


