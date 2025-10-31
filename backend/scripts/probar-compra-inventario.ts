import 'dotenv/config';
import prisma from '../src/lib/prisma';
import { crearCompra } from '../src/services/compraService';

async function main() {
  const idGranja = process.argv[2] || process.env.TEST_ID_GRANJA || 'cmhb1rny80001kdc4f35jh6ky';

  // Verificar granja
  const granja = await prisma.granja.findUnique({ where: { id: idGranja } });
  if (!granja) {
    throw new Error(`Granja no encontrada: ${idGranja}`);
  }

  const idUsuario = granja.idUsuario;

  // LIMPIEZA: eliminar compras de prueba previas y registros asociados (solo facturas PRUEBA- y MP MAIZ)
  // Borrar detalles de compras de MP MAIZ en facturas PRUEBA-
  const comprasPrueba = await prisma.compraCabecera.findMany({
    where: { idGranja, numeroFactura: { startsWith: 'PRUEBA-' } },
    select: { id: true }
  });
  if (comprasPrueba.length > 0) {
    await prisma.compraDetalle.deleteMany({ where: { idCompra: { in: comprasPrueba.map(c => c.id) } } });
    await prisma.compraCabecera.deleteMany({ where: { id: { in: comprasPrueba.map(c => c.id) } } });
  }

  // Borrar inventario y MP MAIZ previos
  const mpPrev = await prisma.materiaPrima.findFirst({ where: { idGranja, codigoMateriaPrima: 'MAIZ' } });
  if (mpPrev) {
    await prisma.inventario.deleteMany({ where: { idGranja, idMateriaPrima: mpPrev.id } });
    await prisma.compraDetalle.deleteMany({ where: { idMateriaPrima: mpPrev.id } });
  }

  // Asegurar proveedor de prueba
  let proveedor = await prisma.proveedor.findFirst({
    where: { idGranja, codigoProveedor: 'TEST-PROV' }
  });
  if (!proveedor) {
    proveedor = await prisma.proveedor.create({
      data: {
        idGranja,
        codigoProveedor: 'TEST-PROV',
        nombreProveedor: 'Proveedor de Prueba'
      }
    });
  }

  // Asegurar materia prima MAIZ
  let mp = await prisma.materiaPrima.findFirst({
    where: { idGranja, codigoMateriaPrima: 'MAIZ' }
  });
  if (!mp) {
    mp = await prisma.materiaPrima.create({
      data: {
        idGranja,
        codigoMateriaPrima: 'MAIZ',
        nombreMateriaPrima: 'Maíz',
        precioPorKilo: 40
      }
    });
  } else {
    // setear precio inicial 40
    await prisma.materiaPrima.update({ where: { id: mp.id }, data: { precioPorKilo: 40 } });
  }

  // Inicializar inventario a 50.000 kg a $40 (base de inicialización)
  await prisma.inventario.create({
    data: {
      idGranja,
      idMateriaPrima: mp.id,
      cantidadAcumulada: 50000,
      cantidadSistema: 50000,
      cantidadReal: 50000,
      merma: 0,
      precioAlmacen: 40,
      valorStock: 50000 * 40,
      observaciones: 'Inicialización de inventario (base)'
    }
  });

  // Crear compra con un ítem de MAIZ a $42
  const compra = await crearCompra({
    idGranja,
    idUsuario,
    idProveedor: proveedor.id,
    numeroFactura: `PRUEBA-${Date.now()}`,
    fechaCompra: new Date(),
    observaciones: 'Compra de prueba para verificación de inventario',
    detalles: [
      {
        idMateriaPrima: mp.id,
        cantidadComprada: 1000,
        precioUnitario: 42
      }
    ]
  });

  // Leer resultados
  const mpActual = await prisma.materiaPrima.findUnique({ where: { id: mp.id } });
  const inventario = await prisma.inventario.findUnique({
    where: { idGranja_idMateriaPrima: { idGranja, idMateriaPrima: mp.id } }
  });

  const resultados = {
    granja: idGranja,
    materiaPrima: {
      id: mp.id,
      codigo: mp.codigoMateriaPrima,
      nombre: mp.nombreMateriaPrima,
      precioPorKiloAntes: 40,
      precioPorKiloDespues: mpActual?.precioPorKilo
    },
    compra: {
      id: compra.id,
      totalFactura: compra.totalFactura,
      items: compra.comprasDetalle.length
    },
    inventario: {
      cantidadAcumulada: inventario?.cantidadAcumulada,
      cantidadSistema: inventario?.cantidadSistema,
      cantidadReal: inventario?.cantidadReal,
      precioAlmacen: inventario?.precioAlmacen,
      valorStock: inventario?.valorStock
    }
  };

  const md = `# Resultados Prueba Compra → Inventario (corrida controlada)\n\n` +
    `- Granja: ${idGranja}\n` +
    `- Materia Prima: ${mp.codigoMateriaPrima} - ${mp.nombreMateriaPrima}\n\n` +
    `## Después de compra a $42\n` +
    `- precioPorKilo (esperado 42): ${mpActual?.precioPorKilo}\n` +
    `- cantidadAcumulada (esperado 51000): ${inventario?.cantidadAcumulada}\n` +
    `- cantidadSistema (esperado 51000): ${inventario?.cantidadSistema}\n` +
    `- cantidadReal (sincronizada con sistema, esperado 51000): ${inventario?.cantidadReal}\n` +
    `- precioAlmacen (esperado promedio simple (40+42)/2 = 41): ${inventario?.precioAlmacen}\n` +
    `- valorStock: ${inventario?.valorStock}\n`;

  // Guardar documento
  const fs = await import('fs/promises');
  await fs.mkdir('docs', { recursive: true });
  await fs.writeFile('docs/RESULTADOS_PRUEBA_COMPRA_INVENTARIO.md', md, 'utf8');

  console.log(md);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });



