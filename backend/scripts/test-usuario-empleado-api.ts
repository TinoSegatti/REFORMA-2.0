/**
 * Script de prueba para endpoints API de usuarios empleados
 * 
 * Ejecutar: npx ts-node scripts/test-usuario-empleado-api.ts
 * 
 * IMPORTANTE: Asegúrate de que el servidor backend esté corriendo antes de ejecutar este script
 */

import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Token de autenticación (debe ser obtenido del login)
// Por ahora, este script requiere que proporciones un token manualmente
const TEST_TOKEN = process.env.TEST_TOKEN || '';

interface TestResult {
  name: string;
  success: boolean;
  status?: number;
  error?: string;
  data?: any;
}

const results: TestResult[] = [];

async function testEndpoint(
  name: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  body?: any
): Promise<void> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (TEST_TOKEN) {
      headers['Authorization'] = `Bearer ${TEST_TOKEN}`;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data: any = await response.json();

    if (response.ok) {
      results.push({
        name,
        success: true,
        status: response.status,
        data,
      });
      console.log(`✅ ${name}:`, JSON.stringify(data, null, 2));
    } else {
      results.push({
        name,
        success: false,
        status: response.status,
        error: data?.error || 'Error desconocido',
      });
      console.error(`❌ ${name}:`, data?.error || 'Error desconocido');
    }
  } catch (error) {
    results.push({
      name,
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
    console.error(`❌ ${name}:`, error);
  }
}

async function runTests() {
  console.log('🧪 Iniciando pruebas de API de usuarios empleados...\n');
  console.log(`📍 API URL: ${API_URL}\n`);

  if (!TEST_TOKEN) {
    console.warn('⚠️  ADVERTENCIA: TEST_TOKEN no está configurado.');
    console.log('Las pruebas se ejecutarán sin autenticación para verificar que las rutas existan.\n');
    console.log('Para pruebas completas con autenticación:');
    console.log('1. Inicia sesión en la aplicación y obtén el token JWT');
    console.log('2. Configura la variable de entorno: TEST_TOKEN=tu_token_aqui');
    console.log('3. O ejecuta: TEST_TOKEN=tu_token npx ts-node scripts/test-usuario-empleado-api.ts\n');
  }

  // Test 1: Obtener límite de usuarios
  await testEndpoint(
    'Obtener límite de usuarios empleados',
    'GET',
    '/api/usuarios/empleados/limite'
  );

  // Test 2: Generar código de referencia
  await testEndpoint(
    'Generar código de referencia',
    'GET',
    '/api/usuarios/empleados/codigo-referencia'
  );

  // Test 3: Obtener lista de empleados
  await testEndpoint(
    'Obtener lista de empleados',
    'GET',
    '/api/usuarios/empleados'
  );

  // Test 4: Regenerar código de referencia
  await testEndpoint(
    'Regenerar código de referencia',
    'POST',
    '/api/usuarios/empleados/codigo-referencia/regenerar'
  );

  // Resumen
  console.log('\n📊 Resumen de pruebas:');
  console.log('='.repeat(50));
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  console.log(`✅ Exitosas: ${successCount}/${totalCount}`);
  console.log(`❌ Fallidas: ${totalCount - successCount}/${totalCount}`);

  if (successCount === totalCount) {
    console.log('\n🎉 ¡Todas las pruebas pasaron!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Algunas pruebas fallaron. Revisa los errores arriba.');
    process.exit(1);
  }
}

runTests().catch(console.error);

