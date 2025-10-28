# 🗂️ Estructura del Proyecto REFORMA

## 📁 Organización General

```
REFORMA/
├── backend/                          # Backend API
│   ├── docs/                         # Documentación del backend
│   │   ├── api/                      # Documentación de API
│   │   ├── arquitectura/             # Arquitectura del sistema
│   │   ├── tests/                    # Documentación de tests
│   │   ├── deployment/               # Guías de despliegue
│   │   ├── negocio/                  # Reglas de negocio
│   │   └── README.md                 # Índice de documentación
│   ├── src/                          # Código fuente
│   │   ├── __tests__/                # Tests
│   │   ├── controllers/              # Controladores
│   │   ├── services/                 # Servicios
│   │   ├── routes/                   # Rutas
│   │   ├── middleware/               # Middleware
│   │   └── validators/               # Validadores
│   ├── prisma/                       # Schema de base de datos
│   └── README.md
│
├── frontend/                         # Frontend Next.js
│   ├── src/                          # Código fuente
│   │   ├── app/                      # App Router de Next.js
│   │   ├── components/               # Componentes React
│   │   ├── hooks/                    # Custom hooks
│   │   ├── lib/                      # Utilidades
│   │   └── types/                    # TypeScript types
│   └── public/                       # Assets estáticos
│
├── docs/                             # Documentación general
│   └── raiz/                         # Documentación de proyecto
│       ├── ESTADO_PROYECTO.md
│       ├── PLAN_TRABAJO_FRONTEND.md
│       ├── README_BACKEND.md
│       ├── GUIA_FIGMA.md
│       └── README.md
│
├── .gitflow.md                      # Estrategia de Git
├── .gitignore                       # Archivos ignorados
└── README.md                        # Documentación principal
```

## 📚 Documentación Organizada

### Backend (`backend/docs/`)
- **api/** - Documentación de endpoints
- **arquitectura/** - Estructura del sistema
- **tests/** - Documentación de tests
- **deployment/** - Guías de despliegue
- **negocio/** - Reglas de negocio

### General (`docs/raiz/`)
- **ESTADO_PROYECTO.md** - Estado actual
- **PLAN_TRABAJO_FRONTEND.md** - Plan de trabajo
- **README_BACKEND.md** - Guía del backend
- **GUIA_FIGMA.md** - Guía para Figma

## 🎯 Convenciones

- Cada módulo tiene su `README.md`
- Documentación en formato Markdown
- Tests en carpetas `__tests__/`
- Configuración en archivos raíz de cada módulo

---

**Última actualización:** 2024-10-27

