# 📋 Sistema de Auditoría - Documentación Completa

## 📖 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Arquitectura](#arquitectura)
3. [Estructura de Base de Datos](#estructura-de-base-de-datos)
4. [Tipos de Operaciones](#tipos-de-operaciones)
5. [Flujo de Datos](#flujo-de-datos)
6. [Casos de Uso](#casos-de-uso)
7. [Implementación en Código](#implementación-en-código)
8. [Consultas y Ejemplos](#consultas-y-ejemplos)
9. [Buenas Prácticas](#buenas-prácticas)
10. [Extensibilidad](#extensibilidad)

---

## 🎯 Introducción

### ¿Qué es el Sistema de Auditoría?

El **Sistema de Auditoría** es un módulo integral que registra automáticamente todas las operaciones críticas realizadas en el sistema. Su propósito principal es:

- **Rastreabilidad**: Saber quién, cuándo y qué cambió en el sistema
- **Cumplimiento**: Cumplir con regulaciones que requieren trazabilidad
- **Seguridad**: Detectar actividades sospechosas o no autorizadas
- **Debugging**: Facilitar la resolución de problemas y análisis de errores
- **Historial**: Mantener un registro histórico completo de cambios

### Características Principales

✅ **Registro Automático**: No requiere intervención manual del usuario  
✅ **No Intrusivo**: Los errores de auditoría no afectan el flujo principal  
✅ **Completo**: Registra usuario, timestamp, datos anteriores y nuevos  
✅ **Consultable**: API para obtener historiales de auditoría  
✅ **Escalable**: Diseñado para manejar grandes volúmenes de registros  

---

## 🏗️ Arquitectura

### Componentes del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    Aplicación                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Compras     │  │ Fabricaciones│  │  Inventario  │  │
│  │  Service     │  │   Service    │  │   Service    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │           │
│         └─────────────────┼─────────────────┘           │
│                           │                             │
│                    ┌──────▼──────┐                      │
│                    │ Auditoría   │                      │
│                    │  Service   │                      │
│                    └──────┬─────┘                      │
└───────────────────────────┼────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │  Base de Datos │
                    │  t_auditoria   │
                    └────────────────┘
```

### Flujo de Auditoría

1. **Evento**: Una operación crítica ocurre (CREATE, UPDATE, DELETE, etc.)
2. **Interceptación**: El servicio de negocio detecta la operación
3. **Registro**: Se llama a `registrarAuditoria()` con los datos relevantes
4. **Persistencia**: Los datos se guardan en `t_auditoria`
5. **Continuación**: El flujo principal continúa normalmente

**Nota Importante**: Los errores en la auditoría se capturan y registran, pero **nunca** interrumpen el flujo principal de la aplicación.

---

## 💾 Estructura de Base de Datos

### Tabla `t_auditoria`

```sql
CREATE TABLE t_auditoria (
  id                VARCHAR(255) PRIMARY KEY,
  id_usuario        VARCHAR(255) NOT NULL,
  id_granja         VARCHAR(255),
  tabla_origen      VARCHAR(50) NOT NULL,  -- INVENTARIO, FABRICACION, COMPRA
  id_registro       VARCHAR(255) NOT NULL,
  accion            VARCHAR(50) NOT NULL,   -- CREATE, UPDATE, DELETE, RESTORE, BULK_DELETE
  descripcion       TEXT,
  datos_anteriores  JSONB,                 -- Estado anterior del registro
  datos_nuevos      JSONB,                 -- Estado nuevo del registro
  fecha_operacion   TIMESTAMP DEFAULT NOW(),
  ip_address        VARCHAR(255),
  user_agent        VARCHAR(500),
  
  FOREIGN KEY (id_usuario) REFERENCES t_usuarios(id),
  FOREIGN KEY (id_granja) REFERENCES t_granja(id)
);
```

### Índices para Optimización

```sql
CREATE INDEX idx_auditoria_usuario ON t_auditoria(id_usuario);
CREATE INDEX idx_auditoria_granja ON t_auditoria(id_granja);
CREATE INDEX idx_auditoria_tabla_origen ON t_auditoria(tabla_origen);
CREATE INDEX idx_auditoria_fecha ON t_auditoria(fecha_operacion);
```

### Modelo Prisma

```prisma
model Auditoria {
  id                String        @id @default(cuid())
  idUsuario         String
  idGranja          String?
  tablaOrigen       TablaOrigen
  idRegistro        String
  accion            String        // CREATE, UPDATE, DELETE, RESTORE, BULK_DELETE
  descripcion       String?       @db.Text
  datosAnteriores   Json?
  datosNuevos        Json?
  fechaOperacion    DateTime      @default(now())
  ipAddress         String?
  userAgent         String?

  usuario           Usuario       @relation(fields: [idUsuario], references: [id])
  granja            Granja?       @relation(fields: [idGranja], references: [id])

  @@index([idUsuario])
  @@index([idGranja])
  @@index([tablaOrigen])
  @@index([fechaOperacion])
  @@map("t_auditoria")
}
```

### Enum `TablaOrigen`

```prisma
enum TablaOrigen {
  INVENTARIO
  FABRICACION
  COMPRA
}
```

---

## 🔧 Tipos de Operaciones

### Acciones Registradas

| Acción | Descripción | Cuándo se Registra |
|--------|-------------|-------------------|
| `CREATE` | Creación de un nuevo registro | Al crear compras, fabricaciones, etc. |
| `UPDATE` | Modificación de un registro existente | Al editar compras, fabricaciones, etc. |
| `DELETE` | Eliminación (soft delete) | Al eliminar compras o fabricaciones |
| `RESTORE` | Restauración de un registro eliminado | Al restaurar compras o fabricaciones |
| `BULK_DELETE` | Eliminación masiva | Al eliminar todas las compras/fabricaciones |

### Tablas Auditadas

| Tabla | TablaOrigen | Operaciones Auditadas |
|-------|-------------|----------------------|
| `t_compra_cabecera` | `COMPRA` | DELETE, RESTORE, BULK_DELETE |
| `t_fabricacion` | `FABRICACION` | DELETE, RESTORE, BULK_DELETE |
| `t_inventario` | `INVENTARIO` | UPDATE (cantidad real manual) |

**Nota**: Actualmente solo se auditan operaciones críticas (eliminaciones y restauraciones). Las operaciones CREATE y UPDATE pueden agregarse en el futuro si es necesario.

---

## 📊 Flujo de Datos

### Ejemplo: Eliminación de una Compra

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuario hace clic en "Eliminar Compra"                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend llama: DELETE /api/compras/:id                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Controller: eliminarCompraEndpoint()                     │
│    - Valida permisos                                         │
│    - Llama al servicio                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Service: eliminarCompra()                                │
│    - Valida que no tenga items                               │
│    - Valida que no haya fabricaciones                       │
│    - Realiza soft delete                                     │
│    - Recalcula inventario                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. registrarAuditoria()                                      │
│    - Prepara datos:                                          │
│      * idUsuario: "user123"                                  │
│      * idGranja: "granja456"                                │
│      * tablaOrigen: TablaOrigen.COMPRA                      │
│      * idRegistro: "compra789"                              │
│      * accion: "DELETE"                                      │
│      * descripcion: "Compra eliminada: Factura A-001"       │
│      * datosAnteriores: { ...compra completa... }           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Prisma: prisma.auditoria.create()                        │
│    - Guarda en t_auditoria                                   │
│    - Retorna el registro creado                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Respuesta al usuario: "Compra eliminada exitosamente"    │
└─────────────────────────────────────────────────────────────┘
```

### Ejemplo: Restauración de una Fabricación

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuario hace clic en "Restaurar" en tabla eliminadas   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend llama: POST /api/fabricaciones/:id/restaurar   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Service: restaurarFabricacion()                          │
│    - Verifica que esté eliminada                            │
│    - Restaura (activo = true)                               │
│    - Recalcula inventario                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. registrarAuditoria()                                      │
│    - accion: "RESTORE"                                       │
│    - descripcion: "Fabricación restaurada: Fórmula X"       │
│    - datosNuevos: { activo: true }                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎬 Casos de Uso

### Caso 1: Auditoría de Eliminación de Compra

**Escenario**: Un usuario elimina una compra por error.

**Proceso de Auditoría**:
1. Se registra el evento con:
   - Usuario que eliminó
   - Fecha y hora exacta
   - Datos completos de la compra eliminada
   - Descripción: "Compra eliminada: Factura A-001"

**Consulta para Auditoría**:
```sql
SELECT 
  a.id,
  a.fecha_operacion,
  u.email,
  u.nombre_usuario,
  a.accion,
  a.descripcion,
  a.datos_anteriores
FROM t_auditoria a
JOIN t_usuarios u ON a.id_usuario = u.id
WHERE a.id_registro = 'compra_eliminada_id'
  AND a.accion = 'DELETE'
ORDER BY a.fecha_operacion DESC;
```

**Resultado**: El administrador puede ver quién eliminó la compra y restaurarla si es necesario.

---

### Caso 2: Eliminación Masiva de Fabricaciones

**Escenario**: Un administrador elimina todas las fabricaciones de una granja.

**Proceso de Auditoría**:
1. Se registra un solo evento con:
   - `accion`: `BULK_DELETE`
   - `idRegistro`: `'BULK'` (identificador especial)
   - `descripcion`: `"Eliminación masiva de 150 fabricaciones"`

**Consulta para Auditoría**:
```sql
SELECT 
  a.fecha_operacion,
  u.email,
  a.descripcion,
  COUNT(*) as fabricaciones_eliminadas
FROM t_auditoria a
JOIN t_usuarios u ON a.id_usuario = u.id
WHERE a.id_granja = 'granja_id'
  AND a.accion = 'BULK_DELETE'
  AND a.tabla_origen = 'FABRICACION'
GROUP BY a.id, a.fecha_operacion, u.email, a.descripcion
ORDER BY a.fecha_operacion DESC;
```

---

### Caso 3: Restauración de Registro Eliminado

**Escenario**: Un usuario necesita restaurar una compra que fue eliminada por error.

**Proceso de Auditoría**:
1. Al restaurar, se registra un nuevo evento:
   - `accion`: `RESTORE`
   - `datosNuevos`: `{ activo: true }`
   - `descripcion`: `"Compra restaurada: Factura A-001"`

**Historial Completo**:
```sql
SELECT 
  a.fecha_operacion,
  a.accion,
  a.descripcion,
  u.email
FROM t_auditoria a
JOIN t_usuarios u ON a.id_usuario = u.id
WHERE a.id_registro = 'compra_id'
ORDER BY a.fecha_operacion DESC;
```

**Resultado**:
```
2024-01-15 10:30:00 | DELETE | Compra eliminada: Factura A-001 | usuario@email.com
2024-01-15 11:15:00 | RESTORE | Compra restaurada: Factura A-001 | admin@email.com
```

---

### Caso 4: Análisis de Actividad de Usuario

**Escenario**: Un administrador necesita revisar todas las acciones de un usuario específico.

**Consulta**:
```sql
SELECT 
  a.fecha_operacion,
  a.tabla_origen,
  a.accion,
  a.descripcion,
  g.nombre_granja
FROM t_auditoria a
LEFT JOIN t_granja g ON a.id_granja = g.id
WHERE a.id_usuario = 'usuario_id'
ORDER BY a.fecha_operacion DESC
LIMIT 100;
```

---

### Caso 5: Detección de Actividades Sospechosas

**Escenario**: Detectar múltiples eliminaciones masivas en un corto período.

**Consulta**:
```sql
SELECT 
  u.email,
  COUNT(*) as eliminaciones_masivas,
  MIN(a.fecha_operacion) as primera,
  MAX(a.fecha_operacion) as ultima
FROM t_auditoria a
JOIN t_usuarios u ON a.id_usuario = u.id
WHERE a.accion = 'BULK_DELETE'
  AND a.fecha_operacion >= NOW() - INTERVAL '24 hours'
GROUP BY u.email
HAVING COUNT(*) > 3
ORDER BY eliminaciones_masivas DESC;
```

---

## 💻 Implementación en Código

### Servicio de Auditoría

**Ubicación**: `backend/src/services/auditoriaService.ts`

```typescript
import prisma from '../lib/prisma';
import { TablaOrigen } from '@prisma/client';

interface AuditoriaParams {
  idUsuario: string;
  idGranja?: string;
  tablaOrigen: TablaOrigen;
  idRegistro: string;
  accion: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'BULK_DELETE';
  descripcion?: string;
  datosAnteriores?: any;
  datosNuevos?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Registrar una operación en la auditoría
 * 
 * IMPORTANTE: Los errores de auditoría no deben interrumpir el flujo principal.
 * Por eso se capturan y registran en consola, pero no se lanzan excepciones.
 */
export async function registrarAuditoria(params: AuditoriaParams) {
  try {
    await prisma.auditoria.create({
      data: {
        idUsuario: params.idUsuario,
        idGranja: params.idGranja,
        tablaOrigen: params.tablaOrigen,
        idRegistro: params.idRegistro,
        accion: params.accion,
        descripcion: params.descripcion,
        datosAnteriores: params.datosAnteriores 
          ? JSON.parse(JSON.stringify(params.datosAnteriores)) 
          : null,
        datosNuevos: params.datosNuevos 
          ? JSON.parse(JSON.stringify(params.datosNuevos)) 
          : null,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    // No queremos que errores de auditoría rompan el flujo principal
    console.error('Error registrando auditoría:', error);
  }
}
```

### Uso en Servicios de Negocio

**Ejemplo en `compraService.ts`**:

```typescript
import { registrarAuditoria } from './auditoriaService';
import { TablaOrigen } from '@prisma/client';

export async function eliminarCompra(idCompra: string, idUsuario: string) {
  // ... validaciones y lógica de eliminación ...
  
  // Soft delete
  await prisma.compraCabecera.update({
    where: { id: idCompra },
    data: {
      activo: false,
      fechaEliminacion: new Date(),
      eliminadoPor: idUsuario,
    },
  });

  // Registrar en auditoría
  await registrarAuditoria({
    idUsuario,
    idGranja: compra.idGranja,
    tablaOrigen: TablaOrigen.COMPRA,
    idRegistro: idCompra,
    accion: 'DELETE',
    descripcion: `Compra eliminada: Factura ${compra.numeroFactura || 'N/A'}`,
    datosAnteriores: compra, // Estado completo antes de eliminar
  });

  return { mensaje: 'Compra eliminada exitosamente' };
}
```

**Ejemplo en `fabricacionService.ts`**:

```typescript
export async function restaurarFabricacion(idFabricacion: string, idUsuario: string) {
  // ... validaciones y lógica de restauración ...
  
  // Restaurar
  await prisma.fabricacion.update({
    where: { id: idFabricacion },
    data: {
      activo: true,
      fechaEliminacion: null,
      eliminadoPor: null,
    },
  });

  // Registrar en auditoría
  await registrarAuditoria({
    idUsuario,
    idGranja: fabricacion.idGranja,
    tablaOrigen: TablaOrigen.FABRICACION,
    idRegistro: idFabricacion,
    accion: 'RESTORE',
    descripcion: `Fabricación restaurada: ${fabricacion.descripcionFabricacion}`,
    datosNuevos: { activo: true },
  });

  return { mensaje: 'Fabricación restaurada exitosamente' };
}
```

### Eliminación Masiva

```typescript
export async function eliminarTodasLasCompras(idGranja: string, idUsuario: string) {
  // ... validaciones ...
  
  // Soft delete masivo
  const resultado = await prisma.compraCabecera.updateMany({
    where: { 
      idGranja,
      activo: true
    },
    data: {
      activo: false,
      fechaEliminacion: new Date(),
      eliminadoPor: idUsuario,
    },
  });

  // Registrar en auditoría (un solo registro para todas)
  await registrarAuditoria({
    idUsuario,
    idGranja,
    tablaOrigen: TablaOrigen.COMPRA,
    idRegistro: 'BULK', // Identificador especial para operaciones masivas
    accion: 'BULK_DELETE',
    descripcion: `Eliminación masiva de ${resultado.count} compras`,
  });

  return { 
    mensaje: 'Todas las compras eliminadas exitosamente',
    eliminadas: resultado.count
  };
}
```

---

## 📝 Consultas y Ejemplos

### Obtener Historial de una Granja

**Función del servicio**:
```typescript
export async function obtenerAuditoriaGranja(idGranja: string, limit: number = 100) {
  return await prisma.auditoria.findMany({
    where: { idGranja },
    include: {
      usuario: {
        select: {
          nombreUsuario: true,
          apellidoUsuario: true,
          email: true,
        },
      },
    },
    orderBy: {
      fechaOperacion: 'desc',
    },
    take: limit,
  });
}
```

**SQL equivalente**:
```sql
SELECT 
  a.*,
  u.nombre_usuario,
  u.apellido_usuario,
  u.email
FROM t_auditoria a
JOIN t_usuarios u ON a.id_usuario = u.id
WHERE a.id_granja = $1
ORDER BY a.fecha_operacion DESC
LIMIT $2;
```

### Obtener Historial de un Usuario

```typescript
export async function obtenerAuditoriaUsuario(idUsuario: string, limit: number = 100) {
  return await prisma.auditoria.findMany({
    where: { idUsuario },
    include: {
      granja: {
        select: {
          nombreGranja: true,
        },
      },
    },
    orderBy: {
      fechaOperacion: 'desc',
    },
    take: limit,
  });
}
```

### Consultas Avanzadas

#### 1. Eliminaciones por Tipo de Tabla

```sql
SELECT 
  tabla_origen,
  COUNT(*) as total_eliminaciones
FROM t_auditoria
WHERE accion IN ('DELETE', 'BULK_DELETE')
  AND fecha_operacion >= NOW() - INTERVAL '30 days'
GROUP BY tabla_origen
ORDER BY total_eliminaciones DESC;
```

#### 2. Usuarios Más Activos

```sql
SELECT 
  u.email,
  COUNT(*) as total_operaciones,
  COUNT(CASE WHEN a.accion = 'DELETE' THEN 1 END) as eliminaciones,
  COUNT(CASE WHEN a.accion = 'RESTORE' THEN 1 END) as restauraciones
FROM t_auditoria a
JOIN t_usuarios u ON a.id_usuario = u.id
WHERE a.fecha_operacion >= NOW() - INTERVAL '7 days'
GROUP BY u.email
ORDER BY total_operaciones DESC
LIMIT 10;
```

#### 3. Restauraciones Recientes

```sql
SELECT 
  a.fecha_operacion,
  a.tabla_origen,
  a.descripcion,
  u.email,
  a.datos_nuevos
FROM t_auditoria a
JOIN t_usuarios u ON a.id_usuario = u.id
WHERE a.accion = 'RESTORE'
  AND a.fecha_operacion >= NOW() - INTERVAL '24 hours'
ORDER BY a.fecha_operacion DESC;
```

---

## ✅ Buenas Prácticas

### 1. **No Interrumpir el Flujo Principal**

❌ **MAL**:
```typescript
await registrarAuditoria(params); // Si falla, lanza excepción
```

✅ **BIEN**:
```typescript
try {
  await registrarAuditoria(params);
} catch (error) {
  console.error('Error registrando auditoría:', error);
  // No lanzar excepción - el flujo principal continúa
}
```

### 2. **Incluir Datos Relevantes**

❌ **MAL**:
```typescript
await registrarAuditoria({
  idUsuario,
  tablaOrigen: TablaOrigen.COMPRA,
  idRegistro: idCompra,
  accion: 'DELETE',
});
```

✅ **BIEN**:
```typescript
await registrarAuditoria({
  idUsuario,
  idGranja: compra.idGranja,
  tablaOrigen: TablaOrigen.COMPRA,
  idRegistro: idCompra,
  accion: 'DELETE',
  descripcion: `Compra eliminada: Factura ${compra.numeroFactura || 'N/A'}`,
  datosAnteriores: compra, // Estado completo antes de eliminar
});
```

### 3. **Usar Descripciones Claras**

❌ **MAL**:
```typescript
descripcion: 'Compra eliminada'
```

✅ **BIEN**:
```typescript
descripcion: `Compra eliminada: Factura ${compra.numeroFactura || 'N/A'} - Proveedor: ${compra.proveedor.nombreProveedor}`
```

### 4. **Registrar Operaciones Masivas Correctamente**

✅ **BIEN**:
```typescript
await registrarAuditoria({
  idUsuario,
  idGranja,
  tablaOrigen: TablaOrigen.COMPRA,
  idRegistro: 'BULK', // Identificador especial
  accion: 'BULK_DELETE',
  descripcion: `Eliminación masiva de ${resultado.count} compras`,
});
```

### 5. **Serializar Objetos Complejos**

❌ **MAL**:
```typescript
datosAnteriores: compra, // Puede contener referencias circulares
```

✅ **BIEN**:
```typescript
datosAnteriores: JSON.parse(JSON.stringify(compra)), // Serializa correctamente
```

---

## 🚀 Extensibilidad

### Agregar Nuevas Tablas Auditadas

**Paso 1**: Agregar al enum `TablaOrigen` en `schema.prisma`:
```prisma
enum TablaOrigen {
  INVENTARIO
  FABRICACION
  COMPRA
  FORMULA      // Nuevo
  PROVEEDOR    // Nuevo
}
```

**Paso 2**: Registrar auditoría en el servicio correspondiente:
```typescript
import { registrarAuditoria } from './auditoriaService';
import { TablaOrigen } from '@prisma/client';

export async function eliminarFormula(idFormula: string, idUsuario: string) {
  // ... lógica de eliminación ...
  
  await registrarAuditoria({
    idUsuario,
    idGranja: formula.idGranja,
    tablaOrigen: TablaOrigen.FORMULA,
    idRegistro: idFormula,
    accion: 'DELETE',
    descripcion: `Fórmula eliminada: ${formula.codigoFormula}`,
    datosAnteriores: formula,
  });
}
```

### Agregar Nuevas Acciones

**Paso 1**: Actualizar el tipo en `auditoriaService.ts`:
```typescript
accion: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'BULK_DELETE' | 'ARCHIVE';
```

**Paso 2**: Usar la nueva acción:
```typescript
await registrarAuditoria({
  // ...
  accion: 'ARCHIVE',
  descripcion: `Compra archivada: Factura ${compra.numeroFactura}`,
});
```

### Implementar Auditoría de CREATE y UPDATE

Actualmente solo se auditan DELETE, RESTORE y BULK_DELETE. Para agregar CREATE y UPDATE:

```typescript
export async function crearCompra(params: CrearCompraParams) {
  const compra = await prisma.compraCabecera.create({
    // ... datos de la compra ...
  });

  // Registrar creación
  await registrarAuditoria({
    idUsuario: params.idUsuario,
    idGranja: params.idGranja,
    tablaOrigen: TablaOrigen.COMPRA,
    idRegistro: compra.id,
    accion: 'CREATE',
    descripcion: `Compra creada: Factura ${compra.numeroFactura || 'N/A'}`,
    datosNuevos: compra,
  });

  return compra;
}
```

---

## 📊 Métricas y Análisis

### Ejemplo: Dashboard de Auditoría

```sql
-- Resumen de operaciones por día
SELECT 
  DATE(fecha_operacion) as fecha,
  accion,
  COUNT(*) as cantidad
FROM t_auditoria
WHERE fecha_operacion >= NOW() - INTERVAL '30 days'
GROUP BY DATE(fecha_operacion), accion
ORDER BY fecha DESC, accion;

-- Top 10 operaciones más recientes
SELECT 
  a.fecha_operacion,
  a.accion,
  a.tabla_origen,
  a.descripcion,
  u.email
FROM t_auditoria a
JOIN t_usuarios u ON a.id_usuario = u.id
ORDER BY a.fecha_operacion DESC
LIMIT 10;
```

---

## 🔒 Seguridad

### Consideraciones de Seguridad

1. **Datos Sensibles**: Los campos `datosAnteriores` y `datosNuevos` pueden contener información sensible. Considerar:
   - Encriptación de datos sensibles
   - Políticas de retención de datos
   - Acceso restringido a registros de auditoría

2. **Acceso a Auditoría**: Solo usuarios con permisos administrativos deberían poder consultar registros de auditoría.

3. **Límites de Consulta**: Implementar límites en las consultas para evitar sobrecarga:
   ```typescript
   limit: number = 100 // Por defecto, máximo 100 registros
   ```

4. **Retención de Datos**: Considerar políticas de archivado o eliminación de registros antiguos:
   ```sql
   -- Eliminar registros de auditoría mayores a 2 años
   DELETE FROM t_auditoria
   WHERE fecha_operacion < NOW() - INTERVAL '2 years';
   ```

---

## 📚 Referencias

- **Archivo Principal**: `backend/src/services/auditoriaService.ts`
- **Schema**: `backend/prisma/schema.prisma` (modelo `Auditoria`)
- **Uso en Compras**: `backend/src/services/compraService.ts`
- **Uso en Fabricaciones**: `backend/src/services/fabricacionService.ts`

---

## ✅ Checklist de Implementación

- [x] Modelo de base de datos creado
- [x] Servicio de auditoría implementado
- [x] Integración con módulo de compras
- [x] Integración con módulo de fabricaciones
- [x] Manejo de errores no intrusivo
- [x] Índices de base de datos optimizados
- [ ] Endpoints de consulta de auditoría (pendiente)
- [ ] Frontend para visualizar auditoría (pendiente)
- [ ] Políticas de retención de datos (pendiente)
- [ ] Exportación de registros de auditoría (pendiente)

---

**Última actualización**: Noviembre 2024  
**Versión**: 1.0.0

