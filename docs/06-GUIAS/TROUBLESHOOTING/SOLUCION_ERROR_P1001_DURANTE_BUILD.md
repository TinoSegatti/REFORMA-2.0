# Solución: Error P1001 Durante Build en Render

## 🔍 Problema

El build en Render falla durante las migraciones con:
```
Error: P1001: Can't reach database server at `aws-1-us-east-2.pooler.supabase.com:5432`
```

**Situación:**
- ✅ El proyecto de Supabase está **ACTIVO** (verde)
- ✅ Las variables de entorno están configuradas correctamente
- ✅ Las URLs usan Session Pooler (puerto 5432)
- ❌ El build falla inmediatamente con P1001

## 📋 Causas Posibles

### 1. Network Restrictions en Supabase (MÁS COMÚN)

**Problema:** Supabase puede tener restricciones de red que bloquean conexiones desde Render.

**Solución:**
1. Ve a **Supabase Dashboard** → Tu proyecto → **Settings** → **Database**
2. Busca la sección **"Network Restrictions"**
3. Verifica que:
   - No haya restricciones activas que bloqueen a Render
   - O que la IP de Render esté en la lista de permitidas
4. **Para pruebas:** Permite todas las IPs temporalmente (0.0.0.0/0)
5. Guarda los cambios y espera 1-2 minutos
6. Vuelve a hacer deploy en Render

### 2. Problema Temporal de Red

**Problema:** Puede haber latencia o problemas temporales de conectividad desde Render hacia Supabase.

**Solución:**
- El script ahora tiene retry logic automático (3 intentos)
- Si sigue fallando, espera 5-10 minutos y vuelve a intentar
- Los problemas temporales suelen resolverse solos

### 3. Session Pooler con Problemas Intermitentes

**Problema:** El Session Pooler puede tener problemas intermitentes durante el build.

**Solución:** Usar Transaction Pooler temporalmente (ver Solución Alternativa abajo)

## 🔧 Soluciones Paso a Paso

### Solución 1: Verificar y Ajustar Network Restrictions

1. **Ir a Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Selecciona tu proyecto

2. **Verificar Network Restrictions:**
   - Ve a **Settings** → **Database**
   - Busca **"Network Restrictions"** o **"Connection Pooling"**
   - Verifica si hay restricciones activas

3. **Permitir Conexiones:**
   - Si hay restricciones, permite todas las IPs temporalmente: `0.0.0.0/0`
   - O agrega la IP de Render específicamente
   - Guarda los cambios

4. **Esperar y Reintentar:**
   - Espera 1-2 minutos para que los cambios se apliquen
   - Haz redeploy en Render

### Solución 2: Usar Transaction Pooler Temporalmente

Si Session Pooler sigue fallando, puedes usar Transaction Pooler como alternativa:

1. **Obtener URL de Transaction Pooler:**
   - Ve a Supabase Dashboard → Settings → Database → Connection Pooling
   - Selecciona **"Transaction Pooler"** (puerto 6543)
   - Copia la URL completa

2. **Formato de la URL:**
   ```
   postgresql://postgres.[PROJECT]:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
   ```
   
   **⚠️ IMPORTANTE:** 
   - Reemplaza `[YOUR-PASSWORD]` con tu contraseña real
   - Agrega `?sslmode=require&pgbouncer=true` al final
   - El parámetro `pgbouncer=true` es necesario para Transaction Pooler

3. **Configurar en Render:**
   - Ve a Render Dashboard → Tu servicio backend → **Environment**
   - Actualiza `DATABASE_URL` con la URL de Transaction Pooler
   - Actualiza `DIRECT_URL` con la **MISMA** URL de Transaction Pooler
   - Guarda los cambios

4. **Hacer Redeploy:**
   - Haz **Manual Deploy** en Render
   - El build debería completarse exitosamente

**⚠️ Nota:** Transaction Pooler es menos ideal que Session Pooler para Render, pero puede funcionar como solución temporal.

### Solución 3: Verificar Estado Real del Proyecto

A veces el proyecto puede aparecer como "activo" pero estar en proceso de reactivación:

1. Ve a Supabase Dashboard
2. Verifica que el proyecto muestre:
   - ✅ Estado: **Active** (verde)
   - ✅ Base de datos: **Running**
   - ✅ Sin mensajes de advertencia
3. Si hay algún indicador de "reactivando" o "starting", espera hasta que termine
4. Vuelve a hacer deploy

## 🔍 Diagnóstico Adicional

### Verificar Logs de Supabase

1. Ve a Supabase Dashboard → Tu proyecto → **Logs**
2. Busca errores relacionados con:
   - Conexiones rechazadas
   - Timeouts
   - Límites de conexión

### Probar Conexión Manualmente

Puedes probar la conexión desde tu máquina local:

```bash
# Instalar psql (si no lo tienes)
# Windows: descarga desde https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql-client

# Probar conexión
psql "postgresql://postgres.[PROJECT]:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require"
```

Si la conexión funciona desde tu máquina pero no desde Render, el problema es específico de Render → Supabase.

## 📝 Mejoras Implementadas en el Código

El script `deploy-migrations.js` ahora incluye:

1. **Retry Logic Automático:**
   - Hasta 3 intentos automáticos
   - Espera progresiva entre intentos (3s, 6s)
   - Solo reintenta en errores P1001

2. **Timeout Aumentado:**
   - De 30 segundos a 60 segundos
   - Permite más tiempo para conexiones lentas

3. **Mejor Diagnóstico:**
   - Mensajes más claros sobre qué hacer
   - Referencias a documentación completa

## ✅ Checklist de Verificación

Antes de hacer deploy, verifica:

- [ ] Proyecto de Supabase está **Active** (verde) en el dashboard
- [ ] **Network Restrictions** no bloquean a Render (o permite todas las IPs)
- [ ] `DATABASE_URL` y `DIRECT_URL` están configuradas correctamente
- [ ] Ambas URLs usan el mismo pooler (Session o Transaction)
- [ ] Ambas URLs incluyen `?sslmode=require`
- [ ] Si usas Transaction Pooler, ambas URLs incluyen `&pgbouncer=true`
- [ ] Esperaste 1-2 minutos después de cambiar Network Restrictions

## 🔗 Enlaces Útiles

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Supabase Network Restrictions Docs](https://supabase.com/docs/guides/platform/network-restrictions)
- [Render Dashboard](https://dashboard.render.com/)
- [Prisma Migrate Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)

## ⚠️ Notas Importantes

1. **Transaction Pooler vs Session Pooler:**
   - **Session Pooler** (puerto 5432): Mejor para Render, mantiene estado de sesión
   - **Transaction Pooler** (puerto 6543): Alternativa temporal, requiere `pgbouncer=true`

2. **Network Restrictions:**
   - Pueden bloquear conexiones desde Render
   - Verifica siempre que no haya restricciones activas
   - Para pruebas, permite todas las IPs temporalmente

3. **Problemas Temporales:**
   - Los problemas de red suelen resolverse solos
   - El retry logic ayuda a manejar problemas temporales
   - Si persiste, prueba con Transaction Pooler

