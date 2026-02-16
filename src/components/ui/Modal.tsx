'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: ModalProps) {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[rgba(0,0,0,0.3)] backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`
              relative w-full ${sizes[size]}
              bg-white
              border border-[#E2E8F0] rounded-2xl
              shadow-[0_20px_60px_rgba(0,0,0,0.1)] overflow-hidden
            `}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
                <h2 className="text-lg font-semibold text-[#1A1A2E]">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-1 text-[#94A3B8] hover:text-[#1A1A2E] transition-colors rounded-lg hover:bg-[#F1F3F5]"
                >
                  <X size={20} />
                </button>
              </div>
            )}
            <div className={title ? '' : 'pt-6'}>
              {!title && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1 text-[#94A3B8] hover:text-[#1A1A2E] transition-colors rounded-lg hover:bg-[#F1F3F5]"
                >
                  <X size={20} />
                </button>
              )}
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
