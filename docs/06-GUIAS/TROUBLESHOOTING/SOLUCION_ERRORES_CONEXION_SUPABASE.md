# Solución: Errores Intermitentes de Conexión a Supabase

## 🔍 Problema

Los logs muestran errores intermitentes:
```
Can't reach database server at `aws-1-us-east-2.pooler.supabase.com:5432`
```

Algunas consultas funcionan y otras fallan, lo que indica problemas de conexión intermitentes.

## 📋 Causas Comunes

### 1. Proyecto de Supabase Pausado (MÁS COMÚN)

**Los proyectos gratuitos de Supabase se pausan automáticamente después de 7 días de inactividad.**

**Síntomas:**
- Errores intermitentes de conexión
- Algunas consultas funcionan, otras fallan
- El proyecto aparece como "Paused" en Supabase Dashboard

**Solución:**
1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Busca tu proyecto
3. Si está pausado, verás un botón **"Restore"** o **"Resume"**
4. Haz clic en **"Restore"** y espera 1-2 minutos
5. El proyecto se reactivará automáticamente

**Prevención:**
- Los proyectos gratuitos se pausan después de 7 días de inactividad
- Para evitar pausas, puedes:
  - Hacer una consulta periódica (cada 6 días)
  - Actualizar a un plan de pago (no se pausan)
  - Usar un servicio de "keep-alive" (ver más abajo)

### 2. Problemas de Red/Conectividad

**Síntomas:**
- Errores intermitentes sin patrón claro
- Timeouts ocasionales

**Solución:**
1. Verifica que tu proyecto de Supabase esté **ACTIVO** (verde) en el dashboard
2. Verifica las **Network Restrictions** en Supabase Dashboard:
   - Ve a **Settings** → **Database** → **Network Restrictions**
   - Asegúrate de que no haya restricciones que bloqueen a Render
   - Si hay restricciones, agrega la IP de Render o permite todas las IPs temporalmente

### 3. Pooler de Supabase Sobreloadado

**Síntomas:**
- Errores de conexión durante picos de tráfico
- Timeouts frecuentes

**Solución:**
1. Verifica el uso del pooler en Supabase Dashboard
2. Considera aumentar el tamaño del pool (si estás en un plan de pago)
3. Implementa retry logic en el código (ver más abajo)

### 4. Variables de Entorno Incorrectas

**Síntomas:**
- Errores constantes de conexión
- No se puede conectar nunca

**Solución:**
1. Verifica que `DATABASE_URL` y `DIRECT_URL` estén configuradas en Render
2. Verifica que ambas URLs usen el **Session Pooler** (puerto 5432)
3. Verifica que ambas URLs incluyan `?sslmode=require`
4. Verifica que las contraseñas no tengan espacios al inicio o final

## 🔧 Soluciones Paso a Paso

### Paso 1: Verificar Estado del Proyecto en Supabase

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Busca tu proyecto
3. Verifica el estado:
   - ✅ **Verde/Activo**: El proyecto está funcionando
   - ⏸️ **Pausado**: Haz clic en "Restore" para reactivarlo
   - ⚠️ **Amarillo/Advertencia**: Revisa los detalles

### Paso 2: Verificar Variables de Entorno en Render

1. Ve a **Render Dashboard** > Tu servicio backend > **Environment**
2. Verifica estas variables:
   - `DATABASE_URL`: Debe usar Session Pooler (`pooler.supabase.com:5432`)
   - `DIRECT_URL`: Debe usar Session Pooler también (`pooler.supabase.com:5432`)
   - Ambas deben incluir `?sslmode=require`

**Formato correcto:**
```
DATABASE_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require
DIRECT_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require
```

### Paso 3: Verificar Network Restrictions en Supabase

1. Ve a Supabase Dashboard → Tu proyecto → **Settings** → **Database**
2. Ve a la sección **"Network Restrictions"**
3. Verifica que:
   - No haya restricciones que bloqueen a Render
   - O que la IP de Render esté en la lista de permitidas
   - Para pruebas, puedes permitir todas las IPs temporalmente

### Paso 4: Probar Conexión Manualmente

Puedes probar la conexión desde Render usando el health check:

```bash
curl https://reforma-2-0.onrender.com/health
```

Si el health check funciona pero las consultas fallan, el problema es específico de la base de datos.

### Paso 5: Verificar Logs de Supabase

1. Ve a Supabase Dashboard → Tu proyecto → **Logs**
2. Busca errores relacionados con:
   - Conexiones rechazadas
   - Timeouts
   - Límites de conexión alcanzados

## 🚨 Solución Rápida: Reactivar Proyecto Pausado

Si tu proyecto está pausado:

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Busca tu proyecto (debería aparecer como "Paused")
3. Haz clic en **"Restore"** o **"Resume"**
4. Espera 1-2 minutos para que se reactive
5. Verifica que el estado cambie a "Active" (verde)
6. Prueba tu aplicación nuevamente

**⚠️ IMPORTANTE:** Después de reactivar el proyecto, puede tomar algunos minutos para que todas las conexiones se estabilicen. El código ahora incluye retry logic automático que intentará reconectar hasta 3 veces con backoff exponencial.

## 📝 Mejoras Recomendadas

### 1. Implementar Retry Logic

El código ya tiene manejo básico de errores, pero puedes mejorar agregando retry logic para errores de conexión intermitentes.

### 2. Monitorear Estado del Proyecto

- Revisa periódicamente el estado de tu proyecto en Supabase Dashboard
- Configura alertas si es posible (planes de pago)

### 3. Usar Keep-Alive (Opcional)

Para evitar que el proyecto se pause, puedes implementar un endpoint que haga una consulta simple periódicamente:

```typescript
// Endpoint de keep-alive (ejecutar cada 6 días)
app.get('/keep-alive', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});
```

Luego puedes usar un servicio como [cron-job.org](https://cron-job.org) para llamar este endpoint cada 6 días.

## 🔗 Enlaces Útiles

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Supabase Documentation - Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Render Dashboard](https://dashboard.render.com/)

## ⚠️ Notas Importantes

1. **Proyectos gratuitos se pausan**: Después de 7 días de inactividad, Supabase pausa proyectos gratuitos automáticamente
2. **Reactivación rápida**: La reactivación suele tomar 1-2 minutos
3. **Sin pérdida de datos**: Los datos no se pierden cuando el proyecto está pausado
4. **Verificar estado regularmente**: Revisa el estado de tu proyecto periódicamente

