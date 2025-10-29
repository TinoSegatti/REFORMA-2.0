'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authService } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import { Modal } from '@/components/ui';
import MateriaPrimaChart from '@/components/charts/MateriaPrimaChart';

interface Animal {
  id: string;
  codigoAnimal: string;
  descripcionAnimal: string;
  categoriaAnimal: string;
}

interface Formula {
  id: string;
  codigoFormula: string;
  descripcionFormula: string;
  fechaCreacion: string;
  costoTotalFormula?: number;
  animal: {
    codigoAnimal: string;
    descripcionAnimal: string;
    categoriaAnimal: string;
  };
}

interface Estadisticas {
  totalFormulas: number;
  materiasMasUtilizadas: Array<{
    codigo: string;
    nombre: string;
    toneladas_totales: number;
  }>;
}

export default function FormulasPage() {
  const router = useRouter();
  const params = useParams();
  const idGranja = params.id as string;

  const [user, setUser] = useState<{ id: string; email: string; tipoUsuario: string } | null>(null);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showModalEliminar, setShowModalEliminar] = useState(false);
  const [eliminando, setEliminando] = useState<Formula | null>(null);
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [formData, setFormData] = useState({
    codigoFormula: '',
    descripcionFormula: '',
    idAnimal: '',
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const currentUser = authService.getUser();
    setUser(currentUser);
    cargarDatos();
  }, [router]);

  const cargarDatos = async () => {
    try {
      const token = authService.getToken();
      if (token) {
        // Cargar fórmulas
        const data = await apiClient.getFormulas(token, idGranja);
        setFormulas(data);

        // Cargar estadísticas
        const stats = await apiClient.getEstadisticasFormulas(token, idGranja);
        setEstadisticas(stats);

        // Cargar animales para el dropdown
        const animalesData = await apiClient.getAnimales(token, idGranja);
        setAnimales(animalesData);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const eliminar = async () => {
    if (!eliminando) return;

    try {
      const token = authService.getToken();
      if (!token) {
        alert('No autenticado');
        return;
      }

      await apiClient.deleteFormula(token, idGranja, eliminando.id);
      await cargarDatos();
      setShowModalEliminar(false);
      setEliminando(null);
    } catch (error: unknown) {
      console.error('Error eliminando:', error);
      alert(error instanceof Error ? error.message : 'Error al eliminar la fórmula');
    }
  };

  const verDetalle = (formula: Formula) => {
    router.push(`/granja/${idGranja}/formulas/${formula.id}`);
  };

  const exportarDatos = () => {
    alert('Función de exportar próximamente');
  };

  const crearFormula = async () => {
    if (!formData.codigoFormula || !formData.idAnimal) {
      alert('Código de fórmula y pienso son requeridos');
      return;
    }

    try {
      const token = authService.getToken();
      if (!token) {
        alert('No autenticado');
        return;
      }

      const nuevaFormula = await apiClient.createFormula(token, idGranja, {
        codigoFormula: formData.codigoFormula,
        descripcionFormula: formData.descripcionFormula || '',
        idAnimal: formData.idAnimal,
        pesoTotalFormula: 1000,
        detalles: [] // Se llenará en el detalle
      });

      // Redirigir al detalle de la fórmula
      router.push(`/granja/${idGranja}/formulas/${nuevaFormula.id}`);
    } catch (error: unknown) {
      console.error('Error creando fórmula:', error);
      alert(error instanceof Error ? error.message : 'Error al crear la fórmula');
    }
  };

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

  const formulasFiltradas = formulas.filter(f =>
    f.codigoFormula.toLowerCase().includes(filtro.toLowerCase()) ||
    f.descripcionFormula.toLowerCase().includes(filtro.toLowerCase())
  );

  const formatCurrency = (n: number) => Number(n).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });

  return (
    <div className="flex min-h-screen bg-[#FAFAE4]">
      <Sidebar />

      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Fórmulas</h2>
              <p className="text-gray-600 mt-1">Gestión de fórmulas de alimentación</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportarDatos}
                className="px-6 py-3 bg-gradient-to-r from-[#FAD863] to-[#F8C540] text-gray-900 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
              >
                <span>📥</span>
                Exportar Datos
              </button>
              <button
                onClick={() => alert('Función de importar próximamente')}
                className="px-6 py-3 bg-gradient-to-r from-[#B6CAEB] to-[#9DB5D9] text-gray-900 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
              >
                <span>📤</span>
                Importar Datos
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-[#B6CCAE] to-[#9AAB64] text-gray-900 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
              >
                <span>+</span>
                Nueva Fórmula
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-8 space-y-8">
          {/* KPI y Gráfico */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#B6CCAE] to-[#9AAB64] rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📋</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total de Fórmulas</p>
                  <p className="text-2xl font-bold text-gray-900">{estadisticas?.totalFormulas || 0}</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Materias Primas Más Utilizadas</h3>
                <span className="text-xs text-gray-500 font-medium">
                  Top {estadisticas?.materiasMasUtilizadas?.length || 0}
                </span>
              </div>
              <MateriaPrimaChart data={estadisticas?.materiasMasUtilizadas || []} />
            </div>
          </div>

          {/* Filtro */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <input
              type="text"
              placeholder="Buscar por código o descripción..."
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
                    <th className="px-6 py-4 text-left font-semibold">Descripción</th>
                    <th className="px-6 py-4 text-left font-semibold">Animal</th>
                    <th className="px-6 py-4 text-left font-semibold">Costo Total</th>
                    <th className="px-6 py-4 text-left font-semibold">Fecha</th>
                    <th className="px-6 py-4 text-center font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {formulasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        {filtro ? 'No se encontraron resultados' : 'No hay fórmulas registradas'}
                      </td>
                    </tr>
                  ) : (
                    formulasFiltradas.map((f) => (
                      <tr key={f.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-gray-900 font-medium">{f.codigoFormula}</td>
                        <td className="px-6 py-4 text-gray-900">{f.descripcionFormula}</td>
                        <td className="px-6 py-4 text-gray-900">
                          <div>
                            <p className="font-medium">{f.animal.descripcionAnimal}</p>
                            <p className="text-sm text-gray-500">{f.animal.categoriaAnimal}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-900 font-medium whitespace-nowrap">
                          {formatCurrency(f.costoTotalFormula || 0)}
                        </td>
                        <td className="px-6 py-4 text-gray-900">
                          {new Date(f.fechaCreacion).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => verDetalle(f)}
                              className="px-4 py-2 bg-gradient-to-r from-[#B6CAEB] to-[#9DB5D9] text-gray-900 rounded-lg font-semibold hover:shadow-md transition-all text-sm"
                            >
                              Detalle
                            </button>
                            <button
                              onClick={() => {
                                setEliminando(f);
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
        </div>
      </main>

      {/* Modal Crear Fórmula */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nueva Fórmula"
        footer={
          <>
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                crearFormula();
                setShowModal(false);
              }}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#B6CCAE] to-[#9AAB64] text-gray-900 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Crear
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código de Fórmula *
            </label>
            <input
              type="text"
              value={formData.codigoFormula}
              onChange={(e) => setFormData({ ...formData, codigoFormula: e.target.value })}
              placeholder="Ej: F001"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B6CCAE] focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción (Opcional)
            </label>
            <input
              type="text"
              value={formData.descripcionFormula}
              onChange={(e) => setFormData({ ...formData, descripcionFormula: e.target.value })}
              placeholder="Ej: Fórmula para lechones"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B6CCAE] focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pienso *
            </label>
            <select
              value={formData.idAnimal}
              onChange={(e) => setFormData({ ...formData, idAnimal: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B6CCAE] focus:outline-none transition-all"
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

      {/* Modal Eliminar */}
      <Modal
        isOpen={showModalEliminar}
        onClose={() => setShowModalEliminar(false)}
        title="Eliminar Fórmula"
        footer={
          <>
            <button
              onClick={() => setShowModalEliminar(false)}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={eliminar}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all"
            >
              Eliminar
            </button>
          </>
        }
      >
        <p className="text-gray-700">
          ¿Está seguro de que desea eliminar la fórmula <strong>{eliminando?.descripcionFormula}</strong>?
          <br />
          Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}
