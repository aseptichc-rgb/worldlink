"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  Copy,
  Check,
  Link,
  MessageCircle,
  Users,
  QrCode,
  X,
} from "lucide-react";
import { Card, Button } from "@/components/ui";
import { loadKakaoSDK, sendKakaoInvite } from "@/lib/kakao-sdk";

interface InviteShareCardProps {
  inviteCode: string;
  invitesRemaining: number;
  userName: string;
}

export function InviteShareCard({
  inviteCode,
  invitesRemaining,
  userName,
}: InviteShareCardProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // 초대 링크 생성
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const inviteLink = `${baseUrl}/onboarding?code=${inviteCode}`;

  // 공유 메시지
  const shareMessage = `${userName}님이 NODDED에 초대했습니다!\n\n비즈니스 네트워킹의 새로운 방법을 경험해보세요.\n\n`;

  // 클립보드에 링크 복사
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // 네이티브 공유 API 사용
  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "NODDED 초대",
          text: shareMessage,
          url: inviteLink,
        });
      } catch (err) {
        // 사용자가 공유를 취소한 경우
        if ((err as Error).name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    } else {
      // 네이티브 공유 미지원 시 링크 복사
      copyLink();
    }
  };

  // 카카오톡 공유 (SDK 사용)
  const shareKakao = async () => {
    try {
      await loadKakaoSDK();
      sendKakaoInvite({
        senderName: userName,
        inviteLink,
      });
    } catch {
      // SDK 로드 실패 시 클립보드 복사 + 카카오톡 앱 열기
      copyLink();
      window.open("kakaotalk://", "_blank");
    }
  };

  // SMS/메시지 공유
  const shareSMS = () => {
    const smsBody = encodeURIComponent(`${shareMessage}${inviteLink}`);
    window.location.href = `sms:?body=${smsBody}`;
  };

  return (
    <>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-[#64748B] flex items-center gap-2">
            <Users size={16} />
            친구 초대하기
          </h3>
          <span className="text-xs text-[#2563EB] bg-[#2563EB]/10 px-2 py-1 rounded-full">
            {invitesRemaining}명 초대 가능
          </span>
        </div>

        {/* 초대 코드 표시 */}
        <div className="bg-[#F8F9FA] rounded-xl p-4 mb-4">
          <p className="text-sm text-[#94A3B8] mb-1">내 초대 코드</p>
          <div className="flex items-center justify-between">
            <p className="font-mono text-2xl font-bold text-[#2563EB]">
              {inviteCode}
            </p>
            <button
              onClick={copyLink}
              className="p-2 rounded-lg bg-[#E2E8F0] hover:bg-[#E2E8F0] transition-colors"
            >
              {copied ? (
                <Check size={18} className="text-[#10B981]" />
              ) : (
                <Copy size={18} className="text-[#64748B]" />
              )}
            </button>
          </div>
        </div>

        {/* 초대 링크 */}
        <div className="bg-[#F8F9FA] rounded-xl p-3 mb-4 flex items-center gap-2">
          <Link size={14} className="text-[#94A3B8] flex-shrink-0" />
          <p className="text-sm text-[#64748B] truncate flex-1">{inviteLink}</p>
          <button
            onClick={copyLink}
            className="text-xs text-[#2563EB] hover:underline flex-shrink-0"
          >
            {copied ? "복사됨!" : "복사"}
          </button>
        </div>

        {/* 공유 버튼들 */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="primary"
            className="flex items-center justify-center gap-2"
            onClick={shareNative}
          >
            <Share2 size={18} />
            공유하기
          </Button>

          <Button
            variant="secondary"
            className="flex items-center justify-center gap-2"
            onClick={shareSMS}
          >
            <MessageCircle size={18} />
            메시지
          </Button>
        </div>

        {/* 안내 문구 */}
        <p className="text-sm text-[#94A3B8] text-center mt-4">
          링크를 받은 친구는 바로 가입할 수 있어요
        </p>
      </Card>

      {/* QR 코드 모달 */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.3)] backdrop-blur-sm p-4"
            onClick={() => setShowQR(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#FFFFFF] rounded-xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#1A1A2E]">QR 코드</h3>
                <button
                  onClick={() => setShowQR(false)}
                  className="p-1 text-[#64748B] hover:text-[#1A1A2E]"
                >
                  <X size={20} />
                </button>
              </div>

              {/* QR 코드 이미지 (실제 구현 시 QR 라이브러리 사용) */}
              <div className="bg-white rounded-xl p-4 mb-4 flex items-center justify-center">
                <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <QrCode size={48} className="text-gray-400" />
                  <p className="text-sm text-gray-500 absolute mt-20">
                    QR 생성 중...
                  </p>
                </div>
              </div>

              <p className="text-base text-[#64748B] text-center">
                친구가 이 QR코드를 스캔하면
                <br />
                바로 NODDED에 가입할 수 있어요
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
