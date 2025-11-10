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
import { uploadCsv } from '../middleware/uploadMiddleware';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.post('/:idGranja/import', uploadCsv.single('file'), importarAnimales);
router.get('/:idGranja/export', exportarAnimales);
router.get('/:idGranja', obtenerAnimales);
router.post('/:idGranja', crearAnimal);
router.put('/:idGranja/:id', actualizarAnimal);
router.delete('/:idGranja/:id', eliminarAnimal);

export default router;


