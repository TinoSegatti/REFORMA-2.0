import { Router } from 'express';
import {
  obtenerInventario,
  obtenerEstadisticasInventario,
  inicializarInventario,
  actualizarCantidadReal,
  recalcularInventario,
  vaciarInventario,
  exportarInventario
} from '../controllers/inventarioController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de inventario
router.get('/granja/:idGranja/inventario/export', exportarInventario);
router.get('/granja/:idGranja/inventario', obtenerInventario);
router.get('/granja/:idGranja/inventario/estadisticas', obtenerEstadisticasInventario);
router.post('/granja/:idGranja/inventario/inicializar', inicializarInventario);
router.put('/granja/:idGranja/inventario/:id/cantidad-real', actualizarCantidadReal);
router.post('/granja/:idGranja/inventario/recalcular', recalcularInventario);
router.delete('/granja/:idGranja/inventario', vaciarInventario);

export default router;