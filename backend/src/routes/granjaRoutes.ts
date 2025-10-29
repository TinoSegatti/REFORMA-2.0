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
import {
  importarMateriasPrimasController,
  importarProveedoresController
} from '../controllers/importDataController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', obtenerGranjas);
router.post('/', crearGranja);
router.get('/:idGranja', obtenerGranja);
router.put('/:idGranja', actualizarGranja);
router.delete('/:idGranja', eliminarGranja);

// Importar datos
router.post('/importar/materias-primas', importarMateriasPrimasController);
router.post('/importar/proveedores', importarProveedoresController);

export default router;

