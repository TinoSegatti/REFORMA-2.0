'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface InventarioValorChartProps {
  data: Array<{
    codigo: string;
    nombre: string;
    precioAlmacen: number;
    valorStock: number;
  }>;
}

const COLORS = [
  '#FAD863', '#B6CCAE', '#F5B8DA', '#B6CAEB',
  '#9AAB64', '#F8C540', '#E8A87C', '#95E1D3',
  '#FAA381', '#D4A574'
];

export default function InventarioValorChart({ data }: InventarioValorChartProps) {
  const chartData = data.map(item => ({
    name: item.codigo,
    valorStock: Number(item.valorStock),
    precioAlmacen: Number(item.precioAlmacen),
    label: `${item.codigo} - ${item.nombre}`
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gradient-to-br from-[#FAD863]/10 to-[#F5B8DA]/10 rounded-xl border-2 border-dashed border-gray-300">
        <div className="text-center">
          <p className="text-4xl mb-2">💰</p>
          <p className="text-gray-600 font-medium">Sin datos</p>
          <p className="text-sm text-gray-500">Inicializa tu inventario</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: '#4b5563' }}
            angle={-35}
            textAnchor="end"
            height={60}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#4b5563' }}
            tickFormatter={(value: number) => value.toLocaleString('es-AR')}
          />
          <Tooltip
            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              boxShadow: '0 6px 12px -2px rgba(0, 0, 0, 0.1), 0 3px 7px -3px rgba(0, 0, 0, 0.05)',
              padding: '12px'
            }}
            labelFormatter={(label: string) => {
              const item = chartData.find(d => d.name === label);
              return item ? item.label : label;
            }}
            formatter={(value: number, name: string, props: any) => {
              if (name === 'valorStock') {
                return [
                  value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }),
                  'Valor Stock'
                ];
              } else if (name === 'precioAlmacen') {
                return [
                  value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }),
                  'Precio Almacén'
                ];
              }
              return [value, name];
            }}
          />
          <Bar
            dataKey="valorStock"
            fill="#FAD863"
            radius={[8, 8, 0, 0]}
            barSize={40}
            animationDuration={1000}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

