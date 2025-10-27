# Estructura del Proyecto Reforma

## 📁 Organización de Carpetas

```
PROYECTO/
├── backend/              # Backend API (Node.js + Express + Prisma)
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── constants/    # Constantes (planes, etc.)
│   │   ├── config/       # Configuración (DB, etc.)
│   │   ├── controllers/  # Controladores (pendiente)
│   │   ├── lib/         # Librerías (Prisma)
│   │   ├── middleware/  # Middlewares (auth, validación)
│   │   ├── models/      # Modelos (pendiente)
│   │   ├── routes/       # Rutas (pendiente)
│   │   ├── services/    # Servicios de negocio
│   │   ├── types/       # Tipos TypeScript
│   │   ├── utils/       # Utilidades
│   │   ├── validators/  # Validadores Zod
│   │   └── index.ts     # Punto de entrada
│   ├── docs/            # Documentación
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── src/                  # Frontend (Next.js + React)
│   ├── app/             # App Router
│   ├── components/       # Componentes React
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Librerías
│   ├── types/           # Tipos TypeScript
│   └── styles/          # Estilos
├── prisma/              # [DEPRECADO - mover a backend]
└── public/              # Assets estáticos
```

## ✅ Backend - Estado Actual

### Archivos Completados:

#### **Configuración Base**
- ✅ `backend/prisma/schema.prisma` - Esquema completo de BD
- ✅ `backend/src/index.ts` - Servidor Express
- ✅ `backend/package.json` - Dependencias configuradas
- ✅ `backend/tsconfig.json` - Configuración TypeScript
- ✅ `backend/.gitignore` - Archivos ignorados
- ✅ `backend/src/lib/prisma.ts` - Cliente Prisma

#### **Middlewares**
- ✅ `backend/src/middleware/authMiddleware.ts` - Autenticación JWT
- ✅ `backend/src/middleware/validatePlanLimits.ts` - Validación de límites

#### **Constantes**
- ✅ `backend/src/constants/planes.ts` - Definición de planes

#### **Servicios de Negocio**
- ✅ `backend/src/services/inventarioService.ts` - Lógica de inventario
- ✅ `backend/src/services/formulaService.ts` - Lógica de fórmulas
- ✅ `backend/src/services/compraService.ts` - Lógica de compras

#### **Documentación**
- ✅ `backend/docs/SISTEMA_INVENTARIO.md` - Sistema de inventario
- ✅ `backend/docs/PREGUNTAS_Y_RESPUESTAS.md` - Preguntas y respuestas
- ✅ `backend/README.md` - Documentación principal

### 📋 Pendiente por Implementar:

1. **Controladores** (`backend/src/controllers/`)
   - `authController.ts` - Login, registro, Google OAuth
   - `usuarioController.ts` - Gestión de usuarios
   - `granjaController.ts` - CRUD de granjas
   - `inventarioController.ts` - Gestión de inventario
   - `formulaController.ts` - Gestión de fórmulas
   - `compraController.ts` - Gestión de compras
   - `fabricacionController.ts` - Gestión de fabricaciones

2. **Rutas** (`backend/src/routes/`)
   - `auth.ts` - Rutas de autenticación
   - `usuarios.ts` - Rutas de usuarios
   - `granjas.ts` - Rutas de granjas
   - `inventario.ts` - Rutas de inventario
   - `formulas.ts` - Rutas de fórmulas
   - `compras.ts` - Rutas de compras
   - `fabricaciones.ts` - Rutas de fabricaciones

3. **Validadores Zod** (`backend/src/validators/`)
   - Esquemas de validación para todas las entradas

4. **Tipos TypeScript** (`backend/src/types/`)
   - Interfaces para todas las entidades
   - Tipos para requests y responses

5. **Sistema de Archivos**
   - Servicio de archivado de datos históricos
   - Controller y rutas para archivos

## 🎯 Próximos Pasos Sugeridos

### 1. Completar Controladores y Rutas
```bash
# Crear estructura de controladores
touch backend/src/controllers/{auth,usuario,granja,inventario,formula,compra,fabricacion}Controller.ts

# Crear estructura de rutas
touch backend/src/routes/{auth,usuarios,granjas,inventario,formulas,compras,fabricaciones}.ts
```

### 2. Implementar Autenticación Completa
- Login con email/password
- Login con Google OAuth
- Registro de usuarios
- Recuperación de contraseña

### 3. Implementar Validadores Zod
- Esquemas para cada entidad
- Middleware de validación

### 4. Sistema de Importación entre Granjas
- Servicio de importación
- Validación de permisos
- Copia de datos (solo lectura)

### 5. Pruebas
- Unitarias de servicios
- Integración de rutas
- E2E críticos

## 🔧 Comandos de Desarrollo

### Backend
```bash
cd backend

# Instalar dependencias
npm install

# Generar cliente Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Iniciar en desarrollo
npm run dev

# Abrir Prisma Studio
npm run prisma:studio
```

### Frontend (Cuando se implemente)
```bash
# Instalar dependencias
npm install

# Iniciar en desarrollo
npm run dev

# Construir para producción
npm run build
npm start
```

## 📊 Base de Datos

### Modelos Principales

1. **Usuario** (`t_usuarios`)
   - CLIENTE/ADMINISTRADOR
   - Planes de suscripción
   - Autenticación

2. **Granja** (`t_granja`)
   - Pertenece a un usuario
   - Gestión independiente de datos

3. **Materia Prima** (`t_materia_prima`)
   - Precio por kilo
   - Código y nombre

4. **Inventario** (`t_inventario`)
   - Cálculos automáticos
   - Cantidad real manual

5. **Fórmula** (`t_formula_cabecera` + `t_formula_detalle`)
   - Compuesta por materias primas
   - Recalculo automático de costos

6. **Fabricación** (`t_fabricacion` + `t_detalle_fabricacion`)
   - Basada en fórmula
   - Afecta inventario

7. **Compra** (`t_compra_cabecera` + `t_compra_detalle`)
   - Actualiza precios
   - Actualiza inventario

## 🔐 Seguridad

- ✅ Autenticación JWT
- ✅ Middleware de autorización
- ✅ Validación de ownership
- ⏳ Validación de límites de plan
- ⏳ Rate limiting
- ⏳ CORS configurado

## 📦 Planes de Suscripción

| Plan | Granjas | Registros/Tabla | Precio |
|------|---------|-----------------|--------|
| PLAN_0 | 1 | 10 | Gratis |
| PLAN_1 | 1 | 50 | TBD |
| PLAN_2 | 1 | 50 | TBD |
| PLAN_3 | 1 | 100 | TBD |
| PLAN_4 | 1 | 200 | TBD |

## 🚀 Despliegue

### Backend (Render/Railway/Heroku)
- Puerto: 3000
- Base de datos: PostgreSQL (Supabase)
- Variables de entorno configuradas

### Frontend (Vercel)
- Next.js App Router
- API Routes si es necesario
- Optimizaciones de build

### Base de Datos (Supabase)
- PostgreSQL
- Prisma ORM
- Conexión segura


