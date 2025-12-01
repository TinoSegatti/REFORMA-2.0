/**
 * Tests de integración para el flujo completo de confirmación
 * Verifica el flujo: Preview → Confirmación → Creación
 */

import { procesarMensajeTexto } from '../../controllers/corinaController';
import prisma from '../../lib/prisma';
import { CorinaNotificacionService } from '../../services/corinaNotificacionService';
import { CorinaService } from '../../services/corinaService';

// Mock de Prisma
jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    usuario: {
      findFirst: jest.fn(),
    },
    corinaInteraccion: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    materiaPrima: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

// Mock de servicios
jest.mock('../../services/corinaNotificacionService', () => ({
  CorinaNotificacionService: {
    enviarMensajeWhatsApp: jest.fn(),
  },
}));

jest.mock('../../services/corinaService', () => ({
  CorinaService: {
    detectarTipoComando: jest.fn(),
    extraerDatos: jest.fn(),
    normalizarDatos: jest.fn(),
    validarDatos: jest.fn(),
    generarMensajePreview: jest.fn(),
    crearRegistro: jest.fn(),
  },
}));

describe('Flujo Completo de Confirmación', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Flujo: Creación → Preview → Confirmación', () => {
    it('debe mostrar preview cuando los datos son válidos', async () => {
      const from = 'whatsapp:+5493515930163';
      const mensaje = 'Crear materia prima maíz con código MAIZ001';

      // Mock: usuario encontrado
      (prisma.usuario.findFirst as jest.Mock).mockResolvedValue({
        id: 'usuario-123',
        telefono: 'whatsapp:+5493515930163',
        telefonoVerificado: true,
        granjas: [{ id: 'granja-123', nombreGranja: 'Granja Test' }],
      });

      // Mock: no hay interacciones pendientes
      (prisma.corinaInteraccion.findFirst as jest.Mock).mockResolvedValue(null);

      // Mock: detección de comando
      (CorinaService.detectarTipoComando as jest.Mock).mockResolvedValue({
        tipoComando: 'CREAR_MATERIA_PRIMA',
        confianza: 0.95,
        razon: 'Mensaje sobre crear materia prima',
      });

      // Mock: extracción de datos
      (CorinaService.extraerDatos as jest.Mock).mockResolvedValue({
        tablaDestino: 'materiaPrima',
        datos: {
          codigoMateriaPrima: 'MAIZ001',
          nombreMateriaPrima: 'Maíz',
        },
        confianza: 1.0,
      });

      // Mock: normalización
      (CorinaService.normalizarDatos as jest.Mock).mockResolvedValue({
        datosNormalizados: {
          codigoMateriaPrima: 'MAIZ001',
          nombreMateriaPrima: 'Maíz',
        },
        errores: [],
        advertencias: [],
      });

      // Mock: validación
      (CorinaService.validarDatos as jest.Mock).mockResolvedValue({
        esValido: true,
      });

      // Mock: preview
      (CorinaService.generarMensajePreview as jest.Mock).mockResolvedValue(
        '✅ CORINA\n\n📋 Preview del registro a crear:\n\n• Tipo: Materia Prima\n• Código: MAIZ001\n• Nombre: Maíz\n\n🤔 ¿Deseas crear este registro?'
      );

      // Mock: creación de interacción
      (prisma.corinaInteraccion.create as jest.Mock).mockResolvedValue({
        id: 'interaccion-123',
      });

      await procesarMensajeTexto(from, mensaje);

      // Verificar que se generó el preview
      expect(CorinaService.generarMensajePreview).toHaveBeenCalled();
      
      // Verificar que se envió el mensaje de preview
      expect(CorinaNotificacionService.enviarMensajeWhatsApp).toHaveBeenCalled();
      
      const mensajeEnviado = (CorinaNotificacionService.enviarMensajeWhatsApp as jest.Mock).mock.calls[0][1];
      expect(mensajeEnviado).toContain('Preview del registro a crear');
      expect(mensajeEnviado).toContain('MAIZ001');
      
      // Verificar que se creó la interacción con estado ESPERANDO_CONFIRMACION
      expect(prisma.corinaInteraccion.create).toHaveBeenCalled();
      const createCall = (prisma.corinaInteraccion.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.estadoInteraccion).toBe('ESPERANDO_CONFIRMACION');
    });

    it('debe crear registro cuando el usuario confirma', async () => {
      const from = 'whatsapp:+5493515930163';
      const mensaje = 'Sí';

      // Mock: usuario encontrado
      (prisma.usuario.findFirst as jest.Mock).mockResolvedValue({
        id: 'usuario-123',
        telefono: 'whatsapp:+5493515930163',
        telefonoVerificado: true,
        granjas: [{ id: 'granja-123', nombreGranja: 'Granja Test' }],
      });

      // Mock: interacción esperando confirmación
      (prisma.corinaInteraccion.findFirst as jest.Mock).mockResolvedValue({
        id: 'interaccion-123',
        idGranja: 'granja-123',
        datosExtraidos: {
          tablaDestino: 'materiaPrima',
          datos: {
            codigoMateriaPrima: 'MAIZ001',
            nombreMateriaPrima: 'Maíz',
          },
        },
      });

      // Mock: creación de registro
      (CorinaService.crearRegistro as jest.Mock).mockResolvedValue({
        id: 'mp-123',
        codigoMateriaPrima: 'MAIZ001',
        nombreMateriaPrima: 'Maíz',
      });

      // Mock: actualización de interacción
      (prisma.corinaInteraccion.update as jest.Mock).mockResolvedValue({});

      await procesarMensajeTexto(from, mensaje);

      // Verificar que se creó el registro
      expect(CorinaService.crearRegistro).toHaveBeenCalledWith(
        'materiaPrima',
        {
          codigoMateriaPrima: 'MAIZ001',
          nombreMateriaPrima: 'Maíz',
        },
        'granja-123',
        'usuario-123'
      );

      // Verificar que se envió mensaje de éxito
      expect(CorinaNotificacionService.enviarMensajeWhatsApp).toHaveBeenCalled();
      const mensajeEnviado = (CorinaNotificacionService.enviarMensajeWhatsApp as jest.Mock).mock.calls[0][1];
      expect(mensajeEnviado).toContain('Registro creado exitosamente');

      // Verificar que se actualizó la interacción como completada
      expect(prisma.corinaInteraccion.update).toHaveBeenCalled();
      const updateCall = (prisma.corinaInteraccion.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.estadoInteraccion).toBe('COMPLETADA');
      expect(updateCall.data.registroCreadoId).toBe('mp-123');
    });

    it('debe cancelar cuando el usuario responde "No"', async () => {
      const from = 'whatsapp:+5493515930163';
      const mensaje = 'No';

      // Mock: usuario encontrado
      (prisma.usuario.findFirst as jest.Mock).mockResolvedValue({
        id: 'usuario-123',
        telefono: 'whatsapp:+5493515930163',
        telefonoVerificado: true,
        granjas: [{ id: 'granja-123', nombreGranja: 'Granja Test' }],
      });

      // Mock: múltiples llamadas a findFirst
      (prisma.corinaInteraccion.findFirst as jest.Mock)
        .mockResolvedValueOnce(null) // Primera llamada: no hay interacciones de consulta pendientes
        .mockResolvedValueOnce({
          id: 'interaccion-123',
          idGranja: 'granja-123',
          datosExtraidos: {
            tablaDestino: 'materiaPrima',
            datos: {},
          },
        }); // Segunda llamada: interacción de confirmación

      // Mock: actualización de interacción
      (prisma.corinaInteraccion.update as jest.Mock).mockResolvedValue({});

      await procesarMensajeTexto(from, mensaje);

      // Verificar que NO se creó el registro
      expect(CorinaService.crearRegistro).not.toHaveBeenCalled();

      // Verificar que se envió mensaje de cancelación
      expect(CorinaNotificacionService.enviarMensajeWhatsApp).toHaveBeenCalled();
      const mensajeEnviado = (CorinaNotificacionService.enviarMensajeWhatsApp as jest.Mock).mock.calls[0][1];
      expect(mensajeEnviado).toContain('Creación cancelada');

      // Verificar que se actualizó la interacción como cancelada
      expect(prisma.corinaInteraccion.update).toHaveBeenCalled();
      const updateCall = (prisma.corinaInteraccion.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.estadoInteraccion).toBe('CANCELADA');
    });

    it('debe permitir modificar cuando el usuario responde "Modificar"', async () => {
      const from = 'whatsapp:+5493515930163';
      const mensaje = 'Modificar';

      // Mock: usuario encontrado
      (prisma.usuario.findFirst as jest.Mock).mockResolvedValue({
        id: 'usuario-123',
        telefono: 'whatsapp:+5493515930163',
        telefonoVerificado: true,
        granjas: [{ id: 'granja-123', nombreGranja: 'Granja Test' }],
      });

      // Mock: múltiples llamadas a findFirst
      (prisma.corinaInteraccion.findFirst as jest.Mock)
        .mockResolvedValueOnce(null) // Primera llamada: no hay interacciones de consulta pendientes
        .mockResolvedValueOnce({
          id: 'interaccion-123',
          idGranja: 'granja-123',
          datosExtraidos: {
            tablaDestino: 'materiaPrima',
            datos: {},
          },
        }); // Segunda llamada: interacción de confirmación

      // Mock: actualización de interacción
      (prisma.corinaInteraccion.update as jest.Mock).mockResolvedValue({});

      await procesarMensajeTexto(from, mensaje);

      // Verificar que se envió mensaje de modificación
      expect(CorinaNotificacionService.enviarMensajeWhatsApp).toHaveBeenCalled();
      const mensajeEnviado = (CorinaNotificacionService.enviarMensajeWhatsApp as jest.Mock).mock.calls[0][1];
      expect(mensajeEnviado).toContain('modificar');

      // Verificar que se actualizó la interacción a PROCESANDO
      expect(prisma.corinaInteraccion.update).toHaveBeenCalled();
      const updateCall = (prisma.corinaInteraccion.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.estadoInteraccion).toBe('PROCESANDO');
    });

    it('debe manejar errores al crear registro', async () => {
      const from = 'whatsapp:+5493515930163';
      const mensaje = 'Sí';

      // Mock: usuario encontrado
      (prisma.usuario.findFirst as jest.Mock).mockResolvedValue({
        id: 'usuario-123',
        telefono: 'whatsapp:+5493515930163',
        telefonoVerificado: true,
        granjas: [{ id: 'granja-123', nombreGranja: 'Granja Test' }],
      });

      // Mock: interacción esperando confirmación
      (prisma.corinaInteraccion.findFirst as jest.Mock).mockResolvedValue({
        id: 'interaccion-123',
        idGranja: 'granja-123',
        datosExtraidos: {
          tablaDestino: 'materiaPrima',
          datos: {
            codigoMateriaPrima: 'MAIZ001',
            nombreMateriaPrima: 'Maíz',
          },
        },
      });

      // Mock: error al crear registro
      (CorinaService.crearRegistro as jest.Mock).mockRejectedValue(
        new Error('Ya existe una materia prima con el código "MAIZ001"')
      );

      // Mock: actualización de interacción
      (prisma.corinaInteraccion.update as jest.Mock).mockResolvedValue({});

      await procesarMensajeTexto(from, mensaje);

      // Verificar que se envió mensaje de error
      expect(CorinaNotificacionService.enviarMensajeWhatsApp).toHaveBeenCalled();
      const mensajeEnviado = (CorinaNotificacionService.enviarMensajeWhatsApp as jest.Mock).mock.calls[0][1];
      expect(mensajeEnviado).toContain('Error al crear el registro');
      expect(mensajeEnviado).toContain('MAIZ001');

      // Verificar que se actualizó la interacción con error
      expect(prisma.corinaInteraccion.update).toHaveBeenCalled();
      const updateCall = (prisma.corinaInteraccion.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.estadoInteraccion).toBe('ERROR');
      expect(updateCall.data.errorMensaje).toContain('MAIZ001');
    });

    it('debe recordar opciones cuando la respuesta no es reconocida', async () => {
      const from = 'whatsapp:+5493515930163';
      const mensaje = 'Tal vez';

      // Mock: usuario encontrado
      (prisma.usuario.findFirst as jest.Mock).mockResolvedValue({
        id: 'usuario-123',
        telefono: 'whatsapp:+5493515930163',
        telefonoVerificado: true,
        granjas: [{ id: 'granja-123', nombreGranja: 'Granja Test' }],
      });

      // Mock: múltiples llamadas a findFirst
      (prisma.corinaInteraccion.findFirst as jest.Mock)
        .mockResolvedValueOnce(null) // Primera llamada: no hay interacciones de consulta pendientes
        .mockResolvedValueOnce({
          id: 'interaccion-123',
          idGranja: 'granja-123',
          datosExtraidos: {
            tablaDestino: 'materiaPrima',
            datos: {},
          },
        }); // Segunda llamada: interacción de confirmación

      await procesarMensajeTexto(from, mensaje);

      // Verificar que se envió mensaje recordando opciones
      expect(CorinaNotificacionService.enviarMensajeWhatsApp).toHaveBeenCalled();
      const mensajeEnviado = (CorinaNotificacionService.enviarMensajeWhatsApp as jest.Mock).mock.calls[0][1];
      expect(mensajeEnviado).toContain('No entendí tu respuesta');
      expect(mensajeEnviado).toContain('Sí');
      expect(mensajeEnviado).toContain('Cancelar');
      expect(mensajeEnviado).toContain('Modificar');
    });
  });
});

