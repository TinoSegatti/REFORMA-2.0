# Backend - Sistema de Gestión de Granjas

Sistema backend para gestión de granjas con control de inventario, compras, fabricación y fórmulas.

## 🏗️ Arquitectura

```
backend/
├── prisma/
│   └── schema.prisma          # Esquema de base de datos
├── src/
│   ├── controllers/           # Controladores de rutas
│   ├── services/             # Lógica de negocio
│   ├── models/               # Modelos de datos
│   ├── routes/               # Definición de rutas
│   ├── middleware/           # Middlewares personalizados
│   ├── utils/                # Utilidades
│   ├── config/               # Configuración
│   ├── types/                # Tipos TypeScript
│   ├── validators/           # Validadores de entrada
│   └── lib/                  # Librerías (Prisma, etc)
└── docs/
    └── SISTEMA_INVENTARIO.md  # Documentación del sistema de inventario
```

## 📊 Esquema de Base de Datos

### Tablas Principales

- **t_usuarios**: Gestión de usuarios (cliente/administrador)
- **t_granja**: Granjas de cada usuario
- **t_materia_prima**: Materias primas por granja
- **t_proveedor**: Proveedores por granja
- **t_animal**: Tipos de animales (piensos)
- **t_formula_cabecera**: Fórmulas de alimentación
- **t_formula_detalle**: Detalles de fórmulas
- **t_fabricacion**: Fabricaciones realizadas
- **t_detalle_fabricacion**: Detalles de fabricación
- **t_inventario**: Control de inventario
- **t_compra_cabecera**: Compras realizadas
- **t_compra_detalle**: Detalles de compras
- **t_registro_precio**: Auditoría de cambios de precio
- **t_archivo_cabecera**: Archivos históricos
- **t_archivo_detalle**: Detalles de archivos

## 🔑 Sistema de Inventario

Ver documentación completa en [docs/SISTEMA_INVENTARIO.md](./docs/SISTEMA_INVENTARIO.md)

### Campos calculados automáticamente:

1. **cantidad_acumulada**: Suma total de compras
2. **cantidad_sistema**: Compras - Fabricaciones
3. **cantidad_real**: Carga manual desde granja
4. **merma**: cantidad_sistema - cantidad_real
5. **precio_almacen**: Promedio ponderado de compras
6. **valor_stock**: cantidad_real × precio_almacen

### Flujo de actualización:

- **COMPRA** → Actualiza inventario + precio materia prima + recalcula fórmulas
- **FABRICACIÓN** → Disminuye cantidad_sistema
- **CANTIDAD_REAL** → Carga manual, recalcula merma y valor_stock

## 🚀 Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
# IMPORTANTE: Lee backend/docs/GESTION_BASE_DATOS.md para configurar tu base de datos
# Crea un archivo .env en la carpeta backend con:
# DATABASE_URL="postgresql://..."
# JWT_SECRET="..."
# etc.

# Generar cliente de Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Iniciar en desarrollo
npm run dev

# Iniciar en producción
npm run build
npm start
```

## 🗄️ Configuración de Base de Datos

**¿Tienes PostgreSQL instalado?** **NO es necesario.**

### Opción Recomendada: Supabase (GRATIS)

1. Ve a https://supabase.com
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto
4. Copia la Connection String del proyecto
5. Agrégala a `backend/.env` como `DATABASE_URL`
6. Ejecuta: `npm run prisma:migrate`

**Ver documentación completa**: [`backend/docs/GESTION_BASE_DATOS.md`](./docs/GESTION_BASE_DATOS.md)

### Visualizar tu Base de Datos

**No necesitas instalar nada adicional:**

```bash
# Usa Prisma Studio (incluido en el proyecto)
npm run prisma:studio
```

Abre tu navegador en `http://localhost:5555` y verás todas tus tablas con una interfaz visual.

## 📝 Scripts

- `npm run dev` - Modo desarrollo con hot-reload
- `npm run build` - Compilar TypeScript
- `npm start` - Iniciar en producción
- `npm run prisma:generate` - Generar cliente Prisma
- `npm run prisma:migrate` - Ejecutar migraciones
- `npm run prisma:studio` - Abrir Prisma Studio

## 🔐 Autenticación

- Login con email/password
- Login con Google OAuth
- Roles: CLIENTE, ADMINISTRADOR

## 📋 Planes de Suscripción

- **PLAN_0**: 1 granja, 10 registros/tabla (gratis)
- **PLAN_1**: 1 granja, 50 registros/tabla
- **PLAN_2**: 1 granja, 50 registros/tabla
- **PLAN_3**: 1 granja, 100 registros/tabla
- **PLAN_4**: 1 granja, 200 registros/tabla

## 🎯 Servicios Principales

### inventarioService.ts
- Cálculos automáticos de inventario
- Gestión de cantidad_acumulada, cantidad_sistema, cantidad_real
- Cálculo de merma, precio_almacen, valor_stock

### formulaService.ts
- Crear y actualizar fórmulas
- Recalcular costos automáticamente
- Sincronización con cambios de precio

### compraService.ts
- Registrar compras
- Actualizar precios automáticamente
- Recalcular inventario y fórmulas
- Auditoría de cambios de precio

## 📦 Importación entre Granjas

Cada usuario puede importar datos de sus propias granjas:
- Solo lectura (una vez importado, se puede editar)
- No se actualiza automáticamente
- Sin modificación de granja origen

## 🔍 Auditoría

- Historial completo de cambios de precio
- Registro de todas las compras con precio anterior
- Trazabilidad de fabricaciones
- Sistema de archivos para históricos



