'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authService } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import { Modal } from '@/components/ui';

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

      await apiClient.deleteMateriaPrima(token, idGranja, eliminando.id);
      
      // Recargar datos
      await cargarMateriasPrimas();
      setShowModalEliminar(false);
      setEliminando(null);
    } catch (error: unknown) {
      console.error('Error eliminando:', error);
      alert(error instanceof Error ? error.message : 'Error al eliminar la materia prima');
    }
  };

  const materiasFiltradas = materiasPrimas.filter((m) =>
    m.codigo.toLowerCase().includes(filtro.toLowerCase()) ||
    m.nombre.toLowerCase().includes(filtro.toLowerCase())
  );

  const formatCurrency = (n: number) => Number(n).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });

  return (
    <div className="flex min-h-screen bg-[#FAFAE4]">
      <Sidebar />

      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Materias Primas</h2>
              <p className="text-gray-600 mt-1">Gestión de materias primas de tu planta</p>
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
              <button
                onClick={() => abrirModal()}
                className="px-6 py-3 bg-gradient-to-r from-[#B6CCAE] to-[#9AAB64] text-gray-900 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
              >
                <span>+</span>
                Nueva Materia Prima
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
                <div className="w-16 h-16 bg-gradient-to-br from-[#B6CCAE] to-[#9AAB64] rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">📦</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total de Materias Primas</p>
                  <p className="text-3xl font-bold text-gray-900">{materiasPrimas.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtro */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <input
              type="text"
              placeholder="Buscar por código o nombre..."
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
                    <th className="px-6 py-4 text-left font-semibold">Precio por Kilo</th>
                    <th className="px-6 py-4 text-center font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {materiasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        {filtro ? 'No se encontraron resultados' : 'No hay materias primas registradas'}
                      </td>
                    </tr>
                  ) : (
                    materiasFiltradas.map((m) => (
                      <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-gray-900 font-medium">{m.codigo}</td>
                        <td className="px-6 py-4 text-gray-900">{m.nombre}</td>
                        <td className="px-6 py-4 text-gray-900 whitespace-nowrap">
                          {m.precioPorKilo > 0 ? formatCurrency(m.precioPorKilo) : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => abrirModal(m)}
                              className="px-4 py-2 bg-gradient-to-r from-[#B6CAEB] to-[#9DB5D9] text-gray-900 rounded-lg font-semibold hover:shadow-md transition-all text-sm"
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
        onClose={() => setShowModal(false)}
        title={editando ? 'Editar Materia Prima' : 'Nueva Materia Prima'}
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
              Código
            </label>
            <input
              type="text"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              placeholder="MP001"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B6CCAE] focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Maíz"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B6CCAE] focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Precio por Kilo
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
              <input
                type="text"
                value="Calculado automáticamente"
                disabled
                className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              El precio se calculará automáticamente al registrar la primera compra
            </p>
          </div>
        </div>
      </Modal>

      {/* Modal Eliminar */}
      <Modal
        isOpen={showModalEliminar}
        onClose={() => setShowModalEliminar(false)}
        title="Eliminar Materia Prima"
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
          ¿Está seguro de que desea eliminar la materia prima <strong>{eliminando?.nombre}</strong>?
          <br />
          Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}
