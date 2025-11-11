# 🔧 Corrección: Frontend en Puerto 3001

## ❌ Problema

- **Frontend corre en**: `http://localhost:3001`
- **Google Cloud Console configurado para**: `http://localhost:3000`
- **Error**: `redirect_uri_mismatch`

## ✅ Solución

Actualizar las URIs en Google Cloud Console para usar el puerto **3001** en lugar de 3000.

---

## 📝 Pasos para Corregir

### Paso 1: Actualizar en Google Cloud Console

1. **Ir a Google Cloud Console**:
   - https://console.cloud.google.com/apis/credentials

2. **Encontrar tu OAuth Client ID**:
   - Buscar: `REFORMA WEB`
   - Hacer clic en el nombre

3. **Editar las URIs**:

   #### Authorized JavaScript origins:
   ```
   http://localhost:3001
   ```
   
   **Cambiar de**: `http://localhost:3000`
   **A**: `http://localhost:3001`

   #### Authorized redirect URIs:
   ```
   http://localhost:3001
   ```
   
   **Cambiar de**: `http://localhost:3000`
   **A**: `http://localhost:3001`

4. **Guardar los cambios**:
   - Hacer clic en "SAVE"
   - Esperar 1-2 minutos para que se propaguen los cambios

---

## ✅ Configuración Correcta

Después de actualizar, tu OAuth Client ID debe tener:

```
Name: REFORMA WEB

Authorized JavaScript origins:
  http://localhost:3001

Authorized redirect URIs:
  http://localhost:3001
```

---

## 🔄 Después de Actualizar

1. **Esperar 1-2 minutos** (los cambios pueden tardar en propagarse)

2. **Limpiar caché del navegador**:
   - Ctrl + Shift + Delete
   - Seleccionar "Cookies y otros datos del sitio"
   - Borrar datos

3. **Cerrar y volver a abrir el navegador**

4. **Probar de nuevo**:
   - Ir a: `http://localhost:3001/login`
   - Hacer clic en "Continuar con Google"
   - Debería funcionar

---

## 🔍 Verificación

### Verificar que el frontend corre en 3001:

1. **Revisar la consola del servidor**:
   ```
   ▲ Next.js 14.x.x
   - Local:        http://localhost:3001
   ```

2. **Abrir en el navegador**:
   - `http://localhost:3001`
   - Debería cargar la aplicación

### Verificar en Google Cloud Console:

1. **Ir a**: https://console.cloud.google.com/apis/credentials
2. **Hacer clic en**: `REFORMA WEB`
3. **Verificar que dice**:
   - Authorized JavaScript origins: `http://localhost:3001`
   - Authorized redirect URIs: `http://localhost:3001`

---

## ⚠️ Si Quieres Usar Puerto 3000

Si prefieres usar el puerto 3000 en lugar de 3001:

### Opción 1: Cambiar el puerto del frontend

1. **Verificar en `package.json`**:
   ```json
   {
     "scripts": {
       "dev": "next dev -p 3000"
     }
   }
   ```

2. **O usar variable de entorno**:
   ```bash
   PORT=3000 npm run dev
   ```

### Opción 2: Mantener 3001

- Simplemente actualiza Google Cloud Console para usar 3001 (recomendado)

---

## 📋 Checklist

- [ ] Google Cloud Console actualizado a puerto 3001
- [ ] Authorized JavaScript origins: `http://localhost:3001`
- [ ] Authorized redirect URIs: `http://localhost:3001`
- [ ] Esperado 1-2 minutos después de guardar
- [ ] Caché del navegador limpiado
- [ ] Navegador cerrado y reabierto
- [ ] Probado en `http://localhost:3001/login`

---

**Última actualización**: Diciembre 2024

