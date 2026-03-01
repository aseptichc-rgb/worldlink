'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Search, Check, Users, ChevronDown, ChevronUp, UserPlus } from 'lucide-react';
import { GROUP_COLORS, GROUP_ICONS } from '@/store/groupStore';
import { useAuthStore } from '@/store/authStore';
import { useManagedGroupStore } from '@/store/managedGroupStore';
import { getUserConnectionsWithDetails } from '@/lib/firebase-services';
import { User } from '@/types';

export default function ManagedGroupCreateModal() {
  const { user } = useAuthStore();
  const { isCreateModalOpen, closeCreateModal, createGroup, addMembersFromConnections, isLoading, error, clearError } = useManagedGroupStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(GROUP_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(GROUP_ICONS[0]);
  const [autoConnect, setAutoConnect] = useState(true);
  const [allowMemberInvite, setAllowMemberInvite] = useState(false);
  const [localError, setLocalError] = useState('');

  // 인맥 선택 관련 상태
  const [connections, setConnections] = useState<User[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [isMemberSectionOpen, setIsMemberSectionOpen] = useState(false);

  // 인맥 목록 불러오기
  useEffect(() => {
    if (isCreateModalOpen && user) {
      setIsLoadingConnections(true);
      getUserConnectionsWithDetails(user.id)
        .then(setConnections)
        .catch(() => setConnections([]))
        .finally(() => setIsLoadingConnections(false));
    }
  }, [isCreateModalOpen, user]);

  // 검색 필터링
  const filteredConnections = useMemo(() => {
    if (!searchQuery.trim()) return connections;
    const q = searchQuery.toLowerCase();
    return connections.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.position?.toLowerCase().includes(q)
    );
  }, [connections, searchQuery]);

  const toggleMemberSelect = (userId: string) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setSelectedColor(GROUP_COLORS[0]);
    setSelectedIcon(GROUP_ICONS[0]);
    setAutoConnect(true);
    setAllowMemberInvite(false);
    setLocalError('');
    setSelectedMemberIds(new Set());
    setSearchQuery('');
    setIsMemberSectionOpen(false);
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
      const group = await createGroup(user.id, {
        name: name.trim(),
        description: description.trim() || '',
        color: selectedColor,
        icon: selectedIcon,
        settings: { autoConnect, allowMemberInvite },
      });

      // 선택한 인맥들을 그룹 멤버로 추가
      if (selectedMemberIds.size > 0) {
        await addMembersFromConnections(group.id, Array.from(selectedMemberIds));
      }

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
              <h3 className="text-lg font-bold text-[#F0F6FC]">나의 모임 만들기</h3>
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
            <div className="space-y-5">
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

              {/* Divider */}
              <div className="border-t border-[#30363D]/50" />

              {/* Color Picker */}
              <div>
                <label className="block text-sm text-[#8B949E] mb-3">색상</label>
                <div className="flex flex-wrap gap-3">
                  {GROUP_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-9 h-9 rounded-full transition-all ${
                        selectedColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1C2333] scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-sm text-[#8B949E] mb-3">아이콘</label>
                <div className="flex flex-wrap gap-2.5">
                  {GROUP_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setSelectedIcon(icon)}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all ${
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

              {/* Divider */}
              <div className="border-t border-[#30363D]/50" />

              {/* Settings */}
              <div className="space-y-3">
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

              {/* Divider */}
              <div className="border-t border-[#30363D]/50" />

              {/* 인맥에서 멤버 초대 */}
              <div>
                <button
                  type="button"
                  onClick={() => setIsMemberSectionOpen(!isMemberSectionOpen)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <UserPlus size={16} className="text-[#58A6FF]" />
                    <div>
                      <p className="text-sm text-[#F0F6FC]">인맥에서 멤버 초대</p>
                      <p className="text-xs text-[#484F58]">
                        {selectedMemberIds.size > 0
                          ? `${selectedMemberIds.size}명 선택됨`
                          : '나의 인맥 중에서 선택 (선택사항)'}
                      </p>
                    </div>
                  </div>
                  {isMemberSectionOpen ? (
                    <ChevronUp size={18} className="text-[#8B949E]" />
                  ) : (
                    <ChevronDown size={18} className="text-[#8B949E]" />
                  )}
                </button>

                {/* 선택된 멤버 미리보기 (접혀있을 때) */}
                {!isMemberSectionOpen && selectedMemberIds.size > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {connections
                      .filter((c) => selectedMemberIds.has(c.id))
                      .slice(0, 5)
                      .map((conn) => (
                        <div
                          key={conn.id}
                          className="flex items-center gap-1.5 px-2 py-1 bg-[#58A6FF]/10 border border-[#58A6FF]/30 rounded-full"
                        >
                          {conn.profileImage ? (
                            <img
                              src={conn.profileImage}
                              alt={conn.name}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-[10px] bg-[#58A6FF]">
                              {conn.name?.charAt(0) || '?'}
                            </div>
                          )}
                          <span className="text-xs text-[#F0F6FC]">{conn.name}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMemberSelect(conn.id);
                            }}
                            className="text-[#8B949E] hover:text-white"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    {selectedMemberIds.size > 5 && (
                      <div className="px-2 py-1 bg-[#0D1117] border border-[#30363D] rounded-full">
                        <span className="text-xs text-[#8B949E]">+{selectedMemberIds.size - 5}명</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 인맥 선택 UI (펼쳐졌을 때) */}
                <AnimatePresence>
                  {isMemberSectionOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-3">
                        {/* 검색 */}
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#484F58]" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="이름, 회사, 직함으로 검색"
                            className="w-full pl-8 pr-4 py-2 bg-[#0D1117] border border-[#30363D] rounded-xl text-xs text-white placeholder-[#484F58] focus:outline-none focus:border-[#58A6FF]"
                          />
                        </div>

                        {/* 선택된 인원 수 */}
                        {selectedMemberIds.size > 0 && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-[#58A6FF]/10 border border-[#58A6FF]/20 rounded-xl">
                            <Users size={12} className="text-[#58A6FF]" />
                            <span className="text-xs text-[#58A6FF] font-medium">
                              {selectedMemberIds.size}명 선택됨
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedMemberIds(new Set())}
                              className="ml-auto text-xs text-[#8B949E] hover:text-white"
                            >
                              전체 해제
                            </button>
                          </div>
                        )}

                        {/* 인맥 목록 */}
                        <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl border border-[#30363D] bg-[#0D1117] p-2">
                          {isLoadingConnections ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 size={20} className="animate-spin text-[#58A6FF]" />
                            </div>
                          ) : filteredConnections.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                              <Users size={24} className="text-[#30363D] mb-2" />
                              <p className="text-xs text-[#8B949E]">
                                {connections.length === 0
                                  ? '연결된 인맥이 없습니다'
                                  : '검색 결과가 없습니다'}
                              </p>
                            </div>
                          ) : (
                            filteredConnections.map((conn) => {
                              const isSelected = selectedMemberIds.has(conn.id);
                              const initials = conn.name?.charAt(0) || '?';

                              return (
                                <button
                                  type="button"
                                  key={conn.id}
                                  onClick={() => toggleMemberSelect(conn.id)}
                                  className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors text-left ${
                                    isSelected
                                      ? 'bg-[#58A6FF]/10'
                                      : 'hover:bg-[#161B22]'
                                  }`}
                                >
                                  {/* Avatar */}
                                  {conn.profileImage ? (
                                    <img
                                      src={conn.profileImage}
                                      alt={conn.name}
                                      className="w-8 h-8 rounded-full object-cover shrink-0"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 bg-[#58A6FF]">
                                      {initials}
                                    </div>
                                  )}

                                  {/* Info */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-[#F0F6FC] font-medium truncate">{conn.name}</p>
                                    <p className="text-[10px] text-[#8B949E] truncate">
                                      {[conn.company, conn.position].filter(Boolean).join(' · ') || '정보 없음'}
                                    </p>
                                  </div>

                                  {/* Checkbox */}
                                  <div
                                    className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                      isSelected
                                        ? 'bg-[#58A6FF] border-[#58A6FF]'
                                        : 'border-[#30363D]'
                                    }`}
                                  >
                                    {isSelected && <Check size={12} className="text-white" />}
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                {selectedMemberIds.size > 0 ? `${selectedMemberIds.size}명과 함께 만들기` : '만들기'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
