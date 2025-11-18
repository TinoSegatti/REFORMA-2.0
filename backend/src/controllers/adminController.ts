/**
 * Controlador para administración de usuarios de testing
 * Solo accesible para el superusuario
 */

import { Request, Response } from 'express';
import { PlanSuscripcion, PeriodoFacturacion, obtenerPrecioPlan } from '../constants/planes';
import prisma from '../lib/prisma';
import * as suscripcionService from '../services/suscripcionService';

const SUPERUSUARIO_ID = 'cmhb1d6c50001kdggopzuiczr';
const SUPERUSUARIO_EMAIL = 'valentinosegatti@gmail.com';

/**
 * Middleware para verificar si el usuario es superusuario
 */
export function esSuperusuario(req: Request, res: Response, next: Function) {
  const userId = (req as any).userId;
  
  if (!userId) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

  if (userId !== SUPERUSUARIO_ID) {
    return res.status(403).json({ error: 'Acceso denegado. Solo el superusuario puede realizar esta acción.' });
  }

  next();
}

/**
 * Obtener todos los usuarios de testing
 */
export async function obtenerUsuariosTesting(req: Request, res: Response) {
  try {
    const usuarios = await prisma.usuario.findMany({
      include: {
        suscripcion: {
          include: {
            pagos: {
              orderBy: { fechaCreacion: 'desc' },
              take: 5, // Últimos 5 pagos
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const usuariosFormateados = usuarios.map(usuario => ({
      id: usuario.id,
      email: usuario.email,
      nombreUsuario: usuario.nombreUsuario,
      apellidoUsuario: usuario.apellidoUsuario,
      activo: usuario.activo,
      emailVerificado: usuario.emailVerificado,
      planSuscripcion: usuario.planSuscripcion,
      fechaCreacion: usuario.createdAt,
      suscripcion: usuario.suscripcion ? {
        id: usuario.suscripcion.id,
        planSuscripcion: usuario.suscripcion.planSuscripcion,
        estadoSuscripcion: usuario.suscripcion.estadoSuscripcion,
        periodoFacturacion: usuario.suscripcion.periodoFacturacion,
        fechaInicio: usuario.suscripcion.fechaInicio,
        fechaFin: usuario.suscripcion.fechaFin,
        precio: usuario.suscripcion.precio,
        ultimosPagos: usuario.suscripcion.pagos,
      } : null,
    }));

    res.json({ usuarios: usuariosFormateados });
  } catch (error) {
    console.error('Error obteniendo usuarios de testing:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
}

/**
 * Crear usuario de testing
 */
export async function crearUsuarioTesting(req: Request, res: Response) {
  try {
    const { email, nombreUsuario, apellidoUsuario, plan, periodoFacturacion } = req.body;

    // Validaciones
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    if (!plan || !Object.values(PlanSuscripcion).includes(plan)) {
      return res.status(400).json({ error: 'Plan inválido' });
    }

    if (!periodoFacturacion || !Object.values(PeriodoFacturacion).includes(periodoFacturacion)) {
      return res.status(400).json({ error: 'Período de facturación inválido' });
    }

    // Verificar si el email ya existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email },
    });

    if (usuarioExistente) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese email' });
    }

    // Crear usuario (sin contraseña, se puede configurar después)
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        email,
        nombreUsuario: nombreUsuario || 'Usuario',
        apellidoUsuario: apellidoUsuario || 'Testing',
        planSuscripcion: plan as PlanSuscripcion,
        activo: true,
        emailVerificado: true, // Para testing, marcamos como verificado
        passwordHash: '', // Sin contraseña inicial
      },
    });

    // Crear suscripción
    if (plan === PlanSuscripcion.DEMO) {
      await suscripcionService.crearSuscripcionDemo(nuevoUsuario.id);
    } else {
      const precio = obtenerPrecioPlan(plan as PlanSuscripcion, periodoFacturacion as PeriodoFacturacion);
      const fechaFin = new Date();
      
      if (periodoFacturacion === PeriodoFacturacion.ANUAL) {
        fechaFin.setFullYear(fechaFin.getFullYear() + 1);
      } else {
        fechaFin.setMonth(fechaFin.getMonth() + 1);
      }

      await prisma.suscripcion.create({
        data: {
          idUsuario: nuevoUsuario.id,
          planSuscripcion: plan as PlanSuscripcion,
          estadoSuscripcion: 'ACTIVA',
          periodoFacturacion: periodoFacturacion as PeriodoFacturacion,
          precio,
          moneda: 'USD',
          fechaFin,
          fechaProximaRenovacion: fechaFin,
        },
      });
    }

    res.json({ 
      mensaje: 'Usuario de testing creado exitosamente',
      usuario: nuevoUsuario 
    });
  } catch (error) {
    console.error('Error creando usuario de testing:', error);
    res.status(500).json({ 
      error: 'Error al crear usuario de testing',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

/**
 * Actualizar plan de usuario de testing
 */
export async function actualizarPlanUsuario(req: Request, res: Response) {
  try {
    const { usuarioId } = req.params;
    const { nuevoPlan, nuevoPeriodoFacturacion } = req.body;

    // Validaciones
    if (!nuevoPlan || !Object.values(PlanSuscripcion).includes(nuevoPlan)) {
      return res.status(400).json({ error: 'Plan inválido' });
    }

    if (!nuevoPeriodoFacturacion || !Object.values(PeriodoFacturacion).includes(nuevoPeriodoFacturacion)) {
      return res.status(400).json({ error: 'Período de facturación inválido' });
    }

    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: { suscripcion: true },
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Actualizar plan en usuario
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { planSuscripcion: nuevoPlan as PlanSuscripcion },
    });

    // Actualizar o crear suscripción
    const precio = obtenerPrecioPlan(nuevoPlan as PlanSuscripcion, nuevoPeriodoFacturacion as PeriodoFacturacion);
    const fechaFin = new Date();
    
    if (nuevoPeriodoFacturacion === PeriodoFacturacion.ANUAL) {
      fechaFin.setFullYear(fechaFin.getFullYear() + 1);
    } else {
      fechaFin.setMonth(fechaFin.getMonth() + 1);
    }

    if (usuario.suscripcion) {
      // Actualizar suscripción existente
      await prisma.suscripcion.update({
        where: { id: usuario.suscripcion.id },
        data: {
          planSuscripcion: nuevoPlan as PlanSuscripcion,
          periodoFacturacion: nuevoPeriodoFacturacion as PeriodoFacturacion,
          precio,
          fechaFin,
          fechaProximaRenovacion: fechaFin,
          estadoSuscripcion: 'ACTIVA',
        },
      });
    } else {
      // Crear nueva suscripción
      if (nuevoPlan === PlanSuscripcion.DEMO) {
        await suscripcionService.crearSuscripcionDemo(usuarioId);
      } else {
        await prisma.suscripcion.create({
          data: {
            idUsuario: usuarioId,
            planSuscripcion: nuevoPlan as PlanSuscripcion,
            estadoSuscripcion: 'ACTIVA',
            periodoFacturacion: nuevoPeriodoFacturacion as PeriodoFacturacion,
            precio,
            moneda: 'USD',
            fechaFin,
            fechaProximaRenovacion: fechaFin,
          },
        });
      }
    }

    res.json({ mensaje: 'Plan actualizado exitosamente' });
  } catch (error) {
    console.error('Error actualizando plan:', error);
    res.status(500).json({ 
      error: 'Error al actualizar plan',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

/**
 * Eliminar usuario de testing
 */
export async function eliminarUsuarioTesting(req: Request, res: Response) {
  try {
    const { usuarioId } = req.params;

    // Verificar que el usuario existe y no es el superusuario
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (usuario.id === SUPERUSUARIO_ID) {
      return res.status(400).json({ error: 'No se puede eliminar el superusuario' });
    }

    // Eliminar usuario (las suscripciones y pagos se eliminan en cascada)
    await prisma.usuario.delete({
      where: { id: usuarioId },
    });

    res.json({ mensaje: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ 
      error: 'Error al eliminar usuario',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

/**
 * Verificar si el usuario actual es superusuario
 */
export async function verificarSuperusuario(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    
    if (!userId) {
      return res.status(401).json({ esSuperusuario: false });
    }

    const esSuper = userId === SUPERUSUARIO_ID;
    res.json({ esSuperusuario: esSuper });
  } catch (error) {
    console.error('Error verificando superusuario:', error);
    res.status(500).json({ error: 'Error al verificar superusuario' });
  }
}

