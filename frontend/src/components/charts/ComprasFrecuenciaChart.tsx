'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ComprasFrecuenciaChartProps {
  data: Array<{
    codigo: string;
    nombre: string;
    vecesComprada: number;
  }>;
}

const COLORS = ['#B6CCAE', '#F5B8DA', '#FAD863', '#B6CAEB', '#9AAB64', '#F8C540', '#E8A87C', '#95E1D3'];

export default function ComprasFrecuenciaChart({ data }: ComprasFrecuenciaChartProps) {
  const chartData = data.map((item) => ({
    name: item.codigo,
    veces: Number(item.vecesComprada || 0),
    label: `${item.codigo} - ${item.nombre}`,
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gradient-to-br from-[#B6CAEB]/10 to-[#9DB5D9]/10 rounded-xl border-2 border-dashed border-gray-300">
        <div className="text-center">
          <p className="text-4xl mb-2">🧾</p>
          <p className="text-gray-600 font-medium">Sin datos</p>
          <p className="text-sm text-gray-500">Registra compras para ver la frecuencia</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 50 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#4b5563' }} angle={-35} textAnchor="end" height={60} interval={0} />
          <YAxis tick={{ fontSize: 12, fill: '#4b5563' }} tickFormatter={(v: number) => v.toLocaleString('es-AR')} />
          <Tooltip
            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 6px 12px rgba(0,0,0,0.06)', padding: '10px' }}
            labelFormatter={(label: string) => {
              const item = chartData.find((d) => d.name === label);
              return item ? item.label : label;
            }}
            formatter={(value: number) => [value.toLocaleString('es-AR'), 'Veces']}
          />
          <Bar dataKey="veces" radius={[8, 8, 0, 0]} barSize={40}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}



