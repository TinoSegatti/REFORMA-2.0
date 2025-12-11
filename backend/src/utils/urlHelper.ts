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

/**
 * Obtiene la URL de producción del frontend para emails
 * Reemplaza previews de Vercel con el dominio de producción
 */
export function getFrontendProductionUrl(): string {
  let frontendUrl = process.env.FRONTEND_URL || process.env.FRONTEND_PRODUCTION_URL || 'http://localhost:3001';
  
  // Si hay una variable específica de producción, usarla
  if (process.env.FRONTEND_PRODUCTION_URL) {
    return normalizeUrl(process.env.FRONTEND_PRODUCTION_URL);
  }
  
  // Detectar si es un preview de Vercel (contiene "git-" o es un preview)
  // Ejemplo: reforma-2-0-git-master-tinosegattis-projects.vercel.app
  // Debe ser: reforma-2-0.vercel.app
  if (frontendUrl.includes('git-') || frontendUrl.includes('-git-')) {
    // Extraer el dominio base de producción
    // Si es "reforma-2-0-git-master-tinosegattis-projects.vercel.app"
    // Convertir a "reforma-2-0.vercel.app"
    const match = frontendUrl.match(/^([^-]+(?:-[^-]+)*?)(?:-git-.*?)?\.(vercel\.app|localhost)/);
    if (match) {
      const baseName = match[1];
      const domain = match[2];
      frontendUrl = `${baseName}.${domain}`;
    }
  }
  
  return normalizeUrl(frontendUrl);
}

