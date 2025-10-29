import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon?: string;
  color?: 'pink' | 'yellow' | 'green' | 'mint' | 'blue';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  value, 
  icon, 
  color = 'pink',
  trend 
}) => {
  const colorClasses = {
    pink: 'from-[#F5B8DA] to-[#E599C6]',
    yellow: 'from-[#FAD863] to-[#F8C540]',
    green: 'from-[#9AAB64] to-[#7B8E54]',
    mint: 'from-[#B6CCAE] to-[#A8C19F]',
    blue: 'from-[#B6CAEB] to-[#9DB5D9]'
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500">vs mes anterior</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`bg-gradient-to-br ${colorClasses[color]} w-16 h-16 rounded-xl flex items-center justify-center text-2xl shadow-lg`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
