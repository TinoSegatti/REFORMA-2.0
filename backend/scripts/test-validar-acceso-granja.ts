/**
 * Script de prueba para middleware validarAccesoGranja
 * 
 * Ejecutar: npx ts-node scripts/test-validar-acceso-granja.ts
 * 
 * IMPORTANTE: Asegúrate de que el servidor backend esté corriendo antes de ejecutar este script
 */

import dotenv from 'dotenv';
import path from 'path';
import prisma from '../src/lib/prisma';
import { generarCodigoReferencia, vincularUsuarioEmpleado } from '../src/services/usuarioEmpleadoService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_URL = process.env.API_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || '';

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function testAccesoGranja(
  name: string,
  token: string,
  granjaId: string,
  expectedSuccess: boolean
): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/api/granjas/${granjaId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (expectedSuccess) {
      if (response.ok) {
        results.push({ name, success: true });
        console.log(`✅ ${name}: Acceso permitido`);
      } else {
        const errorData: any = await response.json();
        results.push({ name, success: false, error: errorData?.error || 'Error desconocido' });
        console.error(`❌ ${name}:`, errorData?.error || 'Error desconocido');
      }
    } else {
      if (!response.ok) {
        const errorData: any = await response.json();
        results.push({ name, success: true });
        console.log(`✅ ${name}: Acceso denegado correctamente - ${errorData?.error || 'Error esperado'}`);
      } else {
        results.push({ name, success: false, error: 'Se esperaba un error pero el acceso fue permitido' });
        console.error(`❌ ${name}: Se esperaba un error pero el acceso fue permitido`);
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

async function limpiarDatosTest() {
  const emailsTest = [
    'test-dueño-acceso@test.com',
    'test-empleado-acceso@test.com',
    'test-usuario-sin-acceso@test.com',
  ];

  for (const email of emailsTest) {
    await prisma.usuario.deleteMany({
      where: { email },
    });
  }

  await prisma.granja.deleteMany({
    where: {
      nombreGranja: {
        in: ['Granja Test Dueño', 'Granja Test Sin Acceso']
      }
    }
  });

  console.log('🧹 Datos de prueba eliminados');
}

async function crearDatosTest() {
  // Crear usuario dueño
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const dueño = await prisma.usuario.create({
    data: {
      email: 'test-dueño-acceso@test.com',
      passwordHash,
      nombreUsuario: 'Dueño',
      apellidoUsuario: 'Test',
      tipoUsuario: 'CLIENTE',
      planSuscripcion: 'STARTER',
      emailVerificado: true,
      activo: true,
    },
  });

  // Crear granja para el dueño
  const granjaDueño = await prisma.granja.create({
    data: {
      nombreGranja: 'Granja Test Dueño',
      descripcion: 'Granja de prueba del dueño',
      idUsuario: dueño.id,
      activa: true,
    },
  });

  // Crear usuario empleado
  const empleado = await prisma.usuario.create({
    data: {
      email: 'test-empleado-acceso@test.com',
      passwordHash,
      nombreUsuario: 'Empleado',
      apellidoUsuario: 'Test',
      tipoUsuario: 'CLIENTE',
      planSuscripcion: 'STARTER',
      emailVerificado: true,
      activo: true,
      esUsuarioEmpleado: true,
      idUsuarioDueño: dueño.id,
      fechaVinculacion: new Date(),
      rolEmpleado: 'EDITOR',
      activoComoEmpleado: true,
    },
  });

  // Crear usuario sin acceso
  const usuarioSinAcceso = await prisma.usuario.create({
    data: {
      email: 'test-usuario-sin-acceso@test.com',
      passwordHash,
      nombreUsuario: 'Usuario',
      apellidoUsuario: 'Sin Acceso',
      tipoUsuario: 'CLIENTE',
      planSuscripcion: 'DEMO',
      emailVerificado: true,
      activo: true,
    },
  });

  // Crear granja para usuario sin acceso
  const granjaSinAcceso = await prisma.granja.create({
    data: {
      nombreGranja: 'Granja Test Sin Acceso',
      descripcion: 'Granja de prueba sin acceso',
      idUsuario: usuarioSinAcceso.id,
      activa: true,
    },
  });

  // Generar tokens JWT
  const tokenDueño = jwt.sign(
    { userId: dueño.id, email: dueño.email, tipo: dueño.tipoUsuario },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const tokenEmpleado = jwt.sign(
    { userId: empleado.id, email: empleado.email, tipo: empleado.tipoUsuario },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const tokenSinAcceso = jwt.sign(
    { userId: usuarioSinAcceso.id, email: usuarioSinAcceso.email, tipo: usuarioSinAcceso.tipoUsuario },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  console.log(`👤 Usuario dueño creado: ${dueño.email}`);
  console.log(`👤 Usuario empleado creado: ${empleado.email}`);
  console.log(`👤 Usuario sin acceso creado: ${usuarioSinAcceso.email}`);
  console.log(`🏭 Granja del dueño creada: ${granjaDueño.id}`);
  console.log(`🏭 Granja sin acceso creada: ${granjaSinAcceso.id}`);

  return {
    dueño,
    empleado,
    usuarioSinAcceso,
    granjaDueño,
    granjaSinAcceso,
    tokenDueño,
    tokenEmpleado,
    tokenSinAcceso,
  };
}

async function runTests() {
  console.log('🧪 Iniciando pruebas de validación de acceso a granjas...\n');
  console.log(`📍 API URL: ${API_URL}\n`);

  try {
    // Limpiar datos de prueba anteriores
    await limpiarDatosTest();

    // Crear datos de prueba
    const datos = await crearDatosTest();

    console.log('\n📋 Ejecutando pruebas...\n');

    // Test 1: Dueño accede a su propia granja
    await testAccesoGranja(
      'Dueño accede a su propia granja',
      datos.tokenDueño,
      datos.granjaDueño.id,
      true
    );

    // Test 2: Empleado accede a granja de su dueño
    await testAccesoGranja(
      'Empleado accede a granja de su dueño',
      datos.tokenEmpleado,
      datos.granjaDueño.id,
      true
    );

    // Test 3: Dueño intenta acceder a granja de otro usuario
    await testAccesoGranja(
      'Dueño intenta acceder a granja de otro usuario',
      datos.tokenDueño,
      datos.granjaSinAcceso.id,
      false
    );

    // Test 4: Empleado intenta acceder a granja de otro usuario
    await testAccesoGranja(
      'Empleado intenta acceder a granja de otro usuario',
      datos.tokenEmpleado,
      datos.granjaSinAcceso.id,
      false
    );

    // Test 5: Usuario sin acceso intenta acceder a granja del dueño
    await testAccesoGranja(
      'Usuario sin acceso intenta acceder a granja del dueño',
      datos.tokenSinAcceso,
      datos.granjaDueño.id,
      false
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
  } catch (error) {
    console.error('Error ejecutando pruebas:', error);
    process.exit(1);
  } finally {
    // Limpiar datos de prueba
    await limpiarDatosTest();
    await prisma.$disconnect();
  }
}

runTests().catch(console.error);

