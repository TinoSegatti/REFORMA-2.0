import { Button, Card, Input } from '@/components/ui';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <main className="w-full max-w-4xl space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            REFORMA - Componentes Base
          </h1>
          <p className="text-muted-foreground">
            Glassmorphism Dark implementado
          </p>
        </div>

        {/* Botones */}
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Botones</h3>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Botón Principal</Button>
            <Button variant="secondary">Botón Secundario</Button>
            <Button variant="accent">Botón Accent</Button>
            <Button variant="danger">Botón Danger</Button>
            <Button variant="neutral">Botón Neutral</Button>
          </div>
        </Card>

        {/* Inputs */}
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Inputs</h3>
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
            <h3 className="text-lg font-semibold text-foreground">Ejemplo de Card</h3>
          </div>
          <p className="text-foreground/80">
            Este es un ejemplo de una card con estilo glassmorphism. Tiene efectos blur,
            transparencias sutiles y bordes cristalinos.
          </p>
        </Card>

        {/* Colores */}
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Paleta de Colores</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-4">
              <div className="h-20 bg-gradient-to-br from-purple-600 to-purple-500 rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Purple</p>
              <p className="text-xs text-muted-foreground">Primary</p>
            </div>
            <div className="glass-card p-4">
              <div className="h-20 bg-gradient-to-br from-pink-500 to-pink-400 rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Pink</p>
              <p className="text-xs text-muted-foreground">Secondary</p>
            </div>
            <div className="glass-card p-4">
              <div className="h-20 bg-gradient-to-br from-cyan-500 to-cyan-400 rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Cyan</p>
              <p className="text-xs text-muted-foreground">Accent</p>
            </div>
            <div className="glass-card p-4">
              <div className="h-20 bg-gradient-to-br from-red-600 to-red-500 rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Red</p>
              <p className="text-xs text-muted-foreground">Danger</p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
