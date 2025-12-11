'use client';

import { useEffect } from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Forzar modo oscuro siempre en páginas de autenticación
    // Asegurar que se ejecute inmediatamente, incluso antes del mount
    const forceDarkMode = () => {
      if (typeof document !== 'undefined') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        document.documentElement.setAttribute('data-theme', 'dark');
        
        // Remover cualquier preferencia de tema que pueda interferir
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('theme');
          localStorage.removeItem('next-themes');
        }
      }
    };
    
    // Ejecutar inmediatamente
    forceDarkMode();
    
    // También ejecutar después de un pequeño delay para asegurar que se aplique
    const timeoutId = setTimeout(forceDarkMode, 0);
    
    // Observar cambios en el DOM para mantener el modo oscuro
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const html = document.documentElement;
          if (!html.classList.contains('dark')) {
            forceDarkMode();
          }
        }
      });
    });
    
    if (typeof document !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class', 'data-theme'],
      });
    }
    
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  return <>{children}</>;
}

