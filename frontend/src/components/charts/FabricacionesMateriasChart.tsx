'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface FabricacionesMateriasChartProps {
  data: Array<{
    codigo: string;
    nombre: string;
    cantidadTotal: number; // en kg
  }>;
}

const COLORS = [
  '#B6CCAE', '#F5B8DA', '#FAD863', '#B6CAEB',
  '#9AAB64', '#F8C540', '#E8A87C', '#95E1D3',
  '#FAA381', '#D4A574'
];

export default function FabricacionesMateriasChart({ data }: FabricacionesMateriasChartProps) {
  const chartData = data.map((item) => ({
    name: `${item.codigo} - ${item.nombre}`,
    value: Number(item.cantidadTotal || 0), // usamos kg
    code: item.codigo,
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center glass-surface rounded-xl border-2 border-dashed border-white/20">
        <div className="text-center">
          <p className="text-4xl mb-2">📦</p>
          <p className="text-foreground/90 font-medium">Sin datos</p>
          <p className="text-sm text-foreground/60">Registra fabricaciones para ver las materias primas más utilizadas</p>
        </div>
      </div>
    );
  }

  const total = chartData.reduce((s, i) => s + i.value, 0);

  // Agrupar porciones menores al 4% en "Otras"
  const processed = (() => {
    if (total === 0) return chartData;
    const threshold = total * 0.04;
    const grandes = chartData.filter(d => d.value >= threshold);
    const pequenas = chartData.filter(d => d.value < threshold);
    if (pequenas.length === 0) return chartData;
    const otrasSum = pequenas.reduce((s, i) => s + i.value, 0);
    return [...grandes, { name: 'Otras', value: otrasSum, code: 'OTRAS' }];
  })();

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={processed}
            dataKey="value"
            nameKey="name"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={2}
            labelLine={false}
            label={(entry: any) => {
              const percent = total > 0 ? (entry.value / total) * 100 : 0;
              return `${percent.toFixed(1)}%`;
            }}
          >
            {processed.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '12px',
              color: '#111827',
              padding: '10px'
            }}
            formatter={(value: number, _name: string, props: any) => {
              const pct = total > 0 ? (Number(value) / total) * 100 : 0;
              return [
                `${Number(value).toLocaleString('es-AR', { maximumFractionDigits: 2 })} kg · ${pct.toFixed(1)}%`,
                props?.payload?.name || 'Cantidad'
              ];
            }}
            labelFormatter={(label: string) => label}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Total al centro (superpuesto) */}
      <div className="pointer-events-none -mt-64 h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xs text-foreground/60">Total</div>
          <div className="text-lg font-bold text-foreground">
            {total.toLocaleString('es-AR', { maximumFractionDigits: 0 })} kg
          </div>
        </div>
      </div>
    </div>
  );
}

