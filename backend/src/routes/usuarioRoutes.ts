/**
 * Rutas de Usuarios
 */

import express from 'express';
import {
  registrarUsuario,
  loginUsuario,
  obtenerPerfil,
  actualizarPerfil,
  obtenerUsuarios,
  actualizarPlanUsuario,
  verificarEmail,
  reenviarEmailVerificacionCtrl
} from '../controllers/usuarioController';
import {
  googleAuth,
  verifyGoogleToken
} from '../controllers/googleAuthController';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// Rutas públicas
router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);
router.post('/google', googleAuth);
router.post('/google/verify', verifyGoogleToken);
router.post('/verificar-email', verificarEmail);
router.post('/reenviar-verificacion', reenviarEmailVerificacionCtrl);

// Rutas protegidas (requieren autenticación)
router.get('/perfil', authenticateToken, obtenerPerfil);
router.put('/perfil', authenticateToken, actualizarPerfil);

// Rutas de administrador
router.get('/usuarios', authenticateToken, requireAdmin, obtenerUsuarios);
router.put('/usuarios/:usuarioId/plan', authenticateToken, requireAdmin, actualizarPlanUsuario);

export default router;

