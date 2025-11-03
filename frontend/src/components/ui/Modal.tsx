import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  if (!isOpen) return (
    <AnimatePresence />
  );

  const sizeClass =
    size === 'full'
      ? 'max-w-6xl w-[95vw] md:w-[90vw]'
      : size === 'xl'
      ? 'max-w-4xl w-full'
      : size === 'lg'
      ? 'max-w-2xl w-full'
      : 'max-w-md w-full';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/40 md:bg-black/30 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`relative glass-modal p-8 ${sizeClass} max-h-[90vh] overflow-hidden`}
          >
            <button
              aria-label="Cerrar"
              onClick={onClose}
              className="absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center text-foreground/60 hover:text-foreground hover:bg-white/10"
            >
              ×
            </button>
            <h3 className="text-2xl font-bold text-foreground mb-6 pr-10">{title}</h3>
            <div className={`mb-6 overflow-auto ${bodyClassName || ''}`} style={{ maxHeight: 'calc(90vh - 12rem)' }}>
              {children}
            </div>
            {footer && <div className="flex gap-3">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
