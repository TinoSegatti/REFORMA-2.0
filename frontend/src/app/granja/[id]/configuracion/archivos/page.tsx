'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { authService } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { Modal } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import {
  Archive,
  FileText,
  Factory,
  ShoppingCart,
  Box,
  Trash2,
  PlusCircle,
  Download,
} from 'lucide-react';

type TablaOrigen = 'COMPRA' | 'FABRICACION' | 'INVENTARIO';

interface ArchivoResumen {
  id: string;
  descripcion: string;
  fechaArchivo: string;
  totalRegistros: number;
  tablaOrigen: TablaOrigen;
}

interface ArchivosResponse {
  compras: ArchivoResumen[];
  fabricaciones: ArchivoResumen[];
  inventario: ArchivoResumen[];
}

interface SeccionConfig {
  id: keyof ArchivosResponse;
  tabla: TablaOrigen;
  titulo: string;
  descripcion: string;
  icon: React.ElementType;
  emptyIcon: string;
  gradient: string;
}

const secciones: SeccionConfig[] = [
  {
    id: 'compras',
    tabla: 'COMPRA',
    titulo: 'Archivos de Compras',
    descripcion: 'Capturas históricas de tus facturas y detalles asociados.',
    icon: ShoppingCart,
    emptyIcon: '🧾',
    gradient: 'from-purple-600 to-purple-500',
  },
  {
    id: 'fabricaciones',
    tabla: 'FABRICACION',
    titulo: 'Archivos de Fabricaciones',
    descripcion: 'Fotos de tus fabricaciones con fórmulas y materias primas.',
    icon: Factory,
    emptyIcon: '🏭',
    gradient: 'from-emerald-500 to-emerald-400',
  },
  {
    id: 'inventario',
    tabla: 'INVENTARIO',
    titulo: 'Archivos de Inventario',
    descripcion: 'Estado completo del inventario en un momento específico.',
    icon: Box,
    emptyIcon: '📦',
    gradient: 'from-amber-500 to-amber-400',
  },
];

const initialState: ArchivosResponse = {
  compras: [],
  fabricaciones: [],
  inventario: [],
};

export default function ArchivosPage() {
  const params = useParams();
  const router = useRouter();
  const idGranja = useMemo(() => (params?.id as string) || '', [params]);

  const [archivos, setArchivos] = useState<ArchivosResponse>(initialState);
  const [loading, setLoading] = useState(true);
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [showEliminarModal, setShowEliminarModal] = useState(false);
  const [tablaSeleccionada, setTablaSeleccionada] = useState<SeccionConfig | null>(null);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<ArchivoResumen | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [confirmacionTexto, setConfirmacionTexto] = useState('');
  const [accionEnProgreso, setAccionEnProgreso] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    cargarArchivos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idGranja]);

  const cargarArchivos = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      if (!token || !idGranja) return;

      const data = await apiClient.getArchivos(token, idGranja);
      setArchivos({
        compras: data.compras || [],
        fabricaciones: data.fabricaciones || [],
        inventario: data.inventario || [],
      });
    } catch (error) {
      console.error('Error cargando archivos:', error);
      alert(error instanceof Error ? error.message : 'Error al cargar archivos');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalCrear = (seccion: SeccionConfig) => {
    setTablaSeleccionada(seccion);
    setDescripcion('');
    setShowCrearModal(true);
  };

  const crearArchivo = async () => {
    if (!tablaSeleccionada) return;
    if (!descripcion.trim()) {
      alert('Por favor ingresa una descripción para el archivo.');
      return;
    }

    try {
      setAccionEnProgreso(true);
      const token = authService.getToken();
      if (!token) {
        alert('Sesión expirada');
        return;
      }

      await apiClient.crearArchivo(token, idGranja, {
        tablaOrigen: tablaSeleccionada.tabla,
        descripcion: descripcion.trim(),
      });

      setShowCrearModal(false);
      setTablaSeleccionada(null);
      setDescripcion('');
      await cargarArchivos();
      alert('Archivo creado correctamente.');
    } catch (error) {
      console.error('Error creando archivo:', error);
      alert(error instanceof Error ? error.message : 'Error al crear archivo');
    } finally {
      setAccionEnProgreso(false);
    }
  };

  const abrirModalEliminar = (archivo: ArchivoResumen) => {
    setArchivoSeleccionado(archivo);
    setConfirmacionTexto('');
    setShowEliminarModal(true);
  };

  const eliminarArchivo = async () => {
    if (!archivoSeleccionado) return;
    if (confirmacionTexto.toUpperCase() !== 'ELIMINAR') {
      alert('Debes escribir ELIMINAR para confirmar.');
      return;
    }

    try {
      setAccionEnProgreso(true);
      const token = authService.getToken();
      if (!token) {
        alert('Sesión expirada');
        return;
      }

      await apiClient.eliminarArchivo(token, idGranja, archivoSeleccionado.id);

      setShowEliminarModal(false);
      setArchivoSeleccionado(null);
      await cargarArchivos();
      alert('Archivo eliminado correctamente.');
    } catch (error) {
      console.error('Error eliminando archivo:', error);
      alert(error instanceof Error ? error.message : 'Error al eliminar archivo');
    } finally {
      setAccionEnProgreso(false);
    }
  };

  const irADetalle = (archivo: ArchivoResumen) => {
    router.push(`/granja/${idGranja}/configuracion/archivos/${archivo.id}`);
  };

  const manejarExportacion = async () => {
    setIsExportingCsv(true);
    try {
      const token = authService.getToken();
      if (!token) {
        alert('Sesión expirada');
        return;
      }

      const blob = await apiClient.exportarArchivos(token, idGranja);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `archivos_${idGranja}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exportando archivos:', error);
      alert(error instanceof Error ? error.message : 'Error al exportar archivos');
    } finally {
      setIsExportingCsv(false);
    }
  };

  const formatDate = (isoDate: string) =>
    new Date(isoDate).toLocaleString('es-AR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <div className="glass-card px-8 py-6 flex items-center gap-3">
            <Archive className="h-6 w-6 animate-spin text-purple-400" />
            <span className="text-foreground/80">Preparando archivos...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 ml-64">
        <div className="max-w-7xl mx-auto p-8 space-y-8">
          <header className="glass-card px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                Archivos & Snapshots
                <FileText className="h-8 w-8 text-purple-400" />
              </h1>
              <p className="text-foreground/70 mt-2 max-w-2xl">
                Genera una foto instantánea de tus datos críticos (compras, fabricaciones e inventario) para
                consultarla en el futuro sin riesgos de modificaciones accidentales.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                 onClick={manejarExportacion}
                 disabled={isExportingCsv}
                 className={`px-4 py-2.5 glass-surface text-foreground rounded-lg font-semibold transition-all flex items-center gap-2 ${
                   isExportingCsv ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
                 }`}
               >
                 <Download className="h-4 w-4" />
                 {isExportingCsv ? 'Exportando...' : 'Exportar CSV'}
               </button>
               <button
                onClick={() => abrirModalCrear(secciones[0])}
                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
               >
                 <PlusCircle className="h-5 w-5" />
                 Nuevo archivo
               </button>
            </div>
            <div className="glass-card px-5 py-4 border border-white/10 rounded-2xl backdrop-blur-xl">
              <p className="text-sm text-foreground/60">Consejo</p>
              <p className="text-sm text-foreground/80 mt-1">
                Usa los archivos antes de cierres contables, auditorías o para comparar escenarios.
              </p>
            </div>
          </header>

          <div className="space-y-10">
            {secciones.map((seccion) => {
              const datos = archivos[seccion.id] || [];
              const Icono = seccion.icon;

              return (
                <section key={seccion.id} className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${seccion.gradient} flex items-center justify-center shadow-lg shadow-purple-500/20`}>
                        <Icono className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-foreground">{seccion.titulo}</h2>
                        <p className="text-sm text-foreground/70">{seccion.descripcion}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => abrirModalCrear(seccion)}
                      className="flex items-center gap-2 px-5 py-3"
                    >
                      <PlusCircle className="h-5 w-5" />
                      Nuevo archivo
                    </Button>
                  </div>

                  {datos.length === 0 ? (
                    <div className="glass-card p-10 border border-dashed border-white/15 rounded-2xl text-center">
                      <div className="text-5xl mb-3">{seccion.emptyIcon}</div>
                      <p className="text-foreground/80 font-medium">Aún no has generado archivos en esta sección.</p>
                      <p className="text-sm text-foreground/60 mt-1">
                        Crea un archivo para guardar una copia fija de los registros actuales.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {datos.map((archivo) => (
                        <article
                          key={archivo.id}
                          className="glass-card p-6 rounded-2xl border border-white/10 hover:border-purple-400/40 transition-colors flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-foreground line-clamp-2">{archivo.descripcion}</h3>
                            <p className="text-sm text-foreground/60">Creado el {formatDate(archivo.fechaArchivo)}</p>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sm text-foreground/80">
                              <Archive className="h-4 w-4" />
                              {archivo.totalRegistros} registro{archivo.totalRegistros === 1 ? '' : 's'}
                            </div>
                          </div>

                          <div className="mt-6 flex items-center gap-3">
                            <Button
                              variant="neutral"
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2"
                              onClick={() => irADetalle(archivo)}
                            >
                              <FileText className="h-4 w-4" />
                              Detalles
                            </Button>
                            <Button
                              variant="danger"
                              className="px-4 py-2 flex items-center gap-2"
                              onClick={() => abrirModalEliminar(archivo)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Eliminar
                            </Button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      </main>

      {/* Modal Crear Archivo */}
      <Modal
        isOpen={showCrearModal}
        onClose={() => {
          if (accionEnProgreso) return;
          setShowCrearModal(false);
          setTablaSeleccionada(null);
        }}
        title={`Nuevo archivo ${tablaSeleccionada ? tablaSeleccionada.titulo.toLowerCase() : ''}`}
        footer={
          <>
            <Button
              variant="neutral"
              onClick={() => {
                if (accionEnProgreso) return;
                setShowCrearModal(false);
                setTablaSeleccionada(null);
              }}
              className="flex-1"
              disabled={accionEnProgreso}
            >
              Cancelar
            </Button>
            <Button
              onClick={crearArchivo}
              className="flex-1"
              disabled={accionEnProgreso}
            >
              {accionEnProgreso ? 'Creando...' : 'Crear archivo'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-foreground/70">
            Se guardará una copia exacta de los registros actuales. No podrás editarla luego, pero siempre podrás eliminarla.
          </p>
          <div>
            <label className="text-sm font-semibold text-foreground/80 mb-2 block">
              Descripción del archivo
            </label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej. Cierre de Q2 2024"
              className="glass-input"
              disabled={accionEnProgreso}
            />
          </div>
        </div>
      </Modal>

      {/* Modal Eliminar Archivo */}
      <Modal
        isOpen={showEliminarModal}
        onClose={() => {
          if (accionEnProgreso) return;
          setShowEliminarModal(false);
          setArchivoSeleccionado(null);
        }}
        title="Eliminar archivo"
        footer={
          <>
            <Button
              variant="neutral"
              onClick={() => {
                if (accionEnProgreso) return;
                setShowEliminarModal(false);
                setArchivoSeleccionado(null);
              }}
              className="flex-1"
              disabled={accionEnProgreso}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={eliminarArchivo}
              className="flex-1"
              disabled={accionEnProgreso || confirmacionTexto.toUpperCase() !== 'ELIMINAR'}
            >
              {accionEnProgreso ? 'Eliminando...' : 'Confirmar eliminación'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-foreground/70">
            Esta acción eliminará permanentemente el archivo{' '}
            <span className="font-semibold text-foreground">{archivoSeleccionado?.descripcion}</span>.
            No podrás recuperarlo.
          </p>
          <div>
            <label className="text-sm font-semibold text-foreground/80 mb-2 block">
              Escribe <span className="text-red-400">ELIMINAR</span> para confirmar
            </label>
            <input
              type="text"
              value={confirmacionTexto}
              onChange={(e) => setConfirmacionTexto(e.target.value)}
              className="glass-input uppercase tracking-[0.2em]"
              placeholder="ELIMINAR"
              disabled={accionEnProgreso}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}


