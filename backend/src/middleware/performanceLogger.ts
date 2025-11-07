/**
 * Middleware de Logging de Rendimiento
 * Mide tiempos de ejecución de queries y requests
 */

import { Request, Response, NextFunction } from 'express';

// Los logs de queries se capturan automáticamente por Prisma
// cuando está configurado con log: ['query'] en prisma.ts
// Este middleware solo mide el tiempo total del request
let isLoggingEnabled = process.env.NODE_ENV === 'development';

/**
 * Middleware para medir tiempo de ejecución de requests
 */
export function performanceLogger(req: Request, res: Response, next: NextFunction) {
  if (!isLoggingEnabled) {
    return next();
  }

  const startTime = Date.now();
  const endpoint = `${req.method} ${req.path}`;

  // Interceptar respuesta para medir tiempo total
  const originalSend = res.send.bind(res);
  res.send = function (body: any) {
    const duration = Date.now() - startTime;
    
    // Log detallado para análisis
    console.log('\n📊 PERFORMANCE LOG');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Endpoint: ${endpoint}`);
    console.log(`Tiempo total: ${duration}ms`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    // Warn si el tiempo es excesivo
    if (duration > 5000) {
      console.warn(`⚠️  ADVERTENCIA: Request lento (>5s): ${duration}ms`);
      console.warn(`   Esto puede indicar problemas de rendimiento.`);
      console.warn(`   Revisa los logs de queries de Prisma arriba para identificar cuellos de botella.`);
    } else if (duration > 2000) {
      console.warn(`⚠️  ADVERTENCIA: Request moderadamente lento (>2s): ${duration}ms`);
    }
    
    console.log('═══════════════════════════════════════════════════════════\n');

    return originalSend(body);
  };

  next();
}

/**
 * Habilitar/deshabilitar logging
 */
export function setLoggingEnabled(enabled: boolean) {
  isLoggingEnabled = enabled;
}

/**
 * Obtener estadísticas de rendimiento
 */
export function getPerformanceStats(): {
  averageDuration: number;
  averageQueryCount: number;
  averageQueryTime: number;
  slowestEndpoints: Array<{ endpoint: string; duration: number }>;
} {
  // En producción, esto podría leer de una base de datos o caché
  return {
    averageDuration: 0,
    averageQueryCount: 0,
    averageQueryTime: 0,
    slowestEndpoints: []
  };
}

