-- Script para agregar campos del sistema de usuarios empleados
-- Ejecutar solo si los campos no existen

-- Agregar enum RolEmpleado si no existe
DO $$ BEGIN
    CREATE TYPE "RolEmpleado" AS ENUM ('ADMIN', 'EDITOR', 'LECTOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Agregar columnas al modelo Usuario si no existen
DO $$ 
BEGIN
    -- codigoReferencia
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 't_usuarios' AND column_name = 'codigoReferencia') THEN
        ALTER TABLE "t_usuarios" ADD COLUMN "codigoReferencia" TEXT UNIQUE;
    END IF;

    -- fechaGeneracionCodigo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 't_usuarios' AND column_name = 'fechaGeneracionCodigo') THEN
        ALTER TABLE "t_usuarios" ADD COLUMN "fechaGeneracionCodigo" TIMESTAMP(3);
    END IF;

    -- codigoExpiracion
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 't_usuarios' AND column_name = 'codigoExpiracion') THEN
        ALTER TABLE "t_usuarios" ADD COLUMN "codigoExpiracion" TIMESTAMP(3);
    END IF;

    -- esUsuarioEmpleado
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 't_usuarios' AND column_name = 'esUsuarioEmpleado') THEN
        ALTER TABLE "t_usuarios" ADD COLUMN "esUsuarioEmpleado" BOOLEAN NOT NULL DEFAULT false;
    END IF;

    -- idUsuarioDueño
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 't_usuarios' AND column_name = 'idUsuarioDueño') THEN
        ALTER TABLE "t_usuarios" ADD COLUMN "idUsuarioDueño" TEXT;
    END IF;

    -- fechaVinculacion
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 't_usuarios' AND column_name = 'fechaVinculacion') THEN
        ALTER TABLE "t_usuarios" ADD COLUMN "fechaVinculacion" TIMESTAMP(3);
    END IF;

    -- rolEmpleado
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 't_usuarios' AND column_name = 'rolEmpleado') THEN
        ALTER TABLE "t_usuarios" ADD COLUMN "rolEmpleado" "RolEmpleado" DEFAULT 'EDITOR';
    END IF;

    -- activoComoEmpleado
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 't_usuarios' AND column_name = 'activoComoEmpleado') THEN
        ALTER TABLE "t_usuarios" ADD COLUMN "activoComoEmpleado" BOOLEAN NOT NULL DEFAULT true;
    END IF;
END $$;

-- Agregar foreign key para idUsuarioDueño si no existe
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

-- Crear índice único para codigoReferencia si no existe (ya debería existir por UNIQUE)
-- Crear índice para idUsuarioDueño si no existe
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


