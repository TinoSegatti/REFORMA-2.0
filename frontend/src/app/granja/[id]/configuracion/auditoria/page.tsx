'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { authService } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { ArrowLeft, Filter, Calendar, User, FileText, ShoppingCart, Factory, Package, RefreshCw } from 'lucide-react';
import { Modal } from '@/components/ui';

interface AuditoriaRegistro {
  id: string;
  fechaOperacion: string;
  accion: string;
  tablaOrigen: 'COMPRA' | 'FABRICACION' | 'INVENTARIO';
  descripcion: string | null;
  idRegistro: string;
  datosAnteriores: any;
  datosNuevos: any;
  usuario: {
    nombreUsuario: string;
    apellidoUsuario: string;
    email: string;
  };
}

export default function AuditoriaPage() {
  const params = useParams();
  const router = useRouter();
  const idGranja = useMemo(() => (params?.id as string) || null, [params]);

  const [auditoria, setAuditoria] = useState<AuditoriaRegistro[]>([]);
  const [loading, setLoading] = useState(true);
  const [tablaOrigen, setTablaOrigen] = useState<'COMPRA' | 'FABRICACION' | 'INVENTARIO' | 'TODAS'>('TODAS');
  const [accion, setAccion] = useState<string>('TODAS');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [registroSeleccionado, setRegistroSeleccionado] = useState<AuditoriaRegistro | null>(null);
  const [showDetalle, setShowDetalle] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    if (idGranja) {
      cargarAuditoria();
    }
  }, [idGranja, tablaOrigen, accion, desde, hasta, router]);

  const cargarAuditoria = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      if (!token || !idGranja) return;

      const filters: any = {};
      if (tablaOrigen !== 'TODAS') {
        filters.tablaOrigen = tablaOrigen;
      }
      if (accion !== 'TODAS') {
        filters.accion = accion;
      }
      if (desde) {
        filters.desde = desde;
      }
      if (hasta) {
        filters.hasta = hasta;
      }
      filters.limit = 500;

      const datos = await apiClient.obtenerAuditoria(token, idGranja, filters);
      setAuditoria(datos);
    } catch (error: unknown) {
      console.error('Error cargando auditoría:', error);
      alert(error instanceof Error ? error.message : 'Error al cargar auditoría');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  };

  const getAccionColor = (accion: string) => {
    switch (accion) {
      case 'DELETE':
        return 'bg-red-500/20 text-red-300';
      case 'RESTORE':
        return 'bg-green-500/20 text-green-300';
      case 'BULK_DELETE':
        return 'bg-orange-500/20 text-orange-300';
      case 'CREATE':
        return 'bg-blue-500/20 text-blue-300';
      case 'UPDATE':
        return 'bg-yellow-500/20 text-yellow-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getTablaIcon = (tabla: string) => {
    switch (tabla) {
      case 'COMPRA':
        return <ShoppingCart className="h-4 w-4" />;
      case 'FABRICACION':
        return <Factory className="h-4 w-4" />;
      case 'INVENTARIO':
        return <Package className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTablaLabel = (tabla: string) => {
    switch (tabla) {
      case 'COMPRA':
        return 'Compras';
      case 'FABRICACION':
        return 'Fabricaciones';
      case 'INVENTARIO':
        return 'Inventario';
      default:
        return tabla;
    }
  };

  const auditoriaFiltrada = useMemo(() => {
    return auditoria;
  }, [auditoria]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="glass-card px-8 py-6 m-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/granja/${idGranja}/configuracion`)}
                className="p-2 glass-surface rounded-lg hover:bg-white/10 transition-all"
              >
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </button>
              <div>
                <h2 className="text-3xl font-bold text-foreground">Auditoría</h2>
                <p className="text-foreground/70 mt-1">Registros de cambios y operaciones del sistema</p>
              </div>
            </div>
            <button
              onClick={cargarAuditoria}
              className="px-6 py-3 glass-surface text-foreground rounded-xl font-semibold hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <RefreshCw className="h-5 w-5" />
              Actualizar
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-8 space-y-8">
          {/* Filtros */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Filter className="h-5 w-5 text-foreground/70" />
              <h3 className="text-lg font-semibold text-foreground">Filtros</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-foreground/70 mb-2">Tabla</label>
                <select
                  value={tablaOrigen}
                  onChange={(e) => setTablaOrigen(e.target.value as any)}
                  className="glass-input w-full"
                >
                  <option value="TODAS">Todas las tablas</option>
                  <option value="COMPRA">Compras</option>
                  <option value="FABRICACION">Fabricaciones</option>
                  <option value="INVENTARIO">Inventario</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-foreground/70 mb-2">Acción</label>
                <select
                  value={accion}
                  onChange={(e) => setAccion(e.target.value)}
                  className="glass-input w-full"
                >
                  <option value="TODAS">Todas las acciones</option>
                  <option value="DELETE">Eliminar</option>
                  <option value="RESTORE">Restaurar</option>
                  <option value="BULK_DELETE">Eliminación Masiva</option>
                  <option value="CREATE">Crear</option>
                  <option value="UPDATE">Actualizar</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-foreground/70 mb-2">Desde</label>
                <input
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  className="glass-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-foreground/70 mb-2">Hasta</label>
                <input
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  className="glass-input w-full"
                />
              </div>
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-card p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-400 rounded-xl flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-foreground/70">Total Registros</p>
                  <p className="text-2xl font-bold text-foreground">{auditoriaFiltrada.length}</p>
                </div>
              </div>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-400 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-foreground/70">Compras</p>
                  <p className="text-2xl font-bold text-foreground">
                    {auditoriaFiltrada.filter(a => a.tablaOrigen === 'COMPRA').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-400 rounded-xl flex items-center justify-center">
                  <Factory className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-foreground/70">Fabricaciones</p>
                  <p className="text-2xl font-bold text-foreground">
                    {auditoriaFiltrada.filter(a => a.tablaOrigen === 'FABRICACION').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-400 rounded-xl flex items-center justify-center">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-foreground/70">Inventario</p>
                  <p className="text-2xl font-bold text-foreground">
                    {auditoriaFiltrada.filter(a => a.tablaOrigen === 'INVENTARIO').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de Auditoría */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-foreground/80">Fecha</th>
                    <th className="px-6 py-4 text-left font-semibold text-foreground/80">Tabla</th>
                    <th className="px-6 py-4 text-left font-semibold text-foreground/80">Acción</th>
                    <th className="px-6 py-4 text-left font-semibold text-foreground/80">Descripción</th>
                    <th className="px-6 py-4 text-left font-semibold text-foreground/80">Usuario</th>
                    <th className="px-6 py-4 text-center font-semibold text-foreground/80">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-foreground/60">
                        Cargando registros de auditoría...
                      </td>
                    </tr>
                  ) : auditoriaFiltrada.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-foreground/60">
                        No hay registros de auditoría para los filtros seleccionados
                      </td>
                    </tr>
                  ) : (
                    auditoriaFiltrada.map((registro) => (
                      <tr key={registro.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {formatDate(registro.fechaOperacion)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getTablaIcon(registro.tablaOrigen)}
                            <span className="text-sm text-foreground">{getTablaLabel(registro.tablaOrigen)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAccionColor(registro.accion)}`}>
                            {registro.accion}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground max-w-xs truncate">
                          {registro.descripcion || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-foreground/50" />
                            <span>{registro.usuario.nombreUsuario} {registro.usuario.apellidoUsuario}</span>
                          </div>
                          <div className="text-xs text-foreground/60">{registro.usuario.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              setRegistroSeleccionado(registro);
                              setShowDetalle(true);
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold hover:shadow-md text-sm"
                          >
                            Ver Detalle
                          </button>
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

      {/* Modal de Detalle */}
      {showDetalle && registroSeleccionado && (
        <Modal
          isOpen={showDetalle}
          onClose={() => {
            setShowDetalle(false);
            setRegistroSeleccionado(null);
          }}
          title="Detalle de Registro de Auditoría"
          size="lg"
        >
          <div className="p-6 space-y-6">
            {/* Información General */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-1">Fecha y Hora</label>
                <p className="text-foreground">{formatDate(registroSeleccionado.fechaOperacion)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-1">Tabla</label>
                  <div className="flex items-center gap-2">
                    {getTablaIcon(registroSeleccionado.tablaOrigen)}
                    <p className="text-foreground">{getTablaLabel(registroSeleccionado.tablaOrigen)}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-1">Acción</label>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getAccionColor(registroSeleccionado.accion)}`}>
                    {registroSeleccionado.accion}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-1">Usuario</label>
                <p className="text-foreground">
                  {registroSeleccionado.usuario.nombreUsuario} {registroSeleccionado.usuario.apellidoUsuario}
                </p>
                <p className="text-sm text-foreground/60">{registroSeleccionado.usuario.email}</p>
              </div>
              {registroSeleccionado.descripcion && (
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-1">Descripción</label>
                  <p className="text-foreground">{registroSeleccionado.descripcion}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-1">ID del Registro</label>
                <p className="text-sm font-mono text-foreground/80">{registroSeleccionado.idRegistro}</p>
              </div>
            </div>

            {/* Datos Anteriores */}
            {registroSeleccionado.datosAnteriores && (
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-2">Datos Anteriores</label>
                <div className="glass-surface p-4 rounded-lg max-h-64 overflow-auto">
                  <pre className="text-xs text-foreground whitespace-pre-wrap">
                    {JSON.stringify(registroSeleccionado.datosAnteriores, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Datos Nuevos */}
            {registroSeleccionado.datosNuevos && (
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-2">Datos Nuevos</label>
                <div className="glass-surface p-4 rounded-lg max-h-64 overflow-auto">
                  <pre className="text-xs text-foreground whitespace-pre-wrap">
                    {JSON.stringify(registroSeleccionado.datosNuevos, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

