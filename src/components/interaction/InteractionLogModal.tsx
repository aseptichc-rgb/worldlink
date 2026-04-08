'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Handshake, Phone, MessageCircle, Coffee, FileText, Check } from 'lucide-react';
import { useInteractionStore } from '@/store/interactionStore';
import { useAuthStore } from '@/store/authStore';
import { getDemoCompatibleId } from '@/lib/demo-data';
import { InteractionType } from '@/types';

interface InteractionLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetName: string;
}

const INTERACTION_OPTIONS: Array<{ type: InteractionType; icon: typeof Handshake; label: string; color: string }> = [
  { type: 'meeting', icon: Handshake, label: '만남', color: '#58A6FF' },
  { type: 'call', icon: Phone, label: '전화', color: '#3FB950' },
  { type: 'message', icon: MessageCircle, label: '메시지', color: '#D29922' },
  { type: 'research_meeting', icon: Coffee, label: '커피챗', color: '#FF6B8A' },
  { type: 'other', icon: FileText, label: '기타', color: '#A371F7' },
];

export default function InteractionLogModal({ isOpen, onClose, targetUserId, targetName }: InteractionLogModalProps) {
  const [selectedType, setSelectedType] = useState<InteractionType>('meeting');
  const [note, setNote] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [saved, setSaved] = useState(false);

  const { addInteraction } = useInteractionStore();
  const { user } = useAuthStore();

  const handleSave = () => {
    if (!user) return;
    const userId = getDemoCompatibleId(user);
    addInteraction(
      userId,
      targetUserId,
      selectedType,
      note || undefined,
      false,
      nextAction || undefined,
      new Date(date),
    );
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setNote('');
      setNextAction('');
      setSelectedType('meeting');
      setDate(new Date().toISOString().split('T')[0]);
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
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-[rgba(30,30,30,0.95)] backdrop-blur-xl rounded-[20px] border border-[rgba(240,246,252,0.1)] px-6 py-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-white">연락 기록하기</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#363636] transition-colors">
              <X size={18} className="text-[#8B949E]" />
            </button>
          </div>

          <p className="text-sm text-[#8B949E] mb-4">
            <span className="text-[#58A6FF] font-medium">{targetName}</span>님과의 연락을 기록합니다
          </p>

          {/* Type Selection */}
          <div className="flex gap-2 mb-5">
            {INTERACTION_OPTIONS.map(({ type, icon: Icon, label, color }) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
                  selectedType === type
                    ? 'border-opacity-60 bg-opacity-10'
                    : 'border-[#363636] bg-transparent hover:bg-[#252525]'
                }`}
                style={{
                  borderColor: selectedType === type ? color : undefined,
                  backgroundColor: selectedType === type ? color + '15' : undefined,
                }}
              >
                <Icon size={18} style={{ color: selectedType === type ? color : '#8B949E' }} />
                <span className="text-[10px] font-medium" style={{ color: selectedType === type ? color : '#8B949E' }}>
                  {label}
                </span>
              </button>
            ))}
          </div>

          {/* Date */}
          <div className="mb-4">
            <label className="text-xs text-[#8B949E] mb-1.5 block">날짜</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#121212] border border-[#363636] rounded-xl text-white text-sm focus:outline-none focus:border-[#58A6FF] [color-scheme:dark]"
            />
          </div>

          {/* Note */}
          <div className="mb-4">
            <label className="text-xs text-[#8B949E] mb-1.5 block">메모 (선택)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="어떤 이야기를 나누셨나요?"
              maxLength={200}
              className="w-full px-4 py-2.5 bg-[#121212] border border-[#363636] rounded-xl text-white text-sm placeholder-[#484F58] focus:outline-none focus:border-[#58A6FF] resize-none min-h-[60px]"
            />
            <p className="text-[10px] text-[#484F58] text-right mt-1">{note.length}/200</p>
          </div>

          {/* Next Action */}
          <div className="mb-5">
            <label className="text-xs text-[#8B949E] mb-1.5 block">다음 할 일 (선택)</label>
            <input
              type="text"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              placeholder="예: 자료 보내기, 미팅 잡기"
              maxLength={100}
              className="w-full px-4 py-2.5 bg-[#121212] border border-[#363636] rounded-xl text-white text-sm placeholder-[#484F58] focus:outline-none focus:border-[#58A6FF]"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saved}
            className={`w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${
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
