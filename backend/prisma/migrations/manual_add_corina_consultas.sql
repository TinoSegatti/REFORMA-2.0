-- Migración manual: Agregar nuevos tipos de consulta al enum TipoInteraccionCorina
-- Ejecutar este script en la base de datos antes de usar las nuevas funcionalidades

-- Agregar nuevos valores al enum TipoInteraccionCorina
ALTER TYPE "TipoInteraccionCorina" ADD VALUE IF NOT EXISTS 'CONSULTA_MATERIAS_PRIMAS';
ALTER TYPE "TipoInteraccionCorina" ADD VALUE IF NOT EXISTS 'CONSULTA_COMPRAS';
ALTER TYPE "TipoInteraccionCorina" ADD VALUE IF NOT EXISTS 'CONSULTA_FORMULAS';
ALTER TYPE "TipoInteraccionCorina" ADD VALUE IF NOT EXISTS 'CONSULTA_FABRICACIONES';
ALTER TYPE "TipoInteraccionCorina" ADD VALUE IF NOT EXISTS 'CONSULTA_PROVEEDORES';
ALTER TYPE "TipoInteraccionCorina" ADD VALUE IF NOT EXISTS 'CONSULTA_ANIMALES';

-- Verificar que los valores se agregaron correctamente
SELECT unnest(enum_range(NULL::"TipoInteraccionCorina")) AS tipo_interaccion;












