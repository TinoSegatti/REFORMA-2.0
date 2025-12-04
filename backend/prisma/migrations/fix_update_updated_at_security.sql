-- Fix: Corregir función update_updated_at_column para eliminar warning de seguridad
-- Issue: Function has a mutable search_path (vulnerabilidad de seguridad)
-- Solution: Agregar SET search_path = '' para usar solo esquemas calificados explícitamente

-- Eliminar la función existente
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Recrear la función con search_path fijo (seguro)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- Recrear los triggers que usan esta función
-- Trigger para t_suscripciones
DROP TRIGGER IF EXISTS update_t_suscripciones_updated_at ON "t_suscripciones";
CREATE TRIGGER update_t_suscripciones_updated_at
  BEFORE UPDATE ON "t_suscripciones"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para t_pagos
DROP TRIGGER IF EXISTS update_t_pagos_fechaActualizacion ON "t_pagos";
CREATE TRIGGER update_t_pagos_fechaActualizacion
  BEFORE UPDATE ON "t_pagos"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Verificar que la función se creó correctamente
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'update_updated_at_column'
  ) THEN
    RAISE NOTICE '✅ Función update_updated_at_column recreada correctamente con search_path seguro';
  ELSE
    RAISE EXCEPTION '❌ Error: La función no se creó correctamente';
  END IF;
END $$;











