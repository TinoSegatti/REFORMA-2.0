/**
 * Script de testing para el servicio de usuarios empleados
 * Ejecutar con: npx ts-node scripts/test-usuario-empleado-service.ts
 */

import { PrismaClient } from '@prisma/client';
import {
  generarCodigoReferencia,
  validarCodigoReferencia,
  validarLimiteUsuariosEmpleados,
  vincularUsuarioEmpleado,
  obtenerUsuariosEmpleados,
  eliminarUsuarioEmpleado,
  obtenerPlantasAccesibles
} from '../src/services/usuarioEmpleadoService';
import { PlanSuscripcion } from '../src/constants/planes';

const prisma = new PrismaClient();

async function testServicioEmpleados() {
  try {
    console.log('🧪 Iniciando tests del servicio de usuarios empleados...\n');

    // 1. Buscar o crear un usuario dueño con plan STARTER
    let usuarioDueño = await prisma.usuario.findFirst({
      where: {
        planSuscripcion: { in: [PlanSuscripcion.STARTER, PlanSuscripcion.BUSINESS, PlanSuscripcion.ENTERPRISE] },
        esUsuarioEmpleado: false
      }
    });

    if (!usuarioDueño) {
      console.log('⚠️  No se encontró usuario con plan que permita empleados. Creando usuario de prueba...');
      usuarioDueño = await prisma.usuario.create({
        data: {
          email: `test-dueño-${Date.now()}@test.com`,
          nombreUsuario: 'Test',
          apellidoUsuario: 'Dueño',
          passwordHash: 'test',
          planSuscripcion: PlanSuscripcion.STARTER,
          emailVerificado: true
        }
      });
      console.log(`✅ Usuario dueño creado: ${usuarioDueño.email}`);
    } else {
      console.log(`✅ Usuario dueño encontrado: ${usuarioDueño.email} (Plan: ${usuarioDueño.planSuscripcion})`);
    }

    // 2. Test: Generar código de referencia
    console.log('\n📝 Test 1: Generar código de referencia');
    try {
      const codigo = await generarCodigoReferencia(usuarioDueño.id);
      console.log(`✅ Código generado: ${codigo}`);
      
      // Verificar que se guardó en la BD
      const usuarioActualizado = await prisma.usuario.findUnique({
        where: { id: usuarioDueño.id },
        select: { codigoReferencia: true, fechaGeneracionCodigo: true }
      });
      if (usuarioActualizado?.codigoReferencia === codigo) {
        console.log('✅ Código guardado correctamente en la BD');
      } else {
        console.log('❌ Error: Código no se guardó correctamente');
      }
    } catch (error) {
      console.log(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }

    // 3. Test: Validar código de referencia
    console.log('\n📝 Test 2: Validar código de referencia');
    try {
      const usuarioConCodigo = await prisma.usuario.findUnique({
        where: { id: usuarioDueño.id },
        select: { codigoReferencia: true }
      });

      if (usuarioConCodigo?.codigoReferencia) {
        const validacion = await validarCodigoReferencia(usuarioConCodigo.codigoReferencia);
        if (validacion.valido && validacion.usuarioDueño) {
          console.log(`✅ Código válido. Dueño: ${validacion.usuarioDueño.email}`);
        } else {
          console.log(`❌ Código inválido: ${validacion.error}`);
        }

        // Test con código inválido
        const validacionInvalida = await validarCodigoReferencia('REF-INVALIDO-12345678');
        if (!validacionInvalida.valido) {
          console.log(`✅ Validación de código inválido funciona: ${validacionInvalida.error}`);
        }
      } else {
        console.log('⚠️  No hay código para validar');
      }
    } catch (error) {
      console.log(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }

    // 4. Test: Validar límite de usuarios
    console.log('\n📝 Test 3: Validar límite de usuarios empleados');
    try {
      const validacionLimite = await validarLimiteUsuariosEmpleados(usuarioDueño.id);
      console.log(`✅ Límite: ${validacionLimite.limite}, Actual: ${validacionLimite.actual}, Disponibles: ${validacionLimite.disponibles}`);
      console.log(`   Puede agregar: ${validacionLimite.puedeAgregar ? 'Sí' : 'No'}`);
    } catch (error) {
      console.log(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }

    // 5. Test: Obtener empleados (debería estar vacío inicialmente)
    console.log('\n📝 Test 4: Obtener usuarios empleados');
    try {
      const empleados = await obtenerUsuariosEmpleados(usuarioDueño.id);
      console.log(`✅ Empleados encontrados: ${empleados.length}`);
      if (empleados.length > 0) {
        empleados.forEach((emp, idx) => {
          console.log(`   ${idx + 1}. ${emp.email} - ${emp.nombreUsuario} ${emp.apellidoUsuario}`);
        });
      }
    } catch (error) {
      console.log(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }

    // 6. Test: Obtener plantas accesibles
    console.log('\n📝 Test 5: Obtener plantas accesibles');
    try {
      const plantas = await obtenerPlantasAccesibles(usuarioDueño.id);
      console.log(`✅ Plantas accesibles: ${plantas.length}`);
      if (plantas.length > 0) {
        plantas.forEach((planta, idx) => {
          console.log(`   ${idx + 1}. ${planta.nombreGranja}`);
        });
      }
    } catch (error) {
      console.log(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }

    console.log('\n✅ Tests completados');
  } catch (error) {
    console.error('❌ Error en tests:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testServicioEmpleados();


