# 🎯 LÉEME PRIMERO - REFORMA

## ✅ ÚLTIMOS CAMBIOS

- ✅ Archivos duplicados eliminados (`src/` de la raíz)
- ✅ `.env` movido a `backend/.env`
- ✅ Estructura limpia: solo `backend/` y `frontend/`

---

## 🚀 INICIO RÁPIDO

### **1. Levantar Backend (Terminal 1)**

```bash
cd backend
npm run dev
```

Espera a ver: `✓ Server running on http://localhost:3000`

### **2. Levantar Frontend (Terminal 2)**

```bash
cd frontend  
npm run dev
```

Espera a ver: `✓ Ready` con `Local: http://localhost:3001`

### **3. Abrir Navegador**

- **Login:** http://localhost:3001/login
- **Dashboard:** http://localhost:3001/dashboard

---

## 📋 INTEGRACIÓN COMPLETADA

### **Archivos creados:**

✅ `frontend/src/lib/api.ts` - Cliente API  
✅ `frontend/src/lib/auth.ts` - Utilidades de autenticación  
✅ `frontend/src/app/(auth)/login/page.tsx` - Login integrado  
✅ `frontend/src/app/dashboard/page.tsx` - Dashboard integrado

### **Funcionalidades:**

✅ Login con email/password  
✅ Registro de nuevos usuarios  
✅ Protección de rutas con auth  
✅ Persistencia de sesión en localStorage  
✅ Redirección automática según auth

---

## 🧪 CÓMO PROBAR

### **1. Registrar un Usuario**

1. Abre http://localhost:3001/login
2. Tab "Registrarse"
3. Llenar:
   - Nombre: Test User
   - Apellido: Test
   - Email: test@test.com
   - Password: 123456
4. Click "Registrarse"
5. ✅ Redirige a Dashboard

### **2. Iniciar Sesión**

1. Tab "Iniciar Sesión"
2. Email: test@test.com
3. Password: 123456
4. Click "Iniciar Sesión"
5. ✅ Redirige a Dashboard

### **3. Ver Dashboard**

- KPIs con datos mock  
- Botones de acciones rápidas  
- Logout funciona

---

## 🌐 BACKEND ENDPOINTS

### **Health Check**
```
GET http://localhost:3000/health
```

### **Registro**
```
POST http://localhost:3000/api/usuarios/registro
Body: {
  "email": "test@test.com",
  "password": "123456",
  "nombreUsuario": "Test",
  "apellidoUsuario": "User"
}
```

### **Login**
```
POST http://localhost:3000/api/usuarios/login
Body: {
  "email": "test@test.com",
  "password": "123456"
}
```

---

## ✅ TODO LISTO PARA PROBAR

**Ahora puedes:**

1. ✅ Levantar ambos servidores (comandos arriba)
2. ✅ Probar registro de usuarios  
3. ✅ Probar login
4. ✅ Ver dashboard
5. ✅ Verificar autenticación
6. ⏳ Completar formularios de CRUD
7. ⏳ Agregar gráficos
8. ⏳ Integrar todas las funcionalidades

---

**¡Adelante, prueba la app!** 🎉

