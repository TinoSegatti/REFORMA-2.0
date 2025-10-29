'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Button } from '@/components/ui';
import { apiClient } from '@/lib/api';
import { authService } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [apellidoUsuario, setApellidoUsuario] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const response = await apiClient.login(email, password);
        authService.setAuth(response.token, response.usuario);
        router.push('/mis-plantas');
      } else {
        // Registro
        const response = await apiClient.register({
          email,
          password,
          nombreUsuario,
          apellidoUsuario,
        });
        authService.setAuth(response.token, response.usuario);
        router.push('/mis-plantas');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAE4] p-4">
      <div className="w-full max-w-md modern-card p-8">
        {/* Header Moderno */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#F5B8DA] to-[#E599C6] rounded-2xl shadow-lg mb-4">
            <span className="text-white text-3xl font-bold">R</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            REFORMA
          </h1>
          <p className="text-gray-600">
            Sistema de gestión de granjas
          </p>
        </div>

        {/* Tabs Modernos */}
        <div className="flex mb-8 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
              isLogin
                ? 'bg-gradient-to-r from-[#B6CCAE] to-[#9AAB64] text-gray-900 shadow-lg'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
              !isLogin
                ? 'bg-gradient-to-r from-[#B6CCAE] to-[#9AAB64] text-gray-900 shadow-lg'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Registrarse
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <>
              <Input
                label="Nombre"
                placeholder="Tu nombre"
                value={nombreUsuario}
                onChange={(e) => setNombreUsuario(e.target.value)}
                required
              />
              <Input
                label="Apellido"
                placeholder="Tu apellido"
                value={apellidoUsuario}
                onChange={(e) => setApellidoUsuario(e.target.value)}
                required
              />
            </>
          )}

          <Input
            label="Correo electrónico"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {isLogin && (
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#B6CCAE] focus:ring-[#B6CCAE]"
                />
                <span className="text-sm text-gray-600">Recordarme</span>
              </label>
              <a
                href="#"
                className="text-sm text-[#9AAB64] hover:text-[#7B8E54] font-semibold"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          )}

          <Button 
            variant="accent" 
            className="w-full mt-6" 
            type="submit"
            disabled={loading}
          >
            {loading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
          </Button>
        </form>
      </div>
    </div>
  );
}
