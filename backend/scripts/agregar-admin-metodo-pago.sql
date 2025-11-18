-- Agregar ADMIN al enum MetodoPago
-- Ejecutar este script antes de usar la funcionalidad de cambio directo de plan

-- Primero, crear un nuevo tipo con ADMIN incluido
DO $$ 
BEGIN
    -- Verificar si el valor ADMIN ya existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'ADMIN' 
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'MetodoPago'
        )
    ) THEN
        -- Agregar ADMIN al enum
        ALTER TYPE "MetodoPago" ADD VALUE 'ADMIN';
    END IF;
END $$;

