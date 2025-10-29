'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authService } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import { Modal } from '@/components/ui';

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

    try {
      const token = authService.getToken();
      if (!token) {
        alert('No autenticado');
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

      await apiClient.deleteAnimal(token, idGranja, eliminando.id);
      await cargarAnimales();
      setShowModalEliminar(false);
      setEliminando(null);
    } catch (error: unknown) {
      console.error('Error eliminando:', error);
      alert(error instanceof Error ? error.message : 'Error al eliminar el animal');
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
              <h2 className="text-3xl font-bold text-gray-900">Piensos 🐷</h2>
              <p className="text-gray-600 mt-1">Gestión de tipos de animales (piensos)</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => alert('Función de exportar próximamente')}
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
                Nuevo Pienso
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-8 space-y-6">
          {/* Card Total */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#F5B8DA] to-[#E599C6] rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">🐷</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total de Piensos</p>
                  <p className="text-3xl font-bold text-gray-900">{animales.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtro */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <input
              type="text"
              placeholder="Buscar por código, descripción o categoría..."
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
                    <th className="px-6 py-4 text-left font-semibold">Descripción</th>
                    <th className="px-6 py-4 text-left font-semibold">Categoría</th>
                    <th className="px-6 py-4 text-center font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {animales.filter(a => 
                    a.codigo.toLowerCase().includes(filtro.toLowerCase()) ||
                    a.descripcion.toLowerCase().includes(filtro.toLowerCase()) ||
                    a.categoria.toLowerCase().includes(filtro.toLowerCase())
                  ).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        {filtro ? 'No se encontraron resultados' : 'No hay piensos registrados'}
                      </td>
                    </tr>
                  ) : (
                    animales.filter(a => 
                      a.codigo.toLowerCase().includes(filtro.toLowerCase()) ||
                      a.descripcion.toLowerCase().includes(filtro.toLowerCase()) ||
                      a.categoria.toLowerCase().includes(filtro.toLowerCase())
                    ).map((a) => (
                      <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-gray-900 font-medium">{a.codigo}</td>
                        <td className="px-6 py-4 text-gray-900">{a.descripcion}</td>
                        <td className="px-6 py-4 text-gray-900">{a.categoria}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => abrirModal(a)}
                              className="px-4 py-2 bg-gradient-to-r from-[#B6CAEB] to-[#9DB5D9] text-gray-900 rounded-lg font-semibold hover:shadow-md transition-all text-sm"
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
        onClose={() => setShowModal(false)}
        title={editando ? 'Editar Pienso' : 'Nuevo Pienso'}
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
              Código Animal
            </label>
            <input
              type="text"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              placeholder="CER01"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B6CCAE] focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descripción
            </label>
            <input
              type="text"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Cerdos en lactancia"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B6CCAE] focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Categoría
            </label>
            <input
              type="text"
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              placeholder="Ej: Lactancia, Destete, Crecimiento, etc."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B6CCAE] focus:outline-none transition-all"
            />
          </div>
        </div>
      </Modal>

      {/* Modal Eliminar */}
      <Modal
        isOpen={showModalEliminar}
        onClose={() => setShowModalEliminar(false)}
        title="Eliminar Pienso"
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
          ¿Está seguro de que desea eliminar el pienso <strong>{eliminando?.descripcion}</strong>?
          <br />
          Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}

