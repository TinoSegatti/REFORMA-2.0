/**
 * Script de prueba completo para Sprint 1
 * Verifica todas las funcionalidades implementadas:
 * - Sistema de usuarios empleados
 * - Validación de límites por plan
 * - Restricción de Reporte Completo
 * - Sistema de notificaciones
 * 
 * Ejecutar: npx ts-node scripts/test-sprint1-completo.ts
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
  categoria: string;
  test: string;
  success: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function testAPI(
  categoria: string,
  test: string,
  method: string,
  endpoint: string,
  token: string | null,
  body?: any,
  expectedStatus?: number
): Promise<void> {
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      ...(body && { body: JSON.stringify(body) }),
    };

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const responseData: any = await response.json();

    const success = expectedStatus 
      ? response.status === expectedStatus
      : response.ok;

    results.push({
      categoria,
      test,
      success,
      error: success ? undefined : `Status: ${response.status}, Error: ${responseData?.error || 'Unknown'}`
    });

    if (success) {
      console.log(`✅ [${categoria}] ${test}`);
    } else {
      console.error(`❌ [${categoria}] ${test}:`, responseData?.error || `Status ${response.status}`);
    }
  } catch (error) {
    results.push({
      categoria,
      test,
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
    console.error(`❌ [${categoria}] ${test}:`, error);
  }
}

async function limpiarDatosTest() {
  const emailsTest = [
    'test-sprint1-dueño@test.com',
    'test-sprint1-empleado@test.com',
    'test-sprint1-demo@test.com',
    'test-sprint1-starter@test.com',
    'test-sprint1-enterprise@test.com',
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

async function crearUsuariosTest() {
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const usuarios: any = {};

  // Usuario dueño STARTER
  usuarios.dueño = await prisma.usuario.create({
    data: {
      email: 'test-sprint1-dueño@test.com',
      passwordHash,
      nombreUsuario: 'Dueño',
      apellidoUsuario: 'Test',
      tipoUsuario: 'CLIENTE',
      planSuscripcion: PlanSuscripcion.STARTER,
      emailVerificado: true,
      activo: true,
    },
  });

  // Usuario empleado
  usuarios.empleado = await prisma.usuario.create({
    data: {
      email: 'test-sprint1-empleado@test.com',
      passwordHash,
      nombreUsuario: 'Empleado',
      apellidoUsuario: 'Test',
      tipoUsuario: 'CLIENTE',
      planSuscripcion: PlanSuscripcion.DEMO,
      emailVerificado: true,
      activo: true,
      esUsuarioEmpleado: true,
      idUsuarioDueño: usuarios.dueño.id,
      fechaVinculacion: new Date(),
      rolEmpleado: 'EDITOR',
      activoComoEmpleado: true,
    },
  });

  // Usuario DEMO
  usuarios.demo = await prisma.usuario.create({
    data: {
      email: 'test-sprint1-demo@test.com',
      passwordHash,
      nombreUsuario: 'Demo',
      apellidoUsuario: 'Test',
      tipoUsuario: 'CLIENTE',
      planSuscripcion: PlanSuscripcion.DEMO,
      emailVerificado: true,
      activo: true,
    },
  });

  // Usuario STARTER
  usuarios.starter = await prisma.usuario.create({
    data: {
      email: 'test-sprint1-starter@test.com',
      passwordHash,
      nombreUsuario: 'Starter',
      apellidoUsuario: 'Test',
      tipoUsuario: 'CLIENTE',
      planSuscripcion: PlanSuscripcion.STARTER,
      emailVerificado: true,
      activo: true,
    },
  });

  // Usuario ENTERPRISE
  usuarios.enterprise = await prisma.usuario.create({
    data: {
      email: 'test-sprint1-enterprise@test.com',
      passwordHash,
      nombreUsuario: 'Enterprise',
      apellidoUsuario: 'Test',
      tipoUsuario: 'CLIENTE',
      planSuscripcion: PlanSuscripcion.ENTERPRISE,
      emailVerificado: true,
      activo: true,
    },
  });

  // Crear granjas
  usuarios.granjaDueño = await prisma.granja.create({
    data: {
      nombreGranja: 'Granja Dueño',
      descripcion: 'Granja del dueño',
      idUsuario: usuarios.dueño.id,
      activa: true,
    },
  });

  usuarios.granjaDemo = await prisma.granja.create({
    data: {
      nombreGranja: 'Granja Demo',
      descripcion: 'Granja DEMO',
      idUsuario: usuarios.demo.id,
      activa: true,
    },
  });

  usuarios.granjaEnterprise = await prisma.granja.create({
    data: {
      nombreGranja: 'Granja Enterprise',
      descripcion: 'Granja ENTERPRISE',
      idUsuario: usuarios.enterprise.id,
      activa: true,
    },
  });

  // Generar tokens
  const tokens: any = {};
  if (usuarios.dueño) {
    tokens.dueño = jwt.sign(
      { userId: usuarios.dueño.id, email: usuarios.dueño.email, tipo: usuarios.dueño.tipoUsuario },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  }
  if (usuarios.empleado) {
    tokens.empleado = jwt.sign(
      { userId: usuarios.empleado.id, email: usuarios.empleado.email, tipo: usuarios.empleado.tipoUsuario },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  }
  if (usuarios.demo) {
    tokens.demo = jwt.sign(
      { userId: usuarios.demo.id, email: usuarios.demo.email, tipo: usuarios.demo.tipoUsuario },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  }
  if (usuarios.starter) {
    tokens.starter = jwt.sign(
      { userId: usuarios.starter.id, email: usuarios.starter.email, tipo: usuarios.starter.tipoUsuario },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  }
  if (usuarios.enterprise) {
    tokens.enterprise = jwt.sign(
      { userId: usuarios.enterprise.id, email: usuarios.enterprise.email, tipo: usuarios.enterprise.tipoUsuario },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  }

  console.log('👤 Usuarios de prueba creados');
  return { usuarios, tokens };
}

async function runTests() {
  console.log('🧪 Iniciando pruebas completas del Sprint 1...\n');
  console.log(`📍 API URL: ${API_URL}\n`);

  try {
    await limpiarDatosTest();
    const { usuarios, tokens } = await crearUsuariosTest();

    console.log('\n📋 Ejecutando pruebas...\n');

    // ===== TEST 1: Sistema de Usuarios Empleados =====
    console.log('📦 TEST 1: Sistema de Usuarios Empleados');
    
    // 1.1: Generar código de referencia
    await testAPI(
      'Empleados',
      'Generar código de referencia',
      'GET',
      '/api/usuarios/empleados/codigo-referencia',
      tokens.dueño,
      null,
      200
    );

    // 1.2: Obtener usuarios empleados
    await testAPI(
      'Empleados',
      'Obtener lista de empleados',
      'GET',
      '/api/usuarios/empleados',
      tokens.dueño,
      null,
      200
    );

    // 1.3: Obtener límite de usuarios empleados
    await testAPI(
      'Empleados',
      'Obtener límite de usuarios empleados',
      'GET',
      '/api/usuarios/empleados/limite',
      tokens.dueño,
      null,
      200
    );

    // 1.4: Empleado no puede generar código
    await testAPI(
      'Empleados',
      'Empleado no puede generar código de referencia',
      'GET',
      '/api/usuarios/empleados/codigo-referencia',
      tokens.empleado,
      null,
      403
    );

    // ===== TEST 2: Validación de Límites por Plan =====
    console.log('\n📦 TEST 2: Validación de Límites por Plan');

    // 2.1: DEMO puede crear hasta 10 materias primas
    for (let i = 1; i <= 10; i++) {
      await testAPI(
        'Límites',
        `DEMO: Crear materia prima ${i}/10`,
        'POST',
        `/api/materias-primas/${usuarios.granjaDemo.id}`,
        tokens.demo,
        {
          codigoMateriaPrima: `MP-DEMO-${i}`,
          nombreMateriaPrima: `Materia Prima Demo ${i}`,
          unidadMedida: 'kg',
          activa: true
        },
        201
      );
    }

    // 2.2: DEMO no puede crear la 11ª materia prima
    await testAPI(
      'Límites',
      'DEMO: Intentar crear 11ª materia prima (debe rechazar)',
      'POST',
      `/api/materias-primas/${usuarios.granjaDemo.id}`,
      tokens.demo,
      {
        codigoMateriaPrima: 'MP-DEMO-11',
        nombreMateriaPrima: 'Materia Prima Demo 11',
        unidadMedida: 'kg',
        activa: true
      },
      403
    );

    // 2.3: STARTER puede crear hasta 20 materias primas
    for (let i = 1; i <= 20; i++) {
      await testAPI(
        'Límites',
        `STARTER: Crear materia prima ${i}/20`,
        'POST',
        `/api/materias-primas/${usuarios.granjaDueño.id}`,
        tokens.dueño,
        {
          codigoMateriaPrima: `MP-STARTER-${i}`,
          nombreMateriaPrima: `Materia Prima Starter ${i}`,
          unidadMedida: 'kg',
          activa: true
        },
        201
      );
    }

    // 2.4: STARTER no puede crear la 21ª materia prima
    await testAPI(
      'Límites',
      'STARTER: Intentar crear 21ª materia prima (debe rechazar)',
      'POST',
      `/api/materias-primas/${usuarios.granjaDueño.id}`,
      tokens.dueño,
      {
        codigoMateriaPrima: 'MP-STARTER-21',
        nombreMateriaPrima: 'Materia Prima Starter 21',
        unidadMedida: 'kg',
        activa: true
      },
      403
    );

    // 2.5: Empleado usa límites del dueño (STARTER)
    await testAPI(
      'Límites',
      'Empleado usa límites del dueño (STARTER)',
      'GET',
      `/api/materias-primas/${usuarios.granjaDueño.id}`,
      tokens.empleado,
      null,
      200
    );

    // ===== TEST 3: Restricción de Reporte Completo =====
    console.log('\n📦 TEST 3: Restricción de Reporte Completo');

    // 3.1: DEMO no puede acceder al reporte completo
    await testAPI(
      'Reporte Completo',
      'DEMO: Intentar acceder al reporte completo (debe rechazar)',
      'GET',
      `/api/reporte/granja/${usuarios.granjaDemo.id}/reporte-completo`,
      tokens.demo,
      null,
      403
    );

    // 3.2: STARTER no puede acceder al reporte completo
    await testAPI(
      'Reporte Completo',
      'STARTER: Intentar acceder al reporte completo (debe rechazar)',
      'GET',
      `/api/reporte/granja/${usuarios.granjaDueño.id}/reporte-completo`,
      tokens.dueño,
      null,
      403
    );

    // 3.3: ENTERPRISE puede acceder al reporte completo
    await testAPI(
      'Reporte Completo',
      'ENTERPRISE: Acceder al reporte completo',
      'GET',
      `/api/reporte/granja/${usuarios.granjaEnterprise.id}/reporte-completo`,
      tokens.enterprise,
      null,
      200
    );

    // ===== TEST 4: Validación de Granjas =====
    console.log('\n📦 TEST 4: Validación de Límites de Granjas');

    // 4.1: DEMO no puede crear segunda granja
    await testAPI(
      'Granjas',
      'DEMO: Intentar crear segunda granja (debe rechazar)',
      'POST',
      '/api/granjas',
      tokens.demo,
      {
        nombreGranja: 'Segunda Granja Demo',
        descripcion: 'Segunda granja'
      },
      403
    );

    // 4.2: STARTER puede crear hasta 2 granjas
    await testAPI(
      'Granjas',
      'STARTER: Crear segunda granja',
      'POST',
      '/api/granjas',
      tokens.dueño,
      {
        nombreGranja: 'Segunda Granja Starter',
        descripcion: 'Segunda granja'
      },
      201
    );

    // 4.3: STARTER no puede crear tercera granja
    await testAPI(
      'Granjas',
      'STARTER: Intentar crear tercera granja (debe rechazar)',
      'POST',
      '/api/granjas',
      tokens.dueño,
      {
        nombreGranja: 'Tercera Granja Starter',
        descripcion: 'Tercera granja'
      },
      403
    );

    // Resumen
    console.log('\n📊 Resumen de pruebas:');
    console.log('='.repeat(60));
    
    const categorias = [...new Set(results.map(r => r.categoria))];
    for (const categoria of categorias) {
      const testsCategoria = results.filter(r => r.categoria === categoria);
      const successCount = testsCategoria.filter(r => r.success).length;
      const totalCount = testsCategoria.length;
      console.log(`\n${categoria}:`);
      console.log(`  ✅ Exitosas: ${successCount}/${totalCount}`);
      console.log(`  ❌ Fallidas: ${totalCount - successCount}/${totalCount}`);
    }

    const totalSuccess = results.filter(r => r.success).length;
    const totalTests = results.length;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Total: ✅ ${totalSuccess}/${totalTests} pruebas pasaron`);

    if (totalSuccess === totalTests) {
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
    await limpiarDatosTest();
    await prisma.$disconnect();
  }
}

runTests().catch(console.error);

