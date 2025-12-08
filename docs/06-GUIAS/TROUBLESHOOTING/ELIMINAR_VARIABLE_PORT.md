# ⚠️ IMPORTANTE: Eliminar Variable PORT

## 🚨 Problema Detectado

Tienes una variable de entorno llamada **`PORT`** con valor **`6543`** en Render. **Esta variable NO debe existir.**

### Por Qué Es Incorrecto

- `PORT` es una variable reservada que Render usa para el puerto del servidor web (normalmente 10000)
- El puerto de la base de datos (6543) debe estar **dentro de las URLs de conexión**, no como variable separada
- Tener `PORT=6543` puede causar que Render intente iniciar el servidor en el puerto incorrecto

## ✅ Solución: Eliminar la Variable PORT

### Paso 1: Ir a Render Dashboard

1. Ve a **https://dashboard.render.com**
2. Selecciona tu servicio backend (`reforma-2-0`)
3. Ve a la pestaña **"Environment"**

### Paso 2: Buscar y Eliminar PORT

1. Busca la variable **`PORT`** en la lista
2. Si existe y tiene valor `6543` (o cualquier otro valor), **ELIMÍNALA**
3. Haz clic en el ícono de basura o el botón "Delete" junto a esa variable
4. **Guarda los cambios**

### Paso 3: Verificar Variables Correctas

Asegúrate de que **SOLO** tengas estas variables relacionadas con la base de datos:

- ✅ `DATABASE_URL` - Debe usar puerto 6543 y tener `&pgbouncer=true`
- ✅ `DIRECT_URL` - Debe ser idéntica a DATABASE_URL
- ❌ `PORT` - **NO DEBE EXISTIR**

### Paso 4: Redeploy

1. Después de eliminar `PORT`, ve a **"Deployments"**
2. Haz clic en **"Manual Deploy"** → **"Deploy latest commit"**

## 📋 Variables Correctas para Transaction Pooler

**DATABASE_URL:**
```
postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

**DIRECT_URL:** (idéntica)
```
postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

**NO debe haber ninguna variable `PORT`**

## 🔍 Verificación

Después de eliminar `PORT` y hacer redeploy, verifica en los logs:

1. El build debería completarse
2. Las migraciones deberían aplicarse (puede tardar hasta 90 segundos)
3. El servidor debería iniciar correctamente

## ⚠️ Si el Timeout Persiste

Si después de eliminar `PORT` y aumentar el timeout sigue fallando:

1. **Omitir migraciones temporalmente:**
   - Agrega `SKIP_MIGRATIONS=true` en Render Environment
   - Haz redeploy
   - El build se completará sin ejecutar migraciones

2. **Aplicar migraciones manualmente:**
   - Ve a Supabase Dashboard → SQL Editor
   - Ejecuta las migraciones pendientes manualmente

3. **Verificar conexión:**
   - Accede a `https://reforma-2-0.onrender.com/health`
   - Debería retornar `"status": "OK"` si la conexión funciona

