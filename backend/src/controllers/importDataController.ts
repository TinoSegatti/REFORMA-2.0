/**
 * Controlador de Importación de Datos
 */

import { Request, Response } from 'express';
import { importarMateriasPrimas, importarProveedores } from '../services/importDataService';

interface ImportRequest extends Request {
  userId?: string;
}

/**
 * Importar materias primas
 */
export async function importarMateriasPrimasController(req: ImportRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranjaOrigen, idGranjaDestino } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!idGranjaOrigen || !idGranjaDestino) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos' });
    }

    const resultado = await importarMateriasPrimas({
      idGranjaOrigen,
      idGranjaDestino,
      idUsuario: userId
    });

    res.json({
      mensaje: 'Materias primas importadas exitosamente',
      ...resultado
    });
  } catch (error: any) {
    console.error('Error importando materias primas:', error);
    res.status(500).json({ error: error.message || 'Error al importar materias primas' });
  }
}

/**
 * Importar proveedores
 */
export async function importarProveedoresController(req: ImportRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranjaOrigen, idGranjaDestino } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!idGranjaOrigen || !idGranjaDestino) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos' });
    }

    const resultado = await importarProveedores({
      idGranjaOrigen,
      idGranjaDestino,
      idUsuario: userId
    });

    res.json({
      mensaje: 'Proveedores importados exitosamente',
      ...resultado
    });
  } catch (error: any) {
    console.error('Error importando proveedores:', error);
    res.status(500).json({ error: error.message || 'Error al importar proveedores' });
  }
}

