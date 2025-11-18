'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function ExitoPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [verificando, setVerificando] = useState(true);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      verificarPago(sessionId);
    } else {
      setError('No se encontró sesión de pago');
      setVerificando(false);
    }
  }, [searchParams]);

  const verificarPago = async (sessionId: string) => {
    try {
      const token = authService.getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await apiClient.verificarPago(token, sessionId);
      setExito(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al verificar pago');
    } finally {
      setVerificando(false);
    }
  };

  if (verificando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-white/70">Verificando pago...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e]">
      <div className="glass-card p-12 rounded-2xl max-w-md w-full mx-4 text-center">
        {exito ? (
          <>
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">
              ¡Pago Exitoso!
            </h1>
            <p className="text-white/70 mb-8">
              Tu suscripción ha sido activada correctamente. Ya puedes disfrutar de todas las funcionalidades de tu nuevo plan.
            </p>
            <Link
              href="/mis-plantas"
              className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-600 transition"
            >
              Ir a Mi Panel
            </Link>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-12 w-12 text-red-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">
              Error en el Pago
            </h1>
            <p className="text-white/70 mb-8">
              {error || 'Hubo un problema al procesar tu pago. Por favor, intenta nuevamente.'}
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/planes"
                className="px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition"
              >
                Volver a Planes
              </Link>
              <Link
                href="/mis-plantas"
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-600 transition"
              >
                Ir a Mi Panel
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

