# 🎨 Guía de Landing Page - REFORMA

## 📋 Resumen

Landing page diseñada para publicitar REFORMA, sistema de gestión de granjas. La página está diseñada con el mismo sistema de diseño glassmorphism que la aplicación principal, manteniendo consistencia visual.

---

## 🚀 Características de la Landing Page

### Secciones Implementadas

1. **Navigation Bar**
   - Logo y nombre de la aplicación
   - Enlaces de navegación (Funcionalidades, Precios, Beneficios)
   - Botones de acción (Iniciar Sesión, Comenzar Gratis)

2. **Hero Section**
   - Título principal con gradiente atractivo
   - Descripción del sistema
   - Botones de acción (Comenzar Gratis, Ver Demo)
   - Estadísticas clave (Costo inicial, Prueba gratis, Funcionalidades)

3. **Features Section**
   - 6 funcionalidades principales destacadas
   - Iconos con gradientes
   - Descripciones claras y concisas
   - Cards con efecto hover

4. **Benefits Section**
   - 6 beneficios clave del sistema
   - Iconos y descripciones
   - Fondo con gradiente sutil

5. **Pricing Section**
   - 4 planes de suscripción (Demo, Starter, Business, Enterprise)
   - Toggle para cambiar entre precios mensuales y anuales
   - Lista de características por plan
   - Badge "Más Popular" para el plan Starter
   - Botones de acción por plan

6. **CTA Section**
   - Llamado a la acción final
   - Botones para comenzar gratis o contactar ventas

7. **Footer**
   - Información de la empresa
   - Enlaces de navegación
   - Información de contacto
   - Copyright

---

## 🎨 Diseño

### Sistema de Diseño
- **Glassmorphism**: Mismo estilo que la aplicación principal
- **Colores**: Purple, Pink, Cyan (gradientes)
- **Tipografía**: Geist Sans (sistema de fuentes de Next.js)
- **Responsive**: Diseño adaptable a móviles, tablets y desktop

### Colores Utilizados
- **Primary**: Purple (gradiente purple-600 a purple-500)
- **Secondary**: Pink (gradiente pink-500 a pink-400)
- **Accent**: Cyan (gradiente cyan-500 a cyan-400)
- **Background**: Dark (#0a0a0f)
- **Foreground**: White (#ffffff)

### Componentes Reutilizados
- **Button**: Componente de UI existente
- **Glass Card**: Estilo glassmorphism consistente
- **Iconos**: Lucide React icons

---

## 📸 Imágenes y Videos Necesarios

### Prioridad Alta ⭐⭐⭐

#### 1. Screenshot del Panel Principal
- **Ubicación**: Hero section (opcional, como imagen de fondo o destacada)
- **Especificaciones**: 1920x1080, PNG o JPG
- **Contenido**: Dashboard completo con KPIs y gráficos

#### 2. Screenshot del Módulo de Fórmulas
- **Ubicación**: Features section (card de Fórmulas)
- **Especificaciones**: 800x600, PNG
- **Contenido**: Lista de fórmulas con gráficos

#### 3. Screenshot del Detalle de Fórmula
- **Ubicación**: Features section (card de Fórmulas)
- **Especificaciones**: 800x600, PNG
- **Contenido**: Distribución de materias primas en una fórmula

#### 4. Video Demo del Panel Principal
- **Ubicación**: Hero section (botón "Ver Demo")
- **Especificaciones**: 30-60 segundos, MP4, 1920x1080
- **Contenido**: Navegación por el Panel Principal mostrando KPIs y gráficos

#### 5. Video Demo de Fórmulas y Fabricaciones
- **Ubicación**: Features section (modal o sección dedicada)
- **Especificaciones**: 60-90 segundos, MP4, 1920x1080
- **Contenido**: Creación de fórmula y fabricación basada en ella

### Prioridad Media ⭐⭐

#### 6. Screenshot del Módulo de Fabricaciones
- **Ubicación**: Features section (card de Fabricaciones)
- **Especificaciones**: 800x600, PNG
- **Contenido**: Lista de fabricaciones con gráficos

#### 7. Screenshot del Módulo de Inventario
- **Ubicación**: Features section (card de Inventario)
- **Especificaciones**: 800x600, PNG
- **Contenido**: Inventario con cálculos (merma, precio almacen, valor stock)

#### 8. Screenshot del Módulo de Compras
- **Ubicación**: Features section (card de Compras)
- **Especificaciones**: 800x600, PNG
- **Contenido**: Lista de compras con gráficos

### Prioridad Baja ⭐

#### 9. Screenshot del Módulo de Proveedores
- **Ubicación**: Features section (card de Proveedores)
- **Especificaciones**: 800x600, PNG
- **Contenido**: Lista de proveedores con gráficos

#### 10. Screenshot del Módulo de Materias Primas
- **Ubicación**: Features section (card de Materias Primas)
- **Especificaciones**: 800x600, PNG
- **Contenido**: Lista de materias primas con gráficos

---

## 🔧 Configuración

### Rutas
- **Landing Page**: `/landing`
- **Login**: `/login`
- **Dashboard**: `/dashboard` (después de login)

### Integración
- La landing page está integrada con el sistema de autenticación existente
- Los botones "Comenzar Gratis" y "Iniciar Sesión" redirigen a `/login`
- El botón "Ver Demo" puede abrir un modal con video o redirigir a una página de demo

### Personalización
- Los precios se pueden actualizar en el array `plans` en `landing/page.tsx`
- Las características se pueden actualizar en el array `features`
- Los beneficios se pueden actualizar en el array `benefits`

---

## 🎯 Mejoras Futuras

### Fase 1: Contenido Visual
1. ✅ Agregar screenshots de la aplicación
2. ✅ Agregar videos demo
3. ✅ Agregar imágenes de fondo en hero section
4. ✅ Agregar animaciones sutiles

### Fase 2: Funcionalidades
1. ✅ Agregar modal de video demo
2. ✅ Agregar formulario de contacto
3. ✅ Agregar testimonios de clientes
4. ✅ Agregar sección de preguntas frecuentes (FAQ)

### Fase 3: Optimización
1. ✅ Optimizar imágenes para web
2. ✅ Agregar lazy loading
3. ✅ Mejorar SEO
4. ✅ Agregar analytics

---

## 📝 Instrucciones de Uso

### Para Agregar Imágenes

1. **Crear carpeta de imágenes**:
   ```bash
   mkdir -p frontend/public/landing
   ```

2. **Agregar imágenes**:
   - Colocar screenshots en `frontend/public/landing/screenshots/`
   - Colocar videos en `frontend/public/landing/videos/`

3. **Actualizar componentes**:
   - Agregar `<Image>` components de Next.js
   - Agregar rutas a las imágenes en los componentes

### Para Agregar Videos

1. **Agregar videos**:
   - Colocar videos en `frontend/public/landing/videos/`
   - Formatos soportados: MP4, WebM

2. **Implementar reproductor**:
   - Usar `<video>` tag de HTML5
   - O integrar un reproductor de video (ej: React Player)

### Para Actualizar Precios

1. **Editar array de planes**:
   - Abrir `frontend/src/app/landing/page.tsx`
   - Buscar el array `plans`
   - Actualizar precios y características

2. **Verificar consistencia**:
   - Asegurar que los precios coincidan con `backend/src/constants/planes.ts`
   - Actualizar documentación si es necesario

---

## 🎨 Ejemplo de Uso de Imágenes

### En Hero Section

```tsx
import Image from 'next/image';

// En el Hero Section
<div className="relative">
  <Image
    src="/landing/screenshots/panel-principal.png"
    alt="Panel Principal de REFORMA"
    width={1200}
    height={800}
    className="rounded-xl shadow-2xl"
    priority
  />
</div>
```

### En Features Section

```tsx
// En cada card de feature
<div className="glass-card p-6 rounded-xl">
  <Image
    src="/landing/screenshots/formulas.png"
    alt="Módulo de Fórmulas"
    width={800}
    height={600}
    className="rounded-lg mb-4"
  />
  <h3>Fórmulas de Alimentación</h3>
  <p>Descripción...</p>
</div>
```

### Video Demo

```tsx
import ReactPlayer from 'react-player';

// En Hero Section o Modal
<ReactPlayer
  url="/landing/videos/demo-panel-principal.mp4"
  playing={false}
  controls={true}
  width="100%"
  height="100%"
/>
```

---

## 📊 Métricas de Conversión

### KPIs a Monitorear

1. **Tasa de conversión**: % de visitantes que se registran
2. **Tasa de clic en CTA**: % de visitantes que hacen clic en "Comenzar Gratis"
3. **Tiempo en página**: Tiempo promedio que los visitantes pasan en la página
4. **Scroll depth**: Hasta dónde scrollean los visitantes
5. **Plan más popular**: Qué plan tiene más clics

### Herramientas Recomendadas

- **Google Analytics**: Para métricas generales
- **Hotjar**: Para heatmaps y grabaciones de sesiones
- **Mixpanel**: Para eventos y conversiones
- **Vercel Analytics**: Para métricas de rendimiento

---

## ✅ Checklist de Implementación

### Contenido
- [x] Hero section con título y descripción
- [x] Features section con 6 funcionalidades
- [x] Benefits section con 6 beneficios
- [x] Pricing section con 4 planes
- [x] CTA section con llamados a la acción
- [x] Footer con información de contacto
- [ ] Screenshots de la aplicación
- [ ] Videos demo
- [ ] Testimonios de clientes
- [ ] Sección FAQ

### Funcionalidades
- [x] Navegación entre secciones
- [x] Toggle de precios mensuales/anuales
- [x] Botones de acción funcionales
- [ ] Modal de video demo
- [ ] Formulario de contacto
- [ ] Integración con analytics

### Diseño
- [x] Glassmorphism consistente
- [x] Responsive design
- [x] Animaciones sutiles
- [x] Gradientes atractivos
- [ ] Optimización de imágenes
- [ ] Lazy loading

---

## 🎯 Próximos Pasos

1. **Obtener screenshots**: Capturar screenshots de las funcionalidades más importantes
2. **Crear videos demo**: Grabar videos demo de las funcionalidades clave
3. **Agregar contenido visual**: Integrar imágenes y videos en la landing page
4. **Optimizar SEO**: Agregar meta tags, descripciones, etc.
5. **Agregar analytics**: Integrar Google Analytics o similar
6. **Testing**: Probar la landing page en diferentes dispositivos y navegadores
7. **Feedback**: Obtener feedback de usuarios y ajustar según sea necesario

---

## 📞 Soporte

Para preguntas o problemas con la landing page:
- **Email**: soporte@reforma.com
- **Documentación**: Ver `docs/REQUERIMIENTOS_IMAGENES_LANDING.md`

---

**Última actualización**: Diciembre 2024

