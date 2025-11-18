/**
 * Script para actualizar el enum PlanSuscripcion en la base de datos
 * Agrega los nuevos valores y migra los datos existentes
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function actualizarEnum() {
  try {
    console.log('🔄 Actualizando enum PlanSuscripcion...');

    // Paso 1: Agregar nuevos valores al enum
    console.log('📝 Agregando nuevos valores al enum...');
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'DEMO' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PlanSuscripcion')) THEN
          ALTER TYPE "PlanSuscripcion" ADD VALUE 'DEMO';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'STARTER' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PlanSuscripcion')) THEN
          ALTER TYPE "PlanSuscripcion" ADD VALUE 'STARTER';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'BUSINESS' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PlanSuscripcion')) THEN
          ALTER TYPE "PlanSuscripcion" ADD VALUE 'BUSINESS';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ENTERPRISE' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PlanSuscripcion')) THEN
          ALTER TYPE "PlanSuscripcion" ADD VALUE 'ENTERPRISE';
        END IF;
      END $$;
    `);
    console.log('✅ Valores agregados al enum');

    // Paso 2: Migrar datos existentes
    console.log('📊 Migrando datos existentes...');
    const resultado = await prisma.$executeRawUnsafe(`
      UPDATE t_usuarios 
      SET "planSuscripcion" = 'DEMO'::"PlanSuscripcion"
      WHERE "planSuscripcion"::text IN ('PLAN_0', 'PLAN_1', 'PLAN_2', 'PLAN_3', 'PLAN_4')
    `);
    console.log(`✅ ${resultado} usuarios migrados a DEMO`);

    console.log('\n✅ Enum actualizado exitosamente');
  } catch (error) {
    console.error('❌ Error actualizando enum:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar actualización
actualizarEnum()
  .then(() => {
    console.log('\n✅ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });

