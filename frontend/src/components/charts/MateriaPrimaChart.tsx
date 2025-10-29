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
  '#B6CCAE', // Verde menta
  '#F5B8DA', // Rosa
  '#FAD863', // Amarillo
  '#B6CAEB', // Azul claro
  '#9AAB64', // Verde oliva
  '#F8C540', // Dorado
  '#E8A87C', // Coral
  '#95E1D3', // Turquesa
  '#FAA381', // Naranja
  '#D4A574', // Beige
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
      <div className="h-64 flex items-center justify-center bg-gradient-to-br from-[#FAD863]/10 to-[#F5B8DA]/10 rounded-xl border-2 border-dashed border-gray-300">
        <div className="text-center">
          <p className="text-5xl mb-3">📊</p>
          <p className="text-gray-700 font-semibold">Sin datos disponibles</p>
          <p className="text-sm text-gray-500 mt-1">Agrega materias primas a tus fórmulas para ver estadísticas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={chartData}
          margin={{
            top: 30,
            right: 30,
            left: 20,
            bottom: 70,
          }}
          barSize={40}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#e5e7eb" 
            vertical={false}
          />
          <XAxis 
            dataKey="nombre" 
            tick={{ fontSize: 11, fill: '#6b7280', fontWeight: '500' }}
            angle={-35}
            textAnchor="end"
            height={80}
            stroke="#9ca3af"
          />
          <YAxis 
            tick={{ fontSize: 11, fill: '#6b7280', fontWeight: '500' }}
            stroke="#9ca3af"
            label={{ 
              value: 'Toneladas', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle', fill: '#6b7280', fontSize: '12px' }
            }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              padding: '12px'
            }}
            cursor={{ fill: 'rgba(182, 204, 174, 0.1)' }}
            formatter={(value: number) => [
              <span key="value" className="font-semibold text-gray-900">
                {value.toFixed(2)} ton
              </span>,
              'Cantidad'
            ]}
            labelFormatter={(label: string) => {
              const item = chartData.find(d => d.nombre === label);
              // Debe retornar texto plano; el contenedor del tooltip envuelve en <p>
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
                style={{
                  filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))'
                }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      {/* Leyenda de colores */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        {chartData.slice(0, 5).map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-600">{item.nombre}</span>
          </div>
        ))}
        {chartData.length > 5 && (
          <span className="text-xs text-gray-400">+{chartData.length - 5} más</span>
        )}
      </div>
    </div>
  );
}