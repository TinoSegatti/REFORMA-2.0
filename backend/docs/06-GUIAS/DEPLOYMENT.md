# 🚀 Guía de Deploy - Reforma

## 📁 Estructura del Repositorio (Recomendada)

```
REFORMA/
├── backend/          # Backend API (desplegar en Render)
├── frontend/         # Frontend Next.js (desplegar en Vercel)
├── README.md         # Documentación principal
└── .gitignore        # Archivos a ignorar
```

## ✅ Recomendación: Un Solo Repositorio

**Ventajas:**
- ✅ Un solo repositorio para mantener sincronizados backend y frontend
- ✅ Deploys independientes en cada plataforma
- ✅ Facilita el monorepo y futuras mejoras
- ✅ Control de versiones centralizado

## 🎯 Pasos para Subir a GitHub

### 1. Preparar el Repositorio

```bash
# En la raíz del proyecto
cd /c/PROYECTOS/REFORMA/DESARROLLO/REFORMA

# Inicializar Git (si no lo has hecho)
git init

# Agregar todos los archivos
git add .

# Commit inicial
git commit -m "Initial commit: Backend y Frontend de Sistema Reforma"

# Conectar con GitHub
git remote add origin https://github.com/TU-USUARIO/reforma.git

# Subir todo
git push -u origin master
```

### 2. Actualizar .gitignore

```gitignore
# Dependencias
node_modules/
package-lock.json

# Backend
backend/.env
backend/dist/
backend/prisma/migrations/

# Frontend
frontend/.env
frontend/.next/
frontend/out/
frontend/dist/

# Build output
dist/
build/

# Logs
*.log

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
```

## 🔧 Configuración de Deploy

### Backend en Render

1. **Conectar Repositorio:**
   - Ve a https://render.com
   - New → Web Service
   - Conecta tu repositorio de GitHub
   - Selecciona el branch (master/main)

2. **Configuración:**
   - **Name:** reforma-backend
   - **Root Directory:** `backend`
   - **Environment:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Port:** 3000

3. **Variables de Entorno:**
   ```env
   DATABASE_URL=postgresql://...
   DIRECT_URL=postgresql://...
   JWT_SECRET=tu-secret
   JWT_EXPIRATION=24h
   PORT=3000
   NODE_ENV=production
   FRONTEND_URL=https://tu-app.vercel.app
   ```

4. **PostgreSQL en Render:**
   - New → PostgreSQL
   - Copia la Connection String
   - Úsala en DATABASE_URL y DIRECT_URL

### Frontend en Vercel

1. **Conectar Repositorio:**
   - Ve a https://vercel.com
   - Import Project
   - Conecta tu repositorio de GitHub
   - Selecciona el branch

2. **Configuración:**
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

3. **Variables de Entorno:**
   ```env
   NEXT_PUBLIC_API_URL=https://reforma-backend.onrender.com
   NEXT_PUBLIC_SUPABASE_URL=https://tguajsxchwtnliueokwy.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   ```

## 🔗 Configuración CORS

En `backend/src/index.ts`:

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));
```

## 📊 Ventajas de este Enfoque

### ✅ Organización
- Un solo repositorio para todo
- Separación clara de backend/frontend
- Fácil de navegar y mantener

### ✅ Deploys Independientes
- Vercel despliega automáticamente el frontend
- Render despliega automáticamente el backend
- Cada uno tiene su propio CI/CD

### ✅ Escalabilidad
- Puedes agregar más servicios (admin panel, mobile, etc.)
- Mantiene todo en un solo lugar
- Facilita el monorepo en el futuro

### ✅ Desarrollo Local
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## ⚠️ Alternativa NO Recomendada: Repositorios Separados

Si separas en dos repositorios, tendrías:
- ❌ Más complejidad para mantener
- ❌ Versionado desincronizado
- ❌ Más trabajo para sincronizar cambios
- ❌ Dificulta el desarrollo coordinado

## 🎯 Flujo de Trabajo Recomendado

1. **Desarrollo Local:**
   ```bash
   # Backend en puerto 3000
   cd backend && npm run dev
   
   # Frontend en puerto 3001
   cd frontend && npm run dev
   ```

2. **Subir Cambios:**
   ```bash
   git add .
   git commit -m "Descripción de cambios"
   git push origin master
   ```

3. **Deploy Automático:**
   - Vercel detecta cambios en `frontend/`
   - Render detecta cambios en `backend/`
   - Ambos deployan automáticamente

## 📝 Estructura Final del Proyecto

```
REFORMA/ (Repositorio GitHub)
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── docs/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   ├── public/
│   ├── .env.example
│   └── package.json
├── README.md
└── .gitignore
```

## 🚀 Comandos de Deploy

### Render (Backend)
- Detecta automáticamente cambios en `backend/`
- Ejecuta `npm run build` y `npm start`
- Escucha en el puerto asignado

### Vercel (Frontend)
- Detecta automáticamente cambios en `frontend/`
- Ejecuta `npm run build`
- Sirve los archivos estáticos

## ✅ Checklist de Deploy

- [ ] Repositorio configurado en GitHub
- [ ] `.gitignore` actualizado
- [ ] Backend conectado a Render
- [ ] Frontend conectado a Vercel
- [ ] Variables de entorno configuradas
- [ ] CORS configurado correctamente
- [ ] Base de datos PostgreSQL funcionando
- [ ] Prisma migrations aplicadas
- [ ] URLs de producción actualizadas
- [ ] Tests pasando

## 🎉 Resultado Final

- **Frontend:** https://reforma.vercel.app
- **Backend:** https://reforma-backend.onrender.com
- **Base de Datos:** PostgreSQL en Render/Supabase
- **Todas las actualizaciones se depliegan automáticamente**

