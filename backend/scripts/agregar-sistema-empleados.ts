/**
 * Script para agregar campos del sistema de usuarios empleados
 * Ejecutar con: npx ts-node scripts/agregar-sistema-empleados.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function agregarSistemaEmpleados() {
  try {
    console.log('🔄 Agregando sistema de usuarios empleados...');

    // 1. Agregar enum RolEmpleado
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
          CREATE TYPE "RolEmpleado" AS ENUM ('ADMIN', 'EDITOR', 'LECTOR');
      EXCEPTION
          WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ Enum RolEmpleado creado');

    // 2. Agregar codigoReferencia
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 't_usuarios' AND column_name = 'codigoReferencia') THEN
              ALTER TABLE "t_usuarios" ADD COLUMN "codigoReferencia" TEXT;
          END IF;
      END $$;
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "t_usuarios_codigoReferencia_key" 
      ON "t_usuarios"("codigoReferencia") 
      WHERE "codigoReferencia" IS NOT NULL;
    `);
    console.log('✅ Campo codigoReferencia agregado');

    // 3. Agregar fechaGeneracionCodigo
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 't_usuarios' AND column_name = 'fechaGeneracionCodigo') THEN
              ALTER TABLE "t_usuarios" ADD COLUMN "fechaGeneracionCodigo" TIMESTAMP(3);
          END IF;
      END $$;
    `);
    console.log('✅ Campo fechaGeneracionCodigo agregado');

    // 4. Agregar codigoExpiracion
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 't_usuarios' AND column_name = 'codigoExpiracion') THEN
              ALTER TABLE "t_usuarios" ADD COLUMN "codigoExpiracion" TIMESTAMP(3);
          END IF;
      END $$;
    `);
    console.log('✅ Campo codigoExpiracion agregado');

    // 5. Agregar esUsuarioEmpleado
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 't_usuarios' AND column_name = 'esUsuarioEmpleado') THEN
              ALTER TABLE "t_usuarios" ADD COLUMN "esUsuarioEmpleado" BOOLEAN NOT NULL DEFAULT false;
          END IF;
      END $$;
    `);
    console.log('✅ Campo esUsuarioEmpleado agregado');

    // 6. Agregar idUsuarioDueño
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 't_usuarios' AND column_name = 'idUsuarioDueño') THEN
              ALTER TABLE "t_usuarios" ADD COLUMN "idUsuarioDueño" TEXT;
          END IF;
      END $$;
    `);
    console.log('✅ Campo idUsuarioDueño agregado');

    // 7. Agregar fechaVinculacion
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 't_usuarios' AND column_name = 'fechaVinculacion') THEN
              ALTER TABLE "t_usuarios" ADD COLUMN "fechaVinculacion" TIMESTAMP(3);
          END IF;
      END $$;
    `);
    console.log('✅ Campo fechaVinculacion agregado');

    // 8. Agregar rolEmpleado
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 't_usuarios' AND column_name = 'rolEmpleado') THEN
              ALTER TABLE "t_usuarios" ADD COLUMN "rolEmpleado" "RolEmpleado" DEFAULT 'EDITOR';
          END IF;
      END $$;
    `);
    console.log('✅ Campo rolEmpleado agregado');

    // 9. Agregar activoComoEmpleado
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 't_usuarios' AND column_name = 'activoComoEmpleado') THEN
              ALTER TABLE "t_usuarios" ADD COLUMN "activoComoEmpleado" BOOLEAN NOT NULL DEFAULT true;
          END IF;
      END $$;
    `);
    console.log('✅ Campo activoComoEmpleado agregado');

    // 10. Agregar foreign key
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints 
              WHERE constraint_name = 't_usuarios_idUsuarioDueño_fkey'
          ) THEN
              ALTER TABLE "t_usuarios" 
              ADD CONSTRAINT "t_usuarios_idUsuarioDueño_fkey" 
              FOREIGN KEY ("idUsuarioDueño") 
              REFERENCES "t_usuarios"("id") 
              ON DELETE SET NULL 
              ON UPDATE CASCADE;
          END IF;
      END $$;
    `);
    console.log('✅ Foreign key agregada');

    // 11. Crear índice
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_indexes 
              WHERE tablename = 't_usuarios' 
              AND indexname = 't_usuarios_idUsuarioDueño_idx'
          ) THEN
              CREATE INDEX "t_usuarios_idUsuarioDueño_idx" ON "t_usuarios"("idUsuarioDueño");
          END IF;
      END $$;
    `);
    console.log('✅ Índice creado');

    console.log('✅ Sistema de usuarios empleados agregado exitosamente');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

agregarSistemaEmpleados();

