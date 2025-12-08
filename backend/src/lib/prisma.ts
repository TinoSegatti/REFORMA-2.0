import { PrismaClient } from '@prisma/client';

// Singleton pattern para Prisma Client
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

// Detectar si estamos usando Transaction Pooler (puerto 6543) o Session Pooler (puerto 5432)
const databaseUrl = process.env.DATABASE_URL || '';
const isTransactionPooler = databaseUrl.includes(':6543') || databaseUrl.includes('transaction');

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    // Deshabilitar prepared statements cuando se usa Transaction Pooler
    // Transaction Pooler no mantiene el estado de las sesiones entre transacciones
    ...(isTransactionPooler && {
      datasources: {
        db: {
          url: databaseUrl.includes('?') 
            ? `${databaseUrl}&pgbouncer=true` 
            : `${databaseUrl}?pgbouncer=true`
        }
      }
    }),
    // Configuración mejorada para manejar conexiones intermitentes
    // Aumentar timeouts para conexiones lentas o intermitentes
    errorFormat: 'minimal',
  });

// Manejar desconexiones y reconexiones automáticas
prisma.$on('error' as never, (e: any) => {
  console.error('❌ Prisma error:', e);
  if (e.code === 'P1001') {
    console.error('   Error de conexión detectado. Prisma intentará reconectar automáticamente.');
  }
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;


