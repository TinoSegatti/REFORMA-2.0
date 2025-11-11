/**
 * Script para probar el servicio de email
 * Ejecutar: npx tsx scripts/probar-email.ts
 */

import dotenv from 'dotenv';
import { enviarEmailVerificacion, verificarConfiguracionEmail } from '../src/services/emailService';

dotenv.config();

async function probarEmail() {
  console.log('🧪 Probando servicio de email...\n');

  // Verificar configuración
  const configurado = verificarConfiguracionEmail();
  if (!configurado) {
    console.error('❌ Configuración SMTP incompleta');
    console.log('\nVariables requeridas:');
    console.log('  - SMTP_HOST');
    console.log('  - SMTP_USER');
    console.log('  - SMTP_PASSWORD');
    process.exit(1);
  }

  console.log('✅ Configuración SMTP encontrada');
  console.log(`   Host: ${process.env.SMTP_HOST}`);
  console.log(`   Port: ${process.env.SMTP_PORT}`);
  console.log(`   User: ${process.env.SMTP_USER}\n`);

  // Email de prueba
  const emailPrueba = process.env.EMAIL_PRUEBA || 'reforma.soft.co@gmail.com';
  const tokenPrueba = 'token-de-prueba-1234567890';

  console.log(`📧 Enviando email de prueba a: ${emailPrueba}...\n`);

  try {
    await enviarEmailVerificacion(
      emailPrueba,
      'Usuario de Prueba',
      tokenPrueba
    );
    console.log('✅ Email enviado exitosamente!');
    console.log(`\n📬 Revisa la bandeja de entrada de: ${emailPrueba}`);
    console.log('   (También revisa la carpeta de spam)');
  } catch (error: any) {
    console.error('❌ Error enviando email:', error.message);
    process.exit(1);
  }
}

probarEmail();

