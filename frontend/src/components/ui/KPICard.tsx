'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon?: string | React.ComponentType<{ className?: string }>;
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
    pink: 'from-pink-500 to-pink-400',
    yellow: 'from-amber-500 to-amber-400',
    green: 'from-emerald-500 to-emerald-400',
    mint: 'from-teal-500 to-teal-400',
    blue: 'from-blue-500 to-blue-400'
  };

  const IconComponent = typeof icon === 'string' ? null : icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card p-6 hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground/70 mb-2">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-foreground/60">vs mes anterior</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`bg-gradient-to-br ${colorClasses[color]} w-16 h-16 rounded-xl flex items-center justify-center shadow-lg`} style={{
            boxShadow: color === 'pink' ? '0 10px 40px -10px rgba(236, 72, 153, 0.3)' :
                       color === 'yellow' ? '0 10px 40px -10px rgba(245, 158, 11, 0.3)' :
                       color === 'green' ? '0 10px 40px -10px rgba(16, 185, 129, 0.3)' :
                       color === 'mint' ? '0 10px 40px -10px rgba(20, 184, 166, 0.3)' :
                       '0 10px 40px -10px rgba(59, 130, 246, 0.3)'
          }}>
            {IconComponent ? <IconComponent className="h-8 w-8 text-white" /> : (typeof icon === 'string' ? <span className="text-2xl">{icon}</span> : null)}
          </div>
        )}
      </div>
    </motion.div>
  );
};
