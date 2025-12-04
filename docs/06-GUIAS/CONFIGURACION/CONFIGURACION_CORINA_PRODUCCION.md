# Configuración de CORINA en Producción

CORINA es el sistema de IA que permite interactuar con REFORMA a través de WhatsApp usando Twilio. Esta guía explica cómo configurar CORINA en producción, reemplazando el uso de Ngrok que se utilizaba en desarrollo.

## 📋 Requisitos Previos

- Backend desplegado en Render (o similar)
- Cuenta de Twilio con WhatsApp Business API habilitada
- Plan ENTERPRISE activo en REFORMA
- Variables de entorno configuradas correctamente

## 🔧 Configuración en Render

### 1. Variables de Entorno Requeridas

Configura las siguientes variables en el dashboard de Render:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886  # Número de Twilio Sandbox o tu número verificado

# OpenAI (para procesamiento de audio y NLP)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Backend URL (URL pública de tu backend en Render)
BACKEND_URL=https://tu-backend.onrender.com
FRONTEND_URL=https://tu-frontend.vercel.app
```

### 2. Obtener URL del Backend en Render

1. Ve al dashboard de Render
2. Selecciona tu servicio de backend
3. Copia la URL pública (ejemplo: `https://reforma-backend.onrender.com`)
4. Esta URL se usará para configurar los webhooks en Twilio

## 📱 Configuración en Twilio

### 1. Configurar Webhook de WhatsApp

1. Inicia sesión en [Twilio Console](https://console.twilio.com/)
2. Ve a **Messaging** > **Try it out** > **Send a WhatsApp message**
3. O ve a **Phone Numbers** > **Manage** > **Active numbers** y selecciona tu número de WhatsApp

4. En la sección **Messaging Configuration**, busca **A MESSAGE COMES IN**:
   - URL: `https://tu-backend.onrender.com/api/corina/whatsapp/webhook`
   - Método: `POST`

5. En **Status Callback URL**:
   - URL: `https://tu-backend.onrender.com/api/corina/whatsapp/status`
   - Método: `POST`

### 2. Configurar Twilio Sandbox (Desarrollo/Pruebas)

Si estás usando el Sandbox de Twilio:

1. Ve a **Messaging** > **Try it out** > **Send a WhatsApp message**
2. Encuentra el código de activación (ejemplo: `join <código>`)
3. Envía este código desde tu WhatsApp al número de Twilio Sandbox
4. Una vez activado, podrás recibir y enviar mensajes

### 3. Verificar Número de WhatsApp (Producción)

Para usar tu propio número en producción:

1. Ve a **Phone Numbers** > **Manage** > **Buy a number**
2. Selecciona un número con capacidad de WhatsApp
3. Configura los webhooks como se indicó arriba
4. Verifica el número siguiendo las instrucciones de Twilio

## 🔐 Seguridad: Validación de Firmas Twilio

El sistema valida automáticamente que los webhooks provengan de Twilio usando firmas HMAC-SHA1. Esto está implementado en `backend/src/utils/corinaUtils.ts` y se ejecuta automáticamente en `backend/src/controllers/corinaController.ts`.

**No necesitas hacer nada adicional** - el sistema valida las firmas automáticamente usando `TWILIO_AUTH_TOKEN`.

## 🧪 Probar la Configuración

### 1. Verificar que el Backend está Escuchando

```bash
# Health check
curl https://tu-backend.onrender.com/health

# Debe responder con:
# {"status":"OK","timestamp":"...","environment":"production"}
```

### 2. Enviar Mensaje de Prueba desde WhatsApp

1. Envía un mensaje de texto a tu número de Twilio WhatsApp
2. El mensaje debe llegar al webhook: `/api/corina/whatsapp/webhook`
3. Revisa los logs de Render para verificar que se recibió el mensaje

### 3. Verificar en la Base de Datos

Las interacciones se guardan en la tabla `t_corina_interaccion`. Puedes verificar usando Prisma Studio:

```bash
cd backend
npm run prisma:studio
```

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

## 🚨 Troubleshooting

### El webhook no recibe mensajes

1. **Verifica la URL en Twilio**: Debe ser exactamente `https://tu-backend.onrender.com/api/corina/whatsapp/webhook`
2. **Verifica que el backend esté corriendo**: Usa el health check
3. **Revisa los logs de Render**: Busca errores relacionados con Twilio
4. **Verifica las variables de entorno**: Especialmente `TWILIO_AUTH_TOKEN`

### Error: "Firma de Twilio inválida"

- Verifica que `TWILIO_AUTH_TOKEN` esté correctamente configurado en Render
- Asegúrate de que la URL del webhook en Twilio coincida exactamente con la URL de tu backend

### Los mensajes no se procesan

1. Verifica que el usuario tenga plan ENTERPRISE
2. Revisa los logs para ver si hay errores en el procesamiento
3. Verifica que `OPENAI_API_KEY` esté configurada correctamente

### El audio no se transcribe

- Verifica que `OPENAI_API_KEY` tenga créditos disponibles
- Revisa los logs para ver errores de OpenAI
- Verifica que el formato del audio sea compatible (MP3, WAV, etc.)

## 📝 Notas Importantes

1. **Siempre usa HTTPS**: Twilio requiere HTTPS para los webhooks en producción
2. **No compartas tus tokens**: `TWILIO_AUTH_TOKEN` y `OPENAI_API_KEY` son secretos
3. **Monitorea los costos**: Twilio y OpenAI tienen costos por uso
4. **Plan ENTERPRISE**: CORINA solo está disponible para usuarios con plan ENTERPRISE

## 🔗 Enlaces Útiles

- [Documentación de Twilio WhatsApp](https://www.twilio.com/docs/whatsapp)
- [Twilio Console](https://console.twilio.com/)
- [Render Dashboard](https://dashboard.render.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs)

