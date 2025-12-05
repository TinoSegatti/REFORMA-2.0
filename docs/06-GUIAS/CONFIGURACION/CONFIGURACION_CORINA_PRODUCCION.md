# Configuración de CORINA en Producción (Render)

CORINA es el sistema de IA que permite interactuar con REFORMA a través de WhatsApp usando Twilio. Esta guía explica cómo configurar CORINA en producción en Render, reemplazando el uso de Ngrok que se utilizaba en desarrollo.

## 📋 Requisitos Previos

- ✅ Backend desplegado en Render
- ✅ Cuenta de Twilio con WhatsApp Business API habilitada
- ✅ Plan ENTERPRISE activo en REFORMA
- ✅ Variables de entorno configuradas correctamente

## 🔧 Paso 1: Configurar Variables de Entorno en Render

### 1.1 Acceder a la Configuración

1. Ve a tu dashboard de Render: https://dashboard.render.com
2. Selecciona tu servicio de **backend**
3. Ve a la sección **"Environment"** en el menú lateral

### 1.2 Variables de Entorno Requeridas

Agrega las siguientes variables de entorno en Render:

```bash
# ============================================
# CORINA - Configuración de WhatsApp/Twilio
# ============================================

# Twilio Account SID (obtener de Twilio Console)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Twilio Auth Token (obtener de Twilio Console - SECRETO)
TWILIO_AUTH_TOKEN=your_auth_token_here

# Número de WhatsApp de Twilio
# Para Sandbox (pruebas): whatsapp:+14155238886
# Para Producción: whatsapp:+1234567890 (tu número verificado)
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# ============================================
# CORINA - Configuración de OpenAI
# ============================================

# OpenAI API Key (para procesamiento de audio y NLP)
# Obtener de: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ============================================
# CORINA - Habilitar/Deshabilitar
# ============================================

# Habilitar CORINA (true/false)
CORINA_ENABLED=true

# ============================================
# URLs del Sistema
# ============================================

# URL pública de tu backend en Render
# Ejemplo: https://reforma-2-0.onrender.com
BACKEND_URL=https://tu-backend.onrender.com

# URL pública de tu frontend en Vercel
# Ejemplo: https://reforma-2-0.vercel.app
FRONTEND_URL=https://tu-frontend.vercel.app
```

### 1.3 Obtener Credenciales de Twilio

1. Ve a [Twilio Console](https://console.twilio.com/)
2. En el dashboard, encontrarás:
   - **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Auth Token**: Haz clic en "Show" para verlo (solo se muestra una vez)
3. Copia ambos valores y agrégalos a Render

### 1.4 Obtener API Key de OpenAI

1. Ve a [OpenAI Platform](https://platform.openai.com/)
2. Inicia sesión o crea una cuenta
3. Ve a **API Keys**: https://platform.openai.com/api-keys
4. Haz clic en **"Create new secret key"**
5. Copia la clave (solo se muestra una vez) y agrégalo a Render

### 1.5 Obtener URL del Backend en Render

1. Ve al dashboard de Render
2. Selecciona tu servicio de backend
3. En la parte superior, encontrarás la **URL pública**
   - Ejemplo: `https://reforma-2-0.onrender.com`
4. Copia esta URL completa (sin `/` al final)
5. Úsala para:
   - `BACKEND_URL` en Render
   - Configurar webhooks en Twilio (ver siguiente paso)

## 📱 Paso 2: Configurar Webhooks en Twilio

### 2.1 Configurar Webhook de WhatsApp (Sandbox o Producción)

#### Opción A: Twilio Sandbox (Para Pruebas)

1. Inicia sesión en [Twilio Console](https://console.twilio.com/)
2. Ve a **Messaging** > **Try it out** > **Send a WhatsApp message**
3. En la sección **Sandbox Configuration**, encontrarás:
   - **Sandbox Number**: `whatsapp:+14155238886` (o similar)
   - **Join Code**: Un código como `join <código>` (ejemplo: `join abc-xyz`)

4. En **"When a message comes in"**:
   - **URL**: `https://tu-backend.onrender.com/api/corina/whatsapp/webhook`
     - ⚠️ **Reemplaza `tu-backend.onrender.com` con tu URL real de Render**
   - **HTTP Method**: `POST`

5. En **"Status Callback URL"** (opcional pero recomendado):
   - **URL**: `https://tu-backend.onrender.com/api/corina/whatsapp/status`
   - **HTTP Method**: `POST`

6. Haz clic en **"Save"**

#### Opción B: Número de WhatsApp Verificado (Producción)

1. Ve a **Phone Numbers** > **Manage** > **Active numbers**
2. Selecciona tu número de WhatsApp verificado
3. En la sección **Messaging Configuration**:
   - **A MESSAGE COMES IN**:
     - **URL**: `https://tu-backend.onrender.com/api/corina/whatsapp/webhook`
     - **HTTP Method**: `POST`
   - **Status Callback URL**:
     - **URL**: `https://tu-backend.onrender.com/api/corina/whatsapp/status`
     - **HTTP Method**: `POST`
4. Haz clic en **"Save"**

### 2.2 Activar Twilio Sandbox (Solo si usas Sandbox)

1. Abre WhatsApp en tu teléfono
2. Envía un mensaje al número de Twilio Sandbox: `+1 415 523 8886`
3. Envía el código de activación que encontraste en el paso anterior:
   ```
   join abc-xyz
   ```
   (Reemplaza `abc-xyz` con tu código real)

4. Twilio responderá confirmando que el Sandbox está activado
5. Ahora puedes enviar y recibir mensajes desde tu aplicación

### 2.3 Verificar que los Webhooks Estén Configurados

1. En Twilio Console, verifica que las URLs sean exactamente:
   - `https://tu-backend.onrender.com/api/corina/whatsapp/webhook`
   - `https://tu-backend.onrender.com/api/corina/whatsapp/status`
2. ⚠️ **IMPORTANTE**: 
   - Las URLs deben usar **HTTPS** (no HTTP)
   - No deben terminar con `/`
   - Deben apuntar a tu backend en Render (no localhost)

## 🔐 Paso 3: Seguridad - Validación de Firmas Twilio

El sistema valida automáticamente que los webhooks provengan de Twilio usando firmas HMAC-SHA1. Esto está implementado en `backend/src/utils/corinaUtils.ts` y se ejecuta automáticamente en `backend/src/controllers/corinaController.ts`.

**✅ No necesitas hacer nada adicional** - el sistema valida las firmas automáticamente usando `TWILIO_AUTH_TOKEN`.

**⚠️ IMPORTANTE**: 
- Asegúrate de que `TWILIO_AUTH_TOKEN` esté correctamente configurado en Render
- La validación solo funciona si la URL del webhook en Twilio coincide exactamente con la URL de tu backend

## 🧪 Paso 4: Probar la Configuración

### 4.1 Verificar que el Backend está Escuchando

1. Abre tu navegador o usa `curl`:
   ```bash
   curl https://tu-backend.onrender.com/health
   ```

2. Debe responder con:
   ```json
   {"status":"OK","timestamp":"...","environment":"production"}
   ```

3. Si no responde, verifica:
   - Que el backend esté desplegado en Render
   - Que la URL sea correcta
   - Revisa los logs de Render para errores

### 4.2 Verificar Variables de Entorno en Render

1. Ve a Render Dashboard > Tu servicio backend > **Environment**
2. Verifica que todas las variables estén configuradas:
   - ✅ `TWILIO_ACCOUNT_SID`
   - ✅ `TWILIO_AUTH_TOKEN`
   - ✅ `TWILIO_WHATSAPP_NUMBER`
   - ✅ `OPENAI_API_KEY`
   - ✅ `CORINA_ENABLED=true`
   - ✅ `BACKEND_URL`
   - ✅ `FRONTEND_URL`

3. Si falta alguna, agrégalas y haz **"Manual Deploy"** o espera el auto-deploy

### 4.3 Enviar Mensaje de Prueba desde WhatsApp

1. Abre WhatsApp en tu teléfono
2. Envía un mensaje de texto a tu número de Twilio:
   - **Sandbox**: `+1 415 523 8886`
   - **Producción**: Tu número verificado

3. Ejemplo de mensaje:
   ```
   Hola CORINA
   ```

4. Revisa los logs de Render:
   - Ve a Render Dashboard > Tu servicio backend > **Logs**
   - Deberías ver:
     ```
     📱 Mensaje recibido de WhatsApp:
       Message SID: SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
       De: whatsapp:+5493515930163
       Para: whatsapp:+14155238886
       Mensaje: Hola CORINA
     ```

5. Si no ves los logs:
   - Verifica que el webhook esté configurado correctamente en Twilio
   - Verifica que la URL del webhook sea exactamente la de tu backend
   - Revisa los logs de Twilio en Twilio Console > Monitor > Logs

### 4.4 Verificar en la Base de Datos

Las interacciones se guardan en la tabla `t_corina_interaccion`. Puedes verificar:

**Opción A: Usar Prisma Studio (Local)**
```bash
cd backend
npm run prisma:studio
```
Luego abre http://localhost:5555 y busca la tabla `CorinaInteraccion`

**Opción B: Usar Supabase Dashboard**
1. Ve a tu proyecto en Supabase
2. Ve a **Table Editor**
3. Busca la tabla `t_corina_interaccion`
4. Deberías ver las interacciones recientes

## 📊 Endpoints de CORINA

### Webhooks (Públicos - sin autenticación)

- `POST /api/corina/whatsapp/webhook` - Recibe mensajes de WhatsApp
- `POST /api/corina/whatsapp/status` - Recibe actualizaciones de estado

### API Protegida (Requiere autenticación y plan ENTERPRISE)

- `GET /api/corina/interacciones` - Obtener historial de interacciones
- `GET /api/corina/notificaciones` - Obtener historial de notificaciones
- `GET /api/corina/estado` - Obtener estado de configuración
- `PUT /api/corina/configurar` - Configurar notificaciones
- `POST /api/corina/whatsapp/verificar-telefono/iniciar` - Iniciar verificación de teléfono
- `POST /api/corina/whatsapp/verificar-telefono/verificar` - Verificar código de teléfono

## 🔄 Diferencias con Desarrollo (Ngrok)

### En Desarrollo (con Ngrok)

- Ngrok creaba un túnel temporal: `https://abc123.ngrok.io`
- La URL cambiaba cada vez que reiniciabas Ngrok
- Útil para desarrollo local pero no para producción

### En Producción (Render)

- URL permanente: `https://tu-backend.onrender.com`
- No necesitas Ngrok
- Los webhooks de Twilio apuntan directamente a tu backend en Render
- Más estable y confiable

## 🚨 Paso 5: Troubleshooting

### Problema: El webhook no recibe mensajes

**Síntomas:**
- Envías un mensaje desde WhatsApp pero no aparece en los logs de Render
- No hay respuesta de CORINA

**Soluciones:**

1. **Verifica la URL en Twilio**:
   - Debe ser exactamente: `https://tu-backend.onrender.com/api/corina/whatsapp/webhook`
   - ⚠️ Sin `/` al final
   - ⚠️ Usa `https://` (no `http://`)
   - ⚠️ Reemplaza `tu-backend.onrender.com` con tu URL real

2. **Verifica que el backend esté corriendo**:
   ```bash
   curl https://tu-backend.onrender.com/health
   ```
   Debe responder con `{"status":"OK"}`

3. **Revisa los logs de Render**:
   - Ve a Render Dashboard > Tu servicio backend > **Logs**
   - Busca errores relacionados con Twilio o CORINA
   - Busca mensajes que digan `📱 Mensaje recibido de WhatsApp`

4. **Verifica las variables de entorno**:
   - `TWILIO_ACCOUNT_SID` debe estar configurado
   - `TWILIO_AUTH_TOKEN` debe estar configurado
   - `TWILIO_WHATSAPP_NUMBER` debe estar configurado
   - `CORINA_ENABLED` debe ser `true`

5. **Verifica los logs de Twilio**:
   - Ve a Twilio Console > **Monitor** > **Logs** > **Messaging**
   - Busca intentos de webhook que fallaron
   - Verifica el código de error (404, 500, etc.)

### Problema: Error "Firma de Twilio inválida"

**Síntomas:**
- Los logs muestran: `❌ Firma de Twilio inválida - rechazando webhook`
- Los mensajes no se procesan

**Soluciones:**

1. **Verifica `TWILIO_AUTH_TOKEN`**:
   - Debe estar correctamente configurado en Render
   - Debe ser el mismo token que aparece en Twilio Console
   - No debe tener espacios al inicio o final

2. **Verifica la URL del webhook**:
   - La URL en Twilio debe coincidir exactamente con la URL de tu backend
   - No debe haber diferencias en mayúsculas/minúsculas
   - No debe haber espacios

3. **Haz redeploy del backend**:
   - A veces Render necesita reiniciar para cargar nuevas variables
   - Ve a Render Dashboard > Tu servicio backend > **Manual Deploy**

### Problema: Los mensajes no se procesan

**Síntomas:**
- Los mensajes llegan al webhook pero CORINA no responde
- No hay interacciones en la base de datos

**Soluciones:**

1. **Verifica que el usuario tenga plan ENTERPRISE**:
   - CORINA solo funciona para usuarios con plan ENTERPRISE
   - Verifica en la base de datos: tabla `t_usuarios`, campo `planSuscripcion`

2. **Revisa los logs para errores**:
   - Busca errores relacionados con OpenAI
   - Busca errores relacionados con la base de datos
   - Busca errores de validación

3. **Verifica `OPENAI_API_KEY`**:
   - Debe estar configurada correctamente
   - Debe tener créditos disponibles
   - Verifica en OpenAI Dashboard: https://platform.openai.com/usage

4. **Verifica que el teléfono esté verificado**:
   - El usuario debe tener su teléfono verificado en REFORMA
   - Verifica en la base de datos: tabla `t_usuarios`, campo `telefonoVerificado`

### Problema: El audio no se transcribe

**Síntomas:**
- Se envía un audio pero CORINA no lo procesa
- No hay transcripción en los logs

**Soluciones:**

1. **Verifica `OPENAI_API_KEY`**:
   - Debe tener créditos disponibles
   - Verifica en OpenAI Dashboard: https://platform.openai.com/usage

2. **Revisa los logs para errores de OpenAI**:
   - Busca errores relacionados con transcripción
   - Busca errores de formato de audio

3. **Verifica el formato del audio**:
   - Formatos compatibles: MP3, WAV, M4A, OGG
   - El tamaño máximo es 10MB (configurado en el webhook)

### Problema: CORINA no está habilitada

**Síntomas:**
- Los mensajes llegan pero no hay respuesta
- Los logs muestran que CORINA está deshabilitada

**Soluciones:**

1. **Verifica `CORINA_ENABLED`**:
   - Debe ser `true` (no `True`, `TRUE`, o `"true"`)
   - Verifica en Render Dashboard > Environment

2. **Haz redeploy del backend**:
   - Render necesita reiniciar para cargar nuevas variables
   - Ve a Render Dashboard > Tu servicio backend > **Manual Deploy**

### Problema: Error 404 en el webhook

**Síntomas:**
- Twilio muestra error 404 al intentar enviar al webhook
- Los logs de Render no muestran ningún intento

**Soluciones:**

1. **Verifica la ruta del webhook**:
   - Debe ser: `/api/corina/whatsapp/webhook`
   - Verifica que las rutas estén correctamente configuradas en `backend/src/routes/corinaRoutes.ts`

2. **Verifica que el backend esté corriendo**:
   - Usa el health check para verificar

3. **Verifica que el servicio esté desplegado**:
   - Render puede tardar unos minutos en desplegar
   - Espera a que el deploy termine completamente

## 📝 Notas Importantes

1. **✅ Siempre usa HTTPS**: Twilio requiere HTTPS para los webhooks en producción
2. **🔐 No compartas tus tokens**: `TWILIO_AUTH_TOKEN` y `OPENAI_API_KEY` son secretos - nunca los compartas
3. **💰 Monitorea los costos**: 
   - Twilio cobra por mensajes enviados/recibidos
   - OpenAI cobra por uso de API (transcripción de audio, NLP)
   - Revisa regularmente tus facturas
4. **⭐ Plan ENTERPRISE**: CORINA solo está disponible para usuarios con plan ENTERPRISE
5. **🔄 Redeploy después de cambios**: Si cambias variables de entorno, haz redeploy del backend en Render
6. **📊 Monitorea los logs**: Revisa regularmente los logs de Render y Twilio para detectar problemas

## ✅ Checklist de Configuración

Usa este checklist para asegurarte de que todo esté configurado correctamente:

### Variables de Entorno en Render
- [ ] `TWILIO_ACCOUNT_SID` configurado
- [ ] `TWILIO_AUTH_TOKEN` configurado
- [ ] `TWILIO_WHATSAPP_NUMBER` configurado (formato: `whatsapp:+1234567890`)
- [ ] `OPENAI_API_KEY` configurado
- [ ] `CORINA_ENABLED=true` configurado
- [ ] `BACKEND_URL` configurado (URL completa de Render)
- [ ] `FRONTEND_URL` configurado (URL completa de Vercel)

### Configuración en Twilio
- [ ] Webhook configurado: `https://tu-backend.onrender.com/api/corina/whatsapp/webhook`
- [ ] Status Callback configurado: `https://tu-backend.onrender.com/api/corina/whatsapp/status`
- [ ] Método HTTP: `POST` para ambos webhooks
- [ ] Twilio Sandbox activado (si usas Sandbox)

### Verificación
- [ ] Health check del backend funciona: `curl https://tu-backend.onrender.com/health`
- [ ] Mensaje de prueba enviado desde WhatsApp
- [ ] Mensaje aparece en los logs de Render
- [ ] Interacción guardada en la base de datos
- [ ] CORINA responde al mensaje

## 🔗 Enlaces Útiles

- [Documentación de Twilio WhatsApp](https://www.twilio.com/docs/whatsapp)
- [Twilio Console](https://console.twilio.com/)
- [Render Dashboard](https://dashboard.render.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs)

