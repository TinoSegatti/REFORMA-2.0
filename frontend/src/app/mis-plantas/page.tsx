'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { Modal } from '@/components/ui';
import { Moon, Sun, Factory, AlertCircle, Rocket } from 'lucide-react';

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
  const [darkMode, setDarkMode] = useState(true);
  const [showModalLimite, setShowModalLimite] = useState(false);
  const [mensajeLimite, setMensajeLimite] = useState('');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setDarkMode(false);
      document.documentElement.className = 'light';
      document.body.style.backgroundColor = '#ffffff';
    } else {
      setDarkMode(true);
      document.documentElement.className = 'dark';
      document.body.style.backgroundColor = '#0a0a0f';
    }
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.documentElement.className = newDarkMode ? 'dark' : 'light';
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    // Actualizar fondo según el tema
    document.body.style.backgroundColor = newDarkMode ? '#0a0a0f' : '#ffffff';
  };

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
      
      // Verificar si es un error de límite de granjas
      const mensajeError = err.message || 'Error al crear la granja';
      if (mensajeError.includes('Límite') || mensajeError.includes('limite') || mensajeError.includes('alcanzado')) {
        setMensajeLimite(mensajeError);
        setShowModalLimite(true);
        setShowModalCrear(false);
      } else {
        alert(mensajeError);
      }
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
    router.push(`/granja/${granja.id}`);
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
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Factory className="h-16 w-16 mx-auto mb-4 text-purple-500 animate-pulse" />
          <p className="text-foreground/80">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="bg-black/40 backdrop-blur-xl text-white px-8 py-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
              <span className="text-white font-bold">R</span>
            </div>
            <h1 className="text-xl font-bold">REFORMA</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 glass-surface text-white rounded-lg hover:bg-white/10 transition-all"
              title={darkMode ? 'Modo claro' : 'Modo oscuro'}
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              onClick={() => {
                authService.logout();
                router.push('/login');
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors hover:shadow-lg hover:shadow-red-600/30"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            Mis Plantas <Factory className="h-8 w-8" />
          </h2>
          <p className="text-foreground/70">
            Gestiona tus plantas agropecuarias
          </p>
        </div>

        {/* Lista de Granjas */}
        {granjas.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
              <Factory className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              No tienes plantas registradas
            </h3>
            <p className="text-foreground/70 mb-6">
              Crea tu primera planta para comenzar
            </p>
            <button
              onClick={abrirModalCrear}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:brightness-110 transition-all"
            >
              Crear Primera Planta
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex justify-between items-center">
              <p className="text-foreground/70">
                Tienes {granjas.length} planta{granjas.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={abrirModalCrear}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:brightness-110 transition-all"
              >
                + Nueva Planta
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {granjas.map((granja) => (
                <div key={granja.id} className="glass-card p-6 group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                      <Factory className="h-10 w-10 text-white" />
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => abrirModalEditar(granja)}
                        className="p-2 glass-surface text-purple-400 rounded-lg hover:bg-purple-500/20 transition-colors"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => abrirModalEliminar(granja)}
                        className="p-2 glass-surface text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {granja.nombreGranja}
                  </h3>
                  {granja.descripcion && (
                    <p className="text-sm text-foreground/70 mb-4">{granja.descripcion}</p>
                  )}
                  <p className="text-xs text-foreground/50 mb-4">
                    Creada: {new Date(granja.fechaCreacion).toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => seleccionarGranja(granja)}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:brightness-110 transition-all"
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
              className="flex-1 px-6 py-3 rounded-xl font-semibold glass-surface text-foreground hover:bg-white/10 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={crearGranja}
              disabled={!nombreGranja.trim() || creando}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {creando ? 'Creando...' : 'Crear'}
            </button>
          </>
        }
      >
        <div>
          <label className="block text-sm font-semibold text-foreground/80 mb-2">
            Nombre de la planta
          </label>
          <input
            type="text"
            value={nombreGranja}
            onChange={(e) => setNombreGranja(e.target.value)}
            placeholder="Ej: Planta Agropecuaria Sur"
            className="glass-input"
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
              className="flex-1 px-6 py-3 rounded-xl font-semibold glass-surface text-foreground hover:bg-white/10 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={editarGranja}
              disabled={!nombreGranja.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              Guardar
            </button>
          </>
        }
      >
        <div>
          <label className="block text-sm font-semibold text-foreground/80 mb-2">
            Nombre de la planta
          </label>
          <input
            type="text"
            value={nombreGranja}
            onChange={(e) => setNombreGranja(e.target.value)}
            className="glass-input"
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
              className="flex-1 px-6 py-3 rounded-xl font-semibold glass-surface text-foreground hover:bg-white/10 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={eliminarGranja}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all hover:shadow-lg hover:shadow-red-600/30"
            >
              Eliminar
            </button>
          </>
        }
      >
        <p className="text-foreground/80">
          ¿Está seguro de que desea eliminar la planta <strong>{granjaEliminando?.nombreGranja}</strong>?
          <br />
          Esta acción no se puede deshacer.
        </p>
      </Modal>

      {/* Modal Límite Alcanzado */}
      <Modal
        isOpen={showModalLimite}
        onClose={() => setShowModalLimite(false)}
        title=""
        footer={
          <>
            <button
              onClick={() => setShowModalLimite(false)}
              className="flex-1 px-6 py-3 rounded-xl font-semibold glass-surface text-foreground hover:bg-white/10 transition-all"
            >
              Entendido
            </button>
            <button
              onClick={() => {
                setShowModalLimite(false);
                // TODO: Redirigir a página de planes/upgrade cuando esté implementada
                // router.push('/planes');
              }}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              <Rocket className="h-5 w-5" />
              Ver Planes
            </button>
          </>
        }
      >
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/30">
            <AlertCircle className="h-12 w-12 text-white" />
          </div>
          
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Límite de Plantas Alcanzado
          </h3>
          
          <div className="glass-card p-6 mb-6 text-left">
            <p className="text-foreground/90 mb-4 leading-relaxed">
              {mensajeLimite || 'Has alcanzado el límite de plantas permitidas en tu plan actual.'}
            </p>
            
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
              <p className="text-sm text-purple-300 font-semibold mb-2">
                💡 Plan Demo Gratuita
              </p>
              <p className="text-sm text-foreground/80">
                Tu plan actual permite <strong className="text-foreground">1 planta</strong>. 
                Para crear más plantas, considera actualizar a un plan superior.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-foreground/70">
              Con un plan superior podrás:
            </p>
            <ul className="text-sm text-foreground/80 space-y-2 text-left max-w-md mx-auto">
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Crear múltiples plantas
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Más registros por tabla
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Funcionalidades avanzadas
              </li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
}
