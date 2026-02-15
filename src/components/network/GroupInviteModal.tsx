'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Users, Link2, Share2, QrCode, UserPlus } from 'lucide-react';
import { useGroupStore } from '@/store/groupStore';
import { useNetworkStore } from '@/store/networkStore';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/ui';

export default function GroupInviteModal() {
  const {
    groups,
    isGroupInviteModalOpen,
    inviteGroupId,
    closeGroupInviteModal,
    getNodesInGroup,
  } = useGroupStore();

  const { nodes } = useNetworkStore();
  const { user } = useAuthStore();

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'members'>('link');

  const group = groups.find((g) => g.id === inviteGroupId);
  const memberNodeIds = inviteGroupId ? getNodesInGroup(inviteGroupId) : [];
  const memberNodes = nodes.filter((n) => memberNodeIds.includes(n.id));

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
          title: `${group?.name} 그룹 초대`,
          text: `${user?.name}님이 "${group?.name}" 그룹에 초대합니다. 그룹에 들어오면 ${memberNodes.length}명의 인맥과 자동으로 연결됩니다!`,
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
    setActiveTab('link');
    closeGroupInviteModal();
  };

  return (
    <AnimatePresence>
      {isGroupInviteModalOpen && group && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-[rgba(1,4,9,0.85)] backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-[rgba(22,27,34,0.98)] backdrop-blur-xl border border-[rgba(240,246,252,0.1)] rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.4)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(240,246,252,0.1)]">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: group.color + '20' }}
                >
                  {group.icon}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#F0F6FC]">그룹 초대</h2>
                  <p className="text-sm text-[#8B949E]">{group.name}</p>
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
            <div className="px-6 py-3 bg-[#58A6FF]/10 border-b border-[#58A6FF]/20">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#58A6FF]/20 flex items-center justify-center flex-shrink-0">
                  <UserPlus size={16} className="text-[#58A6FF]" />
                </div>
                <div>
                  <p className="text-sm text-[#58A6FF] font-medium">자동 인맥 연결</p>
                  <p className="text-xs text-[#8B949E] mt-0.5">
                    이 그룹에 들어오면 <span className="text-white font-medium">{memberNodes.length}명</span>의 멤버와 자동으로 서로 인맥이 됩니다
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex px-6 pt-4 gap-2">
              <button
                onClick={() => setActiveTab('link')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'link'
                    ? 'bg-[#58A6FF]/20 text-[#58A6FF]'
                    : 'text-[#8B949E] hover:bg-[#1C2333]'
                }`}
              >
                <Link2 size={14} className="inline mr-1.5" />
                초대 링크
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'members'
                    ? 'bg-[#58A6FF]/20 text-[#58A6FF]'
                    : 'text-[#8B949E] hover:bg-[#1C2333]'
                }`}
              >
                <Users size={14} className="inline mr-1.5" />
                그룹 멤버 ({memberNodes.length})
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              {activeTab === 'link' ? (
                <div className="space-y-4">
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
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
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

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[rgba(240,246,252,0.1)] bg-[#0D1117]/50">
              <p className="text-xs text-[#484F58] text-center">
                초대 링크를 받은 사람이 수락하면 그룹의 모든 멤버와 자동으로 1촌이 됩니다
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
