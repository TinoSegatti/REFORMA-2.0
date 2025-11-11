'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Verificar si el usuario está autenticado
    const token = authService.getToken();
    
    if (token) {
      // Si está autenticado, redirigir a mis-plantas
      router.push('/mis-plantas');
    } else {
      // Si no está autenticado, redirigir a landing page
      router.push('/landing');
    }
  }, [router]);

  // Mostrar loading mientras se verifica la autenticación
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-foreground/60">Cargando...</p>
      </div>
    </div>
  );
}
