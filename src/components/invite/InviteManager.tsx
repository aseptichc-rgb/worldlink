"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  MessageCircle,
  Send,
  Copy,
  Check,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  X,
  Loader2,
  BookUser,
} from "lucide-react";
import { Card, Button, Input, Modal } from "@/components/ui";
import { Invitation } from "@/types";
import {
  createInvitation,
  getSentInvitations,
  generateInviteLink,
  getUser,
} from "@/lib/firebase-services";
import { loadKakaoSDK, sendKakaoInvite } from "@/lib/kakao-sdk";

interface InviteManagerProps {
  userId: string;
  invitesRemaining: number;
  userName: string;
  onInviteSent?: () => void;
}

type InviteMethod = "email" | "kakao" | "sms" | "link";

export function InviteManager({
  userId,
  invitesRemaining,
  userName,
  onInviteSent,
}: InviteManagerProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<InviteMethod | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [remainingCount, setRemainingCount] = useState(invitesRemaining);
  const [contactPickerSupported, setContactPickerSupported] = useState(false);
  const [selectedContactName, setSelectedContactName] = useState("");

  useEffect(() => {
    loadInvitations();
  }, [userId]);

  useEffect(() => {
    setRemainingCount(invitesRemaining);
  }, [invitesRemaining]);

  // Contact Picker API 지원 여부 확인
  useEffect(() => {
    if ("contacts" in navigator && "ContactsManager" in window) {
      setContactPickerSupported(true);
    }
  }, []);

  // 주소록에서 연락처 선택
  const pickContact = async () => {
    try {
      const contacts = await (navigator as any).contacts.select(
        ["name", "tel"],
        { multiple: false }
      );

      if (contacts && contacts.length > 0) {
        const contact = contacts[0];
        const phoneNumber = contact.tel?.[0] || "";
        const name = contact.name?.[0] || "";

        // 전화번호 정규화 (숫자만 추출 후 포맷)
        const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
        let formattedPhone = cleanPhone;

        // 한국 전화번호 포맷 (010-1234-5678)
        if (cleanPhone.length === 11 && cleanPhone.startsWith("010")) {
          formattedPhone = `${cleanPhone.slice(0, 3)}-${cleanPhone.slice(3, 7)}-${cleanPhone.slice(7)}`;
        } else if (cleanPhone.length === 10) {
          formattedPhone = `${cleanPhone.slice(0, 3)}-${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`;
        }

        setPhone(formattedPhone);
        setSelectedContactName(name);
      }
    } catch (err) {
      // 사용자가 취소한 경우 또는 권한 거부
      if ((err as Error).name !== "InvalidStateError") {
        console.error("Contact picker error:", err);
      }
    }
  };

  const loadInvitations = async () => {
    setIsLoading(true);
    try {
      const sent = await getSentInvitations(userId);
      setInvitations(sent);
    } catch (err) {
      console.error("Failed to load invitations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendInvite = async () => {
    if (!selectedMethod) return;
    // 초대 횟수 무제한

    setIsSending(true);
    setError(null);

    try {
      const invitation = await createInvitation(
        userId,
        selectedMethod,
        selectedMethod === "email" ? email : undefined,
        selectedMethod === "sms" || selectedMethod === "kakao" ? phone : undefined
      );

      const inviteLink = generateInviteLink(invitation.inviteCode);
      setGeneratedLink(inviteLink);

      // 클립보드 복사 헬퍼 함수
      const copyToClipboard = async (text: string) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          // fallback for older browsers
          const textArea = document.createElement("textarea");
          textArea.value = text;
          textArea.style.position = "fixed";
          textArea.style.left = "-9999px";
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
        }
      };

      // 실제 공유 실행
      if (selectedMethod === "email") {
        const subject = encodeURIComponent(`${userName}님이 NODDED에 초대했습니다`);
        const body = encodeURIComponent(
          `안녕하세요!\n\n${userName}님이 NODDED에 초대했습니다.\n\nNODDED는 신뢰 기반 비즈니스 네트워킹 플랫폼입니다.\n아래 링크를 통해 가입해주세요:\n\n${inviteLink}\n\n초대 코드: ${invitation.inviteCode}`
        );
        window.open(`mailto:${email}?subject=${subject}&body=${body}`);
      } else if (selectedMethod === "kakao") {
        // 카카오톡 공유 SDK
        try {
          await loadKakaoSDK();
          sendKakaoInvite({
            senderName: userName,
            inviteLink,
          });
        } catch {
          // SDK 로드 실패 시 클립보드 폴백
          await copyToClipboard(
            `${userName}님이 NODDED에 초대했습니다!\n\n비즈니스 네트워킹의 새로운 방법을 경험해보세요.\n\n${inviteLink}`
          );
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          window.open("kakaotalk://");
        }
      } else if (selectedMethod === "sms") {
        const smsBody = encodeURIComponent(
          `${userName}님이 NODDED에 초대했습니다!\n가입 링크: ${inviteLink}`
        );
        window.location.href = `sms:${phone}?body=${smsBody}`;
      } else if (selectedMethod === "link") {
        await copyToClipboard(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }

      setRemainingCount((prev) => prev - 1);
      await loadInvitations();
      onInviteSent?.();

      // 모달 초기화
      if (selectedMethod !== "link") {
        setShowInviteModal(false);
        setSelectedMethod(null);
        setEmail("");
        setPhone("");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "초대 발송에 실패했습니다";
      setError(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  const getStatusIcon = (status: Invitation["status"]) => {
    switch (status) {
      case "pending":
      case "sent":
        return <Clock size={14} className="text-yellow-400" />;
      case "accepted":
        return <CheckCircle2 size={14} className="text-green-400" />;
      case "expired":
        return <XCircle size={14} className="text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: Invitation["status"]) => {
    switch (status) {
      case "pending":
        return "대기중";
      case "sent":
        return "발송됨";
      case "accepted":
        return "가입완료";
      case "expired":
        return "만료됨";
      default:
        return "";
    }
  };

  const getMethodIcon = (method: InviteMethod) => {
    switch (method) {
      case "email":
        return <Mail size={16} />;
      case "kakao":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.82 5.32 4.55 6.73-.15.54-.82 2.93-.86 3.15 0 0-.02.14.07.19.09.06.2.03.2.03.26-.04 3.04-1.99 3.52-2.32.83.12 1.68.18 2.52.18 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
          </svg>
        );
      case "sms":
        return <MessageCircle size={16} />;
      case "link":
        return <Copy size={16} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Card className="px-6 py-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-medium text-[#8B949E] flex items-center gap-2">
            <Users size={16} />
            친구 초대하기
          </h3>
          <span className="text-xs px-3 py-1.5 rounded-full text-[#86C9F2] bg-[#86C9F2]/10">
            무제한 초대 가능
          </span>
        </div>

        {/* 초대 방법 선택 버튼들 */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <Button
            variant="secondary"
            className="flex items-center justify-center gap-2"
            onClick={() => {
              setSelectedMethod("kakao");
              setShowInviteModal(true);
            }}
                      >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.82 5.32 4.55 6.73-.15.54-.82 2.93-.86 3.15 0 0-.02.14.07.19.09.06.2.03.2.03.26-.04 3.04-1.99 3.52-2.32.83.12 1.68.18 2.52.18 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
            </svg>
            카카오톡
          </Button>

          <Button
            variant="secondary"
            className="flex items-center justify-center gap-2"
            onClick={() => {
              setSelectedMethod("email");
              setShowInviteModal(true);
            }}
                      >
            <Mail size={18} />
            이메일
          </Button>

          <Button
            variant="secondary"
            className="flex items-center justify-center gap-2"
            onClick={() => {
              setSelectedMethod("sms");
              setShowInviteModal(true);
            }}
                      >
            <MessageCircle size={18} />
            문자메시지
          </Button>

          <Button
            variant="primary"
            className="flex items-center justify-center gap-2"
            onClick={() => {
              setSelectedMethod("link");
              setShowInviteModal(true);
            }}
                      >
            <Copy size={18} />
            링크 복사
          </Button>
        </div>

        {/* 발송한 초대 목록 */}
        {invitations.length > 0 && (
          <div className="border-t border-[#30363D] pt-4 mt-2">
            <h4 className="text-sm text-[#8B949E] mb-3">보낸 초대</h4>
            <div className="space-y-2.5 max-h-48 overflow-y-auto">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-3 bg-[#161B22] rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#1C2333] rounded-lg text-[#8B949E]">
                      {getMethodIcon(invitation.method)}
                    </div>
                    <div>
                      <p className="text-sm text-white">
                        {invitation.recipientEmail ||
                          invitation.recipientPhone ||
                          "링크 공유"}
                      </p>
                      <p className="text-xs text-[#484F58] mt-0.5">
                        {invitation.sentAt.toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    {getStatusIcon(invitation.status)}
                    <span className="text-[#8B949E]">
                      {getStatusText(invitation.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </Card>

      {/* 초대 모달 */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#162A4A] rounded-xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  {selectedMethod === "kakao" && (
                    <>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="#FEE500"
                      >
                        <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.82 5.32 4.55 6.73-.15.54-.82 2.93-.86 3.15 0 0-.02.14.07.19.09.06.2.03.2.03.26-.04 3.04-1.99 3.52-2.32.83.12 1.68.18 2.52.18 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
                      </svg>
                      카카오톡으로 초대
                    </>
                  )}
                  {selectedMethod === "email" && (
                    <>
                      <Mail size={20} className="text-[#86C9F2]" />
                      이메일로 초대
                    </>
                  )}
                  {selectedMethod === "sms" && (
                    <>
                      <MessageCircle size={20} className="text-[#86C9F2]" />
                      문자로 초대
                    </>
                  )}
                  {selectedMethod === "link" && (
                    <>
                      <Copy size={20} className="text-[#86C9F2]" />
                      초대 링크 생성
                    </>
                  )}
                </h3>
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setSelectedMethod(null);
                    setEmail("");
                    setPhone("");
                    setError(null);
                    setGeneratedLink("");
                    setSelectedContactName("");
                  }}
                  className="p-1 text-[#8BA4C4] hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-[#FF4081]/10 border border-[#FF4081]/30 rounded-lg">
                  <p className="text-base text-[#FF4081]">{error}</p>
                </div>
              )}

              {selectedMethod === "email" && (
                <div className="space-y-4">
                  <Input
                    type="email"
                    label="초대할 이메일"
                    placeholder="friend@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    leftIcon={<Mail size={18} />}
                  />
                  <Button
                    className="w-full flex items-center justify-center gap-2"
                    onClick={handleSendInvite}
                    disabled={!email || isSending}
                  >
                    {isSending ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                    초대 메일 보내기
                  </Button>
                </div>
              )}

              {selectedMethod === "kakao" && (
                <div className="space-y-4">
                  <p className="text-base text-[#8BA4C4]">
                    카카오톡 공유 창이 열리며 초대 메시지가 전송됩니다.
                  </p>
                  <Button
                    className="w-full flex items-center justify-center gap-2"
                    onClick={handleSendInvite}
                    disabled={isSending}
                  >
                    {isSending ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : copied ? (
                      <Check size={18} />
                    ) : (
                      <Send size={18} />
                    )}
                    {copied ? "복사됨! 카카오톡 열기" : "카카오톡으로 초대하기"}
                  </Button>
                </div>
              )}

              {selectedMethod === "sms" && (
                <div className="space-y-4">
                  {/* 선택된 연락처 이름 표시 */}
                  {selectedContactName && (
                    <div className="p-3 bg-[#1E3A5F] rounded-lg">
                      <p className="text-sm text-[#4A5E7A] mb-1">선택된 연락처</p>
                      <p className="text-base text-white font-medium">{selectedContactName}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-base font-medium text-[#8B949E] mb-2 tracking-wide">
                      초대할 전화번호
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="tel"
                        placeholder="010-1234-5678"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          setSelectedContactName(""); // 수동 입력 시 선택된 이름 초기화
                        }}
                        className="flex-1"
                      />
                      <Button
                        variant="secondary"
                        className="flex items-center justify-center px-3 shrink-0"
                        onClick={pickContact}
                        title={contactPickerSupported ? "주소록에서 선택" : "Android Chrome에서만 지원"}
                      >
                        <BookUser size={20} />
                      </Button>
                    </div>
                    {!contactPickerSupported && (
                      <p className="text-sm text-[#4A5E7A] mt-2">
                        💡 Android Chrome에서 주소록 연동을 사용할 수 있습니다
                      </p>
                    )}
                  </div>

                  <Button
                    className="w-full flex items-center justify-center gap-2"
                    onClick={handleSendInvite}
                    disabled={!phone || isSending}
                  >
                    {isSending ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                    {selectedContactName
                      ? `${selectedContactName}님에게 초대 보내기`
                      : "문자로 초대하기"}
                  </Button>
                </div>
              )}

              {selectedMethod === "link" && (
                <div className="space-y-4">
                  {generatedLink ? (
                    <>
                      <div className="p-3 bg-[#1E3A5F] rounded-lg">
                        <p className="text-sm text-[#4A5E7A] mb-1">생성된 초대 링크</p>
                        <p className="text-base text-white break-all">{generatedLink}</p>
                      </div>
                      <Button
                        className="w-full flex items-center justify-center gap-2"
                        onClick={async () => {
                          try {
                            if (navigator.clipboard && navigator.clipboard.writeText) {
                              await navigator.clipboard.writeText(generatedLink);
                            } else {
                              const textArea = document.createElement("textarea");
                              textArea.value = generatedLink;
                              textArea.style.position = "fixed";
                              textArea.style.left = "-9999px";
                              document.body.appendChild(textArea);
                              textArea.select();
                              document.execCommand("copy");
                              document.body.removeChild(textArea);
                            }
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          } catch (err) {
                            console.error("Copy failed:", err);
                          }
                        }}
                      >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                        {copied ? "복사됨!" : "다시 복사하기"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-base text-[#8BA4C4]">
                        새로운 초대 링크를 생성합니다. 생성된 링크를 친구에게
                        공유해주세요.
                      </p>
                      <Button
                        className="w-full flex items-center justify-center gap-2"
                        onClick={handleSendInvite}
                        disabled={isSending}
                      >
                        {isSending ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Copy size={18} />
                        )}
                        초대 링크 생성하기
                      </Button>
                    </>
                  )}
                </div>
              )}

              <p className="text-sm text-[#4A5E7A] text-center mt-4">
                초대 횟수 무제한
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
