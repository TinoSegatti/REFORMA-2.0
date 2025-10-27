const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔍 Probando conexión a Supabase...');
    
    // Intentar una consulta simple
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ Conexión exitosa!');
    console.log('PostgreSQL version:', result[0].version);
    
    // Listar tablas existentes
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('\n📊 Tablas existentes:');
    if (tables.length === 0) {
      console.log('  (ninguna)');
    } else {
      tables.forEach(t => console.log(`  - ${t.table_name}`));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Detalles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

