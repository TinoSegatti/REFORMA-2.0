/**
 * Script para probar endpoints de suscripción
 * Ejecutar con: tsx scripts/test-endpoints-suscripcion.ts
 */

import dotenv from 'dotenv';
dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Token de prueba (necesitarás obtener uno real del login)
const TEST_TOKEN = process.env.TEST_TOKEN || '';

async function testEndpoint(method: string, endpoint: string, body?: any, token?: string) {
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();

    console.log(`\n${method} ${endpoint}`);
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));

    return { status: response.status, data };
  } catch (error) {
    console.error(`Error en ${method} ${endpoint}:`, error);
    return null;
  }
}

async function probarEndpoints() {
  console.log('🧪 Probando endpoints de suscripción...\n');
  console.log(`API URL: ${API_URL}\n`);

  // 1. Obtener planes (público)
  console.log('='.repeat(50));
  console.log('1. GET /api/suscripcion/planes (PÚBLICO)');
  await testEndpoint('GET', '/api/suscripcion/planes');

  // 2. Obtener mi plan (requiere autenticación)
  if (TEST_TOKEN) {
    console.log('\n' + '='.repeat(50));
    console.log('2. GET /api/suscripcion/mi-plan (AUTENTICADO)');
    await testEndpoint('GET', '/api/suscripcion/mi-plan', undefined, TEST_TOKEN);
  } else {
    console.log('\n⚠️  TEST_TOKEN no configurado, saltando endpoints autenticados');
  }

  // 3. Crear checkout (requiere autenticación)
  if (TEST_TOKEN) {
    console.log('\n' + '='.repeat(50));
    console.log('3. POST /api/suscripcion/crear-checkout (AUTENTICADO)');
    await testEndpoint(
      'POST',
      '/api/suscripcion/crear-checkout',
      {
        plan: 'STARTER',
        periodoFacturacion: 'MENSUAL',
      },
      TEST_TOKEN
    );
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Pruebas completadas');
}

probarEndpoints().catch(console.error);

