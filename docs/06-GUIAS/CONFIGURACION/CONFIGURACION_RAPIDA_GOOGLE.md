# ⚡ Configuración Rápida de Google OAuth

## 🎯 Problema

El botón "Continuar con Google" no aparece en la página de login/registro.

## ✅ Solución Rápida

### Paso 1: Obtener Google Client ID

1. **Ir a Google Cloud Console**: https://console.cloud.google.com/

2. **Crear o seleccionar proyecto**:
   - Si no tienes proyecto, crear uno nuevo
   - Nombre sugerido: "REFORMA"

3. **Habilitar API**:
   - Ir a "APIs & Services" > "Library"
   - Buscar "People API" o "Google+ API"
   - Hacer clic en "Enable"

4. **Configurar OAuth Consent Screen**:
   - Ir a "APIs & Services" > "OAuth consent screen"
   - Seleccionar "External" (para desarrollo)
   - Completar:
     - App name: `REFORMA`
     - User support email: `reforma.soft.co@gmail.com`
     - Developer contact: `reforma.soft.co@gmail.com`
   - Hacer clic en "Save and Continue"
   - En "Scopes", hacer clic en "Save and Continue"
   - En "Test users", agregar tu email: `reforma.soft.co@gmail.com`
   - Hacer clic en "Save and Continue"

5. **Crear OAuth Client ID**:
   - Ir a "APIs & Services" > "Credentials"
   - Hacer clic en "Create Credentials" > "OAuth client ID"
   - Seleccionar "Web application"
   - Configurar:
     - **Name**: `REFORMA Web Client`
     - **Authorized JavaScript origins**:
       - `http://localhost:3000`
     - **Authorized redirect URIs**:
       - `http://localhost:3000`
   - Hacer clic en "Create"
   - **Copiar el Client ID** (algo como: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)

### Paso 2: Configurar en Frontend

1. **Abrir el archivo**: `frontend/.env.local`

2. **Agregar la línea**:
   ```env
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu-client-id-aqui
   ```
   
   **Ejemplo**:
   ```env
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
   ```

3. **Reiniciar el servidor de desarrollo**:
   ```bash
   # Detener el servidor (Ctrl+C)
   # Luego iniciar de nuevo:
   cd frontend
   npm run dev
   ```

### Paso 3: Verificar

1. **Ir a**: `http://localhost:3000/login`
2. **Verificar que aparece**:
   - El divider "O continúa con"
   - El botón "Continuar con Google" con el logo de Google

## 🎉 ¡Listo!

Ahora el botón de Google debería aparecer y funcionar correctamente.

---

## 📝 Archivo `.env.local` Completo

Tu archivo `frontend/.env.local` debería verse así:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu-google-client-id-aqui
```

---

## 🐛 Si el botón sigue sin aparecer

1. **Verificar que el archivo se llama exactamente `.env.local`** (no `.env` ni `.env.local.example`)

2. **Verificar que la variable empieza con `NEXT_PUBLIC_`**:
   - ✅ Correcto: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - ❌ Incorrecto: `GOOGLE_CLIENT_ID`

3. **Reiniciar el servidor**:
   - Las variables de entorno en Next.js solo se cargan al iniciar el servidor
   - Debes detener y volver a iniciar `npm run dev`

4. **Verificar en la consola del navegador**:
   - Abrir DevTools (F12)
   - Ir a la pestaña "Console"
   - Buscar mensajes de error o advertencias

5. **Verificar que no hay espacios**:
   - ✅ `NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-...`
   - ❌ `NEXT_PUBLIC_GOOGLE_CLIENT_ID = 123456789-...` (con espacios)

---

## 🔒 Para Producción

Cuando despliegues a producción, necesitarás:

1. **Agregar el dominio de producción** en Google Cloud Console:
   - **Authorized JavaScript origins**: `https://tu-dominio.com`
   - **Authorized redirect URIs**: `https://tu-dominio.com`

2. **Configurar la variable en tu plataforma de hosting**:
   - Vercel: Settings > Environment Variables
   - Netlify: Site settings > Environment variables
   - O en el archivo `.env.production` si usas otro método

---

**Última actualización**: Diciembre 2024

