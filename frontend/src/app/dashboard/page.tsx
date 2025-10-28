import { KPICard, Button } from '@/components/ui';

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Panel Principal - Stock
        </h1>
        <p className="text-muted-foreground">
          ¡Hola, Usuario! Sistema de gestión integral para tu negocio de embutidos
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Total Productos"
          value="247"
          icon="📦"
          color="blue"
        />
        <KPICard
          title="Alertas Críticas"
          value="2"
          icon="⚠️"
          color="red"
        />
        <KPICard
          title="Valor Total Stock"
          value="€24.5K"
          icon="💰"
          color="yellow"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button variant="primary" className="flex items-center justify-center gap-2">
          <span>📦</span>
          Actualizar Stock
        </Button>
        <Button variant="secondary" className="flex items-center justify-center gap-2">
          <span>🔍</span>
          Buscar
        </Button>
        <Button variant="accent" className="flex items-center justify-center gap-2">
          <span>📄</span>
          Reporte
        </Button>
        <Button variant="danger" className="flex items-center justify-center gap-2">
          <span>📦</span>
          Archivar
        </Button>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="retro-card">
          <div className="retro-header">Distribución de Stock por Categoría</div>
          <div className="p-6">
            <p className="text-muted-foreground mb-4">
              Pie chart aquí (implementar con Recharts)
            </p>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="retro-card">
          <div className="retro-header">Top 10 Materias Primas por Valor</div>
          <div className="p-6">
            <p className="text-muted-foreground mb-4">
              Bar chart aquí (implementar con Recharts)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

