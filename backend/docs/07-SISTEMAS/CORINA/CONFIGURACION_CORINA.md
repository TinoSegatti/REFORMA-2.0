# Configuración de Variables de Entorno para CORINA

Agrega las siguientes variables a tu archivo `.env` en la carpeta `backend/`:

```env
# ============================================
# CORINA - WhatsApp (Twilio)
# ============================================
TWILIO_ACCOUNT_SID=ACa5bcfb29fa7328d47b5f1d25c9d3a33a
TWILIO_AUTH_TOKEN=25926cd44085346670496d8acc4ef231
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_WHATSAPP_TO=whatsapp:+5493515930163
TWILIO_WEBHOOK_URL=https://unmerciful-ossie-fluent.ngrok-free.dev/api/corina/whatsapp/webhook

# ============================================
# CORINA - OpenAI (Whisper + GPT-3.5)
# ============================================
OPENAI_API_KEY=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

# ============================================
# CORINA - Configuración General
# ============================================
CORINA_ENABLED=true
CORINA_DEBUG=true
```

## Verificación

Después de configurar las variables, prueba las conexiones:

```bash
# Verificar credenciales de Twilio
npm run test-twilio-credentials

# Verificar OpenAI y Whisper API
npm run test-openai-whisper

# Enviar mensaje de prueba por WhatsApp
npm run test-whatsapp-send
```

## Notas Importantes

- ⚠️ **NUNCA** subas el archivo `.env` al repositorio (está en `.gitignore`)
- ⚠️ La URL de ngrok cambiará cada vez que reinicies ngrok
- ⚠️ Actualiza `TWILIO_WEBHOOK_URL` en Twilio Console si cambias la URL de ngrok
- ⚠️ La API Key de OpenAI es sensible, mantenla segura






