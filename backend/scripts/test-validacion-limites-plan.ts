/**
 * Script de prueba para validación de límites por plan
 * 
 * Ejecutar: npx ts-node scripts/test-validacion-limites-plan.ts
 * 
 * IMPORTANTE: Asegúrate de que el servidor backend esté corriendo antes de ejecutar este script
 */

import dotenv from 'dotenv';
import path from 'path';
import prisma from '../src/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PlanSuscripcion } from '../src/constants/planes';

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
        console.log(`✅ ${name}: Recurso creado exitosamente`);
      } else {
        results.push({ name, success: false, error: responseData?.error || 'Error desconocido' });
        console.error(`❌ ${name}:`, responseData?.error || 'Error desconocido');
      }
    } else {
      if (!response.ok && responseData?.error?.includes('límite')) {
        results.push({ name, success: true });
        console.log(`✅ ${name}: Límite validado correctamente - ${responseData?.error || 'Error esperado'}`);
      } else {
        results.push({ name, success: false, error: 'Se esperaba un error de límite pero no se recibió' });
        console.error(`❌ ${name}: Se esperaba un error de límite pero no se recibió`);
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
    'test-limite-demo@test.com',
    'test-limite-starter@test.com',
  ];

  for (const email of emailsTest) {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: { id: true }
    });

    if (usuario) {
      // Eliminar granjas y sus datos relacionados
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
  
  // Crear usuario DEMO
  const usuarioDemo = await prisma.usuario.create({
    data: {
      email: 'test-limite-demo@test.com',
      passwordHash,
      nombreUsuario: 'Usuario',
      apellidoUsuario: 'Demo',
      tipoUsuario: 'CLIENTE',
      planSuscripcion: PlanSuscripcion.DEMO,
      emailVerificado: true,
      activo: true,
    },
  });

  // Crear granja para usuario DEMO
  const granjaDemo = await prisma.granja.create({
    data: {
      nombreGranja: 'Granja Demo Test',
      descripcion: 'Granja de prueba para límites DEMO',
      idUsuario: usuarioDemo.id,
      activa: true,
    },
  });

  // Crear usuario STARTER
  const usuarioStarter = await prisma.usuario.create({
    data: {
      email: 'test-limite-starter@test.com',
      passwordHash,
      nombreUsuario: 'Usuario',
      apellidoUsuario: 'Starter',
      tipoUsuario: 'CLIENTE',
      planSuscripcion: PlanSuscripcion.STARTER,
      emailVerificado: true,
      activo: true,
    },
  });

  // Crear granja para usuario STARTER
  const granjaStarter = await prisma.granja.create({
    data: {
      nombreGranja: 'Granja Starter Test',
      descripcion: 'Granja de prueba para límites STARTER',
      idUsuario: usuarioStarter.id,
      activa: true,
    },
  });

  // Generar tokens JWT
  const tokenDemo = jwt.sign(
    { userId: usuarioDemo.id, email: usuarioDemo.email, tipo: usuarioDemo.tipoUsuario },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const tokenStarter = jwt.sign(
    { userId: usuarioStarter.id, email: usuarioStarter.email, tipo: usuarioStarter.tipoUsuario },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  console.log(`👤 Usuario DEMO creado: ${usuarioDemo.email}`);
  console.log(`👤 Usuario STARTER creado: ${usuarioStarter.email}`);
  console.log(`🏭 Granja DEMO creada: ${granjaDemo.id}`);
  console.log(`🏭 Granja STARTER creada: ${granjaStarter.id}`);

  return {
    usuarioDemo,
    usuarioStarter,
    granjaDemo,
    granjaStarter,
    tokenDemo,
    tokenStarter,
  };
}

async function crearMateriasPrimasHastaLimite(granjaId: string, token: string, limite: number) {
  // Crear materias primas hasta el límite
  for (let i = 1; i <= limite; i++) {
    await testCrearRecurso(
      `Crear materia prima ${i}/${limite}`,
      token,
      `/api/materias-primas/${granjaId}`,
      {
        codigoMateriaPrima: `MP-TEST-${i}`,
        nombreMateriaPrima: `Materia Prima Test ${i}`,
        unidadMedida: 'kg',
        activa: true
      },
      true
    );
  }
}

async function runTests() {
  console.log('🧪 Iniciando pruebas de validación de límites por plan...\n');
  console.log(`📍 API URL: ${API_URL}\n`);

  try {
    // Limpiar datos de prueba anteriores
    await limpiarDatosTest();

    // Crear usuarios de prueba
    const datos = await crearUsuariosTest();

    console.log('\n📋 Ejecutando pruebas...\n');

    // Test 1: Usuario DEMO intenta crear más de 10 materias primas
    console.log('📦 Test 1: Límite de materias primas DEMO (máx 10)...');
    await crearMateriasPrimasHastaLimite(datos.granjaDemo.id, datos.tokenDemo, 10);
    
    // Intentar crear la 11ª materia prima (debe fallar)
    await testCrearRecurso(
      'DEMO: Intentar crear 11ª materia prima (debe rechazar)',
      datos.tokenDemo,
      `/api/materias-primas/${datos.granjaDemo.id}`,
      {
        codigoMateriaPrima: 'MP-TEST-11',
        nombreMateriaPrima: 'Materia Prima Test 11',
        unidadMedida: 'kg',
        activa: true
      },
      false
    );

    // Test 2: Usuario STARTER puede crear hasta 20 materias primas
    console.log('\n📦 Test 2: Límite de materias primas STARTER (máx 20)...');
    await crearMateriasPrimasHastaLimite(datos.granjaStarter.id, datos.tokenStarter, 20);
    
    // Intentar crear la 21ª materia prima (debe fallar)
    await testCrearRecurso(
      'STARTER: Intentar crear 21ª materia prima (debe rechazar)',
      datos.tokenStarter,
      `/api/materias-primas/${datos.granjaStarter.id}`,
      {
        codigoMateriaPrima: 'MP-TEST-21',
        nombreMateriaPrima: 'Materia Prima Test 21',
        unidadMedida: 'kg',
        activa: true
      },
      false
    );

    // Test 3: Usuario DEMO intenta crear más de 10 proveedores
    console.log('\n📦 Test 3: Límite de proveedores DEMO (máx 10)...');
    for (let i = 1; i <= 10; i++) {
      await testCrearRecurso(
        `Crear proveedor ${i}/10`,
        datos.tokenDemo,
        `/api/proveedores/${datos.granjaDemo.id}`,
        {
          codigoProveedor: `PROV-TEST-${i}`,
          nombreProveedor: `Proveedor Test ${i}`,
          direccionProveedor: `Dirección ${i}`,
          localidadProveedor: `Localidad ${i}`
        },
        true
      );
    }
    
    await testCrearRecurso(
      'DEMO: Intentar crear 11º proveedor (debe rechazar)',
      datos.tokenDemo,
      `/api/proveedores/${datos.granjaDemo.id}`,
      {
        codigoProveedor: 'PROV-TEST-11',
        nombreProveedor: 'Proveedor Test 11',
        direccionProveedor: 'Dirección 11',
        localidadProveedor: 'Localidad 11'
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

