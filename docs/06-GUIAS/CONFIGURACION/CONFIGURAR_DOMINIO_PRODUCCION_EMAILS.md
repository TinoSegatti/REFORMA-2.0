# 🔧 Configurar Dominio de Producción para Emails

## 🎯 Problema

Los links de verificación de email pueden estar usando el dominio de preview de Vercel (ej: `reforma-2-0-git-master-tinosegattis-projects.vercel.app`) en lugar del dominio de producción (`reforma-2-0.vercel.app`).

## ✅ Solución Automática

El código ahora detecta automáticamente si `FRONTEND_URL` contiene un preview de Vercel y lo convierte al dominio de producción:

- **Preview detectado:** `reforma-2-0-git-master-tinosegattis-projects.vercel.app`
- **Convertido a:** `reforma-2-0.vercel.app`

## 🔧 Solución Manual (Recomendada)

Para asegurar que siempre se use el dominio correcto, puedes configurar una variable específica de producción:

### En Render (Backend)

1. Ve a **Render Dashboard** → Tu servicio backend → **Environment**
2. Agrega una nueva variable:
   - **Key:** `FRONTEND_PRODUCTION_URL`
   - **Value:** `https://reforma-2-0.vercel.app`
3. **Guarda** y haz redeploy

### Variables de Entorno

```bash
# Variable para producción (prioridad máxima)
FRONTEND_PRODUCTION_URL=https://reforma-2-0.vercel.app

# Variable general (se usa si FRONTEND_PRODUCTION_URL no existe)
FRONTEND_URL=https://reforma-2-0.vercel.app
```

## 📋 Verificación

Después de configurar, verifica que los emails de verificación usen el dominio correcto:

1. Registra un nuevo usuario
2. Revisa el email de verificación
3. El link debe ser: `https://reforma-2-0.vercel.app/verificar-email?token=...`

## 🔍 Cómo Funciona

El código usa la siguiente prioridad:

1. **`FRONTEND_PRODUCTION_URL`** (si existe) - Usado directamente
2. **`FRONTEND_URL`** con detección automática de previews
3. **Default:** `http://localhost:3001` (solo desarrollo)

Si `FRONTEND_URL` contiene `-git-` y `.vercel.app`, automáticamente se extrae el nombre base del proyecto y se construye el dominio de producción.

## 📚 Referencias

- [Corregir FRONTEND_URL en Render](./CORREGIR_FRONTEND_URL_RENDER.md)
- [Configuración Definitiva para Render](./CONFIGURACION_DEFINITIVA_RENDER.md)

