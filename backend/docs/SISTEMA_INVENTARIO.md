# Sistema de Inventario - Lógica de Cálculos

## Campos del Inventario

### 1. **cantidad_acumulada**
**Descripción**: Total de materia prima adquirida a lo largo del tiempo  
**Fuente de datos**: Tabla `t_compra_detalle`  
**Cálculo**: 
```typescript
cantidad_acumulada = SUM(todas las compras de esa materia prima)
```

**Detalles del cálculo**:
- Se actualiza cada vez que se registra una nueva compra
- Suma todas las cantidades_compradas de `t_compra_detalle` donde `id_materia_prima` coincide

---

### 2. **cantidad_sistema**
**Descripción**: La diferencia entre lo adquirido y lo fabricado (sin desperdicios)  
**Fuente de datos**: 
- `t_compra_detalle` (entradas)
- `t_detalle_fabricacion` (salidas)

**Cálculo**: 
```typescript
cantidad_sistema = cantidad_acumulada - SUM(cantidades usadas en fabricaciones)
```

**Detalles del cálculo**:
- Suma todas las `cantidad_comprada` de compras
- Resta todas las `cantidad_usada` de fabricaciones
- **NO incluye desperdicios ni sobrantes**

---

### 3. **cantidad_real**
**Descripción**: Cantidad física que existe en la granja (después de desperdicios)  
**Fuente de datos**: **Carga manual** desde la interfaz de stock  
**Cálculo**: NINGUNO - es un dato manual

**Detalles**:
- Se carga manualmente desde la granja
- **Nunca puede ser NULL ni 0**
- Si hay inventario pero no se cargó, se muestra la `cantidad_sistema`
- Representa el conteo físico real

---

### 4. **merma**
**Descripción**: Diferencia entre kilos reales y kilos en sistema  
**Fuente de datos**: Calculado automáticamente  
**Cálculo**: 
```typescript
merma = cantidad_sistema - cantidad_real
```

**Interpretación**:
- **merma > 0**: Hubo desperdicio (el sistema tenía más registrado que la realidad)
- **merma < 0**: Hubo sobrante (la realidad tiene más que el sistema)
- **merma = 0**: Inventario perfecto

---

### 5. **precio_almacen**
**Descripción**: Precio promedio ponderado por la cantidad total adquirida  
**Fuente de datos**: 
- `t_compra_detalle` (precio_unitario y cantidad_comprada)
- Se actualiza con cada nueva compra

**Cálculo**: 
```typescript
precio_almacen = SUM(cantidad_comprada * precio_unitario) / SUM(cantidad_comprada)
```

**Ejemplo**:
- Compra 1: 100 kg a $10/kg = $1,000
- Compra 2: 50 kg a $12/kg = $600
- precio_almacen = (1,000 + 600) / (100 + 50) = $10.67/kg

---

### 6. **valor_stock**
**Descripción**: Valor monetario del stock actual basado en cantidad real  
**Fuente de datos**: 
- `cantidad_real` (del inventario)
- `precio_almacen` (del inventario)

**Cálculo**: 
```typescript
valor_stock = cantidad_real * precio_almacen
```

**Detalles**:
- Representa el valor total del inventario
- Se actualiza cuando cambia `cantidad_real` o `precio_almacen`

---

## Flujo de Actualización

### Cuando se realiza una COMPRA:
1. Se crea registro en `t_compra_cabecera` y `t_compra_detalle`
2. Se actualiza `precio_almacen` (promedio ponderado)
3. Se actualiza `cantidad_acumulada` (suma nueva compra)
4. Se actualiza `cantidad_sistema` (suma nueva compra)
5. Se registra en `t_registro_precio` (para auditoría)

### Cuando se realiza una FABRICACIÓN:
1. Se crea registro en `t_fabricacion` y `t_detalle_fabricacion`
2. Se resta a `cantidad_sistema` (no a cantidad_real, eso es manual)
3. Se usa `precio_almacen` para calcular costo de fabricación

### Cuando se carga manualmente la CANTIDAD REAL:
1. Se actualiza `cantidad_real`
2. Se recalcula `merma` automáticamente
3. Se recalcula `valor_stock` automáticamente

---

## Triggers y Eventos

### Actualización de Precio de Materia Prima
```typescript
// Cuando cambia el precio en una compra
1. Guardar precio_anterior en CompraDetalle
2. Calcular nuevo precio_almacen
3. Registrar en RegistroPrecio
4. Actualizar precioPorKilo en MateriaPrima
5. Recalcular costo de TODAS las formulas que usan esa materia prima
6. NO modificar fabricaciones antiguas (solo las futuras)
```

### Recalculo de Fórmulas
```typescript
// Cuando se actualiza precio de materia prima
1. Buscar todas las formulas que usan esa materia prima
2. Recalcular:
   - precioUnitarioMomentoCreacion = precio actual
   - costoParcial = cantidadKg * precio_unitario
   - costoTotalFormula = SUM(todos los costoParcial)
```

---

## Reglas de Negocio

1. **cantidad_real nunca es NULL ni 0**
   - Si no hay inventario real, se muestra `cantidad_sistema`
   
2. **precio_almacen siempre refleja el promedio ponderado**
   - Se actualiza con cada compra
   
3. **merma puede ser negativa**
   - Indica sobrantes o errores en el sistema
   
4. **Las fabricaciones NO modifican cantidad_real**
   - cantidad_real solo se modifica manualmente
   
5. **Auditoría completa**
   - Todas las compras guardan precio_anterior
   - Todos los cambios de precio se registran



