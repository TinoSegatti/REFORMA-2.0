/**
 * Script de prueba end-to-end para creación de registros desde CORINA
 * Simula el flujo completo: detección → extracción → normalización → validación → preview → confirmación → creación
 */

import prisma from '../lib/prisma';
import { CorinaService } from '../services/corinaService';
import { CorinaNotificacionService } from '../services/corinaNotificacionService';

async function testCreacionCompleta() {
  console.log('🧪 Iniciando test de creación completa de CORINA...\n');

  try {
    // 1. Buscar un usuario ENTERPRISE con teléfono verificado
    const usuario = await prisma.usuario.findFirst({
      where: {
        planSuscripcion: 'ENTERPRISE',
        telefonoVerificado: true,
        telefono: { not: null },
      },
      include: {
        granjas: {
          where: { activa: true },
          take: 1,
        },
      },
    });

    if (!usuario) {
      console.log('❌ No se encontró un usuario ENTERPRISE con teléfono verificado');
      console.log('   Por favor, configura un usuario para las pruebas');
      return;
    }

    console.log(`✅ Usuario encontrado: ${usuario.email}`);
    console.log(`   Teléfono: ${usuario.telefono}`);
    console.log(`   Granjas activas: ${usuario.granjas.length}\n`);

    if (usuario.granjas.length === 0) {
      console.log('❌ El usuario no tiene granjas activas');
      return;
    }

    const granja = usuario.granjas[0];
    console.log(`📋 Granja seleccionada: ${granja.nombreGranja} (${granja.id})\n`);

    // 2. Test: Crear Materia Prima
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 1: Crear Materia Prima');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const mensajeMateriaPrima = 'Crear materia prima maíz con código MAIZ_TEST_001';

    console.log(`📝 Mensaje: "${mensajeMateriaPrima}"\n`);

    // Detectar tipo de comando
    console.log('1️⃣ Detectando tipo de comando...');
    const deteccion = await CorinaService.detectarTipoComando(mensajeMateriaPrima);
    console.log(`   ✅ Tipo detectado: ${deteccion.tipoComando} (confianza: ${deteccion.confianza.toFixed(2)})`);

    if (deteccion.tipoComando !== 'CREAR_MATERIA_PRIMA') {
      console.log(`   ⚠️  Tipo incorrecto, esperado: CREAR_MATERIA_PRIMA`);
    }

    // Extraer datos
    console.log('\n2️⃣ Extrayendo datos...');
    const datosExtraidos = await CorinaService.extraerDatos(
      mensajeMateriaPrima,
      deteccion.tipoComando
    );
    console.log(`   ✅ Datos extraídos:`, JSON.stringify(datosExtraidos.datos, null, 2));

    // Normalizar datos
    console.log('\n3️⃣ Normalizando datos...');
    const normalizacion = await CorinaService.normalizarDatos(datosExtraidos, granja.id);
    console.log(`   ✅ Datos normalizados:`, JSON.stringify(normalizacion.datosNormalizados, null, 2));
    if (normalizacion.errores.length > 0) {
      console.log(`   ⚠️  Errores:`, normalizacion.errores);
    }
    if (normalizacion.advertencias.length > 0) {
      console.log(`   ℹ️  Advertencias:`, normalizacion.advertencias);
    }

    // Validar datos
    console.log('\n4️⃣ Validando datos...');
    const datosParaValidar = {
      tablaDestino: datosExtraidos.tablaDestino,
      datos: normalizacion.datosNormalizados,
      confianza: datosExtraidos.confianza,
    };
    const validacion = await CorinaService.validarDatos(datosParaValidar, granja.id);
    console.log(`   ✅ Validación: ${validacion.esValido ? 'VÁLIDO' : 'INVÁLIDO'}`);
    if (validacion.camposFaltantes && validacion.camposFaltantes.length > 0) {
      console.log(`   ⚠️  Campos faltantes:`, validacion.camposFaltantes);
    }
    if (validacion.errores && validacion.errores.length > 0) {
      console.log(`   ❌ Errores:`, validacion.errores);
    }

    if (!validacion.esValido) {
      console.log('\n❌ Los datos no son válidos. No se puede continuar con el test.');
      return;
    }

    // Generar preview
    console.log('\n5️⃣ Generando preview...');
    const preview = await CorinaService.generarMensajePreview(
      datosExtraidos.tablaDestino,
      normalizacion.datosNormalizados,
      normalizacion.advertencias
    );
    console.log('\n📋 Preview generado:');
    console.log('─'.repeat(60));
    console.log(preview);
    console.log('─'.repeat(60));

    // Simular confirmación y crear registro
    console.log('\n6️⃣ Simulando confirmación y creando registro...');
    
    // Verificar si ya existe una materia prima con ese código
    const existe = await prisma.materiaPrima.findFirst({
      where: {
        idGranja: granja.id,
        codigoMateriaPrima: normalizacion.datosNormalizados.codigoMateriaPrima,
      },
    });

    if (existe) {
      console.log(`   ⚠️  Ya existe una materia prima con código "${normalizacion.datosNormalizados.codigoMateriaPrima}"`);
      console.log(`   ℹ️  Se omitirá la creación para evitar duplicados`);
    } else {
      const registroCreado = await CorinaService.crearRegistro(
        datosExtraidos.tablaDestino,
        normalizacion.datosNormalizados,
        granja.id,
        usuario.id
      );
      console.log(`   ✅ Registro creado exitosamente!`);
      console.log(`   📝 ID: ${registroCreado.id}`);
      console.log(`   📝 Datos:`, JSON.stringify(registroCreado, null, 2));
    }

    console.log('\n✅ Test completado exitosamente!\n');

    // 3. Test: Crear Proveedor
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 2: Crear Proveedor');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const mensajeProveedor = 'Crear proveedor Juan Pérez con código PROV_TEST_001 en Córdoba';

    console.log(`📝 Mensaje: "${mensajeProveedor}"\n`);

    const deteccionProv = await CorinaService.detectarTipoComando(mensajeProveedor);
    console.log(`   ✅ Tipo detectado: ${deteccionProv.tipoComando}`);

    const datosExtraidosProv = await CorinaService.extraerDatos(
      mensajeProveedor,
      deteccionProv.tipoComando
    );
    console.log(`   ✅ Datos extraídos:`, JSON.stringify(datosExtraidosProv.datos, null, 2));

    const normalizacionProv = await CorinaService.normalizarDatos(datosExtraidosProv, granja.id);
    console.log(`   ✅ Datos normalizados:`, JSON.stringify(normalizacionProv.datosNormalizados, null, 2));

    const validacionProv = await CorinaService.validarDatos(
      {
        tablaDestino: datosExtraidosProv.tablaDestino,
        datos: normalizacionProv.datosNormalizados,
        confianza: datosExtraidosProv.confianza,
      },
      granja.id
    );

    if (validacionProv.esValido) {
      const existeProv = await prisma.proveedor.findFirst({
        where: {
          idGranja: granja.id,
          codigoProveedor: normalizacionProv.datosNormalizados.codigoProveedor,
        },
      });

      if (!existeProv) {
        const registroCreadoProv = await CorinaService.crearRegistro(
          datosExtraidosProv.tablaDestino,
          normalizacionProv.datosNormalizados,
          granja.id,
          usuario.id
        );
        console.log(`   ✅ Proveedor creado: ${registroCreadoProv.id}`);
      } else {
        console.log(`   ⚠️  Proveedor ya existe`);
      }
    }

    console.log('\n✅ Todos los tests completados!\n');

  } catch (error: any) {
    console.error('\n❌ Error durante el test:', error);
    console.error('   Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar test
testCreacionCompleta();








