# 🎨 Componentes UI - REFORMA

## 📋 Componentes Disponibles

### Button
Botón con estilo retro en 4 variantes.

```tsx
import { Button } from '@/components/ui';

<Button variant="primary">Guardar</Button>
<Button variant="secondary">Cancelar</Button>
<Button variant="accent">Nuevo</Button>
<Button variant="danger">Eliminar</Button>
```

**Variantes:**
- `primary` - Naranja (#FF8C42)
- `secondary` - Cyan (#5DADE2)
- `accent` - Amarillo (#FFD966)
- `danger` - Rojo (#E74C3C)

---

### Input
Input con estilo retro y soporte para labels y errores.

```tsx
import { Input } from '@/components/ui';

<Input 
  label="Email" 
  type="email" 
  placeholder="email@ejemplo.com"
  error="Campo requerido"
/>
```

---

### Card
Card con estilo retro que incluye header opcional.

```tsx
import { Card } from '@/components/ui';

<Card header="Título de la Card">
  Contenido de la card
</Card>
```

---

### Table
Tabla con estilo retro vintage.

```tsx
import { Table, TableRow, TableCell } from '@/components/ui';

<Table columns={['Nombre', 'Email', 'Acciones']}>
  <TableRow>
    <TableCell>Juan Pérez</TableCell>
    <TableCell>juan@ejemplo.com</TableCell>
    <TableCell>
      <Button variant="primary">Editar</Button>
    </TableCell>
  </TableRow>
</Table>
```

---

### Modal
Modal con overlay y cierre automático.

```tsx
import { Modal } from '@/components/ui';

const [isOpen, setIsOpen] = useState(false);

<Modal 
  isOpen={isOpen} 
  onClose={() => setIsOpen(false)}
  title="Nuevo Item"
>
  Contenido del modal
</Modal>
```

---

### Badge
Badge con estilo retro.

```tsx
import { Badge } from '@/components/ui';

<Badge variant="default">Default</Badge>
<Badge variant="primary">Primary</Badge>
<Badge variant="success">Activo</Badge>
<Badge variant="error">Error</Badge>
<Badge variant="warning">Advertencia</Badge>
```

---

### Select
Select con estilo retro.

```tsx
import { Select } from '@/components/ui';

<Select 
  label="Seleccionar opción"
  options={[
    { value: '1', label: 'Opción 1' },
    { value: '2', label: 'Opción 2' }
  ]}
/>
```

---

## 🎨 Estilos Globales

Todos los componentes utilizan las clases CSS retro definidas en `globals.css`:

- `.retro-card` - Cards con bordes gruesos
- `.retro-button-primary` - Botones primarios
- `.retro-input` - Inputs con estilo
- `.retro-table` - Tablas con gradientes
- `.retro-badge` - Badges

---

## 🚀 Uso

```tsx
import { Button, Input, Card } from '@/components/ui';

export default function MiComponente() {
  return (
    <Card header="Título">
      <Input label="Nombre" />
      <Button variant="primary">Guardar</Button>
    </Card>
  );
}
```

---

**Estos componentes están listos para usar en toda la aplicación!** 🎉

