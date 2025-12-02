# 🔗 URLs Exactas para Render - Supabase

## ⚠️ IMPORTANTE: Copia estas URLs EXACTAMENTE

### Variables de Entorno en Render

Ve a tu servicio backend en Render → **Environment** y configura estas dos variables:

---

### 1. DATABASE_URL

**Nombre de la variable:** `DATABASE_URL`

**Valor (copia exactamente esto):**
```
postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require
```

---

### 2. DIRECT_URL

**Nombre de la variable:** `DIRECT_URL`

**Valor (copia exactamente esto):**
```
postgresql://postgres.tguajsxchwtnliueokwy:DataBase2025.@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require
```

---

## ✅ Verificación

Después de configurar las variables, verifica que:

1. ✅ Ambas variables tienen exactamente los mismos valores
2. ✅ Ambas incluyen `?sslmode=require` al final
3. ✅ No hay espacios al inicio o final de las URLs
4. ✅ El formato del usuario es `postgres.tguajsxchwtnliueokwy` (con punto)
5. ✅ El host es `aws-1-us-east-2.pooler.supabase.com` (Session Pooler)
6. ✅ El puerto es `5432`

## 🔍 Si el Error Persiste

Si después de configurar estas URLs exactas sigues teniendo el error "Can't reach database server":

1. **Verifica en Supabase Dashboard:**
   - Ve a Settings → Database → Connection Pooling
   - Selecciona "Session Pooler"
   - Copia la URL que aparece
   - Agrega `?sslmode=require` al final
   - Usa esa URL para ambas variables

2. **Verifica que el proyecto esté activo:**
   - En Supabase Dashboard, verifica que el estado sea "Active" (verde)
   - Si está "Paused", haz clic en "Resume"

3. **Verifica restricciones de red:**
   - Ve a Settings → Database → Network Restrictions
   - Debe decir "Your database can be accessed by all IP addresses"
   - Si hay restricciones, deshabilítalas temporalmente

## 📝 Notas

- **Ambas URLs son idénticas** porque Render usa IPv4 y necesita el Session Pooler
- **No uses la conexión directa** (`db.tguajsxchwtnliueokwy.supabase.co`) porque solo funciona con IPv6
- **Siempre incluye** `?sslmode=require` en ambas URLs

