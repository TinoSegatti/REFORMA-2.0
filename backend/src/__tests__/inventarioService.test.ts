/**
 * Tests para el Servicio de Inventario
 * Verifica: cálculos de todas las cantidades, merma, precio almacén
 */

import { PrismaClient } from '@prisma/client';
import {
  calcularCantidadAcumulada,
  calcularCantidadSistema,
  calcularPrecioAlmacen,
  recalcularInventario,
  calcularMerma,
  calcularValorStock
} from '../services/inventarioService';

const prisma = new PrismaClient();

describe('Servicio de Inventario', () => {
  let idUsuario: string;
  let idGranja: string;
  let idMateriaPrima: string;
  let idProveedor: string;
  let idFormula: string;
  let idFabricacion: string;

  beforeAll(async () => {
    // Crear datos de prueba
    const usuario = await prisma.usuario.create({
      data: {
        email: 'test-inventario@test.com',
        passwordHash: 'hash123',
        nombreUsuario: 'Test',
        apellidoUsuario: 'Inventario'
      }
    });
    idUsuario = usuario.id;

    const granja = await prisma.granja.create({
      data: {
        idUsuario,
        nombreGranja: 'Granja Test Inventario'
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

    const materiaPrima = await prisma.materiaPrima.create({
      data: {
        idGranja,
        codigoMateriaPrima: 'MP001',
        nombreMateriaPrima: 'Maíz',
        precioPorKilo: 10
      }
    });
    idMateriaPrima = materiaPrima.id;

    const animal = await prisma.animal.create({
      data: {
        idGranja,
        codigoAnimal: 'AN001',
        descripcionAnimal: 'Test Animal',
        categoriaAnimal: 'OTRO'
      }
    });

    const formula = await prisma.formulaCabecera.create({
      data: {
        idGranja,
        idAnimal: animal.id,
        codigoFormula: 'F001',
        descripcionFormula: 'Fórmula Test',
        pesoTotalFormula: 1000,
        costoTotalFormula: 0,
        formulasDetalle: {
          create: {
            idMateriaPrima: materiaPrima.id,
            cantidadKg: 500, // 500kg de materia prima para 1000kg de producto
            porcentajeFormula: 50,
            precioUnitarioMomentoCreacion: 10,
            costoParcial: 5000
          }
        }
      }
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
    await prisma.inventario.deleteMany({ where: {} });
    await prisma.materiaPrima.deleteMany({ where: {} });
    await prisma.proveedor.deleteMany({ where: {} });
    await prisma.granja.deleteMany({ where: {} });
    await prisma.usuario.deleteMany({ where: {} });
    await prisma.$disconnect();
  });

  describe('calcularCantidadAcumulada', () => {
    it('debería calcular correctamente la cantidad acumulada', async () => {
      // Arrange - Crear compras
      const compra1 = await prisma.compraCabecera.create({
        data: {
          idGranja,
          idUsuario,
          idProveedor,
          fechaCompra: new Date('2024-01-01'),
          totalFactura: 1000,
          comprasDetalle: {
            create: {
              idMateriaPrima,
              cantidadComprada: 100,
              precioUnitario: 10,
              subtotal: 1000,
              precioAnteriorMateriaPrima: 0
            }
          }
        }
      });

      const compra2 = await prisma.compraCabecera.create({
        data: {
          idGranja,
          idUsuario,
          idProveedor,
          fechaCompra: new Date('2024-01-02'),
          totalFactura: 1500,
          comprasDetalle: {
            create: {
              idMateriaPrima,
              cantidadComprada: 50,
              precioUnitario: 30,
              subtotal: 1500,
              precioAnteriorMateriaPrima: 0
            }
          }
        }
      });

      // Act
      const cantidad = await calcularCantidadAcumulada({
        idGranja,
        idMateriaPrima
      });

      // Assert
      expect(cantidad).toBe(150); // 100 + 50

      // Cleanup
      await prisma.compraDetalle.deleteMany({
        where: {
          idCompra: { in: [compra1.id, compra2.id] }
        }
      });
      await prisma.compraCabecera.deleteMany({
        where: { id: { in: [compra1.id, compra2.id] } }
      });
    });
  });

  describe('calcularCantidadSistema', () => {
    it('debería calcular correctamente cantidad_sistema (compras - fabricaciones)', async () => {
      // Arrange - Crear compra
      const compra = await prisma.compraCabecera.create({
        data: {
          idGranja,
          idUsuario,
          idProveedor,
          fechaCompra: new Date('2024-01-01'),
          totalFactura: 1000,
          comprasDetalle: {
            create: {
              idMateriaPrima,
              cantidadComprada: 100,
              precioUnitario: 10,
              subtotal: 1000,
              precioAnteriorMateriaPrima: 0
            }
          }
        }
      });

      // Crear fabricación
      const fabricacion = await prisma.fabricacion.create({
        data: {
          idGranja,
          idUsuario,
          idFormula,
          descripcionFabricacion: 'Test Fabricación',
          cantidadFabricacion: 200, // 200kg de producto
          costoTotalFabricacion: 1000,
          costoPorKilo: 5,
          fechaFabricacion: new Date('2024-01-02'),
          sinExistencias: false,
          detallesFabricacion: {
            create: {
              idMateriaPrima,
              cantidadUsada: 100, // 100kg de materia prima usada
              precioUnitario: 10,
              costoParcial: 1000
            }
          }
        }
      });
      idFabricacion = fabricacion.id;

      // Act
      const cantidadSistema = await calcularCantidadSistema({
        idGranja,
        idMateriaPrima
      });

      // Assert
      // cantidad_sistema = cantidad_acumulada (100) - cantidad_usada (100) = 0
      expect(cantidadSistema).toBe(0);

      // Cleanup
      await prisma.detalleFabricacion.deleteMany({
        where: { idFabricacion }
      });
      await prisma.fabricacion.delete({ where: { id: idFabricacion } });
      await prisma.compraDetalle.deleteMany({ where: { idCompra: compra.id } });
      await prisma.compraCabecera.delete({ where: { id: compra.id } });
    });
  });

  describe('calcularPrecioAlmacen', () => {
    it('debería calcular correctamente el precio almacén (promedio ponderado)', async () => {
      // Arrange - Crear compras con diferentes precios
      const compra1 = await prisma.compraCabecera.create({
        data: {
          idGranja,
          idUsuario,
          idProveedor,
          fechaCompra: new Date('2024-01-01'),
          totalFactura: 1000,
          comprasDetalle: {
            create: {
              idMateriaPrima,
              cantidadComprada: 100, // 100kg a $10
              precioUnitario: 10,
              subtotal: 1000,
              precioAnteriorMateriaPrima: 0
            }
          }
        }
      });

      const compra2 = await prisma.compraCabecera.create({
        data: {
          idGranja,
          idUsuario,
          idProveedor,
          fechaCompra: new Date('2024-01-02'),
          totalFactura: 1800,
          comprasDetalle: {
            create: {
              idMateriaPrima,
              cantidadComprada: 100, // 100kg a $18
              precioUnitario: 18,
              subtotal: 1800,
              precioAnteriorMateriaPrima: 0
            }
          }
        }
      });

      // Act
      const precioAlmacen = await calcularPrecioAlmacen({
        idGranja,
        idMateriaPrima
      });

      // Assert
      // precio_almacen = (100*10 + 100*18) / (100+100) = 2800/200 = 14
      expect(precioAlmacen).toBe(14);

      // Cleanup
      await prisma.compraDetalle.deleteMany({
        where: { idCompra: { in: [compra1.id, compra2.id] } }
      });
      await prisma.compraCabecera.deleteMany({
        where: { id: { in: [compra1.id, compra2.id] } }
      });
    });
  });

  describe('calcularMerma y calcularValorStock', () => {
    it('debería calcular correctamente la merma', () => {
      // Arrange
      const cantidadSistema = 100;
      const cantidadReal = 95;

      // Act
      const merma = calcularMerma(cantidadSistema, cantidadReal);

      // Assert
      expect(merma).toBe(5); // 5kg de pérdida
    });

    it('debería calcular correctamente el valor del stock', () => {
      // Arrange
      const cantidadReal = 100;
      const precioAlmacen = 12.5;

      // Act
      const valorStock = calcularValorStock(cantidadReal, precioAlmacen);

      // Assert
      expect(valorStock).toBe(1250); // 100 * 12.5
    });
  });

  describe('recalcularInventario', () => {
    it('debería recalcular todo el inventario correctamente', async () => {
      // Arrange - Crear compra
      const compra = await prisma.compraCabecera.create({
        data: {
          idGranja,
          idUsuario,
          idProveedor,
          fechaCompra: new Date('2024-01-01'),
          totalFactura: 1000,
          comprasDetalle: {
            create: {
              idMateriaPrima,
              cantidadComprada: 100,
              precioUnitario: 10,
              subtotal: 1000,
              precioAnteriorMateriaPrima: 0
            }
          }
        }
      });

      // Act
      const resultado = await recalcularInventario({
        idGranja,
        idMateriaPrima
      });

      // Assert
      expect(resultado.cantidad_acumulada).toBe(100);
      expect(resultado.cantidad_sistema).toBe(100);
      expect(resultado.precio_almacen).toBe(10);
      expect(resultado.merma).toBe(0); // Sin fabricaciones
      expect(resultado.valor_stock).toBe(1000); // 100kg * $10/kg

      // Cleanup
      await prisma.inventario.deleteMany({ where: {} });
      await prisma.compraDetalle.deleteMany({ where: { idCompra: compra.id } });
      await prisma.compraCabecera.delete({ where: { id: compra.id } });
    });
  });
});

