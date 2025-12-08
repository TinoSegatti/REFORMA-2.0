'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CustomTooltip } from './CustomTooltip';

interface TendenciasPreciosChartProps {
  data: Array<{
    fecha: string | Date;
    materiaCodigo: string;
    materiaNombre: string;
    precio: number;
  }>;
}

const COLORS = ['#a855f7', '#ec4899', '#14b8a6', '#8b5cf6', '#f59e0b', '#06b6d4', '#ef4444', '#22c55e', '#f97316', '#6366f1'];

export default function TendenciasPreciosChart({ data }: TendenciasPreciosChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center glass-surface rounded-xl border-2 border-dashed border-white/20">
        <div className="text-center">
          <p className="text-4xl mb-2">📊</p>
          <p className="text-foreground/90 font-medium">Sin datos</p>
          <p className="text-sm text-foreground/60">Registra cambios de precios para ver las tendencias</p>
        </div>
      </div>
    );
  }

  // Obtener las materias primas más frecuentes (top 5)
  const materiasUnicas = Array.from(new Set(data.map(d => d.materiaCodigo)))
    .map(codigo => {
      const cambios = data.filter(d => d.materiaCodigo === codigo).length;
      return { codigo, cambios };
    })
    .sort((a, b) => b.cambios - a.cambios)
    .slice(0, 5)
    .map(m => m.codigo);

  // Agrupar por fecha
  const fechasUnicas = Array.from(new Set(data.map(d => {
    const fecha = new Date(d.fecha);
    return fecha.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  }))).sort();

  interface ChartDataPoint {
    fecha: string;
    [materiaCodigo: string]: string | number | null;
  }

  const chartData: ChartDataPoint[] = fechasUnicas.map(fecha => {
    const dataPoint: ChartDataPoint = { fecha: new Date(fecha).toLocaleDateString('es-AR', { month: 'short', day: 'numeric' }) };
    materiasUnicas.forEach((materiaCodigo) => {
      const datosMateria = data.find(d => {
        const dFecha = new Date(d.fecha);
        return dFecha.toISOString().split('T')[0] === fecha && d.materiaCodigo === materiaCodigo;
      });
      const materia = datosMateria ? datosMateria.materiaNombre : '';
      dataPoint[materiaCodigo] = datosMateria ? Number(datosMateria.precio || 0) : null;
      dataPoint[`${materiaCodigo}_nombre`] = materia;
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
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}
            formatter={(value: string) => {
              const nombre = chartData[0]?.[`${value}_nombre`] || value;
              return typeof nombre === 'string' && nombre.length > 20 ? `${nombre.substring(0, 20)}...` : String(nombre);
            }}
          />
          {materiasUnicas.map((materiaCodigo, index) => (
            <Line
              key={materiaCodigo}
              type="monotone"
              dataKey={materiaCodigo}
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


