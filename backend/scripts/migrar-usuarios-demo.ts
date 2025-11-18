/**
 * Script para migrar usuarios existentes a plan DEMO
 * Ejecutar después de la migración de base de datos
 */

import { PrismaClient, PlanSuscripcion } from '@prisma/client';

const prisma = new PrismaClient();

async function migrarUsuariosDemo() {
  try {
    console.log('🔄 Iniciando migración de usuarios a plan DEMO...');

    // Obtener todos los usuarios que no tienen suscripción
    const usuariosSinSuscripcion = await prisma.usuario.findMany({
      where: {
        suscripcion: null,
      },
    });

    console.log(`📊 Encontrados ${usuariosSinSuscripcion.length} usuarios sin suscripción`);

    let migrados = 0;
    let errores = 0;

    for (const usuario of usuariosSinSuscripcion) {
      try {
        // Actualizar plan a DEMO si no lo está
        if (usuario.planSuscripcion !== PlanSuscripcion.DEMO) {
          await prisma.usuario.update({
            where: { id: usuario.id },
            data: { planSuscripcion: PlanSuscripcion.DEMO },
          });
        }

        // Crear suscripción DEMO directamente (sin usar stripeService)
        const fechaFin = new Date();
        fechaFin.setDate(fechaFin.getDate() + 30); // 30 días desde hoy

        await prisma.suscripcion.create({
          data: {
            idUsuario: usuario.id,
            planSuscripcion: PlanSuscripcion.DEMO,
            estadoSuscripcion: 'ACTIVA',
            periodoFacturacion: 'MENSUAL',
            fechaInicio: new Date(),
            fechaFin,
            precio: 0,
            moneda: 'USD',
          },
        });
        migrados++;
        console.log(`✅ Usuario ${usuario.email} migrado a DEMO`);
      } catch (error) {
        errores++;
        console.error(`❌ Error migrando usuario ${usuario.email}:`, error);
      }
    }

    console.log('\n📈 Resumen de migración:');
    console.log(`   ✅ Migrados: ${migrados}`);
    console.log(`   ❌ Errores: ${errores}`);
    console.log(`   📊 Total: ${usuariosSinSuscripcion.length}`);

  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar migración
migrarUsuariosDemo()
  .then(() => {
    console.log('\n✅ Migración completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal en migración:', error);
    process.exit(1);
  });

