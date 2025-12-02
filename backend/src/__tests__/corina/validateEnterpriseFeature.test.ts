/**
 * Tests para el middleware validateEnterpriseFeature
 */

import { Request, Response, NextFunction } from 'express';
import { validateEnterpriseFeature, obtenerPlanEfectivo } from '../../middleware/validateEnterpriseFeature';
import { AuthRequest } from '../../middleware/authMiddleware';
import { prisma } from '../../config/database';

// Mock de Prisma
jest.mock('../../config/database', () => ({
  prisma: {
    usuario: {
      findUnique: jest.fn(),
    },
  },
}));

describe('validateEnterpriseFeature', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      userId: 'user-123',
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('debe rechazar si no hay userId', async () => {
    mockReq.userId = undefined;

    await validateEnterpriseFeature(
      mockReq as AuthRequest,
      mockRes as Response,
      mockNext
    );

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Usuario no autenticado' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('debe rechazar si el usuario no existe', async () => {
    (prisma.usuario.findUnique as jest.Mock).mockResolvedValue(null);

    await validateEnterpriseFeature(
      mockReq as AuthRequest,
      mockRes as Response,
      mockNext
    );

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Usuario no encontrado' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('debe rechazar si el plan no es ENTERPRISE', async () => {
    (prisma.usuario.findUnique as jest.Mock).mockResolvedValue({
      planSuscripcion: 'BUSINESS',
    });

    await validateEnterpriseFeature(
      mockReq as AuthRequest,
      mockRes as Response,
      mockNext
    );

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Esta funcionalidad está disponible solo para usuarios con plan ENTERPRISE',
      planActual: 'BUSINESS',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('debe permitir acceso si el plan es ENTERPRISE', async () => {
    (prisma.usuario.findUnique as jest.Mock).mockResolvedValue({
      planSuscripcion: 'ENTERPRISE',
    });

    await validateEnterpriseFeature(
      mockReq as AuthRequest,
      mockRes as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });
});

describe('obtenerPlanEfectivo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe retornar el plan del usuario si no es empleado', async () => {
    (prisma.usuario.findUnique as jest.Mock).mockResolvedValue({
      planSuscripcion: 'ENTERPRISE',
      esUsuarioEmpleado: false,
      idUsuarioDueño: null,
    });

    const plan = await obtenerPlanEfectivo('user-123');
    expect(plan).toBe('ENTERPRISE');
  });

  it('debe retornar el plan del dueño si es empleado', async () => {
    (prisma.usuario.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        planSuscripcion: 'STARTER',
        esUsuarioEmpleado: true,
        idUsuarioDueño: 'owner-123',
      })
      .mockResolvedValueOnce({
        planSuscripcion: 'ENTERPRISE',
      });

    const plan = await obtenerPlanEfectivo('user-123');
    expect(plan).toBe('ENTERPRISE');
  });

  it('debe retornar null si el usuario no existe', async () => {
    (prisma.usuario.findUnique as jest.Mock).mockResolvedValue(null);

    const plan = await obtenerPlanEfectivo('user-123');
    expect(plan).toBeNull();
  });
});








