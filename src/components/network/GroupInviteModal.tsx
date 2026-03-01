'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Users, Link2, Share2, QrCode, UserPlus, Search, Loader2 } from 'lucide-react';
import { useGroupStore } from '@/store/groupStore';
import { useNetworkStore } from '@/store/networkStore';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/ui';
import { getUserConnectionsWithDetails } from '@/lib/firebase-services';
import { User } from '@/types';

export default function GroupInviteModal() {
  const {
    groups,
    isGroupInviteModalOpen,
    inviteGroupId,
    closeGroupInviteModal,
    getNodesInGroup,
    addNodesToGroup,
  } = useGroupStore();

  const { nodes } = useNetworkStore();
  const { user } = useAuthStore();

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'connections' | 'link' | 'members'>('connections');

  // 인맥 초대 관련 상태
  const [connections, setConnections] = useState<User[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const group = groups.find((g) => g.id === inviteGroupId);
  const memberNodeIds = inviteGroupId ? getNodesInGroup(inviteGroupId) : [];
  const memberNodes = nodes.filter((n) => memberNodeIds.includes(n.id));

  // 이미 그룹에 있는 멤버 ID Set
  const memberUserIds = useMemo(() => new Set(memberNodeIds), [memberNodeIds]);

  // 인맥 목록 불러오기
  useEffect(() => {
    if (isGroupInviteModalOpen && user) {
      setIsLoadingConnections(true);
      setSelectedIds(new Set());
      setSearchQuery('');
      getUserConnectionsWithDetails(user.id)
        .then(setConnections)
        .catch(() => setConnections([]))
        .finally(() => setIsLoadingConnections(false));
    }
  }, [isGroupInviteModalOpen, user]);

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

  // 추가 가능한 인원 수
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

  const handleAddMembers = async () => {
    if (!inviteGroupId || selectedIds.size === 0) return;
    setIsAdding(true);
    try {
      addNodesToGroup(Array.from(selectedIds), inviteGroupId);
      setSelectedIds(new Set());
    } finally {
      setIsAdding(false);
    }
  };

  // 그룹 초대 링크 생성 (실제로는 서버에서 생성해야 함)
  const inviteLink = useMemo(() => {
    if (!group || !user) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/invite/group/${group.id}?from=${user.id}`;
  }, [group, user]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${group?.name} 모임 초대`,
          text: `${user?.name}님이 "${group?.name}" 모임에 초대합니다. 모임에 들어오면 ${memberNodes.length}명의 인맥과 자동으로 연결됩니다!`,
          url: inviteLink,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleClose = () => {
    setCopied(false);
    setActiveTab('connections');
    setSelectedIds(new Set());
    setSearchQuery('');
    closeGroupInviteModal();
  };

  return (
    <AnimatePresence>
      {isGroupInviteModalOpen && group && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-[rgba(1,4,9,0.85)] backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-[rgba(22,27,34,0.98)] backdrop-blur-xl border border-[rgba(240,246,252,0.1)] rounded-t-2xl sm:rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.4)] max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(240,246,252,0.1)]">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ backgroundColor: group.color + '20' }}
                >
                  {group.icon}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#F0F6FC]">모임 초대</h2>
                  <p className="text-xs text-[#8B949E]">{group.name}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1 text-[#8B949E] hover:text-[#F0F6FC] transition-colors rounded-lg hover:bg-[rgba(240,246,252,0.05)]"
              >
                <X size={20} />
              </button>
            </div>

            {/* Info Banner */}
            <div className="px-5 py-3 bg-[#58A6FF]/10 border-b border-[#58A6FF]/20">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#58A6FF]/20 flex items-center justify-center flex-shrink-0">
                  <UserPlus size={14} className="text-[#58A6FF]" />
                </div>
                <div>
                  <p className="text-sm text-[#58A6FF] font-medium">자동 인맥 연결</p>
                  <p className="text-xs text-[#8B949E] mt-0.5">
                    이 모임에 들어오면 <span className="text-white font-medium">{memberNodes.length}명</span>의 멤버와 자동으로 서로 인맥이 됩니다
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex px-5 pt-3 gap-1">
              <button
                onClick={() => setActiveTab('connections')}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'connections'
                    ? 'bg-[#58A6FF]/20 text-[#58A6FF]'
                    : 'text-[#8B949E] hover:bg-[#1C2333]'
                }`}
              >
                <UserPlus size={12} className="inline mr-1" />
                인맥에서 초대
              </button>
              <button
                onClick={() => setActiveTab('link')}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'link'
                    ? 'bg-[#58A6FF]/20 text-[#58A6FF]'
                    : 'text-[#8B949E] hover:bg-[#1C2333]'
                }`}
              >
                <Link2 size={12} className="inline mr-1" />
                초대 링크
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'members'
                    ? 'bg-[#58A6FF]/20 text-[#58A6FF]'
                    : 'text-[#8B949E] hover:bg-[#1C2333]'
                }`}
              >
                <Users size={12} className="inline mr-1" />
                멤버 ({memberNodes.length})
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {activeTab === 'connections' ? (
                /* 인맥에서 초대 탭 */
                <>
                  {/* Search */}
                  <div className="px-5 py-3">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#484F58]" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="이름, 회사, 직함으로 검색"
                        className="w-full pl-9 pr-4 py-2 bg-[#0D1117] border border-[#30363D] rounded-xl text-sm text-white placeholder-[#484F58] focus:outline-none focus:border-[#58A6FF]"
                      />
                    </div>
                  </div>

                  {/* Selected Count */}
                  {selectedIds.size > 0 && (
                    <div className="px-5 pb-2">
                      <div className="flex items-center gap-2 px-3 py-2 bg-[#58A6FF]/10 border border-[#58A6FF]/20 rounded-xl">
                        <Users size={12} className="text-[#58A6FF]" />
                        <span className="text-xs text-[#58A6FF] font-medium">
                          {selectedIds.size}명 선택됨
                        </span>
                        <button
                          onClick={() => setSelectedIds(new Set())}
                          className="ml-auto text-xs text-[#8B949E] hover:text-white"
                        >
                          전체 해제
                        </button>
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
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${
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
                                  className="w-9 h-9 rounded-full object-cover shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 bg-[#58A6FF]">
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
                                  className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                    isSelected
                                      ? 'bg-[#58A6FF] border-[#58A6FF]'
                                      : 'border-[#30363D]'
                                  }`}
                                >
                                  {isSelected && <Check size={12} className="text-white" />}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Add Button */}
                  <div className="px-5 py-4 border-t border-[rgba(240,246,252,0.1)]">
                    {availableCount === 0 && connections.length > 0 ? (
                      <p className="text-xs text-[#484F58] text-center">
                        모든 인맥이 이미 모임 멤버입니다
                      </p>
                    ) : (
                      <button
                        onClick={handleAddMembers}
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
                </>
              ) : activeTab === 'link' ? (
                <div className="px-5 py-4 space-y-4">
                  {/* Invite Link */}
                  <div className="bg-[#0D1117] border border-[#30363D] rounded-xl p-4">
                    <p className="text-xs text-[#484F58] mb-2">초대 링크</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={inviteLink}
                        readOnly
                        className="flex-1 bg-transparent text-sm text-white truncate focus:outline-none"
                      />
                      <button
                        onClick={handleCopyLink}
                        className={`p-2 rounded-lg transition-all ${
                          copied
                            ? 'bg-[#3FB950]/20 text-[#3FB950]'
                            : 'bg-[#30363D] text-[#8B949E] hover:text-white'
                        }`}
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Share Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1C2333] hover:bg-[#30363D] text-white text-sm font-medium transition-colors"
                    >
                      <Copy size={16} />
                      링크 복사
                    </button>
                    <button
                      onClick={handleShare}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#58A6FF] hover:bg-[#58A6FF]/80 text-white text-sm font-medium transition-colors"
                    >
                      <Share2 size={16} />
                      공유하기
                    </button>
                  </div>

                  {/* QR Code placeholder */}
                  <div className="text-center pt-2">
                    <button className="inline-flex items-center gap-2 text-sm text-[#8B949E] hover:text-[#58A6FF] transition-colors">
                      <QrCode size={14} />
                      QR 코드로 공유
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-5 py-4 space-y-2 flex-1 overflow-y-auto">
                  {memberNodes.length === 0 ? (
                    <div className="text-center py-8">
                      <Users size={32} className="text-[#484F58] mx-auto mb-3" />
                      <p className="text-[#8B949E]">아직 멤버가 없습니다</p>
                    </div>
                  ) : (
                    memberNodes.map((node) => (
                      <div
                        key={node.id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#1C2333]/50"
                      >
                        <Avatar src={node.profileImage} name={node.name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{node.name}</p>
                          <p className="text-xs text-[#8B949E] truncate">
                            {node.company} {node.position && `· ${node.position}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-[#3FB950]">
                          <Link2 size={10} />
                          연결됨
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Footer - only show for link tab */}
            {activeTab === 'link' && (
              <div className="px-5 py-3 border-t border-[rgba(240,246,252,0.1)] bg-[#0D1117]/50">
                <p className="text-xs text-[#484F58] text-center">
                  초대 링크를 받은 사람이 수락하면 모임의 모든 멤버와 자동으로 1촌이 됩니다
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
