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
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3.5 py-1.5 text-sm',
  };

  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        transition-all duration-200 cursor-pointer
        ${sizeStyles[size]}
        ${isActive
          ? 'bg-gradient-to-r from-[#00E5FF] to-[#7C4DFF] text-black border-transparent'
          : isHighlighted
            ? 'bg-[rgba(0,229,255,0.25)] text-[#00E5FF] border border-[#00E5FF]'
            : 'bg-[#161B22] text-[#8B949E] border border-[#21262D] hover:bg-[#21262D] hover:text-white'
        }
      `}
    >
      <span>#</span>
      {label}
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
