'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Loader2, UserPlus, Check, Users } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useManagedGroupStore } from '@/store/managedGroupStore';
import { getUserConnectionsWithDetails } from '@/lib/firebase-services';
import { User } from '@/types';

export default function ManagedGroupAddMemberModal() {
  const { user } = useAuthStore();
  const {
    isAddMemberModalOpen,
    closeAddMemberModal,
    selectedGroup,
    addMembersFromConnections,
  } = useManagedGroupStore();

  const [connections, setConnections] = useState<User[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (isAddMemberModalOpen && user) {
      setIsLoadingConnections(true);
      setSelectedIds(new Set());
      setSearchQuery('');
      getUserConnectionsWithDetails(user.id)
        .then(setConnections)
        .catch(() => setConnections([]))
        .finally(() => setIsLoadingConnections(false));
    }
  }, [isAddMemberModalOpen, user]);

  const memberUserIds = useMemo(
    () => new Set(selectedGroup?.memberUserIds || []),
    [selectedGroup?.memberUserIds]
  );

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

  const availableCount = useMemo(
    () => connections.filter((c) => !memberUserIds.has(c.id)).length,
    [connections, memberUserIds]
  );

  const toggleSelect = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleAdd = async () => {
    if (!selectedGroup || selectedIds.size === 0) return;
    setIsAdding(true);
    try {
      await addMembersFromConnections(selectedGroup.id, Array.from(selectedIds));
    } finally {
      setIsAdding(false);
    }
  };

  if (!selectedGroup || !user) return null;

  return (
    <AnimatePresence>
      {isAddMemberModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-[rgba(1,4,9,0.85)] backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={closeAddMemberModal}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#1C2333] rounded-t-2xl sm:rounded-2xl border border-[#30363D] max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                  style={{ backgroundColor: selectedGroup.color + '20' }}
                >
                  {selectedGroup.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F0F6FC]">인맥에서 추가</h3>
                  <p className="text-xs text-[#8B949E]">{selectedGroup.name}</p>
                </div>
              </div>
              <button onClick={closeAddMemberModal} className="p-1.5 text-[#8B949E] hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 pb-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#484F58]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="이름, 회사, 직함으로 검색"
                  className="w-full pl-9 pr-4 py-2.5 bg-[#0D1117] border border-[#30363D] rounded-xl text-sm text-white placeholder-[#484F58] focus:outline-none focus:border-[#58A6FF]"
                />
              </div>
            </div>

            {/* Selected Count */}
            {selectedIds.size > 0 && (
              <div className="px-5 pb-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-[#58A6FF]/10 border border-[#58A6FF]/20 rounded-xl">
                  <Users size={14} className="text-[#58A6FF]" />
                  <span className="text-xs text-[#58A6FF] font-medium">
                    {selectedIds.size}명 선택됨
                  </span>
                </div>
              </div>
            )}

            {/* Connection List */}
            <div className="flex-1 overflow-y-auto px-5 pb-3 min-h-0">
              {isLoadingConnections ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-[#58A6FF]" />
                </div>
              ) : filteredConnections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users size={32} className="text-[#30363D] mb-3" />
                  <p className="text-sm text-[#8B949E]">
                    {connections.length === 0
                      ? '연결된 인맥이 없습니다'
                      : '검색 결과가 없습니다'}
                  </p>
                  {connections.length === 0 && (
                    <p className="text-xs text-[#484F58] mt-1">
                      먼저 인맥을 추가해보세요
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredConnections.map((conn) => {
                    const isMember = memberUserIds.has(conn.id);
                    const isSelected = selectedIds.has(conn.id);
                    const initials = conn.name?.charAt(0) || '?';

                    return (
                      <button
                        key={conn.id}
                        onClick={() => !isMember && toggleSelect(conn.id)}
                        disabled={isMember}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left ${
                          isMember
                            ? 'opacity-50 cursor-not-allowed'
                            : isSelected
                            ? 'bg-[#58A6FF]/10 border border-[#58A6FF]/30'
                            : 'hover:bg-[#161B22] border border-transparent'
                        }`}
                      >
                        {/* Avatar */}
                        {conn.profileImage ? (
                          <img
                            src={conn.profileImage}
                            alt={conn.name}
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 bg-[#58A6FF]">
                            {initials}
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#F0F6FC] font-medium truncate">{conn.name}</p>
                          <p className="text-xs text-[#8B949E] truncate">
                            {[conn.company, conn.position].filter(Boolean).join(' · ') || '정보 없음'}
                          </p>
                        </div>

                        {/* Status */}
                        {isMember ? (
                          <span className="shrink-0 text-[10px] text-[#484F58] px-2 py-1 bg-[#0D1117] rounded-full">
                            이미 멤버
                          </span>
                        ) : (
                          <div
                            className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-[#58A6FF] border-[#58A6FF]'
                                : 'border-[#30363D]'
                            }`}
                          >
                            {isSelected && <Check size={14} className="text-white" />}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-[#30363D]">
              {availableCount === 0 && connections.length > 0 ? (
                <p className="text-xs text-[#484F58] text-center">
                  모든 인맥이 이미 그룹 멤버입니다
                </p>
              ) : (
                <button
                  onClick={handleAdd}
                  disabled={selectedIds.size === 0 || isAdding}
                  className="w-full py-3 bg-[#58A6FF] text-[#0D1117] font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
                >
                  {isAdding ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <UserPlus size={18} />
                  )}
                  {isAdding
                    ? '추가 중...'
                    : selectedIds.size > 0
                    ? `${selectedIds.size}명 추가하기`
                    : '추가할 인맥을 선택하세요'}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
