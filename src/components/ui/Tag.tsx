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
        inline-flex items-center gap-1.5 rounded-lg font-medium
        transition-all duration-200 cursor-pointer whitespace-nowrap
        ${sizeStyles[size]}
        ${isActive
          ? 'bg-[#58A6FF]/10 text-[#58A6FF] border-none'
          : isHighlighted
            ? 'bg-[#7EE0FF]/10 text-[#7EE0FF] border-none hover:bg-[rgba(126,224,255,0.15)]'
            : 'bg-[#363636]/40 text-[#8B949E] border-none hover:text-[#58A6FF] hover:bg-[rgba(88,166,255,0.1)]'
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
          className="ml-1 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </motion.span>
  );
}