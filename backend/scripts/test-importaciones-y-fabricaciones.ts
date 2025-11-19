/**
 * Script de prueba para importaciones CSV y eliminación de fabricaciones
 * 
 * Pruebas:
 * 1. Importación CSV según plan
 * 2. Eliminación permanente de fabricaciones
 * 
 * Ejecutar: npx ts-node scripts/test-importaciones-y-fabricaciones.ts
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
  expectedStatus?: number,
  csvContent?: string
): Promise<void> {
  try {
    let options: RequestInit;
    
    if (csvContent) {
      // Crear FormData para CSV
      const formData = new FormData();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      formData.append('file', blob, 'test.csv');
      
      options = {
        method,
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formData as any,
      };
    } else {
      options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        ...(body && { body: JSON.stringify(body) }),
      };
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);
    let responseData: any;
    
    try {
      responseData = await response.json();
    } catch {
      responseData = { error: `Status ${response.status}` };
    }

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
    'test-import-demo@test.com',
    'test-import-starter@test.com',
    'test-import-business@test.com',
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
        await prisma.formulaCabecera.deleteMany({ where: { idGranja: granja.id } });
        await prisma.animal.deleteMany({ where: { idGranja: granja.id } });
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

  usuarios.demo = await prisma.usuario.create({
    data: {
      email: 'test-import-demo@test.com',
      passwordHash,
      nombreUsuario: 'Demo',
      apellidoUsuario: 'Import',
      tipoUsuario: 'CLIENTE',
      planSuscripcion: PlanSuscripcion.DEMO,
      emailVerificado: true,
      activo: true,
    },
  });

  usuarios.starter = await prisma.usuario.create({
    data: {
      email: 'test-import-starter@test.com',
      passwordHash,
      nombreUsuario: 'Starter',
      apellidoUsuario: 'Import',
      tipoUsuario: 'CLIENTE',
      planSuscripcion: PlanSuscripcion.STARTER,
      emailVerificado: true,
      activo: true,
    },
  });

  usuarios.business = await prisma.usuario.create({
    data: {
      email: 'test-import-business@test.com',
      passwordHash,
      nombreUsuario: 'Business',
      apellidoUsuario: 'Import',
      tipoUsuario: 'CLIENTE',
      planSuscripcion: PlanSuscripcion.BUSINESS,
      emailVerificado: true,
      activo: true,
    },
  });

  // Crear granjas
  usuarios.granjaDemo = await prisma.granja.create({
    data: {
      nombreGranja: 'Granja Demo',
      descripcion: 'Granja DEMO',
      idUsuario: usuarios.demo.id,
      activa: true,
    },
  });

  usuarios.granjaStarter = await prisma.granja.create({
    data: {
      nombreGranja: 'Granja Starter',
      descripcion: 'Granja STARTER',
      idUsuario: usuarios.starter.id,
      activa: true,
    },
  });

  usuarios.granjaBusiness = await prisma.granja.create({
    data: {
      nombreGranja: 'Granja Business',
      descripcion: 'Granja BUSINESS',
      idUsuario: usuarios.business.id,
      activa: true,
    },
  });

  // Generar tokens
  const tokens: any = {};
  tokens.demo = jwt.sign(
    { userId: usuarios.demo.id, email: usuarios.demo.email, tipo: usuarios.demo.tipoUsuario },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  tokens.starter = jwt.sign(
    { userId: usuarios.starter.id, email: usuarios.starter.email, tipo: usuarios.starter.tipoUsuario },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  tokens.business = jwt.sign(
    { userId: usuarios.business.id, email: usuarios.business.email, tipo: usuarios.business.tipoUsuario },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  console.log('👤 Usuarios de prueba creados');
  return { usuarios, tokens };
}


async function runTests() {
  console.log('🧪 Iniciando pruebas de importaciones CSV y eliminación de fabricaciones...\n');
  console.log(`📍 API URL: ${API_URL}\n`);

  try {
    await limpiarDatosTest();
    const { usuarios, tokens } = await crearUsuariosTest();

    console.log('\n📋 Ejecutando pruebas...\n');

    // ===== TEST 1: Importación CSV según Plan =====
    console.log('📦 TEST 1: Importación CSV según Plan');

    // CSV de materias primas
    const csvMateriasPrimas = `codigoMateriaPrima,nombreMateriaPrima,precioPorKilo
MP001,Maíz,150
MP002,Soja,200
MP003,Sorgo,120`;

    // CSV de proveedores
    const csvProveedores = `codigoProveedor,nombreProveedor,direccion,localidad
PROV001,Proveedor 1,Calle 1,Localidad 1
PROV002,Proveedor 2,Calle 2,Localidad 2`;

    // CSV de fórmulas (simplificado)
    const csvFormulas = `tipo,codigoFormula,descripcionFormula,codigoAnimal,pesoTotalFormula
CABECERA,F001,Fórmula 1,AN001,1000
DETALLE,F001,MP001,100,10
DETALLE,F001,MP002,200,20`;

    // CSV de piensos
    const csvPiensos = `codigoAnimal,descripcionAnimal,categoriaAnimal
AN001,Pienso 1,Categoria 1
AN002,Pienso 2,Categoria 2`;

    // 1.1: DEMO puede importar materias primas
    await testAPI(
      'Importación',
      'DEMO: Importar materias primas',
      'POST',
      `/api/materias-primas/${usuarios.granjaDemo.id}/import`,
      tokens.demo,
      undefined,
      200,
      csvMateriasPrimas
    );

    // 1.2: DEMO puede importar proveedores
    await testAPI(
      'Importación',
      'DEMO: Importar proveedores',
      'POST',
      `/api/proveedores/${usuarios.granjaDemo.id}/import`,
      tokens.demo,
      undefined,
      200,
      csvProveedores
    );

    // 1.3: DEMO NO puede importar fórmulas
    await testAPI(
      'Importación',
      'DEMO: Intentar importar fórmulas (debe rechazar)',
      'POST',
      `/api/formulas/granja/${usuarios.granjaDemo.id}/formulas/import`,
      tokens.demo,
      undefined,
      403,
      csvFormulas
    );

    // 1.4: STARTER puede importar materias primas y proveedores
    await testAPI(
      'Importación',
      'STARTER: Importar materias primas',
      'POST',
      `/api/materias-primas/${usuarios.granjaStarter.id}/import`,
      tokens.starter,
      undefined,
      200,
      csvMateriasPrimas
    );

    // 1.5: STARTER NO puede importar fórmulas
    await testAPI(
      'Importación',
      'STARTER: Intentar importar fórmulas (debe rechazar)',
      'POST',
      `/api/formulas/granja/${usuarios.granjaStarter.id}/formulas/import`,
      tokens.starter,
      undefined,
      403,
      csvFormulas
    );

    // 1.6: BUSINESS puede importar fórmulas
    // Primero crear un animal para la fórmula
    await prisma.animal.create({
      data: {
        idGranja: usuarios.granjaBusiness.id,
        codigoAnimal: 'AN001',
        descripcionAnimal: 'Pienso 1',
        categoriaAnimal: 'Categoria 1',
      }
    });
    await prisma.materiaPrima.createMany({
      data: [
        { idGranja: usuarios.granjaBusiness.id, codigoMateriaPrima: 'MP001', nombreMateriaPrima: 'Maíz', precioPorKilo: 150 },
        { idGranja: usuarios.granjaBusiness.id, codigoMateriaPrima: 'MP002', nombreMateriaPrima: 'Soja', precioPorKilo: 200 },
      ]
    });

    await testAPI(
      'Importación',
      'BUSINESS: Importar fórmulas',
      'POST',
      `/api/formulas/granja/${usuarios.granjaBusiness.id}/formulas/import`,
      tokens.business,
      undefined,
      200,
      csvFormulas
    );

    // ===== TEST 2: Eliminación Permanente de Fabricaciones =====
    console.log('\n📦 TEST 2: Eliminación Permanente de Fabricaciones');

    // Crear una fórmula y una fabricación para BUSINESS
    const formula = await prisma.formulaCabecera.findFirst({
      where: { idGranja: usuarios.granjaBusiness.id }
    });

    if (formula) {
      const fabricacion = await prisma.fabricacion.create({
        data: {
          idGranja: usuarios.granjaBusiness.id,
          idUsuario: usuarios.business.id,
          idFormula: formula.id,
          descripcionFabricacion: 'Fabricación de prueba',
          cantidadFabricacion: 1000,
          costoTotalFabricacion: 1000,
          costoPorKilo: 1,
          fechaFabricacion: new Date(),
        }
      });

      // 2.1: Eliminar fabricación (debe ser permanente)
      await testAPI(
        'Fabricaciones',
        'Eliminar fabricación (debe ser permanente)',
        'DELETE',
        `/api/fabricaciones/${fabricacion.id}`,
        tokens.business,
        null,
        200
      );

      // 2.2: Verificar que la fabricación fue eliminada permanentemente
      const fabricacionEliminada = await prisma.fabricacion.findUnique({
        where: { id: fabricacion.id }
      });

      if (fabricacionEliminada === null) {
        results.push({
          categoria: 'Fabricaciones',
          test: 'Fabricación eliminada permanentemente',
          success: true
        });
        console.log('✅ [Fabricaciones] Fabricación eliminada permanentemente');
      } else {
        results.push({
          categoria: 'Fabricaciones',
          test: 'Fabricación eliminada permanentemente',
          success: false,
          error: 'La fabricación aún existe en la base de datos'
        });
        console.error('❌ [Fabricaciones] Fabricación eliminada permanentemente: La fabricación aún existe');
      }

      // 2.3: Verificar que no hay fabricaciones eliminadas (ruta deprecada)
      await testAPI(
        'Fabricaciones',
        'Obtener fabricaciones eliminadas (debe retornar array vacío)',
        'GET',
        `/api/fabricaciones/${usuarios.granjaBusiness.id}/eliminadas`,
        tokens.business,
        null,
        200
      );
    }

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

