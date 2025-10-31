'use client';

import { useEffect, useState } from 'react';
import { authService } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { Modal } from '@/components/ui';

interface Proveedor {
  id: string;
  codigoProveedor: string;
  nombreProveedor: string;
}

interface ModalNuevaCompraProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (idCompra: string) => void;
  idGranja: string;
}

export default function ModalNuevaCompra({ isOpen, onClose, onSuccess, idGranja }: ModalNuevaCompraProps) {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    idProveedor: '',
    numeroFactura: '',
    fechaCompra: new Date().toISOString().split('T')[0],
    totalFactura: '',
    observaciones: '',
  });

  useEffect(() => {
    if (isOpen) {
      cargarProveedores();
    }
  }, [isOpen]);

  const cargarProveedores = async () => {
    try {
      const token = authService.getToken();
      if (!token) return;
      const provs = await apiClient.getProveedores(token, idGranja);
      setProveedores(provs);
    } catch (error) {
      console.error('Error cargando proveedores:', error);
      setProveedores([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.idProveedor) {
      alert('Seleccione un proveedor');
      return;
    }

    setLoading(true);
    try {
      const token = authService.getToken();
      if (!token) {
        alert('No autenticado');
        return;
      }

      const total = formData.totalFactura ? parseFloat(formData.totalFactura) : 0;

      // Crear compra sin detalles (cabecera vacía) usando total provisorio
      const compra = await apiClient.crearCompra(token, idGranja, {
        idProveedor: formData.idProveedor,
        numeroFactura: formData.numeroFactura || undefined,
        fechaCompra: formData.fechaCompra,
        observaciones: formData.observaciones || undefined,
        detalles: [], // Sin detalles, se agregarán en el detalle
        totalFactura: isNaN(total) ? 0 : total,
      });

      onSuccess(compra.id);
    } catch (error: any) {
      console.error('Error creando compra:', error);
      alert(error.message || 'Error al crear compra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Compra"
      size="lg"
      footer={
        <>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.idProveedor}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-[#B6CCAE] to-[#9AAB64] text-gray-900 rounded-xl font-semibold hover:shadow-lg disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear Compra'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Proveedor <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.idProveedor}
            onChange={(e) => setFormData({ ...formData, idProveedor: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B6CCAE] focus:outline-none"
            required
          >
            <option value="">Seleccione un proveedor</option>
            {proveedores.map((prov) => (
              <option key={prov.id} value={prov.id}>
                {prov.codigoProveedor} - {prov.nombreProveedor}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">N° Factura</label>
            <input
              type="text"
              value={formData.numeroFactura}
              onChange={(e) => setFormData({ ...formData, numeroFactura: e.target.value })}
              placeholder="Ej: A-0001-000123"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B6CCAE] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Compra <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.fechaCompra}
              onChange={(e) => setFormData({ ...formData, fechaCompra: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B6CCAE] focus:outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Total de la factura (ARS)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.totalFactura}
            onChange={(e) => setFormData({ ...formData, totalFactura: e.target.value })}
            placeholder="0.00"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B6CCAE] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
          <textarea
            value={formData.observaciones}
            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            placeholder="Notas adicionales sobre la compra..."
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B6CCAE] focus:outline-none resize-none"
          />
        </div>
      </form>
    </Modal>
  );
}

