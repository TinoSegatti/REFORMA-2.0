# 🔄 Actualización de ngrok Requerida

## ⚠️ Advertencia Importante

**ngrok Free Users**: Los agentes con versión ≤3.18.x dejarán de conectarse el **17 de diciembre de 2025**.

Tu versión actual: **3.24.0-msix**  
Versión disponible: **3.33.1**

---

## ✅ Estado Actual

- ✅ **ngrok está corriendo** en `localhost:3000`
- ✅ **URL activa**: `https://unmerciful-ossie-fluent.ngrok-free.dev`
- ✅ **Funcionalidades activas**:
  - ✅ Corina Bot (WhatsApp) - Webhooks de Twilio
  - ✅ Suscripciones - Webhooks de Mercado Pago

---

## 🔧 Cómo Actualizar ngrok

### Opción 1: Actualización desde la terminal (Recomendado)

```bash
# En la terminal donde corre ngrok:
Ctrl + U
```

O descarga la última versión desde: https://ngrok.com/download

### Opción 2: Descargar manualmente

1. Ve a: https://ngrok.com/download
2. Descarga la versión para tu sistema operativo
3. Reemplaza el ejecutable de ngrok
4. Reinicia ngrok

---

## 📋 Después de Actualizar

### 1. Verificar la nueva URL

Después de actualizar, ngrok puede generar una nueva URL. Verifica:

```bash
# La URL aparecerá en la terminal de ngrok
Forwarding: https://nueva-url.ngrok-free.dev -> http://localhost:3000
```

### 2. Actualizar Webhooks

Si la URL cambió, actualiza:

#### **Twilio Console:**
- Ve a: https://console.twilio.com/
- Configuración → WhatsApp → Sandbox
- Actualiza el webhook a: `https://NUEVA-URL/api/corina/whatsapp/webhook`

#### **Mercado Pago:**
- Ve a: https://www.mercadopago.com.ar/developers/panel
- Tu aplicación → Webhooks
- Actualiza la URL a: `https://NUEVA-URL/api/suscripcion/webhook/mercadopago`

#### **Variables de Entorno:**
Si usas `NGROK_URL` en `backend/.env`, actualízala:
```env
NGROK_URL=https://nueva-url.ngrok-free.dev
```

---

## 🎯 Funcionalidades Activas Ahora

Con ngrok corriendo en `localhost:3000`, estas funcionalidades están **ACTIVAS**:

### ✅ Corina Bot (WhatsApp)
- ✅ Recibe mensajes de WhatsApp
- ✅ Procesa comandos (`CREAR_MATERIA_PRIMA`, `CREAR_PROVEEDOR`, etc.)
- ✅ Responde a usuarios automáticamente

### ✅ Suscripciones (Mercado Pago)
- ✅ Recibe notificaciones de pago
- ✅ Activa planes automáticamente después del pago
- ✅ Actualiza estado de suscripción

---

## 📝 Notas

1. **La URL cambia cada vez que reinicias ngrok** (versión gratuita)
2. **NO necesitas modificar el código**: Usa `NGROK_URL` en `backend/.env`
3. **Debes actualizar los webhooks** en Twilio y Mercado Pago si cambia la URL
4. **Mantén ngrok corriendo** mientras necesites estas funcionalidades
5. **Actualiza ngrok antes del 17/12/2025** para evitar interrupciones

### ⚠️ IMPORTANTE: La URL NO se mantiene hasta el 17/12/2025

**La fecha del 17/12/2025 es sobre la versión del cliente de ngrok, NO sobre la URL.**

**La URL cambiará cada vez que reinicies ngrok** (versión gratuita).

**Solución:** Configura `NGROK_URL` en `backend/.env` para no modificar código.

Ver: `docs/06-GUIAS/CONFIGURACION/GUIA_URL_NGROK.md` para instrucciones detalladas.

---

## 🔗 Enlaces Útiles

- **Descargar ngrok**: https://ngrok.com/download
- **Precios ngrok**: https://ngrok.com/pricing
- **Documentación**: https://ngrok.com/docs

---

## ✅ Checklist

- [x] ngrok corriendo en `localhost:3000`
- [x] URL activa: `https://unmerciful-ossie-fluent.ngrok-free.dev`
- [ ] Actualizar ngrok a versión 3.33.1 (antes del 17/12/2025)
- [ ] Verificar webhooks en Twilio (si la URL cambió)
- [ ] Verificar webhooks en Mercado Pago (si la URL cambió)

---

## 🔗 Archivos Relacionados

- `docs/06-GUIAS/CONFIGURACION/GUIA_URL_NGROK.md` - Guía para manejar cambios de URL
- `docs/06-GUIAS/CONFIGURACION/IMPACTO_PAUSAR_NGROK.md` - Impacto de pausar ngrok
- `docs/06-GUIAS/CONFIGURACION/CONFIGURACION_VARIABLES_ENTORNO.md` - Variables de entorno

