# 🚀 Guía Rápida: Configuración de Stripe

## ✅ Resumen
Sí, necesitas crear una cuenta en Stripe para que los usuarios puedan pagar suscripciones. El super admin puede cambiar planes sin Stripe, pero los usuarios normales necesitan pasar por el checkout de Stripe.

---

## 📝 Paso 1: Crear Cuenta en Stripe

1. **Ir a Stripe**: https://stripe.com
2. **Crear cuenta** (gratis, sin costo mensual)
3. **Activar modo Test** (ya viene activado por defecto)
   - El modo test es completamente gratuito
   - Permite probar pagos sin cobrar dinero real

---

## 🔑 Paso 2: Obtener las Claves API

1. **Ir al Dashboard de Stripe**: https://dashboard.stripe.com/test/apikeys
2. **Copiar las siguientes claves**:
   - **Secret key** (empieza con `sk_test_...`)
   - **Publishable key** (empieza con `pk_test_...`)

⚠️ **IMPORTANTE**: Usa las claves de **TEST** (tienen `_test_` en el nombre). Las claves de producción (`sk_live_...`) solo se usan cuando la app esté en producción.

---

## 💰 Paso 3: Crear Productos y Precios en Stripe

Necesitas crear 6 productos (3 planes × 2 períodos):

### 3.1 Ir a Products
Dashboard → **Products** → **Add product**

### 3.2 Crear Plan STARTER

**Producto 1: STARTER Mensual**
- **Name**: `REFORMA - Plan Starter (Mensual)`
- **Description**: `Plan Starter de REFORMA - Facturación mensual`
- **Pricing model**: `Standard pricing`
- **Price**: `$35.00 USD`
- **Billing period**: `Monthly` (recurring)
- Click **Save product**
- **Copiar el Price ID** (empieza con `price_...`)

**Producto 2: STARTER Anual**
- **Name**: `REFORMA - Plan Starter (Anual)`
- **Description**: `Plan Starter de REFORMA - Facturación anual`
- **Pricing model**: `Standard pricing`
- **Price**: `$350.00 USD`
- **Billing period**: `Yearly` (recurring)
- Click **Save product**
- **Copiar el Price ID**

### 3.3 Crear Plan BUSINESS

**Producto 3: BUSINESS Mensual**
- **Name**: `REFORMA - Plan Business (Mensual)`
- **Price**: `$99.00 USD`
- **Billing period**: `Monthly`
- **Copiar Price ID**

**Producto 4: BUSINESS Anual**
- **Name**: `REFORMA - Plan Business (Anual)`
- **Price**: `$990.00 USD`
- **Billing period**: `Yearly`
- **Copiar Price ID**

### 3.4 Crear Plan ENTERPRISE

**Producto 5: ENTERPRISE Mensual**
- **Name**: `REFORMA - Plan Enterprise (Mensual)`
- **Price**: `$229.00 USD`
- **Billing period**: `Monthly`
- **Copiar Price ID**

**Producto 6: ENTERPRISE Anual**
- **Name**: `REFORMA - Plan Enterprise (Anual)`
- **Price**: `$2,290.00 USD`
- **Billing period**: `Yearly`
- **Copiar Price ID**

---

## ⚙️ Paso 4: Configurar Variables de Entorno

Editar `backend/.env` y agregar:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...                    # Tu Secret Key de Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_...              # Tu Publishable Key (opcional, para frontend futuro)
STRIPE_WEBHOOK_SECRET=whsec_...                 # Se configurará en el siguiente paso

# Stripe Price IDs (los que copiaste en el paso anterior)
STRIPE_PRICE_ID_STARTER_MONTHLY=price_...
STRIPE_PRICE_ID_STARTER_YEARLY=price_...
STRIPE_PRICE_ID_BUSINESS_MONTHLY=price_...
STRIPE_PRICE_ID_BUSINESS_YEARLY=price_...
STRIPE_PRICE_ID_ENTERPRISE_MONTHLY=price_...
STRIPE_PRICE_ID_ENTERPRISE_YEARLY=price_...

# Frontend URL (para redirects después del pago)
FRONTEND_URL=http://localhost:3001
```

---

## 🔔 Paso 5: Configurar Webhook (Opcional para Desarrollo)

Los webhooks permiten que Stripe notifique a tu backend cuando hay eventos (pago exitoso, cancelación, etc.).

### Opción A: Usar Stripe CLI (Recomendado para Desarrollo)

1. **Instalar Stripe CLI**:
   - Windows: https://stripe.com/docs/stripe-cli
   - Mac: `brew install stripe/stripe-cli/stripe`
   - Linux: Ver documentación oficial

2. **Login**:
   ```bash
   stripe login
   ```

3. **Forward webhooks al servidor local**:
   ```bash
   stripe listen --forward-to localhost:3000/api/suscripcion/webhook/stripe
   ```

4. **Copiar el webhook secret** que aparece (empieza con `whsec_...`)
5. **Agregarlo al `.env`** como `STRIPE_WEBHOOK_SECRET`

### Opción B: Configurar Webhook en Dashboard (Para Producción)

1. Dashboard → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL**: `https://tu-dominio.com/api/suscripcion/webhook/stripe`
4. **Events to send**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. **Copiar el Signing secret** y agregarlo al `.env`

---

## 🧪 Paso 6: Probar el Sistema

### Tarjetas de Prueba de Stripe

Stripe proporciona tarjetas de prueba para testing:

- **✅ Pago exitoso**: `4242 4242 4242 4242`
- **❌ Pago rechazado**: `4000 0000 0000 0002`
- **🔐 Requiere autenticación**: `4000 0025 0000 3155`

Usar cualquier fecha futura (ej: `12/25`) y cualquier CVC de 3 dígitos (ej: `123`).

### Probar

1. **Reiniciar el servidor backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Intentar cambiar de plan** como usuario no admin
3. **Deberías ser redirigido a Stripe Checkout**
4. **Usar la tarjeta de prueba**: `4242 4242 4242 4242`
5. **Completar el pago** (no se cobrará dinero real)

---

## 💵 Costos de Stripe

- **Sin costo mensual** ✅
- **Comisión por transacción**: 2.9% + $0.30 USD
- **Modo test**: Completamente gratuito ✅

**Ejemplos de comisión**:
- Pago de $35 USD → Comisión: $1.32 USD → Recibes: $33.68 USD
- Pago de $350 USD → Comisión: $10.45 USD → Recibes: $339.55 USD

---

## ⚠️ Notas Importantes

1. **Modo Test vs Producción**:
   - Usa claves `sk_test_...` y `pk_test_...` para desarrollo
   - Solo cambia a `sk_live_...` cuando la app esté en producción

2. **Webhooks en Desarrollo**:
   - Usa Stripe CLI para desarrollo local
   - Configura webhooks en Dashboard solo para producción

3. **Super Admin**:
   - El super admin puede cambiar planes sin Stripe (ya funciona)
   - Los usuarios normales necesitan Stripe configurado

---

## ✅ Checklist de Configuración

- [ ] Cuenta de Stripe creada
- [ ] Claves API copiadas (Secret y Publishable)
- [ ] 6 productos creados en Stripe (3 planes × 2 períodos)
- [ ] 6 Price IDs copiados
- [ ] Variables de entorno configuradas en `backend/.env`
- [ ] Webhook configurado (Stripe CLI o Dashboard)
- [ ] Servidor backend reiniciado
- [ ] Prueba realizada con tarjeta de prueba

---

## 🆘 Problemas Comunes

### Error: "STRIPE_SECRET_KEY no está configurada"
- Verificar que `STRIPE_SECRET_KEY` esté en `backend/.env`
- Verificar que el servidor backend se haya reiniciado después de agregar la variable

### Error: "No se encontró Price ID para el plan..."
- Verificar que todos los Price IDs estén en el `.env`
- Verificar que los nombres de las variables coincidan exactamente

### Webhook no funciona
- Verificar que Stripe CLI esté corriendo (si usas desarrollo local)
- Verificar que `STRIPE_WEBHOOK_SECRET` esté configurado
- Verificar que la URL del webhook sea correcta

---

¿Necesitas ayuda? Revisa la documentación completa en `backend/docs/CONFIGURACION_STRIPE.md`

