# 🔍 Diagnóstico de Conexión a Supabase

## Problema
```
Can't reach database server at db.tguajsxchwtnliueokwy.supabase.co:5432
```

## ✅ Información que Necesitamos

### 1. ¿Qué Contraseña Estás Usando?
Tu `.env` actual tiene: `SupaBase1234+`

**Verifica**: ¿Es esa la contraseña REAL de tu proyecto en Supabase?

### 2. Cómo Obtener la Contraseña Correcta

En Supabase Dashboard:
1. Ve a **Settings** → **Database**
2. Busca la sección **"Connection string"**
3. Reemplaza `[YOUR-PASSWORD]` con tu contraseña REAL
4. Copia la URL COMPLETA

### 3. Posibles Causas del Error

#### ❌ Contraseña Incorrecta
**Síntoma**: Error P1000 o P1001
**Solución**: Actualiza el `.env` con la contraseña correcta

#### ❌ Firewall de Supabase Bloqueando tu IP
**Síntoma**: Can't reach database server
**Solución**: 
- Ve a **Settings** → **Database** → **Network Restrictions**
- Agrega tu IP actual o permite "0.0.0.0/0" (solo para desarrollo)

#### ❌ Proyecto Pausado
**Síntoma**: Cannot connect
**Solución**: Unpause el proyecto desde el dashboard

#### ❌ URL Incorrecta
**Síntoma**: DNS lookup failure
**Solución**: Usa la URL exacta del dashboard

### 4. Prueba Rápida con Supabase CLI

Si tienes Supabase CLI instalado:

```bash
supabase projects list
```

Esto mostrará tus proyectos y su estado.

### 5. Prueba desde Supabase Dashboard

1. Ve a **Settings** → **Database**
2. Busca **"Database URLs"**
3. Haz clic en **"Test connection"**
4. Si funciona desde ahí, el problema está en tu configuración local

## 📝 Pasos para Solucionar

### Paso 1: Verifica tu Contraseña
```bash
# Desde el dashboard de Supabase, copia la conexión string EXACTA
# que incluye tu contraseña real
```

### Paso 2: Actualiza el .env
```bash
cd backend
# Edita .env y reemplaza DATABASE_URL con la URL COMPLETA del dashboard
```

### Paso 3: Prueba la Conexión
```bash
node test-connection.js
```

### Paso 4: Verifica Firewall
- Ve a Supabase Dashboard
- Settings → Database → Network Restrictions
- Asegúrate de que tu IP esté permitida

### Paso 5: Si Nada Funciona
- Verifica que el proyecto NO esté pausado
- Crea un nuevo proyecto en Supabase
- Usa la nueva conexión string
- Re-ejecuta las migraciones

## 🆘 Información de Debug que Necesito

Por favor comparte:
1. ✅ Tu contraseña de Supabase (la que te muestran en el dashboard)
2. ✅ Si ves algún mensaje de "paused" en el dashboard
3. ✅ Si el botón "Test connection" funciona en el dashboard
4. ✅ Si hay reglas de firewall configuradas
5. ✅ La URL EXACTA que te muestra Supabase (sin reemplazar [YOUR-PASSWORD])

