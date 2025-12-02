# 🔧 Troubleshooting: Error de Conexión a Base de Datos en Render

## ❌ Error: "Can't reach database server at `aws-1-us-east-2.pooler.supabase.com:5432`"

Este error indica que Render no puede conectarse al servidor de Supabase. Sigue estos pasos en orden:

---

## ✅ Paso 1: Verificar que el Proyecto de Supabase esté Activo

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. **Verifica el estado:**
   - ✅ Si está **activo** → Continúa al Paso 2
   - ⚠️ Si está **pausado** → Haz clic en "Resume" o "Restore" para reactivarlo
   - ⏳ Espera 1-2 minutos después de reactivar antes de probar la conexión

**Nota:** Los proyectos gratuitos de Supabase se pausan automáticamente después de 7 días de inactividad.

---

## ✅ Paso 2: Verificar y Corregir la Contraseña en la URL

### Problema Común: Caracteres Especiales en la Contraseña

Si tu contraseña contiene caracteres especiales (como `.`, `+`, `@`, `#`, etc.), debes codificarlos usando **URL encoding**.

### Tu Contraseña: `DataBase2025.`

El punto (`.`) al final puede causar problemas. Aunque normalmente no necesita codificación, si hay problemas de conexión, prueba codificarlo.

### Cómo Codificar la Contraseña:

1. **Opción A: Usar una herramienta online**
   - Ve a https://www.urlencoder.org/
   - Pega tu contraseña: `DataBase2025.`
   - Haz clic en "Encode"
   - Copia el resultado

2. **Opción B: Codificación Manual**
   - `.` → `%2E` (solo si causa problemas)
   - `+` → `%2B`
   - `@` → `%40`
   - `#` → `%23`
   - `/` → `%2F`
   - `:` → `%3A`
   - `?` → `%3F`
   - `&` → `%26`
   - `=` → `%3D`

### Ejemplo con tu Contraseña:

**URL Original:**
```
postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require
```

**URL con Contraseña Codificada (si es necesario):**
```
postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025%2E@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require
```

**⚠️ IMPORTANTE:** Prueba primero con la contraseña sin codificar. Solo codifica si sigue sin funcionar.

---

## ✅ Paso 3: Obtener la URL Correcta desde Supabase Dashboard

1. Ve a **Supabase Dashboard** → Tu Proyecto → **Settings** → **Database**
2. Haz clic en la pestaña **"Connection Pooling"**
3. Selecciona **"Session Pooler"** (NO Transaction Pooler)
4. Copia la URL que muestra (formato: `postgresql://postgres.[PROJECT]:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres`)
5. **IMPORTANTE:** Agrega `?sslmode=require` al final si no lo tiene

### Formato Esperado:

```
postgresql://postgres.tguajsxchwtnliueokwy:TU_PASSWORD@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require
```

---

## ✅ Paso 4: Configurar Variables en Render

1. Ve a **Render Dashboard** → Tu Servicio → **Environment**
2. Busca `DATABASE_URL` y `DIRECT_URL`
3. **Elimina ambas variables** (si existen)
4. **Agrega nuevamente:**

   **DATABASE_URL:**
   ```
   postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require
   ```

   **DIRECT_URL:**
   ```
   postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require
   ```

5. **Verifica que:**
   - ✅ No haya espacios al inicio o final
   - ✅ No haya saltos de línea
   - ✅ La contraseña esté correcta
   - ✅ Ambas URLs sean idénticas
   - ✅ Ambas incluyan `?sslmode=require`

6. Haz clic en **"Save Changes"**

---

## ✅ Paso 5: Verificar Restricciones de Red en Supabase

1. Ve a **Supabase Dashboard** → Tu Proyecto → **Settings** → **Database**
2. Busca la sección **"Network Restrictions"** o **"IP Allowlist"**
3. **Si hay restricciones activas:**
   - Opción A: **Deshabilítalas temporalmente** para probar
   - Opción B: **Agrega la IP de Render** (puede ser difícil porque Render usa IPs dinámicas)
4. **Recomendación:** Deshabilita las restricciones si no las necesitas

---

## ✅ Paso 6: Verificar la Región del Pooler

1. Ve a **Supabase Dashboard** → Tu Proyecto → **Settings** → **Database** → **Connection Pooling**
2. Verifica que el host del pooler coincida con tu región:
   - **us-east-2** → `aws-1-us-east-2.pooler.supabase.com`
   - **us-east-1** → `aws-0-us-east-1.pooler.supabase.com`
   - **Otra región** → Verifica en Supabase Dashboard

3. **Si tu proyecto está en otra región**, actualiza las URLs en Render con el host correcto

---

## ✅ Paso 7: Probar Conexión desde tu Máquina Local

Para verificar que la URL funciona:

1. Crea un archivo `test-connection.js` en tu proyecto:

```javascript
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require'
});

client.connect()
  .then(() => {
    console.log('✅ Conexión exitosa!');
    return client.query('SELECT NOW()');
  })
  .then((result) => {
    console.log('✅ Query exitosa:', result.rows[0]);
    client.end();
  })
  .catch((err) => {
    console.error('❌ Error de conexión:', err.message);
    client.end();
  });
```

2. Ejecuta:
```bash
npm install pg
node test-connection.js
```

3. **Si funciona localmente pero no en Render:**
   - El problema es específico de Render (red/firewall)
   - Verifica restricciones de red en Supabase
   - Contacta al soporte de Render si persiste

4. **Si no funciona ni localmente:**
   - Verifica que el proyecto esté activo
   - Verifica la contraseña
   - Verifica el formato de la URL

---

## ✅ Paso 8: Verificar Logs de Render

1. Ve a **Render Dashboard** → Tu Servicio → **Logs**
2. Busca mensajes relacionados con:
   - `DATABASE_URL`
   - `prisma`
   - `connection`
   - `timeout`
3. Los logs pueden mostrar errores más específicos

---

## ✅ Paso 9: Redeploy en Render

Después de cambiar las variables de entorno:

1. Ve a **Render Dashboard** → Tu Servicio → **Manual Deploy**
2. Haz clic en **"Deploy latest commit"**
3. Espera a que termine el deploy
4. Verifica los logs para ver si la conexión funciona

---

## 🔍 Diagnóstico Adicional

### Verificar Variables de Entorno en Render

1. Ve a **Render Dashboard** → Tu Servicio → **Environment**
2. Verifica que `DATABASE_URL` y `DIRECT_URL` estén configuradas
3. **Haz clic en el icono de "ojo"** para ver los valores (ocultos por seguridad)
4. Verifica que:
   - ✅ No haya espacios extra
   - ✅ La contraseña esté correcta
   - ✅ El formato sea correcto

### Verificar que Prisma Pueda Leer las Variables

Agrega temporalmente un log en tu código para verificar:

```typescript
// En backend/src/index.ts o donde inicialices Prisma
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada' : 'NO CONFIGURADA');
console.log('DIRECT_URL:', process.env.DIRECT_URL ? 'Configurada' : 'NO CONFIGURADA');
```

---

## 📋 Checklist Final

Antes de contactar soporte, verifica:

- [ ] Proyecto de Supabase está activo (no pausado)
- [ ] Variables `DATABASE_URL` y `DIRECT_URL` están configuradas en Render
- [ ] Ambas URLs son idénticas y usan Session Pooler (puerto 5432)
- [ ] Ambas URLs incluyen `?sslmode=require`
- [ ] No hay espacios o caracteres extra en las URLs
- [ ] La contraseña está correcta
- [ ] No hay restricciones de red activas en Supabase
- [ ] La región del pooler es correcta
- [ ] Se hizo redeploy después de cambiar las variables

---

## 🆘 Si Nada Funciona

1. **Verifica el estado de Supabase:**
   - Ve a https://status.supabase.com
   - Verifica si hay problemas conocidos

2. **Contacta Soporte de Supabase:**
   - Ve a Supabase Dashboard → Support
   - Explica el problema y proporciona:
     - Tu project ID
     - El error exacto
     - Las URLs que estás usando (sin la contraseña)

3. **Contacta Soporte de Render:**
   - Ve a Render Dashboard → Support
   - Explica el problema y proporciona:
     - El error exacto
     - Los logs relevantes

---

## 💡 Soluciones Alternativas

### Opción 1: Cambiar la Contraseña de la Base de Datos

Si la contraseña con caracteres especiales causa problemas:

1. Ve a **Supabase Dashboard** → **Settings** → **Database**
2. Haz clic en **"Reset Database Password"**
3. Genera una nueva contraseña **sin caracteres especiales** (solo letras y números)
4. Actualiza las URLs en Render con la nueva contraseña

### Opción 2: Usar Transaction Pooler (NO recomendado para Render)

Solo si Session Pooler no funciona:

1. Usa Transaction Pooler (puerto 6543)
2. El código ya está configurado para detectarlo automáticamente
3. **Desventaja:** Menos eficiente y puede causar problemas con prepared statements

---

## 📚 Referencias

- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Render Environment Variables](https://render.com/docs/environment-variables)
- [Prisma Connection Management](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)

