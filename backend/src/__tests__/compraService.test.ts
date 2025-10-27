/**
 * Tests para el Servicio de Compras
 * Verifica: creación de compras, actualización de precios, stock e inventario
 */

import { PrismaClient } from '@prisma/client';
import { crearCompra, obtenerComprasGranja } from '../services/compraService';
import { recalcularInventario } from '../services/inventarioService';
import { recalcularCostoFormula } from '../services/formulaService';

const prisma = new PrismaClient();

describe('Servicio de Compras', () => {
  let idUsuario: string;
  let idGranja: string;
  let idProveedor: string;
  let idMateriaPrima1: string;
  let idMateriaPrima2: string;

  beforeAll(async () => {
    // Crear datos de prueba
    const usuario = await prisma.usuario.create({
      data: {
        email: 'test-compras@test.com',
        passwordHash: 'hash123',
        nombreUsuario: 'Test',
        apellidoUsuario: 'Compras'
      }
    });
    idUsuario = usuario.id;

    const granja = await prisma.granja.create({
      data: {
        idUsuario,
        nombreGranja: 'Granja Test Compras',
        descripcion: 'Granja para pruebas'
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
        precioPorKilo: 10 // Precio inicial
      }
    });
    idMateriaPrima1 = materiaPrima1.id;

    const materiaPrima2 = await prisma.materiaPrima.create({
      data: {
        idGranja,
        codigoMateriaPrima: 'MP002',
        nombreMateriaPrima: 'Sorgo',
        precioPorKilo: 8 // Precio inicial
      }
    });
    idMateriaPrima2 = materiaPrima2.id;
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await prisma.compraDetalle.deleteMany({ where: {} });
    await prisma.compraCabecera.deleteMany({ where: {} });
    await prisma.inventario.deleteMany({ where: {} });
    await prisma.registroPrecio.deleteMany({ where: {} });
    await prisma.materiaPrima.deleteMany({ where: {} });
    await prisma.proveedor.deleteMany({ where: {} });
    await prisma.granja.deleteMany({ where: {} });
    await prisma.usuario.deleteMany({ where: {} });
    await prisma.$disconnect();
  });

  describe('crearCompra', () => {
    it('debería crear una compra y actualizar inventario correctamente', async () => {
      // Arrange
      const fechaCompra = new Date('2024-01-15');
      const detalles = [
        {
          idMateriaPrima: idMateriaPrima1,
          cantidadComprada: 100,
          precioUnitario: 10
        },
        {
          idMateriaPrima: idMateriaPrima2,
          cantidadComprada: 50,
          precioUnitario: 8
        }
      ];

      // Act
      const compra = await crearCompra({
        idGranja,
        idUsuario,
        idProveedor,
        fechaCompra,
        detalles
      });

      // Assert - Compra creada
      expect(compra).toBeDefined();
      expect(compra.totalFactura).toBe(1400); // (100*10) + (50*8)
      expect(compra.comprasDetalle.length).toBe(2);

      // Assert - Inventario actualizado
      const inventario1 = await prisma.inventario.findUnique({
        where: {
          idGranja_idMateriaPrima: {
            idGranja,
            idMateriaPrima: idMateriaPrima1
          }
        }
      });

      expect(inventario1).toBeDefined();
      expect(inventario1?.cantidadAcumulada).toBe(100);
      expect(inventario1?.cantidadSistema).toBe(100);
      expect(inventario1?.precioAlmacen).toBe(10);
      
      // cantidad_real debería ser igual a cantidad_sistema inicialmente
      expect(inventario1?.cantidadReal).toBe(100);

      const inventario2 = await prisma.inventario.findUnique({
        where: {
          idGranja_idMateriaPrima: {
            idGranja,
            idMateriaPrima: idMateriaPrima2
          }
        }
      });

      expect(inventario2?.cantidadAcumulada).toBe(50);
      expect(inventario2?.cantidadSistema).toBe(50);
      expect(inventario2?.precioAlmacen).toBe(8);
      expect(inventario2?.cantidadReal).toBe(50);
    });

    it('debería actualizar precio de materia prima cuando el precio cambia', async () => {
      // Arrange - Segunda compra con precio diferente
      const fechaCompra = new Date('2024-01-20');
      const detalles = [{
        idMateriaPrima: idMateriaPrima1,
        cantidadComprada: 50,
        precioUnitario: 12 // Nuevo precio
      }];

      // Act
      const compra = await crearCompra({
        idGranja,
        idUsuario,
        idProveedor,
        fechaCompra,
        detalles
      });

      // Assert - Precio actualizado en materia prima
      const materiaPrima = await prisma.materiaPrima.findUnique({
        where: { id: idMateriaPrima1 }
      });
      expect(materiaPrima?.precioPorKilo).toBe(12);

      // Assert - Historial de precio registrado
      const registroPrecio = await prisma.registroPrecio.findFirst({
        where: { idMateriaPrima: idMateriaPrima1 },
        orderBy: { fechaCambio: 'desc' }
      });
      expect(registroPrecio).toBeDefined();
      expect(registroPrecio?.precioAnterior).toBe(10);
      expect(registroPrecio?.precioNuevo).toBe(12);
      expect(registroPrecio?.diferenciaPorcentual).toBe(20); // 20% de aumento

      // Assert - Precio almacén promedio ponderado
      const inventario = await prisma.inventario.findUnique({
        where: {
          idGranja_idMateriaPrima: {
            idGranja,
            idMateriaPrima: idMateriaPrima1
          }
        }
      });
      // precio_almacen = (100*10 + 50*12) / 150 = 1600/150 = 10.67
      expect(inventario?.precioAlmacen).toBeCloseTo(10.67, 2);
    });

    it('debería calcular precio almacén correctamente con múltiples compras', async () => {
      // Arrange - Tercera compra con otro precio
      const fechaCompra = new Date('2024-01-25');
      const detalles = [{
        idMateriaPrima: idMateriaPrima1,
        cantidadComprada: 30,
        precioUnitario: 11
      }];

      // Act
      await crearCompra({
        idGranja,
        idUsuario,
        idProveedor,
        fechaCompra,
        detalles
      });

      // Assert - Precio almacén = (100*10 + 50*12 + 30*11) / 180 = 10.72
      const inventario = await prisma.inventario.findUnique({
        where: {
          idGranja_idMateriaPrima: {
            idGranja,
            idMateriaPrima: idMateriaPrima1
          }
        }
      });

      expect(inventario?.cantidadAcumulada).toBe(180);
      expect(inventario?.precioAlmacen).toBeCloseTo(10.72, 2);
    });
  });

  describe('obtenerComprasGranja', () => {
    it('debería obtener todas las compras de una granja', async () => {
      // Act
      const compras = await obtenerComprasGranja(idGranja);

      // Assert
      expect(compras.length).toBeGreaterThanOrEqual(3); // Tenemos al menos 3 compras de las pruebas anteriores
      compras.forEach(compra => {
        expect(compra.idGranja).toBe(idGranja);
        expect(compra.proveedor).toBeDefined();
        expect(compra.comprasDetalle.length).toBeGreaterThan(0);
      });
    });
  });
});

