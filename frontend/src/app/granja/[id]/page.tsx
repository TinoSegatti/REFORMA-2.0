'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { authService } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import InventarioExistenciasChart from '@/components/charts/InventarioExistenciasChart';
import FabricacionesFormulasChart from '@/components/charts/FabricacionesFormulasChart';
import ProveedoresComprasChart from '@/components/charts/ProveedoresComprasChart';
import { BarChart3, Package, Sprout, Factory, Users, RefreshCw } from 'lucide-react';

interface MateriaPrima {
  id: string;
  nombreMateriaPrima: string;
  codigoMateriaPrima: string;
}

interface InventarioStats {
  totalMateriasPrimas?: number;
  toneladasTotales?: number;
  costoTotalStock?: number;
  materiasMasExistencias?: Array<{
    codigo: string;
    nombre: string;
    cantidad: number;
    toneladas: number;
  }>;
}

interface FabricacionesStats {
  totalFabricaciones?: number;
  totalKgFabricados?: number;
  formulasMasProducidas?: Array<{
    codigo: string;
    descripcion: string;
    toneladasTotales: number;
  }>;
}

interface ProveedoresStats {
  cantidadProveedores?: number;
  proveedoresConMasCompras?: Array<{
    id: string;
    codigoProveedor: string;
    nombreProveedor: string;
    cantidadCompras: number;
  }>;
}

export default function PanelPrincipalPage() {
  const router = useRouter();
  const params = useParams();
  const idGranja = params.id as string;

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrima[]>([]);
  const [inventarioStats, setInventarioStats] = useState<InventarioStats | null>(null);
  const [fabricacionesStats, setFabricacionesStats] = useState<FabricacionesStats | null>(null);
  const [proveedoresStats, setProveedoresStats] = useState<ProveedoresStats | null>(null);

  const cargarDatos = useCallback(
    async (pantallaCompleta = true) => {
      try {
        const token = authService.getToken();
        if (!token || !idGranja) {
          router.push('/login');
          return;
        }

        if (pantallaCompleta) {
          setLoading(true);
        } else {
          setIsRefreshing(true);
        }

        const [materias, inventarioEstadisticas, fabricacionesEstadisticas, proveedoresEstadisticas] =
          await Promise.all([
            apiClient.getMateriasPrimas(token, idGranja),
            apiClient.getEstadisticasInventario(token, idGranja),
            apiClient.getEstadisticasFabricaciones(token, idGranja),
            apiClient.getEstadisticasProveedores(token, idGranja),
          ]);

        setMateriasPrimas(materias || []);
        setInventarioStats(inventarioEstadisticas || null);
        setFabricacionesStats(fabricacionesEstadisticas || null);
        setProveedoresStats(proveedoresEstadisticas || null);
      } catch (error) {
        console.error('Error cargando panel principal:', error);
      } finally {
        if (pantallaCompleta) {
          setLoading(false);
        } else {
          setIsRefreshing(false);
        }
      }
    },
    [idGranja, router]
  );

  useEffect(() => {
    if (!idGranja) return;

    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    cargarDatos(true);
  }, [router, idGranja, cargarDatos]);

  const formatNumber = (value: number, decimals = 0) =>
    Number(value || 0).toLocaleString('es-AR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  const formatCurrency = (value: number) =>
    Number(value || 0).toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    });

  const totalMateriasPrimas = materiasPrimas.length;
  const totalStockKg = useMemo(() => (inventarioStats?.toneladasTotales || 0) * 1000, [inventarioStats]);
  const topMateriaPrima = inventarioStats?.materiasMasExistencias?.[0] || null;
  const totalFabricaciones = fabricacionesStats?.totalFabricaciones ?? 0;
  const totalKgFabricados = fabricacionesStats?.totalKgFabricados ?? 0;
  const topFormula = fabricacionesStats?.formulasMasProducidas?.[0] || null;
  const proveedoresMasCompras = proveedoresStats?.proveedoresConMasCompras || [];
  const topProveedor = proveedoresMasCompras[0] || null;

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <div className="glass-card px-8 py-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-400/40 flex items-center justify-center">
              <BarChart3 className="h-7 w-7 text-purple-300 animate-bounce" />
            </div>
            <div>
              <p className="text-foreground font-semibold">Cargando panel principal...</p>
              <p className="text-sm text-foreground/70">
                Reuniendo métricas claves de compras, inventario, fabricaciones y proveedores.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 ml-64">
        <header className="glass-card px-8 py-6 m-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Panel Principal</h1>
                <p className="text-foreground/70 max-w-3xl">
                  Visualiza de un vistazo el estado general de tu operación: inventario disponible, fórmulas más
                  fabricadas y proveedores con mayores movimientos.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => cargarDatos(false)}
            disabled={isRefreshing}
            className="px-6 py-3 glass-surface text-foreground rounded-xl font-semibold hover:bg-white/10 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRefreshing ? (
              <>
                <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5" />
                Actualizar datos
              </>
            )}
          </button>
        </header>

        <div className="max-w-7xl mx-auto p-8 space-y-10">
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Sprout className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-foreground/60 uppercase tracking-wide">Materias registradas</p>
                <p className="text-3xl font-bold text-foreground">{totalMateriasPrimas}</p>
                <p className="text-xs text-foreground/60">
                  {topMateriaPrima
                    ? `Top: ${topMateriaPrima.nombre} (${formatNumber(topMateriaPrima.cantidad, 0)} kg)`
                    : 'Actualiza tu catálogo para ver tendencias'}
                </p>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center shadow-lg shadow-sky-500/30">
                <Package className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-foreground/60 uppercase tracking-wide">Stock disponible</p>
                <p className="text-3xl font-bold text-foreground">{formatNumber(totalStockKg, 0)} kg</p>
                <p className="text-xs text-foreground/60">
                  Equivalente a {formatNumber(totalStockKg / 1000, 2)} toneladas totales
                </p>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-400 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Factory className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-foreground/60 uppercase tracking-wide">Fabricaciones registradas</p>
                <p className="text-3xl font-bold text-foreground">{totalFabricaciones}</p>
                <p className="text-xs text-foreground/60">
                  {formatNumber(totalKgFabricados / 1000, 2)} toneladas producidas
                </p>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-400 flex items-center justify-center shadow-lg shadow-pink-500/30">
                <Users className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-foreground/60 uppercase tracking-wide">Proveedores activos</p>
                <p className="text-3xl font-bold text-foreground">
                  {proveedoresStats?.cantidadProveedores ?? proveedoresMasCompras.length}
                </p>
                <p className="text-xs text-foreground/60">
                  {topProveedor
                    ? `${topProveedor.nombreProveedor} lidera con ${topProveedor.cantidadCompras} compra(s)`
                    : 'Registra compras para visualizar rankings'}
                </p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Materias primas con más existencias</h3>
                  <p className="text-xs text-foreground/60">
                    Mantén la cobertura y anticipa necesidad de reposición.
                  </p>
                </div>
              </div>
              <InventarioExistenciasChart data={inventarioStats?.materiasMasExistencias || []} />
            </div>

            <div className="glass-card p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Fórmulas más fabricadas</h3>
                {topFormula && (
                  <span className="text-xs px-3 py-1 rounded-full glass-surface">
                    {topFormula.codigo} · {formatNumber(topFormula.toneladasTotales, 2)} ton
                  </span>
                )}
              </div>
              <FabricacionesFormulasChart data={fabricacionesStats?.formulasMasProducidas || []} />
            </div>
          </section>

          <section className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Proveedores con más compras registradas</h3>
                <p className="text-xs text-foreground/60">
                  Analiza la concentración de abastecimiento y negocia con tus principales socios.
                </p>
              </div>
            </div>
            <ProveedoresComprasChart data={proveedoresMasCompras} />
          </section>
        </div>
      </main>
    </div>
  );
}

