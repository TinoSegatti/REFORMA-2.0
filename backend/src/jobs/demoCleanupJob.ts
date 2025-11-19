/**
 * Job Programado para Eliminación Automática de Datos DEMO
 * Ejecuta el proceso de limpieza diariamente
 */

import cron from 'node-cron';
import { ejecutarLimpiezaDemo } from '../services/demoCleanupService';

/**
 * Inicia el job programado para limpieza DEMO
 * Se ejecuta todos los días a las 2:00 AM
 */
export function iniciarJobLimpiezaDemo() {
  // Ejecutar todos los días a las 2:00 AM
  // Formato cron: segundo minuto hora día mes día-semana
  // '0 2 * * *' = todos los días a las 2:00 AM
  const cronExpression = process.env.DEMO_CLEANUP_CRON || '0 2 * * *';

  console.log(`📅 Job de limpieza DEMO programado: ${cronExpression}`);
  console.log('   Se ejecutará diariamente para verificar y eliminar datos de usuarios DEMO');

  cron.schedule(cronExpression, async () => {
    console.log('\n🔄 Iniciando job de limpieza DEMO...');
    console.log(`⏰ Fecha/Hora: ${new Date().toLocaleString('es-AR')}`);

    try {
      const resultado = await ejecutarLimpiezaDemo();
      
      console.log('\n✅ Job de limpieza DEMO completado exitosamente:');
      console.log(`   - Notificaciones 10 días: ${resultado.notificaciones.notificaciones10Dias}`);
      console.log(`   - Notificaciones 5 días: ${resultado.notificaciones.notificaciones5Dias}`);
      console.log(`   - Notificaciones 1 día: ${resultado.notificaciones.notificaciones1Dia}`);
      console.log(`   - Usuarios procesados: ${resultado.eliminaciones.usuariosProcesados}`);
      console.log(`   - Usuarios eliminados: ${resultado.eliminaciones.usuariosEliminados}`);
      console.log(`   - Errores: ${resultado.eliminaciones.errores}`);
    } catch (error) {
      console.error('\n❌ Error ejecutando job de limpieza DEMO:', error);
    }

    console.log('─────────────────────────────────────────────────\n');
  }, {
    scheduled: true,
    timezone: 'America/Argentina/Buenos_Aires'
  });
}

/**
 * Ejecuta el job manualmente (útil para testing)
 */
export async function ejecutarJobLimpiezaDemoManual() {
  console.log('🔄 Ejecutando job de limpieza DEMO manualmente...');
  try {
    const resultado = await ejecutarLimpiezaDemo();
    console.log('✅ Job completado:', resultado);
    return resultado;
  } catch (error) {
    console.error('❌ Error ejecutando job manual:', error);
    throw error;
  }
}

