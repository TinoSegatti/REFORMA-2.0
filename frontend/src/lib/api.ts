/**
 * Cliente API para conectar con el Backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const apiClient = {
  // Login
  async login(email: string, password: string) {
    const response = await fetch(`${API_URL}/api/usuarios/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al iniciar sesión');
    }

    return await response.json();
  },

  // Registro
  async register(data: {
    email: string;
    password: string;
    nombreUsuario: string;
    apellidoUsuario: string;
  }) {
    const response = await fetch(`${API_URL}/api/usuarios/registro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al registrar');
    }

    return await response.json();
  },

  // Obtener perfil
  async getProfile(token: string) {
    const response = await fetch(`${API_URL}/api/usuarios/perfil`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener perfil');
    }

    return await response.json();
  },

  // Granjas
  async getGranjas(token: string) {
    const response = await fetch(`${API_URL}/api/granjas`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener granjas');
    }

    return await response.json();
  },

  async getGranja(token: string, idGranja: string) {
    const response = await fetch(`${API_URL}/api/granjas/${idGranja}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener granja');
    }

    return await response.json();
  },

  async createGranja(token: string, data: { nombreGranja: string; descripcion?: string }) {
    const response = await fetch(`${API_URL}/api/granjas`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear granja');
    }

    return await response.json();
  },

  async updateGranja(token: string, idGranja: string, data: { nombreGranja: string; descripcion?: string }) {
    const response = await fetch(`${API_URL}/api/granjas/${idGranja}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar granja');
    }

    return await response.json();
  },

  async deleteGranja(token: string, idGranja: string) {
    const response = await fetch(`${API_URL}/api/granjas/${idGranja}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar granja');
    }

    return await response.json();
  },

  // Proveedores
  async getProveedores(token: string, idGranja: string) {
    const response = await fetch(`${API_URL}/api/proveedores/${idGranja}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener proveedores');
    }

    return await response.json();
  },

  async getEstadisticasProveedores(token: string, idGranja: string) {
    const response = await fetch(`${API_URL}/api/proveedores/${idGranja}/estadisticas`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener estadísticas');
    }

    return await response.json();
  },

  async createProveedor(token: string, idGranja: string, data: { codigoProveedor: string; nombreProveedor: string; direccionProveedor?: string; localidadProveedor?: string }) {
    const response = await fetch(`${API_URL}/api/proveedores/${idGranja}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear proveedor');
    }

    return await response.json();
  },

  async updateProveedor(token: string, idGranja: string, id: string, data: { codigoProveedor: string; nombreProveedor: string; direccionProveedor?: string; localidadProveedor?: string }) {
    const response = await fetch(`${API_URL}/api/proveedores/${idGranja}/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar proveedor');
    }

    return await response.json();
  },

  async deleteProveedor(token: string, idGranja: string, id: string) {
    const response = await fetch(`${API_URL}/api/proveedores/${idGranja}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar proveedor');
    }

    return await response.json();
  },

  // Importar datos
  async importarMateriasPrimas(token: string, idGranjaOrigen: string, idGranjaDestino: string) {
    const response = await fetch(`${API_URL}/api/granjas/importar/materias-primas`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idGranjaOrigen, idGranjaDestino }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al importar materias primas');
    }

    return await response.json();
  },

  async importarProveedores(token: string, idGranjaOrigen: string, idGranjaDestino: string) {
    const response = await fetch(`${API_URL}/api/granjas/importar/proveedores`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idGranjaOrigen, idGranjaDestino }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al importar proveedores');
    }

    return await response.json();
  },

  // Animales
  async getAnimales(token: string, idGranja: string) {
    const response = await fetch(`${API_URL}/api/animales/${idGranja}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener animales');
    }

    return await response.json();
  },

  async createAnimal(token: string, idGranja: string, data: { codigoAnimal: string; descripcionAnimal: string; categoriaAnimal: string }) {
    const response = await fetch(`${API_URL}/api/animales/${idGranja}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear animal');
    }

    return await response.json();
  },

  async updateAnimal(token: string, idGranja: string, id: string, data: { codigoAnimal: string; descripcionAnimal: string; categoriaAnimal: string }) {
    const response = await fetch(`${API_URL}/api/animales/${idGranja}/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar animal');
    }

    return await response.json();
  },

  async deleteAnimal(token: string, idGranja: string, id: string) {
    const response = await fetch(`${API_URL}/api/animales/${idGranja}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar animal');
    }

    return await response.json();
  },

  // Materias Primas
  async getMateriasPrimas(token: string, idGranja: string) {
    const response = await fetch(`${API_URL}/api/materias-primas/${idGranja}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener materias primas');
    }

    return await response.json();
  },

  async createMateriaPrima(token: string, idGranja: string, data: { codigoMateriaPrima: string; nombreMateriaPrima: string }) {
    const response = await fetch(`${API_URL}/api/materias-primas/${idGranja}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear materia prima');
    }

    return await response.json();
  },

  async updateMateriaPrima(token: string, idGranja: string, id: string, data: { codigoMateriaPrima: string; nombreMateriaPrima: string }) {
    const response = await fetch(`${API_URL}/api/materias-primas/${idGranja}/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar materia prima');
    }

    return await response.json();
  },

  async deleteMateriaPrima(token: string, idGranja: string, id: string) {
    const response = await fetch(`${API_URL}/api/materias-primas/${idGranja}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar materia prima');
    }

    return await response.json();
  },

  // ===== FÓRMULAS =====
  async getFormulas(token: string, idGranja: string) {
    const response = await fetch(`${API_URL}/api/formulas/granja/${idGranja}/formulas`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener fórmulas');
    }

    return await response.json();
  },

  async getEstadisticasFormulas(token: string, idGranja: string) {
    const response = await fetch(`${API_URL}/api/formulas/granja/${idGranja}/formulas/estadisticas`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener estadísticas');
    }

    return await response.json();
  },

  async createFormula(token: string, idGranja: string, data: any) {
    const response = await fetch(`${API_URL}/api/formulas/granja/${idGranja}/formulas`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear fórmula');
    }

    return await response.json();
  },

  async getFormulaById(token: string, idGranja: string, id: string) {
    const response = await fetch(`${API_URL}/api/formulas/granja/${idGranja}/formulas/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener fórmula');
    }

    return await response.json();
  },

  async deleteFormula(token: string, idGranja: string, id: string) {
    const response = await fetch(`${API_URL}/api/formulas/granja/${idGranja}/formulas/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar fórmula');
    }

    return await response.json();
  },

  // ===== DETALLES DE FÓRMULA =====
  async agregarDetalleFormula(token: string, idGranja: string, idFormula: string, data: { idMateriaPrima: string; cantidadKg: number }) {
    const response = await fetch(`${API_URL}/api/formulas/granja/${idGranja}/formulas/${idFormula}/detalles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al agregar detalle');
    }

    return await response.json();
  },

  async actualizarDetalleFormula(token: string, idGranja: string, idFormula: string, detalleId: string, data: { cantidadKg: number }) {
    const response = await fetch(`${API_URL}/api/formulas/granja/${idGranja}/formulas/${idFormula}/detalles/${detalleId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar detalle');
    }

    return await response.json();
  },

  async eliminarDetalleFormula(token: string, idGranja: string, idFormula: string, detalleId: string) {
    const response = await fetch(`${API_URL}/api/formulas/granja/${idGranja}/formulas/${idFormula}/detalles/${detalleId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar detalle');
    }

    return await response.json();
  },

  // ===== INVENTARIO =====
  async getInventario(token: string, idGranja: string) {
    const response = await fetch(`${API_URL}/api/inventario/granja/${idGranja}/inventario`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener inventario');
    }

    return await response.json();
  },

  async getEstadisticasInventario(token: string, idGranja: string) {
    const response = await fetch(`${API_URL}/api/inventario/granja/${idGranja}/inventario/estadisticas`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener estadísticas de inventario');
    }

    return await response.json();
  },

  async inicializarInventario(token: string, idGranja: string, datosIniciales: Array<{
    idMateriaPrima: string;
    cantidadReal: number;
    precioPorKilo?: number;
  }>) {
    const response = await fetch(`${API_URL}/api/inventario/granja/${idGranja}/inventario/inicializar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ datosIniciales }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al inicializar inventario');
    }

    return await response.json();
  },

  async actualizarCantidadReal(token: string, idGranja: string, idInventario: string, cantidadReal: number) {
    const response = await fetch(`${API_URL}/api/inventario/granja/${idGranja}/inventario/${idInventario}/cantidad-real`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cantidadReal }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar cantidad real');
    }

    return await response.json();
  },

  async recalcularInventario(token: string, idGranja: string) {
    const response = await fetch(`${API_URL}/api/inventario/granja/${idGranja}/inventario/recalcular`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al recalcular inventario');
    }

    return await response.json();
  },

  async vaciarInventario(token: string, idGranja: string) {
    const response = await fetch(`${API_URL}/api/inventario/granja/${idGranja}/inventario`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al vaciar inventario');
    }

    return await response.json();
  },

  // Más métodos según necesites...
  
  // ===== COMPRAS =====
  async getCompras(token: string, idGranja: string, params?: { desde?: string; hasta?: string; materiaPrima?: string; proveedor?: string; numeroFactura?: string; ordenar?: 'fecha_asc' | 'fecha_desc' | 'total_asc' | 'total_desc'; }) {
    const qs = new URLSearchParams();
    if (params?.desde) qs.set('desde', params.desde);
    if (params?.hasta) qs.set('hasta', params.hasta);
    if (params?.materiaPrima) qs.set('materiaPrima', params.materiaPrima);
    if (params?.proveedor) qs.set('proveedor', params.proveedor);
    if (params?.numeroFactura) qs.set('numeroFactura', params.numeroFactura);
    if (params?.ordenar) qs.set('ordenar', params.ordenar);

    const response = await fetch(`${API_URL}/api/compras/granja/${idGranja}/compras?${qs.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return [];
      }
      let message = 'Error al obtener compras';
      const ct = response.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const error = await response.json();
        message = error.error || message;
      } else {
        const text = await response.text();
        message = `${message}: ${response.status} ${response.statusText}`;
      }
      throw new Error(message);
    }

    const ct = response.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return [];
    return await response.json();
  },

  async getEstadisticasCompras(token: string, idGranja: string) {
    const response = await fetch(`${API_URL}/api/compras/granja/${idGranja}/compras/estadisticas`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { frecuenciaPorMateria: [], totalCompras: 0 };
      }
      let message = 'Error al obtener estadísticas de compras';
      const ct = response.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const error = await response.json();
        message = error.error || message;
      } else {
        await response.text();
        message = `${message}: ${response.status} ${response.statusText}`;
      }
      throw new Error(message);
    }

    const ct = response.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return { frecuenciaPorMateria: [], totalCompras: 0 };
    return await response.json();
  },

  async crearCompra(token: string, idGranja: string, data: {
    idProveedor: string;
    numeroFactura?: string;
    fechaCompra: string;
    observaciones?: string;
    detalles: Array<{
      idMateriaPrima: string;
      cantidadComprada: number;
      precioUnitario: number;
      subtotal?: number;
    }>;
    totalFactura?: number;
  }) {
    const response = await fetch(`${API_URL}/api/compras/granja/${idGranja}/compras`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear compra');
    }

    return await response.json();
  },

  async getCompraPorId(token: string, idGranja: string, idCompra: string) {
    const response = await fetch(`${API_URL}/api/compras/granja/${idGranja}/compras/${idCompra}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener compra');
    }

    return await response.json();
  },

  async editarCabeceraCompra(token: string, idGranja: string, idCompra: string, data: {
    numeroFactura?: string;
    fechaCompra?: string;
    observaciones?: string;
    idProveedor?: string;
  }) {
    const response = await fetch(`${API_URL}/api/compras/granja/${idGranja}/compras/${idCompra}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al editar compra');
    }

    return await response.json();
  },

  async eliminarCompra(token: string, idGranja: string, idCompra: string) {
    const response = await fetch(`${API_URL}/api/compras/granja/${idGranja}/compras/${idCompra}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar compra');
    }

    return await response.json();
  },

  async agregarItemCompra(token: string, idGranja: string, idCompra: string, data: {
    idMateriaPrima: string;
    cantidadComprada: number;
    precioUnitario?: number;
    subtotal?: number;
  }) {
    const response = await fetch(`${API_URL}/api/compras/granja/${idGranja}/compras/${idCompra}/items`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al agregar item');
    }

    return await response.json();
  },

  async editarItemCompra(token: string, idGranja: string, idCompra: string, detalleId: string, data: {
    cantidadComprada: number;
    precioUnitario?: number;
    subtotal?: number;
  }) {
    const response = await fetch(`${API_URL}/api/compras/granja/${idGranja}/compras/${idCompra}/items/${detalleId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al editar item');
    }

    return await response.json();
  },

  async eliminarItemCompra(token: string, idGranja: string, idCompra: string, detalleId: string) {
    const response = await fetch(`${API_URL}/api/compras/granja/${idGranja}/compras/${idCompra}/items/${detalleId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar item');
    }

    return await response.json();
  },

  async getUltimoPrecio(token: string, idGranja: string, idMateriaPrima: string) {
    const response = await fetch(`${API_URL}/api/compras/granja/${idGranja}/materia-prima/${idMateriaPrima}/ultimo-precio`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return null; // No hay último precio, retornar null
    }

    const data = await response.json();
    return data.ultimoPrecio as number | null;
  },
};

export default apiClient;

