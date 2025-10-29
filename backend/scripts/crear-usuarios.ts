/**
 * Script para crear usuarios de prueba en la base de datos
 */

import { PrismaClient, TipoUsuario, PlanSuscripcion } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Creando usuarios...\n');

  try {
    // Usuario CLIENTE
    const passwordHashCliente = await bcrypt.hash('123456', 10);
    
    const cliente = await prisma.usuario.upsert({
      where: { email: 'valentinoargentinocba@gmail.com' },
      update: {},
      create: {
        email: 'valentinoargentinocba@gmail.com',
        passwordHash: passwordHashCliente,
        nombreUsuario: 'Valentino',
        apellidoUsuario: 'Argentino',
        tipoUsuario: TipoUsuario.CLIENTE,
        planSuscripcion: PlanSuscripcion.PLAN_0,
        activo: true,
      },
    });

    console.log('✅ Usuario CLIENTE creado:');
    console.log(`   Email: ${cliente.email}`);
    console.log(`   Tipo: ${cliente.tipoUsuario}`);
    console.log(`   Plan: ${cliente.planSuscripcion}`);
    console.log(`   Contraseña: 123456\n`);

    // Usuario ADMINISTRADOR
    const passwordHashAdmin = await bcrypt.hash('123456', 10);
    
    const admin = await prisma.usuario.upsert({
      where: { email: 'valentinosegatti@gmail.com' },
      update: {},
      create: {
        email: 'valentinosegatti@gmail.com',
        passwordHash: passwordHashAdmin,
        nombreUsuario: 'Valentino',
        apellidoUsuario: 'Segatti',
        tipoUsuario: TipoUsuario.ADMINISTRADOR,
        planSuscripcion: PlanSuscripcion.PLAN_4, // Plan más alto para admin
        activo: true,
      },
    });

    console.log('✅ Usuario ADMINISTRADOR creado:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Tipo: ${admin.tipoUsuario}`);
    console.log(`   Plan: ${admin.planSuscripcion}`);
    console.log(`   Contraseña: 123456\n`);

    console.log('🎉 Usuarios creados exitosamente!\n');
    console.log('📝 Credenciales de acceso:');
    console.log('   CLIENTE:');
    console.log('      Email: valentinoargentinocba@gmail.com');
    console.log('      Password: 123456\n');
    console.log('   ADMIN:');
    console.log('      Email: valentinosegatti@gmail.com');
    console.log('      Password: 123456\n');

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

