import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: string;
  color?: 'blue' | 'red' | 'yellow';
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon,
  color = 'blue'
}) => {
  const colorClasses = {
    blue: 'bg-[#5DADE2]',
    red: 'bg-[#E74C3C]',
    yellow: 'bg-[#FFD966]'
  };

  return (
    <div className="retro-card">
      <div className={`${colorClasses[color]} rounded-lg p-6 mb-4 inline-block`}>
        <span className="text-3xl">{icon}</span>
      </div>
      <h3 className="text-2xl font-bold text-foreground mb-1">{value}</h3>
      <p className="text-muted-foreground">{title}</p>
    </div>
  );
};

