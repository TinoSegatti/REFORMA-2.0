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
5. Copia la **Connection String** (URI)
6. Agrégala como variable de entorno en Render:
   ```
   DATABASE_URL=postgresql://postgres:[TU_PASSWORD]@db.[TU_PROJECT].supabase.co:5432/postgres
   ```

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

### Error: "SSL required"

**Solución:** Agrega `?sslmode=require` al final de tu `DATABASE_URL`:
```
DATABASE_URL=postgresql://...?sslmode=require
```

## 📚 Referencias

- [Render Environment Variables](https://render.com/docs/environment-variables)
- [Render PostgreSQL](https://render.com/docs/databases)
- [Supabase Connection Strings](https://supabase.com/docs/guides/database/connecting-to-postgres)

