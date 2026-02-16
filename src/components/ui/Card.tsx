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
        bg-[#1E1E1E] backdrop-blur-[10px]
        border border-[rgba(240,246,252,0.08)] rounded-[10px]
        shadow-[0_4px_24px_rgba(0,0,0,0.2)]
        transition-all duration-300
        ${hoverable ? 'hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:border-[rgba(240,246,252,0.15)] cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}