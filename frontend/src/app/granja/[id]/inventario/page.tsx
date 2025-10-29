'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import { Modal } from '@/components/ui';
import InventarioExistenciasChart from '@/components/charts/InventarioExistenciasChart';
import InventarioValorChart from '@/components/charts/InventarioValorChart';

interface MateriaPrima {
  id: string;
  codigoMateriaPrima: string;
  nombreMateriaPrima: string;
  precioPorKilo: number;
}

interface InventarioItem {
  id: string;
  cantidadAcumulada: number;
  cantidadSistema: number;
  cantidadReal: number;
  merma: number;
  precioAlmacen: number;
  valorStock: number;
  materiaPrima: MateriaPrima;
}

interface EstadisticasInventario {
  totalMateriasPrimas: number;
  toneladasTotales: number;
  costoTotalStock: number;
  materiasMasExistencias: Array<{
    codigo: string;
    nombre: string;
    cantidad: number;
    toneladas: number;
  }>;
  materiasMasValor: Array<{
    codigo: string;
    nombre: string;
    precioAlmacen: number;
    valorStock: number;
  }>;
  alertasStock: Array<{
    codigo: string;
    nombre: string;
    cantidadReal: number;
    tipo: 'NEGATIVO' | 'CERO';
  }>;
}

export default function InventarioPage() {
  const params = useParams();
  const router = useRouter();
  const idGranja = params.id as string;

  const [user, setUser] = useState<{ id: string; email: string; tipoUsuario: string } | null>(null);
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasInventario | null>(null);
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrima[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [showModalInicializar, setShowModalInicializar] = useState(false);
  const [showModalVaciar, setShowModalVaciar] = useState(false);
  const [showModalEditar, setShowModalEditar] = useState(false);
  const [editando, setEditando] = useState<InventarioItem | null>(null);
  const [formData, setFormData] = useState({
    cantidadReal: ''
  });

  // Estado para inicialización manual por líneas
  const [lineasInicializacion, setLineasInicializacion] = useState<Array<{
    idMateriaPrima: string;
    codigo: string;
    nombre: string;
    cantidadKg: string;
    precioPorKilo: string;
  }>>([
    { idMateriaPrima: '', codigo: '', nombre: '', cantidadKg: '', precioPorKilo: '' }
  ]);
  const [sugerencias, setSugerencias] = useState<MateriaPrima[]>([]);
  const [sugIndex, setSugIndex] = useState<number | null>(null);
  const [sugCampo, setSugCampo] = useState<'codigo' | 'nombre' | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const currentUser = authService.getUser();
    setUser(currentUser);
    cargarDatos();
  }, [router, idGranja]);

  const cargarDatos = async () => {
    try {
      const token = authService.getToken();
      if (token) {
        const [inventarioData, estadisticasData, materiasData] = await Promise.all([
          apiClient.getInventario(token, idGranja),
          apiClient.getEstadisticasInventario(token, idGranja),
          apiClient.getMateriasPrimas(token, idGranja)
        ]);

        setInventario(inventarioData);
        setEstadisticas(estadisticasData);
        setMateriasPrimas(materiasData);
      }
    } catch (error: unknown) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const inicializarInventario = async () => {
    try {
      const token = authService.getToken();
      if (!token) return;

      // Construir payload solo con líneas válidas
      const datosIniciales = lineasInicializacion
        .map(l => {
          let mp = materiasPrimas.find(m => m.codigoMateriaPrima.toLowerCase() === l.codigo.toLowerCase());
          if (!mp && l.nombre) {
            mp = materiasPrimas.find(m => m.nombreMateriaPrima.toLowerCase() === l.nombre.toLowerCase());
          }
          if (!mp) return null;
          const cantidad = parseFloat(l.cantidadKg);
          const precio = l.precioPorKilo ? parseFloat(l.precioPorKilo) : undefined;
          if (isNaN(cantidad) || cantidad < 0) return null;
          return {
            idMateriaPrima: mp.id,
            cantidadReal: cantidad,
            precioPorKilo: precio,
          };
        })
        .filter(Boolean) as Array<{ idMateriaPrima: string; cantidadReal: number; precioPorKilo?: number }>;

      if (datosIniciales.length === 0) return;

      await apiClient.inicializarInventario(token, idGranja, datosIniciales);
      setShowModalInicializar(false);
      setLineasInicializacion([{ idMateriaPrima: '', codigo: '', nombre: '', cantidadKg: '', precioPorKilo: '' }]);
      await cargarDatos();
    } catch (error: unknown) {
      console.error('Error inicializando inventario:', error);
    }
  };

  const actualizarLinea = (index: number, campo: string, valor: string) => {
    setLineasInicializacion(prev => {
      const nuevo = [...prev];
      const linea = { ...nuevo[index] };
      if (campo === 'codigo') {
        linea.codigo = valor;
        const mp = materiasPrimas.find(m => m.codigoMateriaPrima.toLowerCase() === valor.toLowerCase());
        if (mp) {
          linea.idMateriaPrima = mp.id;
          linea.nombre = mp.nombreMateriaPrima;
          if (!linea.precioPorKilo && mp.precioPorKilo > 0) {
            linea.precioPorKilo = mp.precioPorKilo.toString();
          }
        }
        // Sugerencias por código
        const sug = materiasPrimas
          .filter(m => m.codigoMateriaPrima.toLowerCase().includes(valor.toLowerCase()) || valor.length === 0)
          .slice(0, 8);
        setSugerencias(sug);
        setSugIndex(index);
        setSugCampo('codigo');
      } else if (campo === 'nombre') {
        linea.nombre = valor;
        const mp = materiasPrimas.find(m => m.nombreMateriaPrima.toLowerCase() === valor.toLowerCase());
        if (mp) {
          linea.idMateriaPrima = mp.id;
          linea.codigo = mp.codigoMateriaPrima;
          if (!linea.precioPorKilo && mp.precioPorKilo > 0) {
            linea.precioPorKilo = mp.precioPorKilo.toString();
          }
        }
        // Sugerencias por nombre
        const sug = materiasPrimas
          .filter(m => m.nombreMateriaPrima.toLowerCase().includes(valor.toLowerCase()) || valor.length === 0)
          .slice(0, 8);
        setSugerencias(sug);
        setSugIndex(index);
        setSugCampo('nombre');
      } else if (campo === 'cantidadKg') {
        linea.cantidadKg = valor;
      } else if (campo === 'precioPorKilo') {
        linea.precioPorKilo = valor;
      }
      nuevo[index] = linea;
      return nuevo;
    });
  };

  const agregarLinea = () => {
    setLineasInicializacion(prev => ([...prev, { idMateriaPrima: '', codigo: '', nombre: '', cantidadKg: '', precioPorKilo: '' }]));
  };

  const eliminarLinea = (index: number) => {
    setLineasInicializacion(prev => prev.filter((_, i) => i !== index));
  };

  const actualizarCantidadReal = async () => {
    if (!editando || !formData.cantidadReal) return;

    try {
      const token = authService.getToken();
      if (!token) return;

      const cantidadReal = parseFloat(formData.cantidadReal);
      await apiClient.actualizarCantidadReal(token, idGranja, editando.id, cantidadReal);
      
      setShowModalEditar(false);
      setEditando(null);
      setFormData({ cantidadReal: '' });
      await cargarDatos();
    } catch (error: unknown) {
      console.error('Error actualizando cantidad real:', error);
    }
  };

  const recalcularInventario = async () => {
    try {
      const token = authService.getToken();
      if (!token) return;

      await apiClient.recalcularInventario(token, idGranja);
      await cargarDatos();
    } catch (error: unknown) {
      console.error('Error recalculando inventario:', error);
    }
  };

  const vaciarInventario = async () => {
    try {
      const token = authService.getToken();
      if (!token) return;

      await apiClient.vaciarInventario(token, idGranja);
      setShowModalVaciar(false);
      await cargarDatos();
    } catch (error: unknown) {
      console.error('Error vaciando inventario:', error);
    }
  };

  const inventarioFiltrado = inventario.filter(item =>
    item.materiaPrima.codigoMateriaPrima.toLowerCase().includes(filtro.toLowerCase()) ||
    item.materiaPrima.nombreMateriaPrima.toLowerCase().includes(filtro.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FAFAE4]">
        <div className="text-center">
          <p className="text-4xl mb-2">📦</p>
          <p className="text-gray-600 font-medium">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  const formatNumber = (n: number, fraction: number = 2) =>
    Number(n).toLocaleString('es-AR', { minimumFractionDigits: fraction, maximumFractionDigits: fraction });
  const formatCurrency = (n: number) =>
    Number(n).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });

  return (
    <div className="flex min-h-screen bg-[#FAFAE4]">
      <Sidebar />
      
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Inventario</h2>
              <p className="text-gray-600 mt-1">Gestión de stock de materias primas</p>
            </div>
            
            <div className="flex gap-3">
              {/* Botón Recalcular eliminado según requerimiento */}
              {inventario.length > 0 && (
                <button
                  onClick={() => setShowModalVaciar(true)}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all flex items-center gap-2"
                >
                  <span>🗑️</span>
                  Vaciar Inventario
                </button>
              )}
              {inventario.length === 0 && (
                <button
                  onClick={() => setShowModalInicializar(true)}
                  className="px-6 py-3 bg-gradient-to-r from-[#B6CCAE] to-[#9AAB64] text-gray-900 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <span>🚀</span>
                  Inicializar Inventario
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-8 space-y-8">
          {/* Cards de estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#B6CCAE] to-[#9AAB64] rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📦</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Materias Primas</p>
                  <p className="text-2xl font-bold text-gray-900">{estadisticas?.totalMateriasPrimas || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#FAD863] to-[#F8C540] rounded-xl flex items-center justify-center">
                  <span className="text-2xl">⚖️</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Kilos Totales</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(((estadisticas?.toneladasTotales || 0) * 1000), 0)} kg</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#F5B8DA] to-[#E8A87C] rounded-xl flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Costo Total Stock</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(estadisticas?.costoTotalStock || 0)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Alertas de stock */}
          {estadisticas?.alertasStock && estadisticas.alertasStock.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-red-800 mb-4">⚠️ Alertas de Stock</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {estadisticas.alertasStock.map((alerta, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{alerta.codigo}</p>
                        <p className="text-sm text-gray-600">{alerta.nombre}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        alerta.tipo === 'NEGATIVO' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {alerta.tipo === 'NEGATIVO' ? 'NEGATIVO' : 'CERO'}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Cantidad: {alerta.cantidadReal.toFixed(2)} kg
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Materias Primas con Más Existencias</h3>
                <span className="text-xs text-gray-500 font-medium">
                  Top {estadisticas?.materiasMasExistencias?.length || 0}
                </span>
              </div>
              <InventarioExistenciasChart data={estadisticas?.materiasMasExistencias || []} />
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Materias Primas de Más Valor</h3>
                <span className="text-xs text-gray-500 font-medium">
                  Top {estadisticas?.materiasMasValor?.length || 0}
                </span>
              </div>
              <InventarioValorChart data={estadisticas?.materiasMasValor || []} />
            </div>
          </div>

          {/* Filtro */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <input
              type="text"
              placeholder="Buscar por código o nombre de materia prima..."
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
                    <th className="px-6 py-4 text-left font-semibold">Materia Prima</th>
                  <th className="px-6 py-4 text-left font-semibold">Precio/kg</th>
                    <th className="px-6 py-4 text-left font-semibold">Cant. Acumulada</th>
                    <th className="px-6 py-4 text-left font-semibold">Cant. Sistema</th>
                    <th className="px-6 py-4 text-left font-semibold">Cant. Real</th>
                    <th className="px-6 py-4 text-left font-semibold">Merma</th>
                  <th className="px-6 py-4 text-left font-semibold">Costo Stock</th>
                  <th className="px-6 py-4 text-left font-semibold">Costo Almacén</th>
                    <th className="px-6 py-4 text-center font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {inventarioFiltrado.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                        {filtro ? 'No se encontraron resultados' : 'No hay inventario registrado'}
                      </td>
                    </tr>
                  ) : (
                    inventarioFiltrado.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-gray-900 font-medium">{item.materiaPrima.codigoMateriaPrima}</td>
                        <td className="px-6 py-4 text-gray-900">{item.materiaPrima.nombreMateriaPrima}</td>
                        <td className="px-6 py-4 text-gray-900 whitespace-nowrap">{formatCurrency(item.materiaPrima.precioPorKilo)}</td>
                        <td className="px-6 py-4 text-gray-900 whitespace-nowrap">{formatNumber(item.cantidadAcumulada)} kg</td>
                        <td className="px-6 py-4 text-gray-900 whitespace-nowrap">{formatNumber(item.cantidadSistema)} kg</td>
                        <td className="px-6 py-4 text-gray-900 whitespace-nowrap">{formatNumber(item.cantidadReal)} kg</td>
                        <td className={`px-6 py-4 font-medium whitespace-nowrap ${
                          item.merma > 0 ? 'text-green-600' : item.merma < 0 ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {formatNumber(item.merma)} kg
                        </td>
                        <td className="px-6 py-4 text-gray-900 whitespace-nowrap">{formatCurrency(item.valorStock)}</td>
                        <td className="px-6 py-4 text-gray-900 whitespace-nowrap">{formatCurrency(item.precioAlmacen)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditando(item);
                                setFormData({ cantidadReal: item.cantidadReal.toString() });
                                setShowModalEditar(true);
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-[#B6CAEB] to-[#9DB5D9] text-gray-900 rounded-lg font-semibold hover:shadow-md transition-all text-sm"
                            >
                              Editar
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

      {/* Modal Inicializar Inventario */}
      <Modal
        isOpen={showModalInicializar}
        onClose={() => setShowModalInicializar(false)}
        title="Inicializar Inventario"
        size="full"
        bodyClassName="p-1 md:p-0"
        footer={
          <>
            <button
              onClick={() => setShowModalInicializar(false)}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={inicializarInventario}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#B6CCAE] to-[#9AAB64] text-gray-900 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Inicializar
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <p className="text-gray-700 md:max-w-3xl">
              Carga las existencias actuales y el costo unitario por materia prima. Estos valores serán el punto de partida del inventario (cantidad acumulada, en sistema y real).
            </p>
            <button
              onClick={agregarLinea}
              className="px-4 py-2 bg-gradient-to-r from-[#B6CAEB] to-[#9DB5D9] text-gray-900 rounded-lg font-semibold hover:shadow-md"
            >
              + Agregar línea
            </button>
          </div>

          {/* Vista móvil: tarjetas */}
          <div className="md:hidden space-y-4">
            {lineasInicializacion.map((l, idx) => (
              <div key={idx} className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Código MP</label>
                    <div className="relative">
                      <input
                      type="text"
                      value={l.codigo}
                      onChange={(e) => actualizarLinea(idx, 'codigo', e.target.value)}
                      onFocus={() => { setSugIndex(idx); setSugCampo('codigo'); setSugerencias(materiasPrimas.slice(0,8)); }}
                      onBlur={() => setTimeout(() => { setSugIndex(null); setSugCampo(null); }, 150)}
                      placeholder="Ej: MP001"
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#B6CCAE] focus:outline-none"
                      />
                      {sugIndex === idx && sugCampo === 'codigo' && sugerencias.length > 0 && (
                        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-auto">
                          {sugerencias.map((mp) => (
                            <button
                              key={mp.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                actualizarLinea(idx, 'codigo', mp.codigoMateriaPrima);
                                setSugIndex(null); setSugCampo(null);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50"
                            >
                              <span className="font-medium">{mp.codigoMateriaPrima}</span> — <span className="text-gray-600">{mp.nombreMateriaPrima}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Nombre MP</label>
                    <div className="relative">
                      <input
                      type="text"
                      value={l.nombre}
                      onChange={(e) => actualizarLinea(idx, 'nombre', e.target.value)}
                      onFocus={() => { setSugIndex(idx); setSugCampo('nombre'); setSugerencias(materiasPrimas.slice(0,8)); }}
                      onBlur={() => setTimeout(() => { setSugIndex(null); setSugCampo(null); }, 150)}
                      placeholder="Ej: MAIZ"
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#B6CCAE] focus:outline-none"
                      />
                      {sugIndex === idx && sugCampo === 'nombre' && sugerencias.length > 0 && (
                        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-auto">
                          {sugerencias.map((mp) => (
                            <button
                              key={mp.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                actualizarLinea(idx, 'nombre', mp.nombreMateriaPrima);
                                setSugIndex(null); setSugCampo(null);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50"
                            >
                              <span className="font-medium">{mp.nombreMateriaPrima}</span> — <span className="text-gray-600">{mp.codigoMateriaPrima}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Cantidad (kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={l.cantidadKg}
                        onChange={(e) => actualizarLinea(idx, 'cantidadKg', e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#B6CCAE] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Costo por kilo ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={l.precioPorKilo}
                        onChange={(e) => actualizarLinea(idx, 'precioPorKilo', e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#B6CCAE] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => eliminarLinea(idx)}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700"
                    >
                      Eliminar línea
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Vista escritorio: tabla */}
          <div className="hidden md:block overflow-x-auto bg-white border border-gray-200 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-4 text-left font-semibold text-gray-700">Código MP</th>
                  <th className="px-5 py-4 text-left font-semibold text-gray-700">Nombre MP</th>
                  <th className="px-5 py-4 text-left font-semibold text-gray-700">Cantidad (kg)</th>
                  <th className="px-5 py-4 text-left font-semibold text-gray-700">Costo por kilo ($)</th>
                  <th className="px-5 py-4 text-center font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lineasInicializacion.map((l, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-5 py-3">
                      <div className="relative">
                        <input
                        type="text"
                        value={l.codigo}
                        onChange={(e) => actualizarLinea(idx, 'codigo', e.target.value)}
                        onFocus={() => { setSugIndex(idx); setSugCampo('codigo'); setSugerencias(materiasPrimas.slice(0,8)); }}
                        onBlur={() => setTimeout(() => { setSugIndex(null); setSugCampo(null); }, 150)}
                        placeholder="Ej: MP001"
                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#B6CCAE] focus:outline-none"
                        />
                        {sugIndex === idx && sugCampo === 'codigo' && sugerencias.length > 0 && (
                          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-auto">
                            {sugerencias.map((mp) => (
                              <button
                                key={mp.id}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  actualizarLinea(idx, 'codigo', mp.codigoMateriaPrima);
                                  setSugIndex(null); setSugCampo(null);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-50"
                              >
                                <span className="font-medium">{mp.codigoMateriaPrima}</span> — <span className="text-gray-600">{mp.nombreMateriaPrima}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="relative">
                        <input
                        type="text"
                        value={l.nombre}
                        onChange={(e) => actualizarLinea(idx, 'nombre', e.target.value)}
                        onFocus={() => { setSugIndex(idx); setSugCampo('nombre'); setSugerencias(materiasPrimas.slice(0,8)); }}
                        onBlur={() => setTimeout(() => { setSugIndex(null); setSugCampo(null); }, 150)}
                        placeholder="Ej: MAIZ"
                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#B6CCAE] focus:outline-none"
                        />
                        {sugIndex === idx && sugCampo === 'nombre' && sugerencias.length > 0 && (
                          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-auto">
                            {sugerencias.map((mp) => (
                              <button
                                key={mp.id}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  actualizarLinea(idx, 'nombre', mp.nombreMateriaPrima);
                                  setSugIndex(null); setSugCampo(null);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-50"
                              >
                                <span className="font-medium">{mp.nombreMateriaPrima}</span> — <span className="text-gray-600">{mp.codigoMateriaPrima}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={l.cantidadKg}
                        onChange={(e) => actualizarLinea(idx, 'cantidadKg', e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#B6CCAE] focus:outline-none"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={l.precioPorKilo}
                        onChange={(e) => actualizarLinea(idx, 'precioPorKilo', e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#B6CCAE] focus:outline-none"
                      />
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => eliminarLinea(idx)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-xs md:text-sm text-gray-600">
              Sugerencia: escribe el código o el nombre; se autocompleta si existe en la base.
            </div>
            <div className="text-right text-sm text-gray-700 hidden md:block">
              Total líneas: <span className="font-semibold">{lineasInicializacion.length}</span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Editar Cantidad Real */}
      <Modal
        isOpen={showModalEditar}
        onClose={() => setShowModalEditar(false)}
        title="Editar Cantidad Real"
        footer={
          <>
            <button
              onClick={() => setShowModalEditar(false)}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={actualizarCantidadReal}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#B6CCAE] to-[#9AAB64] text-gray-900 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Guardar
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Materia Prima
            </label>
            <input
              type="text"
              value={editando?.materiaPrima.nombreMateriaPrima || ''}
              disabled
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad Real (kg) *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.cantidadReal}
              onChange={(e) => setFormData({ ...formData, cantidadReal: e.target.value })}
              placeholder="0.00"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B6CCAE] focus:outline-none transition-all"
            />
          </div>

          {editando && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-600">
                <strong>Cantidad en Sistema:</strong> {editando.cantidadSistema.toFixed(2)} kg
              </p>
              <p className="text-sm text-gray-600">
                <strong>Merma actual:</strong> {editando.merma.toFixed(2)} kg
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Vaciar Inventario */}
      <Modal
        isOpen={showModalVaciar}
        onClose={() => setShowModalVaciar(false)}
        title="Vaciar Inventario"
        footer={
          <>
            <button
              onClick={() => setShowModalVaciar(false)}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={vaciarInventario}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all"
            >
              Vaciar
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-gray-700">
            ¿Está seguro de que desea vaciar todo el inventario de esta granja?
          </p>
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
            Esta acción elimina todos los registros del inventario. No se puede deshacer.
          </div>
        </div>
      </Modal>
    </div>
  );
}

