'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authService } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import { Modal } from '@/components/ui';

interface MateriaPrima {
  id: string;
  codigoMateriaPrima: string;
  nombreMateriaPrima: string;
  precioPorKilo: number;
}

interface Formula {
  id: string;
  codigoFormula: string;
  descripcionFormula: string;
}

interface DetalleFormula {
  id: string;
  codigoMateriaPrima: string;
  nombreMateriaPrima: string;
  precioPorKilo: number;
}

interface DetalleFormula {
  id: string;
  cantidadKg: number;
  porcentajeFormula: number;
  precioUnitarioMomentoCreacion: number;
  costoParcial: number;
  materiaPrima: MateriaPrima;
}

interface Formula {
  id: string;
  codigoFormula: string;
  descripcionFormula: string;
  pesoTotalFormula: number;
  costoTotalFormula: number;
  animal: {
    codigoAnimal: string;
    descripcionAnimal: string;
    categoriaAnimal: string;
  };
  formulasDetalle: DetalleFormula[];
}

export default function FormulaDetallePage() {
  const router = useRouter();
  const params = useParams();
  const idGranja = params.id as string;
  const idFormula = params.formulaId as string;

  const [user, setUser] = useState<{ id: string; email: string; tipoUsuario: string } | null>(null);
  const [formula, setFormula] = useState<Formula | null>(null);
  const [formulas, setFormulas] = useState<Array<{ id: string; codigoFormula: string }>>([]);
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrima[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModalAgregar, setShowModalAgregar] = useState(false);
  const [showModalEditar, setShowModalEditar] = useState(false);
  const [showModalEliminar, setShowModalEliminar] = useState(false);
  const [showModalConfirmacion, setShowModalConfirmacion] = useState(false);
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState('');
  const [editando, setEditando] = useState<DetalleFormula | null>(null);
  const [eliminando, setEliminando] = useState<DetalleFormula | null>(null);
  const [formData, setFormData] = useState({
    idMateriaPrima: '',
    codigoMateriaPrima: '',
    nombreMateriaPrima: '',
    cantidadKg: '',
  });
  const [materiaPrimaSeleccionada, setMateriaPrimaSeleccionada] = useState<MateriaPrima | null>(null);
  const [sugerencias, setSugerencias] = useState<MateriaPrima[]>([]);
  const [sugCampo, setSugCampo] = useState<'codigo' | 'nombre' | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const currentUser = authService.getUser();
    setUser(currentUser);
    cargarDatos();
  }, [router, idFormula]);

  const cargarDatos = async () => {
    try {
      const token = authService.getToken();
      if (token) {
        // Cargar fórmula actual
        const formulaData = await apiClient.getFormulaById(token, idGranja, idFormula);
        setFormula(formulaData);

        // Cargar todas las fórmulas para navegación
        const todasLasFormulas = await apiClient.getFormulas(token, idGranja);
        setFormulas(todasLasFormulas.map((f: Formula) => ({ id: f.id, codigoFormula: f.codigoFormula })));

        // Cargar materias primas disponibles
        const materiasData = await apiClient.getMateriasPrimas(token, idGranja);
        setMateriasPrimas(materiasData);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const navegarSiguiente = () => {
    const indiceActual = formulas.findIndex(f => f.id === idFormula);
    if (indiceActual >= 0 && indiceActual < formulas.length - 1) {
      const siguiente = formulas[indiceActual + 1];
      router.push(`/granja/${idGranja}/formulas/${siguiente.id}`);
    }
  };

  const navegarAnterior = () => {
    const indiceActual = formulas.findIndex(f => f.id === idFormula);
    if (indiceActual > 0) {
      const anterior = formulas[indiceActual - 1];
      router.push(`/granja/${idGranja}/formulas/${anterior.id}`);
    }
  };

  const getIndiceActual = () => {
    return formulas.findIndex(f => f.id === idFormula) + 1;
  };

  const buscarMateriaPrima = (value: string, tipo: 'codigo' | 'nombre') => {
    const mp = materiasPrimas.find((m: MateriaPrima) => 
      tipo === 'codigo' 
        ? m.codigoMateriaPrima.toLowerCase() === value.toLowerCase()
        : m.nombreMateriaPrima.toLowerCase() === value.toLowerCase()
    );

    if (mp) {
      setMateriaPrimaSeleccionada(mp);
      setFormData({
        ...formData,
        idMateriaPrima: mp.id,
        codigoMateriaPrima: mp.codigoMateriaPrima,
        nombreMateriaPrima: mp.nombreMateriaPrima,
      });
    } else {
      setMateriaPrimaSeleccionada(null);
    }
  };

  const handleCodigoChange = (value: string) => {
    setFormData({ ...formData, codigoMateriaPrima: value });
    if (value.length > 0) {
      buscarMateriaPrima(value, 'codigo');
    }
    const sug = materiasPrimas
      .filter(m => m.codigoMateriaPrima.toLowerCase().includes(value.toLowerCase()))
      .slice(0, 8);
    setSugerencias(sug);
    setSugCampo('codigo');
  };

  const handleNombreChange = (value: string) => {
    setFormData({ ...formData, nombreMateriaPrima: value });
    if (value.length > 0) {
      buscarMateriaPrima(value, 'nombre');
    }
    const sug = materiasPrimas
      .filter(m => m.nombreMateriaPrima.toLowerCase().includes(value.toLowerCase()))
      .slice(0, 8);
    setSugerencias(sug);
    setSugCampo('nombre');
  };
  const agregarMateriaPrima = async () => {
    if (!materiaPrimaSeleccionada || !formData.cantidadKg) {
      setMensajeConfirmacion('Todos los campos son requeridos');
      setShowModalConfirmacion(true);
      return;
    }

    try {
      const token = authService.getToken();
      if (!token) {
        setMensajeConfirmacion('No autenticado');
        setShowModalConfirmacion(true);
        return;
      }

      const cantidad = parseFloat(formData.cantidadKg);
      
      // Agregar detalle a la fórmula
      await apiClient.agregarDetalleFormula(token, idGranja, idFormula, {
        idMateriaPrima: materiaPrimaSeleccionada.id,
        cantidadKg: cantidad,
      });

      setMensajeConfirmacion(
        `✅ Materia prima agregada exitosamente:\n\n` +
        `Código: ${materiaPrimaSeleccionada.codigoMateriaPrima}\n` +
        `Nombre: ${materiaPrimaSeleccionada.nombreMateriaPrima}\n` +
        `Cantidad: ${cantidad} kg\n` +
        `Precio: $${materiaPrimaSeleccionada.precioPorKilo}/kg\n` +
        `Subtotal: $${(cantidad * materiaPrimaSeleccionada.precioPorKilo).toFixed(2)}`
      );
      setShowModalConfirmacion(true);
      
      setShowModalAgregar(false);
      setFormData({ 
        idMateriaPrima: '', 
        codigoMateriaPrima: '', 
        nombreMateriaPrima: '',
        cantidadKg: '' 
      });
      setMateriaPrimaSeleccionada(null);
      
      // Recargar datos para mostrar el nuevo detalle
      await cargarDatos();
    } catch (error: unknown) {
      console.error('Error agregando materia prima:', error);
      setMensajeConfirmacion(error instanceof Error ? error.message : 'Error al agregar materia prima');
      setShowModalConfirmacion(true);
    }
  };

  const editarMateriaPrima = async () => {
    if (!editando || !formData.cantidadKg) {
      setMensajeConfirmacion('Cantidad es requerida');
      setShowModalConfirmacion(true);
      return;
    }

    try {
      const token = authService.getToken();
      if (!token) {
        setMensajeConfirmacion('No autenticado');
        setShowModalConfirmacion(true);
        return;
      }

      const cantidad = parseFloat(formData.cantidadKg);
      
      // Actualizar detalle de la fórmula
      await apiClient.actualizarDetalleFormula(token, idGranja, idFormula, editando.id, {
        cantidadKg: cantidad,
      });

      setMensajeConfirmacion(
        `✅ Materia prima actualizada exitosamente:\n\n` +
        `Código: ${editando.materiaPrima.codigoMateriaPrima}\n` +
        `Nombre: ${editando.materiaPrima.nombreMateriaPrima}\n` +
        `Nueva cantidad: ${cantidad} kg\n` +
        `Precio: $${editando.precioUnitarioMomentoCreacion}/kg\n` +
        `Nuevo subtotal: $${(cantidad * editando.precioUnitarioMomentoCreacion).toFixed(2)}`
      );
      setShowModalConfirmacion(true);
      
      setShowModalEditar(false);
      setEditando(null);
      setFormData({ 
        idMateriaPrima: '', 
        codigoMateriaPrima: '', 
        nombreMateriaPrima: '',
        cantidadKg: '' 
      });
      
      // Recargar datos para mostrar los cambios
      await cargarDatos();
    } catch (error: unknown) {
      console.error('Error editando materia prima:', error);
      setMensajeConfirmacion(error instanceof Error ? error.message : 'Error al editar materia prima');
      setShowModalConfirmacion(true);
    }
  };

  const eliminarMateriaPrima = async () => {
    if (!eliminando) return;

    try {
      const token = authService.getToken();
      if (!token) {
        setMensajeConfirmacion('No autenticado');
        setShowModalConfirmacion(true);
        return;
      }

      // Eliminar detalle de la fórmula
      await apiClient.eliminarDetalleFormula(token, idGranja, idFormula, eliminando.id);

      setMensajeConfirmacion(
        `✅ Materia prima eliminada exitosamente:\n\n` +
        `Código: ${eliminando.materiaPrima.codigoMateriaPrima}\n` +
        `Nombre: ${eliminando.materiaPrima.nombreMateriaPrima}\n` +
        `Cantidad eliminada: ${eliminando.cantidadKg} kg\n` +
        `Subtotal eliminado: $${eliminando.costoParcial.toFixed(2)}`
      );
      setShowModalConfirmacion(true);
      
      setShowModalEliminar(false);
      setEliminando(null);
      
      // Recargar datos para mostrar los cambios
      await cargarDatos();
    } catch (error: unknown) {
      console.error('Error eliminando materia prima:', error);
      setMensajeConfirmacion(error instanceof Error ? error.message : 'Error al eliminar materia prima');
      setShowModalConfirmacion(true);
    }
  };

  const imprimirFormula = () => {
    alert('Función de imprimir próximamente');
  };

  const calcularPesoTotal = () => {
    if (!formula) return 0;
    return formula.formulasDetalle.reduce((sum, detalle) => sum + detalle.cantidadKg, 0);
  };

  const calcularCostoTotal = () => {
    if (!formula) return 0;
    return formula.formulasDetalle.reduce((sum, detalle) => sum + detalle.costoParcial, 0);
  };

  const pesoTotal = calcularPesoTotal();
  const costoTotal = calcularCostoTotal();
  const pesoCorrecto = Math.abs(pesoTotal - 1000) < 0.1; // Tolerancia de 0.1kg

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

  if (!formula) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FAFAE4]">
        <div className="text-center">
          <p className="text-gray-600">Fórmula no encontrada</p>
          <button
            onClick={() => router.push(`/granja/${idGranja}/formulas`)}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-[#B6CCAE] to-[#9AAB64] text-gray-900 rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Volver a Fórmulas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#FAFAE4]">
      <Sidebar />

      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Detalle de Fórmula: {formula.codigoFormula}
              </h2>
              <p className="text-gray-600 mt-1">
                {formula.descripcionFormula || 'Sin descripción'} - {formula.animal.descripcionAnimal}
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={imprimirFormula}
                className="px-6 py-3 bg-gradient-to-r from-[#FAD863] to-[#F8C540] text-gray-900 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
              >
                <span>🖨️</span>
                Imprimir
              </button>
              <button
                onClick={() => setShowModalAgregar(true)}
                className="px-6 py-3 bg-gradient-to-r from-[#B6CCAE] to-[#9AAB64] text-gray-900 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
              >
                <span>+</span>
                Añadir Materia Prima
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-8 space-y-8">
          {/* Navegación */}
          {formulas.length > 1 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={navegarAnterior}
                    disabled={getIndiceActual() === 1}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                      getIndiceActual() === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#B6CCAE] to-[#9AAB64] text-gray-900 hover:shadow-md'
                    }`}
                  >
                    <span>←</span>
                    <span className="text-sm">Anterior</span>
                  </button>
                  
                  <div className="px-4 py-2 bg-gray-100 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      {getIndiceActual()} de {formulas.length}
                    </span>
                  </div>
                  
                  <button
                    onClick={navegarSiguiente}
                    disabled={getIndiceActual() === formulas.length}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                      getIndiceActual() === formulas.length
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#B6CCAE] to-[#9AAB64] text-gray-900 hover:shadow-md'
                    }`}
                  >
                    <span className="text-sm">Siguiente</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tabla de detalles */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#B6CAEB] to-[#9DB5D9] text-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Código</th>
                    <th className="px-6 py-4 text-left font-semibold">Nombre</th>
                    <th className="px-6 py-4 text-left font-semibold">Cantidad (kg)</th>
                    <th className="px-6 py-4 text-left font-semibold">Precio Unit.</th>
                    <th className="px-6 py-4 text-left font-semibold">Subtotal</th>
                    <th className="px-6 py-4 text-center font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {formula.formulasDetalle.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No hay materias primas agregadas
                      </td>
                    </tr>
                  ) : (
                    formula.formulasDetalle.map((detalle) => (
                      <tr key={detalle.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-gray-900 font-medium">
                          {detalle.materiaPrima.codigoMateriaPrima}
                        </td>
                        <td className="px-6 py-4 text-gray-900">
                          {detalle.materiaPrima.nombreMateriaPrima}
                        </td>
                        <td className="px-6 py-4 text-gray-900">
                          {detalle.cantidadKg.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-gray-900">
                          ${detalle.precioUnitarioMomentoCreacion.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-gray-900 font-medium">
                          ${detalle.costoParcial.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditando(detalle);
                                setFormData({ 
                                  idMateriaPrima: detalle.materiaPrima.id, 
                                  codigoMateriaPrima: detalle.materiaPrima.codigoMateriaPrima,
                                  nombreMateriaPrima: detalle.materiaPrima.nombreMateriaPrima,
                                  cantidadKg: detalle.cantidadKg.toString() 
                                });
                                setShowModalEditar(true);
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-[#B6CAEB] to-[#9DB5D9] text-gray-900 rounded-lg font-semibold hover:shadow-md transition-all text-sm"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => {
                                setEliminando(detalle);
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

          {/* Informe de costos */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Informe de Fórmula</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-700 font-medium">Peso Total:</span>
                  <span className={`text-lg font-bold ${pesoCorrecto ? 'text-green-600' : 'text-red-600'}`}>
                    {pesoTotal.toFixed(2)} kg
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-700 font-medium">Costo Total:</span>
                  <span className="text-lg font-bold text-gray-900">
                    ${costoTotal.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-700 font-medium">Peso Objetivo:</span>
                  <span className="text-lg font-bold text-gray-900">1000.00 kg</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-700 font-medium">Diferencia:</span>
                  <span className={`text-lg font-bold ${pesoCorrecto ? 'text-green-600' : 'text-red-600'}`}>
                    {(pesoTotal - 1000).toFixed(2)} kg
                  </span>
                </div>
              </div>
            </div>
            
            {!pesoCorrecto && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-red-600 text-xl">⚠️</span>
                  <p className="text-red-700 font-medium">
                    El peso total debe ser exactamente 1000 kg. Actualmente es {pesoTotal.toFixed(2)} kg.
                    {pesoTotal < 1000 ? ' Necesitas agregar más materias primas.' : ' Necesitas reducir la cantidad de materias primas.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal Agregar Materia Prima */}
      <Modal
        isOpen={showModalAgregar}
        onClose={() => setShowModalAgregar(false)}
        title="Añadir Materia Prima"
        footer={
          <>
            <button
              onClick={() => setShowModalAgregar(false)}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={agregarMateriaPrima}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#B6CCAE] to-[#9AAB64] text-gray-900 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Agregar
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código Materia Prima *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.codigoMateriaPrima}
                onChange={(e) => handleCodigoChange(e.target.value)}
                onFocus={() => { setSugCampo('codigo'); setSugerencias(materiasPrimas.slice(0,8)); }}
                onBlur={() => setTimeout(() => { setSugCampo(null); }, 150)}
                placeholder="Ej: MP001"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B6CCAE] focus:outline-none transition-all"
              />
              {sugCampo === 'codigo' && sugerencias.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                  {sugerencias.map((mp) => (
                    <button
                      key={mp.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setFormData({ ...formData, codigoMateriaPrima: mp.codigoMateriaPrima, nombreMateriaPrima: mp.nombreMateriaPrima, idMateriaPrima: mp.id });
                        setMateriaPrimaSeleccionada(mp);
                        setSugCampo(null);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50"
                    >
                      <span className="font-medium">{mp.codigoMateriaPrima}</span> — <span className="text-gray-600">{mp.nombreMateriaPrima}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Materia Prima *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.nombreMateriaPrima}
                onChange={(e) => handleNombreChange(e.target.value)}
                onFocus={() => { setSugCampo('nombre'); setSugerencias(materiasPrimas.slice(0,8)); }}
                onBlur={() => setTimeout(() => { setSugCampo(null); }, 150)}
                placeholder="Ej: MAIZ"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B6CCAE] focus:outline-none transition-all"
              />
              {sugCampo === 'nombre' && sugerencias.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                  {sugerencias.map((mp) => (
                    <button
                      key={mp.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setFormData({ ...formData, codigoMateriaPrima: mp.codigoMateriaPrima, nombreMateriaPrima: mp.nombreMateriaPrima, idMateriaPrima: mp.id });
                        setMateriaPrimaSeleccionada(mp);
                        setSugCampo(null);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50"
                    >
                      <span className="font-medium">{mp.nombreMateriaPrima}</span> — <span className="text-gray-600">{mp.codigoMateriaPrima}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {materiaPrimaSeleccionada && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-800">
                <strong>Precio por kilo:</strong> ${materiaPrimaSeleccionada.precioPorKilo.toFixed(2)}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad (kg) *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.cantidadKg}
              onChange={(e) => setFormData({ ...formData, cantidadKg: e.target.value })}
              placeholder="0.00"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B6CCAE] focus:outline-none transition-all"
            />
            {materiaPrimaSeleccionada && formData.cantidadKg && (
              <p className="text-sm text-gray-600 mt-2">
                Subtotal estimado: ${(parseFloat(formData.cantidadKg) * materiaPrimaSeleccionada.precioPorKilo).toFixed(2)}
              </p>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal Editar Materia Prima */}
      <Modal
        isOpen={showModalEditar}
        onClose={() => setShowModalEditar(false)}
        title="Editar Materia Prima"
        footer={
          <>
            <button
              onClick={() => setShowModalEditar(false)}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={editarMateriaPrima}
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
              Cantidad (kg) *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.cantidadKg}
              onChange={(e) => setFormData({ ...formData, cantidadKg: e.target.value })}
              placeholder="0.00"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B6CCAE] focus:outline-none transition-all"
            />
          </div>
        </div>
      </Modal>

      {/* Modal Eliminar Materia Prima */}
      <Modal
        isOpen={showModalEliminar}
        onClose={() => setShowModalEliminar(false)}
        title="Eliminar Materia Prima"
        footer={
          <>
            <button
              onClick={() => setShowModalEliminar(false)}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={eliminarMateriaPrima}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all"
            >
              Eliminar
            </button>
          </>
        }
      >
        <p className="text-gray-700">
          ¿Está seguro de que desea eliminar <strong>{eliminando?.materiaPrima.nombreMateriaPrima}</strong> de esta fórmula?
          <br />
          Esta acción no se puede deshacer.
        </p>
      </Modal>
      {/* Modal Confirmación */}
      <Modal
        isOpen={showModalConfirmacion}
        onClose={() => setShowModalConfirmacion(false)}
        title="Confirmación"
        footer={
          <button
            onClick={() => setShowModalConfirmacion(false)}
            className="w-full px-6 py-3 bg-gradient-to-r from-[#B6CCAE] to-[#9AAB64] text-gray-900 rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Aceptar
          </button>
        }
      >
        <div className="p-4">
          <p className="text-gray-700 whitespace-pre-line">{mensajeConfirmacion}</p>
        </div>
      </Modal>
    </div>
  );
}
