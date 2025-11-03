import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'error' | 'warning';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default'
}) => {
  const base = 'px-2.5 py-1 rounded-full text-xs font-medium glass-surface border border-white/20 backdrop-blur-md';
  const variantClasses = {
    default: `${base} text-foreground/90`,
    primary: `${base} bg-primary/30 text-foreground`,
    success: `${base} bg-green-500/30 text-foreground`,
    error: `${base} bg-red-500/30 text-foreground`,
    warning: `${base} bg-yellow-400/30 text-foreground`
  };

  return (
    <span className={variantClasses[variant]}>
      {children}
    </span>
  );
};

