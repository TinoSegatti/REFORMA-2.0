import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  header?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  header
}) => {
  return (
    <div className={`retro-card ${className}`}>
      {header && <div className="retro-header">{header}</div>}
      <div className="p-6">{children}</div>
    </div>
  );
};

