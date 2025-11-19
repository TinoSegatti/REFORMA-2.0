# 📤 Cómo Compartir CSS desde Figma

## ✅ Opción 1: Copiar CSS desde Figma (RECOMENDADO)

### Pasos:
1. En Figma, selecciona un elemento (botón, input, card, etc.)
2. Ve al panel derecho → **"Inspect"** o **"Code"**
3. Click en la pestaña **"CSS"**
4. Copia el código CSS que aparece
5. **Pégalo aquí** o en el archivo que te indique

### Ejemplo:
```css
/* Botón principal */
.primary-button {
  width: 120px;
  height: 40px;
  background: #facc15;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  /* ... más propiedades */
}
```

---

## ✅ Opción 2: Exportar Specs desde Figma

### Pasos:
1. Selecciona los frames/elementos que quieres
2. Click derecho → **"Copy/Paste as"** → **"CSS"**
3. Pega el código aquí

---

## ✅ Opción 3: Compartir archivo CSS

### Pasos:
1. En Figma, ve a un elemento
2. Panel derecho → Click en el ícono de código (</>)
3. Selecciona **"Copy CSS"**
4. Crea un archivo `.css` con el código
5. **Pásame el archivo** o pega el contenido aquí

---

## ✅ Opción 4: Exportar Variables de Diseño

Si usas Design Tokens en Figma:

1. **Design → Design Tokens**
2. Exporta como JSON
3. **Pásame el JSON**

Esto me dará:
- Colores exactos
- Espaciados
- Tipografías
- Sombras
- etc.

---

## 🎯 Qué Me Ayuda Más

**Para cada diseño (Login, Panel, Formularios) necesito:**

### 1. Colores
```css
:root {
  --color-primary: #facc15;
  --color-secondary: #64748b;
  --color-background: #fafafa;
  --color-text: #171717;
}
```

### 2. Tipografía
```css
h1 {
  font-family: 'Playfair Display', serif;
  font-size: 32px;
  font-weight: 700;
}
```

### 3. Componentes principales
- Botones (primary, secondary, disabled)
- Inputs (text, number, select)
- Cards
- Tablas
- Modales

### 4. Espaciado
```css
:root {
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
}
```

---

## 📋 Formato Preferido

**Puedes compartir el CSS de 3 formas:**

1. **Aquí en el chat** - Pegar el código directamente
2. **Archivo CSS** - Crear archivo en `frontend/src/styles/figma.css`
3. **JSON** - Si exportas Design Tokens

---

## 🚀 Una Vez que Tenga el CSS

Implementaré:
- ✅ Variables CSS en Tailwind
- ✅ Componentes base con los estilos exactos
- ✅ Tema completo para Chakra UI
- ✅ Componentes de UI personalizados
- ✅ Páginas según los diseños

---

## 💡 ¿Cómo Proceder?

**Por favor comparte:**
1. CSS del **Login**
2. CSS del **Panel Principal** (especialmente la navbar/sidebar)
3. CSS de **botones e inputs** (componentes más usados)
4. CSS de **Cards o containers**

Con esto puedo replicar los diseños **exactamente**. 🎨

