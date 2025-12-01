# 🎯 Siguiente Funcionalidad: Extracción de Datos Estructurados con GPT-3.5

**Fecha:** 2025-11-22  
**Fase:** 2.4 - Extracción de Datos con GPT-3.5  
**Estado:** ⏳ **PENDIENTE**  
**Prioridad:** 🔴 **ALTA**

---

## 📋 Contexto

### Estado Actual

✅ **Completado:**
- Fase 0: Preparación y Configuración
- Fase 1: Notificaciones WhatsApp (Tarea A)
- Fase 2.1-2.3: Webhook, procesamiento de audio, transcripción
- Fase 2.4 (parcial): Detección de tipo de comando con GPT-3.5
- Fase 2.6 (parcial): Validación de datos extraídos

⏳ **Pendiente:**
- **Fase 2.4: Extracción de datos estructurados** ← **SIGUIENTE**
- Fase 2.5: Validación y confirmación completa
- Fase 2.6: Creación de registros
- Fase 2.7: Manejo de conversaciones multi-paso

---

## 🎯 Objetivo de la Funcionalidad

Implementar la función `extraerDatos()` que utiliza GPT-3.5 para extraer datos estructurados del texto transcrito (o texto directo) del usuario, según el tipo de comando detectado.

### ¿Por qué es importante?

Actualmente, CORINA puede:
- ✅ Detectar qué tipo de registro quiere crear el usuario (`CREAR_MATERIA_PRIMA`, `CREAR_PROVEEDOR`, etc.)
- ✅ Validar si los datos están completos o hay duplicados
- ❌ **NO puede extraer los datos específicos del mensaje del usuario**

**Ejemplo del problema actual:**
```
Usuario: "Crear materia prima maíz con código MAIZ001"
CORINA detecta: CREAR_MATERIA_PRIMA ✅
CORINA NO puede extraer: { codigoMateriaPrima: "MAIZ001", nombreMateriaPrima: "maíz" } ❌
```

---

## 🔧 Implementación Requerida

### Función Principal

**Archivo:** `backend/src/services/corinaService.ts`

**Función:** `extraerDatos(texto: string, tipoComando: string): Promise<DatosExtraidosNLP>`

**Estado Actual:**
```typescript
static async extraerDatos(texto: string, tipoComando: string): Promise<DatosExtraidosNLP> {
  // TODO: Implementar extracción con GPT-3.5 según el tipo de comando
  throw new Error('Funcionalidad en desarrollo');
}
```

### Tareas a Implementar

#### 1. Crear Prompts Específicos por Tipo de Registro

Para cada tipo de comando, crear un prompt optimizado que le indique a GPT-3.5 qué datos extraer:

**Ejemplo para Materia Prima:**
```typescript
const promptMateriaPrima = `Eres CORINA, un asistente de inventario para granjas. 
Extrae los siguientes datos del mensaje del usuario para crear una materia prima:

Campos requeridos:
- codigoMateriaPrima: Código único de la materia prima (ej: "MAIZ001", "SOJA002")
- nombreMateriaPrima: Nombre de la materia prima (ej: "Maíz", "Soja")

Mensaje del usuario: "${texto}"

Responde SOLO con un JSON válido en este formato:
{
  "codigoMateriaPrima": "MAIZ001",
  "nombreMateriaPrima": "Maíz"
}

Si algún campo no está presente en el mensaje, usa null para ese campo.`;
```

**Tipos de registro a implementar:**
- ✅ Materia Prima (`CREAR_MATERIA_PRIMA`)
- ✅ Proveedor (`CREAR_PROVEEDOR`)
- ✅ Animal/Pienso (`CREAR_PIENSO`)
- ✅ Fórmula (`CREAR_FORMULA`)
- ✅ Compra (`CREAR_COMPRA`)
- ✅ Fabricación (`CREAR_FABRICACION`)

#### 2. Integrar con OpenAI GPT-3.5

Usar la misma estructura que `detectarTipoComando()`:

```typescript
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const response = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [
    { role: 'system', content: prompt },
    { role: 'user', content: texto },
  ],
  response_format: { type: 'json_object' },
  temperature: 0, // Para respuestas más deterministas
});
```

#### 3. Parsear y Validar Respuesta JSON

- Parsear la respuesta JSON de GPT-3.5
- Validar estructura básica
- Mapear a formato `DatosExtraidosNLP`

#### 4. Manejar Casos Especiales

- **Datos parciales:** Si faltan campos, retornarlos como `null` o `undefined`
- **Datos ambiguos:** Si GPT-3.5 no está seguro, marcar con baja confianza
- **Errores de parsing:** Manejar errores de JSON inválido

#### 5. Integrar con Flujo Existente

La función debe integrarse en `corinaController.ts`:

```typescript
// Después de detectar el comando
const deteccion = await CorinaService.detectarTipoComando(mensaje);

if (deteccion.confianza >= 0.7 && deteccion.tipoComando.startsWith('CREAR_')) {
  // Extraer datos estructurados
  const datosExtraidos = await CorinaService.extraerDatos(
    mensaje,
    deteccion.tipoComando
  );
  
  // Validar datos extraídos
  const validacion = await CorinaService.validarDatos(
    datosExtraidos,
    idGranja
  );
  
  // Continuar con el flujo...
}
```

---

## 📊 Estructura de Datos Esperada

### Input
```typescript
{
  texto: "Crear materia prima maíz con código MAIZ001",
  tipoComando: "CREAR_MATERIA_PRIMA"
}
```

### Output
```typescript
{
  tablaDestino: "materiaPrima",
  datos: {
    codigoMateriaPrima: "MAIZ001",
    nombreMateriaPrima: "Maíz"
  },
  confianza: 0.95
}
```

---

## 🧪 Tests Requeridos

### Tests Unitarios

1. ✅ Extrae datos correctamente para materia prima
2. ✅ Extrae datos correctamente para proveedor
3. ✅ Maneja datos parciales (algunos campos faltantes)
4. ✅ Maneja mensajes ambiguos
5. ✅ Maneja errores de parsing JSON
6. ✅ Maneja errores de API de OpenAI

### Tests de Integración

1. ✅ Flujo completo: Detección → Extracción → Validación
2. ✅ Integración con controlador

---

## 📝 Ejemplos de Uso

### Ejemplo 1: Materia Prima Completa

**Input:**
```
Usuario: "Crear materia prima maíz con código MAIZ001"
```

**Proceso:**
1. `detectarTipoComando()` → `CREAR_MATERIA_PRIMA` (confianza: 0.95)
2. `extraerDatos()` → `{ codigoMateriaPrima: "MAIZ001", nombreMateriaPrima: "Maíz" }`
3. `validarDatos()` → `{ esValido: true }`
4. Continuar con creación...

### Ejemplo 2: Materia Prima Parcial

**Input:**
```
Usuario: "Crear materia prima maíz"
```

**Proceso:**
1. `detectarTipoComando()` → `CREAR_MATERIA_PRIMA` (confianza: 0.90)
2. `extraerDatos()` → `{ codigoMateriaPrima: null, nombreMateriaPrima: "Maíz" }`
3. `validarDatos()` → `{ esValido: false, camposFaltantes: ["código de materia prima"] }`
4. CORINA solicita código faltante...

### Ejemplo 3: Compra Compleja

**Input:**
```
Usuario: "Compré 100 kg de maíz a $50 por kilo del proveedor PROV001 el día de hoy"
```

**Proceso:**
1. `detectarTipoComando()` → `CREAR_COMPRA` (confianza: 0.92)
2. `extraerDatos()` → `{ 
    idProveedor: "PROV001", 
    fechaCompra: "2025-11-22",
    detalles: [{
      idMateriaPrima: "maíz", // Necesitará resolver a ID real
      cantidadComprada: 100,
      precioUnitario: 50
    }]
  }`
3. `validarDatos()` → Validar proveedor existe, materia prima existe, etc.

---

## ⚠️ Consideraciones Importantes

### 1. Resolución de Referencias

GPT-3.5 puede extraer nombres o códigos, pero necesitamos IDs reales:
- **Proveedor:** "PROV001" → Buscar `id` en BD
- **Materia Prima:** "maíz" → Buscar por nombre o código
- **Fórmula:** "FORM001" → Buscar `id` en BD
- **Animal:** "Cerdo Engorde" → Buscar por descripción

**Solución:** Después de extraer datos, hacer búsquedas en BD para resolver IDs.

### 2. Manejo de Fechas

El usuario puede decir:
- "hoy"
- "ayer"
- "el 15 de noviembre"
- "2025-11-22"

**Solución:** Usar GPT-3.5 para normalizar fechas a formato ISO.

### 3. Manejo de Cantidades y Precios

El usuario puede decir:
- "100 kg"
- "cien kilos"
- "$50"
- "cincuenta pesos"

**Solución:** Usar GPT-3.5 para extraer números y unidades, luego normalizar.

---

## 🚀 Plan de Implementación

### Día 1-2: Implementar para Materia Prima
- Crear prompt optimizado
- Implementar función básica
- Tests unitarios

### Día 3-4: Implementar para Proveedor y Animal
- Prompts específicos
- Tests

### Día 5-7: Implementar para Compra, Fórmula y Fabricación
- Prompts más complejos (con detalles)
- Resolución de referencias
- Tests

### Día 8-10: Integración y Optimización
- Integrar con controlador
- Optimizar prompts
- Tests de integración
- Documentación

---

## ✅ Criterios de Aceptación

1. ✅ La función `extraerDatos()` está implementada y funcionando
2. ✅ Soporta los 6 tipos de registro principales
3. ✅ Maneja datos parciales correctamente
4. ✅ Maneja errores de forma elegante
5. ✅ Tests unitarios pasando (≥80% coverage)
6. ✅ Tests de integración pasando
7. ✅ Integrada con el flujo existente en el controlador
8. ✅ Documentación completa

---

## 📚 Documentación Relacionada

- `PLAN_TRABAJO_CORINA.md` - Plan completo
- `ESTADO_IMPLEMENTACION_CORINA.md` - Estado actual
- `INTEGRACION_VALIDACION_CORINA.md` - Validación implementada
- `RESULTADOS_TESTS_VALIDACION_CORINA.md` - Resultados de tests

---

**Documento creado:** 2025-11-22






