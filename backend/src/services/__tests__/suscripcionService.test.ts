/**
 * Pruebas unitarias para suscripcionService
 */

import { PlanSuscripcion, PeriodoFacturacion } from '../../constants/planes';
import * as suscripcionService from '../suscripcionService';
import { PrismaClient } from '@prisma/client';

// Mock de Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    suscripcion: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    usuario: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    pago: {
      create: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

// Mock de stripeService
jest.mock('../stripeService', () => ({
  crearObtenerCliente: jest.fn(),
  crearCheckoutSession: jest.fn(),
  cancelarSuscripcion: jest.fn(),
  reactivarSuscripcion: jest.fn(),
}));

describe('suscripcionService', () => {
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = new PrismaClient();
  });

  describe('crearSuscripcionDemo', () => {
    it('debe crear una suscripción DEMO con fecha de expiración de 30 días', async () => {
      const usuarioId = 'user-123';
      const fechaEsperada = new Date();
      fechaEsperada.setDate(fechaEsperada.getDate() + 30);

      mockPrisma.suscripcion.create.mockResolvedValue({
        id: 'sub-123',
        idUsuario: usuarioId,
        planSuscripcion: PlanSuscripcion.DEMO,
        estadoSuscripcion: 'ACTIVA',
        periodoFacturacion: PeriodoFacturacion.MENSUAL,
        precio: 0,
      });

      await suscripcionService.crearSuscripcionDemo(usuarioId);

      expect(mockPrisma.suscripcion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          idUsuario: usuarioId,
          planSuscripcion: PlanSuscripcion.DEMO,
          estadoSuscripcion: 'ACTIVA',
          periodoFacturacion: PeriodoFacturacion.MENSUAL,
          precio: 0,
          moneda: 'USD',
        }),
      });

      const fechaFin = mockPrisma.suscripcion.create.mock.calls[0][0].data.fechaFin;
      expect(fechaFin).toBeInstanceOf(Date);
      expect(fechaFin.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('crearSuscripcionCheckout', () => {
    it('debe crear una sesión de checkout para STARTER mensual', async () => {
      const usuarioId = 'user-123';
      const plan = PlanSuscripcion.STARTER;
      const periodo = PeriodoFacturacion.MENSUAL;

      mockPrisma.usuario.findUnique.mockResolvedValue({
        id: usuarioId,
        email: 'test@example.com',
        nombreUsuario: 'Juan',
        apellidoUsuario: 'Pérez',
      });

      const { crearObtenerCliente, crearCheckoutSession } = require('../stripeService');
      crearObtenerCliente.mockResolvedValue({ id: 'cus-123' });
      crearCheckoutSession.mockResolvedValue({
        id: 'session-123',
        url: 'https://checkout.stripe.com/session-123',
      });

      const result = await suscripcionService.crearSuscripcionCheckout(
        usuarioId,
        plan,
        periodo,
        'https://success.com',
        'https://cancel.com'
      );

      expect(result).toEqual({
        sessionId: 'session-123',
        url: 'https://checkout.stripe.com/session-123',
      });

      expect(crearObtenerCliente).toHaveBeenCalledWith(
        'test@example.com',
        'Juan',
        'Pérez'
      );
    });

    it('debe rechazar crear checkout para plan DEMO', async () => {
      await expect(
        suscripcionService.crearSuscripcionCheckout(
          'user-123',
          PlanSuscripcion.DEMO,
          PeriodoFacturacion.MENSUAL,
          'https://success.com',
          'https://cancel.com'
        )
      ).rejects.toThrow('No se puede crear checkout para plan DEMO');
    });

    it('debe lanzar error si usuario no existe', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue(null);

      await expect(
        suscripcionService.crearSuscripcionCheckout(
          'user-123',
          PlanSuscripcion.STARTER,
          PeriodoFacturacion.MENSUAL,
          'https://success.com',
          'https://cancel.com'
        )
      ).rejects.toThrow('Usuario no encontrado');
    });
  });

  describe('suscripcionEstaActiva', () => {
    it('debe retornar true si la suscripción está activa y no ha expirado', async () => {
      const fechaFin = new Date();
      fechaFin.setDate(fechaFin.getDate() + 10); // 10 días en el futuro

      mockPrisma.suscripcion.findUnique.mockResolvedValue({
        id: 'sub-123',
        estadoSuscripcion: 'ACTIVA',
        fechaFin,
      });

      const resultado = await suscripcionService.suscripcionEstaActiva('user-123');
      expect(resultado).toBe(true);
    });

    it('debe retornar false si la suscripción ha expirado', async () => {
      const fechaFin = new Date();
      fechaFin.setDate(fechaFin.getDate() - 1); // Ayer

      mockPrisma.suscripcion.findUnique.mockResolvedValue({
        id: 'sub-123',
        estadoSuscripcion: 'ACTIVA',
        fechaFin,
      });

      const resultado = await suscripcionService.suscripcionEstaActiva('user-123');
      expect(resultado).toBe(false);
    });

    it('debe retornar false si no existe suscripción', async () => {
      mockPrisma.suscripcion.findUnique.mockResolvedValue(null);

      const resultado = await suscripcionService.suscripcionEstaActiva('user-123');
      expect(resultado).toBe(false);
    });

    it('debe retornar false si la suscripción está cancelada', async () => {
      const fechaFin = new Date();
      fechaFin.setDate(fechaFin.getDate() + 10);

      mockPrisma.suscripcion.findUnique.mockResolvedValue({
        id: 'sub-123',
        estadoSuscripcion: 'CANCELADA',
        fechaFin,
      });

      const resultado = await suscripcionService.suscripcionEstaActiva('user-123');
      expect(resultado).toBe(false);
    });
  });

  describe('cancelarSuscripcionUsuario', () => {
    it('debe cancelar una suscripción con Stripe', async () => {
      mockPrisma.suscripcion.findUnique.mockResolvedValue({
        id: 'sub-123',
        stripeSubscriptionId: 'sub_stripe_123',
      });

      const { cancelarSuscripcion } = require('../stripeService');
      cancelarSuscripcion.mockResolvedValue({ id: 'sub_stripe_123' });

      await suscripcionService.cancelarSuscripcionUsuario('user-123');

      expect(cancelarSuscripcion).toHaveBeenCalledWith('sub_stripe_123');
      expect(mockPrisma.suscripcion.update).toHaveBeenCalledWith({
        where: { id: 'sub-123' },
        data: { estadoSuscripcion: 'CANCELADA' },
      });
    });

    it('debe lanzar error si no existe suscripción', async () => {
      mockPrisma.suscripcion.findUnique.mockResolvedValue(null);

      await expect(
        suscripcionService.cancelarSuscripcionUsuario('user-123')
      ).rejects.toThrow('Suscripción no encontrada');
    });
  });
});

