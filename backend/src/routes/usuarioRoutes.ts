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
  actualizarPlanUsuario
} from '../controllers/usuarioController';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// Rutas públicas
router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);

// Rutas protegidas (requieren autenticación)
router.get('/perfil', authenticateToken, obtenerPerfil);
router.put('/perfil', authenticateToken, actualizarPerfil);

// Rutas de administrador
router.get('/usuarios', authenticateToken, requireAdmin, obtenerUsuarios);
router.put('/usuarios/:usuarioId/plan', authenticateToken, requireAdmin, actualizarPlanUsuario);

export default router;

