# 🇦🇷 Stripe y Argentina - Información Importante

## ✅ Argentina SÍ está disponible en Stripe

Aunque no aparezca en algunas listas iniciales durante la configuración, **Argentina está completamente soportada por Stripe**.

## 📍 Configuración de Cuenta en Argentina

### Opción 1: Cuenta Argentina (Recomendado)

Stripe permite crear cuentas en Argentina. Para configurarla:

1. **Ir a Settings** → **Account details**
2. **Business information** → **Business location**
3. Seleccionar **Argentina** como país
4. Completar la información fiscal argentina:
   - **CUIT/CUIL** (número de identificación fiscal)
   - **Razón social**
   - **Dirección fiscal**
   - **Actividad económica**

### Opción 2: Usar Stripe Atlas (Para Startups)

Si planeas recibir pagos internacionales, puedes considerar **Stripe Atlas** que permite crear una entidad en EE.UU. mientras operas desde Argentina.

## 💰 Moneda y Pagos

### Monedas Soportadas

- **ARS (Peso Argentino)**: Disponible para recibir pagos locales
- **USD (Dólar Estadounidense)**: Disponible para recibir pagos internacionales
- **Otras monedas**: Stripe soporta múltiples monedas

### Recomendación para REFORMA

Dado que tus planes están en **USD** ($35, $99, $229), te recomiendo:

1. **Configurar tu cuenta en USD** como moneda principal
2. **Permitir pagos en múltiples monedas** (Stripe convierte automáticamente)
3. **Los clientes argentinos pueden pagar en ARS** y Stripe convierte a USD

## 🏦 Transferencias y Retiros

### Retiros a Cuenta Argentina

Stripe permite retirar fondos a cuentas bancarias argentinas:

1. **Configurar cuenta bancaria** en Settings → **Payouts**
2. **Agregar cuenta bancaria argentina**:
   - CBU o Alias
   - Banco
   - Tipo de cuenta (corriente/ahorro)
   - Nombre del titular
3. **Tiempo de transferencia**: 2-7 días hábiles
4. **Moneda**: Puedes recibir en USD o ARS (con conversión)

### Alternativa: Cuenta en USD

Si tienes cuenta en USD en Argentina, puedes recibir directamente en dólares.

## 📊 Impuestos y Facturación

### Facturación en Argentina

- Stripe genera **comprobantes de pago** automáticamente
- Puedes integrar con sistemas de facturación argentinos (AFIP)
- Stripe maneja la retención de impuestos según corresponda

### IVA y Retenciones

- Stripe puede manejar **retenciones de IVA** si aplica
- Consulta con un contador sobre la configuración fiscal específica

## ⚠️ Consideraciones Importantes

### 1. Verificación de Cuenta

Stripe requiere verificación de identidad:
- Documento de identidad (DNI)
- Comprobante de domicilio
- Información fiscal (CUIT)

### 2. Límites Iniciales

Las cuentas nuevas tienen límites:
- **Modo Test**: Sin límites
- **Modo Live**: Límites iniciales que se aumentan con el tiempo y volumen

### 3. Comisiones

Las comisiones son las mismas independientemente del país:
- **2.9% + $0.30 USD** por transacción con tarjeta
- Puede variar según el tipo de tarjeta y país del cliente

## 🚀 Pasos para Configurar desde Argentina

1. **Crear cuenta Stripe** (ya lo hiciste ✅)
2. **Completar información de negocio**:
   - País: Argentina
   - CUIT/CUIL
   - Dirección fiscal
3. **Configurar cuenta bancaria** para retiros
4. **Verificar identidad** (subir documentos)
5. **Activar cuenta Live** (después de verificación)

## 📞 Soporte

Si tienes problemas específicos con Argentina:
- **Soporte de Stripe**: https://support.stripe.com
- **Documentación Argentina**: Buscar en docs de Stripe
- **Comunidad**: Foros de desarrolladores de Stripe

## ✅ Conclusión

**No hay impedimento para usar Stripe desde Argentina**. El país está completamente soportado y puedes:
- ✅ Recibir pagos en USD o ARS
- ✅ Retirar a cuentas argentinas
- ✅ Facturar según normativa argentina
- ✅ Operar normalmente

Solo necesitas completar la verificación de cuenta con tus datos fiscales argentinos.

