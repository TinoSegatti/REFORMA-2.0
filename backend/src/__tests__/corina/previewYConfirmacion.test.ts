/**
 * Tests para Preview y Confirmación de CORINA
 * Verifica la generación de previews y la creación de registros
 */

import { CorinaService } from '../../services/corinaService';
import prisma from '../../lib/prisma';

// Mock de Prisma
jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    materiaPrima: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    proveedor: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    animal: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    formulaCabecera: {
      findUnique: jest.fn(),
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

describe('CorinaService - Preview y Confirmación', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generarMensajePreview', () => {
    it('debe generar preview para materia prima', async () => {
      const datosNormalizados = {
        codigoMateriaPrima: 'MAIZ001',
        nombreMateriaPrima: 'Maíz',
      };

      const mensaje = await CorinaService.generarMensajePreview(
        'materiaPrima',
        datosNormalizados
      );

      expect(mensaje).toContain('Preview del registro a crear');
      expect(mensaje).toContain('MAIZ001');
      expect(mensaje).toContain('Maíz');
      expect(mensaje).toContain('¿Deseas crear este registro?');
      expect(mensaje).toContain('Sí');
      expect(mensaje).toContain('Cancelar');
      expect(mensaje).toContain('Modificar');
    });

    it('debe generar preview para proveedor con datos opcionales', async () => {
      const datosNormalizados = {
        codigoProveedor: 'PROV001',
        nombreProveedor: 'Juan Pérez',
        direccion: 'Calle 123',
        localidad: 'Córdoba',
      };

      const mensaje = await CorinaService.generarMensajePreview(
        'proveedor',
        datosNormalizados
      );

      expect(mensaje).toContain('PROV001');
      expect(mensaje).toContain('Juan Pérez');
      expect(mensaje).toContain('Calle 123');
      expect(mensaje).toContain('Córdoba');
    });

    it('debe generar preview para fórmula con detalles', async () => {
      // Mock de animal
      (prisma.animal.findUnique as jest.Mock).mockResolvedValue({
        descripcionAnimal: 'Cerdo Engorde',
      });

      // Mock de materias primas
      (prisma.materiaPrima.findUnique as jest.Mock)
        .mockResolvedValueOnce({
          codigoMateriaPrima: 'MAIZ001',
          nombreMateriaPrima: 'Maíz',
        })
        .mockResolvedValueOnce({
          codigoMateriaPrima: 'SOJA001',
          nombreMateriaPrima: 'Soja',
        });

      const datosNormalizados = {
        codigoFormula: 'FORM001',
        descripcionFormula: 'Fórmula Engorde',
        idAnimal: 'animal-123',
        detalles: [
          { idMateriaPrima: 'mp-1', cantidadKg: 500 },
          { idMateriaPrima: 'mp-2', cantidadKg: 500 },
        ],
      };

      const mensaje = await CorinaService.generarMensajePreview(
        'formula',
        datosNormalizados
      );

      expect(mensaje).toContain('FORM001');
      expect(mensaje).toContain('Fórmula Engorde');
      expect(mensaje).toContain('Cerdo Engorde');
      expect(mensaje).toContain('2 materias primas');
      expect(mensaje).toContain('MAIZ001');
      expect(mensaje).toContain('SOJA001');
      expect(mensaje).toContain('1000 kg');
    });

    it('debe incluir advertencias en el preview', async () => {
      const datosNormalizados = {
        codigoMateriaPrima: 'MAIZ001',
        nombreMateriaPrima: 'Maíz',
      };

      const advertencias = ['El total de la fórmula se ajustó a 1000 kg'];

      const mensaje = await CorinaService.generarMensajePreview(
        'materiaPrima',
        datosNormalizados,
        advertencias
      );

      expect(mensaje).toContain('⚠️ Advertencias');
      expect(mensaje).toContain('El total de la fórmula se ajustó a 1000 kg');
    });
  });

  describe('crearRegistro', () => {
    it('debe crear materia prima correctamente', async () => {
      const mockMateriaPrima = {
        id: 'mp-123',
        codigoMateriaPrima: 'MAIZ001',
        nombreMateriaPrima: 'Maíz',
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

      expect(prisma.materiaPrima.create).toHaveBeenCalledWith({
        data: {
          idGranja: 'granja-123',
          codigoMateriaPrima: 'MAIZ001',
          nombreMateriaPrima: 'Maíz',
          precioPorKilo: 0,
        },
      });

      expect(resultado.id).toBe('mp-123');
    });

    it('debe crear proveedor correctamente', async () => {
      const mockProveedor = {
        id: 'prov-123',
        codigoProveedor: 'PROV001',
        nombreProveedor: 'Juan Pérez',
      };

      (prisma.proveedor.create as jest.Mock).mockResolvedValue(mockProveedor);

      const resultado = await CorinaService.crearRegistro(
        'proveedor',
        {
          codigoProveedor: 'PROV001',
          nombreProveedor: 'Juan Pérez',
          direccion: 'Calle 123',
          localidad: 'Córdoba',
        },
        'granja-123',
        'usuario-123'
      );

      expect(prisma.proveedor.create).toHaveBeenCalledWith({
        data: {
          idGranja: 'granja-123',
          codigoProveedor: 'PROV001',
          nombreProveedor: 'Juan Pérez',
          direccion: 'Calle 123',
          localidad: 'Córdoba',
        },
      });

      expect(resultado.id).toBe('prov-123');
    });

    it('debe crear animal correctamente', async () => {
      const mockAnimal = {
        id: 'animal-123',
        codigoAnimal: 'CERDO001',
        descripcionAnimal: 'Cerdo Engorde',
        categoriaAnimal: 'Engorde',
      };

      (prisma.animal.create as jest.Mock).mockResolvedValue(mockAnimal);

      const resultado = await CorinaService.crearRegistro(
        'animal',
        {
          codigoAnimal: 'CERDO001',
          descripcionAnimal: 'Cerdo Engorde',
          categoriaAnimal: 'Engorde',
        },
        'granja-123',
        'usuario-123'
      );

      expect(prisma.animal.create).toHaveBeenCalledWith({
        data: {
          idGranja: 'granja-123',
          codigoAnimal: 'CERDO001',
          descripcionAnimal: 'Cerdo Engorde',
          categoriaAnimal: 'Engorde',
        },
      });

      expect(resultado.id).toBe('animal-123');
    });

    it('debe crear fórmula usando servicio', async () => {
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

      expect(crearFormula).toHaveBeenCalledWith({
        idGranja: 'granja-123',
        idAnimal: 'animal-123',
        codigoFormula: 'FORM001',
        descripcionFormula: 'Fórmula Engorde',
        detalles: [
          { idMateriaPrima: 'mp-1', cantidadKg: 500 },
          { idMateriaPrima: 'mp-2', cantidadKg: 500 },
        ],
      });

      expect(resultado.id).toBe('form-123');
    });

    it('debe crear compra usando servicio', async () => {
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

      expect(resultado.id).toBe('compra-123');
    });

    it('debe crear fabricación usando servicio', async () => {
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

      expect(crearFabricacion).toHaveBeenCalledWith({
        idGranja: 'granja-123',
        idUsuario: 'usuario-123',
        idFormula: 'form-123',
        descripcionFabricacion: 'Fabricación Engorde',
        cantidadFabricacion: 1.0,
        fechaFabricacion: fechaFabricacion,
      });

      expect(resultado.id).toBe('fab-123');
    });

    it('debe lanzar error para tipo de registro no soportado', async () => {
      await expect(
        CorinaService.crearRegistro(
          'tipoDesconocido',
          {},
          'granja-123',
          'usuario-123'
        )
      ).rejects.toThrow('Tipo de registro no soportado');
    });
  });
});






