'use client';

import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  onClick?: () => void;
  hoverable?: boolean;
  className?: string;
}

export default function Card({
  children,
  onClick,
  hoverable = false,
  className = '',
}: CardProps) {
  return (
    <motion.div
      whileHover={hoverable ? { y: -4, borderColor: '#00E5FF' } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`
        bg-[#0D1117] border border-[#21262D] rounded-2xl
        transition-shadow duration-300
        ${hoverable ? 'hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
