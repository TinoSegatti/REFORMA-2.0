import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg' | 'xl' | 'full';
  bodyClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, size = 'md', bodyClassName }) => {
  if (!isOpen) return null;

  const sizeClass =
    size === 'full'
      ? 'max-w-6xl w-[95vw] md:w-[90vw]'
      : size === 'xl'
      ? 'max-w-4xl w-full'
      : size === 'lg'
      ? 'max-w-2xl w-full'
      : 'max-w-md w-full';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`relative bg-white rounded-2xl p-8 shadow-xl ${sizeClass} max-h-[90vh] overflow-hidden`}>
        <button
          aria-label="Cerrar"
          onClick={onClose}
          className="absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        >
          ×
        </button>
        <h3 className="text-2xl font-bold text-gray-900 mb-6 pr-10">{title}</h3>
        <div className={`mb-6 overflow-auto ${bodyClassName || ''}`} style={{ maxHeight: 'calc(90vh - 12rem)' }}>
          {children}
        </div>
        {footer && <div className="flex gap-3">{footer}</div>}
      </div>
    </div>
  );
};
