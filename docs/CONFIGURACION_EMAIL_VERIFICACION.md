# 📧 Configuración de Verificación de Email - REFORMA

## 📋 Resumen

Guía para configurar el servicio de email para verificación de cuentas en REFORMA.

---

## 🔧 Variables de Entorno Requeridas

### Backend (`.env`)

```env
# Configuración SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=tu-contraseña-de-aplicacion

# URL del Frontend (para enlaces de verificación)
FRONTEND_URL=http://localhost:3000
```

### Frontend (`.env.local`)

```env
# URL del Backend
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## 📧 Configuración por Proveedor de Email

### Gmail

1. **Habilitar "Contraseñas de aplicaciones"**:
   - Ir a https://myaccount.google.com/
   - Seguridad > Verificación en 2 pasos (debe estar activada)
   - Contraseñas de aplicaciones
   - Generar nueva contraseña para "Correo"
   - Copiar la contraseña generada

2. **Configurar variables**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=tu-email@gmail.com
   SMTP_PASSWORD=la-contraseña-de-aplicacion-generada
   ```

### Outlook/Hotmail

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@outlook.com
SMTP_PASSWORD=tu-contraseña
```

### Yahoo

```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@yahoo.com
SMTP_PASSWORD=tu-contraseña-de-aplicacion
```

### Servidor SMTP Personalizado

```env
SMTP_HOST=mail.tu-dominio.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@tu-dominio.com
SMTP_PASSWORD=tu-contraseña
```

---

## 🔐 Seguridad

### Contraseñas de Aplicación

**IMPORTANTE**: Para Gmail y otros proveedores, NO uses tu contraseña normal. Usa "Contraseñas de aplicaciones" o "App Passwords" que son específicas para aplicaciones.

### Variables de Entorno

- **NUNCA** commitees el archivo `.env` al repositorio
- Usa `.env.example` para documentar las variables necesarias
- En producción, usa variables de entorno del servidor o servicios como Vercel, Railway, etc.

---

## 🧪 Pruebas

### Probar Envío de Email

1. **Configurar variables de entorno** en `backend/.env`
2. **Iniciar el servidor**:
   ```bash
   cd backend
   npm run dev
   ```
3. **Registrar un nuevo usuario** desde el frontend
4. **Verificar** que recibes el email de verificación
5. **Hacer clic en el enlace** para verificar la cuenta

### Verificar Configuración

El servicio de email verifica automáticamente si está configurado. Si no está configurado:
- El registro funcionará pero no se enviará email
- Se mostrará un mensaje de advertencia en la consola
- El usuario verá un mensaje indicando que debe contactar al administrador

---

## 📝 Flujo de Verificación

1. **Usuario se registra** con email y contraseña
2. **Sistema genera token** de verificación (válido por 24 horas)
3. **Sistema envía email** con enlace de verificación
4. **Usuario hace clic** en el enlace
5. **Sistema verifica token** y activa la cuenta
6. **Sistema genera JWT** y redirige al usuario

### Si el token expira:

- El usuario puede solicitar un nuevo email de verificación
- Se genera un nuevo token válido por 24 horas

---

## 🐛 Solución de Problemas

### Error: "Servicio de email no configurado"

**Causa**: Las variables SMTP no están configuradas.

**Solución**:
1. Verificar que todas las variables SMTP estén en `backend/.env`
2. Reiniciar el servidor backend
3. Verificar que las variables se carguen correctamente

### Error: "Authentication failed"

**Causa**: Credenciales SMTP incorrectas.

**Solución**:
1. Verificar `SMTP_USER` y `SMTP_PASSWORD`
2. Para Gmail, usar "Contraseña de aplicación" no la contraseña normal
3. Verificar que la verificación en 2 pasos esté activada (Gmail)

### Error: "Connection timeout"

**Causa**: Puerto o host SMTP incorrectos.

**Solución**:
1. Verificar `SMTP_HOST` y `SMTP_PORT`
2. Verificar que el firewall permita conexiones SMTP
3. Probar con `SMTP_SECURE=true` y puerto 465

### El email no llega

**Causa**: Puede estar en spam o el servicio no está configurado.

**Solución**:
1. Revisar carpeta de spam
2. Verificar logs del servidor para errores
3. Verificar que el servicio de email esté configurado correctamente
4. Probar con un servicio de email diferente

---

## 📊 Monitoreo

### Logs del Servidor

El servicio de email registra:
- ✅ Emails enviados exitosamente
- ❌ Errores al enviar emails
- ⚠️ Advertencias de configuración

### Verificar en Base de Datos

```sql
-- Ver usuarios no verificados
SELECT email, "emailVerificado", "fechaRegistro", "fechaExpiracionToken"
FROM t_usuarios
WHERE "emailVerificado" = false;

-- Ver tokens activos
SELECT email, "tokenVerificacion", "fechaExpiracionToken"
FROM t_usuarios
WHERE "tokenVerificacion" IS NOT NULL;
```

---

## 🔄 Reenviar Email de Verificación

Los usuarios pueden reenviar el email de verificación:

1. **Desde la página de login**: Si intentan iniciar sesión sin verificar
2. **Desde la página de verificación**: Si el token expiró
3. **Endpoint**: `POST /api/usuarios/reenviar-verificacion`

---

## ✅ Checklist de Configuración

- [ ] Variables SMTP configuradas en `backend/.env`
- [ ] `FRONTEND_URL` configurado correctamente
- [ ] Contraseña de aplicación generada (si es Gmail)
- [ ] Servidor backend reiniciado
- [ ] Prueba de registro realizada
- [ ] Email recibido correctamente
- [ ] Enlace de verificación funciona
- [ ] Usuario puede iniciar sesión después de verificar

---

## 📚 Recursos

- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [SMTP Configuration Guide](https://nodemailer.com/smtp/)

---

**Última actualización**: Diciembre 2024

