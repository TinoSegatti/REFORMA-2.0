'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { Modal } from '@/components/ui';

interface Granja {
  id: string;
  nombreGranja: string;
  descripcion?: string;
  fechaCreacion: string;
}

export default function MisPlantasPage() {
  const router = useRouter();
  const [granjas, setGranjas] = useState<Granja[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModalCrear, setShowModalCrear] = useState(false);
  const [showModalEditar, setShowModalEditar] = useState(false);
  const [showModalEliminar, setShowModalEliminar] = useState(false);
  const [granjaEditando, setGranjaEditando] = useState<Granja | null>(null);
  const [granjaEliminando, setGranjaEliminando] = useState<Granja | null>(null);
  const [nombreGranja, setNombreGranja] = useState('');
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    cargarGranjas();
  }, [router]);

  const cargarGranjas = async () => {
    try {
      const token = authService.getToken();
      if (token) {
        const data = await apiClient.getGranjas(token);
        const granjasAdaptadas = data.map((g: {
          id: string;
          nombreGranja: string;
          descripcion?: string;
          fechaCreacion: string;
        }) => ({
          id: g.id,
          nombreGranja: g.nombreGranja,
          descripcion: g.descripcion,
          fechaCreacion: g.fechaCreacion,
        }));
        setGranjas(granjasAdaptadas);
      }
    } catch (error) {
      console.error('Error cargando granjas:', error);
    } finally {
      setLoading(false);
    }
  };

  const crearGranja = async () => {
    if (!nombreGranja.trim()) return;

    setCreando(true);
    try {
      const token = authService.getToken();
      if (!token) {
        alert('No autenticado');
        return;
      }

      const data = await apiClient.createGranja(token, {
        nombreGranja,
        descripcion: '',
      });

      const nuevaGranja: Granja = {
        id: data.id,
        nombreGranja: data.nombreGranja,
        descripcion: data.descripcion,
        fechaCreacion: data.fechaCreacion,
      };
      
      setGranjas([...granjas, nuevaGranja]);
      setShowModalCrear(false);
      setNombreGranja('');
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error creando granja:', error);
      alert(err.message || 'Error al crear la granja');
    } finally {
      setCreando(false);
    }
  };

  const editarGranja = async () => {
    if (!nombreGranja.trim() || !granjaEditando) return;

    try {
      const token = authService.getToken();
      if (!token) {
        alert('No autenticado');
        return;
      }

      await apiClient.updateGranja(token, granjaEditando.id, {
        nombreGranja,
        descripcion: '',
      });

      setGranjas(granjas.map(g => 
        g.id === granjaEditando.id 
          ? { ...g, nombreGranja }
          : g
      ));

      setShowModalEditar(false);
      setNombreGranja('');
      setGranjaEditando(null);
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error actualizando granja:', error);
      alert(err.message || 'Error al actualizar la granja');
    }
  };

  const eliminarGranja = async () => {
    if (!granjaEliminando) return;

    try {
      const token = authService.getToken();
      if (!token) {
        alert('No autenticado');
        return;
      }

      await apiClient.deleteGranja(token, granjaEliminando.id);
      
      setGranjas(granjas.filter(g => g.id !== granjaEliminando.id));
      setShowModalEliminar(false);
      setGranjaEliminando(null);
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error eliminando granja:', error);
      alert(err.message || 'Error al eliminar la granja');
    }
  };

  const seleccionarGranja = (granja: Granja) => {
    localStorage.setItem('granjaActiva', granja.id);
    localStorage.setItem('granjaInfo', JSON.stringify({
      id: granja.id,
      nombre: granja.nombreGranja,
      descripcion: granja.descripcion,
    }));
    router.push(`/granja/${granja.id}/materias-primas`);
  };

  const abrirModalEditar = (granja: Granja) => {
    setGranjaEditando(granja);
    setNombreGranja(granja.nombreGranja);
    setShowModalEditar(true);
  };

  const abrirModalEliminar = (granja: Granja) => {
    setGranjaEliminando(granja);
    setShowModalEliminar(true);
  };

  const abrirModalCrear = () => {
    setNombreGranja('');
    setShowModalCrear(true);
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
    <div className="min-h-screen bg-[#FAFAE4]">
      {/* Navbar */}
      <nav className="bg-[#121212] text-white px-8 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#F5B8DA] to-[#E599C6] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">R</span>
            </div>
            <h1 className="text-xl font-bold">REFORMA</h1>
          </div>
          <button
            onClick={() => {
              authService.logout();
              router.push('/login');
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Salir
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Mis Plantas 🏭
          </h2>
          <p className="text-gray-600">
            Gestiona tus plantas agropecuarias
          </p>
        </div>

        {/* Lista de Granjas */}
        {granjas.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-200 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#B6CCAE] to-[#9AAB64] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl">🏭</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No tienes plantas registradas
            </h3>
            <p className="text-gray-600 mb-6">
              Crea tu primera planta para comenzar
            </p>
            <button
              onClick={abrirModalCrear}
              className="px-6 py-3 bg-gradient-to-r from-[#B6CCAE] to-[#9AAB64] text-gray-900 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Crear Primera Planta
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex justify-between items-center">
              <p className="text-gray-600">
                Tienes {granjas.length} planta{granjas.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={abrirModalCrear}
                className="px-6 py-3 bg-gradient-to-r from-[#B6CCAE] to-[#9AAB64] text-gray-900 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                + Nueva Planta
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {granjas.map((granja) => (
                <div key={granja.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#F5B8DA] to-[#E599C6] rounded-xl flex items-center justify-center">
                      <span className="text-3xl">🏭</span>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => abrirModalEditar(granja)}
                        className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => abrirModalEliminar(granja)}
                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {granja.nombreGranja}
                  </h3>
                  {granja.descripcion && (
                    <p className="text-sm text-gray-600 mb-4">{granja.descripcion}</p>
                  )}
                  <p className="text-xs text-gray-500 mb-4">
                    Creada: {new Date(granja.fechaCreacion).toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => seleccionarGranja(granja)}
                    className="w-full py-3 bg-gradient-to-r from-[#B6CAEB] to-[#9DB5D9] text-gray-900 rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Abrir Planta
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Modal Crear */}
      <Modal
        isOpen={showModalCrear}
        onClose={() => setShowModalCrear(false)}
        title="Nueva Planta"
        footer={
          <>
            <button
              onClick={() => setShowModalCrear(false)}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={crearGranja}
              disabled={!nombreGranja.trim() || creando}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#B6CCAE] to-[#9AAB64] text-gray-900 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {creando ? 'Creando...' : 'Crear'}
            </button>
          </>
        }
      >
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nombre de la planta
          </label>
          <input
            type="text"
            value={nombreGranja}
            onChange={(e) => setNombreGranja(e.target.value)}
            placeholder="Ej: Planta Agropecuaria Sur"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B6CCAE] focus:outline-none transition-all"
            autoFocus
          />
        </div>
      </Modal>

      {/* Modal Editar */}
      <Modal
        isOpen={showModalEditar}
        onClose={() => setShowModalEditar(false)}
        title="Editar Planta"
        footer={
          <>
            <button
              onClick={() => setShowModalEditar(false)}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={editarGranja}
              disabled={!nombreGranja.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#B6CAEB] to-[#9DB5D9] text-gray-900 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              Guardar
            </button>
          </>
        }
      >
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nombre de la planta
          </label>
          <input
            type="text"
            value={nombreGranja}
            onChange={(e) => setNombreGranja(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B6CCAE] focus:outline-none transition-all"
            autoFocus
          />
        </div>
      </Modal>

      {/* Modal Eliminar */}
      <Modal
        isOpen={showModalEliminar}
        onClose={() => setShowModalEliminar(false)}
        title="Eliminar Planta"
        footer={
          <>
            <button
              onClick={() => setShowModalEliminar(false)}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={eliminarGranja}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all"
            >
              Eliminar
            </button>
          </>
        }
      >
        <p className="text-gray-700">
          ¿Está seguro de que desea eliminar la planta <strong>{granjaEliminando?.nombreGranja}</strong>?
          <br />
          Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}
