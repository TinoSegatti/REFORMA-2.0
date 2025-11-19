/**
 * Servicio para consolidar todos los datos del reporte completo
 * Reúne información de compras, proveedores, materias primas, inventario, fórmulas y fabricaciones
 */

import prisma from '../lib/prisma';
import { obtenerEstadisticasCompras } from './compraService';
import { obtenerEstadisticasFabricaciones } from './fabricacionService';

export interface DatosReporteCompleto {
  // Proveedores
  proveedoresMasCantidades: Array<{
    id: string;
    codigoProveedor: string;
    nombreProveedor: string;
    cantidadCompras: number;
  }>;
  proveedoresMasDinero: Array<{
    id: string;
    codigoProveedor: string;
    nombreProveedor: string;
    totalGastado: number;
    cantidadCompras: number;
  }>;
  
  // Materias Primas
  materiasMasCompradas: Array<{
    codigo: string;
    nombre: string;
    cantidadTotal: number; // en kg
    vecesComprada: number;
  }>;
  materiasMasCaras: Array<{
    codigo: string;
    nombre: string;
    precioPromedio: number; // precio por kilo
  }>;
  materiasMasExistencias: Array<{
    codigo: string;
    nombre: string;
    cantidad: number; // en kg
    toneladas: number;
  }>;
  materiasMasValor: Array<{
    codigo: string;
    nombre: string;
    valorStock: number;
    cantidad: number;
  }>;
  
  // Compras
  totalCompras: number;
  totalGastado: number;
  promedioGastado: number;
  facturasMasCaras: Array<{
    id: string;
    numeroFactura: string;
    fechaCompra: Date;
    totalFactura: number;
    proveedor: string;
  }>;
  
  // Fabricaciones
  totalFabricaciones: number;
  totalKgFabricados: number;
  
  // Fórmulas
  formulasMasFabricadas: Array<{
    codigo: string;
    descripcion: string;
    toneladasTotales: number;
  }>;
  formulasMasCaras: Array<{
    codigo: string;
    descripcion: string;
    costoTotal: number;
    costoPorKilo: number;
  }>;
  
  // Inventario
  kilosEnStock: number;
  valorStock: number;
  cantidadMateriasEnStock: number;
  
  // Alertas
  alertas: Array<{
    tipo: string;
    mensaje: string;
    severidad: 'baja' | 'media' | 'alta';
  }>;
  
  // Nuevos gráficos para reporte completo (ENTERPRISE)
  distribucionMateriasEnFormulas: Array<{
    formulaCodigo: string;
    formulaDescripcion: string;
    materias: Array<{
      materiaCodigo: string;
      materiaNombre: string;
      cantidadKg: number;
      porcentaje: number;
    }>;
  }>;
  evolucionCostosFormulas: Array<{
    fecha: Date;
    formulaCodigo: string;
    formulaDescripcion: string;
    costoTotal: number;
    costoPorKilo: number;
  }>;
  consumoMateriasPrimas: Array<{
    periodo: string; // "2024-01", "2024-02", etc.
    materiaCodigo: string;
    materiaNombre: string;
    cantidadKg: number;
  }>;
  tendenciasPrecios: Array<{
    fecha: Date;
    materiaCodigo: string;
    materiaNombre: string;
    precio: number;
  }>;
}

/**
 * Obtiene todos los datos consolidados para el reporte completo
 */
export async function obtenerDatosReporteCompleto(idGranja: string): Promise<DatosReporteCompleto> {
  // Ejecutar todas las consultas en paralelo para optimizar rendimiento
  const [
    // Proveedores con más compras (cantidad)
    proveedoresCantidadRaw,
    // Proveedores con más dinero gastado
    proveedoresDineroRaw,
    // Materias primas más compradas
    materiasCompradasRaw,
    // Materias primas más caras
    materiasCarasRaw,
    // Estadísticas de compras
    statsCompras,
    // Facturas más caras
    facturasCarasRaw,
    // Estadísticas de fabricaciones
    statsFabricaciones,
    // Inventario
    inventarioRaw,
    // Fórmulas más caras
    formulasCarasRaw,
    // Distribución de materias primas en fórmulas
    distribucionMateriasRaw,
    // Evolución de costos de fórmulas
    evolucionCostosRaw,
    // Consumo de materias primas
    consumoMateriasRaw,
    // Tendencias de precios
    tendenciasPreciosRaw,
  ] = await Promise.all([
    // Proveedores con más compras (cantidad)
    prisma.$queryRaw<any[]>`
      SELECT
        p.id,
        p."codigoProveedor" as codigo_proveedor,
        p."nombreProveedor" as nombre_proveedor,
        COUNT(cc.id) as cantidad_compras
      FROM t_proveedor p
      LEFT JOIN t_compra_cabecera cc ON p.id = cc."idProveedor" AND cc."activo" = true
      WHERE p."idGranja" = ${idGranja} AND p.activo = true
      GROUP BY p.id, p."codigoProveedor", p."nombreProveedor"
      ORDER BY cantidad_compras DESC
      LIMIT 10
    `,
    
    // Proveedores con más dinero gastado
    prisma.$queryRaw<any[]>`
      SELECT
        p.id,
        p."codigoProveedor" as codigo_proveedor,
        p."nombreProveedor" as nombre_proveedor,
        COALESCE(SUM(cc."totalFactura"), 0) as total_gastado,
        COUNT(cc.id) as cantidad_compras
      FROM t_proveedor p
      LEFT JOIN t_compra_cabecera cc ON p.id = cc."idProveedor" AND cc."activo" = true
      WHERE p."idGranja" = ${idGranja} AND p.activo = true
      GROUP BY p.id, p."codigoProveedor", p."nombreProveedor"
      ORDER BY total_gastado DESC
      LIMIT 10
    `,
    
    // Materias primas más compradas (cantidad en kg)
    prisma.$queryRaw<any[]>`
      SELECT
        mp."codigoMateriaPrima" as codigo,
        mp."nombreMateriaPrima" as nombre,
        COALESCE(SUM(cd."cantidadComprada"), 0) as cantidad_total,
        COUNT(DISTINCT cd.id) as veces_comprada
      FROM t_compra_detalle cd
      INNER JOIN t_compra_cabecera cc ON cd."idCompra" = cc.id
      INNER JOIN t_materia_prima mp ON cd."idMateriaPrima" = mp.id
      WHERE cc."idGranja" = ${idGranja}
        AND cc."activo" = true
        AND mp.activa = true
      GROUP BY mp.id, mp."codigoMateriaPrima", mp."nombreMateriaPrima"
      ORDER BY cantidad_total DESC
      LIMIT 10
    `,
    
    // Materias primas más caras (precio por kilo)
    prisma.$queryRaw<any[]>`
      SELECT
        mp."codigoMateriaPrima" as codigo,
        mp."nombreMateriaPrima" as nombre,
        COALESCE(AVG(cd."precioUnitario"), 0) as precio_promedio
      FROM t_materia_prima mp
      LEFT JOIN t_compra_detalle cd ON mp.id = cd."idMateriaPrima"
      LEFT JOIN t_compra_cabecera cc ON cd."idCompra" = cc.id AND cc."activo" = true
      WHERE mp."idGranja" = ${idGranja} AND mp.activa = true
      GROUP BY mp.id, mp."codigoMateriaPrima", mp."nombreMateriaPrima"
      HAVING COUNT(cd.id) > 0
      ORDER BY precio_promedio DESC
      LIMIT 10
    `,
    
    // Estadísticas de compras
    obtenerEstadisticasCompras(idGranja),
    
    // Facturas más caras
    prisma.compraCabecera.findMany({
      where: {
        idGranja,
        activo: true
      },
      include: {
        proveedor: {
          select: {
            nombreProveedor: true
          }
        }
      },
      orderBy: {
        totalFactura: 'desc'
      },
      take: 10
    }),
    
    // Estadísticas de fabricaciones
    obtenerEstadisticasFabricaciones(idGranja),
    
    // Inventario completo
    prisma.inventario.findMany({
      where: { idGranja },
      include: {
        materiaPrima: {
          select: {
            codigoMateriaPrima: true,
            nombreMateriaPrima: true
          }
        }
      }
    }),
    
    // Fórmulas más caras
    prisma.$queryRaw<any[]>`
      SELECT
        fc."codigoFormula" as codigo,
        fc."descripcionFormula" as descripcion,
        AVG(f."costoTotalFabricacion") as costo_total,
        AVG(f."costoPorKilo") as costo_por_kilo
      FROM t_formula_cabecera fc
      LEFT JOIN t_fabricacion f ON fc.id = f."idFormula" AND f."activo" = true
      WHERE fc."idGranja" = ${idGranja} AND fc.activa = true
      GROUP BY fc.id, fc."codigoFormula", fc."descripcionFormula"
      HAVING COUNT(f.id) > 0
      ORDER BY costo_total DESC
      LIMIT 10
    `,
    
    // Distribución de materias primas en fórmulas
    prisma.$queryRaw<any[]>`
      SELECT
        fc."codigoFormula" as formula_codigo,
        fc."descripcionFormula" as formula_descripcion,
        mp."codigoMateriaPrima" as materia_codigo,
        mp."nombreMateriaPrima" as materia_nombre,
        fd."cantidadKg" as cantidad_kg,
        fd."porcentajeFormula" as porcentaje
      FROM t_formula_cabecera fc
      INNER JOIN t_formula_detalle fd ON fc.id = fd."idFormula"
      INNER JOIN t_materia_prima mp ON fd."idMateriaPrima" = mp.id
      WHERE fc."idGranja" = ${idGranja} AND fc.activa = true AND mp.activa = true
      ORDER BY fc."codigoFormula", fd."porcentajeFormula" DESC
    `,
    
    // Evolución de costos de fórmulas (por fecha de fabricación)
    prisma.$queryRaw<any[]>`
      SELECT
        DATE_TRUNC('month', f."fechaFabricacion") as fecha,
        fc."codigoFormula" as formula_codigo,
        fc."descripcionFormula" as formula_descripcion,
        AVG(f."costoTotalFabricacion") as costo_total,
        AVG(f."costoPorKilo") as costo_por_kilo
      FROM t_fabricacion f
      INNER JOIN t_formula_cabecera fc ON f."idFormula" = fc.id
      WHERE f."idGranja" = ${idGranja} AND f."activo" = true AND fc.activa = true
      GROUP BY DATE_TRUNC('month', f."fechaFabricacion"), fc."codigoFormula", fc."descripcionFormula"
      ORDER BY fecha DESC, formula_codigo
      LIMIT 100
    `,
    
    // Consumo de materias primas (por período mensual)
    prisma.$queryRaw<any[]>`
      SELECT
        TO_CHAR(f."fechaFabricacion", 'YYYY-MM') as periodo,
        mp."codigoMateriaPrima" as materia_codigo,
        mp."nombreMateriaPrima" as materia_nombre,
        SUM(df."cantidadUsada") as cantidad_kg
      FROM t_detalle_fabricacion df
      INNER JOIN t_fabricacion f ON df."idFabricacion" = f.id
      INNER JOIN t_materia_prima mp ON df."idMateriaPrima" = mp.id
      WHERE f."idGranja" = ${idGranja} AND f."activo" = true AND mp.activa = true
      GROUP BY TO_CHAR(f."fechaFabricacion", 'YYYY-MM'), mp."codigoMateriaPrima", mp."nombreMateriaPrima"
      ORDER BY periodo DESC, cantidad_kg DESC
      LIMIT 200
    `,
    
    // Tendencias de precios (histórico de precios por materia prima)
    prisma.$queryRaw<any[]>`
      SELECT
        rp."fechaCambio" as fecha,
        mp."codigoMateriaPrima" as materia_codigo,
        mp."nombreMateriaPrima" as materia_nombre,
        rp."precioNuevo" as precio
      FROM t_registro_precio rp
      INNER JOIN t_materia_prima mp ON rp."idMateriaPrima" = mp.id
      WHERE mp."idGranja" = ${idGranja} AND mp.activa = true
      ORDER BY rp."fechaCambio" DESC, mp."codigoMateriaPrima"
      LIMIT 500
    `,
  ]);

  // Obtener totales de compras
  const totalesCompras = await prisma.$queryRaw<Array<{
    total_compras: unknown;
    total_gastado: unknown;
    promedio_gastado: unknown;
  }>>`
    SELECT
      COUNT(*) as total_compras,
      COALESCE(SUM("totalFactura"), 0) as total_gastado,
      COALESCE(AVG("totalFactura"), 0) as promedio_gastado
    FROM t_compra_cabecera
    WHERE "idGranja" = ${idGranja} AND activo = true
  `;

  const totales = totalesCompras[0] || { total_compras: 0, total_gastado: 0, promedio_gastado: 0 };

  // Procesar inventario
  const materiasMasExistencias = inventarioRaw
    .map(inv => ({
      codigo: inv.materiaPrima.codigoMateriaPrima,
      nombre: inv.materiaPrima.nombreMateriaPrima,
      cantidad: inv.cantidadSistema,
      toneladas: inv.cantidadSistema / 1000
    }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 10);

  const materiasMasValor = inventarioRaw
    .map(inv => ({
      codigo: inv.materiaPrima.codigoMateriaPrima,
      nombre: inv.materiaPrima.nombreMateriaPrima,
      valorStock: Number(inv.valorStock || 0),
      cantidad: inv.cantidadSistema
    }))
    .filter(inv => inv.valorStock > 0)
    .sort((a, b) => b.valorStock - a.valorStock)
    .slice(0, 10);

  const kilosEnStock = inventarioRaw.reduce((suma, inv) => suma + inv.cantidadSistema, 0);
  const valorStock = inventarioRaw.reduce((suma, inv) => suma + Number(inv.valorStock || 0), 0);
  const cantidadMateriasEnStock = inventarioRaw.filter(inv => inv.cantidadSistema > 0).length;

  // Generar alertas
  const alertas: Array<{ tipo: string; mensaje: string; severidad: 'baja' | 'media' | 'alta' }> = [];
  
  // Alertas de stock bajo (menos del 10% del promedio)
  const promedioStock = inventarioRaw.length > 0 ? kilosEnStock / inventarioRaw.length : 0;
  inventarioRaw.forEach(inv => {
    if (inv.cantidadSistema < promedioStock * 0.1 && inv.cantidadSistema > 0) {
      alertas.push({
        tipo: 'stock_bajo',
        mensaje: `${inv.materiaPrima.nombreMateriaPrima} tiene stock bajo (${(inv.cantidadSistema / 1000).toFixed(2)} ton)`,
        severidad: 'media'
      });
    }
  });

  // Alertas de materias sin stock
  inventarioRaw.forEach(inv => {
    if (inv.cantidadSistema <= 0) {
      alertas.push({
        tipo: 'sin_stock',
        mensaje: `${inv.materiaPrima.nombreMateriaPrima} está sin stock`,
        severidad: 'alta'
      });
    }
  });

  // Retornar datos consolidados
  return {
    proveedoresMasCantidades: proveedoresCantidadRaw.map((p: any) => ({
      id: p.id,
      codigoProveedor: p.codigo_proveedor,
      nombreProveedor: p.nombre_proveedor,
      cantidadCompras: Number(p.cantidad_compras || 0)
    })),
    
    proveedoresMasDinero: proveedoresDineroRaw.map((p: any) => ({
      id: p.id,
      codigoProveedor: p.codigo_proveedor,
      nombreProveedor: p.nombre_proveedor,
      totalGastado: Number(p.total_gastado || 0),
      cantidadCompras: Number(p.cantidad_compras || 0)
    })),
    
    materiasMasCompradas: materiasCompradasRaw.map((m: any) => ({
      codigo: m.codigo,
      nombre: m.nombre,
      cantidadTotal: Number(m.cantidad_total || 0),
      vecesComprada: Number(m.veces_comprada || 0)
    })),
    
    materiasMasCaras: materiasCarasRaw.map((m: any) => ({
      codigo: m.codigo,
      nombre: m.nombre,
      precioPromedio: Number(m.precio_promedio || 0)
    })),
    
    totalCompras: Number(totales.total_compras || 0),
    totalGastado: Number(totales.total_gastado || 0),
    promedioGastado: Number(totales.promedio_gastado || 0),
    
    facturasMasCaras: facturasCarasRaw.map(cc => ({
      id: cc.id,
      numeroFactura: cc.numeroFactura || 'N/A',
      fechaCompra: cc.fechaCompra,
      totalFactura: Number(cc.totalFactura || 0),
      proveedor: cc.proveedor?.nombreProveedor || 'N/A'
    })),
    
    totalFabricaciones: statsFabricaciones.totalFabricaciones,
    totalKgFabricados: statsFabricaciones.totalKgFabricados,
    
    formulasMasFabricadas: statsFabricaciones.formulasMasProducidas,
    
    formulasMasCaras: formulasCarasRaw.map((f: any) => ({
      codigo: f.codigo,
      descripcion: f.descripcion,
      costoTotal: Number(f.costo_total || 0),
      costoPorKilo: Number(f.costo_por_kilo || 0)
    })),
    
    materiasMasExistencias,
    materiasMasValor,
    
    kilosEnStock,
    valorStock,
    cantidadMateriasEnStock,
    
    alertas: alertas.slice(0, 20), // Limitar a 20 alertas
    
    // Procesar distribución de materias primas en fórmulas
    distribucionMateriasEnFormulas: (() => {
      const map = new Map<string, {
        formulaCodigo: string;
        formulaDescripcion: string;
        materias: Array<{
          materiaCodigo: string;
          materiaNombre: string;
          cantidadKg: number;
          porcentaje: number;
        }>;
      }>();
      
      distribucionMateriasRaw.forEach((row: any) => {
        const key = row.formula_codigo;
        if (!map.has(key)) {
          map.set(key, {
            formulaCodigo: row.formula_codigo,
            formulaDescripcion: row.formula_descripcion,
            materias: []
          });
        }
        const formula = map.get(key)!;
        formula.materias.push({
          materiaCodigo: row.materia_codigo,
          materiaNombre: row.materia_nombre,
          cantidadKg: Number(row.cantidad_kg || 0),
          porcentaje: Number(row.porcentaje || 0)
        });
      });
      
      return Array.from(map.values()).slice(0, 10); // Top 10 fórmulas
    })(),
    
    // Procesar evolución de costos de fórmulas
    evolucionCostosFormulas: evolucionCostosRaw.map((row: any) => ({
      fecha: new Date(row.fecha),
      formulaCodigo: row.formula_codigo,
      formulaDescripcion: row.formula_descripcion,
      costoTotal: Number(row.costo_total || 0),
      costoPorKilo: Number(row.costo_por_kilo || 0)
    })),
    
    // Procesar consumo de materias primas
    consumoMateriasPrimas: consumoMateriasRaw.map((row: any) => ({
      periodo: row.periodo,
      materiaCodigo: row.materia_codigo,
      materiaNombre: row.materia_nombre,
      cantidadKg: Number(row.cantidad_kg || 0)
    })),
    
    // Procesar tendencias de precios
    tendenciasPrecios: tendenciasPreciosRaw.map((row: any) => ({
      fecha: new Date(row.fecha),
      materiaCodigo: row.materia_codigo,
      materiaNombre: row.materia_nombre,
      precio: Number(row.precio || 0)
    }))
  };
}

