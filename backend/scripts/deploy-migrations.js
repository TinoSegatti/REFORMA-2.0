/**
 * Script para deploy de migraciones en producción
 * Maneja el caso donde la base de datos ya tiene esquema pero Prisma no tiene registro de migraciones
 */

const { execSync } = require('child_process');

console.log('🚀 Iniciando deploy de migraciones...\n');

// Verificar que las variables de entorno estén configuradas
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL no está configurada');
  process.exit(1);
}

if (!process.env.DIRECT_URL) {
  console.error('❌ ERROR: DIRECT_URL no está configurada');
  process.exit(1);
}

console.log('✅ Variables de entorno configuradas');
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL.substring(0, 50)}...`);
console.log(`   DIRECT_URL: ${process.env.DIRECT_URL.substring(0, 50)}...\n`);

try {
  // Intentar hacer deploy normal
  console.log('📦 Intentando aplicar migraciones...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  console.log('\n✅ Migraciones aplicadas correctamente');
} catch (error) {
  const errorOutput = error.stdout?.toString() || error.stderr?.toString() || error.message;
  
  // Si falla con error P3005 (base de datos no vacía sin migraciones registradas)
  if (errorOutput.includes('P3005') || errorOutput.includes('not empty')) {
    console.log('\n⚠️  La base de datos ya tiene esquema. Haciendo baseline de migraciones existentes...\n');
    
    try {
      // Marcar las migraciones existentes como aplicadas (baseline)
      console.log('📝 Marcando migración inicial como aplicada...');
      execSync('npx prisma migrate resolve --applied 20251027221350_init', { stdio: 'inherit' });
      
      console.log('📝 Marcando migración de actualización como aplicada...');
      execSync('npx prisma migrate resolve --applied 20251027232428_actualizar_fabricacion', { stdio: 'inherit' });
      
      console.log('\n✅ Baseline completado. Intentando deploy nuevamente...\n');
      
      // Intentar deploy nuevamente
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      console.log('\n✅ Migraciones aplicadas correctamente después del baseline');
    } catch (baselineError) {
      console.error('\n❌ Error durante el baseline:', baselineError.message);
      process.exit(1);
    }
  } else if (errorOutput.includes('P1001') || errorOutput.includes("Can't reach database")) {
    // Error de conexión
    console.error('\n❌ ERROR DE CONEXIÓN: No se puede alcanzar el servidor de base de datos');
    console.error('   Verifica que:');
    console.error('   1. DATABASE_URL y DIRECT_URL estén configuradas en Render');
    console.error('   2. Ambas URLs usen Session Pooler (aws-1-us-east-2.pooler.supabase.com)');
    console.error('   3. Ambas URLs incluyan ?sslmode=require');
    console.error('   4. El proyecto de Supabase esté activo');
    console.error('\n   URLs esperadas:');
    console.error('   DATABASE_URL: postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require');
    console.error('   DIRECT_URL: postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require');
    process.exit(1);
  } else {
    // Otro tipo de error
    console.error('\n❌ Error durante el deploy:', errorOutput);
    process.exit(1);
  }
}

