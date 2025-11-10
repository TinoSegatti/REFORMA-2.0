'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authService } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import { Modal } from '@/components/ui';
import { Download, Upload, Plus, Users, MapPin, Building2, Trash2 } from 'lucide-react';
import ProveedoresComprasChart from '@/components/charts/ProveedoresComprasChart';
import ProveedoresGastoChart from '@/components/charts/ProveedoresGastoChart';

interface Proveedor {
  id: string;
  codigo: string;
  nombre: string;
  direccion?: string;
  localidad?: string;
}

export default function ProveedoresPage() {
  const router = useRouter();
  const params = useParams();
  const idGranja = params.id as string;

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [estadisticas, setEstadisticas] = useState<{
    cantidadProveedores: number;
    proveedoresConMasCompras: Array<{
      id: string;
      codigoProveedor: string;
      nombreProveedor: string;
      cantidadCompras: number;
    }>;
    proveedoresConMasGasto: Array<{
      id: string;
      codigoProveedor: string;
      nombreProveedor: string;
      totalGastado: number;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showModalEliminar, setShowModalEliminar] = useState(false);
  const [editando, setEditando] = useState<Proveedor | null>(null);
  const [eliminando, setEliminando] = useState<Proveedor | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    direccion: '',
    localidad: '',
  });
  const [showImportModal, setShowImportModal] = useState(false);
  const [archivoImport, setArchivoImport] = useState<File | null>(null);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  const totalProveedores = useMemo(
    () => estadisticas?.cantidadProveedores ?? proveedores.length,
    [estadisticas, proveedores.length]
  );

  const totalGastado = useMemo(
    () =>
      estadisticas?.proveedoresConMasGasto?.reduce(
        (sum, proveedor) => sum + Number(proveedor.totalGastado || 0),
        0
      ) ?? 0,
    [estadisticas]
  );

  const proveedoresMasCompras = useMemo(
    () => estadisticas?.proveedoresConMasCompras ?? [],
    [estadisticas]
  );

  const proveedoresMasGasto = useMemo(
    () => estadisticas?.proveedoresConMasGasto ?? [],
    [estadisticas]
  );

  const proveedoresSinDatos = useMemo(
    () =>
      proveedores.filter(
        (p) =>
          !p.direccion?.trim() ||
          !p.localidad?.trim()
      ),
    [proveedores]
  );

  const proveedoresSinDatosPreview = useMemo(
    () => proveedoresSinDatos.slice(0, 4),
    [proveedoresSinDatos]
  );

  const topComprasPreview = useMemo(
    () => proveedoresMasCompras.slice(0, 3),
    [proveedoresMasCompras]
  );

  const topGastoPreview = useMemo(
    () => proveedoresMasGasto.slice(0, 3),
    [proveedoresMasGasto]
  );

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
        const [proveedoresResponse, stats] = await Promise.all([
          apiClient.getProveedores(token, idGranja),
          apiClient.getEstadisticasProveedores(token, idGranja),
        ]);

        const proveedoresAdaptados = proveedoresResponse.map((p: { id: string; codigoProveedor: string; nombreProveedor: string; direccion: string | null; localidad: string | null }) => ({
          id: p.id,
          codigo: p.codigoProveedor,
          nombre: p.nombreProveedor,
          direccion: p.direccion,
          localidad: p.localidad,
        }));
        setProveedores(proveedoresAdaptados);
        setEstadisticas(stats);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (proveedor?: Proveedor) => {
    if (proveedor) {
      setEditando(proveedor);
      setFormData({
        codigo: proveedor.codigo,
        nombre: proveedor.nombre,
        direccion: proveedor.direccion || '',
        localidad: proveedor.localidad || '',
      });
    } else {
      setEditando(null);
      setFormData({ codigo: '', nombre: '', direccion: '', localidad: '' });
    }
    setShowModal(true);
  };

  const guardar = async () => {
    if (!formData.codigo.trim() || !formData.nombre.trim()) {
      alert('Por favor complete código y nombre');
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

      let proveedorActualizado;
      if (editando) {
        // Editar: actualizar solo ese proveedor en el estado
        proveedorActualizado = await apiClient.updateProveedor(token, idGranja, editando.id, {
          codigoProveedor: formData.codigo,
          nombreProveedor: formData.nombre,
          direccionProveedor: formData.direccion || '',
          localidadProveedor: formData.localidad || '',
        });
        
        // Actualizar solo ese proveedor en el estado (sin recargar todo)
        setProveedores(prev => prev.map(p => 
          p.id === editando.id 
            ? {
                id: proveedorActualizado.id,
                codigo: proveedorActualizado.codigoProveedor,
                nombre: proveedorActualizado.nombreProveedor,
                direccion: proveedorActualizado.direccion,
                localidad: proveedorActualizado.localidad,
              }
            : p
        ));
      } else {
        // Crear: agregar solo el nuevo proveedor al estado
        proveedorActualizado = await apiClient.createProveedor(token, idGranja, {
          codigoProveedor: formData.codigo,
          nombreProveedor: formData.nombre,
          direccionProveedor: formData.direccion || '',
          localidadProveedor: formData.localidad || '',
        });
        
        // Agregar solo el nuevo proveedor al estado (sin recargar estadísticas)
        const nuevoProveedor = {
          id: proveedorActualizado.id,
          codigo: proveedorActualizado.codigoProveedor,
          nombre: proveedorActualizado.nombreProveedor,
          direccion: proveedorActualizado.direccion,
          localidad: proveedorActualizado.localidad,
        };
        setProveedores(prev => [...prev, nuevoProveedor].sort((a, b) => 
          a.nombre.localeCompare(b.nombre)
        ));
        
        // Actualizar solo el contador de estadísticas (sin recargar las queries complejas)
        if (estadisticas) {
          setEstadisticas(prev => ({
            ...prev,
            cantidadProveedores: (prev?.cantidadProveedores || 0) + 1
          }));
        }
      }

      setShowModal(false);
      setFormData({ codigo: '', nombre: '', direccion: '', localidad: '' });
      setEditando(null);
    } catch (error: unknown) {
      console.error('Error guardando:', error);
      alert(error instanceof Error ? error.message : 'Error al guardar el proveedor');
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

      await apiClient.deleteProveedor(token, idGranja, eliminando.id);
      
      // Eliminar solo ese proveedor del estado (sin recargar todo)
      setProveedores(prev => prev.filter(p => p.id !== eliminando.id));
      
      // Actualizar contador de estadísticas
      if (estadisticas) {
        setEstadisticas(prev => ({
          ...prev,
          cantidadProveedores: Math.max(0, (prev?.cantidadProveedores || 0) - 1)
        }));
        
        // Recalcular estadísticas solo si el proveedor tenía compras (verificar en las estadísticas actuales)
        const proveedorEnStats = estadisticas.proveedoresConMasCompras?.some(
          (p: any) => p.id === eliminando.id
        ) || estadisticas.proveedoresConMasGasto?.some(
          (p: any) => p.id === eliminando.id && Number(p.totalGastado) > 0
        );
        
        // Solo recargar estadísticas si el proveedor tenía compras asociadas
        if (proveedorEnStats) {
          const stats = await apiClient.getEstadisticasProveedores(token, idGranja);
          setEstadisticas(stats);
        }
      }
      
      setShowModalEliminar(false);
      setEliminando(null);
    } catch (error: unknown) {
      console.error('Error eliminando:', error);
      alert(error instanceof Error ? error.message : 'Error al eliminar el proveedor');
    } finally {
      setIsDeleting(false);
    }
  };

  const puedeImportar = proveedores.length === 0;

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

      await apiClient.importarProveedores(token, idGranja, archivoImport);
      cerrarModalImportacion();
      await cargarDatos();
      alert('Importación realizada correctamente.');
    } catch (error) {
      console.error('Error importando proveedores:', error);
      alert(error instanceof Error ? error.message : 'Error al importar proveedores');
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

      const blob = await apiClient.exportarProveedores(token, idGranja);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `proveedores_${idGranja}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exportando proveedores:', error);
      alert(error instanceof Error ? error.message : 'Error al exportar proveedores');
    } finally {
      setIsExportingCsv(false);
    }
  };

  const proveedoresFiltrados = useMemo(
    () =>
      proveedores.filter((p) => {
        const base = filtro.toLowerCase();
        return (
          p.codigo.toLowerCase().includes(base) ||
          p.nombre.toLowerCase().includes(base) ||
          (p.direccion || '').toLowerCase().includes(base) ||
          (p.localidad || '').toLowerCase().includes(base)
        );
      }),
    [proveedores, filtro]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <div className="glass-card px-8 py-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-400/40 flex items-center justify-center">
              <Users className="h-7 w-7 text-purple-300 animate-bounce" />
            </div>
            <div>
              <p className="text-foreground font-semibold">Cargando Proveedores</p>
              <p className="text-sm text-foreground/70">Preparando tu agenda de proveedores...</p>
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
          <div className="space-y-5">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                Proveedores
                <Users className="h-8 w-8 text-purple-400" />
              </h1>
              <p className="text-foreground/70 mt-2 max-w-2xl">
                Gestiona tus proveedores, identifica a los socios con más compras y quienes concentran el mayor gasto para
                optimizar negociaciones y abastecimiento.
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
                title={!puedeImportar ? 'La importación solo está disponible cuando no hay proveedores cargados' : undefined}
              >
                <Upload className="h-5 w-5" />
                {isImportingCsv ? 'Importando...' : 'Importar CSV'}
              </button>
              <button
                onClick={() => abrirModal()}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:brightness-110 transition-all flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Nuevo Proveedor
              </button>
            </div>
          </div>
          <div className="glass-card px-5 py-4 border border-white/10 rounded-2xl backdrop-blur-xl max-w-sm">
            <p className="text-sm text-foreground/60 uppercase tracking-wide">Sugerencia</p>
            <p className="text-sm text-foreground/80 mt-2">
              Mantén actualizados datos de contacto y negocia mejores precios revisando el ranking de gasto por proveedor.
            </p>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-8 space-y-10">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground/60">Total de proveedores</p>
                <p className="text-3xl font-bold text-foreground">{totalProveedores}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-400 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Users className="h-7 w-7 text-white" />
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl space-y-3">
              <p className="text-sm text-foreground/60">Top por cantidad de compras</p>
              {proveedoresMasCompras.length === 0 ? (
                <p className="text-sm text-foreground/60">Registra movimientos para ver el ranking.</p>
              ) : (
                <>
                  <p className="text-lg font-semibold text-foreground">
                    {proveedoresMasCompras[0].nombreProveedor}
                  </p>
                  <p className="text-xs text-foreground/50">
                    {proveedoresMasCompras[0].codigoProveedor} · {proveedoresMasCompras[0].cantidadCompras} compra(s)
                  </p>
                </>
              )}
            </div>

            <div className="glass-card p-6 rounded-2xl space-y-3">
              <p className="text-sm text-foreground/60">Top por gasto acumulado</p>
              {proveedoresMasGasto.length === 0 ? (
                <p className="text-sm text-foreground/60">Aún no hay datos de gasto registrados.</p>
              ) : (
                <>
                  <p className="text-lg font-semibold text-foreground">
                    {proveedoresMasGasto[0].nombreProveedor}
                  </p>
                  <p className="text-xs text-foreground/50">{proveedoresMasGasto[0].codigoProveedor}</p>
                  <p className="text-xl font-bold text-foreground">
                    {formatCurrency(Number(proveedoresMasGasto[0].totalGastado || 0))}
                  </p>
                </>
              )}
              <div className="pt-2 border-t border-white/10 text-sm text-foreground/70">
                Total gastado: {formatCurrency(totalGastado)}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-8 rounded-2xl">
              <h3 className="text-lg font-bold text-foreground mb-4">Proveedores con Más Compras</h3>
              <ProveedoresComprasChart data={proveedoresMasCompras} />
            </div>
            <div className="glass-card p-8 rounded-2xl">
              <h3 className="text-lg font-bold text-foreground mb-4">Gastos por Proveedor</h3>
              <ProveedoresGastoChart data={proveedoresMasGasto} />
            </div>
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
            <div className="glass-card p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Buscar por código, nombre, dirección o localidad..."
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    className="glass-input"
                  />
                </div>
                <p className="text-sm text-foreground/60">
                  {proveedoresFiltrados.length} resultado(s) de {totalProveedores}
                </p>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold text-foreground/80">Código</th>
                      <th className="px-6 py-4 text-left font-semibold text-foreground/80">Nombre</th>
                      <th className="px-6 py-4 text-left font-semibold text-foreground/80">Dirección</th>
                      <th className="px-6 py-4 text-left font-semibold text-foreground/80">Localidad</th>
                      <th className="px-6 py-4 text-center font-semibold text-foreground/80">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proveedoresFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-foreground/60">
                          {filtro ? 'No se encontraron resultados con ese criterio' : 'No hay proveedores registrados'}
                        </td>
                      </tr>
                    ) : (
                      proveedoresFiltrados.map((p) => (
                        <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 text-foreground font-medium">{p.codigo}</td>
                          <td className="px-6 py-4 text-foreground/90">{p.nombre}</td>
                          <td className="px-6 py-4 text-foreground/90">{p.direccion || '-'}</td>
                          <td className="px-6 py-4 text-foreground/90">{p.localidad || '-'}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => abrirModal(p)}
                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold hover:shadow-md transition-all text-sm"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => {
                                  setEliminando(p);
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
                  <h3 className="text-lg font-semibold text-foreground">Datos pendientes</h3>
                  {proveedoresSinDatos.length > 0 && (
                    <span className="text-xs px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                      Completar
                    </span>
                  )}
                </div>
                {proveedoresSinDatos.length === 0 ? (
                  <p className="text-sm text-foreground/60">Todos los proveedores tienen dirección y localidad cargadas.</p>
                ) : (
                  <div className="space-y-3">
                    {proveedoresSinDatosPreview.map((p) => (
                      <div key={p.id} className="glass-surface px-4 py-3 rounded-xl border border-white/10 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{p.nombre}</p>
                          <p className="text-xs text-foreground/50">{p.codigo}</p>
                        </div>
                        <button
                          onClick={() => abrirModal(p)}
                          className="text-xs font-semibold text-purple-300 hover:text-purple-200 transition-colors"
                        >
                          Completar
                        </button>
                      </div>
                    ))}
                    {proveedoresSinDatos.length > proveedoresSinDatosPreview.length && (
                      <p className="text-xs text-foreground/50">
                        +{proveedoresSinDatos.length - proveedoresSinDatosPreview.length} proveedor(es) adicional(es)
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="glass-card p-6 rounded-2xl space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Ranking por compras</h3>
                {proveedoresMasCompras.length === 0 ? (
                  <p className="text-sm text-foreground/60">Registra compras para ver el ranking.</p>
                ) : (
                  <div className="space-y-3">
                    {topComprasPreview.map((p, index) => (
                      <div key={p.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-purple-300">{index + 1}.</span>
                          <div>
                            <p className="text-sm text-foreground font-semibold">{p.nombreProveedor}</p>
                            <p className="text-xs text-foreground/60">{p.codigoProveedor}</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-foreground/80">
                          {p.cantidadCompras} compra(s)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass-card p-6 rounded-2xl space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Ranking por gasto</h3>
                {proveedoresMasGasto.length === 0 ? (
                  <p className="text-sm text-foreground/60">Aún no hay gastos registrados para mostrar.</p>
                ) : (
                  <div className="space-y-3">
                    {topGastoPreview.map((p, index) => (
                      <div key={p.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-purple-300">{index + 1}.</span>
                          <div>
                            <p className="text-sm text-foreground font-semibold">{p.nombreProveedor}</p>
                            <p className="text-xs text-foreground/60">{p.codigoProveedor}</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-foreground/80">
                          {formatCurrency(Number(p.totalGastado || 0))}
                        </span>
                      </div>
                    ))}
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
        title={editando ? 'Editar Proveedor' : 'Nuevo Proveedor'}
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
              Código Proveedor
            </label>
            <input
              type="text"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              placeholder="PROV001"
              className="glass-input"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground/80 mb-2">
              Nombre Proveedor
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Proveedor ABC"
              className="glass-input"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground/80 mb-2">
              Dirección
            </label>
            <input
              type="text"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              placeholder="Calle Principal 123"
              className="glass-input"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground/80 mb-2">
              Localidad
            </label>
            <input
              type="text"
              value={formData.localidad}
              onChange={(e) => setFormData({ ...formData, localidad: e.target.value })}
              placeholder="Ciudad, Provincia"
              className="glass-input"
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
        title="Eliminar Proveedor"
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
          ¿Está seguro de que desea eliminar al proveedor <strong>{eliminando?.nombre}</strong>?
          <br />
          Esta acción no se puede deshacer.
        </p>
      </Modal>

      <Modal
        isOpen={showImportModal}
        onClose={cerrarModalImportacion}
        title="Importar Proveedores"
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
            El archivo CSV debe contener las columnas <code>codigoProveedor</code>, <code>nombreProveedor</code>, <code>direccion</code> y <code>localidad</code>.
            Solo se permite importar cuando la lista de proveedores está vacía.
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
