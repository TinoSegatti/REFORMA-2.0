# 👤 Guía de Registro de Usuarios - REFORMA

## 📋 Opciones de Registro Disponibles

REFORMA ofrece **dos opciones** para que los usuarios se registren en el sistema:

---

## 🔵 Opción 1: Registro con Google (Recomendado)

### ✅ Ventajas
- **Rápido y seguro**: Solo un clic para registrarse
- **Sin contraseña**: No necesitas recordar otra contraseña
- **Verificación automática**: Google ya verifica tu email, no necesitas verificar manualmente
- **Acceso inmediato**: Puedes usar el sistema de inmediato

### 📝 Cómo funciona

1. **Hacer clic en "Continuar con Google"**
   - El botón está visible en la página de login/registro
   - Solo aparece si Google OAuth está configurado

2. **Seleccionar cuenta de Google**
   - Se abre una ventana de Google para seleccionar tu cuenta
   - Google solicita permisos (solo email y perfil básico)

3. **Registro automático**
   - El sistema crea tu cuenta automáticamente
   - Tu email se marca como verificado (`emailVerificado = true`)
   - Tu cuenta se activa inmediatamente (`activo = true`)

4. **Acceso inmediato**
   - Se genera un token JWT
   - Se redirige a `/mis-plantas`
   - Puedes usar el sistema de inmediato

### 🔒 Seguridad
- Google maneja toda la autenticación
- No almacenamos tu contraseña de Google
- Solo guardamos tu `googleId` para futuros logins

---

## 📧 Opción 2: Registro Tradicional (Email/Contraseña)

### ✅ Ventajas
- **Control total**: Tú eliges tu contraseña
- **Sin dependencia de Google**: Funciona sin cuenta de Google
- **Privacidad**: No compartes datos con Google

### 📝 Cómo funciona

#### Paso 1: Completar el Formulario

1. **Ir a la página de registro**
   - En `/login`, cambiar a la pestaña "Registrarse"

2. **Completar los campos**:
   - **Nombre**: Tu nombre
   - **Apellido**: Tu apellido
   - **Correo electrónico**: Tu email (debe ser válido)
   - **Contraseña**: Mínimo 6 caracteres (recomendado: 8+ con mayúsculas, minúsculas, números)

3. **Hacer clic en "Registrarse"**

#### Paso 2: Verificación de Email

1. **Mensaje de confirmación**
   - Verás: "Usuario registrado exitosamente. Por favor verifica tu email para activar tu cuenta."
   - El sistema te informa que se envió un email de verificación

2. **Revisar tu email**
   - Busca un email de **REFORMA** con asunto: "Verifica tu cuenta de REFORMA"
   - Revisa también la carpeta de **spam** si no lo encuentras
   - El email contiene un enlace de verificación válido por **24 horas**

3. **Hacer clic en "Verificar Email"**
   - El botón te lleva a `/verificar-email?token=...`
   - El sistema verifica tu token automáticamente

4. **Cuenta activada**
   - Tu email se marca como verificado (`emailVerificado = true`)
   - Tu cuenta se activa (`activo = true`)
   - Se genera un token JWT
   - Se redirige automáticamente a `/mis-plantas`

#### Paso 3: Iniciar Sesión

1. **Ir a `/login`**
2. **Ingresar email y contraseña**
3. **Hacer clic en "Iniciar Sesión"**
4. **Acceso al sistema**

### ⚠️ Si no recibes el email

Si no recibes el email de verificación:

1. **Revisar carpeta de spam**
   - Gmail a veces envía emails a spam
   - Marcar como "No es spam" si es necesario

2. **Reenviar email de verificación**
   - Ir a `/verificar-email?token=expired` (o cualquier token inválido)
   - Ingresar tu email
   - Hacer clic en "Reenviar Email de Verificación"
   - El sistema enviará un nuevo email

3. **Verificar configuración SMTP**
   - Si el problema persiste, contactar al administrador
   - El sistema puede mostrar: "El servicio de email no está configurado"

---

## 🔄 Comparación de Opciones

| Característica | Google OAuth | Email/Contraseña |
|---|---|---|
| **Velocidad** | ⚡ Instantáneo | ⏱️ Requiere verificación |
| **Verificación** | ✅ Automática | 📧 Manual (24 horas) |
| **Contraseña** | ❌ No necesaria | ✅ Requerida |
| **Dependencia** | Google | Ninguna |
| **Seguridad** | 🔒 Alta (Google) | 🔒 Alta (si usas contraseña fuerte) |
| **Privacidad** | Comparte con Google | Solo con REFORMA |

---

## 🎯 Recomendación

### Usa Google OAuth si:
- ✅ Tienes una cuenta de Google
- ✅ Quieres acceso rápido
- ✅ Prefieres no recordar otra contraseña
- ✅ Confías en Google para autenticación

### Usa Email/Contraseña si:
- ✅ No tienes cuenta de Google
- ✅ Prefieres control total sobre tu contraseña
- ✅ Quieres más privacidad (no compartir con Google)
- ✅ Tu organización no permite OAuth de terceros

---

## 🔐 Seguridad de Contraseñas

Si eliges el registro tradicional, sigue estas recomendaciones:

### ✅ Contraseña Segura
- Mínimo 8 caracteres
- Incluye mayúsculas y minúsculas
- Incluye números
- Incluye símbolos especiales (opcional pero recomendado)
- **Ejemplo**: `MiGranja2024!`

### ❌ Evitar
- Contraseñas comunes: `123456`, `password`, `admin`
- Información personal: tu nombre, fecha de nacimiento
- Palabras del diccionario solas
- Secuencias: `abcdef`, `qwerty`

---

## 🐛 Solución de Problemas

### Error: "Email ya registrado"

**Causa**: Ya existe un usuario con ese email.

**Solución**:
- Si tienes cuenta de Google, intenta iniciar sesión con Google
- Si olvidaste tu contraseña, usa "¿Olvidaste tu contraseña?" (próximamente)
- Contacta al administrador si necesitas recuperar tu cuenta

### Error: "Email no verificado"

**Causa**: Intentaste iniciar sesión sin verificar tu email.

**Solución**:
1. Revisa tu email y haz clic en el enlace de verificación
2. Si el token expiró, reenvía el email de verificación
3. Si no recibes el email, verifica que el email sea correcto

### Error: "Token inválido o expirado"

**Causa**: El token de verificación expiró (24 horas) o ya fue usado.

**Solución**:
1. Ir a `/verificar-email?token=expired`
2. Ingresar tu email
3. Hacer clic en "Reenviar Email de Verificación"
4. Revisar tu email y hacer clic en el nuevo enlace

### Error: "Servicio de email no configurado"

**Causa**: El servidor no tiene configurado el servicio de email.

**Solución**:
- Contacta al administrador
- Usa Google OAuth como alternativa
- El administrador debe configurar las variables SMTP en `backend/.env`

---

## 📊 Flujo Visual

### Registro con Google
```
Usuario → Clic "Continuar con Google" 
       → Selecciona cuenta Google 
       → Sistema crea cuenta (verificada)
       → Acceso inmediato ✅
```

### Registro Tradicional
```
Usuario → Completa formulario 
       → Sistema crea cuenta (no verificada)
       → Sistema envía email
       → Usuario hace clic en enlace
       → Sistema verifica y activa cuenta
       → Usuario inicia sesión
       → Acceso al sistema ✅
```

---

## ✅ Checklist de Registro

### Para Registro con Google
- [ ] Tener cuenta de Google
- [ ] Hacer clic en "Continuar con Google"
- [ ] Seleccionar cuenta
- [ ] Permitir permisos
- [ ] ¡Listo! Acceso inmediato

### Para Registro Tradicional
- [ ] Completar formulario (nombre, apellido, email, contraseña)
- [ ] Hacer clic en "Registrarse"
- [ ] Revisar email (y spam)
- [ ] Hacer clic en "Verificar Email"
- [ ] Ir a `/login`
- [ ] Iniciar sesión con email y contraseña
- [ ] ¡Listo! Acceso al sistema

---

## 🚀 Próximas Mejoras

- [ ] Recuperación de contraseña por email
- [ ] Cambio de contraseña desde el perfil
- [ ] Autenticación de dos factores (2FA)
- [ ] Recordar dispositivo (opción "Recordarme")
- [ ] Sesiones múltiples

---

**Última actualización**: Diciembre 2024

