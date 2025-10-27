/**
 * Rutas de Compras
 */

import express from 'express';
import {
  registrarCompra,
  obtenerCompras,
  obtenerGastosPorProveedor,
  obtenerHistorialPreciosMateriaPrima,
  eliminarCompraEndpoint
} from '../controllers/compraController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.post('/', registrarCompra);
router.get('/:idGranja', obtenerCompras);
router.get('/:idGranja/proveedores/gastos', obtenerGastosPorProveedor);
router.get('/materia-prima/:idMateriaPrima/precios', obtenerHistorialPreciosMateriaPrima);
router.delete('/:idCompra', eliminarCompraEndpoint);

export default router;

