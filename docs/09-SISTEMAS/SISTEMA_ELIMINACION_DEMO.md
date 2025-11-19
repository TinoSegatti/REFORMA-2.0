# Sistema de Eliminación Automática de Datos DEMO

## 📋 Descripción

Sistema automático que elimina los datos de usuarios con plan DEMO después de 30 días de registro, enviando notificaciones por email antes de la eliminación.

## 🔔 Notificaciones por Email

El sistema envía notificaciones automáticas a los usuarios DEMO en las siguientes fechas:

- **10 días antes** (día 20): Notificación informativa con información sobre planes y descuentos anuales
- **5 días antes** (día 25): Recordatorio urgente con énfasis en el descuento anual
- **1 día antes** (día 29): Notificación final urgente antes de la eliminación
- **Después de eliminación** (día 30+): Confirmación de eliminación de datos

### Contenido de las Notificaciones

Todas las notificaciones incluyen:
- Información sobre la fecha de expiración
- Enlaces a la página de planes (`/planes`)
- **Énfasis en el descuento del 17%** al pagar anualmente
- Recomendación del plan STARTER anual como mejor opción
- Lista de datos que se perderán si no actualizan

## ⚙️ Configuración

### Variables de Entorno

Agregar al archivo `.env`:

```env
# Habilitar job de limpieza DEMO (true para producción)
ENABLE_DEMO_CLEANUP=true

# Expresión cron para ejecutar el job (opcional, por defecto: todos los días a las 2:00 AM)
DEMO_CLEANUP_CRON=0 2 * * *

# URL del frontend (para enlaces en emails)
FRONTEND_URL=http://localhost:3001
```

### Expresiones Cron

El formato es: `segundo minuto hora día mes día-semana`

Ejemplos:
- `0 2 * * *` - Todos los días a las 2:00 AM (por defecto)
- `0 0 * * *` - Todos los días a medianoche
- `0 */6 * * *` - Cada 6 horas
- `0 2 * * 1` - Todos los lunes a las 2:00 AM

## 📁 Archivos Creados

### Servicios

1. **`backend/src/services/demoCleanupService.ts`**
   - `obtenerUsuariosDemoParaNotificacion()` - Obtiene usuarios según días transcurridos
   - `enviarNotificacionesDemo()` - Envía todas las notificaciones pendientes
   - `eliminarDatosUsuarioDemo(usuarioId)` - Elimina todos los datos de un usuario DEMO
   - `procesarEliminacionDatosDemo()` - Procesa eliminaciones de usuarios que cumplieron 30 días
   - `ejecutarLimpiezaDemo()` - Ejecuta el proceso completo

2. **`backend/src/services/notificacionService.ts`** (actualizado)
   - `notificarEliminacionDemo10Dias()` - Notificación 10 días antes
   - `notificarEliminacionDemo5Dias()` - Notificación 5 días antes
   - `notificarEliminacionDemo1Dia()` - Notificación 1 día antes
   - `notificarDatosEliminadosDemo()` - Notificación después de eliminación

### Jobs

3. **`backend/src/jobs/demoCleanupJob.ts`**
   - `iniciarJobLimpiezaDemo()` - Inicia el job programado con cron
   - `ejecutarJobLimpiezaDemoManual()` - Ejecuta el job manualmente (para testing)

### Scripts de Testing

4. **`backend/scripts/test-demo-cleanup.ts`**
   - Script para probar el sistema sin ejecutar eliminaciones reales

## 🚀 Uso

### Ejecución Automática

El job se ejecuta automáticamente cuando:
- `NODE_ENV=production` O
- `ENABLE_DEMO_CLEANUP=true`

### Ejecución Manual (Testing)

```bash
# Ver usuarios que serían notificados/eliminados (sin ejecutar)
npm run test-demo-cleanup

# Ejecutar limpieza manualmente (solo en desarrollo)
POST /api/admin/demo-cleanup/manual
```

## 🗑️ Proceso de Eliminación

Cuando un usuario DEMO cumple 30 días, se eliminan en orden:

1. Detalles de fabricaciones
2. Fabricaciones
3. Detalles de compras
4. Compras
5. Detalles de fórmulas
6. Fórmulas
7. Inventario inicial
8. Inventario
9. Detalles de archivos
10. Archivos cabecera
11. Materias primas
12. Proveedores
13. Animales (piensos)
14. Auditorías
15. Granjas
16. Pagos y suscripciones
17. Desvincular usuarios empleados (si el usuario era dueño)

**Nota:** El usuario NO se elimina, solo sus datos. Puede volver a registrarse o actualizar a un plan de pago.

## 📊 Lógica de Clasificación

Los usuarios se clasifican según días transcurridos desde `fechaRegistro`:

- **20-24 días**: Notificación 10 días antes
- **25-28 días**: Notificación 5 días antes
- **29-29 días**: Notificación 1 día antes
- **30+ días**: Eliminación de datos

## 🔒 Seguridad

- Solo se procesan usuarios con `planSuscripcion === DEMO`
- Solo se procesan usuarios `activos`
- Se verifica nuevamente el plan antes de eliminar (por si cambió)
- Los usuarios empleados vinculados se desvinculan pero NO se eliminan

## 📝 Logs

El sistema registra:
- Usuarios encontrados para cada categoría
- Notificaciones enviadas exitosamente
- Errores al enviar notificaciones
- Eliminaciones procesadas
- Errores durante eliminación

## ⚠️ Consideraciones

1. **Emails**: Requiere configuración SMTP válida
2. **Timezone**: El job usa `America/Argentina/Buenos_Aires`
3. **Ejecución**: Se recomienda ejecutar una vez al día
4. **Testing**: Usar el script de test antes de producción
5. **Backup**: Considerar hacer backup antes de eliminar datos importantes

## 🧪 Testing

```bash
# Ver qué usuarios serían procesados
npm run test-demo-cleanup

# Ejecutar limpieza manual (solo desarrollo)
curl -X POST http://localhost:3000/api/admin/demo-cleanup/manual
```

## 📈 Monitoreo

Revisar logs del servidor para:
- Cantidad de notificaciones enviadas
- Cantidad de usuarios eliminados
- Errores durante el proceso

