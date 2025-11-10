'use client';

import { useEffect, useMemo, useState } from 'react';
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
  const [showImportModal, setShowImportModal] = useState(false);
  const [archivoImport, setArchivoImport] = useState<File | null>(null);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
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

  const materiaStats = useMemo(() => {
    const sinPrecio = materiasPrimas.filter((mp) => !mp.precioPorKilo || mp.precioPorKilo <= 0);
    const conPrecio = materiasPrimas.filter((mp) => mp.precioPorKilo && mp.precioPorKilo > 0);
    const ordenadasPorPrecio = [...conPrecio].sort((a, b) => b.precioPorKilo - a.precioPorKilo);
    const promedioPrecio = conPrecio.length
      ? conPrecio.reduce((acc, mp) => acc + (mp.precioPorKilo || 0), 0) / conPrecio.length
      : 0;

    return {
      total: materiasPrimas.length,
      sinPrecio,
      promedioPrecio,
      topListado: ordenadasPorPrecio.slice(0, 5),
      materiaPrecioMaximo: ordenadasPorPrecio[0] || null,
    };
  }, [materiasPrimas]);

  const {
    total,
    sinPrecio: materiasSinPrecio,
    promedioPrecio,
    topListado,
    materiaPrecioMaximo,
  } = materiaStats;

  const sinPrecioPreview = materiasSinPrecio.slice(0, 3);
  const topListadoPreview = topListado.slice(0, 3);

  const materiasFiltradas = materiasPrimas.filter((m) =>
    m.codigo.toLowerCase().includes(filtro.toLowerCase()) ||
    m.nombre.toLowerCase().includes(filtro.toLowerCase())
  );

  const formatCurrency = (n: number) => Number(n).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });

  const puedeImportar = materiasPrimas.length === 0;

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

      await apiClient.importarMateriasPrimas(token, idGranja, archivoImport);
      cerrarModalImportacion();
      await cargarMateriasPrimas();
      alert('Importación realizada correctamente.');
    } catch (error) {
      console.error('Error importando CSV:', error);
      alert(error instanceof Error ? error.message : 'Error al importar CSV');
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

      const blob = await apiClient.exportarMateriasPrimas(token, idGranja);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `materias_primas_${idGranja}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exportando CSV:', error);
      alert(error instanceof Error ? error.message : 'Error al exportar CSV');
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
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
              <Sprout className="h-7 w-7 text-emerald-300 animate-bounce" />
            </div>
            <div>
              <p className="text-foreground font-semibold">Cargando Materias Primas</p>
              <p className="text-sm text-foreground/70">Preparando catálogo de materias primas...</p>
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
          <div className="space-y-5">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                Materias Primas
                <Sprout className="h-8 w-8 text-emerald-400" />
              </h1>
              <p className="text-foreground/70 mt-2 max-w-2xl">
                Consulta tu catálogo completo, detecta materias sin precio y mantén la información lista para futuras compras y fabricaciones.
              </p>
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
                {isExportingCsv ? 'Exportando...' : 'Exportar Datos'}
              </button>
              <button
                onClick={abrirModalImportacion}
                disabled={!puedeImportar || isImportingCsv}
                className={`px-6 py-3 glass-surface text-foreground rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  !puedeImportar || isImportingCsv ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
                }`}
                title={!puedeImportar ? 'La importación solo está disponible cuando no hay datos cargados' : undefined}
              >
                <Upload className="h-5 w-5" />
                {isImportingCsv ? 'Importando...' : 'Importar CSV'}
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
          <div className="glass-card px-5 py-4 border border-white/10 rounded-2xl backdrop-blur-xl max-w-sm">
            <p className="text-sm text-foreground/60 uppercase tracking-wide">Sugerencia</p>
            <p className="text-sm text-foreground/80 mt-2">
              Asigna precios apenas recibas nuevas compras para mantener cálculos de inventario y fórmulas siempre alineados.
            </p>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-8 space-y-10">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground/60">Total registradas</p>
                <p className="text-3xl font-bold text-foreground">{total}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Sprout className="h-7 w-7 text-white" />
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground/60">Sin precio asignado</p>
                  <p className="text-2xl font-semibold text-foreground">{materiasSinPrecio.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-foreground/70 font-semibold">
                  $
                </div>
              </div>
              {materiasSinPrecio.length === 0 ? (
                <p className="text-sm text-foreground/60">Todas las materias primas tienen precio actualizado.</p>
              ) : (
                <div className="space-y-2">
                  {sinPrecioPreview.map((mp) => (
                    <div key={mp.id} className="flex items-center justify-between glass-surface px-3 py-2 rounded-lg border border-white/10">
                      <span className="text-sm font-medium text-foreground/80 truncate">{mp.nombre}</span>
                      <span className="text-xs text-foreground/50 font-semibold">{mp.codigo}</span>
                    </div>
                  ))}
                  {materiasSinPrecio.length > sinPrecioPreview.length && (
                    <p className="text-xs text-foreground/50">
                      +{materiasSinPrecio.length - sinPrecioPreview.length} materia(s) adicional(es) sin precio
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="glass-card p-6 rounded-2xl space-y-3">
              <p className="text-sm text-foreground/60">Mayor precio registrado</p>
              <div>
                {materiaPrecioMaximo ? (
                  <>
                    <p className="text-lg font-semibold text-foreground">{materiaPrecioMaximo.nombre}</p>
                    <p className="text-sm text-foreground/60">{materiaPrecioMaximo.codigo}</p>
                    <p className="text-xl font-bold text-foreground mt-2">
                      {formatCurrency(materiaPrecioMaximo.precioPorKilo)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-foreground/60">Aún no hay precios registrados.</p>
                )}
              </div>
              <div className="pt-2 border-t border-white/10 text-sm text-foreground/70">
                Precio promedio: {promedioPrecio > 0 ? formatCurrency(promedioPrecio) : '-'}
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
            <div className="glass-card p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Buscar por código o nombre..."
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    className="glass-input"
                  />
                </div>
                <p className="text-sm text-foreground/60">
                  {materiasFiltradas.length} resultado(s) de {total}
                </p>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/10">
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
                          {filtro ? 'No se encontraron resultados con ese criterio' : 'No hay materias primas registradas'}
                        </td>
                      </tr>
                    ) : (
                      materiasFiltradas.map((m) => (
                        <tr key={m.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
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

            <div className="space-y-6">
              <div className="glass-card p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Materias sin precio</h3>
                  {materiasSinPrecio.length > 0 && (
                    <span className="text-xs px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                      Prioridad
                    </span>
                  )}
                </div>
                {materiasSinPrecio.length === 0 ? (
                  <p className="text-sm text-foreground/60">Excelente, todas tus materias primas tienen precio asignado.</p>
                ) : (
                  <div className="space-y-3">
                    {materiasSinPrecio.map((mp) => (
                      <div key={mp.id} className="glass-surface px-4 py-3 rounded-xl border border-white/10 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{mp.nombre}</p>
                          <p className="text-xs text-foreground/50">{mp.codigo}</p>
                        </div>
                        <button
                          onClick={() => abrirModal(mp)}
                          className="text-xs font-semibold text-purple-300 hover:text-purple-200 transition-colors"
                        >
                          Asignar precio
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass-card p-6 rounded-2xl space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Top precios</h3>
                {topListado.length === 0 ? (
                  <p className="text-sm text-foreground/60">Registra precios para ver el ranking de materias más costosas.</p>
                ) : (
                  <div className="space-y-3">
                    {topListadoPreview.map((mp, index) => (
                      <div key={mp.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-purple-300">{index + 1}.</span>
                          <div>
                            <p className="text-sm text-foreground font-semibold">{mp.nombre}</p>
                            <p className="text-xs text-foreground/60">{mp.codigo}</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-foreground/80">
                          {formatCurrency(mp.precioPorKilo)}
                        </span>
                      </div>
                    ))}
                    {topListado.length > topListadoPreview.length && (
                      <p className="text-xs text-foreground/50">
                        +{topListado.length - topListadoPreview.length} materia(s) adicional(es)
                      </p>
                    )}
                  </div>
                )}
              </div>
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

      <Modal
        isOpen={showImportModal}
        onClose={cerrarModalImportacion}
        title="Importar Materias Primas"
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
            Selecciona un archivo CSV con las columnas <code>codigoMateriaPrima</code>, <code>nombreMateriaPrima</code> y
            <code> precioPorKilo</code>. Esta acción solo está disponible cuando no hay materias primas cargadas.
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={(event) => setArchivoImport(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-foreground/80"
          />
          {archivoImport && (
            <p className="text-xs text-foreground/60">Archivo seleccionado: {archivoImport.name}</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
