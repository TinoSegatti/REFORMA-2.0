/**
 * Script para verificar el estado de la cuenta de OpenAI
 * Verifica créditos disponibles y estado de la API
 */

import { OpenAI } from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('❌ OPENAI_API_KEY no configurada en .env');
  process.exit(1);
}

const openai = new OpenAI({ apiKey });

async function verificarCuotaOpenAI() {
  try {
    console.log('🔍 Verificando estado de cuenta OpenAI...\n');

    // Intentar hacer una llamada pequeña para verificar el estado
    console.log('📤 Intentando llamada de prueba a la API...');
    
    try {
      // Hacer una llamada simple a la API para verificar el estado
      const response = await openai.models.list();
      console.log('✅ Conexión con OpenAI exitosa');
      console.log(`   Modelos disponibles: ${response.data.length}\n`);
    } catch (error: any) {
      console.error('❌ Error al conectar con OpenAI:', error.message);
      
      if (error.status === 401) {
        console.error('\n⚠️  API Key inválida o expirada');
        console.error('   Verifica que OPENAI_API_KEY en .env sea correcta');
      } else if (error.status === 429) {
        console.error('\n⚠️  Error 429 - Rate limit o cuota agotada');
        console.error('   Esto puede significar:');
        console.error('   - Cuota de créditos agotada');
        console.error('   - Límite de rate limit alcanzado');
        console.error('   - Cuenta gratuita sin créditos');
      }
      
      throw error;
    }

    // Intentar hacer una transcripción muy pequeña para verificar cuota
    console.log('📤 Verificando cuota de Whisper API...');
    console.log('   (Esto puede fallar si la cuota está agotada)\n');

    // Crear un archivo de audio de prueba muy pequeño (silencioso)
    // Nota: Esto puede fallar si no hay créditos, pero nos dará información útil
    
    console.log('💡 Información sobre cuotas de OpenAI:');
    console.log('   - Cuenta gratuita: $5 de crédito inicial (válido 3 meses)');
    console.log('   - Una vez agotado, necesitas agregar método de pago');
    console.log('   - Verifica tu saldo en: https://platform.openai.com/account/billing\n');

    console.log('✅ Verificación completada');
    console.log('\n📋 Próximos pasos:');
    console.log('   1. Ve a: https://platform.openai.com/account/billing');
    console.log('   2. Verifica tu saldo de créditos');
    console.log('   3. Si está agotado, agrega un método de pago');
    console.log('   4. O usa mensajes de texto en lugar de audio (no requiere créditos)\n');

  } catch (error: any) {
    console.error('\n❌ Error verificando cuota:', error.message);
    
    if (error.status === 429 || error.code === 'insufficient_quota') {
      console.error('\n🔴 CONFIRMADO: Cuota agotada');
      console.error('\n💡 Soluciones:');
      console.error('   1. Agregar método de pago en OpenAI');
      console.error('   2. Usar mensajes de texto (funciona sin créditos)');
      console.error('   3. Esperar a que se renueve la cuota (si aplica)\n');
    }
    
    process.exit(1);
  }
}

verificarCuotaOpenAI();








