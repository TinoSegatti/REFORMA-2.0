'use strict';

/**
 * Servicio de Archivos (Snapshots)
 * Permite crear, listar y eliminar "fotos" de tablas críticas
 */

import { Prisma, TablaOrigen } from '@prisma/client';
import prisma from '../lib/prisma';
import { registrarAuditoria } from './auditoriaService';

interface CrearArchivoParams {
  idGranja: string;
  idUsuario: string;
  tablaOrigen: TablaOrigen;
  descripcion: string;
}

const sanitizeJson = (value: any): Prisma.JsonValue =>
  JSON.parse(JSON.stringify(value));

async function snapshotCompras(idGranja: string) {
  const compras = await prisma.compraCabecera.findMany({
    where: { idGranja, activo: true },
    orderBy: { fechaCompra: 'desc' },
    include: {
      proveedor: {
        select: {
          id: true,
          codigoProveedor: true,
          nombreProveedor: true,
        },
      },
      usuario: {
        select: {
          id: true,
          email: true,
          nombreUsuario: true,
          apellidoUsuario: true,
        },
      },
      comprasDetalle: {
        orderBy: { id: 'asc' },
        select: {
          id: true,
          cantidadComprada: true,
          precioUnitario: true,
          subtotal: true,
          materiaPrima: {
            select: {
              id: true,
              codigoMateriaPrima: true,
              nombreMateriaPrima: true,
            },
          },
        },
      },
    },
  });

  return compras.map((compra) => ({
    id: compra.id,
    numeroFactura: compra.numeroFactura,
    fechaCompra: compra.fechaCompra.toISOString(),
    totalFactura: compra.totalFactura,
    observaciones: compra.observaciones,
    proveedor: compra.proveedor,
    usuario: compra.usuario,
    detalles: compra.comprasDetalle.map((detalle) => ({
      id: detalle.id,
      cantidadComprada: detalle.cantidadComprada,
      precioUnitario: detalle.precioUnitario,
      subtotal: detalle.subtotal,
      materiaPrima: detalle.materiaPrima,
    })),
  }));
}

async function snapshotFabricaciones(idGranja: string) {
  const fabricaciones = await prisma.fabricacion.findMany({
    where: { idGranja, activo: true },
    orderBy: { fechaFabricacion: 'desc' },
    include: {
      formula: {
        select: {
          id: true,
          codigoFormula: true,
          descripcionFormula: true,
        },
      },
      usuario: {
        select: {
          id: true,
          email: true,
          nombreUsuario: true,
          apellidoUsuario: true,
        },
      },
      detallesFabricacion: {
        orderBy: { id: 'asc' },
        select: {
          id: true,
          cantidadUsada: true,
          precioUnitario: true,
          costoParcial: true,
          materiaPrima: {
            select: {
              id: true,
              codigoMateriaPrima: true,
              nombreMateriaPrima: true,
            },
          },
        },
      },
    },
  });

  return fabricaciones.map((fabricacion) => ({
    id: fabricacion.id,
    descripcionFabricacion: fabricacion.descripcionFabricacion,
    fechaFabricacion: fabricacion.fechaFabricacion.toISOString(),
    cantidadFabricacion: fabricacion.cantidadFabricacion,
    costoTotalFabricacion: fabricacion.costoTotalFabricacion,
    costoPorKilo: fabricacion.costoPorKilo,
    observaciones: fabricacion.observaciones,
    formula: fabricacion.formula,
    usuario: fabricacion.usuario,
    detalles: fabricacion.detallesFabricacion.map((detalle) => ({
      id: detalle.id,
      cantidadUsada: detalle.cantidadUsada,
      precioUnitario: detalle.precioUnitario,
      costoParcial: detalle.costoParcial,
      materiaPrima: detalle.materiaPrima,
    })),
  }));
}

async function snapshotInventario(idGranja: string) {
  const inventario = await prisma.inventario.findMany({
    where: { idGranja },
    orderBy: { fechaUltimaActualizacion: 'desc' },
    include: {
      materiaPrima: {
        select: {
          id: true,
          codigoMateriaPrima: true,
          nombreMateriaPrima: true,
        },
      },
    },
  });

  return inventario.map((item) => ({
    id: item.id,
    fechaUltimaActualizacion: item.fechaUltimaActualizacion.toISOString(),
    cantidadAcumulada: item.cantidadAcumulada,
    cantidadSistema: item.cantidadSistema,
    cantidadReal: item.cantidadReal,
    merma: item.merma,
    precioAlmacen: item.precioAlmacen,
    valorStock: item.valorStock,
    observaciones: item.observaciones,
    materiaPrima: item.materiaPrima,
  }));
}

async function obtenerDatosSnapshot(idGranja: string, tablaOrigen: TablaOrigen) {
  switch (tablaOrigen) {
    case TablaOrigen.COMPRA:
      return snapshotCompras(idGranja);
    case TablaOrigen.FABRICACION:
      return snapshotFabricaciones(idGranja);
    case TablaOrigen.INVENTARIO:
      return snapshotInventario(idGranja);
    default:
      return [];
  }
}

export async function crearArchivoSnapshot({
  idGranja,
  idUsuario,
  tablaOrigen,
  descripcion,
}: CrearArchivoParams) {
  const datos = await obtenerDatosSnapshot(idGranja, tablaOrigen);

  const archivo = await prisma.archivoCabecera.create({
    data: {
      idGranja,
      tablaOrigen,
      fechaArchivo: new Date(),
      descripcionArchivo: descripcion,
      totalRegistros: datos.length,
    },
  });

  if (datos.length > 0) {
    await prisma.archivoDetalle.createMany({
      data: datos.map((dato) => ({
        idArchivo: archivo.id,
        datosJson: sanitizeJson(dato),
      })),
    });
  }

  await registrarAuditoria({
    idUsuario,
    idGranja,
    tablaOrigen,
    idRegistro: archivo.id,
    accion: 'CREATE',
    descripcion: `Archivo creado con ${datos.length} registros para ${tablaOrigen}`,
    datosNuevos: {
      descripcion,
      totalRegistros: datos.length,
    },
  });

  return archivo;
}

export async function listarArchivosPorGranja(idGranja: string) {
  return prisma.archivoCabecera.findMany({
    where: { idGranja },
    orderBy: { fechaArchivo: 'desc' },
  });
}

export async function obtenerArchivoConDetalle(idGranja: string, idArchivo: string) {
  const archivo = await prisma.archivoCabecera.findFirst({
    where: { id: idArchivo, idGranja },
    include: {
      archivosDetalle: {
        orderBy: { id: 'asc' },
      },
    },
  });

  if (!archivo) {
    throw Object.assign(new Error('Archivo no encontrado'), { status: 404 });
  }

  return archivo;
}

export async function eliminarArchivo({
  idArchivo,
  idGranja,
  idUsuario,
}: {
  idArchivo: string;
  idGranja: string;
  idUsuario: string;
}) {
  const archivo = await prisma.archivoCabecera.findFirst({
    where: { id: idArchivo, idGranja },
  });

  if (!archivo) {
    throw Object.assign(new Error('Archivo no encontrado'), { status: 404 });
  }

  await prisma.archivoDetalle.deleteMany({
    where: { idArchivo },
  });

  await prisma.archivoCabecera.delete({
    where: { id: idArchivo },
  });

  await registrarAuditoria({
    idUsuario,
    idGranja,
    tablaOrigen: archivo.tablaOrigen,
    idRegistro: idArchivo,
    accion: 'DELETE',
    descripcion: `Archivo eliminado (${archivo.descripcionArchivo})`,
    datosAnteriores: {
      descripcion: archivo.descripcionArchivo,
      totalRegistros: archivo.totalRegistros,
    },
  });

  return {
    mensaje: 'Archivo eliminado correctamente',
  };
}


