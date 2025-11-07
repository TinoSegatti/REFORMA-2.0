'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

interface ProveedoresGastoChartProps {
  data: Array<{
    id: string;
    codigoProveedor: string;
    nombreProveedor: string;
    totalGastado: number;
  }>;
}

const GASTO_COLORS = [
  '#34d399',
  '#60a5fa',
  '#fbbf24',
  '#f472b6',
  '#a78bfa',
  '#f59e0b',
  '#f87171',
  '#4ade80',
  '#22d3ee',
  '#f97316',
];

export default function ProveedoresGastoChart({ data }: ProveedoresGastoChartProps) {
  const chartData = (data || []).map((item) => ({
    name: `${item.codigoProveedor} - ${item.nombreProveedor}`,
    value: Number(item.totalGastado || 0),
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center glass-surface rounded-xl border-2 border-dashed border-white/20">
        <div className="text-center">
          <p className="text-4xl mb-2">💸</p>
          <p className="text-foreground/90 font-medium">Sin datos</p>
          <p className="text-sm text-foreground/60">Registra compras para ver dónde se concentra el gasto</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 16, right: 24, left: 0, bottom: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
            tickFormatter={(value) => `$ ${Number(value).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={200}
            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{
              background: 'rgba(17, 24, 39, 0.9)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: '#f9fafb',
              backdropFilter: 'blur(6px)',
              padding: '12px 16px',
            }}
            formatter={(value: number) => [
              `${Number(value).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })}`,
              'Total gastado',
            ]}
            labelFormatter={(label: string) => label}
          />
          <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20}>
            {chartData.map((_, index) => (
              <Cell key={`gasto-${index}`} fill={GASTO_COLORS[index % GASTO_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}


