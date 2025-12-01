/**
 * Script completo para verificar teléfono CORINA
 * Este script te guía paso a paso para completar la verificación
 * Ejecutar: npm run verificar-telefono-completo
 */

import * as dotenv from 'dotenv';
import * as readline from 'readline';
import { prisma } from '../config/database';
import { CorinaNotificacionService } from '../services/corinaNotificacionService';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function pregunta(pregunta: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(pregunta, (respuesta) => {
      resolve(respuesta);
    });
  });
}

async function verificarTelefonoCompleto() {
  try {
    console.log('═══════════════════════════════════════════════════');
    console.log('  VERIFICACIÓN DE TELÉFONO CORINA');
    console.log('═══════════════════════════════════════════════════\n');

    const email = 'valentinosegatti@gmail.com';
    const telefono = '+5493515930163';

    // Buscar usuario
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        telefono: true,
        telefonoVerificado: true,
        notificacionesWhatsAppActivas: true,
      },
    });

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    console.log(`✅ Usuario: ${usuario.email}`);
    console.log(`   Teléfono: ${usuario.telefono || 'No configurado'}`);
    console.log(`   Verificado: ${usuario.telefonoVerificado ? 'Sí' : 'No'}\n`);

    if (usuario.telefonoVerificado) {
      console.log('✅ El teléfono ya está verificado!\n');
      
      if (!usuario.notificacionesWhatsAppActivas) {
        const activar = await pregunta('¿Deseas activar las notificaciones? (s/n): ');
        if (activar.toLowerCase() === 's') {
          await prisma.usuario.update({
            where: { id: usuario.id },
            data: { notificacionesWhatsAppActivas: true },
          });
          console.log('✅ Notificaciones activadas!\n');
        }
      } else {
        console.log('✅ Notificaciones ya están activas!\n');
      }
      
      rl.close();
      return;
    }

    // Generar código de verificación
    const codigoVerificacion = Math.floor(100000 + Math.random() * 900000).toString();
    
    console.log('📱 Generando código de verificación...\n');

    // Actualizar usuario con código
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        telefono: telefono.startsWith('whatsapp:') ? telefono : `whatsapp:${telefono}`,
        codigoVerificacionTelefono: codigoVerificacion,
        telefonoVerificado: false,
      },
    });

    // Enviar código por WhatsApp
    console.log('📤 Enviando código por WhatsApp...\n');
    
    try {
      await CorinaNotificacionService.enviarMensajeWhatsApp(
        telefono.startsWith('whatsapp:') ? telefono : `whatsapp:${telefono}`,
        `🔐 CORINA\n\nCódigo de verificación\n\nTu código es: ${codigoVerificacion}\n\nEste código expira en 10 minutos.`
      );
      console.log('✅ Código enviado exitosamente!\n');
    } catch (error: any) {
      console.error('❌ Error enviando código:', error.message);
      console.log('\n⚠️  Puedes usar el código manualmente:\n');
      console.log(`   Código: ${codigoVerificacion}\n`);
      console.log('   O usar la API directamente (ver GUIA_VERIFICACION_TELEFONO.md)\n');
    }

    // Pedir código al usuario
    console.log('═══════════════════════════════════════════════════');
    console.log('  VERIFICAR CÓDIGO');
    console.log('═══════════════════════════════════════════════════\n');
    console.log('Revisa tu WhatsApp y ingresa el código recibido.\n');

    const codigoIngresado = await pregunta('Código (6 dígitos): ');

    // Verificar código
    const usuarioActualizado = await prisma.usuario.findUnique({
      where: { id: usuario.id },
      select: {
        codigoVerificacionTelefono: true,
      },
    });

    if (!usuarioActualizado?.codigoVerificacionTelefono) {
      throw new Error('No hay código de verificación pendiente');
    }

    if (usuarioActualizado.codigoVerificacionTelefono !== codigoIngresado.trim()) {
      console.log('\n❌ Código incorrecto. Intenta nuevamente ejecutando este script.\n');
      rl.close();
      process.exit(1);
    }

    // Código correcto - marcar como verificado
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        telefonoVerificado: true,
        fechaVerificacionTelefono: new Date(),
        codigoVerificacionTelefono: null,
      },
    });

    console.log('\n✅ Teléfono verificado exitosamente!\n');

    // Preguntar si activar notificaciones
    const activarNotif = await pregunta('¿Deseas activar las notificaciones automáticas? (s/n): ');

    if (activarNotif.toLowerCase() === 's') {
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { notificacionesWhatsAppActivas: true },
      });
      console.log('\n✅ Notificaciones activadas!\n');
    }

    console.log('═══════════════════════════════════════════════════');
    console.log('  ✅ VERIFICACIÓN COMPLETA');
    console.log('═══════════════════════════════════════════════════\n');
    console.log('Ahora puedes ejecutar los tests:');
    console.log('  npm run test-corina-fase1\n');

    rl.close();
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

verificarTelefonoCompleto();

