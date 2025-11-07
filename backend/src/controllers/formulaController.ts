import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { actualizarPreciosTodasFormulas } from '../services/formulaService';

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
 * Agregar múltiples detalles de fórmula en un solo insert
 */
export async function agregarMultiplesDetallesFormula(req: FormulaRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja, id } = req.params;
    const { detalles } = req.body; // Array de { idMateriaPrima, cantidadKg }

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!detalles || !Array.isArray(detalles) || detalles.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de detalles' });
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

    // Validar que no haya duplicados en el array de detalles
    const idsMateriasPrimas = detalles.map((d: any) => d.idMateriaPrima);
    const idsUnicos = new Set(idsMateriasPrimas);
    if (idsUnicos.size !== idsMateriasPrimas.length) {
      return res.status(400).json({ error: 'No se pueden agregar materias primas duplicadas en el mismo lote' });
    }

    // Verificar que no existan ya estos detalles
    const detallesExistentes = await prisma.formulaDetalle.findMany({
      where: {
        idFormula: id,
        idMateriaPrima: { in: idsMateriasPrimas }
      }
    });

    if (detallesExistentes.length > 0) {
      const mpDuplicadas = detallesExistentes.map(d => d.idMateriaPrima);
      return res.status(400).json({ 
        error: `Las siguientes materias primas ya están en la fórmula: ${mpDuplicadas.join(', ')}` 
      });
    }

    // Obtener materias primas y calcular detalles
    const detallesConPrecios = await Promise.all(
      detalles.map(async (detalle: any) => {
        const materiaPrima = await prisma.materiaPrima.findFirst({
          where: { id: detalle.idMateriaPrima, idGranja }
        });

        if (!materiaPrima) {
          throw new Error(`Materia prima ${detalle.idMateriaPrima} no encontrada`);
        }

        const cantidad = parseFloat(detalle.cantidadKg);
        const porcentaje = (cantidad / formula.pesoTotalFormula) * 100;
        const precioUnitario = materiaPrima.precioPorKilo || 0;
        const costoParcial = cantidad * precioUnitario;

        return {
          idFormula: id,
          idMateriaPrima: detalle.idMateriaPrima,
          cantidadKg: cantidad,
          porcentajeFormula: porcentaje,
          precioUnitarioMomentoCreacion: precioUnitario,
          costoParcial
        };
      })
    );

    // Crear todos los detalles en una transacción
    const detallesCreados = await prisma.formulaDetalle.createMany({
      data: detallesConPrecios
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

    res.status(201).json({ 
      mensaje: `${detallesCreados.count} detalles agregados exitosamente`,
      agregados: detallesCreados.count
    });
  } catch (error: any) {
    console.error('Error agregando múltiples detalles:', error);
    res.status(500).json({ error: error.message || 'Error al agregar detalles' });
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
            id: true,
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
 * Actualizar cabecera de fórmula
 */
export async function actualizarFormula(req: FormulaRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja, id } = req.params;
    const { codigoFormula, descripcionFormula, idAnimal } = req.body;

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

    // Si se está actualizando el código, verificar que no esté duplicado
    if (codigoFormula && codigoFormula !== formula.codigoFormula) {
      const existe = await prisma.formulaCabecera.findUnique({
        where: {
          idGranja_codigoFormula: {
            idGranja,
            codigoFormula
          }
        }
      });

      if (existe) {
        return res.status(400).json({ error: 'Ya existe una fórmula con ese código' });
      }
    }

    // Si se está actualizando el animal, verificar que existe
    if (idAnimal) {
      const animal = await prisma.animal.findFirst({
        where: { id: idAnimal, idGranja }
      });

      if (!animal) {
        return res.status(404).json({ error: 'Animal no encontrado' });
      }
    }

    // Actualizar la fórmula
    const formulaActualizada = await prisma.formulaCabecera.update({
      where: { id },
      data: {
        ...(codigoFormula && { codigoFormula }),
        ...(descripcionFormula !== undefined && { descripcionFormula }),
        ...(idAnimal && { idAnimal }),
      },
      include: {
        animal: {
          select: {
            id: true,
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

    res.json(formulaActualizada);
  } catch (error: any) {
    console.error('Error actualizando fórmula:', error);
    res.status(500).json({ error: 'Error al actualizar fórmula' });
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

/**
 * Actualizar precios de todas las fórmulas de una granja
 * Recalcula los costos basándose en los precios actuales de las materias primas
 */
export async function actualizarPreciosFormulas(req: FormulaRequest, res: Response) {
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

    // Actualizar precios de todas las fórmulas
    const resultado = await actualizarPreciosTodasFormulas(idGranja);

    res.json(resultado);
  } catch (error: any) {
    console.error('Error actualizando precios de fórmulas:', error);
    res.status(500).json({ error: 'Error al actualizar precios de fórmulas', detalle: error.message });
  }
}