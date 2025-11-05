'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authService } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import { Modal } from '@/components/ui';
import { useNotification } from '@/contexts/NotificationContext';

interface MateriaPrima {
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
    id: string;
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
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showModalEditarCabecera, setShowModalEditarCabecera] = useState(false);
  const [isEditingCabecera, setIsEditingCabecera] = useState(false);
  const [animales, setAnimales] = useState<Array<{ id: string; codigoAnimal: string; descripcionAnimal: string; categoriaAnimal: string }>>([]);
  const [cabeceraData, setCabeceraData] = useState({
    codigoFormula: '',
    descripcionFormula: '',
    idAnimal: '',
  });
  const [formData, setFormData] = useState({
    idMateriaPrima: '',
    codigoMateriaPrima: '',
    nombreMateriaPrima: '',
    cantidadKg: '',
  });
  const [itemsData, setItemsData] = useState<Array<{
    idMateriaPrima: string;
    codigoMateriaPrima: string;
    nombreMateriaPrima: string;
    cantidadKg: string;
    materiaPrimaSeleccionada: MateriaPrima | null;
  }>>([{
    idMateriaPrima: '',
    codigoMateriaPrima: '',
    nombreMateriaPrima: '',
    cantidadKg: '',
    materiaPrimaSeleccionada: null,
  }]);
  const [sugerenciasMultiples, setSugerenciasMultiples] = useState<Array<{
    sugerencias: MateriaPrima[];
    campo: 'codigo' | 'nombre' | null;
  }>>([{ sugerencias: [], campo: null }]);
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

        // Cargar animales para el dropdown
        const animalesData = await apiClient.getAnimales(token, idGranja);
        setAnimales(animalesData);

        // Inicializar datos de cabecera
        if (formulaData) {
          setCabeceraData({
            codigoFormula: formulaData.codigoFormula,
            descripcionFormula: formulaData.descripcionFormula || '',
            idAnimal: formulaData.animal.id || '',
          });
        }
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

  // Funciones para múltiples items
  const agregarFilaItem = () => {
    setItemsData(prev => [...prev, {
      idMateriaPrima: '',
      codigoMateriaPrima: '',
      nombreMateriaPrima: '',
      cantidadKg: '',
      materiaPrimaSeleccionada: null,
    }]);
    setSugerenciasMultiples(prev => [...prev, { sugerencias: [], campo: null }]);
  };

  const eliminarFilaItem = (index: number) => {
    if (itemsData.length === 1) return; // No permitir eliminar la última fila
    setItemsData(prev => prev.filter((_, i) => i !== index));
    setSugerenciasMultiples(prev => prev.filter((_, i) => i !== index));
  };

  const actualizarItemData = (index: number, campo: string, valor: string | MateriaPrima | null) => {
    setItemsData(prev => prev.map((item, i) => {
      if (i === index) {
        if (campo === 'materiaPrimaSeleccionada') {
          return { ...item, materiaPrimaSeleccionada: valor as MateriaPrima | null };
        } else {
          return { ...item, [campo]: valor };
        }
      }
      return item;
    }));
  };

  const buscarSugerenciasMultiples = (valor: string, campo: 'codigo' | 'nombre', index: number) => {
    if (valor.length < 1) {
      setSugerenciasMultiples(prev => prev.map((sug, i) => 
        i === index ? { sugerencias: [], campo: null } : sug
      ));
      actualizarItemData(index, 'idMateriaPrima', '');
      actualizarItemData(index, 'codigoMateriaPrima', campo === 'codigo' ? '' : itemsData[index].codigoMateriaPrima);
      actualizarItemData(index, 'nombreMateriaPrima', campo === 'nombre' ? '' : itemsData[index].nombreMateriaPrima);
      actualizarItemData(index, 'materiaPrimaSeleccionada', null);
      return;
    }

    setSugerenciasMultiples(prev => prev.map((sug, i) => 
      i === index ? { ...sug, campo } : sug
    ));

    const busqueda = valor.toLowerCase();
    const filtradas = materiasPrimas.filter((mp) => {
      if (campo === 'codigo') {
        return mp.codigoMateriaPrima.toLowerCase().includes(busqueda);
      } else {
        return mp.nombreMateriaPrima.toLowerCase().includes(busqueda);
      }
    });

    setSugerenciasMultiples(prev => prev.map((sug, i) => 
      i === index ? { sugerencias: filtradas.slice(0, 10), campo } : sug
    ));
  };

  const seleccionarMateriaPrimaMultiples = (mp: MateriaPrima, index: number) => {
    actualizarItemData(index, 'materiaPrimaSeleccionada', mp);
    actualizarItemData(index, 'idMateriaPrima', mp.id);
    actualizarItemData(index, 'codigoMateriaPrima', mp.codigoMateriaPrima);
    actualizarItemData(index, 'nombreMateriaPrima', mp.nombreMateriaPrima);
    
    setSugerenciasMultiples(prev => prev.map((sug, i) => 
      i === index ? { sugerencias: [], campo: null } : sug
    ));
  };
  const agregarMateriaPrima = async () => {
    if (isAdding) return; // Prevenir múltiples clicks

    // Validar todos los items
    const itemsValidos: Array<{
      idMateriaPrima: string;
      cantidadKg: number;
    }> = [];

    for (let i = 0; i < itemsData.length; i++) {
      const item = itemsData[i];
      
      if (!item.materiaPrimaSeleccionada || !item.cantidadKg) {
        setMensajeConfirmacion(`Fila ${i + 1}: Complete todos los campos requeridos`);
        setShowModalConfirmacion(true);
        return;
      }

      // Evitar duplicados: si la MP ya existe en el detalle
      const yaExiste = formula?.formulasDetalle.some(d => d.materiaPrima.id === item.materiaPrimaSeleccionada!.id);
      if (yaExiste) {
        setMensajeConfirmacion(`Fila ${i + 1}: La materia prima "${item.materiaPrimaSeleccionada.codigoMateriaPrima}" ya está incluida en la fórmula`);
        setShowModalConfirmacion(true);
        return;
      }

      // Evitar duplicados dentro del mismo formulario
      const duplicadoEnFormulario = itemsData.slice(0, i).some(otherItem => 
        otherItem.materiaPrimaSeleccionada?.id === item.materiaPrimaSeleccionada.id
      );
      if (duplicadoEnFormulario) {
        setMensajeConfirmacion(`Fila ${i + 1}: La materia prima "${item.materiaPrimaSeleccionada.codigoMateriaPrima}" ya está en otra fila`);
        setShowModalConfirmacion(true);
        return;
      }

      const cantidad = parseFloat(item.cantidadKg);
      if (isNaN(cantidad) || cantidad <= 0) {
        setMensajeConfirmacion(`Fila ${i + 1}: La cantidad debe ser mayor a 0`);
        setShowModalConfirmacion(true);
        return;
      }

      itemsValidos.push({
        idMateriaPrima: item.materiaPrimaSeleccionada.id,
        cantidadKg: cantidad,
      });
    }

    if (itemsValidos.length === 0) {
      setMensajeConfirmacion('Agregue al menos un item válido');
      setShowModalConfirmacion(true);
      return;
    }

    setIsAdding(true);
    try {
      const token = authService.getToken();
      if (!token) {
        setMensajeConfirmacion('No autenticado');
        setShowModalConfirmacion(true);
        setIsAdding(false);
        return;
      }

      // Agregar todos los items
      for (const item of itemsValidos) {
        await apiClient.agregarDetalleFormula(token, idGranja, idFormula, item);
      }

      setMensajeConfirmacion(`✅ ${itemsValidos.length} materia(s) prima(s) agregada(s) exitosamente`);
      setShowModalConfirmacion(true);
      
      setShowModalAgregar(false);
      // Resetear a una sola fila vacía
      setItemsData([{
        idMateriaPrima: '',
        codigoMateriaPrima: '',
        nombreMateriaPrima: '',
        cantidadKg: '',
        materiaPrimaSeleccionada: null,
      }]);
      setSugerenciasMultiples([{ sugerencias: [], campo: null }]);
      
      // Recargar datos para mostrar los nuevos detalles
      await cargarDatos();
    } catch (error: unknown) {
      console.error('Error agregando materias primas:', error);
      setMensajeConfirmacion(error instanceof Error ? error.message : 'Error al agregar materias primas');
      setShowModalConfirmacion(true);
    } finally {
      setIsAdding(false);
    }
  };

  const editarMateriaPrima = async () => {
    if (!editando || !formData.cantidadKg) {
      setMensajeConfirmacion('Cantidad es requerida');
      setShowModalConfirmacion(true);
      return;
    }

    if (isEditing) return; // Prevenir múltiples clicks

    setIsEditing(true);
    try {
      const token = authService.getToken();
      if (!token) {
        setMensajeConfirmacion('No autenticado');
        setShowModalConfirmacion(true);
        setIsEditing(false);
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
    } finally {
      setIsEditing(false);
    }
  };

  const editarCabecera = async () => {
    if (isEditingCabecera) return; // Prevenir múltiples clicks

    setIsEditingCabecera(true);
    try {
      const token = authService.getToken();
      if (!token) {
        setMensajeConfirmacion('No autenticado');
        setShowModalConfirmacion(true);
        setIsEditingCabecera(false);
        return;
      }

      await apiClient.updateFormula(token, idGranja, idFormula, {
        codigoFormula: cabeceraData.codigoFormula || undefined,
        descripcionFormula: cabeceraData.descripcionFormula || undefined,
        idAnimal: cabeceraData.idAnimal || undefined,
      });

      setMensajeConfirmacion(`✅ Cabecera de fórmula actualizada exitosamente`);
      setShowModalConfirmacion(true);

      setShowModalEditarCabecera(false);
      await cargarDatos();
    } catch (error: unknown) {
      console.error('Error editando cabecera:', error);
      setMensajeConfirmacion(error instanceof Error ? error.message : 'Error al editar cabecera de fórmula');
      setShowModalConfirmacion(true);
    } finally {
      setIsEditingCabecera(false);
    }
  };

  const eliminarMateriaPrima = async () => {
    if (!eliminando) return;
    if (isDeleting) return; // Prevenir múltiples clicks

    setIsDeleting(true);
    try {
      const token = authService.getToken();
      if (!token) {
        setMensajeConfirmacion('No autenticado');
        setShowModalConfirmacion(true);
        setIsDeleting(false);
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
    } finally {
      setIsDeleting(false);
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
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground/80">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!formula) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-foreground/80">Fórmula no encontrada</p>
          <button
            onClick={() => router.push(`/granja/${idGranja}/formulas`)}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all"
          >
            Volver a Fórmulas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen ">
      <Sidebar />

      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="glass-card m-4 mb-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground">
                Detalle de Fórmula: {formula.codigoFormula}
              </h2>
              <p className="text-foreground/70 mt-1">
                {formula.descripcionFormula || 'Sin descripción'} - {formula.animal.descripcionAnimal}
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={imprimirFormula}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-400 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
              >
                <span>🖨️</span>
                Imprimir
              </button>
              <button
                onClick={() => {
                  if (formula) {
                    setCabeceraData({
                      codigoFormula: formula.codigoFormula,
                      descripcionFormula: formula.descripcionFormula || '',
                      idAnimal: formula.animal.id || '',
                    });
                  }
                  setShowModalEditarCabecera(true);
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-2"
              >
                Editar Cabecera
              </button>
              <button
                onClick={() => {
                  setItemsData([{
                    idMateriaPrima: '',
                    codigoMateriaPrima: '',
                    nombreMateriaPrima: '',
                    cantidadKg: '',
                    materiaPrimaSeleccionada: null,
                  }]);
                  setSugerenciasMultiples([{ sugerencias: [], campo: null }]);
                  setShowModalAgregar(true);
                }}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2"
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
            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={navegarAnterior}
                    disabled={getIndiceActual() === 1}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                      getIndiceActual() === 1
                        ? 'glass-surface text-foreground/40 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:shadow-md hover:shadow-purple-500/30'
                    }`}
                  >
                    <span>←</span>
                    <span className="text-sm">Anterior</span>
                  </button>
                  
                  <div className="px-4 py-2 glass-surface rounded-lg">
                    <span className="text-sm font-medium text-foreground">
                      {getIndiceActual()} de {formulas.length}
                    </span>
                  </div>
                  
                  <button
                    onClick={navegarSiguiente}
                    disabled={getIndiceActual() === formulas.length}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                      getIndiceActual() === formulas.length
                        ? 'glass-surface text-foreground/40 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:shadow-md hover:shadow-purple-500/30'
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
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-foreground/80">Código</th>
                    <th className="px-6 py-4 text-left font-semibold text-foreground/80">Nombre</th>
                    <th className="px-6 py-4 text-left font-semibold text-foreground/80">Cantidad (kg)</th>
                    <th className="px-6 py-4 text-left font-semibold text-foreground/80">Precio Unit.</th>
                    <th className="px-6 py-4 text-left font-semibold text-foreground/80">Subtotal</th>
                    <th className="px-6 py-4 text-center font-semibold text-foreground/80">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {formula.formulasDetalle.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-foreground/60">
                        No hay materias primas agregadas
                      </td>
                    </tr>
                  ) : (
                    formula.formulasDetalle.map((detalle) => (
                      <tr key={detalle.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-foreground font-medium">
                          {detalle.materiaPrima.codigoMateriaPrima}
                        </td>
                        <td className="px-6 py-4 text-foreground">
                          {detalle.materiaPrima.nombreMateriaPrima}
                        </td>
                        <td className="px-6 py-4 text-foreground/90">
                          {detalle.cantidadKg.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-foreground/90">
                          ${detalle.precioUnitarioMomentoCreacion.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-foreground font-medium">
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
                              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold hover:shadow-md hover:shadow-purple-500/30 transition-all text-sm"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => {
                                setEliminando(detalle);
                                setShowModalEliminar(true);
                              }}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/30 transition-colors text-sm"
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
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold text-foreground mb-4">Informe de Fórmula</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 glass-surface rounded-xl">
                  <span className="text-foreground/70 font-medium">Peso Total:</span>
                  <span className={`text-lg font-bold ${pesoCorrecto ? 'text-green-400' : 'text-red-400'}`}>
                    {pesoTotal.toFixed(2)} kg
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 glass-surface rounded-xl">
                  <span className="text-foreground/70 font-medium">Costo Total:</span>
                  <span className="text-lg font-bold text-foreground">
                    ${costoTotal.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 glass-surface rounded-xl">
                  <span className="text-foreground/70 font-medium">Peso Objetivo:</span>
                  <span className="text-lg font-bold text-foreground">1000.00 kg</span>
                </div>
                <div className="flex justify-between items-center p-4 glass-surface rounded-xl">
                  <span className="text-foreground/70 font-medium">Diferencia:</span>
                  <span className={`text-lg font-bold ${pesoCorrecto ? 'text-green-400' : 'text-red-400'}`}>
                    {(pesoTotal - 1000).toFixed(2)} kg
                  </span>
                </div>
              </div>
            </div>
            
            {!pesoCorrecto && (
              <div className="mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-red-400 text-xl">⚠️</span>
                  <p className="text-red-300 font-medium">
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
        onClose={() => {
          setShowModalAgregar(false);
          setIsAdding(false);
          // Resetear a una sola fila vacía al cerrar
          setItemsData([{
            idMateriaPrima: '',
            codigoMateriaPrima: '',
            nombreMateriaPrima: '',
            cantidadKg: '',
            materiaPrimaSeleccionada: null,
          }]);
          setSugerenciasMultiples([{ sugerencias: [], campo: null }]);
        }}
        title="Añadir Materia Prima"
        size="lg"
        footer={
          <>
            <button
              onClick={() => {
                setShowModalAgregar(false);
                setIsAdding(false);
                setItemsData([{
                  idMateriaPrima: '',
                  codigoMateriaPrima: '',
                  nombreMateriaPrima: '',
                  cantidadKg: '',
                  materiaPrimaSeleccionada: null,
                }]);
                setSugerenciasMultiples([{ sugerencias: [], campo: null }]);
              }}
              disabled={isAdding}
              className="flex-1 px-6 py-3 glass-surface text-foreground rounded-xl font-semibold hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={agregarMateriaPrima}
              disabled={isAdding}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAdding ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Agregando...
                </>
              ) : (
                'Agregar'
              )}
            </button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Botón para agregar fila */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={agregarFilaItem}
              disabled={isAdding}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span>+</span>
              Agregar Fila
            </button>
          </div>

          {/* Filas de items */}
          <div className="space-y-6 max-h-[60vh] overflow-y-auto">
            {itemsData.map((item, index) => (
              <div key={index} className="glass-card p-4 border border-white/10 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground/90">Fila {index + 1}</h3>
                  {itemsData.length > 1 && (
                    <button
                      type="button"
                      onClick={() => eliminarFilaItem(index)}
                      disabled={isAdding}
                      className="px-3 py-1 bg-red-600/20 text-red-400 rounded-lg font-semibold hover:bg-red-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Eliminar
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Código MP */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-foreground/90 mb-2">Código Materia Prima</label>
                    <input
                      type="text"
                      value={item.codigoMateriaPrima}
                      onChange={(e) => {
                        const nuevoValor = e.target.value;
                        actualizarItemData(index, 'codigoMateriaPrima', nuevoValor);
                        buscarSugerenciasMultiples(nuevoValor, 'codigo', index);
                      }}
                      onFocus={() => {
                        if (item.codigoMateriaPrima) buscarSugerenciasMultiples(item.codigoMateriaPrima, 'codigo', index);
                      }}
                      placeholder="Ej: MP001"
                      className="glass-input"
                      disabled={isAdding}
                    />
                    {sugerenciasMultiples[index]?.campo === 'codigo' && sugerenciasMultiples[index]?.sugerencias.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 glass-dropdown rounded-xl shadow-lg max-h-60 overflow-auto">
                        {sugerenciasMultiples[index].sugerencias.map((mp) => (
                          <div
                            key={mp.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              seleccionarMateriaPrimaMultiples(mp, index);
                            }}
                            className="px-4 py-2 hover:bg-white/10 cursor-pointer"
                          >
                            <div className="font-medium text-foreground">{mp.codigoMateriaPrima}</div>
                            <div className="text-sm text-foreground/70">{mp.nombreMateriaPrima}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Nombre MP */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-foreground/90 mb-2">Nombre Materia Prima</label>
                    <input
                      type="text"
                      value={item.nombreMateriaPrima}
                      onChange={(e) => {
                        const nuevoValor = e.target.value;
                        actualizarItemData(index, 'nombreMateriaPrima', nuevoValor);
                        buscarSugerenciasMultiples(nuevoValor, 'nombre', index);
                      }}
                      onFocus={() => {
                        if (item.nombreMateriaPrima) buscarSugerenciasMultiples(item.nombreMateriaPrima, 'nombre', index);
                      }}
                      placeholder="Ej: MAIZ"
                      className="glass-input"
                      disabled={isAdding}
                    />
                    {sugerenciasMultiples[index]?.campo === 'nombre' && sugerenciasMultiples[index]?.sugerencias.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 glass-dropdown rounded-xl shadow-lg max-h-60 overflow-auto">
                        {sugerenciasMultiples[index].sugerencias.map((mp) => (
                          <div
                            key={mp.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              seleccionarMateriaPrimaMultiples(mp, index);
                            }}
                            className="px-4 py-2 hover:bg-white/10 cursor-pointer"
                          >
                            <div className="font-medium text-foreground">{mp.codigoMateriaPrima}</div>
                            <div className="text-sm text-foreground/70">{mp.nombreMateriaPrima}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {item.materiaPrimaSeleccionada && (
                    <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl">
                      <p className="text-sm text-emerald-300">
                        <strong>Precio por kilo:</strong> ${item.materiaPrimaSeleccionada.precioPorKilo.toFixed(2)}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-foreground/90 mb-2">Cantidad (kg) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.cantidadKg}
                      onChange={(e) => {
                        actualizarItemData(index, 'cantidadKg', e.target.value);
                      }}
                      placeholder="0.00"
                      className="glass-input"
                      required
                      disabled={isAdding}
                    />
                    {item.materiaPrimaSeleccionada && item.cantidadKg && (
                      <p className="text-sm text-foreground/60 mt-2">
                        Subtotal estimado: ${(parseFloat(item.cantidadKg) * item.materiaPrimaSeleccionada.precioPorKilo).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Modal Editar Materia Prima */}
      <Modal
        isOpen={showModalEditar}
        onClose={() => {
          setShowModalEditar(false);
          setIsEditing(false);
        }}
        title="Editar Materia Prima"
        footer={
          <>
            <button
              onClick={() => {
                setShowModalEditar(false);
                setIsEditing(false);
              }}
              disabled={isEditing}
              className="flex-1 px-6 py-3 glass-surface text-foreground rounded-xl font-semibold hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={editarMateriaPrima}
              disabled={isEditing}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isEditing ? (
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
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Materia Prima
            </label>
            <input
              type="text"
              value={editando?.materiaPrima.nombreMateriaPrima || ''}
              disabled
              className="glass-input bg-white/[0.02] cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Cantidad (kg) *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.cantidadKg}
              onChange={(e) => setFormData({ ...formData, cantidadKg: e.target.value })}
              placeholder="0.00"
              className="glass-input"
              disabled={isEditing}
            />
          </div>
        </div>
      </Modal>

      {/* Modal Eliminar Materia Prima */}
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
              className="flex-1 px-6 py-3 glass-surface text-foreground rounded-xl font-semibold hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={eliminarMateriaPrima}
              disabled={isDeleting}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        <p className="text-foreground/90">
          ¿Está seguro de que desea eliminar <strong>{eliminando?.materiaPrima.nombreMateriaPrima}</strong> de esta fórmula?
          <br />
          Esta acción no se puede deshacer.
        </p>
      </Modal>
      {/* Modal Editar Cabecera */}
      <Modal
        isOpen={showModalEditarCabecera}
        onClose={() => {
          setShowModalEditarCabecera(false);
          setIsEditingCabecera(false);
        }}
        title="Editar Cabecera de Fórmula"
        size="lg"
        footer={
          <>
            <button
              onClick={() => {
                setShowModalEditarCabecera(false);
                setIsEditingCabecera(false);
              }}
              disabled={isEditingCabecera}
              className="flex-1 px-6 py-3 glass-surface text-foreground rounded-xl font-semibold hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={editarCabecera}
              disabled={isEditingCabecera}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isEditingCabecera ? (
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
            <label className="block text-sm font-medium text-foreground/90 mb-2">Código de Fórmula *</label>
            <input
              type="text"
              value={cabeceraData.codigoFormula}
              onChange={(e) => setCabeceraData({ ...cabeceraData, codigoFormula: e.target.value })}
              placeholder="Ej: F001"
              className="glass-input"
              disabled={isEditingCabecera}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-2">Descripción (Opcional)</label>
            <input
              type="text"
              value={cabeceraData.descripcionFormula}
              onChange={(e) => setCabeceraData({ ...cabeceraData, descripcionFormula: e.target.value })}
              placeholder="Ej: Fórmula para lechones"
              className="glass-input"
              disabled={isEditingCabecera}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-2">Pienso *</label>
            <select
              value={cabeceraData.idAnimal}
              onChange={(e) => setCabeceraData({ ...cabeceraData, idAnimal: e.target.value })}
              className="glass-input"
              disabled={isEditingCabecera}
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

      {/* Modal Confirmación */}
      <Modal
        isOpen={showModalConfirmacion}
        onClose={() => setShowModalConfirmacion(false)}
        title="Confirmación"
        footer={
          <button
            onClick={() => setShowModalConfirmacion(false)}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all"
          >
            Aceptar
          </button>
        }
      >
        <div className="p-4">
          <p className="text-foreground/90 whitespace-pre-line">{mensajeConfirmacion}</p>
        </div>
      </Modal>
    </div>
  );
}
