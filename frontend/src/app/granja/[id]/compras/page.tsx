'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { authService } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import ComprasFrecuenciaChart from '@/components/charts/ComprasFrecuenciaChart';
import ModalNuevaCompra from '@/components/compras/ModalNuevaCompra';
import { Modal } from '@/components/ui';

interface CompraCabecera {
  id: string;
  numeroFactura: string | null;
  fechaCompra: string;
  totalFactura: number;
  observaciones?: string | null;
  proveedor?: { codigoProveedor?: string; nombreProveedor: string };
  comprasDetalle?: Array<{ id: string }>; // Para verificar si tiene items
}

export default function ComprasPage() {
  const router = useRouter();
  const params = useParams();
  const idGranja = params.id as string;

  const [user, setUser] = useState<{ id: string; email: string; tipoUsuario: string } | null>(null);
  const [compras, setCompras] = useState<CompraCabecera[]>([]);
  const [estadisticas, setEstadisticas] = useState<{ frecuenciaPorMateria: Array<{ codigo: string; nombre: string; vecesComprada: number }>; totalCompras: number } | null>(null);
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
      const [comprasData, stats] = await Promise.all([
        apiClient.getCompras(token, idGranja, { desde, hasta, materiaPrima: mpFiltro, proveedor: provFiltro, numeroFactura: factFiltro, ordenar: orden }),
        apiClient.getEstadisticasCompras(token, idGranja),
      ]);
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

    try {
      const token = authService.getToken();
      if (!token) {
        alert('No autenticado');
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
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FAFAE4]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#B6CCAE] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#FAFAE4]">
      <Sidebar />
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Compras</h2>
              <p className="text-gray-600 mt-1">Carga de facturas y reabastecimiento de inventario</p>
            </div>
            <div className="flex gap-3">
              <button className="px-6 py-3 bg-gradient-to-r from-[#FAD863] to-[#F8C540] text-gray-900 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2">
                <span>📥</span>
                Exportar Datos
              </button>
              <button className="px-6 py-3 bg-gradient-to-r from-[#B6CAEB] to-[#9DB5D9] text-gray-900 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2">
                <span>📤</span>
                Importar Datos
              </button>
              <button onClick={() => setShowNueva(true)} className="px-6 py-3 bg-gradient-to-r from-[#B6CCAE] to-[#9AAB64] text-gray-900 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2">
                <span>+</span>
                Nueva Compra
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-8 space-y-8">
          {/* KPI y Gráfico */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#B6CCAE] to-[#9AAB64] rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🧾</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total de Compras</p>
                  <p className="text-2xl font-bold text-gray-900">{estadisticas?.totalCompras || compras.length}</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Frecuencia de Compras por Materia Prima</h3>
                <span className="text-xs text-gray-500 font-medium">Top {estadisticas?.frecuenciaPorMateria?.length || 0}</span>
              </div>
              <ComprasFrecuenciaChart data={estadisticas?.frecuenciaPorMateria || []} />
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Desde</label>
              <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B6CCAE] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Hasta</label>
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B6CCAE] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">N° Factura</label>
              <input type="text" value={factFiltro} onChange={(e) => setFactFiltro(e.target.value)} placeholder="Ej: A-0001-000123" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B6CCAE] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Materia Prima</label>
              <input type="text" value={mpFiltro} onChange={(e) => setMpFiltro(e.target.value)} placeholder="Código o nombre" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B6CCAE] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Proveedor</label>
              <input type="text" value={provFiltro} onChange={(e) => setProvFiltro(e.target.value)} placeholder="Código o nombre" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B6CCAE] focus:outline-none" />
            </div>

            <div className="md:col-span-4 flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Ordenar por</label>
                <select value={orden} onChange={(e) => setOrden(e.target.value as any)} className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B6CCAE] focus:outline-none">
                  <option value="fecha_desc">Más nueva → más antigua</option>
                  <option value="fecha_asc">Más antigua → más nueva</option>
                  <option value="total_desc">Más cara → más barata</option>
                  <option value="total_asc">Más barata → más cara</option>
                </select>
              </div>
              <button onClick={cargarDatos} className="px-5 py-3 bg-gradient-to-r from-[#B6CAEB] to-[#9DB5D9] text-gray-900 rounded-xl font-semibold hover:shadow-md">Aplicar filtros</button>
              <button onClick={() => { setDesde(''); setHasta(''); setFactFiltro(''); setMpFiltro(''); setProvFiltro(''); setOrden('fecha_desc'); cargarDatos(); }} className="px-5 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50">Limpiar</button>
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#B6CAEB] to-[#9DB5D9] text-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">N° Factura</th>
                    <th className="px-6 py-4 text-left font-semibold">Fecha</th>
                    <th className="px-6 py-4 text-left font-semibold">Total</th>
                    <th className="px-6 py-4 text-left font-semibold">Cod. Proveedor</th>
                    <th className="px-6 py-4 text-left font-semibold">Proveedor</th>
                    <th className="px-6 py-4 text-left font-semibold">Observación</th>
                    <th className="px-6 py-4 text-center font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {comprasOrdenadas.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No hay compras registradas</td>
                    </tr>
                  ) : (
                    comprasOrdenadas.map((c) => (
                      <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-gray-900 font-medium">{c.numeroFactura || '-'}</td>
                        <td className="px-6 py-4 text-gray-900 whitespace-nowrap">{formatDate(c.fechaCompra)}</td>
                        <td className="px-6 py-4 text-gray-900 whitespace-nowrap">{formatCurrency(c.totalFactura || 0)}</td>
                        <td className="px-6 py-4 text-gray-900">{c.proveedor?.codigoProveedor || '-'}</td>
                        <td className="px-6 py-4 text-gray-900">{c.proveedor?.nombreProveedor || '-'}</td>
                        <td className="px-6 py-4 text-gray-900">{c.observaciones || '-'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => router.push(`/granja/${idGranja}/compras/${c.id}`)}
                              className="px-4 py-2 bg-gradient-to-r from-[#B6CCAE] to-[#9AAB64] text-gray-900 rounded-lg font-semibold hover:shadow-md text-sm"
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
            </div>
          </div>
        </div>
      </main>

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
        }}
        title="Eliminar Compra"
        footer={
          <>
            <button
              onClick={() => {
                setShowModalEliminar(false);
                setCompraAEliminar(null);
              }}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleEliminarCompra}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700"
            >
              Eliminar
            </button>
          </>
        }
      >
        {compraAEliminar && (
          <div>
            <p className="text-gray-700 mb-4">
              ¿Está seguro de eliminar esta compra?
            </p>
            <div className="bg-gray-50 rounded-xl p-4">
              <p><strong>N° Factura:</strong> {compraAEliminar.numeroFactura || 'Sin número'}</p>
              <p><strong>Fecha:</strong> {formatDate(compraAEliminar.fechaCompra)}</p>
              <p><strong>Total:</strong> {formatCurrency(compraAEliminar.totalFactura || 0)}</p>
              <p><strong>Proveedor:</strong> {compraAEliminar.proveedor?.nombreProveedor || '-'}</p>
              {(compraAEliminar.comprasDetalle && compraAEliminar.comprasDetalle.length > 0) && (
                <p className="text-red-600 mt-2">
                  ⚠️ Esta compra tiene {compraAEliminar.comprasDetalle.length} items. Debe eliminarlos primero.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}


