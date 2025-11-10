/**
 * Controlador de Materias Primas
 * Gestiona las materias primas de cada granja
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { validateGranja, sendValidationError } from '../utils/granjaValidation';
import { parseCsvBuffer, buildCsv } from '../utils/csvUtils';

interface MateriaPrimaRequest extends Request {
  userId?: string;
}

/**
 * Obtener todas las materias primas de una granja
 */
export async function obtenerMateriasPrimas(req: MateriaPrimaRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar que la granja pertenece al usuario (con caché)
    const validation = await validateGranja(idGranja, userId);
    if (sendValidationError(res, validation)) return;

    const materiasPrimas = await prisma.materiaPrima.findMany({
      where: { idGranja },
      orderBy: { nombreMateriaPrima: 'asc' }
    });

    res.json(materiasPrimas);
  } catch (error: any) {
    console.error('Error obteniendo materias primas:', error);
    res.status(500).json({ error: 'Error al obtener materias primas' });
  }
}

/**
 * Crear nueva materia prima
 */
export async function crearMateriaPrima(req: MateriaPrimaRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;
    const { codigoMateriaPrima, nombreMateriaPrima } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!codigoMateriaPrima || !nombreMateriaPrima) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Verificar que la granja pertenece al usuario (con caché)
    const validation = await validateGranja(idGranja, userId);
    if (sendValidationError(res, validation)) return;

    // Verificar que el código no esté duplicado
    const codigoExistente = await prisma.materiaPrima.findFirst({
      where: {
        idGranja,
        codigoMateriaPrima
      }
    });

    if (codigoExistente) {
      return res.status(400).json({ error: 'El código de materia prima ya existe' });
    }

    const materiaPrima = await prisma.materiaPrima.create({
      data: {
        idGranja,
        codigoMateriaPrima,
        nombreMateriaPrima,
        precioPorKilo: 0 // Sin precio hasta primera compra
      }
    });

    res.status(201).json(materiaPrima);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El código de materia prima ya existe' });
    }
    console.error('Error creando materia prima:', error);
    res.status(500).json({ error: 'Error al crear materia prima' });
  }
}

/**
 * Actualizar materia prima
 */
export async function actualizarMateriaPrima(req: MateriaPrimaRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja, id } = req.params;
    const { codigoMateriaPrima, nombreMateriaPrima } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!codigoMateriaPrima || !nombreMateriaPrima) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Verificar que la granja pertenece al usuario (con caché)
    const validation = await validateGranja(idGranja, userId);
    if (sendValidationError(res, validation)) return;

    // Verificar que existe la materia prima y el código no esté duplicado en paralelo
    const [materiaPrimaExistente, codigoExistente] = await Promise.all([
      prisma.materiaPrima.findFirst({
        where: { id, idGranja }
      }),
      prisma.materiaPrima.findFirst({
        where: {
          idGranja,
          codigoMateriaPrima,
          id: { not: id }
        }
      })
    ]);

    if (!materiaPrimaExistente) {
      return res.status(404).json({ error: 'Materia prima no encontrada' });
    }

    if (codigoExistente) {
      return res.status(400).json({ error: 'El código de materia prima ya existe' });
    }

    const materiaPrima = await prisma.materiaPrima.update({
      where: { id },
      data: {
        codigoMateriaPrima,
        nombreMateriaPrima
      }
    });

    res.json(materiaPrima);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El código de materia prima ya existe' });
    }
    console.error('Error actualizando materia prima:', error);
    res.status(500).json({ error: 'Error al actualizar materia prima' });
  }
}

/**
 * Eliminar materia prima
 */
export async function eliminarMateriaPrima(req: MateriaPrimaRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja, id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar que la granja pertenece al usuario (con caché)
    const validation = await validateGranja(idGranja, userId);
    if (sendValidationError(res, validation)) return;

    // Eliminar directamente (si no existe, Prisma lanzará error P2025)
    await prisma.materiaPrima.delete({
      where: { id }
    }).catch((error: any) => {
      if (error.code === 'P2025') {
        throw new Error('Materia prima no encontrada');
      }
      throw error;
    });

    res.json({ mensaje: 'Materia prima eliminada exitosamente' });
  } catch (error: any) {
    if (error.message === 'Materia prima no encontrada') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error eliminando materia prima:', error);
    res.status(500).json({ error: 'Error al eliminar materia prima' });
  }
}

export async function importarMateriasPrimas(req: MateriaPrimaRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo CSV' });
    }

    const validation = await validateGranja(idGranja, userId);
    if (sendValidationError(res, validation)) return;

    const existentes = await prisma.materiaPrima.count({ where: { idGranja } });
    if (existentes > 0) {
      return res.status(400).json({ error: 'Ya existen materias primas registradas. La importación solo está disponible en instancias vacías.' });
    }

    const { rows } = parseCsvBuffer(req.file.buffer, {
      requiredHeaders: ['codigoMateriaPrima', 'nombreMateriaPrima', 'precioPorKilo'],
    });

    const registros = rows.map((row, index) => {
      const codigo = row.codigoMateriaPrima?.trim();
      const nombre = row.nombreMateriaPrima?.trim();
      const precioRaw = row.precioPorKilo?.trim();

      if (!codigo || !nombre) {
        throw new Error(`Fila ${index + 2}: se requieren los campos codigoMateriaPrima y nombreMateriaPrima`);
      }

      const precio = precioRaw ? Number(precioRaw) : 0;
      if (Number.isNaN(precio) || precio < 0) {
        throw new Error(`Fila ${index + 2}: precioPorKilo debe ser un número válido mayor o igual a 0`);
      }

      return {
        codigoMateriaPrima: codigo,
        nombreMateriaPrima: nombre,
        precioPorKilo: precio,
      };
    });

    const codigos = new Set<string>();
    for (const registro of registros) {
      if (codigos.has(registro.codigoMateriaPrima)) {
        throw new Error(`Código duplicado en el archivo: ${registro.codigoMateriaPrima}`);
      }
      codigos.add(registro.codigoMateriaPrima);
    }

    await prisma.materiaPrima.createMany({
      data: registros.map((registro) => ({
        idGranja,
        codigoMateriaPrima: registro.codigoMateriaPrima,
        nombreMateriaPrima: registro.nombreMateriaPrima,
        precioPorKilo: registro.precioPorKilo,
      })),
    });

    res.json({ mensaje: `Importación exitosa de ${registros.length} materia(s) prima(s)` });
  } catch (error: any) {
    console.error('Error importando materias primas:', error);
    res.status(400).json({ error: error.message || 'Error al importar materias primas' });
  }
}

export async function exportarMateriasPrimas(req: MateriaPrimaRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const validation = await validateGranja(idGranja, userId);
    if (sendValidationError(res, validation)) return;

    const materias = await prisma.materiaPrima.findMany({
      where: { idGranja },
      orderBy: { codigoMateriaPrima: 'asc' },
    });

    const csv = buildCsv({
      fields: ['codigoMateriaPrima', 'nombreMateriaPrima', 'precioPorKilo', 'activa', 'fechaCreacion'],
      data: materias.map((mp) => ({
        codigoMateriaPrima: mp.codigoMateriaPrima,
        nombreMateriaPrima: mp.nombreMateriaPrima,
        precioPorKilo: mp.precioPorKilo,
        activa: mp.activa ? 'SI' : 'NO',
        fechaCreacion: mp.fechaCreacion.toISOString(),
      })),
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="materias_primas_${idGranja}.csv"`);
    res.send(csv);
  } catch (error: any) {
    console.error('Error exportando materias primas:', error);
    res.status(500).json({ error: 'Error al exportar materias primas' });
  }
}

