'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      label: string;
      valorStock: number;
      esOtras?: boolean;
      detalleCompleto?: Array<{
        codigo: string;
        nombre: string;
        valorStock: number;
      }>;
    };
  }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  if (data.esOtras && data.detalleCompleto && data.detalleCompleto.length > 0) {
    return (
      <div style={{
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '12px',
        boxShadow: '0 6px 12px rgba(0,0,0,0.3)',
        padding: '12px',
        color: '#9ca3af',
        minWidth: '250px'
      }}>
        <div style={{ fontWeight: 600, marginBottom: '8px', color: '#9ca3af' }}>
          Otras: {data.valorStock.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })}
        </div>
        <div style={{ fontSize: '12px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <div style={{ fontWeight: 600, marginBottom: '6px', color: '#9ca3af' }}>Desglose:</div>
          {data.detalleCompleto.map((item, index: number) => (
            <div key={index} style={{ marginBottom: '4px', color: '#9ca3af' }}>
              • {item.codigo} - {item.nombre}: {item.valorStock.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.12)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '12px',
      boxShadow: '0 6px 12px -2px rgba(0, 0, 0, 0.1), 0 3px 7px -3px rgba(0, 0, 0, 0.05)',
      padding: '12px',
      color: '#fff'
    }}>
      <div style={{ fontWeight: 600, marginBottom: '4px' }}>{data.label}</div>
      <div>{data.valorStock.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })}</div>
    </div>
  );
};

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
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.06)' }} />
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
