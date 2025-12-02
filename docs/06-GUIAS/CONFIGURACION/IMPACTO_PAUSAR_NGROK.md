# ⚠️ Impacto de Pausar ngrok

## 📋 Resumen

**ngrok** se está usando para exponer tu servidor backend local a Internet. Si lo pausas, **2 funcionalidades principales dejarán de funcionar**.

---

## 🚫 Funcionalidades que SE VERÁN AFECTADAS

### 1. **Corina Bot (WhatsApp) - Webhooks de Twilio** ❌

**¿Qué deja de funcionar?**
- ❌ **Recepción de mensajes de WhatsApp**: El bot no recibirá mensajes nuevos
- ❌ **Procesamiento de comandos**: No podrá procesar comandos como `CREAR_MATERIA_PRIMA`, `CREAR_PROVEEDOR`, etc.
- ❌ **Respuestas automáticas**: No podrá responder a los usuarios

**¿Por qué?**
- Twilio necesita enviar los mensajes de WhatsApp a tu servidor
- Twilio **NO puede acceder a `localhost:3000`** desde Internet
- ngrok crea un túnel público (`https://xxx.ngrok-free.app`) que apunta a tu `localhost:3000`
- Sin ngrok, Twilio no puede alcanzar tu servidor

**Configuración actual:**
```
Webhook URL en Twilio: https://unmerciful-ossie-fluent.ngrok-free.dev/api/corina/whatsapp/webhook
```

---

### 2. **Suscripciones - Webhooks de Mercado Pago** ❌

**¿Qué deja de funcionar?**
- ❌ **Notificaciones de pago**: Mercado Pago no podrá notificar cuando se complete un pago
- ❌ **Activación automática de planes**: Los planes NO se activarán automáticamente después del pago
- ❌ **Actualización de estado de suscripción**: No se actualizará el estado (activa/cancelada)

**¿Por qué?**
- Mercado Pago necesita enviar notificaciones de webhook a tu servidor
- Mercado Pago **NO acepta URLs con `localhost`** en producción
- ngrok convierte `localhost` a una URL pública HTTPS
- Sin ngrok, Mercado Pago no puede notificar a tu servidor

**Configuración actual:**
```
Webhook URL: https://unmerciful-ossie-fluent.ngrok-free.dev/api/suscripcion/webhook/mercadopago
```

**Código afectado:**
```typescript
// backend/src/services/mercadoPagoService.ts
// Si la URL es localhost, usa ngrok automáticamente
const ngrokUrl = process.env.NGROK_URL || 'https://unmerciful-ossie-fluent.ngrok-free.dev';
backUrl = `${ngrokBase}${urlPath}`;
```

---

## ✅ Funcionalidades que NO SE VERÁN AFECTADAS

### 1. **Frontend → Backend (API Calls)** ✅

**¿Por qué funciona?**
- El frontend corre en `localhost:3001` (o tu puerto configurado)
- El backend corre en `localhost:3000`
- Ambos están en la misma máquina
- **NO necesitan Internet** para comunicarse

**Ejemplos que seguirán funcionando:**
- ✅ Login/Registro de usuarios
- ✅ CRUD de granjas, inventario, compras, etc.
- ✅ Todas las operaciones desde la web app

---

### 2. **Base de Datos** ✅

**¿Por qué funciona?**
- La base de datos está en Supabase (en la nube)
- El backend se conecta directamente a Supabase
- **NO depende de ngrok**

---

## 🔄 ¿Qué pasa si pausas ngrok?

### Escenario 1: Solo trabajas en Frontend/Backend

**Puedes pausar ngrok sin problemas**
- ✅ Todas las funcionalidades web seguirán funcionando
- ✅ Base de datos seguirá funcionando
- ❌ Solo perderás webhooks externos (que no necesitas en este caso)

---

### Escenario 2: Necesitas el Bot de WhatsApp Activo

**NO pauses ngrok si necesitas el bot activo**
- ❌ No recibirás mensajes de WhatsApp
- ❌ Corina no podrá responder
- ❌ No podrás probar comandos del bot

---

### Escenario 3: Estás Probando Suscripciones

**NO pauses ngrok si estás probando suscripciones**
- ❌ Mercado Pago no podrá notificar pagos
- ❌ Los planes no se activarán automáticamente
- ❌ Tendrás que activarlos manualmente

---

## 🔧 Cómo Pausar/Reanudar ngrok

### Pausar ngrok:

```bash
# En la terminal donde corre ngrok:
Ctrl+C
```

### Reanudar ngrok:

```bash
# En una nueva terminal:
ngrok http 3000
```

**⚠️ IMPORTANTE:** Si reinicias ngrok, obtendrás una **nueva URL**. Deberás:
1. Actualizar `NGROK_URL` en `backend/.env` (si lo usas)
2. Actualizar webhooks en Twilio Console
3. Actualizar webhooks en Mercado Pago

---

## 📊 Tabla Comparativa

| Funcionalidad | Con ngrok | Sin ngrok |
|---------------|-----------|-----------|
| Frontend → Backend | ✅ Funciona | ✅ Funciona |
| Base de Datos | ✅ Funciona | ✅ Funciona |
| Corina Bot (WhatsApp) | ✅ Funciona | ❌ No funciona |
| Suscripciones (Mercado Pago) | ✅ Funciona | ❌ No funciona |

---

## 💡 Recomendaciones

- ✅ Puedes pausar ngrok si solo trabajas en frontend/backend sin webhooks
- ✅ Mantén ngrok corriendo si necesitas probar el bot o suscripciones
- ✅ Para producción, usa un servidor con dominio propio (no necesitarás ngrok)

---

## 📞 Notas Adicionales

1. **La URL de ngrok cambia CADA VEZ que lo reinicias** (versión gratuita)
2. **NO necesitas modificar el código**: Usa `NGROK_URL` en `backend/.env`
3. **Debes actualizar los webhooks** en Twilio y Mercado Pago si cambia la URL
4. **ngrok tiene límites** en la versión gratuita (tiempo de sesión, requests/minuto)
5. **Para producción**, usa un servidor con dominio propio

### ⚠️ IMPORTANTE: La URL NO se mantiene hasta el 17/12/2025

**La fecha del 17/12/2025 es sobre la versión del cliente de ngrok, NO sobre la URL.**

**La URL cambiará cada vez que reinicies ngrok** (versión gratuita).

**Solución:** Configura `NGROK_URL` en `backend/.env` para no modificar código.

Ver: `docs/06-GUIAS/CONFIGURACION/GUIA_URL_NGROK.md` para instrucciones detalladas.

---

## 🔗 Archivos Relacionados

- `backend/src/services/mercadoPagoService.ts` - Lógica de webhooks de Mercado Pago
- `backend/src/controllers/corinaController.ts` - Handler de webhooks de Twilio
- `docs/09-SISTEMAS/GUIA_CREDENCIALES_CORINA.md` - Configuración de Corina
- `docs/06-GUIAS/CONFIGURACION/GUIA_CONFIGURACION_MERCADO_PAGO.md` - Configuración de Mercado Pago
- `docs/06-GUIAS/CONFIGURACION/ACTUALIZACION_NGROK.md` - Guía de actualización de ngrok

---

## ⚠️ ACTUALIZACIÓN REQUERIDA

**IMPORTANTE**: ngrok versión ≤3.18.x dejará de funcionar el **17 de diciembre de 2025**.

Tu versión actual: **3.24.0-msix**  
Versión disponible: **3.33.1**

**Acción requerida**: Actualiza ngrok antes del 17/12/2025 para evitar interrupciones.

Ver: `docs/06-GUIAS/CONFIGURACION/ACTUALIZACION_NGROK.md` para instrucciones detalladas.



