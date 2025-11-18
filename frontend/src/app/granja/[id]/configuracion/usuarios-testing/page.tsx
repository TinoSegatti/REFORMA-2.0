'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Loader2,
  Shield,
  Mail,
  User,
  CreditCard
} from 'lucide-react';

interface UsuarioTesting {
  id: string;
  email: string;
  nombreUsuario: string;
  apellidoUsuario: string;
  activo: boolean;
  emailVerificado: boolean;
  planSuscripcion: string;
  fechaCreacion: string;
  suscripcion: {
    id: string;
    planSuscripcion: string;
    estadoSuscripcion: string;
    periodoFacturacion: string;
    fechaInicio: string;
    fechaFin: string;
    precio: number;
  } | null;
}

const PLANES = ['DEMO', 'STARTER', 'BUSINESS', 'ENTERPRISE'];
const PERIODOS = ['MENSUAL', 'ANUAL'];

export default function UsuariosTestingPage() {
  const params = useParams();
  const router = useRouter();
  const idGranja = params?.id as string;

  const [usuarios, setUsuarios] = useState<UsuarioTesting[]>([]);
  const [loading, setLoading] = useState(true);
  const [esSuperusuario, setEsSuperusuario] = useState(false);
  const [showModalCrear, setShowModalCrear] = useState(false);
  const [showModalEditar, setShowModalEditar] = useState(false);
  const [showModalEliminar, setShowModalEliminar] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioTesting | null>(null);
  const [usuarioEliminando, setUsuarioEliminando] = useState<UsuarioTesting | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string>('');

  // Formulario crear
  const [emailNuevo, setEmailNuevo] = useState('');
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [apellidoNuevo, setApellidoNuevo] = useState('');
  const [planNuevo, setPlanNuevo] = useState('DEMO');
  const [periodoNuevo, setPeriodoNuevo] = useState('MENSUAL');

  // Formulario editar
  const [planEditando, setPlanEditando] = useState('DEMO');
  const [periodoEditando, setPeriodoEditando] = useState('MENSUAL');

  useEffect(() => {
    verificarSuperusuario();
  }, []);

  useEffect(() => {
    if (esSuperusuario) {
      cargarUsuarios();
    }
  }, [esSuperusuario]);

  const verificarSuperusuario = async () => {
    try {
      const token = authService.getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await apiClient.verificarSuperusuario(token);
      if (response.esSuperusuario) {
        setEsSuperusuario(true);
      } else {
        router.push(`/granja/${idGranja}/configuracion`);
      }
    } catch (err) {
      console.error('Error verificando superusuario:', err);
      router.push(`/granja/${idGranja}/configuracion`);
    }
  };

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      if (!token) return;

      const response = await apiClient.obtenerUsuariosTesting(token);
      setUsuarios(response.usuarios || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
      console.error('Error cargando usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearUsuario = async () => {
    if (!emailNuevo || !emailNuevo.includes('@')) {
      setError('Email inválido');
      return;
    }

    try {
      setGuardando(true);
      setError('');
      const token = authService.getToken();
      if (!token) return;

      await apiClient.crearUsuarioTesting(token, {
        email: emailNuevo,
        nombreUsuario: nombreNuevo || 'Usuario',
        apellidoUsuario: apellidoNuevo || 'Testing',
        plan: planNuevo,
        periodoFacturacion: periodoNuevo,
      });

      setShowModalCrear(false);
      setEmailNuevo('');
      setNombreNuevo('');
      setApellidoNuevo('');
      setPlanNuevo('DEMO');
      setPeriodoNuevo('MENSUAL');
      cargarUsuarios();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear usuario');
    } finally {
      setGuardando(false);
    }
  };

  const handleEditarPlan = async () => {
    if (!usuarioEditando) return;

    try {
      setGuardando(true);
      setError('');
      const token = authService.getToken();
      if (!token) return;

      await apiClient.actualizarPlanUsuario(
        token,
        usuarioEditando.id,
        planEditando,
        periodoEditando
      );

      setShowModalEditar(false);
      setUsuarioEditando(null);
      cargarUsuarios();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar plan');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarUsuario = async () => {
    if (!usuarioEliminando) return;

    try {
      setGuardando(true);
      setError('');
      const token = authService.getToken();
      if (!token) return;

      await apiClient.eliminarUsuarioTesting(token, usuarioEliminando.id);

      setShowModalEliminar(false);
      setUsuarioEliminando(null);
      cargarUsuarios();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar usuario');
    } finally {
      setGuardando(false);
    }
  };

  const abrirModalEditar = (usuario: UsuarioTesting) => {
    setUsuarioEditando(usuario);
    setPlanEditando(usuario.suscripcion?.planSuscripcion || usuario.planSuscripcion);
    setPeriodoEditando(usuario.suscripcion?.periodoFacturacion || 'MENSUAL');
    setShowModalEditar(true);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatearPrecio = (precio: number) => {
    if (precio === 0) return 'Gratis';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(precio);
  };

  if (!esSuperusuario) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-cyan-400 mx-auto mb-4" />
            <p className="text-white/70">Verificando permisos...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 ml-64">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Shield className="h-8 w-8 text-cyan-400" />
                Gestión de Usuarios de Testing
              </h1>
              <p className="text-foreground/70 mt-2">
                Administra usuarios de testing y asigna planes para pruebas
              </p>
            </div>
            <Button
              onClick={() => setShowModalCrear(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Crear Usuario
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300">
              {error}
            </div>
          )}

          {/* Tabla de Usuarios */}
          <Card>
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-cyan-400 mx-auto mb-4" />
                <p className="text-foreground/70">Cargando usuarios...</p>
              </div>
            ) : usuarios.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="h-12 w-12 text-foreground/30 mx-auto mb-4" />
                <p className="text-foreground/70">No hay usuarios de testing</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-4 text-foreground/70 font-semibold">Email</th>
                      <th className="text-left p-4 text-foreground/70 font-semibold">Nombre</th>
                      <th className="text-left p-4 text-foreground/70 font-semibold">Plan</th>
                      <th className="text-left p-4 text-foreground/70 font-semibold">Estado</th>
                      <th className="text-left p-4 text-foreground/70 font-semibold">Fecha Creación</th>
                      <th className="text-right p-4 text-foreground/70 font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((usuario) => (
                      <tr key={usuario.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-foreground/50" />
                            <span className="text-foreground">{usuario.email}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-foreground/50" />
                            <span className="text-foreground">
                              {usuario.nombreUsuario} {usuario.apellidoUsuario}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-foreground/50" />
                            <div>
                              <span className="text-foreground font-semibold">
                                {usuario.suscripcion?.planSuscripcion || usuario.planSuscripcion}
                              </span>
                              {usuario.suscripcion && (
                                <span className="text-xs text-foreground/50 block">
                                  {usuario.suscripcion.periodoFacturacion} - {formatearPrecio(usuario.suscripcion.precio)}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {usuario.activo && usuario.emailVerificado ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-400" />
                                <span className="text-green-400">Activo</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 text-red-400" />
                                <span className="text-red-400">Inactivo</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-foreground/70">
                          {formatearFecha(usuario.fechaCreacion)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="neutral"
                              size="sm"
                              onClick={() => abrirModalEditar(usuario)}
                              className="flex items-center gap-1"
                            >
                              <Edit className="h-4 w-4" />
                              Editar
                            </Button>
                            <Button
                              variant="neutral"
                              size="sm"
                              onClick={() => {
                                setUsuarioEliminando(usuario);
                                setShowModalEliminar(true);
                              }}
                              className="flex items-center gap-1 text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                              Eliminar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </main>

      {/* Modal Crear Usuario */}
      <Modal
        isOpen={showModalCrear}
        onClose={() => setShowModalCrear(false)}
        title="Crear Usuario de Testing"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Email *
            </label>
            <input
              type="email"
              value={emailNuevo}
              onChange={(e) => setEmailNuevo(e.target.value)}
              className="w-full px-4 py-2 glass-card rounded-lg text-foreground"
              placeholder="usuario@ejemplo.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Nombre
              </label>
              <input
                type="text"
                value={nombreNuevo}
                onChange={(e) => setNombreNuevo(e.target.value)}
                className="w-full px-4 py-2 glass-card rounded-lg text-foreground"
                placeholder="Nombre"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Apellido
              </label>
              <input
                type="text"
                value={apellidoNuevo}
                onChange={(e) => setApellidoNuevo(e.target.value)}
                className="w-full px-4 py-2 glass-card rounded-lg text-foreground"
                placeholder="Apellido"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Plan
              </label>
              <select
                value={planNuevo}
                onChange={(e) => setPlanNuevo(e.target.value)}
                className="w-full px-4 py-2 glass-card rounded-lg text-foreground"
              >
                {PLANES.map((plan) => (
                  <option key={plan} value={plan}>
                    {plan}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Período
              </label>
              <select
                value={periodoNuevo}
                onChange={(e) => setPeriodoNuevo(e.target.value)}
                className="w-full px-4 py-2 glass-card rounded-lg text-foreground"
              >
                {PERIODOS.map((periodo) => (
                  <option key={periodo} value={periodo}>
                    {periodo}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleCrearUsuario}
              disabled={guardando || !emailNuevo}
              className="flex-1"
            >
              {guardando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creando...
                </>
              ) : (
                'Crear Usuario'
              )}
            </Button>
            <Button
              variant="neutral"
              onClick={() => setShowModalCrear(false)}
              disabled={guardando}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Editar Plan */}
      <Modal
        isOpen={showModalEditar}
        onClose={() => setShowModalEditar(false)}
        title={`Editar Plan - ${usuarioEditando?.email}`}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Plan
              </label>
              <select
                value={planEditando}
                onChange={(e) => setPlanEditando(e.target.value)}
                className="w-full px-4 py-2 glass-card rounded-lg text-foreground"
              >
                {PLANES.map((plan) => (
                  <option key={plan} value={plan}>
                    {plan}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Período
              </label>
              <select
                value={periodoEditando}
                onChange={(e) => setPeriodoEditando(e.target.value)}
                className="w-full px-4 py-2 glass-card rounded-lg text-foreground"
              >
                {PERIODOS.map((periodo) => (
                  <option key={periodo} value={periodo}>
                    {periodo}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleEditarPlan}
              disabled={guardando}
              className="flex-1"
            >
              {guardando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Actualizando...
                </>
              ) : (
                'Actualizar Plan'
              )}
            </Button>
            <Button
              variant="neutral"
              onClick={() => setShowModalEditar(false)}
              disabled={guardando}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Eliminar */}
      <Modal
        isOpen={showModalEliminar}
        onClose={() => setShowModalEliminar(false)}
        title="Eliminar Usuario"
      >
        <div className="space-y-4">
          <p className="text-foreground/80">
            ¿Estás seguro de que deseas eliminar al usuario{' '}
            <strong>{usuarioEliminando?.email}</strong>?
          </p>
          <p className="text-sm text-foreground/60">
            Esta acción no se puede deshacer. Se eliminarán todas las suscripciones y pagos asociados.
          </p>
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleEliminarUsuario}
              disabled={guardando}
              className="flex-1 bg-red-500 hover:bg-red-600"
            >
              {guardando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </Button>
            <Button
              variant="neutral"
              onClick={() => setShowModalEliminar(false)}
              disabled={guardando}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

