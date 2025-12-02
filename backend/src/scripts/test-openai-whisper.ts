/**
 * Script de prueba para verificar credenciales de OpenAI y Whisper API
 * Ejecutar: npm run test-openai-whisper
 * 
 * NOTA: Para probar la transcripción, necesitas un archivo de audio.
 * Puedes grabar un audio corto con tu teléfono y guardarlo como test-audio.mp3 en la raíz del backend
 */

import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('❌ Faltan variables de entorno de OpenAI');
  console.error('Verifica que OPENAI_API_KEY esté configurada en .env');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: apiKey,
});

async function testOpenAI() {
  try {
    console.log('🔍 Verificando acceso a OpenAI API...\n');

    // Probar acceso a la API
    const response = await openai.models.list();
    console.log('✅ OpenAI conectado exitosamente');
    console.log('  Modelos disponibles:', response.data.length);
    console.log('  Primeros modelos:', response.data.slice(0, 5).map((m) => m.id).join(', '));

    // Verificar que Whisper está disponible
    const whisperModel = response.data.find((m) => m.id === 'whisper-1');
    if (whisperModel) {
      console.log('\n✅ Whisper API disponible');
    } else {
      console.log('\n⚠️ Whisper-1 no encontrado en la lista (puede ser normal)');
    }

    return true;
  } catch (error: any) {
    console.error('\n❌ Error conectando con OpenAI:', error.message);
    if (error.status === 401) {
      console.error('  Posible causa: API Key incorrecta o inválida');
    } else if (error.status === 429) {
      console.error('  Posible causa: Límite de rate excedido');
    }
    return false;
  }
}

async function testWhisperAPI() {
  try {
    const audioPath = path.join(__dirname, '../../test-audio.mp3');

    if (!fs.existsSync(audioPath)) {
      console.log('\n⚠️ Archivo test-audio.mp3 no encontrado');
      console.log('  Para probar la transcripción:');
      console.log('  1. Graba un audio corto con tu teléfono');
      console.log('  2. Guárdalo como test-audio.mp3 en la carpeta backend/');
      console.log('  3. Vuelve a ejecutar este script');
      return false;
    }

    console.log('\n🎤 Transcribiendo audio con Whisper API...');
    console.log('  Archivo:', audioPath);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: 'whisper-1',
      language: 'es', // Opcional: especificar español
    });

    console.log('\n✅ Whisper API funcionando correctamente');
    console.log('📝 Texto transcrito:');
    console.log('  "' + transcription.text + '"');

    return true;
  } catch (error: any) {
    console.error('\n❌ Error usando Whisper API:', error.message);
    if (error.status === 401) {
      console.error('  Posible causa: API Key incorrecta');
    } else if (error.status === 429) {
      console.error('  Posible causa: Límite de rate excedido');
    } else if (error.status === 400) {
      console.error('  Posible causa: Formato de audio no válido o archivo muy grande');
    }
    return false;
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  TEST: OpenAI y Whisper API');
  console.log('═══════════════════════════════════════════════════\n');

  const openaiOk = await testOpenAI();

  if (openaiOk) {
    await testWhisperAPI();
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Tests completados');
  console.log('═══════════════════════════════════════════════════');
}

runTests()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error inesperado:', error);
    process.exit(1);
  });








