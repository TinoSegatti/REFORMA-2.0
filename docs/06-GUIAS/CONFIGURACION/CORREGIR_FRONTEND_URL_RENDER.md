# 🔧 Corregir FRONTEND_URL en Render

## 🚨 Problema

La variable `FRONTEND_URL` en Render está configurada sin el protocolo `https://`, causando errores al crear sesiones de checkout con Mercado Pago:

```
Error: URL de éxito inválida: reforma-2-0-git-master-tinosegattis-projects.vercel.app/planes/exito
```

## ✅ Solución

### Opción 1: Actualizar Variable en Render (Recomendado)

1. Ve a **Render Dashboard** → Tu servicio backend → **Environment**
2. Busca la variable `FRONTEND_URL`
3. **Edítala** y agrega `https://` al inicio:

**Valor actual (incorrecto):**
```
reforma-2-0-git-master-tinosegattis-projects.vercel.app
```

**Valor correcto:**
```
https://reforma-2-0-git-master-tinosegattis-projects.vercel.app
```

4. **Guarda los cambios**
5. Haz redeploy del servicio

### Opción 2: El Código Ya Lo Corrige Automáticamente

El código ahora normaliza automáticamente las URLs para agregar `https://` si falta el protocolo en producción. Sin embargo, es mejor tener la variable correcta desde el inicio.

## 📋 Verificación

Después de actualizar la variable, verifica en los logs que las URLs estén correctas:

```
[crearCheckout] URLs configuradas - successUrl: https://reforma-2-0-git-master-tinosegattis-projects.vercel.app/planes/exito, cancelUrl: https://reforma-2-0-git-master-tinosegattis-projects.vercel.app/planes?cancelado=true
```

Deberías ver `https://` al inicio de ambas URLs.

## 🔍 Cambios Realizados en el Código

Se creó una utilidad `urlHelper.ts` que:
- ✅ Normaliza URLs automáticamente
- ✅ Agrega `https://` en producción si falta el protocolo
- ✅ Valida que las URLs sean válidas antes de enviarlas a Mercado Pago

Esto asegura que el sistema funcione incluso si la variable no tiene el protocolo, pero es mejor tenerla correcta desde el inicio.

## 📚 Referencias

- [Configuración Definitiva para Render](./CONFIGURACION_DEFINITIVA_RENDER.md)

