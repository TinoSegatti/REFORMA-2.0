'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authService } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import { Modal } from '@/components/ui';
import { ShoppingCart } from 'lucide-react';

interface MateriaPrima {
  id: string;
  codigoMateriaPrima: string;
  nombreMateriaPrima: string;
  precioPorKilo: number;
}

interface Proveedor {
  id: string;
  codigoProveedor: string;
  nombreProveedor: string;
}

interface CompraDetalle {
  id: string;
  cantidadComprada: number;
  precioUnitario: number;
  subtotal: number;
  materiaPrima: MateriaPrima;
}

interface Compra {
  id: string;
  numeroFactura: string | null;
  fechaCompra: string;
  totalFactura: number;
  observaciones: string | null;
  proveedor: Proveedor;
  comprasDetalle: CompraDetalle[];
}

export default function CompraDetallePage() {
  const router = useRouter();
  const params = useParams();
  const idGranja = params.id as string;
  const idCompra = params.idCompra as string;

  const [user, setUser] = useState<{ id: string; email: string; tipoUsuario: string } | null>(null);
  const [compra, setCompra] = useState<Compra | null>(null);
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrima[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModalAgregar, setShowModalAgregar] = useState(false);
  const [showModalEditar, setShowModalEditar] = useState(false);
  const [showModalEliminar, setShowModalEliminar] = useState(false);
  const [showModalConfirmacion, setShowModalConfirmacion] = useState(false);
  const [showModalEditarCabecera, setShowModalEditarCabecera] = useState(false);
  const [showModalEliminarTodos, setShowModalEliminarTodos] = useState(false);
  const [confirmacionEliminarTodos, setConfirmacionEliminarTodos] = useState('');
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState('');
  const [editando, setEditando] = useState<CompraDetalle | null>(null);
  const [eliminando, setEliminando] = useState<CompraDetalle | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingCabecera, setIsEditingCabecera] = useState(false);
  const [isEliminandoTodos, setIsEliminandoTodos] = useState(false);
  const [formData, setFormData] = useState({
    idMateriaPrima: '',
    codigoMateriaPrima: '',
    nombreMateriaPrima: '',
    cantidadComprada: '',
    precioUnitario: '',
    subtotal: '',
  });
  const [itemsData, setItemsData] = useState<Array<{
    idMateriaPrima: string;
    codigoMateriaPrima: string;
    nombreMateriaPrima: string;
    cantidadComprada: string;
    precioUnitario: string;
    subtotal: string;
    materiaPrimaSeleccionada: MateriaPrima | null;
    ultimoPrecio: number | null;
  }>>([{
    idMateriaPrima: '',
    codigoMateriaPrima: '',
    nombreMateriaPrima: '',
    cantidadComprada: '',
    precioUnitario: '',
    subtotal: '',
    materiaPrimaSeleccionada: null,
    ultimoPrecio: null,
  }]);
  const [sugerenciasMultiples, setSugerenciasMultiples] = useState<Array<{
    sugerencias: MateriaPrima[];
    campo: 'codigo' | 'nombre' | null;
  }>>([{ sugerencias: [], campo: null }]);
  const [cabeceraData, setCabeceraData] = useState({
    numeroFactura: '',
    fechaCompra: '',
    observaciones: '',
    idProveedor: '',
  });
  const [materiaPrimaSeleccionada, setMateriaPrimaSeleccionada] = useState<MateriaPrima | null>(null);
  const [ultimoPrecio, setUltimoPrecio] = useState<number | null>(null);
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
  }, [router, idCompra]);

  const cargarDatos = async () => {
    try {
      const token = authService.getToken();
      if (!token) return;

      const [compraData, mps, provs] = await Promise.all([
        apiClient.getCompraPorId(token, idGranja, idCompra),
        apiClient.getMateriasPrimas(token, idGranja),
        apiClient.getProveedores(token, idGranja),
      ]);

      setCompra(compraData);
      setMateriasPrimas(mps);
      setProveedores(provs);

      if (compraData) {
        setCabeceraData({
          numeroFactura: compraData.numeroFactura || '',
          fechaCompra: compraData.fechaCompra.split('T')[0],
          observaciones: compraData.observaciones || '',
          idProveedor: compraData.proveedor.id,
        });
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (n: number) => Number(n).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });

  // Autocompletado
  const buscarSugerencias = (valor: string, campo: 'codigo' | 'nombre') => {
    if (valor.length < 1) {
      setSugerencias([]);
      setSugCampo(null);
      // Si se borra el campo, limpiar materia prima seleccionada y el otro campo relacionado
      if (materiaPrimaSeleccionada) {
        // Si había una materia prima seleccionada, limpiar ambos campos
        setFormData(prev => ({
          ...prev,
          idMateriaPrima: '',
          codigoMateriaPrima: '',
          nombreMateriaPrima: '',
        }));
        setMateriaPrimaSeleccionada(null);
        setUltimoPrecio(null);
      } else {
        // Si no había selección, solo limpiar el campo actual
        setFormData(prev => ({
          ...prev,
          idMateriaPrima: '',
          codigoMateriaPrima: campo === 'codigo' ? '' : prev.codigoMateriaPrima,
          nombreMateriaPrima: campo === 'nombre' ? '' : prev.nombreMateriaPrima,
        }));
      }
      return;
    }

    setSugCampo(campo);
    const busqueda = valor.toLowerCase();
    const filtradas = materiasPrimas.filter((mp) => {
      if (campo === 'codigo') {
        return mp.codigoMateriaPrima.toLowerCase().includes(busqueda);
      } else {
        return mp.nombreMateriaPrima.toLowerCase().includes(busqueda);
      }
    });
    setSugerencias(filtradas.slice(0, 10));
  };

  const seleccionarMateriaPrima = (mp: MateriaPrima) => {
    setMateriaPrimaSeleccionada(mp);
    setFormData({
      ...formData,
      idMateriaPrima: mp.id,
      codigoMateriaPrima: mp.codigoMateriaPrima,
      nombreMateriaPrima: mp.nombreMateriaPrima,
    });
    setSugerencias([]);
    setSugCampo(null);

    // Cargar último precio
    cargarUltimoPrecio(mp.id);
  };

  const cargarUltimoPrecio = async (idMateriaPrima: string) => {
    try {
      const token = authService.getToken();
      if (!token) return;
      const precio = await apiClient.getUltimoPrecio(token, idGranja, idMateriaPrima);
      setUltimoPrecio(precio);
      if (precio !== null && precio !== undefined) {
        setFormData(prev => ({ ...prev, precioUnitario: precio.toFixed(4) }));
      }
    } catch (error) {
      console.error('Error cargando último precio:', error);
    }
  };

  // Cálculo bidireccional: cantidad × precio = subtotal, o subtotal / cantidad = precio
  // Solo calcular cuando el usuario sale del campo (onBlur) para no interferir mientras escribe
  const calcularDesdePrecio = () => {
    const cantidad = parseFloat(formData.cantidadComprada);
    const precio = parseFloat(formData.precioUnitario);
    if (!isNaN(cantidad) && !isNaN(precio) && cantidad > 0 && precio >= 0) {
      const subtotal = cantidad * precio;
      setFormData(prev => ({ ...prev, subtotal: subtotal.toFixed(4) }));
    }
  };

  const calcularDesdeSubtotal = () => {
    const cantidad = parseFloat(formData.cantidadComprada);
    const subtotal = parseFloat(formData.subtotal);
    if (!isNaN(cantidad) && !isNaN(subtotal) && cantidad > 0 && subtotal >= 0) {
      const precio = subtotal / cantidad;
      setFormData(prev => ({ ...prev, precioUnitario: precio.toFixed(4) }));
    }
  };

  // Funciones para múltiples items
  const agregarFilaItem = () => {
    setItemsData(prev => [...prev, {
      idMateriaPrima: '',
      codigoMateriaPrima: '',
      nombreMateriaPrima: '',
      cantidadComprada: '',
      precioUnitario: '',
      subtotal: '',
      materiaPrimaSeleccionada: null,
      ultimoPrecio: null,
    }]);
    setSugerenciasMultiples(prev => [...prev, { sugerencias: [], campo: null }]);
  };

  const eliminarFilaItem = (index: number) => {
    if (itemsData.length === 1) return; // No permitir eliminar la última fila
    setItemsData(prev => prev.filter((_, i) => i !== index));
    setSugerenciasMultiples(prev => prev.filter((_, i) => i !== index));
  };

  const actualizarItemData = (index: number, campo: string, valor: string | MateriaPrima | null | number) => {
    setItemsData(prev => prev.map((item, i) => {
      if (i === index) {
        if (campo === 'materiaPrimaSeleccionada') {
          return { ...item, materiaPrimaSeleccionada: valor as MateriaPrima | null };
        } else if (campo === 'ultimoPrecio') {
          return { ...item, ultimoPrecio: valor as number | null };
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
      actualizarItemData(index, 'ultimoPrecio', null);
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

  const seleccionarMateriaPrimaMultiples = async (mp: MateriaPrima, index: number) => {
    actualizarItemData(index, 'materiaPrimaSeleccionada', mp);
    actualizarItemData(index, 'idMateriaPrima', mp.id);
    actualizarItemData(index, 'codigoMateriaPrima', mp.codigoMateriaPrima);
    actualizarItemData(index, 'nombreMateriaPrima', mp.nombreMateriaPrima);
    
    setSugerenciasMultiples(prev => prev.map((sug, i) => 
      i === index ? { sugerencias: [], campo: null } : sug
    ));

    // Cargar último precio
    try {
      const token = authService.getToken();
      if (!token) return;
      const precio = await apiClient.getUltimoPrecio(token, idGranja, mp.id);
      actualizarItemData(index, 'ultimoPrecio', precio);
      if (precio !== null && precio !== undefined) {
        actualizarItemData(index, 'precioUnitario', precio.toFixed(4));
      }
    } catch (error) {
      console.error('Error cargando último precio:', error);
    }
  };

  const calcularDesdePrecioMultiples = (index: number) => {
    const item = itemsData[index];
    const cantidad = parseFloat(item.cantidadComprada);
    const precio = parseFloat(item.precioUnitario);
    if (!isNaN(cantidad) && !isNaN(precio) && cantidad > 0 && precio >= 0) {
      const subtotal = cantidad * precio;
      actualizarItemData(index, 'subtotal', subtotal.toFixed(4));
    }
  };

  const calcularDesdeSubtotalMultiples = (index: number) => {
    const item = itemsData[index];
    const cantidad = parseFloat(item.cantidadComprada);
    const subtotal = parseFloat(item.subtotal);
    if (!isNaN(cantidad) && !isNaN(subtotal) && cantidad > 0 && subtotal >= 0) {
      const precio = subtotal / cantidad;
      actualizarItemData(index, 'precioUnitario', precio.toFixed(4));
    }
  };

  const agregarItem = async () => {
    if (isAdding) return; // Prevenir múltiples clicks

    // Validar todos los items
    const itemsValidos: Array<{
      idMateriaPrima: string;
      cantidadComprada: number;
      precioUnitario: number;
      subtotal: number;
    }> = [];

    for (let i = 0; i < itemsData.length; i++) {
      const item = itemsData[i];
      
      if (!item.materiaPrimaSeleccionada || !item.cantidadComprada) {
        setMensajeConfirmacion(`Fila ${i + 1}: Complete todos los campos requeridos`);
        setShowModalConfirmacion(true);
        return;
      }

      // Evitar duplicados: si la MP ya existe en el detalle
      const yaExiste = compra?.comprasDetalle.some(d => d.materiaPrima.id === item.materiaPrimaSeleccionada!.id);
      if (yaExiste) {
        setMensajeConfirmacion(`Fila ${i + 1}: La materia prima "${item.materiaPrimaSeleccionada.codigoMateriaPrima}" ya está incluida en la factura`);
        setShowModalConfirmacion(true);
        return;
      }

      // Evitar duplicados dentro del mismo formulario
      const duplicadoEnFormulario = itemsData.slice(0, i).some(otherItem => 
        otherItem.materiaPrimaSeleccionada?.id === item.materiaPrimaSeleccionada!.id
      );
      if (duplicadoEnFormulario) {
        setMensajeConfirmacion(`Fila ${i + 1}: La materia prima "${item.materiaPrimaSeleccionada.codigoMateriaPrima}" ya está en otra fila`);
        setShowModalConfirmacion(true);
        return;
      }

      const cantidad = parseFloat(item.cantidadComprada);
      const precio = parseFloat(item.precioUnitario);
      const subtotal = parseFloat(item.subtotal);

      if (isNaN(cantidad) || cantidad <= 0) {
        setMensajeConfirmacion(`Fila ${i + 1}: La cantidad debe ser mayor a 0`);
        setShowModalConfirmacion(true);
        return;
      }

      if (isNaN(precio) || precio < 0) {
        setMensajeConfirmacion(`Fila ${i + 1}: El precio unitario debe ser válido`);
        setShowModalConfirmacion(true);
        return;
      }

      // Validar que subtotal = cantidad × precio (hasta 4 decimales)
      const subtotalCalculado = parseFloat((cantidad * precio).toFixed(4));
      if (!isNaN(subtotal) && Math.abs(subtotal - subtotalCalculado) > 0.0001) {
        setMensajeConfirmacion(`Fila ${i + 1}: El subtotal (${subtotal.toFixed(4)}) no coincide con cantidad × precio (${subtotalCalculado.toFixed(4)})`);
        setShowModalConfirmacion(true);
        return;
      }

      itemsValidos.push({
        idMateriaPrima: item.materiaPrimaSeleccionada.id,
        cantidadComprada: cantidad,
        precioUnitario: precio,
        subtotal: subtotalCalculado,
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

      // Agregar todos los items en batch (más eficiente)
      await apiClient.agregarMultiplesItemsCompra(token, idGranja, idCompra, itemsValidos);

      setMensajeConfirmacion(`✅ ${itemsValidos.length} item(s) agregado(s) exitosamente`);
      setShowModalConfirmacion(true);

      setShowModalAgregar(false);
      // Resetear a una sola fila vacía
      setItemsData([{
        idMateriaPrima: '',
        codigoMateriaPrima: '',
        nombreMateriaPrima: '',
        cantidadComprada: '',
        precioUnitario: '',
        subtotal: '',
        materiaPrimaSeleccionada: null,
        ultimoPrecio: null,
      }]);
      setSugerenciasMultiples([{ sugerencias: [], campo: null }]);

      await cargarDatos();
    } catch (error: unknown) {
      console.error('Error agregando items:', error);
      setMensajeConfirmacion(error instanceof Error ? error.message : 'Error al agregar items');
      setShowModalConfirmacion(true);
    } finally {
      setIsAdding(false);
    }
  };

  const editarItem = async () => {
    if (isEditing) return; // Prevenir múltiples clicks

    if (!editando || !formData.cantidadComprada) {
      setMensajeConfirmacion('Complete todos los campos requeridos');
      setShowModalConfirmacion(true);
      return;
    }

    const cantidad = parseFloat(formData.cantidadComprada);
    const precio = parseFloat(formData.precioUnitario);
    const subtotal = parseFloat(formData.subtotal);

    if (isNaN(cantidad) || cantidad <= 0) {
      setMensajeConfirmacion('La cantidad debe ser mayor a 0');
      setShowModalConfirmacion(true);
      return;
    }

    if (isNaN(precio) || precio < 0) {
      setMensajeConfirmacion('El precio unitario debe ser válido');
      setShowModalConfirmacion(true);
      return;
    }

    const subtotalCalculado = cantidad * precio;
    if (subtotal && Math.abs(subtotal - subtotalCalculado) > 0.001) {
      setMensajeConfirmacion(`El subtotal (${subtotal.toFixed(2)}) no coincide con cantidad × precio (${subtotalCalculado.toFixed(2)})`);
      setShowModalConfirmacion(true);
      return;
    }

    setIsEditing(true);
    try {
      const token = authService.getToken();
      if (!token) {
        setMensajeConfirmacion('No autenticado');
        setShowModalConfirmacion(true);
        setIsEditing(false);
        return;
      }

      await apiClient.editarItemCompra(token, idGranja, idCompra, editando.id, {
        cantidadComprada: cantidad,
        precioUnitario: precio,
        subtotal: subtotalCalculado,
      });

      setMensajeConfirmacion(`✅ Item actualizado exitosamente`);
      setShowModalConfirmacion(true);

      setShowModalEditar(false);
      setEditando(null);
      setFormData({ idMateriaPrima: '', codigoMateriaPrima: '', nombreMateriaPrima: '', cantidadComprada: '', precioUnitario: '', subtotal: '' });
      setUltimoPrecio(null);

      await cargarDatos();
    } catch (error: unknown) {
      console.error('Error editando item:', error);
      setMensajeConfirmacion(error instanceof Error ? error.message : 'Error al editar item');
      setShowModalConfirmacion(true);
    } finally {
      setIsEditing(false);
    }
  };

  const eliminarItem = async () => {
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

      await apiClient.eliminarItemCompra(token, idGranja, idCompra, eliminando.id);

      setMensajeConfirmacion(`✅ Item eliminado exitosamente`);
      setShowModalConfirmacion(true);

      setShowModalEliminar(false);
      setEliminando(null);

      await cargarDatos();
    } catch (error: unknown) {
      console.error('Error eliminando item:', error);
      setMensajeConfirmacion(error instanceof Error ? error.message : 'Error al eliminar item');
      setShowModalConfirmacion(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const eliminarTodosLosItems = async () => {
    if (isEliminandoTodos) return; // Prevenir múltiples clicks

    if (confirmacionEliminarTodos !== 'SI DESEO ELIMINAR TODOS LOS ITEMS DE LA FACTURA') {
      setMensajeConfirmacion('Debe escribir exactamente: "SI DESEO ELIMINAR TODOS LOS ITEMS DE LA FACTURA"');
      setShowModalConfirmacion(true);
      return;
    }

    setIsEliminandoTodos(true);
    try {
      const token = authService.getToken();
      if (!token) {
        setMensajeConfirmacion('No autenticado');
        setShowModalConfirmacion(true);
        setIsEliminandoTodos(false);
        return;
      }

      await apiClient.eliminarTodosLosItemsCompra(token, idGranja, idCompra);

      setMensajeConfirmacion(`✅ Todos los items eliminados exitosamente`);
      setShowModalConfirmacion(true);

      setShowModalEliminarTodos(false);
      setConfirmacionEliminarTodos('');

      await cargarDatos();
    } catch (error: unknown) {
      console.error('Error eliminando todos los items:', error);
      setMensajeConfirmacion(error instanceof Error ? error.message : 'Error al eliminar todos los items');
      setShowModalConfirmacion(true);
    } finally {
      setIsEliminandoTodos(false);
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

      await apiClient.editarCabeceraCompra(token, idGranja, idCompra, {
        numeroFactura: cabeceraData.numeroFactura || undefined,
        fechaCompra: cabeceraData.fechaCompra,
        observaciones: cabeceraData.observaciones || undefined,
        idProveedor: cabeceraData.idProveedor,
      });

      setMensajeConfirmacion(`✅ Cabecera actualizada exitosamente`);
      setShowModalConfirmacion(true);

      setShowModalEditarCabecera(false);
      await cargarDatos();
    } catch (error: unknown) {
      console.error('Error editando cabecera:', error);
      setMensajeConfirmacion(error instanceof Error ? error.message : 'Error al editar cabecera');
      setShowModalConfirmacion(true);
    } finally {
      setIsEditingCabecera(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-purple-500 animate-pulse" />
          <p className="text-foreground/80">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!compra) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-foreground/70">Compra no encontrada</p>
          <button onClick={() => router.push(`/granja/${idGranja}/compras`)} className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all">
            Volver a Compras
          </button>
        </div>
      </div>
    );
  }

  const totalCalculado = compra.comprasDetalle.reduce((sum, d) => sum + d.subtotal, 0);
  const diferencia = compra.totalFactura - totalCalculado;
  const totalCoincide = Math.abs(diferencia) < 0.01;

  return (
    <div className="flex min-h-screen ">
      <Sidebar />
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="glass-card px-8 py-6 m-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Detalle de Compra</h2>
              <p className="text-foreground/70 mt-1">
                Factura: {compra.numeroFactura || 'Sin número'} | Proveedor: {compra.proveedor.nombreProveedor}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/granja/${idGranja}/compras`)}
                className="px-6 py-3 glass-surface text-foreground rounded-xl font-semibold hover:bg-white/10"
              >
                ← Volver
              </button>
              <button
                onClick={() => setShowModalEditarCabecera(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:brightness-110 transition-all"
              >
                Editar Cabecera
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-8 space-y-8">
          {/* Resumen */}
          <div className="glass-card p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-foreground/70">N° Factura</p>
                <p className="text-lg font-bold text-foreground">{compra.numeroFactura || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-foreground/70">Fecha</p>
                <p className="text-lg font-bold text-foreground">{new Date(compra.fechaCompra).toLocaleDateString('es-AR')}</p>
              </div>
              <div>
                <p className="text-sm text-foreground/70 font-semibold">Total Factura (Cabecera)</p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(compra.totalFactura)}
                </p>
              </div>
              <div>
                <p className="text-sm text-foreground/70">Suma de Subtotales</p>
                <p className={`text-lg font-bold ${totalCoincide ? 'text-foreground' : 'text-blue-600'}`}>
                  {formatCurrency(totalCalculado)}
                </p>
              </div>
              <div>
                <p className="text-sm text-foreground/70">Items</p>
                <p className="text-lg font-bold text-foreground">{compra.comprasDetalle.length}</p>
              </div>
            </div>
          </div>

          {/* Alerta de Diferencia */}
          {!totalCoincide && (
            <div className={`glass-card p-6 border-2 ${
              diferencia > 0 
                ? 'border-orange-500/50 bg-orange-500/10' 
                : 'border-red-500/50 bg-red-500/10'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                    diferencia > 0 
                      ? 'bg-gradient-to-br from-orange-500 to-orange-400 shadow-orange-500/30' 
                      : 'bg-gradient-to-br from-red-500 to-red-400 shadow-red-500/30'
                  }`}>
                    {diferencia > 0 ? (
                      <span className="text-3xl text-white">⏱</span>
                    ) : (
                      <span className="text-3xl text-white">⚠️</span>
                    )}
                  </div>
                  <div>
                    <p className={`text-lg font-bold ${
                      diferencia > 0 ? 'text-orange-300' : 'text-red-300'
                    }`}>
                      {diferencia > 0 ? 'Falta completar la factura' : 'El total excede la factura'}
                    </p>
                    <p className="text-sm text-foreground/70 mt-1">
                      {diferencia > 0 
                        ? `Necesitas agregar items por un valor de ${formatCurrency(diferencia)} para completar la factura`
                        : `Los items suman ${formatCurrency(Math.abs(diferencia))} más que el total de la factura`
                      }
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-bold ${
                    diferencia > 0 ? 'text-orange-400' : 'text-red-400'
                  }`}>
                    {formatCurrency(Math.abs(diferencia))}
                  </p>
                  <p className="text-xs text-foreground/60 mt-1">
                    {diferencia > 0 ? 'Por agregar' : 'Exceso'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Mensaje de éxito cuando coincide */}
          {totalCoincide && (
            <div className="glass-card p-6 border-2 border-green-500/50 bg-green-500/10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-400 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
                  <span className="text-3xl text-white">✓</span>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-300">
                    Factura completada correctamente
                  </p>
                  <p className="text-sm text-foreground/70 mt-1">
                    El total de los items coincide con el total de la factura
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="glass-card p-6">
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setItemsData([{
                    idMateriaPrima: '',
                    codigoMateriaPrima: '',
                    nombreMateriaPrima: '',
                    cantidadComprada: '',
                    precioUnitario: '',
                    subtotal: '',
                    materiaPrimaSeleccionada: null,
                    ultimoPrecio: null,
                  }]);
                  setSugerenciasMultiples([{ sugerencias: [], campo: null }]);
                  setShowModalAgregar(true);
                }}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:brightness-110 transition-all"
              >
                + Agregar Item
              </button>
              {compra.comprasDetalle.length > 0 && (
                <button
                  onClick={() => {
                    setConfirmacionEliminarTodos('');
                    setShowModalEliminarTodos(true);
                  }}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/30 transition-all"
                >
                  🗑️ Eliminar Todos los Items
                </button>
              )}
            </div>
          </div>

          {/* Tabla */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 text-foreground/80">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Código MP</th>
                    <th className="px-6 py-4 text-left font-semibold">Materia Prima</th>
                    <th className="px-6 py-4 text-right font-semibold">Cantidad (kg)</th>
                    <th className="px-6 py-4 text-right font-semibold">Precio Unitario</th>
                    <th className="px-6 py-4 text-right font-semibold">Subtotal</th>
                    <th className="px-6 py-4 text-center font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {compra.comprasDetalle.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-foreground/60">
                        No hay items en esta compra. Agregue el primer item.
                      </td>
                    </tr>
                  ) : (
                    compra.comprasDetalle.map((item) => (
                      <tr key={item.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-foreground whitespace-nowrap">{item.materiaPrima.codigoMateriaPrima}</td>
                        <td className="px-6 py-4 text-foreground">{item.materiaPrima.nombreMateriaPrima}</td>
                        <td className="px-6 py-4 text-foreground text-right whitespace-nowrap">{Number(item.cantidadComprada).toLocaleString('es-AR', { minimumFractionDigits: 2 })} kg</td>
                        <td className="px-6 py-4 text-foreground text-right whitespace-nowrap">{formatCurrency(item.precioUnitario)}</td>
                        <td className="px-6 py-4 text-foreground text-right whitespace-nowrap font-semibold">{formatCurrency(item.subtotal)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditando(item);
                                setFormData({
                                  idMateriaPrima: item.materiaPrima.id,
                                  codigoMateriaPrima: item.materiaPrima.codigoMateriaPrima,
                                  nombreMateriaPrima: item.materiaPrima.nombreMateriaPrima,
                                  cantidadComprada: item.cantidadComprada.toString(),
                                  precioUnitario: item.precioUnitario.toFixed(2),
                                  subtotal: item.subtotal.toFixed(2),
                                });
                                setMateriaPrimaSeleccionada(item.materiaPrima);
                                setShowModalEditar(true);
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold hover:shadow-md transition-all text-sm"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => {
                                setEliminando(item);
                                setShowModalEliminar(true);
                              }}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 text-sm"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {compra.comprasDetalle.length > 0 && (
                  <tfoot className="bg-white/5">
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-right font-bold text-foreground">Suma de Subtotales:</td>
                      <td className="px-6 py-4 text-right font-bold text-lg text-foreground">{formatCurrency(totalCalculado)}</td>
                      <td></td>
                    </tr>
                    <tr className="bg-white/10">
                      <td colSpan={4} className="px-6 py-4 text-right font-bold text-foreground">Total Factura (Cabecera):</td>
                      <td className="px-6 py-4 text-right font-bold text-lg text-foreground">{formatCurrency(compra.totalFactura)}</td>
                      <td></td>
                    </tr>
                    {!totalCoincide && (
                      <tr className={`border-t-2 ${
                        diferencia > 0 
                          ? 'border-orange-500/50 bg-orange-500/10' 
                          : 'border-red-500/50 bg-red-500/10'
                      }`}>
                        <td colSpan={4} className="px-6 py-4 text-right font-bold text-foreground">
                          <div className="flex items-center justify-end gap-2">
                            {diferencia > 0 ? (
                              <>
                                <span className="text-orange-400">⏱</span>
                                <span>Falta:</span>
                              </>
                            ) : (
                              <>
                                <span className="text-red-400">⚠️</span>
                                <span>Sobra:</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className={`px-6 py-4 text-right font-bold text-lg ${
                          diferencia > 0 ? 'text-orange-400' : 'text-red-400'
                        }`}>
                          {formatCurrency(Math.abs(diferencia))}
                        </td>
                        <td></td>
                      </tr>
                    )}
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Agregar Item */}
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
            cantidadComprada: '',
            precioUnitario: '',
            subtotal: '',
            materiaPrimaSeleccionada: null,
            ultimoPrecio: null,
          }]);
          setSugerenciasMultiples([{ sugerencias: [], campo: null }]);
        }}
        title="Agregar Item"
        size="lg"
        footer={
          <>
            <button
              onClick={() => {
                setShowModalAgregar(false);
                setIsAdding(false);
              }}
              disabled={isAdding}
              className="flex-1 px-6 py-3 glass-surface text-foreground rounded-xl font-semibold hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={agregarItem}
              disabled={isAdding}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

                  {item.materiaPrimaSeleccionada && item.ultimoPrecio !== null && (
                    <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-3">
                      <p className="text-sm text-blue-300">
                        💡 Último precio pagado: {formatCurrency(item.ultimoPrecio)}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground/90 mb-2">Cantidad (kg) <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        step="0.0001"
                        min="0.0001"
                        value={item.cantidadComprada}
                        onChange={(e) => {
                          actualizarItemData(index, 'cantidadComprada', e.target.value);
                        }}
                        onBlur={() => calcularDesdePrecioMultiples(index)}
                        className="glass-input"
                        required
                        disabled={isAdding}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground/90 mb-2">Precio Unitario ($/kg)</label>
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={item.precioUnitario}
                        onChange={(e) => {
                          actualizarItemData(index, 'precioUnitario', e.target.value);
                        }}
                        onBlur={() => calcularDesdePrecioMultiples(index)}
                        className="glass-input"
                        disabled={isAdding}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground/90 mb-2">Subtotal ($)</label>
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={item.subtotal}
                        onChange={(e) => {
                          actualizarItemData(index, 'subtotal', e.target.value);
                        }}
                        onBlur={() => calcularDesdeSubtotalMultiples(index)}
                        className="glass-input"
                        disabled={isAdding}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Modal Editar Item */}
      <Modal
        isOpen={showModalEditar}
        onClose={() => {
          setShowModalEditar(false);
          setIsEditing(false);
        }}
        title="Editar Item"
        size="lg"
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
              onClick={editarItem}
              disabled={isEditing}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        {editando && (
          <div className="space-y-4">
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-sm text-foreground/90">
                <strong>Materia Prima:</strong> {editando.materiaPrima.codigoMateriaPrima} - {editando.materiaPrima.nombreMateriaPrima}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground/90 mb-2">Cantidad (kg) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={formData.cantidadComprada}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, cantidadComprada: e.target.value }));
                  }}
                  onBlur={calcularDesdePrecio}
                  className="glass-input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/90 mb-2">Precio Unitario ($/kg)</label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={formData.precioUnitario}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, precioUnitario: e.target.value }));
                  }}
                  onBlur={calcularDesdePrecio}
                  className="glass-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/90 mb-2">Subtotal ($)</label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={formData.subtotal}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, subtotal: e.target.value }));
                  }}
                  onBlur={calcularDesdeSubtotal}
                  className="glass-input"
                />
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Eliminar Item */}
      <Modal
        isOpen={showModalEliminar}
        onClose={() => {
          setShowModalEliminar(false);
          setIsDeleting(false);
        }}
        title="Eliminar Item"
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
              onClick={eliminarItem}
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
        {eliminando && (
          <div>
            <p className="text-foreground/90 mb-4">
              ¿Está seguro de eliminar este item?
            </p>
            <div className="bg-white/5 rounded-xl p-4">
              <p><strong>Materia Prima:</strong> {eliminando.materiaPrima.codigoMateriaPrima} - {eliminando.materiaPrima.nombreMateriaPrima}</p>
              <p><strong>Cantidad:</strong> {eliminando.cantidadComprada} kg</p>
              <p><strong>Subtotal:</strong> {formatCurrency(eliminando.subtotal)}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Editar Cabecera */}
      <Modal
        isOpen={showModalEditarCabecera}
        onClose={() => {
          setShowModalEditarCabecera(false);
          setIsEditingCabecera(false);
        }}
        title="Editar Cabecera"
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
            <label className="block text-sm font-medium text-foreground/90 mb-2">Proveedor</label>
            <select
              value={cabeceraData.idProveedor}
              onChange={(e) => setCabeceraData({ ...cabeceraData, idProveedor: e.target.value })}
              className="glass-input"
            >
              {proveedores.map((prov) => (
                <option key={prov.id} value={prov.id}>
                  {prov.codigoProveedor} - {prov.nombreProveedor}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground/90 mb-2">N° Factura</label>
              <input
                type="text"
                value={cabeceraData.numeroFactura}
                onChange={(e) => setCabeceraData({ ...cabeceraData, numeroFactura: e.target.value })}
                placeholder="Ej: A-0001-000123"
                className="glass-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/90 mb-2">Fecha de Compra</label>
              <input
                type="date"
                value={cabeceraData.fechaCompra}
                onChange={(e) => setCabeceraData({ ...cabeceraData, fechaCompra: e.target.value })}
                className="glass-input"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-2">Observaciones</label>
            <textarea
              value={cabeceraData.observaciones}
              onChange={(e) => setCabeceraData({ ...cabeceraData, observaciones: e.target.value })}
              rows={3}
              className="glass-input resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* Modal Eliminar Todos los Items */}
      <Modal
        isOpen={showModalEliminarTodos}
        onClose={() => {
          setShowModalEliminarTodos(false);
          setConfirmacionEliminarTodos('');
          setIsEliminandoTodos(false);
        }}
        title="⚠️ Eliminar Todos los Items"
        size="lg"
        footer={
          <>
            <button
              onClick={() => {
                setShowModalEliminarTodos(false);
                setConfirmacionEliminarTodos('');
                setIsEliminandoTodos(false);
              }}
              disabled={isEliminandoTodos}
              className="flex-1 px-6 py-3 glass-surface text-foreground rounded-xl font-semibold hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={eliminarTodosLosItems}
              disabled={isEliminandoTodos || confirmacionEliminarTodos !== 'SI DESEO ELIMINAR TODOS LOS ITEMS DE LA FACTURA'}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isEliminandoTodos ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Eliminando...
                </>
              ) : (
                '🗑️ Eliminar Todos los Items'
              )}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <p className="text-red-300 font-semibold mb-2">⚠️ Advertencia</p>
            <p className="text-foreground/90 text-sm">
              Esta acción eliminará todos los items de esta compra. Esta operación no se puede deshacer y afectará el inventario.
            </p>
          </div>
          <div>
            <p className="text-foreground/90 mb-2">
              <strong>Items a eliminar:</strong> {compra?.comprasDetalle.length || 0}
            </p>
            <p className="text-foreground/90 mb-4">
              <strong>Total de subtotales:</strong> {formatCurrency(compra?.comprasDetalle.reduce((sum, d) => sum + d.subtotal, 0) || 0)}
            </p>
          </div>
          <div>
            <p className="text-foreground/90 mb-2 font-semibold">
              Para confirmar, escriba exactamente:
            </p>
            <p className="text-gray-900 bg-green-100 p-3 rounded-lg mb-3 font-mono text-sm">
              SI DESEO ELIMINAR TODOS LOS ITEMS DE LA FACTURA
            </p>
            <input
              type="text"
              value={confirmacionEliminarTodos}
              onChange={(e) => setConfirmacionEliminarTodos(e.target.value)}
              className="w-full px-4 py-3 glass-input text-foreground rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Escriba el texto de confirmación..."
              disabled={isEliminandoTodos}
            />
          </div>
        </div>
      </Modal>

      {/* Modal Confirmación */}
      <Modal
        isOpen={showModalConfirmacion}
        onClose={() => setShowModalConfirmacion(false)}
        title=""
        footer={
          <button onClick={() => setShowModalConfirmacion(false)} className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg">
            Aceptar
          </button>
        }
      >
        <p className="text-foreground/90 whitespace-pre-line">{mensajeConfirmacion}</p>
      </Modal>
    </div>
  );
}

