import { Button, Card, Input } from '@/components/ui';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <main className="w-full max-w-4xl space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            REFORMA - Componentes Base
          </h1>
          <p className="text-muted-foreground">
            Estilo Retro/Vintage implementado
          </p>
        </div>

        {/* Botones */}
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Botones</h3>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Botón Principal</Button>
            <Button variant="secondary">Botón Secundario</Button>
            <Button variant="accent">Botón Accent</Button>
            <Button variant="danger">Botón Danger</Button>
          </div>
        </Card>

        {/* Inputs */}
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Inputs</h3>
          </div>
          <div className="space-y-4">
            <Input label="Nombre" placeholder="Ingresa tu nombre" />
            <Input label="Email" type="email" placeholder="email@ejemplo.com" />
            <Input label="Contraseña" type="password" placeholder="••••••••" />
          </div>
        </Card>

        {/* Card */}
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Ejemplo de Card</h3>
          </div>
          <p className="text-foreground">
            Este es un ejemplo de una card con estilo retro. Tiene bordes gruesos,
            sombras características y efectos hover.
          </p>
        </Card>

        {/* Colores */}
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Paleta de Colores</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="retro-section p-4">
              <div className="h-20 bg-[#D4B5A0] border-2 border-[#8B7355] mb-2"></div>
              <p className="text-sm font-medium">Beige</p>
              <p className="text-xs text-muted-foreground">#D4B5A0</p>
            </div>
            <div className="retro-section p-4">
              <div className="h-20 bg-[#FF8C42] border-2 border-[#8B7355] mb-2"></div>
              <p className="text-sm font-medium">Orange</p>
              <p className="text-xs text-muted-foreground">#FF8C42</p>
            </div>
            <div className="retro-section p-4">
              <div className="h-20 bg-[#5DADE2] border-2 border-[#8B7355] mb-2"></div>
              <p className="text-sm font-medium">Cyan</p>
              <p className="text-xs text-muted-foreground">#5DADE2</p>
            </div>
            <div className="retro-section p-4">
              <div className="h-20 bg-[#FFD966] border-2 border-[#8B7355] mb-2"></div>
              <p className="text-sm font-medium">Yellow</p>
              <p className="text-xs text-muted-foreground">#FFD966</p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
