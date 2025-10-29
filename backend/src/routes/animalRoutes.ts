/**
 * Rutas de Animales
 */

import express from 'express';
import {
  obtenerAnimales,
  crearAnimal,
  actualizarAnimal,
  eliminarAnimal
} from '../controllers/animalController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/:idGranja', obtenerAnimales);
router.post('/:idGranja', crearAnimal);
router.put('/:idGranja/:id', actualizarAnimal);
router.delete('/:idGranja/:id', eliminarAnimal);

export default router;


