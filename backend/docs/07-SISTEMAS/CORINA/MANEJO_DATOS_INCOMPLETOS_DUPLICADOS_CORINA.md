# 📋 Manejo de Datos Incompletos y Duplicados en CORINA

**Fecha:** 2025-11-22  
**Estado:** ✅ Implementado  
**Archivo:** `backend/src/services/corinaService.ts`

---

## 🎯 Objetivo

Implementar lógica para que CORINA maneje correctamente:
1. **Datos incompletos**: Solicitar campos faltantes de forma amigable
2. **Datos duplicados**: Informar sobre duplicados y solicitar corrección

---

## ✅ Funcionalidad Implementada

### Función `validarDatos()`

**Ubicación:** `backend/src/services/corinaService.ts`

**Descripción:**
- Valida datos extraídos antes de crear un registro
- Detecta campos faltantes según el tipo de registro
- Verifica duplicados de códigos en la base de datos
- Retorna información detallada sobre errores y campos faltantes

**Retorno:**
```typescript
{
  esValido: boolean;
  camposFaltantes?: string[];
  errores?: string[];
  mensajeError?: string;
}
```

---

## 📊 Validaciones por Tipo de Registro

### 1. Materia Prima

**Campos Requeridos:**
- `codigoMateriaPrima` (código de materia prima)
- `nombreMateriaPrima` (nombre de materia prima)

**Validaciones:**
- ✅ Verifica que ambos campos existan
- ✅ Verifica que el código no esté duplicado en la granja

**Mensaje de Error Ejemplo:**
```
Faltan los siguientes datos: código de materia prima, nombre de materia prima.
Ya existe una materia prima con el código "MAIZ001". Por favor, usa un código diferente.
```

---

### 2. Proveedor

**Campos Requeridos:**
- `codigoProveedor` (código de proveedor)
- `nombreProveedor` (nombre del proveedor)

**Campos Opcionales:**
- `direccion` (dirección)
- `localidad` (localidad)

**Validaciones:**
- ✅ Verifica que código y nombre existan
- ✅ Verifica que el código no esté duplicado en la granja

**Mensaje de Error Ejemplo:**
```
Faltan los siguientes datos: código de proveedor.
Ya existe un proveedor con el código "PROV001". Por favor, usa un código diferente.
```

---

### 3. Animal/Pienso

**Campos Requeridos:**
- `codigoAnimal` (código de animal/pienso)
- `descripcionAnimal` (descripción del animal/pienso)
- `categoriaAnimal` (categoría del animal/pienso)

**Validaciones:**
- ✅ Verifica que los tres campos existan
- ✅ Verifica que el código no esté duplicado en la granja

**Mensaje de Error Ejemplo:**
```
Faltan los siguientes datos: categoría del animal/pienso.
Ya existe un animal/pienso con el código "CERDO001". Por favor, usa un código diferente.
```

---

### 4. Fórmula

**Campos Requeridos:**
- `codigoFormula` (código de fórmula)
- `descripcionFormula` (descripción de la fórmula)
- `idAnimal` (animal/pienso para la fórmula)
- `detalles` (array con materias primas y cantidades)

**Validaciones de Detalles:**
- ✅ Verifica que haya al menos un detalle
- ✅ Cada detalle debe tener `idMateriaPrima` y `cantidadKg`
- ✅ Verifica que el código no esté duplicado en la granja

**Mensaje de Error Ejemplo:**
```
Faltan los siguientes datos: detalles de la fórmula (materias primas y cantidades), materia prima en el detalle 1.
Ya existe una fórmula con el código "FORM001". Por favor, usa un código diferente.
```

---

### 5. Compra

**Campos Requeridos:**
- `idProveedor` (proveedor)
- `fechaCompra` (fecha de compra)
- `detalles` (array con materias primas, cantidades y precios)

**Campos Opcionales:**
- `numeroFactura` (número de factura)

**Validaciones de Detalles:**
- ✅ Verifica que haya al menos un detalle
- ✅ Cada detalle debe tener `idMateriaPrima`, `cantidadComprada` y `precioUnitario`

**Mensaje de Error Ejemplo:**
```
Faltan los siguientes datos: detalles de la compra (materias primas, cantidades y precios), precio unitario para el detalle 1.
```

---

### 6. Fabricación

**Campos Requeridos:**
- `idFormula` (fórmula a fabricar)
- `descripcionFabricacion` (descripción de la fabricación)
- `cantidadFabricacion` (cantidad a fabricar)
- `fechaFabricacion` (fecha de fabricación)

**Mensaje de Error Ejemplo:**
```
Faltan los siguientes datos: cantidad a fabricar, fecha de fabricación.
```

---

## 💬 Función `generarMensajeSolicitudDatos()`

**Ubicación:** `backend/src/services/corinaService.ts`

**Descripción:**
- Genera mensajes amigables solicitando datos faltantes
- Incluye ejemplos de cómo proporcionar los datos
- Lista específicamente los campos faltantes

**Ejemplo de Mensaje Generado:**

```
📝 CORINA

Para crear un materia prima, necesito los siguientes datos:

• Código de materia prima (ej: MAIZ001)
• Nombre de la materia prima (ej: Maíz)

Ejemplo: "Crear materia prima maíz con código MAIZ001"

⚠️ Faltan los siguientes datos:
1. código de materia prima
2. nombre de materia prima

Por favor, proporciona estos datos para continuar.
```

---

## 🔄 Flujo de Manejo de Datos Incompletos/Duplicados

### Escenario 1: Datos Incompletos

1. **Usuario envía mensaje:** "Crear materia prima maíz"
2. **CORINA extrae datos:** `{ nombreMateriaPrima: "maíz" }` (falta código)
3. **CORINA valida:** Detecta que falta `codigoMateriaPrima`
4. **CORINA responde:** Mensaje solicitando el código faltante
5. **Usuario envía:** "El código es MAIZ001"
6. **CORINA valida:** Datos completos ✅
7. **CORINA crea registro:** Materia prima creada exitosamente

### Escenario 2: Datos Duplicados

1. **Usuario envía mensaje:** "Crear materia prima maíz con código MAIZ001"
2. **CORINA extrae datos:** `{ codigoMateriaPrima: "MAIZ001", nombreMateriaPrima: "maíz" }`
3. **CORINA valida:** Detecta que el código ya existe
4. **CORINA responde:** "Ya existe una materia prima con el código 'MAIZ001'. Por favor, usa un código diferente."
5. **Usuario envía:** "Entonces usa MAIZ002"
6. **CORINA valida:** Código único ✅
7. **CORINA crea registro:** Materia prima creada exitosamente

---

## 📝 Integración con el Controlador

**Próximo Paso:** Integrar esta validación en el flujo de creación de registros en `corinaController.ts`:

```typescript
// 1. Extraer datos
const datosExtraidos = await CorinaService.extraerDatos(mensaje, tipoComando);

// 2. Validar datos
const validacion = await CorinaService.validarDatos(datosExtraidos, idGranja);

if (!validacion.esValido) {
  // 3. Si hay errores, enviar mensaje solicitando corrección
  const mensaje = CorinaService.generarMensajeSolicitudDatos(
    datosExtraidos.tablaDestino,
    validacion.camposFaltantes || []
  );
  
  if (validacion.errores && validacion.errores.length > 0) {
    mensaje += '\n\n' + validacion.errores.join('\n');
  }
  
  await CorinaNotificacionService.enviarMensajeWhatsApp(from, mensaje);
  return; // Esperar respuesta del usuario
}

// 4. Si es válido, proceder con la creación
const registro = await CorinaService.crearRegistro(datosExtraidos, idUsuario, idGranja);
```

---

## ✅ Estado Actual

- ✅ **Validación de campos requeridos** implementada
- ✅ **Validación de duplicados** implementada
- ✅ **Generación de mensajes amigables** implementada
- ⏳ **Integración con flujo conversacional** pendiente (Fase 2.7)
- ⏳ **Manejo de estado de interacción** pendiente (Fase 2.7)

---

## 🧪 Testing

Los tests unitarios en `corinaService.test.ts` verifican:
- ✅ Detección de campos faltantes
- ✅ Detección de códigos duplicados
- ✅ Generación de mensajes de error

---

**Documento creado:** 2025-11-22  
**Última actualización:** 2025-11-22






