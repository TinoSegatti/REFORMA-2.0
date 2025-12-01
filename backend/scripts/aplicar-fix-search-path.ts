/**
 * Script para aplicar el fix de seguridad para update_updated_at_column
 * 
 * Este script ejecuta la migración SQL que corrige el warning de seguridad
 * relacionado con el search_path mutable en la función update_updated_at_column
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function aplicarFix() {
  console.log('🔒 Aplicando fix de seguridad para update_updated_at_column...\n');

  try {
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '../prisma/migrations/fix_update_updated_at_security.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Leyendo migración SQL...');
    console.log(`   Archivo: ${sqlPath}\n`);

    // Ejecutar el SQL
    console.log('🔄 Ejecutando migración...');
    await prisma.$executeRawUnsafe(sql);

    console.log('\n✅ Migración aplicada correctamente!');
    console.log('   La función update_updated_at_column ahora tiene search_path fijo.');
    console.log('   El warning de seguridad debería desaparecer en Supabase.\n');

    // Verificar que la función existe
    const funcion = await prisma.$queryRaw<Array<{ proname: string }>>`
      SELECT p.proname
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' 
      AND p.proname = 'update_updated_at_column'
    `;

    if (funcion.length > 0) {
      console.log('✅ Verificación: La función existe en la base de datos');
    } else {
      console.log('⚠️  Advertencia: No se pudo verificar la función');
    }

  } catch (error: any) {
    console.error('\n❌ Error al aplicar la migración:');
    console.error(error.message);
    
    if (error.message.includes('already exists')) {
      console.log('\n💡 La función ya existe. Esto es normal si ya aplicaste el fix antes.');
    } else if (error.message.includes("Can't reach database server")) {
      console.log('\n💡 No se puede conectar a la base de datos.');
      console.log('   Verifica que tu proyecto de Supabase esté activo.');
      console.log('   Ejecuta: npm run test-db-connection');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

aplicarFix();





