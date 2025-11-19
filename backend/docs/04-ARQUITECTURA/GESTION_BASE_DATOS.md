# 📊 Gestión de Base de Datos - Sistema Reforma

## 🗄️ Configuración Actual

Tu proyecto usa **PostgreSQL** como base de datos, gestionada a través de **Prisma ORM**.

### Configuración

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## 📍 OPCIONES: Dónde Alojar tu Base de Datos

### 1. **Supabase (Recomendado - GRATIS)** ⭐

**¿Qué es?**
- Servicio gratuito de PostgreSQL en la nube
- 500 MB de base de datos gratis
- Panel de administración visual
- Mismo que Vercel usa para sus proyectos

**Ventajas:**
- ✅ Totalmente gratuito para empezar
- ✅ Panel web para ver los datos
- ✅ No necesitas instalar nada
- ✅ Backups automáticos
- ✅ Ideal para desarrollo y producción

**Pasos para configurarlo:**

1. Ve a https://supabase.com
2. Crea una cuenta (gratis)
3. Crea un nuevo proyecto
4. Copia la **Connection String** (DATABASE_URL)
5. Agrégala a `backend/.env`

**Para ver tus datos:**
- Abre el proyecto en Supabase
- Ve a "Table Editor"
- Visualiza todas tus tablas y datos

---

### 2. **Base de Datos Local (PostgreSQL Local)**

**¿Cuándo usarla?**
- Si quieres trabajar offline
- Si necesitas privacidad total
- Para desarrollo local

**Pasos para configurarla:**

1. Instala PostgreSQL:
   - Windows: https://www.postgresql.org/download/windows/
   - macOS: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql`

2. Crea una base de datos:
```bash
psql -U postgres
CREATE DATABASE reforma;
\q
```

3. Configura el `.env`:
```env
DATABASE_URL="postgresql://postgres:tu-password@localhost:5432/reforma?schema=public"
```

**Para ver tus datos:**
- Usa **pgAdmin** (instalador incluido con PostgreSQL)
- O usa **DBeaver** (gratuito y multiplataforma)
- O usa **Prisma Studio** (incluido en el proyecto)

---

### 3. **Railway (También GRATIS)**

**¿Qué es?**
- Plataforma de hosting que incluye PostgreSQL
- 500 MB gratis
- Fácil de usar

**Ventajas:**
- ✅ Mismo hosting para backend y base de datos
- ✅ Fácil de configurar
- ✅ Panel visual

---

## 🎯 PRISMA STUDIO - Visualizador GRATIS (Incluido)

No necesitas instalar nada adicional. Prisma viene con su propio visualizador.

### ¿Cómo usarlo?

```bash
# Ir a la carpeta backend
cd backend

# Ejecutar Prisma Studio
npm run prisma:studio
```

Esto abrirá una interfaz web en `http://localhost:5555` donde podrás:
- ✅ Ver todas tus tablas
- ✅ Editar datos manualmente
- ✅ Agregar registros
- ✅ Eliminar datos
- ✅ Ver relaciones entre tablas

**¡Es la forma más fácil de visualizar tu base de datos!**

## 📝 Pasos para Configurar tu Base de Datos

### Opción 1: Usando Supabase (RECOMENDADO)

1. **Crear cuenta en Supabase**
   ```
   https://supabase.com → Sign Up (gratis)
   ```

2. **Crear nuevo proyecto**
   - Nombra tu proyecto: `reforma`
   - Elige una región cercana
   - Crea el proyecto

3. **Obtener la Connection String**
   - Ve a Project Settings → Database
   - Copia la **Connection String** (modo URI)

4. **Configurar en el proyecto**
   ```bash
   cd backend
   # Si no existe, crea el archivo .env
   # Edita el archivo .env y agrega:
   DATABASE_URL="postgresql://postgres:[TU-PASSWORD]@[TU-HOST]:5432/postgres"
   ```

5. **Ejecutar migraciones**
   ```bash
   npm run prisma:migrate
   ```

6. **¡Listo! Ahora puedes:**
   - Ver tus datos en Supabase Table Editor
   - O usar Prisma Studio: `npm run prisma:studio`

---

### Opción 2: PostgreSQL Local

1. **Instalar PostgreSQL**
   - Descarga: https://www.postgresql.org/download/windows/
   - Instala con valores por defecto

2. **Crear base de datos**
   ```bash
   psql -U postgres
   CREATE DATABASE reforma;
   \q
   ```

3. **Configurar `.env`**
   ```env
   DATABASE_URL="postgresql://postgres:tu-password@localhost:5432/reforma?schema=public"
   ```

4. **Ejecutar migraciones**
   ```bash
   cd backend
   npm run prisma:migrate
   ```

5. **Ver tus datos**
   - Descarga pgAdmin: https://www.pgadmin.org/
   - O usa Prisma Studio: `npm run prisma:studio`

---

## 🎨 Herramientas para Visualizar tu Base de Datos

### 1. **Prisma Studio** (Recomendado - Ya está en tu proyecto)
```bash
cd backend
npm run prisma:studio
```
- ✅ Interfaz web bonita
- ✅ No necesitas instalar nada
- ✅ Ver todas las tablas
- ✅ Editar datos directamente

### 2. **pgAdmin** (Para PostgreSQL local)
- Descarga: https://www.pgadmin.org/
- Herramienta oficial de PostgreSQL
- Muy completa pero más compleja

### 3. **DBeaver** (Multiplataforma)
- Descarga: https://dbeaver.io/
- Gratis y multiplataforma
- Funciona con cualquier base de datos

### 4. **Supabase Table Editor** (Solo si usas Supabase)
- Panel web integrado
- Acceso desde el navegador
- Muy intuitivo

---

## 📋 Comandos Útiles

```bash
# Ir a la carpeta backend
cd backend

# Ver todas las tablas en una interfaz visual (MÁS FÁCIL)
npm run prisma:studio

# Ver la estructura de la base de datos
npm run prisma:generate

# Crear una nueva migración
npm run prisma:migrate

# Ver el estado de las migraciones
npx prisma migrate status

# Resetear la base de datos (CUIDADO: borra todo)
npx prisma migrate reset
```

---

## 🔐 Variables de Entorno

Crea un archivo `backend/.env`:

```env
# Base de datos
DATABASE_URL="postgresql://usuario:password@host:5432/database?schema=public"

# Servidor
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET="tu-secret-key-super-segura-aqui"
JWT_EXPIRATION="24h"

# Google OAuth (opcional)
GOOGLE_CLIENT_ID="tu-google-client-id"
GOOGLE_CLIENT_SECRET="tu-google-client-secret"
```

---

## ❓ Preguntas Frecuentes

### ¿Necesito instalar PostgreSQL en mi computadora?
**NO.** Puedes usar Supabase que es gratuito y funciona desde la nube.

### ¿Cómo veo mis datos sin instalar nada?
1. Usa **Prisma Studio**: `npm run prisma:studio`
2. O usa **Supabase Table Editor** si usas Supabase

### ¿Dónde está mi base de datos?
Si usas Supabase: Está en la nube
Si usas PostgreSQL local: Está en tu computadora

### ¿Es gratis?
- **Supabase**: 500 MB gratis (suficiente para empezar)
- **PostgreSQL local**: Completamente gratis
- **Railway**: 500 MB gratis

### ¿Qué recomendación me das?
**Para empezar**: Usa Supabase
- No necesitas instalar nada
- Tiene panel web
- Fácil de usar
- Gratis
- Puedes cambiarte después

---

## 🎯 RESUMEN RÁPIDO

### Para VER tus datos (MÁS FÁCIL):
```bash
cd backend
npm run prisma:studio
```
Abre tu navegador en `http://localhost:5555`

### Para CONFIGURAR tu base de datos:
1. Crea cuenta en Supabase (https://supabase.com)
2. Copia la DATABASE_URL
3. Agrégala a `backend/.env`
4. Ejecuta: `npm run prisma:migrate`

¡Y listo! 🎉

