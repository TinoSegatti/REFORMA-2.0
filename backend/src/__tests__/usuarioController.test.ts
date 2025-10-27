/**
 * Tests para el Controlador de Usuarios
 */

import { Request, Response } from 'express';
import * as usuarioController from '../controllers/usuarioController';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock de Prisma
jest.mock('../lib/prisma', () => ({
  usuario: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn()
  }
}));

// Mock de bcrypt
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Controlador de Usuarios', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      headers: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registrarUsuario', () => {
    it('debería registrar un nuevo usuario exitosamente', async () => {
      // Arrange
      mockRequest.body = {
        email: 'test@test.com',
        password: 'password123',
        nombreUsuario: 'Juan',
        apellidoUsuario: 'Pérez'
      };

      const mockUsuario = {
        id: 'user-123',
        email: 'test@test.com',
        nombreUsuario: 'Juan',
        apellidoUsuario: 'Pérez',
        tipoUsuario: 'CLIENTE',
        planSuscripcion: 'PLAN_0'
      };

      (prisma.usuario.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.usuario.create as jest.Mock).mockResolvedValue(mockUsuario);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      // Act
      await usuarioController.registrarUsuario(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(prisma.usuario.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@test.com' }
      });
      expect(prisma.usuario.create).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('debería rechazar registro si faltan campos', async () => {
      // Arrange
      mockRequest.body = {
        email: 'test@test.com'
        // Faltan otros campos
      };

      // Act
      await usuarioController.registrarUsuario(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Faltan campos requeridos' });
    });

    it('debería rechazar registro si el email ya existe', async () => {
      // Arrange
      mockRequest.body = {
        email: 'existing@test.com',
        password: 'password123',
        nombreUsuario: 'Juan',
        apellidoUsuario: 'Pérez'
      };

      (prisma.usuario.findUnique as jest.Mock).mockResolvedValue({ id: 'existing' });

      // Act
      await usuarioController.registrarUsuario(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'El email ya está registrado' });
    });
  });

  describe('loginUsuario', () => {
    it('debería hacer login exitosamente', async () => {
      // Arrange
      mockRequest.body = {
        email: 'test@test.com',
        password: 'password123'
      };

      const mockUsuario = {
        id: 'user-123',
        email: 'test@test.com',
        nombreUsuario: 'Juan',
        apellidoUsuario: 'Pérez',
        tipoUsuario: 'CLIENTE',
        planSuscripcion: 'PLAN_0',
        activo: true,
        passwordHash: 'hashedPassword'
      };

      (prisma.usuario.findUnique as jest.Mock).mockResolvedValue(mockUsuario);
      (prisma.usuario.update as jest.Mock).mockResolvedValue(mockUsuario);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      // Act
      await usuarioController.loginUsuario(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(prisma.usuario.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@test.com' }
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('debería rechazar login con credenciales inválidas', async () => {
      // Arrange
      mockRequest.body = {
        email: 'test@test.com',
        password: 'wrongpassword'
      };

      const mockUsuario = {
        id: 'user-123',
        email: 'test@test.com',
        activo: true,
        passwordHash: 'hashedPassword'
      };

      (prisma.usuario.findUnique as jest.Mock).mockResolvedValue(mockUsuario);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act
      await usuarioController.loginUsuario(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Credenciales inválidas' });
    });
  });
});

