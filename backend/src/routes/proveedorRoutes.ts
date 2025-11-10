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
import { uploadCsv } from '../middleware/uploadMiddleware';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.post('/:idGranja/import', uploadCsv.single('file'), importarProveedores);
router.get('/:idGranja/export', exportarProveedores);
router.get('/:idGranja/estadisticas', obtenerEstadisticasProveedores);
router.get('/:idGranja', obtenerProveedores);
router.post('/:idGranja', crearProveedor);
router.put('/:idGranja/:id', actualizarProveedor);
router.delete('/:idGranja/:id', eliminarProveedor);

export default router;

