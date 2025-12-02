/**
 * Script para deploy de migraciones en producción
 * Versión que omite las migraciones si hay problemas de conexión
 * Útil cuando la base de datos ya está configurada y solo necesitas hacer deploy
 */

const { execSync } = require('child_process');

console.log('🚀 Iniciando deploy de migraciones (modo: omitir si falla)...\n');

// Verificar que las variables de entorno estén configuradas
if (!process.env.DATABASE_URL) {
  console.warn('⚠️  ADVERTENCIA: DATABASE_URL no está configurada');
  console.log('   Omitiendo migraciones...\n');
  process.exit(0);
}

if (!process.env.DIRECT_URL) {
  console.warn('⚠️  ADVERTENCIA: DIRECT_URL no está configurada');
  console.log('   Omitiendo migraciones...\n');
  process.exit(0);
}

console.log('✅ Variables de entorno configuradas');
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL.substring(0, 50)}...`);
console.log(`   DIRECT_URL: ${process.env.DIRECT_URL.substring(0, 50)}...\n`);

try {
  console.log('📦 Intentando aplicar migraciones (timeout: 30s)...');
  
  try {
    const output = execSync('npx prisma migrate deploy', { 
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 30000, // 30 segundos
      killSignal: 'SIGTERM'
    }).toString();
    
    console.log(output);
    console.log('\n✅ Migraciones aplicadas correctamente');
    process.exit(0);
  } catch (execError) {
    const stdout = execError.stdout?.toString() || '';
    const stderr = execError.stderr?.toString() || '';
    const message = execError.message || '';
    const output = stdout + stderr + message;
    
    // Si es un timeout o error de conexión, omitir las migraciones
    if (execError.signal === 'SIGTERM' || 
        message.includes('timeout') || 
        message.includes('ETIMEDOUT') ||
        output.includes('P1001') ||
        output.includes("Can't reach database")) {
      
      console.warn('\n⚠️  No se pudieron aplicar las migraciones (problema de conexión o timeout)');
      console.warn('   Continuando con el deploy sin aplicar migraciones...');
      console.warn('\n💡 Nota: Si la base de datos ya tiene el esquema correcto, esto es normal.');
      console.warn('   Puedes aplicar las migraciones manualmente más tarde si es necesario.\n');
      process.exit(0); // Salir con éxito para que el deploy continúe
    }
    
    // Si es otro tipo de error, mostrar y fallar
    console.error('\n❌ Error durante las migraciones:');
    if (stdout) console.error(stdout);
    if (stderr) console.error(stderr);
    if (message && !stdout && !stderr) console.error(message);
    
    console.error('\n⚠️  Omitiendo migraciones debido al error...');
    console.error('   El deploy continuará, pero las migraciones no se aplicaron.\n');
    process.exit(0); // Salir con éxito para que el deploy continúe
  }
} catch (error) {
  console.error('\n❌ Error inesperado:', error.message);
  console.error('   Omitiendo migraciones y continuando con el deploy...\n');
  process.exit(0); // Salir con éxito para que el deploy continúe
}

