'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authService } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import { Modal } from '@/components/ui';
import { PiggyBank, Download, Upload, Plus } from 'lucide-react';

interface Animal {
  id: string;
  codigo: string;
  descripcion: string;
  categoria: string;
}

export default function PiensosPage() {
  const router = useRouter();
  const params = useParams();
  const idGranja = params.id as string;

  const [user, setUser] = useState<{ id: string; email: string; tipoUsuario: string } | null>(null);
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showModalEliminar, setShowModalEliminar] = useState(false);
  const [editando, setEditando] = useState<Animal | null>(null);
  const [eliminando, setEliminando] = useState<Animal | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    codigo: '',
    descripcion: '',
    categoria: '',
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const currentUser = authService.getUser();
    setUser(currentUser);
    cargarAnimales();
  }, [router]);

  const cargarAnimales = async () => {
    try {
      const token = authService.getToken();
      if (token) {
        const data = await apiClient.getAnimales(token, idGranja);
        const animalesAdaptados = data.map((a: { id: string; codigoAnimal: string; descripcionAnimal: string; categoriaAnimal: string }) => ({
          id: a.id,
          codigo: a.codigoAnimal,
          descripcion: a.descripcionAnimal,
          categoria: a.categoriaAnimal,
        }));
        setAnimales(animalesAdaptados);
      }
    } catch (error) {
      console.error('Error cargando animales:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (animal?: Animal) => {
    if (animal) {
      setEditando(animal);
      setFormData({
        codigo: animal.codigo,
        descripcion: animal.descripcion,
        categoria: animal.categoria,
      });
    } else {
      setEditando(null);
      setFormData({ codigo: '', descripcion: '', categoria: '' });
    }
    setShowModal(true);
  };

  const guardar = async () => {
    if (!formData.codigo.trim() || !formData.descripcion.trim() || !formData.categoria.trim()) {
      alert('Por favor complete todos los campos');
      return;
    }
    if (isSaving) return; // Prevenir múltiples clicks

    setIsSaving(true);
    try {
      const token = authService.getToken();
      if (!token) {
        alert('No autenticado');
        setIsSaving(false);
        return;
      }

      if (editando) {
        await apiClient.updateAnimal(token, idGranja, editando.id, {
          codigoAnimal: formData.codigo,
          descripcionAnimal: formData.descripcion,
          categoriaAnimal: formData.categoria,
        });
      } else {
        await apiClient.createAnimal(token, idGranja, {
          codigoAnimal: formData.codigo,
          descripcionAnimal: formData.descripcion,
          categoriaAnimal: formData.categoria,
        });
      }

      await cargarAnimales();
      setShowModal(false);
      setFormData({ codigo: '', descripcion: '', categoria: '' });
      setEditando(null);
    } catch (error: unknown) {
      console.error('Error guardando:', error);
      alert(error instanceof Error ? error.message : 'Error al guardar el animal');
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
        setIsDeleting(false);
        return;
      }

      await apiClient.deleteAnimal(token, idGranja, eliminando.id);
      await cargarAnimales();
      setShowModalEliminar(false);
      setEliminando(null);
    } catch (error: unknown) {
      console.error('Error eliminando:', error);
      alert(error instanceof Error ? error.message : 'Error al eliminar el animal');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <PiggyBank className="h-16 w-16 mx-auto mb-4 text-purple-500 animate-pulse" />
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
              <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">Piensos <PiggyBank className="h-8 w-8" /></h2>
              <p className="text-foreground/70 mt-1">Gestión de tipos de animales (piensos)</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => alert('Función de exportar próximamente')}
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
                Nuevo Pienso
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
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-400 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/30">
                  <PiggyBank className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-sm text-foreground/70">Total de Piensos</p>
                  <p className="text-3xl font-bold text-foreground">{animales.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtro */}
          <div className="glass-card p-6">
            <input
              type="text"
              placeholder="Buscar por código, descripción o categoría..."
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
                    <th className="px-6 py-4 text-left font-semibold text-foreground/80">Descripción</th>
                    <th className="px-6 py-4 text-left font-semibold text-foreground/80">Categoría</th>
                    <th className="px-6 py-4 text-center font-semibold text-foreground/80">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {animales.filter(a => 
                    a.codigo.toLowerCase().includes(filtro.toLowerCase()) ||
                    a.descripcion.toLowerCase().includes(filtro.toLowerCase()) ||
                    a.categoria.toLowerCase().includes(filtro.toLowerCase())
                  ).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-foreground/60">
                        {filtro ? 'No se encontraron resultados' : 'No hay piensos registrados'}
                      </td>
                    </tr>
                  ) : (
                    animales.filter(a => 
                      a.codigo.toLowerCase().includes(filtro.toLowerCase()) ||
                      a.descripcion.toLowerCase().includes(filtro.toLowerCase()) ||
                      a.categoria.toLowerCase().includes(filtro.toLowerCase())
                    ).map((a) => (
                      <tr key={a.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-foreground font-medium">{a.codigo}</td>
                        <td className="px-6 py-4 text-foreground/90">{a.descripcion}</td>
                        <td className="px-6 py-4 text-foreground/90">{a.categoria}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => abrirModal(a)}
                              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold hover:shadow-md transition-all text-sm"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => {
                                setEliminando(a);
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
        title={editando ? 'Editar Pienso' : 'Nuevo Pienso'}
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
              Código Animal
            </label>
            <input
              type="text"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              placeholder="CER01"
              className="glass-input"
              disabled={isSaving}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground/80 mb-2">
              Descripción
            </label>
            <input
              type="text"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Cerdos en lactancia"
              className="glass-input"
              disabled={isSaving}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground/80 mb-2">
              Categoría
            </label>
            <input
              type="text"
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              placeholder="Ej: Lactancia, Destete, Crecimiento, etc."
              className="glass-input"
              disabled={isSaving}
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
        title="Eliminar Pienso"
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
          ¿Está seguro de que desea eliminar el pienso <strong>{eliminando?.descripcion}</strong>?
          <br />
          Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}

