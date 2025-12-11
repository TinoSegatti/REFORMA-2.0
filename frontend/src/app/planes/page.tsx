'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { Check, X, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Plan {
  id: string;
  nombre: string;
  descripcion: string;
  precioMensual: number;
  precioAnual: number;
  limites: {
    maxMateriasPrimas: number | null;
    maxProveedores: number | null;
    maxPiensos: number | null;
    maxCompras: number | null;
    maxFormulas: number | null;
    maxFabricaciones: number | null;
    maxGranjas: number | null;
    maxUsuarios: number | null;
    maxArchivosHistoricos: number | null;
  };
  funcionalidades: {
    permiteGraficosAvanzados: boolean;
    permiteGraficosFormulas: boolean;
    permiteGraficosFabricaciones: boolean;
    permiteReportesPDF: boolean;
    permiteImportacionCSV: boolean;
    permiteImportacionCSVCompleta: boolean;
    permiteMultiplesUsuarios: boolean;
    permiteDatosPermanentes: boolean;
    permiteMultiplesPlantas: boolean;
    permiteHistorialCompleto: boolean;
    permiteHistorialFormulas: boolean;
    permiteRestaurarFabricaciones: boolean;
    permiteCapacitacionPersonalizada: boolean;
    permiteSoporteDirecto: boolean;
    permiteAlertasWhatsApp: boolean;
    permiteGestionIA: boolean;
  };
}

type PeriodoFacturacion = 'MENSUAL' | 'ANUAL';

export default function PlanesPage() {
  const router = useRouter();
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [periodo, setPeriodo] = useState<PeriodoFacturacion>('MENSUAL');
  const [loading, setLoading] = useState(true);
  const [planActual, setPlanActual] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [esSuperusuario, setEsSuperusuario] = useState(false);

  useEffect(() => {
    cargarPlanes();
    cargarPlanActual();
    verificarSuperusuario();
  }, []);

  const verificarSuperusuario = async () => {
    try {
      const token = authService.getToken();
      if (token) {
        const response = await apiClient.verificarSuperusuario(token);
        setEsSuperusuario(response.esSuperusuario || false);
      }
    } catch (err) {
      // No es crítico si falla
      console.log('No se pudo verificar superusuario:', err);
    }
  };

  const cargarPlanes = async () => {
    try {
      const response = await apiClient.obtenerPlanes();
      setPlanes(response.planes || []);
    } catch (err) {
      setError('Error al cargar planes');
      console.error('Error cargando planes:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarPlanActual = async () => {
    try {
      const token = authService.getToken();
      if (token) {
        const response = await apiClient.obtenerMiPlan(token);
        setPlanActual(response.suscripcion?.plan || null);
      }
    } catch (err) {
      // Usuario no autenticado o sin plan, no es crítico
      console.log('No se pudo cargar plan actual:', err);
    }
  };

  const handleSeleccionarPlan = async (planId: string) => {
    try {
      const token = authService.getToken();
      if (!token) {
        router.push('/login?redirect=/planes');
        return;
      }

      setError('');
      
      // Crear checkout
      const response = await apiClient.crearCheckout(token, planId, periodo);
      
      // Si es super admin, el backend retorna éxito directo sin procesador de pago
      if (response.exito) {
        alert(`Plan actualizado a ${planId} (modo super admin)`);
        // Recargar plan actual
        await cargarPlanActual();
        // Recargar la página para reflejar cambios
        window.location.reload();
        return;
      }
      
      if (response.url) {
        // Redirigir a Mercado Pago Checkout
        window.location.href = response.url;
      } else {
        // Si no hay URL ni éxito, algo salió mal
        setError('No se recibió respuesta válida del servidor');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear checkout';
      setError(errorMessage);
      console.error('Error creando checkout:', err);
      
      // Si es super admin y hay error, mostrar mensaje más específico
      if (esSuperusuario) {
        console.error('Error como super admin:', err);
      }
    }
  };

  const formatearPrecio = (precio: number) => {
    if (precio === 0) return 'Gratis';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(precio);
  };

  const formatearLimite = (limite: number | null) => {
    if (limite === null) return 'Ilimitado';
    return limite.toLocaleString('es-AR');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-white/70">Cargando planes...</p>
        </div>
      </div>
    );
  }

  const token = authService.getToken();
  const estaAutenticado = !!token;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e]">
      {/* Header */}
      <header className="border-b border-white/10 bg-background/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={estaAutenticado ? "/mis-plantas" : "/"} className="flex items-center gap-2">
            <img 
              src="/logo.png?v=2" 
              alt="REFORMA Logo" 
              className="h-8 w-8 object-contain"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              REFORMA
            </span>
          </Link>
          <div className="flex gap-4">
            {estaAutenticado ? (
              <Link 
                href="/mis-plantas" 
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 transition flex items-center gap-2"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                Volver al Menú Principal
              </Link>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 text-white/70 hover:text-white transition">
                  Iniciar Sesión
                </Link>
                <Link href="/login" className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 transition">
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Elige el plan perfecto para tu negocio
          </h1>
          <p className="text-xl text-white/70 mb-8">
            Comienza gratis y escala según crezcas
          </p>

          {/* Toggle Mensual/Anual */}
          <div className="inline-flex items-center gap-4 bg-white/10 p-1 rounded-xl backdrop-blur-sm">
            <button
              onClick={() => setPeriodo('MENSUAL')}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                periodo === 'MENSUAL'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setPeriodo('ANUAL')}
              className={`px-6 py-2 rounded-lg font-semibold transition relative ${
                periodo === 'ANUAL'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Anual
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                -17%
              </span>
            </button>
          </div>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300">
            {error}
          </div>
        )}

        {/* Grid de Planes */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {planes.map((plan) => {
            const precio = periodo === 'ANUAL' ? plan.precioAnual : plan.precioMensual;
            const esPlanActual = planActual === plan.id;
            const esDemo = plan.id === 'DEMO';

            return (
              <div
                key={plan.id}
                className={`glass-card p-8 rounded-2xl relative ${
                  plan.id === 'BUSINESS'
                    ? 'ring-2 ring-cyan-400 scale-105'
                    : ''
                } ${esPlanActual ? 'ring-2 ring-green-400' : ''}`}
              >
                {plan.id === 'BUSINESS' && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Más Popular
                  </div>
                )}
                {esPlanActual && (
                  <div className="absolute -top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Tu Plan
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.nombre}</h3>
                  <p className="text-white/60 text-sm mb-4">{plan.descripcion}</p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-white">{formatearPrecio(precio)}</span>
                    {precio > 0 && (
                      <span className="text-white/60 text-sm ml-2">
                        /{periodo === 'ANUAL' ? 'año' : 'mes'}
                      </span>
                    )}
                  </div>
                  {periodo === 'ANUAL' && precio > 0 && (
                    <p className="text-green-400 text-sm">
                      Ahorra {formatearPrecio(plan.precioMensual * 12 - plan.precioAnual)}/año
                    </p>
                  )}
                </div>

                <div className="space-y-3 mb-8 min-h-[300px]">
                  <div className="flex items-start gap-2">
                    {plan.limites.maxMateriasPrimas !== null ? (
                      <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    )}
                    <span className="text-white/80 text-sm">
                      Materias Primas: {formatearLimite(plan.limites.maxMateriasPrimas)}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-white/80 text-sm">
                      Proveedores: {formatearLimite(plan.limites.maxProveedores)}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-white/80 text-sm">
                      Compras: {formatearLimite(plan.limites.maxCompras)}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-white/80 text-sm">
                      Fórmulas: {formatearLimite(plan.limites.maxFormulas)}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-white/80 text-sm">
                      Fabricaciones: {formatearLimite(plan.limites.maxFabricaciones)}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-white/80 text-sm">
                      Plantas: {formatearLimite(plan.limites.maxGranjas)}
                    </span>
                  </div>
                  {plan.funcionalidades.permiteReportesPDF && (
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80 text-sm">Reportes PDF</span>
                    </div>
                  )}
                  {plan.funcionalidades.permiteMultiplesUsuarios && (
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80 text-sm">
                        Múltiples usuarios: {formatearLimite(plan.limites.maxUsuarios)}
                      </span>
                    </div>
                  )}
                  {plan.funcionalidades.permiteAlertasWhatsApp && (
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80 text-sm">Alertas WhatsApp</span>
                    </div>
                  )}
                  {plan.funcionalidades.permiteGestionIA && (
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80 text-sm">Gestión con IA</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleSeleccionarPlan(plan.id)}
                  disabled={esPlanActual || esDemo}
                  className={`w-full py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
                    esPlanActual
                      ? 'bg-white/10 text-white/50 cursor-not-allowed'
                      : esDemo
                      ? 'bg-white/10 text-white/50 cursor-not-allowed'
                      : plan.id === 'BUSINESS'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {esPlanActual ? (
                    <>
                      <Check className="h-5 w-5" />
                      Plan Actual
                    </>
                  ) : esDemo ? (
                    'Plan Gratuito'
                  ) : esSuperusuario ? (
                    <>
                      Cambiar Plan (Admin)
                      <ArrowRight className="h-5 w-5" />
                    </>
                  ) : (
                    <>
                      Seleccionar Plan
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Información adicional */}
        <div className="mt-16 text-center text-white/70">
          <p className="mb-4">
            ¿Necesitas ayuda para elegir?{' '}
            <Link href="/contacto" className="text-cyan-400 hover:text-cyan-300">
              Contáctanos
            </Link>
          </p>
          <p className="text-sm">
            Todos los planes incluyen soporte técnico y actualizaciones gratuitas
          </p>
        </div>
      </main>
    </div>
  );
}

