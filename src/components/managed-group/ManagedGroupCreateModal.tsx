'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { GROUP_COLORS, GROUP_ICONS } from '@/store/groupStore';
import { useAuthStore } from '@/store/authStore';
import { useManagedGroupStore } from '@/store/managedGroupStore';

export default function ManagedGroupCreateModal() {
  const { user } = useAuthStore();
  const { isCreateModalOpen, closeCreateModal, createGroup, isLoading, error, clearError } = useManagedGroupStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(GROUP_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(GROUP_ICONS[0]);
  const [autoConnect, setAutoConnect] = useState(true);
  const [allowMemberInvite, setAllowMemberInvite] = useState(false);
  const [localError, setLocalError] = useState('');

  const resetForm = () => {
    setName('');
    setDescription('');
    setSelectedColor(GROUP_COLORS[0]);
    setSelectedIcon(GROUP_ICONS[0]);
    setAutoConnect(true);
    setAllowMemberInvite(false);
    setLocalError('');
    clearError();
  };

  const handleClose = () => {
    resetForm();
    closeCreateModal();
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    if (!user) {
      setLocalError('로그인이 필요합니다');
      return;
    }
    setLocalError('');
    try {
      await createGroup(user.id, {
        name: name.trim(),
        description: description.trim() || '',
        color: selectedColor,
        icon: selectedIcon,
        settings: { autoConnect, allowMemberInvite },
      });
      resetForm();
    } catch (err) {
      setLocalError((err as Error).message || '그룹 생성에 실패했습니다');
    }
  };

  return (
    <AnimatePresence>
      {isCreateModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-[rgba(1,4,9,0.85)] backdrop-blur-sm flex items-center justify-center px-6"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#1C2333] rounded-2xl border border-[#30363D] p-6 max-h-[85vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#F0F6FC]">관리형 그룹 만들기</h3>
              <button onClick={handleClose} className="p-1.5 text-[#8B949E] hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3 mb-6 p-3 bg-[#0D1117] rounded-xl">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: selectedColor + '20' }}
              >
                {selectedIcon}
              </div>
              <div>
                <p className="text-[#F0F6FC] font-medium">{name || '그룹 이름'}</p>
                <p className="text-xs text-[#8B949E]">{description || '설명 없음'}</p>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm text-[#8B949E] mb-1.5">그룹 이름 *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 30))}
                  placeholder="예: 스타트업 네트워킹"
                  className="w-full px-4 py-3 bg-[#0D1117] border border-[#30363D] rounded-xl text-white placeholder-[#484F58] focus:outline-none focus:border-[#58A6FF] text-sm"
                />
                <p className="text-xs text-[#484F58] mt-1 text-right">{name.length}/30</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-[#8B949E] mb-1.5">설명 (선택)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                  placeholder="그룹에 대한 간단한 설명"
                  rows={2}
                  className="w-full px-4 py-3 bg-[#0D1117] border border-[#30363D] rounded-xl text-white placeholder-[#484F58] focus:outline-none focus:border-[#58A6FF] text-sm resize-none"
                />
                <p className="text-xs text-[#484F58] mt-1 text-right">{description.length}/200</p>
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm text-[#8B949E] mb-2">색상</label>
                <div className="flex flex-wrap gap-2">
                  {GROUP_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full transition-all ${
                        selectedColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1C2333] scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-sm text-[#8B949E] mb-2">아이콘</label>
                <div className="flex flex-wrap gap-2">
                  {GROUP_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setSelectedIcon(icon)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                        selectedIcon === icon
                          ? 'bg-[#58A6FF]/20 ring-2 ring-[#58A6FF]'
                          : 'bg-[#0D1117] hover:bg-[#161B22]'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-3 pt-2">
                <label className="block text-sm text-[#8B949E] mb-1">설정</label>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-sm text-[#F0F6FC]">자동 인맥 연결</p>
                    <p className="text-xs text-[#484F58]">새 멤버가 기존 멤버와 자동 연결</p>
                  </div>
                  <div
                    onClick={() => setAutoConnect(!autoConnect)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      autoConnect ? 'bg-[#58A6FF]' : 'bg-[#30363D]'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        autoConnect ? 'translate-x-[22px]' : 'translate-x-0.5'
                      }`}
                    />
                  </div>
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-sm text-[#F0F6FC]">멤버 초대 허용</p>
                    <p className="text-xs text-[#484F58]">일반 멤버도 초대 링크 생성 가능</p>
                  </div>
                  <div
                    onClick={() => setAllowMemberInvite(!allowMemberInvite)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      allowMemberInvite ? 'bg-[#58A6FF]' : 'bg-[#30363D]'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        allowMemberInvite ? 'translate-x-[22px]' : 'translate-x-0.5'
                      }`}
                    />
                  </div>
                </label>
              </div>
            </div>

            {/* Error */}
            {(localError || error) && (
              <div className="mt-4 p-3 bg-[#F85149]/10 border border-[#F85149]/20 rounded-xl">
                <p className="text-xs text-[#F85149]">{localError || error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleClose}
                className="flex-1 py-3 bg-[#0D1117] text-[#8B949E] font-medium rounded-xl border border-[#30363D]"
              >
                취소
              </button>
              <button
                onClick={handleCreate}
                disabled={!name.trim() || isLoading}
                className="flex-1 py-3 bg-[#58A6FF] text-[#0D1117] font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
                만들기
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
