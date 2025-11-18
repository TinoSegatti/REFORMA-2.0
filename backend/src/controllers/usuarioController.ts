/**
 * Controlador de Usuarios
 * Maneja las peticiones relacionadas con usuarios
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { generarTokenVerificacion, enviarEmailVerificacion, reenviarEmailVerificacion, verificarConfiguracionEmail } from '../services/emailService';

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

    // Generar token de verificación
    const tokenVerificacion = generarTokenVerificacion();
    const fechaExpiracion = new Date();
    fechaExpiracion.setHours(fechaExpiracion.getHours() + 24); // Expira en 24 horas

    // Crear usuario (inactivo hasta verificar email)
    const usuario = await prisma.usuario.create({
      data: {
        email,
        passwordHash,
        nombreUsuario,
        apellidoUsuario,
        tipoUsuario: 'CLIENTE',
        planSuscripcion: 'DEMO',
        emailVerificado: false,
        tokenVerificacion,
        fechaExpiracionToken: fechaExpiracion,
        activo: false // Inactivo hasta verificar email
      },
      select: {
        id: true,
        email: true,
        nombreUsuario: true,
        apellidoUsuario: true,
        tipoUsuario: true,
        planSuscripcion: true,
        emailVerificado: true
      }
    });

    // Enviar email de verificación
    try {
      if (verificarConfiguracionEmail()) {
        await enviarEmailVerificacion(email, nombreUsuario, tokenVerificacion);
      } else {
        console.warn('⚠️  Email no configurado. No se envió email de verificación.');
      }
    } catch (error: any) {
      console.error('Error enviando email de verificación:', error);
      // No fallar el registro si falla el email, pero informar al usuario
    }

    // NO generar token JWT todavía - el usuario debe verificar su email primero
    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente. Por favor verifica tu email para activar tu cuenta.',
      usuario: {
        ...usuario,
        requiereVerificacion: true
      },
      emailEnviado: verificarConfiguracionEmail()
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

    // Verificar si el email está verificado
    if (!usuario.emailVerificado) {
      return res.status(403).json({ 
        error: 'Email no verificado',
        requiereVerificacion: true,
        mensaje: 'Por favor verifica tu email antes de iniciar sesión. Revisa tu bandeja de entrada.'
      });
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

/**
 * Verificar email con token
 */
export async function verificarEmail(req: Request, res: Response) {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token de verificación requerido' });
    }

    // Buscar usuario por token de verificación
    const usuario = await prisma.usuario.findUnique({
      where: { tokenVerificacion: token }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Token de verificación inválido' });
    }

    // Verificar si el token expiró
    if (usuario.fechaExpiracionToken && usuario.fechaExpiracionToken < new Date()) {
      return res.status(400).json({ 
        error: 'Token de verificación expirado',
        tokenExpirado: true
      });
    }

    // Verificar si ya está verificado
    if (usuario.emailVerificado) {
      return res.status(400).json({ 
        error: 'Email ya verificado',
        yaVerificado: true
      });
    }

    // Actualizar usuario: verificar email, activar cuenta, limpiar token
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        emailVerificado: true,
        activo: true,
        tokenVerificacion: null,
        fechaExpiracionToken: null
      }
    });

    // Generar token JWT para login automático
    const JWT_SECRET = process.env.JWT_SECRET || '';
    const jwtToken = jwt.sign(
      { userId: usuario.id, email: usuario.email, tipo: usuario.tipoUsuario },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '24h' } as jwt.SignOptions
    );

    res.json({
      mensaje: 'Email verificado exitosamente',
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombreUsuario: usuario.nombreUsuario,
        apellidoUsuario: usuario.apellidoUsuario,
        tipoUsuario: usuario.tipoUsuario,
        planSuscripcion: usuario.planSuscripcion,
        emailVerificado: true
      },
      token: jwtToken
    });
  } catch (error: any) {
    console.error('Error verificando email:', error);
    res.status(500).json({ error: 'Error al verificar email' });
  }
}

/**
 * Reenviar email de verificación
 */
export async function reenviarEmailVerificacionCtrl(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email requerido' });
    }

    // Buscar usuario
    const usuario = await prisma.usuario.findUnique({
      where: { email }
    });

    if (!usuario) {
      // Por seguridad, no revelar si el email existe o no
      return res.json({
        mensaje: 'Si el email existe, se enviará un nuevo correo de verificación'
      });
    }

    // Verificar si ya está verificado
    if (usuario.emailVerificado) {
      return res.status(400).json({ error: 'Email ya verificado' });
    }

    // Generar nuevo token
    const nuevoToken = generarTokenVerificacion();
    const fechaExpiracion = new Date();
    fechaExpiracion.setHours(fechaExpiracion.getHours() + 24);

    // Actualizar token en la base de datos
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        tokenVerificacion: nuevoToken,
        fechaExpiracionToken: fechaExpiracion
      }
    });

    // Enviar email
    try {
      if (verificarConfiguracionEmail()) {
        await reenviarEmailVerificacion(
          usuario.email,
          usuario.nombreUsuario,
          nuevoToken
        );
        res.json({
          mensaje: 'Email de verificación reenviado exitosamente'
        });
      } else {
        res.status(500).json({ error: 'Servicio de email no configurado' });
      }
    } catch (error: any) {
      console.error('Error reenviando email:', error);
      res.status(500).json({ error: 'Error al reenviar email de verificación' });
    }
  } catch (error: any) {
    console.error('Error en reenviar email:', error);
    res.status(500).json({ error: 'Error al procesar solicitud' });
  }
}

