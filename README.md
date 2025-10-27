# 🐷 Reforma - Sistema de Gestión de Granjas

Sistema completo para gestión de granjas con control de inventario, compras, fabricación y fórmulas de alimentación.

## 🏗️ Arquitectura

```
REFORMA/
├── backend/          # API REST (Node.js + Express + Prisma + PostgreSQL)
├── frontend/         # Web App (Next.js + React + TypeScript)
└── README.md
```

## 🚀 Inicio Rápido

### Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Generar cliente Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Iniciar servidor
npm run dev
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor
npm run dev
```

## 📊 Características

- ✅ Gestión de usuarios (CLIENTE/ADMINISTRADOR)
- ✅ Planes de suscripción configurables
- ✅ Gestión de granjas por usuario
- ✅ Control de inventario automático
- ✅ Gestión de materias primas y precios
- ✅ Proveedores y compras
- ✅ Fórmulas de alimentación
- ✅ Fabricaciones basadas en fórmulas
- ✅ Sistema de auditoría
- ✅ Importación entre granjas

## 🎯 Planes de Suscripción

| Plan | Granjas | Registros/Tabla | Precio |
|------|---------|-----------------|--------|
| PLAN_0 | 1 | 10 | Gratis |
| PLAN_1 | 1 | 50 | - |
| PLAN_2 | 1 | 50 | - |
| PLAN_3 | 1 | 100 | - |
| PLAN_4 | 1 | 200 | - |

## 📁 Documentación

- [Backend - README](./backend/README.md)
- [Sistema de Inventario](./backend/docs/SISTEMA_INVENTARIO.md)
- [Rutas API](./backend/docs/RUTAS_API.md)
- [Guía de Deploy](./backend/DEPLOYMENT.md)

## 🛠️ Stack Tecnológico

**Backend:**
- Node.js + Express
- Prisma ORM
- PostgreSQL (Supabase)
- JWT + OAuth
- TypeScript
- Jest (Testing)

**Frontend:**
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Chakra UI
- TanStack Query

## 🧪 Testing

```bash
cd backend
npm test
```

## 🚀 Deploy

### En Producción
- **Frontend:** Vercel
- **Backend:** Render
- **Base de Datos:** PostgreSQL en Render/Supabase

Ver [Guía de Deploy](./backend/DEPLOYMENT.md)

## 📝 Scripts

### Backend
- `npm run dev` - Desarrollo
- `npm run build` - Compilar
- `npm run start` - Producción
- `npm run test` - Testing

### Frontend
- `npm run dev` - Desarrollo
- `npm run build` - Compilar
- `npm run start` - Producción

## 📞 Soporte

Para más información, consulta la documentación en `/backend/docs/`
