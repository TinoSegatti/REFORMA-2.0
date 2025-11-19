/**
 * Servicio para gestión de usuarios empleados
 * Maneja la creación, vinculación y gestión de usuarios empleados mediante códigos de referencia
 */

import prisma from '../lib/prisma';
import { PlanSuscripcion as PlanSuscripcionConstants, obtenerLimitesPlan } from '../constants/planes';
import { PlanSuscripcion } from '@prisma/client';
import crypto from 'crypto';

/**
 * Genera un código de referencia único para un usuario dueño
 * Formato: REF-{PLAN}-{8 caracteres aleatorios}
 */
export async function generarCodigoReferencia(usuarioId: string): Promise<string> {
  // Obtener usuario y su plan
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      planSuscripcion: true,
      codigoReferencia: true
    }
  });

  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }

  // Verificar que el plan permite múltiples usuarios
  const limites = obtenerLimitesPlan(usuario.planSuscripcion as PlanSuscripcionConstants);
  if (!limites.permiteMultiplesUsuarios) {
    throw new Error(`El plan ${usuario.planSuscripcion} no permite múltiples usuarios`);
  }

  // Generar código aleatorio de 8 caracteres
  const codigoAleatorio = crypto.randomBytes(4).toString('hex').toUpperCase().substring(0, 8);
  const codigoReferencia = `REF-${usuario.planSuscripcion}-${codigoAleatorio}`;

  // Actualizar usuario con el nuevo código
  const fechaExpiracion = new Date();
  fechaExpiracion.setDate(fechaExpiracion.getDate() + 30); // Expira en 30 días

  await prisma.usuario.update({
    where: { id: usuarioId },
    data: {
      codigoReferencia,
      fechaGeneracionCodigo: new Date(),
      codigoExpiracion: fechaExpiracion
    }
  });

  return codigoReferencia;
}

/**
 * Valida un código de referencia y retorna información del usuario dueño
 */
export async function validarCodigoReferencia(codigo: string): Promise<{
  valido: boolean;
  usuarioDueño?: {
    id: string;
    email: string;
    nombreUsuario: string;
    apellidoUsuario: string;
    planSuscripcion: PlanSuscripcion;
  };
  error?: string;
}> {
  if (!codigo || codigo.trim().length === 0) {
    return { valido: false, error: 'Código de referencia requerido' };
  }

  // Buscar usuario dueño por código de referencia
  const usuarioDueño = await prisma.usuario.findUnique({
    where: { codigoReferencia: codigo.trim() },
    select: {
      id: true,
      email: true,
      nombreUsuario: true,
      apellidoUsuario: true,
      planSuscripcion: true,
      codigoExpiracion: true,
      activo: true
    }
  });

  if (!usuarioDueño) {
    return { valido: false, error: 'Código de referencia inválido' };
  }

  // Verificar que el usuario esté activo
  if (!usuarioDueño.activo) {
    return { valido: false, error: 'El usuario dueño no está activo' };
  }

  // Verificar que el código no haya expirado
  if (usuarioDueño.codigoExpiracion && new Date() > usuarioDueño.codigoExpiracion) {
    return { valido: false, error: 'El código de referencia ha expirado' };
  }

  // Verificar que el plan permite múltiples usuarios
  const limites = obtenerLimitesPlan(usuarioDueño.planSuscripcion as PlanSuscripcionConstants);
  if (!limites.permiteMultiplesUsuarios) {
    return { valido: false, error: `El plan ${usuarioDueño.planSuscripcion} no permite múltiples usuarios` };
  }

  return {
    valido: true,
    usuarioDueño: {
      id: usuarioDueño.id,
      email: usuarioDueño.email,
      nombreUsuario: usuarioDueño.nombreUsuario,
      apellidoUsuario: usuarioDueño.apellidoUsuario,
      planSuscripcion: usuarioDueño.planSuscripcion as PlanSuscripcionConstants
    }
  };
}

/**
 * Valida si un usuario dueño puede agregar más empleados según su plan
 */
export async function validarLimiteUsuariosEmpleados(usuarioDueñoId: string): Promise<{
  puedeAgregar: boolean;
  limite: number;
  actual: number;
  disponibles: number;
}> {
  const usuarioDueño = await prisma.usuario.findUnique({
    where: { id: usuarioDueñoId },
    select: {
      planSuscripcion: true
    }
  });

  if (!usuarioDueño) {
    throw new Error('Usuario dueño no encontrado');
  }

  const limites = obtenerLimitesPlan(usuarioDueño.planSuscripcion as PlanSuscripcionConstants);
  const limiteUsuarios = limites.maxUsuarios;

  if (limiteUsuarios === null) {
    // Ilimitado (ENTERPRISE)
    const cantidadActual = await prisma.usuario.count({
      where: {
        idUsuarioDueño: usuarioDueñoId,
        activoComoEmpleado: true
      }
    });
    return {
      puedeAgregar: true,
      limite: Infinity,
      actual: cantidadActual,
      disponibles: Infinity
    };
  }

  // Contar empleados activos (excluyendo al dueño)
  const cantidadEmpleados = await prisma.usuario.count({
    where: {
      idUsuarioDueño: usuarioDueñoId,
      activoComoEmpleado: true
    }
  });

  // El límite incluye al dueño, así que los empleados disponibles son limite - 1
  const empleadosDisponibles = limiteUsuarios - 1 - cantidadEmpleados;

  return {
    puedeAgregar: empleadosDisponibles > 0,
    limite: limiteUsuarios,
    actual: cantidadEmpleados,
    disponibles: Math.max(0, empleadosDisponibles)
  };
}

/**
 * Vincula un usuario empleado a un usuario dueño mediante código de referencia
 */
export async function vincularUsuarioEmpleado(
  empleadoId: string,
  codigoReferencia: string
): Promise<void> {
  // Validar código
  const validacion = await validarCodigoReferencia(codigoReferencia);
  if (!validacion.valido || !validacion.usuarioDueño) {
    throw new Error(validacion.error || 'Código de referencia inválido');
  }

  const usuarioDueñoId = validacion.usuarioDueño.id;

  // Verificar que el empleado no sea el mismo que el dueño
  if (empleadoId === usuarioDueñoId) {
    throw new Error('Un usuario no puede ser empleado de sí mismo');
  }

  // Verificar que el empleado no sea ya empleado de otro dueño
  const empleadoActual = await prisma.usuario.findUnique({
    where: { id: empleadoId },
    select: {
      esUsuarioEmpleado: true,
      idUsuarioDueño: true
    }
  });

  if (!empleadoActual) {
    throw new Error('Usuario empleado no encontrado');
  }

  if (empleadoActual.esUsuarioEmpleado && empleadoActual.idUsuarioDueño !== usuarioDueñoId) {
    throw new Error('El usuario ya es empleado de otro dueño');
  }

  // Verificar límite de usuarios
  const validacionLimite = await validarLimiteUsuariosEmpleados(usuarioDueñoId);
  if (!validacionLimite.puedeAgregar) {
    throw new Error(`Se ha alcanzado el límite de usuarios del plan. Límite: ${validacionLimite.limite}, Actual: ${validacionLimite.actual + 1}`);
  }

  // Vincular empleado
  await prisma.usuario.update({
    where: { id: empleadoId },
    data: {
      esUsuarioEmpleado: true,
      idUsuarioDueño: usuarioDueñoId,
      fechaVinculacion: new Date(),
      activoComoEmpleado: true,
      rolEmpleado: 'EDITOR', // Por defecto EDITOR
      planSuscripcion: validacion.usuarioDueño.planSuscripcion as PlanSuscripcion // Hereda el plan del dueño
    }
  });
}

/**
 * Obtiene todos los usuarios empleados de un dueño
 */
export async function obtenerUsuariosEmpleados(usuarioDueñoId: string): Promise<Array<{
  id: string;
  email: string;
  nombreUsuario: string;
  apellidoUsuario: string;
  fechaVinculacion: Date | null;
  ultimoAcceso: Date | null;
  rolEmpleado: string | null;
  activoComoEmpleado: boolean;
}>> {
  const empleados = await prisma.usuario.findMany({
    where: {
      idUsuarioDueño: usuarioDueñoId
    },
    select: {
      id: true,
      email: true,
      nombreUsuario: true,
      apellidoUsuario: true,
      fechaVinculacion: true,
      ultimoAcceso: true,
      rolEmpleado: true,
      activoComoEmpleado: true
    },
    orderBy: {
      fechaVinculacion: 'desc'
    }
  });

  return empleados;
}

/**
 * Elimina (desvincula) un usuario empleado de un dueño
 */
export async function eliminarUsuarioEmpleado(
  usuarioDueñoId: string,
  empleadoId: string
): Promise<void> {
  // Verificar que el empleado pertenece al dueño
  const empleado = await prisma.usuario.findUnique({
    where: { id: empleadoId },
    select: {
      idUsuarioDueño: true,
      esUsuarioEmpleado: true
    }
  });

  if (!empleado) {
    throw new Error('Empleado no encontrado');
  }

  if (!empleado.esUsuarioEmpleado || empleado.idUsuarioDueño !== usuarioDueñoId) {
    throw new Error('El usuario no es empleado de este dueño');
  }

  // Desvincular empleado (no eliminar la cuenta, solo desvincular)
  await prisma.usuario.update({
    where: { id: empleadoId },
    data: {
      esUsuarioEmpleado: false,
      idUsuarioDueño: null,
      fechaVinculacion: null,
      activoComoEmpleado: false,
      rolEmpleado: null,
      planSuscripcion: 'DEMO' as PlanSuscripcion // Degradar a DEMO
    }
  });
}

/**
 * Cambia el rol de un usuario empleado
 */
export async function cambiarRolEmpleado(
  usuarioDueñoId: string,
  empleadoId: string,
  nuevoRol: 'ADMIN' | 'EDITOR' | 'LECTOR'
): Promise<void> {
  // Verificar que el empleado pertenece al dueño
  const empleado = await prisma.usuario.findUnique({
    where: { id: empleadoId },
    select: {
      idUsuarioDueño: true,
      esUsuarioEmpleado: true
    }
  });

  if (!empleado) {
    throw new Error('Empleado no encontrado');
  }

  if (!empleado.esUsuarioEmpleado || empleado.idUsuarioDueño !== usuarioDueñoId) {
    throw new Error('El usuario no es empleado de este dueño');
  }

  // Actualizar rol
  await prisma.usuario.update({
    where: { id: empleadoId },
    data: {
      rolEmpleado: nuevoRol
    }
  });
}

/**
 * Obtiene las granjas accesibles para un usuario empleado
 * Los empleados solo pueden acceder a las granjas de su dueño
 */
export async function obtenerPlantasAccesibles(empleadoId: string): Promise<Array<{
  id: string;
  nombreGranja: string;
  descripcion: string | null;
  fechaCreacion: Date;
  activa: boolean;
}>> {
  const empleado = await prisma.usuario.findUnique({
    where: { id: empleadoId },
    select: {
      esUsuarioEmpleado: true,
      idUsuarioDueño: true
    }
  });

  if (!empleado) {
    throw new Error('Usuario no encontrado');
  }

  // Si no es empleado, retornar sus propias granjas
  if (!empleado.esUsuarioEmpleado || !empleado.idUsuarioDueño) {
    const granjas = await prisma.granja.findMany({
      where: {
        idUsuario: empleadoId,
        activa: true
      },
      select: {
        id: true,
        nombreGranja: true,
        descripcion: true,
        fechaCreacion: true,
        activa: true
      }
    });
    return granjas;
  }

  // Si es empleado, retornar las granjas del dueño
  const granjas = await prisma.granja.findMany({
    where: {
      idUsuario: empleado.idUsuarioDueño,
      activa: true
    },
    select: {
      id: true,
      nombreGranja: true,
      descripcion: true,
      fechaCreacion: true,
      activa: true
    }
  });

  return granjas;
}

/**
 * Regenera el código de referencia de un usuario dueño
 * Invalida el código anterior
 */
export async function regenerarCodigoReferencia(usuarioId: string): Promise<string> {
  return await generarCodigoReferencia(usuarioId);
}

