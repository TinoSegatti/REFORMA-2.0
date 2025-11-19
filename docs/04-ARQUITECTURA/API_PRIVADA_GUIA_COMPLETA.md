# 🔐 API Privada - Guía Completa para Clientes Enterprise

## 📋 Índice

1. [¿Qué es una API Privada?](#qué-es-una-api-privada)
2. [Funciones y Posibilidades](#funciones-y-posibilidades)
3. [Medio de Entrega](#medio-de-entrega)
4. [Capacidades Técnicas Necesarias](#capacidades-técnicas-necesarias)
5. [Casos de Uso Prácticos](#casos-de-uso-prácticos)
6. [Ejemplos de Integración](#ejemplos-de-integración)
7. [Seguridad y Limitaciones](#seguridad-y-limitaciones)
8. [Soporte y Documentación](#soporte-y-documentación)

---

## 🎯 ¿Qué es una API Privada?

Una **API Privada** (Application Programming Interface) es un conjunto de endpoints programáticos que permiten a sistemas externos interactuar con REFORMA de forma automatizada, sin necesidad de usar la interfaz web.

### Diferencias Clave: API vs Interfaz Web

| Característica | Interfaz Web | API Privada |
|---|---|---|
| **Acceso** | Navegador web | Cualquier aplicación/programa |
| **Interacción** | Manual (clicks, formularios) | Automatizada (código) |
| **Integración** | No integrable | Integrable con otros sistemas |
| **Automatización** | No automatizable | Completamente automatizable |
| **Escalabilidad** | Limitada por usuario | Ilimitada (múltiples sistemas) |

---

## 🚀 Funciones y Posibilidades

### 1. **Gestión Completa de Datos**

#### Materias Primas
- ✅ **Obtener** lista de materias primas
- ✅ **Crear** nuevas materias primas
- ✅ **Actualizar** materias primas existentes
- ✅ **Eliminar** materias primas
- ✅ **Importar** desde CSV
- ✅ **Exportar** a CSV

#### Proveedores
- ✅ **Obtener** lista de proveedores
- ✅ **Crear** nuevos proveedores
- ✅ **Actualizar** proveedores existentes
- ✅ **Eliminar** proveedores
- ✅ **Importar** desde CSV
- ✅ **Exportar** a CSV

#### Piensos/Animales
- ✅ **Obtener** lista de piensos
- ✅ **Crear** nuevos piensos
- ✅ **Actualizar** piensos existentes
- ✅ **Eliminar** piensos
- ✅ **Importar** desde CSV
- ✅ **Exportar** a CSV

#### Compras
- ✅ **Obtener** lista de compras
- ✅ **Crear** nuevas compras (cabecera + detalles)
- ✅ **Agregar** múltiples items a una compra
- ✅ **Actualizar** compras existentes
- ✅ **Eliminar** compras
- ✅ **Obtener** detalle de compra
- ✅ **Exportar** a CSV

#### Inventario
- ✅ **Obtener** inventario completo
- ✅ **Actualizar** cantidad real
- ✅ **Sincronizar** inventario
- ✅ **Obtener** alertas de stock
- ✅ **Exportar** a CSV

#### Fórmulas
- ✅ **Obtener** lista de fórmulas
- ✅ **Crear** nuevas fórmulas
- ✅ **Agregar** detalles a fórmulas
- ✅ **Agregar** múltiples detalles
- ✅ **Actualizar** fórmulas
- ✅ **Eliminar** fórmulas
- ✅ **Obtener** detalle de fórmula
- ✅ **Actualizar** precios de fórmulas
- ✅ **Obtener** estadísticas
- ✅ **Importar** desde CSV
- ✅ **Exportar** a CSV

#### Fabricaciones
- ✅ **Obtener** lista de fabricaciones
- ✅ **Crear** nuevas fabricaciones
- ✅ **Verificar** existencias antes de fabricar
- ✅ **Actualizar** fabricaciones
- ✅ **Eliminar** fabricaciones
- ✅ **Obtener** detalle de fabricación
- ✅ **Exportar** a CSV

#### Archivos Históricos
- ✅ **Obtener** lista de archivos
- ✅ **Crear** nuevos archivos (snapshots)
- ✅ **Obtener** detalle de archivo
- ✅ **Eliminar** archivos
- ✅ **Exportar** a CSV

#### Auditoría
- ✅ **Obtener** historial de auditoría
- ✅ **Filtrar** por tabla, usuario, fecha
- ✅ **Obtener** cambios de precios

---

### 2. **Automatización de Procesos**

#### Sincronización Automática
- **Sincronizar inventario** con sistemas externos (ERP, contabilidad)
- **Importar compras** automáticamente desde sistemas de facturación
- **Actualizar precios** de materias primas desde proveedores
- **Sincronizar fórmulas** con sistemas de producción

#### Procesamiento en Lote
- **Crear múltiples** materias primas, proveedores, compras
- **Actualizar múltiples** registros simultáneamente
- **Eliminar múltiples** registros
- **Importar/Exportar** grandes volúmenes de datos

#### Programación de Tareas
- **Crear fabricaciones** programadas automáticamente
- **Generar reportes** automáticos en horarios específicos
- **Verificar existencias** periódicamente
- **Actualizar precios** automáticamente

---

### 3. **Integración con Sistemas Externos**

#### Sistemas ERP
- **Integrar** con sistemas ERP (SAP, Oracle, etc.)
- **Sincronizar** datos de inventario
- **Exportar** compras y fabricaciones
- **Importar** materias primas y proveedores

#### Sistemas de Contabilidad
- **Exportar** compras para contabilización
- **Sincronizar** gastos y costos
- **Generar** reportes financieros

#### Sistemas de Producción
- **Integrar** con sistemas MES (Manufacturing Execution Systems)
- **Sincronizar** fórmulas de producción
- **Exportar** fabricaciones realizadas
- **Importar** materias primas consumidas

#### Sistemas de Facturación
- **Importar** compras desde sistemas de facturación
- **Sincronizar** proveedores
- **Exportar** datos para facturación

#### Sistemas de Almacén
- **Sincronizar** inventario con sistemas WMS
- **Actualizar** cantidades reales
- **Verificar** existencias

---

### 4. **Análisis y Reportes Automatizados**

#### Generación de Reportes
- **Obtener** datos para reportes personalizados
- **Exportar** datos en formato JSON/CSV
- **Generar** reportes programados
- **Enviar** reportes por email automáticamente

#### Análisis de Datos
- **Obtener** estadísticas de fórmulas
- **Analizar** tendencias de compras
- **Calcular** costos y mermas
- **Generar** análisis de proveedores

---

## 📦 Medio de Entrega

### 1. **Autenticación con API Keys**

#### ¿Qué son las API Keys?
Las API Keys son tokens únicos y secretos que se generan para cada cliente Enterprise. Actúan como credenciales de acceso a la API.

#### Proceso de Entrega:
1. **Generación**: Se genera una API Key única para el cliente
2. **Entrega Segura**: Se entrega mediante canal seguro (email encriptado, portal seguro)
3. **Activación**: El cliente activa la API Key en su cuenta
4. **Configuración**: El cliente configura límites de rate y permisos

#### Formato de API Key:
```
Bearer sk_live_51AbC123XyZ789... (ejemplo)
```

### 2. **Documentación Técnica**

#### Documentación Incluida:
- ✅ **Guía de integración** completa
- ✅ **Referencia de API** (endpoints, parámetros, respuestas)
- ✅ **Ejemplos de código** en múltiples lenguajes (JavaScript, Python, PHP, etc.)
- ✅ **SDKs** (Software Development Kits) para lenguajes populares
- ✅ **Postman Collection** para pruebas
- ✅ **OpenAPI/Swagger** specification

#### Formato de Documentación:
- **Documentación web** interactiva (Swagger UI)
- **PDF** descargable
- **Repositorio Git** con ejemplos

### 3. **Base URL y Endpoints**

#### Base URL de Producción:
```
https://api.reforma.com/v1
```

#### Endpoints Disponibles:
```
GET    /api/materias-primas/:idGranja
POST   /api/materias-primas/:idGranja
PUT    /api/materias-primas/:idGranja/:id
DELETE /api/materias-primas/:idGranja/:id

GET    /api/proveedores/:idGranja
POST   /api/proveedores/:idGranja
PUT    /api/proveedores/:idGranja/:id
DELETE /api/proveedores/:idGranja/:id

GET    /api/formulas/granja/:idGranja/formulas
POST   /api/formulas/granja/:idGranja/formulas
PUT    /api/formulas/granja/:idGranja/formulas/:id
DELETE /api/formulas/granja/:idGranja/formulas/:id

... (todos los endpoints disponibles)
```

### 4. **Webhooks (Notificaciones en Tiempo Real)**

#### ¿Qué son los Webhooks?
Los Webhooks permiten que REFORMA envíe notificaciones a sistemas externos cuando ocurren eventos específicos.

#### Eventos Disponibles:
- ✅ **Nueva compra** creada
- ✅ **Nueva fabricación** creada
- ✅ **Inventario actualizado**
- ✅ **Alerta de stock** bajo
- ✅ **Precio actualizado**
- ✅ **Fórmula creada/actualizada**

#### Configuración:
1. El cliente proporciona una URL de webhook
2. Se configura qué eventos escuchar
3. REFORMA envía notificaciones HTTP POST a la URL
4. El sistema del cliente procesa las notificaciones

---

## 💻 Capacidades Técnicas Necesarias

### 1. **Conocimientos Básicos Requeridos**

#### Programación
- ✅ **Conocimiento básico** de programación (cualquier lenguaje)
- ✅ **Comprensión** de APIs REST
- ✅ **Manejo** de HTTP (GET, POST, PUT, DELETE)
- ✅ **Manejo** de JSON (formato de datos)

#### Redes
- ✅ **Comprensión** de HTTPS/SSL
- ✅ **Manejo** de autenticación (API Keys, tokens)
- ✅ **Comprensión** de códigos de estado HTTP

#### Herramientas
- ✅ **Postman** o similar (para pruebas)
- ✅ **cURL** o similar (para hacer requests)
- ✅ **Editor de código** (para escribir scripts)

### 2. **Lenguajes de Programación Soportados**

La API es **independiente del lenguaje**, puede usarse con:

#### Lenguajes Populares:
- ✅ **JavaScript/Node.js** (recomendado para web)
- ✅ **Python** (recomendado para automatización)
- ✅ **PHP** (recomendado para sistemas legacy)
- ✅ **Java** (recomendado para sistemas empresariales)
- ✅ **C#** (recomendado para .NET)
- ✅ **Go** (recomendado para sistemas de alto rendimiento)
- ✅ **Ruby** (recomendado para startups)
- ✅ **Cualquier lenguaje** que pueda hacer HTTP requests

### 3. **Nivel de Experiencia Recomendado**

#### Para Integraciones Básicas:
- **Nivel**: Principiante/Intermedio
- **Tiempo estimado**: 1-2 semanas
- **Ejemplos**: Sincronización de datos, importación/exportación

#### Para Integraciones Avanzadas:
- **Nivel**: Intermedio/Avanzado
- **Tiempo estimado**: 2-4 semanas
- **Ejemplos**: Integración con ERP, automatización compleja

#### Para Integraciones Empresariales:
- **Nivel**: Avanzado
- **Tiempo estimado**: 1-3 meses
- **Ejemplos**: Integración completa con múltiples sistemas

### 4. **Recursos Necesarios**

#### Infraestructura:
- ✅ **Servidor** o servicio en la nube (para ejecutar scripts)
- ✅ **Conexión a internet** estable
- ✅ **SSL/TLS** (para webhooks seguros)

#### Herramientas:
- ✅ **Postman** (para pruebas de API)
- ✅ **Editor de código** (VS Code, PyCharm, etc.)
- ✅ **Git** (para control de versiones)
- ✅ **Gestor de dependencias** (npm, pip, composer, etc.)

---

## 🎯 Casos de Uso Prácticos

### 1. **Sincronización Automática de Inventario**

#### Escenario:
Un cliente tiene un sistema de almacén (WMS) y quiere sincronizar automáticamente el inventario con REFORMA.

#### Solución:
```python
# Ejemplo en Python
import requests
import schedule
import time

API_KEY = "sk_live_..."
BASE_URL = "https://api.reforma.com/v1"
GRANJA_ID = "granja_123"

def sincronizar_inventario():
    # 1. Obtener inventario desde WMS
    inventario_wms = obtener_inventario_wms()
    
    # 2. Obtener inventario desde REFORMA
    response = requests.get(
        f"{BASE_URL}/api/inventario/{GRANJA_ID}",
        headers={"Authorization": f"Bearer {API_KEY}"}
    )
    inventario_reforma = response.json()
    
    # 3. Comparar y actualizar
    for item in inventario_wms:
        materia_id = item['materia_id']
        cantidad_real = item['cantidad']
        
        # Actualizar en REFORMA
        requests.put(
            f"{BASE_URL}/api/inventario/{GRANJA_ID}/{materia_id}",
            headers={"Authorization": f"Bearer {API_KEY}"},
            json={"cantidadReal": cantidad_real}
        )

# Ejecutar cada hora
schedule.every().hour.do(sincronizar_inventario)

while True:
    schedule.run_pending()
    time.sleep(60)
```

### 2. **Importación Automática de Compras**

#### Escenario:
Un cliente recibe facturas electrónicas y quiere importarlas automáticamente a REFORMA.

#### Solución:
```javascript
// Ejemplo en Node.js
const axios = require('axios');

const API_KEY = "sk_live_...";
const BASE_URL = "https://api.reforma.com/v1";
const GRANJA_ID = "granja_123";

async function importarCompra(factura) {
    // 1. Crear cabecera de compra
    const cabecera = await axios.post(
        `${BASE_URL}/api/compras/${GRANJA_ID}`,
        {
            idProveedor: factura.proveedor_id,
            fechaCompra: factura.fecha,
            totalFactura: factura.total,
            observaciones: factura.observaciones
        },
        { headers: { Authorization: `Bearer ${API_KEY}` } }
    );
    
    const compraId = cabecera.data.id;
    
    // 2. Agregar detalles de compra
    const detalles = factura.items.map(item => ({
        idMateriaPrima: item.materia_id,
        cantidadKg: item.cantidad,
        precioPorKilo: item.precio,
        subtotal: item.subtotal
    }));
    
    await axios.post(
        `${BASE_URL}/api/compras/${GRANJA_ID}/${compraId}/items/multiples`,
        { items: detalles },
        { headers: { Authorization: `Bearer ${API_KEY}` } }
    );
}

// Escuchar webhook de facturas
app.post('/webhook/facturas', (req, res) => {
    const factura = req.body;
    importarCompra(factura);
    res.json({ success: true });
});
```

### 3. **Generación Automática de Reportes**

#### Escenario:
Un cliente quiere generar reportes automáticos cada mes y enviarlos por email.

#### Solución:
```python
# Ejemplo en Python
import requests
from datetime import datetime
import smtplib
from email.mime.text import MIMEText

API_KEY = "sk_live_..."
BASE_URL = "https://api.reforma.com/v1"
GRANJA_ID = "granja_123"

def generar_reporte_mensual():
    # 1. Obtener datos
    compras = requests.get(
        f"{BASE_URL}/api/compras/{GRANJA_ID}",
        headers={"Authorization": f"Bearer {API_KEY}"}
    ).json()
    
    fabricaciones = requests.get(
        f"{BASE_URL}/api/fabricaciones/{GRANJA_ID}",
        headers={"Authorization": f"Bearer {API_KEY}"}
    ).json()
    
    inventario = requests.get(
        f"{BASE_URL}/api/inventario/{GRANJA_ID}",
        headers={"Authorization": f"Bearer {API_KEY}"}
    ).json()
    
    # 2. Generar reporte
    reporte = f"""
    Reporte Mensual - {datetime.now().strftime('%B %Y')}
    
    Compras: {len(compras)}
    Fabricaciones: {len(fabricaciones)}
    Inventario: {len(inventario)} materias primas
    """
    
    # 3. Enviar por email
    enviar_email(reporte)

def enviar_email(reporte):
    # Configurar servidor SMTP
    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.starttls()
    server.login('email@empresa.com', 'password')
    
    # Crear mensaje
    msg = MIMEText(reporte)
    msg['Subject'] = 'Reporte Mensual REFORMA'
    msg['From'] = 'email@empresa.com'
    msg['To'] = 'gerente@empresa.com'
    
    # Enviar
    server.send_message(msg)
    server.quit()

# Ejecutar el primer día de cada mes
schedule.every().month.do(generar_reporte_mensual)
```

### 4. **Integración con Sistema ERP**

#### Escenario:
Un cliente quiere integrar REFORMA con su sistema ERP (SAP, Oracle, etc.).

#### Solución:
```java
// Ejemplo en Java
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import com.fasterxml.jackson.databind.ObjectMapper;

public class ReformaIntegration {
    private static final String API_KEY = "sk_live_...";
    private static final String BASE_URL = "https://api.reforma.com/v1";
    private static final String GRANJA_ID = "granja_123";
    
    private HttpClient client = HttpClient.newHttpClient();
    private ObjectMapper mapper = new ObjectMapper();
    
    public void sincronizarConERP() {
        // 1. Obtener compras desde REFORMA
        List<Compra> compras = obtenerComprasDesdeReforma();
        
        // 2. Sincronizar con ERP
        for (Compra compra : compras) {
            sincronizarCompraConERP(compra);
        }
        
        // 3. Obtener inventario desde ERP
        List<Inventario> inventario = obtenerInventarioDesdeERP();
        
        // 4. Actualizar en REFORMA
        for (Inventario item : inventario) {
            actualizarInventarioEnReforma(item);
        }
    }
    
    private List<Compra> obtenerComprasDesdeReforma() {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(BASE_URL + "/api/compras/" + GRANJA_ID))
            .header("Authorization", "Bearer " + API_KEY)
            .GET()
            .build();
        
        HttpResponse<String> response = client.send(request, 
            HttpResponse.BodyHandlers.ofString());
        
        return mapper.readValue(response.body(), 
            new TypeReference<List<Compra>>() {});
    }
}
```

---

## 🔒 Seguridad y Limitaciones

### 1. **Seguridad**

#### Autenticación:
- ✅ **API Keys** únicas por cliente
- ✅ **HTTPS** obligatorio (encriptación SSL/TLS)
- ✅ **Rate limiting** (límites de requests por minuto)
- ✅ **IP whitelisting** (opcional, solo IPs permitidas)

#### Permisos:
- ✅ **Acceso solo a datos** de las granjas del cliente
- ✅ **Sin acceso** a datos de otros clientes
- ✅ **Auditoría** de todas las operaciones
- ✅ **Logs** de todas las requests

### 2. **Limitaciones**

#### Rate Limiting:
- **Plan Enterprise**: 1,000 requests/minuto
- **Burst**: Hasta 2,000 requests en picos cortos
- **Límite diario**: 1,000,000 requests/día

#### Tamaño de Datos:
- **Request máximo**: 10 MB
- **Response máximo**: 50 MB
- **Timeout**: 30 segundos por request

#### Funcionalidades:
- ✅ **Todas las funcionalidades** disponibles en la interfaz web
- ✅ **Mismo nivel de permisos** que el usuario web
- ✅ **Mismas validaciones** y reglas de negocio

---

## 📚 Soporte y Documentación

### 1. **Documentación Incluida**

#### Guías:
- ✅ **Guía de integración** paso a paso
- ✅ **Referencia de API** completa
- ✅ **Ejemplos de código** en múltiples lenguajes
- ✅ **SDKs** para lenguajes populares
- ✅ **Postman Collection** para pruebas

#### Formatos:
- ✅ **Documentación web** interactiva (Swagger UI)
- ✅ **PDF** descargable
- ✅ **Repositorio Git** con ejemplos

### 2. **Soporte Técnico**

#### Nivel de Soporte Enterprise:
- ✅ **Soporte prioritario** (respuesta en menos de 4 horas)
- ✅ **Acceso directo** al desarrollador
- ✅ **Reuniones personalizadas** para integración
- ✅ **Asistencia** en la implementación
- ✅ **Consultoría** técnica

#### Canales de Soporte:
- ✅ **Email** prioritario
- ✅ **Canal de Slack** dedicado (opcional)
- ✅ **Reuniones** mensuales
- ✅ **Soporte telefónico** (opcional)

### 3. **Recursos Adicionales**

#### Comunidad:
- ✅ **Foro** de desarrolladores
- ✅ **Repositorio Git** con ejemplos
- ✅ **Blog** con tutoriales
- ✅ **Webinars** mensuales

#### Actualizaciones:
- ✅ **Changelog** de la API
- ✅ **Notificaciones** de cambios
- ✅ **Versiones** de la API (v1, v2, etc.)
- ✅ **Deprecation warnings** con anticipación

---

## 🎓 Conclusión

### ¿Quién Debería Usar la API Privada?

#### Ideal Para:
- ✅ **Empresas grandes** con múltiples sistemas
- ✅ **Clientes que necesitan** integración con ERP
- ✅ **Clientes que requieren** automatización
- ✅ **Clientes que procesan** grandes volúmenes de datos
- ✅ **Clientes que necesitan** reportes personalizados

#### No Necesario Para:
- ❌ **Usuarios individuales** que usan solo la interfaz web
- ❌ **Empresas pequeñas** sin sistemas externos
- ❌ **Clientes que no tienen** equipo técnico
- ❌ **Clientes que no necesitan** automatización

### Beneficios Clave:

1. **Automatización**: Reduce trabajo manual significativamente
2. **Integración**: Conecta REFORMA con otros sistemas
3. **Escalabilidad**: Procesa grandes volúmenes de datos
4. **Personalización**: Crea soluciones adaptadas a necesidades específicas
5. **Eficiencia**: Aumenta la productividad y reduce errores

### Próximos Pasos:

1. **Evaluar necesidades**: ¿Necesitas integración o automatización?
2. **Evaluar capacidades**: ¿Tienes equipo técnico o recursos?
3. **Contactar soporte**: Habla con el equipo de REFORMA
4. **Planificar integración**: Diseña la integración con el equipo
5. **Implementar**: Desarrolla y prueba la integración
6. **Mantener**: Monitorea y actualiza la integración

---

## 📞 Contacto

Para más información sobre la API Privada:
- **Email**: api@reforma.com
- **Documentación**: https://docs.reforma.com/api
- **Soporte**: https://support.reforma.com

---

**Última actualización**: Diciembre 2024

