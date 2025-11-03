/**
 * Controlador de Auditoría
 * Gestiona las consultas de registros de auditoría
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import {
  obtenerAuditoriaGranja,
  obtenerAuditoriaGranjaConFiltros,
  obtenerAuditoriaUsuario
} from '../services/auditoriaService';
import { TablaOrigen } from '@prisma/client';

interface AuditoriaRequest extends Request {
  userId?: string;
}

/**
 * Obtener auditoría de una granja con filtros opcionales
 */
export async function obtenerAuditoriaCtrl(req: AuditoriaRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;
    const { tablaOrigen, accion, desde, hasta, limit } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar que la granja pertenece al usuario
    const granja = await prisma.granja.findFirst({
      where: { id: idGranja, idUsuario: userId }
    });

    if (!granja) {
      return res.status(404).json({ error: 'Granja no encontrada' });
    }

    // Obtener auditoría con filtros
    const auditoria = await obtenerAuditoriaGranjaConFiltros(idGranja, {
      tablaOrigen: tablaOrigen as TablaOrigen | undefined,
      accion: accion as string | undefined,
      desde: desde as string | undefined,
      hasta: hasta as string | undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json(auditoria);
  } catch (error: any) {
    console.error('Error obteniendo auditoría:', error);
    res.status(500).json({ error: 'Error al obtener auditoría' });
  }
}

/**
 * Obtener estadísticas de auditoría de una granja
 */
export async function obtenerEstadisticasAuditoriaCtrl(req: AuditoriaRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar que la granja pertenece al usuario
    const granja = await prisma.granja.findFirst({
      where: { id: idGranja, idUsuario: userId }
    });

    if (!granja) {
      return res.status(404).json({ error: 'Granja no encontrada' });
    }

    // Obtener todas las auditorías de la granja
    let auditorias: Array<{ tablaOrigen: string; accion: string; fechaOperacion: Date }> = [];
    try {
      auditorias = await prisma.auditoria.findMany({
        where: { idGranja },
        select: {
          tablaOrigen: true,
          accion: true,
          fechaOperacion: true,
        },
      });
    } catch (error: any) {
      // Si la tabla no existe, usar array vacío
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        console.warn('Tabla t_auditoria no existe aún. Retornando estadísticas vacías.');
        auditorias = [];
      } else {
        throw error;
      }
    }

    // Calcular estadísticas
    const estadisticas = {
      totalRegistros: auditorias.length,
      porTabla: {
        COMPRA: auditorias.filter(a => a.tablaOrigen === 'COMPRA').length,
        FABRICACION: auditorias.filter(a => a.tablaOrigen === 'FABRICACION').length,
        INVENTARIO: auditorias.filter(a => a.tablaOrigen === 'INVENTARIO').length,
      },
      porAccion: {
        DELETE: auditorias.filter(a => a.accion === 'DELETE').length,
        RESTORE: auditorias.filter(a => a.accion === 'RESTORE').length,
        BULK_DELETE: auditorias.filter(a => a.accion === 'BULK_DELETE').length,
        CREATE: auditorias.filter(a => a.accion === 'CREATE').length,
        UPDATE: auditorias.filter(a => a.accion === 'UPDATE').length,
      },
      ultimasOperaciones: auditorias
        .sort((a, b) => b.fechaOperacion.getTime() - a.fechaOperacion.getTime())
        .slice(0, 10)
        .map(a => ({
          tablaOrigen: a.tablaOrigen,
          accion: a.accion,
          fechaOperacion: a.fechaOperacion,
        })),
    };

    res.json(estadisticas);
  } catch (error: any) {
    console.error('Error obteniendo estadísticas de auditoría:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas de auditoría' });
  }
}

