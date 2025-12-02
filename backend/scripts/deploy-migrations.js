/**
 * Script para deploy de migraciones en producción
 * Maneja el caso donde la base de datos ya tiene esquema pero Prisma no tiene registro de migraciones
 */

const { execSync } = require('child_process');

console.log('🚀 Iniciando deploy de migraciones...\n');

try {
  // Intentar hacer deploy normal
  console.log('📦 Intentando aplicar migraciones...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  console.log('\n✅ Migraciones aplicadas correctamente');
} catch (error) {
  // Si falla con error P3005 (base de datos no vacía sin migraciones registradas)
  if (error.message.includes('P3005') || error.stdout?.includes('P3005') || error.stderr?.includes('P3005')) {
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
  } else {
    // Otro tipo de error
    console.error('\n❌ Error durante el deploy:', error.message);
    process.exit(1);
  }
}

