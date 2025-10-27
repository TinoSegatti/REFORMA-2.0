/**
 * Controlador de Inventario
 * Gestiona el inventario de materias primas
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { recalcularInventario, actualizarCantidadReal, obtenerInventarioGranja } from '../services/inventarioService';

interface InventarioRequest extends Request {
  userId?: string;
}

/**
 * Obtener inventario completo de una granja
 */
export async function obtenerInventario(req: InventarioRequest, res: Response) {
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

    const inventario = await obtenerInventarioGranja(idGranja);

    res.json(inventario);
  } catch (error: any) {
    console.error('Error obteniendo inventario:', error);
    res.status(500).json({ error: 'Error al obtener inventario' });
  }
}

/**
 * Actualizar cantidad real de una materia prima
 */
export async function actualizarCantidadRealInventario(req: InventarioRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja, idMateriaPrima } = req.params;
    const { cantidadReal, observaciones } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (cantidadReal < 0) {
      return res.status(400).json({ error: 'La cantidad real no puede ser negativa' });
    }

    // Verificar que la granja pertenece al usuario
    const granja = await prisma.granja.findFirst({
      where: { id: idGranja, idUsuario: userId }
    });

    if (!granja) {
      return res.status(404).json({ error: 'Granja no encontrada' });
    }

    // Actualizar cantidad real
    await actualizarCantidadReal(idGranja, idMateriaPrima, cantidadReal);

    // Si hay observaciones, actualizarlas
    if (observaciones) {
      await prisma.inventario.updateMany({
        where: {
          idGranja,
          idMateriaPrima
        },
        data: { observaciones }
      });
    }

    const inventario = await prisma.inventario.findUnique({
      where: {
        idGranja_idMateriaPrima: {
          idGranja,
          idMateriaPrima
        }
      },
      include: {
        materiaPrima: {
          select: {
            codigoMateriaPrima: true,
            nombreMateriaPrima: true,
            precioPorKilo: true
          }
        }
      }
    });

    res.json(inventario);
  } catch (error: any) {
    console.error('Error actualizando cantidad real:', error);
    res.status(500).json({ error: 'Error al actualizar cantidad real' });
  }
}

/**
 * Recalcular inventario completo de una granja
 */
export async function recalcularInventarioGranja(req: InventarioRequest, res: Response) {
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

    // Obtener todas las materias primas de la granja
    const materiasPrimas = await prisma.materiaPrima.findMany({
      where: { idGranja }
    });

    // Recalcular inventario para cada materia prima
    await Promise.all(
      materiasPrimas.map(mp => recalcularInventario({
        idGranja,
        idMateriaPrima: mp.id
      }))
    );

    const inventario = await obtenerInventarioGranja(idGranja);

    res.json({
      mensaje: 'Inventario recalculado exitosamente',
      inventario
    });
  } catch (error: any) {
    console.error('Error recalculando inventario:', error);
    res.status(500).json({ error: 'Error al recalcular inventario' });
  }
}

/**
 * Obtener estadísticas del inventario
 */
export async function obtenerEstadisticasInventario(req: InventarioRequest, res: Response) {
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

    const inventario = await obtenerInventarioGranja(idGranja);

    const estadisticas = {
      totalMateriasPrimas: inventario.length,
      valorTotalStock: inventario.reduce((suma, item) => suma + item.valorStock, 0),
      cantidadItemsConMerma: inventario.filter(item => item.merma > 0).length,
      cantidadItemsConSobrante: inventario.filter(item => item.merma < 0).length
    };

    res.json(estadisticas);
  } catch (error: any) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
}

