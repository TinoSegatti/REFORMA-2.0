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

// IMPORTANTE: Webhook de Mercado Pago usa JSON
// Por eso lo configuramos antes de express.json() general
app.use('/api/suscripcion/webhook/mercadopago', express.json());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
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

// Manejo de errores
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    status: err.status || 500
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;


