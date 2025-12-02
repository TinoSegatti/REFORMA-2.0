# 🚀 Configuración de Variables de Entorno en Render

## ⚠️ Error Común: `Environment variable not found: DATABASE_URL`

Este error ocurre cuando Render intenta ejecutar `prisma migrate deploy` pero no encuentra la variable `DATABASE_URL`.

## 📋 Pasos para Configurar Variables de Entorno en Render

### 1. Acceder a la Configuración del Servicio

1. Ve a tu dashboard de Render: https://dashboard.render.com
2. Selecciona tu servicio backend
3. Ve a la sección **"Environment"** en el menú lateral

### 2. Configurar DATABASE_URL

Tienes dos opciones:

#### Opción A: Base de Datos PostgreSQL en Render (Recomendado)

1. En Render, crea un nuevo servicio **PostgreSQL Database**
2. Una vez creada, Render te proporcionará automáticamente:
   - **Internal Database URL** (para servicios en la misma cuenta)
   - **External Database URL** (para conexiones externas)

3. Copia la **Internal Database URL** y agrégala como variable de entorno:
   ```
   DATABASE_URL=postgresql://usuario:password@hostname:5432/database_name?sslmode=require
   ```

#### Opción B: Usar Supabase (Gratis)

1. Ve a https://supabase.com
2. Crea una cuenta gratuita (si no la tienes)
3. Crea un nuevo proyecto
4. Ve a **Settings** → **Database**
5. Selecciona la pestaña **"ORMs"** → **"Prisma"**

**⚠️ CRÍTICO: Configuración Correcta para Supabase con Prisma**

Para Supabase con Prisma, necesitas configurar **DOS variables** con URLs del **pooler** (NO la conexión directa):

**🔑 IMPORTANTE: Selecciona SESSION POOLER (NO Transaction Pooler)**

**¿Por qué Session Pooler?**
- ✅ **Render** es un servicio con servidores persistentes (no serverless)
- ✅ **Prisma** necesita mantener el estado de la sesión para prepared statements
- ✅ **Migraciones** de Prisma requieren Session Pooler
- ✅ Mejor rendimiento para aplicaciones backend tradicionales

**Transaction Pooler** es solo para aplicaciones serverless (Vercel Functions, Netlify Functions, etc.)

**DATABASE_URL** (para la aplicación, usa Session Pooler - puerto 5432):
```
postgresql://postgres.[TU_PROJECT]:[TU_PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

**DIRECT_URL** (para migraciones, usa el mismo Session Pooler - puerto 5432):
```
postgresql://postgres.[TU_PROJECT]:[TU_PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

**⚠️ IMPORTANTE:**
- **NO uses** la conexión directa `db.[PROJECT].supabase.co` para Prisma
- **USA** el pooler `aws-1-us-east-2.pooler.supabase.com` (o el pooler de tu región)
- **Selecciona SESSION POOLER** en Supabase Dashboard (no Transaction Pooler)
- El formato del usuario es `postgres.[PROJECT]` (con punto, no con @)
- **Session Pooler usa puerto 5432** (no 6543, ese es para Transaction Pooler)
- **NO agregues** `?pgbouncer=true` para Session Pooler (solo para Transaction Pooler)
- Ambas URLs (DATABASE_URL y DIRECT_URL) pueden usar el mismo puerto 5432 con Session Pooler

**⚠️ IMPORTANTE sobre contraseñas con caracteres especiales:**

Si tu contraseña contiene caracteres especiales (como `+`, `@`, `#`, etc.), debes codificarlos usando URL encoding:
- `+` → `%2B`
- `@` → `%40`
- `#` → `%23`
- `/` → `%2F`
- `:` → `%3A`
- `?` → `%3F`
- `&` → `%26`
- `=` → `%3D`

**Ejemplo con tu proyecto (Session Pooler):**
- **DATABASE_URL**: `postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025%2B@aws-1-us-east-2.pooler.supabase.com:5432/postgres`
- **DIRECT_URL**: `postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025%2B@aws-1-us-east-2.pooler.supabase.com:5432/postgres`

**Nota:** Ambas URLs son idénticas cuando usas Session Pooler, ya que el mismo pooler maneja tanto las conexiones de la aplicación como las migraciones.

**Nota:** Si tu proyecto está en otra región, el host del pooler será diferente (ej: `aws-0-[REGION].pooler.supabase.com`). Verifica en Supabase Dashboard → Settings → Database → Connection Pooling.

### 3. Agregar Variable en Render

1. En la sección **Environment** de tu servicio
2. Haz clic en **"Add Environment Variable"**
3. Nombre: `DATABASE_URL`
4. Valor: Pega tu connection string
5. Haz clic en **"Save Changes"**

### 4. Variables de Entorno Requeridas

Asegúrate de configurar todas estas variables en Render:

```env
# Base de Datos (OBLIGATORIA)
DATABASE_URL=postgresql://...

# JWT Secret (OBLIGATORIA)
JWT_SECRET=tu_secret_jwt_muy_seguro_y_largo

# Opcional: Direct URL (si usas Supabase con connection pooling)
DIRECT_URL=postgresql://...

# Frontend URL
FRONTEND_URL=https://tu-frontend.vercel.app

# Mercado Pago (si usas pagos)
MERCADOPAGO_ACCESS_TOKEN=tu_token
MERCADOPAGO_WEBHOOK_SECRET=tu_secret

# Twilio (si usas WhatsApp)
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_WHATSAPP_TO=whatsapp:+tu_numero

# OpenAI (si usas Corina)
OPENAI_API_KEY=tu_api_key

# Google OAuth (si usas login con Google)
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret
```

### 5. Reiniciar el Servicio

Después de agregar las variables:

1. Ve a la pestaña **"Events"** o **"Logs"**
2. Haz clic en **"Manual Deploy"** → **"Deploy latest commit"**
3. O simplemente espera a que Render detecte los cambios y redepliegue automáticamente

## 🔍 Verificar Configuración

Una vez configurado, verifica en los logs que:

1. ✅ `prisma generate` se ejecuta correctamente
2. ✅ `tsc` compila sin errores
3. ✅ `prisma migrate deploy` encuentra `DATABASE_URL` y aplica las migraciones
4. ✅ El servidor inicia correctamente

## ⚠️ Notas Importantes

1. **No compartas tus variables de entorno** públicamente
2. **Usa Internal Database URL** si tu base de datos está en Render (más seguro y rápido)
3. **Usa External Database URL** solo si necesitas conectar desde fuera de Render
4. **Reinicia el servicio** después de agregar/modificar variables de entorno
5. **Verifica los logs** si el deploy falla para ver qué variable falta

## 🆘 Troubleshooting

### Error: "Environment variable not found: DATABASE_URL"

**Solución:** Agrega `DATABASE_URL` en la sección Environment de Render

### Error: "Connection refused" o "Connection timeout"

**Solución:** 
- Verifica que la base de datos esté activa
- Si usas Supabase, asegúrate de usar la URL correcta
- Si usas Render PostgreSQL, verifica que esté en la misma cuenta

### Error: "SSL required" o "Can't reach database server"

**Solución:** 
1. **Agrega `?sslmode=require`** al final de tu `DATABASE_URL` y `DIRECT_URL`:
   ```
   DATABASE_URL=postgresql://...?sslmode=require
   DIRECT_URL=postgresql://...?sslmode=require
   ```

2. **Si tu contraseña tiene caracteres especiales**, codifícalos:
   - `+` → `%2B`
   - `@` → `%40`
   - `#` → `%23`
   - etc.

3. **Verifica que ambas variables estén configuradas** en Render:
   - `DATABASE_URL` (con `?sslmode=require`)
   - `DIRECT_URL` (con `?sslmode=require`)

4. **Verifica restricciones de IP en Supabase:**
   - Ve a Supabase Dashboard → Settings → Database
   - En "Connection Pooling" o "Network Restrictions", verifica si hay IPs bloqueadas
   - Render tiene IPs dinámicas, así que puede que necesites permitir todas las conexiones

### Error: "Can't reach database server" con Supabase

**Posibles causas y soluciones:**

1. **URL incorrecta para Prisma**: 
   - ❌ **NO uses** la conexión directa: `db.[PROJECT].supabase.co:5432`
   - ✅ **USA** el pooler de Supabase: `aws-1-us-east-2.pooler.supabase.com`
   - Para Prisma, siempre usa el pooler, no la conexión directa

2. **Formato incorrecto del usuario**:
   - ❌ **NO uses**: `postgres@db.[PROJECT].supabase.co`
   - ✅ **USA**: `postgres.[PROJECT]@aws-1-us-east-2.pooler.supabase.com`

3. **Puertos incorrectos**:
   - **DATABASE_URL**: Puerto `6543` con `?pgbouncer=true`
   - **DIRECT_URL**: Puerto `5432` (sin pgbouncer)

4. **Contraseña con caracteres especiales**: Codifica los caracteres especiales en la URL (`+` → `%2B`)

5. **Restricciones de red en Supabase**: 
   - Ve a Settings → Database → Network Restrictions
   - Asegúrate de que no haya restricciones que bloqueen a Render

6. **Proyecto pausado**: Verifica que el proyecto esté activo (no en pausa)

7. **Región incorrecta del pooler**: 
   - Verifica en Supabase Dashboard → Settings → Database → Connection Pooling
   - El host puede ser `aws-0-[REGION]` o `aws-1-[REGION]` dependiendo de tu región

## 📚 Referencias

- [Render Environment Variables](https://render.com/docs/environment-variables)
- [Render PostgreSQL](https://render.com/docs/databases)
- [Supabase Connection Strings](https://supabase.com/docs/guides/database/connecting-to-postgres)

