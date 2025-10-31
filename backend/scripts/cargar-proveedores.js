/*
 * Script: Cargar Proveedores
 * Uso: node scripts/cargar-proveedores.js --granja <ID_GRANJA>
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

// Datos provistos por el usuario
const proveedoresFuente = [
	{ nombre: 'VETIFARMA SA', localidad: 'PARQUE INDUSTRIAL LA PLATA - LA PLATA - PCIA. BUENOS AIRES' },
	{ nombre: 'GIORDANO JOSE LUIS', localidad: 'JUSTO DADACT - PCIA. SAN LUIS' },
	{ nombre: 'GUINDA ABEL DARIO', localidad: 'JUSTO DADACT - PCIA. SAN LUIS' },
	{ nombre: 'EDUARDO TRAVAGLIA SA.', localidad: 'SAMPACHO - PCIA. CÓRDOBA' },
	{ nombre: 'INSUMOS Y ACOPIOS DEL SUR SA.', localidad: 'RIO CUARTO - CÓRDOBA' },
	{ nombre: 'OGGERO DIEGO', localidad: 'RIO CUARTO - PCIA. CÓRDOBA' },
	{ nombre: 'BIOFARMA SA.', localidad: 'CÓRDOBA - PCIA. CÓRDOBA' },
	{ nombre: 'AGRO CIGEA SA', localidad: 'VILLA MERCEDES - PCIA. SAN LUIS' },
	{ nombre: 'BRESSAN FERNANDO RAUL', localidad: 'SAMPACHO - PCIA. CÓRDOBA' },
	{ nombre: 'JAMES & SON SA', localidad: 'BALCARCE - PCIA. BUENOS AIRES' },
	{ nombre: 'RISIO MARTÍN MIGUEL', localidad: 'VILLA MERCEDES - PCIA. SAN LUIS' },
	{ nombre: 'BRESSAN SERVANDO LUIS', localidad: 'SAMPACHO - PCIA. CÓRDOBA' },
	{ nombre: 'SEVASTEI SILVIO DANIEL', localidad: 'JUSTO DADACT - PCIA. SAN LUIS' },
	{ nombre: 'ESTANCIA DON ADOLFO SA', localidad: 'BRAGADO - PCIA. BUENOS AIRES' },
];

// Nota: Dirección provista adicional
const direccionExtra = 'Teniente Escola 5477, Córdoba, Provincia de Córdoba, Argentina';

function generarCodigoProveedor(indice) {
	const num = (indice + 1).toString().padStart(3, '0');
	return `PRV${num}`;
}

async function main() {
	console.log(`Cargando proveedores para granja: ${idGranja} ...`);

	let indiceBase = 0;
	for (const prov of proveedoresFuente) {
		const codigoProveedor = generarCodigoProveedor(indiceBase++);
		const nombreProveedor = prov.nombre.trim();
		const localidad = prov.localidad.trim();

		// Si el nombre menciona BIOFARMA en Córdoba, añadimos la dirección extra
		const direccion = nombreProveedor.toUpperCase().includes('BIOFARMA') ? direccionExtra : null;

		// Verificar existencia por (idGranja, nombreProveedor) o (idGranja, codigoProveedor)
		const existente = await prisma.proveedor.findFirst({
			where: {
				idGranja,
				OR: [
					{ codigoProveedor },
					{ nombreProveedor },
				],
			},
		});

		if (existente) {
			console.log(`↷ Ya existe: ${existente.codigoProveedor} - ${existente.nombreProveedor}. Omitiendo...`);
			continue;
		}

		const creado = await prisma.proveedor.create({
			data: {
				idGranja,
				activo: true,
				codigoProveedor,
				nombreProveedor,
				direccion,
				localidad,
			},
		});
		console.log(`✓ Creado: ${creado.codigoProveedor} - ${creado.nombreProveedor}`);
	}

	console.log('Finalizado.');
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});

