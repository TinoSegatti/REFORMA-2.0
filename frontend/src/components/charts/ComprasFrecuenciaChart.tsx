'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CustomTooltip } from './CustomTooltip';

interface ComprasFrecuenciaChartProps {
  data: Array<{
    codigo: string;
    nombre: string;
    vecesComprada: number;
    cantidadTotal: number;
  }>;
}

const COLORS = ['#a855f7', '#ec4899', '#14b8a6', '#8b5cf6', '#f59e0b', '#06b6d4', '#ef4444', '#22c55e'];

export default function ComprasFrecuenciaChart({ data }: ComprasFrecuenciaChartProps) {
  const chartData = data.map((item) => ({
    name: item.codigo,
    cantidad: Number(item.cantidadTotal || 0),
    veces: Number(item.vecesComprada || 0),
    label: `${item.codigo} - ${item.nombre}`,
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center glass-surface rounded-xl border-2 border-dashed border-white/20">
        <div className="text-center">
          <p className="text-4xl mb-2">🧾</p>
          <p className="text-foreground/90 font-medium">Sin datos</p>
          <p className="text-sm text-foreground/60">Registra compras para ver la frecuencia</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 w-full min-h-[256px]">
      <ResponsiveContainer width="100%" height="100%" minHeight={256}>
        <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 50 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.7)' }} angle={-35} textAnchor="end" height={60} interval={0} />
          <YAxis tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.7)' }} tickFormatter={(v: number) => v.toLocaleString('es-AR')} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.06)' }} />
          <Bar dataKey="cantidad" radius={[8, 8, 0, 0]} barSize={40}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}



