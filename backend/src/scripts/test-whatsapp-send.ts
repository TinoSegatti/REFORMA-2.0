/**
 * Script de prueba para enviar un mensaje de WhatsApp
 * Ejecutar: npm run test-whatsapp-send
 * 
 * IMPORTANTE: Asegúrate de estar unido al Sandbox de Twilio antes de ejecutar este script
 */

import twilio from 'twilio';
import * as dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
const toNumber = process.env.TWILIO_WHATSAPP_TO;

if (!accountSid || !authToken || !fromNumber || !toNumber) {
  console.error('❌ Faltan variables de entorno de Twilio');
  console.error('Verifica que las siguientes variables estén configuradas en .env:');
  console.error('  - TWILIO_ACCOUNT_SID');
  console.error('  - TWILIO_AUTH_TOKEN');
  console.error('  - TWILIO_WHATSAPP_NUMBER');
  console.error('  - TWILIO_WHATSAPP_TO');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

async function sendTestMessage() {
  try {
    console.log('📤 Enviando mensaje de prueba por WhatsApp...\n');
    console.log('  De:', fromNumber);
    console.log('  Para:', toNumber);
    console.log('');

    // No incluir statusCallback para evitar errores con configuración de Twilio
    const message = await client.messages.create({
      from: fromNumber,
      to: toNumber,
      body: 'Hola! Este es un mensaje de prueba de CORINA 🚀\n\nSi recibes esto, la configuración está correcta!\n\nFecha: ' + new Date().toLocaleString('es-AR'),
      // No incluir statusCallback - Twilio puede tenerlo configurado como "none" en la consola
    } as any);

    console.log('✅ Mensaje enviado exitosamente!');
    console.log('  Message SID:', message.sid);
    console.log('  Status:', message.status);
    console.log('  Date Created:', message.dateCreated);
    console.log('\n📱 Verifica en tu WhatsApp que recibiste el mensaje');

    return true;
  } catch (error: any) {
    console.error('\n❌ Error enviando mensaje:', error.message);
    
    if (error.code === 21211) {
      console.error('\n  El número de destino no está verificado en el Sandbox');
      console.error('  Pasos para solucionarlo:');
      console.error('  1. Ve a: https://console.twilio.com/us1/develop/sms/sandbox');
      console.error('  2. Busca el código del Sandbox (ej: "join example-code")');
      console.error('  3. Desde tu WhatsApp, envía ese código al número: +1 415 523 8886');
      console.error('  4. Espera la confirmación y vuelve a ejecutar este script');
    } else if (error.code === 21608) {
      console.error('\n  No tienes créditos suficientes en tu cuenta de Twilio');
      console.error('  Ve a: https://console.twilio.com/ para agregar créditos');
    } else if (error.code === 20003) {
      console.error('\n  Credenciales de Twilio incorrectas');
      console.error('  Verifica TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN en .env');
    }

    return false;
  }
}

sendTestMessage()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Error inesperado:', error);
    process.exit(1);
  });

