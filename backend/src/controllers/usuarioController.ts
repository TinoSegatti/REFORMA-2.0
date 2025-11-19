/**
 * Controlador de Usuarios
 * Maneja las peticiones relacionadas con usuarios
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { generarTokenVerificacion, enviarEmailVerificacion, reenviarEmailVerificacion, verificarConfiguracionEmail } from '../services/emailService';
import { validarCodigoReferencia, vincularUsuarioEmpleado, validarLimiteUsuariosEmpleados } from '../services/usuarioEmpleadoService';
import { notificarEmpleadoAceptaInvitacion } from '../services/notificacionService';
import { PlanSuscripcion } from '../constants/planes';

interface UsuarioRequest extends Request {
  userId?: string;
  userRole?: string;
}

/**
 * Registro de nuevo usuario
 */
export async function registrarUsuario(req: UsuarioRequest, res: Response) {
  try {
    const { email, password, nombreUsuario, apellidoUsuario, codigoReferencia } = req.body;

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

    // Validar código de referencia si se proporciona
    let usuarioDueño = null;
    let planAsignado: PlanSuscripcion = PlanSuscripcion.DEMO;
    
    if (codigoReferencia) {
      try {
        const validacionCodigo = await validarCodigoReferencia(codigoReferencia);
        
        if (!validacionCodigo.valido || !validacionCodigo.usuarioDueño) {
          return res.status(400).json({ 
            error: 'Código de referencia inválido o expirado',
            detalles: validacionCodigo.error || 'El código proporcionado no es válido'
          });
        }

        usuarioDueño = validacionCodigo.usuarioDueño;
        
        // Verificar que el dueño tenga espacio para más empleados
        const validacionLimite = await validarLimiteUsuariosEmpleados(usuarioDueño.id);
        if (!validacionLimite.puedeAgregar) {
          return res.status(400).json({
            error: 'Límite de usuarios alcanzado',
            detalles: `El plan del dueño no permite más empleados. Límite: ${validacionLimite.limite}, Actual: ${validacionLimite.actual}`
          });
        }

        // Asignar el plan del dueño al nuevo empleado
        planAsignado = usuarioDueño.planSuscripcion as PlanSuscripcion;
      } catch (error: any) {
        console.error('Error validando código de referencia:', error);
        return res.status(400).json({
          error: 'Error al validar código de referencia',
          detalles: error.message || 'Error desconocido'
        });
      }
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
        planSuscripcion: planAsignado,
        emailVerificado: false,
        tokenVerificacion,
        fechaExpiracionToken: fechaExpiracion,
        activo: false, // Inactivo hasta verificar email
        // Si hay código de referencia, configurar como empleado
        esUsuarioEmpleado: !!codigoReferencia,
        idUsuarioDueño: usuarioDueño?.id || null,
        fechaVinculacion: codigoReferencia ? new Date() : null,
        rolEmpleado: codigoReferencia ? 'EDITOR' : null
      },
      select: {
        id: true,
        email: true,
        nombreUsuario: true,
        apellidoUsuario: true,
        tipoUsuario: true,
        planSuscripcion: true,
        emailVerificado: true,
        esUsuarioEmpleado: true
      }
    });

    // Si hay código de referencia válido, vincular al empleado
    if (codigoReferencia && usuarioDueño) {
      try {
        await vincularUsuarioEmpleado(usuario.id, codigoReferencia);
        console.log(`[Registro] Usuario ${usuario.email} vinculado como empleado de ${usuarioDueño.email}`);
      } catch (error: any) {
        console.error('Error vinculando empleado durante registro:', error);
        // No fallar el registro si falla la vinculación, pero registrar el error
      }
    }

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
      mensaje: codigoReferencia 
        ? 'Usuario registrado exitosamente como empleado. Por favor verifica tu email para activar tu cuenta.'
        : 'Usuario registrado exitosamente. Por favor verifica tu email para activar tu cuenta.',
      usuario: {
        ...usuario,
        requiereVerificacion: true
      },
      emailEnviado: verificarConfiguracionEmail(),
      esEmpleado: !!codigoReferencia
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
    const usuarioActualizado = await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        emailVerificado: true,
        activo: true,
        activoComoEmpleado: usuario.esUsuarioEmpleado ? true : undefined, // Activar como empleado si corresponde
        tokenVerificacion: null,
        fechaExpiracionToken: null
      },
      select: {
        id: true,
        email: true,
        nombreUsuario: true,
        apellidoUsuario: true,
        tipoUsuario: true,
        planSuscripcion: true,
        emailVerificado: true,
        esUsuarioEmpleado: true,
        idUsuarioDueño: true
      }
    });

    // Si es empleado, enviar notificación al dueño cuando acepta la invitación
    if (usuarioActualizado.esUsuarioEmpleado && usuarioActualizado.idUsuarioDueño) {
      try {
        const dueño = await prisma.usuario.findUnique({
          where: { id: usuarioActualizado.idUsuarioDueño },
          select: {
            email: true,
            nombreUsuario: true,
            apellidoUsuario: true
          }
        });

        if (dueño) {
          await notificarEmpleadoAceptaInvitacion(
            dueño.email,
            `${dueño.nombreUsuario} ${dueño.apellidoUsuario}`,
            `${usuarioActualizado.nombreUsuario} ${usuarioActualizado.apellidoUsuario}`,
            usuarioActualizado.email
          );
        }
      } catch (error) {
        console.error('Error enviando notificación de empleado acepta invitación:', error);
        // No fallar la verificación si falla la notificación
      }
    }

    // Generar token JWT para login automático
    const JWT_SECRET = process.env.JWT_SECRET || '';
    const jwtToken = jwt.sign(
      { userId: usuarioActualizado.id, email: usuarioActualizado.email, tipo: usuarioActualizado.tipoUsuario },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '24h' } as jwt.SignOptions
    );

    res.json({
      mensaje: 'Email verificado exitosamente',
      usuario: {
        id: usuarioActualizado.id,
        email: usuarioActualizado.email,
        nombreUsuario: usuarioActualizado.nombreUsuario,
        apellidoUsuario: usuarioActualizado.apellidoUsuario,
        tipoUsuario: usuarioActualizado.tipoUsuario,
        planSuscripcion: usuarioActualizado.planSuscripcion,
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

