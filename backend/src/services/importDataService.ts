/**
 * Servicio de Importación de Datos
 * Permite importar datos entre granjas
 */

import prisma from '../lib/prisma';

interface ImportarMateriasPrimasParams {
  idGranjaOrigen: string;
  idGranjaDestino: string;
  idUsuario: string;
}

/**
 * Importa materias primas de una granja a otra
 */
export async function importarMateriasPrimas(params: ImportarMateriasPrimasParams) {
  const { idGranjaOrigen, idGranjaDestino, idUsuario } = params;

  // Verificar que la granja destino tiene menos de 5 materias primas
  const materiasDestino = await prisma.materiaPrima.count({
    where: { idGranja: idGranjaDestino }
  });

  if (materiasDestino >= 5) {
    throw new Error('La granja destino ya tiene 5 o más materias primas. No se pueden importar más.');
  }

  // Obtener materias primas de la granja origen
  const materiasOrigen = await prisma.materiaPrima.findMany({
    where: { idGranja: idGranjaOrigen }
  });

  // Calcular cuántas se pueden importar
  const disponibles = 5 - materiasDestino;
  const aImportar = materiasOrigen.slice(0, disponibles);

  if (aImportar.length === 0) {
    throw new Error('No hay materias primas para importar');
  }

  // Importar materias primas
  const materiasImportadas = [];
  for (const materia of aImportar) {
    const nueva = await prisma.materiaPrima.create({
      data: {
        idGranja: idGranjaDestino,
        codigoMateriaPrima: materia.codigoMateriaPrima,
        nombreMateriaPrima: materia.nombreMateriaPrima,
        precioPorKilo: 0, // El precio se reseteará
      }
    });
    materiasImportadas.push(nueva);
  }

  return {
    importadas: materiasImportadas.length,
    total: aImportar.length,
    restantes: materiasOrigen.length - materiasImportadas.length
  };
}

/**
 * Importa proveedores de una granja a otra
 */
export async function importarProveedores(params: ImportarMateriasPrimasParams) {
  const { idGranjaOrigen, idGranjaDestino, idUsuario } = params;

  // Obtener proveedores de la granja origen
  const proveedoresOrigen = await prisma.proveedor.findMany({
    where: { idGranja: idGranjaOrigen }
  });

  // Importar proveedores (sin límite de cantidad)
  const proveedoresImportados = [];
  for (const proveedor of proveedoresOrigen) {
    try {
      const nuevo = await prisma.proveedor.create({
        data: {
          idGranja: idGranjaDestino,
          codigoProveedor: proveedor.codigoProveedor,
          nombreProveedor: proveedor.nombreProveedor,
          direccion: proveedor.direccion,
          localidad: proveedor.localidad,
        }
      });
      proveedoresImportados.push(nuevo);
    } catch (error: any) {
      // Si el código ya existe, se omite
      console.log(`Proveedor ${proveedor.codigoProveedor} ya existe`);
    }
  }

  return {
    importados: proveedoresImportados.length,
    total: proveedoresOrigen.length
  };
}

