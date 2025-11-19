/**
 * Script de prueba para registro con código de referencia
 * 
 * Ejecutar: npx ts-node scripts/test-registro-codigo-referencia.ts
 * 
 * IMPORTANTE: Asegúrate de que el servidor backend esté corriendo antes de ejecutar este script
 */

import dotenv from 'dotenv';
import path from 'path';
import prisma from '../src/lib/prisma';
import { generarCodigoReferencia } from '../src/services/usuarioEmpleadoService';
import bcrypt from 'bcryptjs';

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_URL = process.env.API_URL || 'http://localhost:3000';

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
  data?: any;
}

const results: TestResult[] = [];

async function testRegistro(
  name: string,
  data: {
    email: string;
    password: string;
    nombreUsuario: string;
    apellidoUsuario: string;
    codigoReferencia?: string;
  },
  expectedSuccess: boolean
): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/api/usuarios/registro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData: any = await response.json();

    if (expectedSuccess) {
      if (response.ok) {
        results.push({
          name,
          success: true,
          data: {
            email: responseData.usuario?.email,
            esEmpleado: responseData.esEmpleado,
            plan: responseData.usuario?.planSuscripcion,
          },
        });
        console.log(`✅ ${name}:`, JSON.stringify(responseData, null, 2));
      } else {
        results.push({
          name,
          success: false,
          error: responseData.error || 'Error desconocido',
        });
        console.error(`❌ ${name}:`, responseData.error || 'Error desconocido');
      }
    } else {
      if (!response.ok) {
        results.push({
          name,
          success: true,
          error: responseData.error || 'Error esperado',
        });
        console.log(`✅ ${name}: Error esperado -`, responseData.error || 'Error desconocido');
      } else {
        results.push({
          name,
          success: false,
          error: 'Se esperaba un error pero el registro fue exitoso',
        });
        console.error(`❌ ${name}: Se esperaba un error pero el registro fue exitoso`);
      }
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

async function limpiarUsuariosTest() {
  // Eliminar usuarios de prueba
  const emailsTest = [
    'test-registro-demo@test.com',
    'test-registro-empleado@test.com',
    'test-registro-codigo-invalido@test.com',
    'test-dueño-empleados@test.com',
  ];

  for (const email of emailsTest) {
    await prisma.usuario.deleteMany({
      where: { email },
    });
  }

  console.log('🧹 Usuarios de prueba eliminados');
}

async function crearUsuarioDueño() {
  // Crear usuario dueño para pruebas
  const email = 'test-dueño-empleados@test.com';
  
  // Eliminar si existe
  await prisma.usuario.deleteMany({
    where: { email },
  });

  const passwordHash = await bcrypt.hash('password123', 10);
  
  const usuario = await prisma.usuario.create({
    data: {
      email,
      passwordHash,
      nombreUsuario: 'Dueño',
      apellidoUsuario: 'Test',
      tipoUsuario: 'CLIENTE',
      planSuscripcion: 'STARTER',
      emailVerificado: true,
      activo: true,
    },
  });

  // Generar código de referencia
  const codigo = await generarCodigoReferencia(usuario.id);
  
  console.log(`👤 Usuario dueño creado: ${email}`);
  console.log(`🔑 Código de referencia: ${codigo}`);
  
  return { usuario, codigo };
}

async function runTests() {
  console.log('🧪 Iniciando pruebas de registro con código de referencia...\n');
  console.log(`📍 API URL: ${API_URL}\n`);

  try {
    // Limpiar usuarios de prueba anteriores
    await limpiarUsuariosTest();

    // Crear usuario dueño para pruebas
    const { usuario: usuarioDueño, codigo } = await crearUsuarioDueño();

    console.log('\n📋 Ejecutando pruebas...\n');

    // Test 1: Registro sin código de referencia (debe crear usuario DEMO)
    await testRegistro(
      'Registro sin código de referencia (Plan DEMO)',
      {
        email: 'test-registro-demo@test.com',
        password: 'password123',
        nombreUsuario: 'Usuario',
        apellidoUsuario: 'Demo',
      },
      true
    );

    // Test 2: Registro con código válido (debe vincular como empleado)
    await testRegistro(
      'Registro con código válido (debe vincular como empleado)',
      {
        email: 'test-registro-empleado@test.com',
        password: 'password123',
        nombreUsuario: 'Usuario',
        apellidoUsuario: 'Empleado',
        codigoReferencia: codigo,
      },
      true
    );

    // Test 3: Registro con código inválido (debe rechazar)
    await testRegistro(
      'Registro con código inválido (debe rechazar)',
      {
        email: 'test-registro-codigo-invalido@test.com',
        password: 'password123',
        nombreUsuario: 'Usuario',
        apellidoUsuario: 'Invalido',
        codigoReferencia: 'REF-INVALIDO-XXXXXXXX',
      },
      false
    );

    // Verificar que el empleado fue vinculado correctamente
    const empleadoVinculado = await prisma.usuario.findUnique({
      where: { email: 'test-registro-empleado@test.com' },
      select: {
        esUsuarioEmpleado: true,
        idUsuarioDueño: true,
        planSuscripcion: true,
        rolEmpleado: true,
      },
    });

    if (empleadoVinculado) {
      if (
        empleadoVinculado.esUsuarioEmpleado &&
        empleadoVinculado.idUsuarioDueño === usuarioDueño.id &&
        empleadoVinculado.planSuscripcion === usuarioDueño.planSuscripcion
      ) {
        results.push({
          name: 'Verificación: Empleado vinculado correctamente',
          success: true,
          data: empleadoVinculado,
        });
        console.log('✅ Verificación: Empleado vinculado correctamente');
      } else {
        results.push({
          name: 'Verificación: Empleado vinculado correctamente',
          success: false,
          error: 'El empleado no fue vinculado correctamente',
        });
        console.error('❌ Verificación: El empleado no fue vinculado correctamente');
      }
    }

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
  } catch (error) {
    console.error('Error ejecutando pruebas:', error);
    process.exit(1);
  } finally {
    // Limpiar usuarios de prueba
    await limpiarUsuariosTest();
    await prisma.$disconnect();
  }
}

runTests().catch(console.error);

