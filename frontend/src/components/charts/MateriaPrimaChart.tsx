'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface MateriaPrimaChartProps {
  data: Array<{
    codigo: string;
    nombre: string;
    toneladas_totales: number;
  }>;
}

// Colores modernos y vibrantes para las barras
const COLORS = [
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#ef4444', // Red
  '#22c55e', // Green
  '#f97316', // Orange
  '#6366f1', // Indigo
];

export default function MateriaPrimaChart({ data }: MateriaPrimaChartProps) {
  // Transformar datos para el gráfico
  const chartData = data.map((item, index) => ({
    nombre: item.codigo,
    toneladas: Number(item.toneladas_totales),
    nombreCompleto: `${item.codigo} - ${item.nombre}`,
    color: COLORS[index % COLORS.length]
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center glass-surface rounded-xl border-2 border-dashed border-white/20">
        <div className="text-center">
          <p className="text-5xl mb-3">📊</p>
          <p className="text-foreground/90 font-semibold">Sin datos disponibles</p>
          <p className="text-sm text-foreground/60 mt-1">Agrega materias primas a tus fórmulas para ver estadísticas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 20,
            left: 20,
            bottom: 60,
          }}
          barSize={40}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="rgba(255,255,255,0.1)" 
            vertical={false}
          />
          <XAxis 
            dataKey="nombre" 
            tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.7)', fontWeight: '500' }}
            angle={-35}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.7)', fontWeight: '500' }}
          />
          <Tooltip 
            contentStyle={{
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
              padding: '12px',
              color: '#fff'
            }}
            cursor={{ fill: 'rgba(255,255,255,0.06)' }}
            formatter={(value: number) => [
              <span key="value" style={{ fontWeight: '600' }}>
                {value.toFixed(2)} ton
              </span>,
              'Cantidad'
            ]}
            labelFormatter={(label: string) => {
              const item = chartData.find(d => d.nombre === label);
              return item?.nombreCompleto || label;
            }}
          />
          <Bar 
            dataKey="toneladas" 
            radius={[8, 8, 0, 0]}
            animationBegin={0}
            animationDuration={1000}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}