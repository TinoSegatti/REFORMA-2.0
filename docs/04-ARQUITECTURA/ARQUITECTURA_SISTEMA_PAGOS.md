# Arquitectura del Sistema de Pagos - REFORMA

## 📋 Índice
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura General](#arquitectura-general)
3. [Base de Datos](#base-de-datos)
4. [Integración con Stripe](#integración-con-stripe)
5. [Backend - Endpoints](#backend---endpoints)
6. [Frontend - UI/UX](#frontend---uiux)
7. [Flujos de Pago](#flujos-de-pago)
8. [Seguridad](#seguridad)
9. [Plan de Implementación](#plan-de-implementación)

---

## 🎯 Resumen Ejecutivo

### Objetivo
Implementar un sistema completo de gestión de pagos y suscripciones que permita:
- Selección de planes desde landing page y sidebar
- Procesamiento seguro de pagos (tarjetas, PayPal, transferencias)
- Gestión automática de suscripciones y renovaciones
- Visualización de plan actual y limitaciones en `/mis-plantas`

### Tecnologías Propuestas
- **Stripe**: Para tarjetas de crédito/débito (principal)
- **PayPal**: Como alternativa de pago
- **Transferencias bancarias**: Proceso manual con confirmación

### Planes Definidos
- **DEMO**: $0.00 (Gratuito, 30 días)
- **STARTER**: $35/mes o $350/año
- **BUSINESS**: $99/mes o $990/año
- **ENTERPRISE**: $229/mes o $2,290/año

---

## 🏗️ Arquitectura General

```
┌─────────────────┐
│   Frontend      │
│  (Next.js)      │
│                 │
│  - Landing      │
│  - Sidebar      │
│  - /mis-plantas │
│  - Checkout     │
└────────┬────────┘
         │
         │ HTTPS
         │
┌────────▼────────┐
│   Backend       │
│  (Express)      │
│                 │
│  - API REST     │
│  - Webhooks     │
│  - Validación   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│Stripe │ │PayPal│
│  API  │ │ API  │
└───────┘ └──────┘
```

---

## 💾 Base de Datos

### 1. Actualizar Enum de Planes

```prisma
enum PlanSuscripcion {
  DEMO      // Gratuito - 30 días
  STARTER   // $35/mes o $350/año
  BUSINESS  // $99/mes o $990/año
  ENTERPRISE // $229/mes o $2,290/año
}
```

### 2. Nuevos Modelos Prisma

```prisma
// Modelo de Suscripción
model Suscripcion {
  id                    String          @id @default(cuid())
  idUsuario             String          @unique
  planSuscripcion       PlanSuscripcion
  estadoSuscripcion     EstadoSuscripcion @default(ACTIVA)
  periodoFacturacion    PeriodoFacturacion // MENSUAL o ANUAL
  fechaInicio           DateTime        @default(now())
  fechaFin              DateTime
  fechaProximaRenovacion DateTime?
  precio                Float
  moneda                String          @default("USD")
  
  // Stripe
  stripeCustomerId      String?         @unique
  stripeSubscriptionId  String?         @unique
  stripePriceId         String?
  
  // PayPal
  paypalSubscriptionId   String?         @unique
  
  // Transferencia bancaria
  referenciaTransferencia String?
  fechaPagoTransferencia  DateTime?
  confirmadoTransferencia Boolean        @default(false)
  
  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt
  
  // Relaciones
  usuario               Usuario        @relation(fields: [idUsuario], references: [id], onDelete: Cascade)
  pagos                 Pago[]
  
  @@index([idUsuario])
  @@index([estadoSuscripcion])
  @@index([fechaProximaRenovacion])
  @@map("t_suscripciones")
}

// Modelo de Pagos
model Pago {
  id                    String          @id @default(cuid())
  idSuscripcion         String
  metodoPago           MetodoPago      // STRIPE, PAYPAL, TRANSFERENCIA
  monto                 Float
  moneda                String          @default("USD")
  estadoPago            EstadoPago      @default(PENDIENTE)
  
  // Stripe
  stripePaymentIntentId String?         @unique
  stripeChargeId        String?
  
  // PayPal
  paypalOrderId         String?         @unique
  paypalTransactionId   String?
  
  // Transferencia bancaria
  referenciaTransferencia String?
  comprobanteTransferencia String?      // URL de imagen/PDF
  fechaTransferencia    DateTime?
  
  fechaPago             DateTime?
  fechaCreacion         DateTime        @default(now())
  fechaActualizacion    DateTime        @updatedAt
  
  // Relaciones
  suscripcion           Suscripcion     @relation(fields: [idSuscripcion], references: [id], onDelete: Cascade)
  
  @@index([idSuscripcion])
  @@index([estadoPago])
  @@index([metodoPago])
  @@map("t_pagos")
}

// Enums adicionales
enum EstadoSuscripcion {
  ACTIVA
  CANCELADA
  SUSPENDIDA
  EXPIRADA
  PENDIENTE_PAGO
}

enum PeriodoFacturacion {
  MENSUAL
  ANUAL
}

enum MetodoPago {
  STRIPE
  PAYPAL
  TRANSFERENCIA
}

enum EstadoPago {
  PENDIENTE
  COMPLETADO
  FALLIDO
  REEMBOLSADO
  CANCELADO
}
```

### 3. Actualizar Modelo Usuario

```prisma
model Usuario {
  // ... campos existentes ...
  
  // Nueva relación
  suscripcion           Suscripcion?
  
  // ... resto de relaciones ...
}
```

---

## 🔌 Integración con Stripe

### 1. Configuración Inicial

**Backend `.env`:**
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_STARTER_MONTHLY=price_...
STRIPE_PRICE_ID_STARTER_YEARLY=price_...
STRIPE_PRICE_ID_BUSINESS_MONTHLY=price_...
STRIPE_PRICE_ID_BUSINESS_YEARLY=price_...
STRIPE_PRICE_ID_ENTERPRISE_MONTHLY=price_...
STRIPE_PRICE_ID_ENTERPRISE_YEARLY=price_...
```

**Frontend `.env.local`:**
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 2. Instalación de Dependencias

**Backend:**
```bash
npm install stripe
```

**Frontend:**
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### 3. Estructura de Servicios

```
backend/src/
  ├── services/
  │   ├── stripeService.ts      # Lógica de Stripe
  │   ├── paypalService.ts      # Lógica de PayPal (futuro)
  │   ├── suscripcionService.ts # Lógica de negocio
  │   └── pagoService.ts        # Gestión de pagos
  ├── controllers/
  │   ├── suscripcionController.ts
  │   └── pagoController.ts
  └── routes/
      ├── suscripcionRoutes.ts
      └── webhookRoutes.ts
```

---

## 🔧 Backend - Endpoints

### Endpoints de Suscripción

```
GET    /api/suscripcion/planes
       → Obtener todos los planes disponibles con precios y características

GET    /api/suscripcion/mi-plan
       → Obtener plan actual del usuario autenticado

POST   /api/suscripcion/crear-checkout
       Body: { planId, periodoFacturacion, metodoPago }
       → Crear sesión de checkout en Stripe

POST   /api/suscripcion/cambiar-plan
       Body: { nuevoPlanId, periodoFacturacion }
       → Cambiar plan del usuario

POST   /api/suscripcion/cancelar
       → Cancelar suscripción (mantiene hasta fin de período)

POST   /api/suscripcion/reactivar
       → Reactivar suscripción cancelada
```

### Endpoints de Pago

```
GET    /api/pagos/historial
       → Obtener historial de pagos del usuario

POST   /api/pagos/transferencia/subir-comprobante
       Body: FormData (archivo)
       → Subir comprobante de transferencia

GET    /api/pagos/transferencia/estado/:idPago
       → Verificar estado de pago por transferencia
```

### Webhooks

```
POST   /api/webhooks/stripe
       → Recibir eventos de Stripe (pago exitoso, fallido, renovación, etc.)

POST   /api/webhooks/paypal
       → Recibir eventos de PayPal (futuro)
```

---

## 🎨 Frontend - UI/UX

### 1. Página de Planes (`/planes` o `/pricing`)

**Ubicaciones de acceso:**
- Landing page: Botón "Ver Planes" → `/planes`
- Sidebar: Menú "Planes y Suscripción" → `/planes`

**Componentes necesarios:**
```
src/app/planes/
  ├── page.tsx                    # Página principal
  ├── components/
  │   ├── PlanCard.tsx           # Tarjeta de cada plan
  │   ├── ComparacionPlanes.tsx  # Tabla comparativa
  │   └── TogglePeriodo.tsx     # Toggle Mensual/Anual
  └── checkout/
      └── page.tsx               # Página de checkout
```

**Características:**
- Mostrar 4 planes (DEMO, STARTER, BUSINESS, ENTERPRISE)
- Toggle para cambiar entre precios mensuales/anuales
- Botón "Seleccionar Plan" en cada tarjeta
- Destacar plan actual del usuario
- Mostrar ahorro del plan anual (ej: "Ahorra $70/año")

### 2. Página de Checkout (`/planes/checkout`)

**Flujo:**
1. Resumen del plan seleccionado
2. Selección de método de pago (Stripe, PayPal, Transferencia)
3. Formulario de pago según método:
   - **Stripe**: Stripe Elements (tarjeta)
   - **PayPal**: Botón de PayPal
   - **Transferencia**: Instrucciones + upload de comprobante
4. Confirmación y procesamiento

**Componentes:**
```
src/app/planes/checkout/
  ├── page.tsx
  └── components/
      ├── ResumenPlan.tsx
      ├── MetodoPagoSelector.tsx
      ├── StripeCheckout.tsx
      ├── PayPalCheckout.tsx
      └── TransferenciaCheckout.tsx
```

### 3. Actualizar `/mis-plantas`

**Información a mostrar:**
- Plan actual del usuario
- Fecha de renovación
- Límites actuales vs límites del plan
- Botón "Cambiar Plan" o "Upgrade"
- Estado de la suscripción (Activa, Próxima a vencer, etc.)

**Componente:**
```
src/app/mis-plantas/
  └── components/
      └── InfoPlan.tsx  # Nuevo componente para mostrar info del plan
```

---

## 🔄 Flujos de Pago

### Flujo 1: Pago con Stripe (Tarjeta)

```
1. Usuario selecciona plan → /planes
2. Click "Seleccionar Plan" → /planes/checkout?plan=STARTER&periodo=MENSUAL
3. Selecciona "Tarjeta de Crédito"
4. Frontend llama: POST /api/suscripcion/crear-checkout
5. Backend crea Stripe Checkout Session
6. Backend retorna: { sessionId, url }
7. Frontend redirige a Stripe Checkout
8. Usuario completa pago en Stripe
9. Stripe redirige a: /planes/exito?session_id=xxx
10. Frontend verifica pago: GET /api/suscripcion/verificar-pago?session_id=xxx
11. Backend procesa webhook de Stripe
12. Backend actualiza suscripción y plan del usuario
13. Usuario ve confirmación y puede usar el nuevo plan
```

### Flujo 2: Pago por Transferencia Bancaria

```
1. Usuario selecciona plan → /planes
2. Click "Seleccionar Plan" → /planes/checkout
3. Selecciona "Transferencia Bancaria"
4. Frontend muestra:
   - Datos bancarios (CBU, alias, etc.)
   - Monto a transferir
   - Referencia única (ej: REF-123456)
   - Formulario para subir comprobante
5. Usuario realiza transferencia y sube comprobante
6. Frontend: POST /api/pagos/transferencia/subir-comprobante
7. Backend crea pago con estado PENDIENTE
8. Admin revisa y confirma manualmente (o automático con OCR)
9. Backend actualiza estado a COMPLETADO
10. Backend activa suscripción
11. Usuario recibe email de confirmación
```

### Flujo 3: Cambio de Plan (Upgrade/Downgrade)

```
1. Usuario en /mis-plantas ve "Cambiar Plan"
2. Click → /planes?upgrade=true
3. Selecciona nuevo plan
4. Frontend calcula:
   - Prorrateo del plan actual
   - Monto a pagar/recibir
   - Nueva fecha de renovación
5. Usuario confirma cambio
6. POST /api/suscripcion/cambiar-plan
7. Backend:
   - Si upgrade: Crea nuevo pago prorrateado
   - Si downgrade: Cambia plan, renueva en próxima fecha
8. Actualiza límites inmediatamente
```

---

## 🔒 Seguridad

### 1. Validación de Pagos

- **Stripe**: Usar webhooks para confirmar pagos (no confiar solo en redirect)
- **PayPal**: Verificar IPN (Instant Payment Notification)
- **Transferencias**: Validar comprobantes con OCR o revisión manual

### 2. Protección de Datos

- **PCI Compliance**: Stripe maneja datos de tarjetas (no almacenar en BD)
- **Encriptación**: Todos los datos sensibles encriptados
- **HTTPS**: Obligatorio para todas las transacciones

### 3. Validación de Límites

- Middleware existente (`validatePlanLimits.ts`) se mantiene
- Actualizar para usar nuevos límites según plan
- Verificar suscripción activa antes de permitir operaciones

### 4. Rate Limiting

- Limitar intentos de checkout (evitar abuso)
- Limitar cambios de plan (máx. 1 por día)

---

## 📅 Plan de Implementación

### Fase 1: Preparación (Semana 1)

**Backend:**
- [ ] Actualizar enum `PlanSuscripcion` en Prisma
- [ ] Crear migración con nuevos modelos (Suscripcion, Pago)
- [ ] Actualizar `LIMITES_PLANES` con nuevos valores detallados
- [ ] Crear servicios base (stripeService, suscripcionService)

**Frontend:**
- [ ] Crear estructura de carpetas `/planes`
- [ ] Diseñar componentes básicos (PlanCard, etc.)

### Fase 2: Integración Stripe (Semana 2)

**Backend:**
- [ ] Configurar Stripe SDK
- [ ] Crear productos y precios en Stripe Dashboard
- [ ] Implementar `crear-checkout` endpoint
- [ ] Implementar webhook handler
- [ ] Probar flujo completo con Stripe Test Mode

**Frontend:**
- [ ] Integrar Stripe Elements
- [ ] Crear página de checkout
- [ ] Implementar redirección post-pago
- [ ] Crear página de éxito/error

### Fase 3: UI de Planes (Semana 2-3)

**Frontend:**
- [ ] Crear página `/planes` con todos los planes
- [ ] Implementar toggle mensual/anual
- [ ] Agregar enlaces desde landing y sidebar
- [ ] Crear componente de info de plan en `/mis-plantas`
- [ ] Diseñar tabla comparativa de planes

### Fase 4: Transferencias Bancarias (Semana 3)

**Backend:**
- [ ] Endpoint para crear pago por transferencia
- [ ] Endpoint para subir comprobante
- [ ] Sistema de referencias únicas
- [ ] Endpoint para admin confirmar transferencias

**Frontend:**
- [ ] UI para transferencia bancaria
- [ ] Formulario de upload de comprobante
- [ ] Mostrar estado pendiente

### Fase 5: Cambio de Planes (Semana 4)

**Backend:**
- [ ] Lógica de prorrateo
- [ ] Endpoint de cambio de plan
- [ ] Validación de límites al cambiar

**Frontend:**
- [ ] UI para cambio de plan
- [ ] Mostrar cálculo de prorrateo
- [ ] Confirmación de cambio

### Fase 6: Testing y Ajustes (Semana 4-5)

- [ ] Testing completo de todos los flujos
- [ ] Testing de webhooks
- [ ] Testing de límites por plan
- [ ] Ajustes de UI/UX
- [ ] Documentación

---

## 📝 Notas Importantes

### 1. Migración de Usuarios Existentes

- Todos los usuarios actuales tienen `PLAN_0` (DEMO)
- Crear script de migración para:
  - Convertir `PLAN_0` → `DEMO`
  - Crear registro en tabla `Suscripcion` con fecha de expiración (30 días desde registro)

### 2. Límites Detallados

Los límites actuales en `LIMITES_PLANES` son genéricos. Necesitarás crear una estructura más detallada:

```typescript
interface LimitesPlanDetallados {
  maxMateriasPrimas: number | null; // null = ilimitado
  maxProveedores: number | null;
  maxPiensos: number | null;
  maxCompras: number | null;
  maxFormulas: number | null;
  maxFabricaciones: number | null;
  maxGranjas: number | null;
  maxUsuarios: number | null;
  maxArchivosHistoricos: number | null;
  // Funcionalidades booleanas
  permiteGraficosAvanzados: boolean;
  permiteReportesPDF: boolean;
  permiteImportacionCSV: boolean;
  permiteMultiplesUsuarios: boolean;
  permiteDatosPermanentes: boolean;
  // ... etc
}
```

### 3. PayPal (Futuro)

- Puede implementarse después de Stripe
- Similar estructura pero con PayPal SDK
- Webhook diferente pero misma lógica

### 4. Facturación

- Stripe genera facturas automáticamente
- Para transferencias, generar facturas manualmente o con servicio externo
- Considerar integración con sistema de facturación electrónica (Argentina: AFIP)

---

## ✅ Checklist de Implementación

### Backend
- [ ] Migración de base de datos
- [ ] Servicios de Stripe
- [ ] Endpoints de suscripción
- [ ] Endpoints de pago
- [ ] Webhooks de Stripe
- [ ] Validación de límites actualizada
- [ ] Script de migración de usuarios

### Frontend
- [ ] Página de planes
- [ ] Página de checkout
- [ ] Integración Stripe Elements
- [ ] UI de transferencia bancaria
- [ ] Info de plan en `/mis-plantas`
- [ ] Enlaces desde landing y sidebar
- [ ] Manejo de estados de pago

### Testing
- [ ] Flujo completo Stripe (test mode)
- [ ] Flujo de transferencia
- [ ] Cambio de planes
- [ ] Validación de límites
- [ ] Webhooks

### Producción
- [ ] Configurar Stripe en modo producción
- [ ] Configurar webhooks en producción
- [ ] Datos bancarios reales
- [ ] Monitoreo de pagos
- [ ] Alertas de pagos fallidos

---

## 🚀 Próximos Pasos

1. **Revisar y aprobar esta arquitectura**
2. **Crear cuenta de Stripe** (si no existe)
3. **Configurar productos y precios en Stripe Dashboard**
4. **Comenzar con Fase 1** (Preparación de BD)

¿Quieres que comience con la implementación o prefieres ajustar algo de la arquitectura primero?

