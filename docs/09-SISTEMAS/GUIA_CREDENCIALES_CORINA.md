# 🔐 Guía de Credenciales y Configuración: Sistema CORINA

**Fecha:** 2025-01-XX  
**Versión:** 1.0  
**Sistema:** CORINA (Corporate Information Assistant)

---

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [WhatsApp Business API (Twilio)](#whatsapp-business-api-twilio)
3. [OpenAI Whisper API (Transcripción de Audio)](#openai-whisper-api-transcripción-de-audio)
4. [OpenAI GPT-3.5 (Procesamiento NLP)](#openai-gpt-35-procesamiento-nlp)
5. [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
6. [Verificación y Testing](#verificación-y-testing)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Resumen Ejecutivo

Este documento proporciona una guía paso a paso para obtener todas las credenciales y configuraciones necesarias para implementar el sistema CORINA.

### APIs Necesarias

1. **Twilio WhatsApp API** - Para comunicación bidireccional por WhatsApp
2. **✅ OpenAI Whisper API** - Para transcripción de audio a texto (**TECNOLOGÍA SELECCIONADA**)
3. **OpenAI GPT-3.5-turbo** - Para procesamiento de lenguaje natural y extracción de datos

### Costos Estimados para Pruebas

- **Twilio:** $15.50 créditos gratis al registrarse (~3,100 mensajes)
- **✅ OpenAI Whisper API:** $5 créditos gratis al registrarse (~833 minutos de audio)
- **OpenAI GPT-3.5:** Incluido en los $5 de créditos gratis
- **Total para pruebas:** $0 (usando créditos gratuitos)

### Tecnología de Transcripción Seleccionada

**✅ OpenAI Whisper API** ha sido seleccionada como la tecnología principal para transcripción de audio por las siguientes razones:

- ✅ **Excelente precisión** - Mejor que alternativas en pruebas
- ✅ **Funciona desde cualquier dispositivo** - Procesamiento en servidor, compatible con WhatsApp desde Android/iOS/Desktop
- ✅ **Muy económico** - $0.006/minuto (más barato que Azure, similar a Google pero con más créditos gratis)
- ✅ **Créditos generosos** - $5 gratis al registrarse (~833 minutos de audio)
- ✅ **Soporte multiidioma automático** - Detecta idioma automáticamente
- ✅ **API estable y bien documentada** - Comunidad activa, fácil integración
- ✅ **No requiere SDKs cliente** - Todo se procesa en el servidor backend

**⚠️ IMPORTANTE:** Como CORINA funciona por WhatsApp, los usuarios enviarán audios directamente por WhatsApp desde cualquier dispositivo (Android nativo, iOS, Desktop). El backend recibirá estos audios vía webhook de Twilio y los procesará con **Whisper API**. No se necesita ninguna tecnología cliente-side para transcripción.

---

## 📱 WhatsApp Business API (Twilio)

### Paso 1: Crear Cuenta en Twilio

1. **Visita:** https://www.twilio.com/try-twilio
2. **Regístrate** con tu email y contraseña
3. **Verifica tu email** (revisa tu bandeja de entrada)
4. **Completa el formulario** con:
   - Nombre completo
   - Número de teléfono (para verificación)
   - País

### Paso 2: Verificar Número de Teléfono

1. Twilio enviará un código SMS a tu número
2. Ingresa el código en la plataforma
3. Confirma tu número

### Paso 3: Obtener Credenciales de Twilio

1. **Accede al Dashboard:** https://console.twilio.com/
2. **Ve a "Account" → "Account Info"** (parte superior derecha)
3. **Copia las siguientes credenciales:**
   - **Account SID:** `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Auth Token:** `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (haz clic en "View" para verlo)

⚠️ **IMPORTANTE:** Guarda estas credenciales de forma segura. El Auth Token solo se muestra una vez.

### Paso 4: Configurar WhatsApp Sandbox (Para Pruebas)

1. **En el Dashboard, busca "Messaging" → "Try it out" → "Send a WhatsApp message"**
2. **O ve directamente a:** https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
3. **Sigue las instrucciones para unirte al Sandbox:**
   - Envía el código que aparece en la pantalla a tu número de WhatsApp
   - Ejemplo: Si el código es `join example-code`, envía `join example-code` al número de WhatsApp de Twilio
4. **Confirma que recibiste el mensaje de bienvenida**

### Paso 5: Obtener Número de WhatsApp de Twilio

1. **En el Dashboard, ve a "Phone Numbers" → "Manage" → "Active numbers"**
2. **Busca el número que tiene "WhatsApp" habilitado**
3. **Copia el número** (formato: `whatsapp:+14155238886`)

### Paso 6: Configurar Webhook (Para Desarrollo Local con ngrok)

**⚠️ IMPORTANTE:** Para desarrollo y pruebas, usaremos ngrok para exponer tu servidor local a Internet.

#### 6.1. Verificar Puerto del Backend

Primero, verifica en qué puerto corre tu servidor backend:
- Revisa `backend/src/index.ts` o `backend/.env`
- Puerto común: `3000` o `3001`
- Si no estás seguro, busca `app.listen()` en el código

#### 6.2. Iniciar el Servidor Backend

Abre una terminal y ejecuta:
```bash
cd backend
npm run dev
# O el comando que uses para iniciar el servidor
```

Verifica que el servidor esté corriendo (deberías ver algo como "Server running on port 3000")

#### 6.3. Iniciar ngrok

**En una NUEVA terminal** (deja el servidor corriendo), ejecuta:

```bash
# Si tu backend corre en puerto 3000:
ngrok http 3000

# O si corre en otro puerto (ej: 3001):
ngrok http 3001
```

**Salida esperada:**
```
ngrok

Session Status                online
Account                       [tu cuenta]
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123-def456.ngrok-free.app -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**⚠️ IMPORTANTE:** 
- **NO cierres esta terminal** - ngrok debe seguir corriendo
- Copia la URL HTTPS que aparece en "Forwarding" (ej: `https://abc123-def456.ngrok-free.app`)
- Esta URL cambiará cada vez que reinicies ngrok (a menos que tengas cuenta de pago)

#### 6.4. Crear Endpoint de Webhook en el Backend

Antes de configurar Twilio, asegúrate de que el endpoint existe en tu backend:

**Crear archivo:** `backend/src/routes/corinaRoutes.ts` (si no existe)
```typescript
import express from 'express';
import { handleWhatsAppWebhook } from '../controllers/corinaController';

const router = express.Router();

// Webhook de Twilio (debe estar antes de otros middlewares que parsean JSON)
router.post('/whatsapp/webhook', express.raw({ type: 'application/x-www-form-urlencoded' }), handleWhatsAppWebhook);

export default router;
```

**Registrar ruta en:** `backend/src/index.ts`
```typescript
import corinaRoutes from './routes/corinaRoutes';
app.use('/api/corina', corinaRoutes);
```

#### 6.5. Crear Handler Básico del Webhook

**Crear archivo:** `backend/src/controllers/corinaController.ts` (si no existe)
```typescript
import { Request, Response } from 'express';
import twilio from 'twilio';

// Validar firma de Twilio (seguridad)
const twilioSignature = process.env.TWILIO_AUTH_TOKEN || '';

export async function handleWhatsAppWebhook(req: Request, res: Response) {
  try {
    // Twilio envía datos como form-urlencoded
    const body = req.body.toString();
    const params = new URLSearchParams(body);
    
    // Extraer datos del mensaje
    const from = params.get('From'); // Número que envió el mensaje
    const to = params.get('To'); // Número de Twilio
    const bodyMessage = params.get('Body'); // Texto del mensaje
    const numMedia = params.get('NumMedia'); // Número de archivos adjuntos
    
    console.log('📱 Mensaje recibido de WhatsApp:');
    console.log('  De:', from);
    console.log('  Para:', to);
    console.log('  Mensaje:', bodyMessage);
    console.log('  Archivos adjuntos:', numMedia);
    
    // Si hay audio adjunto
    if (numMedia && parseInt(numMedia) > 0) {
      const mediaUrl = params.get(`MediaUrl0`);
      const mediaContentType = params.get(`MediaContentType0`);
      console.log('  Audio URL:', mediaUrl);
      console.log('  Tipo:', mediaContentType);
    }
    
    // Responder a Twilio (requerido)
    res.type('text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    
  } catch (error: any) {
    console.error('❌ Error procesando webhook:', error);
    res.status(500).send('Error');
  }
}
```

#### 6.6. Configurar Webhook en Twilio

1. **Abre tu navegador y ve a:** https://console.twilio.com/us1/develop/sms/sandbox
   
   O navega manualmente:
   - Dashboard → Messaging → Try it out → Send a WhatsApp message
   - Busca "WhatsApp Sandbox Settings" o "Sandbox configuration"

2. **En la sección "When a message comes in", ingresa:**
   ```
   https://TU-URL-NGROK/api/corina/whatsapp/webhook
   ```
   
   **Ejemplo con tu URL de ngrok:**
   ```
   https://abc123-def456.ngrok-free.app/api/corina/whatsapp/webhook
   ```
   
   ⚠️ **Reemplaza `TU-URL-NGROK` con la URL que te dio ngrok**

3. **En "Status callback URL" (opcional), ingresa:**
   ```
   https://TU-URL-NGROK/api/corina/whatsapp/status
   ```

4. **Haz clic en "Save"**

#### 6.7. Verificar Configuración

1. **Verifica que tu servidor backend está corriendo** (terminal 1)
2. **Verifica que ngrok está corriendo** (terminal 2)
3. **Envía un mensaje de prueba desde WhatsApp:**
   - Abre WhatsApp en tu teléfono
   - Envía un mensaje al número de Twilio: `+1 415 523 8886`
   - O al número que aparece en tu Sandbox de Twilio

4. **Revisa los logs:**
   - **Terminal del backend:** Deberías ver el mensaje recibido
   - **Interfaz web de ngrok:** Ve a http://127.0.0.1:4040 para ver las peticiones
   - **Twilio Dashboard:** Ve a Monitor → Logs → Messaging para ver el estado

#### 6.8. Solución de Problemas Comunes

**Problema: "ngrok: command not found"**
```bash
# Windows: Descarga ngrok.exe y colócalo en una carpeta en tu PATH
# O ejecuta desde la carpeta donde está ngrok.exe:
cd C:\ruta\a\ngrok
.\ngrok.exe http 3000
```

**Problema: "Tunnel not found" o "404 Not Found"**
- Verifica que el servidor backend está corriendo
- Verifica que el puerto en ngrok coincide con el del servidor
- Verifica que la ruta `/api/corina/whatsapp/webhook` existe

**Problema: "Webhook timeout"**
- Verifica que tu servidor responde rápidamente (< 10 segundos)
- Verifica que respondes con XML válido a Twilio

**Problema: "Invalid signature"**
- Verifica que el endpoint acepta `application/x-www-form-urlencoded`
- Verifica que validas la firma de Twilio (opcional para desarrollo)

#### 6.9. Configuración para Producción

Cuando estés listo para producción:

1. **Obtén un dominio y certificado SSL** (ej: `api.tu-dominio.com`)
2. **Configura el webhook en Twilio con tu dominio:**
   ```
   https://api.tu-dominio.com/api/corina/whatsapp/webhook
   ```
3. **Solicita número de WhatsApp Business** (no Sandbox)
4. **Configura el webhook en producción**

**Nota:** Para desarrollo, ngrok es suficiente. Para producción, necesitarás un servidor con dominio propio.

### Paso 7: Verificar Configuración Completa

**Prueba enviando un mensaje:**
1. **Asegúrate de estar unido al Sandbox:**
   - Envía el código del Sandbox al número de Twilio desde WhatsApp
   - Ejemplo: Si el código es `join example-code`, envía `join example-code` a `+1 415 523 8886`

2. **Envía un mensaje de prueba:**
   - Abre WhatsApp en tu teléfono
   - Envía un mensaje al número de Twilio: `+1 415 523 8886`
   - Mensaje de prueba: "Hola CORINA"

3. **Verifica que tu webhook recibe el mensaje:**
   - Revisa la terminal del backend (deberías ver logs del mensaje)
   - Revisa la interfaz web de ngrok: http://127.0.0.1:4040
   - Revisa los logs en Twilio Dashboard → "Monitor" → "Logs" → "Messaging"

4. **Verifica que puedes responder:**
   - Tu backend debería poder enviar mensajes de vuelta
   - Prueba enviando una respuesta desde tu código

### Credenciales Obtenidas

**Guarda estas credenciales en tu archivo `.env` del backend:**

```env
# Twilio WhatsApp
TWILIO_ACCOUNT_SID=ACa5bcfb29fa7328d47b5f1d25c9d3a33a
TWILIO_AUTH_TOKEN=25926cd44085346670496d8acc4ef231
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_WHATSAPP_TO=whatsapp:+5493515930163
TWILIO_WEBHOOK_URL=https://unmerciful-ossie-fluent.ngrok-free.dev/api/corina/whatsapp/webhook
```

**⚠️ IMPORTANTE:** 
- Esta URL de ngrok cambiará cada vez que reinicies ngrok
- Para desarrollo, esto está bien. Para producción, usa un dominio fijo
- Recuerda actualizar el webhook en Twilio si cambias la URL de ngrok

### Paso 7.1: Probar Envío de Mensaje desde el Backend

Crea un script de prueba para verificar que puedes enviar mensajes:

**Crear:** `backend/src/scripts/test-whatsapp-send.ts`
```typescript
import twilio from 'twilio';
import * as dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
const toNumber = process.env.TWILIO_WHATSAPP_TO;

if (!accountSid || !authToken || !fromNumber || !toNumber) {
  console.error('❌ Faltan variables de entorno de Twilio');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

async function sendTestMessage() {
  try {
    console.log('📤 Enviando mensaje de prueba...');
    console.log('  De:', fromNumber);
    console.log('  Para:', toNumber);
    
    const message = await client.messages.create({
      from: fromNumber,
      to: toNumber,
      body: 'Hola! Este es un mensaje de prueba de CORINA 🚀\n\nSi recibes esto, la configuración está correcta!'
    });
    
    console.log('✅ Mensaje enviado exitosamente!');
    console.log('  Message SID:', message.sid);
    console.log('  Status:', message.status);
    
    return true;
  } catch (error: any) {
    console.error('❌ Error enviando mensaje:', error.message);
    if (error.code === 21211) {
      console.error('  El número de destino no está verificado en el Sandbox');
      console.error('  Envía el código del Sandbox al número de Twilio primero');
    }
    return false;
  }
}

sendTestMessage();
```

**Ejecutar:**
```bash
cd backend
npx ts-node src/scripts/test-whatsapp-send.ts
```

**Verifica en tu WhatsApp** que recibiste el mensaje.

### Límites del Sandbox

- **Solo puedes enviar mensajes a números verificados** (que se unieron al sandbox)
- **Mensajes deben iniciarse desde Twilio** (no puedes recibir mensajes de números no verificados)
- **Para recibir mensajes:** El número debe estar unido al Sandbox enviando el código
- **Para producción:** Necesitarás solicitar un número de WhatsApp Business verificado

### Unirse al Sandbox (IMPORTANTE)

Para que tu número pueda recibir mensajes:

1. **Ve a:** https://console.twilio.com/us1/develop/sms/sandbox
2. **Busca el código del Sandbox** (ej: `join example-code`)
3. **Desde tu WhatsApp, envía ese código al número:** `+1 415 523 8886`
4. **Espera confirmación:** Deberías recibir un mensaje de bienvenida
5. **Verifica en Twilio Console** que tu número aparece como verificado

**Tu número verificado:** `+5493515930163`

### Solicitar Número de WhatsApp Business (Producción)

1. **Ve a:** https://www.twilio.com/whatsapp
2. **Completa el formulario de solicitud**
3. **Proporciona:**
   - Información de tu negocio
   - Política de privacidad
   - Descripción del uso de WhatsApp
4. **Espera la aprobación** (puede tomar varios días)

---

## 🎤 OpenAI Whisper API (Transcripción de Audio)

**✅ TECNOLOGÍA SELECCIONADA PARA CORINA**

Esta es la tecnología principal que utilizaremos para transcribir los audios enviados por WhatsApp.

### Paso 1: Crear Cuenta en OpenAI

1. **Visita:** https://platform.openai.com/signup
2. **Regístrate** con tu email y contraseña
3. **Verifica tu email**
4. **Completa tu perfil** (nombre, organización opcional)

### Paso 2: Agregar Método de Pago (Opcional para Pruebas)

⚠️ **Nota:** OpenAI requiere método de pago incluso para usar créditos gratuitos, pero no te cobrará hasta que se agoten los créditos.

1. **Ve a:** https://platform.openai.com/account/billing
2. **Haz clic en "Add payment method"**
3. **Agrega una tarjeta de crédito o débito**
4. **Confirma el método de pago**

### Paso 3: Obtener API Key

1. **Ve a:** https://platform.openai.com/api-keys
2. **Haz clic en "Create new secret key"**
3. **Asigna un nombre** (ej: "CORINA Development")
4. **Copia la API Key** (formato: `sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

⚠️ **IMPORTANTE:** 
- La API Key solo se muestra una vez
- Guárdala de forma segura
- No la compartas públicamente
- Si la pierdes, deberás crear una nueva

### Paso 4: Verificar Créditos Gratuitos

1. **Ve a:** https://platform.openai.com/account/billing/overview
2. **Verifica que tienes $5 de créditos gratis** (aparece como "Free trial credits")
3. **Revisa el límite de uso** (si aplica)

### Paso 5: Probar Whisper API

**Opción 1: Desde la Consola de OpenAI**
1. **Ve a:** https://platform.openai.com/playground
2. **Selecciona "Whisper" en el menú**
3. **Sube un archivo de audio** (formato: mp3, wav, m4a, etc.)
4. **Haz clic en "Transcribe"**
5. **Revisa el resultado**

**Opción 2: Desde tu código (Node.js)**
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const transcription = await openai.audio.transcriptions.create({
  file: fs.createReadStream('audio.mp3'),
  model: 'whisper-1',
});

console.log(transcription.text);
```

### Credenciales Obtenidas

```env
OPENAI_API_KEY=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
```

### Límites y Costos

- **Créditos gratis:** $5 al registrarse
- **Costo por minuto:** $0.006/minuto de audio transcrito
- **Con $5 puedes transcribir:** ~833 minutos de audio
- **Límites de rate:** Dependen de tu plan (gratis tiene límites)

### Modelos Disponibles

- **whisper-1:** Modelo estándar (recomendado)
- **Soporta:** mp3, mp4, mpeg, mpga, m4a, wav, webm
- **Tamaño máximo:** 25 MB por archivo
- **Idiomas:** Multiidioma (detecta automáticamente)

---

## 🤖 OpenAI GPT-3.5 (Procesamiento NLP)

### Paso 1: Verificar Acceso a GPT-3.5

1. **Usa la misma cuenta de OpenAI** creada anteriormente
2. **Ve a:** https://platform.openai.com/playground
3. **Selecciona "gpt-3.5-turbo" en el modelo**
4. **Escribe un prompt de prueba** y haz clic en "Submit"

### Paso 2: Verificar Costos

1. **Ve a:** https://platform.openai.com/pricing
2. **Revisa los costos de GPT-3.5-turbo:**
   - **Input:** $0.0015 por 1K tokens
   - **Output:** $0.002 por 1K tokens
3. **Los créditos gratis ($5) cubren ambos servicios** (Whisper y GPT-3.5)

### Paso 3: Probar GPT-3.5 para Extracción de Datos

**Ejemplo de prompt para extraer datos:**
```
Extrae los siguientes datos del texto y devuélvelos en formato JSON:
- codigoMateriaPrima: código de la materia prima
- nombreMateriaPrima: nombre de la materia prima
- unidadMedida: unidad de medida (kg, litros, etc.)
- precioPorKilo: precio por kilo (número)

Texto: "Necesito crear una materia prima con código MP001, se llama Maíz, se mide en kilogramos y cuesta 150 pesos por kilo"
```

**Respuesta esperada:**
```json
{
  "codigoMateriaPrima": "MP001",
  "nombreMateriaPrima": "Maíz",
  "unidadMedida": "kg",
  "precioPorKilo": 150
}
```

### Credenciales

**Usa la misma API Key de OpenAI:**
```env
OPENAI_API_KEY=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
```

### Modelos Recomendados

- **gpt-3.5-turbo:** Más económico, suficiente para extracción de datos
- **gpt-4:** Más preciso pero más caro (solo si gpt-3.5 no es suficiente)

---

## ⚙️ Configuración de Variables de Entorno

### Archivo `.env` del Backend

Crea o actualiza el archivo `.env` en la raíz del proyecto `backend/`:

```env
# ============================================
# CORINA - WhatsApp (Twilio)
# ============================================
TWILIO_ACCOUNT_SID=ACa5bcfb29fa7328d47b5f1d25c9d3a33a
TWILIO_AUTH_TOKEN=25926cd44085346670496d8acc4ef231
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_WHATSAPP_TO=whatsapp:+5493515930163
TWILIO_WEBHOOK_URL=https://unmerciful-ossie-fluent.ngrok-free.dev/api/corina/whatsapp/webhook
# Nota: Esta URL cambiará si reinicias ngrok. Actualiza el webhook en Twilio si cambia.

# ============================================
# CORINA - OpenAI (Whisper + GPT-3.5)
# ============================================
OPENAI_API_KEY=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

# ============================================
# CORINA - Configuración General
# ============================================
NODE_ENV=development
CORINA_ENABLED=true
CORINA_DEBUG=true
```

### Instalación de Dependencias

```bash
cd backend
npm install twilio openai
npm install --save-dev @types/twilio
```

### Verificar Instalación

```bash
npm list twilio openai
```

---

## ✅ Verificación y Testing

### Test 1: Verificar Credenciales de Twilio

```typescript
// backend/src/scripts/test-twilio-credentials.ts
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);

async function testTwilio() {
  try {
    // Verificar cuenta
    const account = await client.api.accounts(accountSid).fetch();
    console.log('✅ Twilio conectado:', account.friendlyName);
    
    // Verificar número de WhatsApp
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    console.log('✅ Número WhatsApp:', whatsappNumber);
    
    return true;
  } catch (error) {
    console.error('❌ Error conectando con Twilio:', error);
    return false;
  }
}

testTwilio();
```

**Ejecutar:**
```bash
cd backend
npx ts-node src/scripts/test-twilio-credentials.ts
```

### Test 2: Verificar Credenciales de OpenAI y Whisper API

```typescript
// backend/src/scripts/test-openai-whisper.ts
import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAI() {
  try {
    // Probar acceso a la API
    const response = await openai.models.list();
    console.log('✅ OpenAI conectado');
    console.log('Modelos disponibles:', response.data.length);
    
    return true;
  } catch (error: any) {
    console.error('❌ Error conectando con OpenAI:', error.message);
    return false;
  }
}

async function testWhisperAPI() {
  try {
    // Crear un archivo de audio de prueba (o usar uno existente)
    // Para pruebas, puedes grabar un audio corto con tu teléfono y guardarlo como test-audio.mp3
    
    if (!fs.existsSync('test-audio.mp3')) {
      console.log('⚠️ Archivo test-audio.mp3 no encontrado. Crea un archivo de audio para probar.');
      return false;
    }
    
    console.log('🎤 Transcribiendo audio con Whisper API...');
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream('test-audio.mp3'),
      model: 'whisper-1',
      language: 'es', // Opcional: especificar español
    });
    
    console.log('✅ Whisper API funcionando correctamente');
    console.log('📝 Texto transcrito:', transcription.text);
    
    return true;
  } catch (error: any) {
    console.error('❌ Error usando Whisper API:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🔍 Verificando credenciales de OpenAI...\n');
  const openaiOk = await testOpenAI();
  
  if (openaiOk) {
    console.log('\n🔍 Probando Whisper API...\n');
    await testWhisperAPI();
  }
}

runTests();
```

**Ejecutar:**
```bash
cd backend
npx ts-node src/scripts/test-openai-whisper.ts
```

**Nota:** Para probar Whisper API, necesitas un archivo de audio. Puedes:
1. Grabar un audio corto con tu teléfono Android
2. Enviarlo por WhatsApp a tu número de prueba
3. Descargarlo desde Twilio
4. O crear un audio de prueba directamente en tu computadora

### Test 3: Enviar Mensaje de Prueba por WhatsApp

**Este test ya está incluido en el Paso 7.1 anterior.**

**Ejecutar:**
```bash
cd backend
npx ts-node src/scripts/test-whatsapp-send.ts
```

**Verifica:**
- ✅ El mensaje se envía sin errores
- ✅ Recibes el mensaje en tu WhatsApp (`+5493515930163`)
- ✅ El Message SID aparece en los logs

**Si hay errores:**
- Verifica que tu número está unido al Sandbox
- Verifica que las credenciales son correctas
- Verifica que el formato del número es correcto (`whatsapp:+5493515930163`)

### Test 4: Probar Webhook de WhatsApp (Flujo Completo)

**Este test está incluido en el Paso 6 anterior. Aquí está el resumen:**

1. **Inicia tu servidor backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Inicia ngrok en otra terminal:**
   ```bash
   ngrok http 3000
   # O el puerto que uses
   ```

3. **Copia la URL HTTPS de ngrok** (ej: `https://abc123-def456.ngrok-free.app`)

4. **Configura el webhook en Twilio:**
   - Ve a: https://console.twilio.com/us1/develop/sms/sandbox
   - En "When a message comes in", ingresa: `https://TU-URL-NGROK/api/corina/whatsapp/webhook`
   - Guarda los cambios

5. **Asegúrate de estar unido al Sandbox:**
   - Envía el código del Sandbox al número `+1 415 523 8886` desde WhatsApp

6. **Envía un mensaje de prueba:**
   - Desde WhatsApp, envía un mensaje al número `+1 415 523 8886`
   - Mensaje: "Hola CORINA, esto es una prueba"

7. **Verifica que tu servidor recibe el mensaje:**
   - Revisa los logs en la terminal del backend
   - Deberías ver: "📱 Mensaje recibido de WhatsApp"
   - Revisa la interfaz web de ngrok: http://127.0.0.1:4040
   - Revisa Twilio Dashboard → Monitor → Logs → Messaging

**✅ Si ves el mensaje en los logs del backend, el webhook está funcionando correctamente!**

---

## 💳 Cargar Créditos en OpenAI

Si necesitas cargar créditos para usar Whisper API (transcripción de audio), consulta la guía completa:

📄 **Guía detallada:** `backend/docs/GUIA_CARGAR_CREDITOS_OPENAI.md`

### Resumen Rápido

1. **Ve a:** https://platform.openai.com/account/billing
2. **Agrega método de pago** (tarjeta de crédito/débito o PayPal)
3. **Configura límites de gasto** (recomendado: $10-50 USD/mes)
4. **OpenAI factura automáticamente** cuando alcanzas $5 USD de uso

### Costos Estimados

- **Whisper API:** $0.006 USD por minuto de audio
- **Ejemplo:** 100 audios de 1 minuto = $0.60 USD/mes
- **Escenario realista (50 usuarios, 10 audios/día):** ~$9 USD/mes

### Modelo de Facturación

- **Primera factura:** Cuando alcanzas $5 USD de uso
- **Facturas subsecuentes:** Cada vez que alcanzas $5 USD adicionales
- **Al final del mes:** Se factura cualquier saldo pendiente

---

## 🔧 Troubleshooting

### Problema: No recibo mensajes en el webhook

**Soluciones:**
1. Verifica que ngrok está corriendo y la URL es HTTPS
2. Verifica que el webhook está configurado correctamente en Twilio
3. Revisa los logs de Twilio Dashboard → Monitor → Logs
4. Verifica que tu servidor está escuchando en el puerto correcto
5. Verifica que la ruta del webhook es correcta (`/api/corina/whatsapp/webhook`)

### Problema: Error 401 al usar OpenAI API

**Soluciones:**
1. Verifica que la API Key es correcta
2. Verifica que no tiene espacios al inicio/final
3. Verifica que tienes créditos disponibles
4. Verifica que agregaste método de pago (requerido incluso para créditos gratis)

### Problema: Error al transcribir audio

**Soluciones:**
1. Verifica que el archivo de audio es compatible (mp3, wav, m4a, etc.)
2. Verifica que el archivo no excede 25 MB
3. Verifica que tienes créditos disponibles
4. Verifica que el formato del audio es correcto

### Problema: No puedo enviar mensajes a números no verificados

**Solución:**
- En el Sandbox de Twilio, solo puedes enviar mensajes a números que se unieron al sandbox
- Para producción, necesitas solicitar un número de WhatsApp Business verificado

### Problema: Los créditos gratis se agotaron / Error de cuota

**Soluciones:**
1. **Carga créditos:** Sigue la guía `backend/docs/GUIA_CARGAR_CREDITOS_OPENAI.md`
2. **Agrega método de pago** en https://platform.openai.com/account/billing
3. **Configura límites de gasto** para evitar sorpresas
4. **Usa mensajes de texto** cuando sea posible (no requieren créditos)
5. **Implementa caché** para evitar transcripciones duplicadas
6. **Optimiza el uso** de APIs

**📄 Ver también:** `backend/docs/DIAGNOSTICO_CUOTA_OPENAI.md` para diagnóstico detallado

---

## 📚 Recursos Adicionales

### Documentación Oficial

- **Twilio WhatsApp:** https://www.twilio.com/docs/whatsapp
- **OpenAI Whisper:** https://platform.openai.com/docs/guides/speech-to-text
- **OpenAI GPT-3.5:** https://platform.openai.com/docs/guides/gpt

### Guías de Integración

- **Twilio Node.js SDK:** https://www.twilio.com/docs/libraries/node
- **OpenAI Node.js SDK:** https://github.com/openai/openai-node

### Herramientas Útiles

- **ngrok:** https://ngrok.com/ (para exponer servidor local)
- **Postman:** https://www.postman.com/ (para probar APIs)
- **Twilio Console:** https://console.twilio.com/

---

## ✅ Checklist de Configuración

- [ ] Cuenta de Twilio creada y verificada
- [ ] Credenciales de Twilio obtenidas (Account SID, Auth Token)
- [ ] Número de WhatsApp Sandbox configurado
- [ ] Webhook configurado en Twilio
- [ ] Cuenta de OpenAI creada y verificada
- [ ] Método de pago agregado en OpenAI
- [ ] API Key de OpenAI obtenida
- [ ] Créditos gratis verificados ($5)
- [ ] Variables de entorno configuradas en `.env`
- [ ] Dependencias instaladas (`twilio`, `openai`)
- [ ] Tests de verificación ejecutados exitosamente
- [ ] Webhook probado con mensaje real de WhatsApp
- [ ] Transcripción de audio probada exitosamente

---

**Documento creado por:** Sistema de documentación técnica  
**Última actualización:** 2025-01-XX  
**Versión:** 1.0

