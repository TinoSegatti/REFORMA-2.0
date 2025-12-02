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
  let output = '';
  
  try {
    output = execSync('npx prisma migrate deploy', { 
      encoding: 'utf8',
      stdio: 'pipe'
    }).toString();
    // Si llegamos aquí, fue exitoso
    console.log(output);
    console.log('\n✅ Migraciones aplicadas correctamente');
    process.exit(0);
  } catch (execError) {
    // Capturar tanto stdout como stderr
    const stdout = execError.stdout?.toString() || '';
    const stderr = execError.stderr?.toString() || '';
    const message = execError.message || '';
    output = stdout + stderr + message;
    
    // Mostrar el error en consola
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    if (message && !stdout && !stderr) console.error(message);
    
    // Si falla con error P3005 (base de datos no vacía sin migraciones registradas)
    if (output.includes('P3005') || output.includes('not empty') || output.includes('No migration found') || output.includes('database schema is not empty')) {
      console.log('\n⚠️  La base de datos ya tiene esquema. Haciendo baseline de migraciones existentes...\n');
      
      // Verificar que las migraciones existan antes de intentar el baseline
      const fs = require('fs');
      const path = require('path');
      const migrationsPath = path.join(__dirname, '..', 'prisma', 'migrations');
      
      if (!fs.existsSync(migrationsPath)) {
        console.error(`❌ ERROR: No se encuentra el directorio de migraciones en: ${migrationsPath}`);
        console.error('   Asegúrate de que las migraciones estén en el repositorio.');
        process.exit(1);
      }
      
      const migrations = fs.readdirSync(migrationsPath).filter(dir => {
        const dirPath = path.join(migrationsPath, dir);
        return fs.statSync(dirPath).isDirectory() && /^\d+_/.test(dir);
      });
      
      if (migrations.length === 0) {
        console.error('❌ ERROR: No se encontraron migraciones en el directorio.');
        console.error(`   Directorio verificado: ${migrationsPath}`);
        process.exit(1);
      }
      
      console.log(`✅ Se encontraron ${migrations.length} migraciones: ${migrations.join(', ')}\n`);
      
      try {
        // Marcar las migraciones existentes como aplicadas (baseline)
        const migrationsToBaseline = ['20251027221350_init', '20251027232428_actualizar_fabricacion'];
        
        for (const migration of migrationsToBaseline) {
          if (migrations.includes(migration)) {
            console.log(`📝 Marcando migración ${migration} como aplicada...`);
            execSync(`npx prisma migrate resolve --applied ${migration}`, { stdio: 'inherit' });
          } else {
            console.warn(`⚠️  Migración ${migration} no encontrada, omitiendo...`);
          }
        }
        
        console.log('\n✅ Baseline completado. Intentando deploy nuevamente...\n');
        
        // Intentar deploy nuevamente
        execSync('npx prisma migrate deploy', { stdio: 'inherit' });
        console.log('\n✅ Migraciones aplicadas correctamente después del baseline');
        process.exit(0);
      } catch (baselineError) {
        const baselineOutput = baselineError.stdout?.toString() || baselineError.stderr?.toString() || baselineError.message || '';
        console.error('\n❌ Error durante el baseline:', baselineOutput);
        process.exit(1);
      }
    } else if (output.includes('P1001') || output.includes("Can't reach database")) {
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
      // Otro tipo de error - mostrar la salida completa
      console.error('\n❌ Error durante el deploy:');
      console.error(output);
      process.exit(1);
    }
  }
} catch (error) {
  // Error inesperado
  console.error('\n❌ Error inesperado:', error.message);
  process.exit(1);
}

