/**
 * Script para configurar usuario CORINA
 * Actualiza teléfono y configura notificaciones
 * Ejecutar: npm run configurar-usuario-corina
 */

import * as dotenv from 'dotenv';
import { prisma } from '../config/database';

dotenv.config();

const EMAIL_USUARIO = 'valentinosegatti@gmail.com';
const TELEFONO = '+5493515930163';

async function configurarUsuario() {
  try {
    console.log('🔧 Configurando usuario CORINA...\n');

    // Buscar usuario
    const usuario = await prisma.usuario.findUnique({
      where: { email: EMAIL_USUARIO },
      select: {
        id: true,
        email: true,
        nombreUsuario: true,
        planSuscripcion: true,
        telefono: true,
        telefonoVerificado: true,
        notificacionesWhatsAppActivas: true,
      },
    });

    if (!usuario) {
      throw new Error(`Usuario ${EMAIL_USUARIO} no encontrado`);
    }

    console.log(`✅ Usuario encontrado: ${usuario.email}`);
    console.log(`   Nombre: ${usuario.nombreUsuario}`);
    console.log(`   Plan: ${usuario.planSuscripcion}\n`);

    if (usuario.planSuscripcion !== 'ENTERPRISE') {
      console.warn('⚠️  ADVERTENCIA: El usuario no tiene plan ENTERPRISE');
      console.warn('   CORINA solo funciona con plan ENTERPRISE\n');
    }

    // Actualizar teléfono
    const telefonoFormateado = TELEFONO.startsWith('whatsapp:')
      ? TELEFONO
      : `whatsapp:${TELEFONO}`;

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        telefono: telefonoFormateado,
        telefonoVerificado: false, // Se verificará después
      },
    });

    console.log(`✅ Teléfono actualizado: ${telefonoFormateado}`);
    console.log(`   Estado verificación: PENDIENTE\n`);

    console.log('═══════════════════════════════════════════════════');
    console.log('  PRÓXIMOS PASOS PARA VERIFICAR TELÉFONO');
    console.log('═══════════════════════════════════════════════════\n');

    console.log('1. Iniciar verificación de teléfono:');
    console.log('   POST http://localhost:3000/api/corina/whatsapp/verificar-telefono/iniciar');
    console.log('   Headers: { "Authorization": "Bearer TU_TOKEN_JWT" }');
    console.log('   Body: { "telefono": "+5493515930163" }\n');

    console.log('2. Revisar WhatsApp - recibirás un código de 6 dígitos\n');

    console.log('3. Verificar código:');
    console.log('   POST http://localhost:3000/api/corina/whatsapp/verificar-telefono/verificar');
    console.log('   Headers: { "Authorization": "Bearer TU_TOKEN_JWT" }');
    console.log('   Body: { "codigo": "123456" }\n');

    console.log('4. Activar notificaciones:');
    console.log('   PUT http://localhost:3000/api/corina/configurar');
    console.log('   Headers: { "Authorization": "Bearer TU_TOKEN_JWT" }');
    console.log('   Body: { "notificacionesWhatsAppActivas": true }\n');

    console.log('═══════════════════════════════════════════════════');
    console.log('  ALTERNATIVA: Usar Postman o curl');
    console.log('═══════════════════════════════════════════════════\n');

    console.log('O ejecuta estos comandos (reemplaza TU_TOKEN con tu JWT):\n');

    console.log('# 1. Iniciar verificación');
    console.log(`curl -X POST http://localhost:3000/api/corina/whatsapp/verificar-telefono/iniciar \\`);
    console.log(`  -H "Authorization: Bearer TU_TOKEN" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"telefono": "+5493515930163"}'`);
    console.log('');

    console.log('# 2. Verificar código (reemplaza 123456 con el código recibido)');
    console.log(`curl -X POST http://localhost:3000/api/corina/whatsapp/verificar-telefono/verificar \\`);
    console.log(`  -H "Authorization: Bearer TU_TOKEN" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"codigo": "123456"}'`);
    console.log('');

    console.log('# 3. Activar notificaciones');
    console.log(`curl -X PUT http://localhost:3000/api/corina/configurar \\`);
    console.log(`  -H "Authorization: Bearer TU_TOKEN" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"notificacionesWhatsAppActivas": true}'`);
    console.log('');

    console.log('✅ Configuración inicial completada!');
    console.log('   Sigue los pasos arriba para completar la verificación.\n');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

configurarUsuario()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error inesperado:', error);
    process.exit(1);
  });






