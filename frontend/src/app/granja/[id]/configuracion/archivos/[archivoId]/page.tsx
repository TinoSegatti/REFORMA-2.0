'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { authService } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Archive, ShoppingCart, Factory, Box } from 'lucide-react';

type TablaOrigen = 'COMPRA' | 'FABRICACION' | 'INVENTARIO';

interface ArchivoDetalleResponse {
  id: string;
  descripcion: string;
  fechaArchivo: string;
  totalRegistros: number;
  tablaOrigen: TablaOrigen;
  detalles: any[];
}

export default function DetalleArchivoPage() {
  const params = useParams();
  const router = useRouter();
  const idGranja = useMemo(() => (params?.id as string) || '', [params]);
  const idArchivo = useMemo(() => (params?.archivoId as string) || '', [params]);

  const [archivo, setArchivo] = useState<ArchivoDetalleResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    cargarDetalle();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idArchivo, idGranja]);

  const cargarDetalle = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      if (!token || !idGranja || !idArchivo) return;
      const data = await apiClient.getArchivoDetalle(token, idGranja, idArchivo);
      setArchivo(data);
    } catch (error) {
      console.error('Error obteniendo archivo:', error);
      alert(error instanceof Error ? error.message : 'Error al obtener archivo');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoDate: string) =>
    new Date(isoDate).toLocaleString('es-AR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

  const formatCurrency = (value: number) =>
    Number(value).toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    });

  const renderContenido = () => {
    if (!archivo) return null;

    if (archivo.tablaOrigen === 'COMPRA') {
      return (
        <div className="space-y-6">
          {archivo.detalles.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <p className="text-4xl mb-2">🧾</p>
              <p className="text-foreground/80 font-medium">No había compras activas al momento del archivo.</p>
            </div>
          ) : (
            archivo.detalles.map((compra: any) => (
              <article key={compra.id} className="glass-card p-6 rounded-2xl border border-white/10 space-y-5">
                <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-purple-400" />
                      {compra.numeroFactura || 'Sin número de factura'}
                    </h3>
                    <p className="text-sm text-foreground/60">
                      Fecha: {formatDate(compra.fechaCompra)} · Proveedor: {compra.proveedor?.nombreProveedor || 'N/D'}
                    </p>
                    <p className="text-sm text-foreground/50">
                      Registrado por: {compra.usuario?.nombreUsuario} {compra.usuario?.apellidoUsuario} ({compra.usuario?.email})
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-foreground/60 uppercase">Total factura</span>
                    <p className="text-xl font-semibold text-foreground">{formatCurrency(compra.totalFactura || 0)}</p>
                  </div>
                </header>

                {compra.observaciones && (
                  <div className="glass-surface px-4 py-3 rounded-xl border border-white/10 text-sm text-foreground/70">
                    <strong className="text-foreground/80">Observaciones:</strong> {compra.observaciones}
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-foreground/70">Materia prima</th>
                        <th className="px-4 py-3 text-right font-semibold text-foreground/70">Cantidad</th>
                        <th className="px-4 py-3 text-right font-semibold text-foreground/70">Precio unitario</th>
                        <th className="px-4 py-3 text-right font-semibold text-foreground/70">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compra.detalles.map((detalle: any) => (
                        <tr key={detalle.id} className="border-b border-white/5">
                          <td className="px-4 py-3 text-foreground/85">
                            <div>
                              <p className="font-medium text-foreground">
                                {detalle.materiaPrima?.nombreMateriaPrima || 'Sin nombre'}
                              </p>
                              <p className="text-xs text-foreground/60">{detalle.materiaPrima?.codigoMateriaPrima}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-foreground/80">
                            {Number(detalle.cantidadComprada || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })} kg
                          </td>
                          <td className="px-4 py-3 text-right text-foreground/80">
                            {formatCurrency(detalle.precioUnitario || 0)}
                          </td>
                          <td className="px-4 py-3 text-right text-foreground font-semibold">
                            {formatCurrency(detalle.subtotal || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            ))
          )}
        </div>
      );
    }

    if (archivo.tablaOrigen === 'FABRICACION') {
      return (
        <div className="space-y-6">
          {archivo.detalles.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <p className="text-4xl mb-2">🏭</p>
              <p className="text-foreground/80 font-medium">No había fabricaciones activas al momento del archivo.</p>
            </div>
          ) : (
            archivo.detalles.map((fabricacion: any) => (
              <article key={fabricacion.id} className="glass-card p-6 rounded-2xl border border-white/10 space-y-5">
                <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Factory className="h-5 w-5 text-emerald-400" />
                      {fabricacion.descripcionFabricacion || 'Fabricación sin título'}
                    </h3>
                    <p className="text-sm text-foreground/60">
                      Fecha: {formatDate(fabricacion.fechaFabricacion)} · Fórmula:{' '}
                      {fabricacion.formula?.codigoFormula} - {fabricacion.formula?.descripcionFormula}
                    </p>
                    <p className="text-sm text-foreground/50">
                      Registrado por: {fabricacion.usuario?.nombreUsuario} {fabricacion.usuario?.apellidoUsuario} ({fabricacion.usuario?.email})
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <div>
                      <span className="text-xs text-foreground/60 uppercase">Costo total</span>
                      <p className="text-lg font-semibold text-foreground">{formatCurrency(fabricacion.costoTotalFabricacion || 0)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-foreground/60 uppercase">Costo por kilo</span>
                      <p className="text-sm font-medium text-foreground/80">{formatCurrency(fabricacion.costoPorKilo || 0)}</p>
                    </div>
                  </div>
                </header>

                {fabricacion.observaciones && (
                  <div className="glass-surface px-4 py-3 rounded-xl border border-white/10 text-sm text-foreground/70">
                    <strong className="text-foreground/80">Observaciones:</strong> {fabricacion.observaciones}
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-foreground/70">Materia prima</th>
                        <th className="px-4 py-3 text-right font-semibold text-foreground/70">Cantidad usada (kg)</th>
                        <th className="px-4 py-3 text-right font-semibold text-foreground/70">Precio unitario</th>
                        <th className="px-4 py-3 text-right font-semibold text-foreground/70">Costo parcial</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fabricacion.detalles.map((detalle: any) => (
                        <tr key={detalle.id} className="border-b border-white/5">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-foreground">
                                {detalle.materiaPrima?.nombreMateriaPrima || 'Sin nombre'}
                              </p>
                              <p className="text-xs text-foreground/60">{detalle.materiaPrima?.codigoMateriaPrima}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-foreground/80">
                            {Number(detalle.cantidadUsada || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-right text-foreground/80">
                            {formatCurrency(detalle.precioUnitario || 0)}
                          </td>
                          <td className="px-4 py-3 text-right text-foreground font-semibold">
                            {formatCurrency(detalle.costoParcial || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            ))
          )}
        </div>
      );
    }

    // Inventario
    return (
      <div className="glass-card p-6 rounded-2xl border border-white/10">
        {archivo.detalles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">📦</p>
            <p className="text-foreground/80 font-medium">Inventario vacío en este snapshot.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-foreground/70">Materia prima</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground/70">Sistema (kg)</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground/70">Real (kg)</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground/70">Merma</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground/70">Precio almacén</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground/70">Valor stock</th>
                </tr>
              </thead>
              <tbody>
                {archivo.detalles.map((item: any) => (
                  <tr key={item.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-foreground/85">
                      <div>
                        <p className="font-medium text-foreground">
                          {item.materiaPrima?.nombreMateriaPrima || 'Sin nombre'}
                        </p>
                        <p className="text-xs text-foreground/60">{item.materiaPrima?.codigoMateriaPrima}</p>
                        {item.observaciones && (
                          <p className="text-xs text-foreground/50 mt-1">Obs: {item.observaciones}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-foreground/80">
                      {Number(item.cantidadSistema || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right text-foreground/80">
                      {Number(item.cantidadReal || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right text-foreground font-semibold">
                      {Number(item.merma || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right text-foreground/80">
                      {formatCurrency(item.precioAlmacen || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-foreground font-semibold">
                      {formatCurrency(item.valorStock || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  if (loading || !archivo) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <div className="glass-card px-8 py-6 flex items-center gap-3">
            <Archive className="h-6 w-6 animate-spin text-purple-400" />
            <span className="text-foreground/80">Cargando archivo...</span>
          </div>
        </main>
      </div>
    );
  }

  const icono =
    archivo.tablaOrigen === 'COMPRA' ? <ShoppingCart className="h-8 w-8 text-purple-400" /> :
    archivo.tablaOrigen === 'FABRICACION' ? <Factory className="h-8 w-8 text-emerald-400" /> :
    <Box className="h-8 w-8 text-amber-400" />;

  const etiqueta =
    archivo.tablaOrigen === 'COMPRA' ? 'Compras' :
    archivo.tablaOrigen === 'FABRICACION' ? 'Fabricaciones' :
    'Inventario';

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 ml-64">
        <div className="max-w-6xl mx-auto p-8 space-y-8">
          <header className="glass-card px-8 py-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <Button
                  variant="neutral"
                  className="px-4 py-2 flex items-center gap-2"
                  onClick={() => router.push(`/granja/${idGranja}/configuracion/archivos`)}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </Button>
                <div className="flex items-center gap-3">
                  {icono}
                  <div>
                    <p className="text-sm text-foreground/60 uppercase">Archivo de {etiqueta}</p>
                    <h1 className="text-3xl font-bold text-foreground">{archivo.descripcion}</h1>
                  </div>
                </div>
              </div>
              <div className="glass-surface px-4 py-3 rounded-2xl border border-white/10 text-right">
                <p className="text-sm text-foreground/60">Creado el</p>
                <p className="text-sm font-semibold text-foreground/80">{formatDate(archivo.fechaArchivo)}</p>
                <p className="text-xs text-foreground/50 mt-1">
                  {archivo.totalRegistros} registro{archivo.totalRegistros === 1 ? '' : 's'} capturados
                </p>
              </div>
            </div>
            <p className="text-sm text-foreground/70">
              Este archivo es una captura histórica: no podés editarlo ni agregar registros. Úsalo como referencia
              para auditorías, comparaciones o análisis retrospectivo.
            </p>
          </header>

          {renderContenido()}
        </div>
      </main>
    </div>
  );
}


