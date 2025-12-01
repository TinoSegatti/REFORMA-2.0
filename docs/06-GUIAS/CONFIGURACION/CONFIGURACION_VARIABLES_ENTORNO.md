# 🔧 Configuración de Variables de Entorno - Mercado Pago

## 📋 Variables Requeridas para `backend/.env`

Agrega las siguientes variables al archivo `backend/.env`:

```env
# ============================================
# MERCADO PAGO - CREDENCIALES DE PRODUCCIÓN
# ============================================
MERCADOPAGO_ACCESS_TOKEN=APP_USR-7406418976971664-111816-8caab73dd36eb423bbd6862a6c8cfde9-812350056

# ============================================
# MERCADO PAGO - WEBHOOK SECRET
# ============================================
MERCADOPAGO_WEBHOOK_SECRET=f59961b12a17a27d78a6d7a5e6628393c56e30ce69e2543d2ab0eb4bca285551

# ============================================
# FRONTEND URL
# ============================================
# Para desarrollo local:
FRONTEND_URL=http://localhost:3001

# Para producción (cuando estés listo):
# FRONTEND_URL=https://tu-dominio.com
```

## 🔑 Credenciales Proporcionadas

### Access Token (Producción)
```
APP_USR-7406418976971664-111816-8caab73dd36eb423bbd6862a6c8cfde9-812350056
```

### Public Key
```
APP_USR-362cf099-f1a7-4618-af5e-a0ec24006398
```

### Client ID
```
7406418976971664
```

### Client Secret
```
GB1j44vRCxioqcgGHVyWJYW26SDFx99T
```

### Webhook Secret
```
f59961b12a17a27d78a6d7a5e6628393c56e30ce69e2543d2ab0eb4bca285551
```

## 🌐 Configuración de ngrok

### Variable de Entorno NGROK_URL (Recomendado)

**⚠️ IMPORTANTE:** La URL de ngrok cambia cada vez que reinicias ngrok (versión gratuita).

**Para evitar modificar código cada vez, configura `NGROK_URL` en `backend/.env`:**

```env
# ============================================
# NGROK - URL PÚBLICA (Desarrollo Local)
# ============================================
# ⚠️ Esta URL cambia cada vez que reinicias ngrok
# Actualiza esta variable cuando obtengas una nueva URL
NGROK_URL=https://unmerciful-ossie-fluent.ngrok-free.dev
```

**Tu configuración actual de ngrok:**
- **URL pública**: `https://unmerciful-ossie-fluent.ngrok-free.dev`
- **Redirige a**: `http://localhost:3000`
- **Webhook configurado**: `https://unmerciful-ossie-fluent.ngrok-free.dev/api/suscripcion/webhook/mercadopago`

**¿Cómo funciona?**
- El código usa `process.env.NGROK_URL` si existe
- Si no existe, usa la URL por defecto como fallback
- **Recomendado:** Configurar `NGROK_URL` para no modificar código

**Ver:** `docs/06-GUIAS/CONFIGURACION/GUIA_URL_NGROK.md` para instrucciones detalladas.

## ⚠️ Importante

1. **No compartas estas credenciales** públicamente
2. **Reinicia el servidor backend** después de agregar las variables
3. **Verifica que ngrok esté corriendo** cuando pruebes los webhooks
4. **Actualiza `NGROK_URL`** cada vez que reinicies ngrok y obtengas una nueva URL
5. **Para producción**, cambia `FRONTEND_URL` a tu dominio real y no necesitarás ngrok

## 🧪 Probar Configuración

Después de configurar las variables:

1. Reiniciar servidor backend:
   ```bash
   cd backend
   npm run dev
   ```

2. Verificar que no haya errores relacionados con `MERCADOPAGO_ACCESS_TOKEN`

3. Probar crear checkout desde el frontend

4. Verificar logs del backend para ver si se reciben los webhooks

