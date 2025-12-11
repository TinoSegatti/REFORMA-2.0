'use client';

import { useEffect } from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Forzar modo oscuro siempre en páginas de autenticación
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    
    return () => {
      // No remover el modo oscuro al salir para mantener consistencia
    };
  }, []);

  return <>{children}</>;
}

