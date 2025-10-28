# 🚀 Guía de Inicio Rápido - REFORMA

## 📋 Resumen Recomendado

**✅ COMENZAR EN LOCALHOST**

Es mucho más práctico probar en localhost porque:
- 🔧 Cambios instantáneos (hot reload)
- 🐛 Debug más fácil
- ⚡ Más rápido
- 💰 Gratis (no usa recursos de deploy)
- 🔄 Puedes hacer rollback inmediato

**Deploy a producción SOLO cuando:**
- Ya todo funcione correctamente
- Necesites probar el sistema completo
- Quieras compartir con otros usuarios

---

## 🏃 Inicio Rápido (2 Terminals)

### Terminal 1 - Backend:
```bash
cd backend
npm run dev
```
✅ Backend en: http://localhost:3000

### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```
✅ Frontend en: http://localhost:3001

---

## 🌐 Páginas Disponibles

Una vez que ambos servidores estén corriendo:

- **Login:** http://localhost:3001/login
- **Dashboard:** http://localhost:3001/dashboard
- **Componentes:** http://localhost:3001/

---

## 📱 Responsive

La app es responsive:
- **Mobile:** < 768px
- **Tablet:** 768px - 1024px  
- **Desktop:** > 1024px

---

## 🔧 Configuración Necesaria

### Backend:
```env
# backend/.env
DATABASE_URL="tu-connection-string-de-supabase"
DIRECT_URL="tu-direct-url-de-supabase"
JWT_SECRET="tu-secret"
JWT_EXPIRATION="24h"
PORT=3000
NODE_ENV=development
```

### Frontend:
```env
# frontend/.env.local (YA CREADO)
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## 📦 Estado Actual

### ✅ Completado:
- Backend con todos los endpoints
- Frontend con componentes base
- Estilos retro/vintage
- Login página
- Dashboard con sidebar
- Componentes responsive
- CSS de Figma implementado

### ⏳ Pendiente:
- Integración completa con backend
- Autenticación funcional
- Gráficos en dashboard
- Formularios de compras
- CRUD completo de todas las entidades

---

## 🎯 Próximos Pasos

1. **Probar en localhost** - Ver todo funcionando
2. **Completar componentes** - Según capturas de Figma
3. **Integrar backend** - Conectar endpoints
4. **Testear completamente** - Verificar flujo completo
5. **Deploy cuando esté listo** - Render + Vercel

---

## 🐛 Troubleshooting

### Backend no inicia:
```bash
cd backend
npm install
npm run prisma:generate
npm run dev
```

### Frontend no inicia:
```bash
cd frontend
npm install
npm run dev
```

### Puerto ocupado:
- Backend usa puerto 3000
- Si está ocupado, cambiar en `backend/.env`
- Frontend usa el siguiente puerto disponible

---

**¡Todo listo para probar en localhost!** 🎉

