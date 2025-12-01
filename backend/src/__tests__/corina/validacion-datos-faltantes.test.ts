/**
 * Tests de integración para validar que CORINA solicita datos faltantes
 * y registra las interacciones en el sistema
 */

import { CorinaService } from '../../services/corinaService';
import { CorinaNotificacionService } from '../../services/corinaNotificacionService';
import { procesarMensajeTexto } from '../../controllers/corinaController';
import prisma from '../../lib/prisma';

// Mock de Prisma
jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    usuario: {
      findFirst: jest.fn(),
    },
    granja: {
      findUnique: jest.fn(),
    },
    materiaPrima: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    proveedor: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    animal: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    corinaInteraccion: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock de CorinaNotificacionService
jest.mock('../../services/corinaNotificacionService', () => ({
  CorinaNotificacionService: {
    enviarMensajeWhatsApp: jest.fn(),
  },
}));

// Mock de OpenAI para detectarTipoComando
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

describe('Validación: CORINA solicita datos faltantes', () => {
  const mockUsuario = {
    id: 'user-123',
    telefono: 'whatsapp:+5493515930163',
    telefonoVerificado: true,
    planSuscripcion: 'ENTERPRISE',
    granjas: [
      {
        id: 'granja-123',
        nombreGranja: 'Granja Test',
        activa: true,
      },
    ],
  };

  const mockGranja = {
    id: 'granja-123',
    nombreGranja: 'Granja Test',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock de usuario por defecto
    (prisma.usuario.findFirst as jest.Mock).mockResolvedValue(mockUsuario);
    
    // Mock de granja por defecto
    (prisma.granja.findUnique as jest.Mock).mockResolvedValue(mockGranja);
    
    // Mock de detección de comando (CREAR_MATERIA_PRIMA)
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
  });

  describe('validarDatos - Materia Prima', () => {
    it('debe detectar que faltan campos requeridos', async () => {
      const datosIncompletos = {
        tablaDestino: 'materiaPrima',
        datos: {
          nombreMateriaPrima: 'Maíz',
          // Falta codigoMateriaPrima
        },
        confianza: 0.9,
      };

      // Mock: no hay código duplicado
      (prisma.materiaPrima.findFirst as jest.Mock).mockResolvedValue(null);

      const validacion = await CorinaService.validarDatos(
        datosIncompletos,
        'granja-123'
      );

      expect(validacion.esValido).toBe(false);
      expect(validacion.camposFaltantes).toContain('código de materia prima');
      expect(validacion.camposFaltantes).not.toContain('nombre de materia prima');
    });

    it('debe detectar que faltan todos los campos requeridos', async () => {
      const datosVacios = {
        tablaDestino: 'materiaPrima',
        datos: {},
        confianza: 0.9,
      };

      const validacion = await CorinaService.validarDatos(
        datosVacios,
        'granja-123'
      );

      expect(validacion.esValido).toBe(false);
      expect(validacion.camposFaltantes).toContain('código de materia prima');
      expect(validacion.camposFaltantes).toContain('nombre de materia prima');
    });

    it('debe validar correctamente cuando todos los campos están presentes', async () => {
      const datosCompletos = {
        tablaDestino: 'materiaPrima',
        datos: {
          codigoMateriaPrima: 'MAIZ001',
          nombreMateriaPrima: 'Maíz',
        },
        confianza: 0.9,
      };

      // Mock: no hay código duplicado
      (prisma.materiaPrima.findFirst as jest.Mock).mockResolvedValue(null);

      const validacion = await CorinaService.validarDatos(
        datosCompletos,
        'granja-123'
      );

      expect(validacion.esValido).toBe(true);
      expect(validacion.camposFaltantes).toBeUndefined();
      expect(validacion.errores).toBeUndefined();
    });

    it('debe detectar código duplicado', async () => {
      const datosConDuplicado = {
        tablaDestino: 'materiaPrima',
        datos: {
          codigoMateriaPrima: 'MAIZ001',
          nombreMateriaPrima: 'Maíz',
        },
        confianza: 0.9,
      };

      // Mock: código ya existe (findFirst retorna el registro existente)
      (prisma.materiaPrima.findFirst as jest.Mock).mockResolvedValueOnce({
        id: 'mp-existente',
        codigoMateriaPrima: 'MAIZ001',
        nombreMateriaPrima: 'Maíz Existente',
      });

      const validacion = await CorinaService.validarDatos(
        datosConDuplicado,
        'granja-123'
      );

      // Verificar que findFirst fue llamado con los parámetros correctos
      expect(prisma.materiaPrima.findFirst).toHaveBeenCalledWith({
        where: {
          idGranja: 'granja-123',
          codigoMateriaPrima: 'MAIZ001',
        },
      });

      expect(validacion.esValido).toBe(false);
      expect(validacion.errores).toBeDefined();
      expect(validacion.errores?.length).toBeGreaterThan(0);
      expect(validacion.errores?.[0]).toContain('MAIZ001');
      expect(validacion.errores?.[0]).toContain('duplicado');
    });
  });

  describe('generarMensajeSolicitudDatos', () => {
    it('debe generar mensaje solicitando datos faltantes para materia prima', () => {
      const camposFaltantes = ['código de materia prima', 'nombre de materia prima'];
      
      const mensaje = CorinaService.generarMensajeSolicitudDatos(
        'materiaPrima',
        camposFaltantes
      );

      expect(mensaje).toContain('CORINA');
      expect(mensaje).toContain('materia prima');
      expect(mensaje).toContain('código de materia prima');
      expect(mensaje).toContain('nombre de materia prima');
      expect(mensaje).toContain('MAIZ001'); // Ejemplo incluido
      expect(mensaje).toContain('Faltan los siguientes datos');
    });

    it('debe generar mensaje solicitando datos faltantes para proveedor', () => {
      const camposFaltantes = ['código de proveedor'];
      
      const mensaje = CorinaService.generarMensajeSolicitudDatos(
        'proveedor',
        camposFaltantes
      );

      expect(mensaje).toContain('proveedor');
      expect(mensaje).toContain('código de proveedor');
      expect(mensaje).toContain('PROV001'); // Ejemplo incluido
    });

    it('debe generar mensaje sin campos faltantes si la lista está vacía', () => {
      const mensaje = CorinaService.generarMensajeSolicitudDatos(
        'materiaPrima',
        []
      );

      expect(mensaje).toContain('CORINA');
      expect(mensaje).toContain('materia prima');
      expect(mensaje).not.toContain('Faltan los siguientes datos');
    });
  });

  describe('Flujo completo: Detección y validación de datos incompletos', () => {
    it('debe crear interacción cuando detecta comando de creación con datos incompletos', async () => {
      const from = 'whatsapp:+5493515930163';
      const mensaje = 'Crear materia prima maíz'; // Sin código

      // Mock: no hay interacción pendiente
      (prisma.corinaInteraccion.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.corinaInteraccion.findMany as jest.Mock).mockResolvedValue([]);

      // Mock: no hay código duplicado
      (prisma.materiaPrima.findFirst as jest.Mock).mockResolvedValue(null);

      // Mock de creación de interacción
      const mockInteraccion = {
        id: 'interaccion-123',
        idUsuario: 'user-123',
        idGranja: 'granja-123',
        tipoInteraccion: 'CREACION_REGISTRO',
        estadoInteraccion: 'PENDIENTE',
        mensajeRecibido: mensaje,
        datosExtraidos: {
          tipoComando: 'CREAR_MATERIA_PRIMA',
          tablaDestino: 'materiaPrima',
          datos: {
            mensajeOriginal: mensaje,
          },
          validacion: {
            esValido: false,
            camposFaltantes: ['código de materia prima'],
          },
        },
      };

      (prisma.corinaInteraccion.create as jest.Mock).mockResolvedValue(mockInteraccion);

      // Ejecutar procesamiento
      await procesarMensajeTexto(from, mensaje);

      // Verificar que se creó la interacción
      expect(prisma.corinaInteraccion.create).toHaveBeenCalled();
      
      const createCall = (prisma.corinaInteraccion.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.tipoInteraccion).toBe('CREACION_REGISTRO');
      expect(createCall.data.estadoInteraccion).toBe('PENDIENTE');
      
      // Verificar que se envió mensaje solicitando datos faltantes
      expect(CorinaNotificacionService.enviarMensajeWhatsApp).toHaveBeenCalled();
      
      const mensajeEnviado = (CorinaNotificacionService.enviarMensajeWhatsApp as jest.Mock).mock.calls[0][1];
      expect(mensajeEnviado).toContain('código de materia prima');
      expect(mensajeEnviado).toContain('Faltan los siguientes datos');
    });

    it('debe actualizar interacción cuando se proporcionan datos faltantes', async () => {
      const from = 'whatsapp:+5493515930163';
      const mensajeSeguimiento = 'El código es MAIZ001';

      // Mock: hay interacción pendiente
      const interaccionPendiente = {
        id: 'interaccion-123',
        idUsuario: 'user-123',
        idGranja: 'granja-123',
        tipoInteraccion: 'CREACION_REGISTRO',
        estadoInteraccion: 'PENDIENTE',
        mensajeRecibido: 'Crear materia prima maíz',
        datosExtraidos: {
          tipoComando: 'CREAR_MATERIA_PRIMA',
          tablaDestino: 'materiaPrima',
          datos: {
            nombreMateriaPrima: 'Maíz',
          },
          validacion: {
            esValido: false,
            camposFaltantes: ['código de materia prima'],
          },
        },
      };

      (prisma.corinaInteraccion.findMany as jest.Mock).mockResolvedValue([interaccionPendiente]);
      
      // Mock: no hay código duplicado
      (prisma.materiaPrima.findFirst as jest.Mock).mockResolvedValue(null);

      // Mock de actualización
      (prisma.corinaInteraccion.update as jest.Mock).mockResolvedValue({
        ...interaccionPendiente,
        estadoInteraccion: 'PROCESANDO',
      });

      // Ejecutar procesamiento
      await procesarMensajeTexto(from, mensajeSeguimiento);

      // Verificar que se actualizó la interacción
      expect(prisma.corinaInteraccion.update).toHaveBeenCalled();
      
      const updateCall = (prisma.corinaInteraccion.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.where.id).toBe('interaccion-123');
      expect(updateCall.data.estadoInteraccion).toBe('PROCESANDO');
    });

    it('debe detectar código duplicado y solicitar corrección', async () => {
      const from = 'whatsapp:+5493515930163';
      const mensaje = 'Crear materia prima maíz con código MAIZ001';

      // Mock: no hay interacción pendiente
      (prisma.corinaInteraccion.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.corinaInteraccion.findMany as jest.Mock).mockResolvedValue([]);

      // Mock: código ya existe
      (prisma.materiaPrima.findFirst as jest.Mock).mockResolvedValue({
        id: 'mp-existente',
        codigoMateriaPrima: 'MAIZ001',
      });

      // Mock de creación de interacción
      const mockInteraccion = {
        id: 'interaccion-123',
        idUsuario: 'user-123',
        idGranja: 'granja-123',
        tipoInteraccion: 'CREACION_REGISTRO',
        estadoInteraccion: 'PENDIENTE',
        mensajeRecibido: mensaje,
        datosExtraidos: {
          tipoComando: 'CREAR_MATERIA_PRIMA',
          tablaDestino: 'materiaPrima',
          datos: {
            mensajeOriginal: mensaje,
          },
          validacion: {
            esValido: false,
            errores: ['Ya existe una materia prima con el código "MAIZ001". Por favor, usa un código diferente.'],
          },
        },
      };

      (prisma.corinaInteraccion.create as jest.Mock).mockResolvedValue(mockInteraccion);

      // Ejecutar procesamiento
      await procesarMensajeTexto(from, mensaje);

      // Verificar que se envió mensaje informando del duplicado
      expect(CorinaNotificacionService.enviarMensajeWhatsApp).toHaveBeenCalled();
      
      const mensajeEnviado = (CorinaNotificacionService.enviarMensajeWhatsApp as jest.Mock).mock.calls[0][1];
      expect(mensajeEnviado).toContain('MAIZ001');
      expect(mensajeEnviado).toContain('duplicado');
      expect(mensajeEnviado).toContain('código diferente');
    });
  });

  describe('Registro en base de datos', () => {
    it('debe registrar interacción con datos de validación cuando hay campos faltantes', async () => {
      const datosIncompletos = {
        tablaDestino: 'materiaPrima',
        datos: {
          nombreMateriaPrima: 'Maíz',
        },
        confianza: 0.9,
      };

      // Mock: no hay código duplicado
      (prisma.materiaPrima.findFirst as jest.Mock).mockResolvedValue(null);

      const validacion = await CorinaService.validarDatos(
        datosIncompletos,
        'granja-123'
      );

      // Simular creación de interacción con datos de validación
      const interaccionData = {
        idUsuario: 'user-123',
        idGranja: 'granja-123',
        tipoInteraccion: 'CREACION_REGISTRO' as const,
        estadoInteraccion: 'PENDIENTE' as const,
        mensajeRecibido: 'Crear materia prima maíz',
        datosExtraidos: {
          tablaDestino: datosIncompletos.tablaDestino,
          datos: datosIncompletos.datos,
          validacion: {
            esValido: validacion.esValido,
            camposFaltantes: validacion.camposFaltantes,
            errores: validacion.errores,
          },
        },
      };

      const mockInteraccion = {
        id: 'interaccion-123',
        ...interaccionData,
      };

      (prisma.corinaInteraccion.create as jest.Mock).mockResolvedValue(mockInteraccion);

      const interaccion = await prisma.corinaInteraccion.create({
        data: interaccionData as any, // Usar 'as any' para evitar problemas de tipos en tests
      });

      expect(interaccion).toBeDefined();
      expect(interaccion.id).toBe('interaccion-123');
      expect(interaccion.estadoInteraccion).toBe('PENDIENTE');
      
      const datosExtraidos = interaccion.datosExtraidos as any;
      expect(datosExtraidos.validacion.esValido).toBe(false);
      expect(datosExtraidos.validacion.camposFaltantes).toContain('código de materia prima');
    });

    it('debe registrar interacción con estado PROCESANDO cuando datos son válidos', async () => {
      const datosCompletos = {
        tablaDestino: 'materiaPrima',
        datos: {
          codigoMateriaPrima: 'MAIZ001',
          nombreMateriaPrima: 'Maíz',
        },
        confianza: 0.9,
      };

      // Mock: no hay código duplicado
      (prisma.materiaPrima.findFirst as jest.Mock).mockResolvedValue(null);

      const validacion = await CorinaService.validarDatos(
        datosCompletos,
        'granja-123'
      );

      expect(validacion.esValido).toBe(true);

      // Simular creación de interacción con datos válidos
      const interaccionData = {
        idUsuario: 'user-123',
        idGranja: 'granja-123',
        tipoInteraccion: 'CREACION_REGISTRO' as const,
        estadoInteraccion: 'PROCESANDO' as const,
        mensajeRecibido: 'Crear materia prima maíz con código MAIZ001',
        datosExtraidos: {
          tablaDestino: datosCompletos.tablaDestino,
          datos: datosCompletos.datos,
          validacion: {
            esValido: validacion.esValido,
          },
        },
      };

      const mockInteraccion = {
        id: 'interaccion-123',
        ...interaccionData,
      };

      (prisma.corinaInteraccion.create as jest.Mock).mockResolvedValue(mockInteraccion);

      const interaccion = await prisma.corinaInteraccion.create({
        data: interaccionData as any, // Usar 'as any' para evitar problemas de tipos en tests
      });

      expect(interaccion.estadoInteraccion).toBe('PROCESANDO');
      
      const datosExtraidos = interaccion.datosExtraidos as any;
      expect(datosExtraidos.validacion.esValido).toBe(true);
    });
  });
});

