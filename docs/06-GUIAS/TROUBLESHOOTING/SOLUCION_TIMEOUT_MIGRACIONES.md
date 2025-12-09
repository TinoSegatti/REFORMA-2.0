# 🔧 Solución: Timeout en Migraciones con Transaction Pooler

## 🚨 Problema

Las migraciones están dando timeout después de 180 segundos cuando se usa Transaction Pooler (puerto 6543) para ambas URLs.

**Síntomas:**
- ✅ Build compila correctamente
- ✅ Variables de entorno están configuradas correctamente
- ❌ Migraciones dan timeout después de 180 segundos
- ❌ Build falla antes de completarse

## 🔍 Causa

Transaction Pooler puede ser muy lento para migraciones de Prisma, especialmente cuando:
- Las migraciones son complejas
- Hay muchas migraciones pendientes
- La conexión desde Render a Supabase es lenta

## ✅ Solución Recomendada: Omitir Migraciones si Ya Están Aplicadas

Si tu base de datos ya tiene el esquema correcto (las tablas ya existen), puedes omitir las migraciones durante el build:

### Paso 1: Verificar que las Migraciones Ya Están Aplicadas

1. Ve a **Supabase Dashboard** → Tu proyecto → **SQL Editor**
2. Ejecuta esta consulta para verificar que las tablas existan:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

3. Deberías ver tablas como:
   - `t_usuarios`
   - `t_granja`
   - `t_proveedor`
   - `t_materia_prima`
   - `t_inventario`
   - etc.

### Paso 2: Omitir Migraciones en Render

1. Ve a **Render Dashboard** → Tu servicio backend → **Environment**
2. Agrega esta variable:
   ```
   SKIP_MIGRATIONS=true
   ```
3. **Guarda los cambios**
4. Ve a **Deployments** → **Manual Deploy** → **Deploy latest commit**

### Paso 3: Verificar que el Deploy Funcione

Después de agregar `SKIP_MIGRATIONS=true`, el build debería:
- ✅ Compilar correctamente
- ✅ Omitir las migraciones (mostrará un mensaje)
- ✅ Completar el deploy exitosamente
- ✅ El servidor debería iniciar correctamente

## 🔄 Si Necesitas Aplicar Migraciones Nuevas

Si tienes migraciones nuevas que necesitas aplicar:

### Opción 1: Aplicar Manualmente desde Supabase

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Copia el contenido de `backend/prisma/migrations/[NOMBRE_MIGRACION]/migration.sql`
3. Ejecuta el SQL manualmente
4. Marca la migración como aplicada:

```sql
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
  gen_random_uuid(),
  '[CHECKSUM]',
  NOW(),
  '[NOMBRE_MIGRACION]',
  NULL,
  NULL,
  NOW(),
  1
);
```

### Opción 2: Usar Session Pooler para DIRECT_URL

Si necesitas que las migraciones funcionen automáticamente:

1. Ve a **Supabase Dashboard** → **Settings** → **Database** → **Connection Pooling**
2. Selecciona **"Session Pooler"** (puerto 5432)
3. Copia la URL completa
4. En Render, actualiza `DIRECT_URL`:

```
postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require
```

**⚠️ IMPORTANTE:** `DIRECT_URL` debe usar Session Pooler (puerto 5432) **SIN** `pgbouncer=true`

5. Mantén `DATABASE_URL` con Transaction Pooler (puerto 6543) con `pgbouncer=true`
6. Haz redeploy

## 📋 Configuración Recomendada para Deploy Rápido

**Para omitir migraciones (si ya están aplicadas):**

```env
DATABASE_URL=postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
DIRECT_URL=postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
SKIP_MIGRATIONS=true
```

**Para aplicar migraciones automáticamente:**

```env
DATABASE_URL=postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
DIRECT_URL=postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require
# NO incluir SKIP_MIGRATIONS
```

## ✅ Verificación Post-Deploy

Después de configurar `SKIP_MIGRATIONS=true`:

1. **Build exitoso:** Los logs deben mostrar `⚠️ SKIP_MIGRATIONS=true detectado`
2. **Servidor iniciado:** El servicio debería estar en estado "Live"
3. **Health check:** `https://reforma-2-0.onrender.com/health` debe retornar `"status": "OK"`
4. **Aplicación funciona:** Login y consultas de datos funcionan correctamente

## 📚 Referencias

- [Configuración Definitiva para Render](./CONFIGURACION_DEFINITIVA_RENDER.md)
- [Solución Session Pooler No Funciona](./SOLUCION_SESSION_POOLER_NO_FUNCIONA_BUILD.md)

