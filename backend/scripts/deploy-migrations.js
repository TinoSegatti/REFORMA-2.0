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
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL}`);
console.log(`   DIRECT_URL: ${process.env.DIRECT_URL}\n`);

// Verificar formato de las URLs
const dbUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

console.log('🔍 Verificando formato de URLs...');
if (!dbUrl.includes('pooler.supabase.com')) {
  console.error('   ⚠️  DATABASE_URL no usa el pooler de Supabase');
}
if (!dbUrl.includes('?sslmode=require')) {
  console.error('   ⚠️  DATABASE_URL no incluye ?sslmode=require');
}
if (!directUrl.includes('pooler.supabase.com')) {
  console.error('   ⚠️  DIRECT_URL no usa el pooler de Supabase');
}
if (!directUrl.includes('?sslmode=require')) {
  console.error('   ⚠️  DIRECT_URL no incluye ?sslmode=require');
}
if (dbUrl === directUrl) {
  console.log('   ✅ Ambas URLs son idénticas (correcto para Render IPv4)');
} else {
  console.error('   ⚠️  Las URLs son diferentes - deberían ser idénticas para Render');
}
console.log('');

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
    console.error('\n📋 URLs configuradas actualmente:');
    console.error(`   DATABASE_URL: ${process.env.DATABASE_URL}`);
    console.error(`   DIRECT_URL: ${process.env.DIRECT_URL}`);
    console.error('\n🔍 Verifica que:');
    console.error('   1. El proyecto de Supabase esté ACTIVO (no pausado)');
    console.error('   2. No haya restricciones de red en Supabase Dashboard');
    console.error('   3. Las URLs sean exactamente iguales a las de Supabase Dashboard');
    console.error('   4. Ambas URLs incluyan ?sslmode=require');
    console.error('\n📝 URLs correctas esperadas:');
    console.error('   DATABASE_URL: postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require');
    console.error('   DIRECT_URL: postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require');
    console.error('\n💡 Pasos para resolver:');
    console.error('   1. Ve a Supabase Dashboard → Tu proyecto');
    console.error('   2. Verifica que el estado sea "Active" (verde)');
    console.error('   3. Ve a Settings → Database → Network Restrictions');
    console.error('   4. Debe decir "Your database can be accessed by all IP addresses"');
    console.error('   5. Ve a Settings → Database → Connection Pooling');
    console.error('   6. Selecciona "Session Pooler" y copia la URL');
    console.error('   7. Agrega ?sslmode=require al final');
    console.error('   8. Usa esa URL para ambas variables en Render');
    process.exit(1);
  } else {
    // Otro tipo de error
    console.error('\n❌ Error durante el deploy:', errorOutput);
    process.exit(1);
  }
}

