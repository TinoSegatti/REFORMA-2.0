# 📋 Plan de Migración: Stripe → Mercado Pago

## 🎯 Objetivo

Migrar el sistema de pagos de Stripe a Mercado Pago para soportar empresas argentinas.

---

## 📊 Comparación de APIs

### Stripe vs Mercado Pago

| Funcionalidad | Stripe | Mercado Pago |
|---------------|--------|--------------|
| **Crear Plan** | `stripe.plans.create()` | `POST /preapproval_plan` |
| **Crear Suscripción** | `stripe.checkout.sessions.create()` | `POST /preapproval` |
| **Webhooks** | `stripe.webhooks.constructEvent()` | Verificar firma con `x-signature` |
| **Cancelar Suscripción** | `stripe.subscriptions.cancel()` | `PUT /preapproval/{id}` |
| **Obtener Suscripción** | `stripe.subscriptions.retrieve()` | `GET /preapproval/{id}` |

---

## 🔄 Estructura de Migración

### 1. Crear Servicio de Mercado Pago

**Archivo**: `backend/src/services/mercadoPagoService.ts`

```typescript
// Similar estructura a stripeService.ts
// Funciones principales:
// - crearPlanSuscripcion()
// - crearSuscripcionCheckout()
// - cancelarSuscripcion()
// - reactivarSuscripcion()
// - verificarWebhook()
```

### 2. Adaptar Controladores

**Archivo**: `backend/src/controllers/suscripcionController.ts`

- Reemplazar llamadas a `stripeService` por `mercadoPagoService`
- Mantener misma lógica de negocio
- Adaptar respuestas al formato de Mercado Pago

### 3. Actualizar Rutas

**Archivo**: `backend/src/routes/suscripcionRoutes.ts`

- Mantener mismos endpoints
- Solo cambiar implementación interna

### 4. Configurar Webhooks

**Archivo**: `backend/src/controllers/webhookController.ts`

- Adaptar verificación de firma
- Mapear eventos de Mercado Pago a eventos internos
- Mantener misma lógica de procesamiento

### 5. Actualizar Frontend

**Archivo**: `frontend/src/lib/api.ts`

- Mantener mismas funciones
- Solo cambiar URLs si es necesario

---

## 📝 Variables de Entorno

### Reemplazar en `backend/.env`:

```env
# Mercado Pago Configuration
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...          # Access Token de Mercado Pago
MERCADOPAGO_PUBLIC_KEY=APP_USR-...            # Public Key (opcional, para frontend)
MERCADOPAGO_WEBHOOK_SECRET=...                # Secret para verificar webhooks

# Frontend URL
FRONTEND_URL=http://localhost:3001
```

---

## 🔧 Pasos de Implementación

### Fase 1: Setup Inicial
1. ✅ Crear cuenta en Mercado Pago
2. ✅ Obtener credenciales de API
3. ✅ Configurar webhooks en Mercado Pago Dashboard
4. ✅ Agregar variables de entorno

### Fase 2: Desarrollo
1. ✅ Crear `mercadoPagoService.ts`
2. ✅ Adaptar `suscripcionController.ts`
3. ✅ Actualizar `webhookController.ts`
4. ✅ Probar endpoints en modo test

### Fase 3: Testing
1. ✅ Probar creación de planes
2. ✅ Probar creación de suscripciones
3. ✅ Probar webhooks
4. ✅ Probar cancelación/reactivación

### Fase 4: Migración
1. ✅ Migrar planes existentes (si hay)
2. ✅ Actualizar frontend si es necesario
3. ✅ Desplegar a producción
4. ✅ Monitorear primeros pagos

---

## 📚 Recursos

- **Documentación Mercado Pago**: https://www.mercadopago.com.ar/developers/es/docs
- **Suscripciones**: https://www.mercadopago.com.ar/developers/es/docs/subscriptions
- **Webhooks**: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
- **SDK Node.js**: https://github.com/mercadopago/sdk-nodejs

---

## ⚠️ Consideraciones

1. **Planes Existentes**: Si ya hay planes creados en Stripe, necesitarás migrarlos manualmente
2. **Suscripciones Activas**: Las suscripciones activas en Stripe seguirán funcionando hasta su renovación
3. **Datos Históricos**: Mantener registros de pagos de Stripe para auditoría
4. **Testing**: Probar exhaustivamente en modo test antes de producción

---

## 🆘 ¿Necesitas ayuda?

Puedo ayudarte a:
1. Crear el servicio de Mercado Pago
2. Adaptar los controladores
3. Configurar webhooks
4. Probar la integración

¿Quieres que empiece con la implementación?

