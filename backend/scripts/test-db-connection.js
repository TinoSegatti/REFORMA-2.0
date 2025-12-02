/**
 * Script para probar la conexión a la base de datos
 * Uso: node scripts/test-db-connection.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  console.log('🔍 Probando conexión a la base de datos...\n');
  
  // Verificar que DATABASE_URL esté configurada
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL no está configurada en el archivo .env');
    console.log('\n📝 Pasos para solucionar:');
    console.log('1. Verifica que existe el archivo backend/.env');
    console.log('2. Agrega la línea: DATABASE_URL="postgresql://..."');
    console.log('3. Obtén la Connection String desde tu proyecto de Supabase');
    process.exit(1);
  }

  // Mostrar información de la conexión (sin mostrar la contraseña)
  const dbUrl = process.env.DATABASE_URL;
  const urlParts = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  
  if (urlParts) {
    const [, user, , host, port, database] = urlParts;
    console.log('📋 Información de conexión:');
    console.log(`   Host: ${host}`);
    console.log(`   Puerto: ${port}`);
    console.log(`   Base de datos: ${database}`);
    console.log(`   Usuario: ${user}`);
    console.log(`   Contraseña: ${'*'.repeat(10)} (oculta)\n`);
  }

  const prisma = new PrismaClient({
    log: ['error'],
  });

  try {
    console.log('🔄 Intentando conectar...');
    
    // Probar conexión simple
    await prisma.$connect();
    console.log('✅ Conexión exitosa!\n');

    // Probar una query simple
    console.log('🔄 Probando query simple...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query exitosa:', result);

    // Verificar tablas existentes
    console.log('\n🔄 Verificando tablas...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log(`✅ Encontradas ${tables.length} tablas en la base de datos`);
    
    if (tables.length > 0) {
      console.log('\n📊 Tablas encontradas:');
      tables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.table_name}`);
      });
    }

    console.log('\n✅ Todas las pruebas pasaron correctamente!');
    
  } catch (error) {
    console.error('\n❌ ERROR al conectar a la base de datos:\n');
    console.error(error.message);
    
    if (error.message.includes("Can't reach database server")) {
      console.log('\n🔧 Posibles soluciones:');
      console.log('1. Verifica que tu proyecto de Supabase esté activo (no pausado)');
      console.log('   - Ve a https://supabase.com/dashboard');
      console.log('   - Si está pausado, haz clic en "Restore" o "Resume"');
      console.log('2. Verifica que la Connection String sea correcta');
      console.log('   - Ve a Settings > Database en tu proyecto de Supabase');
      console.log('   - Copia la "Connection String" (modo "Session" o "Transaction")');
      console.log('3. Verifica tu conexión a internet');
      console.log('4. Si usas VPN, intenta desconectarla');
      console.log('5. Verifica que el firewall no esté bloqueando el puerto 5432');
    } else if (error.message.includes("authentication failed")) {
      console.log('\n🔧 Posibles soluciones:');
      console.log('1. La contraseña de la base de datos puede haber cambiado');
      console.log('   - Ve a Settings > Database en tu proyecto de Supabase');
      console.log('   - Genera una nueva contraseña si es necesario');
      console.log('   - Actualiza DATABASE_URL en tu archivo .env');
    } else if (error.message.includes("does not exist")) {
      console.log('\n🔧 Posibles soluciones:');
      console.log('1. La base de datos especificada no existe');
      console.log('   - Verifica el nombre de la base de datos en DATABASE_URL');
      console.log('   - Por defecto en Supabase es "postgres"');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();







