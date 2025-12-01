# 🔧 Normalización de Datos CORINA

**Fecha:** 2025-11-22  
**Estado:** ✅ **COMPLETADA**

---

## 🎯 Objetivo

Implementar un proceso de normalización y validación de datos extraídos antes de crear registros en la base de datos. Este proceso:

1. ✅ Resuelve referencias (nombres/códigos → IDs reales)
2. ✅ Normaliza fechas, cantidades, precios
3. ✅ Completa detalles de compras y fórmulas
4. ✅ Valida que todos los datos necesarios estén presentes

---

## ✅ Funcionalidad Implementada

### Función `normalizarDatos()`

**Ubicación:** `backend/src/services/corinaService.ts`

**Características:**
- ✅ Normaliza datos según el tipo de registro
- ✅ Resuelve referencias a IDs de la base de datos
- ✅ Completa detalles de compras y fórmulas
- ✅ Valida y ajusta cantidades
- ✅ Normaliza fechas y formatos
- ✅ Retorna errores y advertencias

---

## 📋 Procesos de Normalización por Tipo

### 1. Materia Prima

**Normalizaciones:**
- ✅ Nombre: Primera letra mayúscula, resto minúsculas
- ✅ Código: Todo mayúsculas

**Ejemplo:**
```
Input:  { nombreMateriaPrima: "maíz", codigoMateriaPrima: "maiz001" }
Output: { nombreMateriaPrima: "Maíz", codigoMateriaPrima: "MAIZ001" }
```

### 2. Proveedor

**Normalizaciones:**
- ✅ Nombre: Cada palabra con primera letra mayúscula
- ✅ Código: Todo mayúsculas

**Ejemplo:**
```
Input:  { nombreProveedor: "juan pérez", codigoProveedor: "prov001" }
Output: { nombreProveedor: "Juan Pérez", codigoProveedor: "PROV001" }
```

### 3. Animal/Pienso

**Normalizaciones:**
- ✅ Descripción: Cada palabra con primera letra mayúscula
- ✅ Categoría: Primera letra mayúscula
- ✅ Código: Todo mayúsculas

### 4. Fórmula

**Normalizaciones:**
- ✅ Código: Todo mayúsculas
- ✅ Resuelve ID de animal por código o descripción
- ✅ Resuelve IDs de materias primas en detalles
- ✅ Valida que el total sea 1000 kg
- ✅ Ajusta proporcionalmente si el total no es 1000 kg

**Ejemplo:**
```
Input: {
  codigoFormula: "form001",
  idAnimal: "CERDO001",
  detalles: [
    { materiaPrima: "maíz", cantidadKg: 500 },
    { materiaPrima: "soja", cantidadKg: 500 }
  ]
}

Output: {
  codigoFormula: "FORM001",
  idAnimal: "uuid-del-animal",
  detalles: [
    { idMateriaPrima: "uuid-maiz", cantidadKg: 500 },
    { idMateriaPrima: "uuid-soja", cantidadKg: 500 }
  ]
}
```

**Ajuste Automático:**
Si el total no es 1000 kg, se ajusta proporcionalmente:
```
Input:  { detalles: [{ cantidadKg: 400 }, { cantidadKg: 400 }] } // Total: 800 kg
Output: { detalles: [{ cantidadKg: 500 }, { cantidadKg: 500 }] } // Total: 1000 kg
Advertencia: "El total de la fórmula se ajustó a 1000 kg (era 800.00 kg)"
```

### 5. Compra

**Normalizaciones:**
- ✅ Resuelve ID de proveedor por código o nombre
- ✅ Normaliza fecha ("hoy" → fecha actual, "ayer" → fecha de ayer)
- ✅ Resuelve IDs de materias primas en detalles
- ✅ Valida cantidades y precios

**Ejemplo:**
```
Input: {
  idProveedor: "PROV001",
  fechaCompra: "hoy",
  detalles: [
    { materiaPrima: "maíz", cantidadComprada: 100, precioUnitario: 50 }
  ]
}

Output: {
  idProveedor: "uuid-del-proveedor",
  fechaCompra: Date("2025-11-22"),
  detalles: [
    { idMateriaPrima: "uuid-maiz", cantidadComprada: 100, precioUnitario: 50 }
  ]
}
```

### 6. Fabricación

**Normalizaciones:**
- ✅ Resuelve ID de fórmula por código
- ✅ Normaliza cantidad (convierte kg a "veces" si es necesario)
- ✅ Normaliza fecha

**Ejemplo:**
```
Input: {
  idFormula: "FORM001",
  cantidadFabricacion: 2000, // Si es > 100, se convierte a veces
  fechaFabricacion: "hoy"
}

Output: {
  idFormula: "uuid-de-la-formula",
  cantidadFabricacion: 2.0, // Convertido a veces
  fechaFabricacion: Date("2025-11-22")
}
Advertencia: "Cantidad convertida de kg a veces: 2 veces"
```

---

## 🔍 Resolución de Referencias

### Búsqueda por Código o Nombre

La función busca en la base de datos usando:
- **Código** (exacto, mayúsculas)
- **Nombre** (parcial, case-insensitive)

**Ejemplo para Materia Prima:**
```typescript
const materiaPrima = await prisma.materiaPrima.findFirst({
  where: {
    idGranja,
    OR: [
      { codigoMateriaPrima: "MAIZ001" },
      { nombreMateriaPrima: { contains: "maíz", mode: 'insensitive' } }
    ]
  }
});
```

### Manejo de Errores

Si no se encuentra una referencia:
- ✅ Se agrega un error a la lista
- ✅ El proceso continúa para detectar otros errores
- ✅ El usuario recibe todos los errores en un solo mensaje

---

## 📊 Estructura de Retorno

```typescript
{
  datosNormalizados: Record<string, any>, // Datos listos para BD
  errores: string[],                       // Errores encontrados
  advertencias: string[]                   // Advertencias (ajustes realizados)
}
```

---

## 🔄 Integración con Flujo Existente

### Flujo Completo

```
1. Usuario envía mensaje
   ↓
2. detectarTipoComando() → CREAR_FORMULA
   ↓
3. extraerDatos() → { codigoFormula: "form001", detalles: [...] }
   ↓
4. normalizarDatos() → {
     datosNormalizados: { codigoFormula: "FORM001", detalles: [...] },
     errores: [],
     advertencias: ["Total ajustado a 1000 kg"]
   }
   ↓
5. validarDatos() → { esValido: true }
   ↓
6. Mostrar preview al usuario
   ↓
7. [Pendiente] Confirmar y crear registro
```

### En Nuevas Creaciones

Cuando el usuario envía un mensaje de creación:
1. Se extraen los datos
2. Se normalizan los datos
3. Se validan los datos normalizados
4. Si hay errores → CORINA solicita corrección
5. Si es válido → Se muestra preview

### En Interacciones Pendientes

Cuando el usuario completa datos faltantes:
1. Se combinan datos anteriores con nuevos
2. Se normalizan los datos combinados
3. Se validan los datos normalizados
4. Si aún hay errores → Solicitar más datos
5. Si es válido → Mostrar preview

---

## ⚠️ Validaciones Específicas

### Fórmulas

- ✅ Total debe ser 1000 kg (con tolerancia de 0.001)
- ✅ Si no es 1000 kg, se ajusta proporcionalmente
- ✅ Cada detalle debe tener materia prima válida

### Compras

- ✅ Cantidades deben ser > 0
- ✅ Precios deben ser >= 0
- ✅ Cada detalle debe tener materia prima válida

### Fabricaciones

- ✅ Cantidad debe ser > 0
- ✅ Si cantidad > 100, se convierte a "veces" (dividiendo por 1000)

---

## 📝 Ejemplos de Uso

### Ejemplo 1: Fórmula con Total Incorrecto

**Input del Usuario:**
```
"Crear fórmula FORM001 para cerdo engorde con 400 kg de maíz y 400 kg de soja"
```

**Proceso:**
1. Extracción: `{ codigoFormula: "FORM001", detalles: [{ cantidadKg: 400 }, { cantidadKg: 400 }] }`
2. Normalización:
   - Resuelve ID de animal
   - Resuelve IDs de materias primas
   - Detecta total = 800 kg (no es 1000 kg)
   - Ajusta proporcionalmente: `[{ cantidadKg: 500 }, { cantidadKg: 500 }]`
   - Genera advertencia: "El total de la fórmula se ajustó a 1000 kg (era 800.00 kg)"

**Output:**
```
✅ CORINA

He preparado los siguientes datos para crear un formula:

• Código: FORM001
• Detalles: 2 materias primas (total: 1000 kg)

⚠️ Advertencias:
1. El total de la fórmula se ajustó a 1000 kg (era 800.00 kg)
```

### Ejemplo 2: Compra con Referencias

**Input del Usuario:**
```
"Compré 100 kg de maíz a $50 del proveedor Juan Pérez el día de hoy"
```

**Proceso:**
1. Extracción: `{ idProveedor: "Juan Pérez", detalles: [{ materiaPrima: "maíz", cantidadComprada: 100, precioUnitario: 50 }] }`
2. Normalización:
   - Busca proveedor "Juan Pérez" → Encuentra ID
   - Busca materia prima "maíz" → Encuentra ID
   - Convierte "hoy" → fecha actual
   - Valida cantidades y precios

**Output:**
```
✅ CORINA

He preparado los siguientes datos para crear un compra:

• Detalles: 1 materias primas
• Fecha: 2025-11-22
```

---

## 🚀 Próximos Pasos

1. **Fase 2.6:** Implementar preview y confirmación por WhatsApp
2. **Fase 2.7:** Implementar creación de registros desde CORINA

---

## ✅ Criterios de Aceptación Cumplidos

- ✅ Los datos extraídos pasan por normalización antes de validación
- ✅ Se resuelven referencias (nombres/códigos → IDs)
- ✅ Se normalizan fechas, cantidades, precios
- ✅ Se completan detalles de compras y fórmulas
- ✅ Se validan datos normalizados
- ✅ Se muestran errores y advertencias al usuario
- ✅ Se integra con el flujo existente

---

**Documento creado:** 2025-11-22  
**Última actualización:** 2025-11-22






