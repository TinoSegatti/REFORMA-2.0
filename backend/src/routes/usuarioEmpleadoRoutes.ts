/**
 * Rutas para gestión de usuarios empleados
 */

import express from 'express';
import {
  generarCodigoReferenciaCtrl,
  regenerarCodigoReferenciaCtrl,
  obtenerUsuariosEmpleadosCtrl,
  obtenerLimiteUsuariosCtrl,
  vincularEmpleadoCtrl,
  eliminarEmpleadoCtrl,
  cambiarRolEmpleadoCtrl
} from '../controllers/usuarioEmpleadoController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Generar código de referencia
router.get('/codigo-referencia', generarCodigoReferenciaCtrl);

// Regenerar código de referencia
router.post('/codigo-referencia/regenerar', regenerarCodigoReferenciaCtrl);

// Obtener lista de empleados
router.get('/', obtenerUsuariosEmpleadosCtrl);

// Obtener límite de usuarios empleados
router.get('/limite', obtenerLimiteUsuariosCtrl);

// Vincular empleado mediante código de referencia
router.post('/vincular', vincularEmpleadoCtrl);

// Eliminar (desvincular) empleado
router.delete('/:empleadoId', eliminarEmpleadoCtrl);

// Cambiar rol de empleado
router.put('/:empleadoId/rol', cambiarRolEmpleadoCtrl);

export default router;


