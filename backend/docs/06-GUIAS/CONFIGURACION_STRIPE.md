# Configuración de Stripe para Sistema de Pagos

## 📋 Variables de Entorno Requeridas

Agregar al archivo `backend/.env`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...                    # Clave secreta de Stripe (modo test)
STRIPE_PUBLISHABLE_KEY=pk_test_...               # Clave pública de Stripe (modo test)
STRIPE_WEBHOOK_SECRET=whsec_...                  # Secreto del webhook (obtener desde Stripe Dashboard)

# Stripe Price IDs (crear productos en Stripe Dashboard primero)
STRIPE_PRICE_ID_STARTER_MONTHLY=price_...
STRIPE_PRICE_ID_STARTER_YEARLY=price_...
STRIPE_PRICE_ID_BUSINESS_MONTHLY=price_...
STRIPE_PRICE_ID_BUSINESS_YEARLY=price_...
STRIPE_PRICE_ID_ENTERPRISE_MONTHLY=price_...
STRIPE_PRICE_ID_ENTERPRISE_YEARLY=price_...

# Frontend URL (para redirects después del pago)
FRONTEND_URL=http://localhost:3001
```

## 🔧 Pasos de Configuración

### 1. Crear Cuenta en Stripe

1. Ir a https://stripe.com
2. Crear cuenta (modo test para desarrollo)
3. Obtener las claves API desde el Dashboard

### 2. Crear Productos y Precios en Stripe

1. Ir a Stripe Dashboard → Products
2. Crear los siguientes productos:

**STARTER**
- Nombre: "REFORMA - Plan Starter"
- Precio mensual: $35.00 USD (recurring, monthly)
- Precio anual: $350.00 USD (recurring, yearly)

**BUSINESS**
- Nombre: "REFORMA - Plan Business"
- Precio mensual: $99.00 USD (recurring, monthly)
- Precio anual: $990.00 USD (recurring, yearly)

**ENTERPRISE**
- Nombre: "REFORMA - Plan Enterprise"
- Precio mensual: $229.00 USD (recurring, monthly)
- Precio anual: $2,290.00 USD (recurring, yearly)

3. Copiar los Price IDs de cada precio creado
4. Agregarlos al `.env` como se muestra arriba

### 3. Configurar Webhook

1. Ir a Stripe Dashboard → Developers → Webhooks
2. Click en "Add endpoint"
3. URL del endpoint: `https://tu-dominio.com/api/suscripcion/webhook/stripe`
   - Para desarrollo local: usar Stripe CLI (ver abajo)
4. Seleccionar eventos a escuchar:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copiar el "Signing secret" y agregarlo a `.env` como `STRIPE_WEBHOOK_SECRET`

### 4. Usar Stripe CLI para Desarrollo Local

Para probar webhooks en desarrollo local:

```bash
# Instalar Stripe CLI
# Windows: https://stripe.com/docs/stripe-cli
# Mac: brew install stripe/stripe-cli/stripe
# Linux: ver documentación oficial

# Login
stripe login

# Forward webhooks al servidor local
stripe listen --forward-to localhost:3000/api/suscripcion/webhook/stripe
```

Esto mostrará el webhook secret que debes usar en desarrollo.

## 🧪 Probar en Modo Test

Stripe proporciona tarjetas de prueba:

- **Pago exitoso**: `4242 4242 4242 4242`
- **Pago rechazado**: `4000 0000 0000 0002`
- **Requiere autenticación**: `4000 0025 0000 3155`

Usar cualquier fecha futura como expiración y cualquier CVC de 3 dígitos.

## 📊 Costos de Stripe

- **Sin costo mensual**
- **Comisión por transacción**: 2.9% + $0.30 USD (tarjetas de crédito/débito)
- **Modo test**: Completamente gratuito

Ejemplo de comisión:
- Pago de $35 USD → Comisión: $1.32 USD → Recibes: $33.68 USD
- Pago de $350 USD → Comisión: $10.45 USD → Recibes: $339.55 USD

## ✅ Verificación

Después de configurar, probar con:

```bash
npm run test-suscripcion
```

Esto probará los endpoints básicos.

