'use client';

import { useEffect, useMemo, useState } from 'react';
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

  const [animales, setAnimales] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showModalEliminar, setShowModalEliminar] = useState(false);
  const [editando, setEditando] = useState<Animal | null>(null);
  const [eliminando, setEliminando] = useState<Animal | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [archivoImport, setArchivoImport] = useState<File | null>(null);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
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

  const animalesFiltrados = useMemo(() => {
    const texto = filtro.trim().toLowerCase();
    if (!texto) return animales;
    return animales.filter(
      (a) =>
        a.codigo.toLowerCase().includes(texto) ||
        a.descripcion.toLowerCase().includes(texto) ||
        a.categoria.toLowerCase().includes(texto)
    );
  }, [animales, filtro]);

  const categoriasStats = useMemo(() => {
    const conteo = new Map<string, number>();
    animales.forEach((a) => {
      const key = a.categoria.trim() || 'Sin categoría';
      conteo.set(key, (conteo.get(key) || 0) + 1);
    });
    return Array.from(conteo.entries())
      .map(([categoria, cantidad]) => ({ categoria, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [animales]);

  const totalCategorias = categoriasStats.length;
  const categoriaPrincipal = categoriasStats[0];
  const piensosSinCategoria = categoriasStats.find((c) => c.categoria === 'Sin categoría')?.cantidad ?? 0;

  const puedeImportar = animales.length === 0;

  const abrirModalImportacion = () => {
    setArchivoImport(null);
    setShowImportModal(true);
  };

  const cerrarModalImportacion = () => {
    if (isImportingCsv) return;
    setShowImportModal(false);
    setArchivoImport(null);
  };

  const manejarImportacion = async () => {
    if (!archivoImport) {
      alert('Selecciona un archivo CSV para importar.');
      return;
    }

    setIsImportingCsv(true);
    try {
      const token = authService.getToken();
      if (!token) {
        alert('No autenticado');
        return;
      }

      await apiClient.importarPiensos(token, idGranja, archivoImport);
      cerrarModalImportacion();
      await cargarAnimales();
      alert('Importación realizada correctamente.');
    } catch (error) {
      console.error('Error importando piensos:', error);
      alert(error instanceof Error ? error.message : 'Error al importar piensos');
    } finally {
      setIsImportingCsv(false);
    }
  };

  const manejarExportacion = async () => {
    setIsExportingCsv(true);
    try {
      const token = authService.getToken();
      if (!token) {
        alert('No autenticado');
        return;
      }

      const blob = await apiClient.exportarPiensos(token, idGranja);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `piensos_${idGranja}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exportando piensos:', error);
      alert(error instanceof Error ? error.message : 'Error al exportar piensos');
    } finally {
      setIsExportingCsv(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <div className="glass-card px-8 py-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-pink-500/20 border border-pink-400/40 flex items-center justify-center">
              <PiggyBank className="h-7 w-7 text-pink-300 animate-bounce" />
            </div>
            <div>
              <p className="text-foreground font-semibold">Cargando piensos...</p>
              <p className="text-sm text-foreground/70">Preparando listado de animales y categorías disponibles.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 ml-64">
        <header className="glass-card px-8 py-6 m-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-600 to-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/30">
                <PiggyBank className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Piensos</h1>
                <p className="text-foreground/70">
                  Organiza los tipos de animales disponibles y sus categorías de alimentación.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={manejarExportacion}
              disabled={isExportingCsv}
              className={`px-6 py-3 glass-surface text-foreground rounded-xl font-semibold transition-all flex items-center gap-2 ${
                isExportingCsv ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
              }`}
            >
              <Download className="h-5 w-5" />
              {isExportingCsv ? 'Exportando...' : 'Exportar'}
            </button>
            <button
              onClick={abrirModalImportacion}
              disabled={!puedeImportar || isImportingCsv}
              className={`px-6 py-3 glass-surface text-foreground rounded-xl font-semibold transition-all flex items-center gap-2 ${
                !puedeImportar || isImportingCsv ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
              }`}
              title={!puedeImportar ? 'La importación solo está disponible cuando no hay piensos cargados' : undefined}
            >
              <Upload className="h-5 w-5" />
              {isImportingCsv ? 'Importando...' : 'Importar'}
            </button>
            <button
              onClick={() => abrirModal()}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:brightness-110 transition-all flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Nuevo pienso
            </button>
          </div>
        </header>
        <div className="max-w-7xl mx-auto p-8 space-y-10">
          <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-card p-6 rounded-2xl">
              <p className="text-sm text-foreground/60 uppercase tracking-wide">Total de piensos</p>
              <p className="text-3xl font-bold text-foreground">{animales.length}</p>
            </div>
            <div className="glass-card p-6 rounded-2xl">
              <p className="text-sm text-foreground/60 uppercase tracking-wide">Categorías registradas</p>
              <p className="text-2xl font-semibold text-foreground">{totalCategorias}</p>
              <p className="text-xs text-foreground/60">Distribuidas en la granja</p>
            </div>
            <div className="glass-card p-6 rounded-2xl">
              <p className="text-sm text-foreground/60 uppercase tracking-wide">Categoría principal</p>
              <p className="text-lg font-semibold text-foreground">
                {categoriaPrincipal ? categoriaPrincipal.categoria : 'Sin datos'}
              </p>
              <p className="text-xs text-foreground/60">
                {categoriaPrincipal ? `${categoriaPrincipal.cantidad} registro(s)` : 'Crea tus primeros piensos'}
              </p>
            </div>
            <div className="glass-card p-6 rounded-2xl">
              <p className="text-sm text-foreground/60 uppercase tracking-wide">Sin categoría</p>
              <p className="text-2xl font-semibold text-foreground">{piensosSinCategoria}</p>
              <p className="text-xs text-foreground/60">Actualiza para mantener consistencia</p>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass-card p-6 rounded-2xl lg:col-span-2">
              <h3 className="text-lg font-semibold text-foreground mb-4">Categorías destacadas</h3>
              {categoriasStats.length === 0 ? (
                <p className="text-sm text-foreground/60">Carga piensos para visualizar la distribución.</p>
              ) : (
                <div className="space-y-3">
                  {categoriasStats.slice(0, 5).map((categoria) => (
                    <div key={categoria.categoria} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{categoria.categoria}</p>
                        <p className="text-xs text-foreground/60">
                          {((categoria.cantidad / Math.max(animales.length, 1)) * 100).toFixed(1)}% del total
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold glass-surface">
                        {categoria.cantidad} registro(s)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="glass-card p-6 rounded-2xl flex flex-col gap-4">
              <h3 className="text-lg font-semibold text-foreground">Buscar piensos</h3>
              <input
                type="text"
                placeholder="Código, descripción o categoría..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="glass-input"
              />
              <p className="text-xs text-foreground/60">
                {animalesFiltrados.length} resultado(s) de {animales.length}
              </p>
            </div>
          </section>

          <section className="glass-card overflow-hidden rounded-2xl border border-white/10">
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
                  {animalesFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-foreground/60">
                        {filtro ? 'No se encontraron resultados' : 'No hay piensos registrados'}
                      </td>
                    </tr>
                  ) : (
                    animalesFiltrados.map((a) => (
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
          </section>
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

      <Modal
        isOpen={showImportModal}
        onClose={cerrarModalImportacion}
        title="Importar Piensos"
        footer={
          <>
            <button
              onClick={cerrarModalImportacion}
              disabled={isImportingCsv}
              className="flex-1 px-6 py-3 rounded-xl font-semibold glass-surface text-foreground hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={manejarImportacion}
              disabled={isImportingCsv || !archivoImport}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImportingCsv ? 'Importando...' : 'Importar'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-foreground/70">
            Importa un archivo CSV con las columnas <code>codigoAnimal</code>, <code>descripcionAnimal</code> y <code>categoriaAnimal</code>.
            Solo se permite importar cuando la lista está vacía.
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={(event) => setArchivoImport(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-foreground/80"
          />
          {archivoImport && <p className="text-xs text-foreground/60">Archivo seleccionado: {archivoImport.name}</p>}
        </div>
      </Modal>
    </div>
  );
}

