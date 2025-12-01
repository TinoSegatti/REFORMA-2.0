'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AnimatedParticles() {
  const [particles, setParticles] = useState<Array<{
    id: number;
    size: number;
    x: number;
    y: number;
    color: string;
    opacity: number;
    animX: number[];
    animY: number[];
    animScale: number[];
    duration: number;
    delay: number;
  }>>([]);

  useEffect(() => {
    // Generar valores aleatorios solo en el cliente
    // Reducido de 50 a 30 partículas para mejor rendimiento
    const generatedParticles = Array.from({ length: 30 }, (_, i) => {
      const size = Math.random() * 4 + 2;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const color = Math.random() > 0.5 
        ? (Math.random() > 0.5 ? '157, 119, 244' : '244, 114, 182')
        : '6, 182, 212';
      const opacity = Math.random() * 0.5 + 0.2;
      const animX = [0, Math.random() * 100 - 50, 0];
      const animY = [0, Math.random() * 100 - 50, 0];
      const animScale = [
        Math.random() * 0.5 + 0.5, 
        Math.random() * 0.5 + 1, 
        Math.random() * 0.5 + 0.5
      ];
      const duration = Math.random() * 3 + 3;
      const delay = Math.random() * 2;

      return {
        id: i,
        size,
        x,
        y,
        color,
        opacity,
        animX,
        animY,
        animScale,
        duration,
        delay,
      };
    });
    setParticles(generatedParticles);
  }, []);

  if (particles.length === 0) {
    return null; // No renderizar hasta que los valores estén generados
  }

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          layout={false}
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: `rgba(${particle.color}, ${particle.opacity})`,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            willChange: 'transform, opacity',
            transform: 'translateZ(0)', // Acelera con GPU
          }}
          animate={{
            x: particle.animX,
            y: particle.animY,
            scale: particle.animScale,
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

