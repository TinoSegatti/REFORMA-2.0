/**
 * Rutas de Fabricaciones
 */

import express from 'express';
import {
  obtenerFabricaciones,
  crearNuevaFabricacion,
  obtenerFabricacionDetalle,
  editarFabricacionCtrl,
  eliminarFabricacionCtrl,
  obtenerEstadisticas,
  eliminarTodasLasFabricacionesCtrl,
  obtenerFabricacionesEliminadasCtrl,
  exportarFabricacionesCtrl,
  verificarExistenciasFabricacionCtrl
} from '../controllers/fabricacionController';
import { authenticateToken } from '../middleware/authMiddleware';
import { validarAccesoGranja } from '../middleware/validarAccesoGranja';
import { validateFabricacionesLimit } from '../middleware/validatePlanLimits';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas que requieren idGranja en parámetros
router.get('/:idGranja/export', validarAccesoGranja, exportarFabricacionesCtrl);
router.get('/:idGranja', validarAccesoGranja, obtenerFabricaciones);
router.get('/:idGranja/estadisticas', validarAccesoGranja, obtenerEstadisticas);
router.delete('/:idGranja/todas', validarAccesoGranja, eliminarTodasLasFabricacionesCtrl);
// Ruta deprecada - las fabricaciones ahora se eliminan permanentemente
router.get('/:idGranja/eliminadas', validarAccesoGranja, obtenerFabricacionesEliminadasCtrl);

// Rutas que requieren idGranja en el body (el middleware lo buscará en el body)
router.post('/verificar-existencias', validarAccesoGranja, verificarExistenciasFabricacionCtrl);
router.post('/', validarAccesoGranja, validateFabricacionesLimit, crearNuevaFabricacion);
router.get('/detalle/:idFabricacion', obtenerFabricacionDetalle);
router.put('/:idFabricacion', editarFabricacionCtrl);
router.delete('/:idFabricacion', eliminarFabricacionCtrl);
// Ruta eliminada - las fabricaciones ahora se eliminan permanentemente y no se pueden restaurar

export default router;

