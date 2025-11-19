'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { 
  BarChart3, 
  Package, 
  Sprout, 
  Factory, 
  Users, 
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  FileText,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import InventarioExistenciasChart from '@/components/charts/InventarioExistenciasChart';
import FabricacionesFormulasChart from '@/components/charts/FabricacionesFormulasChart';
import ProveedoresComprasChart from '@/components/charts/ProveedoresComprasChart';
import ProveedoresGastoChart from '@/components/charts/ProveedoresGastoChart';
import DistribucionMateriasFormulasChart from '@/components/charts/DistribucionMateriasFormulasChart';
import EvolucionCostosFormulasChart from '@/components/charts/EvolucionCostosFormulasChart';
import ConsumoMateriasPrimasChart from '@/components/charts/ConsumoMateriasPrimasChart';
import TendenciasPreciosChart from '@/components/charts/TendenciasPreciosChart';

interface DatosReporte {
  proveedoresMasCantidades: Array<{
    id: string;
    codigoProveedor: string;
    nombreProveedor: string;
    cantidadCompras: number;
  }>;
  proveedoresMasDinero: Array<{
    id: string;
    codigoProveedor: string;
    nombreProveedor: string;
    totalGastado: number;
    cantidadCompras: number;
  }>;
  materiasMasCompradas: Array<{
    codigo: string;
    nombre: string;
    cantidadTotal: number;
    vecesComprada: number;
  }>;
  materiasMasCaras: Array<{
    codigo: string;
    nombre: string;
    precioPromedio: number;
  }>;
  totalCompras: number;
  totalGastado: number;
  promedioGastado: number;
  facturasMasCaras: Array<{
    id: string;
    numeroFactura: string;
    fechaCompra: string;
    totalFactura: number;
    proveedor: string;
  }>;
  totalFabricaciones: number;
  totalKgFabricados: number;
  formulasMasFabricadas: Array<{
    codigo: string;
    descripcion: string;
    toneladasTotales: number;
  }>;
  formulasMasCaras: Array<{
    codigo: string;
    descripcion: string;
    costoTotal: number;
    costoPorKilo: number;
  }>;
  materiasMasExistencias: Array<{
    codigo: string;
    nombre: string;
    cantidad: number;
    toneladas: number;
  }>;
  materiasMasValor: Array<{
    codigo: string;
    nombre: string;
    valorStock: number;
    cantidad: number;
  }>;
  kilosEnStock: number;
  valorStock: number;
  cantidadMateriasEnStock: number;
  alertas: Array<{
    tipo: string;
    mensaje: string;
    severidad: 'baja' | 'media' | 'alta';
  }>;
  distribucionMateriasEnFormulas: Array<{
    formulaCodigo: string;
    formulaDescripcion: string;
    materias: Array<{
      materiaCodigo: string;
      materiaNombre: string;
      cantidadKg: number;
      porcentaje: number;
    }>;
  }>;
  evolucionCostosFormulas: Array<{
    fecha: string | Date;
    formulaCodigo: string;
    formulaDescripcion: string;
    costoTotal: number;
    costoPorKilo: number;
  }>;
  consumoMateriasPrimas: Array<{
    periodo: string;
    materiaCodigo: string;
    materiaNombre: string;
    cantidadKg: number;
  }>;
  tendenciasPrecios: Array<{
    fecha: string | Date;
    materiaCodigo: string;
    materiaNombre: string;
    precio: number;
  }>;
}

interface ReporteCompleto {
  granja: {
    id: string;
    nombreGranja: string;
    usuario: string;
    fechaGeneracion: string;
  };
  datos: DatosReporte;
}

const MENSAJES_CARGA = [
  'Recolectando datos de compras...',
  'Analizando proveedores...',
  'Calculando estadísticas de materias primas...',
  'Procesando información de inventario...',
  'Revisando fabricaciones...',
  'Analizando fórmulas...',
  'Realizando cálculos financieros...',
  'Preparando gráficos...',
  'Generando alertas...',
  'Finalizando reporte...'
];

export default function ReporteCompletoPage() {
  const router = useRouter();
  const params = useParams();
  const idGranja = params.id as string;

  const [loading, setLoading] = useState(true);
  const [mensajeCarga, setMensajeCarga] = useState(MENSAJES_CARGA[0]);
  const [reporte, setReporte] = useState<ReporteCompleto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargarReporte = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = authService.getToken();
      if (!token || !idGranja) {
        router.push('/login');
        return;
      }

      // Simular progreso de carga cambiando mensajes
      let indiceMensaje = 0;
      const intervaloMensajes = setInterval(() => {
        indiceMensaje = (indiceMensaje + 1) % MENSAJES_CARGA.length;
        setMensajeCarga(MENSAJES_CARGA[indiceMensaje]);
      }, 1500);

      try {
        const datos = await apiClient.obtenerReporteCompleto(token, idGranja);
        clearInterval(intervaloMensajes);
        setMensajeCarga('Reporte generado exitosamente');
        setReporte(datos);
      } catch (err) {
        clearInterval(intervaloMensajes);
        throw err;
      }
    } catch (err) {
      console.error('Error cargando reporte:', err);
      setError(err instanceof Error ? err.message : 'Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  }, [idGranja, router]);

  useEffect(() => {
    if (!idGranja) return;

    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    cargarReporte();
  }, [idGranja, router, cargarReporte]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass-card p-12 rounded-2xl max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/30">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Generando Reporte Completo</h2>
          <p className="text-foreground/70 mb-6">{mensajeCarga}</p>
          <div className="w-full bg-background/50 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card p-8 rounded-2xl max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Error al Generar Reporte</h2>
          <p className="text-foreground/70 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push(`/granja/${idGranja}`)}
              className="px-6 py-3 glass-surface text-foreground rounded-xl font-semibold hover:bg-white/10 transition-all"
            >
              Volver al Panel
            </button>
            <button
              onClick={cargarReporte}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!reporte) {
    return null;
  }

  const { datos, granja } = reporte;

  return (
    <div className="min-h-screen bg-background">
      {/* Header con navegación */}
      <header className="sticky top-0 z-50 glass-surface border-b border-border/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.push(`/granja/${idGranja}`)}
              className="flex items-center gap-2 text-foreground/80 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Volver al Panel</span>
            </button>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold text-foreground">Reporte Completo</span>
            </div>
            <div className="text-sm text-foreground/60">
              {new Date(granja.fechaGeneracion).toLocaleDateString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-12 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
              Reporte Completo de{' '}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                {granja.nombreGranja}
              </span>
            </h1>
            <p className="text-xl text-foreground/70 max-w-3xl mx-auto">
              Análisis completo de compras, inventario, fabricaciones y proveedores
            </p>
            <p className="text-sm text-foreground/60">
              Generado por {granja.usuario} • {new Date(granja.fechaGeneracion).toLocaleDateString('es-AR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>
      </section>

      {/* KPIs Principales */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Gastado */}
            <div className="glass-card p-6 rounded-xl border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm text-foreground/60">Total Gastado</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{formatCurrency(datos.totalGastado)}</p>
              <p className="text-sm text-foreground/60 mt-2">
                {datos.totalCompras} compra{datos.totalCompras !== 1 ? 's' : ''} registrada{datos.totalCompras !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Stock Total */}
            <div className="glass-card p-6 rounded-xl border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-sky-500 to-blue-500">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm text-foreground/60">Stock Total</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{formatNumber(datos.kilosEnStock / 1000, 2)} ton</p>
              <p className="text-sm text-foreground/60 mt-2">
                Valor: {formatCurrency(datos.valorStock)}
              </p>
            </div>

            {/* Fabricaciones */}
            <div className="glass-card p-6 rounded-xl border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                  <Factory className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm text-foreground/60">Fabricaciones</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{formatNumber(datos.totalFabricaciones)}</p>
              <p className="text-sm text-foreground/60 mt-2">
                {formatNumber(datos.totalKgFabricados / 1000, 2)} toneladas producidas
              </p>
            </div>

            {/* Alertas */}
            <div className="glass-card p-6 rounded-xl border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm text-foreground/60">Alertas</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{datos.alertas.length}</p>
              <p className="text-sm text-foreground/60 mt-2">
                {datos.alertas.filter(a => a.severidad === 'alta').length} alta{datos.alertas.filter(a => a.severidad === 'alta').length !== 1 ? 's' : ''} prioridad
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Proveedores */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-background/50">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Análisis de Proveedores
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-xl border border-border/50">
              <h3 className="text-xl font-semibold text-foreground mb-4">Proveedores con Más Compras</h3>
              <ProveedoresComprasChart data={datos.proveedoresMasCantidades.map(p => ({
                id: p.id,
                codigoProveedor: p.codigoProveedor,
                nombreProveedor: p.nombreProveedor,
                cantidadCompras: p.cantidadCompras
              }))} />
            </div>
            <div className="glass-card p-6 rounded-xl border border-border/50">
              <h3 className="text-xl font-semibold text-foreground mb-4">Proveedores con Más Dinero Gastado</h3>
              <ProveedoresGastoChart data={datos.proveedoresMasDinero.map(p => ({
                id: p.id,
                codigoProveedor: p.codigoProveedor,
                nombreProveedor: p.nombreProveedor,
                totalGastado: p.totalGastado
              }))} />
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Materias Primas */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
            <Sprout className="h-8 w-8 text-primary" />
            Análisis de Materias Primas
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="glass-card p-6 rounded-xl border border-border/50">
              <h3 className="text-xl font-semibold text-foreground mb-4">Materias Más Compradas (kg)</h3>
              <div className="space-y-3">
                {datos.materiasMasCompradas.slice(0, 10).map((materia, index) => (
                  <div key={index} className="flex items-center justify-between p-3 glass-surface rounded-lg">
                    <div>
                      <p className="font-semibold text-foreground">{materia.nombre}</p>
                      <p className="text-sm text-foreground/60">{materia.codigo}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{formatNumber(materia.cantidadTotal, 0)} kg</p>
                      <p className="text-xs text-foreground/60">{materia.vecesComprada} compra{materia.vecesComprada !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card p-6 rounded-xl border border-border/50">
              <h3 className="text-xl font-semibold text-foreground mb-4">Materias Más Caras (precio/kg)</h3>
              <div className="space-y-3">
                {datos.materiasMasCaras.slice(0, 10).map((materia, index) => (
                  <div key={index} className="flex items-center justify-between p-3 glass-surface rounded-lg">
                    <div>
                      <p className="font-semibold text-foreground">{materia.nombre}</p>
                      <p className="text-sm text-foreground/60">{materia.codigo}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{formatCurrency(materia.precioPromedio)}</p>
                      <p className="text-xs text-foreground/60">por kilo</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-xl border border-border/50">
              <h3 className="text-xl font-semibold text-foreground mb-4">Materias con Más Existencias</h3>
              <InventarioExistenciasChart data={datos.materiasMasExistencias} />
            </div>
            <div className="glass-card p-6 rounded-xl border border-border/50">
              <h3 className="text-xl font-semibold text-foreground mb-4">Materias con Más Valor en Stock</h3>
              <div className="space-y-3">
                {datos.materiasMasValor.slice(0, 10).map((materia, index) => (
                  <div key={index} className="flex items-center justify-between p-3 glass-surface rounded-lg">
                    <div>
                      <p className="font-semibold text-foreground">{materia.nombre}</p>
                      <p className="text-sm text-foreground/60">{materia.codigo}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{formatCurrency(materia.valorStock)}</p>
                      <p className="text-xs text-foreground/60">{formatNumber(materia.cantidad / 1000, 2)} ton</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Compras */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-background/50">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-primary" />
            Análisis de Compras
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="glass-card p-6 rounded-xl border border-border/50 text-center">
              <p className="text-sm text-foreground/60 mb-2">Total de Compras</p>
              <p className="text-4xl font-bold text-foreground">{formatNumber(datos.totalCompras)}</p>
            </div>
            <div className="glass-card p-6 rounded-xl border border-border/50 text-center">
              <p className="text-sm text-foreground/60 mb-2">Total Gastado</p>
              <p className="text-4xl font-bold text-foreground">{formatCurrency(datos.totalGastado)}</p>
            </div>
            <div className="glass-card p-6 rounded-xl border border-border/50 text-center">
              <p className="text-sm text-foreground/60 mb-2">Promedio por Compra</p>
              <p className="text-4xl font-bold text-foreground">{formatCurrency(datos.promedioGastado)}</p>
            </div>
          </div>
          <div className="glass-card p-6 rounded-xl border border-border/50">
            <h3 className="text-xl font-semibold text-foreground mb-4">Facturas Más Caras</h3>
            <div className="space-y-3">
              {datos.facturasMasCaras.slice(0, 10).map((factura) => (
                <div key={factura.id} className="flex items-center justify-between p-4 glass-surface rounded-lg">
                  <div>
                    <p className="font-semibold text-foreground">Factura {factura.numeroFactura}</p>
                    <p className="text-sm text-foreground/60">{factura.proveedor}</p>
                    <p className="text-xs text-foreground/50">
                      {new Date(factura.fechaCompra).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(factura.totalFactura)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Fabricaciones y Fórmulas */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
            <Factory className="h-8 w-8 text-primary" />
            Análisis de Fabricaciones y Fórmulas
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="glass-card p-6 rounded-xl border border-border/50">
              <h3 className="text-xl font-semibold text-foreground mb-4">Fórmulas Más Fabricadas</h3>
              <FabricacionesFormulasChart data={datos.formulasMasFabricadas} />
            </div>
            <div className="glass-card p-6 rounded-xl border border-border/50">
              <h3 className="text-xl font-semibold text-foreground mb-4">Fórmulas Más Caras</h3>
              <div className="space-y-3">
                {datos.formulasMasCaras.slice(0, 10).map((formula, index) => (
                  <div key={index} className="flex items-center justify-between p-3 glass-surface rounded-lg">
                    <div>
                      <p className="font-semibold text-foreground">{formula.descripcion}</p>
                      <p className="text-sm text-foreground/60">{formula.codigo}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{formatCurrency(formula.costoTotal)}</p>
                      <p className="text-xs text-foreground/60">{formatCurrency(formula.costoPorKilo)}/kg</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Gráficos Avanzados (ENTERPRISE) */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-background/50">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            Gráficos Avanzados de Análisis
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="glass-card p-6 rounded-xl border border-border/50">
              <h3 className="text-xl font-semibold text-foreground mb-4">Distribución de Materias Primas en Fórmulas</h3>
              <DistribucionMateriasFormulasChart data={datos.distribucionMateriasEnFormulas} />
            </div>
            <div className="glass-card p-6 rounded-xl border border-border/50">
              <h3 className="text-xl font-semibold text-foreground mb-4">Evolución de Costos de Fórmulas</h3>
              <EvolucionCostosFormulasChart data={datos.evolucionCostosFormulas} />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-xl border border-border/50">
              <h3 className="text-xl font-semibold text-foreground mb-4">Consumo de Materias Primas por Período</h3>
              <ConsumoMateriasPrimasChart data={datos.consumoMateriasPrimas} />
            </div>
            <div className="glass-card p-6 rounded-xl border border-border/50">
              <h3 className="text-xl font-semibold text-foreground mb-4">Tendencias de Precios</h3>
              <TendenciasPreciosChart data={datos.tendenciasPrecios} />
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Alertas */}
      {datos.alertas.length > 0 && (
        <section className="py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-background/50">
          <div className="container mx-auto max-w-7xl">
            <h2 className="text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
              Alertas y Notificaciones
            </h2>
            <div className="glass-card p-6 rounded-xl border border-border/50">
              <div className="space-y-3">
                {datos.alertas.map((alerta, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      alerta.severidad === 'alta'
                        ? 'bg-red-500/10 border-red-500/30'
                        : alerta.severidad === 'media'
                        ? 'bg-orange-500/10 border-orange-500/30'
                        : 'bg-yellow-500/10 border-yellow-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle
                        className={`h-5 w-5 mt-0.5 ${
                          alerta.severidad === 'alta'
                            ? 'text-red-500'
                            : alerta.severidad === 'media'
                            ? 'text-orange-500'
                            : 'text-yellow-500'
                        }`}
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{alerta.mensaje}</p>
                        <p className="text-xs text-foreground/60 mt-1">
                          Severidad: {alerta.severidad.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-border/50 mt-12">
        <div className="container mx-auto max-w-7xl text-center">
          <p className="text-foreground/60 text-sm">
            Reporte generado el {new Date(granja.fechaGeneracion).toLocaleDateString('es-AR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </footer>
    </div>
  );
}

