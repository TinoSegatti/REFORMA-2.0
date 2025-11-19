/**
 * Rutas de Compras
 */

import express from 'express';
import {
  registrarCompra,
  obtenerCompras,
  obtenerCompraPorId,
  obtenerEstadisticas,
  obtenerGastosPorProveedor,
  obtenerHistorialPreciosMateriaPrima,
  obtenerUltimoPrecioMateriaPrima,
  agregarItem,
  agregarMultiplesItems,
  editarItem,
  eliminarItem,
  eliminarTodosLosItems,
  editarCabeceraCompra,
  eliminarCompraEndpoint,
  eliminarTodasLasComprasCtrl,
  restaurarCompraCtrl,
  obtenerComprasEliminadasCtrl,
  exportarComprasCtrl
} from '../controllers/compraController';
import { authenticateToken } from '../middleware/authMiddleware';
import { validarAccesoGranja } from '../middleware/validarAccesoGranja';
import { validateComprasLimit } from '../middleware/validatePlanLimits';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de compras (todas requieren validar acceso a granja)
// IMPORTANTE: Las rutas más específicas deben ir ANTES que las rutas con parámetros
router.post('/granja/:idGranja/compras', validarAccesoGranja, validateComprasLimit, registrarCompra);
router.get('/granja/:idGranja/compras/export', validarAccesoGranja, exportarComprasCtrl);
router.get('/granja/:idGranja/compras/estadisticas', validarAccesoGranja, obtenerEstadisticas);
router.get('/granja/:idGranja/compras/eliminadas', validarAccesoGranja, obtenerComprasEliminadasCtrl);
router.delete('/granja/:idGranja/compras', validarAccesoGranja, eliminarTodasLasComprasCtrl);
router.get('/granja/:idGranja/compras', validarAccesoGranja, obtenerCompras);
router.post('/granja/:idGranja/compras/:id/restaurar', validarAccesoGranja, restaurarCompraCtrl);
router.get('/granja/:idGranja/compras/:id', validarAccesoGranja, obtenerCompraPorId);
router.put('/granja/:idGranja/compras/:id', validarAccesoGranja, editarCabeceraCompra);
router.delete('/granja/:idGranja/compras/:id', validarAccesoGranja, eliminarCompraEndpoint);

// Rutas de items de compra (todas requieren validar acceso a granja)
router.post('/granja/:idGranja/compras/:id/items', validarAccesoGranja, agregarItem);
router.post('/granja/:idGranja/compras/:id/items/multiples', validarAccesoGranja, agregarMultiplesItems);
router.put('/granja/:idGranja/compras/:id/items/:detalleId', validarAccesoGranja, editarItem);
router.delete('/granja/:idGranja/compras/:id/items', validarAccesoGranja, eliminarTodosLosItems);
router.delete('/granja/:idGranja/compras/:id/items/:detalleId', validarAccesoGranja, eliminarItem);

// Rutas auxiliares (requieren validar acceso a granja cuando tienen idGranja)
router.get('/granja/:idGranja/proveedores/gastos', validarAccesoGranja, obtenerGastosPorProveedor);
router.get('/materia-prima/:idMateriaPrima/precios', obtenerHistorialPreciosMateriaPrima);
router.get('/granja/:idGranja/materia-prima/:idMateriaPrima/ultimo-precio', validarAccesoGranja, obtenerUltimoPrecioMateriaPrima);

export default router;
