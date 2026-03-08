'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Building, StickyNote, Check } from 'lucide-react';
import { useInteractionStore } from '@/store/interactionStore';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickCaptureModal({ isOpen, onClose }: QuickCaptureModalProps) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [memo, setMemo] = useState('');
  const [saved, setSaved] = useState(false);

  const { addQuickCapture } = useInteractionStore();

  const handleSave = () => {
    if (!name.trim()) return;
    addQuickCapture(name.trim(), company.trim() || undefined, memo.trim() || undefined);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setName('');
      setCompany('');
      setMemo('');
      onClose();
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-[rgba(1,4,9,0.85)] backdrop-blur-sm flex items-center justify-center px-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-[rgba(30,30,30,0.95)] backdrop-blur-xl rounded-[20px] border border-[rgba(240,246,252,0.1)] px-6 py-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-white">빠른 기록</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#363636] transition-colors">
              <X size={18} className="text-[#8B949E]" />
            </button>
          </div>

          <p className="text-sm text-[#8B949E] mb-5">
            방금 만난 사람을 빠르게 기록하세요
          </p>

          {/* Name */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <User size={12} className="text-[#58A6FF]" />
              <label className="text-xs text-[#8B949E]">이름 *</label>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              className="w-full px-4 py-2.5 bg-[#121212] border border-[#363636] rounded-xl text-white text-sm placeholder-[#484F58] focus:outline-none focus:border-[#58A6FF]"
              autoFocus
            />
          </div>

          {/* Company */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Building size={12} className="text-[#8B949E]" />
              <label className="text-xs text-[#8B949E]">회사 (선택)</label>
            </div>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="회사명"
              className="w-full px-4 py-2.5 bg-[#121212] border border-[#363636] rounded-xl text-white text-sm placeholder-[#484F58] focus:outline-none focus:border-[#58A6FF]"
            />
          </div>

          {/* Memo */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1.5">
              <StickyNote size={12} className="text-[#8B949E]" />
              <label className="text-xs text-[#8B949E]">한줄 메모 (선택)</label>
            </div>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="예: AI 관련 협업 논의"
              maxLength={100}
              className="w-full px-4 py-2.5 bg-[#121212] border border-[#363636] rounded-xl text-white text-sm placeholder-[#484F58] focus:outline-none focus:border-[#58A6FF]"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!name.trim() || saved}
            className={`w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${
              saved
                ? 'bg-[#3FB950] text-white'
                : 'bg-[#58A6FF] text-[#0D1117] hover:bg-[#58A6FF]/90'
            }`}
          >
            {saved ? (
              <>
                <Check size={16} />
                저장 완료!
              </>
            ) : (
              '저장하기'
            )}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
