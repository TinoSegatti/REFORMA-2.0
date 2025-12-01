# 📋 Fase 2.4: Detección de Tipo de Comando con GPT-3.5

**Fecha:** 2025-11-22  
**Estado:** ✅ Implementado  
**Fase:** 2.4 del Plan de Trabajo CORINA

---

## 🎯 Objetivo

Implementar sistema de detección de tipo de comando usando GPT-3.5 para clasificar mensajes del usuario y determinar qué tipo de registro quiere crear o qué acción quiere realizar.

---

## ✅ Funcionalidad Implementada

### Función `detectarTipoComando()`

**Ubicación:** `backend/src/services/corinaService.ts`

**Descripción:**
- Usa GPT-3.5-turbo para analizar el mensaje del usuario
- Clasifica la intención en uno de los tipos disponibles
- Retorna tipo de comando, nivel de confianza y razón de la clasificación

**Tipos de Comandos Soportados:**
- `CREAR_MATERIA_PRIMA`: Crear nueva materia prima
- `CREAR_PIENSO`: Crear nuevo tipo de animal/pienso
- `CREAR_PROVEEDOR`: Crear nuevo proveedor
- `CREAR_FORMULA`: Crear nueva fórmula de alimentación
- `CREAR_COMPRA`: Registrar una compra
- `CREAR_FABRICACION`: Registrar una fabricación
- `CONSULTA_ALERTAS`: Consultar alertas (ya implementado)
- `CONSULTA_INVENTARIO`: Consultar inventario (ya implementado)
- `DESCONOCIDO`: No se pudo identificar

---

## 🔧 Características Técnicas

### Prompt Optimizado

- **Temperatura:** 0.3 (respuestas más consistentes)
- **Max Tokens:** 200 (suficiente para respuesta JSON)
- **Response Format:** JSON Object (forzado)
- **Sistema de Mensajes:** Incluye contexto del sistema y prompt específico

### Manejo de Errores

1. **Error de Cuota OpenAI:**
   - Detecta `insufficient_quota` o status 429
   - Lanza error especial `QUOTA_EXCEEDED`
   - No intenta procesar más comandos

2. **Error de Parsing:**
   - Valida estructura JSON de respuesta
   - Retorna `DESCONOCIDO` con confianza 0.0 si falla

3. **Error de API:**
   - Retorna `DESCONOCIDO` con mensaje de error en la razón

### Integración con Controlador

**Ubicación:** `backend/src/controllers/corinaController.ts`

- Se llama cuando el mensaje no coincide con consultas conocidas
- Si detecta comando de creación con confianza ≥ 0.7, informa al usuario
- Si es desconocido o confianza baja, muestra mensaje de ayuda

---

## 📊 Ejemplos de Uso

### Ejemplo 1: Crear Materia Prima
```
Usuario: "Quiero crear una materia prima llamada maíz con código MAIZ001"
Respuesta GPT-3.5:
{
  "tipoComando": "CREAR_MATERIA_PRIMA",
  "confianza": 0.95,
  "razon": "El mensaje menciona explícitamente crear materia prima con nombre y código"
}
```

### Ejemplo 2: Crear Proveedor
```
Usuario: "Agregar proveedor Juan Pérez"
Respuesta GPT-3.5:
{
  "tipoComando": "CREAR_PROVEEDOR",
  "confianza": 0.90,
  "razon": "El mensaje indica agregar un proveedor con nombre específico"
}
```

### Ejemplo 3: Mensaje Ambiguo
```
Usuario: "Hola"
Respuesta GPT-3.5:
{
  "tipoComando": "DESCONOCIDO",
  "confianza": 0.20,
  "razon": "El mensaje es un saludo genérico sin intención clara de crear registro"
}
```

---

## 🧪 Testing

### Casos de Prueba Recomendados

1. **Comandos de Creación Explícitos:**
   - "Crear materia prima maíz"
   - "Registrar proveedor ABC"
   - "Agregar pienso para cerdos"

2. **Comandos de Creación Implícitos:**
   - "Compré 100 kg de soja"
   - "Fabricamos 500 kg de alimento"

3. **Consultas (deben ser ignoradas):**
   - "Ver alertas"
   - "Listado de compras"

4. **Mensajes Ambiguos:**
   - "Hola"
   - "¿Cómo estás?"

---

## 📈 Próximos Pasos

1. **Fase 2.5:** Implementar extracción de datos estructurados con GPT-3.5
2. **Fase 2.6:** Implementar validación de datos extraídos
3. **Fase 2.7:** Implementar preview y confirmación por WhatsApp
4. **Fase 2.8:** Implementar creación de registros

---

## 💰 Costos Estimados

- **Modelo:** GPT-3.5-turbo
- **Costo por llamada:** ~$0.0001 USD (promedio)
- **Tokens promedio:** ~150 tokens por detección
- **Costo mensual estimado:** $0.01-0.10 USD por usuario activo

---

## ⚠️ Limitaciones Actuales

1. **Solo detecta tipo de comando** - No extrae datos aún
2. **Confianza mínima:** 0.7 para considerar válido
3. **No procesa comandos de creación** - Solo informa que está en desarrollo

---

## 🔗 Archivos Relacionados

- `backend/src/services/corinaService.ts` - Función `detectarTipoComando()`
- `backend/src/controllers/corinaController.ts` - Integración en `procesarMensajeTexto()`
- `backend/src/types/corina.ts` - Tipos TypeScript

---

**Estado:** ✅ Implementado y listo para pruebas






