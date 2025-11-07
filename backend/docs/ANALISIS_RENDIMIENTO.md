# 📊 Análisis de Rendimiento - Sistema Reforma

## 📋 Resumen Ejecutivo

Este documento analiza el rendimiento de la aplicación SaaS Reforma y proporciona recomendaciones para optimizar los tiempos de respuesta. El análisis se centra en identificar cuellos de botella en consultas de base de datos y proponer soluciones.

## 🔍 Problemas Identificados

### 1. Consultas N+1 (CRÍTICO)

**Problema**: En múltiples servicios se ejecutan consultas individuales dentro de loops, generando cientos de queries innecesarias.

**Ejemplos encontrados:**

#### En `compraService.ts` - `crearCompra()`:
```typescript
// ❌ ANTES: Consultas N+1
for (const detalle of compra.comprasDetalle) {
  const materiaPrimaActual = await prisma.materiaPrima.findUnique({
    where: { id: detalle.idMateriaPrima }
  });
  // ... más queries individuales
}
```

**Impacto**: Si una compra tiene 10 items, se ejecutan:
- 10 queries para obtener materias primas
- 10 queries para actualizar detalles
- 10 queries para actualizar materias primas
- 10 queries para recalcular inventario
- 10 queries para recalcular fórmulas
- **Total: ~50+ queries secuenciales**

**Solución implementada**: ✅ Consultas batch con `findMany` y `createMany`

#### En `formulaService.ts` - `crearFormula()`:
```typescript
// ❌ ANTES: Consultas N+1
const detallesConPrecios = await Promise.all(
  detalles.map(async (detalle) => {
    const materiaPrima = await prisma.materiaPrima.findUnique({
      where: { id: detalle.idMateriaPrima }
    });
    // ...
  })
);
```

**Solución implementada**: ✅ Consulta única con `findMany` y mapa en memoria

### 2. Validaciones Repetidas de Granja (ALTO)

**Problema**: Cada endpoint verifica que la granja pertenece al usuario con una consulta separada.

**Ejemplo**: En `compraController.ts`:
- `obtenerCompras()` - 1 query
- `obtenerEstadisticas()` - 1 query
- `obtenerGastosPorProveedor()` - 1 query
- `obtenerCompraPorId()` - 1 query
- ... y así en cada endpoint

**Impacto**: Si una página carga 5 endpoints diferentes, se ejecutan 5 queries idénticas.

**Solución implementada**: ✅ Caché de validaciones de granja con TTL de 5 minutos

### 3. Recálculos Secuenciales (MEDIO)

**Problema**: Después de cada operación, se recalculan inventarios y fórmulas de forma secuencial.

**Ejemplo en `compraService.ts`**:
```typescript
// ❌ ANTES: Recálculos secuenciales
for (const detalle of compra.comprasDetalle) {
  await recalcularInventario({ idGranja, idMateriaPrima: detalle.idMateriaPrima });
  await sincronizarCantidadRealConSistema(idGranja, detalle.idMateriaPrima);
  await recalcularFormulasPorMateriaPrima(detalle.idMateriaPrima);
}
```

**Impacto**: Si hay 10 items, se ejecutan 30 operaciones secuenciales.

**Solución implementada**: ✅ Recálculos en paralelo con `Promise.all()`

### 4. Falta de Índices Compuestos (MEDIO)

**Problema**: Algunas consultas frecuentes no tienen índices optimizados.

**Consultas problemáticas**:
- Filtrado de compras por fecha + granja
- Búsqueda de materias primas por granja + código
- Consultas de inventario con múltiples filtros

**Recomendación**: Agregar índices compuestos en el schema de Prisma.

### 5. Consultas con Includes Profundos (BAJO)

**Problema**: Algunas consultas traen demasiados datos relacionados innecesarios.

**Ejemplo en `obtenerComprasGranja()`**:
```typescript
include: {
  proveedor: { select: { ... } },
  comprasDetalle: {
    include: {
      materiaPrima: { select: { ... } }
    }
  }
}
```

**Impacto**: Transferencia de datos innecesarios y procesamiento adicional.

## ✅ Optimizaciones Implementadas

### 1. Middleware de Logging de Rendimiento

**Archivo**: `backend/src/middleware/performanceLogger.ts`

**Características**:
- Mide tiempo total de cada request
- Cuenta queries ejecutadas
- Mide tiempo total en queries
- Identifica requests lentos (>5s)
- Identifica endpoints con muchas queries (>20)

**Uso**: Se activa automáticamente en modo desarrollo.

### 2. Caché de Validaciones de Granja

**Archivo**: `backend/src/middleware/granjaCache.ts`

**Características**:
- Caché en memoria con TTL de 5 minutos
- Limpieza automática de entradas expiradas
- Función de invalidación manual

**Impacto esperado**: Reducción del 80-90% en queries de validación de granja.

### 3. Optimización de Consultas N+1

**Archivos modificados**:
- `backend/src/services/compraService.ts` - `crearCompra()`
- `backend/src/services/formulaService.ts` - `crearFormula()`

**Cambios**:
- Reemplazo de loops con `findUnique` por `findMany` con `where: { id: { in: [...] } }`
- Uso de `Map` para acceso O(1) a datos
- Batch updates con transacciones

**Impacto esperado**: Reducción del 70-90% en número de queries para operaciones con múltiples items.

### 4. Recálculos en Paralelo

**Archivo**: `backend/src/services/compraService.ts`

**Cambios**:
- Reemplazo de loops secuenciales por `Promise.all()`
- Procesamiento paralelo de inventarios y fórmulas

**Impacto esperado**: Reducción del 60-80% en tiempo de recálculos.

## 📈 Métricas Esperadas

### Antes de Optimizaciones

| Operación | Tiempo Estimado | Queries |
|-----------|----------------|---------|
| Inicio de sesión | 200-500ms | 2-3 |
| Cargar materias primas | 500-1000ms | 3-5 |
| Crear compra (10 items) | 8000-18000ms | 50-60 |
| Editar item compra | 2000-4000ms | 15-20 |
| Eliminar item compra | 2000-4000ms | 15-20 |
| Crear fórmula (10 componentes) | 3000-6000ms | 20-25 |
| Añadir componente a fórmula | 1000-2000ms | 8-12 |

### Después de Optimizaciones

| Operación | Tiempo Esperado | Queries | Mejora |
|-----------|----------------|---------|--------|
| Inicio de sesión | 200-400ms | 2-3 | 10-20% |
| Cargar materias primas | 300-600ms | 2-3 | 40-50% |
| Crear compra (10 items) | 2000-4000ms | 10-15 | 60-75% |
| Editar item compra | 800-1500ms | 8-12 | 60-70% |
| Eliminar item compra | 800-1500ms | 8-12 | 60-70% |
| Crear fórmula (10 componentes) | 800-1500ms | 5-8 | 70-80% |
| Añadir componente a fórmula | 500-1000ms | 4-6 | 50-60% |

## 🔧 Recomendaciones Adicionales

### 1. Índices Compuestos

Agregar al `schema.prisma`:

```prisma
model CompraCabecera {
  // ... campos existentes
  
  @@index([idGranja, activo, fechaCompra])
  @@index([idGranja, idProveedor, activo])
}

model Inventario {
  // ... campos existentes
  
  @@index([idGranja, idMateriaPrima, fechaUltimaActualizacion])
}

model MateriaPrima {
  // ... campos existentes
  
  @@index([idGranja, activa, nombreMateriaPrima])
}
```

**Impacto esperado**: Mejora del 20-30% en consultas con filtros múltiples.

### 2. Connection Pooling

Configurar pool de conexiones en Prisma:

```typescript
// backend/src/lib/prisma.ts
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  // Configuración de pool
});

// En Supabase, configurar connection pooler
// Usar: postgresql://...?pgbouncer=true&connection_limit=10
```

**Impacto esperado**: Mejora del 10-20% en tiempos de conexión.

### 3. Paginación

Implementar paginación en endpoints que devuelven listas grandes:

```typescript
// Ejemplo: obtenerComprasGranja
export async function obtenerComprasGranja(
  idGranja: string,
  filters?: {...},
  page: number = 1,
  pageSize: number = 50
) {
  const skip = (page - 1) * pageSize;
  
  const [compras, total] = await Promise.all([
    prisma.compraCabecera.findMany({
      where: {...},
      skip,
      take: pageSize,
      // ...
    }),
    prisma.compraCabecera.count({ where: {...} })
  ]);
  
  return {
    compras,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };
}
```

**Impacto esperado**: Reducción del 50-70% en tiempo de carga de listas grandes.

### 4. Caché de Resultados

Implementar caché Redis para datos frecuentemente consultados:

- Estadísticas de compras
- Inventario completo
- Lista de materias primas
- Fórmulas activas

**Impacto esperado**: Mejora del 80-90% en consultas de solo lectura.

### 5. Optimización de Queries SQL

Revisar queries raw SQL y optimizarlas:

```typescript
// Ejemplo: calcularCantidadAcumulada
// Usar índices compuestos y evitar subconsultas innecesarias
```

**Impacto esperado**: Mejora del 10-30% en queries complejas.

## 🧪 Plan de Pruebas

### 1. Pruebas de Rendimiento

1. **Inicio de sesión**:
   - Medir tiempo total
   - Verificar número de queries
   - Verificar uso de caché

2. **Navegación entre interfaces**:
   - Medir tiempo de carga de cada página
   - Verificar reutilización de caché
   - Identificar queries redundantes

3. **Crear compra**:
   - Probar con 1, 5, 10, 20 items
   - Medir tiempo total
   - Verificar número de queries
   - Comparar con métricas anteriores

4. **Editar/Eliminar items**:
   - Medir tiempo de cada operación
   - Verificar recálculos paralelos

5. **Fórmulas**:
   - Crear fórmula con múltiples componentes
   - Añadir componentes individualmente
   - Medir tiempos de recálculo

### 2. Análisis de Logs

Revisar logs del middleware de rendimiento para identificar:
- Endpoints más lentos
- Queries más costosas
- Patrones de uso

## 📊 Factores de Rendimiento

### Recursos del Sistema

1. **RAM del servidor (0.5 GB)**:
   - **Impacto**: ⚠️ MEDIO
   - Si hay muchas queries concurrentes, puede causar swapping
   - **Recomendación**: Monitorear uso de memoria y considerar upgrade

2. **RAM de la computadora (8 GB)**:
   - **Impacto**: ⚠️ BAJO
   - El desarrollo local debería funcionar bien con 8GB
   - **Recomendación**: Cerrar aplicaciones innecesarias durante pruebas

3. **Base de datos Supabase (0.5 GB RAM)**:
   - **Impacto**: ⚠️ ALTO
   - Query pool limitado puede causar cuellos de botella
   - **Recomendación**: Monitorear conexiones activas y considerar upgrade

### Latencia de Red

- **Impacto**: ⚠️ MEDIO
- Cada query requiere ida y vuelta a Supabase
- **Recomendación**: Minimizar número de queries (ya implementado)

## 🎯 Conclusiones

### Problemas Principales Identificados

1. ✅ **Consultas N+1**: **CRÍTICO** - Optimizado
2. ✅ **Validaciones repetidas**: **ALTO** - Optimizado con caché
3. ✅ **Recálculos secuenciales**: **MEDIO** - Optimizado con paralelismo
4. ⚠️ **Falta de índices**: **MEDIO** - Requiere migración
5. ⚠️ **Sin paginación**: **MEDIO** - Requiere implementación

### Mejoras Esperadas

- **Reducción general de tiempo**: 60-75%
- **Reducción de queries**: 70-80%
- **Mejora en experiencia de usuario**: Significativa

### Próximos Pasos

1. ✅ Implementar middleware de logging
2. ✅ Implementar caché de validaciones
3. ✅ Optimizar consultas N+1 en servicios críticos
4. ⏳ Agregar índices compuestos (requiere migración)
5. ⏳ Implementar paginación
6. ⏳ Configurar connection pooling
7. ⏳ Considerar caché Redis para producción

## 📝 Notas

- Las optimizaciones están activas en modo desarrollo
- El middleware de logging se activa automáticamente
- Los logs mostrarán métricas detalladas en la consola
- Revisar logs después de cada operación para identificar mejoras adicionales

---

**Fecha de análisis**: {{ fecha_actual }}
**Versión del sistema**: 1.0.0
**Autor**: Sistema de Análisis Automático



