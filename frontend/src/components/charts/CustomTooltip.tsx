'use client';

import { TooltipProps } from 'recharts';

/**
 * CustomTooltip reutilizable para todos los gráficos
 * Se adapta automáticamente al modo oscuro/claro usando colores que funcionan en ambos
 * Usa fondo gris oscuro en modo claro y gris claro en modo oscuro para máxima legibilidad
 */
export function CustomTooltip({ active, payload, label }: TooltipProps<any, any>) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-gray-800 dark:bg-gray-100 border border-gray-600 dark:border-gray-400 rounded-lg p-3 shadow-xl min-w-[200px] backdrop-blur-sm">
      {label && (
        <div className="text-white dark:text-gray-900 font-semibold mb-2 pb-2 border-b border-gray-600 dark:border-gray-400">
          {label}
        </div>
      )}
      <div className="space-y-1.5">
        {payload.map((entry: any, index: number) => {
          // Determinar el color del punto basado en el color del entry o usar un color por defecto
          const color = entry.color || '#9d77f4';
          
          return (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0 border border-gray-500 dark:border-gray-600"
                style={{ backgroundColor: color }}
              />
              <div className="flex-1">
                <div className="text-white dark:text-gray-900 font-medium text-sm">
                  {entry.name || entry.dataKey || 'Valor'}
                </div>
                <div className="text-gray-300 dark:text-gray-700 text-xs">
                  {typeof entry.value === 'number'
                    ? entry.value.toLocaleString('es-AR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : entry.value}
                  {entry.unit && ` ${entry.unit}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * CustomTooltip para gráficos de Pie (más simple)
 */
export function CustomPieTooltip({ active, payload }: TooltipProps<any, any>) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload;
  const value = payload[0]?.value;
  const name = payload[0]?.name || data?.name || '';

  return (
    <div className="bg-gray-800 dark:bg-gray-100 border border-gray-600 dark:border-gray-400 rounded-lg p-3 shadow-xl backdrop-blur-sm">
      <div className="text-white dark:text-gray-900 font-semibold mb-1">{name}</div>
      <div className="text-gray-300 dark:text-gray-700 text-sm">
        {typeof value === 'number'
          ? value.toLocaleString('es-AR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : value}
        {data?.unit && ` ${data.unit}`}
        {payload[0]?.payload?.percent !== undefined && (
          <span className="ml-1">
            · {((payload[0]?.payload?.percent || 0) * 100).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * CustomTooltip especial para InventarioExistenciasChart con desglose de "Otras"
 */
interface CustomTooltipWithTotalProps extends TooltipProps<any, any> {
  total: number;
}

export function CustomTooltipWithTotal({ active, payload, total }: CustomTooltipWithTotalProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload as {
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
  const pct = total > 0 ? (data.value / total) * 100 : 0;

  if (data.esOtras && data.detalleCompleto && data.detalleCompleto.length > 0) {
    return (
      <div className="bg-gray-800 dark:bg-gray-100 border border-gray-600 dark:border-gray-400 rounded-lg p-3 shadow-xl min-w-[250px] backdrop-blur-sm">
        <div className="text-white dark:text-gray-900 font-semibold mb-2 pb-2 border-b border-gray-600 dark:border-gray-400">
          Otras: {data.value.toLocaleString('es-AR', { maximumFractionDigits: 2 })} kg · {pct.toFixed(1)}%
        </div>
        <div className="text-xs mt-2 pt-2 border-t border-gray-600 dark:border-gray-400">
          <div className="text-white dark:text-gray-900 font-semibold mb-2">Desglose:</div>
          {data.detalleCompleto.map((item, index: number) => (
            <div key={index} className="text-gray-300 dark:text-gray-700 mb-1.5">
              • {item.codigo} - {item.nombre}: {item.cantidad.toLocaleString('es-AR', { maximumFractionDigits: 2 })} kg ({item.porcentaje.toFixed(2)}%)
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 dark:bg-gray-100 border border-gray-600 dark:border-gray-400 rounded-lg p-3 shadow-xl backdrop-blur-sm">
      <div className="text-white dark:text-gray-900 font-semibold mb-1">{data.name}</div>
      <div className="text-gray-300 dark:text-gray-700 text-sm">
        {data.value.toLocaleString('es-AR', { maximumFractionDigits: 2 })} kg · {pct.toFixed(1)}%
      </div>
    </div>
  );
}

/**
 * CustomTooltip especial para InventarioValorChart con desglose de "Otras"
 */
export function CustomTooltipValor({ active, payload }: TooltipProps<any, any>) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload;

  if (data.esOtras && data.detalleCompleto && data.detalleCompleto.length > 0) {
    return (
      <div className="bg-gray-800 dark:bg-gray-100 border border-gray-600 dark:border-gray-400 rounded-lg p-3 shadow-xl min-w-[250px] backdrop-blur-sm">
        <div className="text-white dark:text-gray-900 font-semibold mb-2 pb-2 border-b border-gray-600 dark:border-gray-400">
          Otras: {data.valorStock.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })}
        </div>
        <div className="text-xs mt-2 pt-2 border-t border-gray-600 dark:border-gray-400">
          <div className="text-white dark:text-gray-900 font-semibold mb-2">Desglose:</div>
          {data.detalleCompleto.map((item: any, index: number) => (
            <div key={index} className="text-gray-300 dark:text-gray-700 mb-1.5">
              • {item.codigo} - {item.nombre}: {item.valorStock.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 dark:bg-gray-100 border border-gray-600 dark:border-gray-400 rounded-lg p-3 shadow-xl backdrop-blur-sm">
      <div className="text-white dark:text-gray-900 font-semibold mb-1">{data.label}</div>
      <div className="text-gray-300 dark:text-gray-700 text-sm">
        {data.valorStock.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })}
      </div>
    </div>
  );
}

