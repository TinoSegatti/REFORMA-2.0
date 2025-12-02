/**
 * Script rápido para verificar código de teléfono
 * Ejecutar: npm run verificar-codigo
 */

import * as dotenv from 'dotenv';
import { prisma } from '../config/database';

dotenv.config();

const EMAIL_USUARIO = 'valentinosegatti@gmail.com';
const CODIGO = '731512';

async function verificarCodigo() {
  try {
    console.log('🔐 Verificando código de teléfono...\n');

    const usuario = await prisma.usuario.findUnique({
      where: { email: EMAIL_USUARIO },
      select: {
        id: true,
        email: true,
        codigoVerificacionTelefono: true,
        telefono: true,
      },
    });

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    if (!usuario.codigoVerificacionTelefono) {
      throw new Error('No hay código de verificación pendiente');
    }

    if (usuario.codigoVerificacionTelefono !== CODIGO) {
      console.error('❌ Código incorrecto');
      console.error(`   Código esperado: ${usuario.codigoVerificacionTelefono}`);
      console.error(`   Código ingresado: ${CODIGO}`);
      process.exit(1);
    }

    // Código correcto - marcar como verificado
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        telefonoVerificado: true,
        fechaVerificacionTelefono: new Date(),
        codigoVerificacionTelefono: null,
        notificacionesWhatsAppActivas: true, // Activar notificaciones automáticamente
      },
    });

    console.log('✅ Teléfono verificado exitosamente!');
    console.log(`   Teléfono: ${usuario.telefono}`);
    console.log(`   Notificaciones: ACTIVADAS\n`);

    console.log('═══════════════════════════════════════════════════');
    console.log('  ✅ VERIFICACIÓN COMPLETA');
    console.log('═══════════════════════════════════════════════════\n');
    console.log('Ahora puedes ejecutar los tests:');
    console.log('  npm run test-corina-fase1\n');
    console.log('Y probar la funcionalidad completa de CORINA! 🎉\n');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verificarCodigo();








