-- Script SQL para actualizar el enum PlanSuscripcion
-- Ejecutar directamente en la base de datos antes de prisma db push

-- Primero, migrar los datos existentes a un valor temporal
UPDATE t_usuarios SET "planSuscripcion" = 'PLAN_0' WHERE "planSuscripcion"::text NOT IN ('PLAN_0', 'PLAN_1', 'PLAN_2', 'PLAN_3', 'PLAN_4');

-- Agregar los nuevos valores al enum
ALTER TYPE "PlanSuscripcion" ADD VALUE IF NOT EXISTS 'DEMO';
ALTER TYPE "PlanSuscripcion" ADD VALUE IF NOT EXISTS 'STARTER';
ALTER TYPE "PlanSuscripcion" ADD VALUE IF NOT EXISTS 'BUSINESS';
ALTER TYPE "PlanSuscripcion" ADD VALUE IF NOT EXISTS 'ENTERPRISE';

-- Migrar los datos
UPDATE t_usuarios SET "planSuscripcion" = 'DEMO' WHERE "planSuscripcion"::text IN ('PLAN_0', 'PLAN_1', 'PLAN_2', 'PLAN_3', 'PLAN_4');

-- Nota: Los valores antiguos (PLAN_0, etc.) permanecerán en el enum pero no se usarán
-- Para eliminarlos completamente, necesitarías recrear el enum (más complejo)

