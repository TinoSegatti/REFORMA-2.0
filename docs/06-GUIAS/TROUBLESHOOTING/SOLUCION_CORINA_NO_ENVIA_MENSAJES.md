# Solución: CORINA no envía mensajes de bienvenida

## 🔍 Problema

CORINA recibe mensajes de WhatsApp pero no responde con el mensaje de bienvenida ni procesa comandos.

## 📋 Checklist de Diagnóstico

### 1. Verificar Variables de Entorno

**Variables REQUERIDAS en Render:**

```bash
# Twilio (OBLIGATORIAS)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_auth_token_aqui
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# OpenAI (OBLIGATORIA)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Habilitar CORINA (OBLIGATORIA)
CORINA_ENABLED=true

# URLs (OBLIGATORIAS)
BACKEND_URL=https://tu-backend.onrender.com
FRONTEND_URL=https://tu-frontend.vercel.app
```

**⚠️ IMPORTANTE:**
- `TWILIO_WHATSAPP_NUMBER` debe tener el formato: `whatsapp:+14155238886` (con `whatsapp:` al inicio)
- `TWILIO_AUTH_TOKEN` no debe tener espacios al inicio o final
- `CORINA_ENABLED` debe ser exactamente `true` (no `True`, `TRUE`, o `"true"`)

### 2. Verificar que el Usuario Existe y Está Verificado

CORINA solo responde a usuarios que:
- ✅ Tienen un teléfono registrado en la base de datos
- ✅ Tienen `telefonoVerificado = true`
- ✅ El teléfono en la BD coincide con el número de WhatsApp que envía el mensaje

**Formato del teléfono en la BD:**
- Debe coincidir exactamente con el formato que Twilio envía: `whatsapp:+5493515930163`
- Ejemplo: Si envías desde `+5493515930163`, en la BD debe estar como `whatsapp:+5493515930163`

**Verificar en la base de datos:**

```sql
SELECT id, email, telefono, "telefonoVerificado", "planSuscripcion"
FROM t_usuarios
WHERE telefono = 'whatsapp:+5493515930163';
```

**Si el usuario no existe o no está verificado:**

1. Verifica que el teléfono esté registrado en la aplicación web
2. Verifica el teléfono desde la aplicación web (debe estar verificado)
3. Asegúrate de que el formato del teléfono sea correcto

### 3. Verificar Cliente de Twilio

El cliente de Twilio se inicializa al inicio del servicio. Verifica en los logs:

```
✅ Twilio client inicializado correctamente
```

Si ves:
```
❌ Twilio client no configurado
```

**Solución:**
- Verifica que `TWILIO_ACCOUNT_SID` y `TWILIO_AUTH_TOKEN` estén correctamente configurados
- Haz redeploy del backend después de agregar/modificar variables de entorno

### 4. Verificar Logs de Render

Cuando envías un mensaje desde WhatsApp, deberías ver en los logs:

```
📱 Mensaje recibido de WhatsApp:
  Message SID: SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  De: whatsapp:+5493515930163
  Para: whatsapp:+14155238886
  Mensaje: Hola
```

**Si NO ves estos logs:**
- El webhook no está llegando al backend
- Verifica la URL del webhook en Twilio Console
- Verifica que el backend esté corriendo (health check)

**Si ves los logs pero CORINA no responde:**

Busca estos mensajes en los logs:

```
❌ Usuario no encontrado o teléfono no verificado
```

**Solución:** Verifica el teléfono del usuario en la BD (ver paso 2)

```
❌ Twilio client no configurado
```

**Solución:** Verifica variables de entorno de Twilio (ver paso 1)

```
❌ Error enviando mensaje WhatsApp: [error details]
```

**Solución:** Revisa el error específico (ver sección de errores comunes)

### 5. Verificar Plan ENTERPRISE

**⚠️ IMPORTANTE:** El mensaje de bienvenida NO requiere plan ENTERPRISE, pero algunos comandos sí.

Si el usuario no tiene plan ENTERPRISE, CORINA debería enviar el mensaje de bienvenida de todas formas.

**Verificar plan del usuario:**

```sql
SELECT id, email, "planSuscripcion"
FROM t_usuarios
WHERE telefono = 'whatsapp:+5493515930163';
```

### 6. Verificar Webhook en Twilio

1. Ve a [Twilio Console](https://console.twilio.com/)
2. Ve a **Messaging** > **Try it out** > **Send a WhatsApp message**
3. Verifica que el webhook esté configurado:
   - **When a message comes in**: `https://tu-backend.onrender.com/api/corina/whatsapp/webhook`
   - **Method**: `POST`
   - **Status Callback URL**: `https://tu-backend.onrender.com/api/corina/whatsapp/status`
   - **Method**: `POST`

**⚠️ IMPORTANTE:**
- La URL debe usar `https://` (no `http://`)
- No debe terminar con `/`
- Debe apuntar a tu backend en Render (no localhost ni ngrok)

### 7. Verificar que el Backend Esté Corriendo

```bash
curl https://tu-backend.onrender.com/health
```

Debe responder:
```json
{"status":"OK","timestamp":"...","environment":"production"}
```

## 🚨 Errores Comunes y Soluciones

### Error: "Twilio client no configurado"

**Causa:** Las variables de entorno de Twilio no están configuradas o son incorrectas.

**Solución:**
1. Verifica `TWILIO_ACCOUNT_SID` y `TWILIO_AUTH_TOKEN` en Render
2. Asegúrate de que no tengan espacios al inicio o final
3. Haz redeploy del backend

### Error: "Usuario no encontrado o teléfono no verificado"

**Causa:** El teléfono del usuario no está en la BD o no está verificado.

**Solución:**
1. Verifica que el usuario tenga un teléfono registrado
2. Verifica que `telefonoVerificado = true` en la BD
3. Verifica que el formato del teléfono sea correcto: `whatsapp:+5493515930163`

### Error: "Límite diario de mensajes de Twilio Sandbox alcanzado"

**Causa:** El Sandbox de Twilio tiene un límite de 50 mensajes por día.

**Solución:**
- Espera 24 horas para que se resetee el límite
- O actualiza a WhatsApp Business API completo (producción)

### Error: "Error enviando mensaje WhatsApp: [código de error]"

**Códigos de error comunes:**

- **21609**: Error con StatusCallback
  - **Solución:** El sistema intenta automáticamente sin StatusCallback. Si persiste, verifica la configuración en Twilio Console.

- **63038**: Límite diario alcanzado
  - **Solución:** Espera 24 horas o actualiza a producción.

- **21211**: URL inválida
  - **Solución:** Verifica que `TWILIO_WHATSAPP_NUMBER` tenga el formato correcto: `whatsapp:+14155238886`

- **20003**: Credenciales inválidas
  - **Solución:** Verifica `TWILIO_ACCOUNT_SID` y `TWILIO_AUTH_TOKEN`

## 🔧 Pasos de Solución Paso a Paso

### Paso 1: Verificar Variables de Entorno

1. Ve a Render Dashboard > Tu servicio backend > **Environment**
2. Verifica que todas las variables estén configuradas (ver checklist arriba)
3. Si falta alguna, agrégalas y haz **Manual Deploy**

### Paso 2: Verificar Usuario en Base de Datos

1. Conecta a tu base de datos (Supabase Dashboard o Prisma Studio)
2. Busca el usuario por teléfono:
   ```sql
   SELECT * FROM t_usuarios WHERE telefono = 'whatsapp:+5493515930163';
   ```
3. Si no existe, agrégalo desde la aplicación web
4. Si existe pero `telefonoVerificado = false`, verifica el teléfono desde la aplicación web

### Paso 3: Verificar Logs de Render

1. Ve a Render Dashboard > Tu servicio backend > **Logs**
2. Envía un mensaje desde WhatsApp
3. Busca los logs mencionados arriba
4. Si ves errores, sigue las soluciones de la sección "Errores Comunes"

### Paso 4: Probar Envío Manual

Si todo lo anterior está correcto pero CORINA aún no responde, prueba enviar un mensaje manualmente usando el script de prueba:

```bash
cd backend
npm run test-whatsapp-send
```

Este script enviará un mensaje de prueba directamente usando Twilio API.

## 📝 Notas Importantes

1. **Formato del teléfono:** Siempre debe incluir `whatsapp:` al inicio: `whatsapp:+5493515930163`
2. **Variables de entorno:** Después de cambiar variables de entorno, haz redeploy del backend
3. **Logs:** Los logs de Render son tu mejor herramienta para diagnosticar problemas
4. **Sandbox:** El Sandbox de Twilio tiene límites (50 mensajes/día). Para producción, actualiza a WhatsApp Business API completo.

## 🔗 Enlaces Útiles

- [Twilio Console](https://console.twilio.com/)
- [Render Dashboard](https://dashboard.render.com/)
- [Documentación de Twilio WhatsApp](https://www.twilio.com/docs/whatsapp)

