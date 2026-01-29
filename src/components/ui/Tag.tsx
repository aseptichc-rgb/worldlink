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
        transition-all duration-200 cursor-pointer max-w-full
        ${sizeStyles[size]}
        ${isActive
          ? 'bg-gradient-to-r from-[#2C529C] to-[#86C9F2] text-white border-transparent'
          : isHighlighted
            ? 'bg-[rgba(134,201,242,0.25)] text-[#86C9F2] border border-[#86C9F2]'
            : 'bg-[#162A4A] text-[#8BA4C4] border border-[#1E3A5F] hover:bg-[#1E3A5F] hover:text-white'
        }
      `}
    >
      <span className="flex-shrink-0">#</span>
      <span className="truncate">{label}</span>
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
