import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { calcularPrecioAlmacen } from '../services/inventarioService';
import { calcularStockDesdeCompras } from '../services/compraService';
import { validateGranja, sendValidationError } from '../utils/granjaValidation';
import { buildCsv } from '../utils/csvUtils';

interface InventarioRequest extends Request {
  userId?: string;
}

/**
 * Obtener inventario de una granja
 */
export async function obtenerInventario(req: InventarioRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar que el usuario tenga acceso a la granja
    const granja = await prisma.granja.findFirst({
      where: {
        id: idGranja,
        idUsuario: userId,
        activa: true
      }
    });

    if (!granja) {
      return res.status(404).json({ error: 'Granja no encontrada' });
    }

    // Obtener inventario con información de materia prima
    const inventario = await prisma.inventario.findMany({
      where: { idGranja },
      include: {
        materiaPrima: true
      },
      orderBy: {
        materiaPrima: {
          codigoMateriaPrima: 'asc'
        }
      }
    });

    res.json(inventario);
  } catch (error: any) {
    console.error('Error obteniendo inventario:', error);
    res.status(500).json({ error: 'Error al obtener inventario' });
  }
}

/**
 * Obtener estadísticas del inventario
 */
export async function obtenerEstadisticasInventario(req: InventarioRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar acceso a la granja
    const granja = await prisma.granja.findFirst({
      where: {
        id: idGranja,
        idUsuario: userId,
        activa: true
      }
    });

    if (!granja) {
      return res.status(404).json({ error: 'Granja no encontrada' });
    }

    // Obtener inventario
    const inventario = await prisma.inventario.findMany({
      where: { idGranja },
      include: {
        materiaPrima: true
      }
    });

    // Calcular estadísticas
    const totalMateriasPrimas = inventario.length;
    const toneladasTotales = inventario.reduce((sum, item) => sum + item.cantidadReal, 0) / 1000;
    const costoTotalStock = inventario.reduce((sum, item) => sum + item.valorStock, 0);

    // Materias primas con más existencias (por cantidad real, para coincidir con toneladasTotales)
    const materiasMasExistencias = inventario
      .filter(item => item.cantidadReal > 0)
      .sort((a, b) => b.cantidadReal - a.cantidadReal)
      .slice(0, 10)
      .map(item => ({
        codigo: item.materiaPrima.codigoMateriaPrima,
        nombre: item.materiaPrima.nombreMateriaPrima,
        cantidad: item.cantidadReal,
        toneladas: item.cantidadReal / 1000
      }));

    // Materias primas de más valor (por valor total del stock)
    const materiasMasValor = inventario
      .filter(item => item.valorStock > 0)
      .sort((a, b) => b.valorStock - a.valorStock)
      .slice(0, 10)
      .map(item => ({
        codigo: item.materiaPrima.codigoMateriaPrima,
        nombre: item.materiaPrima.nombreMateriaPrima,
        precioAlmacen: item.precioAlmacen,
        valorStock: item.valorStock
      }));

    // Alertas de stock negativo o en 0
    const alertasStock = inventario
      .filter(item => item.cantidadReal <= 0)
      .map(item => ({
        codigo: item.materiaPrima.codigoMateriaPrima,
        nombre: item.materiaPrima.nombreMateriaPrima,
        cantidadReal: item.cantidadReal,
        tipo: item.cantidadReal < 0 ? 'NEGATIVO' : 'CERO'
      }));

    res.json({
      totalMateriasPrimas,
      toneladasTotales,
      costoTotalStock,
      materiasMasExistencias,
      materiasMasValor,
      alertasStock
    });
  } catch (error: any) {
    console.error('Error obteniendo estadísticas de inventario:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas de inventario' });
  }
}

/**
 * Inicializar inventario con datos existentes
 */
export async function inicializarInventario(req: InventarioRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;
    const { datosIniciales } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar acceso a la granja
    const granja = await prisma.granja.findFirst({
      where: {
        id: idGranja,
        idUsuario: userId,
        activa: true
      }
    });

    if (!granja) {
      return res.status(404).json({ error: 'Granja no encontrada' });
    }

    // Verificar que no exista inventario ya inicializado
    const inventarioExistente = await prisma.inventario.findFirst({
      where: { idGranja }
    });

    if (inventarioExistente) {
      return res.status(400).json({ error: 'El inventario ya ha sido inicializado' });
    }

    const inventariosCreados = [];

    for (const dato of datosIniciales) {
      const { idMateriaPrima, cantidadReal, precioPorKilo } = dato;

      // Verificar que la materia prima pertenezca a la granja
      const materiaPrima = await prisma.materiaPrima.findFirst({
        where: {
          id: idMateriaPrima,
          idGranja,
          activa: true
        }
      });

      if (!materiaPrima) {
        continue; // Saltar esta materia prima
      }

      // Actualizar precio de la materia prima si se proporciona
      if (precioPorKilo && precioPorKilo > 0) {
        await prisma.materiaPrima.update({
          where: { id: idMateriaPrima },
          data: { precioPorKilo }
        });
      }

      // Registrar inventario inicial (persistir base para cálculos futuros)
      await prisma.inventarioInicial.upsert({
        where: {
          idGranja_idMateriaPrima: {
            idGranja,
            idMateriaPrima
          }
        },
        create: {
          idGranja,
          idMateriaPrima,
          cantidadInicial: cantidadReal,
          precioInicial: precioPorKilo || materiaPrima.precioPorKilo
        },
        update: {
          cantidadInicial: cantidadReal,
          precioInicial: precioPorKilo || materiaPrima.precioPorKilo
        }
      });

      // Calcular valores iniciales
      const precioFinal = precioPorKilo || materiaPrima.precioPorKilo;
      const valorStock = cantidadReal * precioFinal;
      const precioAlmacen = precioFinal; // En la inicialización, precio almacén = precio por kilo

      // Crear registro de inventario
      const inventario = await prisma.inventario.create({
        data: {
          idGranja,
          idMateriaPrima,
          cantidadAcumulada: cantidadReal,
          cantidadSistema: cantidadReal,
          cantidadReal,
          merma: 0, // En inicialización no hay merma
          precioAlmacen,
          valorStock,
          observaciones: 'Inicialización de inventario'
        },
        include: {
          materiaPrima: true
        }
      });

      inventariosCreados.push(inventario);
    }

    res.status(201).json({
      message: 'Inventario inicializado correctamente',
      inventariosCreados: inventariosCreados.length,
      datos: inventariosCreados
    });
  } catch (error: any) {
    console.error('Error inicializando inventario:', error);
    res.status(500).json({ error: 'Error al inicializar inventario' });
  }
}

/**
 * Actualizar cantidad real de una materia prima
 */
export async function actualizarCantidadReal(req: InventarioRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja, id } = req.params;
    const { cantidadReal } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!cantidadReal && cantidadReal !== 0) {
      return res.status(400).json({ error: 'Cantidad real es requerida' });
    }

    // Verificar acceso a la granja
    const granja = await prisma.granja.findFirst({
      where: {
        id: idGranja,
        idUsuario: userId,
        activa: true
      }
    });

    if (!granja) {
      return res.status(404).json({ error: 'Granja no encontrada' });
    }

    // Obtener inventario actual
    const inventarioActual = await prisma.inventario.findFirst({
      where: {
        id,
        idGranja
      },
      include: {
        materiaPrima: true
      }
    });

    if (!inventarioActual) {
      return res.status(404).json({ error: 'Registro de inventario no encontrado' });
    }

    // Calcular nueva merma
    const nuevaMerma = cantidadReal - inventarioActual.cantidadSistema;

    // Calcular nuevo valor de stock
    const nuevoValorStock = cantidadReal * inventarioActual.materiaPrima.precioPorKilo;

    // Actualizar inventario
    const inventarioActualizado = await prisma.inventario.update({
      where: { id },
      data: {
        cantidadReal,
        merma: nuevaMerma,
        valorStock: nuevoValorStock
      },
      include: {
        materiaPrima: true
      }
    });

    res.json(inventarioActualizado);
  } catch (error: any) {
    console.error('Error actualizando cantidad real:', error);
    res.status(500).json({ error: 'Error al actualizar cantidad real' });
  }
}

/**
 * Recalcular inventario después de cambios en compras o fabricaciones
 */
export async function recalcularInventario(req: InventarioRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar acceso a la granja
    const granja = await prisma.granja.findFirst({
      where: {
        id: idGranja,
        idUsuario: userId,
        activa: true
      }
    });

    if (!granja) {
      return res.status(404).json({ error: 'Granja no encontrada' });
    }

    // Obtener todas las materias primas de la granja
    const materiasPrimas = await prisma.materiaPrima.findMany({
      where: { idGranja, activa: true }
    });

    const resultados = [];

    for (const materiaPrima of materiasPrimas) {
      // Calcular cantidad acumulada desde compras
      const comprasDetalle = await prisma.compraDetalle.findMany({
        where: {
          materiaPrima: {
            id: materiaPrima.id
          },
          compra: {
            idGranja
          }
        }
      });

      const cantidadAcumuladaCompras = comprasDetalle.reduce((sum, detalle) => sum + detalle.cantidadComprada, 0);
      const totalGastadoCompras = comprasDetalle.reduce((sum, detalle) => sum + detalle.subtotal, 0);

      // Calcular cantidad usada en fabricaciones
      const fabricacionesDetalle = await prisma.detalleFabricacion.findMany({
        where: {
          materiaPrima: {
            id: materiaPrima.id
          },
          fabricacion: {
            idGranja
          }
        }
      });

      const cantidadUsadaFabricaciones = fabricacionesDetalle.reduce((sum, detalle) => sum + detalle.cantidadUsada, 0);

      // Calcular cantidad en sistema
      const cantidadSistema = cantidadAcumuladaCompras - cantidadUsadaFabricaciones;

      // Calcular precio almacén con el criterio global (promedio simple por evento incluyendo inicialización)
      const precioAlmacen = await calcularPrecioAlmacen({ idGranja, idMateriaPrima: materiaPrima.id });

      // Obtener inventario actual o crear uno nuevo
      let inventario = await prisma.inventario.findFirst({
        where: {
          idGranja,
          idMateriaPrima: materiaPrima.id
        }
      });

      if (inventario) {
        // Actualizar inventario existente
        inventario = await prisma.inventario.update({
          where: { id: inventario.id },
          data: {
            cantidadAcumulada: cantidadAcumuladaCompras,
            cantidadSistema,
            precioAlmacen,
            valorStock: inventario.cantidadReal * materiaPrima.precioPorKilo,
            merma: inventario.cantidadReal - cantidadSistema
          },
          include: {
            materiaPrima: true
          }
        });
      } else {
        // Crear nuevo inventario si no existe
        inventario = await prisma.inventario.create({
          data: {
            idGranja,
            idMateriaPrima: materiaPrima.id,
            cantidadAcumulada: cantidadAcumuladaCompras,
            cantidadSistema,
            cantidadReal: 0,
            merma: 0,
            precioAlmacen,
            valorStock: 0,
            observaciones: 'Creado automáticamente'
          },
          include: {
            materiaPrima: true
          }
        });
      }

      resultados.push(inventario);
    }

    res.json({
      message: 'Inventario recalculado correctamente',
      registrosActualizados: resultados.length
    });
  } catch (error: any) {
    console.error('Error recalculando inventario:', error);
    res.status(500).json({ error: 'Error al recalcular inventario' });
  }
}

/**
 * Vaciar inventario de una granja (elimina todos los registros de t_inventario)
 */
export async function vaciarInventario(req: InventarioRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar acceso a la granja
    const granja = await prisma.granja.findFirst({
      where: {
        id: idGranja,
        idUsuario: userId,
        activa: true
      }
    });

    if (!granja) {
      return res.status(404).json({ error: 'Granja no encontrada' });
    }

    // Validar que no haya compras registradas (solo activas)
    const comprasCount = await prisma.compraCabecera.count({
      where: { 
        idGranja,
        activo: true
      }
    });

    if (comprasCount > 0) {
      return res.status(400).json({ 
        error: 'No se puede vaciar el inventario mientras existan compras registradas. Elimine primero todas las compras.' 
      });
    }

    // Validar que no haya fabricaciones registradas (solo activas)
    const fabricacionesCount = await prisma.fabricacion.count({
      where: { 
        idGranja,
        activo: true
      }
    });

    if (fabricacionesCount > 0) {
      return res.status(400).json({ 
        error: 'No se puede vaciar el inventario mientras existan fabricaciones registradas. Elimine primero todas las fabricaciones.' 
      });
    }

    // También eliminar inventario inicial si existe
    await prisma.inventarioInicial.deleteMany({
      where: { idGranja }
    });

    // Resetear precios de todas las materias primas de la granja a $0
    await prisma.materiaPrima.updateMany({
      where: { idGranja },
      data: { precioPorKilo: 0 }
    });

    const resultado = await prisma.inventario.deleteMany({
      where: { idGranja }
    });

    res.json({ message: 'Inventario vaciado correctamente', eliminados: resultado.count });
  } catch (error: any) {
    console.error('Error vaciando inventario:', error);
    res.status(500).json({ error: error.message || 'Error al vaciar inventario' });
  }
}

export async function exportarInventario(req: InventarioRequest, res: Response) {
  try {
    const userId = req.userId;
    const { idGranja } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const validation = await validateGranja(idGranja, userId);
    if (sendValidationError(res, validation)) return;

    const inventario = await prisma.inventario.findMany({
      where: { idGranja },
      include: {
        materiaPrima: true,
      },
      orderBy: {
        materiaPrima: {
          codigoMateriaPrima: 'asc',
        },
      },
    });

    const csv = buildCsv({
      fields: [
        'codigoMateriaPrima',
        'nombreMateriaPrima',
        'cantidadAcumulada',
        'cantidadSistema',
        'cantidadReal',
        'merma',
        'precioAlmacen',
        'valorStock',
        'fechaUltimaActualizacion',
      ],
      data: inventario.map((item) => ({
        codigoMateriaPrima: item.materiaPrima.codigoMateriaPrima,
        nombreMateriaPrima: item.materiaPrima.nombreMateriaPrima,
        cantidadAcumulada: item.cantidadAcumulada,
        cantidadSistema: item.cantidadSistema,
        cantidadReal: item.cantidadReal,
        merma: item.merma,
        precioAlmacen: item.precioAlmacen,
        valorStock: item.valorStock,
        fechaUltimaActualizacion: item.fechaUltimaActualizacion.toISOString(),
      })),
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="inventario_${idGranja}.csv"`);
    res.send(csv);
  } catch (error: any) {
    console.error('Error exportando inventario:', error);
    res.status(500).json({ error: 'Error al exportar inventario' });
  }
}