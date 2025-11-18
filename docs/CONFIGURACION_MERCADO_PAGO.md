# 🔧 Configuración de Mercado Pago

> 📖 **Para una guía paso a paso completa con todas las tareas pendientes**, consulta: [`GUIA_CONFIGURACION_MERCADO_PAGO.md`](./GUIA_CONFIGURACION_MERCADO_PAGO.md)

## 📋 Variables de Entorno Requeridas

Agregar al archivo `backend/.env`:

```env
# Mercado Pago Configuration
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...          # Access Token de Mercado Pago (obtener del Dashboard)
MERCADOPAGO_WEBHOOK_SECRET=...                # Secret para verificar webhooks (opcional)

# Frontend URL (para redirects después del pago)
FRONTEND_URL=http://localhost:3001
```

---

## 🔑 Paso 1: Obtener Access Token

1. **Ir al Dashboard de Mercado Pago**: https://www.mercadopago.com.ar/developers/panel
2. **Crear aplicación** (si no tienes una)
3. **Copiar el Access Token**:
   - En el panel, ve a **Credenciales**
   - Copia el **Access Token** (empieza con `APP_USR-...`)
   - ⚠️ **IMPORTANTE**: Usa las credenciales de **TEST** para desarrollo

---

## 🔔 Paso 2: Configurar Webhooks

1. **Ir a Webhooks**: Dashboard → **Webhooks**
2. **Crear webhook**:
   - **URL**: `https://tu-dominio.com/api/suscripcion/webhook/mercadopago`
   - **Eventos a escuchar**:
     - `payment`
     - `subscription_preapproval`
3. **Copiar el secret** (si está disponible) y agregarlo a `.env` como `MERCADOPAGO_WEBHOOK_SECRET`

### Para Desarrollo Local:

Mercado Pago no tiene CLI como Stripe, pero puedes usar herramientas como:
- **ngrok** para exponer tu servidor local
- **Webhook.site** para probar webhooks temporalmente

---

## 🧪 Paso 3: Probar en Modo Test

Mercado Pago proporciona tarjetas de prueba:

- **Pago exitoso**: `5031 7557 3453 0604`
- **Pago rechazado**: `5031 4332 1540 6351`
- **Requiere autenticación**: `5031 7557 3453 0604`

Usar cualquier fecha futura como expiración y cualquier código de seguridad de 3 dígitos.

---

## 📊 Comisiones

- **Tarjetas de crédito**: ~3.99% + comisión fija
- **Tarjetas de débito**: ~2.99% + comisión fija
- **Transferencias**: ~1.99%
- **Modo test**: Completamente gratuito

---

## ✅ Verificación

Después de configurar:

1. **Reiniciar el servidor backend**
2. **Probar crear checkout** como usuario no admin
3. **Deberías ser redirigido a Mercado Pago**
4. **Usar tarjeta de prueba** para completar el pago

---

## 🔄 Migración desde Stripe

El sistema ahora soporta **ambos procesadores**:
- Si `MERCADOPAGO_ACCESS_TOKEN` está configurado → Usa Mercado Pago
- Si `STRIPE_SECRET_KEY` está configurado → Usa Stripe
- Si ambos están configurados → Prioriza Mercado Pago

**El super admin siempre puede cambiar planes directamente sin procesador de pago.**

---

## 📚 Documentación

- **API de Suscripciones**: https://www.mercadopago.com.ar/developers/es/docs/subscriptions
- **Webhooks**: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
- **SDK Node.js**: https://github.com/mercadopago/sdk-nodejs

---

## ⚠️ Notas Importantes

1. **Modo Test vs Producción**:
   - Usa Access Token de TEST para desarrollo
   - Cambia a Access Token de PRODUCCIÓN cuando estés listo

2. **Moneda**:
   - Por defecto usa USD
   - Puedes cambiar a ARS editando `mercadoPagoService.ts`

3. **Webhooks**:
   - Mercado Pago envía webhooks en formato JSON
   - La verificación de firma es opcional pero recomendada

---

## 🆘 Problemas Comunes

### Error: "MERCADOPAGO_ACCESS_TOKEN no está configurada"
- Verificar que `MERCADOPAGO_ACCESS_TOKEN` esté en `backend/.env`
- Verificar que el servidor se haya reiniciado

### Error: "No se pudo obtener URL de pago"
- Verificar que el Access Token sea válido
- Verificar que estés usando credenciales de TEST en desarrollo

### Webhook no funciona
- Verificar que la URL del webhook sea accesible públicamente
- Usar ngrok para desarrollo local
- Verificar que el endpoint esté configurado correctamente

