import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '',
  hover = true
}) => {
  return (
    <div className={`modern-card p-6 ${hover ? 'hover:scale-[1.01]' : ''} transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
};
