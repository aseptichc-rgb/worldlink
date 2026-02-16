'use client';

import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface TagProps {
  label: string;
  isActive?: boolean;
  isHighlighted?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export default function Tag({
  label,
  isActive = false,
  isHighlighted = false,
  onRemove,
  onClick,
  size = 'md',
}: TagProps) {
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
  };

  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        transition-all duration-200 cursor-pointer whitespace-nowrap
        ${sizeStyles[size]}
        ${isActive
          ? 'bg-[#EFF6FF] text-[#2563EB]'
          : isHighlighted
            ? 'bg-[#ECFDF5] text-[#10B981]'
            : 'bg-[#F1F3F5] text-[#64748B] hover:text-[#2563EB] hover:bg-[#EFF6FF]'
        }
      `}
    >
      <span>#</span>
      <span>{label}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:text-[#1A1A2E] transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </motion.span>
  );
}
