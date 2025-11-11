# 💻 API Privada - Ejemplos Técnicos de Integración

## 📋 Índice

1. [Autenticación](#autenticación)
2. [Ejemplos por Módulo](#ejemplos-por-módulo)
3. [Casos de Uso Avanzados](#casos-de-uso-avanzados)
4. [Manejo de Errores](#manejo-de-errores)
5. [Mejores Prácticas](#mejores-prácticas)

---

## 🔐 Autenticación

### Headers Requeridos

Todas las requests a la API requieren autenticación mediante API Key en el header:

```
Authorization: Bearer sk_live_51AbC123XyZ789...
Content-Type: application/json
```

### Ejemplo en Diferentes Lenguajes

#### JavaScript/Node.js
```javascript
const axios = require('axios');

const API_KEY = "sk_live_51AbC123XyZ789...";
const BASE_URL = "https://api.reforma.com/v1";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
});
```

#### Python
```python
import requests

API_KEY = "sk_live_51AbC123XyZ789..."
BASE_URL = "https://api.reforma.com/v1"

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}
```

#### PHP
```php
<?php
$api_key = "sk_live_51AbC123XyZ789...";
$base_url = "https://api.reforma.com/v1";

$headers = [
    'Authorization: Bearer ' . $api_key,
    'Content-Type: application/json'
];
?>
```

#### Java
```java
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.URI;

String API_KEY = "sk_live_51AbC123XyZ789...";
String BASE_URL = "https://api.reforma.com/v1";

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(BASE_URL + "/endpoint"))
    .header("Authorization", "Bearer " + API_KEY)
    .header("Content-Type", "application/json")
    .build();
```

---

## 📦 Ejemplos por Módulo

### 1. Materias Primas

#### Obtener Todas las Materias Primas

**JavaScript/Node.js:**
```javascript
async function obtenerMateriasPrimas(idGranja) {
  try {
    const response = await apiClient.get(`/api/materias-primas/${idGranja}`);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response.data);
    throw error;
  }
}
```

**Python:**
```python
def obtener_materias_primas(id_granja):
    response = requests.get(
        f"{BASE_URL}/api/materias-primas/{id_granja}",
        headers=headers
    )
    response.raise_for_status()
    return response.json()
```

#### Crear Nueva Materia Prima

**JavaScript/Node.js:**
```javascript
async function crearMateriaPrima(idGranja, datos) {
  try {
    const response = await apiClient.post(
      `/api/materias-primas/${idGranja}`,
      {
        codigoMateriaPrima: datos.codigo,
        nombreMateriaPrima: datos.nombre,
        precioPorKilo: datos.precio || 0
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error:', error.response.data);
    throw error;
  }
}

// Uso
await crearMateriaPrima('granja_123', {
  codigo: 'MP001',
  nombre: 'Maíz',
  precio: 150.50
});
```

**Python:**
```python
def crear_materia_prima(id_granja, codigo, nombre, precio=0):
    data = {
        'codigoMateriaPrima': codigo,
        'nombreMateriaPrima': nombre,
        'precioPorKilo': precio
    }
    response = requests.post(
        f"{BASE_URL}/api/materias-primas/{id_granja}",
        headers=headers,
        json=data
    )
    response.raise_for_status()
    return response.json()
```

#### Actualizar Materia Prima

**JavaScript/Node.js:**
```javascript
async function actualizarMateriaPrima(idGranja, idMateria, datos) {
  try {
    const response = await apiClient.put(
      `/api/materias-primas/${idGranja}/${idMateria}`,
      {
        nombreMateriaPrima: datos.nombre,
        precioPorKilo: datos.precio
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error:', error.response.data);
    throw error;
  }
}
```

#### Eliminar Materia Prima

**JavaScript/Node.js:**
```javascript
async function eliminarMateriaPrima(idGranja, idMateria) {
  try {
    const response = await apiClient.delete(
      `/api/materias-primas/${idGranja}/${idMateria}`
    );
    return response.data;
  } catch (error) {
    console.error('Error:', error.response.data);
    throw error;
  }
}
```

---

### 2. Compras

#### Crear Compra con Múltiples Items

**JavaScript/Node.js:**
```javascript
async function crearCompra(idGranja, compraData) {
  try {
    // 1. Crear cabecera de compra
    const cabecera = await apiClient.post(
      `/api/compras/${idGranja}`,
      {
        idProveedor: compraData.idProveedor,
        fechaCompra: compraData.fechaCompra,
        totalFactura: compraData.totalFactura,
        observaciones: compraData.observaciones
      }
    );
    
    const compraId = cabecera.data.id;
    
    // 2. Agregar múltiples items
    const items = compraData.items.map(item => ({
      idMateriaPrima: item.idMateriaPrima,
      cantidadKg: item.cantidadKg,
      precioPorKilo: item.precioPorKilo,
      subtotal: item.subtotal
    }));
    
    const detalles = await apiClient.post(
      `/api/compras/${idGranja}/${compraId}/items/multiples`,
      { items: items }
    );
    
    return {
      compra: cabecera.data,
      items: detalles.data
    };
  } catch (error) {
    console.error('Error:', error.response.data);
    throw error;
  }
}

// Uso
await crearCompra('granja_123', {
  idProveedor: 'proveedor_456',
  fechaCompra: '2024-12-01',
  totalFactura: 50000,
  observaciones: 'Compra mensual',
  items: [
    {
      idMateriaPrima: 'mp_789',
      cantidadKg: 1000,
      precioPorKilo: 150,
      subtotal: 150000
    },
    {
      idMateriaPrima: 'mp_790',
      cantidadKg: 500,
      precioPorKilo: 200,
      subtotal: 100000
    }
  ]
});
```

**Python:**
```python
def crear_compra(id_granja, compra_data):
    # 1. Crear cabecera
    cabecera_data = {
        'idProveedor': compra_data['id_proveedor'],
        'fechaCompra': compra_data['fecha_compra'],
        'totalFactura': compra_data['total_factura'],
        'observaciones': compra_data.get('observaciones', '')
    }
    
    response = requests.post(
        f"{BASE_URL}/api/compras/{id_granja}",
        headers=headers,
        json=cabecera_data
    )
    response.raise_for_status()
    compra_id = response.json()['id']
    
    # 2. Agregar items
    items = [
        {
            'idMateriaPrima': item['id_materia_prima'],
            'cantidadKg': item['cantidad_kg'],
            'precioPorKilo': item['precio_por_kilo'],
            'subtotal': item['subtotal']
        }
        for item in compra_data['items']
    ]
    
    response = requests.post(
        f"{BASE_URL}/api/compras/{id_granja}/{compra_id}/items/multiples",
        headers=headers,
        json={'items': items}
    )
    response.raise_for_status()
    
    return response.json()
```

---

### 3. Fórmulas

#### Crear Fórmula con Detalles

**JavaScript/Node.js:**
```javascript
async function crearFormula(idGranja, formulaData) {
  try {
    // 1. Crear cabecera de fórmula
    const cabecera = await apiClient.post(
      `/api/formulas/granja/${idGranja}/formulas`,
      {
        codigoFormula: formulaData.codigo,
        descripcionFormula: formulaData.descripcion,
        idAnimal: formulaData.idAnimal
      }
    );
    
    const formulaId = cabecera.data.id;
    
    // 2. Agregar múltiples detalles
    const detalles = formulaData.detalles.map(detalle => ({
      idMateriaPrima: detalle.idMateriaPrima,
      cantidadKg: detalle.cantidadKg
    }));
    
    const detallesResponse = await apiClient.post(
      `/api/formulas/granja/${idGranja}/formulas/${formulaId}/detalles/multiples`,
      { detalles: detalles }
    );
    
    return {
      formula: cabecera.data,
      detalles: detallesResponse.data
    };
  } catch (error) {
    console.error('Error:', error.response.data);
    throw error;
  }
}
```

#### Actualizar Precios de Todas las Fórmulas

**JavaScript/Node.js:**
```javascript
async function actualizarPreciosFormulas(idGranja) {
  try {
    const response = await apiClient.post(
      `/api/formulas/granja/${idGranja}/formulas/actualizar-precios`
    );
    return response.data;
  } catch (error) {
    console.error('Error:', error.response.data);
    throw error;
  }
}
```

---

### 4. Fabricaciones

#### Crear Fabricación con Verificación de Existencias

**JavaScript/Node.js:**
```javascript
async function crearFabricacion(idGranja, fabricacionData) {
  try {
    // 1. Verificar existencias primero
    const verificacion = await apiClient.post(
      `/api/fabricaciones/verificar-existencias`,
      {
        idGranja: idGranja,
        idFormula: fabricacionData.idFormula,
        cantidadFabricacion: fabricacionData.cantidadFabricacion
      }
    );
    
    if (verificacion.data.tieneFaltantes) {
      console.warn('Advertencia: Existencias insuficientes');
      console.log('Faltantes:', verificacion.data.faltantes);
      // El cliente puede decidir si continuar o no
    }
    
    // 2. Crear fabricación
    const fabricacion = await apiClient.post(
      `/api/fabricaciones/${idGranja}`,
      {
        idFormula: fabricacionData.idFormula,
        descripcionFabricacion: fabricacionData.descripcion,
        cantidadFabricacion: fabricacionData.cantidadFabricacion,
        fechaFabricacion: fabricacionData.fechaFabricacion,
        observaciones: fabricacionData.observaciones
      }
    );
    
    return fabricacion.data;
  } catch (error) {
    console.error('Error:', error.response.data);
    throw error;
  }
}
```

---

### 5. Inventario

#### Sincronizar Inventario

**JavaScript/Node.js:**
```javascript
async function sincronizarInventario(idGranja, inventarioData) {
  try {
    const resultados = [];
    
    for (const item of inventarioData) {
      const response = await apiClient.put(
        `/api/inventario/${idGranja}/${item.idMateriaPrima}`,
        {
          cantidadReal: item.cantidadReal
        }
      );
      resultados.push(response.data);
    }
    
    return resultados;
  } catch (error) {
    console.error('Error:', error.response.data);
    throw error;
  }
}
```

#### Obtener Alertas de Stock

**JavaScript/Node.js:**
```javascript
async function obtenerAlertasStock(idGranja) {
  try {
    const inventario = await apiClient.get(
      `/api/inventario/${idGranja}`
    );
    
    // Filtrar items con stock bajo
    const alertas = inventario.data.filter(item => {
      const porcentaje = (item.cantidadReal / item.cantidadSistema) * 100;
      return porcentaje < 20; // Menos del 20% de stock
    });
    
    return alertas;
  } catch (error) {
    console.error('Error:', error.response.data);
    throw error;
  }
}
```

---

## 🚀 Casos de Uso Avanzados

### 1. Sincronización Bidireccional con ERP

**JavaScript/Node.js:**
```javascript
class ReformaERPIntegration {
  constructor(apiKey, granjaId, erpClient) {
    this.apiKey = apiKey;
    this.granjaId = granjaId;
    this.erpClient = erpClient;
    this.apiClient = axios.create({
      baseURL: 'https://api.reforma.com/v1',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }
  
  async sincronizarCompras() {
    // 1. Obtener compras desde REFORMA
    const comprasReforma = await this.apiClient.get(
      `/api/compras/${this.granjaId}`
    );
    
    // 2. Obtener compras desde ERP
    const comprasERP = await this.erpClient.getCompras();
    
    // 3. Comparar y sincronizar
    for (const compra of comprasReforma.data) {
      const existeEnERP = comprasERP.find(c => c.id === compra.id);
      
      if (!existeEnERP) {
        // Crear en ERP
        await this.erpClient.crearCompra(compra);
      } else {
        // Actualizar si hay diferencias
        if (existeEnERP.total !== compra.totalFactura) {
          await this.erpClient.actualizarCompra(compra);
        }
      }
    }
  }
  
  async sincronizarInventario() {
    // 1. Obtener inventario desde ERP
    const inventarioERP = await this.erpClient.getInventario();
    
    // 2. Actualizar en REFORMA
    for (const item of inventarioERP) {
      await this.apiClient.put(
        `/api/inventario/${this.granjaId}/${item.materiaId}`,
        {
          cantidadReal: item.cantidad
        }
      );
    }
  }
}

// Uso
const integration = new ReformaERPIntegration(
  'sk_live_...',
  'granja_123',
  erpClient
);

// Sincronizar cada hora
setInterval(() => {
  integration.sincronizarCompras();
  integration.sincronizarInventario();
}, 3600000); // 1 hora
```

### 2. Procesamiento en Lote

**Python:**
```python
import asyncio
import aiohttp
from typing import List, Dict

async def procesar_compras_en_lote(id_granja: str, compras: List[Dict]):
    """
    Procesa múltiples compras en paralelo
    """
    async with aiohttp.ClientSession() as session:
        tasks = []
        
        for compra in compras:
            task = crear_compra_async(session, id_granja, compra)
            tasks.append(task)
        
        resultados = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filtrar errores
        exitosos = [r for r in resultados if not isinstance(r, Exception)]
        errores = [r for r in resultados if isinstance(r, Exception)]
        
        return {
            'exitosos': len(exitosos),
            'errores': len(errores),
            'detalles': resultados
        }

async def crear_compra_async(session, id_granja, compra_data):
    # Crear cabecera
    async with session.post(
        f"{BASE_URL}/api/compras/{id_granja}",
        headers=headers,
        json={
            'idProveedor': compra_data['id_proveedor'],
            'fechaCompra': compra_data['fecha_compra'],
            'totalFactura': compra_data['total_factura']
        }
    ) as response:
        cabecera = await response.json()
        compra_id = cabecera['id']
    
    # Agregar items
    async with session.post(
        f"{BASE_URL}/api/compras/{id_granja}/{compra_id}/items/multiples",
        headers=headers,
        json={'items': compra_data['items']}
    ) as response:
        return await response.json()

# Uso
compras = [
    {'id_proveedor': 'prov_1', 'fecha_compra': '2024-12-01', ...},
    {'id_proveedor': 'prov_2', 'fecha_compra': '2024-12-02', ...},
    # ... más compras
]

resultados = asyncio.run(procesar_compras_en_lote('granja_123', compras))
print(f"Procesadas {resultados['exitosos']} compras exitosamente")
```

### 3. Webhooks - Escuchar Eventos

**Node.js/Express:**
```javascript
const express = require('express');
const app = express();

app.use(express.json());

// Endpoint para recibir webhooks
app.post('/webhooks/reforma', (req, res) => {
  const evento = req.body;
  
  switch (evento.tipo) {
    case 'compra.creada':
      manejarCompraCreada(evento.datos);
      break;
    case 'fabricacion.creada':
      manejarFabricacionCreada(evento.datos);
      break;
    case 'inventario.actualizado':
      manejarInventarioActualizado(evento.datos);
      break;
    case 'stock.bajo':
      manejarStockBajo(evento.datos);
      break;
    default:
      console.log('Evento desconocido:', evento.tipo);
  }
  
  res.json({ received: true });
});

function manejarCompraCreada(compra) {
  console.log('Nueva compra creada:', compra.id);
  // Sincronizar con ERP, enviar notificación, etc.
}

function manejarFabricacionCreada(fabricacion) {
  console.log('Nueva fabricación creada:', fabricacion.id);
  // Actualizar sistema de producción, etc.
}

function manejarInventarioActualizado(inventario) {
  console.log('Inventario actualizado:', inventario.idMateriaPrima);
  // Sincronizar con sistema de almacén, etc.
}

function manejarStockBajo(alerta) {
  console.log('Alerta de stock bajo:', alerta.idMateriaPrima);
  // Enviar notificación, generar orden de compra, etc.
}

app.listen(3000, () => {
  console.log('Servidor de webhooks escuchando en puerto 3000');
});
```

---

## ⚠️ Manejo de Errores

### Códigos de Estado HTTP

```javascript
function manejarError(error) {
  if (error.response) {
    const status = error.response.status;
    const datos = error.response.data;
    
    switch (status) {
      case 400:
        console.error('Error de validación:', datos.error);
        break;
      case 401:
        console.error('No autorizado. Verifica tu API Key.');
        break;
      case 403:
        console.error('Acceso prohibido. Verifica tus permisos.');
        break;
      case 404:
        console.error('Recurso no encontrado:', datos.error);
        break;
      case 429:
        console.error('Rate limit excedido. Espera antes de reintentar.');
        break;
      case 500:
        console.error('Error del servidor:', datos.error);
        break;
      default:
        console.error('Error desconocido:', datos.error);
    }
  } else if (error.request) {
    console.error('No se recibió respuesta del servidor');
  } else {
    console.error('Error al configurar la request:', error.message);
  }
}
```

### Reintentos con Exponential Backoff

**JavaScript:**
```javascript
async function hacerRequestConReintentos(fn, maxReintentos = 3) {
  for (let i = 0; i < maxReintentos; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.response?.status === 429 || error.response?.status >= 500) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        console.log(`Reintentando en ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Máximo de reintentos alcanzado');
}

// Uso
await hacerRequestConReintentos(() => 
  apiClient.get('/api/materias-primas/granja_123')
);
```

---

## ✅ Mejores Prácticas

### 1. Caché de Datos

```javascript
class ReformaAPIClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutos
  }
  
  async obtenerMateriasPrimas(idGranja, usarCache = true) {
    const cacheKey = `materias-primas-${idGranja}`;
    
    if (usarCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.data;
      }
    }
    
    const response = await apiClient.get(
      `/api/materias-primas/${idGranja}`
    );
    
    this.cache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now()
    });
    
    return response.data;
  }
}
```

### 2. Validación de Datos

```javascript
function validarCompra(compraData) {
  const errores = [];
  
  if (!compraData.idProveedor) {
    errores.push('idProveedor es requerido');
  }
  
  if (!compraData.fechaCompra) {
    errores.push('fechaCompra es requerida');
  }
  
  if (!compraData.items || compraData.items.length === 0) {
    errores.push('Debe haber al menos un item');
  }
  
  compraData.items.forEach((item, index) => {
    if (!item.idMateriaPrima) {
      errores.push(`Item ${index + 1}: idMateriaPrima es requerido`);
    }
    if (!item.cantidadKg || item.cantidadKg <= 0) {
      errores.push(`Item ${index + 1}: cantidadKg debe ser mayor a 0`);
    }
  });
  
  if (errores.length > 0) {
    throw new Error('Errores de validación: ' + errores.join(', '));
  }
}

// Uso
try {
  validarCompra(compraData);
  await crearCompra(idGranja, compraData);
} catch (error) {
  console.error('Error de validación:', error.message);
}
```

### 3. Logging y Monitoreo

```javascript
class ReformaAPIClient {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.logger = options.logger || console;
    this.monitor = options.monitor;
  }
  
  async hacerRequest(method, url, data = null) {
    const startTime = Date.now();
    
    try {
      const response = await apiClient.request({
        method,
        url,
        data
      });
      
      const duration = Date.now() - startTime;
      
      this.logger.info(`API Request: ${method} ${url} - ${duration}ms`);
      
      if (this.monitor) {
        this.monitor.registrarRequest({
          method,
          url,
          duration,
          status: response.status,
          exito: true
        });
      }
      
      return response.data;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error(`API Error: ${method} ${url} - ${duration}ms`, error);
      
      if (this.monitor) {
        this.monitor.registrarRequest({
          method,
          url,
          duration,
          status: error.response?.status || 0,
          exito: false,
          error: error.message
        });
      }
      
      throw error;
    }
  }
}
```

---

## 📚 Recursos Adicionales

### SDKs Oficiales

- **JavaScript/Node.js**: `npm install @reforma/api-client`
- **Python**: `pip install reforma-api-client`
- **PHP**: `composer require reforma/api-client`

### Documentación

- **API Reference**: https://docs.reforma.com/api
- **Ejemplos**: https://github.com/reforma/api-examples
- **Postman Collection**: https://www.postman.com/reforma/api

### Soporte

- **Email**: api@reforma.com
- **Foro**: https://forum.reforma.com/api
- **Slack**: https://reforma.slack.com/api

---

**Última actualización**: Diciembre 2024

