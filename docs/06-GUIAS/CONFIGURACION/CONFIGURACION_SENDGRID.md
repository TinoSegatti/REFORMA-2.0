# Configuración de Email con SendGrid (Recomendado para Producción)

SendGrid es un servicio profesional de email que es más confiable que Gmail SMTP para aplicaciones en producción, especialmente cuando se despliega en servicios como Render.

## 🎯 ¿Por qué SendGrid?

- ✅ **100 emails gratis por día** (suficiente para empezar)
- ✅ **Mejor deliverability** (menos emails en spam)
- ✅ **Más confiable** que Gmail SMTP desde servidores cloud
- ✅ **No bloquea conexiones** desde IPs de Render
- ✅ **API robusta** y bien documentada
- ✅ **Dashboard con estadísticas** de envío

## 🚀 Configuración Paso a Paso

### Paso 1: Crear Cuenta en SendGrid

1. Ve a: https://signup.sendgrid.com/
2. Crea una cuenta gratuita
3. Verifica tu email
4. Completa el proceso de verificación

### Paso 2: Verificar Remitente (Obligatorio)

#### Single Sender Verification (Para tu caso - Sin dominio propio)

**Como NO tienes dominio propio** (solo usas `reforma-2-0.onrender.com` y `reforma-2-0.vercel.app`):

1. Ve a **Settings** > **Sender Authentication** en SendGrid
2. Selecciona **Single Sender Verification** (NO Domain Authentication)
3. Haz clic en **Create New Sender**
4. Completa el formulario:
   - **From Email**: `reforma.soft.co@gmail.com`
   - **From Name**: `REFORMA`
   - **Reply To**: `reforma.soft.co@gmail.com`
   - **Company Address**: Tu dirección (opcional)
   - **City**: Tu ciudad (opcional)
   - **State**: Tu estado/provincia (opcional)
   - **Country**: Tu país
5. Haz clic en **Create**
6. **Verifica el email**: SendGrid enviará un email de verificación a `reforma.soft.co@gmail.com`
7. Abre el email y haz clic en el enlace de verificación
8. Una vez verificado, puedes usar este email como remitente

**Ventajas:**
- ✅ No necesitas dominio propio
- ✅ Configuración rápida (5 minutos)
- ✅ Funciona inmediatamente
- ✅ Perfecto para empezar

**Nota**: Si en el futuro compras un dominio propio (ejemplo: `reforma.com`), puedes configurar Domain Authentication para mejor deliverability. Por ahora, Single Sender Verification es suficiente.

#### Domain Authentication (Solo si tienes dominio propio)

**Si tienes dominio propio** (ejemplo: `reforma.com`):

1. Ve a **Settings** > **Sender Authentication**
2. Selecciona **Domain Authentication**
3. Ingresa tu dominio
4. **Selecciona tu DNS Host**:
   - Si compraste el dominio en **GoDaddy** → Selecciona "GoDaddy"
   - Si compraste en **Namecheap** → Selecciona "Namecheap"
   - Si usas **Cloudflare** → Selecciona "Cloudflare"
   - Si no está en la lista → Selecciona "Other" o "Generic"
5. Agrega los registros DNS que SendGrid te proporciona
6. Espera 5-10 minutos y verifica

**⚠️ IMPORTANTE**: Render y Vercel NO son DNS hosts. El DNS está donde compraste tu dominio o donde está configurado.

**Ver guía completa**: [`CONFIGURACION_SENDGRID_DNS.md`](./CONFIGURACION_SENDGRID_DNS.md)

### Paso 3: Generar API Key

1. Ve a **Settings** > **API Keys**
2. Haz clic en **Create API Key**
3. Dale un nombre: `REFORMA Production`
4. Selecciona **Full Access** o **Restricted Access** con permisos de **Mail Send**
5. Copia el API Key inmediatamente (solo se muestra una vez)

**⚠️ IMPORTANTE**: Guarda el API Key en un lugar seguro. No se puede recuperar después.

### Paso 4: Configurar en Render

En el dashboard de Render, configura estas variables de entorno:

```bash
# SendGrid Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Tu API Key de SendGrid

# Frontend URL
FRONTEND_URL=https://tu-frontend.vercel.app
```

### Paso 5: Verificar Configuración

Después de hacer deploy, revisa los logs de Render. Deberías ver:

```
📧 Inicializando transporter SMTP:
   Host: smtp.sendgrid.net
   Port: 587
   User: apikey
   Secure: false
   Password length: XX caracteres
```

## 📧 Configuración de Remitente

### Opción 1: Usar Email Verificado Individualmente

1. Ve a **Settings** > **Sender Authentication**
2. Selecciona **Single Sender Verification**
3. Agrega tu email: `reforma.soft.co@gmail.com`
4. Verifica el email siguiendo las instrucciones

### Opción 2: Usar Dominio Verificado (Recomendado)

1. Verifica tu dominio completo (paso 2)
2. Puedes usar cualquier email de ese dominio

## 🧪 Probar la Configuración

### 1. Verificar Variables en Render

Asegúrate de que todas las variables estén configuradas:

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FRONTEND_URL=https://tu-frontend.vercel.app
```

### 2. Probar Registro de Usuario

1. Registra un nuevo usuario en la aplicación
2. Revisa los logs de Render para ver si el email se envió
3. Verifica que el email llegue a la bandeja de entrada

### 3. Verificar en SendGrid Dashboard

1. Ve a **Activity** en el dashboard de SendGrid
2. Verás todos los emails enviados
3. Puedes ver el estado de cada email (delivered, bounced, etc.)

## 📊 Límites de SendGrid

### Plan Gratuito (Free)

- **100 emails por día**
- **40,000 emails por mes** (primeros 30 días)
- **100 emails por día** después del período inicial
- Estadísticas básicas
- Soporte por email

### Plan Essentials ($19.95/mes)

- **50,000 emails por mes**
- Estadísticas avanzadas
- Soporte prioritario
- IP dedicada (opcional)

## 🚨 Troubleshooting

### Error: "Authentication failed"

**Causa**: API Key incorrecto o sin permisos.

**Solución**:
1. Verifica que `SMTP_USER` sea exactamente `apikey` (en minúsculas)
2. Verifica que `SMTP_PASSWORD` sea el API Key completo (empieza con `SG.`)
3. Verifica que el API Key tenga permisos de "Mail Send"
4. Genera un nuevo API Key si es necesario

### Error: "Connection timeout"

**Causa**: Problemas de red o configuración incorrecta.

**Solución**:
1. Verifica que `SMTP_HOST` sea `smtp.sendgrid.net`
2. Verifica que `SMTP_PORT` sea `587`
3. Verifica que `SMTP_SECURE` sea `false`
4. Revisa los logs de Render para más detalles

### Los emails van a spam

**Causa**: Dominio no verificado o configuración SPF/DKIM incorrecta.

**Solución**:
1. Verifica tu dominio en SendGrid
2. Configura correctamente los registros SPF y DKIM
3. Usa un email del dominio verificado como remitente
4. Evita palabras spam en el contenido del email

### Error: "Sender email not verified"

**Causa**: El email remitente no está verificado en SendGrid.

**Solución**:
1. Ve a **Settings** > **Sender Authentication**
2. Verifica el email que estás usando como remitente
3. O verifica tu dominio completo

## 📝 Notas Importantes

1. **API Key es secreto**: Nunca compartas tu API Key públicamente
2. **Rotación de API Keys**: Genera nuevos API Keys periódicamente
3. **Límites**: Monitorea tu uso en el dashboard de SendGrid
4. **Remitente**: Usa siempre un email verificado como remitente

## 🔗 Enlaces Útiles

- [SendGrid Dashboard](https://app.sendgrid.com/)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [SendGrid API Keys](https://app.sendgrid.com/settings/api_keys)
- [SendGrid Sender Authentication](https://app.sendgrid.com/settings/sender_auth)

## ✅ Checklist de Configuración

- [ ] Cuenta de SendGrid creada
- [ ] Email o dominio verificado
- [ ] API Key generado
- [ ] Variables de entorno configuradas en Render
- [ ] `SMTP_HOST` = `smtp.sendgrid.net`
- [ ] `SMTP_PORT` = `587`
- [ ] `SMTP_SECURE` = `false`
- [ ] `SMTP_USER` = `apikey`
- [ ] `SMTP_PASSWORD` = API Key completo
- [ ] `FRONTEND_URL` = URL completa con `https://`
- [ ] Deploy realizado
- [ ] Email de prueba enviado y recibido
- [ ] Verificado en dashboard de SendGrid

## 🎉 Ventajas sobre Gmail SMTP

| Característica | Gmail SMTP | SendGrid |
|---------------|------------|----------|
| Límite diario | 500 emails | 100 emails (gratis) |
| Bloqueos de IP | Sí (común) | No |
| Deliverability | Media | Alta |
| Estadísticas | No | Sí |
| API | Limitada | Completa |
| Soporte | Limitado | Profesional |
| Confiabilidad | Media | Alta |

**Conclusión**: Para producción, SendGrid es la mejor opción.

