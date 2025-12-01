# Tests de CORINA Fase 1

## Resumen de Tests Implementados

### Tests Unitarios (Jest)

1. **validateEnterpriseFeature.test.ts**
   - Validación de middleware ENTERPRISE
   - Validación de empleados (herencia de plan)
   - Casos de error y éxito

2. **corinaNotificacionService.test.ts**
   - Detección de alertas
   - Envío de notificaciones
   - Listado de alertas
   - Verificación de notificaciones activas

3. **corinaController.test.ts**
   - Endpoints de configuración
   - Verificación de teléfono
   - Obtención de notificaciones
   - Manejo de errores

4. **integracion-alertas.test.ts**
   - Flujo completo de alertas
   - Integración con servicios existentes
   - Resolución de alertas

### Tests End-to-End

**test-corina-fase1.ts** - Script de prueba completo que verifica:
- ✅ Configuración de variables de entorno
- ✅ Existencia de usuario ENTERPRISE
- ✅ Modelos de base de datos
- ⚠️ Teléfono verificado (requiere configuración manual)
- ⚠️ Notificaciones activas (requiere configuración manual)

## Ejecutar Tests

### Tests Unitarios (Jest)
```bash
npm run test:corina
```

### Tests End-to-End
```bash
npm run test-corina-fase1
```

## Configuración Requerida para Tests Completos

Para que todos los tests pasen, necesitas:

1. **Usuario con plan ENTERPRISE**
   - Ya existe: `test-sprint1-enterprise@test.com`

2. **Verificar teléfono del usuario**
   ```bash
   # Desde la aplicación web o API:
   POST /api/corina/whatsapp/verificar-telefono/iniciar
   Body: { "telefono": "+5493515930163" }
   
   # Luego verificar el código recibido:
   POST /api/corina/whatsapp/verificar-telefono/verificar
   Body: { "codigo": "123456" }
   ```

3. **Activar notificaciones**
   ```bash
   PUT /api/corina/configurar
   Body: { "notificacionesWhatsAppActivas": true }
   ```

## Resultados de Tests

### Última Ejecución
- ✅ Configuración: OK
- ✅ Usuario ENTERPRISE: OK
- ✅ Modelos BD: OK
- ⚠️ Teléfono verificado: Requiere configuración manual
- ⚠️ Envío de mensaje: Requiere teléfono verificado
- ⚠️ Consulta de alertas: Requiere usuario con granja

## Próximos Pasos

1. Verificar teléfono del usuario ENTERPRISE
2. Activar notificaciones
3. Probar flujo completo:
   - Crear compra/fabricación que genere alerta
   - Verificar que se envía notificación por WhatsApp
   - Probar consulta por WhatsApp: "CORINA alertas"

## Notas

- Los tests unitarios están completos y funcionando
- Los tests de integración requieren datos reales en BD
- El script end-to-end valida la configuración completa
- Los tests que fallan son por falta de configuración manual, no por errores en el código






