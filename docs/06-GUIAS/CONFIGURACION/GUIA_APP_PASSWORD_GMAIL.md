# Guía: Cómo Obtener y Configurar App Password de Gmail

Esta guía te ayudará a obtener y configurar correctamente un App Password de Gmail para el servicio de email de REFORMA.

## 🔐 ¿Qué es un App Password?

Un App Password es una contraseña de 16 caracteres que permite que aplicaciones externas accedan a tu cuenta de Gmail de forma segura, sin necesidad de compartir tu contraseña principal.

## 📋 Requisitos Previos

1. Tener una cuenta de Gmail
2. Tener acceso a tu cuenta de Google
3. Poder habilitar la verificación en 2 pasos

## 🚀 Pasos para Obtener App Password

### Paso 1: Habilitar Verificación en 2 Pasos

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. En el menú lateral, haz clic en **Seguridad**
3. Busca la sección **Cómo iniciar sesión en Google**
4. Haz clic en **Verificación en 2 pasos**
5. Sigue las instrucciones para habilitarla:
   - Ingresa tu contraseña de Google
   - Elige un método de verificación (teléfono, app de autenticación, etc.)
   - Completa el proceso de verificación

**⚠️ IMPORTANTE**: La verificación en 2 pasos DEBE estar habilitada para poder generar App Passwords.

### Paso 2: Generar App Password

1. Una vez habilitada la verificación en 2 pasos, vuelve a: https://myaccount.google.com/apppasswords
   
   O sigue estos pasos:
   - Ve a https://myaccount.google.com/
   - Haz clic en **Seguridad**
   - Busca **Verificación en 2 pasos** y haz clic
   - Desplázate hacia abajo y busca **Contraseñas de aplicaciones**
   - Haz clic en **Contraseñas de aplicaciones**

2. Si es la primera vez, Google te pedirá que ingreses tu contraseña nuevamente

3. En la sección **Seleccionar aplicación**:
   - Elige **Correo** del menú desplegable

4. En la sección **Seleccionar dispositivo**:
   - Elige **Otro (nombre personalizado)**
   - Escribe: `REFORMA Backend` o `REFORMA Production`

5. Haz clic en **Generar**

6. **Google mostrará una contraseña de 16 caracteres** con este formato:
   ```
   xxxx xxxx xxxx xxxx
   ```
   (4 grupos de 4 caracteres separados por espacios)

### Paso 3: Copiar el App Password

**⚠️ MUY IMPORTANTE**: 
- Copia el App Password **COMPLETO** (los 16 caracteres)
- **NO incluyas los espacios** al configurarlo en Render
- El formato debe ser: `xxxxxxxxxxxxxxxx` (16 caracteres sin espacios)

Ejemplo:
- ❌ **INCORRECTO**: `lwpy coin ubvh pscy` (con espacios)
- ✅ **CORRECTO**: `lwpcoinubvhpscy` (sin espacios)

## ⚙️ Configuración en Render

### Variables de Entorno Requeridas

En el dashboard de Render, configura estas variables:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=reforma.soft.co@gmail.com
SMTP_PASSWORD=lwpcoinubvhpscy  # App Password SIN ESPACIOS (16 caracteres)
```

### Formato Correcto del App Password

El App Password debe tener exactamente **16 caracteres sin espacios**.

Si Google te muestra: `lwpy coin ubvh pscy`
Debes configurar: `lwpcoinubvhpscy`

**Nota**: El sistema ahora elimina automáticamente los espacios del App Password, pero es mejor configurarlo correctamente desde el inicio.

## 🧪 Verificar la Configuración

### 1. Verificar Variables de Entorno

El sistema mostrará en los logs al iniciar:
```
📧 Inicializando transporter SMTP:
   Host: smtp.gmail.com
   Port: 587
   User: reforma.soft.co@gmail.com
   Secure: false
   Password length: 16 caracteres
```

### 2. Probar Registro de Usuario

1. Registra un nuevo usuario
2. Revisa los logs de Render para ver:
   ```
   📧 Intentando enviar email de verificación a usuario@ejemplo.com...
   ✅ Email de verificación enviado exitosamente
   ```

### 3. Verificar en Gmail

- Revisa la bandeja de entrada del email registrado
- Si no aparece, revisa la carpeta de spam
- Verifica que el remitente sea `reforma.soft.co@gmail.com`

## 🚨 Troubleshooting

### Error: "EAUTH" (Error de Autenticación)

**Causa**: App Password incorrecto o formato incorrecto.

**Solución**:
1. Verifica que el App Password tenga exactamente 16 caracteres (sin espacios)
2. Genera un nuevo App Password si es necesario
3. Asegúrate de que la verificación en 2 pasos esté habilitada
4. Verifica que `SMTP_USER` sea el email correcto

### Error: "ETIMEDOUT" o "ECONNECTION"

**Causa**: Problemas de conexión con el servidor SMTP.

**Solución**:
1. Verifica que `SMTP_HOST` sea exactamente `smtp.gmail.com`
2. Verifica que `SMTP_PORT` sea `587` (o `465` para SSL)
3. Verifica que el servidor tenga acceso a internet
4. Revisa los logs para más detalles

### El email no llega pero no hay error

**Causa**: El email puede estar en spam o hay un problema silencioso.

**Solución**:
1. Revisa la carpeta de spam del destinatario
2. Verifica los logs de Render para ver si hay errores
3. Intenta enviar un email de prueba manualmente
4. Verifica que `FRONTEND_URL` esté configurado correctamente

### El App Password tiene espacios

**Causa**: Google muestra el App Password con espacios para facilitar la lectura.

**Solución**:
- El sistema ahora elimina automáticamente los espacios
- Pero es mejor configurarlo sin espacios desde el inicio
- Formato correcto: `xxxxxxxxxxxxxxxx` (16 caracteres)

## 📝 Notas Importantes

1. **Seguridad**:
   - Nunca compartas tu App Password
   - Si sospechas que está comprometido, genera uno nuevo
   - Los App Passwords son específicos por aplicación

2. **Límites de Gmail**:
   - Cuentas gratuitas: 500 emails por día
   - Google Workspace: 2000 emails por día

3. **Rotación**:
   - Puedes generar múltiples App Passwords
   - Cada uno es independiente
   - Puedes revocar App Passwords individualmente

4. **Formato**:
   - El App Password siempre tiene 16 caracteres
   - Google lo muestra con espacios para facilitar la lectura
   - Debe configurarse sin espacios en las variables de entorno

## 🔗 Enlaces Útiles

- [App Passwords de Google](https://myaccount.google.com/apppasswords)
- [Verificación en 2 Pasos](https://myaccount.google.com/signinoptions/two-step-verification)
- [Seguridad de Google](https://myaccount.google.com/security)

## ✅ Checklist de Configuración

- [ ] Verificación en 2 pasos habilitada
- [ ] App Password generado (16 caracteres)
- [ ] App Password copiado sin espacios
- [ ] Variables de entorno configuradas en Render
- [ ] `SMTP_HOST` = `smtp.gmail.com`
- [ ] `SMTP_PORT` = `587`
- [ ] `SMTP_SECURE` = `false`
- [ ] `SMTP_USER` = email completo de Gmail
- [ ] `SMTP_PASSWORD` = App Password sin espacios
- [ ] Logs verificados al iniciar el servidor
- [ ] Email de prueba enviado y recibido




