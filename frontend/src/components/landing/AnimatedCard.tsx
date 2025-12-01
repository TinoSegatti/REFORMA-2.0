'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  tilt?: boolean;
  delay?: number;
  variant?: 'fade' | 'slide' | 'scale';
}

export default function AnimatedCard({
  children,
  className = '',
  tilt = true,
  delay = 0,
  variant = 'fade',
}: AnimatedCardProps) {
  const variants = {
    fade: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    },
    slide: {
      hidden: { opacity: 0, x: -50 },
      visible: { opacity: 1, x: 0 },
    },
    scale: {
      hidden: { opacity: 0, scale: 0.9 },
      visible: { opacity: 1, scale: 1 },
    },
  };

  const cardContent = (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5, delay }}
      variants={variants[variant]}
      className={className}
    >
      {children}
    </motion.div>
  );

  if (tilt) {
    return (
      <Tilt
        tiltMaxAngleX={5}
        tiltMaxAngleY={5}
        perspective={1000}
        transitionSpeed={1000}
        scale={1.02}
        className="h-full"
      >
        {cardContent}
      </Tilt>
    );
  }

  return cardContent;
}

