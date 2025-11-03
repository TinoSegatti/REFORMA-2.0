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
  editarItem,
  eliminarItem,
  editarCabeceraCompra,
  eliminarCompraEndpoint,
  eliminarTodasLasComprasCtrl,
  restaurarCompraCtrl,
  obtenerComprasEliminadasCtrl
} from '../controllers/compraController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de compras
// IMPORTANTE: Las rutas más específicas deben ir ANTES que las rutas con parámetros
router.post('/granja/:idGranja/compras', registrarCompra);
router.get('/granja/:idGranja/compras/estadisticas', obtenerEstadisticas);
router.get('/granja/:idGranja/compras/eliminadas', obtenerComprasEliminadasCtrl);
router.delete('/granja/:idGranja/compras', eliminarTodasLasComprasCtrl);
router.get('/granja/:idGranja/compras', obtenerCompras);
router.post('/granja/:idGranja/compras/:id/restaurar', restaurarCompraCtrl);
router.get('/granja/:idGranja/compras/:id', obtenerCompraPorId);
router.put('/granja/:idGranja/compras/:id', editarCabeceraCompra);
router.delete('/granja/:idGranja/compras/:id', eliminarCompraEndpoint);

// Rutas de items de compra
router.post('/granja/:idGranja/compras/:id/items', agregarItem);
router.put('/granja/:idGranja/compras/:id/items/:detalleId', editarItem);
router.delete('/granja/:idGranja/compras/:id/items/:detalleId', eliminarItem);

// Rutas auxiliares
router.get('/granja/:idGranja/proveedores/gastos', obtenerGastosPorProveedor);
router.get('/materia-prima/:idMateriaPrima/precios', obtenerHistorialPreciosMateriaPrima);
router.get('/granja/:idGranja/materia-prima/:idMateriaPrima/ultimo-precio', obtenerUltimoPrecioMateriaPrima);

export default router;
