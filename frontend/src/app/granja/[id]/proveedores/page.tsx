'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authService } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import { KPICard } from '@/components/ui';
import { Modal } from '@/components/ui';

interface Proveedor {
  id: string;
  codigo: string;
  nombre: string;
  direccion?: string;
  localidad?: string;
}

export default function ProveedoresPage() {
  const router = useRouter();
  const params = useParams();
  const idGranja = params.id as string;

  const [user, setUser] = useState<{ id: string; email: string; tipoUsuario: string } | null>(null);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [estadisticas, setEstadisticas] = useState<{ comprasPorProveedor: Array<{ nombreProveedor: string }>; gastosPorProveedor: Array<{ totalGastado: number }> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showModalEliminar, setShowModalEliminar] = useState(false);
  const [editando, setEditando] = useState<Proveedor | null>(null);
  const [eliminando, setEliminando] = useState<Proveedor | null>(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    direccion: '',
    localidad: '',
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const currentUser = authService.getUser();
    setUser(currentUser);
    cargarDatos();
  }, [router]);

  const cargarDatos = async () => {
    try {
      const token = authService.getToken();
      if (token) {
        // Cargar proveedores
        const data = await apiClient.getProveedores(token, idGranja);
        const proveedoresAdaptados = data.map((p: { id: string; codigoProveedor: string; nombreProveedor: string; direccion: string | null; localidad: string | null }) => ({
          id: p.id,
          codigo: p.codigoProveedor,
          nombre: p.nombreProveedor,
          direccion: p.direccion,
          localidad: p.localidad,
        }));
        setProveedores(proveedoresAdaptados);

        // Cargar estadísticas
        const stats = await apiClient.getEstadisticasProveedores(token, idGranja);
        setEstadisticas(stats);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (proveedor?: Proveedor) => {
    if (proveedor) {
      setEditando(proveedor);
      setFormData({
        codigo: proveedor.codigo,
        nombre: proveedor.nombre,
        direccion: proveedor.direccion || '',
        localidad: proveedor.localidad || '',
      });
    } else {
      setEditando(null);
      setFormData({ codigo: '', nombre: '', direccion: '', localidad: '' });
    }
    setShowModal(true);
  };

  const guardar = async () => {
    if (!formData.codigo.trim() || !formData.nombre.trim()) {
      alert('Por favor complete código y nombre');
      return;
    }

    try {
      const token = authService.getToken();
      if (!token) {
        alert('No autenticado');
        return;
      }

      if (editando) {
        await apiClient.updateProveedor(token, idGranja, editando.id, {
          codigoProveedor: formData.codigo,
          nombreProveedor: formData.nombre,
          direccionProveedor: formData.direccion || '',
          localidadProveedor: formData.localidad || '',
        });
      } else {
        await apiClient.createProveedor(token, idGranja, {
          codigoProveedor: formData.codigo,
          nombreProveedor: formData.nombre,
          direccionProveedor: formData.direccion || '',
          localidadProveedor: formData.localidad || '',
        });
      }

      await cargarDatos();
      setShowModal(false);
      setFormData({ codigo: '', nombre: '', direccion: '', localidad: '' });
      setEditando(null);
    } catch (error: unknown) {
      console.error('Error guardando:', error);
      alert(error instanceof Error ? error.message : 'Error al guardar el proveedor');
    }
  };

  const eliminar = async () => {
    if (!eliminando) return;

    try {
      const token = authService.getToken();
      if (!token) {
        alert('No autenticado');
        return;
      }

      await apiClient.deleteProveedor(token, idGranja, eliminando.id);
      await cargarDatos();
      setShowModalEliminar(false);
      setEliminando(null);
    } catch (error: unknown) {
      console.error('Error eliminando:', error);
      alert(error instanceof Error ? error.message : 'Error al eliminar el proveedor');
    }
  };

  const exportarDatos = () => {
    alert('Función de exportar próximamente');
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

  const formatCurrency = (n: number) => Number(n).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });

  return (
    <div className="flex min-h-screen bg-[#FAFAE4]">
      <Sidebar />

      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Proveedores</h2>
              <p className="text-gray-600 mt-1">Gestión de proveedores de tu planta</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportarDatos}
                className="px-6 py-3 bg-gradient-to-r from-[#FAD863] to-[#F8C540] text-gray-900 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
              >
                <span>📥</span>
                Exportar Datos
              </button>
              <button
                onClick={() => alert('Función de importar próximamente')}
                className="px-6 py-3 bg-gradient-to-r from-[#B6CAEB] to-[#9DB5D9] text-gray-900 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
              >
                <span>📤</span>
                Importar Datos
              </button>
              <button
                onClick={() => abrirModal()}
                className="px-6 py-3 bg-gradient-to-r from-[#B6CCAE] to-[#9AAB64] text-gray-900 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
              >
                <span>+</span>
                Nuevo Proveedor
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-8 space-y-8">
          {/* KPI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KPICard
              title="Total Proveedores"
              value={proveedores.length}
              icon="🏢"
              color="blue"
            />
            {estadisticas && (
              <>
                <KPICard
                  title="Top Proveedor"
                  value={estadisticas.comprasPorProveedor?.[0]?.nombreProveedor || '-'}
                  icon="🏆"
                  color="yellow"
                />
                <KPICard
                  title="Total Gastado"
                  value={formatCurrency(estadisticas.gastosPorProveedor?.reduce((sum: number, p: { totalGastado: number }) => sum + Number(p.totalGastado), 0) || 0)}
                  icon="💰"
                  color="green"
                />
              </>
            )}
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Proveedores con Más Compras</h3>
              <div className="h-64 flex items-center justify-center bg-gradient-to-br from-[#B6CAEB]/10 to-[#9DB5D9]/10 rounded-xl border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <p className="text-6xl mb-2">📊</p>
                  <p className="text-gray-600 font-medium">Gráfico de barras</p>
                  <p className="text-sm text-gray-500 mt-1">Próximamente</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Gastos por Proveedor</h3>
              <div className="h-64 flex items-center justify-center bg-gradient-to-br from-[#FAD863]/10 to-[#F5B8DA]/10 rounded-xl border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <p className="text-6xl mb-2">📈</p>
                  <p className="text-gray-600 font-medium">Gráfico de pastel</p>
                  <p className="text-sm text-gray-500 mt-1">Próximamente</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtro */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
            <input
              type="text"
              placeholder="Buscar por código, nombre, dirección o localidad..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B6CCAE] focus:outline-none transition-all"
            />
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#B6CAEB] to-[#9DB5D9] text-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Código</th>
                    <th className="px-6 py-4 text-left font-semibold">Nombre</th>
                    <th className="px-6 py-4 text-left font-semibold">Dirección</th>
                    <th className="px-6 py-4 text-left font-semibold">Localidad</th>
                    <th className="px-6 py-4 text-center font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {proveedores.filter(p => 
                    p.codigo.toLowerCase().includes(filtro.toLowerCase()) ||
                    p.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
                    (p.direccion || '').toLowerCase().includes(filtro.toLowerCase()) ||
                    (p.localidad || '').toLowerCase().includes(filtro.toLowerCase())
                  ).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        {filtro ? 'No se encontraron resultados' : 'No hay proveedores registrados'}
                      </td>
                    </tr>
                  ) : (
                    proveedores.filter(p => 
                      p.codigo.toLowerCase().includes(filtro.toLowerCase()) ||
                      p.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
                      (p.direccion || '').toLowerCase().includes(filtro.toLowerCase()) ||
                      (p.localidad || '').toLowerCase().includes(filtro.toLowerCase())
                    ).map((p) => (
                      <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-gray-900 font-medium">{p.codigo}</td>
                        <td className="px-6 py-4 text-gray-900">{p.nombre}</td>
                        <td className="px-6 py-4 text-gray-900">{p.direccion || '-'}</td>
                        <td className="px-6 py-4 text-gray-900">{p.localidad || '-'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => abrirModal(p)}
                              className="px-4 py-2 bg-gradient-to-r from-[#B6CAEB] to-[#9DB5D9] text-gray-900 rounded-lg font-semibold hover:shadow-md transition-all text-sm"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => {
                                setEliminando(p);
                                setShowModalEliminar(true);
                              }}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm"
                            >
                              Eliminar
                            </button>
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

      {/* Modal Crear/Editar */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editando ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        footer={
          <>
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={guardar}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#B6CCAE] to-[#9AAB64] text-gray-900 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Guardar
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Código Proveedor
            </label>
            <input
              type="text"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              placeholder="PROV001"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B6CCAE] focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre Proveedor
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Proveedor ABC"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B6CCAE] focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Dirección
            </label>
            <input
              type="text"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              placeholder="Calle Principal 123"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B6CCAE] focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Localidad
            </label>
            <input
              type="text"
              value={formData.localidad}
              onChange={(e) => setFormData({ ...formData, localidad: e.target.value })}
              placeholder="Ciudad, Provincia"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B6CCAE] focus:outline-none transition-all"
            />
          </div>
        </div>
      </Modal>

      {/* Modal Eliminar */}
      <Modal
        isOpen={showModalEliminar}
        onClose={() => setShowModalEliminar(false)}
        title="Eliminar Proveedor"
        footer={
          <>
            <button
              onClick={() => setShowModalEliminar(false)}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={eliminar}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all"
            >
              Eliminar
            </button>
          </>
        }
      >
        <p className="text-gray-700">
          ¿Está seguro de que desea eliminar al proveedor <strong>{eliminando?.nombre}</strong>?
          <br />
          Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}

