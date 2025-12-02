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
    })
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;


