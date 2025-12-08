# Configuración del Frontend en Vercel

## 🔍 Problema Común

El frontend se despliega correctamente pero **no puede obtener datos del backend**, mostrando errores de conexión o datos vacíos.

## 📋 Causa

El frontend usa la variable de entorno `NEXT_PUBLIC_API_URL` para conectarse al backend. Si esta variable no está configurada en Vercel, el frontend intentará conectarse a `http://localhost:3000` (el valor por defecto), lo cual falla en producción.

## ✅ Solución: Configurar NEXT_PUBLIC_API_URL en Vercel

### Paso 1: Obtener la URL del Backend

1. Ve a **Render Dashboard** → Tu servicio backend
2. Copia la URL del servicio (ej: `https://reforma-2-0.onrender.com`)
3. **IMPORTANTE:** Asegúrate de que el backend esté funcionando correctamente

### Paso 2: Configurar Variable de Entorno en Vercel

1. Ve a **Vercel Dashboard** → Tu proyecto frontend
2. Ve a **Settings** → **Environment Variables**
3. Agrega una nueva variable de entorno:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://reforma-2-0.onrender.com` (reemplaza con tu URL real)
   - **Environment:** Selecciona todas las opciones (Production, Preview, Development)
4. Haz clic en **Save**

### Paso 3: Redeploy del Frontend

1. Después de agregar la variable de entorno, ve a **Deployments**
2. Haz clic en los tres puntos (⋯) del último deployment
3. Selecciona **Redeploy**
4. O simplemente haz un nuevo commit y push (Vercel desplegará automáticamente)

## 🔍 Verificación

### Verificar que la Variable Está Configurada

1. En Vercel Dashboard → Settings → Environment Variables
2. Verifica que `NEXT_PUBLIC_API_URL` esté listada con el valor correcto

### Verificar que el Backend Está Funcionando

1. Accede a la URL del backend directamente:
   ```
   https://reforma-2-0.onrender.com/health
   ```
2. Deberías ver una respuesta JSON con el estado del backend:
   ```json
   {
     "status": "OK",
     "database": {
       "status": "connected"
     }
   }
   ```

### Verificar en el Navegador

1. Abre la aplicación frontend en el navegador
2. Abre las **Developer Tools** (F12)
3. Ve a la pestaña **Network**
4. Intenta cargar datos (ej: iniciar sesión o ver granjas)
5. Verifica que las peticiones se hagan a la URL correcta del backend:
   - ✅ Correcto: `https://reforma-2-0.onrender.com/api/...`
   - ❌ Incorrecto: `http://localhost:3000/api/...`

## 📝 Variables de Entorno Requeridas en Vercel

### Obligatorias

- **`NEXT_PUBLIC_API_URL`**: URL del backend en Render
  - Ejemplo: `https://reforma-2-0.onrender.com`
  - **IMPORTANTE:** No incluyas la barra final (`/`)

### Opcionales (si usas Google OAuth)

- **`NEXT_PUBLIC_GOOGLE_CLIENT_ID`**: Client ID de Google OAuth
  - Solo necesario si quieres habilitar login con Google

## ⚠️ Notas Importantes

1. **Prefijo `NEXT_PUBLIC_`:**
   - Las variables de entorno que empiezan con `NEXT_PUBLIC_` son expuestas al cliente (navegador)
   - Esto es necesario para que el frontend pueda hacer peticiones al backend
   - **NO** pongas información sensible en variables con este prefijo

2. **Sin Barra Final:**
   - La URL debe ser: `https://reforma-2-0.onrender.com`
   - **NO** debe ser: `https://reforma-2-0.onrender.com/`
   - El código del frontend agrega `/api/...` automáticamente

3. **HTTPS:**
   - Asegúrate de usar `https://` (no `http://`)
   - Render proporciona HTTPS automáticamente

4. **CORS:**
   - El backend debe tener CORS configurado para permitir peticiones desde el dominio de Vercel
   - Verifica que el backend tenga configurado `cors()` en Express

## 🔧 Troubleshooting

### El Frontend Sigue Intentando Conectarse a localhost

**Problema:** Las variables de entorno no se actualizaron después del deploy.

**Solución:**
1. Verifica que la variable esté configurada en Vercel Dashboard
2. Haz un **Redeploy** completo (no solo un nuevo commit)
3. Espera a que el build termine completamente

### Error de CORS

**Problema:** El backend rechaza las peticiones del frontend.

**Solución:**
1. Verifica que el backend tenga CORS configurado correctamente
2. Asegúrate de que el backend permita el origen del frontend de Vercel

### El Backend No Responde

**Problema:** El backend está caído o no puede conectarse a la base de datos.

**Solución:**
1. Verifica el estado del backend en Render Dashboard
2. Accede a `/health` del backend directamente
3. Revisa los logs del backend en Render

## 📚 Referencias

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

