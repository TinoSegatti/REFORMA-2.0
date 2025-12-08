'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, PieLabelRenderProps } from 'recharts';
import { CustomPieTooltip } from './CustomTooltip';

interface DistribucionMateriasFormulasChartProps {
  data: Array<{
    formulaCodigo: string;
    formulaDescripcion: string;
    materias: Array<{
      materiaCodigo: string;
      materiaNombre: string;
      cantidadKg: number;
      porcentaje: number;
    }>;
  }>;
}

const COLORS = ['#a855f7', '#ec4899', '#14b8a6', '#8b5cf6', '#f59e0b', '#06b6d4', '#ef4444', '#22c55e', '#f97316', '#6366f1'];

export default function DistribucionMateriasFormulasChart({ data }: DistribucionMateriasFormulasChartProps) {
  // Tomar la primera fórmula para mostrar su distribución
  const primeraFormula = data[0];
  
  if (!primeraFormula || primeraFormula.materias.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center glass-surface rounded-xl border-2 border-dashed border-white/20">
        <div className="text-center">
          <p className="text-4xl mb-2">📊</p>
          <p className="text-foreground/90 font-medium">Sin datos</p>
          <p className="text-sm text-foreground/60">Crea fórmulas con materias primas para ver la distribución</p>
        </div>
      </div>
    );
  }

  interface ChartDataPoint {
    name: string;
    value: number;
    cantidadKg: number;
    [key: string]: string | number;
  }

  const chartData: ChartDataPoint[] = primeraFormula.materias.map((materia) => ({
    name: `${materia.materiaCodigo} - ${materia.materiaNombre}`,
    value: Number(materia.porcentaje || 0),
    cantidadKg: Number(materia.cantidadKg || 0),
  }));

  return (
    <div className="h-80 w-full">
      <div className="mb-4 text-center">
        <p className="text-sm text-foreground/70 mb-1">Fórmula: {primeraFormula.formulaCodigo}</p>
        <p className="text-xs text-foreground/50">{primeraFormula.formulaDescripcion}</p>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(props: PieLabelRenderProps) => {
              const value = (props.value as number) ?? (props.percent as number) ?? 0;
              return `${value.toFixed(1)}%`;
            }}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomPieTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}
            formatter={(value) => value.length > 30 ? `${value.substring(0, 30)}...` : value}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}


