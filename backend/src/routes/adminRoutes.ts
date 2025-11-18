/**
 * Rutas para administración de usuarios de testing
 * Solo accesibles para el superusuario
 */

import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Todas las rutas requieren autenticación y ser superusuario
router.use(authenticateToken);
router.use(adminController.esSuperusuario);

// Rutas
router.get('/usuarios-testing', adminController.obtenerUsuariosTesting);
router.post('/usuarios-testing', adminController.crearUsuarioTesting);
router.put('/usuarios-testing/:usuarioId/plan', adminController.actualizarPlanUsuario);
router.delete('/usuarios-testing/:usuarioId', adminController.eliminarUsuarioTesting);

// Ruta pública para verificar si es superusuario (sin restricción de superusuario)
router.get('/verificar-superusuario', authenticateToken, adminController.verificarSuperusuario);

export default router;

