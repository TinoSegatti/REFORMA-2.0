'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authService } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import { KPICard } from '@/components/ui';
import { Modal } from '@/components/ui';
import { Users, Download, Upload, Plus, Trophy, DollarSign } from 'lucide-react';

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
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

    if (isSaving) return; // Prevenir múltiples clicks

    setIsSaving(true);
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
    } finally {
      setIsSaving(false);
    }
  };

  const eliminar = async () => {
    if (!eliminando) return;
    if (isDeleting) return; // Prevenir múltiples clicks

    setIsDeleting(true);
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
    } finally {
      setIsDeleting(false);
    }
  };

  const exportarDatos = () => {
    alert('Función de exportar próximamente');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Users className="h-16 w-16 mx-auto mb-4 text-purple-500 animate-pulse" />
          <p className="text-foreground/80">Cargando...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (n: number) => Number(n).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="glass-card px-8 py-6 m-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">Proveedores <Users className="h-8 w-8" /></h2>
              <p className="text-foreground/70 mt-1">Gestión de proveedores de tu planta</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportarDatos}
                className="px-6 py-3 glass-surface text-foreground rounded-xl font-semibold hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <Download className="h-5 w-5" />
                Exportar Datos
              </button>
              <button
                onClick={() => alert('Función de importar próximamente')}
                className="px-6 py-3 glass-surface text-foreground rounded-xl font-semibold hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <Upload className="h-5 w-5" />
                Importar Datos
              </button>
              <button
                onClick={() => abrirModal()}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:brightness-110 transition-all flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
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
                icon={Users}
              color="blue"
            />
            {estadisticas && (
              <>
                <KPICard
                  title="Top Proveedor"
                  value={estadisticas.comprasPorProveedor?.[0]?.nombreProveedor || '-'}
                  icon={Trophy}
                  color="yellow"
                />
                <KPICard
                  title="Total Gastado"
                  value={formatCurrency(estadisticas.gastosPorProveedor?.reduce((sum: number, p: { totalGastado: number }) => sum + Number(p.totalGastado), 0) || 0)}
                  icon={DollarSign}
                  color="green"
                />
              </>
            )}
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="glass-card p-8">
              <h3 className="text-lg font-bold text-foreground mb-4">Proveedores con Más Compras</h3>
              <div className="h-64 flex items-center justify-center glass-surface rounded-xl">
                <div className="text-center">
                  <p className="text-6xl mb-2">📊</p>
                  <p className="text-foreground/70 font-medium">Gráfico de barras</p>
                  <p className="text-sm text-foreground/60 mt-1">Próximamente</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-8">
              <h3 className="text-lg font-bold text-foreground mb-4">Gastos por Proveedor</h3>
              <div className="h-64 flex items-center justify-center glass-surface rounded-xl">
                <div className="text-center">
                  <p className="text-6xl mb-2">📈</p>
                  <p className="text-foreground/70 font-medium">Gráfico de pastel</p>
                  <p className="text-sm text-foreground/60 mt-1">Próximamente</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtro */}
          <div className="glass-card p-6 mb-6">
            <input
              type="text"
              placeholder="Buscar por código, nombre, dirección o localidad..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="glass-input"
            />
          </div>

          {/* Tabla */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-foreground/80">Código</th>
                    <th className="px-6 py-4 text-left font-semibold text-foreground/80">Nombre</th>
                    <th className="px-6 py-4 text-left font-semibold text-foreground/80">Dirección</th>
                    <th className="px-6 py-4 text-left font-semibold text-foreground/80">Localidad</th>
                    <th className="px-6 py-4 text-center font-semibold text-foreground/80">Acciones</th>
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
                      <td colSpan={5} className="px-6 py-12 text-center text-foreground/60">
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
                      <tr key={p.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-foreground font-medium">{p.codigo}</td>
                        <td className="px-6 py-4 text-foreground/90">{p.nombre}</td>
                        <td className="px-6 py-4 text-foreground/90">{p.direccion || '-'}</td>
                        <td className="px-6 py-4 text-foreground/90">{p.localidad || '-'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => abrirModal(p)}
                              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold hover:shadow-md transition-all text-sm"
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
        onClose={() => {
          setShowModal(false);
          setIsSaving(false);
        }}
        title={editando ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        footer={
          <>
            <button
              onClick={() => {
                setShowModal(false);
                setIsSaving(false);
              }}
              disabled={isSaving}
              className="flex-1 px-6 py-3 rounded-xl font-semibold glass-surface text-foreground hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={isSaving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {editando ? 'Guardando...' : 'Creando...'}
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
              Código Proveedor
            </label>
            <input
              type="text"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              placeholder="PROV001"
              className="glass-input"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground/80 mb-2">
              Nombre Proveedor
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Proveedor ABC"
              className="glass-input"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground/80 mb-2">
              Dirección
            </label>
            <input
              type="text"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              placeholder="Calle Principal 123"
              className="glass-input"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground/80 mb-2">
              Localidad
            </label>
            <input
              type="text"
              value={formData.localidad}
              onChange={(e) => setFormData({ ...formData, localidad: e.target.value })}
              placeholder="Ciudad, Provincia"
              className="glass-input"
            />
          </div>
        </div>
      </Modal>

      {/* Modal Eliminar */}
      <Modal
        isOpen={showModalEliminar}
        onClose={() => {
          setShowModalEliminar(false);
          setIsDeleting(false);
        }}
        title="Eliminar Proveedor"
        footer={
          <>
            <button
              onClick={() => {
                setShowModalEliminar(false);
                setIsDeleting(false);
              }}
              disabled={isDeleting}
              className="flex-1 px-6 py-3 rounded-xl font-semibold glass-surface text-foreground hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={eliminar}
              disabled={isDeleting}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all hover:shadow-lg hover:shadow-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDeleting ? (
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
        <p className="text-foreground/80">
          ¿Está seguro de que desea eliminar al proveedor <strong>{eliminando?.nombre}</strong>?
          <br />
          Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}
