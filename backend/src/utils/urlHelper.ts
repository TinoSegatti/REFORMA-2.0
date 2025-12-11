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
  // Si hay una variable específica de producción, usarla (prioridad máxima)
  if (process.env.FRONTEND_PRODUCTION_URL) {
    return normalizeUrl(process.env.FRONTEND_PRODUCTION_URL);
  }
  
  let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
  
  // Remover protocolo para procesar
  const hasProtocol = frontendUrl.startsWith('http://') || frontendUrl.startsWith('https://');
  const urlWithoutProtocol = hasProtocol 
    ? frontendUrl.replace(/^https?:\/\//, '') 
    : frontendUrl;
  
  // Detectar si es un preview de Vercel
  // Ejemplos:
  // - reforma-2-0-git-master-tinosegattis-projects.vercel.app -> reforma-2-0.vercel.app
  // - proyecto-git-branch-usuario-projects.vercel.app -> proyecto.vercel.app
  if (urlWithoutProtocol.includes('-git-') && urlWithoutProtocol.includes('.vercel.app')) {
    // Extraer el nombre base del proyecto (antes de -git-)
    // y el dominio (.vercel.app)
    const parts = urlWithoutProtocol.split('.vercel.app')[0].split('-git-');
    if (parts.length > 0) {
      const baseName = parts[0]; // Nombre base del proyecto
      frontendUrl = `${baseName}.vercel.app`;
    }
  }
  
  // Si no es preview pero contiene vercel.app, asegurar que sea el dominio de producción
  // (sin -git- ni otros sufijos de preview)
  if (urlWithoutProtocol.includes('.vercel.app') && !urlWithoutProtocol.includes('-git-')) {
    // Ya es un dominio de producción, mantenerlo
    frontendUrl = urlWithoutProtocol;
  }
  
  return normalizeUrl(frontendUrl);
}

