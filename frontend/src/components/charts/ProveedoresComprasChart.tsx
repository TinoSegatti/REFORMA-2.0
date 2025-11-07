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

interface ProveedoresComprasChartProps {
  data: Array<{
    id: string;
    codigoProveedor: string;
    nombreProveedor: string;
    cantidadCompras: number;
  }>;
}

const BAR_COLOR = '#9d77f4';

export default function ProveedoresComprasChart({ data }: ProveedoresComprasChartProps) {
  const chartData = (data || []).map((item) => ({
    name:
      item.id === 'OTROS'
        ? 'Otros Proveedores'
        : `${item.codigoProveedor} - ${item.nombreProveedor}`,
    value: Number(item.cantidadCompras || 0),
    isOtros: item.id === 'OTROS',
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center glass-surface rounded-xl border-2 border-dashed border-white/20">
        <div className="text-center">
          <p className="text-4xl mb-2">📊</p>
          <p className="text-foreground/90 font-medium">Sin datos</p>
          <p className="text-sm text-foreground/60">Registra compras para ver los proveedores con más movimientos</p>
        </div>
      </div>
    );
  }

  const maxValue = chartData.reduce((max, item) => Math.max(max, item.value), 0);
  const yTicks = maxValue === 0 ? [0, 1] : undefined;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 32 }}>
          <defs>
            <linearGradient id="comprasGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9d77f4" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#9d77f4" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="otrosGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f472b6" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#f472b6" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
            interval={0}
            angle={-15}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
            allowDecimals={false}
            ticks={yTicks}
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
            formatter={(value: number) => [`${Number(value).toLocaleString('es-AR')} compras`, 'Compras']}
            labelFormatter={(label: string) => label}
          />
          <Bar dataKey="value" radius={[10, 10, 4, 4]} barSize={32} fill={BAR_COLOR}>
            {chartData.map((entry, index) => (
              <Cell
                key={`bar-${index}`}
                fill={entry.isOtros ? 'url(#otrosGradient)' : 'url(#comprasGradient)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}


