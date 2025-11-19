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
  actualizarPreciosFormulas,
  importarFormulas,
  exportarFormulas,
  obtenerHistorialFormula
} from '../controllers/formulaController';
import { authenticateToken } from '../middleware/authMiddleware';
import { validarAccesoGranja } from '../middleware/validarAccesoGranja';
import { validateFormulasLimit } from '../middleware/validatePlanLimits';
import { validateImportacionCSV } from '../middleware/validateImportacionCSV';
import { uploadCsv } from '../middleware/uploadMiddleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Todas las rutas requieren validar acceso a granja
router.post('/granja/:idGranja/formulas/import', validarAccesoGranja, uploadCsv.single('file'), validateImportacionCSV('formulas'), importarFormulas);
router.get('/granja/:idGranja/formulas/export', validarAccesoGranja, exportarFormulas);

// Obtener todas las fórmulas de una granja
router.get('/granja/:idGranja/formulas', validarAccesoGranja, obtenerFormulas);

// Obtener estadísticas de fórmulas
router.get('/granja/:idGranja/formulas/estadisticas', validarAccesoGranja, obtenerEstadisticasFormulas);

// Actualizar precios de todas las fórmulas de una granja
router.post('/granja/:idGranja/formulas/actualizar-precios', validarAccesoGranja, actualizarPreciosFormulas);

// Crear nueva fórmula (con validación de límites)
router.post('/granja/:idGranja/formulas', validarAccesoGranja, validateFormulasLimit, crearFormula);

// Obtener fórmula por ID
router.get('/granja/:idGranja/formulas/:id', validarAccesoGranja, obtenerFormulaPorId);

// Obtener historial de fórmula
router.get('/granja/:idGranja/formulas/:id/historial', validarAccesoGranja, obtenerHistorialFormula);

// Actualizar cabecera de fórmula
router.put('/granja/:idGranja/formulas/:id', validarAccesoGranja, actualizarFormula);

// Eliminar fórmula
router.delete('/granja/:idGranja/formulas/:id', validarAccesoGranja, eliminarFormula);

// Rutas de detalles de fórmula
router.post('/granja/:idGranja/formulas/:id/detalles', validarAccesoGranja, agregarDetalleFormula);
router.post('/granja/:idGranja/formulas/:id/detalles/multiples', validarAccesoGranja, agregarMultiplesDetallesFormula);
router.put('/granja/:idGranja/formulas/:id/detalles/:detalleId', validarAccesoGranja, actualizarDetalleFormula);
router.delete('/granja/:idGranja/formulas/:id/detalles/:detalleId', validarAccesoGranja, eliminarDetalleFormula);

export default router;