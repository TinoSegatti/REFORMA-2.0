# 📊 Análisis Técnico: Sistema CORINA (Corporate Information Assistant)

**Fecha:** 2025-01-XX  
**Versión:** 1.0  
**Plan:** ENTERPRISE exclusivo

---

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Análisis de Requerimientos](#análisis-de-requerimientos)
3. [Puntos Fuertes](#puntos-fuertes)
4. [Puntos a Mejorar](#puntos-a-mejorar)
5. [Inconsistencias Detectadas](#inconsistencias-detectadas)
6. [Viabilidad de Implementación](#viabilidad-de-implementación)
7. [Presupuesto en APIs](#presupuesto-en-apis)
8. [Tecnologías Necesarias](#tecnologías-necesarias)
9. [Arquitectura de la Funcionalidad](#arquitectura-de-la-funcionalidad)
10. [Plan de Implementación](#plan-de-implementación)

---

## 🎯 Resumen Ejecutivo

**CORINA** (Corporate Information Assistant) es un sistema de asistencia por IA que proporciona dos funcionalidades principales para usuarios del plan ENTERPRISE:

- **Tarea A:** Notificaciones automáticas vía WhatsApp cuando hay alertas de inventario (materias primas en negativo o en 0)
- **Tarea B:** Generación de registros mediante transcripción de audio en las tablas principales del sistema

### Alcance del Sistema

**Tablas soportadas para creación por voz:**
- ✅ Materias Primas
- ✅ Piensos (Animales)
- ✅ Proveedores
- ✅ Fórmulas
- ⚠️ Compras (requiere validación backend)
- ⚠️ Fabricaciones (requiere validación backend)

**Restricciones importantes:**
- Compras y Fabricaciones NO se insertan directamente en BD
- Deben pasar por los servicios del backend para cálculos de inventario y precios
- Requiere validación de datos antes de creación

---

## 📝 Análisis de Requerimientos

### Tarea A: Notificaciones WhatsApp

#### Requerimientos Funcionales
1. Monitoreo continuo de inventario
2. Detección de materias primas en negativo o cero
3. Envío de notificación WhatsApp al usuario dueño
4. Incluir información relevante (materia prima, cantidad, granja)

#### Requerimientos Técnicos
- Número de teléfono para cada cliente ENTERPRISE
- Integración con API de WhatsApp Business
- Sistema de monitoreo en tiempo real o periódico
- Base de datos para almacenar números de teléfono

#### Requerimientos de Negocio
- Solo disponible para plan ENTERPRISE
- Validar que el usuario tenga número de teléfono registrado
- Opción de activar/desactivar notificaciones

### Tarea B: Generación de Registros por Voz

#### Requerimientos Funcionales
1. Interfaz de chat con CORINA
2. Grabación de audio desde el navegador
3. Transcripción de audio a texto
4. Extracción de entidades y datos estructurados
5. Validación de datos completos y correctos
6. Preview de datos antes de crear
7. Confirmación del usuario
8. Creación del registro (directo o vía backend según tabla)

#### Requerimientos Técnicos
- API de transcripción de audio (Speech-to-Text)
- API de procesamiento de lenguaje natural (NLP)
- Sistema de validación de datos
- Interfaz de chat en tiempo real
- Almacenamiento temporal de datos antes de confirmación

#### Requerimientos de Negocio
- Solo disponible para plan ENTERPRISE
- Validar permisos del usuario sobre la granja
- Historial de interacciones con CORINA
- Opción de cancelar creación

---

## ✅ Puntos Fuertes

### 1. Diferenciación Competitiva
- **Ventaja:** Funcionalidad única en el mercado de gestión de granjas
- **Impacto:** Aumenta el valor percibido del plan ENTERPRISE
- **ROI:** Justifica el precio premium del plan

### 2. Mejora de UX
- **Ventaja:** Permite registro rápido sin necesidad de formularios complejos
- **Impacto:** Reduce tiempo de registro de datos en campo
- **Casos de uso:** Ideal para usuarios que trabajan en granjas sin acceso fácil a computadora

### 3. Automatización de Alertas
- **Ventaja:** Notificaciones proactivas evitan problemas de inventario
- **Impacto:** Reduce pérdidas por falta de materias primas
- **Prevención:** Alertas tempranas permiten acción preventiva

### 4. Integración con Backend Existente
- **Ventaja:** Respeta la lógica de negocio existente
- **Impacto:** Compras y fabricaciones pasan por validaciones y cálculos correctos
- **Consistencia:** Mantiene integridad de datos y cálculos de inventario

### 5. Escalabilidad
- **Ventaja:** Arquitectura basada en APIs permite escalar
- **Impacto:** Puede manejar múltiples usuarios simultáneos
- **Crecimiento:** Fácil agregar nuevas funcionalidades

---

## ⚠️ Puntos a Mejorar

### 1. Precisión de Transcripción
- **Problema:** APIs de transcripción pueden tener errores con términos técnicos
- **Impacto:** Datos incorrectos pueden generar registros erróneos
- **Solución:** Sistema de validación robusto + diccionario de términos técnicos

### 2. Costos de APIs
- **Problema:** APIs de transcripción y NLP tienen costos asociados
- **Impacto:** Puede aumentar costos operativos significativamente
- **Solución:** Implementar caché de transcripciones, límites de uso, optimización de llamadas

### 3. Dependencia de Servicios Externos
- **Problema:** Dependencia de APIs de terceros (WhatsApp, Speech-to-Text, NLP)
- **Impacto:** Fallos en servicios externos afectan funcionalidad
- **Solución:** Implementar fallbacks, colas de reintento, notificaciones alternativas

### 4. Complejidad de Datos
- **Problema:** Algunas tablas tienen relaciones complejas (fórmulas, compras, fabricaciones)
- **Impacto:** Difícil extraer toda la información necesaria de un audio
- **Solución:** Flujo de confirmación paso a paso, preguntas de clarificación

### 5. Seguridad y Privacidad
- **Problema:** Audios pueden contener información sensible
- **Impacto:** Riesgo de exposición de datos
- **Solución:** Encriptación de audios, eliminación después de procesar, cumplimiento GDPR

### 6. Soporte Multiidioma
- **Problema:** Transcripción puede requerir idioma específico
- **Impacto:** Limitación para usuarios que hablan otros idiomas
- **Solución:** Detección automática de idioma, soporte multiidioma

---

## 🔍 Inconsistencias Detectadas

### 1. **Inconsistencia: Número de Teléfono**
- **Problema:** No existe campo `telefono` en el modelo `Usuario` del schema
- **Impacto:** No se puede almacenar número de WhatsApp
- **Solución Requerida:** Agregar campo `telefono` y `telefonoVerificado` al modelo Usuario

### 2. **Inconsistencia: Validación de Plan**
- **Problema:** No hay middleware específico para validar acceso a funcionalidades ENTERPRISE
- **Impacto:** Necesario crear validación específica
- **Solución Requerida:** Crear middleware `validateEnterpriseFeature`

### 3. **Inconsistencia: Flujo de Compras/Fabricaciones**
- **Problema:** El requerimiento indica que NO deben insertarse directamente, pero no especifica el flujo exacto
- **Impacto:** Necesario definir si CORINA llama a los endpoints existentes o crea un nuevo flujo
- **Solución Requerida:** CORINA debe usar los servicios existentes (`crearCompra`, `crearFabricacion`)

### 4. **Inconsistencia: Historial de CORINA**
- **Problema:** No existe tabla para almacenar historial de interacciones con CORINA
- **Impacto:** No se puede auditar ni mejorar el sistema
- **Solución Requerida:** Crear modelo `CorinaInteraccion` en Prisma

### 5. **Inconsistencia: Estados de Validación**
- **Problema:** No está claro cómo manejar estados intermedios (audio transcrito, datos extraídos, validación pendiente, confirmación pendiente)
- **Impacto:** Puede generar estados inconsistentes
- **Solución Requerida:** Implementar máquina de estados para el flujo de CORINA

---

## 🎯 Viabilidad de Implementación

### Viabilidad Técnica: ✅ **ALTA**

**Razones:**
1. Tecnologías maduras y disponibles
2. APIs de terceros bien documentadas
3. Arquitectura del sistema permite integración
4. Backend ya tiene servicios para crear registros

**Riesgos Técnicos:**
- **Medio:** Precisión de transcripción con términos técnicos
- **Bajo:** Integración con WhatsApp Business API
- **Medio:** Extracción de datos estructurados de texto libre

### Viabilidad Económica: ⚠️ **MEDIA**

**Razones:**
1. Costos de APIs pueden ser significativos a escala
2. Requiere infraestructura adicional (servidor para procesar audios)
3. Mantenimiento continuo necesario

**Mitigación:**
- Usar APIs gratuitas para pruebas iniciales
- Implementar límites de uso por usuario
- Optimizar llamadas a APIs (caché, batch processing)

### Viabilidad Operativa: ✅ **ALTA**

**Razones:**
1. Mejora significativa de UX
2. Diferencia competitiva clara
3. Alineado con necesidades del mercado

**Consideraciones:**
- Necesario entrenamiento de usuarios
- Soporte técnico para resolver problemas de transcripción
- Monitoreo continuo de calidad

### Viabilidad Temporal: ⚠️ **MEDIA**

**Estimación de Desarrollo:**
- **Tarea A (WhatsApp):** 2-3 semanas
- **Tarea B (Voz):** 6-8 semanas
- **Total:** 8-11 semanas (2-3 meses)

**Factores que afectan:**
- Complejidad de integración con backend existente
- Tiempo de pruebas y ajustes de precisión
- Configuración de APIs externas

---

## 💰 Presupuesto en APIs

### Objetivo: $0 para Pruebas

### APIs Necesarias y Alternativas Gratuitas

#### 1. **Transcripción de Audio (Speech-to-Text)**

**Opción 1: Web Speech API (Navegador) - ✅ GRATIS**
- **Costo:** $0
- **Límites:** Sin límites oficiales, depende del navegador
- **Ventajas:** 
  - Sin costo
  - No requiere servidor
  - Funciona offline (con limitaciones)
- **Desventajas:**
  - Solo funciona en navegadores compatibles
  - Calidad variable según navegador
  - Requiere conexión para mejor precisión
- **Recomendación:** ✅ Usar para MVP y pruebas

**Opción 2: OpenAI Whisper API - ⚠️ GRATIS con límites**
- **Costo:** $0.006 por minuto (muy económico)
- **Límites:** Sin límite de uso, solo costo por uso
- **Ventajas:**
  - Excelente precisión
  - Soporte multiidioma
  - API estable y confiable
- **Desventajas:**
  - Requiere servidor backend
  - Costo acumulativo
- **Recomendación:** ✅ Usar para producción (costo muy bajo)

**Opción 3: Google Cloud Speech-to-Text - ⚠️ GRATIS con créditos**
- **Costo:** $0.006 por 15 segundos (primeros 60 minutos gratis/mes)
- **Límites:** 60 minutos gratis/mes, luego pago
- **Ventajas:**
  - Excelente precisión
  - Soporte multiidioma
  - Integración con otros servicios Google
- **Desventajas:**
  - Requiere configuración de cuenta Google Cloud
  - Créditos gratuitos limitados
- **Recomendación:** ⚠️ Considerar para producción

**Opción 4: Azure Speech Services - ⚠️ GRATIS con límites**
- **Costo:** $0.01 por minuto (primeros 5 horas gratis/mes)
- **Límites:** 5 horas gratis/mes, luego pago
- **Ventajas:**
  - Buena precisión
  - Integración con otros servicios Azure
- **Desventajas:**
  - Créditos gratuitos limitados
- **Recomendación:** ⚠️ Alternativa secundaria

**Recomendación Final:** 
- **Pruebas:** Web Speech API (navegador) - $0
- **Producción:** OpenAI Whisper API - ~$0.006/minuto (muy económico)

#### 2. **Procesamiento de Lenguaje Natural (NLP)**

**Opción 1: OpenAI GPT-4/GPT-3.5-turbo - ⚠️ GRATIS con créditos**
- **Costo:** GPT-3.5-turbo: $0.0015 por 1K tokens (primeros $5 gratis)
- **Límites:** $5 de crédito gratis al registrarse
- **Ventajas:**
  - Excelente para extracción de entidades
  - Entiende contexto
  - Puede hacer validaciones
- **Desventajas:**
  - Créditos gratuitos limitados
  - Costo acumulativo
- **Recomendación:** ✅ Usar para MVP y producción (costo muy bajo)

**Opción 2: Google Cloud Natural Language API - ⚠️ GRATIS con créditos**
- **Costo:** $0.50 por 1,000 unidades (primeros 5,000 unidades gratis/mes)
- **Límites:** 5,000 unidades gratis/mes
- **Ventajas:**
  - Buena extracción de entidades
  - Integración con otros servicios Google
- **Desventajas:**
  - Créditos gratuitos limitados
- **Recomendación:** ⚠️ Alternativa secundaria

**Opción 3: Regex + Parser Personalizado - ✅ GRATIS**
- **Costo:** $0
- **Límites:** Ninguno
- **Ventajas:**
  - Control total
  - Sin costos
  - Predecible
- **Desventajas:**
  - Requiere desarrollo significativo
  - Menos flexible que IA
  - Necesita mantenimiento
- **Recomendación:** ⚠️ Solo para casos muy específicos

**Recomendación Final:**
- **Pruebas:** OpenAI GPT-3.5-turbo con créditos gratuitos - $0 inicial
- **Producción:** OpenAI GPT-3.5-turbo - ~$0.0015 por 1K tokens (muy económico)

#### 3. **WhatsApp Business API**

**Opción 1: Twilio WhatsApp API - ⚠️ GRATIS con créditos**
- **Costo:** $0.005 por mensaje (primeros $15.50 gratis)
- **Límites:** $15.50 de crédito gratis al registrarse (~3,100 mensajes)
- **Ventajas:**
  - Fácil integración
  - API estable
  - Buena documentación
- **Desventajas:**
  - Créditos gratuitos limitados
  - Requiere número de teléfono verificado
- **Recomendación:** ✅ Usar para MVP y producción

**Opción 2: WhatsApp Business Cloud API (Meta) - ⚠️ GRATIS con límites**
- **Costo:** Gratis hasta 1,000 conversaciones/mes, luego $0.005-0.09 por conversación
- **Límites:** 1,000 conversaciones gratis/mes
- **Ventajas:**
  - Oficial de Meta
  - Sin costo inicial
- **Desventajas:**
  - Proceso de verificación más complejo
  - Límites en versión gratuita
- **Recomendación:** ⚠️ Considerar para producción a largo plazo

**Opción 3: WhatsApp Business API (On-Premise) - ❌ NO GRATIS**
- **Costo:** Requiere servidor propio + licencias
- **Límites:** Depende de infraestructura
- **Ventajas:**
  - Control total
  - Sin límites de uso
- **Desventajas:**
  - Costo de infraestructura
  - Mantenimiento complejo
- **Recomendación:** ❌ No recomendado para MVP

**Recomendación Final:**
- **Pruebas:** Twilio WhatsApp API con créditos gratuitos - $0 inicial
- **Producción:** Twilio WhatsApp API - $0.005 por mensaje (muy económico)

### Resumen de Costos Estimados

#### Escenario de Pruebas (MVP) - **$0**
- Web Speech API: $0
- OpenAI GPT-3.5-turbo (créditos gratis): $0
- Twilio WhatsApp (créditos gratis): $0
- **Total MVP:** $0

#### Escenario de Producción (100 usuarios ENTERPRISE activos)

**Suposiciones:**
- 10 transcripciones por usuario/mes (promedio 2 minutos cada una)
- 5 mensajes WhatsApp por usuario/mes
- 10 procesamientos NLP por usuario/mes (promedio 500 tokens cada uno)

**Cálculos:**
- Transcripción (Whisper): 100 usuarios × 10 transcripciones × 2 min × $0.006 = **$12/mes**
- NLP (GPT-3.5): 100 usuarios × 10 procesamientos × 500 tokens × $0.0015/1K = **$0.75/mes**
- WhatsApp (Twilio): 100 usuarios × 5 mensajes × $0.005 = **$2.50/mes**

**Total Producción:** **~$15.25/mes** para 100 usuarios ENTERPRISE

**Costo por usuario:** **~$0.15/mes** (muy bajo)

---

## 🛠️ Tecnologías Necesarias

### Frontend

#### 1. **Grabación de Audio**
- **Tecnología:** Web Audio API / MediaRecorder API
- **Librería:** `react-audio-voice-recorder` o `react-media-recorder`
- **Compatibilidad:** Navegadores modernos (Chrome, Firefox, Safari, Edge)

#### 2. **Interfaz de Chat**
- **Tecnología:** React + WebSockets o Server-Sent Events
- **Librería:** `socket.io-client` o `@microsoft/signalr`
- **UI:** Componente de chat personalizado o librería como `react-chat-elements`

#### 3. **Transcripción en Cliente (Opcional)**
- **Tecnología:** Web Speech API
- **Librería:** `react-speech-recognition` o implementación nativa
- **Uso:** Para transcripción rápida sin enviar audio al servidor

### Backend

#### 1. **API de Transcripción**
- **Tecnología:** Node.js + Express
- **Integración:** OpenAI Whisper API o Google Cloud Speech-to-Text
- **Librería:** `openai` SDK o `@google-cloud/speech`

#### 2. **Procesamiento NLP**
- **Tecnología:** Node.js + Express
- **Integración:** OpenAI GPT-3.5-turbo o GPT-4
- **Librería:** `openai` SDK

#### 3. **WhatsApp Integration**
- **Tecnología:** Node.js + Express
- **Integración:** Twilio WhatsApp API
- **Librería:** `twilio` SDK

#### 4. **WebSockets**
- **Tecnología:** Socket.io o WebSockets nativos
- **Uso:** Comunicación en tiempo real entre frontend y backend
- **Librería:** `socket.io` o `ws`

#### 5. **Procesamiento de Archivos de Audio**
- **Tecnología:** Node.js
- **Librería:** `multer` (ya existe en el proyecto) + `fluent-ffmpeg` (si se necesita conversión)

#### 6. **Cola de Trabajos**
- **Tecnología:** Bull o BullMQ (ya existe node-cron en el proyecto)
- **Uso:** Procesar transcripciones y notificaciones de forma asíncrona
- **Librería:** `bull` o `bullmq`

### Base de Datos

#### 1. **Modelos Nuevos**
- **CorinaInteraccion:** Historial de interacciones
- **CorinaTranscripcion:** Transcripciones temporales
- **Campo Usuario:** `telefono`, `telefonoVerificado`, `notificacionesWhatsAppActivas`

### Infraestructura

#### 1. **Almacenamiento de Audios Temporales**
- **Opción 1:** Sistema de archivos local (desarrollo)
- **Opción 2:** AWS S3 o Google Cloud Storage (producción)
- **Librería:** `aws-sdk` o `@google-cloud/storage`

#### 2. **Variables de Entorno**
```env
# OpenAI
OPENAI_API_KEY=sk-...

# Twilio
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=whatsapp:+...

# Opcional: Google Cloud
GOOGLE_CLOUD_PROJECT_ID=...
GOOGLE_APPLICATION_CREDENTIALS=...

# Storage (si se usa)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...
```

---

## 🏗️ Arquitectura de la Funcionalidad

### Diagrama de Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐         ┌──────────────────┐            │
│  │  Chat Component  │─────────▶│ Audio Recorder   │            │
│  │  (CORINA UI)     │         │  Component       │            │
│  └──────────────────┘         └──────────────────┘            │
│         │                              │                        │
│         │ WebSocket                    │ Audio Blob            │
│         ▼                              ▼                        │
└─────────┼──────────────────────────────┼───────────────────────┘
          │                              │
          │                              │
┌─────────┼──────────────────────────────┼───────────────────────┐
│         │                              │      BACKEND (Node.js) │
│         │                              │                        │
│  ┌──────▼──────────┐         ┌────────▼──────────┐            │
│  │ WebSocket       │         │ Audio Upload       │            │
│  │ Server          │         │ Endpoint           │            │
│  └──────┬──────────┘         └────────┬──────────┘            │
│         │                              │                        │
│         │                              ▼                        │
│         │                   ┌──────────────────┐               │
│         │                   │ Audio Storage     │               │
│         │                   │ (Temp)           │               │
│         │                   └────────┬─────────┘               │
│         │                            │                         │
│         │                            ▼                         │
│         │                   ┌──────────────────┐               │
│         │                   │ Transcription    │               │
│         │                   │ Service          │               │
│         │                   │ (Whisper API)    │               │
│         │                   └────────┬─────────┘               │
│         │                            │                         │
│         │                            ▼                         │
│         │                   ┌──────────────────┐               │
│         │                   │ NLP Service      │               │
│         │                   │ (GPT-3.5)         │               │
│         │                   └────────┬─────────┘               │
│         │                            │                         │
│         │                            ▼                         │
│         │                   ┌──────────────────┐               │
│         │                   │ Validation       │               │
│         │                   │ Service          │               │
│         │                   └────────┬─────────┘               │
│         │                            │                         │
│         │                            ▼                         │
│         │         ┌──────────────────┴──────────────────┐     │
│         │         │                                      │     │
│         │         ▼                                      ▼     │
│         │  ┌──────────────┐                    ┌──────────────┐ │
│         │  │ Direct      │                    │ Via Backend  │ │
│         │  │ Create      │                    │ Service      │ │
│         │  │ (Materias,  │                    │ (Compras,    │ │
│         │  │  Piensos,   │                    │  Fabricac.)  │ │
│         │  │  Proveed.)  │                    │              │ │
│         │  └──────────────┘                    └──────────────┘ │
│         │         │                                      │     │
│         │         └──────────────┬─────────────────────┘     │
│         │                        ▼                            │
│         │              ┌──────────────────┐                  │
│         │              │ Database (Prisma)│                  │
│         │              └──────────────────┘                  │
│         │                                                    │
│         └────────────────────────────────────────────────────│
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          WhatsApp Notification Service                │   │
│  │  (Monitorea inventario → Envía alertas)              │   │
│  └──────────────────┬──────────────────────────────────┘   │
│                     │                                        │
│                     ▼                                        │
│            ┌──────────────────┐                             │
│            │ Twilio WhatsApp  │                             │
│            │ API              │                             │
│            └──────────────────┘                             │
└────────────────────────────────────────────────────────────┘
```

### Flujo Detallado: Tarea A (Notificaciones WhatsApp)

```
1. Job Programado (Cron)
   │
   ├─▶ Ejecuta cada X minutos (ej: cada 15 min)
   │
   ├─▶ Consulta inventario de todas las granjas ENTERPRISE
   │
   ├─▶ Filtra materias primas con cantidadReal <= 0
   │
   ├─▶ Para cada alerta encontrada:
   │   │
   │   ├─▶ Verifica si usuario tiene telefonoVerificado = true
   │   │
   │   ├─▶ Verifica si notificacionesWhatsAppActivas = true
   │   │
   │   ├─▶ Verifica si ya se envió notificación reciente (evitar spam)
   │   │
   │   └─▶ Envía mensaje WhatsApp vía Twilio
   │       │
   │       └─▶ Mensaje: "⚠️ Alerta de Inventario: [Materia Prima] 
   │                     está en [cantidad] kg en [Granja]. 
   │                     Fecha: [fecha]"
   │
   └─▶ Registra notificación en base de datos (auditoría)
```

### Flujo Detallado: Tarea B (Creación por Voz)

```
1. Usuario inicia chat con CORINA
   │
   ├─▶ Frontend muestra interfaz de chat
   │
   ├─▶ Usuario presiona botón "Grabar Audio"
   │
   ├─▶ Navegador graba audio (MediaRecorder API)
   │
   ├─▶ Usuario termina grabación
   │
   ├─▶ Audio se envía al backend (WebSocket o HTTP)
   │
   ├─▶ Backend guarda audio temporalmente
   │
   ├─▶ Backend envía audio a API de transcripción (Whisper)
   │
   ├─▶ API devuelve texto transcrito
   │
   ├─▶ Backend envía texto a GPT-3.5 para extracción de datos
   │   │
   │   ├─▶ Prompt: "Extrae los siguientes datos del texto: 
   │   │            [estructura de datos según tabla]"
   │   │
   │   └─▶ GPT devuelve JSON estructurado
   │
   ├─▶ Backend valida datos extraídos
   │   │
   │   ├─▶ Verifica campos requeridos
   │   ├─▶ Verifica tipos de datos
   │   ├─▶ Verifica relaciones (IDs existen)
   │   └─▶ Verifica permisos del usuario
   │
   ├─▶ Backend envía preview al frontend vía WebSocket
   │   │
   │   └─▶ Mensaje: "CORINA: Voy a crear [tipo de registro] 
   │                  con los siguientes datos: [preview]. 
   │                  ¿Confirmas?"
   │
   ├─▶ Usuario confirma o cancela
   │
   ├─▶ Si confirma:
   │   │
   │   ├─▶ Si es MateriaPrima/Pienso/Proveedor/Formula:
   │   │   └─▶ Crear directamente en BD (Prisma)
   │   │
   │   └─▶ Si es Compra/Fabricacion:
   │       └─▶ Llamar a servicio existente 
   │           (crearCompra/crearFabricacion)
   │           │
   │           └─▶ Servicio realiza cálculos y crea registro
   │
   ├─▶ Backend confirma creación al frontend
   │
   └─▶ Frontend muestra mensaje de éxito
```

### Modelos de Base de Datos Nuevos

```prisma
model CorinaInteraccion {
  id                String   @id @default(cuid())
  idUsuario         String
  idGranja          String
  tipoInteraccion   String   // "CREAR_MATERIA_PRIMA", "CREAR_COMPRA", etc.
  audioUrl          String?  // URL del audio (si se guarda)
  textoTranscrito   String?  // Texto transcrito del audio
  datosExtraidos    Json?    // JSON con datos extraídos por NLP
  datosValidados    Json?    // JSON con datos validados
  estado            String   // "PENDIENTE", "VALIDADO", "CONFIRMADO", "CREADO", "CANCELADO"
  idRegistroCreado  String?  // ID del registro creado (si aplica)
  mensajes          Json[]   // Array de mensajes del chat
  fechaCreacion     DateTime @default(now())
  fechaActualizacion DateTime @updatedAt
  
  usuario Usuario @relation(fields: [idUsuario], references: [id])
  granja  Granja  @relation(fields: [idGranja], references: [id])
  
  @@index([idUsuario])
  @@index([idGranja])
  @@index([estado])
  @@map("t_corina_interaccion")
}

model CorinaNotificacion {
  id                String   @id @default(cuid())
  idUsuario         String
  idGranja          String
  idMateriaPrima     String
  cantidadReal      Float
  tipoAlerta         String   // "NEGATIVO", "CERO"
  mensajeEnviado     String
  fechaEnviado       DateTime @default(now())
  estadoEnvio        String   // "ENVIADO", "FALLIDO", "PENDIENTE"
  idTwilioMessage    String?  // ID del mensaje en Twilio
  
  usuario     Usuario     @relation(fields: [idUsuario], references: [id])
  granja      Granja      @relation(fields: [idGranja], references: [id])
  materiaPrima MateriaPrima @relation(fields: [idMateriaPrima], references: [id])
  
  @@index([idUsuario])
  @@index([idGranja])
  @@index([fechaEnviado])
  @@map("t_corina_notificacion")
}
```

### Cambios en Modelo Usuario

```prisma
model Usuario {
  // ... campos existentes ...
  
  // Campos nuevos para CORINA
  telefono                    String?
  telefonoVerificado          Boolean  @default(false)
  notificacionesWhatsAppActivas Boolean @default(false)
  codigoVerificacionTelefono  String?
  fechaVerificacionTelefono   DateTime?
  
  // Relaciones nuevas
  corinaInteracciones CorinaInteraccion[]
  corinaNotificaciones CorinaNotificacion[]
}
```

### Integración con Backend Existente

#### 1. **Servicios Existentes a Utilizar**

**Para Compras:**
```typescript
// backend/src/services/compraService.ts
export async function crearCompra(params: CrearCompraParams)
```
- CORINA llamará a este servicio después de extraer datos del audio
- El servicio ya realiza:
  - Validación de datos
  - Cálculo de totales
  - Actualización de inventario
  - Recalculación de precios

**Para Fabricaciones:**
```typescript
// backend/src/services/fabricacionService.ts
export async function crearFabricacion(params: CrearFabricacionParams)
```
- CORINA llamará a este servicio después de extraer datos del audio
- El servicio ya realiza:
  - Validación de datos
  - Cálculo de costos
  - Actualización de inventario
  - Validación de existencias

#### 2. **Nuevos Servicios a Crear**

**CorinaService:**
```typescript
// backend/src/services/corinaService.ts

// Transcripción de audio
async function transcribirAudio(audioBuffer: Buffer): Promise<string>

// Extracción de datos con NLP
async function extraerDatos(texto: string, tipoRegistro: string): Promise<any>

// Validación de datos extraídos
async function validarDatos(datos: any, tipoRegistro: string): Promise<ValidationResult>

// Crear registro según tipo
async function crearRegistroPorVoz(datos: any, tipoRegistro: string, idUsuario: string, idGranja: string)
```

**CorinaNotificacionService:**
```typescript
// backend/src/services/corinaNotificacionService.ts

// Monitorear inventario y enviar alertas
async function monitorearInventarioYNotificar()

// Enviar notificación WhatsApp
async function enviarNotificacionWhatsApp(idUsuario: string, mensaje: string): Promise<boolean>

// Verificar si debe enviar notificación (evitar spam)
async function debeEnviarNotificacion(idUsuario: string, idMateriaPrima: string): Promise<boolean>
```

### Endpoints Nuevos

```typescript
// backend/src/routes/corinaRoutes.ts

POST   /api/corina/transcribir          // Subir audio y transcribir
POST   /api/corina/extraer-datos        // Extraer datos de texto
POST   /api/corina/validar-datos        // Validar datos extraídos
POST   /api/corina/crear-registro        // Crear registro confirmado
GET    /api/corina/historial            // Obtener historial de interacciones
GET    /api/corina/historial/:id        // Obtener interacción específica

// WebSocket
WS     /api/corina/chat                 // Conexión WebSocket para chat en tiempo real

// WhatsApp (solo configuración, las notificaciones son automáticas)
POST   /api/corina/whatsapp/verificar-telefono  // Verificar número de teléfono
PUT    /api/corina/whatsapp/configurar          // Activar/desactivar notificaciones
GET    /api/corina/whatsapp/notificaciones      // Obtener historial de notificaciones
```

### Middleware Nuevo

```typescript
// backend/src/middleware/validateEnterpriseFeature.ts

export async function validateEnterpriseFeature(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  // Verificar que el usuario tenga plan ENTERPRISE
  // O que sea empleado de un dueño con plan ENTERPRISE
}
```

---

## 📅 Plan de Implementación

### Fase 1: Preparación (Semana 1)

**Tareas:**
1. ✅ Actualizar schema Prisma con nuevos modelos
2. ✅ Crear migraciones de base de datos
3. ✅ Configurar variables de entorno para APIs
4. ✅ Crear estructura de carpetas para servicios CORINA
5. ✅ Investigar y probar APIs gratuitas

**Entregables:**
- Schema actualizado
- Migraciones creadas
- Documentación de APIs

### Fase 2: Tarea A - Notificaciones WhatsApp (Semanas 2-3)

**Tareas:**
1. Implementar servicio de monitoreo de inventario
2. Integrar Twilio WhatsApp API
3. Crear job programado para monitoreo
4. Implementar sistema de verificación de teléfono
5. Crear endpoints de configuración
6. Implementar prevención de spam
7. Testing y ajustes

**Entregables:**
- Servicio de notificaciones funcionando
- Job programado ejecutándose
- Endpoints de configuración
- Tests unitarios y de integración

### Fase 3: Tarea B - Transcripción y NLP (Semanas 4-6)

**Tareas:**
1. Implementar componente de grabación de audio en frontend
2. Crear interfaz de chat con CORINA
3. Implementar servicio de transcripción (Whisper)
4. Implementar servicio de extracción de datos (GPT-3.5)
5. Crear sistema de validación de datos
6. Implementar preview y confirmación
7. Integrar con servicios existentes (compras/fabricaciones)
8. Testing y ajustes

**Entregables:**
- Interfaz de chat funcionando
- Transcripción de audio funcionando
- Extracción de datos funcionando
- Creación de registros funcionando
- Tests unitarios y de integración

### Fase 4: Integración y Optimización (Semanas 7-8)

**Tareas:**
1. Integrar ambas tareas
2. Optimizar llamadas a APIs (caché, batch)
3. Implementar manejo de errores robusto
4. Mejorar precisión de extracción de datos
5. Agregar diccionario de términos técnicos
6. Implementar historial de interacciones
7. Testing end-to-end
8. Documentación de usuario

**Entregables:**
- Sistema completo funcionando
- Optimizaciones implementadas
- Documentación completa
- Tests end-to-end pasando

### Fase 5: Testing y Ajustes (Semanas 9-10)

**Tareas:**
1. Testing con usuarios reales
2. Ajustes de precisión
3. Optimización de costos
4. Mejoras de UX
5. Corrección de bugs
6. Preparación para producción

**Entregables:**
- Sistema listo para producción
- Documentación actualizada
- Plan de monitoreo

---

## 🔒 Consideraciones de Seguridad

### 1. **Protección de Audios**
- Audios se eliminan después de procesar (máximo 24 horas)
- Audios se almacenan encriptados
- Acceso restringido solo al usuario propietario

### 2. **Validación de Datos**
- Todos los datos extraídos se validan antes de crear
- Verificación de permisos del usuario
- Verificación de relaciones (IDs existen)

### 3. **Rate Limiting**
- Límite de transcripciones por usuario/día
- Límite de mensajes WhatsApp por usuario/día
- Prevención de spam

### 4. **Privacidad**
- Números de teléfono encriptados en BD
- Historial de interacciones solo accesible por el usuario
- Cumplimiento GDPR

---

## 📊 Métricas de Éxito

### Técnicas
- Precisión de transcripción > 90%
- Precisión de extracción de datos > 85%
- Tiempo de respuesta < 5 segundos
- Disponibilidad > 99%

### Negocio
- Adopción por usuarios ENTERPRISE > 60%
- Reducción de tiempo de registro de datos > 50%
- Satisfacción de usuarios > 4/5
- Reducción de problemas de inventario > 30%

---

## 🎯 Conclusiones

### Viabilidad General: ✅ **ALTA**

El sistema CORINA es **técnicamente viable** y **económicamente sostenible**:

1. **Tecnologías maduras:** APIs disponibles y bien documentadas
2. **Costos bajos:** ~$0.15 por usuario/mes en producción
3. **Diferencia competitiva:** Funcionalidad única en el mercado
4. **Mejora de UX:** Reduce tiempo de registro significativamente
5. **Integración limpia:** Respeta arquitectura existente

### Recomendaciones

1. **MVP:** Implementar con APIs gratuitas para validar concepto
2. **Producción:** Migrar a APIs de pago (muy económicas) para mejor precisión
3. **Faseado:** Implementar Tarea A primero (más simple), luego Tarea B
4. **Testing:** Invertir tiempo en testing con usuarios reales
5. **Monitoreo:** Implementar métricas desde el inicio

### Riesgos Principales

1. **Precisión de transcripción:** Mitigar con diccionario de términos técnicos
2. **Costos a escala:** Mitigar con límites de uso y optimizaciones
3. **Dependencia de APIs:** Mitigar con fallbacks y colas de reintento

---

**Documento creado por:** Sistema de análisis técnico  
**Última actualización:** 2025-01-XX  
**Versión:** 1.0

