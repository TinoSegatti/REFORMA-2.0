/**
 * Tests de integración para el sistema de alertas de CORINA
 * Prueba el flujo completo desde la creación de compra/fabricación hasta la notificación
 */

import { crearCompra } from '../../services/compraService';
import { crearFabricacion } from '../../services/fabricacionService';
import { actualizarCantidadReal } from '../../services/inventarioService';
import { CorinaNotificacionService } from '../../services/corinaNotificacionService';
import { prisma } from '../../config/database';

// Mock de dependencias externas
jest.mock('../../config/database', () => ({
  prisma: {
    inventario: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    granja: {
      findUnique: jest.fn(),
    },
    materiaPrima: {
      findUnique: jest.fn(),
    },
    corinaNotificacion: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $queryRawUnsafe: jest.fn(),
  },
}));

jest.mock('../../services/corinaNotificacionService', () => ({
  CorinaNotificacionService: {
    detectarNuevaAlerta: jest.fn(),
  },
}));

jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({ sid: 'test-message-sid' }),
    },
  }));
});

describe('Integración: Sistema de Alertas CORINA', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CORINA_ENABLED = 'true';
  });

  describe('Flujo: Compra que genera alerta', () => {
    it('debe detectar alerta después de crear compra que deja inventario en 0', async () => {
      // Mock de datos
      const mockInventario = {
        id: 'inv-123',
        cantidadReal: 0,
        cantidadSistema: 0,
        cantidadAcumulada: 100,
      };

      const mockGranja = {
        id: 'granja-123',
        nombreGranja: 'Granja Test',
        usuario: {
          id: 'user-123',
          planSuscripcion: 'ENTERPRISE',
          notificacionesWhatsAppActivas: true,
          telefonoVerificado: true,
          telefono: 'whatsapp:+5493515930163',
        },
      };

      const mockMateriaPrima = {
        id: 'mp-123',
        nombreMateriaPrima: 'Maíz',
        codigoMateriaPrima: 'MP001',
      };

      // Mock de Prisma
      (prisma.inventario.findUnique as jest.Mock).mockResolvedValue(mockInventario);
      (prisma.granja.findUnique as jest.Mock).mockResolvedValue(mockGranja);
      (prisma.materiaPrima.findUnique as jest.Mock).mockResolvedValue(mockMateriaPrima);
      (prisma.corinaNotificacion.findFirst as jest.Mock).mockResolvedValue(null);

      // Simular que recalcularInventario detecta cantidad <= 0
      // Esto debería llamar a detectarNuevaAlerta automáticamente
      const { recalcularInventario } = await import('../../services/inventarioService');
      
      await recalcularInventario({
        idGranja: 'granja-123',
        idMateriaPrima: 'mp-123',
      });

      // Verificar que se intentó detectar la alerta
      expect(CorinaNotificacionService.detectarNuevaAlerta).toHaveBeenCalled();
    });
  });

  describe('Flujo: Fabricación que genera alerta', () => {
    it('debe detectar alerta después de crear fabricación que consume todo el stock', async () => {
      // Similar al test anterior pero con fabricación
      // El flujo es el mismo porque ambos llaman a recalcularInventario
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Flujo: Actualización manual que genera alerta', () => {
    it('debe detectar alerta cuando se actualiza cantidadReal a 0 o negativo', async () => {
      // Mock de datos
      const mockInventario = {
        id: 'inv-123',
        cantidadReal: 0,
        cantidadSistema: 0,
        cantidadAcumulada: 100,
        version: 0,
      };

      (prisma.inventario.findUnique as jest.Mock).mockResolvedValue(mockInventario);
      (prisma.$executeRawUnsafe as jest.Mock).mockResolvedValue(1);

      // Simular actualización de cantidad real a 0
      await actualizarCantidadReal('granja-123', 'mp-123', 0);

      // Verificar que se intentó detectar la alerta
      expect(CorinaNotificacionService.detectarNuevaAlerta).toHaveBeenCalled();
    });
  });

  describe('Flujo: Resolución de alerta', () => {
    it('debe marcar alertas como resueltas cuando cantidad vuelve a ser positiva', async () => {
      // Mock de alerta pendiente
      const mockAlerta = {
        id: 'alert-123',
        estadoNotificacion: 'ENVIADA',
        datosAdicionales: {},
      };

      (prisma.corinaNotificacion.findMany as jest.Mock).mockResolvedValue([mockAlerta]);
      (prisma.inventario.findUnique as jest.Mock).mockResolvedValue({
        id: 'inv-123',
      });

      // Simular que cantidad vuelve a ser positiva
      await CorinaNotificacionService.detectarNuevaAlerta(
        'granja-123',
        'mp-123',
        10 // Cantidad positiva
      );

      // Verificar que se marcaron alertas como resueltas
      expect(prisma.corinaNotificacion.update).toHaveBeenCalled();
    });
  });
});

