/**
 * Script de prueba para verificar credenciales de Twilio
 * Ejecutar: npm run test-twilio-credentials
 */

import twilio from 'twilio';
import * as dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  console.error('❌ Faltan variables de entorno de Twilio');
  console.error('Verifica que TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN estén configuradas en .env');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

async function testTwilio() {
  try {
    console.log('🔍 Verificando credenciales de Twilio...\n');

    // Verificar cuenta
    const account = await client.api.accounts(accountSid).fetch();
    console.log('✅ Twilio conectado exitosamente');
    console.log('  Account Name:', account.friendlyName);
    console.log('  Account Status:', account.status);
    console.log('  Account SID:', account.sid);

    // Verificar número de WhatsApp
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    if (whatsappNumber) {
      console.log('\n✅ Número WhatsApp configurado:', whatsappNumber);
    } else {
      console.log('\n⚠️ TWILIO_WHATSAPP_NUMBER no está configurado en .env');
    }

    const whatsappTo = process.env.TWILIO_WHATSAPP_TO;
    if (whatsappTo) {
      console.log('✅ Número destino configurado:', whatsappTo);
    } else {
      console.log('⚠️ TWILIO_WHATSAPP_TO no está configurado en .env');
    }

    console.log('\n✅ Todas las verificaciones pasaron correctamente');
    return true;
  } catch (error: any) {
    console.error('\n❌ Error conectando con Twilio:', error.message);
    if (error.code === 20003) {
      console.error('  Posible causa: Credenciales incorrectas');
    } else if (error.code === 20404) {
      console.error('  Posible causa: Account SID no encontrado');
    }
    return false;
  }
}

testTwilio()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Error inesperado:', error);
    process.exit(1);
  });






