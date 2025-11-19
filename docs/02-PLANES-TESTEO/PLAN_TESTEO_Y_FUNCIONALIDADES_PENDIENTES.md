# 📋 Plan de Testeo y Funcionalidades Pendientes

## 📊 Resumen Ejecutivo

Este documento detalla:
1. **Plan de testeo** de funcionalidades y limitaciones según tipo de cliente
2. **Informe de funcionalidades faltantes** comparando el estado actual vs. especificaciones de planes
3. **Evaluación de propuesta** de sistema de usuarios empleados con códigos de referencia
4. **Recomendaciones** basadas en buenas prácticas

---

## 🧪 PARTE 1: PLAN DE TESTEO DE FUNCIONALIDADES Y LIMITACIONES

### 1.1 Matriz de Testeo por Plan

#### **Plan DEMO (Gratuito - 30 días)**

| Funcionalidad | Límite Esperado | Estado Actual | Casos de Prueba |
|---------------|----------------|---------------|-----------------|
| **Materias Primas** | Máx. 10 registros | ⚠️ No implementado | 1. Crear 10 materias primas → ✅ Debe permitir<br>2. Intentar crear la 11ª → ❌ Debe rechazar |
| **Proveedores** | Máx. 10 registros | ⚠️ No implementado | 1. Crear 10 proveedores → ✅ Debe permitir<br>2. Intentar crear el 11º → ❌ Debe rechazar |
| **Piensos/Animales** | Máx. 10 registros | ⚠️ No implementado | 1. Crear 10 piensos → ✅ Debe permitir<br>2. Intentar crear el 11º → ❌ Debe rechazar |
| **Compras** | Máx. 10 compras | ⚠️ No implementado | 1. Crear 10 compras → ✅ Debe permitir<br>2. Intentar crear la 11ª → ❌ Debe rechazar |
| **Inventario** | Máx. 10 materias primas | ⚠️ No implementado | 1. Agregar 10 materias al inventario → ✅ Debe permitir<br>2. Intentar agregar la 11ª → ❌ Debe rechazar |
| **Fórmulas** | Máx. 5 fórmulas | ⚠️ No implementado | 1. Crear 5 fórmulas → ✅ Debe permitir<br>2. Intentar crear la 6ª → ❌ Debe rechazar |
| **Fabricaciones** | Máx. 5 fabricaciones | ⚠️ No implementado | 1. Crear 5 fabricaciones → ✅ Debe permitir<br>2. Intentar crear la 6ª → ❌ Debe rechazar |
| **Granjas** | Máx. 1 granja | ✅ Implementado | 1. Crear 1 granja → ✅ Debe permitir<br>2. Intentar crear la 2ª → ❌ Debe rechazar (ya funciona) |
| **Usuarios** | Máx. 1 usuario | ❌ No implementado | Ver sección de usuarios empleados |
| **Archivos Históricos** | Máx. 3 archivos | ⚠️ No implementado | 1. Crear 3 archivos → ✅ Debe permitir<br>2. Intentar crear el 4º → ❌ Debe rechazar |
| **Gráficos Avanzados** | No disponible | ⚠️ No implementado | Verificar que no se muestren gráficos avanzados |
| **Gráficos de Fórmulas** | No disponible | ⚠️ No implementado | Verificar que no se muestren gráficos de fórmulas |
| **Gráficos de Fabricaciones** | No disponible | ⚠️ No implementado | Verificar que no se muestren gráficos de fabricaciones |
| **Reporte Completo** | No disponible | ⚠️ No implementado | Verificar que el botón de reporte completo no esté visible |
| **Importación CSV** | Disponible (limitada) | ⚠️ Parcialmente implementado | 1. Solo cuando está vacío → Verificar lógica<br>2. Después de primera importación → ❌ Debe rechazar |
| **Importación CSV Completa** | Materias Primas, Proveedores, Fórmulas, Piensos (1 vez cuando está vacío) | ⚠️ No implementado | Verificar que permita importar estas 4 tablas y solo cuando no hay datos previos |
| **Múltiples Usuarios** | No disponible | ❌ No implementado | Ver sección de usuarios empleados |
| **Datos Permanentes** | No (se eliminan en 30 días) | ❌ No implementado | 1. Verificar job automático de limpieza<br>2. Verificar notificaciones antes de eliminar |
| **Múltiples Plantas** | No disponible | ⚠️ Parcialmente implementado | Ya validado en límite de granjas |
| **Historial Completo** | Disponible | ✅ Implementado | Verificar que se muestre historial completo |
| **Historial de Fórmulas** | No disponible | ⚠️ No implementado | Verificar que no se muestre historial de cambios de fórmulas |
| **Restaurar Fabricaciones** | No disponible | ⚠️ No implementado | Verificar que no se pueda restaurar fabricaciones eliminadas |
| **Capacitación Personalizada** | No disponible | ❌ No implementado | N/A |
| **Soporte Directo** | No disponible | ❌ No implementado | N/A |
| **Alertas WhatsApp** | No disponible | ❌ No implementado | N/A |
| **Gestión IA** | No disponible | ❌ No implementado | N/A |

#### **Plan STARTER ($50,750/mes - $507,500/año)**

| Funcionalidad | Límite Esperado | Estado Actual | Casos de Prueba |
|---------------|----------------|---------------|-----------------|
| **Materias Primas** | Máx. 20 registros | ⚠️ No implementado | 1. Crear 20 materias primas → ✅ Debe permitir<br>2. Intentar crear la 21ª → ❌ Debe rechazar |
| **Proveedores** | Máx. 30 registros | ⚠️ No implementado | 1. Crear 30 proveedores → ✅ Debe permitir<br>2. Intentar crear el 31º → ❌ Debe rechazar |
| **Piensos/Animales** | Máx. 15 registros | ⚠️ No implementado | 1. Crear 15 piensos → ✅ Debe permitir<br>2. Intentar crear el 16º → ❌ Debe rechazar |
| **Compras** | Máx. 2,000 compras | ⚠️ No implementado | 1. Crear 2,000 compras → ✅ Debe permitir<br>2. Intentar crear la 2,001ª → ❌ Debe rechazar |
| **Inventario** | Sin límite | ✅ Implementado | Verificar que no haya límite |
| **Fórmulas** | Máx. 30 fórmulas | ⚠️ No implementado | 1. Crear 30 fórmulas → ✅ Debe permitir<br>2. Intentar crear la 31ª → ❌ Debe rechazar |
| **Fabricaciones** | Máx. 1,000 fabricaciones | ⚠️ No implementado | 1. Crear 1,000 fabricaciones → ✅ Debe permitir<br>2. Intentar crear la 1,001ª → ❌ Debe rechazar |
| **Granjas** | Máx. 2 granjas | ✅ Implementado | 1. Crear 2 granjas → ✅ Debe permitir<br>2. Intentar crear la 3ª → ❌ Debe rechazar |
| **Usuarios** | Máx. 2 usuarios (dueño + 1 empleado) | ❌ No implementado | Ver sección de usuarios empleados |
| **Archivos Históricos** | No disponible | ⚠️ No implementado | Verificar que no se pueda crear archivos históricos |
| **Gráficos Avanzados** | Solo básicos en panel principal | ⚠️ No implementado | Verificar que solo se muestren gráficos básicos |
| **Gráficos de Fórmulas** | No disponible | ⚠️ No implementado | Verificar que no se muestren gráficos de fórmulas |
| **Gráficos de Fabricaciones** | No disponible | ⚠️ No implementado | Verificar que no se muestren gráficos de fabricaciones |
| **Reporte Completo** | No disponible | ⚠️ No implementado | Verificar que el botón de reporte completo no esté visible |
| **Importación CSV** | Disponible | ⚠️ Parcialmente implementado | Verificar que funcione |
| **Importación CSV Completa** | Solo materias primas y proveedores (1 vez cuando está vacío) | ⚠️ No implementado | Verificar que solo permita importar estas dos tablas y solo cuando no hay datos previos |
| **Múltiples Usuarios** | Máx. 2 usuarios | ❌ No implementado | Ver sección de usuarios empleados |
| **Datos Permanentes** | Sí (100% permanencia) | ✅ Implementado | Verificar que los datos no se eliminen |
| **Múltiples Plantas** | Máx. 2 plantas | ✅ Implementado | Ya validado en límite de granjas |
| **Historial Completo** | Solo precios y compras | ⚠️ No implementado | Verificar que solo se muestre historial de precios y compras |
| **Historial de Fórmulas** | No disponible | ⚠️ No implementado | Verificar que no se muestre historial de cambios de fórmulas |
| **Restaurar Fabricaciones** | No disponible | ⚠️ No implementado | Verificar que no se pueda restaurar fabricaciones eliminadas |
| **Capacitación Personalizada** | No disponible | ❌ No implementado | N/A |
| **Soporte Directo** | No disponible | ❌ No implementado | N/A |
| **Alertas WhatsApp** | No disponible | ❌ No implementado | N/A |
| **Gestión IA** | No disponible | ❌ No implementado | N/A |

#### **Plan BUSINESS ($143,550/mes - $1,435,500/año)**

| Funcionalidad | Límite Esperado | Estado Actual | Casos de Prueba |
|---------------|----------------|---------------|-----------------|
| **Materias Primas** | Máx. 500 registros | ⚠️ No implementado | 1. Crear 500 materias primas → ✅ Debe permitir<br>2. Intentar crear la 501ª → ❌ Debe rechazar |
| **Proveedores** | Máx. 500 registros | ⚠️ No implementado | 1. Crear 500 proveedores → ✅ Debe permitir<br>2. Intentar crear el 501º → ❌ Debe rechazar |
| **Piensos/Animales** | Máx. 100 registros | ⚠️ No implementado | 1. Crear 100 piensos → ✅ Debe permitir<br>2. Intentar crear el 101º → ❌ Debe rechazar |
| **Compras** | Máx. 8,000 compras | ⚠️ No implementado | 1. Crear 8,000 compras → ✅ Debe permitir<br>2. Intentar crear la 8,001ª → ❌ Debe rechazar |
| **Inventario** | Sin límite | ✅ Implementado | Verificar que no haya límite |
| **Fórmulas** | Máx. 100 fórmulas | ⚠️ No implementado | 1. Crear 100 fórmulas → ✅ Debe permitir<br>2. Intentar crear la 101ª → ❌ Debe rechazar |
| **Fabricaciones** | Máx. 5,000 fabricaciones | ⚠️ No implementado | 1. Crear 5,000 fabricaciones → ✅ Debe permitir<br>2. Intentar crear la 5,001ª → ❌ Debe rechazar |
| **Granjas** | Máx. 5 granjas | ✅ Implementado | 1. Crear 5 granjas → ✅ Debe permitir<br>2. Intentar crear la 6ª → ❌ Debe rechazar |
| **Usuarios** | Máx. 5 usuarios (dueño + 4 empleados) | ❌ No implementado | Ver sección de usuarios empleados |
| **Archivos Históricos** | Máx. 180 archivos | ⚠️ No implementado | 1. Crear 180 archivos → ✅ Debe permitir<br>2. Intentar crear el 181º → ❌ Debe rechazar |
| **Gráficos Avanzados** | Disponible | ⚠️ No implementado | Verificar que se muestren todos los gráficos avanzados |
| **Gráficos de Fórmulas** | Disponible | ⚠️ No implementado | Verificar que se muestren gráficos de fórmulas |
| **Gráficos de Fabricaciones** | Disponible | ⚠️ No implementado | Verificar que se muestren gráficos de fabricaciones |
| **Reporte Completo** | No disponible | ⚠️ No implementado | Verificar que el botón de reporte completo no esté visible |
| **Importación CSV** | Disponible | ⚠️ Parcialmente implementado | Verificar que funcione |
| **Importación CSV Completa** | Materias Primas, Proveedores, Fórmulas, Piensos (1 vez cuando está vacío) | ⚠️ No implementado | Verificar que permita importar estas 4 tablas y solo cuando no hay datos previos |
| **Múltiples Usuarios** | Máx. 5 usuarios | ❌ No implementado | Ver sección de usuarios empleados |
| **Datos Permanentes** | Sí (100% permanencia) | ✅ Implementado | Verificar que los datos no se eliminen |
| **Múltiples Plantas** | Máx. 5 plantas | ✅ Implementado | Ya validado en límite de granjas |
| **Historial Completo** | Disponible | ✅ Implementado | Verificar que se muestre historial completo |
| **Historial de Fórmulas** | Disponible | ⚠️ No implementado | Verificar que se muestre historial de cambios de fórmulas |
| **Restaurar Fabricaciones** | Disponible | ⚠️ No implementado | Verificar que se pueda restaurar fabricaciones eliminadas |
| **Capacitación Personalizada** | Virtual + manual | ❌ No implementado | N/A |
| **Soporte Directo** | Respuesta en 24hs | ❌ No implementado | N/A |
| **Alertas WhatsApp** | No disponible | ❌ No implementado | N/A |
| **Gestión IA** | No disponible | ❌ No implementado | N/A |

#### **Plan ENTERPRISE ($332,050/mes - $3,320,500/año)**

| Funcionalidad | Límite Esperado | Estado Actual | Casos de Prueba |
|---------------|----------------|---------------|-----------------|
| **Materias Primas** | Ilimitado | ⚠️ No implementado | Verificar que no haya límite |
| **Proveedores** | Ilimitado | ⚠️ No implementado | Verificar que no haya límite |
| **Piensos/Animales** | Ilimitado | ⚠️ No implementado | Verificar que no haya límite |
| **Compras** | Ilimitado | ⚠️ No implementado | Verificar que no haya límite |
| **Inventario** | Sin límite | ✅ Implementado | Verificar que no haya límite |
| **Fórmulas** | Ilimitado | ⚠️ No implementado | Verificar que no haya límite |
| **Fabricaciones** | Ilimitado | ⚠️ No implementado | Verificar que no haya límite |
| **Granjas** | Máx. 25 granjas | ✅ Implementado | 1. Crear 25 granjas → ✅ Debe permitir<br>2. Intentar crear la 26ª → ❌ Debe rechazar |
| **Usuarios** | Máx. 25 usuarios (dueño + 24 empleados) | ❌ No implementado | Ver sección de usuarios empleados |
| **Archivos Históricos** | Ilimitado | ⚠️ No implementado | Verificar que no haya límite |
| **Gráficos Avanzados** | Disponible | ⚠️ No implementado | Verificar que se muestren todos los gráficos avanzados |
| **Gráficos de Fórmulas** | Disponible | ⚠️ No implementado | Verificar que se muestren gráficos de fórmulas |
| **Gráficos de Fabricaciones** | Disponible | ⚠️ No implementado | Verificar que se muestren gráficos de fabricaciones |
| **Reporte Completo** | Disponible | ⚠️ Parcialmente implementado | Verificar que solo usuarios ENTERPRISE puedan acceder al reporte completo |
| **Importación CSV** | Disponible | ⚠️ Parcialmente implementado | Verificar que funcione |
| **Importación CSV Completa** | Materias Primas, Proveedores, Fórmulas, Piensos (1 vez cuando está vacío) | ⚠️ No implementado | Verificar que permita importar estas 4 tablas y solo cuando no hay datos previos |
| **Múltiples Usuarios** | Máx. 25 usuarios | ❌ No implementado | Ver sección de usuarios empleados |
| **Datos Permanentes** | Sí (100% permanencia) | ✅ Implementado | Verificar que los datos no se eliminen |
| **Múltiples Plantas** | Máx. 25 plantas | ✅ Implementado | Ya validado en límite de granjas |
| **Historial Completo** | Disponible | ✅ Implementado | Verificar que se muestre historial completo |
| **Historial de Fórmulas** | Disponible | ⚠️ No implementado | Verificar que se muestre historial de cambios de fórmulas |
| **Restaurar Fabricaciones** | Disponible | ⚠️ No implementado | Verificar que se pueda restaurar fabricaciones eliminadas |
| **Capacitación Personalizada** | Presencial + virtual | ❌ No implementado | N/A |
| **Soporte Directo** | Respuesta < 24hs | ❌ No implementado | N/A |
| **Alertas WhatsApp** | Disponible | ❌ No implementado | Verificar integración con WhatsApp Business API |
| **Gestión IA** | Disponible | ❌ No implementado | Verificar funcionalidades de IA (análisis predictivo, recomendaciones, etc.) |

### 1.2 Checklist de Testeo por Escenario

#### Escenario 1: Usuario DEMO intenta exceder límites
- [ ] Intentar crear más de 10 materias primas
- [ ] Intentar crear más de 10 proveedores
- [ ] Intentar crear más de 10 piensos
- [ ] Intentar crear más de 10 compras
- [ ] Intentar crear más de 5 fórmulas
- [ ] Intentar crear más de 5 fabricaciones
- [ ] Intentar crear más de 1 granja
- [ ] Intentar crear más de 3 archivos históricos
- [ ] Verificar que no se muestren gráficos avanzados
- [ ] Verificar que no se muestren gráficos de fórmulas
- [ ] Verificar que no se muestren gráficos de fabricaciones
- [ ] Verificar que el botón de reporte completo no esté visible
- [ ] Verificar que la importación CSV solo funcione cuando está vacío
- [ ] Verificar que los datos se eliminen después de 30 días

#### Escenario 2: Usuario STARTER intenta exceder límites
- [ ] Intentar crear más de 20 materias primas
- [ ] Intentar crear más de 30 proveedores
- [ ] Intentar crear más de 15 piensos
- [ ] Intentar crear más de 2,000 compras
- [ ] Intentar crear más de 30 fórmulas
- [ ] Intentar crear más de 1,000 fabricaciones
- [ ] Intentar crear más de 2 granjas
- [ ] Intentar crear más de 2 usuarios empleados
- [ ] Verificar que solo se muestren gráficos básicos (Panel Principal, Proveedores, Compras, Inventario)
- [ ] Verificar que NO se muestren gráficos avanzados de fórmulas
- [ ] Verificar que NO se muestren gráficos avanzados de fabricaciones
- [ ] Verificar que el botón de reporte completo no esté visible
- [ ] Verificar que la importación CSV completa solo permita materias primas y proveedores (y solo cuando no hay datos previos)
- [ ] Verificar que el historial solo muestre precios y compras

#### Escenario 3: Usuario BUSINESS intenta exceder límites
- [ ] Intentar crear más de 500 materias primas
- [ ] Intentar crear más de 500 proveedores
- [ ] Intentar crear más de 100 piensos
- [ ] Intentar crear más de 8,000 compras
- [ ] Intentar crear más de 100 fórmulas
- [ ] Intentar crear más de 5,000 fabricaciones
- [ ] Intentar crear más de 5 granjas
- [ ] Intentar crear más de 5 usuarios empleados
- [ ] Intentar crear más de 180 archivos históricos
- [ ] Verificar que se muestren gráficos básicos + gráficos avanzados
- [ ] Verificar que se muestren gráficos avanzados de fórmulas (Materias primas más utilizadas)
- [ ] Verificar que se muestren gráficos avanzados de fabricaciones (Materias primas más utilizadas, Fórmulas más producidas)
- [ ] Verificar que el botón de reporte completo no esté visible (solo ENTERPRISE)
- [ ] Verificar que la importación CSV completa permita Materias Primas, Proveedores, Fórmulas y Piensos (y solo cuando no hay datos previos)
- [ ] Verificar que se muestre historial completo
- [ ] Verificar que se muestre historial de fórmulas
- [ ] Verificar que se pueda restaurar fabricaciones eliminadas

#### Escenario 4: Usuario ENTERPRISE (sin límites numéricos)
- [ ] Verificar que no haya límites en materias primas
- [ ] Verificar que no haya límites en proveedores
- [ ] Verificar que no haya límites en piensos
- [ ] Verificar que no haya límites en compras
- [ ] Verificar que no haya límites en fórmulas
- [ ] Verificar que no haya límites en fabricaciones
- [ ] Intentar crear más de 25 granjas
- [ ] Intentar crear más de 25 usuarios empleados
- [ ] Verificar que no haya límites en archivos históricos
- [ ] Verificar que se muestren todos los gráficos avanzados
- [ ] Verificar que solo usuarios ENTERPRISE puedan acceder al reporte completo
- [ ] Verificar integración con WhatsApp Business API
- [ ] Verificar funcionalidades de IA

---

## 📝 PARTE 2: INFORME DE FUNCIONALIDADES FALTANTES

### 2.1 Funcionalidades Implementadas ✅

| Funcionalidad | Estado | Observaciones |
|---------------|--------|---------------|
| **Sistema de Autenticación** | ✅ Completo | Login con email/password y Google OAuth |
| **Gestión de Usuarios** | ✅ Completo | Registro, verificación de email, roles |
| **Gestión de Granjas** | ✅ Completo | CRUD completo, límite de granjas por plan implementado |
| **Gestión de Materias Primas** | ✅ Completo | CRUD completo, pero sin validación de límites |
| **Gestión de Proveedores** | ✅ Completo | CRUD completo, pero sin validación de límites |
| **Gestión de Piensos/Animales** | ✅ Completo | CRUD completo, pero sin validación de límites |
| **Gestión de Compras** | ✅ Completo | CRUD completo, actualización automática de precios, pero sin validación de límites |
| **Gestión de Inventario** | ✅ Completo | Cálculos automáticos, sin límites (correcto) |
| **Gestión de Fórmulas** | ✅ Completo | CRUD completo, recálculo automático de costos, pero sin validación de límites |
| **Gestión de Fabricaciones** | ✅ Completo | CRUD completo, verificación de existencias, pero sin validación de límites |
| **Sistema de Auditoría** | ✅ Completo | Historial de cambios de precio, trazabilidad |
| **Importación entre Granjas** | ✅ Completo | Importación de datos entre granjas del mismo usuario |
| **Sistema de Suscripciones** | ✅ Completo | Creación, actualización, cancelación de suscripciones |
| **Sistema de Pagos** | ✅ Completo | Integración con Mercado Pago, webhooks |
| **Panel Principal** | ✅ Completo | KPIs, gráficos básicos, estadísticas |
| **Exportación CSV** | ✅ Completo | Exportación de todas las tablas |

### 2.2 Funcionalidades Parcialmente Implementadas ⚠️

| Funcionalidad | Estado Actual | Lo que Falta |
|---------------|---------------|--------------|
| **Validación de Límites por Plan** | ⚠️ Parcial | Solo implementado para granjas. Falta para: materias primas, proveedores, piensos, compras, fórmulas, fabricaciones, archivos históricos |
| **Importación CSV** | ⚠️ Parcial | Implementada pero sin validación de límites por plan ni restricciones según plan |
| **Gráficos** | ⚠️ Parcial | Gráficos básicos implementados, pero falta diferenciación por plan (avanzados vs básicos) |
| **Historial Completo** | ⚠️ Parcial | Historial de precios implementado, falta historial de fórmulas y restauración de fabricaciones |

### 2.3 Funcionalidades No Implementadas ❌

#### 2.3.1 Sistema de Múltiples Usuarios (CRÍTICO)

**Estado:** ❌ No implementado

**Especificación según Plan:**
- **DEMO:** 1 usuario (solo dueño)
- **STARTER:** 2 usuarios (dueño + 1 empleado)
- **BUSINESS:** 5 usuarios (dueño + 4 empleados)
- **ENTERPRISE:** 25 usuarios (dueño + 24 empleados)

**Historia de Usuario:**
```
Como dueño de 2 plantas y habiendo pagado el plan "STARTER" 
quiero poder asignar el mail de mi empleado para que me ayude 
a gestionar las dos plantas permitidas en mi plan de suscripción
```

**Funcionalidades Requeridas:**
1. Sistema de códigos de referencia para vincular usuarios empleados
2. Registro de usuarios empleados con código de referencia
3. Gestión de usuarios empleados desde configuración
4. Acceso compartido a granjas del dueño
5. Validación de límites de usuarios por plan
6. Eliminación de usuarios empleados

**Impacto:** 🔴 CRÍTICO - Funcionalidad core del modelo de negocio

---

#### 2.3.2 Validación de Límites por Plan

**Estado:** ❌ No implementado (excepto granjas)

**Límites que Faltan Validar:**
- Materias primas (DEMO: 10, STARTER: 20, BUSINESS: 500, ENTERPRISE: ilimitado)
- Proveedores (DEMO: 10, STARTER: 30, BUSINESS: 500, ENTERPRISE: ilimitado)
- Piensos (DEMO: 10, STARTER: 15, BUSINESS: 100, ENTERPRISE: ilimitado)
- Compras (DEMO: 10, STARTER: 2,000, BUSINESS: 8,000, ENTERPRISE: ilimitado)
- Fórmulas (DEMO: 5, STARTER: 30, BUSINESS: 100, ENTERPRISE: ilimitado)
- Fabricaciones (DEMO: 5, STARTER: 1,000, BUSINESS: 5,000, ENTERPRISE: ilimitado)
- Archivos históricos (DEMO: 3, STARTER: 0, BUSINESS: 180, ENTERPRISE: ilimitado)

**Impacto:** 🔴 CRÍTICO - Sin esto, los planes no tienen valor diferenciado

---

#### 2.3.3 Reporte Completo del Panel Principal

**Estado:** ✅ Implementado (página web), ⚠️ Restricción por plan pendiente

**Especificación según Plan:**
- **DEMO:** No disponible
- **STARTER:** No disponible
- **BUSINESS:** No disponible
- **ENTERPRISE:** Disponible (solo plan ENTERPRISE)

**Funcionalidad:**
- El reporte completo ya existe como página web interactiva en `/granja/[id]/reporte-completo`
- **NO se requiere convertir a PDF** - se mantiene como página web
- Solo debe estar disponible para usuarios con plan ENTERPRISE
- Incluye todos los gráficos avanzados mencionados en la sección de gráficos

**Impacto:** 🟡 MEDIO - Funcionalidad diferenciadora exclusiva para plan Enterprise

---

#### 2.3.4 Gráficos Avanzados

**Estado:** ⚠️ Parcialmente implementado (gráficos básicos existen, avanzados faltan)

**Especificación según Plan:**
- **DEMO:** Solo gráficos básicos
- **STARTER:** Solo gráficos básicos
- **BUSINESS:** Gráficos básicos + gráficos avanzados
- **ENTERPRISE:** Todos los gráficos (básicos + avanzados + reporte completo)

**Gráficos Básicos (Disponibles para DEMO, STARTER, BUSINESS, ENTERPRISE):**

**Módulo Panel Principal:**
1. ✅ Materias con más existencias
2. ✅ Fórmulas más fabricadas
3. ✅ Proveedores con más compras registradas

**Módulo Proveedores:**
4. ✅ Proveedores con más compras
5. ✅ Gastos por proveedor

**Módulo Compras:**
6. ✅ Distribución por materia prima

**Módulo Inventario:**
7. ✅ Mayores existencias de materia prima
8. ✅ Mayor valor inmovilizado de materias primas

**Gráficos Avanzados (Solo BUSINESS y ENTERPRISE):**

**Módulo Fórmulas:**
1. ⚠️ Materias primas más utilizadas

**Módulo Fabricaciones:**
2. ⚠️ Materias primas más utilizadas
3. ⚠️ Fórmulas más producidas

**Gráficos del Reporte Completo (Solo ENTERPRISE):**

**Gráficos ya implementados en el reporte completo:**
- ✅ Proveedores con más compras (ProveedoresComprasChart)
- ✅ Proveedores con más dinero gastado (ProveedoresGastoChart)
- ✅ Materias con más existencias (InventarioExistenciasChart)
- ✅ Fórmulas más fabricadas (FabricacionesFormulasChart)

**Gráficos faltantes (4 gráficos específicos):**
Los siguientes gráficos deben estar incluidos **dentro del reporte completo del panel principal** (`/granja/[id]/reporte-completo`):
1. ⚠️ Gráficos de distribución de materias primas en fórmulas
2. ⚠️ Gráficos de evolución de costos de fórmulas
3. ⚠️ Gráficos de consumo de materias primas
4. ⚠️ Gráficos de tendencias de precios

**Nota:** 
- Estos 4 gráficos forman parte del reporte completo y solo están disponibles para usuarios con plan ENTERPRISE
- Los gráficos del panel principal NO deben modificarse
- Los nuevos gráficos deben agregarse solo a la página `/granja/[id]/reporte-completo`

**Impacto:** 🟡 ALTO - Funcionalidad diferenciadora para planes Business y Enterprise

---

#### 2.3.5 Historial de Fórmulas

**Estado:** ⚠️ Parcialmente implementado (auditoría existe, falta visualización específica)

**Especificación según Plan:**
- **DEMO:** No disponible
- **STARTER:** No disponible
- **BUSINESS:** Disponible
- **ENTERPRISE:** Disponible

**Funcionalidades Requeridas:**
1. ✅ Registro de cambios en fórmulas en la tabla de auditoría (materias primas, cantidades)
2. ⚠️ Visualización de historial de cambios de fórmulas (filtrar auditoría por tipo de cambio)
3. ⚠️ Comparación entre versiones (mostrar cambios entre estados)
4. ❌ **NO se implementará:** Restauración a versiones anteriores

**Nota:** Los cambios de fórmulas se reflejan automáticamente en la tabla de auditoría. Solo falta crear la interfaz para visualizar y comparar estos cambios.

**Impacto:** 🟡 MEDIO - Funcionalidad útil pero no crítica

---

#### 2.3.6 Restaurar Fabricaciones Eliminadas

**Estado:** ❌ No implementado

**Especificación según Plan:**
- **DEMO:** No disponible
- **STARTER:** No disponible
- **BUSINESS:** Disponible
- **ENTERPRISE:** Disponible

**Funcionalidades Requeridas:**
1. Soft delete de fabricaciones (ya existe `activo` en algunas tablas)
2. Lista de fabricaciones eliminadas
3. Restauración de fabricaciones eliminadas
4. Validación de permisos por plan

**Impacto:** 🟡 MEDIO - Funcionalidad útil pero no crítica

---

#### 2.3.7 Archivos Históricos (Archivos & Snapshots)

**Estado:** ⚠️ Parcialmente implementado (módulo existe, falta validación de límites por plan)

**Especificación según Plan:**
- **DEMO:** Máx. 3 archivos
- **STARTER:** No disponible
- **BUSINESS:** Máx. 180 archivos
- **ENTERPRISE:** Ilimitado

**Funcionalidades:**
- Se refiere al módulo "Archivos & Snapshots" implementado en el módulo de Configuraciones
- Esta opción solo estará disponible para los planes estipulados (DEMO, BUSINESS, ENTERPRISE)
- STARTER no tiene acceso a esta funcionalidad

**Funcionalidades Requeridas:**
1. ✅ Creación de archivos históricos (snapshots del estado del sistema) - Ya implementado
2. ✅ Visualización de archivos históricos - Ya implementado
3. ⚠️ Comparación entre archivos históricos - Pendiente
4. ⚠️ Validación de límites por plan - Pendiente (bloquear acceso para STARTER, validar límites para DEMO/BUSINESS)
5. ⚠️ Exportación de archivos históricos - Pendiente

**Impacto:** 🟡 MEDIO - Funcionalidad útil pero no crítica

---

#### 2.3.8 Importación CSV Completa

**Estado:** ⚠️ Parcialmente implementado

**Especificación según Plan:**
- **DEMO:** Solo 1 vez cuando está vacío
  - Tablas permitidas: Materias Primas, Proveedores, Fórmulas, Piensos
- **STARTER:** Solo materias primas y proveedores (1 vez cuando está vacío)
- **BUSINESS:** Todas las tablas permitidas (1 vez cuando está vacío)
  - Tablas permitidas: Materias Primas, Proveedores, Fórmulas, Piensos
- **ENTERPRISE:** Todas las tablas permitidas (1 vez cuando está vacío)
  - Tablas permitidas: Materias Primas, Proveedores, Fórmulas, Piensos

**Nota Importante:** 
- "Todas las tablas" se refiere a las tablas que **NO intervienen en los cálculos**
- Las tablas que intervienen en cálculos (Compras, Fabricaciones, Inventario) **NO se pueden importar**

**Lo que Falta:**
1. ⚠️ Validación de límites antes de importar
2. ⚠️ Restricción de tablas según plan (DEMO: 4 tablas, STARTER: 2 tablas, BUSINESS/ENTERPRISE: 4 tablas)
3. ⚠️ Validación de que solo se pueda importar 1 vez cuando está vacío (para todos los planes)
4. ⚠️ Validación de formato y datos antes de importar
5. ⚠️ Bloquear importación de tablas que intervienen en cálculos (Compras, Fabricaciones, Inventario)

**Impacto:** 🟡 MEDIO - Mejora la experiencia pero no crítica

---

#### 2.3.9 Eliminación Automática de Datos DEMO

**Estado:** ❌ No implementado

**Especificación según Plan:**
- **DEMO:** Los datos se eliminan después de 30 días
- **Otros planes:** Datos permanentes

**Funcionalidades Requeridas:**
1. Job automático que verifique usuarios DEMO con más de 30 días
2. Notificación antes de eliminar (7 días antes, 3 días antes, 1 día antes)
3. Eliminación automática de datos después de 30 días
4. Opción de migrar a plan de pago antes de eliminación

**Impacto:** 🟡 MEDIO - Importante para el modelo de negocio DEMO

---

#### 2.3.10 Funcionalidades Premium (No Críticas)

| Funcionalidad | Plan Requerido | Estado | Impacto |
|---------------|----------------|--------|---------|
| **Capacitación Personalizada** | BUSINESS, ENTERPRISE | ❌ No se implementará | 🟢 BAJO - Tarea fuera de la app |
| **Soporte Directo** | BUSINESS, ENTERPRISE | ❌ No se implementará | 🟢 BAJO - Tarea fuera de la app |
| **Alertas WhatsApp** | ENTERPRISE | ❌ No implementado | 🟡 MEDIO - Requiere integración con WhatsApp Business API |
| **Gestión IA** | ENTERPRISE | ❌ No implementado | 🟡 MEDIO - Requiere integración con servicios de IA |

**Nota:** Solo se implementarán las funcionalidades de **Alertas WhatsApp** y **Gestión IA**. Las demás (Capacitación Personalizada y Soporte Directo) son tareas que se realizan fuera de la aplicación.

---

## 🔐 PARTE 3: EVALUACIÓN DE PROPUESTA - SISTEMA DE USUARIOS EMPLEADOS

### 3.1 Propuesta del Usuario

**Concepto:**
- Cada cuenta dueña tiene un "código de referencia" único
- Al crear una cuenta, se solicita el código de referencia
- Si no tiene código → Plan DEMO
- Si tiene código válido → Accede a las plantas del dueño y queda linkeada al plan del dueño
- El dueño puede gestionar usuarios empleados desde configuración
- El dueño puede eliminar usuarios empleados

**Límites por Plan:**
- **STARTER:** Dueño + 1 empleado (total: 2 usuarios)
- **BUSINESS:** Dueño + 4 empleados (total: 5 usuarios)
- **ENTERPRISE:** Dueño + 24 empleados (total: 25 usuarios)

### 3.2 Evaluación de la Propuesta

#### ✅ **Aspectos Positivos:**

1. **Simplicidad:** El sistema de código de referencia es simple y fácil de entender
2. **Escalabilidad:** Permite agregar usuarios sin complicar el sistema
3. **Control:** El dueño tiene control total sobre quién accede a sus plantas
4. **Flexibilidad:** Los empleados pueden tener su propia cuenta pero acceder a las plantas del dueño

#### ⚠️ **Aspectos a Mejorar (Buenas Prácticas):**

1. **Seguridad del Código:**
   - ❌ **Problema:** Código de referencia podría ser adivinado o compartido públicamente
   - ✅ **Solución:** Usar códigos aleatorios largos (ej: `REF-STARTER-ABC123XYZ789`) o tokens únicos con expiración

2. **Gestión de Permisos:**
   - ✅ **Solución Aceptada:** Los usuarios "empleado" tendrán acceso a todas las funcionalidades **menos** a:
     - Gestión de cuentas empleados (solo cuenta dueña)
     - Auditoría (solo cuenta dueña)
   - Los empleados pueden gestionar plantas, materias primas, proveedores, compras, fórmulas, fabricaciones, inventario, etc.

3. **Notificaciones:**
   - ❌ **Problema:** No se menciona notificar al empleado cuando es agregado/eliminado
   - ✅ **Solución:** Enviar email al empleado cuando es agregado, y notificación antes de eliminación

4. **Validación de Límites:**
   - ❌ **Problema:** No se especifica qué pasa si el dueño intenta agregar más empleados de los permitidos
   - ✅ **Solución:** Validar límites antes de agregar empleados, mostrar mensaje claro

5. **Cambio de Plan:**
   - ✅ **Solución Aceptada:** 
     - **Si el cliente paga por un año de servicio** de cualquier plan: **NO se le permite retroceder** en el nivel del plan durante el período anual pagado
     - **Si el cliente paga mensualmente** y desea degradar su plan: Se implementa la solución sugerida (desvincular empleados excedentes con notificación previa)
     - Si cambia a plan con menos usuarios permitidos, debe eliminar empleados excedentes antes de cambiar

6. **Cancelación de Suscripción:**
   - ❌ **Problema:** No se especifica qué pasa con los empleados si el dueño cancela su suscripción
   - ✅ **Solución:** Degradar a DEMO y desvincular empleados (con notificación)

### 3.3 Propuesta Mejorada (Recomendada)

#### **Arquitectura Propuesta:**

```
Usuario (Dueño)
├── Suscripción (STARTER/BUSINESS/ENTERPRISE)
├── Código de Referencia (único, regenerable)
└── Usuarios Empleados (vinculados)
    ├── Usuario Empleado 1
    ├── Usuario Empleado 2
    └── ...
```

#### **Modelo de Datos Propuesto:**

```prisma
model Usuario {
  // ... campos existentes ...
  
  // Nuevos campos para sistema de empleados
  codigoReferencia        String?         @unique // Código único para invitar empleados
  fechaGeneracionCodigo  DateTime?       // Fecha de generación del código
  esUsuarioEmpleado      Boolean         @default(false)
  idUsuarioDueño         String?         // ID del dueño si es empleado
  fechaVinculacion       DateTime?       // Fecha en que se vinculó como empleado
  
  // Relaciones
  usuariosEmpleados      Usuario[]       @relation("UsuarioEmpleados")
  usuarioDueño           Usuario?        @relation("UsuarioEmpleados", fields: [idUsuarioDueño], references: [id])
  
  // Permisos del empleado (si aplica)
  rolEmpleado            RolEmpleado?    @default(EDITOR)
}

enum RolEmpleado {
  ADMIN      // Acceso completo (solo para dueño o empleado designado)
  EDITOR     // Puede crear, editar, eliminar
  LECTOR     // Solo lectura
}
```

#### **Flujo Propuesto:**

1. **Generación de Código de Referencia:**
   - El dueño genera un código desde Configuración → Usuarios Empleados
   - El código es único, aleatorio (ej: `REF-STARTER-A1B2C3D4E5F6`)
   - El código tiene expiración (opcional, ej: 30 días)
   - El código puede regenerarse (invalida el anterior)

2. **Registro de Usuario Empleado:**
   - El empleado se registra normalmente
   - Durante el registro, se le pregunta: "¿Tienes un código de referencia?"
   - Si NO tiene código → Plan DEMO (flujo normal)
   - Si SÍ tiene código:
     - Validar que el código existe y es válido
     - Validar que el dueño tiene espacio para más empleados
     - Vincular al empleado con el dueño
     - Asignar el plan del dueño al empleado
     - Enviar email de bienvenida al empleado
     - Notificar al dueño que se agregó un nuevo empleado

3. **Acceso a Plantas:**
   - El empleado ve las plantas del dueño en su lista de plantas
   - El empleado puede gestionar las plantas y todas las funcionalidades **excepto**:
     - Gestión de cuentas empleados (solo cuenta dueña)
     - Auditoría (solo cuenta dueña)
   - Todas las acciones del empleado quedan registradas en auditoría con su ID (aunque no pueda verla)

4. **Gestión de Empleados (Dueño):**
   - Ver lista de empleados vinculados
   - Ver información de cada empleado (nombre, email, fecha de vinculación, último acceso)
   - Eliminar empleado (con confirmación y notificación al empleado)
   - Regenerar código de referencia
   - Los empleados ya linkeado no se veran afectados

5. **Validaciones:**
   - No permitir agregar más empleados de los permitidos por plan
   - No permitir que un empleado tenga sus propios empleados (solo el dueño)
   - Si el dueño paga **anualmente**: No puede retroceder de nivel durante el período pagado
   - Si el dueño paga **mensualmente** y cambia a plan con menos usuarios: Debe eliminar empleados excedentes antes de cambiar (con notificación previa)
   - Si el dueño cancela suscripción: Degradar a DEMO y desvincular empleados (con notificación)

#### **Mejoras Adicionales a Implementar:**

1. ✅ **Sistema de Invitaciones por Email:**
   - En lugar de solo código, permitir invitar por email directamente
   - El empleado recibe un email con link de registro que incluye el código
   - Más seguro y profesional

2. ✅ **Notificaciones:**
   - Email al empleado cuando es agregado
   - Email al empleado cuando es eliminado
   - Email al dueño cuando un empleado acepta la invitación
   - Notificación antes de eliminar empleado (con período de gracia)

3. ✅ **Auditoría Mejorada:**
   - Registrar quién hizo cada acción (dueño vs empleado)
   - Filtrar auditoría por usuario
   - Ver historial de acciones por empleado
   - Solo la cuenta dueña puede acceder a la auditoría

**Mejoras NO Implementadas:**
- ❌ Dashboard de Empleados (no mencionado, no se implementará)

---

## 📋 PARTE 4: HISTORIAS DE USUARIO DETALLADAS

### 4.1 Sistema de Usuarios Empleados

#### **HU-001: Generar Código de Referencia**

**Como** dueño de un plan STARTER  
**Quiero** generar un código de referencia único  
**Para** invitar a mi empleado a gestionar mis plantas

**Criterios de Aceptación:**
- [ ] El código se genera desde Configuración → Usuarios Empleados
- [ ] El código es único y aleatorio (formato: `REF-STARTER-XXXXXXXX`)
- [ ] El código puede copiarse fácilmente
- [ ] El código puede regenerarse (invalida el anterior)
- [ ] El código tiene expiración opcional (30 días por defecto)
- [ ] Se muestra cuántos empleados están vinculados y cuántos quedan disponibles

**Prioridad:** 🔴 ALTA

---

#### **HU-002: Registro de Usuario con Código de Referencia o Invitación por Email**

**Como** empleado potencial  
**Quiero** registrarme usando un código de referencia o una invitación por email  
**Para** acceder a las plantas de mi empleador

**Criterios de Aceptación:**
- [ ] Opción 1: Registro con código de referencia
  - [ ] Durante el registro, se pregunta: "¿Tienes un código de referencia?"
  - [ ] Si ingresa código válido:
    - [ ] Se valida que el código existe y no expiró
    - [ ] Se valida que el dueño tiene espacio para más empleados
    - [ ] Se vincula al empleado con el dueño
    - [ ] Se asigna el plan del dueño al empleado
    - [ ] Se envía email de bienvenida
    - [ ] Se notifica al dueño
  - [ ] Si NO ingresa código o código inválido:
    - [ ] Continúa con registro normal (Plan DEMO)
  - [ ] Si el código es válido pero el dueño no tiene espacio:
    - [ ] Se muestra mensaje: "El plan del dueño no permite más empleados"
    - [ ] Se ofrece continuar con Plan DEMO
- [ ] Opción 2: Registro mediante invitación por email
  - [ ] El dueño invita por email directamente
  - [ ] El empleado recibe un email con link de registro que incluye el código
  - [ ] Al hacer clic en el link, se pre-llena el código de referencia
  - [ ] Continúa con el flujo de validación del código
  - [ ] Más seguro y profesional

**Prioridad:** 🔴 ALTA

---

#### **HU-003: Acceso a Plantas del Dueño**

**Como** usuario empleado vinculado  
**Quiero** ver y gestionar las plantas de mi empleador  
**Para** ayudar en la gestión diaria

**Criterios de Aceptación:**
- [ ] El empleado ve las plantas del dueño en su lista de plantas
- [ ] El empleado puede acceder a todas las plantas del dueño
- [ ] El empleado puede gestionar todas las funcionalidades **excepto**:
  - [ ] Gestión de cuentas empleados (solo cuenta dueña puede acceder)
  - [ ] Auditoría (solo cuenta dueña puede acceder)
- [ ] Las acciones del empleado quedan registradas en auditoría con su ID (aunque no pueda verla)
- [ ] El empleado NO puede crear sus propias plantas (solo ver las del dueño)
- [ ] El empleado NO puede vincular sus propios empleados
- [ ] El empleado respeta los límites del plan del dueño

**Prioridad:** 🔴 ALTA

---

#### **HU-004: Gestión de Usuarios Empleados**

**Como** dueño de un plan  
**Quiero** gestionar mis usuarios empleados  
**Para** controlar quién tiene acceso a mis plantas

**Criterios de Aceptación:**
- [ ] Solo la cuenta dueña puede acceder a esta funcionalidad
- [ ] Ver lista de empleados vinculados (nombre, email, fecha vinculación, último acceso)
- [ ] Ver cuántos empleados están vinculados y cuántos quedan disponibles
- [ ] Invitar empleado por email (sistema de invitaciones por email)
- [ ] Eliminar empleado (con confirmación)
- [ ] Al eliminar empleado:
  - [ ] Se envía email de notificación al empleado
  - [ ] El empleado pierde acceso inmediatamente
  - [ ] El empleado vuelve a Plan DEMO
- [ ] Regenerar código de referencia
- [ ] Ver historial de acciones de cada empleado desde auditoría (solo cuenta dueña)

**Prioridad:** 🔴 ALTA

---

#### **HU-005: Validación de Límites de Usuarios**

**Como** dueño de un plan STARTER  
**Quiero** que el sistema valide los límites de usuarios  
**Para** no exceder mi plan

**Criterios de Aceptación:**
- [ ] STARTER: Máx. 2 usuarios (dueño + 1 empleado)
- [ ] BUSINESS: Máx. 5 usuarios (dueño + 4 empleados)
- [ ] ENTERPRISE: Máx. 25 usuarios (dueño + 24 empleados)
- [ ] Si intenta agregar más empleados de los permitidos:
  - [ ] Se muestra mensaje: "Has alcanzado el límite de usuarios de tu plan"
  - [ ] Se ofrece upgrade a plan superior
- [ ] Si cambia a plan con menos usuarios:
  - [ ] Se notifica que debe eliminar empleados excedentes
  - [ ] Se bloquea el cambio hasta eliminar empleados excedentes

**Prioridad:** 🔴 ALTA

---

#### **HU-006: Cambio de Plan con Usuarios Empleados**

**Como** dueño con usuarios empleados vinculados  
**Quiero** cambiar mi plan  
**Para** ajustar mis necesidades

**Criterios de Aceptación:**
- [ ] Si cambio a plan con MÁS usuarios:
  - [ ] El cambio se realiza normalmente
  - [ ] Los empleados existentes se mantienen vinculados
- [ ] Si pago **anualmente**:
  - [ ] NO se permite retroceder en el nivel del plan durante el período anual pagado
  - [ ] Solo se puede cambiar a un plan superior o mantener el actual
- [ ] Si pago **mensualmente** y cambio a plan con MENOS usuarios:
  - [ ] Se valida que no exceda el nuevo límite
  - [ ] Si excede, se debe eliminar empleados excedentes antes de cambiar
  - [ ] Se notifica a empleados que serán desvinculados (con período de gracia)
- [ ] Si cancelo mi suscripción:
  - [ ] Se degrada a Plan DEMO
  - [ ] Se desvinculan todos los empleados
  - [ ] Se notifica a todos los empleados

**Prioridad:** 🟡 MEDIA

---

### 4.2 Validación de Límites por Plan

#### **HU-007: Validar Límite de Materias Primas**

**Como** usuario con plan STARTER  
**Quiero** que el sistema valide el límite de materias primas  
**Para** no exceder mi plan

**Criterios de Aceptación:**
- [ ] Al crear materia prima, validar límite antes de crear
- [ ] STARTER: Máx. 20 materias primas
- [ ] Si intenta crear la 21ª:
  - [ ] Se muestra mensaje: "Has alcanzado el límite de 20 materias primas de tu plan STARTER"
  - [ ] Se ofrece upgrade a plan superior
- [ ] El límite se cuenta por granja o globalmente (definir)

**Prioridad:** 🔴 ALTA

---

#### **HU-008: Validar Límite de Proveedores**

**Como** usuario con plan STARTER  
**Quiero** que el sistema valide el límite de proveedores  
**Para** no exceder mi plan

**Criterios de Aceptación:**
- [ ] Al crear proveedor, validar límite antes de crear
- [ ] STARTER: Máx. 30 proveedores
- [ ] Si intenta crear el 31º:
  - [ ] Se muestra mensaje: "Has alcanzado el límite de 30 proveedores de tu plan STARTER"
  - [ ] Se ofrece upgrade a plan superior

**Prioridad:** 🔴 ALTA

---

#### **HU-009: Validar Límite de Fórmulas**

**Como** usuario con plan STARTER  
**Quiero** que el sistema valide el límite de fórmulas  
**Para** no exceder mi plan

**Criterios de Aceptación:**
- [ ] Al crear fórmula, validar límite antes de crear
- [ ] STARTER: Máx. 30 fórmulas
- [ ] Si intenta crear la 31ª:
  - [ ] Se muestra mensaje: "Has alcanzado el límite de 30 fórmulas de tu plan STARTER"
  - [ ] Se ofrece upgrade a plan superior

**Prioridad:** 🔴 ALTA

---

#### **HU-010: Validar Límite de Fabricaciones**

**Como** usuario con plan STARTER  
**Quiero** que el sistema valide el límite de fabricaciones  
**Para** no exceder mi plan

**Criterios de Aceptación:**
- [ ] Al crear fabricación, validar límite antes de crear
- [ ] STARTER: Máx. 1,000 fabricaciones
- [ ] Si intenta crear la 1,001ª:
  - [ ] Se muestra mensaje: "Has alcanzado el límite de 1,000 fabricaciones de tu plan STARTER"
  - [ ] Se ofrece upgrade a plan superior

**Prioridad:** 🔴 ALTA

---

#### **HU-011: Validar Límite de Compras**

**Como** usuario con plan STARTER  
**Quiero** que el sistema valide el límite de compras  
**Para** no exceder mi plan

**Criterios de Aceptación:**
- [ ] Al crear compra, validar límite antes de crear
- [ ] STARTER: Máx. 2,000 compras
- [ ] Si intenta crear la 2,001ª:
  - [ ] Se muestra mensaje: "Has alcanzado el límite de 2,000 compras de tu plan STARTER"
  - [ ] Se ofrece upgrade a plan superior

**Prioridad:** 🔴 ALTA

---

#### **HU-012: Validar Límite de Archivos Históricos**

**Como** usuario con plan BUSINESS  
**Quiero** que el sistema valide el límite de archivos históricos  
**Para** no exceder mi plan

**Criterios de Aceptación:**
- [ ] Al crear archivo histórico, validar límite antes de crear
- [ ] BUSINESS: Máx. 180 archivos
- [ ] STARTER: No disponible (no puede crear archivos históricos)
- [ ] Si intenta crear el 181º:
  - [ ] Se muestra mensaje: "Has alcanzado el límite de 180 archivos históricos de tu plan BUSINESS"
  - [ ] Se ofrece upgrade a plan superior

**Prioridad:** 🟡 MEDIA

---

### 4.3 Funcionalidades Premium

#### **HU-013: Acceder al Reporte Completo del Panel Principal**

**Como** usuario con plan ENTERPRISE  
**Quiero** acceder al reporte completo del panel principal  
**Para** tener una visión integral de mi operación

**Criterios de Aceptación:**
- [ ] ENTERPRISE: Reporte completo disponible
- [ ] DEMO/STARTER/BUSINESS: No disponible (botón oculto o deshabilitado)
- [ ] El reporte es una página web interactiva (NO se convierte a PDF)
- [ ] El reporte incluye todos los gráficos avanzados:
  1. Gráficos de distribución de materias primas en fórmulas
  2. Gráficos de evolución de costos de fórmulas
  3. Gráficos de fabricaciones por período
  4. Gráficos comparativos de fórmulas
  5. Gráficos de tendencias de precios
  6. Gráficos de consumo de materias primas
- [ ] El reporte incluye logo, fecha, y datos del usuario
- [ ] Validar que solo usuarios ENTERPRISE puedan acceder

**Prioridad:** 🟡 MEDIA

---

#### **HU-014: Ver Gráficos Avanzados**

**Como** usuario con plan BUSINESS  
**Quiero** ver gráficos avanzados de fórmulas y fabricaciones  
**Para** analizar mejor mi operación

**Criterios de Aceptación:**
- [ ] BUSINESS/ENTERPRISE: Gráficos avanzados disponibles
- [ ] DEMO/STARTER: Solo gráficos básicos (Panel Principal, Proveedores, Compras, Inventario)
- [ ] Gráficos avanzados de fórmulas (Módulo Fórmulas):
  - [ ] Materias primas más utilizadas
- [ ] Gráficos avanzados de fabricaciones (Módulo Fabricaciones):
  - [ ] Materias primas más utilizadas
  - [ ] Fórmulas más producidas
- [ ] Gráficos del reporte completo (Solo ENTERPRISE):
  - [ ] Gráficos de distribución de materias primas en fórmulas
  - [ ] Gráficos de evolución de costos de fórmulas
  - [ ] Gráficos de fabricaciones por período
  - [ ] Gráficos comparativos de fórmulas
  - [ ] Gráficos de tendencias de precios
  - [ ] Gráficos de consumo de materias primas

**Prioridad:** 🟡 MEDIA

---

#### **HU-015: Ver Historial de Fórmulas**

**Como** usuario con plan BUSINESS  
**Quiero** ver el historial de cambios de mis fórmulas  
**Para** rastrear modificaciones realizadas

**Criterios de Aceptación:**
- [ ] BUSINESS/ENTERPRISE: Historial de fórmulas disponible
- [ ] DEMO/STARTER: No disponible
- [ ] Los cambios se reflejan automáticamente en la tabla de auditoría
- [ ] Ver lista de cambios de cada fórmula (filtrar auditoría por tipo de cambio)
- [ ] Comparar entre versiones (mostrar cambios entre estados)
- [ ] ❌ **NO se implementará:** Restaurar a versión anterior

**Prioridad:** 🟢 BAJA

---

#### **HU-016: Restaurar Fabricaciones Eliminadas**

**Como** usuario con plan BUSINESS  
**Quiero** restaurar fabricaciones eliminadas  
**Para** recuperar datos eliminados por error

**Criterios de Aceptación:**
- [ ] BUSINESS/ENTERPRISE: Restaurar fabricaciones disponible
- [ ] DEMO/STARTER: No disponible
- [ ] Ver lista de fabricaciones eliminadas
- [ ] Restaurar fabricación eliminada
- [ ] Validar que la restauración no exceda límites del plan

**Prioridad:** 🟢 BAJA

---

#### **HU-017: Eliminación Automática de Datos DEMO**

**Como** usuario con plan DEMO  
**Quiero** ser notificado antes de que se eliminen mis datos  
**Para** decidir si migrar a un plan de pago

**Criterios de Aceptación:**
- [ ] Notificación 7 días antes de eliminación
- [ ] Notificación 3 días antes de eliminación
- [ ] Notificación 1 día antes de eliminación
- [ ] Opción de migrar a plan de pago antes de eliminación
- [ ] Eliminación automática después de 30 días si no migra
- [ ] Email de confirmación después de eliminación

**Prioridad:** 🟡 MEDIA

---

## 🎯 PARTE 5: PRIORIZACIÓN DE IMPLEMENTACIÓN

### 5.1 Prioridad CRÍTICA (P0) - Implementar Inmediatamente

1. **Sistema de Múltiples Usuarios (Usuarios Empleados)**
   - Impacto: 🔴 CRÍTICO
   - Complejidad: 🟡 MEDIA
   - Tiempo estimado: 2-3 semanas
   - Dependencias: Ninguna

2. **Validación de Límites por Plan (Materias Primas, Proveedores, Piensos, Compras, Fórmulas, Fabricaciones)**
   - Impacto: 🔴 CRÍTICO
   - Complejidad: 🟢 BAJA
   - Tiempo estimado: 1 semana
   - Dependencias: Ninguna

### 5.2 Prioridad ALTA (P1) - Implementar Próximamente

3. **Restricción de Reporte Completo por Plan**
   - Impacto: 🟡 MEDIO
   - Complejidad: 🟢 BAJA
   - Tiempo estimado: 1 día
   - Dependencias: Sistema de reportes web (ya existe)

4. **Gráficos Faltantes del Reporte Completo (4 gráficos específicos)**
   - Impacto: 🟡 ALTO
   - Complejidad: 🟡 MEDIA
   - Tiempo estimado: 1 semana
   - Dependencias: Librería de gráficos (ya existe), servicio de reporte completo (ya existe)
   - Gráficos a implementar:
     1. Gráficos de distribución de materias primas en fórmulas
     2. Gráficos de evolución de costos de fórmulas
     3. Gráficos de consumo de materias primas
     4. Gráficos de tendencias de precios
   - **Nota:** Los gráficos avanzados YA están implementados en módulos de Fórmulas y Fabricaciones

5. **Validación de Límites de Archivos Históricos**
   - Impacto: 🟡 MEDIO
   - Complejidad: 🟢 BAJA
   - Tiempo estimado: 3 días
   - Dependencias: Sistema de archivos históricos (ya existe)

### 5.3 Prioridad MEDIA (P2) - Implementar Después

6. **Historial de Fórmulas**
   - Impacto: 🟡 MEDIO
   - Complejidad: 🟡 MEDIA
   - Tiempo estimado: 1 semana
   - Dependencias: Sistema de fórmulas (ya existe)

7. **Restaurar Fabricaciones Eliminadas**
   - Impacto: 🟡 MEDIO
   - Complejidad: 🟢 BAJA
   - Tiempo estimado: 3 días
   - Dependencias: Sistema de fabricaciones (ya existe, tiene soft delete)

8. **Eliminación Automática de Datos DEMO**
   - Impacto: 🟡 MEDIO
   - Complejidad: 🟡 MEDIA
   - Tiempo estimado: 1 semana
   - Dependencias: Sistema de jobs/cron (implementar)

9. **Importación CSV Completa con Validaciones**
   - Impacto: 🟡 MEDIO
   - Complejidad: 🟡 MEDIA
   - Tiempo estimado: 1 semana
   - Dependencias: Sistema de importación (ya existe parcialmente)

### 5.4 Prioridad BAJA (P3) - Implementar en el Futuro

10. **Alertas WhatsApp** (Solo ENTERPRISE)
    - Impacto: 🟡 MEDIO
    - Complejidad: 🔴 ALTA
    - Tiempo estimado: 2-3 semanas
    - Dependencias: WhatsApp Business API

11. **Gestión IA** (Solo ENTERPRISE)
    - Impacto: 🟡 MEDIO
    - Complejidad: 🔴 ALTA
    - Tiempo estimado: 4-6 semanas
    - Dependencias: Servicios de IA (OpenAI, etc.)

**Nota:** Las funcionalidades de Capacitación Personalizada y Soporte Directo NO se implementarán, ya que son tareas que se realizan fuera de la aplicación.

---

## 📐 PARTE 6: ARQUITECTURA PROPUESTA - SISTEMA DE USUARIOS EMPLEADOS

### 6.1 Modelo de Datos Detallado

```prisma
model Usuario {
  // ... campos existentes ...
  
  // Sistema de usuarios empleados
  codigoReferencia        String?         @unique // Código único para invitar empleados
  fechaGeneracionCodigo   DateTime?       // Fecha de generación del código
  codigoExpiracion        DateTime?       // Fecha de expiración del código (opcional)
  esUsuarioEmpleado       Boolean         @default(false)
  idUsuarioDueño          String?         // ID del dueño si es empleado
  fechaVinculacion         DateTime?       // Fecha en que se vinculó como empleado
  rolEmpleado             RolEmpleado?    @default(EDITOR)
  activoComoEmpleado      Boolean         @default(true) // Para desvincular sin eliminar cuenta
  
  // Relaciones
  usuariosEmpleados       Usuario[]       @relation("UsuarioEmpleados")
  usuarioDueño             Usuario?        @relation("UsuarioEmpleados", fields: [idUsuarioDueño], references: [id])
  
  // Auditoría de empleados
  accionesEmpleado        Auditoria[]     @relation("AccionesEmpleado")
}

enum RolEmpleado {
  ADMIN      // Acceso completo (solo para dueño o empleado designado)
  EDITOR     // Puede crear, editar, eliminar
  LECTOR     // Solo lectura
}
```

### 6.2 Servicios Propuestos

#### **usuarioEmpleadoService.ts**

```typescript
// Generar código de referencia
export async function generarCodigoReferencia(usuarioId: string): Promise<string>

// Validar código de referencia
export async function validarCodigoReferencia(codigo: string): Promise<{ valido: boolean; usuarioDueño?: Usuario; error?: string }>

// Vincular usuario empleado
export async function vincularUsuarioEmpleado(empleadoId: string, codigoReferencia: string): Promise<void>

// Obtener usuarios empleados de un dueño
export async function obtenerUsuariosEmpleados(usuarioDueñoId: string): Promise<Usuario[]>

// Eliminar usuario empleado
export async function eliminarUsuarioEmpleado(usuarioDueñoId: string, empleadoId: string): Promise<void>

// Cambiar rol de empleado
export async function cambiarRolEmpleado(usuarioDueñoId: string, empleadoId: string, nuevoRol: RolEmpleado): Promise<void>

// Validar límite de usuarios empleados
export async function validarLimiteUsuariosEmpleados(usuarioDueñoId: string): Promise<{ puedeAgregar: boolean; limite: number; actual: number }>

// Obtener plantas accesibles para empleado
export async function obtenerPlantasAccesibles(empleadoId: string): Promise<Granja[]>
```

### 6.3 Controladores Propuestos

#### **usuarioEmpleadoController.ts**

```typescript
// GET /api/usuarios/empleados/codigo-referencia
// Generar código de referencia
export async function generarCodigoReferencia(req: Request, res: Response)

// GET /api/usuarios/empleados
// Obtener lista de empleados
export async function obtenerUsuariosEmpleados(req: Request, res: Response)

// POST /api/usuarios/empleados/vincular
// Vincular empleado con código
export async function vincularEmpleado(req: Request, res: Response)

// DELETE /api/usuarios/empleados/:empleadoId
// Eliminar empleado
export async function eliminarEmpleado(req: Request, res: Response)

// PUT /api/usuarios/empleados/:empleadoId/rol
// Cambiar rol de empleado
export async function cambiarRolEmpleado(req: Request, res: Response)

// GET /api/usuarios/empleados/limite
// Obtener información de límite
export async function obtenerLimiteUsuarios(req: Request, res: Response)
```

### 6.4 Middleware Propuesto

#### **validarAccesoGranja.ts**

```typescript
// Middleware para validar que el usuario tiene acceso a la granja
// Si es empleado, verificar que la granja pertenece a su dueño
export async function validarAccesoGranja(req: Request, res: Response, next: NextFunction)
```

---

## 🔒 PARTE 7: CONSIDERACIONES DE SEGURIDAD

### 7.1 Seguridad del Código de Referencia

**Problemas Potenciales:**
- Código adivinable
- Código compartido públicamente
- Código sin expiración

**Soluciones Propuestas:**
1. **Código Aleatorio Largo:**
   - Formato: `REF-{PLAN}-{8 caracteres aleatorios}`
   - Ejemplo: `REF-STARTER-A1B2C3D4`
   - Usar crypto para generar códigos seguros

2. **Expiración:**
   - Código válido por 30 días (configurable)
   - Regenerar código invalida el anterior

3. **Límite de Usos:**
   - Cada código puede usarse solo una vez
   - Después de usar, se invalida automáticamente

4. **Rate Limiting:**
   - Limitar intentos de validación de código (ej: 5 intentos por hora)
   - Prevenir fuerza bruta

### 7.2 Permisos y Roles

**Roles Propuestos:**
- **ADMIN (Dueño):** Acceso completo, puede gestionar empleados
- **ADMIN (Empleado):** Acceso completo a plantas del dueño, puede gestionar otros empleados (si el dueño lo permite)
- **EDITOR:** Puede crear, editar, eliminar registros
- **LECTOR:** Solo lectura, no puede modificar nada

**Validaciones:**
- El empleado solo puede acceder a plantas del dueño
- El empleado no puede crear sus propias plantas
- El empleado no puede vincular sus propios empleados
- Todas las acciones del empleado quedan registradas en auditoría

### 7.3 Auditoría

**Registros Requeridos:**
- Quién hizo la acción (dueño vs empleado)
- Cuándo se hizo la acción
- Qué acción se hizo
- En qué granja se hizo
- Cambios realizados (antes/después)

---

## 📊 PARTE 8: MÉTRICAS Y MONITOREO

### 8.1 Métricas a Implementar

1. **Uso por Plan:**
   - Cantidad de usuarios por plan
   - Usuarios que alcanzan límites
   - Tasa de conversión DEMO → Pago

2. **Uso de Funcionalidades:**
   - Usuarios que usan múltiples usuarios
   - Usuarios que generan reportes PDF
   - Usuarios que usan gráficos avanzados

3. **Límites Alcanzados:**
   - Frecuencia de límites alcanzados por tipo
   - Planes más afectados
   - Tasa de upgrade después de alcanzar límite

### 8.2 Alertas Recomendadas

1. **Límite Próximo:**
   - Alertar cuando el usuario está al 80% del límite
   - Ofrecer upgrade

2. **Límite Alcanzado:**
   - Alertar cuando el usuario alcanza el límite
   - Bloquear creación hasta upgrade

3. **Expiración DEMO:**
   - Alertar 7, 3, 1 día antes de eliminación
   - Ofrecer migración a plan de pago

---

## ✅ PARTE 9: CONCLUSIÓN Y RECOMENDACIONES

### 9.1 Evaluación de la Propuesta de Usuarios Empleados

**Veredicto:** ✅ **APROBADA CON MEJORAS**

La propuesta es sólida y adecuada para el modelo de negocio. Las mejoras aceptadas y a implementar son:

1. ✅ **Códigos de referencia seguros** (aleatorios, con expiración)
2. ✅ **Gestión de permisos** (empleados: acceso completo excepto gestión de cuentas y auditoría)
3. ✅ **Sistema de invitaciones por email** (invitar por email directamente)
4. ✅ **Notificaciones** (email al agregar/eliminar empleados)
5. ✅ **Validación de límites** (antes de agregar empleados)
6. ✅ **Manejo de cambios de plan** (anual: no retroceder, mensual: degradar con validaciones)
7. ✅ **Auditoría mejorada** (registrar acciones de empleados, solo cuenta dueña puede ver auditoría)

### 9.2 Plan de Implementación Recomendado

#### **Fase 1: Sistema de Usuarios Empleados (2-3 semanas)**
1. Semana 1: Modelo de datos y servicios backend
2. Semana 2: Controladores y rutas API
3. Semana 3: Frontend y testing

#### **Fase 2: Validación de Límites (1 semana)**
1. Día 1-2: Middleware de validación
2. Día 3-4: Integración en controladores
3. Día 5: Testing

#### **Fase 3: Funcionalidades Premium (2-3 semanas)**
1. Día 1: Restricción de Reporte Completo por Plan (solo ENTERPRISE)
2. Semana 1: Gráficos faltantes del reporte completo (4 gráficos específicos):
   - Gráficos de distribución de materias primas en fórmulas
   - Gráficos de evolución de costos de fórmulas
   - Gráficos de consumo de materias primas
   - Gráficos de tendencias de precios
3. Semana 2: Historial de fórmulas (visualización desde auditoría)
4. Semana 3: Testing y ajustes

### 9.3 Próximos Pasos

1. **Aprobar arquitectura** de usuarios empleados
2. **Crear tareas** en sistema de gestión de proyectos
3. **Asignar prioridades** según este documento
4. **Iniciar implementación** de Fase 1

---

## 📚 ANEXOS

### Anexo A: Glosario de Términos

- **Dueño:** Usuario que pagó un plan y puede vincular empleados
- **Empleado:** Usuario vinculado a un dueño mediante código de referencia
- **Código de Referencia:** Código único generado por el dueño para invitar empleados
- **Plan DEMO:** Plan gratuito de 30 días con límites reducidos
- **Límite:** Restricción numérica o funcional según el plan de suscripción

### Anexo B: Referencias

- Documentación de planes: `backend/src/constants/planes.ts`
- Schema de base de datos: `backend/prisma/schema.prisma`
- Middleware de validación: `backend/src/middleware/validatePlanLimits.ts`

---

---

## 📝 PARTE 10: RESUMEN DE CAMBIOS Y OBSERVACIONES

### 10.1 Cambios Aplicados según Observaciones del Usuario

#### ✅ **Cambios Aplicados:**

1. **Reportes PDF (2.3.3):**
   - ❌ Eliminado: Generación de reportes PDF
   - ✅ Reemplazado por: Reporte Completo del Panel Principal (solo ENTERPRISE)
   - ✅ NO se requiere convertir a PDF - se mantiene como página web interactiva

2. **Gráficos Avanzados (2.3.4):**
   - ✅ Clasificación actualizada: Básicos vs Avanzados según módulos específicos
   - ✅ Gráficos básicos: Panel Principal, Proveedores, Compras, Inventario
   - ✅ Gráficos avanzados: Fórmulas (Materias primas más utilizadas), Fabricaciones (Materias primas más utilizadas, Fórmulas más producidas)
   - ✅ Gráficos del reporte completo: Solo ENTERPRISE (6 gráficos específicos)

3. **Historial de Fórmulas (2.3.5):**
   - ✅ Se refleja en tabla de auditoría
   - ❌ NO se implementará: Restauración a versiones anteriores

4. **Archivos Históricos (2.3.7):**
   - ✅ Aclarado: Se refiere a "Archivos & Snapshots" en módulo de Configuraciones
   - ✅ STARTER no tiene acceso a esta funcionalidad

5. **Importación CSV Completa (2.3.8):**
   - ✅ Tablas específicas por plan definidas:
     - DEMO: Materias Primas, Proveedores, Fórmulas, Piensos (4 tablas)
     - STARTER: Materias Primas, Proveedores (2 tablas)
     - BUSINESS/ENTERPRISE: Materias Primas, Proveedores, Fórmulas, Piensos (4 tablas)
   - ✅ Solo cuando está vacío (para todos los planes)
   - ✅ Tablas que intervienen en cálculos NO se pueden importar

6. **Funcionalidades Premium (2.3.10):**
   - ✅ Solo se implementarán: Alertas WhatsApp y Gestión IA
   - ❌ NO se implementarán: Capacitación Personalizada y Soporte Directo (tareas fuera de la app)

7. **Sistema de Usuarios Empleados (3.2):**
   - ✅ Gestión de Permisos: Empleados tienen acceso a todo excepto gestión de cuentas y auditoría
   - ✅ Cambio de Plan: Si paga anual, NO puede retroceder. Si paga mensual, puede degradar con validaciones
   - ✅ Mejoras a implementar: Sistema de Invitaciones por Email, Notificaciones, Auditoría Mejorada

### 10.2 Inconsistencias Detectadas y Resueltas

#### ⚠️ **Inconsistencias Corregidas:**

1. **Gráficos de Fórmulas y Fabricaciones:**
   - ❌ Antes: Se mencionaban como "No disponible" para DEMO/STARTER
   - ✅ Ahora: Se aclara que son gráficos avanzados solo para BUSINESS/ENTERPRISE

2. **Reportes PDF:**
   - ❌ Antes: Se mencionaba para BUSINESS y ENTERPRISE
   - ✅ Ahora: Solo Reporte Completo para ENTERPRISE (página web, no PDF)

3. **Importación CSV:**
   - ❌ Antes: "Todas las tablas" era ambiguo
   - ✅ Ahora: Tablas específicas definidas por plan, excluyendo tablas que intervienen en cálculos

### 10.3 Notas Importantes para Implementación

1. **Reporte Completo:**
   - Ya existe como página web en `/granja/[id]/reporte-completo`
   - Solo falta agregar validación para que solo usuarios ENTERPRISE puedan acceder
   - NO requiere conversión a PDF

2. **Gráficos:**
   - ✅ Los gráficos básicos ya están implementados en sus respectivos módulos
   - ✅ Los gráficos avanzados YA están implementados en módulos de Fórmulas y Fabricaciones
   - ⚠️ **Faltan 4 gráficos específicos en el reporte completo** (`/granja/[id]/reporte-completo`):
     1. Gráficos de distribución de materias primas en fórmulas
     2. Gráficos de evolución de costos de fórmulas
     3. Gráficos de consumo de materias primas
     4. Gráficos de tendencias de precios
   - ⚠️ Los gráficos del panel principal NO deben modificarse
   - ⚠️ Los nuevos gráficos deben agregarse solo al reporte completo existente

3. **Sistema de Usuarios Empleados:**
   - Los empleados NO pueden acceder a:
     - Gestión de cuentas empleados (solo cuenta dueña)
     - Auditoría (solo cuenta dueña)
   - Todas las demás funcionalidades están disponibles para empleados

4. **Cambio de Plan:**
   - Validar período de facturación (anual vs mensual) antes de permitir degradación
   - Si es anual: Bloquear degradación durante el período pagado
   - Si es mensual: Permitir degradación con validaciones

---

## 🗺️ PARTE 11: RUTA DE IMPLEMENTACIÓN PRIORIZADA

### 11.1 Resumen de Estado Actual

**Funcionalidades Implementadas:**
- ✅ Sistema de autenticación y usuarios
- ✅ Gestión completa de granjas, materias primas, proveedores, compras, inventario, fórmulas, fabricaciones
- ✅ Sistema de suscripciones y pagos (Mercado Pago)
- ✅ Reporte completo básico (página web interactiva)
- ✅ Gráficos básicos en todos los módulos
- ✅ Gráficos avanzados YA implementados en módulos de Fórmulas y Fabricaciones

**Funcionalidades Pendientes Críticas:**
- ❌ Sistema de múltiples usuarios (empleados)
- ❌ Validación de límites por plan (excepto granjas)
- ⚠️ Restricción de reporte completo por plan (solo ENTERPRISE)
- ⚠️ 4 gráficos faltantes en reporte completo

**Funcionalidades Pendientes No Críticas:**
- ⚠️ Historial de fórmulas (visualización)
- ⚠️ Restaurar fabricaciones eliminadas
- ⚠️ Eliminación automática de datos DEMO
- ⚠️ Importación CSV completa con validaciones
- ⚠️ Validación de límites de archivos históricos
- ❌ Sistema de notificaciones (email)
- ❌ Alertas WhatsApp (ENTERPRISE)
- ❌ Gestión IA (ENTERPRISE)

### 11.2 Ruta de Implementación Recomendada

#### **SPRINT 1: Fundamentos Críticos (3-4 semanas)**

**Semana 1-2: Sistema de Usuarios Empleados (CRÍTICO)**
- [x] Día 1-2: Actualizar modelo de datos (Prisma schema)
  - Agregar campos: `codigoReferencia`, `esUsuarioEmpleado`, `idUsuarioDueño`, `fechaVinculacion`
  - Agregar relación `UsuarioEmpleados`
  - Ejecutar migración
- [x] Día 3-5: Backend - Servicios
  - `usuarioEmpleadoService.ts`: Generar código, validar código, vincular empleado
  - Validación de límites por plan
  - Obtener plantas accesibles para empleado
- [x] Día 6-7: Backend - Controladores y Rutas
  - `usuarioEmpleadoController.ts`: CRUD de empleados
  - Rutas API: `/api/usuarios/empleados/*`
- [x] Día 8-10: Frontend - Gestión de Empleados
  - Página de gestión de empleados (`/granja/[id]/configuracion/empleados`)
  - Generar código de referencia
  - Invitar por email
  - Lista de empleados vinculados
  - Eliminar empleado
- [x] Día 11-12: Frontend - Registro con Código
  - Modificar página de registro para incluir código de referencia
  - Validación de código durante registro
  - Vinculación automática
- [x] Día 13-14: Middleware y Validaciones
  - `validarAccesoGranja.ts`: Validar acceso de empleados a granjas
  - Actualizar controladores para usar middleware
  - Testing

**Semana 3: Validación de Límites por Plan (CRÍTICO)**
- [x] Día 1-2: Middleware de validación de límites
  - Crear `validatePlanLimits.ts`
  - Validar límites para: materias primas, proveedores, piensos, compras, fórmulas, fabricaciones
- [x] Día 3-4: Integración en controladores
  - Actualizar controladores de creación para validar límites
  - Mensajes de error claros con opción de upgrade
- [x] Día 5: Testing y ajustes

**Semana 4: Restricción de Reporte Completo y Notificaciones Básicas**
- [x] Día 1: Restricción de Reporte Completo por Plan
  - Agregar validación en `reporteCompletoController.ts`
  - Verificar plan ENTERPRISE antes de permitir acceso
  - Ocultar botón en frontend para planes no ENTERPRISE
- [x] Día 2-5: Sistema de Notificaciones (Email)
  - Servicio de notificaciones (`notificacionService.ts`)
  - Templates de email para:
    - Empleado agregado
    - Empleado eliminado
    - Empleado acepta invitación
    - Notificación antes de eliminar empleado
  - Integrar con sistema de empleados
- [x] Día 5: Testing

**Entregables Sprint 1:**
- ✅ Sistema de usuarios empleados funcional
- ✅ Validación de límites por plan implementada
- ✅ Reporte completo restringido a ENTERPRISE
- ✅ Sistema de notificaciones básico funcionando

---

#### **SPRINT 2: Gráficos y Visualizaciones (2 semanas)**

**Semana 1: Gráficos Faltantes del Reporte Completo**
- [x] Día 1-2: Backend - Datos para gráficos
  - Extender `reporteCompletoService.ts` con nuevas consultas:
    - Distribución de materias primas en fórmulas (por fórmula)
    - Evolución de costos de fórmulas (histórico temporal)
    - Consumo de materias primas (por período)
    - Tendencias de precios (histórico de precios por materia prima)
- [x] Día 3-4: Frontend - Componentes de Gráficos
  - `DistribucionMateriasFormulasChart.tsx` (Donut/Pie chart)
  - `EvolucionCostosFormulasChart.tsx` (Line chart con múltiples series)
  - `ConsumoMateriasPrimasChart.tsx` (Bar chart agrupado por período)
  - `TendenciasPreciosChart.tsx` (Line chart con múltiples líneas)
- [x] Día 5: Integración en Reporte Completo
  - Agregar los 4 gráficos a `/granja/[id]/reporte-completo/page.tsx`
  - Diseño responsive y consistente con el resto del reporte
  - Testing

**Semana 2: Historial de Fórmulas**
- [x] Día 1-2: Backend - Endpoint de historial
  - Filtrar auditoría por tipo de cambio (fórmulas)
  - Agrupar cambios por fórmula
  - Endpoint: `GET /api/formulas/:id/historial`
- [x] Día 3-4: Frontend - Visualización de Historial
  - Componente de comparación de versiones
  - Lista de cambios por fórmula
  - Vista de diferencias (antes/después)
- [x] Día 5: Testing y ajustes

**Entregables Sprint 2:**
- ✅ 4 gráficos nuevos en reporte completo
- ✅ Historial de fórmulas visualizable

---

#### **SPRINT 3: Funcionalidades Complementarias (2 semanas)**

**Semana 1: Validaciones y Mejoras**
- [x] Día 1-2: Validación de Límites de Archivos Históricos
  - Bloquear acceso para STARTER
  - Validar límites para DEMO (3) y BUSINESS (180)
- [x] Día 3-4: Importación CSV Completa con Validaciones
  - Validar límites antes de importar
  - Restricción de tablas según plan
  - Validar que solo se pueda importar 1 vez cuando está vacío
  - Bloquear importación de tablas que intervienen en cálculos
- [x] Día 5: Eliminación Permanente de Fabricaciones
  - Las fabricaciones se eliminan permanentemente (hard delete)
  - Se restauran las cantidades en inventario automáticamente
  - No existe funcionalidad de restaurar fabricaciones

**Semana 2: Eliminación Automática de Datos DEMO**
- [x] Día 1-2: Job Automático
  - ✅ Crear servicio de jobs/cron (`demoCleanupJob.ts`)
  - ✅ Verificar usuarios DEMO con más de 30 días (`demoCleanupService.ts`)
  - ✅ Notificaciones: 10 días antes, 5 días antes, 1 día antes (`notificacionService.ts`)
- [x] Día 3-4: Proceso de Eliminación
  - ✅ Opción de migrar a plan de pago antes de eliminación (enlaces en emails)
  - ✅ Eliminación automática después de 30 días
  - ✅ Email de confirmación después de eliminación
- [ ] Día 5: Testing

**Entregables Sprint 3:**
- ✅ Validación de límites de archivos históricos
- ✅ Importación CSV completa con validaciones
- ✅ Restaurar fabricaciones eliminadas
- ✅ Eliminación automática de datos DEMO

---

#### **SPRINT 4: Funcionalidades Premium (6-8 semanas)**

**Semana 1-2: Alertas WhatsApp (ENTERPRISE)**
- [ ] Configuración de WhatsApp Business API
- [ ] Servicio de envío de alertas
- [ ] Integración con sistema de alertas existente
- [ ] Configuración de tipos de alertas (stock bajo, sin stock, etc.)

**Semana 3-8: Gestión IA (ENTERPRISE)**
- [ ] Semana 3-4: Análisis Predictivo
  - Integración con servicios de IA (OpenAI/Anthropic)
  - Análisis de tendencias de consumo
  - Predicción de necesidades de compra
- [ ] Semana 5-6: Recomendaciones Inteligentes
  - Recomendaciones de optimización de fórmulas
  - Sugerencias de proveedores según historial
  - Alertas proactivas basadas en patrones
- [ ] Semana 7-8: Testing y Ajustes
  - Testing completo de funcionalidades IA
  - Ajustes de prompts y modelos
  - Optimización de costos de API

**Entregables Sprint 4:**
- ✅ Alertas WhatsApp funcionando
- ✅ Gestión IA implementada

---

### 11.3 Orden de Implementación Recomendado

**Fase 1 (Crítica - 4 semanas):**
1. Sistema de Usuarios Empleados
2. Validación de Límites por Plan
3. Restricción de Reporte Completo
4. Sistema de Notificaciones Básico

**Fase 2 (Alta Prioridad - 2 semanas):**
5. Gráficos Faltantes del Reporte Completo (4 gráficos)
6. Historial de Fórmulas

**Fase 3 (Media Prioridad - 2 semanas):**
7. Validación de Límites de Archivos Históricos
8. Importación CSV Completa con Validaciones
9. Restaurar Fabricaciones Eliminadas
10. Eliminación Automática de Datos DEMO

**Fase 4 (Baja Prioridad - 6-8 semanas):**
11. Alertas WhatsApp (ENTERPRISE)
12. Gestión IA (ENTERPRISE)

**Tiempo Total Estimado:** 14-16 semanas (3.5-4 meses)

---

### 11.4 Dependencias y Bloqueadores

**Bloqueadores Críticos:**
- Sistema de Usuarios Empleados debe completarse antes de validar límites de usuarios
- Validación de Límites debe completarse antes de otras validaciones

**Dependencias:**
- Gráficos del reporte completo dependen de datos del servicio `reporteCompletoService`
- Historial de fórmulas depende de sistema de auditoría existente
- Alertas WhatsApp y Gestión IA pueden desarrollarse en paralelo después de Fase 1

---

### 11.5 Propuesta de Inicio: Gráficos del Reporte Completo

**¿Por dónde comenzar?**

**Opción Recomendada: Gráficos del Reporte Completo (Sprint 2, Semana 1)**

**Razones:**
1. ✅ **Bajo riesgo:** No afecta funcionalidades críticas existentes
2. ✅ **Alto valor:** Mejora inmediata para usuarios ENTERPRISE
3. ✅ **Dependencias mínimas:** Solo requiere extender `reporteCompletoService.ts`
4. ✅ **Rápido de implementar:** 1 semana estimada
5. ✅ **Visible:** Los usuarios verán mejoras inmediatas

**Pasos Sugeridos:**

1. **Día 1-2: Backend - Preparar Datos**
   ```typescript
   // En reporteCompletoService.ts agregar:
   - distribucionMateriasEnFormulas: Array<{formula: string, materias: Array<{nombre: string, porcentaje: number}>}>
   - evolucionCostosFormulas: Array<{fecha: Date, formula: string, costo: number}>
   - consumoMateriasPrimas: Array<{periodo: string, materia: string, cantidad: number}>
   - tendenciasPrecios: Array<{fecha: Date, materia: string, precio: number}>
   ```

2. **Día 3-4: Frontend - Crear Componentes**
   - Crear los 4 componentes de gráficos usando Recharts
   - Seguir el estilo de los gráficos existentes

3. **Día 5: Integración**
   - Agregar los gráficos a la página de reporte completo
   - Testing y ajustes visuales

**Alternativa:** Si prefieres comenzar con funcionalidades críticas, sigue el orden del Sprint 1 (Sistema de Usuarios Empleados primero).

---

**Documento actualizado:** Noviembre 2024  
**Versión:** 1.2  
**Autor:** Sistema de Análisis REFORMA  
**Última revisión:** Con observaciones del usuario y ruta de implementación completa

