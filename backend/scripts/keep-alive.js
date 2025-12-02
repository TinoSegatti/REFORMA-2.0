/**
 * Script Keep-Alive para mantener activo el proyecto de Supabase
 * 
 * Este script ejecuta una query simple para mantener la base de datos activa
 * y prevenir que Supabase pause automáticamente el proyecto después de 7 días de inactividad.
 * 
 * Uso:
 *   - Ejecutar manualmente: node scripts/keep-alive.js
 *   - Programar con cron (Linux/Mac): 0 0 * * * cd /ruta/al/backend && node scripts/keep-alive.js
 *   - Programar con Task Scheduler (Windows): Crear tarea diaria que ejecute este script
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error'],
});

async function keepAlive() {
  const timestamp = new Date().toISOString();
  console.log(`🔄 Ejecutando keep-alive: ${timestamp}`);

  try {
    // Query simple para mantener la conexión activa
    await prisma.$queryRaw`SELECT 1 as keep_alive`;
    
    // Opcional: Verificar que hay tablas
    const tables = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log(`✅ Keep-alive exitoso`);
    console.log(`   Tablas en la base de datos: ${tables[0].count}`);
    console.log(`   Proyecto activo - no se pausará automáticamente`);
    
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error en keep-alive: ${error.message}`);
    
    if (error.message.includes("Can't reach database server")) {
      console.log('\n⚠️  La base de datos parece estar pausada.');
      console.log('   Ve a https://supabase.com/dashboard y reactiva tu proyecto.');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

keepAlive();







