# 🔍 Cómo Verificar tu Proyecto de Supabase

## Problema Actual
No puedes conectar al servidor `db.tguajsxchwtnliueokwy.supabase.co`

## 🎯 Verificación Paso a Paso

### 1️⃣ Abre el Dashboard de Supabase
```
https://supabase.com/dashboard
```

### 2️⃣ Inicia Sesión
- Usa tus credenciales de Supabase

### 3️⃣ Busca tu Proyecto
- Si NO aparece ningún proyecto: Necesitas crear uno nuevo
- Si SÍ aparece el proyecto:

#### ✅ Si el Proyecto ESTÁ Activo:
1. Haz clic en tu proyecto
2. Ve a **Settings** (ícono de engranaje ⚙️)
3. Ve a **Database**
4. Busca la sección **"Connection string"** o **"Connection pooling"**
5. Copia la URL completa
6. REEMPLÁZALA en tu archivo `.env`

#### ❌ Si el Proyecto ESTÁ Pausado:
1. Verás un banner que dice "Project is paused" o similar
2. Haz clic en **"Restore"** o **"Unpause"**
3. Espera 1-2 minutos mientras se activa
4. Intenta conectar nuevamente

### 4️⃣ Si NO Existe el Proyecto:
1. Haz clic en **"New Project"**
2. Nombre: `reforma`
3. Password: Elige una contraseña SEGURA (guárdala bien)
4. Region: La más cercana a tu ubicación
5. Espera 1-2 minutos
6. Ve a **Settings → Database**
7. Copia la **Connection string**
8. ACTUALIZA tu archivo `.env` con la nueva URL

## 📝 Actualizar el .env

Cuando tengas la nueva URL de Supabase, actualiza tu archivo:

```bash
cd backend
# Edita el archivo .env con la nueva DATABASE_URL
```

Ejemplo de URL correcta:
```
DATABASE_URL="postgresql://postgres.xxx:[TU-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:[TU-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
```

**IMPORTANTE**: La URL moderna de Supabase usa un formato diferente:
- Formato antiguo: `db.xxxxx.supabase.co`
- Formato nuevo: `aws-0-region.pooler.supabase.com` (con pooler)

## 🧪 Probar la Conexión

Después de actualizar el .env:

```bash
node test-simple-connection.js
```

Si funciona, verás:
```
✅ CONEXIÓN EXITOSA!
```

Si NO funciona, verás:
```
❌ ERROR: [mensaje específico]
```

## 🆘 ¿Necesitas Ayuda?

1. ¿No puedes acceder al dashboard? → Verifica tus credenciales
2. ¿No aparece ningún proyecto? → Crea uno nuevo
3. ¿El proyecto está pausado? → Restaura el proyecto
4. ¿Tienes una URL nueva pero no funciona? → Comparte el error específico

