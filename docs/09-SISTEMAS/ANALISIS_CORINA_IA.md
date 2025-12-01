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
- **Tarea B:** Generación de registros mediante conversación completa por WhatsApp (audio o texto)

**⚠️ IMPORTANTE:** Toda la conversación con CORINA se realiza **exclusivamente por WhatsApp**. La aplicación web solo muestra los registros creados y el historial de interacciones, pero NO tiene interfaz de chat.

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
1. **Detección de nuevas alertas** cuando se crea/modifica un registro de inventario
2. **Envío automático** de notificación WhatsApp solo cuando se detecta una nueva alerta (materia prima en negativo o cero)
3. **Consulta bajo demanda** por WhatsApp: Usuario puede solicitar listado de alertas con comando de voz/texto
4. Incluir información relevante (materia prima, cantidad, granja)

#### Requerimientos Técnicos
- Número de teléfono para cada cliente ENTERPRISE
- Integración con API de WhatsApp Business
- **Sistema de detección de alertas en tiempo real** (cuando se actualiza inventario)
- **Sistema de procesamiento de comandos de voz/texto** para consultas bajo demanda
- Base de datos para almacenar números de teléfono
- **Base de datos para rastrear alertas ya notificadas** (evitar duplicados)

#### Requerimientos de Negocio
- Solo disponible para plan ENTERPRISE
- Validar que el usuario tenga número de teléfono registrado
- Opción de activar/desactivar notificaciones automáticas
- **Comandos soportados:**
  - "CORINA, envíame un listado de todas las alertas del inventario de la granja [NOMBRE_GRANJA]"
  - "CORINA, alertas de inventario"
  - "CORINA, qué materias primas están en cero"

### Tarea B: Generación de Registros por Voz

#### Requerimientos Funcionales
1. **Conversación completa por WhatsApp** (NO en la aplicación web)
2. Envío de audio/mensajes de texto por WhatsApp
3. Recepción de mensajes WhatsApp en el backend
4. Transcripción de audio a texto (si se envía audio)
5. Extracción de entidades y datos estructurados
6. Validación de datos completos y correctos
7. Preview de datos enviado por WhatsApp al usuario
8. Confirmación del usuario vía WhatsApp
9. Creación del registro (directo o vía backend según tabla)
10. **Sincronización de datos creados con la aplicación web** (mostrar en la app los registros creados por WhatsApp)

#### Requerimientos Técnicos
- **WhatsApp Business API** para comunicación bidireccional
- **Webhook de Twilio** para recibir mensajes entrantes de WhatsApp
- API de transcripción de audio (Speech-to-Text) para audios enviados por WhatsApp
- API de procesamiento de lenguaje natural (NLP) para mensajes de texto
- Sistema de validación de datos
- Almacenamiento temporal de datos antes de confirmación
- **Sistema de sincronización** para mostrar en la app web los registros creados por WhatsApp

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

### 6. Accesibilidad por WhatsApp
- **Ventaja:** WhatsApp es universalmente accesible, no requiere app específica
- **Impacto:** Usuarios pueden interactuar desde cualquier dispositivo con WhatsApp
- **Conveniencia:** No necesitan abrir la aplicación web para crear registros

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

### 7. Dependencia de WhatsApp
- **Problema:** Sistema depende completamente de WhatsApp para Tarea B
- **Impacto:** Si WhatsApp tiene problemas, no se pueden crear registros por voz
- **Solución:** Implementar fallback a creación manual en la app, cola de reintentos

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

**✅ TECNOLOGÍA ELEGIDA: OpenAI Whisper API**

**OpenAI Whisper API - ✅ SELECCIONADA**
- **Costo:** $0.006 por **cada minuto de audio transcrito** (muy económico)
  - ⚠️ **IMPORTANTE:** El costo es por duración del audio procesado, NO por tiempo de operación del sistema
  - Ejemplo: Si un usuario graba 2 minutos de audio → se cobra $0.012 (2 min × $0.006)
  - Si otro usuario graba 30 segundos (0.5 min) → se cobra $0.003 (0.5 min × $0.006)
- **Límites:** Sin límite de uso, solo costo por uso
- **Créditos gratis:** $5 al registrarse (~833 minutos de audio)
- **Ventajas:**
  - ✅ Excelente precisión
  - ✅ Soporte multiidioma (detecta automáticamente)
  - ✅ API estable y confiable
  - ✅ Funciona desde cualquier dispositivo (procesamiento en servidor)
  - ✅ Compatible con WhatsApp (recibe audios de cualquier fuente)
  - ✅ Muy económico ($0.006/minuto)
- **Desventajas:**
  - Requiere servidor backend (ya lo tenemos)
  - Costo acumulativo según uso (muy bajo)
- **Recomendación:** ✅ **TECNOLOGÍA PRINCIPAL ELEGIDA** - Usar para desarrollo y producción

**⚠️ OTRAS OPCIONES (No seleccionadas):**

**Opción Alternativa 1: Google Cloud Speech-to-Text**
- **Costo:** $0.006 por cada 15 segundos (primeros 60 minutos gratis/mes)
- **Razón de no selección:** Créditos gratuitos más limitados, configuración más compleja
- **Estado:** ❌ No seleccionada

**Opción Alternativa 2: Azure Speech Services**
- **Costo:** $0.01 por minuto (primeros 5 horas gratis/mes)
- **Razón de no selección:** Más caro que Whisper, créditos limitados
- **Estado:** ❌ No seleccionada

**Opción Alternativa 3: Web Speech API**
- **Costo:** $0
- **Razón de no selección:** Solo funciona en navegadores, no compatible con apps móviles nativas, calidad variable
- **Estado:** ❌ No seleccionada (no necesaria ya que procesamos en servidor)

---

**✅ DECISIÓN FINAL: OpenAI Whisper API**

**Razones de la selección:**
1. ✅ **Excelente precisión** - Mejor que alternativas en pruebas
2. ✅ **Funciona universalmente** - Compatible con WhatsApp desde cualquier dispositivo
3. ✅ **Muy económico** - $0.006/minuto (más barato que Azure)
4. ✅ **Créditos generosos** - $5 gratis al registrarse (~833 minutos)
5. ✅ **Procesamiento en servidor** - No requiere SDKs específicos de Android/iOS
6. ✅ **Soporte multiidioma** - Detecta idioma automáticamente
7. ✅ **API estable** - Documentación excelente y comunidad activa

**⚠️ IMPORTANTE:** Como CORINA funciona por WhatsApp, los usuarios enviarán audios directamente por WhatsApp desde cualquier dispositivo (Android, iOS, Desktop). El backend recibirá estos audios vía webhook de Twilio y los procesará con Whisper API. Por lo tanto, **NO se necesita ninguna tecnología cliente-side** ya que toda la transcripción se hace en el servidor.

**📱 Para Pruebas desde App Móvil Nativa Android:**
- **Tecnología:** OpenAI Whisper API (procesamiento en servidor)
- **Flujo:** Usuario graba audio en WhatsApp → Envía por WhatsApp → Twilio recibe → Backend procesa con Whisper API
- **Ventaja:** No necesitas SDKs específicos de Android, todo se procesa en el servidor
- **Costo:** Muy bajo (~$0.006 por minuto de audio)
- **Pruebas:** Puedes probar directamente desde tu servidor de desarrollo usando los créditos gratis

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
- **⚠️ IMPORTANTE:** Como CORINA funciona por WhatsApp, los usuarios envían audios directamente por WhatsApp. El backend recibe estos audios y los procesa con Whisper API. Por lo tanto, **NO se necesita Web Speech API** en el cliente.

- OpenAI Whisper API (primeros minutos gratis o créditos de prueba): $0 inicial
- OpenAI GPT-3.5-turbo (créditos gratis): $0 inicial  
- Twilio WhatsApp (créditos gratis): $0 inicial
- **Total MVP:** $0 (usando créditos gratuitos de las APIs)

#### Escenario de Producción (100 usuarios ENTERPRISE activos)

**Suposiciones:**
- 10 transcripciones por usuario/mes (promedio 2 minutos cada una)
- 5 mensajes WhatsApp por usuario/mes
- 10 procesamientos NLP por usuario/mes (promedio 500 tokens cada uno)

**Cálculos:**
- **Transcripción (Whisper):** 
  - 100 usuarios × 10 transcripciones/mes × 2 minutos/audio × $0.006/minuto = **$12/mes**
  - ⚠️ **Aclaración:** Se cobra por cada minuto de audio transcrito. Si un usuario graba 2 minutos, se cobra $0.012 por esa transcripción.
  
- **NLP (GPT-3.5):** 
  - 100 usuarios × 10 procesamientos/mes × 500 tokens/procesamiento × $0.0015/1K tokens = **$0.75/mes**
  - ⚠️ **Aclaración:** Se cobra por cantidad de tokens procesados (texto), no por tiempo.
  
- **WhatsApp (Twilio):** 
  - 100 usuarios × 5 mensajes/mes × $0.005/mensaje = **$2.50/mes**
  - ⚠️ **Aclaración:** Se cobra por cada mensaje enviado, no por tiempo de operación.

**Total Producción:** **~$15.25/mes** para 100 usuarios ENTERPRISE

**Costo por usuario:** **~$0.15/mes** (muy bajo)

**Ejemplo práctico de costos:**
- Usuario graba audio de 1 minuto → Transcripción: $0.006
- CORINA procesa el texto (500 tokens) → NLP: $0.00075
- Se envía 1 notificación WhatsApp → WhatsApp: $0.005
- **Total por interacción:** ~$0.012 (menos de 1 centavo de dólar)

---

## 🛠️ Tecnologías Necesarias

### Frontend

#### 1. **Visualización de Registros Creados por WhatsApp**
- **Tecnología:** React + Next.js
- **Funcionalidad:** Mostrar en la app web los registros creados mediante WhatsApp
- **Componentes:** 
  - Lista de interacciones recientes con CORINA
  - Vista de registros creados por WhatsApp
  - Indicador visual de registros creados por WhatsApp vs manualmente
- **Sincronización:** Polling o WebSockets para actualizar en tiempo real

**⚠️ IMPORTANTE:** NO se requiere interfaz de chat en la aplicación web. Toda la conversación se realiza por WhatsApp.

### Backend

#### 1. **API de Transcripción**
- **Tecnología:** Node.js + Express
- **Integración:** ✅ **OpenAI Whisper API** (TECNOLOGÍA SELECCIONADA)
- **Librería:** `openai` SDK
- **Instalación:** `npm install openai`
- **Modelo:** `whisper-1` (único modelo disponible)

#### 2. **Procesamiento NLP**
- **Tecnología:** Node.js + Express
- **Integración:** OpenAI GPT-3.5-turbo o GPT-4
- **Librería:** `openai` SDK

#### 3. **WhatsApp Integration (Bidireccional)**
- **Tecnología:** Node.js + Express
- **Integración:** Twilio WhatsApp API
- **Librería:** `twilio` SDK
- **Funcionalidades:**
  - **Recepción:** Webhook para recibir mensajes entrantes de WhatsApp
  - **Envío:** Envío de mensajes de respuesta por WhatsApp
  - **Soporte de Audio:** Recepción y procesamiento de audios enviados por WhatsApp
  - **Soporte de Texto:** Procesamiento de mensajes de texto

#### 4. **WebSockets (Opcional - Solo para sincronización)**
- **Tecnología:** Socket.io o WebSockets nativos
- **Uso:** Sincronizar en tiempo real los registros creados por WhatsApp con la app web
- **Librería:** `socket.io` o `ws`
- **Nota:** No se usa para chat, solo para notificar al frontend cuando se crea un registro vía WhatsApp

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
- **Opción 1:** Sistema de archivos local (desarrollo) - ✅ RECOMENDADO para MVP
- **Opción 2:** AWS S3 (producción) - Opcional, solo si se necesita almacenamiento persistente
- **Nota:** Los audios se procesan inmediatamente con Whisper API y luego se pueden eliminar
- **Librería:** `fs` (nativo de Node.js) o `aws-sdk` (si se usa S3)

#### 2. **Variables de Entorno**
```env
# OpenAI
OPENAI_API_KEY=sk-...

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=whatsapp:+...
TWILIO_WEBHOOK_URL=https://tu-dominio.com/api/corina/whatsapp/webhook

# Storage (opcional - solo si se necesita almacenamiento persistente)
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
# AWS_S3_BUCKET=...
# Nota: Para desarrollo, usar sistema de archivos local es suficiente
```

---

## 🏗️ Arquitectura de la Funcionalidad

### Diagrama de Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                    WHATSAPP (Canal Principal)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Usuario envía mensaje/audio por WhatsApp                      │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────────────────────────────────┐                │
│  │  Twilio WhatsApp API                      │                │
│  │  (Recibe mensajes entrantes)              │                │
│  └──────────────┬─────────────────────────────┘                │
│                 │                                               │
│                 │ Webhook                                      │
│                 ▼                                               │
└─────────────────┼───────────────────────────────────────────────┘
                  │
                  │
┌─────────────────┼───────────────────────────────────────────────┐
│                 │          BACKEND (Node.js)                     │
│                 │                                                │
│      ┌──────────▼──────────┐                                    │
│      │ WhatsApp Webhook    │                                    │
│      │ Handler             │                                    │
│      │ (Recibe mensajes)   │                                    │
│      └──────────┬──────────┘                                    │
│                 │                                                │
│                 ▼                                                │
│      ┌──────────────────────┐                                   │
│      │ Detecta tipo mensaje │                                   │
│      │ (Audio o Texto)      │                                   │
│      └──────────┬───────────┘                                   │
│                 │                                                │
│         ┌───────┴────────┐                                      │
│         │                │                                      │
│         ▼                ▼                                      │
│  ┌──────────────┐  ┌──────────────┐                           │
│  │ Audio        │  │ Texto        │                           │
│  │ Processing   │  │ Processing   │                           │
│  └──────┬───────┘  └──────┬───────┘                           │
│         │                 │                                    │
│         ▼                 │                                    │
│  ┌──────────────┐         │                                    │
│  │ Transcription│         │                                    │
│  │ (Whisper)    │         │                                    │
│  └──────┬───────┘         │                                    │
│         │                 │                                    │
│         └────────┬─────────┘                                    │
│                  │                                              │
│                  ▼                                              │
│      ┌──────────────────────┐                                  │
│      │ NLP Service (GPT-3.5) │                                  │
│      │ Extrae datos          │                                  │
│      └──────────┬───────────┘                                  │
│                 │                                                │
│                 ▼                                                │
│      ┌──────────────────────┐                                  │
│      │ Validation Service    │                                  │
│      └──────────┬───────────┘                                  │
│                 │                                                │
│                 ▼                                                │
│      ┌──────────────────────┐                                  │
│      │ Envía Preview        │                                  │
│      │ por WhatsApp         │                                  │
│      └──────────┬───────────┘                                  │
│                 │                                                │
│                 │ Twilio API                                    │
│                 ▼                                                │
│      ┌──────────────────────┐                                  │
│      │ Usuario confirma      │                                  │
│      │ por WhatsApp         │                                  │
│      └──────────┬───────────┘                                  │
│                 │                                                │
│                 ▼                                                │
│      ┌──────────────────────┐                                  │
│      │ Crear Registro       │                                  │
│      │ (Directo o Service)  │                                  │
│      └──────────┬───────────┘                                  │
│                 │                                                │
│                 ▼                                                │
│      ┌──────────────────────┐                                  │
│      │ Database (Prisma)    │                                  │
│      └──────────┬───────────┘                                  │
│                 │                                                │
│                 │ Notifica creación                            │
│                 ▼                                                │
│      ┌──────────────────────┐                                  │
│      │ Envía confirmación   │                                  │
│      │ por WhatsApp         │                                  │
│      └──────────────────────┘                                  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐      │
│  │          WhatsApp Notification Service                │      │
│  │  (Monitorea inventario → Envía alertas)              │      │
│  └──────────────────┬──────────────────────────────────┘      │
│                     │                                            │
│                     ▼                                            │
│            ┌──────────────────┐                                 │
│            │ Twilio WhatsApp  │                                 │
│            │ API (Envío)       │                                 │
│            └──────────────────┘                                 │
└────────────────────────────────────────────────────────────────┘
                  │
                  │ Sincronización (WebSocket/Polling)
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────┐                 │
│  │  Vista de Registros Creados por WhatsApp │                 │
│  │  (Lista, Detalles, Indicadores)          │                 │
│  └──────────────────────────────────────────┘                 │
│                                                                 │
│  ⚠️ NO hay interfaz de chat - Todo por WhatsApp                │
└─────────────────────────────────────────────────────────────────┘
```

### Flujo Detallado: Tarea A (Notificaciones WhatsApp)

#### A.1. Detección Automática de Nuevas Alertas

```
1. Evento: Se actualiza inventario (compra, fabricación, ajuste manual)
   │
   ├─▶ Backend detecta cambio en cantidadReal de materia prima
   │
   ├─▶ Verifica si cantidadReal <= 0 (nueva alerta)
   │
   ├─▶ Si es nueva alerta:
   │   │
   │   ├─▶ Verifica si usuario tiene telefonoVerificado = true
   │   │
   │   ├─▶ Verifica si notificacionesWhatsAppActivas = true
   │   │
   │   ├─▶ Verifica si ya se notificó esta alerta específica (evitar duplicados)
   │   │
   │   └─▶ Si no se notificó antes:
   │       │
   │       ├─▶ Envía mensaje WhatsApp vía Twilio
   │       │   │
   │       │   └─▶ Mensaje: "⚠️ Nueva Alerta de Inventario: 
   │       │                 [Materia Prima] está en [cantidad] kg 
   │       │                 en [Granja]. 
   │       │                 Fecha: [fecha]"
   │       │
   │       └─▶ Registra notificación en base de datos (marca como notificada)
```

#### A.2. Consulta Bajo Demanda por WhatsApp

```
1. Usuario envía mensaje por WhatsApp:
   │
   └─▶ "CORINA, envíame un listado de todas las alertas del inventario 
        de la granja PORCINO S.A."
   │
   ├─▶ Twilio recibe mensaje y llama al webhook del backend
   │
   ├─▶ Backend identifica usuario por número de teléfono
   │
   ├─▶ Backend procesa comando con NLP (GPT-3.5)
   │   │
   │   ├─▶ Extrae: tipo de consulta = "alertas_inventario"
   │   └─▶ Extrae: nombre de granja = "PORCINO S.A."
   │
   ├─▶ Backend consulta inventario de la granja especificada
   │
   ├─▶ Filtra materias primas con cantidadReal <= 0
   │
   ├─▶ Formatea listado de alertas
   │
   └─▶ Envía respuesta por WhatsApp vía Twilio
       │
       └─▶ Mensaje: "📋 Alertas de Inventario - Granja: PORCINO S.A.
                     
                     ⚠️ [Materia Prima 1]: 0 kg
                     ⚠️ [Materia Prima 2]: -5 kg
                     ⚠️ [Materia Prima 3]: 0 kg
                     
                     Total de alertas: 3"
```

### Flujo Detallado: Tarea B (Creación por Voz/Texto vía WhatsApp)

```
1. Usuario envía mensaje/audio a CORINA por WhatsApp
   │
   ├─▶ Twilio recibe mensaje y llama al webhook del backend
   │
   ├─▶ Backend identifica usuario por número de teléfono
   │
   ├─▶ Backend verifica que usuario tiene plan ENTERPRISE
   │
   ├─▶ Backend detecta tipo de mensaje:
   │   │
   │   ├─▶ Si es AUDIO:
   │   │   │
   │   │   ├─▶ Backend descarga audio de Twilio
   │   │   │
   │   │   ├─▶ Backend envía audio a API de transcripción (Whisper)
   │   │   │
   │   │   └─▶ API devuelve texto transcrito
   │   │
   │   └─▶ Si es TEXTO:
   │       └─▶ Usa texto directamente
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
   ├─▶ Backend envía preview por WhatsApp al usuario
   │   │
   │   └─▶ Mensaje WhatsApp: "🔍 CORINA: Voy a crear [tipo de registro] 
   │                          con los siguientes datos: 
   │                          [preview formateado]
   │                          
   │                          ¿Confirmas? Responde 'SI' o 'NO'"
   │
   ├─▶ Usuario responde por WhatsApp ("SI" o "NO")
   │
   ├─▶ Backend recibe respuesta vía webhook
   │
   ├─▶ Si confirma ("SI"):
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
   ├─▶ Backend envía confirmación por WhatsApp
   │   │
   │   └─▶ Mensaje WhatsApp: "✅ Registro creado exitosamente. 
   │                          ID: [id]. 
   │                          Puedes verlo en la aplicación."
   │
   ├─▶ Backend notifica al frontend (WebSocket/Polling)
   │   │
   │   └─▶ Frontend actualiza lista de registros
   │
   └─▶ Usuario ve el registro creado en la aplicación web
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
  - Actualización de inventario (llama a `recalcularInventario`)
  - Recalculación de precios
- **Integración con alertas:** Después de `recalcularInventario`, se debe llamar a `detectarNuevaAlerta` para verificar si hay nuevas alertas

**Para Fabricaciones:**
```typescript
// backend/src/services/fabricacionService.ts
export async function crearFabricacion(params: CrearFabricacionParams)
```
- CORINA llamará a este servicio después de extraer datos del audio
- El servicio ya realiza:
  - Validación de datos
  - Cálculo de costos
  - Actualización de inventario (llama a `recalcularInventario`)
  - Validación de existencias
- **Integración con alertas:** Después de `recalcularInventario`, se debe llamar a `detectarNuevaAlerta` para verificar si hay nuevas alertas

**Para Actualización Manual de Inventario:**
```typescript
// backend/src/services/inventarioService.ts
export async function actualizarCantidadReal(...)
```
- Cuando se actualiza `cantidadReal` manualmente, también se debe llamar a `detectarNuevaAlerta`

#### 2. **Nuevos Servicios a Crear**

**CorinaService:**
```typescript
// backend/src/services/corinaService.ts

// Procesar mensaje recibido por WhatsApp
async function procesarMensajeWhatsApp(
  numeroTelefono: string, 
  mensaje: string, 
  audioUrl?: string
): Promise<void>
// Detecta si es comando de consulta o creación de registro
// Ejemplos de comandos de consulta:
// - "CORINA, envíame un listado de todas las alertas del inventario de la granja PORCINO S.A."
// - "CORINA, alertas de inventario"
// - "CORINA, qué materias primas están en cero"

// Transcripción de audio
async function transcribirAudio(audioBuffer: Buffer): Promise<string>

// Extracción de datos con NLP
async function extraerDatos(texto: string, tipoRegistro: string): Promise<any>

// Validación de datos extraídos
async function validarDatos(datos: any, tipoRegistro: string): Promise<ValidationResult>

// Enviar mensaje por WhatsApp
async function enviarMensajeWhatsApp(numeroTelefono: string, mensaje: string): Promise<void>

// Crear registro según tipo
async function crearRegistroPorVoz(datos: any, tipoRegistro: string, idUsuario: string, idGranja: string)

// Sincronizar con frontend (notificar creación)
async function notificarCreacionRegistro(idUsuario: string, tipoRegistro: string, idRegistro: string)
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

// WhatsApp Webhook (Twilio llama a este endpoint)
POST   /api/corina/whatsapp/webhook     // Recibe mensajes entrantes de WhatsApp

// Endpoints internos (no expuestos directamente)
POST   /api/corina/transcribir          // Transcripción de audio (llamado internamente)
POST   /api/corina/extraer-datos        // Extracción de datos (llamado internamente)
POST   /api/corina/validar-datos        // Validación de datos (llamado internamente)
POST   /api/corina/crear-registro        // Crear registro confirmado (llamado internamente)

// Frontend - Visualización de interacciones
GET    /api/corina/historial            // Obtener historial de interacciones por WhatsApp
GET    /api/corina/historial/:id        // Obtener interacción específica
GET    /api/corina/registros-recientes  // Obtener registros creados recientemente por WhatsApp

// WebSocket (solo para sincronización con frontend)
WS     /api/corina/sync                 // Notificar al frontend cuando se crea registro vía WhatsApp

// Configuración WhatsApp
POST   /api/corina/whatsapp/verificar-telefono  // Verificar número de teléfono
PUT    /api/corina/whatsapp/configurar          // Activar/desactivar notificaciones y CORINA
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
3. ✅ Configurar variables de entorno para APIs (Twilio + OpenAI Whisper API)
4. ✅ Crear estructura de carpetas para servicios CORINA
5. ✅ Obtener credenciales de Twilio y OpenAI (ver GUIA_CREDENCIALES_CORINA.md)
6. ✅ Probar integración con Whisper API usando créditos gratis

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

### Fase 3: Tarea B - Transcripción y NLP vía WhatsApp (Semanas 4-6)

**Tareas:**
1. Configurar webhook de Twilio para recibir mensajes WhatsApp
2. Implementar handler de webhook para mensajes entrantes
3. Implementar descarga y procesamiento de audios de WhatsApp
4. Implementar servicio de transcripción con **OpenAI Whisper API** (tecnología seleccionada)
5. Implementar servicio de extracción de datos (GPT-3.5)
6. Crear sistema de validación de datos
7. Implementar envío de preview y confirmación por WhatsApp
8. Integrar con servicios existentes (compras/fabricaciones)
9. Implementar sincronización con frontend (mostrar registros creados)
10. Testing y ajustes

**Entregables:**
- Webhook de WhatsApp funcionando
- Transcripción de audio funcionando
- Extracción de datos funcionando
- Creación de registros funcionando
- Sincronización con frontend funcionando
- Tests unitarios y de integración

### Fase 4: Integración y Optimización (Semanas 7-8)

**Tareas:**
1. Integrar ambas tareas (notificaciones y creación por WhatsApp)
2. Crear vista en frontend para mostrar registros creados por WhatsApp
3. Implementar indicadores visuales de registros creados vía WhatsApp
4. Optimizar llamadas a **Whisper API** (caché de transcripciones similares, evitar duplicados)
5. Implementar manejo de errores robusto (reintentos, fallbacks)
6. Mejorar precisión de extracción de datos con GPT-3.5
7. Agregar diccionario de términos técnicos para mejorar precisión de Whisper
8. Implementar historial de interacciones WhatsApp
9. Testing end-to-end (simular conversación completa por WhatsApp)
10. Documentación de usuario (cómo usar CORINA por WhatsApp)

**Entregables:**
- Sistema completo funcionando
- Vista en frontend para registros creados por WhatsApp
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
- Precisión de transcripción con **Whisper API** > 90%
- Precisión de extracción de datos con GPT-3.5 > 85%
- Tiempo de respuesta < 5 segundos (incluyendo transcripción con Whisper)
- Disponibilidad > 99%
- Costo por transcripción < $0.01 (usando Whisper API)

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

1. **MVP:** Implementar con **OpenAI Whisper API** usando créditos gratis ($5) para validar concepto
2. **Producción:** Continuar con **Whisper API** (muy económico, $0.006/minuto)
3. **Faseado:** Implementar Tarea A primero (más simple), luego Tarea B
4. **Testing:** Invertir tiempo en testing con usuarios reales desde app móvil Android
5. **Monitoreo:** Implementar métricas desde el inicio (costos de Whisper API, precisión de transcripción)
6. **Optimización:** Implementar caché de transcripciones para evitar procesar el mismo audio dos veces

### Riesgos Principales

1. **Precisión de transcripción con Whisper:** Mitigar con diccionario de términos técnicos y prompts mejorados
2. **Costos de Whisper API a escala:** Mitigar con límites de uso, caché y optimizaciones
3. **Dependencia de APIs (Whisper + Twilio):** Mitigar con fallbacks y colas de reintento
4. **Límites de rate de Whisper API:** Monitorear uso y escalar según necesidad

---

**Documento creado por:** Sistema de análisis técnico  
**Última actualización:** 2025-01-XX  
**Versión:** 1.0

