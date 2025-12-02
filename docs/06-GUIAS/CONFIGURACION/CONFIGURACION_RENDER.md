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

**DIRECT_URL** (para migraciones, **USA Session Pooler también** porque Render usa IPv4):
```
postgresql://postgres.[TU_PROJECT]:[TU_PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require
```

**⚠️ CRÍTICO - Problema de IPv4/IPv6:**

- **Render usa IPv4**, pero la conexión directa de Supabase (`db.[PROJECT].supabase.co`) **solo funciona con IPv6**
- Por eso debes usar el **Session Pooler también para DIRECT_URL** (es compatible con IPv4)
- El Session Pooler de Supabase está configurado para funcionar con IPv4

**⚠️ CRÍTICO - Configuración para Render (IPv4):**

- **DATABASE_URL**: Usa el **Session Pooler** (`aws-1-us-east-2.pooler.supabase.com`) para la aplicación
- **DIRECT_URL**: **TAMBIÉN usa el Session Pooler** (`aws-1-us-east-2.pooler.supabase.com`) porque Render usa IPv4
- Ambas URLs usan el mismo formato: `postgres.[PROJECT]@pooler.supabase.com:5432`
- Ambas URLs deben incluir `?sslmode=require`

**⚠️ IMPORTANTE PARA RENDER (IPv4):**
- **DATABASE_URL**: Session Pooler (`aws-1-us-east-2.pooler.supabase.com`)
- **DIRECT_URL**: **TAMBIÉN Session Pooler** (`aws-1-us-east-2.pooler.supabase.com`) - NO uses conexión directa
- **Selecciona SESSION POOLER** en Supabase Dashboard para obtener la URL correcta
- **Session Pooler usa puerto 5432** (no 6543, ese es para Transaction Pooler)
- **NO agregues** `?pgbouncer=true` para Session Pooler (solo para Transaction Pooler)
- **Ambas URLs deben incluir** `?sslmode=require`

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

**Ejemplo con tu proyecto (Render con IPv4):**
- **DATABASE_URL**: `postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require`
- **DIRECT_URL**: `postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require`

**⚠️ CRÍTICO:** 
- Ambas URLs son **idénticas** cuando usas Render (IPv4)
- Ambas deben incluir `?sslmode=require`
- Ambas usan el Session Pooler porque la conexión directa no es compatible con IPv4

**Nota:** 
- Normalmente Prisma requiere conexión directa para migraciones
- Pero como Render usa IPv4 y Supabase solo ofrece IPv6 en conexión directa, debes usar el Session Pooler también para DIRECT_URL
- El Session Pooler de Supabase maneja correctamente las migraciones de Prisma

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

**Pasos prácticos para Render (IPv4):**
1. Ve a Supabase Dashboard → Settings → Database → Connection Pooling
2. Selecciona **"Session pooler"** y copia la URL (formato `postgres.[PROJECT]@aws-1-us-east-2.pooler.supabase.com:5432`)
3. **IMPORTANTE:** Agrega `?sslmode=require` al final de la URL
4. Pega la misma URL en Render como `DATABASE_URL` (con `?sslmode=require`)
5. Pega la misma URL en Render como `DIRECT_URL` (con `?sslmode=require`)
6. **Ambas URLs son idénticas** porque Render usa IPv4 y necesita el Session Pooler
7. Pega ambas URLs en tu `.env` local
8. **Listo.** No necesitas volver a Supabase Dashboard, las URLs funcionarán independientemente de qué opción esté seleccionada cuando vuelvas a entrar.

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

## ⚠️ Problema: Las Migraciones se Bloquean o Tardan Mucho

**Si las migraciones se quedan cargando indefinidamente:**

### Solución Rápida: Omitir Migraciones Temporalmente

Si tu base de datos ya tiene el esquema correcto y solo necesitas hacer deploy de la aplicación:

1. **En Render Dashboard → Tu servicio → Settings → Build Command**
2. **Cambia el build command de:**
   ```
   npm install && npm run prisma:generate && npm run build && npm run migrate:deploy
   ```
3. **A:**
   ```
   npm install && npm run prisma:generate && npm run build && node scripts/deploy-migrations-skip-on-error.js
   ```

**O mejor aún, si ya aplicaste las migraciones manualmente, puedes omitirlas completamente:**
```
npm install && npm run prisma:generate && npm run build
```

**Nota:** El script `deploy-migrations-skip-on-error.js` intentará aplicar las migraciones, pero si falla (por timeout o conexión), continuará con el deploy sin bloquearse.

### Solución Permanente: Arreglar la Conexión

Si necesitas que las migraciones funcionen correctamente:

1. **Verifica las URLs de conexión** (deben incluir `?sslmode=require`)
2. **Prueba con Session Pooler** en lugar de Transaction Pooler
3. **Verifica que el proyecto de Supabase esté activo**
4. **El script ahora tiene un timeout de 30 segundos** - si tarda más, fallará rápido

## 🆘 Troubleshooting

### Error: "Environment variable not found: DATABASE_URL"

**Solución:** Agrega `DATABASE_URL` en la sección Environment de Render

### Error: "Schema engine error: unexpected message from server"

**⚠️ ESTE ERROR OCURRE CUANDO HAY PROBLEMAS CON LA CONFIGURACIÓN DEL POOLER**

**Nota:** Este error es menos común cuando usas Session Pooler correctamente. Si lo experimentas:

1. **Verifica que ambas URLs usen Session Pooler:**
   - **DATABASE_URL**: `postgresql://postgres.[PROJECT]:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require`
   - **DIRECT_URL**: `postgresql://postgres.[PROJECT]:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require`

2. **Asegúrate de usar Session Pooler (no Transaction Pooler):**
   - Session Pooler: Puerto `5432`
   - Transaction Pooler: Puerto `6543` (NO usar para Prisma)

3. **Si el error persiste:**
   - Verifica que el proyecto esté activo en Supabase
   - Verifica que no haya restricciones de red
   - Intenta hacer un redeploy en Render

### Error: P1001 "Can't reach database server" con Session Pooler

**⚠️ ESTE ERROR PUEDE OCURRIR AUNQUE USES SESSION POOLER CORRECTAMENTE**

**Si ya verificaste que:**
- ✅ El proyecto de Supabase está ACTIVO (verde)
- ✅ No hay restricciones de red
- ✅ Ambas URLs usan Session Pooler con `?sslmode=require`
- ✅ Las URLs son idénticas

**Y el error persiste, intenta usar Transaction Pooler:**

1. **Ve a Supabase Dashboard → Settings → Database → Connection Pooling**
2. **Selecciona "Transaction Pooler"** (NO Session Pooler)
3. **Copia la URL** que aparece (debería tener el formato `postgresql://postgres.[PROJECT]:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:6543/postgres`)
4. **Agrega `?sslmode=require` al final** de la URL
5. **Usa esa URL para ambas variables** (`DATABASE_URL` y `DIRECT_URL`) en Render

**Ejemplo con Transaction Pooler:**
```
DATABASE_URL: postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require
DIRECT_URL: postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require
```

**Nota:** Transaction Pooler usa el puerto `6543` en lugar de `5432`. Aunque normalmente se recomienda Session Pooler para Prisma, Transaction Pooler puede funcionar mejor en algunos entornos de Render.

### Error: "Can't reach database server" con DIRECT_URL

**⚠️ ESTE ERROR OCURRE PORQUE LA CONEXIÓN DIRECTA DE SUPABASE NO ES COMPATIBLE CON IPv4 (Render usa IPv4)**

**Solución para Render (IPv4):**
1. **DIRECT_URL DEBE usar Session Pooler también**, NO la conexión directa:
   - ❌ **INCORRECTO**: `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres?sslmode=require`
   - ✅ **CORRECTO**: `postgresql://postgres.[PROJECT]:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require`

2. **Verifica que ambas URLs usen el Session Pooler:**
   - **DATABASE_URL**: Debe usar Session Pooler (`aws-1-us-east-2.pooler.supabase.com`)
   - **DIRECT_URL**: **TAMBIÉN debe usar Session Pooler** (`aws-1-us-east-2.pooler.supabase.com`)
   - Ambas deben incluir `?sslmode=require`

3. **Ejemplo correcto para Render (Session Pooler):**
   - **DATABASE_URL**: `postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require`
   - **DIRECT_URL**: `postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require`

4. **Por qué ambas URLs son idénticas:**
   - Render usa IPv4, pero la conexión directa de Supabase solo funciona con IPv6
   - Por eso debes usar el Session Pooler también para DIRECT_URL
   - El Session Pooler es compatible con IPv4 y maneja correctamente las migraciones de Prisma

### Error: "No migration found" o "P3005: The database schema is not empty"

**⚠️ ESTE ERROR OCURRE CUANDO LA BASE DE DATOS YA TIENE ESQUEMA PERO PRISMA NO TIENE REGISTRO DE MIGRACIONES**

**Solución:**
1. **Este error se resuelve automáticamente** con el script `deploy-migrations.js` que está configurado
2. El script detecta este error y hace un "baseline" automático de las migraciones existentes
3. Luego intenta aplicar las migraciones nuevamente

**Si el error persiste manualmente:**
```bash
# Marcar las migraciones existentes como aplicadas (baseline)
npx prisma migrate resolve --applied 20251027221350_init
npx prisma migrate resolve --applied 20251027232428_actualizar_fabricacion

# Luego intentar deploy nuevamente
npx prisma migrate deploy
```

**¿Por qué ocurre?**
- La base de datos ya tiene tablas/esquema creado
- Pero Prisma no tiene registro de qué migraciones se aplicaron
- Necesita hacer un "baseline" para sincronizar el estado

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

#### Paso 1: Verificar Restricciones de Red en Supabase

**Render tiene IPs dinámicas que cambian frecuentemente. Supabase puede estar bloqueando estas conexiones.**

1. Ve a **Supabase Dashboard** → Tu proyecto
2. Ve a **Settings** → **Database**
3. Busca la sección **"Network Restrictions"**
4. **Verifica el estado:**
   - ✅ **"Your database can be accessed by all IP addresses"** = No hay restricciones (correcto)
   - ❌ Si hay una lista de IPs permitidas, Render NO estará en esa lista

5. **Si hay restricciones activas:**
   - **Deshabilita temporalmente las restricciones de red** o
   - **Permite todas las conexiones** haciendo clic en "Restrict all access" y luego eliminando las restricciones
   - **⚠️ ADVERTENCIA:** Esto reduce la seguridad, pero es necesario para que Render se conecte

**Si NO hay restricciones de red (como en tu caso), el problema es otra cosa. Continúa con los siguientes pasos.**

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

#### Paso 5: Verificar SSL y Certificados

Supabase requiere SSL para conexiones seguras:

1. Ve a **Settings** → **Database** → **SSL Configuration**
2. Verifica que **"Enforce SSL on incoming connections"** esté activado
3. Si está activado, asegúrate de que tu URL incluya `?sslmode=require` (aunque con Session Pooler puede que no sea necesario)

#### Paso 6: Verificar Pool Size y Límites

1. Ve a **Settings** → **Database** → **Connection Pooling**
2. Verifica:
   - **Pool Size**: Debe ser al menos 15 (por defecto)
   - **Max Client Connections**: 200 (fijo para plan Nano)
3. Si el pool está lleno, puede rechazar nuevas conexiones

#### Paso 7: Probar Conexión desde tu Máquina Local

Para verificar que la URL funciona:

1. Prueba conectarte desde tu máquina local usando la misma URL exacta que configuraste en Render
2. Si funciona localmente pero no en Render:
   - Verifica que la URL en Render sea **exactamente igual** (sin espacios, sin caracteres extra)
   - Verifica que la contraseña esté codificada correctamente
   - Verifica que no haya problemas de timeout en Render

#### Paso 8: Verificar Variables en Render

1. Ve a tu servicio en Render → **Environment**
2. Verifica que `DATABASE_URL` y `DIRECT_URL` estén configuradas
3. **IMPORTANTE:** Copia exactamente las URLs desde Supabase Dashboard (Session Pooler)
4. Verifica que no haya espacios al inicio o final de las URLs
5. Verifica que la contraseña esté codificada correctamente (`+` → `%2B`)

#### Resumen de Causas Comunes (en orden de probabilidad):

1. ✅ **URL incorrecta o formato incorrecto** - Verifica que uses Session Pooler con formato `postgres.[PROJECT]@pooler.supabase.com:5432`
2. ✅ **Contraseña mal codificada** - Codifica caracteres especiales (`+` → `%2B`)
3. ✅ **Variables mal configuradas en Render** - Verifica que no haya espacios, que estén exactamente como en Supabase
4. ✅ **Proyecto pausado** - Reactívalo en Supabase Dashboard
5. ✅ **Pool lleno o límites alcanzados** - Verifica Pool Size y Max Client Connections
6. ✅ **Región incorrecta del pooler** - Verifica que el host del pooler coincida con tu región
7. ✅ **Restricciones de red** - Si las hay, deshabilítalas temporalmente

**Si NO hay restricciones de red y el proyecto está activo, el problema más probable es:**
- URL mal formateada o copiada incorrectamente
- Contraseña con caracteres especiales sin codificar
- Variables de entorno en Render con espacios o caracteres extra

## 📚 Referencias

- [Render Environment Variables](https://render.com/docs/environment-variables)
- [Render PostgreSQL](https://render.com/docs/databases)
- [Supabase Connection Strings](https://supabase.com/docs/guides/database/connecting-to-postgres)

