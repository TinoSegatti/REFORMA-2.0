# Solución: Errores de Autenticación en CORINA

## 🔍 Problemas Detectados

### Error 1: OpenAI API Key Inválida

```
AuthenticationError: 401 Incorrect API key provided: sk-proj-********************************************************************************************************************************************************CAMA
```

**Causa:** La API key de OpenAI está incorrecta, truncada o tiene caracteres especiales mal codificados.

### Error 2: Twilio Authentication Error (20003)

```
RestException [Error]: Authenticate
status: 401
code: 20003
```

**Causa:** Las credenciales de Twilio (`TWILIO_ACCOUNT_SID` o `TWILIO_AUTH_TOKEN`) están incorrectas o no están configuradas.

## 🔧 Soluciones

### Solución 1: Corregir OpenAI API Key

#### Paso 1: Obtener Nueva API Key

1. Ve a [OpenAI Platform](https://platform.openai.com/)
2. Inicia sesión en tu cuenta
3. Ve a **API Keys**: https://platform.openai.com/api-keys
4. Haz clic en **"Create new secret key"**
5. **Copia la clave completa** (solo se muestra una vez)
   - Debe empezar con `sk-proj-` o `sk-`
   - Debe tener aproximadamente 51 caracteres
   - **NO debe terminar en "CAMA"** (esto indica que está truncada)

#### Paso 2: Verificar Formato de la API Key

La API key correcta debe:
- ✅ Empezar con `sk-proj-` o `sk-`
- ✅ Tener aproximadamente 51 caracteres después del prefijo
- ✅ No tener espacios al inicio o final
- ✅ No tener saltos de línea
- ✅ Estar completa (no truncada)

**Ejemplo de formato correcto:**
```
sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Paso 3: Configurar en Render

1. Ve a **Render Dashboard** > Tu servicio backend > **Environment**
2. Busca la variable `OPENAI_API_KEY`
3. **Elimina** la variable actual (si existe)
4. Haz clic en **"Add Environment Variable"**
5. Nombre: `OPENAI_API_KEY`
6. Valor: Pega la nueva API key **completa** (sin espacios)
7. Haz clic en **"Save Changes"**
8. Haz **Manual Deploy** del servicio

#### Paso 4: Verificar que se Guardó Correctamente

1. En Render Dashboard, ve a **Environment**
2. Verifica que `OPENAI_API_KEY` esté configurada
3. Haz clic en el icono de "ojo" para ver el valor (debe mostrar la clave completa)
4. Verifica que no tenga espacios al inicio o final

### Solución 2: Corregir Credenciales de Twilio

#### Paso 1: Obtener Credenciales Correctas

1. Ve a [Twilio Console](https://console.twilio.com/)
2. En el dashboard principal, encontrarás:
   - **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Auth Token**: Haz clic en "Show" para verlo (solo se muestra una vez)

#### Paso 2: Verificar Formato

**TWILIO_ACCOUNT_SID:**
- ✅ Debe empezar con `AC`
- ✅ Debe tener 34 caracteres en total
- ✅ No debe tener espacios

**TWILIO_AUTH_TOKEN:**
- ✅ Debe tener 32 caracteres
- ✅ No debe tener espacios al inicio o final
- ✅ Es sensible a mayúsculas/minúsculas

#### Paso 3: Configurar en Render

1. Ve a **Render Dashboard** > Tu servicio backend > **Environment**
2. Verifica estas variables:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_WHATSAPP_NUMBER`
3. Si alguna está incorrecta:
   - Haz clic en la variable
   - Actualiza el valor
   - Haz clic en **"Save Changes"**
4. Haz **Manual Deploy** del servicio

#### Paso 4: Verificar Credenciales

**Verifica que:**
- `TWILIO_ACCOUNT_SID` empiece con `AC` y tenga 34 caracteres
- `TWILIO_AUTH_TOKEN` tenga 32 caracteres (sin espacios)
- `TWILIO_WHATSAPP_NUMBER` tenga el formato: `whatsapp:+14155238886`

### Solución 3: Verificar Variables de Entorno Completas

Asegúrate de tener **todas** estas variables configuradas en Render:

```bash
# OpenAI (OBLIGATORIA)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Twilio (OBLIGATORIAS)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# CORINA (OBLIGATORIA)
CORINA_ENABLED=true
```

## 🚨 Errores Comunes y Soluciones

### Error: "API key termina en CAMA"

**Causa:** La API key está truncada o tiene caracteres especiales mal codificados.

**Solución:**
1. Obtén una nueva API key desde OpenAI Platform
2. Copia la clave **completa** (no debe terminar en "CAMA")
3. Pégala directamente en Render (no la copies desde un documento que pueda truncarla)

### Error: "Twilio Error 20003: Authenticate"

**Causa:** Las credenciales de Twilio están incorrectas o no están configuradas.

**Solución:**
1. Verifica que `TWILIO_ACCOUNT_SID` y `TWILIO_AUTH_TOKEN` estén configuradas
2. Verifica que no tengan espacios al inicio o final
3. Obtén nuevas credenciales desde Twilio Console si es necesario
4. Haz redeploy del servicio después de actualizar

### Error: "Variables de entorno no se actualizan"

**Causa:** Render necesita un redeploy para aplicar cambios en variables de entorno.

**Solución:**
1. Después de cambiar variables de entorno, haz **Manual Deploy**
2. Espera a que el deploy termine
3. Verifica los logs para confirmar que las variables se cargaron correctamente

## 📝 Checklist de Verificación

Antes de probar CORINA, verifica:

- [ ] `OPENAI_API_KEY` está configurada y es válida
- [ ] `OPENAI_API_KEY` tiene el formato correcto (empieza con `sk-proj-` o `sk-`)
- [ ] `OPENAI_API_KEY` no está truncada (no termina en "CAMA")
- [ ] `TWILIO_ACCOUNT_SID` está configurada y empieza con `AC`
- [ ] `TWILIO_AUTH_TOKEN` está configurada y tiene 32 caracteres
- [ ] `TWILIO_WHATSAPP_NUMBER` tiene el formato correcto (`whatsapp:+14155238886`)
- [ ] `CORINA_ENABLED=true` está configurado
- [ ] Se hizo redeploy del servicio después de cambiar variables

## 🔗 Enlaces Útiles

- [OpenAI API Keys](https://platform.openai.com/api-keys)
- [Twilio Console](https://console.twilio.com/)
- [Render Dashboard](https://dashboard.render.com/)

## ⚠️ Notas Importantes

1. **No compartas tus API keys**: Nunca compartas tus credenciales en código público o mensajes
2. **Regenera keys si es necesario**: Si sospechas que una key fue comprometida, regénerala inmediatamente
3. **Verifica después de cambios**: Siempre verifica los logs después de cambiar variables de entorno
4. **Redeploy necesario**: Render requiere redeploy para aplicar cambios en variables de entorno

