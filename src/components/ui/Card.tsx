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
        bg-white
        border border-[#E2E8F0] rounded-[16px]
        shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]
        transition-all duration-200
        ${hoverable ? 'hover:shadow-[0_4px_6px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.03)] hover:border-[#CBD5E1] cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
