# 📡 API Routes - Backend Reforma

## Base URL
```
http://localhost:3000/api
```

## 🔐 Autenticación

Todas las rutas (excepto `/usuarios/registro` y `/usuarios/login`) requieren un token JWT en el header:

```
Authorization: Bearer <token>
```

---

## 👤 Usuarios

### POST `/api/usuarios/registro`
Registrar nuevo usuario

**Request:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "password123",
  "nombreUsuario": "Juan",
  "apellidoUsuario": "Pérez"
}
```

**Response:** `201 Created`
```json
{
  "usuario": { ... },
  "token": "jwt-token"
}
```

### POST `/api/usuarios/login`
Login de usuario

**Request:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "usuario": { ... },
  "token": "jwt-token"
}
```

### GET `/api/usuarios/perfil`
Obtener perfil del usuario actual

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": "user-123",
  "email": "usuario@ejemplo.com",
  "nombreUsuario": "Juan",
  "planSuscripcion": "PLAN_0",
  "granjas": [...]
}
```

### PUT `/api/usuarios/perfil`
Actualizar perfil

### GET `/api/usuarios/usuarios` (Admin)
Listar todos los usuarios

### PUT `/api/usuarios/usuarios/:usuarioId/plan` (Admin)
Actualizar plan de un usuario

---

## 🏠 Granjas

### GET `/api/granjas`
Obtener todas las granjas del usuario

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
[
  {
    "id": "granja-123",
    "nombreGranja": "Granja El Paraiso",
    "descripcion": "...",
    "_count": {
      "materiasPrimas": 10,
      "proveedores": 5,
      "piensos": 3
    }
  }
]
```

### POST `/api/granjas`
Crear nueva granja

**Request:**
```json
{
  "nombreGranja": "Granja El Paraiso",
  "descripcion": "Mi granja de cerdos"
}
```

### GET `/api/granjas/:idGranja`
Obtener una granja específica

### PUT `/api/granjas/:idGranja`
Actualizar granja

### DELETE `/api/granjas/:idGranja`
Eliminar granja (soft delete)

---

## 📦 Inventario

### GET `/api/inventario/:idGranja`
Obtener inventario completo de una granja

**Response:** `200 OK`
```json
[
  {
    "id": "inv-123",
    "idMateriaPrima": "mp-123",
    "cantidadAcumulada": 1000,
    "cantidadSistema": 800,
    "cantidadReal": 750,
    "merma": 50,
    "precioAlmacen": 15.5,
    "valorStock": 11625,
    "materiaPrima": {
      "codigoMateriaPrima": "MP001",
      "nombreMateriaPrima": "Maíz",
      "precioPorKilo": 15.5
    }
  }
]
```

### PUT `/api/inventario/:idGranja/:idMateriaPrima/cantidad-real`
Actualizar cantidad real

**Request:**
```json
{
  "cantidadReal": 750,
  "observaciones": "Conteo del 15/01"
}
```

### POST `/api/inventario/:idGranja/recalcular`
Recalcular todo el inventario

### GET `/api/inventario/:idGranja/estadisticas`
Obtener estadísticas del inventario

---

## 🛒 Compras

### POST `/api/compras`
Registrar nueva compra

**Request:**
```json
{
  "idGranja": "granja-123",
  "idProveedor": "prov-123",
  "fechaCompra": "2025-01-15",
  "observaciones": "Factura #1234",
  "detalles": [
    {
      "idMateriaPrima": "mp-123",
      "cantidadComprada": 100,
      "precioUnitario": 15.5
    }
  ]
}
```

**Nota:** Esta acción:
- Registra la compra
- Actualiza el precio de la materia prima
- Recalcula el inventario automáticamente
- Recalcula TODAS las fórmulas que usan esa materia prima
- Registra el cambio de precio para auditoría

### GET `/api/compras/:idGranja`
Obtener historial de compras

### GET `/api/compras/:idGranja/proveedores/gastos`
Obtener gasto por proveedor

### GET `/api/compras/materia-prima/:idMateriaPrima/precios`
Obtener historial de cambios de precio

---

## 🧪 Fórmulas

### POST `/api/formulas`
Crear nueva fórmula

**Request:**
```json
{
  "idGranja": "granja-123",
  "idAnimal": "animal-123",
  "codigoFormula": "F001",
  "descripcionFormula": "Fórmula para Lactancia",
  "detalles": [
    {
      "idMateriaPrima": "mp-123",
      "cantidadKg": 500
    },
    {
      "idMateriaPrima": "mp-456",
      "cantidadKg": 300
    }
  ]
}
```

### GET `/api/formulas/:idGranja`
Obtener todas las fórmulas de una granja

### GET `/api/formulas/detalle/:idFormula`
Obtener una fórmula con todos sus detalles

### POST `/api/formulas/:idFormula/recalcular`
Recalcular costo de una fórmula

### PUT `/api/formulas/:idFormula`
Actualizar fórmula

### DELETE `/api/formulas/:idFormula`
Eliminar fórmula (soft delete)

---

## 📊 Reglas de Negocio Implementadas

### Sistema de Inventario
- ✅ `cantidad_acumulada`: Suma de todas las compras
- ✅ `cantidad_sistema`: Compras - Fabricaciones
- ✅ `cantidad_real`: Carga manual desde granja
- ✅ `merma`: cantidad_sistema - cantidad_real
- ✅ `precio_almacen`: Promedio ponderado de compras
- ✅ `valor_stock`: cantidad_real × precio_almacen

### Actualización Automática
- ✅ Al comprar → actualiza inventario + precio + recalcula fórmulas
- ✅ Al fabricar → disminuye cantidad_sistema
- ✅ Al cargar cantidad_real → recalcula merma y valor_stock

### Independencia por Usuario/Granja
- ✅ Cada usuario tiene sus propias granjas
- ✅ Cada granja tiene su propio inventario
- ✅ Los datos son completamente independientes

---

## 🧪 Testing

Los endpoints están cubiertos por tests unitarios. Ejecuta:

```bash
npm test
```

---

## 📝 Notas Importantes

1. **Autenticación requerida** en todas las rutas excepto registro y login
2. **Validación de ownership** - Solo puedes acceder a tus propias granjas
3. **Actualización automática** - Las compras actualizan todo el sistema
4. **Auditoría completa** - Se registran todos los cambios de precio
5. **Soft delete** - Las eliminaciones no borran datos físicamente

