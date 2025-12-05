# Solución: Error de Conexión SMTP (ETIMEDOUT)

## 🔴 Problema

El servidor no puede conectarse a Gmail SMTP y muestra el error:
```
Error code: ETIMEDOUT
Error command: CONN
Error message: Connection timeout
```

## 🔍 Causas Posibles

### 1. Servidor en Desarrollo Local

Si estás ejecutando el backend en desarrollo local (`npm run dev` o `npm start` en tu máquina), Gmail puede:
- Bloquear conexiones desde IPs residenciales
- Requerir configuración adicional de firewall
- Tener restricciones de red

### 2. Restricciones de Red/Firewall

- Tu ISP puede estar bloqueando el puerto 587
- Tu firewall puede estar bloqueando conexiones salientes SMTP
- Tu red corporativa puede tener restricciones

### 3. Configuración Incorrecta

- Puerto incorrecto (587 vs 465)
- SMTP_SECURE configurado incorrectamente
- App Password incorrecto o expirado

## ✅ Soluciones

### Solución 1: Usar Puerto 465 con SSL (Recomendado)

Gmail soporta dos puertos:
- **Puerto 587**: STARTTLS (requiere `SMTP_SECURE=false`)
- **Puerto 465**: SSL directo (requiere `SMTP_SECURE=true`)

**Configuración en Render:**

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=reforma.soft.co@gmail.com
SMTP_PASSWORD=lwpcoinubvhpscy  # Sin espacios
```

**Ventajas del puerto 465:**
- Conexión SSL directa (más segura)
- Menos problemas con firewalls
- Mejor compatibilidad con redes restrictivas

### Solución 2: Verificar Variables de Entorno

Asegúrate de que todas las variables estén configuradas correctamente en Render:

```bash
# Verificar que estas variables existan:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587  # o 465
SMTP_SECURE=false  # true para puerto 465
SMTP_USER=reforma.soft.co@gmail.com
SMTP_PASSWORD=lwpcoinubvhpscy  # App Password sin espacios

# También verificar:
FRONTEND_URL=https://tu-frontend.vercel.app  # Con https://
```

### Solución 3: Verificar App Password

1. Ve a: https://myaccount.google.com/apppasswords
2. Verifica que el App Password esté activo
3. Si es necesario, genera uno nuevo
4. Copia el nuevo App Password **sin espacios**
5. Actualiza `SMTP_PASSWORD` en Render

### Solución 4: Verificar Acceso a Internet del Servidor

Si estás en desarrollo local, verifica que tu máquina pueda conectarse a Gmail:

```bash
# Probar conexión a Gmail SMTP
telnet smtp.gmail.com 587
# o
telnet smtp.gmail.com 465
```

Si no puedes conectarte, el problema es de red/firewall.

### Solución 5: Usar Servicio de Email Profesional (Recomendado para Producción)

Para producción, considera usar un servicio profesional:

#### SendGrid (Recomendado)
- 100 emails gratis por día
- Mejor deliverability
- API más confiable

**Configuración:**
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Mailgun
- 5,000 emails gratis por mes
- Excelente para producción

**Configuración:**
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@tu-dominio.com
SMTP_PASSWORD=tu-api-key
```

## 🧪 Probar la Configuración

### 1. Verificar Variables en Render

1. Ve al dashboard de Render
2. Selecciona tu servicio de backend
3. Ve a **Environment**
4. Verifica que todas las variables SMTP estén configuradas

### 2. Verificar Logs

Después de hacer deploy, revisa los logs de Render. Deberías ver:

```
📧 Inicializando transporter SMTP:
   Host: smtp.gmail.com
   Port: 465
   User: reforma.soft.co@gmail.com
   Secure: true
   Password length: 16 caracteres
```

### 3. Probar Registro

1. Intenta registrar un nuevo usuario
2. Revisa los logs de Render inmediatamente
3. Busca mensajes de error o éxito

## 🔧 Configuración Recomendada para Producción

### Opción A: Gmail con Puerto 465 (SSL)

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=reforma.soft.co@gmail.com
SMTP_PASSWORD=lwpcoinubvhpscy
FRONTEND_URL=https://tu-frontend.vercel.app
```

### Opción B: SendGrid (Mejor para Producción)

1. Crea cuenta en SendGrid
2. Genera API Key
3. Configura en Render:

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FRONTEND_URL=https://tu-frontend.vercel.app
```

## 📝 Checklist de Verificación

- [ ] Variables de entorno configuradas en Render
- [ ] `SMTP_HOST` = `smtp.gmail.com`
- [ ] `SMTP_PORT` = `465` (o `587`)
- [ ] `SMTP_SECURE` = `true` (para puerto 465) o `false` (para puerto 587)
- [ ] `SMTP_USER` = email completo de Gmail
- [ ] `SMTP_PASSWORD` = App Password sin espacios (16 caracteres)
- [ ] `FRONTEND_URL` = URL completa con `https://`
- [ ] App Password activo en Google Account
- [ ] Verificación en 2 pasos habilitada
- [ ] Servidor desplegado en Render (no local)
- [ ] Logs revisados después del deploy

## 🚨 Si Nada Funciona

1. **Genera un nuevo App Password** y actualiza `SMTP_PASSWORD`
2. **Prueba con puerto 465** y `SMTP_SECURE=true`
3. **Considera usar SendGrid** o Mailgun para producción
4. **Verifica que el servidor esté en Render**, no en desarrollo local
5. **Revisa los logs completos** de Render para más detalles

## 📞 Soporte Adicional

Si el problema persiste:
1. Revisa los logs completos de Render
2. Verifica la configuración de red/firewall
3. Considera usar un servicio de email profesional
4. Verifica que Gmail no haya bloqueado tu cuenta

