'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

type BackgroundMode = 'solid' | 'image';

type BgPreference = {
  mode: BackgroundMode;
  color?: string; // CSS color
  imageDataUrl?: string; // base64 data URL
};

function getGranjaIdFromPath(pathname: string): string | null {
  const match = pathname.match(/\/granja\/([^/]+)/);
  return match ? match[1] : null;
}

function loadPreference(granjaId: string | null): BgPreference | null {
  try {
    const key = granjaId ? `bgPref:${granjaId}` : 'bgPref:global';
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function BackgroundProvider() {
  const pathname = usePathname();
  const granjaId = useMemo(() => getGranjaIdFromPath(pathname), [pathname]);
  const [pref, setPref] = useState<BgPreference | null>(null);

  useEffect(() => {
    setPref(loadPreference(granjaId));
  }, [granjaId]);

  useEffect(() => {
    // Aplicar al body como estilo inline para máxima compatibilidad
    const body = document.body;
    
    // No aplicar fondo en páginas de auth (login, registro) ni en mis-plantas
    if (pathname.includes('/login') || pathname.includes('/register') || pathname.includes('/mis-plantas')) {
      body.style.backgroundImage = '';
      // No sobreescribir el fondo aquí, mis-plantas lo maneja
      if (!pathname.includes('/mis-plantas')) {
        body.style.backgroundColor = '#0a0a0f';
      }
      return;
    }
    
    if (!pref) {
      // Sin preferencia: usar fondo oscuro por defecto
      body.style.backgroundImage = '';
      body.style.backgroundColor = '#0a0a0f';
      return;
    }
    
    if (pref.mode === 'image' && pref.imageDataUrl) {
      body.style.backgroundImage = `url(${pref.imageDataUrl})`;
      body.style.backgroundSize = 'cover';
      body.style.backgroundAttachment = 'fixed';
      body.style.backgroundPosition = 'center center';
      // Color de fallback oscuro con overlay
      body.style.backgroundColor = '#0a0a0f';
    } else {
      // Sólido
      const color = pref.color || '#0a0a0f';
      body.style.backgroundImage = '';
      body.style.backgroundColor = color as string;
    }
    return () => {
      // No limpiar al desmontar para evitar parpadeos entre rutas
    };
  }, [pref, pathname]);

  // Overlays de gradiente y ruido para efecto vidrio (no en auth ni mis-plantas)
  const isAuthPage = pathname.includes('/login') || pathname.includes('/register');
  const isMisPlantas = pathname.includes('/mis-plantas');
  
  return (
    <>
      {!isAuthPage && !isMisPlantas && <div className="bg-gradient-overlay" />}
      {!isAuthPage && !isMisPlantas && <div className="bg-noise-overlay" />}
    </>
  );
}


