# 📱 Cómo Conectar tu Número al Sandbox de Twilio

## ⚠️ Problema

Recibes este mensaje:
```
⚠ Your number whatsapp: +5493515930163 is not connected to a Sandbox. 
You need to connect it first by sending join <sandbox name>.
```

---

## ✅ Solución: Conectarse al Sandbox

### Paso 1: Encontrar el Nombre del Sandbox

1. **Accede a Twilio Console:**
   - Ve a: https://console.twilio.com/

2. **Navega al Sandbox:**
   - Ve a: **"Messaging"** → **"Try it out"** → **"Send a WhatsApp message"**
   - O directamente: https://console.twilio.com/us1/develop/sms/sandbox
   - O: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn

3. **Busca el código del Sandbox:**
   - En la página verás un código como: `join example-code`
   - O un código de 2 palabras como: `join happy-forest`
   - **Copia este código completo** (incluyendo "join")

---

### Paso 2: Conectarse desde WhatsApp

1. **Abre WhatsApp** en tu teléfono (`+5493515930163`)

2. **Envía el código del Sandbox** al número de Twilio:
   - **Número de Twilio:** `+1 415 523 8886` (número estándar del Sandbox)
   - **Mensaje a enviar:** El código que copiaste, por ejemplo:
     ```
     join example-code
     ```
     o
     ```
     join happy-forest
     ```

3. **Confirma la conexión:**
   - Twilio te responderá con un mensaje de bienvenida
   - Deberías ver algo como: "You're all set! You've joined the Sandbox..."

---

### Paso 3: Verificar en Twilio Console

1. **Vuelve a Twilio Console:**
   - Ve a: https://console.twilio.com/us1/develop/sms/sandbox

2. **Verifica que tu número aparezca:**
   - En la sección "Sandbox participants" deberías ver tu número
   - Estado: **"Active"** o **"Joined"**

---

## 🔄 Re-conectarse al Sandbox

**⚠️ IMPORTANTE:** La membresía del Sandbox dura **72 horas**.

Si pasan 72 horas y necesitas reconectarte:

1. **Vuelve a enviar el código** `join <sandbox-name>` al número de Twilio
2. **Puedes reconectarte las veces que quieras** (no hay límite)

---

## 📋 Checklist de Verificación

- [ ] Accedí a Twilio Console
- [ ] Encontré el código del Sandbox (ej: `join example-code`)
- [ ] Envié el código al número `+1 415 523 8886` desde WhatsApp
- [ ] Recibí mensaje de confirmación de Twilio
- [ ] Mi número aparece en "Sandbox participants" en Twilio Console
- [ ] ngrok está corriendo (`ngrok http 3000`)
- [ ] El webhook está configurado en Twilio Console

---

## 🧪 Probar que Funciona

Una vez conectado, puedes probar enviando un mensaje a Corina:

1. **Desde WhatsApp**, envía un mensaje al número de Twilio: `+1 415 523 8886`
2. **Ejemplo de mensaje:**
   ```
   crear materia prima maíz código MAIZ precio 1500
   ```
3. **Corina debería responder** automáticamente

---

## 🔗 Enlaces Útiles

- **Twilio Console:** https://console.twilio.com/
- **Sandbox:** https://console.twilio.com/us1/develop/sms/sandbox
- **WhatsApp Sandbox Guide:** https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
- **Número de Twilio Sandbox:** `+1 415 523 8886`

---

## ❓ Preguntas Frecuentes

### ¿Cuál es el número de Twilio Sandbox?

**Respuesta:** `+1 415 523 8886` (número estándar para todos los Sandboxes de Twilio)

### ¿Dónde encuentro el código del Sandbox?

**Respuesta:** En Twilio Console → Messaging → Try it out → Send a WhatsApp message

O directamente: https://console.twilio.com/us1/develop/sms/sandbox

### ¿Cuánto dura la conexión?

**Respuesta:** 72 horas. Después de ese tiempo, debes reconectarte enviando el código nuevamente.

### ¿Puedo reconectarme?

**Respuesta:** Sí, puedes reconectarte las veces que quieras enviando el código `join <sandbox-name>`.

### ¿Por qué no recibo respuesta de Corina?

**Verifica:**
1. ✅ Estás conectado al Sandbox (tu número aparece en "Sandbox participants")
2. ✅ ngrok está corriendo (`ngrok http 3000`)
3. ✅ El webhook está configurado en Twilio Console
4. ✅ El servidor backend está corriendo (`npm run dev`)

---

## 📝 Notas

- **El Sandbox es solo para pruebas** - Tiene límites (50 mensajes/día)
- **Para producción** necesitarás un número de WhatsApp Business verificado
- **El número de Twilio Sandbox** (`+1 415 523 8886`) es el mismo para todos los usuarios

---

## 🔗 Archivos Relacionados

- `docs/09-SISTEMAS/GUIA_CREDENCIALES_CORINA.md` - Configuración completa de Corina
- `docs/09-SISTEMAS/PLAN_TRABAJO_CORINA.md` - Plan de trabajo del sistema Corina
- `docs/06-GUIAS/CONFIGURACION/IMPACTO_PAUSAR_NGROK.md` - Impacto de pausar ngrok



