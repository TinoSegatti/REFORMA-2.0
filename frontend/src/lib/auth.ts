'use client';

/**
 * Utilidades de Autenticación
 */

const TOKEN_KEY = 'reforma_token';
const USER_KEY = 'reforma_user';

export const authService = {
  // Guardar token y usuario
  setAuth(token: string, user: { id: string; email: string; nombreUsuario: string; apellidoUsuario: string; tipoUsuario: string }) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },

  // Obtener token
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  },

  // Obtener usuario
  getUser(): { id: string; email: string; nombreUsuario: string; apellidoUsuario: string; tipoUsuario: string } | null {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    }
    return null;
  },

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return this.getToken() !== null;
  },

  // Cerrar sesión
  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      
      // Forzar modo oscuro antes de redirigir al login
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.setAttribute('data-theme', 'dark');
      
      // Remover cualquier preferencia de tema del localStorage que pueda interferir
      localStorage.removeItem('theme');
      localStorage.removeItem('next-themes');
    }
  },

  // Headers con autenticación
  getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  },
};

