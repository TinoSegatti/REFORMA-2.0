/**
 * Validadores Zod para Compras
 */

import { z } from 'zod';

// Esquema para detalle de compra
export const detalleCompraSchema = z.object({
  idMateriaPrima: z.string().min(1, 'ID de materia prima es requerido'),
  cantidadComprada: z.number().positive('La cantidad debe ser mayor a 0'),
  precioUnitario: z.number().positive('El precio debe ser mayor a 0')
});

// Esquema para crear compra
export const crearCompraSchema = z.object({
  idGranja: z.string().min(1, 'ID de granja es requerido'),
  idProveedor: z.string().min(1, 'ID de proveedor es requerido'),
  numeroFactura: z.string().optional(),
  fechaCompra: z.string().datetime().or(z.date()),
  observaciones: z.string().optional(),
  detalles: z.array(detalleCompraSchema).min(1, 'Debe incluir al menos un detalle')
});

// Esquema para eliminar compra
export const eliminarCompraSchema = z.object({
  idCompra: z.string().min(1, 'ID de compra es requerido')
});

// Tipos TypeScript derivados de los esquemas
export type CrearCompraInput = z.infer<typeof crearCompraSchema>;
export type DetalleCompraInput = z.infer<typeof detalleCompraSchema>;
export type EliminarCompraInput = z.infer<typeof eliminarCompraSchema>;

