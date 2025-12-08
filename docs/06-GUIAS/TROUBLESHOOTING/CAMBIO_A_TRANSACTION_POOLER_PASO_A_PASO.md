# Cambio a Transaction Pooler - Paso a Paso

## 🚨 Problema Actual

Session Pooler (puerto 5432) **NO funciona** desde Render hacia Supabase. Esto causa:
- ❌ Build falla durante migraciones (P1001)
- ❌ Backend no puede conectarse a la base de datos
- ❌ Login retorna error 500

## ✅ Solución: Cambiar a Transaction Pooler

**IMPORTANTE:** Este cambio SOLO requiere actualizar 2 variables de entorno en Render. No afecta tu código ni tu base de datos.

---

## 📋 PASO A PASO COMPLETO

### Paso 1: Obtener URL de Transaction Pooler desde Supabase

1. Ve a **https://supabase.com/dashboard**
2. Selecciona tu proyecto
3. Ve a **Settings** (⚙️) → **Database** → **Connection Pooling**
4. Selecciona la pestaña **"Transaction Pooler"** (puerto 6543)
5. Copia la **Connection String** que aparece
   - Formato: `postgresql://postgres.[PROJECT]:[YOUR-PASSWORD]@aws-1-us-east-2.pooler.supabase.com:6543/postgres`

### Paso 2: Preparar la URL Completa

**URL actual (Session Pooler - NO funciona):**
```
postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require
```

**URL nueva (Transaction Pooler - SÍ funciona):**
```
postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

**Cambios necesarios:**
1. Cambiar puerto de `5432` → `6543`
2. Agregar `&pgbouncer=true` al final

### Paso 3: Actualizar Variables en Render

1. Ve a **https://dashboard.render.com**
2. Selecciona tu servicio backend (`reforma-2-0`)
3. Ve a la pestaña **"Environment"**
4. Busca las siguientes variables:

#### Variable 1: `DATABASE_URL`
- **Valor actual:**
  ```
  postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require
  ```
- **Valor nuevo:**
  ```
  postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
  ```
- Haz clic en **"Save Changes"**

#### Variable 2: `DIRECT_URL`
- **Valor actual:**
  ```
  postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require
  ```
- **Valor nuevo:** (DEBE SER IDÉNTICO a DATABASE_URL)
  ```
  postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
  ```
- Haz clic en **"Save Changes"**

### Paso 4: Verificar que los Cambios se Guardaron

1. En la página de Environment, verifica que:
   - ✅ `DATABASE_URL` tiene puerto `6543`
   - ✅ `DIRECT_URL` tiene puerto `6543`
   - ✅ Ambas URLs terminan con `&pgbouncer=true`
   - ✅ Ambas URLs son **idénticas**

### Paso 5: Hacer Redeploy

1. Ve a la pestaña **"Deployments"**
2. Haz clic en **"Manual Deploy"** → **"Deploy latest commit"**
3. Espera a que termine el build (2-3 minutos)

### Paso 6: Verificar que Funciona

1. **Verificar Build:**
   - Ve a **Logs** en Render
   - Busca: `✅ Migraciones aplicadas correctamente`
   - Si aparece, el build fue exitoso ✅

2. **Verificar Runtime:**
   - Accede a: `https://reforma-2-0.onrender.com/health`
   - Deberías ver:
     ```json
     {
       "status": "OK",
       "database": {
         "status": "connected"
       }
     }
     ```

3. **Verificar Login:**
   - Intenta hacer login desde el frontend
   - Debería funcionar correctamente ✅

---

## ⚠️ IMPORTANTE: Por Qué Este Cambio es Necesario

### Session Pooler (puerto 5432) - NO FUNCIONA
- ❌ No puede conectarse desde Render hacia Supabase
- ❌ Causa errores P1001 constantemente
- ❌ El build falla durante las migraciones

### Transaction Pooler (puerto 6543) - SÍ FUNCIONA
- ✅ Compatible con IPv4 (Render usa IPv4)
- ✅ Funciona mejor para conexiones desde servidores remotos
- ✅ El código ya está preparado para usarlo
- ✅ Requiere `pgbouncer=true` (ya está configurado automáticamente)

---

## 🔍 Si Después del Cambio Sigue Fallando

### Verificar que las URLs Están Correctas

1. En Render Dashboard → Environment
2. Verifica que:
   - Ambas URLs usan puerto **6543** (no 5432)
   - Ambas URLs incluyen `&pgbouncer=true`
   - No hay espacios extra o caracteres raros

### Verificar Proyecto de Supabase

1. Ve a Supabase Dashboard
2. Verifica que el proyecto esté **"Active"** (verde)
3. Si está pausado, haz clic en **"Restore"**

### Verificar Network Restrictions

1. Supabase Dashboard → Settings → Database → Network Restrictions
2. Debe decir: **"Your database can be accessed by all IP addresses"**
3. Si hay restricciones, elimínalas temporalmente

---

## ✅ Resultado Esperado

Después de hacer estos cambios:

- ✅ El build en Render se completa exitosamente
- ✅ Las migraciones se aplican sin errores
- ✅ El backend puede conectarse a la base de datos
- ✅ El health check retorna `"status": "OK"`
- ✅ El login funciona correctamente
- ✅ Puedes visualizar todos los datos de la base de datos

---

## 📝 Resumen de Cambios

**Solo necesitas cambiar 2 cosas en las URLs:**

1. **Puerto:** `5432` → `6543`
2. **Agregar al final:** `&pgbouncer=true`

**Ejemplo:**

**ANTES (no funciona):**
```
postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require
```

**DESPUÉS (funciona):**
```
postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

---

## 🆘 ¿Necesitas Ayuda?

Si después de hacer estos cambios sigue fallando:

1. Comparte los logs del build de Render
2. Comparte la respuesta del `/health` endpoint
3. Verifica que copiaste las URLs exactamente como se muestra arriba

