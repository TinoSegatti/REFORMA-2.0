# 📊 Flujo de Datos del Sistema de Inventario

## 🎯 Resumen del Flujo

Este documento describe **cómo se calculan todas las cantidades y precios** en el sistema de inventario.

---

## 📦 CÁLCULOS DEL INVENTARIO

### 1. **cantidad_acumulada** (Entrada Total)
**¿Qué es?** La suma de todas las materias primas compradas en la granja.

**¿Cómo se calcula?**
```sql
SELECT COALESCE(SUM(cantidad_comprada), 0) 
FROM t_compra_detalle cd
INNER JOIN t_compra_cabecera cc ON cd.id_compra = cc.id
WHERE cc.id_granja = ? 
  AND cd.id_materia_prima = ?
```

**Fuente de datos:** Tabla `t_compra_detalle` (suma de todos los registros de compra)

**Actualización:** Se recalcula automáticamente cada vez que se:
- Crea una nueva compra
- Se elimina una compra (futura implementación)

---

### 2. **cantidad_sistema** (Saldo Disponible)
**¿Qué es?** Diferencia entre lo comprado y lo fabricado. Representa el stock **teórico**.

**¿Cómo se calcula?**
```
cantidad_sistema = cantidad_acumulada - cantidad_usada_en_fabricaciones
```

**Detalle de la fórmula:**
```sql
-- Compras (entradas)
SELECT COALESCE(SUM(cantidad_comprada), 0) 
FROM t_compra_detalle cd
INNER JOIN t_compra_cabecera cc ON cd.id_compra = cc.id
WHERE cc.id_granja = ? AND cd.id_materia_prima = ?

-- Menos fabricaciones (salidas)
SELECT COALESCE(SUM(cantidad_usada), 0) 
FROM t_detalle_fabricacion df
INNER JOIN t_fabricacion f ON df.id_fabricacion = f.id
WHERE f.id_granja = ? AND df.id_materia_prima = ?
```

**Fuente de datos:** 
- Suma de `t_compra_detalle` (entradas)
- Resta de `t_detalle_fabricacion` (salidas)

**Actualización:** Se recalcula automáticamente cuando:
- Se crea una compra (aumenta)
- Se crea una fabricación (disminuye)
- Se elimina una fabricación (aumenta)

---

### 3. **cantidad_real** (Cantidad Física)
**¿Qué es?** La cantidad **real** que existe en el almacén, medida manualmente.

**¿Cómo se calcula?**
- **NO se calcula automáticamente**
- Es un valor que el usuario ingresa manualmente
- Se puede actualizar en cualquier momento
- Nunca puede ser negativo

**Ejemplo:**
- Si se compran 100kg de maíz
- Y se fabrica usando 20kg
- `cantidad_sistema` será 80kg
- Pero si hubo desperdicios y solo quedan 75kg
- El usuario ingresa **manualmente** `cantidad_real = 75kg`

**Actualización:** 
- Se puede modificar manualmente desde la interfaz
- Se actualiza automáticamente cuando se elimina una fabricación (se suma de vuelta)

---

### 4. **merma** (Pérdidas y Desperdicios)
**¿Qué es?** La diferencia entre lo que debería haber (sistema) y lo que realmente hay (real).

**¿Cómo se calcula?**
```
merma = cantidad_sistema - cantidad_real
```

**Interpretación:**
- `merma > 0` → Hubo desperdicios/pérdidas
- `merma < 0` → Hubo sobrantes/ganancias inesperadas
- `merma = 0` → Cantidad perfecta

**Actualización:** Se recalcula automáticamente cada vez que cambia `cantidad_sistema` o `cantidad_real`.

---

### 5. **precio_almacen** (Precio Promedio Ponderado)
**¿Qué es?** El precio promedio por kilo de todas las compras realizadas.

**¿Cómo se calcula?**
```sql
precio_almacen = TOTAL_DINERO / TOTAL_CANTIDAD

Donde:
TOTAL_DINERO = SUM(cantidad_comprada * precio_unitario)
TOTAL_CANTIDAD = SUM(cantidad_comprada)
```

**Ejemplo:**
1. Compra 1: 100kg a $10/kg = $1,000
2. Compra 2: 50kg a $12/kg = $600
3. **precio_almacen = (1,000 + 600) / (100 + 50) = $10.67/kg**

**Fuente de datos:** Tabla `t_compra_detalle` (todas las compras históricas)

**Actualización:** Se recalcula automáticamente cuando:
- Se crea una nueva compra
- Se elimina una compra (futura implementación)

---

### 6. **valor_stock** (Valor del Inventario)
**¿Qué es?** El valor monetario del stock actual de la materia prima.

**¿Cómo se calcula?**
```
valor_stock = cantidad_real * precio_almacen
```

**Interpretación:**
- Representa cuánto vale el stock actual si se vendiera
- Basado en el costo promedio de adquisición
- **No es** el valor de mercado, sino el costo de adquisición

**Actualización:** Se recalcula automáticamente cuando cambia:
- `cantidad_real`
- `precio_almacen`

---

## 🔄 ACTUALIZACIONES AUTOMÁTICAS

### Al **CREAR una COMPRA:**
1. ✅ Se crea el registro en `t_compra_cabecera` y `t_compra_detalle`
2. ✅ Se actualiza `precioPorKilo` de la materia prima (`t_materia_prima`)
3. ✅ Se registra el cambio de precio en `t_registro_precio` (auditoría)
4. ✅ Se recalcula el **inventario** completo (todas las cantidades)
5. ✅ Se recalculan **todas las fórmulas** que usan esa materia prima

### Al **CREAR una FABRICACIÓN:**
1. ✅ Se crea el registro en `t_fabricacion` y `t_detalle_fabricacion`
2. ✅ Se calculan costos basados en **precios actuales** de materias primas
3. ✅ Se detectan faltantes de stock
4. ✅ Se actualiza `cantidad_sistema` (disminuye)
5. ✅ Se actualiza `cantidad_real` (disminuye)
6. ✅ Se recalcula `merma` y `valor_stock`

### Al **ELIMINAR una FABRICACIÓN:**
1. ✅ Se restaura `cantidad_sistema` (aumenta)
2. ✅ Se restaura `cantidad_real` (aumenta)
3. ✅ Se recalcula `merma` y `valor_stock`
4. ✅ Se elimina el registro en `t_fabricacion` y `t_detalle_fabricacion`

---

## 💰 PRECIOS DE MATERIAS PRIMAS

### En la tabla `t_materia_prima`:
**Campo:** `precioPorKilo`

**¿Cómo se actualiza?**
- Solo se actualiza cuando se hace una **nueva compra**
- Siempre toma el precio de la **última compra** registrada
- NO es un promedio, es el precio del último proveedor

**Ejemplo:**
1. Compra 1: Maíz a $10/kg → `precioPorKilo = $10`
2. Compra 2: Maíz a $12/kg → `precioPorKilo = $12` (actualizado)
3. Compra 3: Maíz a $11/kg → `precioPorKilo = $11` (actualizado)

**Historial:** Todos los cambios de precio se registran en `t_registro_precio`.

---

## 📐 COSTOS DE FÓRMULAS

### En la tabla `t_formula_cabecera`:
**Campo:** `costoTotalFormula`

**¿Cómo se calcula?**
```typescript
// Por cada materia prima en la fórmula:
costoParcial = cantidadKg * precioPorKilo (actual)

// Suma total
costoTotalFormula = SUM(costoParcial de todas las materias primas)
```

**¿Cuándo se actualiza?**
- Cuando se crea la fórmula (usa precios actuales)
- Cuando cambia el precio de alguna materia prima que la integra
- Cuando se modifica manualmente la fórmula

---

## 🏭 COSTOS DE FABRICACIONES

### En la tabla `t_fabricacion`:
**Campo:** `costoTotalFabricacion` y `costoPorKilo`

**¿Cómo se calcula?**
```typescript
// Por cada materia prima en la fórmula:
cantidadUsada = (cantidadKg_en_formula / 1000) * cantidadFabricacion
costoParcial = cantidadUsada * precioPorKilo (actual)

// Suma total
costoTotalFabricacion = SUM(costoParcial)

// Costo por kilo
costoPorKilo = costoTotalFabricacion / cantidadFabricacion
```

**Ejemplo:**
- Fórmula usa 500kg de maíz para 1000kg de producto
- Fabricamos 200kg de producto
- Cantidad usada = (500 / 1000) * 200 = 100kg de maíz
- Costo parcial = 100kg * $12/kg = $1,200

**¿Qué precios se usan?**
- Precios **actuales** al momento de fabricar
- No usa los precios históricos de cuando se creó la fórmula
- Permite rastrear costos reales de producción

---

## ✅ VALIDACIONES DEL SISTEMA

### Faltantes de Stock:
- Al fabricar, se verifica si hay suficiente `cantidad_real`
- Si `cantidad_real < cantidadUsada` → marca `sinExistencias = true`
- Permite fabricar igualmente, pero queda registrado el faltante
- `cantidad_real` puede quedar negativo (alerta visual)

### Valores Negativos:
- `cantidad_sistema` puede ser negativo (matemáticamente)
- `cantidad_real` nunca puede ser negativo (se trunca a 0)
- Los valores negativos activan alertas en el sistema

---

## 📊 RESUMEN: Origen de los Datos

| Campo | Origen | Actualización |
|-------|--------|---------------|
| `cantidad_acumulada` | Suma de compras | Automático al comprar |
| `cantidad_sistema` | Compras - Fabricaciones | Automático al comprar/fabricar |
| `cantidad_real` | Ingreso manual | Manual o al eliminar fabricación |
| `merma` | Calculado | Automático |
| `precio_almacen` | Promedio ponderado de compras | Automático al comprar |
| `valor_stock` | Calculado | Automático |
| `precioPorKilo` (MateriaPrima) | Última compra | Automático al comprar |
| `costoTotalFormula` | Calculado con precios actuales | Automático al crear/actualizar |
| `costoTotalFabricacion` | Calculado con precios actuales | Automático al fabricar |

---

## 🧪 CÓMO VALIDAR LOS CÁLCULOS

### Test 1: Compra
1. Registrar compra de 100kg a $10/kg
2. Verificar: `cantidad_acumulada = 100kg`
3. Verificar: `cantidad_sistema = 100kg`
4. Verificar: `precio_almacen = $10/kg`

### Test 2: Fabricación
1. Fabricar 50kg de producto que usa 50kg de materia prima
2. Verificar: `cantidad_sistema = 50kg` (100 - 50)
3. Verificar: `cantidad_real = 50kg` (si no había desperdicio)
4. Verificar: `merma = 0`

### Test 3: Desperdicio
1. Actualizar `cantidad_real` a 45kg (manual)
2. Verificar: `merma = 5kg` (50 - 45)

### Test 4: Precio de Almacén
1. Comprar 50kg más a $12/kg
2. Verificar: `precio_almacen = $10.67/kg` ((100*10 + 50*12) / 150)

---

**Documento creado el:** $(date)
**Versión:** 1.0
