'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui';
import { apiClient } from '@/lib/api';
import { authService } from '@/lib/auth';
import { CheckCircle, XCircle, Mail, Loader2 } from 'lucide-react';

function VerificarEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [estado, setEstado] = useState<'verificando' | 'exitoso' | 'error' | 'expirado' | 'ya_verificado'>('verificando');
  const [mensaje, setMensaje] = useState('');
  const [email, setEmail] = useState('');
  const [reenviando, setReenviando] = useState(false);

  useEffect(() => {
    if (token) {
      verificarEmail(token);
    } else {
      setEstado('error');
      setMensaje('Token de verificación no proporcionado');
    }
  }, [token]);

  const verificarEmail = async (tokenVerificacion: string) => {
    try {
      const response = await apiClient.verificarEmail(tokenVerificacion);
      
      // Guardar autenticación
      authService.setAuth(response.token, response.usuario);
      
      setEstado('exitoso');
      setMensaje('Email verificado exitosamente. Redirigiendo...');
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        router.push('/mis-plantas');
      }, 2000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al verificar email';
      
      if (errorMessage.includes('expirado')) {
        setEstado('expirado');
        setMensaje('El enlace de verificación ha expirado. Por favor solicita uno nuevo.');
      } else if (errorMessage.includes('ya verificado')) {
        setEstado('ya_verificado');
        setMensaje('Este email ya fue verificado. Puedes iniciar sesión normalmente.');
      } else {
        setEstado('error');
        setMensaje(errorMessage);
      }
    }
  };

  const handleReenviarEmail = async () => {
    if (!email) {
      setMensaje('Por favor ingresa tu email');
      return;
    }

    setReenviando(true);
    try {
      await apiClient.reenviarEmailVerificacion(email);
      setMensaje('Email de verificación reenviado. Revisa tu bandeja de entrada.');
      setEstado('verificando');
    } catch (error: unknown) {
      setMensaje(error instanceof Error ? error.message : 'Error al reenviar email');
    } finally {
      setReenviando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-card p-8 rounded-xl border border-border/50">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-500 rounded-2xl shadow-lg shadow-purple-500/30 mb-4">
            <span className="text-white text-3xl font-bold">R</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Verificar Email
          </h1>
        </div>

        {estado === 'verificando' && (
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
            <p className="text-foreground/70">Verificando tu email...</p>
          </div>
        )}

        {estado === 'exitoso' && (
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">¡Email Verificado!</h2>
            <p className="text-foreground/70">{mensaje}</p>
          </div>
        )}

        {estado === 'error' && (
          <div className="text-center space-y-4">
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">Error de Verificación</h2>
            <p className="text-foreground/70">{mensaje}</p>
            <div className="mt-6">
              <Button
                variant="primary"
                onClick={() => router.push('/login')}
                className="w-full"
              >
                Ir a Iniciar Sesión
              </Button>
            </div>
          </div>
        )}

        {estado === 'expirado' && (
          <div className="text-center space-y-4">
            <XCircle className="h-16 w-16 text-orange-500 mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">Enlace Expirado</h2>
            <p className="text-foreground/70">{mensaje}</p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Ingresa tu email para reenviar el enlace
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full glass-input"
                />
              </div>
              <Button
                variant="primary"
                onClick={handleReenviarEmail}
                disabled={reenviando || !email}
                className="w-full"
              >
                {reenviando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Reenviando...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Reenviar Email de Verificación
                  </>
                )}
              </Button>
              <Button
                variant="neutral"
                onClick={() => router.push('/login')}
                className="w-full"
              >
                Ir a Iniciar Sesión
              </Button>
            </div>
          </div>
        )}

        {estado === 'ya_verificado' && (
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">Email Ya Verificado</h2>
            <p className="text-foreground/70">{mensaje}</p>
            <div className="mt-6">
              <Button
                variant="primary"
                onClick={() => router.push('/login')}
                className="w-full"
              >
                Ir a Iniciar Sesión
              </Button>
            </div>
          </div>
        )}

        {mensaje && estado !== 'verificando' && estado !== 'exitoso' && (
          <div className="mt-4 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-300">{mensaje}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerificarEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-card p-8 rounded-xl border border-border/50">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
              <p className="text-foreground/70">Cargando...</p>
            </div>
          </div>
        </div>
      }
    >
      <VerificarEmailContent />
    </Suspense>
  );
}
