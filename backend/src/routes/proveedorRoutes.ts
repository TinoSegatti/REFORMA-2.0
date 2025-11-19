/**
 * Rutas de Proveedores
 */

import express from 'express';
import {
  obtenerProveedores,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor,
  obtenerEstadisticasProveedores,
  importarProveedores,
  exportarProveedores
} from '../controllers/proveedorController';
import { authenticateToken } from '../middleware/authMiddleware';
import { validarAccesoGranja } from '../middleware/validarAccesoGranja';
import { validateProveedoresLimit } from '../middleware/validatePlanLimits';
import { validateImportacionCSV } from '../middleware/validateImportacionCSV';
import { uploadCsv } from '../middleware/uploadMiddleware';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Todas las rutas requieren validar acceso a granja
router.post('/:idGranja/import', validarAccesoGranja, uploadCsv.single('file'), validateImportacionCSV('proveedores'), importarProveedores);
router.get('/:idGranja/export', validarAccesoGranja, exportarProveedores);
router.get('/:idGranja/estadisticas', validarAccesoGranja, obtenerEstadisticasProveedores);
router.get('/:idGranja', validarAccesoGranja, obtenerProveedores);
router.post('/:idGranja', validarAccesoGranja, validateProveedoresLimit, crearProveedor);
router.put('/:idGranja/:id', validarAccesoGranja, actualizarProveedor);
router.delete('/:idGranja/:id', validarAccesoGranja, eliminarProveedor);

export default router;

