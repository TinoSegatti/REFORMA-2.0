'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';

interface GoogleOAuthProviderProps {
  children: React.ReactNode;
}

export default function GoogleOAuthProviderWrapper({ children }: GoogleOAuthProviderProps) {
  // Obtener el Client ID desde las variables de entorno
  // En Next.js, las variables NEXT_PUBLIC_* están disponibles en el cliente
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Si no hay Client ID, aún debemos envolver con el provider
  // pero con un ID dummy para evitar errores
  // El botón de Google simplemente no funcionará
  if (!googleClientId) {
    console.warn('NEXT_PUBLIC_GOOGLE_CLIENT_ID no está configurado. Google Sign-In no estará disponible.');
    // Usar un ID dummy para que el provider funcione, pero el login fallará
    // Esto evita el error de "must be used within GoogleOAuthProvider"
    return (
      <GoogleOAuthProvider clientId="dummy-client-id">
        {children}
      </GoogleOAuthProvider>
    );
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      {children}
    </GoogleOAuthProvider>
  );
}

