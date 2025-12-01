# 🔧 Fixes: Errores de Hydration y API

**Fecha:** 2025-11-22  
**Archivos Modificados:**
- `frontend/src/components/layout/Sidebar.tsx`
- `frontend/src/lib/api.ts`
- `frontend/src/app/granja/[id]/page.tsx`

---

## 🐛 Error 1: Hydration Mismatch en Sidebar

### Problema
El servidor renderizaba "Mi Planta" pero el cliente podía tener un valor diferente desde `localStorage`, causando un mismatch de hidratación.

**Error:**
```
Hydration failed because the server rendered text didn't match the client.
Expected: "Mi Planta"
Received: "PORCINO S.A."
```

### Solución Implementada

**Archivo:** `frontend/src/components/layout/Sidebar.tsx`

1. **Agregado estado `mounted`** para detectar cuando el componente está montado en el cliente:
```typescript
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);
```

2. **Inicialización consistente** - Siempre inicializar con valor por defecto:
```typescript
const [granjaActiva, setGranjaActiva] = useState<{ id: string; nombre: string } | null>(
  idGranja ? { id: idGranja, nombre: 'Mi Planta' } : null
);
```

3. **Cargar desde localStorage solo después de la hidratación**:
```typescript
useEffect(() => {
  if (!mounted || !idGranja) return;
  
  // Cargar desde localStorage solo después de la hidratación
  const granja = localStorage.getItem('granjaInfo');
  if (granja) {
    try {
      const granjaData = JSON.parse(granja);
      if (granjaData.id === idGranja) {
        setGranjaActiva(granjaData);
        return;
      }
    } catch {
      // Si hay error, mantener valor por defecto
    }
  }
  setGranjaActiva({ id: idGranja, nombre: 'Mi Planta' });
}, [mounted, idGranja]);
```

4. **Render condicional** - Solo mostrar nombre real después de montar:
```typescript
<p className="text-sm font-semibold text-white truncate">
  {mounted && granjaActiva?.nombre ? granjaActiva.nombre : 'Mi Planta'}
</p>
```

### Resultado
- ✅ Servidor y cliente renderizan el mismo valor inicial ("Mi Planta")
- ✅ Después de la hidratación, se actualiza con el valor real desde localStorage
- ✅ No hay mismatch de hidratación

---

## 🐛 Error 2: Error al Obtener Estadísticas de Proveedores

### Problema
El endpoint `/api/proveedores/${idGranja}/estadisticas` estaba fallando y causando que toda la carga del panel principal fallara.

**Error:**
```
Error al obtener estadísticas
at Object.getEstadisticasProveedores (src\lib\api.ts:238:13)
```

### Solución Implementada

**Archivo 1:** `frontend/src/lib/api.ts`

**Mejorado manejo de errores** para obtener más información:
```typescript
async getEstadisticasProveedores(token: string, idGranja: string) {
  const response = await fetch(`${API_URL}/api/proveedores/${idGranja}/estadisticas`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
    console.error('Error obteniendo estadísticas de proveedores:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData
    });
    throw new Error(`Error al obtener estadísticas: ${errorData.error || response.statusText}`);
  }

  return await response.json();
}
```

**Archivo 2:** `frontend/src/app/granja/[id]/page.tsx`

**Agregado manejo de errores** para que no bloquee el resto de la carga:
```typescript
const [materias, inventarioEstadisticas, fabricacionesEstadisticas, proveedoresEstadisticas] =
  await Promise.all([
    apiClient.getMateriasPrimas(token, idGranja),
    apiClient.getEstadisticasInventario(token, idGranja),
    apiClient.getEstadisticasFabricaciones(token, idGranja),
    apiClient.getEstadisticasProveedores(token, idGranja).catch((error) => {
      console.error('Error obteniendo estadísticas de proveedores:', error);
      return null; // Retornar null en caso de error para no bloquear el resto
    }),
    cargarPlan(), // Cargar plan en paralelo
  ]);
```

### Resultado
- ✅ Si el endpoint falla, retorna `null` en lugar de lanzar error
- ✅ El resto de las estadísticas se cargan correctamente
- ✅ Se registra el error en consola para debugging
- ✅ El panel principal se muestra aunque falte una estadística

---

## ✅ Verificaciones

### Error de Hydration
- ✅ No hay mismatch entre servidor y cliente
- ✅ El nombre de la granja se actualiza correctamente después de la hidratación
- ✅ No hay warnings de hidratación en consola

### Error de API
- ✅ El panel principal carga aunque falle una estadística
- ✅ Los errores se registran en consola para debugging
- ✅ El usuario ve el panel con las estadísticas disponibles

---

## 🔍 Debugging Adicional

Si el error de estadísticas de proveedores persiste, verificar:

1. **Backend está corriendo:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Endpoint existe y funciona:**
   ```bash
   curl -H "Authorization: Bearer TOKEN" \
        http://localhost:3000/api/proveedores/GRANJA_ID/estadisticas
   ```

3. **Logs del backend:**
   - Revisar logs del servidor para ver el error específico
   - Verificar que `obtenerEstadisticasProveedores` no esté lanzando excepciones

4. **Base de datos:**
   - Verificar que existan proveedores en la granja
   - Verificar que las tablas `t_proveedor` y `t_compra_cabecera` existan

---

**Documento creado:** 2025-11-22  
**Última actualización:** 2025-11-22






