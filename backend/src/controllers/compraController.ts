/**
 * Controlador de Compras
 * Gestiona las compras de materias primas
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { crearCompra, obtenerComprasGranja, obtenerGastoPorProveedor, obtenerHistorialPrecios } from '../services/compraService';

interface CompraRequest extends Request {
  userId?: string;
}

/**
 * Registrar una nueva compra
 */
export async function registrarCompra(req: CompraRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja, idProveedor, fechaCompra, observaciones, detalles } = req.body;

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

    // Validar detalles
    if (!detalles || detalles.length === 0) {
      return res.status(400).json({ error: 'Debe especificar al menos un detalle de compra' });
    }

    for (const detalle of detalles) {
      if (!detalle.idMateriaPrima || !detalle.cantidadComprada || !detalle.precioUnitario) {
        return res.status(400).json({ error: 'Cada detalle debe tener materia prima, cantidad y precio' });
      }

      if (detalle.cantidadComprada <= 0 || detalle.precioUnitario < 0) {
        return res.status(400).json({ error: 'La cantidad y precio deben ser valores válidos' });
      }
    }

    // Crear la compra
    const compra = await crearCompra({
      idGranja,
      idProveedor,
      fechaCompra: new Date(fechaCompra),
      observaciones,
      detalles
    });

    res.status(201).json(compra);
  } catch (error: any) {
    console.error('Error registrando compra:', error);
    res.status(500).json({ error: 'Error al registrar compra', detalle: error.message });
  }
}

/**
 * Obtener historial de compras de una granja
 */
export async function obtenerCompras(req: CompraRequest, res: Response) {
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

    const compras = await obtenerComprasGranja(idGranja);

    res.json(compras);
  } catch (error: any) {
    console.error('Error obteniendo compras:', error);
    res.status(500).json({ error: 'Error al obtener compras' });
  }
}

/**
 * Obtener gasto total por proveedor
 */
export async function obtenerGastosPorProveedor(req: CompraRequest, res: Response) {
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

    const gastos = await obtenerGastoPorProveedor(idGranja);

    res.json(gastos);
  } catch (error: any) {
    console.error('Error obteniendo gastos por proveedor:', error);
    res.status(500).json({ error: 'Error al obtener gastos por proveedor' });
  }
}

/**
 * Obtener historial de cambios de precio de una materia prima
 */
export async function obtenerHistorialPreciosMateriaPrima(req: CompraRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idMateriaPrima } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar que la materia prima pertenece a una granja del usuario
    const materiaPrima = await prisma.materiaPrima.findFirst({
      where: { id: idMateriaPrima },
      include: {
        granja: {
          select: {
            idUsuario: true
          }
        }
      }
    });

    if (!materiaPrima || materiaPrima.granja.idUsuario !== userId) {
      return res.status(404).json({ error: 'Materia prima no encontrada' });
    }

    const historial = await obtenerHistorialPrecios(idMateriaPrima);

    res.json(historial);
  } catch (error: any) {
    console.error('Error obteniendo historial de precios:', error);
    res.status(500).json({ error: 'Error al obtener historial de precios' });
  }
}

