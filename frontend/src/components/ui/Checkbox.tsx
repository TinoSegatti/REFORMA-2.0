import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  className = '',
  ...props
}) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        className={`appearance-none w-5 h-5 rounded-md glass-surface border border-white/20 checked:bg-primary checked:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition ${className}`}
        {...props}
      />
      <span className="text-sm text-foreground">{label}</span>
    </label>
  );
};

