# 🔧 Solución: Error redirect_uri_mismatch

## ❌ Error

```
Error 400: redirect_uri_mismatch
Acceso bloqueado: La solicitud de REFORMA.SOFT.CO no es válida
```

## 🔍 Causa

La URI de redirección configurada en Google Cloud Console **no coincide** con la que está usando la aplicación.

---

## ✅ Solución Paso a Paso

### Paso 1: Verificar la URI Actual

La aplicación está usando:
- **Desarrollo**: `http://localhost:3000`
- **OAuth flow**: La librería `@react-oauth/google` maneja la redirección automáticamente

### Paso 2: Configurar en Google Cloud Console

1. **Ir a Google Cloud Console**:
   - https://console.cloud.google.com/apis/credentials

2. **Encontrar tu OAuth Client ID**:
   - Buscar: `73374649839-ln7n2pivh0q5ahj5i9aal56hod2htie6.apps.googleusercontent.com`
   - Hacer clic en el nombre del cliente OAuth

3. **Editar las URIs**:

   #### Authorized JavaScript origins:
   ```
   http://localhost:3000
   ```
   
   **Importante**: 
   - NO incluir `https://`
   - NO incluir rutas como `/auth/callback`
   - Solo la URL base: `http://localhost:3000`

   #### Authorized redirect URIs:
   ```
   http://localhost:3000
   ```
   
   **Importante**: 
   - Debe ser exactamente igual a "Authorized JavaScript origins"
   - NO incluir rutas adicionales
   - Solo la URL base

4. **Guardar los cambios**:
   - Hacer clic en "SAVE"
   - Esperar unos segundos para que se propaguen los cambios

### Paso 3: Verificar que NO hay otras URIs

Asegúrate de que **NO** tengas configuradas:
- ❌ `https://reforma.soft.co`
- ❌ `http://reforma.soft.co`
- ❌ `http://localhost:3000/auth/callback`
- ❌ Cualquier otra URI que no sea `http://localhost:3000`

**Solo debe estar**: `http://localhost:3000`

### Paso 4: Limpiar Caché del Navegador

1. **Abrir DevTools** (F12)
2. **Ir a la pestaña "Application"** (o "Aplicación")
3. **En "Storage"**, hacer clic en "Clear site data"
4. **Cerrar y volver a abrir el navegador**

O simplemente:
- **Ctrl + Shift + Delete**
- Seleccionar "Cookies y otros datos del sitio"
- Hacer clic en "Borrar datos"

### Paso 5: Probar de Nuevo

1. **Reiniciar el servidor de desarrollo**:
   ```bash
   # Detener (Ctrl+C)
   # Iniciar de nuevo
   cd frontend
   npm run dev
   ```

2. **Ir a**: `http://localhost:3000/login`

3. **Hacer clic en "Continuar con Google"**

4. **Verificar que funciona**

---

## 🔍 Verificación Detallada

### En Google Cloud Console, verifica:

1. **OAuth Client ID correcto**:
   - `73374649839-ln7n2pivh0q5ahj5i9aal56hod2htie6.apps.googleusercontent.com`

2. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   ```
   - ✅ Debe empezar con `http://` (no `https://`)
   - ✅ Debe ser `localhost:3000` (no `127.0.0.1:3000`)
   - ✅ NO debe tener rutas adicionales

3. **Authorized redirect URIs**:
   ```
   http://localhost:3000
   ```
   - ✅ Debe ser exactamente igual a JavaScript origins
   - ✅ NO debe tener rutas adicionales

---

## 🐛 Si el Error Persiste

### Opción 1: Verificar el Puerto

Si tu aplicación corre en otro puerto (por ejemplo, 3001):

1. **Verificar en la consola del servidor**:
   ```
   ▲ Next.js 14.x.x
   - Local:        http://localhost:3001
   ```

2. **Actualizar las URIs en Google Cloud Console**:
   ```
   http://localhost:3001
   ```

### Opción 2: Verificar Variables de Entorno

1. **Verificar que `.env.local` tiene el Client ID correcto**:
   ```env
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=73374649839-ln7n2pivh0q5ahj5i9aal56hod2htie6.apps.googleusercontent.com
   ```

2. **Reiniciar el servidor** después de cualquier cambio

### Opción 3: Crear un Nuevo OAuth Client ID

Si nada funciona:

1. **Crear un nuevo OAuth Client ID** en Google Cloud Console
2. **Configurar solo**:
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000`
3. **Copiar el nuevo Client ID**
4. **Actualizar** `frontend/.env.local`
5. **Reiniciar el servidor**

---

## 📋 Checklist de Verificación

- [ ] Authorized JavaScript origins: `http://localhost:3000` (exactamente así)
- [ ] Authorized redirect URIs: `http://localhost:3000` (exactamente así)
- [ ] NO hay otras URIs configuradas
- [ ] Caché del navegador limpiado
- [ ] Servidor de desarrollo reiniciado
- [ ] Client ID correcto en `.env.local`
- [ ] Email agregado como test user en OAuth Consent Screen

---

## ⚠️ Errores Comunes

### Error 1: URI con HTTPS
```
❌ https://localhost:3000
✅ http://localhost:3000
```

### Error 2: URI con Ruta
```
❌ http://localhost:3000/auth/callback
✅ http://localhost:3000
```

### Error 3: URI con Puerto Incorrecto
```
❌ http://localhost:3001 (si tu app corre en 3000)
✅ http://localhost:3000
```

### Error 4: URI con IP
```
❌ http://127.0.0.1:3000
✅ http://localhost:3000
```

---

## ✅ Configuración Correcta Final

En Google Cloud Console, tu OAuth Client ID debe tener:

```
Name: REFORMA Web Client

Authorized JavaScript origins:
  http://localhost:3000

Authorized redirect URIs:
  http://localhost:3000
```

**Solo esas dos líneas, nada más.**

---

**Última actualización**: Diciembre 2024

