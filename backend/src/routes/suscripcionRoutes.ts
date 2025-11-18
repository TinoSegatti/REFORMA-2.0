/**
 * Rutas para gestión de suscripciones
 */

import { Router } from 'express';
import * as suscripcionController from '../controllers/suscripcionController';
import * as webhookMercadoPagoController from '../controllers/webhookMercadoPagoController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// IMPORTANTE: Webhook debe estar antes de express.json() en index.ts
router.post('/webhook/mercadopago', webhookMercadoPagoController.manejarWebhookMercadoPago);

// Rutas públicas
router.get('/planes', suscripcionController.obtenerPlanes);

// Rutas protegidas (requieren autenticación)
router.get('/mi-plan', authenticateToken, suscripcionController.obtenerMiPlan);
router.post('/crear-checkout', authenticateToken, suscripcionController.crearCheckout);
router.post('/cambiar-plan', authenticateToken, suscripcionController.cambiarPlan);
router.post('/cancelar', authenticateToken, suscripcionController.cancelarSuscripcionCtrl);
router.post('/reactivar', authenticateToken, suscripcionController.reactivarSuscripcionCtrl);
router.get('/verificar-pago', authenticateToken, suscripcionController.verificarPago);

export default router;

