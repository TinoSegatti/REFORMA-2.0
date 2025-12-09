# 🔍 Verificar URLs en Render - Solución Rápida

## 🚨 Problema Común: URL Truncada o Mal Configurada

Si ves en los logs que `DATABASE_URL` está truncada o le faltan parámetros, sigue estos pasos:

## ✅ Solución: Verificar y Corregir URLs en Render

### Paso 1: Ir a Render Dashboard

1. Ve a **https://dashboard.render.com**
2. Selecciona tu servicio backend (`reforma-2-0`)
3. Ve a la pestaña **"Environment"**

### Paso 2: Verificar DATABASE_URL

**Busca la variable `DATABASE_URL` y verifica que tenga este formato COMPLETO:**

```
postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

**⚠️ IMPORTANTE - Verifica que:**
- ✅ El puerto sea `:6543` (no `:654` ni `:5432`)
- ✅ Incluya `/postgres` después del puerto
- ✅ Incluya `?sslmode=require&pgbouncer=true` al final
- ✅ No tenga espacios al inicio o final
- ✅ No esté truncada

### Paso 3: Verificar DIRECT_URL

**Busca la variable `DIRECT_URL` y verifica que sea IDÉNTICA a `DATABASE_URL`:**

```
postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

**⚠️ IMPORTANTE:**
- ✅ Debe ser **exactamente igual** a `DATABASE_URL`
- ✅ Mismo puerto (`6543`)
- ✅ Mismos parámetros (`?sslmode=require&pgbouncer=true`)

### Paso 4: Si DATABASE_URL Está Truncada o Incorrecta

1. **Haz clic en el botón de editar** (lápiz) junto a `DATABASE_URL`
2. **Borra todo el contenido actual**
3. **Copia y pega esta URL completa** (reemplaza `DataBase2025.` con tu contraseña real si es diferente):

```
postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

4. **Guarda los cambios**

### Paso 5: Verificar DIRECT_URL

1. **Haz clic en el botón de editar** junto a `DIRECT_URL`
2. **Copia exactamente la misma URL** que usaste para `DATABASE_URL`
3. **Pégala y guarda**

### Paso 6: Redeploy

1. Ve a **"Deployments"**
2. Haz clic en **"Manual Deploy"** → **"Deploy latest commit"**
3. Espera a que termine

## 🔍 Cómo Verificar que Está Correcta

En los logs del build, deberías ver:

```
✅ Variables de entorno configuradas
   DATABASE_URL: postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
   DIRECT_URL: postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true

🔍 Verificando formato de URLs...
   ✅ Configuración óptima detectada:
      - DATABASE_URL usa Transaction Pooler (puerto 6543) para la aplicación
      - DIRECT_URL usa Transaction Pooler (puerto 6543) para migraciones
```

**Si ves advertencias como:**
- `⚠️ DATABASE_URL no incluye ?sslmode=require` → Falta `?sslmode=require&pgbouncer=true`
- `⚠️ Las URLs son diferentes` → Las URLs no son idénticas
- URL truncada (termina en `:654` en lugar de `:6543`) → Falta parte de la URL

## 📋 Checklist de Verificación

Antes de hacer redeploy, verifica:

- [ ] `DATABASE_URL` tiene puerto `:6543` (no `:654` ni `:5432`)
- [ ] `DATABASE_URL` incluye `/postgres` después del puerto
- [ ] `DATABASE_URL` incluye `?sslmode=require&pgbouncer=true` al final
- [ ] `DIRECT_URL` es **idéntica** a `DATABASE_URL`
- [ ] No hay espacios al inicio o final de las URLs
- [ ] La contraseña está correcta (reemplaza `DataBase2025.` si es diferente)

## 🆘 Si Sigue Fallando

Si después de corregir las URLs sigue fallando:

1. **Verifica que el proyecto de Supabase esté activo** (verde en el dashboard)
2. **Verifica Network Restrictions** (debe permitir todas las IPs)
3. **Espera 2-3 minutos** después de cambiar las variables antes de hacer redeploy
4. **Verifica que copiaste la URL completa** desde Supabase Dashboard

## 📚 Referencias

- [Configuración Definitiva para Render](./CONFIGURACION_DEFINITIVA_RENDER.md)
- [Solución Session Pooler No Funciona](./SOLUCION_SESSION_POOLER_NO_FUNCIONA_BUILD.md)

