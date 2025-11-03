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
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState('');
  const [editando, setEditando] = useState<CompraDetalle | null>(null);
  const [eliminando, setEliminando] = useState<CompraDetalle | null>(null);
  const [formData, setFormData] = useState({
    idMateriaPrima: '',
    codigoMateriaPrima: '',
    nombreMateriaPrima: '',
    cantidadComprada: '',
    precioUnitario: '',
    subtotal: '',
  });
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

  const agregarItem = async () => {
    if (!materiaPrimaSeleccionada || !formData.cantidadComprada) {
      setMensajeConfirmacion('Complete todos los campos requeridos');
      setShowModalConfirmacion(true);
      return;
    }

    // Evitar duplicados: si la MP ya existe en el detalle
    const yaExiste = compra?.comprasDetalle.some(d => d.materiaPrima.id === materiaPrimaSeleccionada.id);
    if (yaExiste) {
      setMensajeConfirmacion('Esta materia prima ya está incluida en la factura');
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

    // Validar que subtotal = cantidad × precio (hasta 4 decimales)
    const subtotalCalculado = parseFloat((cantidad * precio).toFixed(4));
    if (!isNaN(subtotal) && Math.abs(subtotal - subtotalCalculado) > 0.0001) {
      setMensajeConfirmacion(`El subtotal (${subtotal.toFixed(4)}) no coincide con cantidad × precio (${subtotalCalculado.toFixed(4)})`);
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

      await apiClient.agregarItemCompra(token, idGranja, idCompra, {
        idMateriaPrima: materiaPrimaSeleccionada.id,
        cantidadComprada: cantidad,
        precioUnitario: precio,
        subtotal: subtotalCalculado,
      });

      setMensajeConfirmacion(`✅ Item agregado exitosamente`);
      setShowModalConfirmacion(true);

      setShowModalAgregar(false);
      setFormData({ idMateriaPrima: '', codigoMateriaPrima: '', nombreMateriaPrima: '', cantidadComprada: '', precioUnitario: '', subtotal: '' });
      setMateriaPrimaSeleccionada(null);
      setUltimoPrecio(null);

      await cargarDatos();
    } catch (error: unknown) {
      console.error('Error agregando item:', error);
      setMensajeConfirmacion(error instanceof Error ? error.message : 'Error al agregar item');
      setShowModalConfirmacion(true);
    }
  };

  const editarItem = async () => {
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

    try {
      const token = authService.getToken();
      if (!token) {
        setMensajeConfirmacion('No autenticado');
        setShowModalConfirmacion(true);
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
    }
  };

  const eliminarItem = async () => {
    if (!eliminando) return;

    try {
      const token = authService.getToken();
      if (!token) {
        setMensajeConfirmacion('No autenticado');
        setShowModalConfirmacion(true);
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
    }
  };

  const editarCabecera = async () => {
    try {
      const token = authService.getToken();
      if (!token) {
        setMensajeConfirmacion('No autenticado');
        setShowModalConfirmacion(true);
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
                <p className="text-sm text-foreground/70">Diferencia</p>
                <p className={`text-lg font-bold ${totalCoincide ? 'text-green-600' : diferencia > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                  {totalCoincide 
                    ? '✓ Coincide' 
                    : diferencia > 0 
                      ? `⏱ Falta ${formatCurrency(diferencia)}`
                      : `⚠️ Sobra ${formatCurrency(Math.abs(diferencia))}`
                  }
                </p>
              </div>
              <div className="md:col-span-5">
                <p className="text-sm text-foreground/70">Items</p>
                <p className="text-lg font-bold text-foreground">{compra.comprasDetalle.length}</p>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="glass-card p-6">
            <button
              onClick={() => {
                setFormData({ idMateriaPrima: '', codigoMateriaPrima: '', nombreMateriaPrima: '', cantidadComprada: '', precioUnitario: '', subtotal: '' });
                setMateriaPrimaSeleccionada(null);
                setUltimoPrecio(null);
                setShowModalAgregar(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:brightness-110 transition-all"
            >
              + Agregar Item
            </button>
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
                      <tr className={diferencia > 0 ? 'bg-orange-50' : 'bg-red-50'}>
                        <td colSpan={4} className="px-6 py-4 text-right font-bold text-foreground">
                          {diferencia > 0 ? '⏱ Falta:' : '⚠️ Sobra:'}
                        </td>
                        <td className={`px-6 py-4 text-right font-bold text-lg ${diferencia > 0 ? 'text-orange-600' : 'text-red-600'}`}>
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
        onClose={() => setShowModalAgregar(false)}
        title="Agregar Item"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowModalAgregar(false)} className="flex-1 px-6 py-3 glass-surface text-foreground rounded-xl font-semibold hover:bg-white/10">
              Cancelar
            </button>
            <button onClick={agregarItem} className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
              Agregar
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Código MP */}
          <div className="relative">
            <label className="block text-sm font-medium text-foreground/90 mb-2">Código Materia Prima</label>
            <input
              type="text"
              value={formData.codigoMateriaPrima}
              onChange={(e) => {
                const nuevoValor = e.target.value;
                setFormData(prev => ({ ...prev, codigoMateriaPrima: nuevoValor }));
                buscarSugerencias(nuevoValor, 'codigo');
              }}
              onFocus={() => {
                if (formData.codigoMateriaPrima) buscarSugerencias(formData.codigoMateriaPrima, 'codigo');
              }}
              placeholder="Ej: MP001"
              className="glass-input"
            />
            {sugCampo === 'codigo' && sugerencias.length > 0 && (
              <div className="absolute z-10 w-full mt-1 glass-dropdown rounded-xl shadow-lg max-h-60 overflow-auto">
                {sugerencias.map((mp) => (
                  <div
                    key={mp.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      seleccionarMateriaPrima(mp);
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
              value={formData.nombreMateriaPrima}
              onChange={(e) => {
                const nuevoValor = e.target.value;
                setFormData(prev => ({ ...prev, nombreMateriaPrima: nuevoValor }));
                buscarSugerencias(nuevoValor, 'nombre');
              }}
              onFocus={() => {
                if (formData.nombreMateriaPrima) buscarSugerencias(formData.nombreMateriaPrima, 'nombre');
              }}
              placeholder="Ej: MAIZ"
              className="glass-input"
            />
            {sugCampo === 'nombre' && sugerencias.length > 0 && (
              <div className="absolute z-10 w-full mt-1 glass-dropdown rounded-xl shadow-lg max-h-60 overflow-auto">
                {sugerencias.map((mp) => (
                  <div
                    key={mp.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      seleccionarMateriaPrima(mp);
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

          {materiaPrimaSeleccionada && ultimoPrecio !== null && (
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-3">
              <p className="text-sm text-blue-300">
                💡 Último precio pagado: {formatCurrency(ultimoPrecio)}
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
      </Modal>

      {/* Modal Editar Item */}
      <Modal
        isOpen={showModalEditar}
        onClose={() => setShowModalEditar(false)}
        title="Editar Item"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowModalEditar(false)} className="flex-1 px-6 py-3 glass-surface text-foreground rounded-xl font-semibold hover:bg-white/10">
              Cancelar
            </button>
            <button onClick={editarItem} className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
              Guardar
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
        onClose={() => setShowModalEliminar(false)}
        title="Eliminar Item"
        footer={
          <>
            <button onClick={() => setShowModalEliminar(false)} className="flex-1 px-6 py-3 glass-surface text-foreground rounded-xl font-semibold hover:bg-white/10">
              Cancelar
            </button>
            <button onClick={eliminarItem} className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/30 transition-all">
              Eliminar
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
        onClose={() => setShowModalEditarCabecera(false)}
        title="Editar Cabecera"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowModalEditarCabecera(false)} className="flex-1 px-6 py-3 glass-surface text-foreground rounded-xl font-semibold hover:bg-white/10">
              Cancelar
            </button>
            <button onClick={editarCabecera} className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
              Guardar
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

