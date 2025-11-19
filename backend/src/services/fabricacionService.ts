/**
 * Servicio de Fabricaciones
 * Gestiona las fabricaciones y actualización de inventario
 */

import prisma from '../lib/prisma';
import { recalcularInventario } from './inventarioService';
import { registrarAuditoria } from './auditoriaService';
import { TablaOrigen } from '@prisma/client';

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

  // Interpretar cantidadFabricacion como "veces". 1 vez = 1000 kg de producto
  const cantidadProductoKg = cantidadFabricacion * 1000;

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
    const cantidadUsada = (detalleFormula.cantidadKg / 1000) * cantidadProductoKg;
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

  // Calcular costo por kilo sobre el total producido en kg
  const costoPorKilo = cantidadProductoKg > 0 ? costoTotalFabricacion / cantidadProductoKg : 0;

  // Crear la fabricación
  const fabricacion = await prisma.fabricacion.create({
    data: {
      idGranja,
      idUsuario,
      idFormula,
      descripcionFabricacion,
      cantidadFabricacion: cantidadProductoKg,
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

  // Actualizar inventario: recalcular para todas las materias primas usadas
  // Esto asegura que cantidad_sistema = cantidad_acumulada - fabricaciones
  // y preserva los ajustes manuales de cantidad_real
  const materiasPrimasUsadas = new Set(detallesFabricacion.map(d => d.idMateriaPrima));
  
  for (const idMateriaPrima of materiasPrimasUsadas) {
    await recalcularInventario({ idGranja, idMateriaPrima });
  }

  return fabricacion;
}

/**
 * Obtener fabricaciones de una granja con filtros
 */
export async function obtenerFabricacionesGranja(idGranja: string, filters?: {
  desde?: string;
  hasta?: string;
  descripcionFormula?: string;
  incluirEliminadas?: boolean;
}) {
  const where: any = { idGranja };

  // Filtro por fecha
  if (filters?.desde || filters?.hasta) {
    where.fechaFabricacion = {};
    
    if (filters.desde) {
      const desdeDate = new Date(filters.desde);
      desdeDate.setUTCHours(0, 0, 0, 0);
      where.fechaFabricacion.gte = desdeDate;
    }
    
    if (filters.hasta) {
      const hastaDate = new Date(filters.hasta);
      hastaDate.setUTCHours(23, 59, 59, 999);
      where.fechaFabricacion.lte = hastaDate;
    }
  }

  // Filtro por descripción de fórmula
  if (filters?.descripcionFormula) {
    where.formula = {
      descripcionFormula: { contains: filters.descripcionFormula, mode: 'insensitive' }
    };
  }

  // Las fabricaciones ahora se eliminan permanentemente, no hay filtro por activo
  const whereFinal = where;

  const fabricaciones = await prisma.fabricacion.findMany({
    where: whereFinal,
    include: {
      formula: {
        select: {
          id: true,
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

  // Mapear para incluir idFormula directamente en cada fabricación
  return fabricaciones.map(f => ({
    ...f,
    idFormula: f.formula.id
  }));
}

/**
 * Obtener una fabricación específica
 */
export async function obtenerFabricacion(idFabricacion: string) {
  const fabricacion = await prisma.fabricacion.findUnique({
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

  if (!fabricacion) return null;

  // Mapear para incluir idFormula directamente
  return {
    ...fabricacion,
    idFormula: fabricacion.formula.id
  };
}

/**
 * Editar una fabricación (recalcular inventario)
 */
export async function editarFabricacion(idFabricacion: string, params: Partial<CrearFabricacionParams>) {
  const fabricacionActual = await prisma.fabricacion.findUnique({
    where: { id: idFabricacion },
    include: {
      detallesFabricacion: true,
      formula: {
        include: {
          formulasDetalle: {
            include: {
              materiaPrima: true
            }
          }
        }
      }
    }
  });

  if (!fabricacionActual) {
    throw new Error('Fabricación no encontrada');
  }

  // Guardar MPs anteriores para recalcular luego de la actualización
  const materiasPrimasAnteriores = new Set(fabricacionActual.detallesFabricacion.map(d => d.idMateriaPrima));

  // Obtener valores a actualizar (usar valores existentes si no se proporcionan)
  const idFormula = params.idFormula || fabricacionActual.idFormula;
  const descripcionFabricacion = params.descripcionFabricacion ?? fabricacionActual.descripcionFabricacion;
  const cantidadFabricacion = params.cantidadFabricacion ?? fabricacionActual.cantidadFabricacion;
  const fechaFabricacion = params.fechaFabricacion || fabricacionActual.fechaFabricacion;
  const observaciones = params.observaciones ?? fabricacionActual.observaciones;

  // Obtener la fórmula con sus detalles
  const formula = await prisma.formulaCabecera.findUnique({
    where: { id: idFormula },
    include: {
      formulasDetalle: {
        include: {
          materiaPrima: true
        }
      }
    }
  });

  if (!formula) {
    throw new Error('Fórmula no encontrada');
  }

  // Interpretar cantidadFabricacion como "veces". 1 vez = 1000 kg de producto
  const cantidadProductoKg = cantidadFabricacion * 1000;

  // Recalcular costos basados en precios ACTUALES de materias primas
  const nuevosDetalles = [];
  let costoTotalFabricacion = 0;
  let tieneFaltantes = false;

  for (const detalleFormula of formula.formulasDetalle) {
    const materiaPrima = detalleFormula.materiaPrima;
    const precioActual = materiaPrima.precioPorKilo;
    
    const cantidadUsada = (detalleFormula.cantidadKg / 1000) * cantidadProductoKg;
    const costoParcial = cantidadUsada * precioActual;

    nuevosDetalles.push({
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
          idGranja: fabricacionActual.idGranja,
          idMateriaPrima: materiaPrima.id
        }
      }
    });

    if (inventario && inventario.cantidadReal < cantidadUsada) {
      tieneFaltantes = true;
    }
  }

  const costoPorKilo = cantidadProductoKg > 0 ? costoTotalFabricacion / cantidadProductoKg : 0;

  // Eliminar detalles antiguos
  await prisma.detalleFabricacion.deleteMany({
    where: { idFabricacion }
  });

  // Actualizar fabricación
  const fabricacionActualizada = await prisma.fabricacion.update({
    where: { id: idFabricacion },
    data: {
      idFormula,
      descripcionFabricacion,
      cantidadFabricacion: cantidadProductoKg,
      costoTotalFabricacion,
      costoPorKilo,
      fechaFabricacion,
      observaciones,
      sinExistencias: tieneFaltantes,
      detallesFabricacion: {
        create: nuevosDetalles
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

  // Recalcular inventario para MPs anteriores y nuevas (unión)
  const materiasPrimasNuevas = new Set(nuevosDetalles.map(d => d.idMateriaPrima));
  const unionMPs = new Set<string>([...materiasPrimasAnteriores, ...materiasPrimasNuevas]);
  for (const idMateriaPrima of unionMPs) {
    await recalcularInventario({ idGranja: fabricacionActual.idGranja, idMateriaPrima });
  }

  return fabricacionActualizada;
}

/**
 * Eliminar una fabricación (reversar el inventario)
 */
/**
 * Eliminar una fabricación PERMANENTEMENTE
 * Restaura las cantidades en inventario y elimina la fabricación de forma permanente
 */
export async function eliminarFabricacion(idFabricacion: string, idUsuario: string) {
  const fabricacion = await prisma.fabricacion.findUnique({
    where: { id: idFabricacion },
    include: {
      detallesFabricacion: true
    }
  });

  if (!fabricacion) {
    throw new Error('Fabricación no encontrada');
  }

  // Guardar las materias primas afectadas ANTES de eliminar
  const materiasPrimasUsadas = new Set(fabricacion.detallesFabricacion.map(d => d.idMateriaPrima));
  const idGranja = fabricacion.idGranja;
  const fabricacionAnterior = { ...fabricacion };

  // Registrar en auditoría ANTES de eliminar
  await registrarAuditoria({
    idUsuario,
    idGranja: fabricacion.idGranja,
    tablaOrigen: TablaOrigen.FABRICACION,
    idRegistro: idFabricacion,
    accion: 'DELETE',
    descripcion: `Fabricación eliminada permanentemente: ${fabricacion.descripcionFabricacion}`,
    datosAnteriores: fabricacionAnterior,
  });

  // IMPORTANTE: Recalcular el inventario ANTES de eliminar
  // Esto restaura las cantidades sumando de vuelta lo que se había restado
  for (const idMateriaPrima of materiasPrimasUsadas) {
    await recalcularInventario({ idGranja, idMateriaPrima });
  }

  // Eliminar permanentemente (hard delete)
  // Primero eliminar detalles, luego la cabecera
  await prisma.detalleFabricacion.deleteMany({
    where: { idFabricacion }
  });

  await prisma.fabricacion.delete({
    where: { id: idFabricacion }
  });

  return { mensaje: 'Fabricación eliminada permanentemente. Las cantidades en inventario han sido restauradas.' };
}

/**
 * Eliminar TODAS las fabricaciones de una granja PERMANENTEMENTE
 * Solo para administradores
 * Restaura las cantidades en inventario y elimina todas las fabricaciones de forma permanente
 */
export async function eliminarTodasLasFabricaciones(idGranja: string, idUsuario: string) {
  // Obtener todas las fabricaciones activas de la granja
  const fabricaciones = await prisma.fabricacion.findMany({
    where: { 
      idGranja,
      activo: true
    },
    include: {
      detallesFabricacion: true
    }
  });

  // Guardar todas las materias primas afectadas
  const materiasPrimasAfectadas = new Set<string>();
  for (const fabricacion of fabricaciones) {
    for (const detalle of fabricacion.detallesFabricacion) {
      materiasPrimasAfectadas.add(detalle.idMateriaPrima);
    }
  }

  const cantidadEliminadas = fabricaciones.length;

  // Registrar en auditoría ANTES de eliminar
  await registrarAuditoria({
    idUsuario,
    idGranja,
    tablaOrigen: TablaOrigen.FABRICACION,
    idRegistro: 'BULK',
    accion: 'BULK_DELETE',
    descripcion: `Eliminación masiva permanente de ${cantidadEliminadas} fabricaciones`,
  });

  // Recalcular inventario para todas las materias primas afectadas ANTES de eliminar
  // Esto restaurará las cantidades sumando de vuelta lo que se había restado
  for (const idMateriaPrima of materiasPrimasAfectadas) {
    await recalcularInventario({ idGranja, idMateriaPrima });
  }

  // Eliminar permanentemente (hard delete)
  // Primero eliminar detalles, luego las cabeceras
  const idsFabricaciones = fabricaciones.map(f => f.id);
  await prisma.detalleFabricacion.deleteMany({
    where: { idFabricacion: { in: idsFabricaciones } }
  });

  await prisma.fabricacion.deleteMany({
    where: { 
      idGranja
    }
  });

  return { 
    mensaje: `${cantidadEliminadas} fabricación(es) eliminada(s) permanentemente. Las cantidades en inventario han sido restauradas.`,
    eliminadas: cantidadEliminadas
  };
}

/**
 * Obtener estadísticas de fabricaciones
 */
export async function obtenerEstadisticasFabricaciones(idGranja: string) {
  const fabricaciones = await prisma.fabricacion.findMany({
    where: { 
      idGranja
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

  // Calcular materias primas más utilizadas (por cantidad en kg)
  const materiasPrimasMap = new Map<string, { codigo: string; nombre: string; cantidadTotal: number }>();
  
  for (const fabricacion of fabricaciones) {
    for (const detalle of fabricacion.detallesFabricacion) {
      const key = detalle.materiaPrima.codigoMateriaPrima;
      const existing = materiasPrimasMap.get(key);
      
      if (existing) {
        existing.cantidadTotal += detalle.cantidadUsada;
      } else {
        materiasPrimasMap.set(key, {
          codigo: detalle.materiaPrima.codigoMateriaPrima,
          nombre: detalle.materiaPrima.nombreMateriaPrima,
          cantidadTotal: detalle.cantidadUsada
        });
      }
    }
  }

  const materiasMasUtilizadas = Array.from(materiasPrimasMap.values())
    .sort((a, b) => b.cantidadTotal - a.cantidadTotal)
    .slice(0, 10);

  // Calcular fórmulas más producidas (por cantidad en toneladas)
  const formulasMap = new Map<string, { codigo: string; descripcion: string; toneladasTotales: number }>();
  
  for (const fabricacion of fabricaciones) {
    const key = fabricacion.formula.codigoFormula;
    const toneladas = fabricacion.cantidadFabricacion / 1000;
    const existing = formulasMap.get(key);
    
    if (existing) {
      existing.toneladasTotales += toneladas;
    } else {
      formulasMap.set(key, {
        codigo: fabricacion.formula.codigoFormula,
        descripcion: fabricacion.formula.descripcionFormula,
        toneladasTotales: toneladas
      });
    }
  }

  const formulasMasProducidas = Array.from(formulasMap.values())
    .sort((a, b) => b.toneladasTotales - a.toneladasTotales)
    .slice(0, 10);

  return {
    totalFabricaciones: fabricaciones.length,
    totalKgFabricados: fabricaciones.reduce((suma, f) => suma + f.cantidadFabricacion, 0),
    totalCosto: fabricaciones.reduce((suma, f) => suma + f.costoTotalFabricacion, 0),
    fabricacionesSinExistencias: fabricaciones.filter(f => f.sinExistencias).length,
    promedioCostoPorKg: fabricaciones.length > 0
      ? fabricaciones.reduce((suma, f) => suma + (f.costoTotalFabricacion / f.cantidadFabricacion), 0) / fabricaciones.length
      : 0,
    materiasMasUtilizadas,
    formulasMasProducidas
  };
}

/**
 * Obtener fabricaciones eliminadas de una granja
 * NOTA: Esta función ya no es necesaria ya que las fabricaciones se eliminan permanentemente
 * Se mantiene por compatibilidad pero siempre retornará un array vacío
 * @deprecated Las fabricaciones ahora se eliminan permanentemente
 */
export async function obtenerFabricacionesEliminadas(idGranja: string) {
  // Las fabricaciones ahora se eliminan permanentemente, no hay eliminadas
  return [];
}

/**
 * Verificar existencias antes de crear una fabricación
 * Retorna información sobre materias primas que no tienen suficiente stock
 */
export async function verificarExistenciasFabricacion(params: {
  idGranja: string;
  idFormula: string;
  cantidadFabricacion: number;
}) {
  const { idGranja, idFormula, cantidadFabricacion } = params;

  // Obtener la fórmula con sus detalles
  const formula = await prisma.formulaCabecera.findUnique({
    where: { id: idFormula },
    include: {
      formulasDetalle: {
        include: {
          materiaPrima: true
        }
      }
    }
  });

  if (!formula) {
    throw new Error('Fórmula no encontrada');
  }

  // Interpretar cantidadFabricacion como "veces". 1 vez = 1000 kg de producto
  const cantidadProductoKg = cantidadFabricacion * 1000;

  // Verificar existencias para cada materia prima
  const faltantes: Array<{
    codigoMateriaPrima: string;
    nombreMateriaPrima: string;
    cantidadNecesaria: number;
    cantidadDisponible: number;
    falta: number;
  }> = [];

  for (const detalleFormula of formula.formulasDetalle) {
    const materiaPrima = detalleFormula.materiaPrima;
    
    // Calcular cantidad de materia prima a usar
    const cantidadUsada = (detalleFormula.cantidadKg / 1000) * cantidadProductoKg;

    // Obtener inventario actual
    const inventario = await prisma.inventario.findUnique({
      where: {
        idGranja_idMateriaPrima: {
          idGranja,
          idMateriaPrima: materiaPrima.id
        }
      }
    });

    const cantidadDisponible = inventario?.cantidadReal || 0;

    if (cantidadDisponible < cantidadUsada) {
      faltantes.push({
        codigoMateriaPrima: materiaPrima.codigoMateriaPrima,
        nombreMateriaPrima: materiaPrima.nombreMateriaPrima,
        cantidadNecesaria: cantidadUsada,
        cantidadDisponible,
        falta: cantidadUsada - cantidadDisponible
      });
    }
  }

  return {
    tieneFaltantes: faltantes.length > 0,
    faltantes,
    codigoFormula: formula.codigoFormula,
    descripcionFormula: formula.descripcionFormula
  };
}

