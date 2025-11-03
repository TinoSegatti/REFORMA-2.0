/**
 * Script para crear la tabla t_auditoria si no existe
 * Ejecutar con: npx ts-node scripts/create-auditoria-table.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAuditoriaTable() {
  try {
    console.log('Verificando si la tabla t_auditoria existe...');

    // Intentar una consulta simple para verificar si la tabla existe
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 't_auditoria'
      ) as exists;
    `;

    const tableExists = (result as any[])[0]?.exists;

    if (tableExists) {
      console.log('✅ La tabla t_auditoria ya existe');
      return;
    }

    console.log('📝 Creando tabla t_auditoria...');

    // Crear la tabla
    await prisma.$executeRaw`
      CREATE TABLE public.t_auditoria (
        id VARCHAR(255) PRIMARY KEY,
        id_usuario VARCHAR(255) NOT NULL,
        id_granja VARCHAR(255),
        tabla_origen VARCHAR(50) NOT NULL,
        id_registro VARCHAR(255) NOT NULL,
        accion VARCHAR(50) NOT NULL,
        descripcion TEXT,
        datos_anteriores JSONB,
        datos_nuevos JSONB,
        fecha_operacion TIMESTAMP NOT NULL DEFAULT NOW(),
        ip_address VARCHAR(255),
        user_agent VARCHAR(500),
        
        CONSTRAINT fk_auditoria_usuario FOREIGN KEY (id_usuario) REFERENCES public.t_usuarios(id),
        CONSTRAINT fk_auditoria_granja FOREIGN KEY (id_granja) REFERENCES public.t_granja(id)
      );
    `;

    // Crear índices
    await prisma.$executeRaw`CREATE INDEX idx_auditoria_usuario ON public.t_auditoria(id_usuario);`;
    await prisma.$executeRaw`CREATE INDEX idx_auditoria_granja ON public.t_auditoria(id_granja);`;
    await prisma.$executeRaw`CREATE INDEX idx_auditoria_tabla_origen ON public.t_auditoria(tabla_origen);`;
    await prisma.$executeRaw`CREATE INDEX idx_auditoria_fecha ON public.t_auditoria(fecha_operacion);`;

    console.log('✅ Tabla t_auditoria creada exitosamente');
  } catch (error: any) {
    if (error.code === '42P07') {
      // Tabla ya existe
      console.log('✅ La tabla t_auditoria ya existe');
    } else if (error.code === '42704') {
      // Índice ya existe
      console.log('⚠️  Algunos índices ya existen, pero la tabla está creada');
    } else {
      console.error('❌ Error creando tabla:', error);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAuditoriaTable()
  .then(() => {
    console.log('✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

