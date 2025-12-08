/**
 * Script para deploy de migraciones en producción
 * Maneja el caso donde la base de datos ya tiene esquema pero Prisma no tiene registro de migraciones
 */

const { execSync } = require('child_process');

// Intentar importar pg para pruebas de conexión
let pg = null;
try {
  pg = require('pg');
} catch (e) {
  console.log('⚠️  pg no está disponible para pruebas de conexión\n');
}

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

// Función principal asíncrona
async function runDeploy() {
  try {
    // Intentar hacer deploy normal
    console.log('📦 Intentando aplicar migraciones...');
    let output = '';
    
    try {
      // Timeout de 30 segundos para evitar bloqueos
      output = execSync('npx prisma migrate deploy', { 
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 30000, // 30 segundos
        killSignal: 'SIGTERM'
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
    
    // Si es un timeout, mostrar mensaje específico
    if (execError.signal === 'SIGTERM' || message.includes('timeout') || message.includes('ETIMEDOUT')) {
      console.error('\n⏱️  TIMEOUT: Las migraciones tardaron más de 30 segundos');
      console.error('   Esto puede indicar un problema de conexión a la base de datos.');
      console.error('\n💡 Soluciones:');
      console.error('   1. Verifica que las URLs de conexión sean correctas');
      console.error('   2. Verifica que el proyecto de Supabase esté activo');
      console.error('   3. Intenta usar Session Pooler en lugar de Transaction Pooler');
      console.error('   4. Si la base de datos ya tiene el esquema, puedes omitir las migraciones temporalmente');
      process.exit(1);
    }
    
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
        
        // Intentar deploy nuevamente con timeout
        execSync('npx prisma migrate deploy', { 
          stdio: 'inherit',
          timeout: 30000, // 30 segundos
          killSignal: 'SIGTERM'
        });
        console.log('\n✅ Migraciones aplicadas correctamente después del baseline');
        process.exit(0);
      } catch (baselineError) {
        const baselineOutput = baselineError.stdout?.toString() || baselineError.stderr?.toString() || baselineError.message || '';
        console.error('\n❌ Error durante el baseline:', baselineOutput);
        process.exit(1);
      }
    } else if (output.includes('P1001') || output.includes("Can't reach database")) {
      // Error de conexión - mostrar información y sugerencias
      console.error('\n❌ ERROR DE CONEXIÓN: No se puede alcanzar el servidor de base de datos');
      console.error('\n📋 URLs configuradas actualmente:');
      console.error(`   DATABASE_URL: ${process.env.DATABASE_URL}`);
      console.error(`   DIRECT_URL: ${process.env.DIRECT_URL}`);
      
      // Intentar prueba de conexión directa con pg si está disponible
      if (pg) {
        console.log('\n🔍 Realizando prueba de conexión directa con pg...');
        try {
          const client = new pg.Client({
            connectionString: directUrl,
            ssl: {
              rejectUnauthorized: false
            },
            connectionTimeoutMillis: 10000
          });
          
          await client.connect();
          const result = await client.query('SELECT version()');
          console.log('✅ Conexión exitosa con pg.Client');
          console.log(`   PostgreSQL version: ${result.rows[0].version.substring(0, 50)}...`);
          await client.end();
        } catch (pgError) {
          console.error('❌ Error en prueba de conexión con pg.Client:');
          console.error(`   Tipo: ${pgError.constructor.name}`);
          console.error(`   Mensaje: ${pgError.message}`);
          if (pgError.code) {
            console.error(`   Código: ${pgError.code}`);
          }
          if (pgError.host) {
            console.error(`   Host intentado: ${pgError.host}`);
          }
          if (pgError.port) {
            console.error(`   Puerto intentado: ${pgError.port}`);
          }
        }
      }
      
      console.error('\n🚨 ACCIÓN REQUERIDA: El proyecto de Supabase está pausado o no es accesible');
      console.error('\n📋 PASO 1: Reactivar proyecto de Supabase (MÁS PROBABLE)');
      console.error('   1. Ve a https://supabase.com/dashboard');
      console.error('   2. Busca tu proyecto (debería aparecer como "Paused" o con estado inactivo)');
      console.error('   3. Haz clic en "Restore" o "Resume"');
      console.error('   4. Espera 1-2 minutos para que se reactive');
      console.error('   5. Verifica que el estado cambie a "Active" (verde)');
      console.error('   6. Vuelve a hacer deploy en Render');
      console.error('\n📋 PASO 2: Si el proyecto está activo, verifica Network Restrictions');
      console.error('   1. Ve a Supabase Dashboard → Settings → Database → Network Restrictions');
      console.error('   2. Asegúrate de que no haya restricciones que bloqueen a Render');
      console.error('   3. Si hay restricciones, permite todas las IPs temporalmente o agrega la IP de Render');
      console.error('\n📋 PASO 3: Alternativa temporal - Usar Transaction Pooler');
      console.error('   ⚠️  Solo si Session Pooler no funciona después de reactivar:');
      console.error('   1. Ve a Supabase Dashboard → Settings → Database → Connection Pooling');
      console.error('   2. Selecciona "Transaction Pooler" (puerto 6543)');
      console.error('   3. Copia la URL y agrega ?sslmode=require&pgbouncer=true al final');
      console.error('   4. Usa esa URL para ambas variables (DATABASE_URL y DIRECT_URL) en Render');
      console.error('\n📚 Guía completa: docs/06-GUIAS/TROUBLESHOOTING/SOLUCION_ERRORES_CONEXION_SUPABASE.md');
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
}

// Ejecutar función principal
runDeploy().catch((error) => {
  console.error('\n❌ Error fatal:', error.message);
  process.exit(1);
});

