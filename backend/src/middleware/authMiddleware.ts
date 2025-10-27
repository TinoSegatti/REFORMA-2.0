/**
 * Middleware de Autenticación
 * Verifica tokens JWT y extrae información del usuario
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

/**
 * Middleware para verificar token JWT
 */
export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET no configurado en variables de entorno');
    }

    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; tipo: string };

    // Verificar que el usuario existe y está activo
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.userId }
    });

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Usuario no válido o inactivo' });
    }

    // Agregar información del usuario al request
    req.userId = decoded.userId;
    req.userRole = usuario.tipoUsuario;

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(500).json({ error: 'Error de autenticación' });
  }
}

/**
 * Middleware para verificar que el usuario es administrador
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.userRole !== 'ADMINISTRADOR') {
    return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador' });
  }
  next();
}

/**
 * Middleware para verificar que el usuario es propietario del recurso
 */
export async function requireOwnership(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    const granjaId = req.params.idGranja || req.body.idGranja;

    if (!granjaId) {
      return res.status(400).json({ error: 'ID de granja no proporcionado' });
    }

    const granja = await prisma.granja.findUnique({
      where: { id: granjaId }
    });

    if (!granja) {
      return res.status(404).json({ error: 'Granja no encontrada' });
    }

    if (granja.idUsuario !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para acceder a esta granja' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Error verificando propiedad' });
  }
}


