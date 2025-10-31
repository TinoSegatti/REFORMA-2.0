# 🚀 INICIO RÁPIDO - REFORMA

## ✅ COMPLETADO

### Archivos corregidos:
- ✅ `src/` duplicado eliminado de la raíz
- ✅ `.env` movido a `backend/.env` 
- ✅ Estructura limpia: solo `backend/` y `frontend/`

---

## 🚀 LEVANTAR LOS SERVIDORES

### **PASO 1: Abrir Terminal 1 (Backend)**

```bash
cd C:\PROYECTOS\REFORMA\DESARROLLO\REFORMA\backend
npm run dev
```

**Verás:**
```
✓ Compiled successfully
✓ Server running on http://localhost:3000
```

**✅ NO cierres esta terminal**

---

### **PASO 2: Abrir Terminal 2 (Frontend)**

```bash
cd C:\PROYECTOS\REFORMA\DESARROLLO\REFORMA\frontend
npm run dev
```

**Verás:**
```
✓ Ready in X seconds
  ○ Local: http://localhost:3001
```

**✅ NO cierres esta terminal**

---

## 🌐 PÁGINAS DISPONIBLES

Una vez que ambos servidores estén corriendo:

### **1. Login** 
- URL: http://localhost:3001/login
- Descripción: Página de autenticación

### **2. Dashboard** 
- URL: http://localhost:3001/dashboard  
- Descripción: Panel principal con KPIs

---

## 🧪 PROBAR AUTENTICACIÓN

### Registrar Usuario Nuevo:
1. Ir a: http://localhost:3001/login
2. Click en tab "Registrarse"
3. Llenar:
   - Nombre: `Test User`
   - Apellido: `Test`
   - Email: `test@test.com`
   - Password: `123456`
4. Click "Registrarse"
5. ✅ Debería redirigir a Dashboard

### Login con Usuario Existente:
1. Ir a: http://localhost:3001/login
2. Llenar:
   - Email: `test@test.com`
   - Password: `123456`
3. Click "Iniciar Sesión"
4. ✅ Debería redirigir a Dashboard

---

## 📊 BACKEND ENDPOINTS

Una vez que el backend esté corriendo puedes probar:

### **Health Check**
```bash
curl http://localhost:3000/health
```
**Respuesta esperada:**
```json
{
  "status": "OK",
  "timestamp": "2024-10-27T...",
  "environment": "development"
}
```

### **Registro**
```bash
curl -X POST http://localhost:3000/api/usuarios/registro \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "123456",
    "nombreUsuario": "Test",
    "apellidoUsuario": "User"
  }'
```

### **Login**
```bash
curl -X POST http://localhost:3000/api/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "123456"
  }'
```

---

## 🐛 TROUBLESHOOTING

### "ERR_CONNECTION_REFUSED"
✅ **Solución:** Asegúrate que ambos servidores estén corriendo
```bash
# Backend en Terminal 1
cd backend && npm run dev

# Frontend en Terminal 2  
cd frontend && npm run dev
```

### "Cannot find module"
✅ **Solución:** Instala dependencias
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Puerto ocupado
✅ **Solución:** Cambiar puerto en `backend/.env`
```env
PORT=3001  # o cualquier puerto libre
```

---

## ✅ ESTADO ACTUAL

**Backend:**
- ✅ API REST completa
- ✅ Autenticación JWT
- ✅ Base de datos conectada (Supabase)
- ✅ Endpoints probados
- ✅ Tests implementados

**Frontend:**
- ✅ Componentes UI base
- ✅ Página de Login
- ✅ Dashboard
- ✅ Diseños retro/vintage
- ✅ Responsive design
- ⏳ Integración con backend (en progreso)

---

## 🎯 PRÓXIMOS PASOS

1. **Probar autenticación** → Usar login/registro
2. **Ver Dashboard** → Verificar KPIs y diseño
3. **Probar CRUD** → Agregar granjas, materias primas
4. **Integrar completamente** → Conectar todos los endpoints
5. **Agregar gráficos** → Charts con Recharts

---

**¡Todo listo para probar!** 🎉

