'use strict';

/**
 * Rutas de Archivos (Snapshots)
 */

import express from 'express';
import {
  crearArchivo,
  eliminarArchivoController,
  listarArchivos,
  obtenerArchivoDetalle,
  exportarArchivosController,
} from '../controllers/archivoController';
import { authenticateToken } from '../middleware/authMiddleware';
import { validarAccesoGranja } from '../middleware/validarAccesoGranja';
import { validateArchivosHistoricosLimit } from '../middleware/validatePlanLimits';

const router = express.Router();

router.use(authenticateToken);

// Todas las rutas requieren validar acceso a granja
router.get('/granja/:idGranja/export', validarAccesoGranja, exportarArchivosController);
router.get('/granja/:idGranja', validarAccesoGranja, listarArchivos);
router.post('/granja/:idGranja', validarAccesoGranja, validateArchivosHistoricosLimit, crearArchivo);
router.get('/granja/:idGranja/:idArchivo', validarAccesoGranja, obtenerArchivoDetalle);
router.delete('/granja/:idGranja/:idArchivo', validarAccesoGranja, eliminarArchivoController);

export default router;


