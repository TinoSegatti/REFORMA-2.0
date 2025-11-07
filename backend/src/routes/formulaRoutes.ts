import { Router } from 'express';
import { 
  obtenerFormulas, 
  obtenerEstadisticasFormulas,
  crearFormula, 
  obtenerFormulaPorId,
  actualizarFormula,
  eliminarFormula,
  agregarDetalleFormula,
  agregarMultiplesDetallesFormula,
  actualizarDetalleFormula,
  eliminarDetalleFormula,
  actualizarPreciosFormulas
} from '../controllers/formulaController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener todas las fórmulas de una granja
router.get('/granja/:idGranja/formulas', obtenerFormulas);

// Obtener estadísticas de fórmulas
router.get('/granja/:idGranja/formulas/estadisticas', obtenerEstadisticasFormulas);

// Actualizar precios de todas las fórmulas de una granja
router.post('/granja/:idGranja/formulas/actualizar-precios', actualizarPreciosFormulas);

// Crear nueva fórmula
router.post('/granja/:idGranja/formulas', crearFormula);

// Obtener fórmula por ID
router.get('/granja/:idGranja/formulas/:id', obtenerFormulaPorId);

// Actualizar cabecera de fórmula
router.put('/granja/:idGranja/formulas/:id', actualizarFormula);

// Eliminar fórmula
router.delete('/granja/:idGranja/formulas/:id', eliminarFormula);

// Rutas de detalles de fórmula
router.post('/granja/:idGranja/formulas/:id/detalles', agregarDetalleFormula);
router.post('/granja/:idGranja/formulas/:id/detalles/multiples', agregarMultiplesDetallesFormula);
router.put('/granja/:idGranja/formulas/:id/detalles/:detalleId', actualizarDetalleFormula);
router.delete('/granja/:idGranja/formulas/:id/detalles/:detalleId', eliminarDetalleFormula);

export default router;