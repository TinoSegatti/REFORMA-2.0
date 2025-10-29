/**
 * Script para actualizar email de usuario existente
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Actualizando email de usuario...\n');

  try {
    // Buscar el usuario con el email actual
    const usuarioActual = await prisma.usuario.findUnique({
      where: { email: 'valentinoargentinocba@gmial.com' }
    });

    if (!usuarioActual) {
      console.log('❌ No se encontró el usuario con email: valentinoargentinocba@gmial.com');
      return;
    }

    console.log('✅ Usuario encontrado:');
    console.log(`   Email actual: ${usuarioActual.email}`);
    console.log(`   Nombre: ${usuarioActual.nombreUsuario} ${usuarioActual.apellidoUsuario}`);
    console.log(`   Tipo: ${usuarioActual.tipoUsuario}\n`);

    // Actualizar el email (corrigiendo el typo: gmial -> gmail)
    const emailCorregido = 'valentinoargentinocba@gmail.com';
    
    const usuarioActualizado = await prisma.usuario.update({
      where: { email: 'valentinoargentinocba@gmial.com' },
      data: {
        email: emailCorregido
      }
    });

    console.log('✅ Email actualizado exitosamente:');
    console.log(`   Email anterior: valentinoargentinocba@gmial.com`);
    console.log(`   Email nuevo: ${usuarioActualizado.email}\n`);
    console.log('📝 Credenciales actualizadas:');
    console.log(`   Email: ${usuarioActualizado.email}`);
    console.log(`   Password: 123456\n`);

  } catch (error) {
    console.error('❌ Error:', error);
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

