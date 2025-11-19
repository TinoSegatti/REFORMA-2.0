/**
 * Script para verificar que los campos del sistema de empleados se agregaron correctamente
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarCampos() {
  try {
    console.log('🔍 Verificando campos del sistema de empleados...\n');

    // Verificar que el enum existe
    const enumExists = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'RolEmpleado'
      ) as exists;
    `);
    console.log('✅ Enum RolEmpleado:', enumExists);

    // Verificar columnas en t_usuarios
    const columnas = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 't_usuarios'
      AND column_name IN (
        'codigoReferencia',
        'fechaGeneracionCodigo',
        'codigoExpiracion',
        'esUsuarioEmpleado',
        'idUsuarioDueño',
        'fechaVinculacion',
        'rolEmpleado',
        'activoComoEmpleado'
      )
      ORDER BY column_name;
    `);

    console.log('\n📋 Columnas encontradas:');
    console.table(columnas);

    // Verificar foreign key
    const fkExists = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 't_usuarios_idUsuarioDueño_fkey'
      ) as exists;
    `);
    console.log('\n✅ Foreign key idUsuarioDueño:', fkExists);

    // Verificar índice
    const indexExists = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 't_usuarios' 
        AND indexname = 't_usuarios_idUsuarioDueño_idx'
      ) as exists;
    `);
    console.log('✅ Índice idUsuarioDueño:', indexExists);

    // Verificar índice único de codigoReferencia
    const uniqueIndexExists = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 't_usuarios' 
        AND indexname = 't_usuarios_codigoReferencia_key'
      ) as exists;
    `);
    console.log('✅ Índice único codigoReferencia:', uniqueIndexExists);

    console.log('\n✅ Verificación completada exitosamente');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verificarCampos();

