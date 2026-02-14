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
      whileHover={hoverable ? { y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`
        bg-[rgba(22,27,34,0.7)] backdrop-blur-[10px]
        border border-[rgba(240,246,252,0.1)] rounded-2xl
        shadow-[0_8px_32px_rgba(0,0,0,0.2)]
        transition-all duration-300
        ${hoverable ? 'hover:shadow-[0_16px_48px_rgba(0,0,0,0.3)] hover:border-[rgba(240,246,252,0.2)] cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}