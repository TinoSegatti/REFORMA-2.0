import { Request, Response } from 'express';
import prisma from '../lib/prisma';

interface FormulaRequest extends Request {
  userId?: string;
}

/**
 * Agregar detalle a una fórmula existente
 */
export async function agregarDetalleFormula(req: FormulaRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja, id } = req.params;
    const { idMateriaPrima, cantidadKg } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!idMateriaPrima || !cantidadKg) {
      return res.status(400).json({ error: 'Materia prima y cantidad son requeridos' });
    }

    // Verificar que la granja pertenece al usuario
    const granja = await prisma.granja.findFirst({
      where: { id: idGranja, idUsuario: userId }
    });

    if (!granja) {
      return res.status(404).json({ error: 'Granja no encontrada' });
    }

    // Verificar que existe la fórmula
    const formula = await prisma.formulaCabecera.findFirst({
      where: { id, idGranja }
    });

    if (!formula) {
      return res.status(404).json({ error: 'Fórmula no encontrada' });
    }

    // Verificar que existe la materia prima
    const materiaPrima = await prisma.materiaPrima.findFirst({
      where: { id: idMateriaPrima, idGranja }
    });

    if (!materiaPrima) {
      return res.status(404).json({ error: 'Materia prima no encontrada' });
    }

    // Verificar que no existe ya este detalle
    const detalleExistente = await prisma.formulaDetalle.findFirst({
      where: {
        idFormula: id,
        idMateriaPrima
      }
    });

    if (detalleExistente) {
      return res.status(400).json({ error: 'Esta materia prima ya está en la fórmula' });
    }

    // Calcular porcentaje y costos
    const cantidad = parseFloat(cantidadKg);
    const porcentaje = (cantidad / formula.pesoTotalFormula) * 100;
    const precioUnitario = materiaPrima.precioPorKilo || 0;
    const costoParcial = cantidad * precioUnitario;

    // Crear detalle
    const detalle = await prisma.formulaDetalle.create({
      data: {
        idFormula: id,
        idMateriaPrima,
        cantidadKg: cantidad,
        porcentajeFormula: porcentaje,
        precioUnitarioMomentoCreacion: precioUnitario,
        costoParcial
      }
    });

    // Actualizar costo total de la fórmula
    const todosLosDetalles = await prisma.formulaDetalle.findMany({
      where: { idFormula: id }
    });

    const costoTotal = todosLosDetalles.reduce((sum, d) => sum + d.costoParcial, 0);

    await prisma.formulaCabecera.update({
      where: { id },
      data: { costoTotalFormula: costoTotal }
    });

    res.status(201).json(detalle);
  } catch (error: any) {
    console.error('Error agregando detalle:', error);
    res.status(500).json({ error: 'Error al agregar detalle' });
  }
}

/**
 * Actualizar detalle de fórmula
 */
export async function actualizarDetalleFormula(req: FormulaRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja, id, detalleId } = req.params;
    const { cantidadKg } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!cantidadKg) {
      return res.status(400).json({ error: 'Cantidad es requerida' });
    }

    // Verificar permisos
    const granja = await prisma.granja.findFirst({
      where: { id: idGranja, idUsuario: userId }
    });

    if (!granja) {
      return res.status(404).json({ error: 'Granja no encontrada' });
    }

    // Verificar que existe la fórmula
    const formula = await prisma.formulaCabecera.findFirst({
      where: { id, idGranja }
    });

    if (!formula) {
      return res.status(404).json({ error: 'Fórmula no encontrada' });
    }

    // Obtener detalle actual
    const detalleActual = await prisma.formulaDetalle.findFirst({
      where: { id: detalleId, idFormula: id },
      include: { materiaPrima: true }
    });

    if (!detalleActual) {
      return res.status(404).json({ error: 'Detalle no encontrado' });
    }

    // Actualizar
    const cantidad = parseFloat(cantidadKg);
    const porcentaje = (cantidad / formula.pesoTotalFormula) * 100;
    const precioUnitario = detalleActual.materiaPrima.precioPorKilo || 0;
    const costoParcial = cantidad * precioUnitario;

    const detalle = await prisma.formulaDetalle.update({
      where: { id: detalleId },
      data: {
        cantidadKg: cantidad,
        porcentajeFormula: porcentaje,
        costoParcial
      }
    });

    // Actualizar costo total
    const todosLosDetalles = await prisma.formulaDetalle.findMany({
      where: { idFormula: id }
    });

    const costoTotal = todosLosDetalles.reduce((sum, d) => sum + d.costoParcial, 0);

    await prisma.formulaCabecera.update({
      where: { id },
      data: { costoTotalFormula: costoTotal }
    });

    res.json(detalle);
  } catch (error: any) {
    console.error('Error actualizando detalle:', error);
    res.status(500).json({ error: 'Error al actualizar detalle' });
  }
}

/**
 * Eliminar detalle de fórmula
 */
export async function eliminarDetalleFormula(req: FormulaRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja, id, detalleId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar permisos
    const granja = await prisma.granja.findFirst({
      where: { id: idGranja, idUsuario: userId }
    });

    if (!granja) {
      return res.status(404).json({ error: 'Granja no encontrada' });
    }

    const formula = await prisma.formulaCabecera.findFirst({
      where: { id, idGranja }
    });

    if (!formula) {
      return res.status(404).json({ error: 'Fórmula no encontrada' });
    }

    // Eliminar detalle
    await prisma.formulaDetalle.delete({
      where: { id: detalleId }
    });

    // Actualizar costo total
    const todosLosDetalles = await prisma.formulaDetalle.findMany({
      where: { idFormula: id }
    });

    const costoTotal = todosLosDetalles.reduce((sum, d) => sum + d.costoParcial, 0);

    await prisma.formulaCabecera.update({
      where: { id },
      data: { costoTotalFormula: costoTotal }
    });

    res.json({ mensaje: 'Detalle eliminado exitosamente' });
  } catch (error: any) {
    console.error('Error eliminando detalle:', error);
    res.status(500).json({ error: 'Error al eliminar detalle' });
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

    const formulas = await prisma.formulaCabecera.findMany({
      where: { idGranja },
      include: {
        animal: {
          select: {
            codigoAnimal: true,
            descripcionAnimal: true,
            categoriaAnimal: true
          }
        },
        formulasDetalle: {
          include: {
            materiaPrima: {
              select: {
                codigoMateriaPrima: true,
                nombreMateriaPrima: true
              }
            }
          }
        }
      },
      orderBy: { fechaCreacion: 'desc' }
    });

    res.json(formulas);
  } catch (error: any) {
    console.error('Error obteniendo fórmulas:', error);
    res.status(500).json({ error: 'Error al obtener fórmulas' });
  }
}

/**
 * Obtener estadísticas de fórmulas
 */
export async function obtenerEstadisticasFormulas(req: FormulaRequest, res: Response) {
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

    // Contar total de fórmulas
    const totalFormulas = await prisma.formulaCabecera.count({
      where: { idGranja }
    });

    // Obtener materias primas más utilizadas (en toneladas)
    const materiasMasUtilizadas = await prisma.$queryRaw`
      SELECT 
        mp."codigoMateriaPrima" as codigo,
        mp."nombreMateriaPrima" as nombre,
        SUM(fd."cantidadKg") / 1000 as toneladas_totales
      FROM t_formula_detalle fd
      JOIN t_materia_prima mp ON fd."idMateriaPrima" = mp.id
      JOIN t_formula_cabecera fc ON fd."idFormula" = fc.id
      WHERE fc."idGranja" = ${idGranja}
      GROUP BY mp.id, mp."codigoMateriaPrima", mp."nombreMateriaPrima"
      ORDER BY toneladas_totales DESC
      LIMIT 10
    ` as Array<{
      codigo: string;
      nombre: string;
      toneladas_totales: number;
    }>;

    res.json({
      totalFormulas,
      materiasMasUtilizadas
    });
  } catch (error: any) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
}

/**
 * Crear nueva fórmula
 */
export async function crearFormula(req: FormulaRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;
    const { 
      codigoFormula, 
      descripcionFormula, 
      idAnimal, 
      pesoTotalFormula,
      detalles 
    } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!codigoFormula || !descripcionFormula || !idAnimal || !detalles || !Array.isArray(detalles)) {
      return res.status(400).json({ error: 'Datos requeridos faltantes' });
    }

    // Verificar que la granja pertenece al usuario
    const granja = await prisma.granja.findFirst({
      where: { id: idGranja, idUsuario: userId }
    });

    if (!granja) {
      return res.status(404).json({ error: 'Granja no encontrada' });
    }

    // Verificar que el animal existe
    const animal = await prisma.animal.findFirst({
      where: { id: idAnimal, idGranja }
    });

    if (!animal) {
      return res.status(404).json({ error: 'Animal no encontrado' });
    }

    // Verificar que el código no esté duplicado
    const codigoExistente = await prisma.formulaCabecera.findFirst({
      where: {
        idGranja,
        codigoFormula
      }
    });

    if (codigoExistente) {
      return res.status(400).json({ error: 'El código de fórmula ya existe' });
    }

    // Crear fórmula con detalles en una transacción
    const formula = await prisma.$transaction(async (tx) => {
      // Crear cabecera
      const nuevaFormula = await tx.formulaCabecera.create({
        data: {
          idGranja,
          idAnimal,
          codigoFormula,
          descripcionFormula,
          pesoTotalFormula: pesoTotalFormula || 1000,
          costoTotalFormula: 0 // Se calculará después
        }
      });

      // Crear detalles
      let costoTotal = 0;
      for (const detalle of detalles) {
        const { idMateriaPrima, cantidadKg, porcentajeFormula } = detalle;
        
        // Obtener precio de la materia prima
        const materiaPrima = await tx.materiaPrima.findFirst({
          where: { id: idMateriaPrima, idGranja }
        });

        if (!materiaPrima) {
          throw new Error(`Materia prima ${idMateriaPrima} no encontrada`);
        }

        const precioUnitario = materiaPrima.precioPorKilo || 0;
        const costoParcial = cantidadKg * precioUnitario;
        costoTotal += costoParcial;

        await tx.formulaDetalle.create({
          data: {
            idFormula: nuevaFormula.id,
            idMateriaPrima,
            cantidadKg,
            porcentajeFormula,
            precioUnitarioMomentoCreacion: precioUnitario,
            costoParcial
          }
        });
      }

      // Actualizar costo total
      return await tx.formulaCabecera.update({
        where: { id: nuevaFormula.id },
        data: { costoTotalFormula: costoTotal },
        include: {
          animal: {
            select: {
              codigoAnimal: true,
              descripcionAnimal: true,
              categoriaAnimal: true
            }
          },
          formulasDetalle: {
            include: {
              materiaPrima: {
                select: {
                  codigoMateriaPrima: true,
                  nombreMateriaPrima: true
                }
              }
            }
          }
        }
      });
    });

    res.status(201).json(formula);
  } catch (error: any) {
    console.error('Error creando fórmula:', error);
    res.status(500).json({ error: 'Error al crear fórmula' });
  }
}

/**
 * Obtener fórmula por ID
 */
export async function obtenerFormulaPorId(req: FormulaRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja, id } = req.params;

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

    const formula = await prisma.formulaCabecera.findFirst({
      where: { id, idGranja },
      include: {
        animal: {
          select: {
            codigoAnimal: true,
            descripcionAnimal: true,
            categoriaAnimal: true
          }
        },
        formulasDetalle: {
          include: {
            materiaPrima: {
              select: {
                codigoMateriaPrima: true,
                nombreMateriaPrima: true,
                precioPorKilo: true
              }
            }
          }
        }
      }
    });

    if (!formula) {
      return res.status(404).json({ error: 'Fórmula no encontrada' });
    }

    res.json(formula);
  } catch (error: any) {
    console.error('Error obteniendo fórmula:', error);
    res.status(500).json({ error: 'Error al obtener fórmula' });
  }
}

/**
 * Eliminar fórmula
 */
export async function eliminarFormula(req: FormulaRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja, id } = req.params;

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

    // Verificar que existe la fórmula
    const formula = await prisma.formulaCabecera.findFirst({
      where: { id, idGranja }
    });

    if (!formula) {
      return res.status(404).json({ error: 'Fórmula no encontrada' });
    }

    // Eliminar fórmula (los detalles se eliminan automáticamente por CASCADE)
    await prisma.formulaCabecera.delete({
      where: { id }
    });

    res.json({ mensaje: 'Fórmula eliminada exitosamente' });
  } catch (error: any) {
    console.error('Error eliminando fórmula:', error);
    res.status(500).json({ error: 'Error al eliminar fórmula' });
  }
}