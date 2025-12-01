# 🧪 Tests con Datos Reales - CORINA WhatsApp

**Fecha:** 2025-11-22  
**Estado:** 📋 **LISTO PARA EJECUTAR** (cuando Twilio esté disponible)  
**Requisitos:**
- ✅ Usuario ENTERPRISE con teléfono verificado
- ✅ Al menos 1 granja activa con datos de prueba
- ✅ Twilio Sandbox configurado o WhatsApp Business API activo
- ✅ OpenAI API con créditos disponibles

---

## 📋 Preparación Pre-Tests

### 1. Configurar Usuario de Prueba

```sql
-- Verificar usuario ENTERPRISE
SELECT id, email, planSuscripcion, telefono, telefonoVerificado 
FROM t_usuarios 
WHERE planSuscripcion = 'ENTERPRISE' 
  AND telefono IS NOT NULL 
  AND telefonoVerificado = true;

-- Si no existe, crear o actualizar:
UPDATE t_usuarios 
SET telefono = 'whatsapp:+5493515930163',
    telefonoVerificado = true,
    planSuscripcion = 'ENTERPRISE'
WHERE email = 'tu-email@ejemplo.com';
```

### 2. Preparar Datos de Prueba

**Granja de Prueba:**
- ✅ Al menos 1 granja activa
- ✅ Materias primas con cantidades en 0 o negativas (para alertas)
- ✅ Materias primas con cantidades positivas
- ✅ Al menos 1 proveedor
- ✅ Al menos 1 animal/pienso
- ✅ Al menos 1 fórmula (opcional, para tests de fabricación)

### 3. Verificar Configuración

```bash
# Verificar variables de entorno
echo $TWILIO_ACCOUNT_SID
echo $TWILIO_AUTH_TOKEN
echo $TWILIO_WHATSAPP_FROM
echo $OPENAI_API_KEY

# Verificar webhook de Twilio
# Debe apuntar a: https://tu-dominio.com/api/corina/whatsapp/webhook
```

---

## 🧪 Suite de Tests: Consultas

### Test 1: Consultar Alertas de Inventario (1 Granja)

**Objetivo:** Verificar que CORINA responde con alertas cuando hay materias primas en 0 o negativas.

**Pre-requisitos:**
- Usuario con 1 granja activa
- Al menos 1 materia prima con cantidad <= 0

**Pasos:**
1. Enviar por WhatsApp: `"CORINA, alertas de inventario"`
2. Esperar respuesta de CORINA

**Resultado Esperado:**
```
📋 CORINA

Listado de Alertas de Inventario

Granja: [NOMBRE_GRANJA]

1. [CODIGO_MP] ([NOMBRE_MP])
   Cantidad: 0.00 kg - 🔴 CERO

2. [CODIGO_MP] ([NOMBRE_MP])
   Cantidad: -10.00 kg - 🔴 NEGATIVO
```

**Verificaciones:**
- ✅ Mensaje recibido correctamente
- ✅ Listado incluye todas las alertas
- ✅ Formato es legible
- ✅ Se creó registro en `t_corina_interaccion` con tipo `CONSULTA_ALERTAS`

---

### Test 2: Consultar Alertas (Múltiples Granjas)

**Objetivo:** Verificar que CORINA pregunta cuál granja consultar cuando hay múltiples.

**Pre-requisitos:**
- Usuario con 2+ granjas activas

**Pasos:**
1. Enviar por WhatsApp: `"Alertas"`
2. Esperar respuesta con lista de granjas
3. Responder: `"1"` o `"la granja 1"` o `"[NOMBRE_GRANJA]"`

**Resultado Esperado (Paso 2):**
```
📋 CORINA

Necesito que me especifiques de cuál de todas las plantas necesitas el listado de alertas.

Actualmente tienes un total de 2 plantas:

1- PORCINO S.A.
2- AVICOLA S.A.

Responde con el número (ej: "1", "la planta 2") o el nombre de la planta.
```

**Resultado Esperado (Paso 3):**
```
📋 CORINA

Listado de Alertas de Inventario

Granja: PORCINO S.A.

[Alertas de la granja seleccionada]
```

**Verificaciones:**
- ✅ CORINA pregunta por la granja cuando hay múltiples
- ✅ Acepta número, nombre o frase con número
- ✅ Lista de granjas está numerada correctamente
- ✅ Se puede consultar múltiples granjas de la misma lista

---

### Test 3: Consultar Materias Primas

**Objetivo:** Verificar que CORINA lista todas las materias primas de una granja.

**Pre-requisitos:**
- Granja con al menos 3 materias primas

**Pasos:**
1. Enviar: `"Quiero ver las materias primas"`
2. Si hay múltiples granjas, seleccionar una
3. Esperar listado

**Resultado Esperado:**
```
📋 CORINA

Listado de Materias Primas

Granja: [NOMBRE_GRANJA]

1. MAIZ001 - Maíz
   Cantidad: 150.50 kg
   Precio: $50.00/kg

2. SOJA001 - Soja
   Cantidad: 200.00 kg
   Precio: $75.00/kg

[... más materias primas ...]
```

**Verificaciones:**
- ✅ Listado completo de materias primas
- ✅ Información correcta (cantidad, precio)
- ✅ Formato legible

---

### Test 4: Consultar Compras

**Objetivo:** Verificar que CORINA lista las compras recientes.

**Pre-requisitos:**
- Granja con al menos 2 compras registradas

**Pasos:**
1. Enviar: `"Compras de la granja 1"`
2. Esperar listado

**Resultado Esperado:**
```
📋 CORINA

Listado de Compras

Granja: [NOMBRE_GRANJA]

1. Factura: FAC-001
   Proveedor: PROV001 - Juan Pérez
   Fecha: 2025-11-20
   Total: $5,000.00

2. Factura: FAC-002
   Proveedor: PROV002 - María García
   Fecha: 2025-11-18
   Total: $3,500.00
```

**Verificaciones:**
- ✅ Listado ordenado por fecha (más reciente primero)
- ✅ Información completa (factura, proveedor, fecha, total)

---

### Test 5: Consultar Fórmulas

**Objetivo:** Verificar que CORINA lista las fórmulas de una granja.

**Pre-requisitos:**
- Granja con al menos 1 fórmula

**Pasos:**
1. Enviar: `"Fórmulas"`
2. Seleccionar granja si aplica
3. Esperar listado

**Resultado Esperado:**
```
📋 CORINA

Listado de Fórmulas

Granja: [NOMBRE_GRANJA]

1. FORM001 - Fórmula Engorde
   Animal: Cerdo Engorde
   Costo Total: $450.00
   Detalles: 3 materias primas

2. FORM002 - Fórmula Inicio
   Animal: Cerdo Inicio
   Costo Total: $500.00
   Detalles: 4 materias primas
```

**Verificaciones:**
- ✅ Listado completo de fórmulas
- ✅ Información de animal asociado
- ✅ Costo total correcto

---

### Test 6: Consultar Fabricaciones

**Objetivo:** Verificar que CORINA lista las fabricaciones recientes.

**Pre-requisitos:**
- Granja con al menos 2 fabricaciones

**Pasos:**
1. Enviar: `"Fabricaciones"`
2. Seleccionar granja si aplica
3. Esperar listado

**Resultado Esperado:**
```
📋 CORINA

Listado de Fabricaciones

Granja: [NOMBRE_GRANJA]

1. Fórmula: FORM001 - Fórmula Engorde
   Descripción: Fabricación Engorde Lote 1
   Cantidad: 1.5 veces (1,500 kg)
   Fecha: 2025-11-21
   Costo Total: $675.00

2. Fórmula: FORM002 - Fórmula Inicio
   Descripción: Fabricación Inicio Lote 2
   Cantidad: 2.0 veces (2,000 kg)
   Fecha: 2025-11-20
   Costo Total: $1,000.00
```

**Verificaciones:**
- ✅ Listado ordenado por fecha
- ✅ Información completa (fórmula, cantidad, fecha, costo)

---

### Test 7: Consultar Proveedores

**Objetivo:** Verificar que CORINA lista los proveedores.

**Pre-requisitos:**
- Granja con al menos 2 proveedores

**Pasos:**
1. Enviar: `"Proveedores"`
2. Seleccionar granja si aplica
3. Esperar listado

**Resultado Esperado:**
```
📋 CORINA

Listado de Proveedores

Granja: [NOMBRE_GRANJA]

1. PROV001 - Juan Pérez
   Dirección: Calle 123
   Localidad: Córdoba

2. PROV002 - María García
   Dirección: Av. Principal 456
   Localidad: Buenos Aires
```

**Verificaciones:**
- ✅ Listado completo de proveedores
- ✅ Información de contacto correcta

---

### Test 8: Consultar Animales/Piensos

**Objetivo:** Verificar que CORINA lista los animales/piensos.

**Pre-requisitos:**
- Granja con al menos 2 animales/piensos

**Pasos:**
1. Enviar: `"Animales"` o `"Piensos"`
2. Seleccionar granja si aplica
3. Esperar listado

**Resultado Esperado:**
```
📋 CORINA

Listado de Animales/Piensos

Granja: [NOMBRE_GRANJA]

1. CERDO001 - Cerdo Engorde
   Categoría: Engorde

2. CERDO002 - Cerdo Inicio
   Categoría: Inicio
```

**Verificaciones:**
- ✅ Listado completo de animales
- ✅ Categorías correctas

---

### Test 9: Consultar Informe de Inventario

**Objetivo:** Verificar que CORINA genera informe completo de inventario.

**Pre-requisitos:**
- Granja con múltiples materias primas

**Pasos:**
1. Enviar: `"Informe de inventario"`
2. Seleccionar granja si aplica
3. Esperar informe

**Resultado Esperado:**
```
📋 CORINA

Informe de Inventario

Granja: [NOMBRE_GRANJA]

Resumen:
- Total Materias Primas: 10
- Con Stock Positivo: 8
- Con Stock Cero: 1
- Con Stock Negativo: 1
- Valor Total Stock: $15,000.00

Detalles:
[Listado completo de materias primas con cantidades y valores]
```

**Verificaciones:**
- ✅ Resumen completo
- ✅ Cálculos correctos (valor total, conteos)
- ✅ Detalles completos

---

## 🧪 Suite de Tests: Creación de Registros

### Test 10: Crear Materia Prima (Datos Completos)

**Objetivo:** Verificar creación completa de materia prima con datos completos.

**Pasos:**
1. Enviar: `"Crear materia prima maíz con código MAIZ_TEST_001"`
2. Esperar preview
3. Responder: `"Sí"` o `"Confirmar"`
4. Verificar creación en BD

**Resultado Esperado (Paso 2):**
```
✅ CORINA

📋 Preview del registro a crear:

• Tipo: Materia Prima
• Código: MAIZ_TEST_001
• Nombre: Maíz

🤔 ¿Deseas crear este registro?

Responde:
• "Sí" o "Confirmar" para crear el registro
• "No" o "Cancelar" para cancelar
• "Modificar" para cambiar algún dato
```

**Resultado Esperado (Paso 3):**
```
✅ CORINA

¡Registro creado exitosamente!

El registro ha sido creado en el sistema. Puedes verlo en la aplicación web.
```

**Verificaciones:**
- ✅ Preview muestra datos correctos
- ✅ Registro creado en BD con código y nombre correctos
- ✅ Interacción marcada como `COMPLETADA`
- ✅ `registroCreadoId` guardado correctamente

**Verificación en BD:**
```sql
SELECT * FROM t_materia_prima 
WHERE codigo_materia_prima = 'MAIZ_TEST_001';

SELECT * FROM t_corina_interaccion 
WHERE registro_creado_id = '[ID_CREADO]' 
  AND estado_interaccion = 'COMPLETADA';
```

---

### Test 11: Crear Materia Prima (Datos Incompletos)

**Objetivo:** Verificar que CORINA solicita datos faltantes.

**Pasos:**
1. Enviar: `"Crear materia prima maíz"`
2. Esperar solicitud de código
3. Responder: `"MAIZ_TEST_002"`
4. Esperar preview
5. Confirmar creación

**Resultado Esperado (Paso 2):**
```
📝 CORINA

Para crear un materia prima, necesito los siguientes datos:

Faltan los siguientes datos:
1. código de materia prima

Ejemplos:
• Código: "MAIZ001", "SOJA002"
• Nombre: "Maíz", "Soja"

💡 Responde con los datos faltantes o corrige los errores para continuar.
```

**Verificaciones:**
- ✅ CORINA identifica datos faltantes
- ✅ Solicita datos de forma clara
- ✅ Permite completar datos en mensaje siguiente
- ✅ Crea registro después de completar datos

---

### Test 12: Crear Materia Prima (Código Duplicado)

**Objetivo:** Verificar manejo de códigos duplicados.

**Pre-requisitos:**
- Materia prima con código `MAIZ_DUP_001` ya existe

**Pasos:**
1. Enviar: `"Crear materia prima maíz con código MAIZ_DUP_001"`
2. Esperar error de duplicado
3. Enviar código nuevo: `"Crear materia prima maíz con código MAIZ_DUP_002"`
4. Confirmar creación

**Resultado Esperado (Paso 2):**
```
📝 CORINA

Para crear un materia prima, necesito los siguientes datos:

❌ Errores encontrados:
1. Ya existe una materia prima con el código "MAIZ_DUP_001". Por favor, usa un código diferente.

💡 Responde con los datos faltantes o corrige los errores para continuar.
```

**Verificaciones:**
- ✅ CORINA detecta código duplicado
- ✅ Mensaje de error claro
- ✅ Permite corregir y crear con código nuevo

---

### Test 13: Crear Proveedor

**Objetivo:** Verificar creación de proveedor.

**Pasos:**
1. Enviar: `"Crear proveedor Juan Pérez con código PROV_TEST_001 en Córdoba"`
2. Esperar preview
3. Confirmar

**Resultado Esperado (Paso 2):**
```
✅ CORINA

📋 Preview del registro a crear:

• Tipo: Proveedor
• Código: PROV_TEST_001
• Nombre: Juan Pérez
• Localidad: Córdoba

🤔 ¿Deseas crear este registro?
```

**Verificaciones:**
- ✅ Preview completo
- ✅ Registro creado en BD
- ✅ Datos opcionales (dirección, localidad) manejados correctamente

---

### Test 14: Crear Animal/Pienso

**Objetivo:** Verificar creación de animal/pienso.

**Pasos:**
1. Enviar: `"Crear pienso cerdo engorde con código CERDO_TEST_001"`
2. Esperar solicitud de categoría
3. Responder: `"Categoría Engorde"`
4. Confirmar

**Resultado Esperado (Paso 2):**
```
📝 CORINA

Para crear un animal/pienso, necesito los siguientes datos:

Faltan los siguientes datos:
1. categoría del animal/pienso

Ejemplos:
• Código: "CERDO001", "POLLO001"
• Descripción: "Cerdo Engorde", "Pollo Broiler"
• Categoría: "Engorde", "Inicio", "Broiler"

💡 Responde con los datos faltantes o corrige los errores para continuar.
```

**Verificaciones:**
- ✅ CORINA solicita categoría faltante
- ✅ Permite completar en mensaje siguiente
- ✅ Crea registro correctamente

---

### Test 15: Crear Fórmula (Completa)

**Objetivo:** Verificar creación de fórmula con detalles.

**Pre-requisitos:**
- Al menos 1 animal/pienso existente
- Al menos 2 materias primas existentes

**Pasos:**
1. Enviar: `"Crear fórmula FORM_TEST_001 para cerdo engorde con 500 kg de maíz y 500 kg de soja"`
2. Esperar preview
3. Confirmar

**Resultado Esperado (Paso 2):**
```
✅ CORINA

📋 Preview del registro a crear:

• Tipo: Fórmula
• Código: FORM_TEST_001
• Descripción: [Descripción extraída]
• Animal: Cerdo Engorde
• Detalles (2 materias primas):
  - MAIZ001 (Maíz): 500 kg
  - SOJA001 (Soja): 500 kg
• Total: 1000 kg

🤔 ¿Deseas crear este registro?
```

**Verificaciones:**
- ✅ CORINA extrae detalles de materias primas
- ✅ Resuelve nombres a IDs correctamente
- ✅ Suma total es 1000 kg (o se ajusta proporcionalmente)
- ✅ Fórmula creada con detalles correctos

**Verificación en BD:**
```sql
SELECT f.*, fd.* 
FROM t_formula_cabecera f
JOIN t_formula_detalle fd ON f.id = fd.id_formula
WHERE f.codigo_formula = 'FORM_TEST_001';
```

---

### Test 16: Crear Compra (Completa)

**Objetivo:** Verificar creación de compra usando servicio (NO inserción directa).

**Pre-requisitos:**
- Proveedor existente
- Materias primas existentes

**Pasos:**
1. Enviar: `"Compré 100 kg de maíz a $50 por kilo del proveedor PROV001 el día de hoy"`
2. Esperar preview
3. Confirmar
4. Verificar que se actualizó inventario y precios

**Resultado Esperado (Paso 2):**
```
✅ CORINA

📋 Preview del registro a crear:

• Tipo: Compra
• Proveedor: PROV001 (Juan Pérez)
• Fecha: 2025-11-22
• Detalles (1 materias primas):
  - MAIZ001 (Maíz): 100 kg × $50

🤔 ¿Deseas crear este registro?
```

**Verificaciones:**
- ✅ Compra creada usando servicio `crearCompra`
- ✅ Inventario actualizado correctamente
- ✅ Precio de materia prima actualizado
- ✅ Alertas detectadas si cantidad <= 0

**Verificación en BD:**
```sql
-- Verificar compra creada
SELECT * FROM t_compra_cabecera 
WHERE id_granja = '[ID_GRANJA]' 
ORDER BY fecha_compra DESC LIMIT 1;

-- Verificar detalles
SELECT * FROM t_compra_detalle 
WHERE id_compra_cabecera = '[ID_COMPRA]';

-- Verificar inventario actualizado
SELECT * FROM t_inventario 
WHERE id_materia_prima = '[ID_MP]';

-- Verificar precio actualizado
SELECT precio_por_kilo FROM t_materia_prima 
WHERE id = '[ID_MP]';
```

---

### Test 17: Crear Fabricación (Completa)

**Objetivo:** Verificar creación de fabricación usando servicio (NO inserción directa).

**Pre-requisitos:**
- Fórmula existente con detalles

**Pasos:**
1. Enviar: `"Fabricamos 1 vez de la fórmula FORM001 el día de hoy"`
2. Esperar preview
3. Confirmar
4. Verificar que se actualizó inventario

**Resultado Esperado (Paso 2):**
```
✅ CORINA

📋 Preview del registro a crear:

• Tipo: Fabricación
• Fórmula: FORM001 (Fórmula Engorde)
• Descripción: [Descripción extraída]
• Cantidad: 1 veces (1,000 kg)
• Fecha: 2025-11-22

🤔 ¿Deseas crear este registro?
```

**Verificaciones:**
- ✅ Fabricación creada usando servicio `crearFabricacion`
- ✅ Inventario actualizado (cantidades reducidas)
- ✅ Alertas detectadas si cantidad <= 0
- ✅ Costos calculados correctamente

**Verificación en BD:**
```sql
-- Verificar fabricación creada
SELECT * FROM t_fabricacion 
WHERE id_granja = '[ID_GRANJA]' 
ORDER BY fecha_fabricacion DESC LIMIT 1;

-- Verificar detalles
SELECT * FROM t_fabricacion_detalle 
WHERE id_fabricacion = '[ID_FABRICACION]';

-- Verificar inventario actualizado
SELECT * FROM t_inventario 
WHERE id_granja = '[ID_GRANJA]';
```

---

## 🧪 Suite de Tests: Flujos de Confirmación

### Test 18: Cancelar Creación

**Objetivo:** Verificar que se puede cancelar una creación.

**Pasos:**
1. Enviar: `"Crear materia prima maíz con código MAIZ_CANCEL_001"`
2. Esperar preview
3. Responder: `"No"` o `"Cancelar"`
4. Verificar que NO se creó registro

**Resultado Esperado (Paso 3):**
```
❌ CORINA

Creación cancelada.

Si necesitas crear un registro más adelante, puedes intentarlo nuevamente.
```

**Verificaciones:**
- ✅ Mensaje de cancelación claro
- ✅ NO se creó registro en BD
- ✅ Interacción marcada como `CANCELADA`

**Verificación en BD:**
```sql
SELECT * FROM t_corina_interaccion 
WHERE estado_interaccion = 'CANCELADA' 
ORDER BY fecha_interaccion DESC LIMIT 1;

-- Verificar que NO existe registro
SELECT * FROM t_materia_prima 
WHERE codigo_materia_prima = 'MAIZ_CANCEL_001';
-- Debe retornar 0 filas
```

---

### Test 19: Modificar Datos Antes de Crear

**Objetivo:** Verificar que se puede modificar datos antes de confirmar.

**Pasos:**
1. Enviar: `"Crear materia prima maíz con código MAIZ_MOD_001"`
2. Esperar preview
3. Responder: `"Modificar"`
4. Enviar: `"El código es MAIZ_MOD_002"`
5. Esperar nuevo preview
6. Confirmar

**Resultado Esperado (Paso 3):**
```
✏️ CORINA

Indica qué dato quieres modificar o envía los nuevos datos.

Ejemplo: "Cambiar el código a MAIZ002" o "El nombre es Maíz Amarillo"
```

**Resultado Esperado (Paso 5):**
```
✅ CORINA

📋 Preview del registro a crear:

• Tipo: Materia Prima
• Código: MAIZ_MOD_002
• Nombre: Maíz

🤔 ¿Deseas crear este registro?
```

**Verificaciones:**
- ✅ CORINA permite modificar datos
- ✅ Actualiza preview con nuevos datos
- ✅ Crea registro con datos modificados

---

### Test 20: Respuesta No Reconocida

**Objetivo:** Verificar manejo de respuestas ambiguas.

**Pasos:**
1. Enviar: `"Crear materia prima maíz con código MAIZ_AMB_001"`
2. Esperar preview
3. Responder: `"Tal vez"` o `"No sé"`
4. Esperar recordatorio de opciones

**Resultado Esperado (Paso 4):**
```
🤔 CORINA

No entendí tu respuesta.

Por favor, responde:
• "Sí" o "Confirmar" para crear el registro
• "No" o "Cancelar" para cancelar
• "Modificar" para cambiar algún dato
```

**Verificaciones:**
- ✅ CORINA reconoce respuesta no válida
- ✅ Recuerda opciones disponibles
- ✅ Interacción permanece en `ESPERANDO_CONFIRMACION`

---

## 🧪 Suite de Tests: Manejo de Errores

### Test 21: Error al Crear Registro (Servicio Falla)

**Objetivo:** Verificar manejo de errores del servicio.

**Pre-requisitos:**
- Materia prima con código `MAIZ_ERROR_001` ya existe

**Pasos:**
1. Enviar: `"Crear materia prima maíz con código MAIZ_ERROR_001"`
2. Esperar preview
3. Confirmar
4. Verificar mensaje de error

**Resultado Esperado (Paso 4):**
```
❌ CORINA

Error al crear el registro:
Ya existe una materia prima con el código "MAIZ_ERROR_001". Por favor, usa un código diferente.

Por favor, intenta nuevamente o usa la aplicación web.
```

**Verificaciones:**
- ✅ Error capturado correctamente
- ✅ Mensaje de error claro y útil
- ✅ Interacción marcada como `ERROR`
- ✅ `errorMensaje` guardado en BD

---

### Test 22: Error de Cuota OpenAI

**Objetivo:** Verificar manejo de error de cuota de OpenAI.

**Pre-requisitos:**
- OpenAI API sin créditos (simular)

**Pasos:**
1. Enviar: `"Crear materia prima maíz con código MAIZ_QUOTA_001"`
2. Esperar mensaje de error de cuota

**Resultado Esperado:**
```
❌ CORINA

Lo siento, la cuota de OpenAI se ha agotado.

Por favor, intenta más tarde o usa la aplicación web para crear registros.
```

**Verificaciones:**
- ✅ Error de cuota detectado
- ✅ Mensaje informativo al usuario
- ✅ No se intenta crear registro

---

### Test 23: Error de Límite Diario Twilio

**Objetivo:** Verificar manejo de límite diario de Twilio Sandbox.

**Pre-requisitos:**
- Límite diario de Twilio Sandbox alcanzado (50 mensajes)

**Pasos:**
1. Intentar enviar cualquier mensaje después de alcanzar límite
2. Verificar que no se envía mensaje de error adicional

**Verificaciones:**
- ✅ Error capturado silenciosamente
- ✅ NO se intenta enviar mensaje de error (evita más errores)
- ✅ Log en consola del servidor

---

## 🧪 Suite de Tests: Casos Límite

### Test 24: Múltiples Consultas de la Misma Lista

**Objetivo:** Verificar que se pueden hacer múltiples consultas sin reenviar lista de granjas.

**Pre-requisitos:**
- Usuario con 2+ granjas

**Pasos:**
1. Enviar: `"Alertas"`
2. Esperar lista de granjas
3. Responder: `"1"`
4. Esperar alertas de granja 1
5. Enviar: `"Compras"`
6. Esperar compras de granja 1 (sin pedir granja nuevamente)

**Verificaciones:**
- ✅ Primera consulta muestra lista de granjas
- ✅ Consultas siguientes usan la misma selección
- ✅ Lista de granjas se mantiene en memoria por 30 minutos

---

### Test 25: Creación con Audio

**Objetivo:** Verificar creación de registro desde mensaje de audio.

**Pre-requisitos:**
- OpenAI Whisper API disponible

**Pasos:**
1. Enviar mensaje de audio por WhatsApp: `"Crear materia prima maíz con código MAIZ_AUDIO_001"`
2. Esperar transcripción
3. Esperar preview
4. Confirmar

**Verificaciones:**
- ✅ Audio transcrito correctamente
- ✅ Datos extraídos del audio
- ✅ Preview generado correctamente
- ✅ Registro creado exitosamente

**Verificación en BD:**
```sql
SELECT * FROM t_corina_interaccion 
WHERE url_audio_original IS NOT NULL 
  AND mensaje_recibido LIKE '%MAIZ_AUDIO_001%';
```

---

### Test 26: Creación con Datos Parciales en Múltiples Mensajes

**Objetivo:** Verificar que se pueden completar datos en múltiples mensajes.

**Pasos:**
1. Enviar: `"Crear materia prima maíz"`
2. Esperar solicitud de código
3. Responder: `"MAIZ_MULTI_001"`
4. Esperar preview
5. Confirmar

**Verificaciones:**
- ✅ CORINA mantiene contexto entre mensajes
- ✅ Combina datos de múltiples mensajes
- ✅ Crea registro con datos completos

---

## 📊 Checklist de Verificación Post-Tests

### Verificaciones en Base de Datos

```sql
-- Verificar todas las interacciones creadas
SELECT 
  tipo_interaccion,
  estado_interaccion,
  COUNT(*) as total
FROM t_corina_interaccion
WHERE fecha_interaccion >= '[FECHA_INICIO_TESTS]'
GROUP BY tipo_interaccion, estado_interaccion;

-- Verificar registros creados desde CORINA
SELECT 
  tabla_registro_creado,
  COUNT(*) as total_creados
FROM t_corina_interaccion
WHERE estado_interaccion = 'COMPLETADA'
  AND registro_creado_id IS NOT NULL
GROUP BY tabla_registro_creado;

-- Verificar errores
SELECT 
  tipo_interaccion,
  error_mensaje,
  COUNT(*) as total_errores
FROM t_corina_interaccion
WHERE estado_interaccion = 'ERROR'
  AND fecha_interaccion >= '[FECHA_INICIO_TESTS]'
GROUP BY tipo_interaccion, error_mensaje;
```

### Verificaciones de Funcionalidad

- ✅ Todas las consultas funcionan correctamente
- ✅ Todas las creaciones funcionan correctamente
- ✅ Preview muestra datos correctos
- ✅ Confirmación funciona (Sí/No/Modificar)
- ✅ Errores se manejan correctamente
- ✅ Datos se guardan en BD correctamente
- ✅ Servicios se usan correctamente (compras/fabricaciones)
- ✅ Inventario se actualiza correctamente
- ✅ Alertas se detectan correctamente

---

## 📝 Notas Importantes

1. **Orden de Ejecución:**
   - Ejecutar tests de consultas primero (no modifican datos)
   - Luego tests de creación (modifican datos)
   - Finalmente tests de errores y casos límite

2. **Limpieza de Datos:**
   - Los registros creados en tests deben tener códigos únicos con prefijo `_TEST_`, `_CANCEL_`, etc.
   - Después de los tests, limpiar datos de prueba:
   ```sql
   DELETE FROM t_materia_prima WHERE codigo_materia_prima LIKE '%_TEST_%';
   DELETE FROM t_proveedor WHERE codigo_proveedor LIKE '%_TEST_%';
   DELETE FROM t_corina_interaccion WHERE fecha_interaccion >= '[FECHA_INICIO_TESTS]';
   ```

3. **Tiempo de Ejecución:**
   - Cada test puede tomar 5-30 segundos (dependiendo de APIs)
   - Suite completa: ~30-60 minutos

4. **Monitoreo:**
   - Monitorear logs del servidor durante tests
   - Verificar uso de APIs (OpenAI, Twilio)
   - Verificar errores en consola

---

## 🚀 Próximos Pasos Después de Tests

1. **Análisis de Resultados:**
   - Revisar logs de errores
   - Analizar tiempos de respuesta
   - Identificar mejoras necesarias

2. **Optimizaciones:**
   - Mejorar mensajes de error
   - Optimizar prompts de GPT-3.5
   - Mejorar detección de comandos

3. **Documentación:**
   - Actualizar guías de usuario
   - Crear ejemplos de uso
   - Documentar limitaciones conocidas

---

**Documento creado:** 2025-11-22  
**Última actualización:** 2025-11-22




