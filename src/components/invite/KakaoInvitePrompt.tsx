'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Loader2 } from 'lucide-react';
import { loadKakaoSDK, sendKakaoInvite } from '@/lib/kakao-sdk';
import { createInvitation, generateInviteLink } from '@/lib/firebase-services';
import { useAuthStore } from '@/store/authStore';

interface KakaoInvitePromptProps {
  recipientName: string;
  recipientPhone?: string;
  recipientEmail?: string;
  onClose: () => void;
  onSent?: () => void;
}

export default function KakaoInvitePrompt({
  recipientName,
  recipientPhone,
  recipientEmail,
  onClose,
  onSent,
}: KakaoInvitePromptProps) {
  const { user } = useAuthStore();
  const [isSending, setIsSending] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState(false);

  useEffect(() => {
    loadKakaoSDK()
      .then(() => setSdkReady(true))
      .catch(() => setSdkError(true));
  }, []);

  const handleSend = async () => {
    if (!user) return;
    setIsSending(true);

    try {
      const invitation = await createInvitation(
        user.id,
        'kakao',
        recipientEmail || undefined,
        recipientPhone || undefined
      );

      const inviteLink = generateInviteLink(invitation.inviteCode);

      if (sdkReady) {
        sendKakaoInvite({
          senderName: user.name,
          recipientName,
          inviteLink,
        });
      } else {
        // SDK 로드 실패 시 클립보드 복사 + kakaotalk:// 폴백
        const text = `${user.name}님이 NODDED에 초대했습니다!\n\n비즈니스 네트워킹의 새로운 방법을 경험해보세요.\n\n${inviteLink}`;
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        }
        window.open('kakaotalk://');
      }

      onSent?.();
      onClose();
    } catch (err) {
      console.error('Failed to send KakaoTalk invite:', err);
      onClose();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(0,0,0,0.3)] backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-[#FFFFFF] rounded-t-2xl p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FEE500] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#3C1E1E">
                  <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.82 5.32 4.55 6.73-.15.54-.82 2.93-.86 3.15 0 0-.02.14.07.19.09.06.2.03.2.03.26-.04 3.04-1.99 3.52-2.32.83.12 1.68.18 2.52.18 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-[#1A1A2E] font-semibold">일촌 초대</h3>
                <p className="text-sm text-[#64748B]">카카오톡으로 초대장을 보냅니다</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 text-[#64748B] hover:text-[#1A1A2E]">
              <X size={20} />
            </button>
          </div>

          <div className="p-4 rounded-xl bg-[#F8F9FA] mb-4">
            <p className="text-base text-[#64748B]">
              <span className="text-[#1A1A2E] font-medium">{recipientName}</span>님에게
              NODDED 일촌 초대 링크를 카카오톡으로 보낼까요?
            </p>
            <p className="text-sm text-[#94A3B8] mt-2">
              상대방이 가입하면 일촌 수락 여부와 정보 공개 범위를 직접 결정할 수 있습니다.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-[#E2E8F0] text-[#64748B] font-medium"
            >
              건너뛰기
            </button>
            <button
              onClick={handleSend}
              disabled={isSending}
              className="flex-1 py-3 rounded-xl bg-[#FEE500] text-[#3C1E1E] font-medium flex items-center justify-center gap-2"
            >
              {isSending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
              카카오톡 보내기
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
