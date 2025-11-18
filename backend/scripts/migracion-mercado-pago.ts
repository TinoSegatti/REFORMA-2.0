/**
 * Script de migración incremental para Mercado Pago
 * Aplica cambios en partes para optimizar tiempos de carga
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando migración a Mercado Pago...\n');

  try {
    // Paso 1: Agregar MERCADOPAGO al enum MetodoPago
    console.log('📝 Paso 1: Agregando MERCADOPAGO al enum MetodoPago...');
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'MERCADOPAGO' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'MetodoPago')
          ) THEN
            ALTER TYPE "MetodoPago" ADD VALUE 'MERCADOPAGO' AFTER 'PAYPAL';
          END IF;
        END $$;
      `);
      console.log('✅ MERCADOPAGO agregado al enum MetodoPago\n');
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log('⚠️  MERCADOPAGO ya existe en el enum, continuando...\n');
      } else {
        throw error;
      }
    }

    // Paso 2: Agregar campo mercadoPagoPreapprovalId a Suscripcion
    console.log('📝 Paso 2: Agregando campo mercadoPagoPreapprovalId a Suscripcion...');
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 't_suscripciones' 
            AND column_name = 'mercadoPagoPreapprovalId'
          ) THEN
            ALTER TABLE "t_suscripciones" 
            ADD COLUMN "mercadoPagoPreapprovalId" TEXT;
          END IF;
        END $$;
      `);
      console.log('✅ Campo mercadoPagoPreapprovalId agregado a Suscripcion\n');
    } catch (error: any) {
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        console.log('⚠️  Campo mercadoPagoPreapprovalId ya existe, continuando...\n');
      } else {
        throw error;
      }
    }

    // Paso 3: Agregar índice único para mercadoPagoPreapprovalId
    console.log('📝 Paso 3: Agregando índice único para mercadoPagoPreapprovalId...');
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 't_suscripciones' 
            AND indexname = 't_suscripciones_mercadoPagoPreapprovalId_key'
          ) THEN
            CREATE UNIQUE INDEX "t_suscripciones_mercadoPagoPreapprovalId_key" 
            ON "t_suscripciones"("mercadoPagoPreapprovalId") 
            WHERE "mercadoPagoPreapprovalId" IS NOT NULL;
          END IF;
        END $$;
      `);
      console.log('✅ Índice único agregado para mercadoPagoPreapprovalId\n');
    } catch (error: any) {
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        console.log('⚠️  Índice ya existe, continuando...\n');
      } else {
        throw error;
      }
    }

    // Paso 4: Agregar campo mercadoPagoPaymentId a Pago
    console.log('📝 Paso 4: Agregando campo mercadoPagoPaymentId a Pago...');
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 't_pagos' 
            AND column_name = 'mercadoPagoPaymentId'
          ) THEN
            ALTER TABLE "t_pagos" 
            ADD COLUMN "mercadoPagoPaymentId" TEXT;
          END IF;
        END $$;
      `);
      console.log('✅ Campo mercadoPagoPaymentId agregado a Pago\n');
    } catch (error: any) {
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        console.log('⚠️  Campo mercadoPagoPaymentId ya existe, continuando...\n');
      } else {
        throw error;
      }
    }

    // Paso 5: Agregar índice único para mercadoPagoPaymentId
    console.log('📝 Paso 5: Agregando índice único para mercadoPagoPaymentId...');
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 't_pagos' 
            AND indexname = 't_pagos_mercadoPagoPaymentId_key'
          ) THEN
            CREATE UNIQUE INDEX "t_pagos_mercadoPagoPaymentId_key" 
            ON "t_pagos"("mercadoPagoPaymentId") 
            WHERE "mercadoPagoPaymentId" IS NOT NULL;
          END IF;
        END $$;
      `);
      console.log('✅ Índice único agregado para mercadoPagoPaymentId\n');
    } catch (error: any) {
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        console.log('⚠️  Índice ya existe, continuando...\n');
      } else {
        throw error;
      }
    }

    // Paso 6: Agregar campo mercadoPagoPreapprovalId a Pago
    console.log('📝 Paso 6: Agregando campo mercadoPagoPreapprovalId a Pago...');
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 't_pagos' 
            AND column_name = 'mercadoPagoPreapprovalId'
          ) THEN
            ALTER TABLE "t_pagos" 
            ADD COLUMN "mercadoPagoPreapprovalId" TEXT;
          END IF;
        END $$;
      `);
      console.log('✅ Campo mercadoPagoPreapprovalId agregado a Pago\n');
    } catch (error: any) {
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        console.log('⚠️  Campo mercadoPagoPreapprovalId ya existe, continuando...\n');
      } else {
        throw error;
      }
    }

    console.log('✅ Migración completada exitosamente!\n');
    console.log('📊 Resumen de cambios:');
    console.log('   - Enum MetodoPago: MERCADOPAGO agregado');
    console.log('   - Suscripcion: mercadoPagoPreapprovalId agregado');
    console.log('   - Pago: mercadoPagoPaymentId y mercadoPagoPreapprovalId agregados');
    console.log('   - Índices únicos creados\n');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });

