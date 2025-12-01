/**
 * Tests unitarios para la función extraerDatos de CorinaService
 * Verifica la extracción de datos estructurados usando GPT-3.5
 */

import { CorinaService } from '../../services/corinaService';

// Mock de OpenAI
const mockChatCompletionsCreate = jest.fn();

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockChatCompletionsCreate,
      },
    },
  }));
});

describe('CorinaService - extraerDatos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Materia Prima', () => {
    it('debe extraer datos completos de materia prima', async () => {
      mockChatCompletionsCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                codigoMateriaPrima: 'MAIZ001',
                nombreMateriaPrima: 'Maíz',
              }),
            },
          },
        ],
      });

      const resultado = await CorinaService.extraerDatos(
        'Crear materia prima maíz con código MAIZ001',
        'CREAR_MATERIA_PRIMA'
      );

      expect(resultado.tablaDestino).toBe('materiaPrima');
      expect(resultado.datos.codigoMateriaPrima).toBe('MAIZ001');
      expect(resultado.datos.nombreMateriaPrima).toBe('Maíz');
      expect(resultado.confianza).toBeGreaterThanOrEqual(1.0); // Ambos campos presentes
    });

    it('debe manejar datos parciales de materia prima', async () => {
      mockChatCompletionsCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                codigoMateriaPrima: null,
                nombreMateriaPrima: 'Maíz',
              }),
            },
          },
        ],
      });

      const resultado = await CorinaService.extraerDatos(
        'Crear materia prima maíz',
        'CREAR_MATERIA_PRIMA'
      );

      expect(resultado.tablaDestino).toBe('materiaPrima');
      expect(resultado.datos.nombreMateriaPrima).toBe('Maíz');
      expect(resultado.datos.codigoMateriaPrima).toBeNull();
      expect(resultado.confianza).toBeLessThan(1.0); // Solo un campo presente
    });
  });

  describe('Proveedor', () => {
    it('debe extraer datos completos de proveedor', async () => {
      mockChatCompletionsCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                codigoProveedor: 'PROV001',
                nombreProveedor: 'Juan Pérez',
                direccion: 'Calle 123',
                localidad: 'Córdoba',
              }),
            },
          },
        ],
      });

      const resultado = await CorinaService.extraerDatos(
        'Agregar proveedor Juan Pérez con código PROV001 en Córdoba',
        'CREAR_PROVEEDOR'
      );

      expect(resultado.tablaDestino).toBe('proveedor');
      expect(resultado.datos.codigoProveedor).toBe('PROV001');
      expect(resultado.datos.nombreProveedor).toBe('Juan Pérez');
      expect(resultado.datos.direccion).toBe('Calle 123');
      expect(resultado.datos.localidad).toBe('Córdoba');
    });
  });

  describe('Animal/Pienso', () => {
    it('debe extraer datos completos de animal', async () => {
      mockChatCompletionsCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                codigoAnimal: 'CERDO001',
                descripcionAnimal: 'Cerdo Engorde',
                categoriaAnimal: 'Engorde',
              }),
            },
          },
        ],
      });

      const resultado = await CorinaService.extraerDatos(
        'Crear pienso cerdo engorde con código CERDO001 y categoría Engorde',
        'CREAR_PIENSO'
      );

      expect(resultado.tablaDestino).toBe('animal');
      expect(resultado.datos.codigoAnimal).toBe('CERDO001');
      expect(resultado.datos.descripcionAnimal).toBe('Cerdo Engorde');
      expect(resultado.datos.categoriaAnimal).toBe('Engorde');
    });
  });

  describe('Fórmula', () => {
    it('debe extraer datos completos de fórmula', async () => {
      mockChatCompletionsCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                codigoFormula: 'FORM001',
                descripcionFormula: 'Fórmula Engorde',
                idAnimal: 'CERDO001',
                detalles: [
                  { materiaPrima: 'maíz', cantidadKg: 500 },
                  { materiaPrima: 'soja', cantidadKg: 500 },
                ],
              }),
            },
          },
        ],
      });

      const resultado = await CorinaService.extraerDatos(
        'Crear fórmula FORM001 para cerdo engorde con 500kg de maíz y 500kg de soja',
        'CREAR_FORMULA'
      );

      expect(resultado.tablaDestino).toBe('formula');
      expect(resultado.datos.codigoFormula).toBe('FORM001');
      expect(resultado.datos.detalles).toBeDefined();
      expect(Array.isArray(resultado.datos.detalles)).toBe(true);
      expect(resultado.datos.detalles.length).toBe(2);
    });
  });

  describe('Compra', () => {
    it('debe extraer datos completos de compra', async () => {
      mockChatCompletionsCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                idProveedor: 'PROV001',
                fechaCompra: '2025-11-22',
                numeroFactura: 'FAC-001',
                detalles: [
                  {
                    materiaPrima: 'maíz',
                    cantidadComprada: 100,
                    precioUnitario: 50,
                  },
                ],
              }),
            },
          },
        ],
      });

      const resultado = await CorinaService.extraerDatos(
        'Compré 100 kg de maíz a $50 por kilo del proveedor PROV001 el día de hoy',
        'CREAR_COMPRA'
      );

      expect(resultado.tablaDestino).toBe('compra');
      expect(resultado.datos.idProveedor).toBe('PROV001');
      expect(resultado.datos.detalles).toBeDefined();
      expect(Array.isArray(resultado.datos.detalles)).toBe(true);
      expect(resultado.datos.detalles[0].cantidadComprada).toBe(100);
      expect(resultado.datos.detalles[0].precioUnitario).toBe(50);
    });
  });

  describe('Fabricación', () => {
    it('debe extraer datos completos de fabricación', async () => {
      mockChatCompletionsCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                idFormula: 'FORM001',
                descripcionFabricacion: 'Fabricación Engorde',
                cantidadFabricacion: 1.0,
                fechaFabricacion: '2025-11-22',
              }),
            },
          },
        ],
      });

      const resultado = await CorinaService.extraerDatos(
        'Fabricamos 1 vez de la fórmula FORM001 el día de hoy',
        'CREAR_FABRICACION'
      );

      expect(resultado.tablaDestino).toBe('fabricacion');
      expect(resultado.datos.idFormula).toBe('FORM001');
      expect(resultado.datos.cantidadFabricacion).toBe(1.0);
      expect(resultado.datos.fechaFabricacion).toBe('2025-11-22');
    });
  });

  describe('Manejo de Errores', () => {
    it('debe manejar errores de cuota de OpenAI', async () => {
      const error = new Error('Quota exceeded');
      (error as any).code = 'insufficient_quota';
      
      mockChatCompletionsCreate.mockRejectedValue(error);

      await expect(
        CorinaService.extraerDatos('Crear materia prima maíz', 'CREAR_MATERIA_PRIMA')
      ).rejects.toThrow('QUOTA_EXCEEDED');
    });

    it('debe manejar respuestas JSON inválidas', async () => {
      mockChatCompletionsCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'No es un JSON válido',
            },
          },
        ],
      });

      const resultado = await CorinaService.extraerDatos(
        'Crear materia prima maíz',
        'CREAR_MATERIA_PRIMA'
      );

      // Debe retornar estructura vacía con baja confianza
      expect(resultado.tablaDestino).toBe('materiaPrima');
      expect(resultado.confianza).toBe(0.0);
      expect(Object.keys(resultado.datos).length).toBe(0);
    });

    it('debe manejar tipo de comando no soportado', async () => {
      // El error se lanza en generarPromptExtraccion antes de llamar a OpenAI
      // Por lo tanto, no necesita mock de OpenAI
      await expect(
        CorinaService.extraerDatos('Mensaje', 'COMANDO_DESCONOCIDO')
      ).rejects.toThrow('Tipo de comando no soportado');
    });
  });
});

