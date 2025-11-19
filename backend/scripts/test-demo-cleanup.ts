/**
 * Script de prueba para el sistema de limpieza DEMO
 * Ejecuta manualmente el proceso de limpieza para testing
 */

import { ejecutarLimpiezaDemo, obtenerUsuariosDemoParaNotificacion } from '../src/services/demoCleanupService';
import prisma from '../src/lib/prisma';

async function testDemoCleanup() {
  console.log('🧪 Iniciando test de limpieza DEMO...\n');

  try {
    // 1. Obtener usuarios DEMO para notificación
    console.log('📋 Obteniendo usuarios DEMO para notificación...');
    const usuarios = await obtenerUsuariosDemoParaNotificacion();
    
    console.log(`\n📊 Usuarios encontrados:`);
    console.log(`   - 10 días antes: ${usuarios.usuarios10Dias.length}`);
    console.log(`   - 5 días antes: ${usuarios.usuarios5Dias.length}`);
    console.log(`   - 1 día antes: ${usuarios.usuarios1Dia.length}`);
    console.log(`   - Para eliminar (30+ días): ${usuarios.usuariosParaEliminar.length}`);

    if (usuarios.usuarios10Dias.length > 0) {
      console.log('\n👥 Usuarios con 10 días restantes:');
      usuarios.usuarios10Dias.forEach(u => {
        const dias = Math.floor((new Date().getTime() - u.fechaRegistro.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`   - ${u.email} (${u.nombreUsuario}) - ${dias} días transcurridos`);
      });
    }

    if (usuarios.usuarios5Dias.length > 0) {
      console.log('\n👥 Usuarios con 5 días restantes:');
      usuarios.usuarios5Dias.forEach(u => {
        const dias = Math.floor((new Date().getTime() - u.fechaRegistro.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`   - ${u.email} (${u.nombreUsuario}) - ${dias} días transcurridos`);
      });
    }

    if (usuarios.usuarios1Dia.length > 0) {
      console.log('\n👥 Usuarios con 1 día restante:');
      usuarios.usuarios1Dia.forEach(u => {
        const dias = Math.floor((new Date().getTime() - u.fechaRegistro.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`   - ${u.email} (${u.nombreUsuario}) - ${dias} días transcurridos`);
      });
    }

    if (usuarios.usuariosParaEliminar.length > 0) {
      console.log('\n🗑️  Usuarios para eliminar:');
      usuarios.usuariosParaEliminar.forEach(u => {
        const dias = Math.floor((new Date().getTime() - u.fechaRegistro.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`   - ${u.email} (${u.nombreUsuario}) - ${dias} días transcurridos`);
      });
    }

    // 2. Preguntar si ejecutar limpieza completa
    console.log('\n⚠️  ¿Deseas ejecutar la limpieza completa? (esto enviará emails y eliminará datos)');
    console.log('   Para ejecutar, descomenta la siguiente línea en el código:');
    console.log('   // const resultado = await ejecutarLimpiezaDemo();');

    // Descomentar para ejecutar realmente:
    // const resultado = await ejecutarLimpiezaDemo();
    // console.log('\n✅ Resultado de limpieza:', resultado);

    console.log('\n✅ Test completado (sin ejecutar limpieza real)');
  } catch (error) {
    console.error('\n❌ Error en test:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testDemoCleanup().catch((error) => {
  console.error('Error fatal:', error);
  process.exit(1);
});

