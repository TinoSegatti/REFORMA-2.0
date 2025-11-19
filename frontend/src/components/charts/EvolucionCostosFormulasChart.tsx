'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface EvolucionCostosFormulasChartProps {
  data: Array<{
    fecha: string | Date;
    formulaCodigo: string;
    formulaDescripcion: string;
    costoTotal: number;
    costoPorKilo: number;
  }>;
}

const COLORS = ['#a855f7', '#ec4899', '#14b8a6', '#8b5cf6', '#f59e0b', '#06b6d4', '#ef4444', '#22c55e'];

export default function EvolucionCostosFormulasChart({ data }: EvolucionCostosFormulasChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center glass-surface rounded-xl border-2 border-dashed border-white/20">
        <div className="text-center">
          <p className="text-4xl mb-2">📊</p>
          <p className="text-foreground/90 font-medium">Sin datos</p>
          <p className="text-sm text-foreground/60">Registra fabricaciones para ver la evolución de costos</p>
        </div>
      </div>
    );
  }

  // Agrupar por fecha y fórmula
  const formulasUnicas = Array.from(new Set(data.map(d => d.formulaCodigo))).slice(0, 5); // Máximo 5 fórmulas
  const fechasUnicas = Array.from(new Set(data.map(d => {
    const fecha = new Date(d.fecha);
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
  }))).sort();

  const chartData = fechasUnicas.map(fecha => {
    const dataPoint: any = { fecha };
    formulasUnicas.forEach((formulaCodigo, index) => {
      const datosFormula = data.find(d => {
        const dFecha = new Date(d.fecha);
        const fechaStr = `${dFecha.getFullYear()}-${String(dFecha.getMonth() + 1).padStart(2, '0')}`;
        return fechaStr === fecha && d.formulaCodigo === formulaCodigo;
      });
      dataPoint[formulaCodigo] = datosFormula ? Number(datosFormula.costoPorKilo || 0) : null;
    });
    return dataPoint;
  });

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
          <XAxis
            dataKey="fecha"
            tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.7)' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.7)' }}
            tickFormatter={(v: number) => `$${v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(17, 24, 39, 0.9)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: '#f9fafb',
              backdropFilter: 'blur(6px)',
              padding: '12px 16px',
            }}
            formatter={(value: number) => [`$${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/kg`, 'Costo por kg']}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}
            formatter={(value) => value.length > 20 ? `${value.substring(0, 20)}...` : value}
          />
          {formulasUnicas.map((formulaCodigo, index) => (
            <Line
              key={formulaCodigo}
              type="monotone"
              dataKey={formulaCodigo}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

