'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AnimatedBackground() {
  const [shapes, setShapes] = useState<Array<{
    id: number;
    size: number;
    isCircle: boolean;
    x: number;
    y: number;
    color: string;
    borderColor: string;
    animX: number[];
    animY: number[];
    animRotate: number[];
    animScale: number[];
    duration: number;
    delay: number;
  }>>([]);

  useEffect(() => {
    // Generar valores aleatorios solo en el cliente
    // Reducido de 8 a 5 formas para mejor rendimiento
    const generatedShapes = Array.from({ length: 5 }, (_, i) => {
      const size = Math.random() * 200 + 100;
      const isCircle = Math.random() > 0.5;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const animX = [0, Math.random() * 200 - 100, 0];
      const animY = [0, Math.random() * 200 - 100, 0];
      const animRotate = [0, Math.random() * 360];
      const animScale = [1, Math.random() * 0.6 + 1.2, 1];
      const duration = Math.random() * 4 + 8;
      const delay = Math.random() * 3;

      return {
        id: i,
        size,
        isCircle,
        x,
        y,
        color: i % 3 === 0 ? 'rgba(157, 119, 244, 0.1)' : 
               i % 3 === 1 ? 'rgba(244, 114, 182, 0.1)' : 
               'rgba(6, 182, 212, 0.1)',
        borderColor: i % 3 === 0 ? 'rgba(157, 119, 244, 0.2)' : 
                     i % 3 === 1 ? 'rgba(244, 114, 182, 0.2)' : 
                     'rgba(6, 182, 212, 0.2)',
        animX,
        animY,
        animRotate,
        animScale,
        duration,
        delay,
      };
    });
    setShapes(generatedShapes);
  }, []);

  if (shapes.length === 0) {
    return null; // No renderizar hasta que los valores estén generados
  }

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {shapes.map((shape) => (
        <motion.div
          key={shape.id}
          className="absolute"
          layout={false}
          style={{
            width: `${shape.size}px`,
            height: `${shape.size}px`,
            borderRadius: shape.isCircle ? '50%' : '20%',
            background: `linear-gradient(135deg, ${shape.color}, transparent)`,
            border: `1px solid ${shape.borderColor}`,
            filter: 'blur(40px)',
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            willChange: 'transform, opacity',
            transform: 'translateZ(0)', // Acelera con GPU
          }}
          animate={{
            x: shape.animX,
            y: shape.animY,
            rotate: shape.animRotate,
            scale: shape.animScale,
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: shape.duration,
            delay: shape.delay,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

