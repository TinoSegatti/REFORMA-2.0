/**
 * Controlador de Usuarios
 * Maneja las peticiones relacionadas con usuarios
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

interface UsuarioRequest extends Request {
  userId?: string;
  userRole?: string;
}

/**
 * Registro de nuevo usuario
 */
export async function registrarUsuario(req: UsuarioRequest, res: Response) {
  try {
    const { email, password, nombreUsuario, apellidoUsuario } = req.body;

    // Validaciones
    if (!email || !password || !nombreUsuario || !apellidoUsuario) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Verificar si el email ya existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email }
    });

    if (usuarioExistente) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario
    const usuario = await prisma.usuario.create({
      data: {
        email,
        passwordHash,
        nombreUsuario,
        apellidoUsuario,
        tipoUsuario: 'CLIENTE',
        planSuscripcion: 'PLAN_0'
      },
      select: {
        id: true,
        email: true,
        nombreUsuario: true,
        apellidoUsuario: true,
        tipoUsuario: true,
        planSuscripcion: true
      }
    });

    // Generar token JWT
    const JWT_SECRET = process.env.JWT_SECRET || '';
    const token = jwt.sign(
      { userId: usuario.id, email: usuario.email, tipo: usuario.tipoUsuario },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '24h' } as jwt.SignOptions
    );

    res.status(201).json({
      usuario,
      token
    });
  } catch (error: any) {
    console.error('Error registrando usuario:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
}

/**
 * Login de usuario
 */
export async function loginUsuario(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Buscar usuario
    const usuario = await prisma.usuario.findUnique({
      where: { email }
    });

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    if (!usuario.passwordHash) {
      return res.status(401).json({ error: 'Usuario registrado con Google. Usa Google Sign-In' });
    }

    const passwordValida = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Actualizar último acceso
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoAcceso: new Date() }
    });

    // Generar token JWT
    const JWT_SECRET = process.env.JWT_SECRET || '';
    const token = jwt.sign(
      { userId: usuario.id, email: usuario.email, tipo: usuario.tipoUsuario },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '24h' } as jwt.SignOptions
    );

    res.json({
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombreUsuario: usuario.nombreUsuario,
        apellidoUsuario: usuario.apellidoUsuario,
        tipoUsuario: usuario.tipoUsuario,
        planSuscripcion: usuario.planSuscripcion
      },
      token
    });
  } catch (error: any) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}

/**
 * Obtener perfil del usuario actual
 */
export async function obtenerPerfil(req: UsuarioRequest, res: Response) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nombreUsuario: true,
        apellidoUsuario: true,
        tipoUsuario: true,
        planSuscripcion: true,
        maxGranjas: true,
        activo: true,
        fechaRegistro: true,
        ultimoAcceso: true,
        granjas: {
          select: {
            id: true,
            nombreGranja: true,
            fechaCreacion: true
          }
        }
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(usuario);
  } catch (error: any) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
}

/**
 * Actualizar perfil de usuario
 */
export async function actualizarPerfil(req: UsuarioRequest, res: Response) {
  try {
    const userId = req.userId;
    const { nombreUsuario, apellidoUsuario } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const usuario = await prisma.usuario.update({
      where: { id: userId },
      data: {
        nombreUsuario,
        apellidoUsuario
      },
      select: {
        id: true,
        email: true,
        nombreUsuario: true,
        apellidoUsuario: true
      }
    });

    res.json(usuario);
  } catch (error: any) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
}

/**
 * Obtener todos los usuarios (solo administradores)
 */
export async function obtenerUsuarios(req: UsuarioRequest, res: Response) {
  try {
    const userRole = req.userRole;

    if (userRole !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        email: true,
        nombreUsuario: true,
        apellidoUsuario: true,
        tipoUsuario: true,
        planSuscripcion: true,
        activo: true,
        fechaRegistro: true,
        ultimoAcceso: true,
        _count: {
          select: {
            granjas: true
          }
        }
      },
      orderBy: {
        fechaRegistro: 'desc'
      }
    });

    res.json(usuarios);
  } catch (error: any) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
}

/**
 * Actualizar plan de suscripción (solo administradores)
 */
export async function actualizarPlanUsuario(req: UsuarioRequest, res: Response) {
  try {
    const userRole = req.userRole;
    const { usuarioId } = req.params;
    const { planSuscripcion } = req.body;

    if (userRole !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const usuario = await prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        planSuscripcion
      },
      select: {
        id: true,
        email: true,
        planSuscripcion: true
      }
    });

    res.json(usuario);
  } catch (error: any) {
    console.error('Error actualizando plan:', error);
    res.status(500).json({ error: 'Error al actualizar plan' });
  }
}

