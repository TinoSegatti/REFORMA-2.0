/**
 * Controlador para gestión de usuarios empleados
 */

import { Request, Response } from 'express';
import {
  generarCodigoReferencia,
  validarCodigoReferencia,
  validarLimiteUsuariosEmpleados,
  vincularUsuarioEmpleado,
  obtenerUsuariosEmpleados,
  eliminarUsuarioEmpleado,
  cambiarRolEmpleado,
  regenerarCodigoReferencia
} from '../services/usuarioEmpleadoService';
import {
  notificarEmpleadoAceptaInvitacion,
  notificarAntesEliminarEmpleado,
  notificarEmpleadoEliminado
} from '../services/notificacionService';
import prisma from '../lib/prisma';

interface UsuarioRequest extends Request {
  userId?: string;
}

/**
 * Genera un código de referencia para el usuario autenticado
 * GET /api/usuarios/empleados/codigo-referencia
 */
export async function generarCodigoReferenciaCtrl(req: UsuarioRequest, res: Response) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar que el usuario no sea empleado
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        esUsuarioEmpleado: true
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (usuario.esUsuarioEmpleado) {
      return res.status(403).json({ error: 'Los usuarios empleados no pueden generar códigos de referencia' });
    }

    const codigo = await generarCodigoReferencia(userId);
    const validacionLimite = await validarLimiteUsuariosEmpleados(userId);

    res.json({
      codigoReferencia: codigo,
      limite: validacionLimite.limite,
      actual: validacionLimite.actual,
      disponibles: validacionLimite.disponibles
    });
  } catch (error) {
    console.error('Error generando código de referencia:', error);
    res.status(500).json({
      error: 'Error al generar código de referencia',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

/**
 * Regenera el código de referencia (invalida el anterior)
 * POST /api/usuarios/empleados/codigo-referencia/regenerar
 */
export async function regenerarCodigoReferenciaCtrl(req: UsuarioRequest, res: Response) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar que el usuario no sea empleado
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        esUsuarioEmpleado: true
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (usuario.esUsuarioEmpleado) {
      return res.status(403).json({ error: 'Los usuarios empleados no pueden regenerar códigos de referencia' });
    }

    const codigo = await regenerarCodigoReferencia(userId);
    const validacionLimite = await validarLimiteUsuariosEmpleados(userId);

    res.json({
      codigoReferencia: codigo,
      limite: validacionLimite.limite,
      actual: validacionLimite.actual,
      disponibles: validacionLimite.disponibles
    });
  } catch (error) {
    console.error('Error regenerando código de referencia:', error);
    res.status(500).json({
      error: 'Error al regenerar código de referencia',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

/**
 * Obtiene la lista de usuarios empleados del usuario autenticado
 * GET /api/usuarios/empleados
 */
export async function obtenerUsuariosEmpleadosCtrl(req: UsuarioRequest, res: Response) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar que el usuario no sea empleado y obtener código de referencia
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        esUsuarioEmpleado: true,
        codigoReferencia: true
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (usuario.esUsuarioEmpleado) {
      return res.status(403).json({ error: 'Los usuarios empleados no pueden ver la lista de empleados' });
    }

    const empleados = await obtenerUsuariosEmpleados(userId);
    const validacionLimite = await validarLimiteUsuariosEmpleados(userId);

    res.json({
      empleados,
      codigoReferencia: usuario.codigoReferencia || null,
      limite: validacionLimite.limite,
      actual: validacionLimite.actual,
      disponibles: validacionLimite.disponibles
    });
  } catch (error) {
    console.error('Error obteniendo usuarios empleados:', error);
    res.status(500).json({
      error: 'Error al obtener usuarios empleados',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

/**
 * Obtiene información sobre el límite de usuarios empleados
 * GET /api/usuarios/empleados/limite
 */
export async function obtenerLimiteUsuariosCtrl(req: UsuarioRequest, res: Response) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const validacionLimite = await validarLimiteUsuariosEmpleados(userId);

    res.json({
      limite: validacionLimite.limite,
      actual: validacionLimite.actual,
      disponibles: validacionLimite.disponibles,
      puedeAgregar: validacionLimite.puedeAgregar
    });
  } catch (error) {
    console.error('Error obteniendo límite de usuarios:', error);
    res.status(500).json({
      error: 'Error al obtener límite de usuarios',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

/**
 * Vincula un usuario empleado mediante código de referencia
 * POST /api/usuarios/empleados/vincular
 */
export async function vincularEmpleadoCtrl(req: UsuarioRequest, res: Response) {
  try {
    const userId = req.userId;
    const { codigoReferencia } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!codigoReferencia) {
      return res.status(400).json({ error: 'Código de referencia requerido' });
    }

    // Verificar que el usuario no sea ya empleado de otro dueño
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        esUsuarioEmpleado: true,
        idUsuarioDueño: true
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (usuario.esUsuarioEmpleado && usuario.idUsuarioDueño) {
      return res.status(400).json({ error: 'El usuario ya es empleado de otro dueño' });
    }

    await vincularUsuarioEmpleado(userId, codigoReferencia);

    // Obtener información del empleado y del dueño para notificación
    const empleado = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        email: true,
        nombreUsuario: true,
        apellidoUsuario: true,
        idUsuarioDueño: true
      }
    });

    if (empleado && empleado.idUsuarioDueño) {
      const dueño = await prisma.usuario.findUnique({
        where: { id: empleado.idUsuarioDueño },
        select: {
          email: true,
          nombreUsuario: true,
          apellidoUsuario: true
        }
      });

      if (dueño) {
        // Enviar notificación al dueño cuando un empleado acepta la invitación
        await notificarEmpleadoAceptaInvitacion(
          dueño.email,
          `${dueño.nombreUsuario} ${dueño.apellidoUsuario}`,
          `${empleado.nombreUsuario} ${empleado.apellidoUsuario}`,
          empleado.email
        );
      }
    }

    res.json({
      mensaje: 'Usuario vinculado exitosamente como empleado'
    });
  } catch (error) {
    console.error('Error vinculando empleado:', error);
    res.status(400).json({
      error: 'Error al vincular empleado',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

/**
 * Elimina (desvincula) un usuario empleado
 * DELETE /api/usuarios/empleados/:empleadoId
 */
export async function eliminarEmpleadoCtrl(req: UsuarioRequest, res: Response) {
  try {
    const userId = req.userId;
    const { empleadoId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!empleadoId) {
      return res.status(400).json({ error: 'ID de empleado requerido' });
    }

    // Verificar que el usuario no sea empleado
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        esUsuarioEmpleado: true
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (usuario.esUsuarioEmpleado) {
      return res.status(403).json({ error: 'Los usuarios empleados no pueden eliminar otros empleados' });
    }

    // Obtener información del empleado y del dueño antes de eliminar
    const empleado = await prisma.usuario.findUnique({
      where: { id: empleadoId },
      select: {
        email: true,
        nombreUsuario: true,
        apellidoUsuario: true,
        idUsuarioDueño: true
      }
    });

    const dueño = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        email: true,
        nombreUsuario: true,
        apellidoUsuario: true
      }
    });

    if (empleado && dueño && empleado.idUsuarioDueño === userId) {
      // Enviar notificación antes de eliminar
      await notificarAntesEliminarEmpleado(
        empleado.email,
        `${empleado.nombreUsuario} ${empleado.apellidoUsuario}`,
        `${dueño.nombreUsuario} ${dueño.apellidoUsuario}`,
        dueño.email
      );
    }

    await eliminarUsuarioEmpleado(userId, empleadoId);

    // Enviar notificación después de eliminar
    if (empleado && dueño) {
      await notificarEmpleadoEliminado(
        empleado.email,
        `${empleado.nombreUsuario} ${empleado.apellidoUsuario}`,
        `${dueño.nombreUsuario} ${dueño.apellidoUsuario}`,
        dueño.email
      );
    }

    res.json({
      mensaje: 'Empleado eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando empleado:', error);
    res.status(400).json({
      error: 'Error al eliminar empleado',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

/**
 * Cambia el rol de un usuario empleado
 * PUT /api/usuarios/empleados/:empleadoId/rol
 */
export async function cambiarRolEmpleadoCtrl(req: UsuarioRequest, res: Response) {
  try {
    const userId = req.userId;
    const { empleadoId } = req.params;
    const { nuevoRol } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!empleadoId || !nuevoRol) {
      return res.status(400).json({ error: 'ID de empleado y nuevo rol son requeridos' });
    }

    if (!['ADMIN', 'EDITOR', 'LECTOR'].includes(nuevoRol)) {
      return res.status(400).json({ error: 'Rol inválido. Debe ser ADMIN, EDITOR o LECTOR' });
    }

    // Verificar que el usuario no sea empleado
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        esUsuarioEmpleado: true
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (usuario.esUsuarioEmpleado) {
      return res.status(403).json({ error: 'Los usuarios empleados no pueden cambiar roles' });
    }

    await cambiarRolEmpleado(userId, empleadoId, nuevoRol as 'ADMIN' | 'EDITOR' | 'LECTOR');

    res.json({
      mensaje: 'Rol de empleado actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error cambiando rol de empleado:', error);
    res.status(400).json({
      error: 'Error al cambiar rol de empleado',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

