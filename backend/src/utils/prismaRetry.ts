/**
 * Utilidades para reintentar operaciones de Prisma cuando hay errores de conexión
 */

import { PrismaClient } from '@prisma/client';

/**
 * Función helper para ejecutar una operación de Prisma con retry automático
 * en caso de errores de conexión (P1001)
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 500
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Solo reintentar si es un error de conexión
      if (error.code === 'P1001' || error.message?.includes("Can't reach database")) {
        if (attempt < maxRetries) {
          const delay = retryDelay * attempt; // Backoff exponencial: 500ms, 1000ms, 1500ms
          console.warn(`⚠️  Intento ${attempt}/${maxRetries} fallido. Reintentando en ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        } else {
          console.error(`❌ Error de conexión después de ${maxRetries} intentos:`, error.message);
          throw new Error(
            `Error de conexión a la base de datos después de ${maxRetries} intentos. ` +
            `Por favor, verifica que el proyecto de Supabase esté activo.`
          );
        }
      }
      
      // Si no es un error de conexión, lanzar inmediatamente
      throw error;
    }
  }
  
  // Esto no debería ejecutarse nunca, pero TypeScript lo requiere
  throw lastError || new Error('Operación falló sin error específico');
}

/**
 * Ejecutar múltiples operaciones en paralelo con retry individual
 */
export async function withRetryAll<T extends readonly unknown[]>(
  operations: { [K in keyof T]: () => Promise<T[K]> },
  maxRetries: number = 3,
  retryDelay: number = 500
): Promise<T> {
  return Promise.all(
    operations.map(op => withRetry(op, maxRetries, retryDelay))
  ) as Promise<T>;
}

