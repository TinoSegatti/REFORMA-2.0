/*
 * Script: Eliminar Todas las Compras y Verificar Inventario
 * Uso: node scripts/eliminar-compras-y-verificar-inventario.js --granja <ID_GRANJA>
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function parseArg(name) {
	const idx = process.argv.indexOf(`--${name}`);
	if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
	return null;
}

const idGranja = parseArg('granja') || process.env.GRANJA_ID;
if (!idGranja) {
	console.error('Falta el parámetro --granja <ID_GRANJA> o la variable de entorno GRANJA_ID');
	process.exit(1);
}

async function obtenerEstadoInicialInventario() {
	const inventario = await prisma.$queryRaw`
		SELECT 
			i."idMateriaPrima",
			mp."codigoMateriaPrima",
			mp."nombreMateriaPrima",
			i."cantidadAcumulada",
			i."cantidadSistema",
			i."cantidadReal",
			i."precioAlmacen",
			i."valorStock"
		FROM t_inventario i
		INNER JOIN t_materia_prima mp ON i."idMateriaPrima" = mp.id
		WHERE i."idGranja" = ${idGranja}
		ORDER BY mp."codigoMateriaPrima"
	`;
	return inventario;
}

async function recalcularInventario(idGranja, idMateriaPrima) {
	// Calcular cantidad acumulada
	const cantidadAcumulada = await prisma.$queryRaw`
		SELECT COALESCE(SUM(cd."cantidadComprada"), 0) as cantidad
		FROM t_compra_detalle cd
		INNER JOIN t_compra_cabecera cc ON cd."idCompra" = cc.id
		WHERE cc."idGranja" = ${idGranja}
			AND cd."idMateriaPrima" = ${idMateriaPrima}
	`;

	const cantidad = cantidadAcumulada[0]?.cantidad || 0;

	// Calcular cantidad sistema (restar fabricaciones)
	const fabricaciones = await prisma.$queryRaw`
		SELECT COALESCE(SUM(df."cantidadUsada"), 0) as cantidad
		FROM t_detalle_fabricacion df
		INNER JOIN t_fabricacion f ON df."idFabricacion" = f.id
		WHERE f."idGranja" = ${idGranja}
			AND df."idMateriaPrima" = ${idMateriaPrima}
	`;

	const cantidadUsada = fabricaciones[0]?.cantidad || 0;
	const cantidadSistema = cantidad - cantidadUsada;

	// Calcular precio almacen
	const precioAlmacen = await prisma.$queryRaw`
		SELECT 
			CASE 
				WHEN SUM(cd."cantidadComprada") > 0 
				THEN SUM(cd."cantidadComprada" * cd."precioUnitario") / SUM(cd."cantidadComprada")
				ELSE 0
			END as precio
		FROM t_compra_detalle cd
		INNER JOIN t_compra_cabecera cc ON cd."idCompra" = cc.id
		WHERE cc."idGranja" = ${idGranja}
			AND cd."idMateriaPrima" = ${idMateriaPrima}
	`;

	const precio = precioAlmacen[0]?.precio || 0;

	// Obtener cantidad real actual
	const inv = await prisma.inventario.findUnique({
		where: {
			idGranja_idMateriaPrima: {
				idGranja,
				idMateriaPrima
			}
		}
	});

	const cantidadReal = inv?.cantidadReal || cantidadSistema;
	const merma = cantidadSistema - cantidadReal;
	const valorStock = cantidadReal * precio;

	// Actualizar inventario
	await prisma.inventario.upsert({
		where: {
			idGranja_idMateriaPrima: {
				idGranja,
				idMateriaPrima
			}
		},
		create: {
			idGranja,
			idMateriaPrima,
			cantidadAcumulada: cantidad,
			cantidadSistema,
			cantidadReal,
			merma,
			precioAlmacen: precio,
			valorStock
		},
		update: {
			cantidadAcumulada: cantidad,
			cantidadSistema,
			merma,
			precioAlmacen: precio,
			valorStock
		}
	});
}

async function main() {
	console.log(`\n🔄 Eliminando todas las compras de la granja: ${idGranja}...\n`);

	// Obtener estado inicial del inventario
	console.log('📊 Estado inicial del inventario:');
	const estadoInicial = await obtenerEstadoInicialInventario();
	if (estadoInicial.length > 0) {
		console.table(estadoInicial);
	} else {
		console.log('   No hay inventario registrado.');
	}

	// Obtener todas las compras
	const compras = await prisma.compraCabecera.findMany({
		where: { idGranja },
		include: {
			comprasDetalle: {
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

	console.log(`\n📦 Compras encontradas: ${compras.length}\n`);

	if (compras.length === 0) {
		console.log('✅ No hay compras para eliminar.');
		const estadoFinal = await obtenerEstadoInicialInventario();
		if (estadoFinal.length > 0) {
			console.log('\n📊 Estado final del inventario:');
			console.table(estadoFinal);
		}
		await prisma.$disconnect();
		return;
	}

	// Obtener todas las materias primas afectadas antes de eliminar
	const materiasPrimasAfectadas = new Set();
	for (const compra of compras) {
		for (const detalle of compra.comprasDetalle) {
			materiasPrimasAfectadas.add(detalle.idMateriaPrima);
		}
	}

	// Eliminar todas las compras (cascada eliminará los detalles)
	console.log('🗑️  Eliminando compras...');
	for (const compra of compras) {
		// Primero eliminar todos los items manualmente para que se recalcule inventario
		for (const detalle of compra.comprasDetalle) {
			await prisma.compraDetalle.delete({
				where: { id: detalle.id }
			});
			// Recalcular inventario después de cada eliminación
			await recalcularInventario(idGranja, detalle.idMateriaPrima);
		}
		// Eliminar cabecera
		await prisma.compraCabecera.delete({
			where: { id: compra.id }
		});
		console.log(`   ✓ Compra ${compra.numeroFactura || compra.id} eliminada (${compra.comprasDetalle.length} items)`);
	}

	// Recalcular inventario para todas las materias primas afectadas
	console.log('\n🔄 Recalculando inventario para todas las materias primas afectadas...');
	for (const idMateriaPrima of materiasPrimasAfectadas) {
		await recalcularInventario(idGranja, idMateriaPrima);
	}

	// Verificar estado final
	console.log('\n📊 Estado final del inventario:');
	const estadoFinal = await obtenerEstadoInicialInventario();
	if (estadoFinal.length > 0) {
		console.table(estadoFinal);
	} else {
		console.log('   Inventario vacío.');
	}

	// Comparar estados
	if (estadoInicial.length > 0 && estadoFinal.length > 0) {
		console.log('\n📈 Comparación de estados:');
		const comparacion = estadoInicial.map((inicial) => {
			const final = estadoFinal.find(f => f.idMateriaPrima === inicial.idMateriaPrima);
			const estabaEnCompras = materiasPrimasAfectadas.has(inicial.idMateriaPrima);
			return {
				'Código MP': inicial.codigoMateriaPrima,
				'Nombre MP': inicial.nombreMateriaPrima,
				'Cant. Acum. Inicial': Number(inicial.cantidadAcumulada).toFixed(2),
				'Cant. Acum. Final': final ? Number(final.cantidadAcumulada).toFixed(2) : '0.00',
				'Precio Inicial': Number(inicial.precioAlmacen).toFixed(2),
				'Precio Final': final ? Number(final.precioAlmacen).toFixed(2) : '0.00',
				'Estado': !estabaEnCompras ? '⏩ Sin cambios' : 
				         (final && Number(final.cantidadAcumulada) === 0 && Number(inicial.cantidadAcumulada) > 0) ? '✅ Revertido' : 
				         (Number(final?.cantidadAcumulada || 0) === Number(inicial.cantidadAcumulada)) ? '✅ Correcto' : '⚠️  Revisar'
			};
		});
		console.table(comparacion);
	}

	console.log('\n✅ Proceso completado.');
}

main()
	.catch((e) => {
		console.error('❌ Error:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
