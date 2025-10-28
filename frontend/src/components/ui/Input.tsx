import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block mb-2 text-foreground font-medium">
          {label}
        </label>
      )}
      <input
        className={`retro-input w-full ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-destructive text-sm">{error}</p>
      )}
    </div>
  );
};

