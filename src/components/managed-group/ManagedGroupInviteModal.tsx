'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Share2, Link2, Loader2, Mail, MessageCircle, Search, Users, UserPlus, Lock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useManagedGroupStore } from '@/store/managedGroupStore';
import { loadKakaoSDK, sendKakaoInvite } from '@/lib/kakao-sdk';
import { getUserConnectionsWithDetails } from '@/lib/firebase-services';
import { User } from '@/types';

type TabType = 'connections' | 'link';

export default function ManagedGroupInviteModal() {
  const { user } = useAuthStore();
  const { isInviteModalOpen, closeInviteModal, selectedGroup, inviteLink, generateInviteLink, addMembersFromConnections } = useManagedGroupStore();

  // 데모 모드 체크
  const [isDemoMode, setIsDemoMode] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDemoMode(localStorage.getItem('nodded_demo_mode') === 'true');
    }
  }, [isInviteModalOpen]);

  // 탭 상태
  const [activeTab, setActiveTab] = useState<TabType>('connections');

  // 링크 초대 관련 상태
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // 인맥 초대 관련 상태
  const [connections, setConnections] = useState<User[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // 인맥 목록 불러오기
  useEffect(() => {
    if (isInviteModalOpen && user) {
      setIsLoadingConnections(true);
      setSelectedIds(new Set());
      setSearchQuery('');
      getUserConnectionsWithDetails(user.id)
        .then(setConnections)
        .catch(() => setConnections([]))
        .finally(() => setIsLoadingConnections(false));
    }
  }, [isInviteModalOpen, user]);

  // 이미 멤버인 사용자 ID
  const memberUserIds = useMemo(
    () => new Set(selectedGroup?.memberUserIds || []),
    [selectedGroup?.memberUserIds]
  );

  // 검색 필터링 + 이미 멤버인 사람은 아래로 정렬
  const filteredConnections = useMemo(() => {
    let result = connections;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = connections.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.institution?.toLowerCase().includes(q) ||
          c.position?.toLowerCase().includes(q)
      );
    }
    // 이미 멤버인 사람은 목록 아래로 정렬
    return result.slice().sort((a, b) => {
      const aIsMember = memberUserIds.has(a.id) ? 1 : 0;
      const bIsMember = memberUserIds.has(b.id) ? 1 : 0;
      return aIsMember - bIsMember;
    });
  }, [connections, searchQuery, memberUserIds]);

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
    if (!selectedGroup || selectedIds.size === 0) return;
    setIsAdding(true);
    try {
      await addMembersFromConnections(selectedGroup.id, Array.from(selectedIds));
      setSelectedIds(new Set());
    } finally {
      setIsAdding(false);
    }
  };

  if (!selectedGroup || !user) return null;

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    try {
      await generateInviteLink(selectedGroup.id, user.id);
    } catch {
      // handled in store
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    await copyToClipboard(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!inviteLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${selectedGroup.name} 모임 초대`,
          text: `${user.name}님이 "${selectedGroup.name}" 나의 모임에 초대했습니다.`,
          url: inviteLink,
        });
      } catch {
        // cancelled
      }
    } else {
      await handleCopy();
    }
  };

  const handleKakao = async () => {
    if (!inviteLink) return;
    try {
      await loadKakaoSDK();
      sendKakaoInvite({
        senderName: user.name,
        inviteLink,
        groupName: selectedGroup.name,
      });
    } catch {
      await copyToClipboard(`${user.name}님이 "${selectedGroup.name}" 모임에 초대했습니다!\n\n${inviteLink}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      window.open('kakaotalk://');
    }
  };

  const handleSms = () => {
    if (!inviteLink) return;
    const body = encodeURIComponent(
      `${user.name}님이 "${selectedGroup.name}" 모임에 초대했습니다!\n참여하기: ${inviteLink}`
    );
    window.location.href = `sms:?body=${body}`;
  };

  const handleEmail = () => {
    if (!inviteLink) return;
    const subject = encodeURIComponent(`${user.name}님이 "${selectedGroup.name}" 모임에 초대했습니다`);
    const body = encodeURIComponent(
      `안녕하세요!\n\n${user.name}님이 NODDED의 "${selectedGroup.name}" 나의 모임에 초대했습니다.\n\n아래 링크를 통해 참여해주세요:\n\n${inviteLink}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleClose = () => {
    setCopied(false);
    setActiveTab('connections');
    setSelectedIds(new Set());
    setSearchQuery('');
    closeInviteModal();
  };

  return (
    <AnimatePresence>
      {isInviteModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-[rgba(1,4,9,0.85)] backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={handleClose}
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
                  <h3 className="text-base font-bold text-[#F0F6FC]">모임 초대</h3>
                  <p className="text-xs text-[#8B949E]">{selectedGroup.name}</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-1.5 text-[#8B949E] hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Tab Buttons */}
            <div className="px-5 pb-3">
              <div className="flex gap-2 p-1 bg-[#0D1117] rounded-xl">
                <button
                  onClick={() => setActiveTab('connections')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'connections'
                      ? 'bg-[#58A6FF] text-[#0D1117]'
                      : 'text-[#8B949E] hover:text-white'
                  }`}
                >
                  <UserPlus size={14} />
                  인맥에서 초대
                </button>
                <button
                  onClick={() => setActiveTab('link')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'link'
                      ? 'bg-[#58A6FF] text-[#0D1117]'
                      : 'text-[#8B949E] hover:text-white'
                  }`}
                >
                  <Link2 size={14} />
                  링크로 초대
                </button>
              </div>
            </div>

            {/* Info Banner */}
            {selectedGroup.settings.autoConnect && (
              <div className="mx-5 mb-3 bg-[#58A6FF]/10 border border-[#58A6FF]/20 rounded-xl p-3">
                <p className="text-xs text-[#58A6FF]">
                  초대받은 분은 모임 멤버 {selectedGroup.members.length}명 전원과 자동으로 인맥이 됩니다
                </p>
              </div>
            )}

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {isDemoMode ? (
                /* 데모 모드 제한 메시지 */
                <div className="flex-1 flex flex-col items-center justify-center px-5 py-12">
                  <div className="w-16 h-16 rounded-full bg-[#F85149]/10 flex items-center justify-center mb-4">
                    <Lock size={28} className="text-[#F85149]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#F0F6FC] mb-2">정식 계정에서만 가능합니다</h3>
                  <p className="text-sm text-[#8B949E] text-center mb-6">
                    데모 계정에서는 멤버 초대 기능을 사용할 수 없습니다.<br />
                    정식 계정으로 가입하여 모든 기능을 이용해 보세요.
                  </p>
                  <button
                    onClick={handleClose}
                    className="px-6 py-3 bg-[#21262D] text-[#F0F6FC] font-medium rounded-xl border border-[#30363D]"
                  >
                    확인
                  </button>
                </div>
              ) : activeTab === 'connections' ? (
                /* 인맥에서 초대 탭 */
                <>
                  {/* Search */}
                  <div className="px-5 pb-3">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#484F58]" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="이름, 소속 기관, 직함으로 검색"
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
                                  {[conn.institution, conn.position].filter(Boolean).join(' · ') || '정보 없음'}
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

                  {/* Add Button */}
                  <div className="px-5 py-4 border-t border-[#30363D]">
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
                          ? `${selectedIds.size}명 초대하기`
                          : '초대할 인맥을 선택하세요'}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                /* 링크로 초대 탭 */
                <div className="px-5 pb-5">
                  {!inviteLink ? (
                    <button
                      onClick={handleGenerateLink}
                      disabled={isGenerating}
                      className="w-full py-3.5 bg-[#58A6FF] text-[#0D1117] font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 mb-4"
                    >
                      {isGenerating ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Link2 size={18} />
                      )}
                      초대 링크 생성
                    </button>
                  ) : (
                    <div className="space-y-3">
                      {/* Link Display */}
                      <div className="p-3 bg-[#0D1117] border border-[#30363D] rounded-xl">
                        <p className="text-xs text-[#484F58] mb-1">초대 링크</p>
                        <p className="text-sm text-[#F0F6FC] break-all">{inviteLink}</p>
                      </div>

                      {/* Share Methods */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={handleCopy}
                          className="flex items-center justify-center gap-2 py-3 bg-[#A371F7]/10 border border-[#A371F7]/30 rounded-xl text-sm text-[#A371F7] font-medium"
                        >
                          {copied ? <Check size={16} /> : <Copy size={16} />}
                          {copied ? '복사됨!' : '링크 복사'}
                        </button>
                        <button
                          onClick={handleShare}
                          className="flex items-center justify-center gap-2 py-3 bg-[#58A6FF]/10 border border-[#58A6FF]/30 rounded-xl text-sm text-[#58A6FF] font-medium"
                        >
                          <Share2 size={16} />
                          공유
                        </button>
                        <button
                          onClick={handleKakao}
                          className="flex items-center justify-center gap-2 py-3 bg-[#FEE500]/10 border border-[#FEE500]/30 rounded-xl text-sm text-[#FEE500] font-medium"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="#FEE500">
                            <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.82 5.32 4.55 6.73-.15.54-.82 2.93-.86 3.15 0 0-.02.14.07.19.09.06.2.03.2.03.26-.04 3.04-1.99 3.52-2.32.83.12 1.68.18 2.52.18 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
                          </svg>
                          카카오톡
                        </button>
                        <button
                          onClick={handleSms}
                          className="flex items-center justify-center gap-2 py-3 bg-[#3FB950]/10 border border-[#3FB950]/30 rounded-xl text-sm text-[#3FB950] font-medium"
                        >
                          <MessageCircle size={16} />
                          문자
                        </button>
                      </div>

                      <button
                        onClick={handleEmail}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-[#0D1117] border border-[#30363D] rounded-xl text-sm text-[#8B949E] font-medium"
                      >
                        <Mail size={16} />
                        이메일로 보내기
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
