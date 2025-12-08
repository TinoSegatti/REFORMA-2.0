# Configuración de Variables de Entorno para CORINA

## 📋 Variables Requeridas en Producción (Render)

### Variables OBLIGATORIAS

```bash
# Twilio - Credenciales (OBLIGATORIAS)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_auth_token_aqui
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# OpenAI - API Key (OBLIGATORIA)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Habilitar CORINA (OBLIGATORIA)
CORINA_ENABLED=true

# URLs de Producción (OBLIGATORIAS)
BACKEND_URL=https://tu-backend.onrender.com
FRONTEND_URL=https://tu-frontend.vercel.app
```

### Variables Opcionales

```bash
# Debug (opcional - solo para desarrollo)
CORINA_DEBUG=true

# Puerto (opcional - por defecto 3000)
PORT=3000
```

## ❌ Variables que NO debes usar en Producción

**NO configures estas variables en Render (solo para desarrollo local):**

```bash
# ❌ NO USAR EN PRODUCCIÓN
NGROK_URL=https://xxxxx.ngrok-free.dev
TWILIO_WEBHOOK_URL=https://xxxxx.ngrok-free.dev/api/corina/whatsapp/webhook
TWILIO_WHATSAPP_TO=whatsapp:+5493515930163
```

**Razones:**
- `NGROK_URL`: Solo para desarrollo local. En producción usa `BACKEND_URL`.
- `TWILIO_WEBHOOK_URL`: No se usa en el código. El webhook se configura directamente en Twilio Console.
- `TWILIO_WHATSAPP_TO`: Solo para scripts de prueba. No se usa en producción.

## 🔧 Configuración Paso a Paso

### Paso 1: Configurar Variables en Render

1. Ve a **Render Dashboard** > Tu servicio backend > **Environment**
2. Agrega las variables obligatorias (ver arriba)
3. **NO agregues** las variables marcadas como "NO USAR EN PRODUCCIÓN"
4. Haz **Manual Deploy** después de agregar/modificar variables

### Paso 2: Configurar Webhook en Twilio

1. Ve a [Twilio Console](https://console.twilio.com/)
2. Ve a **Messaging** > **Try it out** > **Send a WhatsApp message**
3. En **Sandbox Configuration**, configura:
   - **When a message comes in**: `https://tu-backend.onrender.com/api/corina/whatsapp/webhook`
   - **Method**: `POST`
   - **Status Callback URL**: `https://tu-backend.onrender.com/api/corina/whatsapp/status`
   - **Method**: `POST`
4. Guarda los cambios

**⚠️ IMPORTANTE:**
- Usa tu URL de Render (no localhost ni ngrok)
- La URL debe usar `https://` (no `http://`)
- No debe terminar con `/`

### Paso 3: Verificar Configuración

1. Verifica que `CORINA_ENABLED=true` esté configurado
2. Verifica que todas las variables obligatorias estén configuradas
3. Haz redeploy del backend
4. Envía un mensaje de prueba desde WhatsApp

## 🚨 Solución de Problemas

### CORINA no responde

**Verifica:**
1. `CORINA_ENABLED=true` (exactamente `true`, no `True` ni `TRUE`)
2. `TWILIO_ACCOUNT_SID` y `TWILIO_AUTH_TOKEN` están configurados correctamente
3. El webhook en Twilio apunta a tu URL de Render (no ngrok)
4. El backend está corriendo (verifica logs en Render)

### Error: "CORINA está deshabilitado"

**Causa:** `CORINA_ENABLED` no está configurado o no es exactamente `true`.

**Solución:**
1. Ve a Render Dashboard > Environment
2. Verifica que `CORINA_ENABLED=true` (sin espacios, minúsculas)
3. Haz redeploy del backend

### El servicio se cae si no tengo NGROK

**Causa:** Estás usando variables de desarrollo (`NGROK_URL`) en producción.

**Solución:**
1. Elimina `NGROK_URL` de las variables de entorno en Render
2. Asegúrate de tener `BACKEND_URL` configurado con tu URL de Render
3. El código ya está preparado para funcionar sin `NGROK_URL` en producción

## 📝 Notas Importantes

1. **Formato de teléfono:** `TWILIO_WHATSAPP_NUMBER` debe incluir `whatsapp:` al inicio: `whatsapp:+14155238886`
2. **Variables de entorno:** Después de cambiar variables, haz redeploy del backend
3. **Webhook:** Se configura en Twilio Console, no en variables de entorno
4. **NGROK:** Solo para desarrollo local. En producción no es necesario

## 🔗 Enlaces Útiles

- [Twilio Console](https://console.twilio.com/)
- [Render Dashboard](https://dashboard.render.com/)
- [Documentación de Twilio WhatsApp](https://www.twilio.com/docs/whatsapp)

