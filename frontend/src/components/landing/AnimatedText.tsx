'use client';

import { motion } from 'framer-motion';

interface AnimatedTextProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export default function AnimatedText({
  children,
  className = '',
  delay = 0,
  duration = 1,
}: AnimatedTextProps) {
  const text = String(children);
  const letters = text.split('');

  return (
    <div className={className}>
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          className="inline-block"
          initial={{ opacity: 0, y: 50, rotateX: -90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            delay: delay + index * 0.03,
            duration: duration,
            ease: [0.16, 1, 0.3, 1], // easeOutExpo
          }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </div>
  );
}

