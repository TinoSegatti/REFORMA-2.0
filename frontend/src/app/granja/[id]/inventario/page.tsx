'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import { Modal } from '@/components/ui';
import InventarioExistenciasChart from '@/components/charts/InventarioExistenciasChart';
import InventarioValorChart from '@/components/charts/InventarioValorChart';
import { Package, Trash2, Rocket, AlertTriangle, ChevronDown, ChevronUp, ArrowUpDown, ArrowUp, ArrowDown, Download } from 'lucide-react';

interface MateriaPrima {
  id: string;
  codigoMateriaPrima: string;
  nombreMateriaPrima: string;
  precioPorKilo: number;
}

interface InventarioItem {
  id: string;
  cantidadAcumulada: number;
  cantidadSistema: number;
  cantidadReal: number;
  merma: number;
  precioAlmacen: number;
  valorStock: number;
  materiaPrima: MateriaPrima;
}

interface EstadisticasInventario {
  totalMateriasPrimas: number;
  toneladasTotales: number;
  costoTotalStock: number;
  materiasMasExistencias: Array<{
    codigo: string;
    nombre: string;
    cantidad: number;
    toneladas: number;
  }>;
  materiasMasValor: Array<{
    codigo: string;
    nombre: string;
    precioAlmacen: number;
    valorStock: number;
  }>;
  alertasStock: Array<{
    codigo: string;
    nombre: string;
    cantidadReal: number;
    tipo: 'NEGATIVO' | 'CERO';
  }>;
}

export default function InventarioPage() {
  const params = useParams();
  const router = useRouter();
  const idGranja = params.id as string;

  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasInventario | null>(null);
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrima[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [showModalInicializar, setShowModalInicializar] = useState(false);
  const [showModalVaciar, setShowModalVaciar] = useState(false);
  const [showModalEditar, setShowModalEditar] = useState(false);
  const [showModalEliminadas, setShowModalEliminadas] = useState(false);
  const [showModalAdvertencia, setShowModalAdvertencia] = useState(false);
  const [mensajeAdvertencia, setMensajeAdvertencia] = useState('');
  const [editando, setEditando] = useState<InventarioItem | null>(null);
  const [formData, setFormData] = useState({
    cantidadReal: ''
  });
  const [alertasMinimizadas, setAlertasMinimizadas] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  // Estado para inicialización manual por líneas
  const [lineasInicializacion, setLineasInicializacion] = useState<Array<{
    idMateriaPrima: string;
    codigo: string;
    nombre: string;
    cantidadKg: string;
    precioPorKilo: string;
  }>>([
    { idMateriaPrima: '', codigo: '', nombre: '', cantidadKg: '', precioPorKilo: '' }
  ]);
  const [sugerencias, setSugerencias] = useState<MateriaPrima[]>([]);
  const [sugIndex, setSugIndex] = useState<number | null>(null);
  const [sugCampo, setSugCampo] = useState<'codigo' | 'nombre' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    cargarDatos();
  }, [router, idGranja]);

  const cargarDatos = async () => {
    try {
      const token = authService.getToken();
      if (token) {
        const [inventarioData, estadisticasData, materiasData] = await Promise.all([
          apiClient.getInventario(token, idGranja),
          apiClient.getEstadisticasInventario(token, idGranja),
          apiClient.getMateriasPrimas(token, idGranja)
        ]);

        setInventario(inventarioData);
        setEstadisticas(estadisticasData);
        setMateriasPrimas(materiasData);
      }
    } catch (error: unknown) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const inicializarInventario = async () => {
    if (isInitializing) return; // Prevenir múltiples clicks

    setIsInitializing(true);
    try {
      const token = authService.getToken();
      if (!token) {
        setIsInitializing(false);
        return;
      }

      // Construir payload solo con líneas válidas
      const datosIniciales = lineasInicializacion
        .map(l => {
          let mp = materiasPrimas.find(m => m.codigoMateriaPrima.toLowerCase() === l.codigo.toLowerCase());
          if (!mp && l.nombre) {
            mp = materiasPrimas.find(m => m.nombreMateriaPrima.toLowerCase() === l.nombre.toLowerCase());
          }
          if (!mp) return null;
          const cantidad = parseFloat(l.cantidadKg);
          const precio = l.precioPorKilo ? parseFloat(l.precioPorKilo) : undefined;
          if (isNaN(cantidad) || cantidad < 0) return null;
          return {
            idMateriaPrima: mp.id,
            cantidadReal: cantidad,
            precioPorKilo: precio,
          };
        })
        .filter(Boolean) as Array<{ idMateriaPrima: string; cantidadReal: number; precioPorKilo?: number }>;

      if (datosIniciales.length === 0) {
        setIsInitializing(false);
        return;
      }

      await apiClient.inicializarInventario(token, idGranja, datosIniciales);
      setShowModalInicializar(false);
      setLineasInicializacion([{ idMateriaPrima: '', codigo: '', nombre: '', cantidadKg: '', precioPorKilo: '' }]);
      await cargarDatos();
    } catch (error: unknown) {
      console.error('Error inicializando inventario:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const actualizarLinea = (index: number, campo: string, valor: string) => {
    setLineasInicializacion(prev => {
      const nuevo = [...prev];
      const linea = { ...nuevo[index] };
      if (campo === 'codigo') {
        linea.codigo = valor;
        const mp = materiasPrimas.find(m => m.codigoMateriaPrima.toLowerCase() === valor.toLowerCase());
        if (mp) {
          linea.idMateriaPrima = mp.id;
          linea.nombre = mp.nombreMateriaPrima;
          if (!linea.precioPorKilo && mp.precioPorKilo > 0) {
            linea.precioPorKilo = mp.precioPorKilo.toString();
          }
        }
        // Sugerencias por código
        const sug = materiasPrimas
          .filter(m => m.codigoMateriaPrima.toLowerCase().includes(valor.toLowerCase()) || valor.length === 0)
          .slice(0, 8);
        setSugerencias(sug);
        setSugIndex(index);
        setSugCampo('codigo');
      } else if (campo === 'nombre') {
        linea.nombre = valor;
        const mp = materiasPrimas.find(m => m.nombreMateriaPrima.toLowerCase() === valor.toLowerCase());
        if (mp) {
          linea.idMateriaPrima = mp.id;
          linea.codigo = mp.codigoMateriaPrima;
          if (!linea.precioPorKilo && mp.precioPorKilo > 0) {
            linea.precioPorKilo = mp.precioPorKilo.toString();
          }
        }
        // Sugerencias por nombre
        const sug = materiasPrimas
          .filter(m => m.nombreMateriaPrima.toLowerCase().includes(valor.toLowerCase()) || valor.length === 0)
          .slice(0, 8);
        setSugerencias(sug);
        setSugIndex(index);
        setSugCampo('nombre');
      } else if (campo === 'cantidadKg') {
        linea.cantidadKg = valor;
      } else if (campo === 'precioPorKilo') {
        linea.precioPorKilo = valor;
      }
      nuevo[index] = linea;
      return nuevo;
    });
  };

  const agregarLinea = () => {
    setLineasInicializacion(prev => ([...prev, { idMateriaPrima: '', codigo: '', nombre: '', cantidadKg: '', precioPorKilo: '' }]));
  };

  const eliminarLinea = (index: number) => {
    setLineasInicializacion(prev => prev.filter((_, i) => i !== index));
  };

  const actualizarCantidadReal = async () => {
    if (!editando || !formData.cantidadReal) return;
    if (isSaving) return; // Prevenir múltiples clicks

    setIsSaving(true);
    try {
      const token = authService.getToken();
      if (!token) {
        setIsSaving(false);
        return;
      }

      const cantidadReal = parseFloat(formData.cantidadReal);
      await apiClient.actualizarCantidadReal(token, idGranja, editando.id, cantidadReal);
      
      setShowModalEditar(false);
      setEditando(null);
      setFormData({ cantidadReal: '' });
      await cargarDatos();
    } catch (error: unknown) {
      console.error('Error actualizando cantidad real:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const recalcularInventario = async () => {
    try {
      const token = authService.getToken();
      if (!token) return;

      await apiClient.recalcularInventario(token, idGranja);
      await cargarDatos();
    } catch (error: unknown) {
      console.error('Error recalculando inventario:', error);
    }
  };

  const vaciarInventario = async () => {
    try {
      const token = authService.getToken();
      if (!token) {
        setMensajeAdvertencia('No autenticado. Por favor, inicia sesión nuevamente.');
        setShowModalAdvertencia(true);
        return;
      }

      await apiClient.vaciarInventario(token, idGranja);
      setShowModalVaciar(false);
      await cargarDatos();
      setMensajeAdvertencia('Inventario vaciado correctamente.');
      setShowModalAdvertencia(true);
    } catch (error: unknown) {
      console.error('Error vaciando inventario:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al vaciar inventario';
      setMensajeAdvertencia(errorMessage);
      setShowModalAdvertencia(true);
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Si ya está ordenado por esta columna, cambiar dirección
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Nueva columna, ordenar ascendente por defecto
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 inline-block ml-1 text-foreground/50" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4 inline-block ml-1 text-foreground/80" />;
    }
    return <ArrowDown className="h-4 w-4 inline-block ml-1 text-foreground/80" />;
  };

  const inventarioFiltrado = useMemo(() => {
    const texto = filtro.toLowerCase();
    if (!texto) return inventario;
    return inventario.filter(
      (item) =>
        item.materiaPrima.codigoMateriaPrima.toLowerCase().includes(texto) ||
        item.materiaPrima.nombreMateriaPrima.toLowerCase().includes(texto)
    );
  }, [inventario, filtro]);

  const inventarioOrdenado = useMemo(() => {
    if (!sortColumn) return inventarioFiltrado;
    const datos = [...inventarioFiltrado];
    datos.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case 'codigo':
          aValue = a.materiaPrima.codigoMateriaPrima.toLowerCase();
          bValue = b.materiaPrima.codigoMateriaPrima.toLowerCase();
          break;
        case 'materiaPrima':
          aValue = a.materiaPrima.nombreMateriaPrima.toLowerCase();
          bValue = b.materiaPrima.nombreMateriaPrima.toLowerCase();
          break;
        case 'precio':
          aValue = a.materiaPrima.precioPorKilo;
          bValue = b.materiaPrima.precioPorKilo;
          break;
        case 'cantidadAcumulada':
          aValue = a.cantidadAcumulada;
          bValue = b.cantidadAcumulada;
          break;
        case 'cantidadSistema':
          aValue = a.cantidadSistema;
          bValue = b.cantidadSistema;
          break;
        case 'cantidadReal':
          aValue = a.cantidadReal;
          bValue = b.cantidadReal;
          break;
        case 'merma':
          aValue = a.merma;
          bValue = b.merma;
          break;
        case 'valorStock':
          aValue = a.valorStock;
          bValue = b.valorStock;
          break;
        case 'precioAlmacen':
          aValue = a.precioAlmacen;
          bValue = b.precioAlmacen;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
    return datos;
  }, [inventarioFiltrado, sortColumn, sortDirection]);

  const totalMateriasPrimas = estadisticas?.totalMateriasPrimas ?? inventario.length;
  const totalKgSistema = estadisticas
    ? (estadisticas.toneladasTotales || 0) * 1000
    : inventario.reduce((sum, item) => sum + item.cantidadSistema, 0);
  const totalKgReal = inventario.reduce((sum, item) => sum + item.cantidadReal, 0);
  const totalValorStock = estadisticas?.costoTotalStock ?? inventario.reduce((sum, item) => sum + item.valorStock, 0);
  const promedioCostoKg =
    estadisticas?.promedioCostoPorKg ?? (totalKgReal > 0 ? totalValorStock / totalKgReal : 0);
  const alertasStock = estadisticas?.alertasStock ?? [];

  const formatNumber = (n: number, fraction: number = 2) =>
    Number(n).toLocaleString('es-AR', { minimumFractionDigits: fraction, maximumFractionDigits: fraction });
  const formatCurrency = (n: number) =>
    Number(n).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <div className="glass-card px-8 py-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
              <Package className="h-7 w-7 text-emerald-300 animate-bounce" />
            </div>
            <div>
              <p className="text-foreground font-semibold">Cargando inventario...</p>
              <p className="text-sm text-foreground/70">Sincronizando existencias y métricas del almacén.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const exportarDatos = async () => {
    try {
      const token = authService.getToken();
      if (!token) {
        alert('No autenticado');
        return;
      }

      const blob = await apiClient.exportarInventario(token, idGranja);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inventario_${idGranja}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exportando inventario:', error);
      alert(error instanceof Error ? error.message : 'Error al exportar inventario');
    }
  };

  const manejarExportacion = async () => {
    setIsExportingCsv(true);
    try {
      const token = authService.getToken();
      if (!token) {
        alert('No autenticado');
        return;
      }

      const blob = await apiClient.exportarInventario(token, idGranja);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inventario_${idGranja}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exportando inventario:', error);
      alert(error instanceof Error ? error.message : 'Error al exportar inventario');
    } finally {
      setIsExportingCsv(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <main className="flex-1 ml-64">
        <header className="glass-card px-8 py-6 m-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Inventario</h1>
                <p className="text-foreground/70">
                  Controla existencias, costos y alertas de tus materias primas en tiempo real.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={manejarExportacion}
              disabled={isExportingCsv}
              className={`px-3 py-2.5 glass-surface text-foreground rounded-lg font-semibold transition-all flex items-center gap-2 ${
                isExportingCsv ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
              }`}
            >
              <Download className="h-4 w-4" />
              {isExportingCsv ? 'Exportando...' : 'Exportar CSV'}
            </button>
            {inventario.length > 0 ? (
              <button
                onClick={() => setShowModalVaciar(true)}
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all flex items-center gap-2 hover:shadow-lg hover:shadow-red-600/30"
              >
                <Trash2 className="h-5 w-5" />
                Vaciar inventario
              </button>
            ) : (
              <button
                onClick={() => setShowModalInicializar(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:brightness-110 transition-all flex items-center gap-2"
              >
                <Rocket className="h-5 w-5" />
                Inicializar inventario
              </button>
            )}
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-8 space-y-10">
          <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-card p-6 rounded-2xl">
              <p className="text-sm text-foreground/60 uppercase tracking-wide">Materias primas</p>
              <p className="text-3xl font-bold text-foreground">{totalMateriasPrimas}</p>
            </div>
            <div className="glass-card p-6 rounded-2xl">
              <p className="text-sm text-foreground/60 uppercase tracking-wide">Stock en sistema</p>
              <p className="text-2xl font-semibold text-foreground">{formatNumber(totalKgSistema, 0)} kg</p>
              <p className="text-xs text-foreground/60">{formatNumber(totalKgSistema / 1000, 2)} toneladas</p>
            </div>
            <div className="glass-card p-6 rounded-2xl">
              <p className="text-sm text-foreground/60 uppercase tracking-wide">Valor del stock</p>
              <p className="text-2xl font-semibold text-foreground">{formatCurrency(totalValorStock)}</p>
            </div>
            <div className="glass-card p-6 rounded-2xl">
              <p className="text-sm text-foreground/60 uppercase tracking-wide">Costo promedio por kg</p>
              <p className="text-2xl font-semibold text-foreground">{formatCurrency(promedioCostoKg)}</p>
              <p className="text-xs text-foreground/60">{alertasStock.length} alerta(s) activas</p>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Mayores existencias</h3>
                <span className="text-xs text-foreground/60">
                  {estadisticas?.materiasMasExistencias?.length || 0} registro(s)
                </span>
              </div>
              <InventarioExistenciasChart data={estadisticas?.materiasMasExistencias || []} />
            </div>
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Mayor valor inmovilizado</h3>
                <span className="text-xs text-foreground/60">
                  {estadisticas?.materiasMasValor?.length || 0} registro(s)
                </span>
              </div>
              <InventarioValorChart data={estadisticas?.materiasMasValor || []} />
            </div>
          </section>

          <section className="glass-card p-6 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-foreground/70 mb-2">Buscar materia prima</label>
              <input
                type="text"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                placeholder="Código o nombre..."
                className="glass-input"
              />
            </div>
            <div className="md:col-span-2 flex items-end">
              <p className="text-sm text-foreground/60">
                {inventarioOrdenado.length} resultado(s) de {inventario.length}
              </p>
            </div>
          </section>

          {alertasStock.length > 0 && (
            <section className="glass-card p-6 rounded-2xl border border-red-500/30">
              <button
                onClick={() => setAlertasMinimizadas(!alertasMinimizadas)}
                className="w-full flex items-center justify-between mb-4 hover:opacity-80 transition-opacity"
              >
                <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Alertas de inventario ({alertasStock.length})
                </h3>
                {alertasMinimizadas ? (
                  <ChevronDown className="h-5 w-5 text-red-400" />
                ) : (
                  <ChevronUp className="h-5 w-5 text-red-400" />
                )}
              </button>
              {!alertasMinimizadas && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {alertasStock.map((alerta, index) => (
                    <div key={index} className="glass-card p-4 border border-red-500/20 bg-red-500/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{alerta.codigo}</p>
                          <p className="text-sm text-foreground/70">{alerta.nombre}</p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            alerta.tipo === 'NEGATIVO'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-yellow-500/20 text-yellow-300'
                          }`}
                        >
                          {alerta.tipo === 'NEGATIVO' ? 'NEGATIVO' : 'CERO'}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/60 mt-2">
                        Cantidad real: {formatNumber(alerta.cantidadReal, 2)} kg
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="glass-card overflow-hidden rounded-2xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th 
                      className="px-3 py-3 text-left font-semibold text-foreground/80 text-sm cursor-pointer hover:bg-white/10 transition-colors select-none"
                      onClick={() => handleSort('codigo')}
                    >
                      Código{getSortIcon('codigo')}
                    </th>
                    <th 
                      className="px-3 py-3 text-left font-semibold text-foreground/80 text-sm cursor-pointer hover:bg-white/10 transition-colors select-none"
                      onClick={() => handleSort('materiaPrima')}
                    >
                      Materia Prima{getSortIcon('materiaPrima')}
                    </th>
                    <th 
                      className="px-3 py-3 text-left font-semibold text-foreground/80 text-sm cursor-pointer hover:bg-white/10 transition-colors select-none"
                      onClick={() => handleSort('precio')}
                    >
                      Precio/kg{getSortIcon('precio')}
                    </th>
                    <th 
                      className="px-3 py-3 text-left font-semibold text-foreground/80 text-sm cursor-pointer hover:bg-white/10 transition-colors select-none"
                      onClick={() => handleSort('cantidadAcumulada')}
                    >
                      Cant. Acum.{getSortIcon('cantidadAcumulada')}
                    </th>
                    <th 
                      className="px-3 py-3 text-left font-semibold text-foreground/80 text-sm cursor-pointer hover:bg-white/10 transition-colors select-none"
                      onClick={() => handleSort('cantidadSistema')}
                    >
                      Cant. Sistema{getSortIcon('cantidadSistema')}
                    </th>
                    <th 
                      className="px-3 py-3 text-left font-semibold text-foreground/80 text-sm cursor-pointer hover:bg-white/10 transition-colors select-none"
                      onClick={() => handleSort('cantidadReal')}
                    >
                      Cant. Real{getSortIcon('cantidadReal')}
                    </th>
                    <th 
                      className="px-3 py-3 text-left font-semibold text-foreground/80 text-sm cursor-pointer hover:bg-white/10 transition-colors select-none"
                      onClick={() => handleSort('merma')}
                    >
                      Merma{getSortIcon('merma')}
                    </th>
                    <th 
                      className="px-3 py-3 text-left font-semibold text-foreground/80 text-sm cursor-pointer hover:bg-white/10 transition-colors select-none"
                      onClick={() => handleSort('valorStock')}
                    >
                      Costo Stock{getSortIcon('valorStock')}
                    </th>
                    <th 
                      className="px-3 py-3 text-left font-semibold text-foreground/80 text-sm cursor-pointer hover:bg-white/10 transition-colors select-none"
                      onClick={() => handleSort('precioAlmacen')}
                    >
                      Costo Alm.{getSortIcon('precioAlmacen')}
                    </th>
                    <th className="px-3 py-3 text-center font-semibold text-foreground/80 text-sm">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {inventarioOrdenado.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-3 py-12 text-center text-foreground/60">
                        {filtro ? 'No se encontraron resultados' : 'No hay inventario registrado'}
                      </td>
                    </tr>
                  ) : (
                    inventarioOrdenado.map((item) => (
                      <tr key={item.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                        <td className="px-3 py-3 text-foreground font-medium text-sm">{item.materiaPrima.codigoMateriaPrima}</td>
                        <td className="px-3 py-3 text-foreground/90 text-sm">{item.materiaPrima.nombreMateriaPrima}</td>
                        <td className="px-3 py-3 text-foreground/90 whitespace-nowrap text-sm">{formatCurrency(item.materiaPrima.precioPorKilo)}</td>
                        <td className="px-3 py-3 text-foreground/90 whitespace-nowrap text-sm">{formatNumber(item.cantidadAcumulada)} kg</td>
                        <td className="px-3 py-3 text-foreground/90 whitespace-nowrap text-sm">{formatNumber(item.cantidadSistema)} kg</td>
                        <td className="px-3 py-3 text-foreground/90 whitespace-nowrap text-sm">{formatNumber(item.cantidadReal)} kg</td>
                        <td className={`px-3 py-3 font-medium whitespace-nowrap text-sm ${
                          item.merma > 0 ? 'text-green-400' : item.merma < 0 ? 'text-red-400' : 'text-foreground/90'
                        }`}>
                          {formatNumber(item.merma)} kg
                        </td>
                        <td className="px-3 py-3 text-foreground/90 whitespace-nowrap text-sm">{formatCurrency(item.valorStock)}</td>
                        <td className="px-3 py-3 text-foreground/90 whitespace-nowrap text-sm">{formatCurrency(item.precioAlmacen)}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditando(item);
                                setFormData({ cantidadReal: item.cantidadReal.toString() });
                                setShowModalEditar(true);
                              }}
                              className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold hover:shadow-md transition-all text-xs"
                            >
                              Editar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      {/* Modal Inicializar Inventario */}
      <Modal
        isOpen={showModalInicializar}
        onClose={() => {
          setShowModalInicializar(false);
          setIsInitializing(false);
        }}
        title="Inicializar Inventario"
        size="full"
        bodyClassName="p-1 md:p-0"
        footer={
          <>
            <button
              onClick={() => {
                setShowModalInicializar(false);
                setIsInitializing(false);
              }}
              disabled={isInitializing}
              className="flex-1 px-6 py-3 rounded-xl font-semibold glass-surface text-foreground hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={inicializarInventario}
              disabled={isInitializing}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isInitializing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Inicializando...
                </>
              ) : (
                'Inicializar'
              )}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <p className="text-foreground/80 md:max-w-3xl">
              Carga las existencias actuales y el costo unitario por materia prima. Estos valores serán el punto de partida del inventario (cantidad acumulada, en sistema y real).
            </p>
            <button
              onClick={agregarLinea}
              disabled={isInitializing}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Agregar línea
            </button>
          </div>

          {/* Vista móvil: tarjetas */}
          <div className="md:hidden space-y-4">
            {lineasInicializacion.map((l, idx) => (
              <div key={idx} className="glass-card p-4">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs text-foreground/70 mb-1">Código MP</label>
                    <div className="relative">
                      <input
                      type="text"
                      value={l.codigo}
                      onChange={(e) => actualizarLinea(idx, 'codigo', e.target.value)}
                      onFocus={() => { setSugIndex(idx); setSugCampo('codigo'); setSugerencias(materiasPrimas.slice(0,8)); }}
                      onBlur={() => setTimeout(() => { setSugIndex(null); setSugCampo(null); }, 150)}
                      placeholder="Ej: MP001"
                      className="glass-input"
                      disabled={isInitializing}
                      />
                      {sugIndex === idx && sugCampo === 'codigo' && sugerencias.length > 0 && (
                        <div className="absolute z-50 mt-1 w-full bg-white/95 backdrop-blur-md border border-white/30 rounded-lg max-h-56 overflow-auto shadow-xl">
                          {sugerencias.map((mp) => (
                            <button
                              key={mp.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                actualizarLinea(idx, 'codigo', mp.codigoMateriaPrima);
                                setSugIndex(null); setSugCampo(null);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-purple-50 hover:bg-opacity-50 text-gray-900 transition-colors"
                            >
                              <span className="font-medium text-gray-900">{mp.codigoMateriaPrima}</span> — <span className="text-gray-600">{mp.nombreMateriaPrima}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-foreground/70 mb-1">Nombre MP</label>
                    <div className="relative">
                      <input
                      type="text"
                      value={l.nombre}
                      onChange={(e) => actualizarLinea(idx, 'nombre', e.target.value)}
                      onFocus={() => { setSugIndex(idx); setSugCampo('nombre'); setSugerencias(materiasPrimas.slice(0,8)); }}
                      onBlur={() => setTimeout(() => { setSugIndex(null); setSugCampo(null); }, 150)}
                      placeholder="Ej: MAIZ"
                      className="glass-input"
                      disabled={isInitializing}
                      />
                      {sugIndex === idx && sugCampo === 'nombre' && sugerencias.length > 0 && (
                        <div className="absolute z-50 mt-1 w-full bg-white/95 backdrop-blur-md border border-white/30 rounded-lg max-h-56 overflow-auto shadow-xl">
                          {sugerencias.map((mp) => (
                            <button
                              key={mp.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                actualizarLinea(idx, 'nombre', mp.nombreMateriaPrima);
                                setSugIndex(null); setSugCampo(null);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-purple-50 hover:bg-opacity-50 text-gray-900 transition-colors"
                            >
                              <span className="font-medium text-gray-900">{mp.nombreMateriaPrima}</span> — <span className="text-gray-600">{mp.codigoMateriaPrima}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-foreground/70 mb-1">Cantidad (kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={l.cantidadKg}
                        onChange={(e) => actualizarLinea(idx, 'cantidadKg', e.target.value)}
                        placeholder="0.00"
                        className="glass-input"
                        disabled={isInitializing}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-foreground/70 mb-1">Costo por kilo ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={l.precioPorKilo}
                        onChange={(e) => actualizarLinea(idx, 'precioPorKilo', e.target.value)}
                        placeholder="0.00"
                        className="glass-input"
                        disabled={isInitializing}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => eliminarLinea(idx)}
                      disabled={isInitializing}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Eliminar línea
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Vista escritorio: tabla */}
          <div className="hidden md:block overflow-x-auto glass-card rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-5 py-4 text-left font-semibold text-foreground/80">Código MP</th>
                  <th className="px-5 py-4 text-left font-semibold text-foreground/80">Nombre MP</th>
                  <th className="px-5 py-4 text-left font-semibold text-foreground/80">Cantidad (kg)</th>
                  <th className="px-5 py-4 text-left font-semibold text-foreground/80">Costo por kilo ($)</th>
                  <th className="px-5 py-4 text-center font-semibold text-foreground/80">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lineasInicializacion.map((l, idx) => (
                  <tr key={idx} className="border-t border-white/10">
                    <td className="px-5 py-3">
                      <div className="relative">
                        <input
                        type="text"
                        value={l.codigo}
                        onChange={(e) => actualizarLinea(idx, 'codigo', e.target.value)}
                        onFocus={() => { setSugIndex(idx); setSugCampo('codigo'); setSugerencias(materiasPrimas.slice(0,8)); }}
                        onBlur={() => setTimeout(() => { setSugIndex(null); setSugCampo(null); }, 150)}
                        placeholder="Ej: MP001"
                        className="glass-input"
                        disabled={isInitializing}
                        />
                        {sugIndex === idx && sugCampo === 'codigo' && sugerencias.length > 0 && (
                          <div className="absolute z-50 mt-1 w-full bg-white/95 backdrop-blur-md border border-white/30 rounded-lg max-h-56 overflow-auto shadow-xl">
                            {sugerencias.map((mp) => (
                              <button
                                key={mp.id}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  actualizarLinea(idx, 'codigo', mp.codigoMateriaPrima);
                                  setSugIndex(null); setSugCampo(null);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-purple-50 hover:bg-opacity-50 text-gray-900 transition-colors"
                              >
                                <span className="font-medium text-gray-900">{mp.codigoMateriaPrima}</span> — <span className="text-gray-600">{mp.nombreMateriaPrima}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="relative">
                        <input
                        type="text"
                        value={l.nombre}
                        onChange={(e) => actualizarLinea(idx, 'nombre', e.target.value)}
                        onFocus={() => { setSugIndex(idx); setSugCampo('nombre'); setSugerencias(materiasPrimas.slice(0,8)); }}
                        onBlur={() => setTimeout(() => { setSugIndex(null); setSugCampo(null); }, 150)}
                        placeholder="Ej: MAIZ"
                        className="glass-input"
                        disabled={isInitializing}
                        />
                        {sugIndex === idx && sugCampo === 'nombre' && sugerencias.length > 0 && (
                          <div className="absolute z-50 mt-1 w-full bg-white/95 backdrop-blur-md border border-white/30 rounded-lg max-h-56 overflow-auto shadow-xl">
                            {sugerencias.map((mp) => (
                              <button
                                key={mp.id}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  actualizarLinea(idx, 'nombre', mp.nombreMateriaPrima);
                                  setSugIndex(null); setSugCampo(null);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-purple-50 hover:bg-opacity-50 text-gray-900 transition-colors"
                              >
                                <span className="font-medium text-gray-900">{mp.nombreMateriaPrima}</span> — <span className="text-gray-600">{mp.codigoMateriaPrima}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={l.cantidadKg}
                        onChange={(e) => actualizarLinea(idx, 'cantidadKg', e.target.value)}
                        placeholder="0.00"
                        className="glass-input"
                        disabled={isInitializing}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={l.precioPorKilo}
                        onChange={(e) => actualizarLinea(idx, 'precioPorKilo', e.target.value)}
                        placeholder="0.00"
                        className="glass-input"
                        disabled={isInitializing}
                      />
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => eliminarLinea(idx)}
                        disabled={isInitializing}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-xs md:text-sm text-foreground/70">
              Sugerencia: escribe el código o el nombre; se autocompleta si existe en la base.
            </div>
            <div className="text-right text-sm text-foreground/80 hidden md:block">
              Total líneas: <span className="font-semibold">{lineasInicializacion.length}</span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Editar Cantidad Real */}
      <Modal
        isOpen={showModalEditar}
        onClose={() => {
          setShowModalEditar(false);
          setIsSaving(false);
        }}
        title="Editar Cantidad Real"
        footer={
          <>
            <button
              onClick={() => {
                setShowModalEditar(false);
                setIsSaving(false);
              }}
              disabled={isSaving}
              className="flex-1 px-6 py-3 rounded-xl font-semibold glass-surface text-foreground hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={actualizarCantidadReal}
              disabled={isSaving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground/80 mb-2">
              Materia Prima
            </label>
            <input
              type="text"
              value={editando?.materiaPrima.nombreMateriaPrima || ''}
              disabled
              className="glass-input bg-white/[0.02] cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground/80 mb-2">
              Cantidad Real (kg) *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.cantidadReal}
              onChange={(e) => setFormData({ ...formData, cantidadReal: e.target.value })}
              placeholder="0.00"
              className="glass-input"
              disabled={isSaving}
            />
          </div>

          {editando && (
            <div className="glass-surface rounded-xl p-4">
              <p className="text-sm text-foreground/80">
                <strong>Cantidad en Sistema:</strong> {editando.cantidadSistema.toFixed(2)} kg
              </p>
              <p className="text-sm text-foreground/80">
                <strong>Merma actual:</strong> {editando.merma.toFixed(2)} kg
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Vaciar Inventario */}
      <Modal
        isOpen={showModalVaciar}
        onClose={() => setShowModalVaciar(false)}
        title="Vaciar Inventario"
        footer={
          <>
            <button
              onClick={() => setShowModalVaciar(false)}
              className="flex-1 px-6 py-3 rounded-xl font-semibold glass-surface text-foreground hover:bg-white/10 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={vaciarInventario}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all hover:shadow-lg hover:shadow-red-600/30"
            >
              Vaciar
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-foreground/80">
            ¿Está seguro de que desea vaciar todo el inventario de esta granja?
          </p>
          <div className="p-3 glass-surface border-red-500/30 rounded-xl text-sm text-red-400">
            Esta acción elimina todos los registros del inventario. No se puede deshacer.
          </div>
        </div>
      </Modal>

      {/* Modal de Advertencia */}
      <Modal
        isOpen={showModalAdvertencia}
        onClose={() => {
          setShowModalAdvertencia(false);
          setMensajeAdvertencia('');
        }}
        title="⚠️ Advertencia"
        footer={
          <button
            onClick={() => {
              setShowModalAdvertencia(false);
              setMensajeAdvertencia('');
            }}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:shadow-lg hover:brightness-110 transition-all"
          >
            Entendido
          </button>
        }
      >
        <div className="space-y-3">
          <p className="text-foreground/80">
            {mensajeAdvertencia}
          </p>
        </div>
      </Modal>
    </div>
  );
}

