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

**🔍 IMPORTANTE: ¿Cómo funciona la selección en Supabase Dashboard?**

**La selección de "Session Pooler" vs "Direct Connection" en Supabase Dashboard es SOLO para mostrar las URLs correctas. NO guarda ninguna configuración permanente.**

**Lo que realmente importa:**
- ✅ **Copiar las URLs correctas** del Session Pooler cuando las veas en Supabase Dashboard
- ✅ **Usar esas URLs en Render** (variables de entorno `DATABASE_URL` y `DIRECT_URL`)
- ✅ **Usar esas URLs en tu `.env` local** para desarrollo

**NO es necesario:**
- ❌ Que quede "marcada" la opción Session Pooler en Supabase Dashboard
- ❌ Que la opción permanezca seleccionada cuando vuelvas a entrar
- ❌ Configurar nada permanente en Supabase

**Pasos prácticos:**
1. Ve a Supabase Dashboard → Settings → Database → Connection Pooling
2. Selecciona **"Session pooler"** (solo para ver las URLs correctas)
3. Copia las URLs que aparecen (formato `postgres.[PROJECT]@aws-1-us-east-2.pooler.supabase.com:5432`)
4. Pega esas URLs en Render (variables `DATABASE_URL` y `DIRECT_URL`)
5. Pega esas URLs en tu `.env` local
6. **Listo.** No necesitas volver a Supabase Dashboard, las URLs funcionarán independientemente de qué opción esté seleccionada cuando vuelvas a entrar.

**¿Por qué vuelve a mostrar "Direct Connection"?**
- Es el comportamiento normal de Supabase Dashboard
- La interfaz siempre vuelve a mostrar "Direct Connection" por defecto
- Esto NO afecta tu configuración en Render ni en `.env`
- Las URLs que copiaste seguirán funcionando correctamente

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

**⚠️ ESTE ES EL ERROR MÁS COMÚN - Sigue estos pasos en orden:**

#### Paso 1: Verificar Restricciones de Red en Supabase (MÁS IMPORTANTE)

**Render tiene IPs dinámicas que cambian frecuentemente. Supabase puede estar bloqueando estas conexiones.**

1. Ve a **Supabase Dashboard** → Tu proyecto
2. Ve a **Settings** → **Database**
3. Busca la sección **"Network Restrictions"** o **"Connection Pooling"**
4. **Verifica si hay restricciones activas:**
   - Si hay una lista de IPs permitidas, Render NO estará en esa lista
   - Si hay restricciones de red activas, estas bloquean conexiones externas

5. **Solución temporal para testing:**
   - **Deshabilita temporalmente las restricciones de red** o
   - **Permite todas las conexiones** (0.0.0.0/0) temporalmente
   - **⚠️ ADVERTENCIA:** Esto reduce la seguridad, pero es necesario para que Render se conecte

6. **Solución permanente (recomendada):**
   - En Supabase, busca la opción **"Allow all IP addresses"** o **"Disable network restrictions"**
   - O agrega el rango de IPs de Render (pero esto es complicado porque cambian frecuentemente)
   - **Para producción**, considera usar una IP estática o un servicio de base de datos en Render

#### Paso 2: Verificar que el Proyecto esté Activo

1. Ve a **Supabase Dashboard** → Tu proyecto
2. Verifica que el estado del proyecto sea **"Active"** (verde)
3. Si está **"Paused"**, haz clic en **"Resume"** para reactivarlo

#### Paso 3: Verificar la URL del Pooler

1. Ve a **Settings** → **Database** → **Connection Pooling**
2. Selecciona **"Session Pooler"**
3. Verifica que la URL que copiaste coincida exactamente con la que muestra Supabase
4. **Asegúrate de que el formato sea:**
   ```
   postgresql://postgres.[TU_PROJECT]:[TU_PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres
   ```

#### Paso 4: Verificar Contraseña Codificada

Si tu contraseña tiene caracteres especiales (como `+`), asegúrate de codificarlos:
- `+` → `%2B`
- `@` → `%40`
- `#` → `%23`
- etc.

#### Paso 5: Probar Conexión desde tu Máquina Local

Para verificar que la URL funciona:

1. Prueba conectarte desde tu máquina local usando la misma URL
2. Si funciona localmente pero no en Render, el problema es definitivamente las **restricciones de red**

#### Resumen de Causas Comunes:

1. ✅ **Restricciones de red en Supabase** (90% de los casos) - **DESHABILITA temporalmente**
2. ✅ **Proyecto pausado** - Reactívalo
3. ✅ **URL incorrecta** - Verifica en Supabase Dashboard
4. ✅ **Contraseña mal codificada** - Codifica caracteres especiales
5. ✅ **Región incorrecta** - Verifica que el pooler sea de tu región

## 📚 Referencias

- [Render Environment Variables](https://render.com/docs/environment-variables)
- [Render PostgreSQL](https://render.com/docs/databases)
- [Supabase Connection Strings](https://supabase.com/docs/guides/database/connecting-to-postgres)

