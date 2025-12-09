/**
 * Utilidades para normalizar y validar URLs
 */

/**
 * Normaliza una URL asegurando que tenga el protocolo correcto
 * Si no tiene protocolo, asume https:// en producción
 */
export function normalizeUrl(url: string, defaultProtocol: 'http' | 'https' = 'https'): string {
  if (!url) {
    return '';
  }

  // Si ya tiene protocolo, retornar tal cual
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Si no tiene protocolo, agregar el protocolo por defecto
  // En producción siempre usar https
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : defaultProtocol;
  return `${protocol}://${url}`;
}

/**
 * Construye una URL completa a partir de una base y una ruta
 */
export function buildUrl(baseUrl: string, path: string): string {
  const normalizedBase = normalizeUrl(baseUrl);
  
  // Asegurar que path empiece con /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Remover trailing slash de baseUrl si existe
  const cleanBase = normalizedBase.endsWith('/') ? normalizedBase.slice(0, -1) : normalizedBase;
  
  return `${cleanBase}${normalizedPath}`;
}

/**
 * Obtiene la URL del frontend normalizada
 */
export function getFrontendUrl(): string {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
  return normalizeUrl(frontendUrl);
}

