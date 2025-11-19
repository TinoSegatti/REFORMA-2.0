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
import { validarAccesoGranja } from '../middleware/validarAccesoGranja';
import { validateGranjasLimit } from '../middleware/validatePlanLimits';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', obtenerGranjas);
router.post('/', validateGranjasLimit, crearGranja);
router.get('/:idGranja', validarAccesoGranja, obtenerGranja);
router.put('/:idGranja', validarAccesoGranja, actualizarGranja);
router.delete('/:idGranja', validarAccesoGranja, eliminarGranja);

// Importar datos
router.post('/importar/materias-primas', importarMateriasPrimasController);
router.post('/importar/proveedores', importarProveedoresController);

export default router;

