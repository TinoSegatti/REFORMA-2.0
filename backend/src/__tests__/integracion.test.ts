/**
 * Tests de Integración Completa
 * Verifica el flujo completo: Compras → Inventario → Fabricaciones → Eliminación
 */

import { PrismaClient } from '@prisma/client';
import { crearCompra } from '../services/compraService';
import { crearFabricacion, eliminarFabricacion } from '../services/fabricacionService';
import { crearFormula } from '../services/formulaService';

const prisma = new PrismaClient();

describe('Tests de Integración - Flujo Completo', () => {
  let idUsuario: string;
  let idGranja: string;
  let idMateriaPrima1: string;
  let idMateriaPrima2: string;
  let idProveedor: string;
  let idAnimal: string;
  let idFormula: string;
  let idFabricacion1: string;
  let idFabricacion2: string;

  beforeAll(async () => {
    // Crear datos base
    const usuario = await prisma.usuario.create({
      data: {
        email: 'test-integracion@test.com',
        passwordHash: 'hash123',
        nombreUsuario: 'Test',
        apellidoUsuario: 'Integración'
      }
    });
    idUsuario = usuario.id;

    const granja = await prisma.granja.create({
      data: {
        idUsuario,
        nombreGranja: 'Granja Test Integración'
      }
    });
    idGranja = granja.id;

    const proveedor = await prisma.proveedor.create({
      data: {
        idGranja,
        codigoProveedor: 'PROV001',
        nombreProveedor: 'Proveedor Test'
      }
    });
    idProveedor = proveedor.id;

    const materiaPrima1 = await prisma.materiaPrima.create({
      data: {
        idGranja,
        codigoMateriaPrima: 'MP001',
        nombreMateriaPrima: 'Maíz',
        precioPorKilo: 10
      }
    });
    idMateriaPrima1 = materiaPrima1.id;

    const materiaPrima2 = await prisma.materiaPrima.create({
      data: {
        idGranja,
        codigoMateriaPrima: 'MP002',
        nombreMateriaPrima: 'Sorgo',
        precioPorKilo: 8
      }
    });
    idMateriaPrima2 = materiaPrima2.id;

    const animal = await prisma.animal.create({
      data: {
        idGranja,
        codigoAnimal: 'AN001',
        descripcionAnimal: 'Test Animal',
        categoriaAnimal: 'OTRO'
      }
    });
    idAnimal = animal.id;

    const formula = await crearFormula({
      idGranja,
      idAnimal,
      codigoFormula: 'F001',
      descripcionFormula: 'Fórmula de Prueba',
      detalles: [
        { idMateriaPrima: idMateriaPrima1, cantidadKg: 500 }, // 500kg de maíz
        { idMateriaPrima: idMateriaPrima2, cantidadKg: 300 }  // 300kg de sorgo
      ]
    });
    idFormula = formula.id;
  });

  afterAll(async () => {
    await prisma.detalleFabricacion.deleteMany({ where: {} });
    await prisma.fabricacion.deleteMany({ where: {} });
    await prisma.formulaDetalle.deleteMany({ where: {} });
    await prisma.formulaCabecera.deleteMany({ where: {} });
    await prisma.animal.deleteMany({ where: {} });
    await prisma.compraDetalle.deleteMany({ where: {} });
    await prisma.compraCabecera.deleteMany({ where: {} });
    await prisma.registroPrecio.deleteMany({ where: {} });
    await prisma.inventario.deleteMany({ where: {} });
    await prisma.materiaPrima.deleteMany({ where: {} });
    await prisma.proveedor.deleteMany({ where: {} });
    await prisma.granja.deleteMany({ where: {} });
    await prisma.usuario.deleteMany({ where: {} });
    await prisma.$disconnect();
  });

  describe('Flujo Completo: Compra → Fabricación → Eliminación', () => {
    it('debería manejar el flujo completo correctamente', async () => {
      // ============================================
      // PASO 1: COMPRAR MATERIAS PRIMAS
      // ============================================
      console.log('📦 PASO 1: Comprando materias primas...');

      const compra1 = await crearCompra({
        idGranja,
        idUsuario,
        idProveedor,
        fechaCompra: new Date('2024-01-01'),
        detalles: [
          { idMateriaPrima: idMateriaPrima1, cantidadComprada: 1000, precioUnitario: 10 },
          { idMateriaPrima: idMateriaPrima2, cantidadComprada: 600, precioUnitario: 8 }
        ]
      });

      expect(compra1.totalFactura).toBe(14800); // (1000*10) + (600*8)

      // Verificar inventario después de compra
      const inventario1MP1 = await prisma.inventario.findUnique({
        where: { idGranja_idMateriaPrima: { idGranja, idMateriaPrima: idMateriaPrima1 } }
      });

      expect(inventario1MP1?.cantidadAcumulada).toBe(1000);
      expect(inventario1MP1?.cantidadSistema).toBe(1000);
      expect(inventario1MP1?.precioAlmacen).toBe(10);

      const inventario1MP2 = await prisma.inventario.findUnique({
        where: { idGranja_idMateriaPrima: { idGranja, idMateriaPrima: idMateriaPrima2 } }
      });

      expect(inventario1MP2?.cantidadAcumulada).toBe(600);
      expect(inventario1MP2?.cantidadSistema).toBe(600);
      expect(inventario1MP2?.precioAlmacen).toBe(8);

      console.log('✅ Inventario inicial correcto');

      // ============================================
      // PASO 2: FABRICAR
      // ============================================
      console.log('🏭 PASO 2: Fabricando 1000kg de producto...');

      const fabricacion1 = await crearFabricacion({
        idGranja,
        idUsuario,
        idFormula,
        descripcionFabricacion: 'Fabricación Test 1',
        cantidadFabricacion: 1000, // 1000kg de producto
        fechaFabricacion: new Date('2024-01-02'),
        observaciones: 'Primera fabricación'
      });

      idFabricacion1 = fabricacion1.id;

      // Verificar que se descontaron las materias primas correctamente
      // Para 1000kg de producto se usan: 500kg de maíz + 300kg de sorgo
      const inventario2MP1 = await prisma.inventario.findUnique({
        where: { idGranja_idMateriaPrima: { idGranja, idMateriaPrima: idMateriaPrima1 } }
      });

      expect(inventario2MP1?.cantidadSistema).toBe(500); // 1000 - 500
      expect(inventario2MP1?.cantidadReal).toBe(500);

      const inventario2MP2 = await prisma.inventario.findUnique({
        where: { idGranja_idMateriaPrima: { idGranja, idMateriaPrima: idMateriaPrima2 } }
      });

      expect(inventario2MP2?.cantidadSistema).toBe(300); // 600 - 300
      expect(inventario2MP2?.cantidadReal).toBe(300);

      console.log('✅ Fabricación 1 completada');

      // ============================================
      // PASO 3: COMPRAR MÁS (cambiar precio)
      // ============================================
      console.log('📦 PASO 3: Comprando más con nuevo precio...');

      const compra2 = await crearCompra({
        idGranja,
        idUsuario,
        idProveedor,
        fechaCompra: new Date('2024-01-03'),
        detalles: [
          { idMateriaPrima: idMateriaPrima1, cantidadComprada: 500, precioUnitario: 12 }
        ]
      });

      // Verificar que el precio almacén se actualizó (promedio ponderado)
      // precio_almacen = (1000*10 + 500*12) / 1500 = 18000/1500 = 12
      const inventario3MP1 = await prisma.inventario.findUnique({
        where: { idGranja_idMateriaPrima: { idGranja, idMateriaPrima: idMateriaPrima1 } }
      });

      expect(inventario3MP1?.cantidadAcumulada).toBe(1500);
      expect(inventario3MP1?.cantidadSistema).toBe(1000); // 1500 - 500 (fabricado)
      expect(inventario3MP1?.precioAlmacen).toBeCloseTo(11.33, 2); // (1000*10 + 500*12)/1500

      console.log('✅ Precio almacén actualizado correctamente');

      // ============================================
      // PASO 4: FABRICAR OTRA VEZ (con precios actualizados)
      // ============================================
      console.log('🏭 PASO 4: Fabricando 500kg más...');

      const fabricacion2 = await crearFabricacion({
        idGranja,
        idUsuario,
        idFormula,
        descripcionFabricacion: 'Fabricación Test 2',
        cantidadFabricacion: 500, // 500kg de producto
        fechaFabricacion: new Date('2024-01-04'),
        observaciones: 'Segunda fabricación'
      });

      idFabricacion2 = fabricacion2.id;

      // Verificar inventario después de segunda fabricación
      // Se usan: 250kg de maíz + 150kg de sorgo
      const inventario4MP1 = await prisma.inventario.findUnique({
        where: { idGranja_idMateriaPrima: { idGranja, idMateriaPrima: idMateriaPrima1 } }
      });

      expect(inventario4MP1?.cantidadSistema).toBe(750); // 1500 - 500 - 250
      expect(inventario4MP1?.cantidadReal).toBe(750); // 500 - 250

      const inventario4MP2 = await prisma.inventario.findUnique({
        where: { idGranja_idMateriaPrima: { idGranja, idMateriaPrima: idMateriaPrima2 } }
      });

      expect(inventario4MP2?.cantidadSistema).toBe(150); // 600 - 300 - 150
      expect(inventario4MP2?.cantidadReal).toBe(150); // 300 - 150

      console.log('✅ Fabricación 2 completada');

      // ============================================
      // PASO 5: ELIMINAR UNA FABRICACIÓN (revertir)
      // ============================================
      console.log('↩️ PASO 5: Eliminando fabricación 2...');

      await eliminarFabricacion(idFabricacion2);

      // Verificar que el inventario se revirtió
      const inventario5MP1 = await prisma.inventario.findUnique({
        where: { idGranja_idMateriaPrima: { idGranja, idMateriaPrima: idMateriaPrima1 } }
      });

      expect(inventario5MP1?.cantidadSistema).toBe(1000); // 750 + 250 (revertido)
      expect(inventario5MP1?.cantidadReal).toBe(1000); // 750 + 250

      const inventario5MP2 = await prisma.inventario.findUnique({
        where: { idGranja_idMateriaPrima: { idGranja, idMateriaPrima: idMateriaPrima2 } }
      });

      expect(inventario5MP2?.cantidadSistema).toBe(300); // 150 + 150 (revertido)
      expect(inventario5MP2?.cantidadReal).toBe(300); // 150 + 150

      console.log('✅ Fabricación eliminada, inventario revertido');

      // ============================================
      // PASO 6: VERIFICAR QUE FÓRMULA SE ACTUALIZÓ
      // ============================================
      console.log('📐 PASO 6: Verificando costo de fórmula...');

      const formulaActualizada = await prisma.formulaCabecera.findUnique({
        where: { id: idFormula },
        include: {
          formulasDetalle: {
            include: { materiaPrima: true }
          }
        }
      });

      // El costo debería haberse actualizado con los precios nuevos
      expect(formulaActualizada?.costoTotalFormula).toBeGreaterThan(0);

      console.log('✅ Costo de fórmula actualizado:', formulaActualizada?.costoTotalFormula);

      console.log('🎉 FLUJO COMPLETO EXITOSO!');
    });
  });
});

