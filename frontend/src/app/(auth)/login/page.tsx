'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGoogleLogin } from '@react-oauth/google';
import { Input, Button, Modal } from '@/components/ui';
import { apiClient } from '@/lib/api';
import { authService } from '@/lib/auth';
import { BarChart3, Package, ShoppingCart, Factory, CheckCircle, Mail, AlertCircle, Users } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [apellidoUsuario, setApellidoUsuario] = useState('');
  const [codigoReferencia, setCodigoReferencia] = useState('');
  const [mostrarCodigoReferencia, setMostrarCodigoReferencia] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showModalRegistro, setShowModalRegistro] = useState(false);
  const [mensajeRegistro, setMensajeRegistro] = useState('');
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [esEmpleado, setEsEmpleado] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const response = await apiClient.login(email, password);
        
        // Verificar si requiere verificación de email
        if (response.requiereVerificacion) {
          setError(response.mensaje || 'Por favor verifica tu email antes de iniciar sesión.');
          return;
        }
        
        authService.setAuth(response.token, response.usuario);
        router.push('/mis-plantas');
      } else {
        // Registro
        const datosRegistro: {
          email: string;
          password: string;
          nombreUsuario: string;
          apellidoUsuario: string;
          codigoReferencia?: string;
        } = {
          email,
          password,
          nombreUsuario,
          apellidoUsuario,
        };

        // Agregar código de referencia si se proporcionó
        if (codigoReferencia && codigoReferencia.trim()) {
          datosRegistro.codigoReferencia = codigoReferencia.trim();
        }

        const response = await apiClient.register(datosRegistro);
        
        // Si el registro requiere verificación, mostrar modal
        if (response.requiereVerificacion || !response.token) {
          setError('');
          // Configurar mensaje para el modal
          const mensajeExito = response.mensaje || 'Usuario registrado exitosamente. Por favor verifica tu email para activar tu cuenta.';
          setMensajeRegistro(mensajeExito);
          setEmailEnviado(response.emailEnviado || false);
          setEsEmpleado(response.esEmpleado || false);
          setShowModalRegistro(true);
          
          // Limpiar formulario
          setEmail('');
          setPassword('');
          setNombreUsuario('');
          setApellidoUsuario('');
          setCodigoReferencia('');
          setMostrarCodigoReferencia(false);
          setIsLogin(true); // Cambiar a login
          return;
        }
        
        // Si viene token (no debería pasar con verificación activa), hacer login automático
        if (response.token) {
          authService.setAuth(response.token, response.usuario);
          router.push('/mis-plantas');
        }
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : 'Error al procesar la solicitud';
      setError(error);
      
      // Si el error es de email no verificado, ofrecer reenviar
      if (error.includes('Email no verificado') || error.includes('requiere verificación')) {
        // El mensaje ya está en el error, pero podríamos agregar un botón para reenviar
      }
    } finally {
      setLoading(false);
    }
  };

  // Verificar si Google OAuth está configurado
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const isGoogleEnabled = googleClientId && googleClientId !== 'dummy-client-id';

  // Manejar autenticación con Google
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setError('');

      try {
        // Obtener información del usuario de Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });

        if (!userInfoResponse.ok) {
          throw new Error('Error al obtener información de Google');
        }

        const googleUser = await userInfoResponse.json();

        // Enviar información al backend
        const response = await apiClient.googleAuth({
          idToken: tokenResponse.access_token,
          googleId: googleUser.sub || googleUser.id,
          email: googleUser.email,
          given_name: googleUser.given_name,
          family_name: googleUser.family_name,
          picture: googleUser.picture,
        });

        // Guardar autenticación
        authService.setAuth(response.token, response.usuario);
        router.push('/mis-plantas');
      } catch (err: unknown) {
        console.error('Error en autenticación con Google:', err);
        setError(err instanceof Error ? err.message : 'Error al autenticar con Google');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: (error) => {
      console.error('Error de Google OAuth:', error);
      setError('Error al iniciar sesión con Google');
      setGoogleLoading(false);
    },
  });

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ objectFit: 'cover' }}
        onError={(e) => {
          const video = e.currentTarget;
          video.style.display = 'none';
        }}
      >
        <source src="/landing/hero-background.mp4" type="video/mp4" />
        Tu navegador no soporta videos HTML5.
      </video>
      
      {/* Background gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/90 to-background/95 pointer-events-none z-0" />
      
      {/* Animated Background Bubbles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
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
          <div className="w-full max-w-md glass-card p-8 shadow-2xl bg-background/95 backdrop-blur-xl">
        {/* Header Moderno */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-500 rounded-2xl shadow-lg shadow-purple-500/30 mb-4 p-2">
            <img 
              src="/logo.png?v=2" 
              alt="REFORMA Logo" 
              className="w-full h-full object-contain"
            />
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
              
              {/* Campo de código de referencia (opcional) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground/80">
                    Código de Referencia (Opcional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setMostrarCodigoReferencia(!mostrarCodigoReferencia)}
                    className="text-xs text-purple-400 hover:text-purple-300 font-semibold transition"
                  >
                    {mostrarCodigoReferencia ? 'Ocultar' : '¿Tienes un código?'}
                  </button>
                </div>
                {mostrarCodigoReferencia && (
                  <Input
                    placeholder="REF-STARTER-XXXXXXXX"
                    value={codigoReferencia}
                    onChange={(e) => setCodigoReferencia(e.target.value)}
                    className="text-sm"
                  />
                )}
                {mostrarCodigoReferencia && (
                  <p className="text-xs text-foreground/60">
                    Si tienes un código de referencia de tu empleador, ingrésalo aquí para vincular tu cuenta.
                  </p>
                )}
              </div>
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
            disabled={loading || googleLoading}
          >
            {loading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
          </Button>
        </form>

        {/* Divider - Mostrar siempre, pero el botón puede estar deshabilitado */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-transparent text-foreground/60">O continúa con</span>
          </div>
        </div>

        {/* Google Sign-In Button */}
        {isGoogleEnabled ? (
          <Button
            variant="neutral"
            className="w-full flex items-center justify-center gap-3"
            onClick={() => handleGoogleLogin()}
            disabled={loading || googleLoading}
          >
            {googleLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span>Conectando con Google...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continuar con Google</span>
              </>
            )}
          </Button>
        ) : (
          <div className="w-full p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <p className="text-sm text-yellow-300 text-center">
              <strong>Google Sign-In no está configurado.</strong>
              <br />
              <span className="text-yellow-400/80 text-xs mt-1 block">
                Para habilitar esta opción, configura NEXT_PUBLIC_GOOGLE_CLIENT_ID en .env.local
              </span>
            </p>
          </div>
        )}
          </div>
        </div>
      </div>

      {/* Modal Registro Exitoso */}
      <Modal
        isOpen={showModalRegistro}
        onClose={() => setShowModalRegistro(false)}
        title=""
        footer={
          <button
            onClick={() => {
              setShowModalRegistro(false);
              setIsLogin(true);
            }}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:brightness-110 transition-all"
          >
            Entendido
          </button>
        }
      >
        <div className="text-center">
          {emailEnviado ? (
            <>
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-foreground mb-4">
                {esEmpleado ? '¡Registro como Empleado Exitoso!' : '¡Registro Exitoso!'}
              </h3>
              
              <div className="glass-card p-6 mb-6 text-left">
                {esEmpleado && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-blue-300 font-semibold mb-1">
                          Cuenta de Empleado Vinculada
                        </p>
                        <p className="text-sm text-foreground/80">
                          Tu cuenta ha sido vinculada como empleado. Una vez verifiques tu email, tendrás acceso a las plantas de tu empleador.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-foreground/90 mb-4 leading-relaxed">
                  {mensajeRegistro}
                </p>
                
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-green-300 font-semibold mb-1">
                        Email de verificación enviado
                      </p>
                      <p className="text-sm text-foreground/80">
                        Se ha enviado un correo de verificación a tu email. Revisa tu bandeja de entrada (y la carpeta de spam).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                  <p className="text-sm text-purple-300 font-semibold mb-2">
                    📧 Próximos pasos:
                  </p>
                  <ol className="text-sm text-foreground/80 space-y-2 list-decimal list-inside">
                    <li>Revisa tu bandeja de entrada</li>
                    <li>Haz clic en el enlace de verificación</li>
                    <li>Inicia sesión con tus credenciales</li>
                  </ol>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/30">
                <AlertCircle className="h-12 w-12 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Registro Completado
              </h3>
              
              <div className="glass-card p-6 mb-6 text-left">
                <p className="text-foreground/90 mb-4 leading-relaxed">
                  {mensajeRegistro}
                </p>
                
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-orange-300 font-semibold mb-1">
                        Servicio de email no configurado
                      </p>
                      <p className="text-sm text-foreground/80">
                        El servicio de email no está configurado. Contacta al administrador para activar tu cuenta.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
