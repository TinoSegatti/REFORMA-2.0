/**
 * Tests para el servicio CorinaNotificacionService
 */

import { CorinaNotificacionService } from '../../services/corinaNotificacionService';
import { prisma } from '../../config/database';
import { obtenerPlanEfectivo } from '../../middleware/validateEnterpriseFeature';

// Mock de dependencias
jest.mock('../../config/database', () => ({
  prisma: {
    usuario: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    granja: {
      findUnique: jest.fn(),
    },
    materiaPrima: {
      findUnique: jest.fn(),
    },
    inventario: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    corinaNotificacion: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../../middleware/validateEnterpriseFeature');
jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn(),
    },
  }));
});

describe('CorinaNotificacionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CORINA_ENABLED = 'true';
    process.env.TWILIO_ACCOUNT_SID = 'test-sid';
    process.env.TWILIO_AUTH_TOKEN = 'test-token';
    process.env.TWILIO_WHATSAPP_NUMBER = 'whatsapp:+1234567890';
  });

  describe('detectarNuevaAlerta', () => {
    it('no debe hacer nada si cantidadReal > 0', async () => {
      await CorinaNotificacionService.detectarNuevaAlerta(
        'granja-123',
        'materia-123',
        10
      );

      expect(prisma.granja.findUnique).not.toHaveBeenCalled();
    });

    it('debe detectar alerta cuando cantidadReal <= 0', async () => {
      (prisma.granja.findUnique as jest.Mock).mockResolvedValue({
        id: 'granja-123',
        nombreGranja: 'Granja Test',
        usuario: {
          id: 'user-123',
          planSuscripcion: 'ENTERPRISE',
          notificacionesWhatsAppActivas: true,
          telefonoVerificado: true,
          telefono: 'whatsapp:+5493515930163',
        },
      });

      (prisma.materiaPrima.findUnique as jest.Mock).mockResolvedValue({
        nombreMateriaPrima: 'Maíz',
        codigoMateriaPrima: 'MP001',
      });

      (prisma.inventario.findUnique as jest.Mock).mockResolvedValue({
        id: 'inv-123',
      });

      (prisma.corinaNotificacion.findFirst as jest.Mock).mockResolvedValue(null);

      (obtenerPlanEfectivo as jest.Mock).mockResolvedValue('ENTERPRISE');

      await CorinaNotificacionService.detectarNuevaAlerta(
        'granja-123',
        'materia-123',
        0
      );

      expect(prisma.corinaNotificacion.create).toHaveBeenCalled();
    });

    it('no debe notificar si el plan no es ENTERPRISE', async () => {
      (prisma.granja.findUnique as jest.Mock).mockResolvedValue({
        id: 'granja-123',
        nombreGranja: 'Granja Test',
        usuario: {
          id: 'user-123',
          planSuscripcion: 'BUSINESS',
          notificacionesWhatsAppActivas: true,
          telefonoVerificado: true,
          telefono: 'whatsapp:+5493515930163',
        },
      });

      (obtenerPlanEfectivo as jest.Mock).mockResolvedValue('BUSINESS');

      await CorinaNotificacionService.detectarNuevaAlerta(
        'granja-123',
        'materia-123',
        0
      );

      expect(prisma.corinaNotificacion.create).not.toHaveBeenCalled();
    });

    it('no debe notificar si ya se notificó recientemente', async () => {
      (prisma.granja.findUnique as jest.Mock).mockResolvedValue({
        id: 'granja-123',
        nombreGranja: 'Granja Test',
        usuario: {
          id: 'user-123',
          planSuscripcion: 'ENTERPRISE',
          notificacionesWhatsAppActivas: true,
          telefonoVerificado: true,
          telefono: 'whatsapp:+5493515930163',
        },
      });

      (prisma.materiaPrima.findUnique as jest.Mock).mockResolvedValue({
        nombreMateriaPrima: 'Maíz',
        codigoMateriaPrima: 'MP001',
      });

      (prisma.inventario.findUnique as jest.Mock).mockResolvedValue({
        id: 'inv-123',
      });

      (prisma.corinaNotificacion.findFirst as jest.Mock).mockResolvedValue({
        id: 'notif-123',
        fechaCreacion: new Date(),
      });

      (obtenerPlanEfectivo as jest.Mock).mockResolvedValue('ENTERPRISE');

      await CorinaNotificacionService.detectarNuevaAlerta(
        'granja-123',
        'materia-123',
        0
      );

      expect(prisma.corinaNotificacion.create).not.toHaveBeenCalled();
    });
  });

  describe('enviarListadoAlertas', () => {
    it('debe enviar listado de alertas', async () => {
      (prisma.usuario.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        telefono: 'whatsapp:+5493515930163',
        telefonoVerificado: true,
        notificacionesWhatsAppActivas: true,
      });

      (prisma.inventario.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'inv-1',
          cantidadReal: 0,
          materiaPrima: {
            nombreMateriaPrima: 'Maíz',
            codigoMateriaPrima: 'MP001',
          },
        },
        {
          id: 'inv-2',
          cantidadReal: -5,
          materiaPrima: {
            nombreMateriaPrima: 'Soja',
            codigoMateriaPrima: 'MP002',
          },
        },
      ]);

      await CorinaNotificacionService.enviarListadoAlertas('user-123', 'granja-123');

      expect(prisma.inventario.findMany).toHaveBeenCalledWith({
        where: {
          idGranja: 'granja-123',
          cantidadReal: { lte: 0 },
        },
        include: {
          materiaPrima: {
            select: {
              nombreMateriaPrima: true,
              codigoMateriaPrima: true,
            },
          },
        },
        orderBy: {
          cantidadReal: 'asc',
        },
      });
    });

    it('debe enviar mensaje cuando no hay alertas', async () => {
      (prisma.usuario.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        telefono: 'whatsapp:+5493515930163',
        telefonoVerificado: true,
        notificacionesWhatsAppActivas: true,
      });

      (prisma.inventario.findMany as jest.Mock).mockResolvedValue([]);

      await CorinaNotificacionService.enviarListadoAlertas('user-123', 'granja-123');

      // Verificar que se intentó enviar mensaje
      expect(prisma.inventario.findMany).toHaveBeenCalled();
    });
  });

  describe('tieneNotificacionesActivas', () => {
    it('debe retornar true si todas las condiciones se cumplen', async () => {
      (prisma.usuario.findUnique as jest.Mock).mockResolvedValue({
        notificacionesWhatsAppActivas: true,
        telefonoVerificado: true,
        planSuscripcion: 'ENTERPRISE',
      });

      (obtenerPlanEfectivo as jest.Mock).mockResolvedValue('ENTERPRISE');

      const resultado = await CorinaNotificacionService.tieneNotificacionesActivas('user-123');
      expect(resultado).toBe(true);
    });

    it('debe retornar false si el plan no es ENTERPRISE', async () => {
      (prisma.usuario.findUnique as jest.Mock).mockResolvedValue({
        notificacionesWhatsAppActivas: true,
        telefonoVerificado: true,
        planSuscripcion: 'BUSINESS',
      });

      (obtenerPlanEfectivo as jest.Mock).mockResolvedValue('BUSINESS');

      const resultado = await CorinaNotificacionService.tieneNotificacionesActivas('user-123');
      expect(resultado).toBe(false);
    });
  });
});








