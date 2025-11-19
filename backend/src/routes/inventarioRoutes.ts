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
import { validarAccesoGranja } from '../middleware/validarAccesoGranja';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de inventario (todas requieren validar acceso a granja)
router.get('/granja/:idGranja/inventario/export', validarAccesoGranja, exportarInventario);
router.get('/granja/:idGranja/inventario', validarAccesoGranja, obtenerInventario);
router.get('/granja/:idGranja/inventario/estadisticas', validarAccesoGranja, obtenerEstadisticasInventario);
router.post('/granja/:idGranja/inventario/inicializar', validarAccesoGranja, inicializarInventario);
router.put('/granja/:idGranja/inventario/:id/cantidad-real', validarAccesoGranja, actualizarCantidadReal);
router.post('/granja/:idGranja/inventario/recalcular', validarAccesoGranja, recalcularInventario);
router.delete('/granja/:idGranja/inventario', validarAccesoGranja, vaciarInventario);

export default router;