# 🔧 Configurar DATABASE_URL para Supabase

## 📋 Información de tu Proyecto Supabase

Según la información proporcionada:

- **Host:** `db.tguajsxchwtnliueokwy.supabase.co`
- **Puerto:** `5432`
- **Base de datos:** `postgres`
- **Usuario:** `postgres`
- **Método:** Direct connection

---

## ⚠️ Importante: Problema con IPv4

Supabase indica que tu proyecto **no es compatible con IPv4**. Tienes dos opciones:

### Opción 1: Usar Session Pooler (Recomendado)

El Session Pooler es más eficiente y funciona con IPv4. Usa el puerto **6543** en lugar de **5432**.

**Connection String con Session Pooler:**
```
postgresql://postgres.[PROJECT_REF]:[YOUR_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

Para tu proyecto específico, debería ser algo como:
```
postgresql://postgres.tguajsxchwtnliueokwy:[YOUR_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Para obtener la URL exacta del Pooler:**
1. Ve a tu proyecto en Supabase Dashboard
2. Settings → Database
3. Busca "Connection String" → "Session" mode
4. Copia esa URL

### Opción 2: Direct Connection (Actual)

Si prefieres usar Direct Connection, el formato es:

```
postgresql://postgres:[YOUR_PASSWORD]@db.tguajsxchwtnliueokwy.supabase.co:5432/postgres
```

**⚠️ Nota:** Si estás en una red IPv4, esto puede no funcionar. Necesitarías:
- Usar IPv6, O
- Comprar el add-on IPv4 de Supabase, O
- Usar Session Pooler (recomendado)

---

## 📝 Configuración en .env

Tu archivo `backend/.env` debe tener:

```env
# Opción 1: Session Pooler (Recomendado - funciona con IPv4)
DATABASE_URL="postgresql://postgres.tguajsxchwtnliueokwy:[YOUR_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10"

# Opción 2: Direct Connection (Solo si tienes IPv6 o IPv4 add-on)
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.tguajsxchwtnliueokwy.supabase.co:5432/postgres?schema=public"

# DIRECT_URL (solo para migraciones, usa Direct Connection)
DIRECT_URL="postgresql://postgres:[YOUR_PASSWORD]@db.tguajsxchwtnliueokwy.supabase.co:5432/postgres?schema=public"
```

**Reemplaza:**
- `[YOUR_PASSWORD]` con tu contraseña real de la base de datos
- `[REGION]` con la región de tu proyecto (ej: us-east-1, eu-west-1)

---

## 🔍 Cómo Obtener la Contraseña

Si no recuerdas tu contraseña:

1. Ve a Supabase Dashboard → Tu Proyecto
2. Settings → Database
3. Busca "Database Password"
4. Si no la ves, haz clic en "Reset Database Password"
5. Copia la nueva contraseña (solo se muestra una vez)

---

## ✅ Verificar la Configuración

Después de actualizar tu `.env`, ejecuta:

```bash
cd backend
npm run test-db-connection
```

Este script verificará:
- ✅ Que DATABASE_URL esté configurada
- ✅ Que la conexión funcione
- ✅ Que las queries funcionen
- ✅ Que las tablas existan

---

## 🚀 Pasos Recomendados

1. **Obtén la Connection String del Session Pooler:**
   - Ve a Supabase Dashboard → Settings → Database
   - Connection String → Selecciona "Session" mode
   - Copia la URL completa

2. **Actualiza tu `.env`:**
   ```env
   DATABASE_URL="[URL_COPIADA_DEL_SESSION_POOLER]"
   DIRECT_URL="postgresql://postgres:[PASSWORD]@db.tguajsxchwtnliueokwy.supabase.co:5432/postgres?schema=public"
   ```

3. **Prueba la conexión:**
   ```bash
   npm run test-db-connection
   ```

4. **Si funciona, reinicia tu servidor:**
   ```bash
   npm run dev
   ```

---

## 📚 Referencias

- [Supabase Connection Pooling Docs](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Supabase IPv4 Add-on](https://supabase.com/docs/guides/platform/ipv4-addresses)

---

**Última actualización:** 2025-11-22





