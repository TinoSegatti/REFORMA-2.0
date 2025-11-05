'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authService } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import { Modal } from '@/components/ui';
import { Sprout, Download, Upload, Plus } from 'lucide-react';

interface MateriaPrima {
  id: string;
  codigo: string;
  nombre: string;
  precioPorKilo: number;
}

interface MateriaPrimaBackend {
  id: string;
  codigoMateriaPrima: string;
  nombreMateriaPrima: string;
  precioPorKilo: number;
}

export default function MateriasPrimasPage() {
  const router = useRouter();
  const params = useParams();
  const idGranja = params.id as string;

  const [user, setUser] = useState<{ id: string; email: string; tipoUsuario: string } | null>(null);
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrima[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showModalEliminar, setShowModalEliminar] = useState(false);
  const [editando, setEditando] = useState<MateriaPrima | null>(null);
  const [eliminando, setEliminando] = useState<MateriaPrima | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const currentUser = authService.getUser();
    setUser(currentUser);
    cargarMateriasPrimas();
  }, [router]);

  const cargarMateriasPrimas = async () => {
    try {
      const token = authService.getToken();
      if (token) {
        const data = await apiClient.getMateriasPrimas(token, idGranja);
        // Adaptar los datos del backend al formato esperado
        const materiasAdaptadas = data.map((mp: MateriaPrimaBackend) => ({
          id: mp.id,
          codigo: mp.codigoMateriaPrima,
          nombre: mp.nombreMateriaPrima,
          precioPorKilo: mp.precioPorKilo || 0,
        }));
        setMateriasPrimas(materiasAdaptadas);
      }
    } catch (error) {
      console.error('Error cargando materias primas:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (materia?: MateriaPrima) => {
    if (materia) {
      setEditando(materia);
      setFormData({
        codigo: materia.codigo,
        nombre: materia.nombre,
      });
    } else {
      setEditando(null);
      setFormData({ codigo: '', nombre: '' });
    }
    setShowModal(true);
  };

  const guardar = async () => {
    if (!formData.codigo.trim() || !formData.nombre.trim()) {
      alert('Por favor complete todos los campos requeridos');
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
        // Actualizar materia prima existente
        await apiClient.updateMateriaPrima(token, idGranja, editando.id, {
          codigoMateriaPrima: formData.codigo,
          nombreMateriaPrima: formData.nombre,
        });
      } else {
        // Crear nueva materia prima
        await apiClient.createMateriaPrima(token, idGranja, {
          codigoMateriaPrima: formData.codigo,
          nombreMateriaPrima: formData.nombre,
        });
      }

      // Recargar datos
      await cargarMateriasPrimas();
      
      // Limpiar formulario y cerrar modal
      setShowModal(false);
      setFormData({ codigo: '', nombre: '' });
      setEditando(null);
    } catch (error: unknown) {
      console.error('Error guardando:', error);
      alert(error instanceof Error ? error.message : 'Error al guardar la materia prima');
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

      await apiClient.deleteMateriaPrima(token, idGranja, eliminando.id);
      
      // Recargar datos
      await cargarMateriasPrimas();
      setShowModalEliminar(false);
      setEliminando(null);
    } catch (error: unknown) {
      console.error('Error eliminando:', error);
      alert(error instanceof Error ? error.message : 'Error al eliminar la materia prima');
    } finally {
      setIsDeleting(false);
    }
  };

  const materiasFiltradas = materiasPrimas.filter((m) =>
    m.codigo.toLowerCase().includes(filtro.toLowerCase()) ||
    m.nombre.toLowerCase().includes(filtro.toLowerCase())
  );

  const formatCurrency = (n: number) => Number(n).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Sprout className="h-16 w-16 mx-auto mb-4 text-purple-500 animate-pulse" />
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
              <h2 className="text-3xl font-bold text-foreground">Materias Primas</h2>
              <p className="text-foreground/70 mt-1">Gestión de materias primas de tu planta</p>
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
                onClick={() => abrirModal()}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:brightness-110 transition-all flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Nueva Materia Prima
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-8 space-y-6">
          {/* Card Total */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Sprout className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-sm text-foreground/70">Total de Materias Primas</p>
                  <p className="text-3xl font-bold text-foreground">{materiasPrimas.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtro */}
          <div className="glass-card p-6">
            <input
              type="text"
              placeholder="Buscar por código o nombre..."
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
                    <th className="px-6 py-4 text-left font-semibold text-foreground/80">Precio por Kilo</th>
                    <th className="px-6 py-4 text-center font-semibold text-foreground/80">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {materiasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-foreground/60">
                        {filtro ? 'No se encontraron resultados' : 'No hay materias primas registradas'}
                      </td>
                    </tr>
                  ) : (
                    materiasFiltradas.map((m) => (
                      <tr key={m.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-foreground font-medium">{m.codigo}</td>
                        <td className="px-6 py-4 text-foreground/90">{m.nombre}</td>
                        <td className="px-6 py-4 text-foreground/90 whitespace-nowrap">
                          {m.precioPorKilo > 0 ? formatCurrency(m.precioPorKilo) : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => abrirModal(m)}
                              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold hover:shadow-md transition-all text-sm"
                            >
                              Editar
                            </button>
            <button
              onClick={() => {
                setEliminando(m);
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
        title={editando ? 'Editar Materia Prima' : 'Nueva Materia Prima'}
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
              Código
            </label>
            <input
              type="text"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              placeholder="MP001"
              className="glass-input"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground/80 mb-2">
              Nombre
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Maíz"
              className="glass-input"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground/80 mb-2">
              Precio por Kilo
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/50 font-semibold">$</span>
              <input
                type="text"
                value="Calculado automáticamente"
                disabled
                className="glass-input bg-white/[0.02] cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-foreground/60 mt-1">
              El precio se calculará automáticamente al registrar la primera compra
            </p>
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
        title="Eliminar Materia Prima"
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
          ¿Está seguro de que desea eliminar la materia prima <strong>{eliminando?.nombre}</strong>?
          <br />
          Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}
