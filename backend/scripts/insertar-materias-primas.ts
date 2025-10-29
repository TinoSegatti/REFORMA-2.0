import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const materiasPrimas = [
  'ACEITE DE SOJA',
  'PELLET DE SOJA',
  'MAIZ',
  'SORGO',
  'AFRECHO DE TRIGO',
  'LISINA',
  'TRIGO',
  'PELLET DE GIRASOL',
  'POROTO DE SOJA DESACTIVADO',
  'HARINA DE CARNE',
  'FITASA 10%',
  'EXPELLER DE SOJA',
  'HARINA DE SOJA HIPRO',
  'FOSFATO MONODICALCICO',
  'CONCHILLA',
  'SANGRE SPRAY',
  'TREONINA',
  'VETIMIX 20%',
  'VETIMIX 6%',
  'PREMIX DESARROLLO',
  'PREMIX TERMINADOR',
  'PREMIX GESTACION',
  'PREMIX LACTACION',
  'VETIMIX 3,5%',
  'CASCARILLA DE SOJA',
  'VETIMIX 30W',
  'VETIMIX 10W',
  'PRIMALAC',
  'NUTRILACTA I',
  'NUTRILACTA II',
  'BOAR PROLIFIC'
];

async function insertarMateriasPrimas() {
  try {
    console.log('🚀 Insertando materias primas...');

    // Obtener todas las granjas
    const granjas = await prisma.granja.findMany();
    
    if (granjas.length === 0) {
      console.log('❌ No hay granjas en la base de datos');
      return;
    }

    let totalInsertadas = 0;

    for (const granja of granjas) {
      console.log(`\n📦 Procesando granja: ${granja.nombreGranja}`);
      
      for (let i = 0; i < materiasPrimas.length; i++) {
        const materia = materiasPrimas[i];
        const codigo = `MP${String(i + 1).padStart(3, '0')}`;
        
        try {
          await prisma.materiaPrima.create({
            data: {
              idGranja: granja.id,
              codigoMateriaPrima: codigo,
              nombreMateriaPrima: materia,
              precioPorKilo: 0, // Se calculará automáticamente
            }
          });
          
          console.log(`  ✅ ${codigo} - ${materia}`);
          totalInsertadas++;
        } catch (error: any) {
          if (error.code === 'P2002') {
            console.log(`  ⚠️  ${codigo} - ${materia} (ya existe)`);
          } else {
            console.log(`  ❌ Error con ${codigo} - ${materia}:`, error.message);
          }
        }
      }
    }

    console.log(`\n🎉 Proceso completado!`);
    console.log(`📊 Total materias primas insertadas: ${totalInsertadas}`);
    console.log(`🏭 Granjas procesadas: ${granjas.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

insertarMateriasPrimas();

