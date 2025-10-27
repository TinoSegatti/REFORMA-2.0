# Preguntas y Respuestas - Sistema de Gestión de Granjas

## ✅ Respondido por el usuario

### 1. Sistema de Autenticación
**P**: ¿Cómo funciona el login?  
**R**: 
- Login con email/password
- Login con Google OAuth (opcional)
- Se eliminó el campo teléfono
- Tipos de usuario: CLIENTE, ADMINISTRADOR

### 2. Gestión de Suscripciones
**P**: ¿Cómo funcionan los planes?  
**R**: Por ahora NO hay precios definidos ni gestión de cobranzas, pero mientras más se pague, más granjas se pueden gestionar.
- Plan 0 (gratis): 1 granja, 10 registros/tabla
- Plan 1: 1 granja, 50 registros/tabla
- Plan 2: 1 granja, 50 registros/tabla
- Plan 3: 1 granja, 100 registros/tabla
- Plan 4: 1 granja, 200 registros/tabla

### 3. Estructura de Granjas
**P**: ¿Qué campos necesitas en la tabla de granjas?  
**R**: 
```sql
t_granja:
- id_granja (PK)
- id_usuario (FK)
- nombre_granja
- descripcion
- fecha_creacion
```
Cada granja gestiona TODAS las tablas del sistema de manera independiente.

### 4. Materias Primas
**P**: ¿Necesitas categorías o unidades de medida?  
**R**: 
- NO se requieren categorías (cereales, fármacos, todo junto)
- NO se requieren unidades de medida
- Solo precio por kilo registrado de la última compra

### 5. Proveedores
**P**: ¿Qué información necesitas?  
**R**: Información básica únicamente para identificar facturas:
```sql
t_proveedor:
- id_proveedor (PK)
- id_granja (FK)
- codigo_proveedor
- nombre_proveedor
- direccion_proveedor
- localidad_proveedor
```

### 6. Piensos
**P**: ¿Cómo manejar los tipos de pienso?  
**R**: Se renombró a `t_animal` para hacerlo genérico:
```sql
t_animal:
- id_animal (PK)
- id_granja (FK)
- codigo_animal
- descripcion_animal
- categoria_animal (ENUM: lactancia, destete, crecimiento, engorde, reproductor, otro)
```

### 7. Fórmulas
**P**: ¿Cómo estructurar las fórmulas?  
**R**: Divididas en cabecera y detalle:
- **Cabecera**: id, id_granja, id_animal, codigo, descripcion, peso_total (1000kg), costo_total
- **Detalle**: id, id_formula, id_materia_prima, cantidad_kg, porcentaje, precio_momento_creacion, costo_parcial

### 8. Fabricaciones
**P**: ¿Qué campos necesitas?  
**R**: 
```sql
t_fabricacion:
- id_fabricacion
- id_granja
- id_formula
- descripcion_fabricacion
- cantidad_fabricacion
- costo_total_fabricacion
- costo_por_kilo (desglosado por materia prima)
- fecha_fabricacion
```
NO se requiere estado ni codigo.

### 9. Gestión de Precios
**P**: ¿Cómo actualizar precios?  
**R**: 
- Al comprar → actualiza precio materia prima en esa granja
- Actualiza inventario
- Actualiza costo de TODAS las fórmulas que usan esa materia prima
- NO modifica fabricaciones anteriores
- Futuras fabricaciones usan precio actualizado

### 10. Importación de Datos
**P**: ¿Cómo funciona la importación?  
**R**: 
- Solo lectura (una vez importado, se puede editar/eliminar en la granja destino)
- Si la granja origen se actualiza, NO se actualiza la destino
- Solo puedes importar de tus propias granjas
- NO requiere validación de permisos entre usuarios

### 11. Auditoría
**P**: ¿Necesitas sistema de auditoría?  
**R**: 
- Sí, se necesita auditoría completa
- Registro de cambios de precio (`t_registro_precio`)
- Sistema de filtros y búsquedas en la interfaz

### 12. Múltiples Granjas
**P**: ¿Un usuario puede acceder a múltiples granjas?  
**R**: 
- Depende del plan
- Solo puede acceder a sus propias granjas
- Cada plan define cuántas granjas puede gestionar

### 13. Roles y Permisos
**P**: ¿Necesitas diferentes niveles de acceso?  
**R**: NO, solo un nivel de acceso para usuarios tipo CLIENTE.
- Los administradores pueden ver lista de usuarios
- Gestión de suscripciones de usuarios

### 14. Separación Frontend/Backend
**P**: ¿Cómo estructurar el proyecto?  
**R**: 
- Separar completamente frontend y backend
- Facilita despliegue en Render, Vercel y Supabase
- Todas las configuraciones de Prisma en el backend

## 🔴 Preguntas Pendientes

### 1. Sistema de Archivos (CRÍTICO)
**P**: ¿Cómo quieres que funcione el sistema de archivos?  
**R**: 
- Se pueden generar múltiples tablas de archivos para inventario/fabricaciones/compras
- Tabla cabecera (id, fecha, descripción)
- Tabla detalle (datos JSON)

**Sugerencias adicionales necesarias**:
- ¿Cómo se dispara el proceso de archivado? (manual, automático, por fecha)
- ¿Los datos archivados se eliminan de la tabla original?
- ¿Qué campos específicos quieres en archivo_cabecera?

### 2. Detalle de Fabricación
**P**: ¿Cómo calcular el costo por materia prima en una fabricación?  
**R**: Actualmente propuesto en `DetalleFabricacion` con:
- cantidad_usada
- precio_unitario (del momento de la fabricación)
- costo_parcial

**Confirmación necesaria**:
- ¿Este desglose es suficiente?
- ¿Necesitas más información de auditoría?

### 3. Límites de Planes
**P**: ¿Cómo se verifica y aplica el límite de registros por tabla?  
**R**: Sistema de validación necesario en cada INSERT/UPDATE:
- Contar registros actuales
- Verificar límite del plan
- Rechazar si excede

**Implementación sugerida**: Middleware o servicio de validación.

### 4. Cantidad Real en Inventario
**P**: ¿Qué pasa si nunca se carga la cantidad real?  
**R**: Propuesta:
- Si no existe → usar `cantidad_sistema` como fallback
- Requerir que SIEMPRE haya un valor (nunca NULL)
- Interfaz debe forzar entrada de valor

**Confirmar**: ¿Esta lógica es correcta?

### 5. Precio de Materia Prima vs Precio Almacén
**P**: ¿Cuál es la relación entre estos dos campos?  
**Propuesta**:
- `materiaPrima.precioPorKilo`: Último precio registrado (de última compra)
- `inventario.precioAlmacen`: Promedio ponderado histórico

**Confirmar**: ¿Esta diferenciación es correcta?

## 💡 Sugerencias Técnicas

### 1. Triggers de Base de Datos
Considerar triggers de PostgreSQL para cálculos automáticos en tiempo real.

### 2. Cache de Resultados
Para evitar recalcular inventario en cada query, implementar cache.

### 3. Transacciones
Usar transacciones Prisma en operaciones complejas (compra → actualizar precio → recalcular fórmulas).

### 4. Índices de Base de Datos
Agregar índices en:
- `id_granja` en todas las tablas
- `fecha_compra`, `fecha_fabricacion` para búsquedas temporales
- `codigo_materia_prima`, `codigo_proveedor` para búsquedas

### 5. Soft Delete
Considerar soft delete para mantener historial:
- Campo `activo` en lugar de DELETE físico
- Permite recuperar datos

### 6. Validación de Códigos Únicos
Ya implementado con `@@unique([idGranja, codigo])` en múltiples tablas.

## 🚀 Próximos Pasos

1. ✅ Esquema de base de datos
2. ✅ Servicios de inventario
3. ✅ Servicios de fórmulas
4. ✅ Servicios de compras
5. ⏳ Implementar API REST (controllers + routes)
6. ⏳ Implementar autenticación
7. ⏳ Implementar validación de planes
8. ⏳ Implementar sistema de archivos
9. ⏳ Pruebas unitarias
10. ⏳ Documentación API

## 📝 Notas Importantes

- **Todos los precios son por KILO**
- **cantidad_real es MANUAL** y nunca puede ser NULL/0
- **Las fórmulas se recalcularán automáticamente** cuando cambien los precios
- **Las fabricaciones NO modifican cantidad_real**
- **Auditoría completa** de cambios de precio requerida



