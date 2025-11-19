# 🔐 CREDENCIALES DE USUARIOS

## ✅ USUARIOS CREADOS EXITOSAMENTE

### 🧑‍💼 USUARIO CLIENTE
- **Email:** valentinoargentinocba@gmail.com
- **Contraseña:** 123456
- **Tipo:** CLIENTE
- **Plan:** PLAN_0 (Gratis - 1 granja, 10 registros por tabla)

---

### 👨‍💼 USUARIO ADMINISTRADOR
- **Email:** valentinosegatti@gmail.com
- **Contraseña:** 123456
- **Tipo:** ADMINISTRADOR
- **Plan:** PLAN_4 (200 registros por tabla, múltiples granjas)

---

## 🚀 CÓMO PROBAR

### **1. Abrir la aplicación:**
http://localhost:3001/login

### **2. Iniciar sesión:**

#### Como CLIENTE:
```
Email: valentinoargentinocba@gmail.com
Password: 123456
```
✅ **Permisos:** Gestión de sus propios datos

#### Como ADMINISTRADOR:
```
Email: valentinosegatti@gmail.com
Password: 123456
```
✅ **Permisos:** Acceso a todo el sistema, gestión de usuarios

---

## 🔄 CÓMO CAMBIAR LAS CONTRASEÑAS

Si deseas cambiar las contraseñas, puedes:

### Opción 1: Desde la interfaz web
1. Iniciar sesión
2. Ir al perfil
3. Cambiar contraseña (cuando implementes esta funcionalidad)

### Opción 2: Modificar el script
Edita `backend/scripts/crear-usuarios.ts` y cambia:
```typescript
const passwordHash = await bcrypt.hash('TU_NUEVA_CONTRASEÑA', 10);
```
Luego ejecuta: `npm run crear-usuarios`

---

## 📊 DIFERENCIAS ENTRE TIPOS DE USUARIO

| Característica | CLIENTE | ADMINISTRADOR |
|---|---|---|
| Ver sus propias granjas | ✅ | ✅ |
| Crear granjas | ✅ (según plan) | ✅ |
| Gestionar inventario | ✅ | ✅ |
| Ver todos los usuarios | ❌ | ✅ |
| Gestionar suscripciones | ❌ | ✅ |
| Acceso a dashboard admin | ❌ | ✅ |

---

## ⚠️ NOTA IMPORTANTE

**Estas contraseñas son temporales.** 

Recomendaciones:
- Cambiar las contraseñas después del primer acceso
- Usar contraseñas más seguras en producción
- No compartir estas credenciales públicamente

---

**¡Listo para probar!** 🎉

