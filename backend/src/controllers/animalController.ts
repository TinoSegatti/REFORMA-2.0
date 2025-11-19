/**
 * Controlador de Animales (Piensos)
 * Gestiona los piensos de cada granja
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { validateGranja, sendValidationError } from '../utils/granjaValidation';
import { parseCsvBuffer, buildCsv } from '../utils/csvUtils';

interface AnimalRequest extends Omit<Request, 'file'> {
  userId?: string;
  file?: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  };
}

/**
 * Obtener todos los animales de una granja
 */
export async function obtenerAnimales(req: AnimalRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar que la granja pertenece al usuario (con caché)
    const validation = await validateGranja(idGranja, userId);
    if (sendValidationError(res, validation)) return;

    const animales = await prisma.animal.findMany({
      where: { idGranja },
      orderBy: { descripcionAnimal: 'asc' }
    });

    res.json(animales);
  } catch (error: any) {
    console.error('Error obteniendo animales:', error);
    res.status(500).json({ error: 'Error al obtener animales' });
  }
}

/**
 * Crear nuevo animal
 */
export async function crearAnimal(req: AnimalRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;
    const { codigoAnimal, descripcionAnimal, categoriaAnimal } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!codigoAnimal || !descripcionAnimal || !categoriaAnimal) {
      return res.status(400).json({ error: 'Código, descripción y categoría son requeridos' });
    }

    // Verificar que la granja pertenece al usuario (con caché)
    const validation = await validateGranja(idGranja, userId);
    if (sendValidationError(res, validation)) return;

    // Verificar que el código no esté duplicado
    const codigoExistente = await prisma.animal.findFirst({
      where: {
        idGranja,
        codigoAnimal
      }
    });

    if (codigoExistente) {
      return res.status(400).json({ error: 'El código de animal ya existe' });
    }

    const animal = await prisma.animal.create({
      data: {
        idGranja,
        codigoAnimal,
        descripcionAnimal,
        categoriaAnimal
      }
    });

    res.status(201).json(animal);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El código de animal ya existe' });
    }
    console.error('Error creando animal:', error);
    res.status(500).json({ error: 'Error al crear animal' });
  }
}

/**
 * Actualizar animal
 */
export async function actualizarAnimal(req: AnimalRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja, id } = req.params;
    const { codigoAnimal, descripcionAnimal, categoriaAnimal } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!codigoAnimal || !descripcionAnimal || !categoriaAnimal) {
      return res.status(400).json({ error: 'Código, descripción y categoría son requeridos' });
    }

    // Verificar que la granja pertenece al usuario (con caché)
    const validation = await validateGranja(idGranja, userId);
    if (sendValidationError(res, validation)) return;

    // Verificar que existe el animal y el código no esté duplicado en paralelo
    const [animalExistente, codigoExistente] = await Promise.all([
      prisma.animal.findFirst({
        where: { id, idGranja }
      }),
      prisma.animal.findFirst({
        where: {
          idGranja,
          codigoAnimal,
          id: { not: id }
        }
      })
    ]);

    if (!animalExistente) {
      return res.status(404).json({ error: 'Animal no encontrado' });
    }

    if (codigoExistente) {
      return res.status(400).json({ error: 'El código de animal ya existe' });
    }

    const animal = await prisma.animal.update({
      where: { id },
      data: {
        codigoAnimal,
        descripcionAnimal,
        categoriaAnimal
      }
    });

    res.json(animal);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El código de animal ya existe' });
    }
    console.error('Error actualizando animal:', error);
    res.status(500).json({ error: 'Error al actualizar animal' });
  }
}

/**
 * Eliminar animal
 */
export async function eliminarAnimal(req: AnimalRequest, res: Response) {
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
    await prisma.animal.delete({
      where: { id }
    }).catch((error: any) => {
      if (error.code === 'P2025') {
        throw new Error('Animal no encontrado');
      }
      throw error;
    });

    res.json({ mensaje: 'Animal eliminado exitosamente' });
  } catch (error: any) {
    if (error.message === 'Animal no encontrado') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error eliminando animal:', error);
    res.status(500).json({ error: 'Error al eliminar animal' });
  }
}

export async function importarAnimales(req: AnimalRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo CSV' });
    }

    // La validación de plan y datos previos se hace en el middleware validateImportacionCSV
    // Solo validar acceso a granja (ya hecho por middleware)

    const { rows } = parseCsvBuffer(req.file.buffer, {
      requiredHeaders: ['codigoAnimal', 'descripcionAnimal', 'categoriaAnimal'],
    });

    const animales = rows.map((row, index) => {
      const codigo = row.codigoAnimal?.trim();
      const descripcion = row.descripcionAnimal?.trim();
      const categoria = row.categoriaAnimal?.trim();

      if (!codigo || !descripcion || !categoria) {
        throw new Error(`Fila ${index + 2}: se requieren codigoAnimal, descripcionAnimal y categoriaAnimal`);
      }

      return {
        codigoAnimal: codigo,
        descripcionAnimal: descripcion,
        categoriaAnimal: categoria,
      };
    });

    const codigos = new Set<string>();
    for (const animal of animales) {
      if (codigos.has(animal.codigoAnimal)) {
        throw new Error(`Código duplicado en el archivo: ${animal.codigoAnimal}`);
      }
      codigos.add(animal.codigoAnimal);
    }

    await prisma.$transaction(async (tx) => {
      for (const animal of animales) {
        await tx.animal.create({
          data: {
            idGranja,
            codigoAnimal: animal.codigoAnimal,
            descripcionAnimal: animal.descripcionAnimal,
            categoriaAnimal: animal.categoriaAnimal,
          },
        });
      }
    });

    res.json({ mensaje: `Importación exitosa de ${animales.length} pienso(s)` });
  } catch (error: any) {
    console.error('Error importando piensos:', error);
    res.status(400).json({ error: error.message || 'Error al importar piensos' });
  }
}

export async function exportarAnimales(req: AnimalRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const validation = await validateGranja(idGranja, userId);
    if (sendValidationError(res, validation)) return;

    const animales = await prisma.animal.findMany({
      where: { idGranja },
      orderBy: { codigoAnimal: 'asc' },
    });

    const csv = buildCsv({
      fields: ['codigoAnimal', 'descripcionAnimal', 'categoriaAnimal', 'activo', 'fechaCreacion'],
      data: animales.map((animal) => ({
        codigoAnimal: animal.codigoAnimal,
        descripcionAnimal: animal.descripcionAnimal,
        categoriaAnimal: animal.categoriaAnimal,
        activo: animal.activo ? 'SI' : 'NO',
        fechaCreacion: animal.fechaCreacion.toISOString(),
      })),
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="piensos_${idGranja}.csv"`);
    res.send(csv);
  } catch (error: any) {
    console.error('Error exportando piensos:', error);
    res.status(500).json({ error: 'Error al exportar piensos' });
  }
}


