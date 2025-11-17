/**
 * Controlador para el reporte completo
 */

import { Request, Response } from 'express';
import { obtenerDatosReporteCompleto } from '../services/reporteCompletoService';
import prisma from '../lib/prisma';

interface ReporteRequest extends Request {
  userId?: string;
}

/**
 * Obtiene todos los datos consolidados para el reporte completo
 */
export async function obtenerReporteCompleto(req: ReporteRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!idGranja) {
      return res.status(400).json({ error: 'idGranja es requerido' });
    }

    // Verificar que la granja pertenece al usuario
    const granja = await prisma.granja.findFirst({
      where: { id: idGranja, idUsuario: userId },
      include: {
        usuario: {
          select: {
            nombreUsuario: true,
            apellidoUsuario: true,
            email: true
          }
        }
      }
    });

    if (!granja) {
      return res.status(404).json({ error: 'Granja no encontrada' });
    }

    // Obtener todos los datos consolidados
    const datos = await obtenerDatosReporteCompleto(idGranja);

    // Agregar información de la granja
    res.json({
      granja: {
        id: granja.id,
        nombreGranja: granja.nombreGranja,
        usuario: `${granja.usuario.nombreUsuario} ${granja.usuario.apellidoUsuario}`,
        fechaGeneracion: new Date().toISOString()
      },
      datos
    });
  } catch (error) {
    console.error('Error obteniendo reporte completo:', error);
    res.status(500).json({ 
      error: 'Error al generar el reporte completo',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

