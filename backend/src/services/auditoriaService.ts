/**
 * Servicio de Auditoría
 * Registra todas las operaciones críticas del sistema
 */

import prisma from '../lib/prisma';
import { TablaOrigen } from '@prisma/client';

interface AuditoriaParams {
  idUsuario: string;
  idGranja?: string;
  tablaOrigen: TablaOrigen;
  idRegistro: string;
  accion: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'BULK_DELETE';
  descripcion?: string;
  datosAnteriores?: any;
  datosNuevos?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Registrar una operación en la auditoría
 */
export async function registrarAuditoria(params: AuditoriaParams) {
  try {
    await prisma.auditoria.create({
      data: {
        idUsuario: params.idUsuario,
        idGranja: params.idGranja,
        tablaOrigen: params.tablaOrigen,
        idRegistro: params.idRegistro,
        accion: params.accion,
        descripcion: params.descripcion,
        datosAnteriores: params.datosAnteriores ? JSON.parse(JSON.stringify(params.datosAnteriores)) : null,
        datosNuevos: params.datosNuevos ? JSON.parse(JSON.stringify(params.datosNuevos)) : null,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    // No queremos que errores de auditoría rompan el flujo principal
    console.error('Error registrando auditoría:', error);
  }
}

/**
 * Obtener historial de auditoría de una granja
 */
export async function obtenerAuditoriaGranja(idGranja: string, limit: number = 100) {
  try {
    return await prisma.auditoria.findMany({
      where: { idGranja },
      include: {
        usuario: {
          select: {
            nombreUsuario: true,
            apellidoUsuario: true,
            email: true,
          },
        },
      },
      orderBy: {
        fechaOperacion: 'desc',
      },
      take: limit,
    });
  } catch (error: any) {
    // Si la tabla no existe, retornar array vacío
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      console.warn('Tabla t_auditoria no existe aún. Retornando array vacío.');
      return [];
    }
    throw error;
  }
}

/**
 * Obtener historial de auditoría de un usuario
 */
export async function obtenerAuditoriaUsuario(idUsuario: string, limit: number = 100) {
  try {
    return await prisma.auditoria.findMany({
      where: { idUsuario },
      include: {
        granja: {
          select: {
            nombreGranja: true,
          },
        },
      },
      orderBy: {
        fechaOperacion: 'desc',
      },
      take: limit,
    });
  } catch (error: any) {
    // Si la tabla no existe, retornar array vacío
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      console.warn('Tabla t_auditoria no existe aún. Retornando array vacío.');
      return [];
    }
    throw error;
  }
}

/**
 * Obtener historial de auditoría de una granja con filtros
 */
export async function obtenerAuditoriaGranjaConFiltros(
  idGranja: string,
  filters?: {
    tablaOrigen?: TablaOrigen;
    accion?: string;
    desde?: string;
    hasta?: string;
    limit?: number;
  }
) {
  const where: any = { idGranja };

  // Filtro por tabla origen
  if (filters?.tablaOrigen) {
    where.tablaOrigen = filters.tablaOrigen;
  }

  // Filtro por acción
  if (filters?.accion) {
    where.accion = filters.accion;
  }

  // Filtro por fecha
  if (filters?.desde || filters?.hasta) {
    where.fechaOperacion = {};
    if (filters.desde) {
      const desdeDate = new Date(filters.desde);
      desdeDate.setHours(0, 0, 0, 0);
      where.fechaOperacion.gte = desdeDate;
    }
    if (filters.hasta) {
      const hastaDate = new Date(filters.hasta);
      hastaDate.setHours(23, 59, 59, 999);
      where.fechaOperacion.lte = hastaDate;
    }
  }

  try {
    return await prisma.auditoria.findMany({
      where,
      include: {
        usuario: {
          select: {
            nombreUsuario: true,
            apellidoUsuario: true,
            email: true,
          },
        },
      },
      orderBy: {
        fechaOperacion: 'desc',
      },
      take: filters?.limit || 100,
    });
  } catch (error: any) {
    // Si la tabla no existe, retornar array vacío
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      console.warn('Tabla t_auditoria no existe aún. Retornando array vacío.');
      return [];
    }
    throw error;
  }
}

