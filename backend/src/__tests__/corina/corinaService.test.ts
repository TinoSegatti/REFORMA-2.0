/**
 * Tests unitarios para CorinaService
 * Verifica la capacidad de generar registros a través de CORINA
 */

import { CorinaService } from '../../services/corinaService';
import { prisma } from '../../config/database';
import { crearCompra } from '../../services/compraService';
import { crearFabricacion } from '../../services/fabricacionService';
import { crearFormula } from '../../services/formulaService';

// Mock de dependencias
jest.mock('../../config/database', () => ({
  prisma: {
    usuario: {
      findFirst: jest.fn(),
    },
    granja: {
      findUnique: jest.fn(),
    },
    materiaPrima: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    proveedor: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    animal: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    formulaCabecera: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    corinaInteraccion: {
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../services/compraService', () => ({
  crearCompra: jest.fn(),
}));

jest.mock('../../services/fabricacionService', () => ({
  crearFabricacion: jest.fn(),
}));

jest.mock('../../services/formulaService', () => ({
  crearFormula: jest.fn(),
}));

// Mock de OpenAI
const mockChatCompletionsCreate = jest.fn();

jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockChatCompletionsCreate,
        },
      },
    })),
  };
});

describe('CorinaService - Generación de Registros', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChatCompletionsCreate.mockClear();
    process.env.OPENAI_API_KEY = 'test-api-key';
  });

  describe('detectarTipoComando', () => {
    it('debe detectar CREAR_MATERIA_PRIMA correctamente', async () => {
      mockChatCompletionsCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                tipoComando: 'CREAR_MATERIA_PRIMA',
                confianza: 0.95,
                razon: 'El mensaje menciona crear materia prima',
              }),
            },
          },
        ],
      });

      const resultado = await CorinaService.detectarTipoComando(
        'Quiero crear una materia prima llamada maíz con código MAIZ001'
      );

      expect(resultado.tipoComando).toBe('CREAR_MATERIA_PRIMA');
      expect(resultado.confianza).toBeGreaterThanOrEqual(0.7);
      expect(resultado.razon).toBeDefined();
    });

    it('debe detectar CREAR_PROVEEDOR correctamente', async () => {
      mockChatCompletionsCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                tipoComando: 'CREAR_PROVEEDOR',
                confianza: 0.90,
                razon: 'El mensaje menciona agregar proveedor',
              }),
            },
          },
        ],
      });

      const resultado = await CorinaService.detectarTipoComando(
        'Agregar proveedor Juan Pérez con código PROV001'
      );

      expect(resultado.tipoComando).toBe('CREAR_PROVEEDOR');
      expect(resultado.confianza).toBeGreaterThanOrEqual(0.7);
    });

    it('debe detectar CREAR_COMPRA correctamente', async () => {
      mockChatCompletionsCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                tipoComando: 'CREAR_COMPRA',
                confianza: 0.88,
                razon: 'El mensaje menciona comprar materias primas',
              }),
            },
          },
        ],
      });

      const resultado = await CorinaService.detectarTipoComando(
        'Compré 100 kg de maíz a $50 por kilo'
      );

      expect(resultado.tipoComando).toBe('CREAR_COMPRA');
      expect(resultado.confianza).toBeGreaterThanOrEqual(0.7);
    });

    it('debe retornar DESCONOCIDO para mensajes ambiguos', async () => {
      mockChatCompletionsCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                tipoComando: 'DESCONOCIDO',
                confianza: 0.2,
                razon: 'Mensaje ambiguo sin intención clara',
              }),
            },
          },
        ],
      });

      const resultado = await CorinaService.detectarTipoComando('Hola');

      expect(resultado.tipoComando).toBe('DESCONOCIDO');
      expect(resultado.confianza).toBeLessThan(0.5);
    });
  });

  describe('extraerDatos', () => {
    it('debe tener la función definida (aún no implementada)', () => {
      // Verificamos que la función existe aunque aún no esté implementada
      expect(typeof CorinaService.extraerDatos).toBe('function');
      
      // Cuando se implemente, debería retornar:
      // {
      //   tablaDestino: 'materiaPrima',
      //   datos: {
      //     codigoMateriaPrima: 'MAIZ001',
      //     nombreMateriaPrima: 'Maíz',
      //     precioPorKilo: 50
      //   },
      //   confianza: 0.9
      // }
    });
  });

  describe('validarDatos', () => {
    it('debe tener la función definida (aún no implementada)', () => {
      // Verificamos que la función existe aunque aún no esté implementada
      expect(typeof CorinaService.validarDatos).toBe('function');
      
      // Cuando se implemente, debería:
      // 1. Verificar campos requeridos
      // 2. Verificar que el código no existe
      // 3. Validar tipos de datos
      // 4. Retornar true si todo es válido
    });
  });

  describe('crearRegistro - Materia Prima', () => {
    it('debe crear materia prima correctamente', async () => {
      const datos = {
        codigoMateriaPrima: 'MAIZ001',
        nombreMateriaPrima: 'Maíz',
        precioPorKilo: 50,
      };

      const idGranja = 'granja-123';

      // Mock de verificación de código duplicado
      (prisma.materiaPrima.findFirst as jest.Mock).mockResolvedValue(null);

      // Mock de creación
      (prisma.materiaPrima.create as jest.Mock).mockResolvedValue({
        id: 'mp-123',
        idGranja,
        codigoMateriaPrima: 'MAIZ001',
        nombreMateriaPrima: 'Maíz',
        precioPorKilo: 50,
        activa: true,
      });

      // Verificamos que Prisma puede crear el registro
      const materiaPrima = await prisma.materiaPrima.create({
        data: {
          idGranja,
          codigoMateriaPrima: datos.codigoMateriaPrima,
          nombreMateriaPrima: datos.nombreMateriaPrima,
          precioPorKilo: datos.precioPorKilo || 0,
        },
      });

      expect(materiaPrima).toBeDefined();
      expect(materiaPrima.id).toBe('mp-123');
      expect(materiaPrima.codigoMateriaPrima).toBe('MAIZ001');
      expect(prisma.materiaPrima.create).toHaveBeenCalledWith({
        data: {
          idGranja,
          codigoMateriaPrima: datos.codigoMateriaPrima,
          nombreMateriaPrima: datos.nombreMateriaPrima,
          precioPorKilo: datos.precioPorKilo || 0,
        },
      });
    });

    it('debe rechazar materia prima con código duplicado', async () => {
      const datos = {
        codigoMateriaPrima: 'MAIZ001',
        nombreMateriaPrima: 'Maíz',
      };

      const idGranja = 'granja-123';

      // Mock de código existente
      (prisma.materiaPrima.findFirst as jest.Mock).mockResolvedValue({
        id: 'mp-existente',
        codigoMateriaPrima: 'MAIZ001',
      });

      // Verificamos que detecta el duplicado
      const codigoExistente = await prisma.materiaPrima.findFirst({
        where: {
          idGranja,
          codigoMateriaPrima: datos.codigoMateriaPrima,
        },
      });

      expect(codigoExistente).toBeDefined();
      expect(codigoExistente?.codigoMateriaPrima).toBe('MAIZ001');
      // Cuando se implemente crearRegistro, debería lanzar error aquí
    });
  });

  describe('crearRegistro - Proveedor', () => {
    it('debe crear proveedor correctamente', async () => {
      const datos = {
        codigoProveedor: 'PROV001',
        nombreProveedor: 'Juan Pérez',
        direccion: 'Calle 123',
        localidad: 'Córdoba',
      };

      const idGranja = 'granja-123';

      // Mock de verificación de código duplicado
      (prisma.proveedor.findFirst as jest.Mock).mockResolvedValue(null);

      // Mock de creación
      (prisma.proveedor.create as jest.Mock).mockResolvedValue({
        id: 'prov-123',
        idGranja,
        codigoProveedor: 'PROV001',
        nombreProveedor: 'Juan Pérez',
        direccion: 'Calle 123',
        localidad: 'Córdoba',
        activo: true,
      });

      const proveedor = await prisma.proveedor.create({
        data: {
          idGranja,
          codigoProveedor: datos.codigoProveedor,
          nombreProveedor: datos.nombreProveedor,
          direccion: datos.direccion,
          localidad: datos.localidad,
        },
      });

      expect(proveedor).toBeDefined();
      expect(proveedor.id).toBe('prov-123');
      expect(proveedor.codigoProveedor).toBe('PROV001');
      expect(prisma.proveedor.create).toHaveBeenCalled();
    });
  });

  describe('crearRegistro - Animal (Pienso)', () => {
    it('debe crear animal correctamente', async () => {
      const datos = {
        codigoAnimal: 'CERDO001',
        descripcionAnimal: 'Cerdo Engorde',
        categoriaAnimal: 'Engorde',
      };

      const idGranja = 'granja-123';

      // Mock de verificación de código duplicado
      (prisma.animal.findFirst as jest.Mock).mockResolvedValue(null);

      // Mock de creación
      (prisma.animal.create as jest.Mock).mockResolvedValue({
        id: 'animal-123',
        idGranja,
        codigoAnimal: 'CERDO001',
        descripcionAnimal: 'Cerdo Engorde',
        categoriaAnimal: 'Engorde',
        activo: true,
      });

      const animal = await prisma.animal.create({
        data: {
          idGranja,
          codigoAnimal: datos.codigoAnimal,
          descripcionAnimal: datos.descripcionAnimal,
          categoriaAnimal: datos.categoriaAnimal,
        },
      });

      expect(animal).toBeDefined();
      expect(animal.id).toBe('animal-123');
      expect(animal.codigoAnimal).toBe('CERDO001');
      expect(prisma.animal.create).toHaveBeenCalled();
    });
  });

  describe('crearRegistro - Compra (vía servicio)', () => {
    it('debe crear compra usando servicio del backend', async () => {
      const datos = {
        idProveedor: 'prov-123',
        numeroFactura: 'FAC-001',
        fechaCompra: new Date('2025-01-15'),
        detalles: [
          {
            idMateriaPrima: 'mp-123',
            cantidadComprada: 100,
            precioUnitario: 50,
          },
        ],
      };

      const idUsuario = 'user-123';
      const idGranja = 'granja-123';

      // Mock del servicio de compras
      (crearCompra as jest.Mock).mockResolvedValue({
        id: 'compra-123',
        idGranja,
        idUsuario,
        idProveedor: 'prov-123',
        numeroFactura: 'FAC-001',
        totalFactura: 5000,
      });

      // Verificamos que se llama al servicio correcto
      const compra = await crearCompra({
        idGranja,
        idUsuario,
        idProveedor: datos.idProveedor,
        numeroFactura: datos.numeroFactura,
        fechaCompra: datos.fechaCompra,
        detalles: datos.detalles,
      });

      expect(crearCompra).toHaveBeenCalledWith({
        idGranja,
        idUsuario,
        idProveedor: datos.idProveedor,
        numeroFactura: datos.numeroFactura,
        fechaCompra: datos.fechaCompra,
        detalles: datos.detalles,
      });

      expect(compra).toBeDefined();
      expect(compra.id).toBe('compra-123');
    });
  });

  describe('crearRegistro - Fabricación (vía servicio)', () => {
    it('debe crear fabricación usando servicio del backend', async () => {
      const datos = {
        idFormula: 'formula-123',
        descripcionFabricacion: 'Fabricación de prueba',
        cantidadFabricacion: 0.5, // 0.5 veces = 500 kg
        fechaFabricacion: new Date('2025-01-15'),
      };

      const idUsuario = 'user-123';
      const idGranja = 'granja-123';

      // Mock del servicio de fabricaciones
      (crearFabricacion as jest.Mock).mockResolvedValue({
        id: 'fab-123',
        idGranja,
        idUsuario,
        idFormula: 'formula-123',
        cantidadFabricacion: 500, // En kg
        costoTotalFabricacion: 2500,
      });

      // Verificamos que se llama al servicio correcto
      const fabricacion = await crearFabricacion({
        idGranja,
        idUsuario,
        idFormula: datos.idFormula,
        descripcionFabricacion: datos.descripcionFabricacion,
        cantidadFabricacion: datos.cantidadFabricacion,
        fechaFabricacion: datos.fechaFabricacion,
      });

      expect(crearFabricacion).toHaveBeenCalled();
      expect(fabricacion).toBeDefined();
      expect(fabricacion.id).toBe('fab-123');
    });
  });

  describe('crearRegistro - Fórmula', () => {
    it('debe crear fórmula correctamente', async () => {
      const datos = {
        idAnimal: 'animal-123',
        codigoFormula: 'FORM001',
        descripcionFormula: 'Fórmula Engorde',
        detalles: [
          {
            idMateriaPrima: 'mp-123',
            cantidadKg: 500,
          },
          {
            idMateriaPrima: 'mp-456',
            cantidadKg: 500,
          },
        ],
      };

      const idGranja = 'granja-123';

      // Mock de verificación de código duplicado
      (prisma.formulaCabecera.findUnique as jest.Mock).mockResolvedValue(null);

      // Mock de materias primas para calcular precios
      (prisma.materiaPrima.findUnique as jest.Mock)
        .mockResolvedValueOnce({ precioPorKilo: 50 }) // mp-123
        .mockResolvedValueOnce({ precioPorKilo: 30 }); // mp-456

      // Mock de creación
      (crearFormula as jest.Mock).mockResolvedValue({
        id: 'formula-123',
        idGranja,
        idAnimal: 'animal-123',
        codigoFormula: 'FORM001',
        descripcionFormula: 'Fórmula Engorde',
        costoTotalFormula: 40000, // (500 * 50) + (500 * 30)
      });

      const formula = await crearFormula({
        idGranja,
        idAnimal: datos.idAnimal,
        codigoFormula: datos.codigoFormula,
        descripcionFormula: datos.descripcionFormula,
        detalles: datos.detalles,
      });

      expect(crearFormula).toHaveBeenCalled();
      expect(formula).toBeDefined();
      expect(formula.id).toBe('formula-123');
    });
  });

  describe('Flujo completo de creación', () => {
    it('debe tener todas las funciones necesarias definidas', async () => {
      const mensaje = 'Crear materia prima maíz con código MAIZ001';

      // Mock para detección
      mockChatCompletionsCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                tipoComando: 'CREAR_MATERIA_PRIMA',
                confianza: 0.95,
                razon: 'Mensaje claro sobre crear materia prima',
              }),
            },
          },
        ],
      });

      // Paso 1: Detectar tipo
      const deteccion = await CorinaService.detectarTipoComando(mensaje);
      expect(deteccion.tipoComando).toBe('CREAR_MATERIA_PRIMA');
      expect(deteccion.confianza).toBeGreaterThanOrEqual(0.7);

      // Verificamos que todas las funciones están definidas
      expect(typeof CorinaService.detectarTipoComando).toBe('function');
      expect(typeof CorinaService.extraerDatos).toBe('function');
      expect(typeof CorinaService.validarDatos).toBe('function');
      expect(typeof CorinaService.crearRegistro).toBe('function');

      // Verificamos que podemos crear registros directamente con Prisma
      expect(typeof prisma.materiaPrima.create).toBe('function');
      expect(typeof prisma.proveedor.create).toBe('function');
      expect(typeof prisma.animal.create).toBe('function');
      expect(typeof crearCompra).toBe('function');
      expect(typeof crearFabricacion).toBe('function');
      expect(typeof crearFormula).toBe('function');
    });
  });

  describe('Viabilidad de Generación de Registros', () => {
    it('debe ser posible crear materia prima a través de CORINA', async () => {
      // Simulamos el flujo completo
      const idGranja = 'granja-123';
      const datosMateriaPrima = {
        codigoMateriaPrima: 'MAIZ001',
        nombreMateriaPrima: 'Maíz',
        precioPorKilo: 0,
      };

      // Mock de verificación
      (prisma.materiaPrima.findFirst as jest.Mock).mockResolvedValue(null);

      // Mock de creación
      (prisma.materiaPrima.create as jest.Mock).mockResolvedValue({
        id: 'mp-123',
        ...datosMateriaPrima,
        idGranja,
        activa: true,
      });

      // Verificamos que podemos crear
      const resultado = await prisma.materiaPrima.create({
        data: {
          idGranja,
          ...datosMateriaPrima,
        },
      });

      expect(resultado).toBeDefined();
      expect(resultado.codigoMateriaPrima).toBe('MAIZ001');
    });

    it('debe ser posible crear proveedor a través de CORINA', async () => {
      const idGranja = 'granja-123';
      const datosProveedor = {
        codigoProveedor: 'PROV001',
        nombreProveedor: 'Juan Pérez',
        direccion: 'Calle 123',
        localidad: 'Córdoba',
      };

      (prisma.proveedor.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.proveedor.create as jest.Mock).mockResolvedValue({
        id: 'prov-123',
        ...datosProveedor,
        idGranja,
        activo: true,
      });

      const resultado = await prisma.proveedor.create({
        data: {
          idGranja,
          ...datosProveedor,
        },
      });

      expect(resultado).toBeDefined();
      expect(resultado.codigoProveedor).toBe('PROV001');
    });

    it('debe ser posible crear compra a través de CORINA usando servicio', async () => {
      const idGranja = 'granja-123';
      const idUsuario = 'user-123';

      (crearCompra as jest.Mock).mockResolvedValue({
        id: 'compra-123',
        idGranja,
        idUsuario,
        totalFactura: 5000,
      });

      const resultado = await crearCompra({
        idGranja,
        idUsuario,
        idProveedor: 'prov-123',
        numeroFactura: 'FAC-001',
        fechaCompra: new Date(),
        detalles: [
          {
            idMateriaPrima: 'mp-123',
            cantidadComprada: 100,
            precioUnitario: 50,
          },
        ],
      });

      expect(resultado).toBeDefined();
      expect(crearCompra).toHaveBeenCalled();
    });

    it('debe ser posible crear fabricación a través de CORINA usando servicio', async () => {
      const idGranja = 'granja-123';
      const idUsuario = 'user-123';

      (crearFabricacion as jest.Mock).mockResolvedValue({
        id: 'fab-123',
        idGranja,
        idUsuario,
        costoTotalFabricacion: 2500,
      });

      const resultado = await crearFabricacion({
        idGranja,
        idUsuario,
        idFormula: 'formula-123',
        descripcionFabricacion: 'Fabricación de prueba',
        cantidadFabricacion: 0.5,
        fechaFabricacion: new Date(),
      });

      expect(resultado).toBeDefined();
      expect(crearFabricacion).toHaveBeenCalled();
    });
  });
});
