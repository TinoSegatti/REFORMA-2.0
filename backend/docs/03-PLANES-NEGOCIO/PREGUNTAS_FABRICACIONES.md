# 🔧 Preguntas sobre Fabricaciones

## Para implementar el controlador correctamente, necesito:

### 1. Flujo de Fabricación
- ¿Cómo se selecciona qué fórmula fabricar?
- ¿Se pueden fabricar múltiples fórmulas en una sola sesión?
- ¿Qué información se debe capturar al momento de fabricar?

### 2. Cálculo de Costos
- ¿Cómo se calcula el costo de fabricación?
  - ¿Basado en precios actuales de materia prima?
  - ¿O en precios al momento de crear la fórmula?
- ¿Debe actualizarse el inventario automáticamente?

### 3. Estados de Fabricación
Actualmente definidos como:
- PROGRAMADA
- EN_PROCESO
- COMPLETADA
- CANCELADA

**Preguntas:**
- ¿Quién cambia los estados? ¿Usuario manualmente?
- ¿Hay un flujo de transición de estados?
- ¿Se puede cancelar una fabricación "COMPLETADA"?

### 4. Desglose de Fabricación
El esquema tiene `DetalleFabricacion` que registra:
- Materia prima usada
- Cantidad usada
- Precio unitario
- Costo parcial

**Pregunta:**
- ¿Este desglose se calcula automáticamente o el usuario lo ingresa?

### 5. Inventario
- ¿Qué pasa con el inventario cuando se fabrica?
- ¿Se actualiza `cantidad_sistema` automáticamente?
- ¿Se actualiza `cantidad_real`?

### 6. Validaciones
- ¿Debe validar que exista suficiente materia prima antes de fabricar?
- ¿Qué pasa si no hay suficiente inventario?
- ¿Se puede fabricar si hay solo parcialmente disponible?

## 📝 Información Disponible del Sistema Actual

De `t_fabricacion`:
- id_fabricacion
- id_granja
- id_usuario
- id_formula
- descripcion_fabricacion
- cantidad_fabricacion (cantidad de fórmula fabricada)
- costo_total_fabricacion
- costo_por_kilo
- fecha_fabricacion
- fecha_creacion
- estado

De `t_detalle_fabricacion`:
- id_detalle
- id_fabricacion
- id_materia_prima
- cantidad_usada
- precio_unitario
- costo_parcial

## ✅ Lo que ya está implementado en los servicios

En `formulaService.ts`:
- ✅ Calcular costo de fórmulas
- ✅ Recalcular fórmulas automáticamente

En `inventarioService.ts`:
- ✅ Cálculos de inventario
- ✅ Actualización de cantidad_sistema

## 🤔 Necesito tu Confirmación

Por favor confirma:

1. **Flujo de creación de fabricación:**
   - Usuario selecciona una fórmula
   - Ingresa cantidad a fabricar
   - Sistema calcula costo y usa precios actuales
   - Sistema actualiza inventario (cantidad_sistema)
   - ✅ ¿Correcto?

2. **Estados:**
   - Usuario crea en estado "PROGRAMADA"
   - Puede cambiar manualmente a "EN_PROCESO"
   - Al completar cambia a "COMPLETADA"
   - ✅ ¿Correcto?

3. **Cálculo de costos:**
   - Se usa precio ACTUAL de materia prima
   - No el precio al momento de crear la fórmula
   - ✅ ¿Correcto?

4. **Inventario:**
   - Al fabricar, se Disminuye `cantidad_sistema`
   - NO se modifica `cantidad_real` (ese es manual)
   - ✅ ¿Correcto?

5. **Validaciones:**
   - No validar stock disponible (puede fabricar aunque no haya inventario)
   - ✅ ¿Correcto?

**Confirma estos puntos y procedo con la implementación.**

