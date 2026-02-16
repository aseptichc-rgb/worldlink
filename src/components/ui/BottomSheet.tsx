'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: 'auto' | 'half' | 'full';
}

export default function BottomSheet({
  isOpen,
  onClose,
  children,
  height = 'auto',
}: BottomSheetProps) {
  const dragControls = useDragControls();

  const heights = {
    auto: 'max-h-[85vh]',
    half: 'h-[50vh]',
    full: 'h-[90vh]',
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
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-[rgba(1,4,9,0.75)] backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) {
                onClose();
              }
            }}
            className={`
              fixed bottom-0 left-0 right-0 z-50
              bg-[#161B22] border-t border-[rgba(240,246,252,0.1)]
              rounded-t-2xl overflow-hidden
              shadow-[0_-8px_32px_rgba(0,0,0,0.4)]
              ${heights[height]}
            `}
          >
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
            >
              <div className="w-10 h-1 rounded-full bg-[#30363D]" />
            </div>
            <div className="overflow-y-auto h-full pb-8 no-scrollbar">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
