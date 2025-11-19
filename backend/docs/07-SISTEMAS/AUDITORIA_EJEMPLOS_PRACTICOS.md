# 📋 Ejemplos Prácticos del Sistema de Auditoría

Este documento complementa la [documentación principal del Sistema de Auditoría](./SISTEMA_AUDITORIA.md) con ejemplos prácticos y casos de uso reales.

---

## 📖 Tabla de Contenidos

1. [Ejemplos de Código](#ejemplos-de-código)
2. [Casos de Uso Reales](#casos-de-uso-reales)
3. [Consultas SQL Avanzadas](#consultas-sql-avanzadas)
4. [Diagramas de Flujo](#diagramas-de-flujo)
5. [Troubleshooting](#troubleshooting)

---

## 💻 Ejemplos de Código

### Ejemplo 1: Registrar Eliminación de Compra

```typescript
// backend/src/services/compraService.ts

import { registrarAuditoria } from './auditoriaService';
import { TablaOrigen } from '@prisma/client';

export async function eliminarCompra(idCompra: string, idUsuario: string) {
  // 1. Obtener la compra antes de eliminar
  const compra = await prisma.compraCabecera.findUnique({
    where: { id: idCompra },
    include: {
      comprasDetalle: {
        include: {
          materiaPrima: true
        }
      },
      proveedor: true
    }
  });

  if (!compra) {
    throw new Error('Compra no encontrada');
  }

  // 2. Validar que no tenga items
  if (compra.comprasDetalle.length > 0) {
    throw new Error('No se puede eliminar una compra que tiene items. Elimine primero los items.');
  }

  // 3. Validar que no haya fabricaciones activas
  const fabricacionesCount = await prisma.fabricacion.count({
    where: { 
      idGranja: compra.idGranja,
      activo: true
    }
  });

  if (fabricacionesCount > 0) {
    throw new Error('No se puede eliminar esta compra porque existen fabricaciones registradas.');
  }

  // 4. Realizar soft delete
  await prisma.compraCabecera.update({
    where: { id: idCompra },
    data: {
      activo: false,
      fechaEliminacion: new Date(),
      eliminadoPor: idUsuario,
    },
  });

  // 5. Registrar en auditoría
  await registrarAuditoria({
    idUsuario,
    idGranja: compra.idGranja,
    tablaOrigen: TablaOrigen.COMPRA,
    idRegistro: idCompra,
    accion: 'DELETE',
    descripcion: `Compra eliminada: Factura ${compra.numeroFactura || 'N/A'} - Proveedor: ${compra.proveedor.nombreProveedor} - Total: $${compra.totalFactura}`,
    datosAnteriores: {
      id: compra.id,
      numeroFactura: compra.numeroFactura,
      fechaCompra: compra.fechaCompra,
      totalFactura: compra.totalFactura,
      proveedor: compra.proveedor.nombreProveedor,
      items: compra.comprasDetalle.map(detalle => ({
        materiaPrima: detalle.materiaPrima.nombreMateriaPrima,
        cantidad: detalle.cantidadComprada,
        precioUnitario: detalle.precioUnitario,
        subtotal: detalle.subtotal
      }))
    },
  });

  return { mensaje: 'Compra eliminada exitosamente' };
}
```

### Ejemplo 2: Registrar Restauración de Fabricación

```typescript
// backend/src/services/fabricacionService.ts

export async function restaurarFabricacion(idFabricacion: string, idUsuario: string) {
  // 1. Obtener la fabricación eliminada
  const fabricacion = await prisma.fabricacion.findUnique({
    where: { id: idFabricacion },
    include: {
      detallesFabricacion: {
        include: {
          materiaPrima: true
        }
      },
      formula: true
    }
  });

  if (!fabricacion) {
    throw new Error('Fabricación no encontrada');
  }

  if (fabricacion.activo) {
    throw new Error('La fabricación ya está activa');
  }

  // 2. Restaurar la fabricación
  await prisma.fabricacion.update({
    where: { id: idFabricacion },
    data: {
      activo: true,
      fechaEliminacion: null,
      eliminadoPor: null,
    },
  });

  // 3. Recalcular inventario
  const materiasPrimasAfectadas = new Set<string>();
  for (const detalle of fabricacion.detallesFabricacion) {
    materiasPrimasAfectadas.add(detalle.idMateriaPrima);
  }

  for (const idMateriaPrima of materiasPrimasAfectadas) {
    await recalcularInventario({ 
      idGranja: fabricacion.idGranja, 
      idMateriaPrima 
    });
  }

  // 4. Registrar en auditoría
  await registrarAuditoria({
    idUsuario,
    idGranja: fabricacion.idGranja,
    tablaOrigen: TablaOrigen.FABRICACION,
    idRegistro: idFabricacion,
    accion: 'RESTORE',
    descripcion: `Fabricación restaurada: ${fabricacion.descripcionFabricacion} - Fórmula: ${fabricacion.formula.descripcionFormula} - Cantidad: ${fabricacion.cantidadFabricacion / 1000} toneladas`,
    datosNuevos: {
      activo: true,
      fechaEliminacion: null,
      eliminadoPor: null,
    },
  });

  return { mensaje: 'Fabricación restaurada exitosamente' };
}
```

### Ejemplo 3: Registro de Eliminación Masiva

```typescript
export async function eliminarTodasLasCompras(idGranja: string, idUsuario: string) {
  // 1. Validar que el usuario es administrador
  const usuario = await prisma.usuario.findUnique({
    where: { id: idUsuario },
    select: { tipoUsuario: true }
  });

  if (!usuario || usuario.tipoUsuario !== 'ADMINISTRADOR') {
    throw new Error('Se requieren permisos de administrador');
  }

  // 2. Obtener todas las compras activas
  const compras = await prisma.compraCabecera.findMany({
    where: { 
      idGranja,
      activo: true
    },
    include: {
      comprasDetalle: true
    }
  });

  // 3. Validar que no haya fabricaciones activas
  const fabricacionesCount = await prisma.fabricacion.count({
    where: { 
      idGranja,
      activo: true
    }
  });

  if (fabricacionesCount > 0) {
    throw new Error('No se pueden eliminar compras si existen fabricaciones registradas.');
  }

  // 4. Realizar soft delete masivo
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

  // 5. Registrar en auditoría (UN SOLO REGISTRO para todas)
  await registrarAuditoria({
    idUsuario,
    idGranja,
    tablaOrigen: TablaOrigen.COMPRA,
    idRegistro: 'BULK', // Identificador especial para operaciones masivas
    accion: 'BULK_DELETE',
    descripcion: `Eliminación masiva de ${resultado.count} compras - Granja: ${idGranja}`,
    datosAnteriores: {
      totalCompras: resultado.count,
      compras: compras.map(c => ({
        id: c.id,
        numeroFactura: c.numeroFactura,
        fechaCompra: c.fechaCompra,
        totalFactura: c.totalFactura,
        items: c.comprasDetalle.length
      }))
    },
  });

  // 6. Recalcular inventario para todas las materias primas afectadas
  const materiasPrimasAfectadas = new Set<string>();
  for (const compra of compras) {
    for (const detalle of compra.comprasDetalle) {
      materiasPrimasAfectadas.add(detalle.idMateriaPrima);
    }
  }

  for (const idMateriaPrima of materiasPrimasAfectadas) {
    await recalcularInventario({ idGranja, idMateriaPrima });
  }

  return { 
    mensaje: 'Todas las compras eliminadas exitosamente',
    eliminadas: resultado.count
  };
}
```

---

## 🎬 Casos de Uso Reales

### Caso 1: Investigar una Eliminación Sospechosa

**Escenario**: Un administrador nota que una compra importante fue eliminada y necesita investigar.

**Paso 1: Consultar el registro de auditoría**

```sql
SELECT 
  a.id,
  a.fecha_operacion,
  a.accion,
  a.descripcion,
  u.email,
  u.nombre_usuario,
  u.apellido_usuario,
  a.datos_anteriores
FROM t_auditoria a
JOIN t_usuarios u ON a.id_usuario = u.id
WHERE a.id_registro = 'compra_id_eliminada'
  AND a.accion = 'DELETE'
ORDER BY a.fecha_operacion DESC
LIMIT 1;
```

**Resultado esperado**:
```
id              | fecha_operacion      | accion | descripcion                    | email              | datos_anteriores
----------------|----------------------|--------|-------------------------------|-------------------|------------------
audit_123       | 2024-11-15 14:30:00  | DELETE | Compra eliminada: Factura A-001| usuario@email.com | {...}
```

**Paso 2: Ver detalles de la compra eliminada**

```sql
SELECT 
  a.datos_anteriores->>'numeroFactura' as numero_factura,
  a.datos_anteriores->>'totalFactura' as total_factura,
  a.datos_anteriores->>'proveedor' as proveedor,
  a.datos_anteriores->'items' as items
FROM t_auditoria a
WHERE a.id = 'audit_123';
```

**Paso 3: Si es necesario, restaurar la compra**

```typescript
// Llamar al endpoint de restauración
POST /api/compras/granja/:idGranja/compras/:idCompra/restaurar
```

---

### Caso 2: Auditoría de Actividad Diaria

**Escenario**: Un administrador quiere ver todas las operaciones del día.

**Consulta SQL**:

```sql
SELECT 
  DATE(a.fecha_operacion) as fecha,
  a.accion,
  a.tabla_origen,
  COUNT(*) as cantidad,
  STRING_AGG(DISTINCT u.email, ', ') as usuarios
FROM t_auditoria a
JOIN t_usuarios u ON a.id_usuario = u.id
WHERE DATE(a.fecha_operacion) = CURRENT_DATE
GROUP BY DATE(a.fecha_operacion), a.accion, a.tabla_origen
ORDER BY a.accion, a.tabla_origen;
```

**Resultado esperado**:
```
fecha       | accion      | tabla_origen | cantidad | usuarios
------------|-------------|--------------|----------|------------------
2024-11-15  | DELETE      | COMPRA       | 5        | user1@email.com, user2@email.com
2024-11-15  | RESTORE     | FABRICACION  | 2        | admin@email.com
2024-11-15  | BULK_DELETE | COMPRA       | 1        | admin@email.com
```

---

### Caso 3: Detectar Actividades Sospechosas

**Escenario**: Detectar múltiples eliminaciones en un corto período.

**Consulta SQL**:

```sql
SELECT 
  u.email,
  COUNT(*) as eliminaciones,
  MIN(a.fecha_operacion) as primera_eliminacion,
  MAX(a.fecha_operacion) as ultima_eliminacion,
  EXTRACT(EPOCH FROM (MAX(a.fecha_operacion) - MIN(a.fecha_operacion))) / 60 as minutos_transcurridos
FROM t_auditoria a
JOIN t_usuarios u ON a.id_usuario = u.id
WHERE a.accion IN ('DELETE', 'BULK_DELETE')
  AND a.fecha_operacion >= NOW() - INTERVAL '1 hour'
GROUP BY u.email
HAVING COUNT(*) > 5
ORDER BY eliminaciones DESC;
```

**Resultado esperado**:
```
email              | eliminaciones | primera_eliminacion   | ultima_eliminacion    | minutos_transcurridos
-------------------|---------------|----------------------|----------------------|----------------------
sospechoso@email   | 12            | 2024-11-15 14:00:00  | 2024-11-15 14:30:00  | 30
```

---

### Caso 4: Historial Completo de un Registro

**Escenario**: Ver todas las operaciones realizadas sobre una compra específica.

**Consulta SQL**:

```sql
SELECT 
  a.fecha_operacion,
  a.accion,
  a.descripcion,
  u.email as usuario,
  CASE 
    WHEN a.accion = 'DELETE' THEN 'Eliminado'
    WHEN a.accion = 'RESTORE' THEN 'Restaurado'
    WHEN a.accion = 'UPDATE' THEN 'Modificado'
    WHEN a.accion = 'CREATE' THEN 'Creado'
    ELSE a.accion
  END as estado
FROM t_auditoria a
JOIN t_usuarios u ON a.id_usuario = u.id
WHERE a.id_registro = 'compra_id'
ORDER BY a.fecha_operacion DESC;
```

**Resultado esperado**:
```
fecha_operacion      | accion  | descripcion                    | usuario          | estado
---------------------|---------|--------------------------------|------------------|----------
2024-11-15 15:00:00  | RESTORE | Compra restaurada: Factura A-001 | admin@email.com  | Restaurado
2024-11-15 14:30:00  | DELETE  | Compra eliminada: Factura A-001  | user@email.com   | Eliminado
2024-11-10 10:00:00  | CREATE  | Compra creada: Factura A-001     | user@email.com   | Creado
```

---

## 📊 Consultas SQL Avanzadas

### 1. Estadísticas de Auditoría por Mes

```sql
SELECT 
  DATE_TRUNC('month', a.fecha_operacion) as mes,
  a.accion,
  a.tabla_origen,
  COUNT(*) as total_operaciones,
  COUNT(DISTINCT a.id_usuario) as usuarios_unicos
FROM t_auditoria a
WHERE a.fecha_operacion >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', a.fecha_operacion), a.accion, a.tabla_origen
ORDER BY mes DESC, a.accion, a.tabla_origen;
```

### 2. Top 10 Usuarios Más Activos

```sql
SELECT 
  u.email,
  u.nombre_usuario || ' ' || u.apellido_usuario as nombre_completo,
  COUNT(*) as total_operaciones,
  COUNT(CASE WHEN a.accion = 'DELETE' THEN 1 END) as eliminaciones,
  COUNT(CASE WHEN a.accion = 'RESTORE' THEN 1 END) as restauraciones,
  MAX(a.fecha_operacion) as ultima_operacion
FROM t_auditoria a
JOIN t_usuarios u ON a.id_usuario = u.id
WHERE a.fecha_operacion >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.email, u.nombre_usuario, u.apellido_usuario
ORDER BY total_operaciones DESC
LIMIT 10;
```

### 3. Operaciones Masivas en el Último Año

```sql
SELECT 
  a.fecha_operacion,
  a.tabla_origen,
  a.descripcion,
  u.email,
  a.datos_anteriores->>'totalCompras' as cantidad_eliminada
FROM t_auditoria a
JOIN t_usuarios u ON a.id_usuario = u.id
WHERE a.accion = 'BULK_DELETE'
  AND a.fecha_operacion >= NOW() - INTERVAL '12 months'
ORDER BY a.fecha_operacion DESC;
```

### 4. Tasa de Restauración por Tipo

```sql
SELECT 
  a.tabla_origen,
  COUNT(CASE WHEN a.accion = 'DELETE' THEN 1 END) as eliminaciones,
  COUNT(CASE WHEN a.accion = 'RESTORE' THEN 1 END) as restauraciones,
  ROUND(
    COUNT(CASE WHEN a.accion = 'RESTORE' THEN 1 END)::numeric / 
    NULLIF(COUNT(CASE WHEN a.accion = 'DELETE' THEN 1 END), 0) * 100, 
    2
  ) as tasa_restauracion_porcentaje
FROM t_auditoria a
WHERE a.fecha_operacion >= NOW() - INTERVAL '30 days'
GROUP BY a.tabla_origen;
```

---

## 🔄 Diagramas de Flujo

### Flujo de Eliminación con Auditoría

```
┌─────────────────────────────────────────────────────────────┐
│ Usuario hace clic en "Eliminar Compra"                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend: DELETE /api/compras/:id                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Controller: eliminarCompraEndpoint()                         │
│   - Valida autenticación                                     │
│   - Valida permisos                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Service: eliminarCompra()                                    │
│   ┌─────────────────────────────────────────┐               │
│   │ 1. Validar que no tenga items           │               │
│   │ 2. Validar que no haya fabricaciones    │               │
│   │ 3. Obtener datos completos de la compra │               │
│   └─────────────────────────────────────────┘               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Realizar Soft Delete                                         │
│   UPDATE compra SET activo = false                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ registrarAuditoria()                                         │
│   ┌─────────────────────────────────────────┐               │
│   │ try {                                   │               │
│   │   await prisma.auditoria.create({...}) │               │
│   │ } catch (error) {                       │               │
│   │   console.error(...) // NO lanza error │               │
│   │ }                                       │               │
│   └─────────────────────────────────────────┘               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Recalcular Inventario                                        │
│   - Restar cantidades de materias primas                     │
│   - Actualizar precios                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Respuesta: "Compra eliminada exitosamente"                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Troubleshooting

### Problema 1: No se registran eventos de auditoría

**Síntomas**: Los registros de auditoría no aparecen en la base de datos.

**Posibles causas**:
1. Error silencioso en `registrarAuditoria()`
2. Datos inválidos en los parámetros
3. Problemas de conexión a la base de datos

**Solución**:
```typescript
// Verificar logs del servidor
console.error('Error registrando auditoría:', error);

// Verificar que los parámetros sean válidos
console.log('Parámetros de auditoría:', {
  idUsuario,
  idGranja,
  tablaOrigen,
  idRegistro,
  accion
});
```

### Problema 2: Errores de serialización JSON

**Síntomas**: Error al guardar `datosAnteriores` o `datosNuevos`.

**Causa**: Referencias circulares en objetos complejos.

**Solución**:
```typescript
// Usar serialización segura
datosAnteriores: JSON.parse(JSON.stringify(compra)),

// O mejor aún, seleccionar solo los campos necesarios
datosAnteriores: {
  id: compra.id,
  numeroFactura: compra.numeroFactura,
  totalFactura: compra.totalFactura,
  // ... solo campos relevantes
}
```

### Problema 3: Consultas lentas

**Síntomas**: Las consultas de auditoría toman mucho tiempo.

**Solución**:
```sql
-- Verificar que los índices existan
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 't_auditoria';

-- Agregar límites a las consultas
SELECT * FROM t_auditoria
WHERE id_granja = $1
ORDER BY fecha_operacion DESC
LIMIT 100; -- Siempre limitar resultados
```

### Problema 4: Registros duplicados

**Síntomas**: Aparecen múltiples registros para la misma operación.

**Causa**: `registrarAuditoria()` se llama múltiples veces.

**Solución**:
```typescript
// Asegurar que solo se llame una vez
let auditoriaRegistrada = false;

if (!auditoriaRegistrada) {
  await registrarAuditoria({...});
  auditoriaRegistrada = true;
}
```

---

## 📚 Referencias Adicionales

- [Documentación Principal del Sistema de Auditoría](./SISTEMA_AUDITORIA.md)
- [Documentación del Sistema de Inventario](./SISTEMA_INVENTARIO.md)
- [Prisma Documentation](https://www.prisma.io/docs)

---

**Última actualización**: Noviembre 2024  
**Versión**: 1.0.0

