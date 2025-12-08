/**
 * Controlador de Proveedores
 * Gestiona los proveedores de cada granja
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { validateGranja, sendValidationError } from '../utils/granjaValidation';
import { parseCsvBuffer, buildCsv } from '../utils/csvUtils';
import { withRetryAll } from '../utils/prismaRetry';

interface ProveedorRequest extends Omit<Request, 'file'> {
  userId?: string;
  file?: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  };
}

/**
 * Obtener todos los proveedores de una granja
 */
export async function obtenerProveedores(req: ProveedorRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar que la granja pertenece al usuario (con caché)
    const validation = await validateGranja(idGranja, userId);
    if (sendValidationError(res, validation)) return;

    const proveedores = await prisma.proveedor.findMany({
      where: { idGranja },
      orderBy: { nombreProveedor: 'asc' }
    });

    res.json(proveedores);
  } catch (error: any) {
    console.error('Error obteniendo proveedores:', error);
    res.status(500).json({ error: 'Error al obtener proveedores' });
  }
}

/**
 * Crear nuevo proveedor
 */
export async function crearProveedor(req: ProveedorRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;
    const { codigoProveedor, nombreProveedor, direccionProveedor, localidadProveedor } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!codigoProveedor || !nombreProveedor) {
      return res.status(400).json({ error: 'Código y nombre son requeridos' });
    }

    // Verificar que la granja pertenece al usuario (con caché)
    const validation = await validateGranja(idGranja, userId);
    if (sendValidationError(res, validation)) return;

    // Verificar que el código no esté duplicado
    const codigoExistente = await prisma.proveedor.findFirst({
      where: {
        idGranja,
        codigoProveedor
      }
    });

    if (codigoExistente) {
      return res.status(400).json({ error: 'El código de proveedor ya existe' });
    }

    // Crear el proveedor
    const proveedor = await prisma.proveedor.create({
      data: {
        idGranja,
        codigoProveedor,
        nombreProveedor,
        direccion: direccionProveedor,
        localidad: localidadProveedor
      }
    });

    res.status(201).json(proveedor);
  } catch (error: any) {
    // Si el error es por constraint único (duplicado)
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El código de proveedor ya existe' });
    }
    console.error('Error creando proveedor:', error);
    res.status(500).json({ error: 'Error al crear proveedor' });
  }
}

/**
 * Actualizar proveedor
 */
export async function actualizarProveedor(req: ProveedorRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja, id } = req.params;
    const { codigoProveedor, nombreProveedor, direccionProveedor, localidadProveedor } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!codigoProveedor || !nombreProveedor) {
      return res.status(400).json({ error: 'Código y nombre son requeridos' });
    }

    // Verificar que la granja pertenece al usuario (con caché)
    const validation = await validateGranja(idGranja, userId);
    if (sendValidationError(res, validation)) return;

    // Verificar que existe el proveedor y el código no esté duplicado en paralelo
    const [proveedorExistente, codigoExistente] = await Promise.all([
      prisma.proveedor.findFirst({
        where: { id, idGranja }
      }),
      prisma.proveedor.findFirst({
        where: {
          idGranja,
          codigoProveedor,
          id: { not: id }
        }
      })
    ]);

    if (!proveedorExistente) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    if (codigoExistente) {
      return res.status(400).json({ error: 'El código de proveedor ya existe' });
    }

    const proveedor = await prisma.proveedor.update({
      where: { id },
      data: {
        codigoProveedor,
        nombreProveedor,
        direccion: direccionProveedor,
        localidad: localidadProveedor
      }
    });

    res.json(proveedor);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El código de proveedor ya existe' });
    }
    console.error('Error actualizando proveedor:', error);
    res.status(500).json({ error: 'Error al actualizar proveedor' });
  }
}

/**
 * Eliminar proveedor
 */
export async function eliminarProveedor(req: ProveedorRequest, res: Response) {
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
    await prisma.proveedor.delete({
      where: { id }
    }).catch((error: any) => {
      if (error.code === 'P2025') {
        throw new Error('Proveedor no encontrado');
      }
      throw error;
    });

    res.json({ mensaje: 'Proveedor eliminado exitosamente' });
  } catch (error: any) {
    if (error.message === 'Proveedor no encontrado') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error eliminando proveedor:', error);
    res.status(500).json({ error: 'Error al eliminar proveedor' });
  }
}

export async function importarProveedores(req: ProveedorRequest, res: Response) {
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
      requiredHeaders: ['codigoProveedor', 'nombreProveedor'],
      optionalHeaders: ['direccion', 'localidad'],
    });

    const proveedores = rows.map((row, index) => {
      const codigo = row.codigoProveedor?.trim();
      const nombre = row.nombreProveedor?.trim();

      if (!codigo || !nombre) {
        throw new Error(`Fila ${index + 2}: se requieren codigoProveedor y nombreProveedor`);
      }

      return {
        codigoProveedor: codigo,
        nombreProveedor: nombre,
        direccion: row.direccion?.trim() || null,
        localidad: row.localidad?.trim() || null,
      };
    });

    const codigos = new Set<string>();
    for (const proveedor of proveedores) {
      if (codigos.has(proveedor.codigoProveedor)) {
        throw new Error(`Código duplicado en el archivo: ${proveedor.codigoProveedor}`);
      }
      codigos.add(proveedor.codigoProveedor);
    }

    await prisma.proveedor.createMany({
      data: proveedores.map((proveedor) => ({
        idGranja,
        codigoProveedor: proveedor.codigoProveedor,
        nombreProveedor: proveedor.nombreProveedor,
        direccion: proveedor.direccion || undefined,
        localidad: proveedor.localidad || undefined,
      })),
    });

    res.json({ mensaje: `Importación exitosa de ${proveedores.length} proveedor(es)` });
  } catch (error: any) {
    console.error('Error importando proveedores:', error);
    res.status(400).json({ error: error.message || 'Error al importar proveedores' });
  }
}

export async function exportarProveedores(req: ProveedorRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const validation = await validateGranja(idGranja, userId);
    if (sendValidationError(res, validation)) return;

    const proveedores = await prisma.proveedor.findMany({
      where: { idGranja },
      orderBy: { codigoProveedor: 'asc' },
    });

    const csv = buildCsv({
      fields: ['codigoProveedor', 'nombreProveedor', 'direccion', 'localidad', 'activo', 'fechaCreacion'],
      data: proveedores.map((p) => ({
        codigoProveedor: p.codigoProveedor,
        nombreProveedor: p.nombreProveedor,
        direccion: p.direccion ?? '',
        localidad: p.localidad ?? '',
        activo: p.activo ? 'SI' : 'NO',
        fechaCreacion: p.fechaCreacion.toISOString(),
      })),
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="proveedores_${idGranja}.csv"`);
    res.send(csv);
  } catch (error: any) {
    console.error('Error exportando proveedores:', error);
    res.status(500).json({ error: 'Error al exportar proveedores' });
  }
}

/**
 * Obtener estadísticas de proveedores
 */
export async function obtenerEstadisticasProveedores(req: ProveedorRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar que la granja pertenece al usuario (con caché)
    const validation = await validateGranja(idGranja, userId);
    if (sendValidationError(res, validation)) return;

    // Ejecutar todas las consultas en paralelo con retry automático para errores de conexión
    const [cantidadProveedores, comprasPorProveedorRaw, gastosPorProveedorRaw] = await withRetryAll([
      () => prisma.proveedor.count({
        where: { idGranja }
      }),
      () => prisma.$queryRaw<any[]>`
        SELECT 
          p.id,
          p."codigoProveedor" as codigo_proveedor,
          p."nombreProveedor" as nombre_proveedor,
          COUNT(cc.id) as cantidad_compras
        FROM t_proveedor p
        LEFT JOIN t_compra_cabecera cc ON p.id = cc."idProveedor"
        WHERE p."idGranja" = ${idGranja}
        GROUP BY p.id, p."codigoProveedor", p."nombreProveedor"
        ORDER BY cantidad_compras DESC
      `,
      () => prisma.$queryRaw<any[]>`
        SELECT 
          p.id,
          p."codigoProveedor" as codigo_proveedor,
          p."nombreProveedor" as nombre_proveedor,
          COALESCE(SUM(cc."totalFactura"), 0) as total_gastado
        FROM t_proveedor p
        LEFT JOIN t_compra_cabecera cc ON p.id = cc."idProveedor"
        WHERE p."idGranja" = ${idGranja}
        GROUP BY p.id, p."codigoProveedor", p."nombreProveedor"
        ORDER BY total_gastado DESC
      `
    ]);

    // Adaptar datos con camelCase y números
    const comprasAdaptadas = comprasPorProveedorRaw.map((item: any) => ({
      id: item.id,
      codigoProveedor: item.codigo_proveedor,
      nombreProveedor: item.nombre_proveedor,
      cantidadCompras: Number(item.cantidad_compras)
    }));

    const gastosAdaptados = gastosPorProveedorRaw.map((item: any) => ({
      id: item.id,
      codigoProveedor: item.codigo_proveedor,
      nombreProveedor: item.nombre_proveedor,
      totalGastado: Number(item.total_gastado)
    }));

    // Top 9 proveedores con más compras + columna "Otros"
    const topCompras = (() => {
      if (comprasAdaptadas.length === 0) return [];
      const top9 = comprasAdaptadas.slice(0, 9);
      const resto = comprasAdaptadas.slice(9);
      const totalResto = resto.reduce((sum, item) => sum + item.cantidadCompras, 0);

      return totalResto > 0
        ? [
            ...top9,
            {
              id: 'OTROS',
              codigoProveedor: 'OTROS',
              nombreProveedor: 'Otros Proveedores',
              cantidadCompras: totalResto
            }
          ]
        : top9;
    })();

    // Top 10 proveedores con mayor gasto
    const topGasto = gastosAdaptados.slice(0, 10);

    res.json({
      cantidadProveedores,
      proveedoresConMasCompras: topCompras,
      proveedoresConMasGasto: topGasto
    });
  } catch (error: any) {
    console.error('Error obteniendo estadísticas:', error);
    
    // Manejar errores de conexión específicamente
    if (error.code === 'P1001' || error.message?.includes("Can't reach database") || error.message?.includes('conexión')) {
      return res.status(503).json({ 
        error: 'Error de conexión a la base de datos',
        message: 'No se puede conectar al servidor de base de datos. Por favor, verifica que el proyecto de Supabase esté activo.',
        code: 'DATABASE_CONNECTION_ERROR'
      });
    }
    
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
}