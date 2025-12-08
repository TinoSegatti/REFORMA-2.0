# Verificación: Backend y Frontend Conectados

## ✅ Variables de Entorno Configuradas Correctamente

**Vercel (Frontend):**
- ✅ `NEXT_PUBLIC_API_URL`: `https://reforma-2-0.onrender.com`
- ✅ `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Configurado

**Render (Backend):**
- ✅ `DATABASE_URL`: Configurado
- ✅ `DIRECT_URL`: Configurado

## 🔍 Pasos de Verificación

### Paso 1: Verificar que el Backend Está Funcionando

1. Accede directamente al health check del backend:
   ```
   https://reforma-2-0.onrender.com/health
   ```

2. **Respuesta esperada:**
   ```json
   {
     "status": "OK",
     "timestamp": "2025-12-08T...",
     "environment": "production",
     "database": {
       "status": "connected",
       "message": "Database is reachable"
     }
   }
   ```

3. **Si responde `"status": "DEGRADED"`:**
   - El backend está funcionando pero **NO puede conectarse a la base de datos**
   - Ve al Paso 3

### Paso 2: Verificar que el Frontend Puede Llamar al Backend

1. Abre la aplicación frontend en el navegador
2. Abre **Developer Tools** (F12)
3. Ve a la pestaña **Network**
4. Intenta iniciar sesión o cargar datos
5. Busca peticiones que fallen (aparecen en rojo)

**Verifica:**
- ✅ Las peticiones van a `https://reforma-2-0.onrender.com/api/...`
- ❌ Si aparecen errores de CORS (CORS policy blocked)
- ❌ Si aparecen errores 503 (Service Unavailable)
- ❌ Si aparecen errores 500 (Internal Server Error)

### Paso 3: Verificar Logs del Backend en Render

1. Ve a **Render Dashboard** → Tu servicio backend → **Logs**
2. Busca errores relacionados con:
   - `P1001` - No puede alcanzar el servidor de base de datos
   - `P1000` - Error de autenticación
   - `CORS` - Problemas de CORS
   - Cualquier error relacionado con Prisma o PostgreSQL

### Paso 4: Verificar CORS en el Backend

El backend debe tener CORS configurado para permitir peticiones desde Vercel.

**Verifica en `backend/src/index.ts`:**
```typescript
app.use(cors());
```

Esto debería permitir todas las peticiones. Si necesitas restringir, asegúrate de incluir el dominio de Vercel.

### Paso 5: Probar Endpoint Específico

Puedes probar directamente un endpoint del backend:

```bash
# Ejemplo: Health check
curl https://reforma-2-0.onrender.com/health

# Ejemplo: Login (necesitas credenciales válidas)
curl -X POST https://reforma-2-0.onrender.com/api/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tu-email@ejemplo.com","password":"tu-password"}'
```

## 🔧 Soluciones Comunes

### Problema 1: Backend No Puede Conectarse a la Base de Datos

**Síntoma:** Health check retorna `"status": "DEGRADED"`

**Solución:**
1. Verifica que el proyecto de Supabase esté **Active** (verde)
2. Verifica Network Restrictions en Supabase (debe permitir todas las IPs)
3. Verifica que `DATABASE_URL` y `DIRECT_URL` estén correctamente configuradas en Render
4. Revisa los logs de Render para errores específicos

**Guía completa:** `docs/06-GUIAS/TROUBLESHOOTING/DIAGNOSTICO_RUNTIME_SIN_DATOS.md`

### Problema 2: Error de CORS

**Síntoma:** En el navegador aparece: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Solución:**
1. Verifica que el backend tenga `app.use(cors())` configurado
2. Si necesitas restringir CORS, asegúrate de incluir el dominio de Vercel:
   ```typescript
   app.use(cors({
     origin: [
       'https://tu-app.vercel.app',
       'https://tu-dominio.com'
     ]
   }));
   ```

### Problema 3: Backend Está Caído

**Síntoma:** No responde ninguna petición (timeout o 503)

**Solución:**
1. Ve a Render Dashboard → Tu servicio backend
2. Verifica que el estado sea **"Live"** (verde)
3. Si está en estado de error, revisa los logs
4. Haz un redeploy si es necesario

### Problema 4: Las Peticiones Van a localhost

**Síntoma:** En Network del navegador, las peticiones van a `http://localhost:3000`

**Solución:**
1. Verifica que `NEXT_PUBLIC_API_URL` esté configurada en Vercel
2. Haz un **Redeploy** completo del frontend (no solo un nuevo commit)
3. Espera a que el build termine completamente
4. Limpia la caché del navegador (Ctrl+Shift+R o Cmd+Shift+R)

## 📋 Checklist de Verificación

Antes de reportar el problema, verifica:

- [ ] Health check del backend (`/health`) responde correctamente
- [ ] Health check muestra `"database": { "status": "connected" }`
- [ ] El servicio backend está **Live** en Render
- [ ] `NEXT_PUBLIC_API_URL` está configurada en Vercel
- [ ] Las peticiones del frontend van a la URL correcta del backend
- [ ] No hay errores de CORS en el navegador
- [ ] Revisaste los logs de Render para errores específicos
- [ ] El proyecto de Supabase está **Active** (verde)
- [ ] Network Restrictions permiten todas las IPs

## 🚨 Si el Problema Persiste

Comparte esta información:

1. **Respuesta del health check:**
   - Accede a `https://reforma-2-0.onrender.com/health`
   - Copia la respuesta completa

2. **Errores en el navegador:**
   - Abre Developer Tools (F12) → Console
   - Copia cualquier error que aparezca

3. **Peticiones fallidas:**
   - Abre Developer Tools (F12) → Network
   - Intenta cargar datos
   - Haz clic en las peticiones que fallen (aparecen en rojo)
   - Copia el error que aparece

4. **Logs del backend:**
   - Ve a Render Dashboard → Logs
   - Copia los últimos logs, especialmente cuando intentas cargar datos

## 📚 Referencias

- [Verificación de Backend](docs/06-GUIAS/TROUBLESHOOTING/DIAGNOSTICO_RUNTIME_SIN_DATOS.md)
- [Configuración de Frontend](docs/06-GUIAS/CONFIGURACION/CONFIGURACION_FRONTEND_VERCEL.md)
- [Solución Permanente P1001](docs/06-GUIAS/TROUBLESHOOTING/SOLUCION_PERMANENTE_P1001.md)

