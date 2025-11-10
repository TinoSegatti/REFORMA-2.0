'use strict';

/**
 * Controlador de Archivos (Snapshots)
 */

import { Request, Response } from 'express';
import { TablaOrigen } from '@prisma/client';
import prisma from '../lib/prisma';
import {
  crearArchivoSnapshot,
  eliminarArchivo,
  listarArchivosPorGranja,
  obtenerArchivoConDetalle,
} from '../services/archivoService';
import { validateGranja, sendValidationError } from '../utils/granjaValidation';
import { buildCsv } from '../utils/csvUtils';

const mapTablaKey = (tabla: TablaOrigen) => {
  switch (tabla) {
    case TablaOrigen.COMPRA:
      return 'compras';
    case TablaOrigen.FABRICACION:
      return 'fabricaciones';
    case TablaOrigen.INVENTARIO:
      return 'inventario';
    default:
      return 'otros';
  }
};

export async function listarArchivos(req: Request, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;

    const validation = await validateGranja(idGranja, userId || '');
    if (sendValidationError(res, validation)) return;

    const archivos = await listarArchivosPorGranja(idGranja);

    const agrupados = archivos.reduce<Record<string, any[]>>((acc, archivo) => {
      const key = mapTablaKey(archivo.tablaOrigen);
      if (!acc[key]) acc[key] = [];
      acc[key].push({
        id: archivo.id,
        descripcion: archivo.descripcionArchivo,
        fechaArchivo: archivo.fechaArchivo.toISOString(),
        totalRegistros: archivo.totalRegistros,
        tablaOrigen: archivo.tablaOrigen,
      });
      return acc;
    }, {
      compras: [],
      fabricaciones: [],
      inventario: [],
    });

    res.json(agrupados);
  } catch (error: any) {
    console.error('Error listando archivos:', error);
    res.status(500).json({ error: 'Error al listar archivos' });
  }
}

export async function crearArchivo(req: Request, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;
    const { tablaOrigen, descripcion } = req.body;

    if (!tablaOrigen || !Object.values(TablaOrigen).includes(tablaOrigen)) {
      return res.status(400).json({ error: 'tablaOrigen inválida' });
    }

    if (!descripcion || descripcion.trim().length === 0) {
      return res.status(400).json({ error: 'La descripción es obligatoria' });
    }

    const validation = await validateGranja(idGranja, userId || '');
    if (sendValidationError(res, validation)) return;

    const archivo = await crearArchivoSnapshot({
      idGranja,
      idUsuario: userId!,
      tablaOrigen,
      descripcion: descripcion.trim(),
    });

    res.status(201).json({
      mensaje: 'Archivo creado correctamente',
      archivo: {
        id: archivo.id,
        fechaArchivo: archivo.fechaArchivo.toISOString(),
        totalRegistros: archivo.totalRegistros,
        descripcion: archivo.descripcionArchivo,
        tablaOrigen: archivo.tablaOrigen,
      },
    });
  } catch (error: any) {
    console.error('Error creando archivo:', error);
    res.status(error?.status || 500).json({ error: error?.message || 'Error al crear archivo' });
  }
}

export async function obtenerArchivoDetalle(req: Request, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja, idArchivo } = req.params;

    const validation = await validateGranja(idGranja, userId || '');
    if (sendValidationError(res, validation)) return;

    const archivo = await obtenerArchivoConDetalle(idGranja, idArchivo);

    res.json({
      id: archivo.id,
      descripcion: archivo.descripcionArchivo,
      fechaArchivo: archivo.fechaArchivo.toISOString(),
      totalRegistros: archivo.totalRegistros,
      tablaOrigen: archivo.tablaOrigen,
      detalles: archivo.archivosDetalle.map((detalle) => detalle.datosJson),
    });
  } catch (error: any) {
    console.error('Error obteniendo detalle de archivo:', error);
    res.status(error?.status || 500).json({ error: error?.message || 'Error al obtener detalle de archivo' });
  }
}

export async function eliminarArchivoController(req: Request, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja, idArchivo } = req.params;

    const validation = await validateGranja(idGranja, userId || '');
    if (sendValidationError(res, validation)) return;

    const resultado = await eliminarArchivo({
      idArchivo,
      idGranja,
      idUsuario: userId!,
    });

    res.json(resultado);
  } catch (error: any) {
    console.error('Error eliminando archivo:', error);
    res.status(error?.status || 500).json({ error: error?.message || 'Error al eliminar archivo' });
  }
}

export async function exportarArchivosController(req: Request, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;

    const validation = await validateGranja(idGranja, userId || '');
    if (sendValidationError(res, validation)) return;

    const archivos = await prisma.archivoCabecera.findMany({
      where: { idGranja },
      orderBy: { fechaArchivo: 'desc' },
      include: {
        archivosDetalle: true,
      },
    });

    const filas: Array<Record<string, any>> = [];

    for (const archivo of archivos) {
      filas.push({
        tipo: 'CABECERA',
        idArchivo: archivo.id,
        tablaOrigen: archivo.tablaOrigen,
        descripcionArchivo: archivo.descripcionArchivo,
        fechaArchivo: archivo.fechaArchivo.toISOString(),
        totalRegistros: archivo.totalRegistros,
        fechaCreacion: archivo.fechaCreacion.toISOString(),
      });

      for (const detalle of archivo.archivosDetalle) {
        filas.push({
          tipo: 'DETALLE',
          idArchivo: archivo.id,
          datosJson: JSON.stringify(detalle.datosJson),
        });
      }
    }

    const csv = buildCsv({
      fields: [
        'tipo',
        'idArchivo',
        'tablaOrigen',
        'descripcionArchivo',
        'fechaArchivo',
        'totalRegistros',
        'fechaCreacion',
        'datosJson',
      ],
      data: filas,
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="archivos_${idGranja}.csv"`);
    res.send(csv);
  } catch (error: any) {
    console.error('Error exportando archivos:', error);
    res.status(500).json({ error: 'Error al exportar archivos' });
  }
}


