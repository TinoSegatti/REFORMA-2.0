'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

interface ConsumoMateriasPrimasChartProps {
  data: Array<{
    periodo: string;
    materiaCodigo: string;
    materiaNombre: string;
    cantidadKg: number;
  }>;
}

interface ChartDataPoint {
  periodo: string;
  [materiaCodigo: string]: string | number;
}

const COLORS = ['#a855f7', '#ec4899', '#14b8a6', '#8b5cf6', '#f59e0b', '#06b6d4', '#ef4444', '#22c55e', '#f97316', '#6366f1'];

export default function ConsumoMateriasPrimasChart({ data }: ConsumoMateriasPrimasChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center glass-surface rounded-xl border-2 border-dashed border-white/20">
        <div className="text-center">
          <p className="text-4xl mb-2">📊</p>
          <p className="text-foreground/90 font-medium">Sin datos</p>
          <p className="text-sm text-foreground/60">Registra fabricaciones para ver el consumo de materias primas</p>
        </div>
      </div>
    );
  }

  // Agrupar por período y materia prima (top 5 materias más consumidas)
  const materiasUnicas = Array.from(new Set(data.map(d => d.materiaCodigo)))
    .map(codigo => {
      const total = data
        .filter(d => d.materiaCodigo === codigo)
        .reduce((sum, d) => sum + Number(d.cantidadKg || 0), 0);
      return { codigo, total };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map(m => m.codigo);

  const periodosUnicos = Array.from(new Set(data.map(d => d.periodo))).sort();

  const chartData = periodosUnicos.map(periodo => {
    const dataPoint: ChartDataPoint = { periodo };
    materiasUnicas.forEach((materiaCodigo) => {
      const datosMateria = data.find(d => d.periodo === periodo && d.materiaCodigo === materiaCodigo);
      const materia = datosMateria ? datosMateria.materiaNombre : '';
      dataPoint[materiaCodigo] = datosMateria ? Number(datosMateria.cantidadKg || 0) : 0;
      dataPoint[`${materiaCodigo}_nombre`] = materia;
    });
    return dataPoint;
  });

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
          <XAxis
            dataKey="periodo"
            tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.7)' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.7)' }}
            tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(17, 24, 39, 0.9)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: '#f9fafb',
              backdropFilter: 'blur(6px)',
              padding: '12px 16px',
            }}
            formatter={(value: number, name: string, props: { payload?: ChartDataPoint }) => {
              const materiaNombre = props.payload?.[`${name}_nombre`] || name;
              return [`${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`, materiaNombre];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}
            formatter={(value: string) => {
              const nombre = chartData[0]?.[`${value}_nombre`] || value;
              return typeof nombre === 'string' && nombre.length > 20 ? `${nombre.substring(0, 20)}...` : String(nombre);
            }}
          />
          {materiasUnicas.map((materiaCodigo, index) => (
            <Bar
              key={materiaCodigo}
              dataKey={materiaCodigo}
              stackId="a"
              fill={COLORS[index % COLORS.length]}
              radius={index === materiasUnicas.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]}
            >
              {chartData.map((entry, idx) => (
                <Cell key={`cell-${materiaCodigo}-${idx}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}


