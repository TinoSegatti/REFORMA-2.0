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

const router = express.Router();

router.use(authenticateToken);

router.get('/granja/:idGranja/export', exportarArchivosController);
router.get('/granja/:idGranja', listarArchivos);
router.post('/granja/:idGranja', crearArchivo);
router.get('/granja/:idGranja/:idArchivo', obtenerArchivoDetalle);
router.delete('/granja/:idGranja/:idArchivo', eliminarArchivoController);

export default router;


