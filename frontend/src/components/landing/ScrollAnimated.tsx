'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

interface ScrollAnimatedProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fade' | 'slide' | 'scale' | 'rotate' | 'blur';
  delay?: number;
  duration?: number;
}

export default function ScrollAnimated({
  children,
  className = '',
  animation = 'fade',
  delay = 0,
  duration = 1,
}: ScrollAnimatedProps) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const animations = {
    fade: {
      initial: { opacity: 0, y: 30 },
      animate: { opacity: 1, y: 0 },
    },
    slide: {
      initial: { opacity: 0, x: -100 },
      animate: { opacity: 1, x: 0 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
    },
    rotate: {
      initial: { opacity: 0, rotate: -180, scale: 0.5 },
      animate: { opacity: 1, rotate: 0, scale: 1 },
    },
    blur: {
      initial: { opacity: 0, filter: 'blur(10px)', y: 20 },
      animate: { opacity: 1, filter: 'blur(0px)', y: 0 },
    },
  };

  const anim = animations[animation];

  return (
    <motion.div
      ref={ref}
      initial={anim.initial}
      animate={inView ? anim.animate : anim.initial}
      transition={{
        duration: duration,
        delay: delay / 1000, // Convertir ms a segundos
        ease: [0.16, 1, 0.3, 1], // easeOutExpo
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

