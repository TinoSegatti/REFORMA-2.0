'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CustomTooltipValor } from './CustomTooltip';

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
  '#FAA381', '#6b7280'
];


export default function InventarioValorChart({ data }: InventarioValorChartProps) {
  const chartData = data.map(item => ({
    name: item.codigo,
    valorStock: Number(item.valorStock),
    precioAlmacen: Number(item.precioAlmacen),
    label: `${item.codigo} - ${item.nombre}`,
    nombre: item.nombre,
    codigo: item.codigo,
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gradient-to-br from-[#FAD863]/10 to-[#F5B8DA]/10 rounded-xl border-2 border-dashed border-gray-300">
        <div className="text-center">
          <p className="text-4xl mb-2">📊</p>
          <p className="text-gray-600 font-medium">Sin datos</p>
          <p className="text-sm text-gray-500">Inicializa tu inventario</p>
        </div>
      </div>
    );
  }

  // Ordenar por valorStock descendente (de mayor a menor valor)
  const sorted = [...chartData].sort((a, b) => b.valorStock - a.valorStock);

  // Procesar datos: top 9 (más valiosas) + "Otras" (décima columna con el resto)
  const processed = (() => {
    if (sorted.length <= 9) {
      return sorted;
    }

    const top9 = sorted.slice(0, 9); // Las 9 más valiosas
    const otras = sorted.slice(9); // Todas las restantes

    const otrasTotal = otras.reduce((sum, item) => sum + item.valorStock, 0);
    const otrasDetalle = otras.map(item => ({
      codigo: item.codigo,
      nombre: item.nombre,
      valorStock: item.valorStock,
    }));

    return [
      ...top9, // Columnas 1-9: ordenadas de mayor a menor valor
      {
        name: 'Otras',
        valorStock: otrasTotal,
        precioAlmacen: 0,
        label: 'Otras materias primas',
        nombre: 'Otras',
        codigo: 'OTRAS',
        esOtras: true,
        detalleCompleto: otrasDetalle,
      }, // Columna 10: "Otras" con el resto
    ];
  })();

  return (
    <div className="h-64 w-full glass-card p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={processed}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.7)' }}
            angle={-35}
            textAnchor="end"
            height={60}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.7)' }}
            tickFormatter={(value: number) => value.toLocaleString('es-AR')}
          />
          <Tooltip content={<CustomTooltipValor />} cursor={{ fill: 'rgba(255,255,255,0.06)' }} />
          <Bar
            dataKey="valorStock"
            radius={[8, 8, 0, 0]}
            barSize={40}
            animationDuration={1000}
          >
            {processed.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
