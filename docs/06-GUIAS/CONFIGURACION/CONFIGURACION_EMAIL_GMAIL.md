# Configuración de Email con Gmail SMTP

Esta guía explica cómo configurar el servicio de email de REFORMA para usar Gmail SMTP en producción.

## 📋 Requisitos Previos

- Cuenta de Gmail
- Acceso a Google Cloud Console (opcional, para App Passwords)
- Variables de entorno configuradas en Render

## 🔐 Opción 1: App Password (Recomendado)

### 1. Habilitar Verificación en 2 Pasos

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Ve a **Seguridad**
3. Habilita **Verificación en 2 pasos** si no está habilitada

### 2. Generar App Password

1. Ve a: https://myaccount.google.com/apppasswords
2. Selecciona **Aplicación**: "Correo"
3. Selecciona **Dispositivo**: "Otro (nombre personalizado)"
4. Escribe: "REFORMA Backend"
5. Haz clic en **Generar**
6. Copia la contraseña generada (16 caracteres sin espacios)

### 3. Configurar en Render

En el dashboard de Render, configura estas variables de entorno:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx  # App Password de 16 caracteres (sin espacios)
```

**Importante**: 
- Usa el **App Password**, NO tu contraseña normal de Gmail
- No incluyas espacios en el App Password

## 🔐 Opción 2: Contraseña Normal (No Recomendado)

Si no puedes usar App Passwords, puedes usar tu contraseña normal, pero:

1. Debes habilitar "Permitir el acceso de aplicaciones menos seguras" (ya no está disponible en cuentas nuevas)
2. Es menos seguro
3. Puede dejar de funcionar si Google detecta actividad sospechosa

## ⚙️ Configuración en Render

### Variables de Entorno Requeridas

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=reforma.soft.co@gmail.com
SMTP_PASSWORD=tu_app_password_aqui

# Frontend URL (para enlaces en emails)
FRONTEND_URL=https://tu-frontend.vercel.app
```

### Valores Explicados

- **SMTP_HOST**: `smtp.gmail.com` - Servidor SMTP de Gmail
- **SMTP_PORT**: `587` - Puerto para STARTTLS (recomendado) o `465` para SSL
- **SMTP_SECURE**: `false` - Para puerto 587 usa `false`, para 465 usa `true`
- **SMTP_USER**: Tu email de Gmail completo
- **SMTP_PASSWORD**: App Password de 16 caracteres

## 🧪 Probar la Configuración

### 1. Verificar Variables de Entorno

El servicio de email verifica automáticamente la configuración. Revisa los logs de Render al iniciar:

```
✅ Email configurado correctamente
```

O si falta configuración:

```
⚠️  Configuración SMTP incompleta. El envío de emails no funcionará.
   Variables requeridas: SMTP_HOST, SMTP_USER, SMTP_PASSWORD
```

### 2. Probar Registro de Usuario

1. Registra un nuevo usuario en la aplicación
2. Debe recibir un email de verificación
3. Revisa los logs de Render para ver si el email se envió correctamente

### 3. Verificar en Gmail

- Revisa la bandeja de entrada del email registrado
- Si no aparece, revisa la carpeta de spam
- Verifica que el remitente sea `reforma.soft.co@gmail.com`

## 🚨 Troubleshooting

### Error: "Connection timeout"

**Causa**: El servidor SMTP de Gmail no responde o hay problemas de red.

**Solución**:
1. Verifica que `SMTP_HOST` sea exactamente `smtp.gmail.com`
2. Verifica que `SMTP_PORT` sea `587` o `465`
3. Verifica que el backend tenga acceso a internet
4. Revisa los logs de Render para más detalles

### Error: "Invalid login"

**Causa**: Credenciales incorrectas o App Password inválido.

**Solución**:
1. Verifica que `SMTP_USER` sea tu email completo de Gmail
2. Verifica que `SMTP_PASSWORD` sea el App Password correcto (16 caracteres, sin espacios)
3. Genera un nuevo App Password si es necesario
4. Asegúrate de que la verificación en 2 pasos esté habilitada

### Error: "Authentication failed"

**Causa**: Gmail bloqueó el acceso por seguridad.

**Solución**:
1. Ve a: https://myaccount.google.com/security
2. Revisa la sección "Actividad reciente de seguridad"
3. Autoriza el acceso si aparece como bloqueado
4. Genera un nuevo App Password

### Los emails no se envían pero no hay error

**Causa**: El servicio está configurado pero hay un problema silencioso.

**Solución**:
1. Revisa los logs de Render para ver mensajes de error
2. Verifica que `FRONTEND_URL` esté configurado correctamente
3. Verifica que el email del destinatario sea válido
4. Revisa la carpeta de spam del destinatario

### El registro funciona pero el email no llega

**Causa**: El email se envía en segundo plano y puede fallar silenciosamente.

**Solución**:
1. El registro se completa correctamente aunque el email falle
2. Revisa los logs para ver errores de email
3. El usuario puede solicitar reenvío del email de verificación

## 📧 Tipos de Emails Enviados

### Email de Verificación

Se envía cuando:
- Un usuario se registra por primera vez
- Un usuario solicita reenvío del email de verificación

**Contenido**:
- Mensaje de bienvenida
- Enlace de verificación (válido por 24 horas)
- Instrucciones para verificar la cuenta

### Configuración del Email

El servicio de email está configurado con:
- **Timeouts**: 10 segundos para conexión, saludo y operaciones de socket
- **Envío asíncrono**: No bloquea el proceso de registro
- **Manejo de errores**: Los errores se registran pero no afectan el registro

## 🔒 Seguridad

1. **Nunca compartas tu App Password**: Es un secreto como tu contraseña
2. **Usa App Passwords**: Más seguro que contraseñas normales
3. **Rota App Passwords**: Si sospechas que está comprometido, genera uno nuevo
4. **Monitorea el uso**: Revisa regularmente los logs de envío de emails

## 📝 Notas Importantes

1. **Límites de Gmail**: 
   - 500 emails por día para cuentas gratuitas
   - 2000 emails por día para Google Workspace

2. **Rate Limiting**: 
   - Si envías muchos emails rápidamente, Gmail puede limitar temporalmente
   - El sistema tiene timeouts para evitar bloqueos

3. **Spam**: 
   - Los emails pueden ir a spam si no configuras SPF/DKIM
   - Para producción, considera usar un servicio profesional como SendGrid o Mailgun

## 🔗 Enlaces Útiles

- [App Passwords de Google](https://myaccount.google.com/apppasswords)
- [Configuración SMTP de Gmail](https://support.google.com/mail/answer/7126229)
- [Google Cloud Console](https://console.cloud.google.com/)




