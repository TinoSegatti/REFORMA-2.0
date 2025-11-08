# 🚀 Sistema de Prefetching Inteligente

## 📋 Resumen

Sistema de prefetching inteligente que pre-renderiza las páginas más usadas después del login sin sobrecargar el navegador o el servidor.

## ✅ Características Implementadas

### 1. Prefetching después del Login

**Ubicación**: `frontend/src/app/(auth)/login/page.tsx`

**Funcionalidad**:
- Después de un login exitoso, se obtienen las granjas del usuario
- Se prefetchea la página `/mis-plantas` inmediatamente
- Se prefetchean las rutas principales de la primera granja automáticamente

**Características**:
- No bloquea la navegación
- Se ejecuta de forma asíncrona
- Usa `requestIdleCallback` para no interferir con el hilo principal

### 2. Prefetching en Mis Plantas

**Ubicación**: `frontend/src/app/mis-plantas/page.tsx`

**Funcionalidad**:
- Cuando se cargan las granjas, se prefetchean automáticamente las rutas de la primera granja
- Se ejecuta solo cuando el navegador está inactivo

### 3. Prefetching en Sidebar

**Ubicación**: `frontend/src/components/layout/Sidebar.tsx`

**Funcionalidad**:
- Cuando el usuario pasa el mouse sobre un link del sidebar, se prefetchea la ruta
- Mejora la velocidad de navegación al hacer clic

### 4. Sistema de Prefetching

**Ubicación**: `frontend/src/lib/prefetch.ts`

**Características**:
- Cache de rutas prefetcheadas para evitar duplicados
- Usa `requestIdleCallback` para no bloquear el hilo principal
- Fallback para navegadores sin `requestIdleCallback`
- Delays escalonados para no sobrecargar

## 🔧 Cómo Funciona

### Prefetching después del Login

```typescript
// Después del login exitoso
const response = await apiClient.login(email, password);
authService.setAuth(response.token, response.usuario);

// Obtener granjas y prefetchear (no bloquea)
apiClient.getGranjas(response.token).then((granjas) => {
  prefetchAfterLogin(granjas);
});

router.push('/mis-plantas'); // Navegación inmediata
```

### Prefetching en Mis Plantas

```typescript
// Cuando se cargan las granjas
if (granjasAdaptadas.length > 0) {
  requestIdleCallback(() => {
    prefetchGranjaRoutes(granjasAdaptadas[0].id);
  }, { timeout: 2000 });
}
```

### Prefetching en Sidebar

```typescript
<Link
  href={item.href}
  onMouseEnter={() => {
    requestIdleCallback(() => {
      prefetchRoute(item.href);
    }, { timeout: 500 });
  }}
>
  {/* ... */}
</Link>
```

## 📊 Rutas Prefetcheadas

### Después del Login

1. **Inmediato**: `/mis-plantas`
2. **Con delay (500ms)**: Rutas de la primera granja:
   - `/granja/[id]/materias-primas`
   - `/granja/[id]/inventario`
   - `/granja/[id]/compras`
   - `/granja/[id]/proveedores`
   - `/granja/[id]/formulas`
   - `/granja/[id]/fabricaciones`

### En Mis Plantas

- Rutas de la primera granja se prefetchean automáticamente cuando el navegador está inactivo

### En Sidebar

- Cualquier ruta se prefetchea cuando el usuario pasa el mouse sobre el link

## ⚡ Optimizaciones

### 1. requestIdleCallback

Usa `requestIdleCallback` para ejecutar prefetching solo cuando el navegador está inactivo:

```typescript
requestIdleCallback(() => {
  prefetchRoute(path);
}, { timeout: 2000 });
```

**Ventajas**:
- No bloquea el hilo principal
- No interfiere con la navegación
- Solo se ejecuta cuando hay recursos disponibles

### 2. Cache de Rutas

Evita prefetchear la misma ruta múltiples veces:

```typescript
const prefetchedRoutes = new Set<string>();

if (prefetchedRoutes.has(path)) return; // Ya prefetcheada
prefetchedRoutes.add(path);
```

### 3. Delays Escalonados

Las rutas se prefetchean con delays escalonados (300ms entre cada una):

```typescript
routes.forEach((route, index) => {
  const delay = index * 300; // 300ms entre cada prefetch
  setTimeout(() => prefetchRoute(route), delay);
});
```

**Ventajas**:
- No sobrecarga el navegador
- Permite que el navegador priorice otras tareas
- Mejora la experiencia general

## 🎯 Impacto Esperado

### Mejoras en Tiempo de Carga

| Página | Sin Prefetch | Con Prefetch | Mejora |
|--------|--------------|--------------|--------|
| Materias Primas | 3-5s | 0.5-1s | 70-80% |
| Inventario | 3-5s | 0.5-1s | 70-80% |
| Compras | 3-5s | 0.5-1s | 70-80% |
| Proveedores | 2-3s | 0.3-0.8s | 60-70% |
| Fórmulas | 3-5s | 0.5-1s | 70-80% |
| Fabricaciones | 3-5s | 0.5-1s | 70-80% |

### Experiencia de Usuario

- **Navegación instantánea**: Las páginas se cargan casi inmediatamente
- **Sin bloqueos**: El prefetching no interfiere con la navegación
- **Uso eficiente de recursos**: Solo se ejecuta cuando hay recursos disponibles

## 🔍 Monitoreo

Para verificar que el prefetching está funcionando:

1. Abrir DevTools → Network
2. Filtrar por "JS" o "HTML"
3. Observar que las rutas se cargan antes de hacer clic
4. Verificar que no hay duplicados (cache funciona)

## ⚙️ Configuración

### Ajustar Delays

Editar `frontend/src/lib/prefetch.ts`:

```typescript
// Delay entre prefetches (300ms por defecto)
const delay = index * 300; // Cambiar a 200ms para más rápido, 500ms para más conservador

// Timeout de requestIdleCallback (2000ms por defecto)
requestIdleCallback(() => { ... }, { timeout: 2000 }); // Cambiar según necesidad
```

### Deshabilitar Prefetching

Para deshabilitar temporalmente:

```typescript
// En prefetch.ts
export function prefetchRoute(path: string): void {
  return; // Deshabilitado
}
```

## 📝 Notas

- El prefetching solo funciona en el cliente (navegador)
- No afecta el rendimiento del servidor
- Se ejecuta de forma asíncrona y no bloquea
- Compatible con todos los navegadores modernos
- Fallback automático para navegadores sin `requestIdleCallback`

## 🚀 Próximos Pasos

1. **Prefetching basado en uso**: Analizar qué rutas se usan más y priorizarlas
2. **Prefetching de datos**: Prefetchear datos de la API además de las rutas
3. **Service Worker**: Usar Service Worker para cache más agresivo
4. **Analytics**: Medir el impacto del prefetching en la experiencia del usuario

---

**Última actualización**: 2024-01-15
**Versión**: 1.0.0




