'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Button } from '@/components/ui';
import { apiClient } from '@/lib/api';
import { authService } from '@/lib/auth';
import { BarChart3, Package, ShoppingCart, Factory } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated Background Bubbles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Bubble 1 - Purple */}
        <div className="bubble-1 absolute w-96 h-96 bg-gradient-to-br from-purple-500/20 to-purple-400/10 rounded-full blur-3xl -top-40 left-10" />
        {/* Bubble 2 - Pink */}
        <div className="bubble-2 absolute w-80 h-80 bg-gradient-to-br from-pink-500/20 to-pink-400/10 rounded-full blur-3xl top-20 right-20" />
        {/* Bubble 3 - Cyan */}
        <div className="bubble-3 absolute w-72 h-72 bg-gradient-to-br from-cyan-500/20 to-cyan-400/10 rounded-full blur-3xl top-60 left-1/2" />
        {/* Bubble 4 - Violet */}
        <div className="bubble-4 absolute w-[500px] h-[500px] bg-gradient-to-br from-violet-500/15 to-violet-400/10 rounded-full blur-3xl -bottom-60 right-10" />
        {/* Bubble 5 - Teal */}
        <div className="bubble-1 absolute w-[400px] h-[400px] bg-gradient-to-br from-teal-500/15 to-teal-400/10 rounded-full blur-3xl bottom-20 left-20" />
        {/* Bubble 6 - Purple small */}
        <div className="bubble-2 absolute w-64 h-64 bg-gradient-to-br from-purple-600/15 to-purple-500/10 rounded-full blur-3xl top-1/3 left-20" />
      </div>


      {/* Landing Content */}
      <div className="relative z-10 flex-1 grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto px-8 py-12">
        {/* Left: Features */}
        <div className="flex flex-col justify-center space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-5xl font-bold text-white mb-4">
              Gestiona tu granja con{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                inteligencia
              </span>
            </h2>
            <p className="text-white/70 text-xl">
              Sistema integral para control de inventarios, compras, fórmulas y análisis de tus materias primas
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-6 hover:scale-105 transition-transform duration-300 cursor-pointer hover:border-emerald-500/30">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-4 group-hover:scale-110 transition-transform">
                <Package className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-white font-bold mb-2 group-hover:text-emerald-300 transition-colors">Inventario Inteligente</h3>
              <p className="text-white/70 text-sm">Control total de materias primas y stock en tiempo real</p>
            </div>

            <div className="glass-card p-6 hover:scale-105 transition-transform duration-300 cursor-pointer hover:border-amber-500/30">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-400 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30 mb-4 group-hover:scale-110 transition-transform">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-white font-bold mb-2 group-hover:text-amber-300 transition-colors">Compras Optimizadas</h3>
              <p className="text-white/70 text-sm">Registro y análisis de compras con proveedores</p>
            </div>

            <div className="glass-card p-6 hover:scale-105 transition-transform duration-300 cursor-pointer hover:border-purple-500/30">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-400 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-white font-bold mb-2 group-hover:text-purple-300 transition-colors">Analíticas Avanzadas</h3>
              <p className="text-white/70 text-sm">Gráficos y métricas para toma de decisiones</p>
            </div>

            <div className="glass-card p-6 hover:scale-105 transition-transform duration-300 cursor-pointer hover:border-cyan-500/30">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30 mb-4 group-hover:scale-110 transition-transform">
                <Factory className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-white font-bold mb-2 group-hover:text-cyan-300 transition-colors">Gestión Completa</h3>
              <p className="text-white/70 text-sm">Fórmulas, fabricaciones y mucho más</p>
            </div>
          </div>
        </div>

        {/* Right: Login Form */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md glass-card p-8 shadow-2xl">
        {/* Header Moderno */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-500 rounded-2xl shadow-lg shadow-purple-500/30 mb-4">
            <span className="text-white text-3xl font-bold">R</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            REFORMA
          </h1>
          <p className="text-foreground/70">
            Sistema de gestión de granjas
          </p>
        </div>

        {/* Tabs Modernos */}
        <div className="flex mb-8 p-1 rounded-xl glass-surface">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
              isLogin
                ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/30'
                : 'text-foreground/70 hover:text-foreground'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
              !isLogin
                ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/30'
                : 'text-foreground/70 hover:text-foreground'
            }`}
          >
            Registrarse
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl">
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
                  className="w-4 h-4 rounded border-white/20 text-purple-600 focus:ring-purple-600"
                />
                <span className="text-sm text-foreground/70">Recordarme</span>
              </label>
              <a
                href="#"
                className="text-sm text-purple-400 hover:text-purple-300 font-semibold transition"
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
      </div>
    </div>
  );
}
