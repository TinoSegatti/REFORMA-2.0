/**
 * Migración paso a paso para crear tablas de Suscripcion y Pago
 * Ejecuta cada paso por separado para facilitar la carga
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function ejecutarPaso(paso: number, descripcion: string, sql: string) {
  console.log(`\n📋 Paso ${paso}: ${descripcion}`);
  try {
    await prisma.$executeRawUnsafe(sql);
    console.log(`✅ Paso ${paso} completado`);
    return true;
  } catch (error: any) {
    // Si el error es que ya existe, lo consideramos éxito
    if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
      console.log(`⚠️  Paso ${paso}: Ya existe, continuando...`);
      return true;
    }
    console.error(`❌ Error en paso ${paso}:`, error.message);
    return false;
  }
}

async function migracionPasoAPaso() {
  console.log('🚀 Iniciando migración paso a paso...\n');

  const pasos = [
    {
      numero: 1,
      descripcion: 'Crear enum EstadoSuscripcion',
      sql: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EstadoSuscripcion') THEN
            CREATE TYPE "EstadoSuscripcion" AS ENUM ('ACTIVA', 'CANCELADA', 'SUSPENDIDA', 'EXPIRADA', 'PENDIENTE_PAGO');
          END IF;
        END $$;
      `,
    },
    {
      numero: 2,
      descripcion: 'Crear enum PeriodoFacturacion',
      sql: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PeriodoFacturacion') THEN
            CREATE TYPE "PeriodoFacturacion" AS ENUM ('MENSUAL', 'ANUAL');
          END IF;
        END $$;
      `,
    },
    {
      numero: 3,
      descripcion: 'Crear enum MetodoPago',
      sql: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MetodoPago') THEN
            CREATE TYPE "MetodoPago" AS ENUM ('STRIPE', 'PAYPAL', 'TRANSFERENCIA');
          END IF;
        END $$;
      `,
    },
    {
      numero: 4,
      descripcion: 'Crear enum EstadoPago',
      sql: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EstadoPago') THEN
            CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'COMPLETADO', 'FALLIDO', 'REEMBOLSADO', 'CANCELADO');
          END IF;
        END $$;
      `,
    },
    {
      numero: 5,
      descripcion: 'Crear tabla t_suscripciones',
      sql: `
        CREATE TABLE IF NOT EXISTS "t_suscripciones" (
          "id" TEXT NOT NULL,
          "idUsuario" TEXT NOT NULL,
          "planSuscripcion" "PlanSuscripcion" NOT NULL,
          "estadoSuscripcion" "EstadoSuscripcion" NOT NULL DEFAULT 'ACTIVA',
          "periodoFacturacion" "PeriodoFacturacion" NOT NULL,
          "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "fechaFin" TIMESTAMP(3) NOT NULL,
          "fechaProximaRenovacion" TIMESTAMP(3),
          "precio" DOUBLE PRECISION NOT NULL,
          "moneda" TEXT NOT NULL DEFAULT 'USD',
          "stripeCustomerId" TEXT,
          "stripeSubscriptionId" TEXT,
          "stripePriceId" TEXT,
          "paypalSubscriptionId" TEXT,
          "referenciaTransferencia" TEXT,
          "fechaPagoTransferencia" TIMESTAMP(3),
          "confirmadoTransferencia" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "t_suscripciones_pkey" PRIMARY KEY ("id")
        );
      `,
    },
    {
      numero: 6,
      descripcion: 'Crear índice idUsuario en t_suscripciones',
      sql: `CREATE INDEX IF NOT EXISTS "t_suscripciones_idUsuario_idx" ON "t_suscripciones"("idUsuario");`,
    },
    {
      numero: 7,
      descripcion: 'Crear índice estadoSuscripcion en t_suscripciones',
      sql: `CREATE INDEX IF NOT EXISTS "t_suscripciones_estadoSuscripcion_idx" ON "t_suscripciones"("estadoSuscripcion");`,
    },
    {
      numero: 8,
      descripcion: 'Crear índice fechaProximaRenovacion en t_suscripciones',
      sql: `CREATE INDEX IF NOT EXISTS "t_suscripciones_fechaProximaRenovacion_idx" ON "t_suscripciones"("fechaProximaRenovacion");`,
    },
    {
      numero: 9,
      descripcion: 'Crear índice único idUsuario en t_suscripciones',
      sql: `CREATE UNIQUE INDEX IF NOT EXISTS "t_suscripciones_idUsuario_key" ON "t_suscripciones"("idUsuario");`,
    },
    {
      numero: 10,
      descripcion: 'Crear índice único stripeCustomerId en t_suscripciones',
      sql: `CREATE UNIQUE INDEX IF NOT EXISTS "t_suscripciones_stripeCustomerId_key" ON "t_suscripciones"("stripeCustomerId");`,
    },
    {
      numero: 11,
      descripcion: 'Crear índice único stripeSubscriptionId en t_suscripciones',
      sql: `CREATE UNIQUE INDEX IF NOT EXISTS "t_suscripciones_stripeSubscriptionId_key" ON "t_suscripciones"("stripeSubscriptionId");`,
    },
    {
      numero: 12,
      descripcion: 'Crear índice único paypalSubscriptionId en t_suscripciones',
      sql: `CREATE UNIQUE INDEX IF NOT EXISTS "t_suscripciones_paypalSubscriptionId_key" ON "t_suscripciones"("paypalSubscriptionId");`,
    },
    {
      numero: 13,
      descripcion: 'Crear tabla t_pagos',
      sql: `
        CREATE TABLE IF NOT EXISTS "t_pagos" (
          "id" TEXT NOT NULL,
          "idSuscripcion" TEXT NOT NULL,
          "metodoPago" "MetodoPago" NOT NULL,
          "monto" DOUBLE PRECISION NOT NULL,
          "moneda" TEXT NOT NULL DEFAULT 'USD',
          "estadoPago" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
          "stripePaymentIntentId" TEXT,
          "stripeChargeId" TEXT,
          "paypalOrderId" TEXT,
          "paypalTransactionId" TEXT,
          "referenciaTransferencia" TEXT,
          "comprobanteTransferencia" TEXT,
          "fechaTransferencia" TIMESTAMP(3),
          "fechaPago" TIMESTAMP(3),
          "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "fechaActualizacion" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "t_pagos_pkey" PRIMARY KEY ("id")
        );
      `,
    },
    {
      numero: 14,
      descripcion: 'Crear índice idSuscripcion en t_pagos',
      sql: `CREATE INDEX IF NOT EXISTS "t_pagos_idSuscripcion_idx" ON "t_pagos"("idSuscripcion");`,
    },
    {
      numero: 15,
      descripcion: 'Crear índice estadoPago en t_pagos',
      sql: `CREATE INDEX IF NOT EXISTS "t_pagos_estadoPago_idx" ON "t_pagos"("estadoPago");`,
    },
    {
      numero: 16,
      descripcion: 'Crear índice metodoPago en t_pagos',
      sql: `CREATE INDEX IF NOT EXISTS "t_pagos_metodoPago_idx" ON "t_pagos"("metodoPago");`,
    },
    {
      numero: 17,
      descripcion: 'Crear índice único stripePaymentIntentId en t_pagos',
      sql: `CREATE UNIQUE INDEX IF NOT EXISTS "t_pagos_stripePaymentIntentId_key" ON "t_pagos"("stripePaymentIntentId");`,
    },
    {
      numero: 18,
      descripcion: 'Crear índice único paypalOrderId en t_pagos',
      sql: `CREATE UNIQUE INDEX IF NOT EXISTS "t_pagos_paypalOrderId_key" ON "t_pagos"("paypalOrderId");`,
    },
    {
      numero: 19,
      descripcion: 'Agregar foreign key de t_suscripciones a t_usuarios',
      sql: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 't_suscripciones_idUsuario_fkey'
          ) THEN
            ALTER TABLE "t_suscripciones" 
            ADD CONSTRAINT "t_suscripciones_idUsuario_fkey" 
            FOREIGN KEY ("idUsuario") REFERENCES "t_usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `,
    },
    {
      numero: 20,
      descripcion: 'Agregar foreign key de t_pagos a t_suscripciones',
      sql: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 't_pagos_idSuscripcion_fkey'
          ) THEN
            ALTER TABLE "t_pagos" 
            ADD CONSTRAINT "t_pagos_idSuscripcion_fkey" 
            FOREIGN KEY ("idSuscripcion") REFERENCES "t_suscripciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `,
    },
    {
      numero: 21,
      descripcion: 'Crear función update_updated_at_column',
      sql: `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW."updatedAt" = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql';
      `,
    },
    {
      numero: 22,
      descripcion: 'Eliminar trigger anterior en t_suscripciones (si existe)',
      sql: `DROP TRIGGER IF EXISTS update_t_suscripciones_updated_at ON "t_suscripciones";`,
    },
    {
      numero: 23,
      descripcion: 'Crear trigger updatedAt en t_suscripciones',
      sql: `
        CREATE TRIGGER update_t_suscripciones_updated_at
        BEFORE UPDATE ON "t_suscripciones"
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `,
    },
    {
      numero: 24,
      descripcion: 'Eliminar trigger anterior en t_pagos (si existe)',
      sql: `DROP TRIGGER IF EXISTS update_t_pagos_fechaActualizacion ON "t_pagos";`,
    },
    {
      numero: 25,
      descripcion: 'Crear trigger fechaActualizacion en t_pagos',
      sql: `
        CREATE TRIGGER update_t_pagos_fechaActualizacion
        BEFORE UPDATE ON "t_pagos"
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `,
    },
  ];

  let exitosos = 0;
  let fallidos = 0;

  for (const paso of pasos) {
    const exito = await ejecutarPaso(paso.numero, paso.descripcion, paso.sql);
    if (exito) {
      exitosos++;
    } else {
      fallidos++;
      console.log(`\n⚠️  ¿Continuar con el siguiente paso? (S/N)`);
      // Continuar automáticamente, pero registrar el fallo
    }
    // Pequeña pausa entre pasos para no sobrecargar
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Resumen de migración:');
  console.log(`   ✅ Exitosos: ${exitosos}`);
  console.log(`   ❌ Fallidos: ${fallidos}`);
  console.log(`   📊 Total: ${pasos.length}`);

  if (fallidos === 0) {
    console.log('\n✅ Migración completada exitosamente');
  } else {
    console.log('\n⚠️  Migración completada con algunos errores');
  }
}

// Ejecutar migración
migracionPasoAPaso()
  .then(() => {
    console.log('\n✅ Proceso finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

