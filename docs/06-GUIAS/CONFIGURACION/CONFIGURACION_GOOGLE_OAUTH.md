# 🔐 Configuración de Google OAuth - REFORMA

## 📋 Resumen

Guía para configurar la autenticación con Google OAuth en REFORMA.

---

## 🚀 Pasos de Configuración

### 1. Crear Proyecto en Google Cloud Console

1. **Ir a Google Cloud Console**: https://console.cloud.google.com/
2. **Crear un nuevo proyecto** o seleccionar uno existente
3. **Habilitar Google+ API**:
   - Ir a "APIs & Services" > "Library"
   - Buscar "Google+ API" o "People API"
   - Hacer clic en "Enable"

### 2. Configurar OAuth Consent Screen

1. **Ir a "APIs & Services" > "OAuth consent screen"**
2. **Seleccionar tipo de aplicación**: External (para desarrollo) o Internal (para G Suite)
3. **Completar información**:
   - App name: REFORMA
   - User support email: Tu email
   - Developer contact information: Tu email
4. **Agregar scopes**:
   - `openid`
   - `email`
   - `profile`
5. **Agregar test users** (si es External):
   - Agregar emails de usuarios que pueden probar la app

### 3. Crear Credenciales OAuth 2.0

1. **Ir a "APIs & Services" > "Credentials"**
2. **Hacer clic en "Create Credentials" > "OAuth client ID"**
3. **Seleccionar tipo**: "Web application"
4. **Configurar**:
   - **Name**: REFORMA Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (desarrollo)
     - `https://tu-dominio.com` (producción)
   - **Authorized redirect URIs**:
     - `http://localhost:3000` (desarrollo)
     - `https://tu-dominio.com` (producción)
5. **Copiar el Client ID** generado

### 4. Configurar Variables de Entorno

#### Frontend (`.env.local` o `.env`)

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu-google-client-id-aqui
```

#### Backend (`.env`)

No se requieren variables adicionales para el backend en la implementación actual.
Si quieres verificar tokens de Google en el backend, necesitarías:

```env
GOOGLE_CLIENT_ID=tu-google-client-id-aqui
GOOGLE_CLIENT_SECRET=tu-google-client-secret-aqui
```

---

## 🔧 Implementación

### Backend

La implementación actual acepta la información del usuario desde el frontend después de la autenticación con Google. El flujo es:

1. Frontend autentica con Google
2. Frontend obtiene información del usuario
3. Frontend envía información al backend
4. Backend crea o encuentra el usuario
5. Backend genera token JWT

### Frontend

El frontend usa `@react-oauth/google` para manejar la autenticación:

1. Usuario hace clic en "Continuar con Google"
2. Se abre popup de Google
3. Usuario autoriza la aplicación
4. Frontend obtiene access token
5. Frontend obtiene información del usuario
6. Frontend envía información al backend
7. Backend retorna token JWT
8. Frontend guarda token y redirige

---

## 📝 Migración de Base de Datos

### Agregar campo `googleId` a la tabla `t_usuarios`

```sql
ALTER TABLE t_usuarios 
ADD COLUMN "googleId" TEXT UNIQUE;
```

O usando Prisma:

```bash
npx prisma db push
```

**Nota**: Si hay datos existentes, el campo `googleId` será `NULL` para usuarios existentes, lo cual es correcto.

---

## 🧪 Pruebas

### Probar Autenticación con Google

1. **Iniciar el servidor de desarrollo**:
   ```bash
   # Frontend
   cd frontend
   npm run dev

   # Backend
   cd backend
   npm run dev
   ```

2. **Ir a la página de login**: `http://localhost:3000/login`

3. **Hacer clic en "Continuar con Google"**

4. **Seleccionar cuenta de Google** (debe estar en la lista de test users si es External)

5. **Autorizar la aplicación**

6. **Verificar que se redirige a `/mis-plantas`**

### Verificar Usuario en Base de Datos

```sql
SELECT id, email, "googleId", "nombreUsuario", "apellidoUsuario" 
FROM t_usuarios 
WHERE "googleId" IS NOT NULL;
```

---

## 🔒 Seguridad

### Consideraciones

1. **Validación de Token (Opcional)**: 
   - En producción, puedes validar el ID token de Google en el backend
   - Usa `google-auth-library` para Node.js

2. **HTTPS en Producción**:
   - Google OAuth requiere HTTPS en producción
   - Usa un servicio como Vercel, Netlify, o tu propio servidor con SSL

3. **Dominios Autorizados**:
   - Asegúrate de agregar todos los dominios donde se usará la app
   - Incluye variantes con/sin `www`

---

## 🐛 Solución de Problemas

### Error: "redirect_uri_mismatch"

**Causa**: La URI de redirección no está autorizada en Google Cloud Console.

**Solución**:
1. Ir a Google Cloud Console > Credentials
2. Editar el OAuth client ID
3. Agregar la URI exacta en "Authorized redirect URIs"

### Error: "access_denied"

**Causa**: El usuario canceló la autorización o no está en la lista de test users.

**Solución**:
1. Si es External, agregar el email del usuario a test users
2. Si es Internal, verificar que el usuario pertenece al dominio

### Error: "NEXT_PUBLIC_GOOGLE_CLIENT_ID no está configurado"

**Causa**: La variable de entorno no está configurada.

**Solución**:
1. Crear archivo `.env.local` en `frontend/`
2. Agregar `NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu-client-id`
3. Reiniciar el servidor de desarrollo

### El botón de Google no aparece

**Causa**: La variable de entorno no está configurada o el provider no está cargado.

**Solución**:
1. Verificar que `NEXT_PUBLIC_GOOGLE_CLIENT_ID` está configurada
2. Verificar que el `GoogleOAuthProvider` está en el layout
3. Revisar la consola del navegador para errores

---

## 📚 Recursos

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [@react-oauth/google Documentation](https://www.npmjs.com/package/@react-oauth/google)
- [Google Cloud Console](https://console.cloud.google.com/)

---

## ✅ Checklist de Configuración

- [ ] Proyecto creado en Google Cloud Console
- [ ] Google+ API o People API habilitada
- [ ] OAuth consent screen configurado
- [ ] OAuth client ID creado
- [ ] JavaScript origins configurados
- [ ] Redirect URIs configurados
- [ ] Variable `NEXT_PUBLIC_GOOGLE_CLIENT_ID` configurada en frontend
- [ ] Migración de base de datos ejecutada (campo `googleId`)
- [ ] Pruebas realizadas con éxito

---

**Última actualización**: Diciembre 2024

