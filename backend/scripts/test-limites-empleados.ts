/**
 * Script de prueba para validación de límites cuando el usuario es empleado
 * Verifica que los empleados usen el plan del dueño para validar límites
 * 
 * Ejecutar: npx ts-node scripts/test-limites-empleados.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import prisma from '../src/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PlanSuscripcion } from '../src/constants/planes';

dotenv.config({ path: path.join(__dirname, '../.env') });

const API_URL = process.env.API_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || '';

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function testCrearRecurso(
  name: string,
  token: string,
  endpoint: string,
  body: any,
  expectedSuccess: boolean
): Promise<void> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const responseData: any = await response.json();

    if (expectedSuccess) {
      if (response.ok) {
        results.push({ name, success: true });
        console.log(`✅ ${name}`);
      } else {
        results.push({ name, success: false, error: responseData?.error || 'Error desconocido' });
        console.error(`❌ ${name}:`, responseData?.error || 'Error desconocido');
      }
    } else {
      if (!response.ok && responseData?.error?.includes('límite')) {
        results.push({ name, success: true });
        console.log(`✅ ${name}: ${responseData?.error || 'Error esperado'}`);
      } else {
        results.push({ name, success: false, error: 'Se esperaba un error de límite' });
        console.error(`❌ ${name}: Se esperaba un error de límite`);
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
    'test-dueño-limites@test.com',
    'test-empleado-limites@test.com',
  ];

  for (const email of emailsTest) {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: { id: true }
    });

    if (usuario) {
      const granjas = await prisma.granja.findMany({
        where: { idUsuario: usuario.id }
      });

      for (const granja of granjas) {
        await prisma.materiaPrima.deleteMany({ where: { idGranja: granja.id } });
        await prisma.proveedor.deleteMany({ where: { idGranja: granja.id } });
        await prisma.compraCabecera.deleteMany({ where: { idGranja: granja.id } });
        await prisma.formulaCabecera.deleteMany({ where: { idGranja: granja.id } });
        await prisma.fabricacion.deleteMany({ where: { idGranja: granja.id } });
        await prisma.granja.delete({ where: { id: granja.id } });
      }

      await prisma.usuario.delete({ where: { id: usuario.id } });
    }
  }

  console.log('🧹 Datos de prueba eliminados');
}

async function crearDatosTest() {
  const passwordHash = await bcrypt.hash('password123', 10);
  
  // Crear usuario dueño con plan STARTER
  const dueño = await prisma.usuario.create({
    data: {
      email: 'test-dueño-limites@test.com',
      passwordHash,
      nombreUsuario: 'Dueño',
      apellidoUsuario: 'Test',
      tipoUsuario: 'CLIENTE',
      planSuscripcion: PlanSuscripcion.STARTER,
      emailVerificado: true,
      activo: true,
    },
  });

  // Crear granja para el dueño
  const granjaDueño = await prisma.granja.create({
    data: {
      nombreGranja: 'Granja Dueño Test',
      descripcion: 'Granja de prueba del dueño',
      idUsuario: dueño.id,
      activa: true,
    },
  });

  // Crear usuario empleado (con plan DEMO, pero debe usar plan del dueño)
  const empleado = await prisma.usuario.create({
    data: {
      email: 'test-empleado-limites@test.com',
      passwordHash,
      nombreUsuario: 'Empleado',
      apellidoUsuario: 'Test',
      tipoUsuario: 'CLIENTE',
      planSuscripcion: PlanSuscripcion.DEMO, // Plan DEMO, pero debe usar plan STARTER del dueño
      emailVerificado: true,
      activo: true,
      esUsuarioEmpleado: true,
      idUsuarioDueño: dueño.id,
      fechaVinculacion: new Date(),
      rolEmpleado: 'EDITOR',
      activoComoEmpleado: true,
    },
  });

  // Generar tokens
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

  console.log(`👤 Usuario dueño creado: ${dueño.email} (Plan: ${dueño.planSuscripcion})`);
  console.log(`👤 Usuario empleado creado: ${empleado.email} (Plan propio: ${empleado.planSuscripcion}, debe usar: ${dueño.planSuscripcion})`);
  console.log(`🏭 Granja del dueño creada: ${granjaDueño.id}`);

  return {
    dueño,
    empleado,
    granjaDueño,
    tokenDueño,
    tokenEmpleado,
  };
}

async function runTests() {
  console.log('🧪 Iniciando pruebas de límites para empleados...\n');
  console.log(`📍 API URL: ${API_URL}\n`);

  try {
    await limpiarDatosTest();
    const datos = await crearDatosTest();

    console.log('\n📋 Ejecutando pruebas...\n');

    // Test: Empleado debe poder crear hasta 20 materias primas (límite STARTER del dueño)
    // aunque su plan propio sea DEMO (límite 10)
    console.log('📦 Test: Empleado usa límites del plan del dueño (STARTER)...');
    
    // Crear 20 materias primas como empleado (debe funcionar porque el dueño tiene plan STARTER)
    for (let i = 1; i <= 20; i++) {
      await testCrearRecurso(
        `Empleado crea materia prima ${i}/20 (límite STARTER)`,
        datos.tokenEmpleado,
        `/api/materias-primas/${datos.granjaDueño.id}`,
        {
          codigoMateriaPrima: `MP-EMP-${i}`,
          nombreMateriaPrima: `Materia Prima Empleado ${i}`,
          unidadMedida: 'kg',
          activa: true
        },
        true
      );
    }

    // Intentar crear la 21ª (debe fallar porque el límite STARTER es 20)
    await testCrearRecurso(
      'Empleado intenta crear 21ª materia prima (debe rechazar - límite STARTER)',
      datos.tokenEmpleado,
      `/api/materias-primas/${datos.granjaDueño.id}`,
      {
        codigoMateriaPrima: 'MP-EMP-21',
        nombreMateriaPrima: 'Materia Prima Empleado 21',
        unidadMedida: 'kg',
        activa: true
      },
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
      console.log('✅ Los empleados usan correctamente el plan del dueño para validar límites');
      process.exit(0);
    } else {
      console.log('\n⚠️  Algunas pruebas fallaron. Revisa los errores arriba.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error ejecutando pruebas:', error);
    process.exit(1);
  } finally {
    await limpiarDatosTest();
    await prisma.$disconnect();
  }
}

runTests().catch(console.error);

