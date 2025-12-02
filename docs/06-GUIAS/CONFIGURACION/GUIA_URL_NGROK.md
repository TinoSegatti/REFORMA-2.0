# 🔄 Guía: Manejo de URL de ngrok

## ⚠️ IMPORTANTE: La URL Cambia Cada Vez que Reinicias ngrok

**En la versión gratuita de ngrok**, cada vez que cierras y vuelves a abrir ngrok, obtienes una **nueva URL aleatoria**.

**Ejemplo:**
- Primera vez: `https://abc123-def456.ngrok-free.dev`
- Segunda vez: `https://xyz789-ghi012.ngrok-free.dev`
- Tercera vez: `https://unmerciful-ossie-fluent.ngrok-free.dev` ← **Tu URL actual**

---

## ✅ Solución: Usar Variable de Entorno `NGROK_URL`

**NO necesitas modificar el código cada vez.** En su lugar, configura la URL en `backend/.env`:

### Paso 1: Crear/Actualizar `backend/.env`

```bash
# En backend/.env, agrega:
NGROK_URL=https://unmerciful-ossie-fluent.ngrok-free.dev
```

### Paso 2: El Código Usará Automáticamente Esta URL

El código en `backend/src/services/mercadoPagoService.ts` ya está configurado para usar `NGROK_URL`:

```typescript
const ngrokUrl = process.env.NGROK_URL || 'https://unmerciful-ossie-fluent.ngrok-free.dev';
```

**Esto significa:**
- ✅ Si `NGROK_URL` existe en `.env`, usa esa URL
- ✅ Si no existe, usa la URL por defecto (fallback)

---

## 🔄 Proceso Cuando Cambia la URL de ngrok

### Cuando Reinicias ngrok y Obtienes una Nueva URL:

1. **Copia la nueva URL** de la terminal de ngrok:
   ```
   Forwarding: https://nueva-url.ngrok-free.dev -> http://localhost:3000
   ```

2. **Actualiza `backend/.env`:**
   ```env
   NGROK_URL=https://nueva-url.ngrok-free.dev
   ```

3. **Reinicia el servidor backend** para que cargue la nueva variable:
   ```bash
   # Detén el servidor (Ctrl+C)
   # Vuelve a iniciarlo
   npm run dev
   ```

4. **Actualiza los Webhooks Externos:**
   - **Twilio Console**: Actualiza el webhook a `https://nueva-url.ngrok-free.dev/api/corina/whatsapp/webhook`
   - **Mercado Pago**: Actualiza el webhook a `https://nueva-url.ngrok-free.dev/api/suscripcion/webhook/mercadopago`

---

## 📋 Checklist Cuando Reinicias ngrok

- [ ] Copiar la nueva URL de ngrok
- [ ] Actualizar `NGROK_URL` en `backend/.env`
- [ ] Reiniciar el servidor backend
- [ ] Actualizar webhook en Twilio Console
- [ ] Actualizar webhook en Mercado Pago

---

## 🎯 URL Actual Configurada

**URL actual:** `https://unmerciful-ossie-fluent.ngrok-free.dev`

**Estado:**
- ✅ Configurada en código (fallback)
- ⚠️ **Recomendado**: Agregar a `backend/.env` como `NGROK_URL`

---

## 💡 Mejores Prácticas

### 1. Usar Variable de Entorno (Recomendado)

```env
# backend/.env
NGROK_URL=https://unmerciful-ossie-fluent.ngrok-free.dev
```

**Ventajas:**
- ✅ No necesitas modificar código
- ✅ Fácil de actualizar
- ✅ No se sube a Git (si `.env` está en `.gitignore`)

### 2. Mantener ngrok Corriendo

**Si es posible, evita cerrar ngrok** mientras desarrollas:
- ✅ Mantén ngrok corriendo en una terminal separada
- ✅ Minimiza la terminal (no la cierres)
- ✅ Usa `Ctrl+C` solo cuando termines de trabajar

### 3. Usar Dominio Reservado (Pago)

Si necesitas una URL fija, considera:
- **ngrok cuenta de pago**: Permite dominios reservados
- **Servidor con dominio propio**: Para producción

---

## 🔗 Archivos Relacionados

- `backend/src/services/mercadoPagoService.ts` - Usa `NGROK_URL`
- `backend/.env` - Configuración de `NGROK_URL` (crear si no existe)
- `docs/06-GUIAS/CONFIGURACION/IMPACTO_PAUSAR_NGROK.md` - Impacto de pausar ngrok
- `docs/06-GUIAS/CONFIGURACION/ACTUALIZACION_NGROK.md` - Guía de actualización

---

## ❓ Preguntas Frecuentes

### ¿La URL se mantiene hasta el 17/12/2025?

**NO.** La fecha del 17/12/2025 es sobre la **versión del cliente de ngrok**, no sobre la URL.

**La URL cambia cada vez que reinicias ngrok** (versión gratuita).

### ¿Debo modificar el código cada vez?

**NO.** Usa la variable de entorno `NGROK_URL` en `backend/.env`.

### ¿Cómo sé cuál es mi URL actual?

1. Mira la terminal donde corre ngrok
2. Busca la línea "Forwarding"
3. Copia la URL HTTPS

### ¿Puedo mantener la misma URL?

**Solo con:**
- ✅ Cuenta de pago de ngrok (dominio reservado)
- ✅ Servidor con dominio propio (producción)

---

## 📝 Nota Final

**La URL actual en el código (`https://unmerciful-ossie-fluent.ngrok-free.dev`) es solo un fallback.**

**Para evitar problemas, configura `NGROK_URL` en `backend/.env`.**



