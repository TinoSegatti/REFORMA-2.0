import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { actualizarPreciosTodasFormulas } from '../services/formulaService';
import { parseCsvBuffer, buildCsv } from '../utils/csvUtils';

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

export async function importarFormulas(req: FormulaRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo CSV' });
    }

    const granja = await prisma.granja.findFirst({ where: { id: idGranja, idUsuario: userId } });
    if (!granja) {
      return res.status(404).json({ error: 'Granja no encontrada' });
    }

    const existentes = await prisma.formulaCabecera.count({ where: { idGranja } });
    if (existentes > 0) {
      return res.status(400).json({ error: 'Ya existen fórmulas registradas. La importación solo está disponible en instancias vacías.' });
    }

    const { rows } = parseCsvBuffer(req.file.buffer, {
      requiredHeaders: ['tipo', 'codigoFormula'],
      optionalHeaders: [
        'descripcionFormula',
        'codigoAnimal',
        'pesoTotalFormula',
        'codigoMateriaPrima',
        'cantidadKg',
        'porcentajeFormula',
      ],
    });

    const cabecerasMap = new Map<string, {
      codigoFormula: string;
      descripcionFormula: string;
      codigoAnimal: string;
      pesoTotalFormula: number;
    }>();
    const detallesMap = new Map<string, Array<{
      codigoMateriaPrima: string;
      cantidadKg: number;
      porcentajeFormula: number;
    }>>();

    rows.forEach((row, index) => {
      const tipo = row.tipo?.trim().toUpperCase();
      const codigoFormula = row.codigoFormula?.trim();
      if (!tipo) {
        throw new Error(`Fila ${index + 2}: se requiere el campo tipo`);
      }
      if (!codigoFormula) {
        throw new Error(`Fila ${index + 2}: se requiere el campo codigoFormula`);
      }

      if (tipo === 'CABECERA' || tipo === 'FORMULA') {
        if (cabecerasMap.has(codigoFormula)) {
          throw new Error(`La fórmula ${codigoFormula} aparece duplicada en el archivo (cabecera)`);
        }

        const descripcion = row.descripcionFormula?.trim() || '';
        const codigoAnimal = row.codigoAnimal?.trim();
        if (!codigoAnimal) {
          throw new Error(`Fila ${index + 2}: la cabecera requiere el campo codigoAnimal`);
        }

        const pesoRaw = row.pesoTotalFormula?.trim();
        const peso = pesoRaw ? Number(pesoRaw) : 1000;
        if (Number.isNaN(peso) || peso <= 0) {
          throw new Error(`Fila ${index + 2}: pesoTotalFormula debe ser un número mayor a 0`);
        }

        cabecerasMap.set(codigoFormula, {
          codigoFormula,
          descripcionFormula: descripcion,
          codigoAnimal,
          pesoTotalFormula: peso,
        });
        if (!detallesMap.has(codigoFormula)) {
          detallesMap.set(codigoFormula, []);
        }
      } else if (tipo === 'DETALLE') {
        const codigoMateria = row.codigoMateriaPrima?.trim();
        if (!codigoMateria) {
          throw new Error(`Fila ${index + 2}: el detalle requiere el campo codigoMateriaPrima`);
        }
        const cantidadRaw = row.cantidadKg?.trim();
        const porcentajeRaw = row.porcentajeFormula?.trim();
        const cantidad = cantidadRaw ? Number(cantidadRaw) : NaN;
        const porcentaje = porcentajeRaw ? Number(porcentajeRaw) : NaN;
        if (Number.isNaN(cantidad) || cantidad <= 0) {
          throw new Error(`Fila ${index + 2}: cantidadKg debe ser un número mayor a 0`);
        }
        if (Number.isNaN(porcentaje)) {
          throw new Error(`Fila ${index + 2}: porcentajeFormula debe ser un número válido`);
        }

        if (!detallesMap.has(codigoFormula)) {
          detallesMap.set(codigoFormula, []);
        }
        detallesMap.get(codigoFormula)!.push({
          codigoMateriaPrima: codigoMateria,
          cantidadKg: cantidad,
          porcentajeFormula: porcentaje,
        });
      } else {
        throw new Error(`Fila ${index + 2}: tipo debe ser CABECERA o DETALLE`);
      }
    });

    if (cabecerasMap.size === 0) {
      return res.status(400).json({ error: 'El archivo no contiene cabeceras de fórmulas para importar' });
    }

    const codigosAnimales = Array.from(new Set(Array.from(cabecerasMap.values()).map((c) => c.codigoAnimal)));
    const codigosMaterias = Array.from(new Set(Array.from(detallesMap.values()).flat().map((d) => d.codigoMateriaPrima)));

    const [animales, materiasPrimas] = await Promise.all([
      prisma.animal.findMany({
        where: {
          idGranja,
          codigoAnimal: { in: codigosAnimales },
        },
      }),
      prisma.materiaPrima.findMany({
        where: {
          idGranja,
          codigoMateriaPrima: { in: codigosMaterias },
        },
      }),
    ]);

    const animalesMap = new Map(animales.map((a) => [a.codigoAnimal, a]));
    const materiasMap = new Map(materiasPrimas.map((m) => [m.codigoMateriaPrima, m]));

    codigosAnimales.forEach((codigo) => {
      if (!animalesMap.has(codigo)) {
        throw new Error(`El animal con código ${codigo} no existe en la granja`);
      }
    });

    codigosMaterias.forEach((codigo) => {
      if (!materiasMap.has(codigo)) {
        throw new Error(`La materia prima con código ${codigo} no existe en la granja`);
      }
    });

    await prisma.$transaction(async (tx) => {
      for (const [codigoFormula, cabecera] of cabecerasMap.entries()) {
        const detalles = detallesMap.get(codigoFormula) || [];
        const animal = animalesMap.get(cabecera.codigoAnimal)!;

        const formulaCreada = await tx.formulaCabecera.create({
          data: {
            idGranja,
            idAnimal: animal.id,
            codigoFormula: cabecera.codigoFormula,
            descripcionFormula: cabecera.descripcionFormula,
            pesoTotalFormula: cabecera.pesoTotalFormula,
            costoTotalFormula: 0,
          },
        });

        let costoTotalFormula = 0;

        for (const detalle of detalles) {
          const materia = materiasMap.get(detalle.codigoMateriaPrima)!;
          const precioUnitario = materia.precioPorKilo || 0;
          const costoParcial = precioUnitario * detalle.cantidadKg;
          costoTotalFormula += costoParcial;

          await tx.formulaDetalle.create({
            data: {
              idFormula: formulaCreada.id,
              idMateriaPrima: materia.id,
              cantidadKg: detalle.cantidadKg,
              porcentajeFormula: detalle.porcentajeFormula,
              precioUnitarioMomentoCreacion: precioUnitario,
              costoParcial,
            },
          });
        }

        await tx.formulaCabecera.update({
          where: { id: formulaCreada.id },
          data: { costoTotalFormula },
        });
      }
    });

    res.json({ mensaje: `Importación exitosa de ${cabecerasMap.size} fórmula(s)` });
  } catch (error: any) {
    console.error('Error importando fórmulas:', error);
    res.status(400).json({ error: error.message || 'Error al importar fórmulas' });
  }
}

export async function exportarFormulas(req: FormulaRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const granja = await prisma.granja.findFirst({ where: { id: idGranja, idUsuario: userId } });
    if (!granja) {
      return res.status(404).json({ error: 'Granja no encontrada' });
    }

    const formulas = await prisma.formulaCabecera.findMany({
      where: { idGranja },
      orderBy: { codigoFormula: 'asc' },
      include: {
        animal: true,
        formulasDetalle: {
          include: {
            materiaPrima: true,
          },
        },
      },
    });

    const filas = [] as Array<Record<string, any>>;

    for (const formula of formulas) {
      filas.push({
        tipo: 'CABECERA',
        codigoFormula: formula.codigoFormula,
        descripcionFormula: formula.descripcionFormula,
        codigoAnimal: formula.animal?.codigoAnimal ?? '',
        descripcionAnimal: formula.animal?.descripcionAnimal ?? '',
        categoriaAnimal: formula.animal?.categoriaAnimal ?? '',
        pesoTotalFormula: formula.pesoTotalFormula,
        costoTotalFormula: formula.costoTotalFormula,
        fechaCreacion: formula.fechaCreacion.toISOString(),
      });

      for (const detalle of formula.formulasDetalle) {
        filas.push({
          tipo: 'DETALLE',
          codigoFormula: formula.codigoFormula,
          codigoMateriaPrima: detalle.materiaPrima?.codigoMateriaPrima ?? '',
          nombreMateriaPrima: detalle.materiaPrima?.nombreMateriaPrima ?? '',
          cantidadKg: detalle.cantidadKg,
          porcentajeFormula: detalle.porcentajeFormula,
          precioUnitarioMomentoCreacion: detalle.precioUnitarioMomentoCreacion,
          costoParcial: detalle.costoParcial,
        });
      }
    }

    const csv = buildCsv({
      fields: [
        'tipo',
        'codigoFormula',
        'descripcionFormula',
        'codigoAnimal',
        'descripcionAnimal',
        'categoriaAnimal',
        'pesoTotalFormula',
        'costoTotalFormula',
        'fechaCreacion',
        'codigoMateriaPrima',
        'nombreMateriaPrima',
        'cantidadKg',
        'porcentajeFormula',
        'precioUnitarioMomentoCreacion',
        'costoParcial',
      ],
      data: filas,
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="formulas_${idGranja}.csv"`);
    res.send(csv);
  } catch (error: any) {
    console.error('Error exportando fórmulas:', error);
    res.status(500).json({ error: 'Error al exportar fórmulas' });
  }
}