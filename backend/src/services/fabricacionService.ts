/**
 * Servicio de Fabricaciones
 * Gestiona las fabricaciones y actualización de inventario
 */

import prisma from '../lib/prisma';
import { calcularMerma, calcularValorStock } from './inventarioService';

interface CrearFabricacionParams {
  idGranja: string;
  idUsuario: string;
  idFormula: string;
  descripcionFabricacion: string;
  cantidadFabricacion: number;
  fechaFabricacion: Date;
  observaciones?: string;
}

/**
 * Crear una nueva fabricación
 * Calcula costos basados en precios actuales de materias primas
 */
export async function crearFabricacion(params: CrearFabricacionParams) {
  const { idGranja, idUsuario, idFormula, descripcionFabricacion, cantidadFabricacion, fechaFabricacion, observaciones } = params;

  // Obtener la fórmula con sus detalles
  const formula = await prisma.formulaCabecera.findUnique({
    where: { id: idFormula },
    include: {
      formulasDetalle: {
        include: {
          materiaPrima: true
        }
      },
      granja: {
        select: {
          idUsuario: true
        }
      }
    }
  });

  if (!formula) {
    throw new Error('Fórmula no encontrada');
  }

  // Verificar que la fórmula pertenece a la granja del usuario
  if (formula.granja.idUsuario !== idUsuario) {
    throw new Error('Fórmula no pertenece a esta granja');
  }

  // Calcular costos basados en precios ACTUALES de materias primas
  const detallesFabricacion = [];
  let costoTotalFabricacion = 0;
  let tieneFaltantes = false;

  // Por cada materia prima en la fórmula
  for (const detalleFormula of formula.formulasDetalle) {
    const materiaPrima = detalleFormula.materiaPrima;
    const precioActual = materiaPrima.precioPorKilo;
    
    // Calcular cantidad de materia prima a usar
    // Ejemplo: Si la fórmula usa 500kg de materia prima para 1000kg de producto
    // y fabricamos 200kg, entonces usamos 100kg de materia prima
    const cantidadUsada = (detalleFormula.cantidadKg / 1000) * cantidadFabricacion;
    const costoParcial = cantidadUsada * precioActual;

    detallesFabricacion.push({
      idMateriaPrima: materiaPrima.id,
      cantidadUsada,
      precioUnitario: precioActual,
      costoParcial
    });

    costoTotalFabricacion += costoParcial;

    // Verificar si hay suficientes existencias
    const inventario = await prisma.inventario.findUnique({
      where: {
        idGranja_idMateriaPrima: {
          idGranja,
          idMateriaPrima: materiaPrima.id
        }
      }
    });

    if (inventario && inventario.cantidadReal < cantidadUsada) {
      tieneFaltantes = true;
    }
  }

  // Calcular costo por kilo
  const costoPorKilo = cantidadFabricacion > 0 ? costoTotalFabricacion / cantidadFabricacion : 0;

  // Crear la fabricación
  const fabricacion = await prisma.fabricacion.create({
    data: {
      idGranja,
      idUsuario,
      idFormula,
      descripcionFabricacion,
      cantidadFabricacion,
      costoTotalFabricacion,
      costoPorKilo,
      fechaFabricacion,
      observaciones,
      sinExistencias: tieneFaltantes,
      detallesFabricacion: {
        create: detallesFabricacion
      }
    },
    include: {
      detallesFabricacion: {
        include: {
          materiaPrima: {
            select: {
              codigoMateriaPrima: true,
              nombreMateriaPrima: true
            }
          }
        }
      },
      formula: {
        select: {
          codigoFormula: true,
          descripcionFormula: true
        }
      }
    }
  });

  // Actualizar inventario: descontar materias primas usadas
  for (const detalle of detallesFabricacion) {
    const inventarioActual = await prisma.inventario.findUnique({
      where: {
        idGranja_idMateriaPrima: {
          idGranja,
          idMateriaPrima: detalle.idMateriaPrima
        }
      }
    });

    if (inventarioActual) {
      // Disminuir cantidad_sistema (se calcula como compras - fabricaciones)
      const nuevaCantidadSistema = inventarioActual.cantidadSistema - detalle.cantidadUsada;
      
      // Disminuir cantidad_real (resta manual)
      const nuevaCantidadReal = inventarioActual.cantidadReal - detalle.cantidadUsada;
      
      // Calcular nuevos valores
      const merma = nuevaCantidadSistema - (nuevaCantidadReal >= 0 ? nuevaCantidadReal : 0);
      const valorStock = (nuevaCantidadReal >= 0 ? nuevaCantidadReal : 0) * inventarioActual.precioAlmacen;
      
      await prisma.inventario.update({
        where: {
          idGranja_idMateriaPrima: {
            idGranja,
            idMateriaPrima: detalle.idMateriaPrima
          }
        },
        data: {
          cantidadSistema: nuevaCantidadSistema,
          cantidadReal: nuevaCantidadReal >= 0 ? nuevaCantidadReal : 0,  // No permitir negativos
          merma,
          valorStock
        }
      });
    }
  }

  return fabricacion;
}

/**
 * Obtener fabricaciones de una granja
 */
export async function obtenerFabricacionesGranja(idGranja: string) {
  return await prisma.fabricacion.findMany({
    where: { idGranja },
    include: {
      formula: {
        select: {
          codigoFormula: true,
          descripcionFormula: true
        }
      },
      detallesFabricacion: {
        include: {
          materiaPrima: {
            select: {
              codigoMateriaPrima: true,
              nombreMateriaPrima: true
            }
          }
        }
      },
      _count: {
        select: {
          detallesFabricacion: true
        }
      }
    },
    orderBy: {
      fechaFabricacion: 'desc'
    }
  });
}

/**
 * Obtener una fabricación específica
 */
export async function obtenerFabricacion(idFabricacion: string) {
  return await prisma.fabricacion.findUnique({
    where: { id: idFabricacion },
    include: {
      formula: {
        include: {
          animal: true,
          formulasDetalle: {
            include: {
              materiaPrima: true
            }
          }
        }
      },
      detallesFabricacion: {
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
}

/**
 * Eliminar una fabricación (reversar el inventario)
 */
export async function eliminarFabricacion(idFabricacion: string) {
  const fabricacion = await prisma.fabricacion.findUnique({
    where: { id: idFabricacion },
    include: {
      detallesFabricacion: true
    }
  });

  if (!fabricacion) {
    throw new Error('Fabricación no encontrada');
  }

  // Revertir el inventario: sumar las materias primas devueltas
  for (const detalle of fabricacion.detallesFabricacion) {
    const inventarioActual = await prisma.inventario.findUnique({
      where: {
        idGranja_idMateriaPrima: {
          idGranja: fabricacion.idGranja,
          idMateriaPrima: detalle.idMateriaPrima
        }
      }
    });

    if (inventarioActual) {
      // Restaurar cantidad_sistema y cantidad_real
      const nuevaCantidadSistema = inventarioActual.cantidadSistema + detalle.cantidadUsada;
      const nuevaCantidadReal = inventarioActual.cantidadReal + detalle.cantidadUsada;
      
      // Recalcular valores
      const merma = calcularMerma(nuevaCantidadSistema, nuevaCantidadReal);
      const valorStock = calcularValorStock(nuevaCantidadReal, inventarioActual.precioAlmacen);
      
      await prisma.inventario.update({
        where: {
          idGranja_idMateriaPrima: {
            idGranja: fabricacion.idGranja,
            idMateriaPrima: detalle.idMateriaPrima
          }
        },
        data: {
          cantidadSistema: nuevaCantidadSistema,
          cantidadReal: nuevaCantidadReal,
          merma,
          valorStock
        }
      });
    }
  }

  // Eliminar fabricación
  await prisma.fabricacion.delete({
    where: { id: idFabricacion }
  });

  return { mensaje: 'Fabricación eliminada exitosamente' };
}

/**
 * Obtener estadísticas de fabricaciones
 */
export async function obtenerEstadisticasFabricaciones(idGranja: string) {
  const fabricaciones = await prisma.fabricacion.findMany({
    where: { idGranja },
    select: {
      costoTotalFabricacion: true,
      cantidadFabricacion: true,
      fechaFabricacion: true,
      sinExistencias: true
    }
  });

  return {
    totalFabricaciones: fabricaciones.length,
    totalKgFabricados: fabricaciones.reduce((suma, f) => suma + f.cantidadFabricacion, 0),
    totalCosto: fabricaciones.reduce((suma, f) => suma + f.costoTotalFabricacion, 0),
    fabricacionesSinExistencias: fabricaciones.filter(f => f.sinExistencias).length,
    promedioCostoPorKg: fabricaciones.length > 0
      ? fabricaciones.reduce((suma, f) => suma + (f.costoTotalFabricacion / f.cantidadFabricacion), 0) / fabricaciones.length
      : 0
  };
}

