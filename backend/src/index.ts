/**
 * Backend - Sistema de Gestión de Granjas
 * Punto de entrada principal del servidor
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importar rutas (se crearán a continuación)
// import authRoutes from './routes/auth';
// import granjaRoutes from './routes/granjas';
// import inventarioRoutes from './routes/inventario';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());

// IMPORTANTE: Webhooks deben estar ANTES de los middlewares globales
// Webhook de Mercado Pago usa JSON
app.use('/api/suscripcion/webhook/mercadopago', express.json());

// Webhook de Twilio (CORINA) - debe estar ANTES de express.urlencoded()
// Importar y registrar ANTES de los middlewares globales
import corinaRoutes from './routes/corinaRoutes';
app.use('/api/corina', corinaRoutes);

// Middlewares globales (después de webhooks específicos)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', async (req, res) => {
  let dbStatus = 'connected';
  let dbMessage = 'Database is reachable';
  let dbError = null;
  
  try {
    // Probar conexión a la base de datos usando el mismo prisma que usa el resto de la app
    const prisma = (await import('./lib/prisma')).default;
    await prisma.$queryRaw`SELECT 1`;
  } catch (error: any) {
    dbStatus = 'degraded';
    dbMessage = `Database connection error: ${error.message}`;
    dbError = {
      code: error.code || 'UNKNOWN',
      message: error.message,
      isP1001: error.code === 'P1001'
    };
    console.error('Health check DB error:', error);
  }

  const statusCode = dbStatus === 'connected' ? 200 : 503;
  
  res.status(statusCode).json({ 
    status: dbStatus === 'connected' ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus,
      message: dbMessage,
      ...(dbError && { error: dbError })
    },
    ...(dbStatus === 'degraded' && {
      troubleshooting: {
        message: 'El servidor está funcionando pero no puede conectar a la base de datos.',
        steps: [
          '1. Verifica que el proyecto de Supabase esté activo (no pausado)',
          '2. Verifica las variables de entorno DATABASE_URL y DIRECT_URL en Render',
          '3. Verifica Network Restrictions en Supabase Dashboard',
          '4. Revisa los logs de Render para más detalles'
        ]
      }
    })
  });
});

// Importar rutas
import usuarioRoutes from './routes/usuarioRoutes';
import granjaRoutes from './routes/granjaRoutes';
import inventarioRoutes from './routes/inventarioRoutes';
import compraRoutes from './routes/compraRoutes';
import formulaRoutes from './routes/formulaRoutes';
import fabricacionRoutes from './routes/fabricacionRoutes';
import materiaPrimaRoutes from './routes/materiaPrimaRoutes';
import proveedorRoutes from './routes/proveedorRoutes';
import animalRoutes from './routes/animalRoutes';
import auditoriaRoutes from './routes/auditoriaRoutes';
import archivoRoutes from './routes/archivoRoutes';
import reporteCompletoRoutes from './routes/reporteCompletoRoutes';
import suscripcionRoutes from './routes/suscripcionRoutes';
import adminRoutes from './routes/adminRoutes';
import usuarioEmpleadoRoutes from './routes/usuarioEmpleadoRoutes';
// corinaRoutes ya se importó arriba para registrar antes de middlewares globales

// Rutas
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/granjas', granjaRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/compras', compraRoutes);
app.use('/api/formulas', formulaRoutes);
app.use('/api/fabricaciones', fabricacionRoutes);
app.use('/api/materias-primas', materiaPrimaRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/animales', animalRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api/archivos', archivoRoutes);
app.use('/api/reporte', reporteCompletoRoutes);
app.use('/api/suscripcion', suscripcionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/usuarios/empleados', usuarioEmpleadoRoutes);
// app.use('/api/corina', corinaRoutes); // Ya se registró arriba antes de middlewares globales

// Manejo de errores
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    status: err.status || 500
  });
});

// Iniciar job de limpieza DEMO (solo en producción o si está habilitado)
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_DEMO_CLEANUP === 'true') {
  try {
    const { iniciarJobLimpiezaDemo } = require('./jobs/demoCleanupJob');
    iniciarJobLimpiezaDemo();
    console.log('✅ Job de limpieza DEMO iniciado');
  } catch (error) {
    console.error('❌ Error iniciando job de limpieza DEMO:', error);
  }
}

// Endpoint para ejecutar limpieza DEMO manualmente (solo para desarrollo/testing)
if (process.env.NODE_ENV !== 'production') {
  app.post('/api/admin/demo-cleanup/manual', async (req, res) => {
    try {
      const { ejecutarJobLimpiezaDemoManual } = require('./jobs/demoCleanupJob');
      const resultado = await ejecutarJobLimpiezaDemoManual();
      res.json({
        mensaje: 'Limpieza DEMO ejecutada manualmente',
        resultado
      });
    } catch (error: any) {
      console.error('Error ejecutando limpieza DEMO manual:', error);
      res.status(500).json({
        error: 'Error ejecutando limpieza DEMO',
        detalles: error.message
      });
    }
  });
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;


