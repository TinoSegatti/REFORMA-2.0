/**
 * Servicio de Fórmulas
 * Gestiona la creación, actualización y recálculo de costos de fórmulas
 */

import prisma from '../lib/prisma';

/**
 * Recalcula el costo total de una fórmula
 * Se usa cuando cambia el precio de alguna materia prima
 */
export async function recalcularCostoFormula(idFormula: string) {
  // Obtener todos los detalles de la fórmula
  const detalles = await prisma.formulaDetalle.findMany({
    where: { idFormula },
    include: {
      materiaPrima: true
    }
  });

  // Recalcular costo parcial de cada detalle
  const detallesActualizados = await Promise.all(
    detalles.map(async (detalle) => {
      const precioActual = detalle.materiaPrima.precioPorKilo;
      const costoParcial = detalle.cantidadKg * precioActual;

      // Actualizar el detalle
      await prisma.formulaDetalle.update({
        where: { id: detalle.id },
        data: {
          precioUnitarioMomentoCreacion: precioActual,
          costoParcial
        }
      });

      return costoParcial;
    })
  );

  // Calcular costo total
  const costoTotalFormula = detallesActualizados.reduce((suma, costo) => suma + costo, 0);

  // Actualizar cabecera de la fórmula
  await prisma.formulaCabecera.update({
    where: { id: idFormula },
    data: {
      costoTotalFormula
    }
  });

  return costoTotalFormula;
}

/**
 * Recalcula TODAS las fórmulas que usan una materia prima específica
 * Se ejecuta cuando cambia el precio de esa materia prima
 */
export async function recalcularFormulasPorMateriaPrima(idMateriaPrima: string) {
  // Buscar todas las fórmulas que usan esta materia prima
  const formulas = await prisma.formulaCabecera.findMany({
    where: {
      formulasDetalle: {
        some: {
          idMateriaPrima
        }
      }
    },
    select: {
      id: true
    }
  });

  // Recalcular cada fórmula
  await Promise.all(
    formulas.map(formula => recalcularCostoFormula(formula.id))
  );

  return formulas.length;
}

/**
 * Crea una nueva fórmula con sus detalles
 */
export async function crearFormula(data: {
  idGranja: string;
  idAnimal: string;
  codigoFormula: string;
  descripcionFormula: string;
  detalles: Array<{
    idMateriaPrima: string;
    cantidadKg: number;
  }>;
}) {
  const { idGranja, idAnimal, codigoFormula, descripcionFormula, detalles } = data;

  // Validación estricta: total de la fórmula debe ser 1000 kg
  const totalKg = detalles.reduce((s, d) => s + Number(d.cantidadKg || 0), 0);
  if (Math.abs(totalKg - 1000) > 0.001) {
    throw new Error(`La suma de cantidades de la fórmula debe ser 1000 kg. Actual: ${totalKg}`);
  }

  // Verificar duplicado de código
  const existe = await prisma.formulaCabecera.findUnique({
    where: {
      idGranja_codigoFormula: {
        idGranja,
        codigoFormula
      }
    }
  });

  if (existe) {
    throw new Error('Ya existe una fórmula con ese código');
  }

  // Obtener precios actuales de las materias primas
  const detallesConPrecios = await Promise.all(
    detalles.map(async (detalle) => {
      const materiaPrima = await prisma.materiaPrima.findUnique({
        where: { id: detalle.idMateriaPrima }
      });

      if (!materiaPrima) {
        throw new Error(`Materia prima ${detalle.idMateriaPrima} no encontrada`);
      }

      const costoParcial = detalle.cantidadKg * materiaPrima.precioPorKilo;
      const porcentajeFormula = (detalle.cantidadKg / 1000) * 100; // Asumiendo que la fórmula completa es 1000kg

      return {
        idMateriaPrima: detalle.idMateriaPrima,
        cantidadKg: detalle.cantidadKg,
        porcentajeFormula,
        precioUnitarioMomentoCreacion: materiaPrima.precioPorKilo,
        costoParcial
      };
    })
  );

  // Calcular costo total
  const costoTotalFormula = detallesConPrecios.reduce(
    (suma, detalle) => suma + detalle.costoParcial,
    0
  );

  // Crear la fórmula
  const formula = await prisma.formulaCabecera.create({
    data: {
      idGranja,
      idAnimal,
      codigoFormula,
      descripcionFormula,
      costoTotalFormula,
      formulasDetalle: {
        create: detallesConPrecios
      }
    },
    include: {
      formulasDetalle: {
        include: {
          materiaPrima: true
        }
      }
    }
  });

  return formula;
}

/**
 * Obtiene una fórmula con todos sus detalles
 */
export async function obtenerFormula(idFormula: string) {
  return await prisma.formulaCabecera.findUnique({
    where: { id: idFormula },
    include: {
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
      },
      animal: {
        select: {
          codigoAnimal: true,
          descripcionAnimal: true
        }
      }
    }
  });
}

/**
 * Obtiene todas las fórmulas de una granja
 */
export async function obtenerFormulasGranja(idGranja: string) {
  return await prisma.formulaCabecera.findMany({
    where: { idGranja },
    include: {
      animal: true,
      _count: {
        select: {
          formulasDetalle: true
        }
      }
    },
    orderBy: {
      codigoFormula: 'asc'
    }
  });
}



