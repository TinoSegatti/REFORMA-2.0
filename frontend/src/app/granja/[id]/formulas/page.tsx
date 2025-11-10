'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authService } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import { Modal } from '@/components/ui';
import MateriaPrimaChart from '@/components/charts/MateriaPrimaChart';
import { FileText, Download, Upload, Plus, Trash2, Eye } from 'lucide-react';

interface Animal {
  id: string;
  codigoAnimal: string;
  descripcionAnimal: string;
  categoriaAnimal: string;
}

interface Formula {
  id: string;
  codigoFormula: string;
  descripcionFormula: string;
  fechaCreacion: string;
  costoTotalFormula?: number;
  animal: {
    codigoAnimal: string;
    descripcionAnimal: string;
    categoriaAnimal: string;
  };
}

interface Estadisticas {
  totalFormulas: number;
  materiasMasUtilizadas: Array<{
    codigo: string;
    nombre: string;
    toneladas_totales: number;
  }>;
}

interface FormularioCrearFormula {
  codigoFormula: string;
  descripcionFormula: string;
  idAnimal: string;
}

export default function FormulasPage() {
  const router = useRouter();
  const params = useParams();
  const idGranja = params.id as string;

  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [actualizandoPrecios, setActualizandoPrecios] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [orden, setOrden] = useState<'codigo' | 'costo'>('codigo');
  const [showModal, setShowModal] = useState(false);
  const [showModalEliminar, setShowModalEliminar] = useState(false);
  const [formData, setFormData] = useState<FormularioCrearFormula>({
    codigoFormula: '',
    descripcionFormula: '',
    idAnimal: '',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showModalEliminarTodos, setShowModalEliminarTodos] = useState(false);
  const [confirmacionEliminarTodos, setConfirmacionEliminarTodos] = useState('');
  const [eliminando, setEliminando] = useState<Formula | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [archivoImport, setArchivoImport] = useState<File | null>(null);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [animales, setAnimales] = useState<Animal[]>([]);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    cargarDatos();
  }, [router]);

  const cargarDatos = async () => {
    try {
      const token = authService.getToken();
      if (token) {
        // CARGAR DATOS INMEDIATAMENTE (sin esperar actualización de precios)
        // Esto permite mostrar la interfaz rápidamente
        
        // Cargar fórmulas
        const data = await apiClient.getFormulas(token, idGranja);
        setFormulas(data);

        // Cargar estadísticas
        const stats = await apiClient.getEstadisticasFormulas(token, idGranja);
        setEstadisticas(stats);

        // Cargar animales para el dropdown
        const animalesData = await apiClient.getAnimales(token, idGranja);
        setAnimales(animalesData);

        // Marcar loading como false para mostrar la interfaz
        setLoading(false);

        // ACTUALIZAR PRECIOS EN SEGUNDO PLANO (sin bloquear la UI)
        // El usuario ya puede ver y usar la interfaz mientras se actualizan los precios
        setActualizandoPrecios(true);
        try {
          await apiClient.actualizarPreciosFormulas(token, idGranja);
          
          // Una vez actualizados los precios, recargar los datos para mostrar los nuevos valores
          const dataActualizada = await apiClient.getFormulas(token, idGranja);
          setFormulas(dataActualizada);
          
          const statsActualizada = await apiClient.getEstadisticasFormulas(token, idGranja);
          setEstadisticas(statsActualizada);
        } catch (error) {
          console.error('Error actualizando precios:', error);
          // No afecta la experiencia del usuario si falla
        } finally {
          setActualizandoPrecios(false);
        }
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      setLoading(false);
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

      await apiClient.deleteFormula(token, idGranja, eliminando.id);
      await cargarDatos();
      setShowModalEliminar(false);
      setEliminando(null);
    } catch (error: unknown) {
      console.error('Error eliminando:', error);
      alert(error instanceof Error ? error.message : 'Error al eliminar la fórmula');
    } finally {
      setIsDeleting(false);
    }
  };

  const verDetalle = (formula: Formula) => {
    router.push(`/granja/${idGranja}/formulas/${formula.id}`);
  };

  const exportarDatos = () => {
    alert('Función de exportar próximamente');
  };

  const crearFormula = async () => {
    if (!formData.codigoFormula || !formData.idAnimal) {
      alert('Código de fórmula y pienso son requeridos');
      return;
    }

    if (isCreating) return; // Prevenir múltiples clicks

    setIsCreating(true);
    try {
      const token = authService.getToken();
      if (!token) {
        alert('No autenticado');
        setIsCreating(false);
        return;
      }

      const nuevaFormula = await apiClient.createFormula(token, idGranja, {
        codigoFormula: formData.codigoFormula,
        descripcionFormula: formData.descripcionFormula || '',
        idAnimal: formData.idAnimal,
        detalles: [] // Se llenará en el detalle
      });

      // Cerrar modal y limpiar formulario
      setShowModal(false);
      setFormData({ codigoFormula: '', descripcionFormula: '', idAnimal: '' });
      
      // Redirigir al detalle de la fórmula
      router.push(`/granja/${idGranja}/formulas/${nuevaFormula.id}`);
    } catch (error: unknown) {
      console.error('Error creando fórmula:', error);
      alert(error instanceof Error ? error.message : 'Error al crear la fórmula');
      setIsCreating(false);
    }
  };

  const formulasFiltradas = useMemo(
    () =>
      formulas.filter(
        (f) =>
          f.codigoFormula.toLowerCase().includes(filtro.toLowerCase()) ||
          f.descripcionFormula.toLowerCase().includes(filtro.toLowerCase())
      ),
    [formulas, filtro]
  );

  const animalsSummary = useMemo(() => {
    const conteo = new Map<string, { descripcion: string; count: number }>();
    formulas.forEach((f) => {
      const key = f.animal.codigoAnimal;
      if (!conteo.has(key)) {
        conteo.set(key, { descripcion: f.animal.descripcionAnimal, count: 0 });
      }
      conteo.get(key)!.count += 1;
    });
    return Array.from(conteo.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [formulas]);

  const puedeImportar = formulas.length === 0;

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

      await apiClient.importarFormulas(token, idGranja, archivoImport);
      cerrarModalImportacion();
      await cargarDatos();
      alert('Importación de fórmulas realizada correctamente.');
    } catch (error) {
      console.error('Error importando fórmulas:', error);
      alert(error instanceof Error ? error.message : 'Error al importar fórmulas');
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

      const blob = await apiClient.exportarFormulas(token, idGranja);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `formulas_${idGranja}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exportando fórmulas:', error);
      alert(error instanceof Error ? error.message : 'Error al exportar fórmulas');
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
            <div className="w-12 h-12 rounded-full bg-teal-500/20 border border-teal-400/40 flex items-center justify-center">
              <FileText className="h-7 w-7 text-teal-300 animate-bounce" />
            </div>
            <div>
              <p className="text-foreground font-semibold">Cargando fórmulas...</p>
              <p className="text-sm text-foreground/70">Preparando la información y estadísticas de tus fórmulas.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const formatCurrency = (n: number) =>
    Number(n).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 ml-64">
        <header className="glass-card px-8 py-6 m-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/30">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Fórmulas de alimentación</h1>
                <p className="text-foreground/70">
                  Visualiza y gestiona las fórmulas para tus animales. Monitorea el costo y materias primas involucradas.
                </p>
              </div>
            </div>
            {actualizandoPrecios && (
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg w-fit">
                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium text-purple-300">Actualizando precios...</span>
              </div>
            )}
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
              title={!puedeImportar ? 'La importación solo está disponible cuando no hay fórmulas registradas' : undefined}
            >
              <Upload className="h-5 w-5" />
              {isImportingCsv ? 'Importando...' : 'Importar'}
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:brightness-110 transition-all flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Nueva fórmula
            </button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-8 space-y-10">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground/60">Total de fórmulas</p>
                <p className="text-3xl font-bold text-foreground">{estadisticas?.totalFormulas || 0}</p>
              </div>
            </div>
            <div className="glass-card p-6 rounded-2xl space-y-3 md:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Materias primas más utilizadas</h3>
                <span className="text-xs text-foreground/60">
                  {estadisticas?.materiasMasUtilizadas?.length || 0} registro(s)
                </span>
              </div>
              <MateriaPrimaChart data={estadisticas?.materiasMasUtilizadas || []} />
            </div>
          </section>

          <section className="glass-card p-6 rounded-2xl grid gap-6 md:grid-cols-[2fr_1fr]">
            <div>
              <label className="text-sm text-foreground/70 mb-2 block">Buscar fórmulas</label>
              <input
                type="text"
                placeholder="Buscar por código o descripción..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="glass-input"
              />
              <p className="text-xs text-foreground/60 mt-2">
                {formulasFiltradas.length} resultado(s) de {formulas.length}
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-foreground/60 uppercase tracking-wide">Animales cubiertos</p>
              {animalsSummary.length === 0 ? (
                <p className="text-sm text-foreground/60">
                  Aún no hay fórmulas cargadas para calcular este resumen.
                </p>
              ) : (
                <ul className="space-y-2">
                  {animalsSummary.map((animal, index) => (
                    <li key={`${animal.descripcion}-${index}`} className="flex items-center justify-between text-sm">
                      <span className="text-foreground font-medium">{animal.descripcion}</span>
                      <span className="text-foreground/60">{animal.count} fórmula(s)</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="glass-card overflow-hidden rounded-2xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-foreground/80">Código</th>
                    <th className="px-6 py-4 text-left font-semibold text-foreground/80">Descripción</th>
                    <th className="px-6 py-4 text-left font-semibold text-foreground/80">Animal</th>
                    <th className="px-6 py-4 text-left font-semibold text-foreground/80">Costo Total</th>
                    <th className="px-6 py-4 text-left font-semibold text-foreground/80">Fecha</th>
                    <th className="px-6 py-4 text-center font-semibold text-foreground/80">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {formulasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-foreground/60">
                        {filtro ? 'No se encontraron resultados' : 'No hay fórmulas registradas'}
                      </td>
                    </tr>
                  ) : (
                    formulasFiltradas.map((f) => (
                      <tr key={f.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-foreground font-medium">{f.codigoFormula}</td>
                        <td className="px-6 py-4 text-foreground/90">{f.descripcionFormula}</td>
                        <td className="px-6 py-4 text-foreground/90">
                          <div>
                            <p className="font-medium">{f.animal.descripcionAnimal}</p>
                            <p className="text-sm text-foreground/60">{f.animal.categoriaAnimal}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-foreground/90 font-medium whitespace-nowrap">
                          {formatCurrency(f.costoTotalFormula || 0)}
                        </td>
                        <td className="px-6 py-4 text-foreground/90">
                          {new Date(f.fechaCreacion).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => verDetalle(f)}
                              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold hover:shadow-md transition-all text-sm flex items-center gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              Detalle
                            </button>
                            <button
                              onClick={() => {
                                setEliminando(f);
                                setShowModalEliminar(true);
                              }}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm flex items-center gap-1"
                            >
                              <Trash2 className="h-4 w-4" />
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

      {/* Modal Crear Fórmula */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          if (!isCreating) {
            setShowModal(false);
            setIsCreating(false);
          }
        }}
        title="Nueva Fórmula"
        footer={
          <>
            <button
              onClick={() => {
                setShowModal(false);
                setIsCreating(false);
              }}
              disabled={isCreating}
              className="flex-1 px-6 py-3 rounded-xl font-semibold glass-surface text-foreground hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={crearFormula}
              disabled={isCreating}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creando...
                </>
              ) : (
                'Crear'
              )}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground/80 mb-2">
              Código de Fórmula *
            </label>
            <input
              type="text"
              value={formData.codigoFormula}
              onChange={(e) => setFormData({ ...formData, codigoFormula: e.target.value })}
              placeholder="Ej: F001"
              className="glass-input"
              disabled={isCreating}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground/80 mb-2">
              Descripción (Opcional)
            </label>
            <input
              type="text"
              value={formData.descripcionFormula}
              onChange={(e) => setFormData({ ...formData, descripcionFormula: e.target.value })}
              placeholder="Ej: Fórmula para lechones"
              className="glass-input"
              disabled={isCreating}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground/80 mb-2">
              Pienso *
            </label>
            <select
              value={formData.idAnimal}
              onChange={(e) => setFormData({ ...formData, idAnimal: e.target.value })}
              className="glass-input"
              disabled={isCreating}
            >
              <option value="">Seleccionar pienso...</option>
              {animales.map((animal) => (
                <option key={animal.id} value={animal.id}>
                  {animal.codigoAnimal} - {animal.descripcionAnimal} ({animal.categoriaAnimal})
                </option>
              ))}
            </select>
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
        title="Eliminar Fórmula"
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
          ¿Está seguro de que desea eliminar la fórmula <strong>{eliminando?.descripcionFormula}</strong>?
          <br />
          Esta acción no se puede deshacer.
        </p>
      </Modal>

      <Modal
        isOpen={showImportModal}
        onClose={cerrarModalImportacion}
        title="Importar Fórmulas"
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
            El archivo CSV debe contener filas con <code>tipo</code> igual a <strong>CABECERA</strong> o <strong>DETALLE</strong>.
            Para las cabeceras se requieren las columnas <code>codigoFormula</code>, <code>descripcionFormula</code>,
            <code> codigoAnimal</code> y <code>pesoTotalFormula</code>. Para los detalles se requieren <code>codigoFormula</code>,
            <code> codigoMateriaPrima</code>, <code>cantidadKg</code> y <code>porcentajeFormula</code>.
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
