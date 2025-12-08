# Diagnóstico: App Web No Muestra Datos (Runtime)

## 🔍 Problema

La aplicación web está funcionando pero **no puede consultar los datos de la base de datos**, aunque antes funcionaba correctamente.

**Síntomas:**
- ✅ La aplicación se carga correctamente
- ✅ Puedes iniciar sesión
- ❌ No se muestran datos de granjas
- ❌ Las consultas a la API fallan o retornan vacías

## 📋 Pasos de Diagnóstico

### Paso 1: Verificar Health Check del Backend

1. Ve a la URL de tu backend en Render (ej: `https://reforma-2-0.onrender.com`)
2. Accede al endpoint `/health`:
   ```
   https://reforma-2-0.onrender.com/health
   ```
3. Verifica la respuesta:

**✅ Si responde `"status": "OK"` y `"database": { "status": "connected" }`:**
- El backend puede conectarse a la base de datos
- El problema puede estar en el frontend o en las consultas específicas
- Continúa con el Paso 2

**❌ Si responde `"status": "DEGRADED"` y `"database": { "status": "degraded" }`:**
- El backend **NO puede conectarse** a la base de datos
- Ve directamente al Paso 3

### Paso 2: Verificar Logs de Render

1. Ve a **Render Dashboard** → Tu servicio backend → **Logs**
2. Busca errores relacionados con:
   - `P1001` - No puede alcanzar el servidor de base de datos
   - `P1000` - Error de autenticación
   - `P1017` - El servidor cerró la conexión
   - Cualquier error relacionado con Prisma o PostgreSQL

**Ejemplos de errores a buscar:**
```
Error: P1001: Can't reach database server
PrismaClientKnownRequestError: Invalid prisma_1.default.usuario.findUnique() invocation
```

### Paso 3: Verificar Variables de Entorno en Render

1. Ve a **Render Dashboard** → Tu servicio backend → **Environment**
2. Verifica que estas variables estén configuradas:

**DATABASE_URL:**
```
postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require
```

**DIRECT_URL:**
```
postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require
```

**⚠️ IMPORTANTE:**
- Ambas URLs deben ser **idénticas** (correcto para Render IPv4)
- Ambas deben usar el **Session Pooler** (puerto 5432)
- Ambas deben incluir `?sslmode=require` al final
- Reemplaza `DataBase2025.` con tu contraseña real (sin espacios)

### Paso 4: Verificar Estado del Proyecto en Supabase

1. Ve a **https://supabase.com/dashboard**
2. Selecciona tu proyecto
3. Verifica que el estado sea **"Active"** (verde)
4. Si está pausado, haz clic en **"Restore"** y espera 1-2 minutos

### Paso 5: Verificar Network Restrictions en Supabase

1. En Supabase Dashboard, ve a **Settings** → **Database**
2. Busca la sección **"Network Restrictions"**
3. Verifica que diga: **"Your database can be accessed by all IP addresses"**
4. Si hay restricciones activas, elimínalas o permite todas las IPs (`0.0.0.0/0`)

### Paso 6: Probar Conexión Directa

Puedes probar la conexión desde tu máquina local:

```bash
# Instalar psql (si no lo tienes)
# Windows: descarga desde https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql-client

# Probar conexión con Session Pooler
psql "postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require"
```

Si la conexión funciona desde tu máquina pero no desde Render, el problema es específico de Render → Supabase.

## 🔧 Soluciones Comunes

### Solución 1: El Proyecto de Supabase Está Pausado

**Síntoma:** Health check retorna `"status": "DEGRADED"` con error `P1001`

**Solución:**
1. Ve a Supabase Dashboard
2. Si el proyecto está pausado, haz clic en **"Restore"**
3. Espera 1-2 minutos
4. Haz redeploy en Render (o simplemente espera a que se reconecte automáticamente)

### Solución 2: Variables de Entorno Incorrectas

**Síntoma:** Health check retorna error de autenticación o conexión

**Solución:**
1. Ve a Render Dashboard → Environment
2. Verifica que `DATABASE_URL` y `DIRECT_URL` estén correctamente configuradas
3. Asegúrate de que ambas URLs sean idénticas
4. Verifica que incluyan `?sslmode=require`
5. Guarda los cambios y haz redeploy

### Solución 3: Network Restrictions Bloqueando

**Síntoma:** Health check retorna `P1001` pero el proyecto está activo

**Solución:**
1. Ve a Supabase Dashboard → Settings → Database → Network Restrictions
2. Asegúrate de que permita todas las IPs (`0.0.0.0/0`)
3. Guarda los cambios
4. Espera 1-2 minutos
5. Haz redeploy en Render

### Solución 4: Problema con Session Pooler

**Síntoma:** Errores intermitentes o "prepared statement does not exist"

**Solución:** Usar Transaction Pooler temporalmente:

1. Ve a Supabase Dashboard → Settings → Database → Connection Pooling
2. Selecciona **"Transaction Pooler"** (puerto 6543)
3. Copia la URL completa
4. Reemplaza `[YOUR-PASSWORD]` con tu contraseña real
5. Agrega `?sslmode=require&pgbouncer=true` al final
6. En Render, actualiza **ambas** variables:
   - `DATABASE_URL`: [URL de Transaction Pooler]
   - `DIRECT_URL`: [MISMA URL de Transaction Pooler]
7. Haz redeploy

## 🔍 Verificación Adicional

### Verificar que el Backend Está Corriendo

1. Ve a Render Dashboard → Tu servicio backend
2. Verifica que el estado sea **"Live"** (verde)
3. Si está en estado de error, revisa los logs

### Verificar Logs en Tiempo Real

1. Ve a Render Dashboard → Tu servicio backend → **Logs**
2. Haz una petición desde la app web (intenta cargar datos de granjas)
3. Observa los logs en tiempo real para ver qué error aparece

### Probar Endpoint Específico

Puedes probar directamente un endpoint de la API:

```bash
# Ejemplo: Obtener granjas (necesitas un token JWT válido)
curl -H "Authorization: Bearer TU_TOKEN_JWT" \
  https://reforma-2-0.onrender.com/api/granjas
```

## 📝 Checklist de Verificación

Antes de reportar el problema, verifica:

- [ ] Health check del backend (`/health`) responde correctamente
- [ ] El proyecto de Supabase está **Active** (verde)
- [ ] Network Restrictions permiten todas las IPs
- [ ] `DATABASE_URL` está configurada correctamente en Render
- [ ] `DIRECT_URL` está configurada correctamente en Render
- [ ] Ambas URLs son idénticas (correcto para Render IPv4)
- [ ] Ambas URLs incluyen `?sslmode=require`
- [ ] El servicio backend está **Live** en Render
- [ ] Revisaste los logs de Render para errores específicos
- [ ] Esperaste 1-2 minutos después de cambiar configuraciones

## 🚨 Si el Problema Persiste

Si después de seguir todos los pasos el problema persiste:

1. **Comparte los logs de Render:**
   - Copia los últimos logs del servicio backend
   - Especialmente los que aparecen cuando intentas cargar datos

2. **Comparte la respuesta del health check:**
   - Accede a `https://tu-backend.onrender.com/health`
   - Copia la respuesta completa

3. **Verifica el estado del proyecto de Supabase:**
   - Captura una imagen del dashboard mostrando que está activo
   - Verifica que Network Restrictions estén configuradas correctamente

## 📚 Referencias

- [Supabase Network Restrictions Docs](https://supabase.com/docs/guides/platform/network-restrictions)
- [Prisma Connection Issues](https://www.prisma.io/docs/reference/api-reference/error-reference#p1001)
- [Render Troubleshooting](https://render.com/docs/troubleshooting-deploys)

