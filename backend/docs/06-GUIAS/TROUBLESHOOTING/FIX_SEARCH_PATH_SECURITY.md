# 🔒 Fix: Warning de Seguridad - Function Search Path Mutable

## ⚠️ Problema

Supabase detecta que la función `update_updated_at_column` tiene un `search_path` mutable, lo cual es una vulnerabilidad de seguridad conocida en PostgreSQL.

**Warning:**
```
Function public.update_updated_at_column has a role mutable search_path
```

## 🔍 ¿Por qué es un Problema?

Cuando una función PostgreSQL tiene un `search_path` mutable:

1. **Vulnerabilidad a ataques:** Un atacante podría manipular el `search_path` para hacer que la función ejecute código malicioso
2. **Inyección de esquemas:** Se pueden crear esquemas maliciosos que se ejecuten antes que los esquemas legítimos
3. **Violación de seguridad:** La función podría ejecutarse con privilegios diferentes a los esperados

## ✅ Solución

Fijar el `search_path` a una cadena vacía (`''`) para que la función solo use esquemas calificados explícitamente.

### Cambios Realizados

**Antes (Inseguro):**
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';
```

**Después (Seguro):**
```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;
```

### Cambios Clave:

1. ✅ `SET search_path = ''` - Fija el search_path a vacío (seguro)
2. ✅ `SECURITY DEFINER` - Ejecuta con los privilegios del creador de la función
3. ✅ `LANGUAGE plpgsql` - Sintaxis más explícita
4. ✅ `public.update_updated_at_column()` - Calificación explícita del esquema

## 🚀 Aplicar la Corrección

### Opción 1: Ejecutar SQL Directamente en Supabase

1. Ve a tu proyecto en Supabase Dashboard
2. Ve a **SQL Editor**
3. Copia y pega el contenido de `backend/prisma/migrations/fix_update_updated_at_security.sql`
4. Ejecuta el script
5. Verifica que no haya errores

### Opción 2: Ejecutar desde Terminal

```bash
cd backend

# Conectar a la base de datos y ejecutar el script
psql $DATABASE_URL -f prisma/migrations/fix_update_updated_at_security.sql
```

O usando Prisma:

```bash
# Ejecutar SQL usando Prisma
npx prisma db execute --file prisma/migrations/fix_update_updated_at_security.sql --schema prisma/schema.prisma
```

### Opción 3: Ejecutar desde Node.js

```bash
cd backend
node -e "
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function run() {
  const sql = fs.readFileSync('prisma/migrations/fix_update_updated_at_security.sql', 'utf8');
  await prisma.\$executeRawUnsafe(sql);
  console.log('✅ Migración aplicada correctamente');
  await prisma.\$disconnect();
}

run().catch(console.error);
"
```

## ✅ Verificar la Corrección

### Desde Supabase Dashboard:

1. Ve a **Database** → **Functions**
2. Busca `update_updated_at_column`
3. Verifica que tenga `SET search_path = ''` en la definición

### Desde SQL:

```sql
-- Verificar que la función tiene search_path fijo
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'update_updated_at_column';
```

Deberías ver `SET search_path = ''` en la definición.

### Verificar que los Triggers Funcionan:

```sql
-- Probar actualizando un registro
UPDATE "t_suscripciones" 
SET "planSuscripcion" = "planSuscripcion" 
WHERE id = (SELECT id FROM "t_suscripciones" LIMIT 1);

-- Verificar que updatedAt se actualizó
SELECT id, "updatedAt" 
FROM "t_suscripciones" 
ORDER BY "updatedAt" DESC 
LIMIT 1;
```

## 📚 Referencias

- [PostgreSQL Security Best Practices](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY)
- [Supabase Security Advisories](https://supabase.com/docs/guides/database/extensions/pg_stat_statements)
- [OWASP PostgreSQL Security](https://owasp.org/www-community/vulnerabilities/PostgreSQL_Security)

## 🔍 Prevenir Futuros Problemas

Al crear nuevas funciones en PostgreSQL, siempre:

1. ✅ Usa `SET search_path = ''` o `SET search_path = 'public'`
2. ✅ Califica explícitamente los esquemas (ej: `public.tabla`)
3. ✅ Usa `SECURITY DEFINER` solo cuando sea necesario
4. ✅ Revisa las funciones existentes periódicamente

---

**Última actualización:** 2025-11-22





