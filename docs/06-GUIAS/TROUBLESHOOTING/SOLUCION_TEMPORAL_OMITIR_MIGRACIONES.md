# Solución Temporal: Omitir Migraciones Durante Build

## 🔍 Cuándo Usar Esta Solución

Usa esta solución **SOLO** si:
- ✅ Las migraciones **YA ESTÁN APLICADAS** en tu base de datos
- ✅ El problema es **SOLO de conectividad** durante el build
- ✅ Necesitas hacer deploy **URGENTEMENTE** mientras resuelves el problema de red

**⚠️ ADVERTENCIA:** Si las migraciones NO están aplicadas, tu aplicación fallará en runtime.

## 🚀 Solución Rápida

### Opción 1: Variable de Entorno en Render (RECOMENDADO)

1. Ve a **Render Dashboard** → Tu servicio backend → **Environment**
2. Agrega una nueva variable de entorno:
   - **Key:** `SKIP_MIGRATIONS`
   - **Value:** `true`
3. Guarda los cambios
4. Haz redeploy

**El build ahora omitirá las migraciones y continuará.**

### Opción 2: Modificar Build Command Temporalmente

1. Ve a **Render Dashboard** → Tu servicio backend → **Settings** → **Build Command**
2. Cambia el comando a:
   ```
   npm install && npm run prisma:generate && npm run build
   ```
   (Elimina la parte `&& node scripts/deploy-migrations.js`)
3. Guarda los cambios
4. Haz redeploy

## ✅ Verificar que las Migraciones Están Aplicadas

Antes de usar esta solución, verifica que las migraciones ya están aplicadas:

### Desde Supabase Dashboard:

1. Ve a **Supabase Dashboard** → Tu proyecto → **Database** → **Migrations**
2. Verifica que todas las migraciones aparezcan como aplicadas

### Desde Prisma Studio (localmente):

```bash
cd backend
npm run prisma:studio
```

Verifica que las tablas existan en la base de datos.

## 🔄 Volver a Habilitar Migraciones

Una vez que resuelvas el problema de conectividad:

### Si usaste Opción 1 (Variable de Entorno):

1. Ve a **Render Dashboard** → Tu servicio backend → **Environment**
2. Elimina o cambia `SKIP_MIGRATIONS` a `false`
3. Haz redeploy

### Si usaste Opción 2 (Build Command):

1. Ve a **Render Dashboard** → Tu servicio backend → **Settings** → **Build Command**
2. Restaura el comando original:
   ```
   npm install && npm run prisma:generate && npm run build && node scripts/deploy-migrations.js
   ```
3. Haz redeploy

## 📋 Resolver el Problema de Conectividad

Mientras tanto, resuelve el problema real:

1. **Verifica Network Restrictions en Supabase:**
   - Ve a Supabase Dashboard → Settings → Database → Network Restrictions
   - Permite todas las IPs temporalmente (`0.0.0.0/0`)

2. **O prueba con Transaction Pooler:**
   - Usa el puerto 6543 en lugar de 5432
   - Agrega `&pgbouncer=true` a las URLs

Ver guía completa: `docs/06-GUIAS/TROUBLESHOOTING/SOLUCION_ERROR_P1001_DURANTE_BUILD.md`

## ⚠️ Notas Importantes

- Esta es una solución **TEMPORAL**
- **NO** uses esto en producción a largo plazo
- Las migraciones son importantes para mantener el esquema actualizado
- Resuelve el problema de conectividad lo antes posible

