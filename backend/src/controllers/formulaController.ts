/**
 * Controlador de Fórmulas
 * Gestiona las fórmulas de alimentación
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { crearFormula, obtenerFormula, obtenerFormulasGranja, recalcularCostoFormula } from '../services/formulaService';

interface FormulaRequest extends Request {
  userId?: string;
}

/**
 * Crear una nueva fórmula
 */
export async function crearNuevaFormula(req: FormulaRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja, idAnimal, codigoFormula, descripcionFormula, detalles } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!codigoFormula || !descripcionFormula || !detalles || detalles.length === 0) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Verificar que la granja pertenece al usuario
    const granja = await prisma.granja.findFirst({
      where: { id: idGranja, idUsuario: userId }
    });

    if (!granja) {
      return res.status(404).json({ error: 'Granja no encontrada' });
    }

    // Validar que todas las materias primas existen y pertenecen a la granja
    for (const detalle of detalles) {
      const materiaPrima = await prisma.materiaPrima.findFirst({
        where: { 
          id: detalle.idMateriaPrima,
          idGranja
        }
      });

      if (!materiaPrima) {
        return res.status(404).json({ error: `Materia prima ${detalle.idMateriaPrima} no encontrada en esta granja` });
      }

      if (detalle.cantidadKg <= 0) {
        return res.status(400).json({ error: 'La cantidad en kg debe ser mayor a 0' });
      }
    }

    // Crear la fórmula
    const formula = await crearFormula({
      idGranja,
      idAnimal,
      codigoFormula,
      descripcionFormula,
      detalles
    });

    res.status(201).json(formula);
  } catch (error: any) {
    console.error('Error creando fórmula:', error);
    res.status(500).json({ error: 'Error al crear fórmula', detalle: error.message });
  }
}

/**
 * Obtener todas las fórmulas de una granja
 */
export async function obtenerFormulas(req: FormulaRequest, res: Response) {
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

    const formulas = await obtenerFormulasGranja(idGranja);

    res.json(formulas);
  } catch (error: any) {
    console.error('Error obteniendo fórmulas:', error);
    res.status(500).json({ error: 'Error al obtener fórmulas' });
  }
}

/**
 * Obtener una fórmula específica con sus detalles
 */
export async function obtenerFormulaDetalle(req: FormulaRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idFormula } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const formula = await obtenerFormula(idFormula);

    if (!formula) {
      return res.status(404).json({ error: 'Fórmula no encontrada' });
    }

    // Verificar que la fórmula pertenece a una granja del usuario
    const granja = await prisma.granja.findFirst({
      where: { id: formula.idGranja, idUsuario: userId }
    });

    if (!granja) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    res.json(formula);
  } catch (error: any) {
    console.error('Error obteniendo fórmula:', error);
    res.status(500).json({ error: 'Error al obtener fórmula' });
  }
}

/**
 * Recalcular costo de una fórmula
 */
export async function recalcularFormula(req: FormulaRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idFormula } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar que la fórmula existe y pertenece al usuario
    const formula = await prisma.formulaCabecera.findUnique({
      where: { id: idFormula },
      include: {
        granja: {
          select: {
            idUsuario: true
          }
        }
      }
    });

    if (!formula) {
      return res.status(404).json({ error: 'Fórmula no encontrada' });
    }

    if (formula.granja.idUsuario !== userId) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const costoTotal = await recalcularCostoFormula(idFormula);

    res.json({
      mensaje: 'Fórmula recalculada exitosamente',
      costoTotal
    });
  } catch (error: any) {
    console.error('Error recalculando fórmula:', error);
    res.status(500).json({ error: 'Error al recalcular fórmula' });
  }
}

/**
 * Actualizar una fórmula
 */
export async function actualizarFormula(req: FormulaRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idFormula } = req.params;
    const { descripcionFormula, codigoFormula, idAnimal, detalles } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar que la fórmula existe y pertenece al usuario
    const formula = await prisma.formulaCabecera.findUnique({
      where: { id: idFormula },
      include: {
        granja: {
          select: {
            idUsuario: true
          }
        }
      }
    });

    if (!formula) {
      return res.status(404).json({ error: 'Fórmula no encontrada' });
    }

    if (formula.granja.idUsuario !== userId) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // Actualizar datos básicos
    const formulaActualizada = await prisma.formulaCabecera.update({
      where: { id: idFormula },
      data: {
        descripcionFormula,
        codigoFormula,
        idAnimal
      }
    });

    // Si hay nuevos detalles, actualizarlos
    if (detalles && detalles.length > 0) {
      // Eliminar detalles antiguos
      await prisma.formulaDetalle.deleteMany({
        where: { idFormula }
      });

      // Crear nuevos detalles
      for (const detalle of detalles) {
        const materiaPrima = await prisma.materiaPrima.findUnique({
          where: { id: detalle.idMateriaPrima }
        });

        if (materiaPrima) {
          await prisma.formulaDetalle.create({
            data: {
              idFormula,
              idMateriaPrima: detalle.idMateriaPrima,
              cantidadKg: detalle.cantidadKg,
              porcentajeFormula: (detalle.cantidadKg / 1000) * 100,
              precioUnitarioMomentoCreacion: materiaPrima.precioPorKilo,
              costoParcial: detalle.cantidadKg * materiaPrima.precioPorKilo
            }
          });
        }
      }

      // Recalcular costo total
      await recalcularCostoFormula(idFormula);
    }

    res.json(formulaActualizada);
  } catch (error: any) {
    console.error('Error actualizando fórmula:', error);
    res.status(500).json({ error: 'Error al actualizar fórmula' });
  }
}

/**
 * Eliminar una fórmula
 */
export async function eliminarFormula(req: FormulaRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idFormula } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar que la fórmula existe y pertenece al usuario
    const formula = await prisma.formulaCabecera.findUnique({
      where: { id: idFormula },
      include: {
        granja: {
          select: {
            idUsuario: true
          }
        }
      }
    });

    if (!formula) {
      return res.status(404).json({ error: 'Fórmula no encontrada' });
    }

    if (formula.granja.idUsuario !== userId) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // Verificar si tiene fabricaciones
    const fabricacionesCount = await prisma.fabricacion.count({
      where: { idFormula }
    });

    if (fabricacionesCount > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar una fórmula que tiene fabricaciones asociadas',
        fabricaciones: fabricacionesCount
      });
    }

    // Eliminar fórmula (soft delete)
    await prisma.formulaCabecera.update({
      where: { id: idFormula },
      data: { activa: false }
    });

    res.json({ mensaje: 'Fórmula eliminada exitosamente' });
  } catch (error: any) {
    console.error('Error eliminando fórmula:', error);
    res.status(500).json({ error: 'Error al eliminar fórmula' });
  }
}

