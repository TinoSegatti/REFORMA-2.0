# 🔗 URIs de Redirección para Google OAuth - REFORMA

## 📋 URIs Necesarias para Configurar OAuth Client ID

Cuando crees las credenciales OAuth 2.0 en Google Cloud Console, necesitas configurar las siguientes URIs:

---

## 🛠️ Para Desarrollo (Local)

### Authorized JavaScript origins
```
http://localhost:3000
```

**Nota**: Si usas otro puerto (por ejemplo, 3001), usa ese puerto en su lugar.

### Authorized redirect URIs
```
http://localhost:3000
```

**Importante**: 
- Para `@react-oauth/google`, la librería maneja la redirección automáticamente
- No necesitas una ruta específica como `/auth/callback`
- Solo necesitas la URL base de tu aplicación

---

## 🌐 Para Producción

### Authorized JavaScript origins
```
https://tu-dominio.com
https://www.tu-dominio.com
```

**Ejemplo**:
```
https://reforma.app
https://www.reforma.app
```

### Authorized redirect URIs
```
https://tu-dominio.com
https://www.tu-dominio.com
```

**Ejemplo**:
```
https://reforma.app
https://www.reforma.app
```

---

## 📝 Configuración Completa en Google Cloud Console

### Paso 1: Ir a Credentials
1. Ir a: https://console.cloud.google.com/apis/credentials
2. Hacer clic en "Create Credentials" > "OAuth client ID"

### Paso 2: Seleccionar Tipo
- **Application type**: `Web application`

### Paso 3: Configurar URIs

#### Para Desarrollo:
```
Name: REFORMA Web Client (Development)

Authorized JavaScript origins:
  http://localhost:3000

Authorized redirect URIs:
  http://localhost:3000
```

#### Para Producción:
```
Name: REFORMA Web Client (Production)

Authorized JavaScript origins:
  https://reforma.app
  https://www.reforma.app

Authorized redirect URIs:
  https://reforma.app
  https://www.reforma.app
```

---

## ⚠️ Importante

### 1. No incluir rutas específicas
❌ **Incorrecto**:
```
http://localhost:3000/auth/callback
http://localhost:3000/login/google/callback
```

✅ **Correcto**:
```
http://localhost:3000
```

### 2. Usar el mismo puerto que tu aplicación
- Si tu frontend corre en `http://localhost:3000`, usa ese puerto
- Si cambias el puerto, actualiza las URIs en Google Cloud Console

### 3. HTTPS en producción
- En producción, **SIEMPRE** usa `https://`
- Google no permite `http://` en producción (excepto localhost)

### 4. Agregar todas las variantes
- Si tienes `www` y sin `www`, agrega ambas
- Si tienes múltiples dominios, agrega todos

---

## 🔍 Cómo Verificar tu Puerto

### En Desarrollo:
1. Inicia tu servidor de desarrollo:
   ```bash
   cd frontend
   npm run dev
   ```

2. Revisa la consola, debería mostrar algo como:
   ```
   ▲ Next.js 14.x.x
   - Local:        http://localhost:3000
   ```

3. Usa ese puerto en las URIs

### En Producción:
- Usa el dominio donde está desplegada tu aplicación
- Ejemplo: `https://reforma.vercel.app` (si usas Vercel)

---

## 📋 Resumen Rápido

### Desarrollo (Localhost)
```
Authorized JavaScript origins:
  http://localhost:3000

Authorized redirect URIs:
  http://localhost:3000
```

### Producción (Ejemplo)
```
Authorized JavaScript origins:
  https://reforma.app
  https://www.reforma.app

Authorized redirect URIs:
  https://reforma.app
  https://www.reforma.app
```

---

## 🐛 Errores Comunes

### Error: "redirect_uri_mismatch"

**Causa**: La URI de redirección no coincide exactamente.

**Solución**:
1. Verificar que la URI en Google Cloud Console sea exactamente igual a la de tu aplicación
2. Verificar que no haya espacios o caracteres extra
3. Verificar que uses `http://` en desarrollo y `https://` en producción
4. Verificar que el puerto sea correcto

### Error: "origin_mismatch"

**Causa**: El origen JavaScript no está autorizado.

**Solución**:
1. Agregar la URL exacta en "Authorized JavaScript origins"
2. Incluir todas las variantes (con/sin www, con/sin puerto)

---

## ✅ Checklist

Antes de crear las credenciales OAuth, verifica:

- [ ] Conoces el puerto de tu aplicación en desarrollo (por defecto: 3000)
- [ ] Conoces el dominio de producción (si ya lo tienes)
- [ ] Tienes acceso a Google Cloud Console
- [ ] Has habilitado People API o Google+ API
- [ ] Has configurado OAuth Consent Screen

---

**Última actualización**: Diciembre 2024

