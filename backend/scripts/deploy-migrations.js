/**
 * Script para deploy de migraciones en producción
 * Maneja el caso donde la base de datos ya tiene esquema pero Prisma no tiene registro de migraciones
 */

const { execSync } = require('child_process');

// Función helper para esperar
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Intentar importar pg para pruebas de conexión
let pg = null;
try {
  pg = require('pg');
} catch (e) {
  console.log('⚠️  pg no está disponible para pruebas de conexión\n');
}

console.log('🚀 Iniciando deploy de migraciones...\n');

// Permitir omitir migraciones si SKIP_MIGRATIONS=true (útil para problemas de conectividad)
if (process.env.SKIP_MIGRATIONS === 'true') {
  console.log('⚠️  SKIP_MIGRATIONS=true detectado');
  console.log('   Omitiendo migraciones. Asegúrate de que ya estén aplicadas manualmente.');
  console.log('   Esto es útil si hay problemas temporales de conectividad.');
  process.exit(0);
}

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

// Verificar configuración recomendada
const dbUsesTransactionPooler = dbUrl.includes(':6543');
const directUsesSessionPooler = directUrl.includes(':5432') && !directUrl.includes(':6543');

if (dbUsesTransactionPooler && directUsesSessionPooler) {
  console.log('   ✅ Configuración óptima detectada:');
  console.log('      - DATABASE_URL usa Transaction Pooler (puerto 6543) para la aplicación');
  console.log('      - DIRECT_URL usa Session Pooler (puerto 5432) para migraciones más rápidas');
} else if (dbUrl === directUrl) {
  console.log('   ✅ Ambas URLs son idénticas (configuración simple, puede ser más lenta para migraciones)');
} else {
  console.warn('   ⚠️  Las URLs son diferentes - verifica la configuración');
  console.warn('      Recomendación: DATABASE_URL (puerto 6543) y DIRECT_URL (puerto 5432)');
}
console.log('');

// Función para ejecutar comando con retry (async)
async function execWithRetry(command, options, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        const waitTime = (attempt - 1) * 3000; // 3s, 6s entre intentos
        console.log(`\n🔄 Intento ${attempt}/${maxRetries} (esperando ${waitTime/1000}s antes de reintentar)...`);
        await sleep(waitTime);
      } else {
        console.log(`\n🔄 Intento ${attempt}/${maxRetries}...`);
      }
      
      const output = execSync(command, options).toString();
      return { success: true, output };
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      const stdout = error.stdout?.toString() || '';
      const stderr = error.stderr?.toString() || '';
      const message = error.message || '';
      const output = stdout + stderr + message;
      
      // Si es error de conexión y no es el último intento, reintentar
      if (!isLastAttempt && (output.includes('P1001') || output.includes("Can't reach database"))) {
        console.log(`   ⚠️  Error de conexión detectado (P1001). Reintentando...`);
        continue;
      }
      
      // Si es el último intento o no es error de conexión, retornar el error
      return { success: false, output, error };
    }
  }
}

// Función para verificar conexión antes de migraciones
async function verificarConexion() {
  if (!pg) {
    console.log('⚠️  pg no disponible, omitiendo verificación de conexión\n');
    return true;
  }
  
  console.log('🔍 Verificando conexión a la base de datos...');
  try {
    const client = new pg.Client({
      connectionString: process.env.DIRECT_URL,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 10000
    });
    
    await client.connect();
    const result = await client.query('SELECT 1 as test');
    await client.end();
    console.log('✅ Conexión verificada exitosamente\n');
    return true;
  } catch (error) {
    console.error(`❌ Error verificando conexión: ${error.message}`);
    console.error('   Esto puede indicar problemas de conectividad.\n');
    return false;
  }
}

// Función principal asíncrona
async function runDeploy() {
  try {
    // Verificar conexión primero
    const conexionOk = await verificarConexion();
    
    if (!conexionOk) {
      console.error('⚠️  No se pudo verificar la conexión. Las migraciones pueden fallar.');
      console.error('   Si las migraciones ya están aplicadas, puedes usar SKIP_MIGRATIONS=true\n');
    }
    
    // Intentar hacer deploy normal con retry
    console.log('📦 Intentando aplicar migraciones...');
    let output = '';
    
    try {
      // Timeout aumentado a 180 segundos para migraciones complejas con Transaction Pooler
      const result = await execWithRetry('npx prisma migrate deploy', { 
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 180000, // 180 segundos (3 minutos) para Transaction Pooler que puede ser más lento
        killSignal: 'SIGTERM'
      }, 3); // 3 intentos máximo
      
      if (result.success) {
        // Si llegamos aquí, fue exitoso
        console.log(result.output);
        console.log('\n✅ Migraciones aplicadas correctamente');
        process.exit(0);
      } else {
        // Lanzar error para que se maneje en el catch
        const execError = result.error || new Error(result.output);
        execError.stdout = { toString: () => result.output };
        execError.stderr = { toString: () => '' };
        throw execError;
      }
    } catch (execError) {
    // Capturar tanto stdout como stderr
    const stdout = execError.stdout?.toString() || '';
    const stderr = execError.stderr?.toString() || '';
    const message = execError.message || '';
    output = stdout + stderr + message;
    
    // Si es un timeout, mostrar mensaje específico
    if (execError.signal === 'SIGTERM' || message.includes('timeout') || message.includes('ETIMEDOUT')) {
      console.error('\n⏱️  TIMEOUT: Las migraciones tardaron más de 180 segundos');
      console.error('   Esto puede indicar un problema de conexión o que Transaction Pooler es muy lento para migraciones.');
      console.error('\n💡 Soluciones:');
      console.error('   1. Si las migraciones ya están aplicadas, omite las migraciones:');
      console.error('      Agrega SKIP_MIGRATIONS=true en Render Environment y haz redeploy');
      console.error('   2. Verifica que el proyecto de Supabase esté activo');
      console.error('   3. Las migraciones pueden aplicarse manualmente desde Supabase SQL Editor');
      console.error('   4. Si necesitas aplicar migraciones nuevas, considera usar Session Pooler para DIRECT_URL');
      console.error('\n📚 Guía completa: docs/06-GUIAS/CONFIGURACION/CONFIGURACION_DEFINITIVA_RENDER.md');
      console.error('\n⚠️  NOTA: Si tu base de datos ya tiene el esquema correcto, usa SKIP_MIGRATIONS=true');
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
        
        console.log('\n✅ Baseline completado. Intentando deploy nuevamente con retry...\n');
        
        // Intentar deploy nuevamente con timeout aumentado y retry
        const retryResult = await execWithRetry('npx prisma migrate deploy', { 
          stdio: 'inherit',
          timeout: 180000, // 180 segundos (3 minutos) para Transaction Pooler
          killSignal: 'SIGTERM'
        }, 3);
        
        if (retryResult.success) {
          console.log('\n✅ Migraciones aplicadas correctamente después del baseline');
          process.exit(0);
        } else {
          throw retryResult.error || new Error(retryResult.output);
        }
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
      
      console.error('\n🚨 ERROR DE CONEXIÓN DESPUÉS DE 3 INTENTOS');
      console.error('\n📋 DIAGNÓSTICO:');
      console.error('   - El proyecto de Supabase está activo según el usuario');
      console.error('   - Las URLs están configuradas correctamente (Session Pooler, puerto 5432)');
      console.error('   - El error P1001 ocurre inmediatamente, sugiriendo problema de conectividad');
      console.error('\n💡 POSIBLES CAUSAS:');
      console.error('   1. Problema temporal de red desde Render hacia Supabase');
      console.error('   2. El Session Pooler puede tener problemas intermitentes');
      console.error('   3. Network Restrictions en Supabase pueden estar bloqueando');
      console.error('   4. El proyecto puede estar en proceso de reactivación (aunque aparezca activo)');
      console.error('\n📋 SOLUCIONES RECOMENDADAS:');
      console.error('\n🔧 SOLUCIÓN 1: Verificar Network Restrictions (MÁS PROBABLE)');
      console.error('   1. Ve a Supabase Dashboard → Settings → Database → Network Restrictions');
      console.error('   2. Verifica que NO haya restricciones activas');
      console.error('   3. Si hay restricciones, permite todas las IPs temporalmente');
      console.error('   4. Guarda los cambios y espera 1-2 minutos');
      console.error('   5. Vuelve a hacer deploy en Render');
      console.error('\n🔧 SOLUCIÓN 2: Usar Transaction Pooler temporalmente');
      console.error('   ⚠️  Si Session Pooler sigue fallando, prueba con Transaction Pooler:');
      console.error('   1. Ve a Supabase Dashboard → Settings → Database → Connection Pooling');
      console.error('   2. Selecciona "Transaction Pooler" (puerto 6543)');
      console.error('   3. Copia la URL completa');
      console.error('   4. Reemplaza [YOUR-PASSWORD] con tu contraseña real');
      console.error('   5. Agrega ?sslmode=require&pgbouncer=true al final');
      console.error('   6. Usa esa URL para AMBAS variables en Render:');
      console.error('      - DATABASE_URL: [URL con Transaction Pooler]');
      console.error('      - DIRECT_URL: [MISMA URL con Transaction Pooler]');
      console.error('   7. Haz redeploy en Render');
      console.error('\n🔧 SOLUCIÓN 3: Esperar y reintentar');
      console.error('   - A veces hay problemas temporales de red');
      console.error('   - Espera 5-10 minutos y vuelve a hacer deploy');
      console.error('   - El retry logic ya intentó 3 veces automáticamente');
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

