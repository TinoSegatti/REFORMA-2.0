/**
 * Tests para el controlador de CORINA
 */

import { Request, Response } from 'express';
import {
  obtenerNotificaciones,
  obtenerEstadoConfiguracion,
  configurarNotificaciones,
  iniciarVerificacionTelefono,
  verificarCodigoTelefono,
} from '../../controllers/corinaController';
import { AuthRequest } from '../../middleware/authMiddleware';
import { prisma } from '../../config/database';
import { CorinaNotificacionService } from '../../services/corinaNotificacionService';

// Mock de dependencias
jest.mock('../../config/database', () => ({
  prisma: {
    corinaNotificacion: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    usuario: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../services/corinaNotificacionService');
jest.mock('../../middleware/validateEnterpriseFeature');

describe('corinaController', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      userId: 'user-123',
      query: {},
      body: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('obtenerNotificaciones', () => {
    it('debe retornar lista de notificaciones', async () => {
      (prisma.corinaNotificacion.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'notif-1',
          titulo: 'Alerta de Inventario',
          fechaCreacion: new Date(),
        },
      ]);
      (prisma.corinaNotificacion.count as jest.Mock).mockResolvedValue(1);

      await obtenerNotificaciones(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        notificaciones: expect.any(Array),
        total: 1,
        limite: 50,
        offset: 0,
      });
    });

    it('debe rechazar si no hay userId', async () => {
      mockReq.userId = undefined;

      await obtenerNotificaciones(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('obtenerEstadoConfiguracion', () => {
    it('debe retornar estado de configuración', async () => {
      const { obtenerPlanEfectivo } = await import('../../middleware/validateEnterpriseFeature');
      (obtenerPlanEfectivo as jest.Mock).mockResolvedValue('ENTERPRISE');
      (prisma.usuario.findUnique as jest.Mock).mockResolvedValue({
        planSuscripcion: 'ENTERPRISE',
        telefono: 'whatsapp:+5493515930163',
        telefonoVerificado: true,
        notificacionesWhatsAppActivas: true,
      });
      (CorinaNotificacionService.tieneNotificacionesActivas as jest.Mock).mockResolvedValue(true);

      await obtenerEstadoConfiguracion(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        planEfectivo: 'ENTERPRISE',
        tienePlanEnterprise: true,
        telefono: 'whatsapp:+5493515930163',
        telefonoVerificado: true,
        notificacionesWhatsAppActivas: true,
        tieneNotificacionesActivas: true,
      });
    });
  });

  describe('configurarNotificaciones', () => {
    it('debe actualizar configuración de notificaciones', async () => {
      mockReq.body = { notificacionesWhatsAppActivas: true };
      (prisma.usuario.update as jest.Mock).mockResolvedValue({
        notificacionesWhatsAppActivas: true,
        telefonoVerificado: true,
      });

      await configurarNotificaciones(mockReq as AuthRequest, mockRes as Response);

      expect(prisma.usuario.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { notificacionesWhatsAppActivas: true },
        select: {
          notificacionesWhatsAppActivas: true,
          telefonoVerificado: true,
        },
      });
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('debe rechazar si notificacionesWhatsAppActivas no es booleano', async () => {
      mockReq.body = { notificacionesWhatsAppActivas: 'true' };

      await configurarNotificaciones(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('iniciarVerificacionTelefono', () => {
    it('debe iniciar verificación y enviar código', async () => {
      mockReq.body = { telefono: '+5493515930163' };
      (prisma.usuario.update as jest.Mock).mockResolvedValue({});
      (CorinaNotificacionService.enviarMensajeWhatsApp as jest.Mock).mockResolvedValue('msg-sid');

      await iniciarVerificacionTelefono(mockReq as AuthRequest, mockRes as Response);

      expect(prisma.usuario.update).toHaveBeenCalled();
      expect(CorinaNotificacionService.enviarMensajeWhatsApp).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('debe rechazar si el teléfono no tiene formato correcto', async () => {
      mockReq.body = { telefono: '93515930163' };

      await iniciarVerificacionTelefono(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('verificarCodigoTelefono', () => {
    it('debe verificar código correcto', async () => {
      mockReq.body = { codigo: '123456' };
      (prisma.usuario.findUnique as jest.Mock).mockResolvedValue({
        codigoVerificacionTelefono: '123456',
        telefono: 'whatsapp:+5493515930163',
      });
      (prisma.usuario.update as jest.Mock).mockResolvedValue({
        telefonoVerificado: true,
      });

      await verificarCodigoTelefono(mockReq as AuthRequest, mockRes as Response);

      expect(prisma.usuario.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          telefonoVerificado: true,
          fechaVerificacionTelefono: expect.any(Date),
          codigoVerificacionTelefono: null,
        },
      });
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('debe rechazar código incorrecto', async () => {
      mockReq.body = { codigo: '123456' };
      (prisma.usuario.findUnique as jest.Mock).mockResolvedValue({
        codigoVerificacionTelefono: '654321',
        telefono: 'whatsapp:+5493515930163',
      });

      await verificarCodigoTelefono(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Código incorrecto' });
    });
  });
});








