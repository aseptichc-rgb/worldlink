'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Share2, Link2, Loader2, Mail, MessageCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useManagedGroupStore } from '@/store/managedGroupStore';
import { loadKakaoSDK, sendKakaoInvite } from '@/lib/kakao-sdk';

export default function ManagedGroupInviteModal() {
  const { user } = useAuthStore();
  const { isInviteModalOpen, closeInviteModal, selectedGroup, inviteLink, generateInviteLink } = useManagedGroupStore();

  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

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
          title: `${selectedGroup.name} 그룹 초대`,
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
      await copyToClipboard(`${user.name}님이 "${selectedGroup.name}" 그룹에 초대했습니다!\n\n${inviteLink}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      window.open('kakaotalk://');
    }
  };

  const handleSms = () => {
    if (!inviteLink) return;
    const body = encodeURIComponent(
      `${user.name}님이 "${selectedGroup.name}" 그룹에 초대했습니다!\n참여하기: ${inviteLink}`
    );
    window.location.href = `sms:?body=${body}`;
  };

  const handleEmail = () => {
    if (!inviteLink) return;
    const subject = encodeURIComponent(`${user.name}님이 "${selectedGroup.name}" 그룹에 초대했습니다`);
    const body = encodeURIComponent(
      `안녕하세요!\n\n${user.name}님이 NODDED의 "${selectedGroup.name}" 나의 모임에 초대했습니다.\n\n아래 링크를 통해 참여해주세요:\n\n${inviteLink}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleClose = () => {
    setCopied(false);
    closeInviteModal();
  };

  return (
    <AnimatePresence>
      {isInviteModalOpen && (
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
            className="w-full max-w-sm bg-[#1C2333] rounded-2xl border border-[#30363D] p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                  style={{ backgroundColor: selectedGroup.color + '20' }}
                >
                  {selectedGroup.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F0F6FC]">멤버 초대</h3>
                  <p className="text-xs text-[#8B949E]">{selectedGroup.name}</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-1.5 text-[#8B949E] hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Info Banner */}
            {selectedGroup.settings.autoConnect && (
              <div className="bg-[#58A6FF]/10 border border-[#58A6FF]/20 rounded-xl p-3 mb-5">
                <p className="text-xs text-[#58A6FF]">
                  초대받은 분은 그룹 멤버 {selectedGroup.members.length}명 전원과 자동으로 인맥이 됩니다
                </p>
              </div>
            )}

            {/* Generate / Show Link */}
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
