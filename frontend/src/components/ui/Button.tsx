import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  children, 
  className = '',
  ...props 
}) => {
  const baseStyles = 'px-6 py-3 rounded-xl font-semibold transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-opacity-30';
  
  const variants = {
    primary: 'bg-gradient-to-r from-[#F5B8DA] to-[#E599C6] text-white shadow-lg shadow-pink-300/50 hover:shadow-xl hover:shadow-pink-400/60',
    secondary: 'bg-gradient-to-r from-[#FAD863] to-[#F8C540] text-gray-900 shadow-lg shadow-yellow-300/50 hover:shadow-xl hover:shadow-yellow-400/60',
    accent: 'bg-gradient-to-r from-[#9AAB64] to-[#7B8E54] text-white shadow-lg shadow-green-300/50 hover:shadow-xl hover:shadow-green-400/60',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-300/50 hover:shadow-xl hover:shadow-red-400/60',
    neutral: 'bg-gradient-to-r from-[#B6CAEB] to-[#9DB5D9] text-gray-900 shadow-lg shadow-blue-300/50 hover:shadow-xl hover:shadow-blue-400/60'
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
