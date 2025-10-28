import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'error' | 'warning';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default'
}) => {
  const variantClasses = {
    default: 'retro-badge',
    primary: 'retro-badge bg-[#FF8C42]',
    success: 'retro-badge bg-[#22c55e]',
    error: 'retro-badge bg-[#E74C3C] text-white',
    warning: 'retro-badge bg-[#FFD966]'
  };

  return (
    <span className={variantClasses[variant]}>
      {children}
    </span>
  );
};

