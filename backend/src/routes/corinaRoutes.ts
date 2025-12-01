/**
 * Rutas para el sistema CORINA
 */

import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { validateEnterpriseFeature } from '../middleware/validateEnterpriseFeature';
import {
  handleWhatsAppWebhook,
  handleWhatsAppStatus,
  obtenerInteracciones,
  obtenerNotificaciones,
  obtenerEstadoConfiguracion,
  configurarNotificaciones,
  iniciarVerificacionTelefono,
  verificarCodigoTelefono,
} from '../controllers/corinaController';

const router = express.Router();

// Webhook de Twilio (debe estar antes de otros middlewares que parsean JSON)
// IMPORTANTE: Twilio envía datos como application/x-www-form-urlencoded
// express.raw() mantiene el body como Buffer sin parsear
router.post(
  '/whatsapp/webhook',
  express.raw({ 
    type: 'application/x-www-form-urlencoded',
    limit: '10mb' // Límite para archivos de audio
  }),
  handleWhatsAppWebhook
);

// Status callback de Twilio (para recibir actualizaciones de estado de mensajes)
router.get(
  '/whatsapp/status',
  express.raw({ type: 'application/x-www-form-urlencoded' }),
  handleWhatsAppStatus
);
router.post(
  '/whatsapp/status',
  express.raw({ type: 'application/x-www-form-urlencoded' }),
  handleWhatsAppStatus
);

// Rutas protegidas (requieren autenticación y plan ENTERPRISE)
router.get(
  '/interacciones',
  authenticateToken,
  validateEnterpriseFeature,
  obtenerInteracciones
);

router.get(
  '/notificaciones',
  authenticateToken,
  validateEnterpriseFeature,
  obtenerNotificaciones
);

router.get(
  '/estado',
  authenticateToken,
  validateEnterpriseFeature,
  obtenerEstadoConfiguracion
);

router.put(
  '/configurar',
  authenticateToken,
  validateEnterpriseFeature,
  configurarNotificaciones
);

router.post(
  '/whatsapp/verificar-telefono/iniciar',
  authenticateToken,
  validateEnterpriseFeature,
  iniciarVerificacionTelefono
);

router.post(
  '/whatsapp/verificar-telefono/verificar',
  authenticateToken,
  validateEnterpriseFeature,
  verificarCodigoTelefono
);

export default router;

