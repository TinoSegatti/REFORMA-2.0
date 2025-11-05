/**
 * Controlador de Proveedores
 * Gestiona los proveedores de cada granja
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { validateGranja, sendValidationError } from '../utils/granjaValidation';

interface ProveedorRequest extends Request {
  userId?: string;
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

    // Ejecutar todas las consultas en paralelo
    const [cantidadProveedores, comprasPorProveedor, gastosPorProveedor] = await Promise.all([
      prisma.proveedor.count({
        where: { idGranja }
      }),
      prisma.$queryRaw<any[]>`
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
        LIMIT 5
      `,
      prisma.$queryRaw<any[]>`
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

    // Convertir BigInt a Number para serialización JSON
    const comprasAdaptadas = comprasPorProveedor.map((item: any) => ({
      ...item,
      cantidad_compras: Number(item.cantidad_compras)
    }));

    const gastosAdaptados = gastosPorProveedor.map((item: any) => ({
      ...item,
      total_gastado: Number(item.total_gastado)
    }));

    res.json({
      cantidadProveedores,
      comprasPorProveedor: comprasAdaptadas,
      gastosPorProveedor: gastosAdaptados
    });
  } catch (error: any) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
}

