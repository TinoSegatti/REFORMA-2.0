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
  Trash2, 
  Copy,
  RefreshCw,
  Mail,
  User,
  Shield,
  Edit,
  Eye,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface UsuarioEmpleado {
  id: string;
  email: string;
  nombreUsuario: string;
  apellidoUsuario: string;
  fechaVinculacion: string;
  rolEmpleado: 'ADMIN' | 'EDITOR' | 'LECTOR';
  activoComoEmpleado: boolean;
}

interface LimiteUsuarios {
  limite: number;
  actual: number;
  disponibles: number;
  puedeAgregar: boolean;
}

const ROLES = [
  { value: 'ADMIN', label: 'Administrador', icon: Shield },
  { value: 'EDITOR', label: 'Editor', icon: Edit },
  { value: 'LECTOR', label: 'Lector', icon: Eye },
];

export default function EmpleadosPage() {
  const params = useParams();
  const router = useRouter();
  const idGranja = params?.id as string;

  const [empleados, setEmpleados] = useState<UsuarioEmpleado[]>([]);
  const [limite, setLimite] = useState<LimiteUsuarios | null>(null);
  const [codigoReferencia, setCodigoReferencia] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generandoCodigo, setGenerandoCodigo] = useState(false);
  const [regenerandoCodigo, setRegenerandoCodigo] = useState(false);
  const [showModalEliminar, setShowModalEliminar] = useState(false);
  const [showModalRol, setShowModalRol] = useState(false);
  const [showModalInvitacion, setShowModalInvitacion] = useState(false);
  const [empleadoEliminando, setEmpleadoEliminando] = useState<UsuarioEmpleado | null>(null);
  const [empleadoCambiandoRol, setEmpleadoCambiandoRol] = useState<UsuarioEmpleado | null>(null);
  const [nuevoRol, setNuevoRol] = useState<'ADMIN' | 'EDITOR' | 'LECTOR'>('EDITOR');
  const [emailInvitacion, setEmailInvitacion] = useState('');
  const [eliminando, setEliminando] = useState(false);
  const [cambiandoRol, setCambiandoRol] = useState(false);
  const [enviandoInvitacion, setEnviandoInvitacion] = useState(false);
  const [error, setError] = useState<string>('');
  const [mensajeExito, setMensajeExito] = useState<string>('');
  const [codigoCopiado, setCodigoCopiado] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      // Cargar empleados y límite en paralelo
      const [empleadosData, limiteData] = await Promise.all([
        apiClient.obtenerUsuariosEmpleados(token),
        apiClient.obtenerLimiteUsuariosEmpleados(token),
      ]);

      setEmpleados(empleadosData.empleados || []);
      setLimite(limiteData);
      
      // Si hay código de referencia, cargarlo
      if (empleadosData.codigoReferencia) {
        setCodigoReferencia(empleadosData.codigoReferencia);
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const generarCodigo = async () => {
    try {
      setGenerandoCodigo(true);
      setError('');
      const token = authService.getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await apiClient.generarCodigoReferencia(token);
      setCodigoReferencia(response.codigoReferencia);
      setLimite(response);
      setMensajeExito('Código de referencia generado exitosamente');
      setTimeout(() => setMensajeExito(''), 3000);
    } catch (err) {
      console.error('Error generando código:', err);
      setError(err instanceof Error ? err.message : 'Error al generar código');
    } finally {
      setGenerandoCodigo(false);
    }
  };

  const regenerarCodigo = async () => {
    try {
      setRegenerandoCodigo(true);
      setError('');
      const token = authService.getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await apiClient.regenerarCodigoReferencia(token);
      setCodigoReferencia(response.codigoReferencia);
      setLimite(response);
      setMensajeExito('Código de referencia regenerado exitosamente');
      setTimeout(() => setMensajeExito(''), 3000);
    } catch (err) {
      console.error('Error regenerando código:', err);
      setError(err instanceof Error ? err.message : 'Error al regenerar código');
    } finally {
      setRegenerandoCodigo(false);
    }
  };

  const copiarCodigo = () => {
    if (codigoReferencia) {
      navigator.clipboard.writeText(codigoReferencia);
      setCodigoCopiado(true);
      setMensajeExito('Código copiado al portapapeles');
      setTimeout(() => {
        setCodigoCopiado(false);
        setMensajeExito('');
      }, 2000);
    }
  };

  const abrirModalEliminar = (empleado: UsuarioEmpleado) => {
    setEmpleadoEliminando(empleado);
    setShowModalEliminar(true);
  };

  const abrirModalRol = (empleado: UsuarioEmpleado) => {
    setEmpleadoCambiandoRol(empleado);
    setNuevoRol(empleado.rolEmpleado);
    setShowModalRol(true);
  };

  const eliminarEmpleado = async () => {
    if (!empleadoEliminando) return;

    try {
      setEliminando(true);
      setError('');
      const token = authService.getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      await apiClient.eliminarEmpleado(token, empleadoEliminando.id);
      setMensajeExito('Empleado eliminado exitosamente');
      setTimeout(() => setMensajeExito(''), 3000);
      setShowModalEliminar(false);
      setEmpleadoEliminando(null);
      await cargarDatos();
    } catch (err) {
      console.error('Error eliminando empleado:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar empleado');
    } finally {
      setEliminando(false);
    }
  };

  const cambiarRol = async () => {
    if (!empleadoCambiandoRol) return;

    try {
      setCambiandoRol(true);
      setError('');
      const token = authService.getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      await apiClient.cambiarRolEmpleado(token, empleadoCambiandoRol.id, nuevoRol);
      setMensajeExito('Rol actualizado exitosamente');
      setTimeout(() => setMensajeExito(''), 3000);
      setShowModalRol(false);
      setEmpleadoCambiandoRol(null);
      await cargarDatos();
    } catch (err) {
      console.error('Error cambiando rol:', err);
      setError(err instanceof Error ? err.message : 'Error al cambiar rol');
    } finally {
      setCambiandoRol(false);
    }
  };

  const enviarInvitacion = async () => {
    if (!emailInvitacion || !codigoReferencia) {
      setError('Debes generar un código de referencia primero');
      return;
    }

    try {
      setEnviandoInvitacion(true);
      setError('');
      // TODO: Implementar servicio de email para enviar invitación
      // Por ahora, solo mostramos el código
      setMensajeExito(`Código de referencia: ${codigoReferencia}. Comparte este código con ${emailInvitacion}`);
      setTimeout(() => {
        setMensajeExito('');
        setShowModalInvitacion(false);
        setEmailInvitacion('');
      }, 5000);
    } catch (err) {
      console.error('Error enviando invitación:', err);
      setError(err instanceof Error ? err.message : 'Error al enviar invitación');
    } finally {
      setEnviandoInvitacion(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const obtenerRolInfo = (rol: string) => {
    return ROLES.find(r => r.value === rol) || ROLES[1];
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <main className="flex-1 ml-64">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">Gestión de Empleados</h1>
            <Button
              variant="neutral"
              onClick={() => router.push(`/granja/${idGranja}/configuracion`)}
            >
              Volver a Configuración
            </Button>
          </div>

          {/* Mensajes de éxito y error */}
          {mensajeExito && (
            <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-2 text-green-300">
              <CheckCircle className="h-5 w-5" />
              {mensajeExito}
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-300">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          )}

          {/* Card de Límite de Usuarios */}
          {limite && (
            <Card>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Límite de Usuarios</h2>
                    <p className="text-sm text-foreground/70">
                      {limite.actual} de {limite.limite} usuarios empleados vinculados
                    </p>
                  </div>
                  <div className={`px-4 py-2 rounded-lg ${
                    limite.puedeAgregar 
                      ? 'bg-green-500/20 text-green-300' 
                      : 'bg-red-500/20 text-red-300'
                  }`}>
                    {limite.puedeAgregar ? `${limite.disponibles} disponibles` : 'Límite alcanzado'}
                  </div>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      limite.puedeAgregar ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(limite.actual / limite.limite) * 100}%` }}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Card de Código de Referencia */}
          <Card>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-foreground">Código de Referencia</h2>
                  <p className="text-sm text-foreground/70">
                    Comparte este código con tus empleados para que se vinculen a tu cuenta
                  </p>
                </div>
              </div>

              {codigoReferencia ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <code className="flex-1 text-lg font-mono text-foreground">{codigoReferencia}</code>
                    <Button
                      variant="neutral"
                      size="sm"
                      onClick={copiarCodigo}
                      className="flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      {codigoCopiado ? 'Copiado' : 'Copiar'}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="neutral"
                      onClick={regenerarCodigo}
                      disabled={regenerandoCodigo}
                      className="flex items-center gap-2"
                    >
                      {regenerandoCodigo ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Regenerando...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          Regenerar Código
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowModalInvitacion(true)}
                      className="flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      Invitar por Email
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={generarCodigo}
                  disabled={generandoCodigo}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {generandoCodigo ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Generar Código de Referencia
                    </>
                  )}
                </Button>
              )}
            </div>
          </Card>

          {/* Card de Lista de Empleados */}
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Empleados Vinculados</h2>
                <div className="text-sm text-foreground/70">
                  {empleados.length} empleado{empleados.length !== 1 ? 's' : ''}
                </div>
              </div>

              {empleados.length === 0 ? (
                <div className="text-center py-8 text-foreground/60">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hay empleados vinculados aún</p>
                  <p className="text-sm mt-2">Genera un código de referencia y compártelo con tus empleados</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {empleados.map((empleado) => {
                    const rolInfo = obtenerRolInfo(empleado.rolEmpleado);
                    const RolIcon = rolInfo.icon;
                    
                    return (
                      <div
                        key={empleado.id}
                        className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 flex items-center justify-between hover:bg-gray-800/70 transition"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-400 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground">
                                {empleado.nombreUsuario} {empleado.apellidoUsuario}
                              </p>
                              {!empleado.activoComoEmpleado && (
                                <span className="px-2 py-0.5 bg-red-500/20 text-red-300 text-xs rounded">
                                  Desvinculado
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-foreground/70">{empleado.email}</p>
                            <p className="text-xs text-foreground/50 mt-1">
                              Vinculado el {formatearFecha(empleado.fechaVinculacion)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 px-3 py-1 bg-gray-700/50 rounded-lg">
                              <RolIcon className="h-4 w-4 text-foreground/70" />
                              <span className="text-sm text-foreground/80">{rolInfo.label}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="neutral"
                            size="sm"
                            onClick={() => abrirModalRol(empleado)}
                            className="flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Cambiar Rol
                          </Button>
                          <Button
                            variant="neutral"
                            size="sm"
                            onClick={() => abrirModalEliminar(empleado)}
                            className="flex items-center gap-2 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>

      {/* Modal Eliminar Empleado */}
      <Modal
        isOpen={showModalEliminar}
        onClose={() => {
          setShowModalEliminar(false);
          setEmpleadoEliminando(null);
        }}
        title="Eliminar Empleado"
      >
        <div className="space-y-4">
          <p className="text-foreground/80">
            ¿Estás seguro de que deseas eliminar a{' '}
            <strong>{empleadoEliminando?.nombreUsuario} {empleadoEliminando?.apellidoUsuario}</strong>?
          </p>
          <p className="text-sm text-foreground/60">
            El empleado perderá acceso inmediatamente a tus plantas y volverá al plan DEMO.
          </p>
          <div className="flex gap-2 justify-end">
            <Button
              variant="neutral"
              onClick={() => {
                setShowModalEliminar(false);
                setEmpleadoEliminando(null);
              }}
              disabled={eliminando}
            >
              Cancelar
            </Button>
            <Button
              onClick={eliminarEmpleado}
              disabled={eliminando}
              className="bg-red-500 hover:bg-red-600"
            >
              {eliminando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Cambiar Rol */}
      <Modal
        isOpen={showModalRol}
        onClose={() => {
          setShowModalRol(false);
          setEmpleadoCambiandoRol(null);
        }}
        title="Cambiar Rol de Empleado"
      >
        <div className="space-y-4">
          <p className="text-foreground/80">
            Selecciona el nuevo rol para{' '}
            <strong>{empleadoCambiandoRol?.nombreUsuario} {empleadoCambiandoRol?.apellidoUsuario}</strong>
          </p>
          <div className="space-y-2">
            {ROLES.map((rol) => {
              const RolIcon = rol.icon;
              return (
                <button
                  key={rol.value}
                  onClick={() => setNuevoRol(rol.value as 'ADMIN' | 'EDITOR' | 'LECTOR')}
                  className={`w-full p-3 rounded-lg border transition flex items-center gap-3 ${
                    nuevoRol === rol.value
                      ? 'border-primary bg-primary/20'
                      : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
                  }`}
                >
                  <RolIcon className="h-5 w-5 text-foreground/70" />
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-foreground">{rol.label}</p>
                    <p className="text-xs text-foreground/60">
                      {rol.value === 'ADMIN' && 'Acceso completo a todas las funcionalidades'}
                      {rol.value === 'EDITOR' && 'Puede crear, editar y eliminar registros'}
                      {rol.value === 'LECTOR' && 'Solo lectura, no puede modificar nada'}
                    </p>
                  </div>
                  {nuevoRol === rol.value && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="neutral"
              onClick={() => {
                setShowModalRol(false);
                setEmpleadoCambiandoRol(null);
              }}
              disabled={cambiandoRol}
            >
              Cancelar
            </Button>
            <Button
              onClick={cambiarRol}
              disabled={cambiandoRol}
            >
              {cambiandoRol ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Invitación por Email */}
      <Modal
        isOpen={showModalInvitacion}
        onClose={() => {
          setShowModalInvitacion(false);
          setEmailInvitacion('');
        }}
        title="Invitar Empleado por Email"
      >
        <div className="space-y-4">
          <p className="text-foreground/80">
            Ingresa el email del empleado que deseas invitar. Se le enviará un email con el código de referencia.
          </p>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Email del Empleado
            </label>
            <input
              type="email"
              value={emailInvitacion}
              onChange={(e) => setEmailInvitacion(e.target.value)}
              placeholder="empleado@ejemplo.com"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {codigoReferencia && (
            <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <p className="text-xs text-foreground/60 mb-1">Código que se enviará:</p>
              <code className="text-sm font-mono text-foreground">{codigoReferencia}</code>
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button
              variant="neutral"
              onClick={() => {
                setShowModalInvitacion(false);
                setEmailInvitacion('');
              }}
              disabled={enviandoInvitacion}
            >
              Cancelar
            </Button>
            <Button
              onClick={enviarInvitacion}
              disabled={enviandoInvitacion || !emailInvitacion || !codigoReferencia}
            >
              {enviandoInvitacion ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Invitación
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

