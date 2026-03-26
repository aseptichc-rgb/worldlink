'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  mobileStyle?: 'center' | 'bottom'; // 모바일에서 중앙 또는 하단 시트
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  mobileStyle = 'bottom', // 기본값: 모바일에서 하단 시트
}: ModalProps) {
  const [isMobile, setIsMobile] = useState(false);

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'max-w-full',
  };

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // 스와이프 다운으로 닫기 (모바일 하단 시트)
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  const showAsBottomSheet = isMobile && mobileStyle === 'bottom';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 z-50 ${showAsBottomSheet ? 'flex items-end' : 'flex items-center justify-center p-4'}`}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[rgba(1,4,9,0.85)] backdrop-blur-sm"
          />

          {showAsBottomSheet ? (
            // 모바일 하단 시트 스타일
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="relative w-full bg-[#161B22] rounded-t-[20px] border-t border-x border-[rgba(240,246,252,0.1)] shadow-[0_-16px_48px_rgba(0,0,0,0.4)] max-h-[90vh] overflow-hidden"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
            >
              {/* 스와이프 핸들 */}
              <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
                <div className="w-10 h-1 bg-[#484F58] rounded-full" />
              </div>

              {title && (
                <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(240,246,252,0.1)]">
                  <h2 className="text-lg font-semibold text-[#F0F6FC]">{title}</h2>
                  <button
                    onClick={onClose}
                    className="p-2 text-[#8B949E] hover:text-[#F0F6FC] transition-colors rounded-lg hover:bg-[rgba(240,246,252,0.05)] touch-target"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
              <div className={`overflow-y-auto max-h-[calc(90vh-80px)] ${title ? '' : 'pt-2'}`}>
                {!title && (
                  <button
                    onClick={onClose}
                    className="absolute top-3 right-4 p-2 text-[#8B949E] hover:text-[#F0F6FC] transition-colors rounded-lg hover:bg-[rgba(240,246,252,0.05)] touch-target z-10"
                  >
                    <X size={20} />
                  </button>
                )}
                {children}
              </div>
            </motion.div>
          ) : (
            // 데스크탑 / 모바일 중앙 스타일
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`
                relative w-full ${sizes[size]}
                bg-[rgba(22,27,34,0.95)] backdrop-blur-xl
                border border-[rgba(240,246,252,0.1)] rounded-xl
                shadow-[0_16px_48px_rgba(0,0,0,0.4)] overflow-hidden
                ${isMobile ? 'mx-4 max-h-[85vh] overflow-y-auto' : ''}
              `}
            >
              {title && (
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[rgba(240,246,252,0.1)]">
                  <h2 className="text-lg font-semibold text-[#F0F6FC]">{title}</h2>
                  <button
                    onClick={onClose}
                    className="p-2 text-[#8B949E] hover:text-[#F0F6FC] transition-colors rounded-lg hover:bg-[rgba(240,246,252,0.05)] touch-target"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
              <div className={title ? '' : 'pt-6'}>
                {!title && (
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-[#8B949E] hover:text-[#F0F6FC] transition-colors rounded-lg hover:bg-[rgba(240,246,252,0.05)] touch-target"
                  >
                    <X size={20} />
                  </button>
                )}
                {children}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
