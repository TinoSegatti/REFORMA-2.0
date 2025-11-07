'use client';

/**
 * Utilidad para prefetching inteligente de rutas
 * Pre-renderiza las páginas más usadas después del login sin sobrecargar
 */

// Cache de rutas ya prefetcheadas para evitar duplicados
const prefetchedRoutes = new Set<string>();

/**
 * Prefetchea una ruta de forma inteligente usando requestIdleCallback
 * No bloquea el hilo principal y solo se ejecuta cuando el navegador está libre
 */
export function prefetchRoute(path: string): void {
  if (typeof window === 'undefined') return;
  if (prefetchedRoutes.has(path)) return; // Ya prefetcheada

  // Usar requestIdleCallback para no bloquear el hilo principal
  const doPrefetch = () => {
    try {
      // Usar prefetch nativo del navegador
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'document';
      link.href = path;
      document.head.appendChild(link);
      prefetchedRoutes.add(path);
    } catch (error) {
      // Silenciar errores - no son críticos
      console.debug('Prefetch fallido para:', path);
    }
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(doPrefetch, { timeout: 2000 });
  } else {
    // Fallback para navegadores sin requestIdleCallback
    setTimeout(doPrefetch, 100);
  }
}

/**
 * Prefetchea rutas de granja usando requestIdleCallback con delays escalonados
 */
export function prefetchGranjaRoutes(idGranja: string): void {
  if (!idGranja || typeof window === 'undefined') return;

  // Rutas más usadas de granja (orden de prioridad)
  const routes = [
    `/granja/${idGranja}/materias-primas`,
    `/granja/${idGranja}/inventario`,
    `/granja/${idGranja}/compras`,
    `/granja/${idGranja}/proveedores`,
    `/granja/${idGranja}/formulas`,
    `/granja/${idGranja}/fabricaciones`,
  ];

  // Prefetchear con delays escalonados usando requestIdleCallback
  routes.forEach((route, index) => {
    const delay = index * 300; // 300ms entre cada prefetch
    
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        setTimeout(() => prefetchRoute(route), delay);
      }, { timeout: 5000 });
    } else {
      setTimeout(() => prefetchRoute(route), delay);
    }
  });
}

/**
 * Prefetchea rutas principales después del login exitoso
 * Se ejecuta de forma asíncrona y no bloquea la navegación
 */
export function prefetchAfterLogin(userGranjas: Array<{ id: string }> = []): void {
  if (typeof window === 'undefined') return;

  // Prefetchear página principal inmediatamente
  prefetchRoute('/mis-plantas');

  // Si hay granjas, prefetchear sus rutas principales con delay
  if (userGranjas.length > 0) {
    const firstGranja = userGranjas[0];
    if (firstGranja?.id) {
      // Delay pequeño para no interferir con la navegación inicial
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          setTimeout(() => {
            prefetchGranjaRoutes(firstGranja.id);
          }, 500);
        }, { timeout: 1000 });
      } else {
        setTimeout(() => {
          prefetchGranjaRoutes(firstGranja.id);
        }, 500);
      }
    }
  }
}

/**
 * Prefetchea rutas cuando el usuario está inactivo (hover sobre links)
 * Útil para prefetching proactivo
 */
export function prefetchOnHover(path: string, delay: number = 100): () => void {
  let timeoutId: NodeJS.Timeout | null = null;

  const handleMouseEnter = () => {
    timeoutId = setTimeout(() => {
      prefetchRoute(path);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return () => {
    handleMouseEnter();
    return handleMouseLeave;
  };
}

