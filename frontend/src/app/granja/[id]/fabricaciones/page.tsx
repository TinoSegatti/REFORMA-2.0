'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { authService } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { Modal } from '@/components/ui';
import { Download, Plus, Factory, Calendar, AlertCircle, Archive, RotateCcw } from 'lucide-react';
import FabricacionesMateriasChart from '@/components/charts/FabricacionesMateriasChart';
import FabricacionesFormulasChart from '@/components/charts/FabricacionesFormulasChart';

interface DetalleFabricacion {
  id: string;
  cantidadUsada: number;
  precioUnitario: number;
  costoParcial: number;
  materiaPrima: {
    codigoMateriaPrima: string;
    nombreMateriaPrima: string;
  };
}

interface Fabricacion {
  id: string;
  idFormula: string;
  descripcionFabricacion: string;
  cantidadFabricacion: number;
  costoTotalFabricacion: number;
  costoPorKilo: number;
  fechaFabricacion: string;
  sinExistencias: boolean;
  observaciones?: string | null;
  formula: {
    codigoFormula: string;
    descripcionFormula: string;
  };
  detallesFabricacion?: DetalleFabricacion[];
}

interface FabricacionEliminada extends Omit<Fabricacion, 'detallesFabricacion'> {
  usuario?: {
    nombreUsuario: string;
    apellidoUsuario: string;
  };
  fechaEliminacion: string | null;
}

interface Estadisticas {
  totalFabricaciones: number;
  totalKgFabricados: number;
  totalCosto: number;
  fabricacionesSinExistencias: number;
  promedioCostoPorKg: number;
  materiasMasUtilizadas: Array<{
    codigo: string;
    nombre: string;
    cantidadTotal: number;
  }>;
  formulasMasProducidas: Array<{
    codigo: string;
    descripcion: string;
    toneladasTotales: number;
  }>;
}

interface Formula {
  id: string;
  codigoFormula: string;
  descripcionFormula: string;
}

export default function FabricacionesPage() {
  const router = useRouter();
  const params = useParams();
  const idGranja = params.id as string;

  const [user, setUser] = useState<{ id: string; email: string; tipoUsuario: string } | null>(null);
  const [fabricaciones, setFabricaciones] = useState<Fabricacion[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(true);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [formulaFiltro, setFormulaFiltro] = useState('');
  const [showNueva, setShowNueva] = useState(false);
  const [showModalEliminar, setShowModalEliminar] = useState(false);
  const [fabricacionAEliminar, setFabricacionAEliminar] = useState<Fabricacion | null>(null);
  const [showModalEditar, setShowModalEditar] = useState(false);
  const [fabricacionAEditar, setFabricacionAEditar] = useState<Fabricacion | null>(null);
  const [showModalEliminarTodas, setShowModalEliminarTodas] = useState(false);
  const [confirmacionTexto, setConfirmacionTexto] = useState('');
  const [showEliminadas, setShowEliminadas] = useState(false);
  const [fabricacionesEliminadas, setFabricacionesEliminadas] = useState<FabricacionEliminada[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [restaurandoId, setRestaurandoId] = useState<string | null>(null);
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    setUser(authService.getUser());
    cargarDatos();
  }, [router, idGranja]);

  const formatCurrency = (n: number) => Number(n).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };
  const formatNumber = (n: number) => Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const cargarDatos = async () => {
    try {
      const token = authService.getToken();
      if (!token) return;
      
      const [fabricacionesData, stats, formulasData] = await Promise.all([
        apiClient.getFabricaciones(token, idGranja, { desde, hasta, descripcionFormula: formulaFiltro }),
        apiClient.getEstadisticasFabricaciones(token, idGranja),
        apiClient.getFormulas(token, idGranja),
      ]);
      setFabricaciones(fabricacionesData);
      setEstadisticas(stats);
      setFormulas(formulasData);
    } catch (e) {
      console.error('Error cargando datos:', e);
      setFabricaciones([]);
      setEstadisticas({
        totalFabricaciones: 0,
        totalKgFabricados: 0,
        totalCosto: 0,
        fabricacionesSinExistencias: 0,
        promedioCostoPorKg: 0,
        materiasMasUtilizadas: [],
        formulasMasProducidas: []
      });
    } finally {
      setLoading(false);
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

      const blob = await apiClient.exportarFabricaciones(token, idGranja);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fabricaciones_${idGranja}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exportando fabricaciones:', error);
      alert(error instanceof Error ? error.message : 'Error al exportar fabricaciones');
    } finally {
      setIsExportingCsv(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      cargarDatos();
    }
  }, [desde, hasta, formulaFiltro]);

  const fabricacionesFiltradas = useMemo(
    () =>
      fabricaciones.filter((fab) => {
        const texto = formulaFiltro.toLowerCase();
        if (!texto) return true;
        return (
          fab.descripcionFabricacion.toLowerCase().includes(texto) ||
          fab.formula.descripcionFormula.toLowerCase().includes(texto) ||
          fab.formula.codigoFormula.toLowerCase().includes(texto)
        );
      }),
    [fabricaciones, formulaFiltro]
  );

  const totalFabricaciones = estadisticas?.totalFabricaciones ?? fabricaciones.length;
  const totalKgFabricados =
    estadisticas?.totalKgFabricados ??
    fabricaciones.reduce((acum, fab) => acum + (fab.cantidadFabricacion || 0), 0);
  const totalCosto =
    estadisticas?.totalCosto ??
    fabricaciones.reduce((acum, fab) => acum + (fab.costoTotalFabricacion || 0), 0);
  const sinExistencias =
    estadisticas?.fabricacionesSinExistencias ?? fabricaciones.filter((fab) => fab.sinExistencias).length;

  const handleEliminar = async () => {
    if (!fabricacionAEliminar) return;
    if (isDeleting) return; // Prevenir múltiples clicks

    setIsDeleting(true);
    try {
      const token = authService.getToken();
      if (!token) {
        alert('No autenticado');
        setIsDeleting(false);
        return;
      }

      await apiClient.eliminarFabricacion(token, fabricacionAEliminar.id);
      
      setShowModalEliminar(false);
      setFabricacionAEliminar(null);
      
      await cargarDatos();
    } catch (error: unknown) {
      console.error('Error eliminando fabricación:', error);
      alert(error instanceof Error ? error.message : 'Error al eliminar fabricación');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditar = (fabricacion: Fabricacion) => {
    setFabricacionAEditar(fabricacion);
    setShowModalEditar(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <div className="glass-card px-8 py-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-400/40 flex items-center justify-center">
              <Factory className="h-7 w-7 text-purple-300 animate-bounce" />
            </div>
            <div>
              <p className="text-foreground font-semibold">Cargando fabricaciones...</p>
              <p className="text-sm text-foreground/70">Recuperando producción y estadísticas recientes.</p>
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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Factory className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Fabricaciones</h1>
                <p className="text-foreground/70">
                  Controla la producción, analiza los costos y revisa qué fórmulas y materias primas tienen mayor demanda.
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
              onClick={() => setShowModalEliminarTodas(true)}
              className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all flex items-center gap-2"
            >
              <AlertCircle className="h-5 w-5" />
              Eliminar todas
            </button>
            <button
              onClick={() => setShowNueva(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:brightness-110 transition-all flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Nueva fabricación
            </button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-8 space-y-10">
          <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-card p-6 rounded-2xl">
              <p className="text-sm text-foreground/60 uppercase tracking-wide">Total fabricaciones</p>
              <p className="text-3xl font-bold text-foreground">{totalFabricaciones}</p>
            </div>
            <div className="glass-card p-6 rounded-2xl">
              <p className="text-sm text-foreground/60 uppercase tracking-wide">Kg fabricados</p>
              <p className="text-2xl font-semibold text-foreground">
                {formatNumber(totalKgFabricados)}
              </p>
              <p className="text-xs text-foreground/60">Incluye todas las órdenes registradas</p>
            </div>
            <div className="glass-card p-6 rounded-2xl">
              <p className="text-sm text-foreground/60 uppercase tracking-wide">Costo total</p>
              <p className="text-2xl font-semibold text-foreground">
                {formatCurrency(totalCosto)}
              </p>
              <p className="text-xs text-foreground/60">
                Promedio {formatCurrency((totalCosto || 0) / Math.max(totalFabricaciones, 1))} por fabricación
              </p>
            </div>
            <div className="glass-card p-6 rounded-2xl">
              <p className="text-sm text-foreground/60 uppercase tracking-wide">Sin existencias</p>
              <p className="text-2xl font-semibold text-foreground">
                {sinExistencias}
              </p>
              <p className="text-xs text-foreground/60">Órdenes marcadas sin stock disponible</p>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Materias primas más utilizadas</h3>
                <span className="text-xs text-foreground/60">
                  {estadisticas?.materiasMasUtilizadas.length || 0} registro(s)
                </span>
              </div>
              <FabricacionesMateriasChart data={estadisticas?.materiasMasUtilizadas || []} />
            </div>
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Fórmulas más producidas</h3>
                <span className="text-xs text-foreground/60">
                  {estadisticas?.formulasMasProducidas.length || 0} registro(s)
                </span>
              </div>
              <FabricacionesFormulasChart data={estadisticas?.formulasMasProducidas || []} />
            </div>
          </section>

          <section className="glass-card p-6 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-foreground/70 mb-2">Fecha desde</label>
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="glass-input"
              />
            </div>
            <div>
              <label className="block text-sm text-foreground/70 mb-2">Fecha hasta</label>
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="glass-input"
              />
            </div>
            <div>
              <label className="block text-sm text-foreground/70 mb-2">Fórmula o descripción</label>
              <input
                type="text"
                value={formulaFiltro}
                onChange={(e) => setFormulaFiltro(e.target.value)}
                placeholder="Buscar por código o descripción..."
                className="glass-input"
              />
            </div>
            <div className="flex items-end">
              <p className="text-sm text-foreground/60">
                {fabricacionesFiltradas.length} resultado(s) de {fabricaciones.length}
              </p>
            </div>
          </section>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              {showEliminadas ? (
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-4 px-6 pt-6">Fabricaciones Eliminadas</h3>
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-6 py-4 text-left font-semibold text-foreground/80">Fecha</th>
                        <th className="px-6 py-4 text-left font-semibold text-foreground/80">Desc. Fórmula</th>
                        <th className="px-6 py-4 text-left font-semibold text-foreground/80">Desc. Fabricación</th>
                        <th className="px-6 py-4 text-left font-semibold text-foreground/80">Cant. Fabricada (T)</th>
                        <th className="px-6 py-4 text-left font-semibold text-foreground/80">Eliminada por</th>
                        <th className="px-6 py-4 text-left font-semibold text-foreground/80">Fecha Eliminación</th>
                        <th className="px-6 py-4 text-left font-semibold text-foreground/80">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {fabricacionesEliminadas.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-foreground/60">
                            No hay fabricaciones eliminadas
                          </td>
                        </tr>
                      ) : (
                        fabricacionesEliminadas.map((fabricacion) => (
                          <tr key={fabricacion.id} className="hover:bg-white/5">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                              {formatDate(fabricacion.fechaFabricacion)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                              {fabricacion.formula?.descripcionFormula || '-'}
                            </td>
                            <td className="px-6 py-4 text-sm text-foreground">
                              {fabricacion.descripcionFabricacion}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                              {formatNumber(fabricacion.cantidadFabricacion / 1000)}
                            </td>
                            <td className="px-6 py-4 text-sm text-foreground">
                              {fabricacion.usuario ? `${fabricacion.usuario.nombreUsuario} ${fabricacion.usuario.apellidoUsuario}` : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                              {fabricacion.fechaEliminacion ? formatDate(fabricacion.fechaEliminacion) : '-'}
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={async () => {
                                  if (restaurandoId === fabricacion.id) return; // Prevenir múltiples clicks
                                  setRestaurandoId(fabricacion.id);
                                  try {
                                    const token = authService.getToken();
                                    if (!token) {
                                      alert('No autenticado');
                                      setRestaurandoId(null);
                                      return;
                                    }
                                    await apiClient.restaurarFabricacion(token, fabricacion.id);
                                    await cargarDatos();
                                    const eliminadas = await apiClient.obtenerFabricacionesEliminadas(token, idGranja);
                                    setFabricacionesEliminadas(eliminadas);
                                    alert('Fabricación restaurada exitosamente');
                                  } catch (error: unknown) {
                                    console.error('Error restaurando fabricación:', error);
                                    alert(error instanceof Error ? error.message : 'Error al restaurar fabricación');
                                  } finally {
                                    setRestaurandoId(null);
                                  }
                                }}
                                disabled={restaurandoId === fabricacion.id}
                                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/30 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {restaurandoId === fabricacion.id ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Restaurando...
                                  </>
                                ) : (
                                  <>
                                    <RotateCcw className="h-4 w-4" />
                                    Restaurar
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold text-foreground/80">Fecha</th>
                      <th className="px-6 py-4 text-left font-semibold text-foreground/80">Desc. Fórmula</th>
                      <th className="px-6 py-4 text-left font-semibold text-foreground/80">Desc. Fabricación</th>
                      <th className="px-6 py-4 text-left font-semibold text-foreground/80">Cant. Fabricada (T)</th>
                      <th className="px-6 py-4 text-left font-semibold text-foreground/80">Costo/kg</th>
                      <th className="px-6 py-4 text-left font-semibold text-foreground/80">Costo Total</th>
                      <th className="px-6 py-4 text-left font-semibold text-foreground/80">Sin Existencias</th>
                      <th className="px-6 py-4 text-left font-semibold text-foreground/80">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {fabricacionesFiltradas.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-foreground/60">
                          <Factory className="h-12 w-12 mx-auto mb-4 text-foreground/40" />
                          <p>No hay fabricaciones registradas</p>
                        </td>
                      </tr>
                    ) : (
                      fabricacionesFiltradas.map((fabricacion) => (
                        <tr key={fabricacion.id} className="hover:bg-white/5">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {formatDate(fabricacion.fechaFabricacion)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {fabricacion.formula.descripcionFormula}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {fabricacion.descripcionFabricacion}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {formatNumber(fabricacion.cantidadFabricacion / 1000)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {formatCurrency(fabricacion.costoPorKilo)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                            {formatCurrency(fabricacion.costoTotalFabricacion)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {fabricacion.sinExistencias ? (
                              <span className="px-2 py-1 text-xs font-medium bg-red-500/20 text-red-300 rounded-full">
                                SÍ
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-300 rounded-full">
                                NO
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditar(fabricacion)}
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all text-sm"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => {
                                  setFabricacionAEliminar(fabricacion);
                                  setShowModalEliminar(true);
                                }}
                                className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/30 transition-all text-sm"
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
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal Nueva Fabricación */}
      {showNueva && (
        <ModalNuevaFabricacion
          isOpen={showNueva}
          onClose={() => setShowNueva(false)}
          onSuccess={() => {
            setShowNueva(false);
            cargarDatos();
          }}
          idGranja={idGranja}
          formulas={formulas}
        />
      )}

      {/* Modal Eliminar Todas las Fabricaciones */}
      {showModalEliminarTodas && (
        <Modal
          isOpen={showModalEliminarTodas}
          onClose={() => {
            setShowModalEliminarTodas(false);
            setConfirmacionTexto('');
          }}
          title="⚠️ Eliminar Todas las Fabricaciones"
          size="lg"
        >
          <div className="space-y-6">
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-300 font-semibold mb-2">⚠️ ADVERTENCIA CRÍTICA</p>
              <ul className="text-foreground/90 text-sm space-y-1 list-disc list-inside">
                <li>Esta operación eliminará TODAS las fabricaciones registradas en la granja</li>
                <li>Impactará directamente en el inventario, restaurando las cantidades de materias primas</li>
                <li>Esta acción NO es reversible</li>
                <li>Las cantidades de inventario volverán a sumarse como si nunca se hubieran fabricado productos</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/90 mb-2">
                Para confirmar, escriba exactamente:
              </label>
              <p className="text-sm font-mono bg-green-500/20 border border-green-500/30 p-3 rounded-lg mb-3 text-green-300">
                SI DESEO ELIMINAR TODAS LAS FABRICACIONES REGISTRADAS
              </p>
              <input
                type="text"
                value={confirmacionTexto}
                onChange={(e) => setConfirmacionTexto(e.target.value)}
                className="glass-input w-full"
                placeholder="Escriba el texto de confirmación..."
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowModalEliminarTodas(false);
                  setConfirmacionTexto('');
                  setIsDeletingAll(false);
                }}
                className="px-6 py-3 glass-surface text-foreground rounded-xl font-semibold hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isDeletingAll}
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (confirmacionTexto !== 'SI DESEO ELIMINAR TODAS LAS FABRICACIONES REGISTRADAS') {
                    alert('El texto de confirmación no coincide. Por favor, escriba exactamente: "SI DESEO ELIMINAR TODAS LAS FABRICACIONES REGISTRADAS"');
                    return;
                  }
                  if (isDeletingAll) return; // Prevenir múltiples clicks

                  setIsDeletingAll(true);
                  try {
                    const token = authService.getToken();
                    if (!token) {
                      alert('No autenticado');
                      setIsDeletingAll(false);
                      return;
                    }

                    await apiClient.eliminarTodasLasFabricaciones(token, idGranja, confirmacionTexto);
                    
                    setShowModalEliminarTodas(false);
                    setConfirmacionTexto('');
                    
                    await cargarDatos();
                    alert('Todas las fabricaciones han sido eliminadas exitosamente');
                  } catch (error: unknown) {
                    console.error('Error eliminando todas las fabricaciones:', error);
                    alert(error instanceof Error ? error.message : 'Error al eliminar todas las fabricaciones');
                  } finally {
                    setIsDeletingAll(false);
                  }
                }}
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={confirmacionTexto !== 'SI DESEO ELIMINAR TODAS LAS FABRICACIONES REGISTRADAS' || isDeletingAll}
              >
                {isDeletingAll ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Eliminando...
                  </>
                ) : (
                  'Eliminar Todas las Fabricaciones'
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Editar Fabricación */}
      {showModalEditar && fabricacionAEditar && (
        <ModalEditarFabricacion
          isOpen={showModalEditar}
          onClose={() => {
            setShowModalEditar(false);
            setFabricacionAEditar(null);
          }}
          onSuccess={() => {
            setShowModalEditar(false);
            setFabricacionAEditar(null);
            cargarDatos();
          }}
          fabricacion={fabricacionAEditar}
          formulas={formulas}
        />
      )}

      {/* Modal Eliminar */}
      {showModalEliminar && fabricacionAEliminar && (
        <Modal
          isOpen={showModalEliminar}
          onClose={() => {
            setShowModalEliminar(false);
            setFabricacionAEliminar(null);
          }}
          title="Confirmar Eliminación"
        >
          <div className="space-y-6">
            <p className="text-foreground/90">
              ¿Estás seguro de que deseas eliminar esta fabricación?
            </p>
            <p className="text-sm text-foreground/70">
              Esta acción afectará el inventario y no se puede deshacer.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowModalEliminar(false);
                  setFabricacionAEliminar(null);
                  setIsDeleting(false);
                }}
                className="px-6 py-3 glass-surface text-foreground rounded-xl font-semibold hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminar}
                disabled={isDeleting}
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Componentes de Modales
function ModalNuevaFabricacion({
  isOpen,
  onClose,
  onSuccess,
  idGranja,
  formulas,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  idGranja: string;
  formulas: Formula[];
}) {
  const [formData, setFormData] = useState({
    idFormula: '',
    descripcionFabricacion: '',
    cantidadFabricacion: '',
    fechaFabricacion: new Date().toISOString().split('T')[0],
    observaciones: '',
  });
  const [loading, setLoading] = useState(false);
  const [showAdvertenciaExistencias, setShowAdvertenciaExistencias] = useState(false);
  const [infoExistencias, setInfoExistencias] = useState<{
    tieneFaltantes: boolean;
    faltantes: Array<{
      codigoMateriaPrima: string;
      nombreMateriaPrima: string;
      cantidadNecesaria: number;
      cantidadDisponible: number;
      falta: number;
    }>;
    codigoFormula: string;
    descripcionFormula: string;
  } | null>(null);

  const formatNumber = (n: number) => Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.idFormula || !formData.descripcionFabricacion || !formData.cantidadFabricacion) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      const token = authService.getToken();
      if (!token) {
        alert('No autenticado');
        setLoading(false);
        return;
      }

      // Verificar existencias antes de crear
      const verificacion = await apiClient.verificarExistenciasFabricacion(token, {
        idGranja,
        idFormula: formData.idFormula,
        cantidadFabricacion: parseFloat(formData.cantidadFabricacion),
      });

      // Si hay faltantes, mostrar advertencia
      if (verificacion.tieneFaltantes) {
        setInfoExistencias(verificacion);
        setShowAdvertenciaExistencias(true);
        setLoading(false);
        return;
      }

      // Si no hay faltantes, crear directamente
      await crearFabricacionConfirmada();
    } catch (error: unknown) {
      console.error('Error verificando existencias:', error);
      alert(error instanceof Error ? error.message : 'Error al verificar existencias');
      setLoading(false);
    }
  };

  const crearFabricacionConfirmada = async () => {
    setLoading(true);
    try {
      const token = authService.getToken();
      if (!token) {
        alert('No autenticado');
        setLoading(false);
        return;
      }

      await apiClient.crearFabricacion(token, {
        idGranja,
        idFormula: formData.idFormula,
        descripcionFabricacion: formData.descripcionFabricacion,
        cantidadFabricacion: parseFloat(formData.cantidadFabricacion),
        fechaFabricacion: formData.fechaFabricacion,
        observaciones: formData.observaciones || undefined,
      });

      setShowAdvertenciaExistencias(false);
      setInfoExistencias(null);
      onSuccess();
    } catch (error: unknown) {
      console.error('Error creando fabricación:', error);
      alert(error instanceof Error ? error.message : 'Error al crear fabricación');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarAdvertencia = () => {
    setShowAdvertenciaExistencias(false);
    setInfoExistencias(null);
    setLoading(false);
    // No cerrar el modal, solo volver al formulario
  };

  const handleClose = () => {
    setShowAdvertenciaExistencias(false);
    setInfoExistencias(null);
    setLoading(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={showAdvertenciaExistencias ? "⚠️ Advertencia: Existencias Insuficientes" : "Nueva Fabricación"}
      size="lg"
    >
      {showAdvertenciaExistencias && infoExistencias ? (
        // Vista de advertencia
        <div className="p-6 space-y-6">
          <div className="p-4 bg-orange-500/20 border border-orange-500/30 rounded-xl">
            <p className="text-orange-300 font-semibold mb-2">⚠️ ADVERTENCIA</p>
            <p className="text-foreground/90 text-sm">
              NO tienes las cantidades necesarias de las materias primas utilizadas en la fórmula{' '}
              <span className="font-semibold">{infoExistencias.codigoFormula}</span> ({infoExistencias.descripcionFormula}){' '}
              para la siguiente fabricación.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground/90 mb-3">Materias primas con faltantes:</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {infoExistencias.faltantes.map((falta, index) => (
                <div key={index} className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {falta.codigoMateriaPrima} - {falta.nombreMateriaPrima}
                      </p>
                      <div className="mt-1 text-xs text-foreground/70 space-y-1">
                        <p>Cantidad necesaria: {formatNumber(falta.cantidadNecesaria)} kg</p>
                        <p>Cantidad disponible: {formatNumber(falta.cantidadDisponible)} kg</p>
                        <p className="text-red-300 font-semibold">
                          Faltan: {formatNumber(falta.falta)} kg
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <p className="text-sm text-foreground/90">
              ¿Deseas continuar con la fabricación de todas formas? Esta acción marcará la fabricación como &quot;sin existencias&quot;.
            </p>
          </div>

          <div className="flex justify-end gap-4">
            <button
              onClick={handleCancelarAdvertencia}
              className="px-6 py-3 glass-surface text-foreground rounded-xl font-semibold hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              Volver
            </button>
            <button
              onClick={crearFabricacionConfirmada}
              className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creando...
                </>
              ) : (
                'Continuar sin existencias'
              )}
            </button>
          </div>
        </div>
      ) : (
        // Vista del formulario
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Fórmula *
              </label>
              <select
                value={formData.idFormula}
                onChange={(e) => setFormData({ ...formData, idFormula: e.target.value })}
                className="glass-input text-foreground"
                required
                disabled={loading}
              >
                <option value="" className="bg-[#1a1a2e] text-foreground">Seleccionar fórmula...</option>
                {formulas.map((formula) => (
                  <option key={formula.id} value={formula.id} className="bg-[#1a1a2e] text-foreground">
                    {formula.codigoFormula} - {formula.descripcionFormula}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Descripción Fabricación *
              </label>
              <input
                type="text"
                value={formData.descripcionFabricacion}
                onChange={(e) => setFormData({ ...formData, descripcionFabricacion: e.target.value })}
                className="glass-input"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Veces a fabricar *
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={formData.cantidadFabricacion}
                onChange={(e) => setFormData({ ...formData, cantidadFabricacion: e.target.value })}
                className="glass-input"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Fecha Fabricación *
              </label>
              <input
                type="date"
                value={formData.fechaFabricacion}
                onChange={(e) => setFormData({ ...formData, fechaFabricacion: e.target.value })}
                className="glass-input"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Observaciones
              </label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                rows={3}
                className="glass-input"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 glass-surface text-foreground rounded-xl font-semibold hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Verificando...
                </>
              ) : (
                'Crear Fabricación'
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function ModalEditarFabricacion({
  isOpen,
  onClose,
  onSuccess,
  fabricacion,
  formulas,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  fabricacion: Fabricacion;
  formulas: Formula[];
}) {
  const [formData, setFormData] = useState({
    idFormula: fabricacion.idFormula || '',
    descripcionFabricacion: fabricacion.descripcionFabricacion,
    cantidadFabricacion: fabricacion.cantidadFabricacion.toString(),
    fechaFabricacion: new Date(fabricacion.fechaFabricacion).toISOString().split('T')[0],
    observaciones: fabricacion.observaciones || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.descripcionFabricacion || !formData.cantidadFabricacion) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      const token = authService.getToken();
      if (!token) {
        alert('No autenticado');
        return;
      }

      await apiClient.editarFabricacion(token, fabricacion.id, {
        idFormula: formData.idFormula !== fabricacion.idFormula ? formData.idFormula : undefined,
        descripcionFabricacion: formData.descripcionFabricacion !== fabricacion.descripcionFabricacion ? formData.descripcionFabricacion : undefined,
        cantidadFabricacion: parseFloat(formData.cantidadFabricacion) !== fabricacion.cantidadFabricacion ? parseFloat(formData.cantidadFabricacion) : undefined,
        fechaFabricacion: formData.fechaFabricacion !== new Date(fabricacion.fechaFabricacion).toISOString().split('T')[0] ? formData.fechaFabricacion : undefined,
        observaciones: formData.observaciones !== fabricacion.observaciones ? formData.observaciones : undefined,
      });

      onSuccess();
    } catch (error: unknown) {
      console.error('Error editando fabricación:', error);
      alert(error instanceof Error ? error.message : 'Error al editar fabricación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Fabricación" size="lg">
      <form onSubmit={handleSubmit} className="p-6">
        <div className="mb-4 p-4 bg-amber-500/20 border border-amber-500/30 rounded-lg">
          <p className="text-sm text-amber-300 font-medium mb-2">⚠️ Advertencia</p>
          <p className="text-xs text-amber-200">
            Al modificar esta fabricación se recalculará el inventario automáticamente.
          </p>
        </div>
        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Fórmula *
            </label>
            <select
              value={formData.idFormula}
              onChange={(e) => setFormData({ ...formData, idFormula: e.target.value })}
              className="glass-input text-foreground"
              required
              disabled={loading}
            >
              <option value="" className="bg-[#1a1a2e] text-foreground">Seleccionar fórmula...</option>
              {formulas.map((formula) => (
                <option key={formula.id} value={formula.id} className="bg-[#1a1a2e] text-foreground">
                  {formula.codigoFormula} - {formula.descripcionFormula}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Descripción Fabricación *
            </label>
            <input
              type="text"
              value={formData.descripcionFabricacion}
              onChange={(e) => setFormData({ ...formData, descripcionFabricacion: e.target.value })}
              className="glass-input"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Veces a fabricar *
            </label>
            <input
              type="number"
              step="0.0001"
              min="0"
              value={formData.cantidadFabricacion}
              onChange={(e) => setFormData({ ...formData, cantidadFabricacion: e.target.value })}
              className="glass-input"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Fecha Fabricación *
            </label>
            <input
              type="date"
              value={formData.fechaFabricacion}
              onChange={(e) => setFormData({ ...formData, fechaFabricacion: e.target.value })}
              className="glass-input"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Observaciones
            </label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              rows={3}
              className="glass-input"
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 glass-surface text-foreground rounded-xl font-semibold hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

