/**
 * Middleware de Caché para Validaciones de Granja
 * Reduce consultas repetidas de validación de granja-usuario
 */

import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

interface GranjaCache {
  [key: string]: {
    granja: { id: string; idUsuario: string; nombreGranja: string };
    timestamp: number;
  };
}

// Caché en memoria con TTL de 5 minutos
const granjaCache: GranjaCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Obtener granja desde caché o base de datos
 */
export async function getGranjaCached(
  idGranja: string,
  idUsuario: string
): Promise<{ id: string; idUsuario: string; nombreGranja: string } | null> {
  const cacheKey = `${idGranja}:${idUsuario}`;
  const cached = granjaCache[cacheKey];

  // Verificar si existe en caché y no ha expirado
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.granja;
  }

  // Consultar base de datos
  const granja = await prisma.granja.findFirst({
    where: { id: idGranja, idUsuario: idUsuario },
    select: {
      id: true,
      idUsuario: true,
      nombreGranja: true
    }
  });

  // Guardar en caché si existe
  if (granja) {
    granjaCache[cacheKey] = {
      granja,
      timestamp: Date.now()
    };
  }

  return granja;
}

/**
 * Invalidar caché de una granja
 */
export function invalidateGranjaCache(idGranja: string, idUsuario?: string) {
  if (idUsuario) {
    // Invalidar específico
    const cacheKey = `${idGranja}:${idUsuario}`;
    delete granjaCache[cacheKey];
  } else {
    // Invalidar todas las entradas de esta granja
    Object.keys(granjaCache).forEach(key => {
      if (key.startsWith(`${idGranja}:`)) {
        delete granjaCache[key];
      }
    });
  }
}

/**
 * Limpiar caché expirado
 */
export function cleanupExpiredCache() {
  const now = Date.now();
  Object.keys(granjaCache).forEach(key => {
    if (now - granjaCache[key].timestamp >= CACHE_TTL) {
      delete granjaCache[key];
    }
  });
}

// Limpiar caché cada minuto
setInterval(cleanupExpiredCache, 60 * 1000);







