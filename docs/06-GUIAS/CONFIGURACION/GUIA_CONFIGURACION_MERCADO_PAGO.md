# 🚀 Guía Paso a Paso: Configuración Completa de Mercado Pago

## 📋 Tareas Pendientes para Configurar Mercado Pago

Esta guía te llevará paso a paso para completar la configuración de Mercado Pago como procesador de pagos para los planes de suscripción en dólares.

---

## ✅ Tareas Completadas

- [x] Migración de código de Stripe a Mercado Pago
- [x] Eliminación de archivos de Stripe
- [x] Actualización de servicios y controladores
- [x] Migración de base de datos
- [x] Actualización del frontend

---

## ⏳ Tareas Pendientes

### 📝 FASE 1: Crear/Verificar Cuenta en Mercado Pago

#### Opción A: Usar Cuenta Personal (Monotributista) ⭐ RECOMENDADO

Si eres monotributista, puedes usar tu cuenta personal de Mercado Pago. Esto simplifica el proceso:

- [ ] Verificar que tengas cuenta personal en Mercado Pago
- [ ] Si no tienes cuenta, crear una en: https://www.mercadopago.com.ar
- [ ] Completar datos personales:
  - Nombre completo
  - CUIT/CUIL
  - Domicilio
  - Datos bancarios (CBU para recibir pagos)
- [ ] Verificar cuenta subiendo:
  - DNI (frente y dorso)
  - Comprobante de domicilio
  - Constancia de inscripción en Monotributo (AFIP)
- [ ] Esperar verificación (puede tardar 24-48 horas)

**Ventajas de cuenta personal**:
- ✅ Proceso más rápido y simple
- ✅ Menos documentación requerida
- ✅ Ideal para monotributistas
- ✅ Puedes recibir pagos de suscripciones
- ✅ Mismo acceso a la API de desarrolladores

**Consideraciones**:
- ⚠️ Límites de recepción mensual (verificar en tu cuenta)
- ⚠️ Para grandes volúmenes, puede requerirse cuenta empresarial
- ⚠️ Facturación: deberás emitir facturas C como monotributista

**Tiempo estimado**: 15-30 minutos (creación) + 1-2 días (verificación)

#### Opción B: Crear Cuenta Empresarial (Opcional)

Solo si necesitas mayor volumen o prefieres separar finanzas personales/empresariales:

- [ ] Ir a https://www.mercadopago.com.ar
- [ ] Crear cuenta empresarial
- [ ] Completar datos de la empresa:
  - Razón social
  - CUIT
  - Domicilio fiscal
  - Datos bancarios (CBU para recibir pagos)
- [ ] Subir documentación requerida:
  - Constancia de inscripción AFIP
  - Documento del representante legal
  - Comprobante de domicilio
- [ ] Esperar aprobación (puede tardar 24-48 horas)

**Tiempo estimado**: 15-30 minutos + 1-2 días (espera de aprobación)

---

### 🔑 FASE 2: Obtener Credenciales de API

#### Paso 2.1: Acceder al Panel de Desarrolladores
- [ ] Iniciar sesión en Mercado Pago (con tu cuenta personal o empresarial)
- [ ] Ir a: https://www.mercadopago.com.ar/developers/panel
- [ ] Crear una nueva aplicación (si no existe)
- [ ] ⚠️ **IMPORTANTE**: Tanto cuentas personales como empresariales tienen acceso al panel de desarrolladores

#### Paso 2.2: Obtener Access Token
- [ ] En el panel, ir a **"Credenciales"**
- [ ] Copiar el **Access Token** (empieza con `APP_USR-...`)
- [ ] ⚠️ **IMPORTANTE**: 
  - Usar credenciales de **TEST** para desarrollo
  - Usar credenciales de **PRODUCCIÓN** solo cuando estés listo

#### Paso 2.3: Configurar Variables de Entorno
- [ ] Abrir archivo `backend/.env`
- [ ] Agregar las siguientes variables con tus credenciales:

```env
# Mercado Pago - Credenciales de PRODUCCIÓN
MERCADOPAGO_ACCESS_TOKEN=APP_USR-7406418976971664-111816-8caab73dd36eb423bbd6862a6c8cfde9-812350056

# Frontend URL (para redirects después del pago)
FRONTEND_URL=http://localhost:3001

# Webhook Secret (para verificar webhooks)
MERCADOPAGO_WEBHOOK_SECRET=f59961b12a17a27d78a6d7a5e6628393c56e30ce69e2543d2ab0eb4bca285551
```

- [ ] Guardar el archivo
- [ ] Reiniciar el servidor backend: `npm run dev`

**Tiempo estimado**: 5 minutos

> 📝 **Nota**: Ver `docs/CONFIGURACION_VARIABLES_ENTORNO.md` para más detalles sobre las credenciales

---

### 🔔 FASE 3: Configurar Webhooks

#### Paso 3.1: Exponer Servidor Local (Solo para Desarrollo)
- [ ] Instalar ngrok: https://ngrok.com/download
- [ ] Ejecutar: `ngrok http 3000`
- [ ] Copiar la URL HTTPS generada (ej: `https://abc123.ngrok.io`)

**Tiempo estimado**: 5 minutos

#### Paso 3.2: Configurar Webhook en Mercado Pago Dashboard
- [ ] Ir a: https://www.mercadopago.com.ar/developers/panel/apps/[TU_APP_ID]/webhooks
- [ ] Crear nuevo webhook:
  - **URL**: 
    - Desarrollo (con ngrok): `https://unmerciful-ossie-fluent.ngrok-free.dev/api/suscripcion/webhook/mercadopago`
    - Producción: `https://tu-dominio.com/api/suscripcion/webhook/mercadopago`
  - **Eventos a escuchar**:
    - ✅ `payment`
    - ✅ `Planes y suscripciones` (subscription_preapproval)
- [ ] Guardar configuración
- [ ] ✅ **Ya configurado**: Webhook Secret = `f59961b12a17a27d78a6d7a5e6628393c56e30ce69e2543d2ab0eb4bca285551`
- [ ] Verificar que el webhook esté activo

**Tiempo estimado**: 5 minutos

> ⚠️ **IMPORTANTE**: Mantén ngrok corriendo mientras desarrollas para que los webhooks funcionen

---

### 💰 FASE 4: Configurar Moneda y Precios

#### Paso 4.1: Verificar Precios en Dólares
- [ ] Abrir `backend/src/constants/planes.ts`
- [ ] Verificar que los precios estén en USD:
  - STARTER: $35/mes, $350/año
  - BUSINESS: $99/mes, $990/año
  - ENTERPRISE: $229/mes, $2290/año

#### Paso 4.2: Configurar Moneda en Mercado Pago
- [ ] Abrir `backend/src/services/mercadoPagoService.ts`
- [ ] Verificar que `currency_id` esté configurado como `'USD'` (línea ~121)
- [ ] Si necesitas cambiar a ARS, modificar:
  ```typescript
  currency_id: 'USD', // Cambiar a 'ARS' si prefieres pesos
  ```

**Tiempo estimado**: 5 minutos

---

### 🧪 FASE 5: Probar en Modo Test

#### Paso 5.1: Verificar Configuración
- [ ] Reiniciar servidor backend: `npm run dev`
- [ ] Verificar que no haya errores en los logs
- [ ] Verificar que aparezca: `🚀 Servidor corriendo en http://localhost:3000`

#### Paso 5.2: Probar Creación de Checkout
- [ ] Iniciar sesión en el frontend como usuario no admin
- [ ] Ir a `/planes`
- [ ] Seleccionar un plan (STARTER, BUSINESS o ENTERPRISE)
- [ ] Seleccionar período (Mensual o Anual)
- [ ] Hacer clic en "Seleccionar Plan"
- [ ] Deberías ser redirigido a Mercado Pago

#### Paso 5.3: Usar Tarjetas de Prueba
Mercado Pago proporciona tarjetas de prueba:

**Pago Exitoso**:
- Tarjeta: `5031 7557 3453 0604`
- CVV: Cualquier número de 3 dígitos
- Fecha: Cualquier fecha futura
- Nombre: Cualquier nombre

**Pago Rechazado**:
- Tarjeta: `5031 4332 1540 6351`

**Pago Pendiente**:
- Tarjeta: `5031 7557 3453 0604` (con ciertos CVV)

#### Paso 5.4: Verificar Webhook
- [ ] Completar pago con tarjeta de prueba
- [ ] Verificar en logs del backend que se recibió el webhook
- [ ] Verificar en la base de datos que se creó la suscripción
- [ ] Verificar que el usuario tenga el plan actualizado

**Tiempo estimado**: 30 minutos

---

### 🚀 FASE 6: Configurar para Producción

#### Paso 6.1: Cambiar a Credenciales de Producción
- [ ] En Mercado Pago Dashboard, cambiar a modo **PRODUCCIÓN**
- [ ] Copiar el nuevo **Access Token** de producción
- [ ] Actualizar `backend/.env`:
  ```env
  MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxx
  ```
- [ ] Actualizar `FRONTEND_URL` con tu dominio real:
  ```env
  FRONTEND_URL=https://tu-dominio.com
  ```

#### Paso 6.2: Configurar Webhook de Producción
- [ ] En Mercado Pago Dashboard, crear webhook de producción:
  - **URL**: `https://tu-dominio.com/api/suscripcion/webhook/mercadopago`
  - **Eventos**: `payment`, `subscription_preapproval`
- [ ] Copiar el **Webhook Secret** de producción
- [ ] Actualizar `MERCADOPAGO_WEBHOOK_SECRET` en `.env`

#### Paso 6.3: Verificar Configuración de Producción
- [ ] Verificar que el servidor esté corriendo en producción
- [ ] Verificar que las variables de entorno estén configuradas
- [ ] Probar un pago real con tarjeta de prueba primero
- [ ] Monitorear logs para verificar que todo funcione

**Tiempo estimado**: 20 minutos

---

### 📊 FASE 7: Monitoreo y Verificación

#### Paso 7.1: Verificar Suscripciones Creadas
- [ ] Acceder a la base de datos (Prisma Studio o SQL)
- [ ] Verificar tabla `t_suscripciones`:
  - Debe tener `mercadoPagoPreapprovalId` poblado
  - Estado debe ser `ACTIVA` después del pago
- [ ] Verificar tabla `t_pagos`:
  - Debe tener registros con `metodoPago = 'MERCADOPAGO'`
  - Debe tener `mercadoPagoPaymentId` y `mercadoPagoPreapprovalId`

#### Paso 7.2: Verificar Renovaciones Automáticas
- [ ] Esperar a que se procese una renovación automática
- [ ] Verificar que Mercado Pago cobre automáticamente
- [ ] Verificar que se cree un nuevo registro en `t_pagos`
- [ ] Verificar que la suscripción siga activa

#### Paso 7.3: Probar Cancelación
- [ ] Cancelar una suscripción desde el frontend
- [ ] Verificar que se actualice en Mercado Pago
- [ ] Verificar que el estado cambie a `CANCELADA` en la BD
- [ ] Verificar que el usuario sea degradado a plan DEMO

**Tiempo estimado**: Variable (depende de los períodos de facturación)

---

## 🔍 Checklist Final

Antes de considerar la configuración completa, verifica:

- [ ] Cuenta de Mercado Pago creada/verificada (personal o empresarial)
- [ ] Cuenta verificada y habilitada para recibir pagos
- [ ] CBU configurado para recibir transferencias
- [ ] Access Token configurado en `.env`
- [ ] Webhook configurado y funcionando
- [ ] Pruebas en modo TEST exitosas
- [ ] Credenciales de PRODUCCIÓN configuradas
- [ ] Webhook de producción configurado
- [ ] Al menos una suscripción creada exitosamente
- [ ] Pagos procesándose correctamente
- [ ] Renovaciones automáticas funcionando
- [ ] Cancelaciones funcionando correctamente
- [ ] Sistema de facturación configurado (si aplica como monotributista)

---

## 📚 Recursos Útiles

### Documentación Oficial
- **API de Suscripciones**: https://www.mercadopago.com.ar/developers/es/docs/subscriptions
- **Webhooks**: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
- **SDK Node.js**: https://github.com/mercadopago/sdk-nodejs
- **Panel de Desarrolladores**: https://www.mercadopago.com.ar/developers/panel

### Documentación del Proyecto
- `docs/CONFIGURACION_MERCADO_PAGO.md` - Configuración técnica detallada
- `docs/MIGRACION_COMPLETA_STRIPE_MERCADOPAGO.md` - Resumen de la migración
- `docs/RESUMEN_MIGRACION_MERCADO_PAGO.md` - Resumen técnico

---

## ⚠️ Problemas Comunes y Soluciones

### Error: "Usuario no encontrado" al crear checkout
**Solución**: 
- Este error indica que el `userId` del token JWT no existe en la base de datos
- **Causas comunes**:
  - El token fue generado con un ID de usuario que ya no existe
  - Hay un problema con la sesión/autenticación
  - El usuario fue eliminado después de crear el token
- **Solución**:
  1. Cerrar sesión y volver a iniciar sesión en el frontend
  2. Verificar en los logs del backend qué `userId` se está recibiendo
  3. Verificar que ese usuario exista en la base de datos
  4. Si el problema persiste, limpiar el localStorage del navegador y volver a iniciar sesión

### Error: "MERCADOPAGO_ACCESS_TOKEN no está configurada"
**Solución**: 
- Verificar que `MERCADOPAGO_ACCESS_TOKEN` esté en `backend/.env`
- Usar el Access Token de producción proporcionado: `APP_USR-7406418976971664-111816-8caab73dd36eb423bbd6862a6c8cfde9-812350056`
- Reiniciar el servidor después de agregar la variable

### Error: "No se pudo obtener URL de pago"
**Solución**:
- Verificar que el Access Token sea válido
- Verificar que uses credenciales de TEST en desarrollo
- Revisar logs del backend para más detalles

### Webhook no funciona
**Solución**:
- Verificar que la URL sea accesible públicamente
- Usar ngrok para desarrollo local
- Verificar que el endpoint esté configurado correctamente en `index.ts`
- Verificar logs del backend cuando Mercado Pago envía el webhook

### Pagos no se procesan
**Solución**:
- Verificar que el webhook esté configurado correctamente
- Verificar logs del backend para ver si se reciben los eventos
- Verificar que `webhookMercadoPagoController.ts` esté manejando los eventos correctamente

### Límites de recepción en cuenta personal
**Solución**:
- Verificar límites en tu cuenta de Mercado Pago (pueden variar según nivel de verificación)
- Si necesitas mayor volumen, considerar actualizar a cuenta empresarial
- Contactar soporte de Mercado Pago para aumentar límites si es necesario
- Los límites suelen aumentar con el tiempo y uso de la cuenta

### Conversión de moneda USD a ARS
**Solución**:
- Mercado Pago puede convertir automáticamente USD a ARS al recibir
- Verificar configuración de moneda en tu cuenta de Mercado Pago
- Si prefieres recibir en USD, verificar que tu cuenta esté configurada para recibir dólares
- Consultar con Mercado Pago sobre disponibilidad de cuenta en USD para Argentina
- ⚠️ **Nota**: En Argentina, Mercado Pago generalmente convierte automáticamente a ARS según el tipo de cambio del día

### Facturación como Monotributista
**Solución**:
- Deberás emitir facturas C por cada pago recibido
- Considera integrar un sistema de facturación automática
- Consulta con tu contador sobre cómo registrar suscripciones recurrentes
- Puedes usar sistemas como Facturación Electrónica de AFIP o servicios como Facturador Online
- ⚠️ **Importante**: Las suscripciones recurrentes se facturan cuando se recibe cada pago, no al inicio

---

## 💡 Tips Importantes

1. **Cuenta Personal vs Empresarial**:
   - **Cuenta Personal (Monotributista)**: ✅ Recomendado para empezar
     - Más rápido de configurar
     - Menos documentación
     - Ideal para recibir pagos de suscripciones
     - Verifica límites de recepción mensual en tu cuenta
   - **Cuenta Empresarial**: Solo si necesitas mayor volumen o separación contable
   - Ambas cuentas tienen acceso completo a la API de desarrolladores
   - Ambas pueden recibir pagos en USD

2. **Facturación como Monotributista**:
   - Deberás emitir facturas C por cada suscripción recibida
   - Considera usar un sistema de facturación automática
   - Consulta con tu contador sobre el tratamiento de suscripciones recurrentes

3. **Modo Test vs Producción**:
   - Siempre prueba primero en modo TEST
   - No uses credenciales de producción en desarrollo
   - Cambia a producción solo cuando todo funcione en test

4. **Moneda**:
   - Por defecto está configurado en USD
   - Puedes cambiar a ARS editando `mercadoPagoService.ts`
   - Asegúrate de que los precios en `planes.ts` coincidan con la moneda
   - ⚠️ **IMPORTANTE**: Mercado Pago puede convertir automáticamente USD a ARS al recibir, verifica la configuración de tu cuenta

5. **Webhooks**:
   - Los webhooks son críticos para el funcionamiento automático
   - Sin webhooks, los pagos no se procesarán automáticamente
   - Siempre verifica que los webhooks estén funcionando

6. **Super Admin**:
   - El super admin puede cambiar planes sin procesador de pago
   - Esto es útil para testing y gestión manual
   - No afecta el funcionamiento normal de Mercado Pago

---

## 📞 Soporte

Si encuentras problemas durante la configuración:

1. Revisar logs del backend para errores específicos
2. Verificar documentación oficial de Mercado Pago
3. Consultar los documentos de configuración en `docs/`
4. Verificar que todas las variables de entorno estén configuradas

---

**Última actualización**: Después de completar la migración de Stripe a Mercado Pago

**Estado**: Listo para configuración paso a paso

