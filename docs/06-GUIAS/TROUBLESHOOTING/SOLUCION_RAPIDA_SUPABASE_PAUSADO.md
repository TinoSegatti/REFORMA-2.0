# Solución Rápida: Proyecto de Supabase Pausado

## 🚨 Problema

El build en Render falla con:
```
Error: P1001: Can't reach database server at `aws-1-us-east-2.pooler.supabase.com:5432`
```

**Causa más común:** El proyecto de Supabase está pausado (los proyectos gratuitos se pausan después de 7 días de inactividad).

## ✅ Solución Rápida (2 minutos)

### Paso 1: Reactivar el Proyecto

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Busca tu proyecto
3. Si aparece como **"Paused"** o con un indicador de pausa:
   - Haz clic en **"Restore"** o **"Resume"**
   - Espera 1-2 minutos
   - Verifica que el estado cambie a **"Active"** (verde)

### Paso 2: Verificar Estado

1. En Supabase Dashboard, verifica que tu proyecto muestre:
   - ✅ Estado: **Active** (verde)
   - ✅ Base de datos: **Running**
   - ✅ Sin mensajes de error

### Paso 3: Reintentar Deploy en Render

1. Ve a Render Dashboard → Tu servicio backend
2. Haz clic en **"Manual Deploy"** → **"Deploy latest commit"**
3. Espera a que el build complete

## 🔍 Verificación Adicional

Si después de reactivar el proyecto sigue fallando:

### Verificar Network Restrictions

1. Ve a Supabase Dashboard → Tu proyecto → **Settings** → **Database**
2. Busca la sección **"Network Restrictions"**
3. Verifica que:
   - No haya restricciones que bloqueen a Render
   - O que la IP de Render esté en la lista de permitidas
   - Para pruebas, puedes permitir todas las IPs temporalmente

### Verificar Variables de Entorno en Render

1. Ve a Render Dashboard → Tu servicio backend → **Environment**
2. Verifica que estas variables estén configuradas:
   - `DATABASE_URL`: Debe usar Session Pooler (`pooler.supabase.com:5432`)
   - `DIRECT_URL`: Debe usar Session Pooler también
   - Ambas deben incluir `?sslmode=require`

**Formato correcto:**
```
DATABASE_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require
DIRECT_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require
```

## ⚠️ Alternativa Temporal: Transaction Pooler

Si Session Pooler no funciona después de reactivar, puedes usar Transaction Pooler temporalmente:

1. Ve a Supabase Dashboard → Settings → Database → Connection Pooling
2. Selecciona **"Transaction Pooler"** (puerto 6543)
3. Copia la URL y agrega `?sslmode=require&pgbouncer=true` al final
4. Usa esa URL para ambas variables (`DATABASE_URL` y `DIRECT_URL`) en Render

**⚠️ Nota:** Transaction Pooler es menos ideal que Session Pooler para Render, pero puede funcionar como solución temporal.

## 📚 Documentación Completa

Para más detalles y soluciones avanzadas, consulta:
- `docs/06-GUIAS/TROUBLESHOOTING/SOLUCION_ERRORES_CONEXION_SUPABASE.md`

## 🎯 Prevención Futura

Para evitar que el proyecto se pause:

1. **Usar el proyecto regularmente**: Los proyectos gratuitos se pausan después de 7 días de inactividad
2. **Implementar keep-alive**: Puedes crear un endpoint que haga una consulta simple cada 6 días
3. **Actualizar a plan de pago**: Los planes de pago no se pausan automáticamente

## ✅ Checklist de Verificación

Antes de hacer deploy, verifica:

- [ ] Proyecto de Supabase está **Active** (verde) en el dashboard
- [ ] No hay restricciones de red que bloqueen a Render
- [ ] `DATABASE_URL` y `DIRECT_URL` están configuradas correctamente
- [ ] Ambas URLs usan Session Pooler (`pooler.supabase.com:5432`)
- [ ] Ambas URLs incluyen `?sslmode=require`

