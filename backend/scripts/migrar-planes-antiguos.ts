/**
 * Script para migrar usuarios con planes antiguos (PLAN_0, PLAN_1, etc.) a DEMO
 * Ejecutar antes de cambiar el enum PlanSuscripcion
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrarPlanesAntiguos() {
  try {
    console.log('🔄 Iniciando migración de planes antiguos...');

    // Obtener todos los usuarios con planes antiguos
    const usuarios = await prisma.$queryRaw<Array<{ id: string; email: string; planSuscripcion: string }>>`
      SELECT id, email, "planSuscripcion"::text
      FROM t_usuarios
      WHERE "planSuscripcion"::text IN ('PLAN_0', 'PLAN_1', 'PLAN_2', 'PLAN_3', 'PLAN_4')
    `;

    console.log(`📊 Encontrados ${usuarios.length} usuarios con planes antiguos`);

    let migrados = 0;

    for (const usuario of usuarios) {
      try {
        // Actualizar a DEMO usando raw query para evitar problemas con el enum
        await prisma.$executeRaw`
          UPDATE t_usuarios
          SET "planSuscripcion" = 'DEMO'::"PlanSuscripcion"
          WHERE id = ${usuario.id}
        `;
        migrados++;
        console.log(`✅ Usuario ${usuario.email} migrado a DEMO`);
      } catch (error) {
        console.error(`❌ Error migrando usuario ${usuario.email}:`, error);
      }
    }

    console.log('\n📈 Resumen de migración:');
    console.log(`   ✅ Migrados: ${migrados}`);
    console.log(`   📊 Total: ${usuarios.length}`);

  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar migración
migrarPlanesAntiguos()
  .then(() => {
    console.log('\n✅ Migración completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal en migración:', error);
    process.exit(1);
  });

