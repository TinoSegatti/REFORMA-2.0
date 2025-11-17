'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, PieLabelRenderProps } from 'recharts';

interface InventarioExistenciasChartProps {
  data: Array<{
    codigo: string;
    nombre: string;
    cantidad: number; // en kg
    toneladas: number;
  }>;
}

const COLORS = [
  '#B6CCAE', '#F5B8DA', '#FAD863', '#B6CAEB',
  '#9AAB64', '#F8C540', '#E8A87C', '#95E1D3',
  '#FAA381', '#D4A574'
];

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      value: number;
      esOtras?: boolean;
      detalleCompleto?: Array<{
        codigo: string;
        nombre: string;
        cantidad: number;
        porcentaje: number;
      }>;
    };
  }>;
}

interface CustomTooltipProps extends TooltipProps {
  total: number;
}

const CustomTooltip = ({ active, payload, total }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const pct = total > 0 ? (data.value / total) * 100 : 0;

    if (data.esOtras && data.detalleCompleto && data.detalleCompleto.length > 0) {
      return (
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '12px',
          color: '#111827',
          padding: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          minWidth: '250px'
        }}>
          <div style={{ fontWeight: 600, marginBottom: '8px', color: '#111827' }}>
            Otras: {data.value.toLocaleString('es-AR', { maximumFractionDigits: 2 })} kg · {pct.toFixed(1)}%
          </div>
        <div style={{ fontSize: '12px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
          <div style={{ fontWeight: 600, marginBottom: '6px', color: '#111827' }}>Desglose:</div>
          {data.detalleCompleto.map((item, index: number) => (
            <div key={index} style={{ marginBottom: '4px', color: '#374151' }}>
              • {item.codigo} - {item.nombre}: {item.cantidad.toLocaleString('es-AR', { maximumFractionDigits: 2 })} kg ({item.porcentaje.toFixed(2)}%)
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '12px',
      color: '#111827',
      padding: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <div style={{ fontWeight: 600, marginBottom: '4px' }}>{data.name}</div>
      <div>{data.value.toLocaleString('es-AR', { maximumFractionDigits: 2 })} kg · {pct.toFixed(1)}%</div>
    </div>
  );
};

export default function InventarioExistenciasChart({ data }: InventarioExistenciasChartProps) {
  const chartData = useMemo(() => data.map((item) => ({
    name: `${item.codigo} - ${item.nombre}`,
    value: Number(item.cantidad || 0), // usamos kg
    code: item.codigo,
    nombreCompleto: item.nombre,
  })), [data]);

  const total = useMemo(() => chartData.reduce((s, i) => s + i.value, 0), [chartData]);

  // Crear función wrapper para pasar total al CustomTooltip (antes del early return)
  const TooltipWrapper = useMemo(() => {
    function TooltipWrapperComponent(props: TooltipProps) {
      return <CustomTooltip {...props} total={total} />;
    }
    return TooltipWrapperComponent;
  }, [total]);

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

  // Ordenar por cantidad descendente
  const sorted = [...chartData].sort((a, b) => b.value - a.value);

  const processed = (() => {
    if (total === 0) return chartData;

    // Separar las que son >= 4% y las que son < 4%
    const importantes = sorted.filter(d => {
      const percent = (d.value / total) * 100;
      return percent >= 4;
    });
    const pequenas = sorted.filter(d => {
      const percent = (d.value / total) * 100;
      return percent < 4;
    });

    // Si hay pequeñas, agruparlas en "Otras"
    if (pequenas.length > 0) {
      const otrasSum = pequenas.reduce((s, i) => s + i.value, 0);
      const otrasDetalle = pequenas.map(item => ({
        codigo: item.code,
        nombre: item.nombreCompleto,
        cantidad: item.value,
        porcentaje: total > 0 ? (item.value / total) * 100 : 0,
      }));

      return [
        ...importantes,
        {
          name: 'Otras',
          value: otrasSum,
          code: 'OTRAS',
          nombreCompleto: 'Otras materias primas',
          esOtras: true,
          detalleCompleto: otrasDetalle,
        },
      ];
    }

    // Si no hay pequeñas, devolver todas las importantes
    return importantes;
  })();

  return (
    <div className="h-64 w-full glass-card p-4">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={processed}
            dataKey="value"
            nameKey="name"
            innerRadius={45}
            outerRadius={80}
            paddingAngle={2}
            labelLine={false}
            label={(props: PieLabelRenderProps) => {
              const percent = typeof props.percent === 'number' ? props.percent : (typeof props.value === 'number' && total > 0 ? (props.value / total) * 100 : 0);
              // Solo mostrar label dentro del gráfico si el porcentaje es mayor a 4%
              if (typeof percent === 'number' && percent >= 4) {
                return `${percent.toFixed(1)}%`;
              }
              return '';
            }}
          >
            {processed.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={TooltipWrapper} />
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
