'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { authService } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import ComprasFrecuenciaChart from '@/components/charts/ComprasFrecuenciaChart';
import ModalNuevaCompra from '@/components/compras/ModalNuevaCompra';
import { Modal } from '@/components/ui';
import { Download, Upload, Plus, ShoppingCart, Receipt, AlertCircle, Trash2, Archive, RotateCcw } from 'lucide-react';

interface CompraDetalle {
  id: string;
  cantidadComprada: number;
  precioUnitario: number;
  subtotal: number;
  materiaPrima: {
    codigoMateriaPrima: string;
    nombreMateriaPrima: string;
  };
}

interface CompraCabecera {
  id: string;
  numeroFactura: string | null;
  fechaCompra: string;
  totalFactura: number;
  observaciones?: string | null;
  proveedor?: { codigoProveedor?: string; nombreProveedor: string };
  comprasDetalle?: CompraDetalle[];
}

interface CompraEliminada extends Omit<CompraCabecera, 'comprasDetalle'> {
  usuario?: {
    nombreUsuario: string;
    apellidoUsuario: string;
  };
  fechaEliminacion: string | null;
}

export default function ComprasPage() {
  const router = useRouter();
  const params = useParams();
  const idGranja = params.id as string;

  const [user, setUser] = useState<{ id: string; email: string; tipoUsuario: string } | null>(null);
  const [compras, setCompras] = useState<CompraCabecera[]>([]);
  const [estadisticas, setEstadisticas] = useState<{ frecuenciaPorMateria: Array<{ codigo: string; nombre: string; vecesComprada: number; cantidadTotal: number }>; totalCompras: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [mpFiltro, setMpFiltro] = useState('');
  const [provFiltro, setProvFiltro] = useState('');
  const [factFiltro, setFactFiltro] = useState('');
  const [orden, setOrden] = useState<'fecha_desc' | 'fecha_asc' | 'total_desc' | 'total_asc'>('fecha_desc');
  const [showNueva, setShowNueva] = useState(false);
  const [showModalEliminar, setShowModalEliminar] = useState(false);
  const [compraAEliminar, setCompraAEliminar] = useState<CompraCabecera | null>(null);
  const [isDeletingCompra, setIsDeletingCompra] = useState(false);
  const [showModalEliminarTodas, setShowModalEliminarTodas] = useState(false);
  const [confirmacionTexto, setConfirmacionTexto] = useState('');
  const [showEliminadas, setShowEliminadas] = useState(false);
  const [comprasEliminadas, setComprasEliminadas] = useState<CompraEliminada[]>([]);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    setUser(authService.getUser());
    cargarDatos();
  }, [router, idGranja]);

  const formatCurrency = (n: number) => Number(n).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const cargarDatos = async () => {
    try {
      const token = authService.getToken();
      if (!token) return;
      
      // Debug: verificar qué filtros se están enviando
      console.log('[DEBUG Frontend] Filtros aplicados:', {
        desde,
        hasta,
        materiaPrima: mpFiltro,
        proveedor: provFiltro,
        numeroFactura: factFiltro,
        ordenar: orden
      });
      
      const [comprasData, stats] = await Promise.all([
        apiClient.getCompras(token, idGranja, { desde, hasta, materiaPrima: mpFiltro, proveedor: provFiltro, numeroFactura: factFiltro, ordenar: orden }),
        apiClient.getEstadisticasCompras(token, idGranja),
      ]);
      // Debug: verificar estructura de datos
      console.log('Compras recibidas:', comprasData);
      if (comprasData.length > 0) {
        console.log('Primera compra:', comprasData[0]);
        if (comprasData[0].comprasDetalle && comprasData[0].comprasDetalle.length > 0) {
          console.log('Detalles de primera compra:', comprasData[0].comprasDetalle);
          console.log('Cantidad del primer detalle:', comprasData[0].comprasDetalle[0].cantidadComprada);
        }
      }
      setCompras(comprasData);
      setEstadisticas({
        frecuenciaPorMateria: stats.frecuenciaPorMateria || [],
        totalCompras: stats.totalCompras || comprasData.length,
      });
    } catch (e) {
      // Silenciar errores cuando no hay datos o el backend aún no implementa endpoints.
      setCompras([]);
      setEstadisticas({ frecuenciaPorMateria: [], totalCompras: 0 });
    } finally {
      setLoading(false);
    }
  };

  const comprasOrdenadas = useMemo(() => {
    return [...compras].sort((a, b) => {
      if (orden === 'fecha_desc') return new Date(b.fechaCompra).getTime() - new Date(a.fechaCompra).getTime();
      if (orden === 'fecha_asc') return new Date(a.fechaCompra).getTime() - new Date(b.fechaCompra).getTime();
      if (orden === 'total_desc') return (b.totalFactura || 0) - (a.totalFactura || 0);
      return (a.totalFactura || 0) - (b.totalFactura || 0);
    });
  }, [compras, orden]);

  const handleEliminarCompra = async () => {
    if (!compraAEliminar) return;
    if (isDeletingCompra) return; // Prevenir múltiples clicks

    setIsDeletingCompra(true);
    try {
      const token = authService.getToken();
      if (!token) {
        alert('No autenticado');
        setIsDeletingCompra(false);
        return;
      }

      await apiClient.eliminarCompra(token, idGranja, compraAEliminar.id);
      
      setShowModalEliminar(false);
      setCompraAEliminar(null);
      
      // Recargar datos
      await cargarDatos();
    } catch (error: unknown) {
      console.error('Error eliminando compra:', error);
      alert(error instanceof Error ? error.message : 'Error al eliminar compra');
    } finally {
      setIsDeletingCompra(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-purple-500 animate-pulse" />
          <p className="text-foreground/80">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="glass-card px-8 py-6 m-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Compras</h2>
              <p className="text-foreground/70 mt-1">Carga de facturas y reabastecimiento de inventario</p>
            </div>
            <div className="flex gap-3">
              <button className="px-6 py-3 glass-surface text-foreground rounded-xl font-semibold hover:bg-white/10 transition-all flex items-center gap-2">
                <Download className="h-5 w-5" />
                Exportar Datos
              </button>
              <button className="px-6 py-3 glass-surface text-foreground rounded-xl font-semibold hover:bg-white/10 transition-all flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Importar Datos
              </button>
              <button
                onClick={async () => {
                  if (!showEliminadas) {
                    try {
                      const token = authService.getToken();
                      if (!token) {
                        alert('No autenticado');
                        return;
                      }
                      const eliminadas = await apiClient.obtenerComprasEliminadas(token, idGranja);
                      setComprasEliminadas(eliminadas);
                      setShowEliminadas(true);
                    } catch (error: unknown) {
                      console.error('Error obteniendo compras eliminadas:', error);
                      alert(error instanceof Error ? error.message : 'Error al obtener compras eliminadas');
                    }
                  } else {
                    setShowEliminadas(false);
                  }
                }}
                className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  showEliminadas
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'glass-surface text-foreground hover:bg-white/10'
                }`}
              >
                <Archive className="h-5 w-5" />
                {showEliminadas ? 'Ver Activas' : 'Ver Eliminadas'}
              </button>
              <button
                onClick={() => setShowModalEliminarTodas(true)}
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all flex items-center gap-2"
              >
                <Trash2 className="h-5 w-5" />
                Eliminar Todas
              </button>
              <button onClick={() => setShowNueva(true)} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:brightness-110 transition-all flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Nueva Compra
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-8 space-y-8">
          {/* KPI y Gráfico */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Receipt className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-foreground/70">Total de Compras</p>
                  <p className="text-2xl font-bold text-foreground">{estadisticas?.totalCompras || compras.length}</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">Cantidad Total Comprada por Materia Prima</h3>
                <span className="text-xs text-foreground/60 font-medium">Top {estadisticas?.frecuenciaPorMateria?.length || 0}</span>
              </div>
              <ComprasFrecuenciaChart data={estadisticas?.frecuenciaPorMateria || []} />
            </div>
          </div>

          {/* Filtros */}
          <div className="glass-card p-6 grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm text-foreground/70 mb-2">Desde</label>
              <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="glass-input" />
            </div>
            <div>
              <label className="block text-sm text-foreground/70 mb-2">Hasta</label>
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="glass-input" />
            </div>
            <div>
              <label className="block text-sm text-foreground/70 mb-2">N° Factura</label>
              <input type="text" value={factFiltro} onChange={(e) => setFactFiltro(e.target.value)} placeholder="Ej: A-0001-000123" className="glass-input" />
            </div>
            <div>
              <label className="block text-sm text-foreground/70 mb-2">Materia Prima</label>
              <input type="text" value={mpFiltro} onChange={(e) => setMpFiltro(e.target.value)} placeholder="Código o nombre" className="glass-input" />
            </div>
            <div>
              <label className="block text-sm text-foreground/70 mb-2">Proveedor</label>
              <input type="text" value={provFiltro} onChange={(e) => setProvFiltro(e.target.value)} placeholder="Código o nombre" className="glass-input" />
            </div>

            <div className="md:col-span-4 flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-sm text-foreground/70 mb-2">Ordenar por</label>
                <select value={orden} onChange={(e) => setOrden(e.target.value as 'fecha_desc' | 'fecha_asc' | 'total_desc' | 'total_asc')} className="glass-input">
                  <option value="fecha_desc">Más nueva → más antigua</option>
                  <option value="fecha_asc">Más antigua → más nueva</option>
                  <option value="total_desc">Más cara → más barata</option>
                  <option value="total_asc">Más barata → más cara</option>
                </select>
              </div>
              <button onClick={cargarDatos} className="px-5 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-md">Aplicar filtros</button>
              <button onClick={() => { setDesde(''); setHasta(''); setFactFiltro(''); setMpFiltro(''); setProvFiltro(''); setOrden('fecha_desc'); cargarDatos(); }} className="px-5 py-3 glass-surface text-foreground rounded-xl font-semibold hover:bg-white/10">Limpiar</button>
            </div>
          </div>

          {/* Tabla */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              {showEliminadas ? (
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-4 px-6 pt-6">Compras Eliminadas</h3>
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-6 py-4 text-left font-semibold text-foreground/80">N° Factura</th>
                        <th className="px-6 py-4 text-left font-semibold text-foreground/80">Fecha</th>
                        <th className="px-6 py-4 text-left font-semibold text-foreground/80">Total</th>
                        <th className="px-6 py-4 text-left font-semibold text-foreground/80">Proveedor</th>
                        <th className="px-6 py-4 text-left font-semibold text-foreground/80">Eliminada por</th>
                        <th className="px-6 py-4 text-left font-semibold text-foreground/80">Fecha Eliminación</th>
                        <th className="px-6 py-4 text-center font-semibold text-foreground/80">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comprasEliminadas.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-foreground/60">
                            No hay compras eliminadas
                          </td>
                        </tr>
                      ) : (
                        comprasEliminadas.map((compra) => (
                          <tr key={compra.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 text-foreground font-medium">{compra.numeroFactura || '-'}</td>
                            <td className="px-6 py-4 text-foreground/90 whitespace-nowrap">{formatDate(compra.fechaCompra)}</td>
                            <td className="px-6 py-4 text-foreground/90 whitespace-nowrap">{formatCurrency(compra.totalFactura || 0)}</td>
                            <td className="px-6 py-4 text-foreground/90">{compra.proveedor?.nombreProveedor || '-'}</td>
                            <td className="px-6 py-4 text-foreground/90">
                              {compra.usuario ? `${compra.usuario.nombreUsuario} ${compra.usuario.apellidoUsuario}` : '-'}
                            </td>
                            <td className="px-6 py-4 text-foreground/90 whitespace-nowrap">
                              {compra.fechaEliminacion ? formatDate(compra.fechaEliminacion) : '-'}
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={async () => {
                                  try {
                                    const token = authService.getToken();
                                    if (!token) {
                                      alert('No autenticado');
                                      return;
                                    }
                                    await apiClient.restaurarCompra(token, idGranja, compra.id);
                                    await cargarDatos();
                                    const eliminadas = await apiClient.obtenerComprasEliminadas(token, idGranja);
                                    setComprasEliminadas(eliminadas);
                                    alert('Compra restaurada exitosamente');
                                  } catch (error: unknown) {
                                    console.error('Error restaurando compra:', error);
                                    alert(error instanceof Error ? error.message : 'Error al restaurar compra');
                                  }
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-semibold hover:shadow-md text-sm flex items-center gap-2"
                              >
                                <RotateCcw className="h-4 w-4" />
                                Restaurar
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold text-foreground/80">N° Factura</th>
                      <th className="px-6 py-4 text-left font-semibold text-foreground/80">Fecha</th>
                      <th className="px-6 py-4 text-left font-semibold text-foreground/80">Total</th>
                      <th className="px-6 py-4 text-left font-semibold text-foreground/80">Cod. Proveedor</th>
                      <th className="px-6 py-4 text-left font-semibold text-foreground/80">Proveedor</th>
                      <th className="px-6 py-4 text-left font-semibold text-foreground/80">Materias Primas</th>
                      <th className="px-6 py-4 text-left font-semibold text-foreground/80">Cantidades</th>
                      <th className="px-6 py-4 text-left font-semibold text-foreground/80">Observación</th>
                      <th className="px-6 py-4 text-center font-semibold text-foreground/80">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comprasOrdenadas.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center text-foreground/60">No hay compras registradas</td>
                      </tr>
                    ) : (
                      comprasOrdenadas.map((c) => (
                        <tr key={c.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 text-foreground font-medium">{c.numeroFactura || '-'}</td>
                          <td className="px-6 py-4 text-foreground/90 whitespace-nowrap">{formatDate(c.fechaCompra)}</td>
                          <td className="px-6 py-4 text-foreground/90 whitespace-nowrap">{formatCurrency(c.totalFactura || 0)}</td>
                          <td className="px-6 py-4 text-foreground/90">{c.proveedor?.codigoProveedor || '-'}</td>
                          <td className="px-6 py-4 text-foreground/90">{c.proveedor?.nombreProveedor || '-'}</td>
                          <td className="px-6 py-4 text-foreground/90">
                            {c.comprasDetalle && c.comprasDetalle.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {c.comprasDetalle.map((detalle) => (
                                  <div key={detalle.id} className="text-sm">
                                    <span className="font-medium">{detalle.materiaPrima.codigoMateriaPrima}</span>
                                    <span className="text-foreground/70"> - {detalle.materiaPrima.nombreMateriaPrima}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-foreground/50">Sin items</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-foreground/90">
                            {c.comprasDetalle && c.comprasDetalle.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {c.comprasDetalle.map((detalle) => {
                                  const cantidad = detalle.cantidadComprada != null ? Number(detalle.cantidadComprada) : 0;
                                  return (
                                    <div key={detalle.id} className="text-sm">
                                      <span className="font-medium">
                                        {cantidad > 0 
                                          ? `${cantidad.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} kg`
                                          : '0 kg'}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-foreground/50">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-foreground/90">{c.observaciones || '-'}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => router.push(`/granja/${idGranja}/compras/${c.id}`)}
                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold hover:shadow-md text-sm"
                              >
                                Detalle
                              </button>
                              {(!c.comprasDetalle || c.comprasDetalle.length === 0) && (
                                <button
                                  onClick={() => {
                                    setCompraAEliminar(c);
                                    setShowModalEliminar(true);
                                  }}
                                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 text-sm"
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal Eliminar Todas las Compras */}
      {showModalEliminarTodas && (
        <Modal
          isOpen={showModalEliminarTodas}
          onClose={() => {
            setShowModalEliminarTodas(false);
            setConfirmacionTexto('');
            setIsDeletingAll(false);
          }}
          title="⚠️ Eliminar Todas las Compras"
          size="lg"
        >
          <div className="p-6">
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-semibold mb-2">⚠️ ADVERTENCIA CRÍTICA</p>
              <ul className="text-red-700 text-sm space-y-1 list-disc list-inside">
                <li>Esta operación eliminará TODAS las compras registradas en la granja</li>
                <li>Impactará directamente en el inventario y los precios de las materias primas</li>
                <li>Esta acción NO es reversible</li>
                <li>No se pueden eliminar compras si existen fabricaciones registradas</li>
              </ul>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Para confirmar, escriba exactamente:
              </label>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded mb-2 text-gray-900">
                SI DESEO ELIMINAR TODAS LAS COMPRAS REGISTRADAS
              </p>
              <input
                type="text"
                value={confirmacionTexto}
                onChange={(e) => setConfirmacionTexto(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Escriba el texto de confirmación..."
                disabled={isDeletingAll}
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowModalEliminarTodas(false);
                  setConfirmacionTexto('');
                  setIsDeletingAll(false);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isDeletingAll}
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (confirmacionTexto !== 'SI DESEO ELIMINAR TODAS LAS COMPRAS REGISTRADAS') {
                    alert('El texto de confirmación no coincide. Por favor, escriba exactamente: "SI DESEO ELIMINAR TODAS LAS COMPRAS REGISTRADAS"');
                    return;
                  }
                  if (isDeletingAll) return; // Prevenir múltiples clicks

                  setIsDeletingAll(true);
                  try {
                    const token = authService.getToken();
                    if (!token) {
                      alert('No autenticado');
                      setIsDeletingAll(false);
                      return;
                    }

                    await apiClient.eliminarTodasLasCompras(token, idGranja, confirmacionTexto);
                    
                    setShowModalEliminarTodas(false);
                    setConfirmacionTexto('');
                    
                    await cargarDatos();
                    alert('Todas las compras han sido eliminadas exitosamente');
                  } catch (error: unknown) {
                    console.error('Error eliminando todas las compras:', error);
                    alert(error instanceof Error ? error.message : 'Error al eliminar todas las compras');
                  } finally {
                    setIsDeletingAll(false);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={confirmacionTexto !== 'SI DESEO ELIMINAR TODAS LAS COMPRAS REGISTRADAS' || isDeletingAll}
              >
                {isDeletingAll ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Eliminando...
                  </>
                ) : (
                  'Eliminar Todas las Compras'
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Nueva Compra */}
      <ModalNuevaCompra
        isOpen={showNueva}
        onClose={() => setShowNueva(false)}
        onSuccess={(idCompra) => {
          setShowNueva(false);
          router.push(`/granja/${idGranja}/compras/${idCompra}`);
        }}
        idGranja={idGranja}
      />

      {/* Modal Eliminar Compra */}
      <Modal
        isOpen={showModalEliminar}
        onClose={() => {
          setShowModalEliminar(false);
          setCompraAEliminar(null);
          setIsDeletingCompra(false);
        }}
        title="Eliminar Compra"
        footer={
          <>
            <button
              onClick={() => {
                setShowModalEliminar(false);
                setCompraAEliminar(null);
                setIsDeletingCompra(false);
              }}
              disabled={isDeletingCompra}
              className="flex-1 px-6 py-3 rounded-xl font-semibold glass-surface text-foreground hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleEliminarCompra}
              disabled={isDeletingCompra}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all hover:shadow-lg hover:shadow-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDeletingCompra ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </button>
          </>
        }
      >
        {compraAEliminar && (
          <div>
            <p className="text-foreground/80 mb-4">
              ¿Está seguro de eliminar esta compra?
            </p>
            <div className="glass-surface rounded-xl p-4">
              <p className="text-foreground/90"><strong>N° Factura:</strong> {compraAEliminar.numeroFactura || 'Sin número'}</p>
              <p className="text-foreground/90"><strong>Fecha:</strong> {formatDate(compraAEliminar.fechaCompra)}</p>
              <p className="text-foreground/90"><strong>Total:</strong> {formatCurrency(compraAEliminar.totalFactura || 0)}</p>
              <p className="text-foreground/90"><strong>Proveedor:</strong> {compraAEliminar.proveedor?.nombreProveedor || '-'}</p>
              {(compraAEliminar.comprasDetalle && compraAEliminar.comprasDetalle.length > 0) && (
                <p className="text-red-400 mt-2 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Esta compra tiene {compraAEliminar.comprasDetalle.length} items. Debe eliminarlos primero.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}


