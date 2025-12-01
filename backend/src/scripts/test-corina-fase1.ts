/**
 * Script de prueba end-to-end para Fase 1 de CORINA
 * Ejecutar: npm run test-corina-fase1
 * 
 * IMPORTANTE: Este script requiere:
 * - Base de datos configurada
 * - Usuario con plan ENTERPRISE
 * - Teléfono verificado
 * - Variables de entorno configuradas
 */

import * as dotenv from 'dotenv';
import { prisma } from '../config/database';
import { CorinaNotificacionService } from '../services/corinaNotificacionService';
import { crearCompra } from '../services/compraService';
import { actualizarCantidadReal } from '../services/inventarioService';

dotenv.config();

interface TestResult {
  nombre: string;
  exito: boolean;
  mensaje: string;
}

const resultados: TestResult[] = [];

async function ejecutarTest(nombre: string, testFn: () => Promise<void>): Promise<void> {
  try {
    console.log(`\n🧪 Ejecutando: ${nombre}`);
    await testFn();
    resultados.push({ nombre, exito: true, mensaje: 'OK' });
    console.log(`✅ ${nombre}: OK`);
  } catch (error: any) {
    resultados.push({ nombre, exito: false, mensaje: error.message });
    console.error(`❌ ${nombre}: ${error.message}`);
  }
}

async function test1_VerificarConfiguracion() {
  const corinaEnabled = process.env.CORINA_ENABLED === 'true';
  if (!corinaEnabled) {
    throw new Error('CORINA_ENABLED no está en true');
  }

  const twilioConfigurado = !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_NUMBER
  );
  if (!twilioConfigurado) {
    throw new Error('Credenciales de Twilio no configuradas');
  }

  const openaiConfigurado = !!process.env.OPENAI_API_KEY;
  if (!openaiConfigurado) {
    throw new Error('OPENAI_API_KEY no configurada');
  }
}

async function test2_BuscarUsuarioEnterprise() {
  const usuario = await prisma.usuario.findFirst({
    where: {
      planSuscripcion: 'ENTERPRISE',
    },
    include: {
      granjas: {
        where: {
          activa: true,
        },
        take: 1,
      },
    },
  });

  if (!usuario) {
    throw new Error('No se encontró usuario con plan ENTERPRISE');
  }

  if (usuario.granjas.length === 0) {
    throw new Error('Usuario ENTERPRISE no tiene granjas activas');
  }

  console.log(`  Usuario encontrado: ${usuario.email}`);
  console.log(`  Granja: ${usuario.granjas[0].nombreGranja}`);
}

async function test3_VerificarTelefono() {
  const usuario = await prisma.usuario.findFirst({
    where: {
      planSuscripcion: 'ENTERPRISE',
      telefonoVerificado: true,
      telefono: { not: null },
    },
  });

  if (!usuario) {
    throw new Error('No se encontró usuario ENTERPRISE con teléfono verificado');
  }

  console.log(`  Teléfono verificado: ${usuario.telefono}`);
}

async function test4_VerificarNotificacionesActivas() {
  const usuario = await prisma.usuario.findFirst({
    where: {
      planSuscripcion: 'ENTERPRISE',
      telefonoVerificado: true,
      notificacionesWhatsAppActivas: true,
    },
  });

  if (!usuario) {
    console.log('  ⚠️  No hay usuario con notificaciones activas');
    console.log('  Puedes activarlas con: PUT /api/corina/configurar');
    return;
  }

  const tieneActivas = await CorinaNotificacionService.tieneNotificacionesActivas(usuario.id);
  if (!tieneActivas) {
    throw new Error('Usuario no tiene notificaciones activas');
  }

  console.log(`  Notificaciones activas: ${usuario.notificacionesWhatsAppActivas}`);
}

async function test5_VerificarModelosBD() {
  // Verificar que los modelos de CORINA existen
  const tieneCorinaInteraccion = await prisma.$queryRaw`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 't_corina_interaccion'
    ) as exists
  `;

  const tieneCorinaNotificacion = await prisma.$queryRaw`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 't_corina_notificacion'
    ) as exists
  `;

  if (!tieneCorinaInteraccion || !tieneCorinaNotificacion) {
    throw new Error('Modelos de CORINA no existen en BD. Ejecuta la migración.');
  }

  console.log('  ✅ Modelos de BD verificados');
}

async function test6_ProbarEnvioMensaje() {
  const usuario = await prisma.usuario.findFirst({
    where: {
      planSuscripcion: 'ENTERPRISE',
      telefonoVerificado: true,
      telefono: { not: null },
    },
  });

  if (!usuario || !usuario.telefono) {
    throw new Error('No hay usuario con teléfono verificado para probar');
  }

  const messageSid = await CorinaNotificacionService.enviarMensajeWhatsApp(
    usuario.telefono,
    '🧪 CORINA\n\nTest del Sistema\n\nEste es un mensaje de prueba del sistema de notificaciones.'
  );

  if (!messageSid) {
    throw new Error('No se pudo enviar mensaje de prueba');
  }

  console.log(`  ✅ Mensaje enviado: ${messageSid}`);
}

async function test7_ProbarConsultaAlertas() {
  const usuario = await prisma.usuario.findFirst({
    where: {
      planSuscripcion: 'ENTERPRISE',
      telefonoVerificado: true,
    },
    include: {
      granjas: {
        where: { activa: true },
        take: 1,
      },
    },
  });

  if (!usuario || usuario.granjas.length === 0) {
    throw new Error('No hay usuario con granja para probar');
  }

  await CorinaNotificacionService.enviarListadoAlertas(
    usuario.id,
    usuario.granjas[0].id
  );

  console.log('  ✅ Consulta de alertas ejecutada');
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  TEST END-TO-END: CORINA Fase 1');
  console.log('═══════════════════════════════════════════════════');

  await ejecutarTest('1. Verificar configuración', test1_VerificarConfiguracion);
  await ejecutarTest('2. Buscar usuario ENTERPRISE', test2_BuscarUsuarioEnterprise);
  await ejecutarTest('3. Verificar teléfono', test3_VerificarTelefono);
  await ejecutarTest('4. Verificar notificaciones activas', test4_VerificarNotificacionesActivas);
  await ejecutarTest('5. Verificar modelos BD', test5_VerificarModelosBD);
  await ejecutarTest('6. Probar envío de mensaje', test6_ProbarEnvioMensaje);
  await ejecutarTest('7. Probar consulta de alertas', test7_ProbarConsultaAlertas);

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  RESUMEN DE TESTS');
  console.log('═══════════════════════════════════════════════════\n');

  const exitosos = resultados.filter((r) => r.exito).length;
  const fallidos = resultados.filter((r) => !r.exito).length;

  resultados.forEach((resultado) => {
    const icono = resultado.exito ? '✅' : '❌';
    console.log(`${icono} ${resultado.nombre}: ${resultado.mensaje}`);
  });

  console.log(`\nTotal: ${resultados.length} | Exitosos: ${exitosos} | Fallidos: ${fallidos}`);

  if (fallidos > 0) {
    console.log('\n⚠️  Algunos tests fallaron. Revisa la configuración.');
    process.exit(1);
  } else {
    console.log('\n✅ Todos los tests pasaron correctamente!');
    process.exit(0);
  }
}

runTests().catch((error) => {
  console.error('Error ejecutando tests:', error);
  process.exit(1);
});

