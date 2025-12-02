/**
 * Tests de integración para creación de registros desde CORINA
 * Verifica que los registros se crean correctamente usando los servicios existentes
 */

import { CorinaService } from '../../services/corinaService';
import prisma from '../../lib/prisma';

// Mock de Prisma
jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    materiaPrima: {
      create: jest.fn(),
    },
    proveedor: {
      create: jest.fn(),
    },
    animal: {
      create: jest.fn(),
    },
  },
}));

// Mock de servicios
jest.mock('../../services/formulaService', () => ({
  crearFormula: jest.fn(),
}));

jest.mock('../../services/compraService', () => ({
  crearCompra: jest.fn(),
}));

jest.mock('../../services/fabricacionService', () => ({
  crearFabricacion: jest.fn(),
}));

describe('Integración: Creación de Registros desde CORINA', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Creación de Materia Prima', () => {
    it('debe crear materia prima con datos normalizados', async () => {
      const mockMateriaPrima = {
        id: 'mp-123',
        codigoMateriaPrima: 'MAIZ001',
        nombreMateriaPrima: 'Maíz',
        precioPorKilo: 0,
      };

      (prisma.materiaPrima.create as jest.Mock).mockResolvedValue(mockMateriaPrima);

      const resultado = await CorinaService.crearRegistro(
        'materiaPrima',
        {
          codigoMateriaPrima: 'MAIZ001',
          nombreMateriaPrima: 'Maíz',
        },
        'granja-123',
        'usuario-123'
      );

      expect(prisma.materiaPrima.create).toHaveBeenCalledTimes(1);
      expect(prisma.materiaPrima.create).toHaveBeenCalledWith({
        data: {
          idGranja: 'granja-123',
          codigoMateriaPrima: 'MAIZ001',
          nombreMateriaPrima: 'Maíz',
          precioPorKilo: 0,
        },
      });

      expect(resultado).toEqual(mockMateriaPrima);
    });
  });

  describe('Creación de Compra', () => {
    it('debe usar servicio crearCompra (NO insertar directo)', async () => {
      const { crearCompra } = await import('../../services/compraService');
      const mockCompra = {
        id: 'compra-123',
        numeroFactura: 'FAC-001',
      };

      (crearCompra as jest.Mock).mockResolvedValue(mockCompra);

      const fechaCompra = new Date('2025-11-22');

      const resultado = await CorinaService.crearRegistro(
        'compra',
        {
          idProveedor: 'prov-123',
          fechaCompra: fechaCompra,
          numeroFactura: 'FAC-001',
          detalles: [
            {
              idMateriaPrima: 'mp-1',
              cantidadComprada: 100,
              precioUnitario: 50,
            },
          ],
        },
        'granja-123',
        'usuario-123'
      );

      // Verificar que se usó el servicio, NO prisma.compraCabecera.create
      expect(crearCompra).toHaveBeenCalledTimes(1);
      expect(crearCompra).toHaveBeenCalledWith({
        idGranja: 'granja-123',
        idUsuario: 'usuario-123',
        idProveedor: 'prov-123',
        fechaCompra: fechaCompra,
        numeroFactura: 'FAC-001',
        detalles: [
          {
            idMateriaPrima: 'mp-1',
            cantidadComprada: 100,
            precioUnitario: 50,
          },
        ],
      });

      // Verificar que NO se insertó directo
      expect(prisma.materiaPrima.create).not.toHaveBeenCalled();

      expect(resultado).toEqual(mockCompra);
    });
  });

  describe('Creación de Fabricación', () => {
    it('debe usar servicio crearFabricacion (NO insertar directo)', async () => {
      const { crearFabricacion } = await import('../../services/fabricacionService');
      const mockFabricacion = {
        id: 'fab-123',
        descripcionFabricacion: 'Fabricación Engorde',
      };

      (crearFabricacion as jest.Mock).mockResolvedValue(mockFabricacion);

      const fechaFabricacion = new Date('2025-11-22');

      const resultado = await CorinaService.crearRegistro(
        'fabricacion',
        {
          idFormula: 'form-123',
          descripcionFabricacion: 'Fabricación Engorde',
          cantidadFabricacion: 1.0,
          fechaFabricacion: fechaFabricacion,
        },
        'granja-123',
        'usuario-123'
      );

      // Verificar que se usó el servicio, NO prisma.fabricacion.create
      expect(crearFabricacion).toHaveBeenCalledTimes(1);
      expect(crearFabricacion).toHaveBeenCalledWith({
        idGranja: 'granja-123',
        idUsuario: 'usuario-123',
        idFormula: 'form-123',
        descripcionFabricacion: 'Fabricación Engorde',
        cantidadFabricacion: 1.0,
        fechaFabricacion: fechaFabricacion,
      });

      // Verificar que NO se insertó directo
      expect(prisma.materiaPrima.create).not.toHaveBeenCalled();

      expect(resultado).toEqual(mockFabricacion);
    });
  });

  describe('Creación de Fórmula', () => {
    it('debe usar servicio crearFormula', async () => {
      const { crearFormula } = await import('../../services/formulaService');
      const mockFormula = {
        id: 'form-123',
        codigoFormula: 'FORM001',
      };

      (crearFormula as jest.Mock).mockResolvedValue(mockFormula);

      const resultado = await CorinaService.crearRegistro(
        'formula',
        {
          idAnimal: 'animal-123',
          codigoFormula: 'FORM001',
          descripcionFormula: 'Fórmula Engorde',
          detalles: [
            { idMateriaPrima: 'mp-1', cantidadKg: 500 },
            { idMateriaPrima: 'mp-2', cantidadKg: 500 },
          ],
        },
        'granja-123',
        'usuario-123'
      );

      expect(crearFormula).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual(mockFormula);
    });
  });

  describe('Manejo de Errores', () => {
    it('debe propagar errores del servicio de compra', async () => {
      const { crearCompra } = await import('../../services/compraService');
      const error = new Error('Proveedor no encontrado');
      (crearCompra as jest.Mock).mockRejectedValue(error);

      await expect(
        CorinaService.crearRegistro(
          'compra',
          {
            idProveedor: 'prov-inexistente',
            fechaCompra: new Date(),
            detalles: [],
          },
          'granja-123',
          'usuario-123'
        )
      ).rejects.toThrow('Proveedor no encontrado');
    });

    it('debe propagar errores del servicio de fabricación', async () => {
      const { crearFabricacion } = await import('../../services/fabricacionService');
      const error = new Error('Fórmula no encontrada');
      (crearFabricacion as jest.Mock).mockRejectedValue(error);

      await expect(
        CorinaService.crearRegistro(
          'fabricacion',
          {
            idFormula: 'form-inexistente',
            descripcionFabricacion: 'Test',
            cantidadFabricacion: 1.0,
            fechaFabricacion: new Date(),
          },
          'granja-123',
          'usuario-123'
        )
      ).rejects.toThrow('Fórmula no encontrada');
    });
  });
});








