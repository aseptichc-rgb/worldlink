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
          ? 'bg-gradient-to-r from-[#1F6FEB] to-[#58A6FF] text-white border border-transparent'
          : isHighlighted
            ? 'bg-transparent text-[#7EE0FF] border border-[#7EE0FF] hover:bg-[rgba(126,224,255,0.08)]'
            : 'bg-transparent text-[#8B949E] border border-[#30363D] hover:border-[#58A6FF] hover:text-[#58A6FF] hover:bg-[rgba(88,166,255,0.05)]'
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