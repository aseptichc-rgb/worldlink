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
  Search,
  ArrowLeft,
  Smartphone,
  Plus,
  Trash2,
  Edit3,
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
import {
  FetchedContact,
  pickPhoneContacts,
  fetchGoogleContacts,
  parsePhoneNumbers,
} from "@/lib/contacts-api";

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

  // SMS 다중 발송 상태
  const [smsStep, setSmsStep] = useState<"source" | "contacts" | "naver" | "manual">("source");
  const [smsContacts, setSmsContacts] = useState<FetchedContact[]>([]);
  const [selectedSmsIndices, setSelectedSmsIndices] = useState<Set<number>>(new Set());
  const [contactSearchQuery, setContactSearchQuery] = useState("");
  const [isFetchingContacts, setIsFetchingContacts] = useState(false);
  const [naverPasteText, setNaverPasteText] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");

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

  // SMS 상태 초기화
  const resetSmsState = () => {
    setSmsStep("source");
    setSmsContacts([]);
    setSelectedSmsIndices(new Set());
    setContactSearchQuery("");
    setNaverPasteText("");
    setManualName("");
    setManualPhone("");
    setIsFetchingContacts(false);
  };

  // 스마트폰 주소록에서 연락처 가져오기 (다중 선택)
  const handlePickPhoneContacts = async () => {
    setIsFetchingContacts(true);
    setError(null);
    try {
      const contacts = await pickPhoneContacts();
      if (contacts.length > 0) {
        setSmsContacts(contacts);
        setSelectedSmsIndices(new Set(contacts.map((_, i) => i)));
        setSmsStep("contacts");
      } else {
        setError("선택된 연락처가 없습니다.");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsFetchingContacts(false);
    }
  };

  // 구글 주소록에서 연락처 가져오기
  const handleFetchGoogleContacts = async () => {
    setIsFetchingContacts(true);
    setError(null);
    try {
      const contacts = await fetchGoogleContacts();
      if (contacts.length > 0) {
        setSmsContacts(contacts);
        setSelectedSmsIndices(new Set(contacts.map((_, i) => i)));
        setSmsStep("contacts");
      } else {
        setError("불러온 연락처가 없습니다.");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsFetchingContacts(false);
    }
  };

  // 연락처 선택/해제 토글
  const toggleContactSelection = (index: number) => {
    setSelectedSmsIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // 수동 연락처 추가
  const addManualContact = () => {
    if (!manualPhone) return;
    const name = manualName || manualPhone;
    setSmsContacts((prev) => [...prev, { name, phone: manualPhone }]);
    // 새로 추가된 연락처 자동 선택
    setSelectedSmsIndices((prev) => {
      const next = new Set(prev);
      next.add(smsContacts.length);
      return next;
    });
    setManualName("");
    setManualPhone("");
  };

  // 연락처 삭제
  const removeContact = (index: number) => {
    setSmsContacts((prev) => prev.filter((_, i) => i !== index));
    setSelectedSmsIndices((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
  };

  // 검색 필터링된 연락처
  const getFilteredSmsContacts = () => {
    if (!contactSearchQuery) return smsContacts;
    const q = contactSearchQuery.toLowerCase();
    return smsContacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.company && c.company.toLowerCase().includes(q))
    );
  };

  // 다중 SMS 일괄 발송
  const handleBatchSmsSend = async () => {
    const selectedContacts = Array.from(selectedSmsIndices).map(
      (i) => smsContacts[i]
    );
    if (selectedContacts.length === 0) return;

    setIsSending(true);
    setError(null);

    try {
      // 초대 생성 (추적용)
      const invitation = await createInvitation(
        userId,
        "sms",
        undefined,
        selectedContacts.map((c) => c.phone).join(", ")
      );
      const inviteLink = generateInviteLink(invitation.inviteCode);

      const smsBody = encodeURIComponent(
        `${userName}님이 NODDED에 초대했습니다!\n가입 링크: ${inviteLink}`
      );

      // 전화번호 목록 생성
      const phoneNumbers = selectedContacts
        .map((c) => c.phone.replace(/[^0-9+]/g, ""))
        .join(",");

      // iOS / Android SMS 프로토콜 차이 처리
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const separator = isIOS ? "&" : "?";
      window.location.href = `sms:${phoneNumbers}${separator}body=${smsBody}`;

      await loadInvitations();
      onInviteSent?.();

      setShowInviteModal(false);
      resetSmsState();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "초대 발송에 실패했습니다";
      setError(errorMessage);
    } finally {
      setIsSending(false);
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
          `안녕하세요!\n\n${userName}님이 NODDED에 초대했습니다.\n\nNODDED는 신뢰 기반 연구자 네트워킹 플랫폼입니다.\n아래 링크를 통해 가입해주세요:\n\n${inviteLink}\n\n초대 코드: ${invitation.inviteCode}`
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
            `${userName}님이 NODDED에 초대했습니다!\n\n연구자 네트워킹의 새로운 방법을 경험해보세요.\n\n${inviteLink}`
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
      <Card className="px-6 py-8">
        <div className="flex items-center justify-between mb-6 px-1">
          <h3 className="text-base font-medium text-[#8B949E] flex items-center gap-3 pl-1">
            <Users size={20} />
            친구 초대하기
          </h3>
          <span className="text-sm px-3 py-1.5 rounded-lg text-[#58A6FF] bg-[#58A6FF]/10 font-medium">
            무제한 초대 가능
          </span>
        </div>

        {/* 초대 방법 선택 버튼들 - 2x2 균일 그리드, 동일 위계 */}
        <div className="grid grid-cols-2 gap-4 mb-6 px-1">
          <button
            onClick={() => {
              setSelectedMethod("kakao");
              setShowInviteModal(true);
            }}
            className="flex items-center justify-center gap-3 py-5 bg-[#252525] border border-[#363636] rounded-xl text-base font-medium text-[#F0F6FC] hover:border-[#58A6FF] hover:bg-[#2a2a2a] transition-all"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#58A6FF">
              <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.82 5.32 4.55 6.73-.15.54-.82 2.93-.86 3.15 0 0-.02.14.07.19.09.06.2.03.2.03.26-.04 3.04-1.99 3.52-2.32.83.12 1.68.18 2.52.18 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
            </svg>
            카카오톡
          </button>

          <button
            onClick={() => {
              setSelectedMethod("email");
              setShowInviteModal(true);
            }}
            className="flex items-center justify-center gap-3 py-5 bg-[#252525] border border-[#363636] rounded-xl text-base font-medium text-[#F0F6FC] hover:border-[#58A6FF] hover:bg-[#2a2a2a] transition-all"
          >
            <Mail size={22} className="text-[#58A6FF]" />
            이메일
          </button>

          <button
            onClick={() => {
              setSelectedMethod("sms");
              setShowInviteModal(true);
            }}
            className="flex items-center justify-center gap-3 py-5 bg-[#252525] border border-[#363636] rounded-xl text-base font-medium text-[#F0F6FC] hover:border-[#58A6FF] hover:bg-[#2a2a2a] transition-all"
          >
            <MessageCircle size={22} className="text-[#58A6FF]" />
            문자메시지
          </button>

          <button
            onClick={() => {
              setSelectedMethod("link");
              setShowInviteModal(true);
            }}
            className="flex items-center justify-center gap-3 py-5 bg-[#252525] border border-[#363636] rounded-xl text-base font-medium text-[#F0F6FC] hover:border-[#58A6FF] hover:bg-[#2a2a2a] transition-all"
          >
            <Copy size={22} className="text-[#58A6FF]" />
            링크 복사
          </button>
        </div>

        {/* 발송한 초대 목록 - 고도화 */}
        {invitations.length > 0 && (
          <div className="border-t border-[rgba(255,255,255,0.06)] pt-6 mt-2 px-1">
            <h4 className="text-base text-[#8B949E] mb-4 pl-1">보낸 초대</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 bg-[#252525] rounded-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#1E1E1E] rounded-lg text-[#58A6FF]">
                      {getMethodIcon(invitation.method)}
                    </div>
                    <div>
                      <p className="text-base text-white">
                        {invitation.recipientEmail ||
                          invitation.recipientPhone ||
                          "링크 공유"}
                      </p>
                      <p className="text-sm text-[#484F58] mt-1">
                        {invitation.sentAt.toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                  </div>
                  {/* 상태 칩 - 8px 라운드, 눈에 띄는 배경 */}
                  <span className={`
                    inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                    ${invitation.status === 'pending' || invitation.status === 'sent'
                      ? 'bg-[#D29922]/20 text-[#D29922]'
                      : invitation.status === 'accepted'
                        ? 'bg-[#3FB950]/20 text-[#3FB950]'
                        : 'bg-[#F85149]/20 text-[#F85149]'
                    }
                  `}>
                    {getStatusIcon(invitation.status)}
                    {getStatusText(invitation.status)}
                  </span>
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
              className={`bg-[#1E1E1E] rounded-[12px] p-6 w-full border border-[#363636] max-h-[90vh] overflow-y-auto ${
                selectedMethod === "sms" && smsStep !== "source" ? "max-w-md" : "max-w-sm"
              }`}
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
                      <Mail size={20} className="text-[#58A6FF]" />
                      이메일로 초대
                    </>
                  )}
                  {selectedMethod === "sms" && (
                    <>
                      <MessageCircle size={20} className="text-[#58A6FF]" />
                      문자로 초대
                    </>
                  )}
                  {selectedMethod === "link" && (
                    <>
                      <Copy size={20} className="text-[#58A6FF]" />
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
                    resetSmsState();
                  }}
                  className="p-1 text-[#8B949E] hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-[#FF4081]/10 border border-[#FF4081]/30 rounded-[8px]">
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
                  <p className="text-base text-[#8B949E]">
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
                  {/* 로딩 상태 */}
                  {isFetchingContacts && (
                    <div className="flex flex-col items-center py-8 gap-3">
                      <Loader2 size={32} className="animate-spin text-[#58A6FF]" />
                      <p className="text-sm text-[#8B949E]">연락처를 불러오는 중...</p>
                    </div>
                  )}

                  {/* Step 1: 주소록 소스 선택 */}
                  {smsStep === "source" && !isFetchingContacts && (
                    <>
                      <p className="text-sm text-[#8B949E]">
                        연락처를 가져올 주소록을 선택해주세요
                      </p>
                      <div className="space-y-2.5">
                        <button
                          onClick={handlePickPhoneContacts}
                          disabled={!contactPickerSupported}
                          className={`w-full flex items-center gap-3.5 p-3.5 bg-[#252525] border border-[#363636] rounded-xl transition-all text-left ${
                            contactPickerSupported
                              ? "hover:border-[#58A6FF] hover:bg-[#2a2a2a] cursor-pointer"
                              : "opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-[#58A6FF]/15 flex items-center justify-center shrink-0">
                            <Smartphone size={20} className="text-[#58A6FF]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-[15px]">스마트폰 주소록</p>
                            <p className="text-xs text-[#8B949E]">
                              {contactPickerSupported
                                ? "기기에 저장된 연락처에서 선택"
                                : "Android Chrome에서만 사용 가능"}
                            </p>
                          </div>
                          <ChevronRight size={18} className="text-[#484F58] shrink-0" />
                        </button>

                        <button
                          onClick={handleFetchGoogleContacts}
                          className="w-full flex items-center gap-3.5 p-3.5 bg-[#252525] border border-[#363636] rounded-xl hover:border-[#58A6FF] hover:bg-[#2a2a2a] transition-all text-left"
                        >
                          <div className="w-10 h-10 rounded-full bg-[#EA4335]/15 flex items-center justify-center shrink-0">
                            <svg width="20" height="20" viewBox="0 0 24 24">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-[15px]">구글 주소록</p>
                            <p className="text-xs text-[#8B949E]">Google 계정의 연락처 가져오기</p>
                          </div>
                          <ChevronRight size={18} className="text-[#484F58] shrink-0" />
                        </button>

                        <button
                          onClick={() => {
                            setError(null);
                            setSmsStep("naver");
                          }}
                          className="w-full flex items-center gap-3.5 p-3.5 bg-[#252525] border border-[#363636] rounded-xl hover:border-[#58A6FF] hover:bg-[#2a2a2a] transition-all text-left"
                        >
                          <div className="w-10 h-10 rounded-full bg-[#03C75A]/15 flex items-center justify-center shrink-0">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#03C75A">
                              <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z"/>
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-[15px]">네이버 주소록</p>
                            <p className="text-xs text-[#8B949E]">네이버 주소록에서 연락처 가져오기</p>
                          </div>
                          <ChevronRight size={18} className="text-[#484F58] shrink-0" />
                        </button>
                      </div>

                      {/* 구분선 */}
                      <div className="flex items-center gap-3 py-1">
                        <div className="flex-1 h-px bg-[#363636]" />
                        <span className="text-xs text-[#484F58]">또는</span>
                        <div className="flex-1 h-px bg-[#363636]" />
                      </div>

                      {/* 직접 입력 */}
                      <button
                        onClick={() => {
                          setError(null);
                          setSmsStep("manual");
                        }}
                        className="w-full flex items-center gap-3.5 p-3.5 bg-[#252525] border border-[#363636] rounded-xl hover:border-[#58A6FF] hover:bg-[#2a2a2a] transition-all text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#8B949E]/15 flex items-center justify-center shrink-0">
                          <Edit3 size={20} className="text-[#8B949E]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-[15px]">직접 입력</p>
                          <p className="text-xs text-[#8B949E]">전화번호를 직접 입력하여 보내기</p>
                        </div>
                        <ChevronRight size={18} className="text-[#484F58] shrink-0" />
                      </button>
                    </>
                  )}

                  {/* Step 2: 연락처 목록 (다중 선택) */}
                  {smsStep === "contacts" && !isFetchingContacts && (
                    <>
                      {/* 뒤로가기 + 검색 */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSmsStep("source");
                            setSmsContacts([]);
                            setSelectedSmsIndices(new Set());
                            setContactSearchQuery("");
                          }}
                          className="p-1.5 text-[#8B949E] hover:text-white transition-colors"
                        >
                          <ArrowLeft size={20} />
                        </button>
                        <div className="flex-1 relative">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#484F58]" />
                          <input
                            type="text"
                            placeholder="이름 또는 번호 검색..."
                            value={contactSearchQuery}
                            onChange={(e) => setContactSearchQuery(e.target.value)}
                            className="w-full bg-[#252525] border border-[#363636] rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-[#484F58] focus:outline-none focus:border-[#58A6FF]"
                          />
                        </div>
                      </div>

                      {/* 전체 선택 토글 */}
                      <button
                        onClick={() => {
                          const filtered = getFilteredSmsContacts();
                          const allFilteredIndices = filtered.map((c) =>
                            smsContacts.indexOf(c)
                          );
                          const allSelected = allFilteredIndices.every((i) =>
                            selectedSmsIndices.has(i)
                          );
                          if (allSelected) {
                            setSelectedSmsIndices(new Set());
                          } else {
                            setSelectedSmsIndices(new Set(allFilteredIndices));
                          }
                        }}
                        className="flex items-center gap-2 px-1 py-1.5 text-sm text-[#58A6FF] hover:bg-[#58A6FF]/10 rounded-lg transition-colors"
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                          selectedSmsIndices.size === smsContacts.length && smsContacts.length > 0
                            ? "bg-[#58A6FF] border-[#58A6FF]"
                            : "border-[#484F58]"
                        }`}>
                          {selectedSmsIndices.size === smsContacts.length && smsContacts.length > 0 && (
                            <Check size={14} className="text-white" />
                          )}
                        </div>
                        전체 선택 ({smsContacts.length}명)
                      </button>

                      {/* 연락처 리스트 */}
                      <div className="max-h-56 overflow-y-auto space-y-1.5 -mx-1 px-1">
                        {getFilteredSmsContacts().map((contact) => {
                          const realIndex = smsContacts.indexOf(contact);
                          const isSelected = selectedSmsIndices.has(realIndex);
                          return (
                            <button
                              key={realIndex}
                              onClick={() => toggleContactSelection(realIndex)}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                                isSelected
                                  ? "bg-[#58A6FF]/10 border border-[#58A6FF]/30"
                                  : "bg-[#252525] border border-transparent hover:border-[#363636]"
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded flex items-center justify-center border shrink-0 ${
                                  isSelected
                                    ? "bg-[#58A6FF] border-[#58A6FF]"
                                    : "border-[#484F58]"
                                }`}
                              >
                                {isSelected && (
                                  <Check size={14} className="text-white" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white font-medium truncate">
                                  {contact.name}
                                </p>
                                <p className="text-xs text-[#8B949E]">
                                  {contact.phone}
                                </p>
                              </div>
                              {contact.company && (
                                <span className="text-xs text-[#484F58] truncate max-w-[80px]">
                                  {contact.company}
                                </span>
                              )}
                            </button>
                          );
                        })}
                        {getFilteredSmsContacts().length === 0 && (
                          <div className="text-center py-6 text-sm text-[#484F58]">
                            검색 결과가 없습니다
                          </div>
                        )}
                      </div>

                      {/* 수동 추가 영역 */}
                      <div className="pt-3 border-t border-[#363636]">
                        <p className="text-xs text-[#8B949E] mb-2">연락처 직접 추가</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="이름"
                            value={manualName}
                            onChange={(e) => setManualName(e.target.value)}
                            className="w-24 bg-[#252525] border border-[#363636] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#484F58] focus:outline-none focus:border-[#58A6FF]"
                          />
                          <input
                            type="tel"
                            placeholder="010-0000-0000"
                            value={manualPhone}
                            onChange={(e) => setManualPhone(e.target.value)}
                            className="flex-1 bg-[#252525] border border-[#363636] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#484F58] focus:outline-none focus:border-[#58A6FF]"
                          />
                          <button
                            onClick={addManualContact}
                            disabled={!manualPhone}
                            className="px-3 py-2 bg-[#58A6FF] text-white rounded-lg disabled:opacity-40 shrink-0"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>

                      {/* 발송 버튼 */}
                      <Button
                        className="w-full flex items-center justify-center gap-2"
                        onClick={handleBatchSmsSend}
                        disabled={selectedSmsIndices.size === 0 || isSending}
                      >
                        {isSending ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Send size={18} />
                        )}
                        {selectedSmsIndices.size > 0
                          ? `${selectedSmsIndices.size}명에게 문자 보내기`
                          : "연락처를 선택해주세요"}
                      </Button>
                    </>
                  )}

                  {/* 네이버 주소록 스텝 */}
                  {smsStep === "naver" && !isFetchingContacts && (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          onClick={() => setSmsStep("source")}
                          className="p-1.5 text-[#8B949E] hover:text-white transition-colors"
                        >
                          <ArrowLeft size={20} />
                        </button>
                        <h4 className="text-base font-medium text-white">네이버 주소록</h4>
                      </div>

                      <div className="p-4 bg-[#252525] rounded-xl">
                        <p className="text-sm text-[#8B949E] mb-3">
                          네이버 주소록을 열어 연락처를 확인한 후,
                          아래에 전화번호를 입력해주세요.
                        </p>
                        <a
                          href="https://contacts.naver.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#03C75A] text-white rounded-lg text-sm font-medium hover:bg-[#02b351] transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                            <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z"/>
                          </svg>
                          네이버 주소록 열기
                        </a>
                      </div>

                      <div className="space-y-3">
                        <label className="block text-sm text-[#8B949E]">
                          전화번호 입력 (한 줄에 하나씩)
                        </label>
                        <textarea
                          placeholder={"홍길동 010-1234-5678\n김철수 010-9876-5432\n010-5555-6666"}
                          value={naverPasteText}
                          onChange={(e) => setNaverPasteText(e.target.value)}
                          rows={4}
                          className="w-full bg-[#252525] border border-[#363636] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#484F58] focus:outline-none focus:border-[#58A6FF] resize-none"
                        />
                        <Button
                          className="w-full flex items-center justify-center gap-2"
                          onClick={() => {
                            const contacts = parsePhoneNumbers(naverPasteText);
                            if (contacts.length > 0) {
                              setSmsContacts(contacts);
                              setSelectedSmsIndices(
                                new Set(contacts.map((_, i) => i))
                              );
                              setSmsStep("contacts");
                              setError(null);
                            } else {
                              setError("유효한 전화번호를 입력해주세요.");
                            }
                          }}
                          disabled={!naverPasteText.trim()}
                        >
                          <Users size={18} />
                          연락처 추가하기
                        </Button>
                      </div>
                    </>
                  )}

                  {/* 직접 입력 스텝 (여러명 추가) */}
                  {smsStep === "manual" && !isFetchingContacts && (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          onClick={() => {
                            setSmsStep("source");
                            if (smsContacts.length === 0) {
                              setManualName("");
                              setManualPhone("");
                            }
                          }}
                          className="p-1.5 text-[#8B949E] hover:text-white transition-colors"
                        >
                          <ArrowLeft size={20} />
                        </button>
                        <h4 className="text-base font-medium text-white">직접 입력</h4>
                      </div>

                      {/* 추가된 연락처 목록 */}
                      {smsContacts.length > 0 && (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          <p className="text-xs text-[#8B949E]">
                            추가된 연락처 ({smsContacts.length}명)
                          </p>
                          {smsContacts.map((contact, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-3 bg-[#252525] rounded-lg"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm text-white font-medium truncate">
                                  {contact.name}
                                </p>
                                <p className="text-xs text-[#8B949E]">
                                  {contact.phone}
                                </p>
                              </div>
                              <button
                                onClick={() => removeContact(i)}
                                className="p-1.5 text-[#8B949E] hover:text-[#F85149] transition-colors shrink-0"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 새 연락처 추가 폼 */}
                      <div className="space-y-2.5 pt-2">
                        <input
                          type="text"
                          placeholder="이름 (선택사항)"
                          value={manualName}
                          onChange={(e) => setManualName(e.target.value)}
                          className="w-full bg-[#252525] border border-[#363636] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#484F58] focus:outline-none focus:border-[#58A6FF]"
                        />
                        <div className="flex gap-2">
                          <input
                            type="tel"
                            placeholder="010-0000-0000"
                            value={manualPhone}
                            onChange={(e) => setManualPhone(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && manualPhone) {
                                addManualContact();
                              }
                            }}
                            className="flex-1 bg-[#252525] border border-[#363636] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#484F58] focus:outline-none focus:border-[#58A6FF]"
                          />
                          <button
                            onClick={addManualContact}
                            disabled={!manualPhone}
                            className="px-4 py-3 bg-[#58A6FF] text-white rounded-lg text-sm font-medium disabled:opacity-40 shrink-0"
                          >
                            추가
                          </button>
                        </div>
                        <p className="text-xs text-[#484F58]">
                          전화번호 입력 후 &quot;추가&quot; 버튼을 눌러 여러명을 추가할 수 있습니다
                        </p>
                      </div>

                      {/* 일괄 발송 버튼 */}
                      {smsContacts.length > 0 && (
                        <Button
                          className="w-full flex items-center justify-center gap-2 mt-2"
                          onClick={() => {
                            setSelectedSmsIndices(
                              new Set(smsContacts.map((_, i) => i))
                            );
                            handleBatchSmsSend();
                          }}
                          disabled={isSending}
                        >
                          {isSending ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Send size={18} />
                          )}
                          {smsContacts.length}명에게 문자 보내기
                        </Button>
                      )}
                    </>
                  )}
                </div>
              )}

              {selectedMethod === "link" && (
                <div className="space-y-4">
                  {generatedLink ? (
                    <>
                      <div className="p-3 bg-[#252525] rounded-[8px]">
                        <p className="text-sm text-[#8B949E] mb-1">생성된 초대 링크</p>
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
                      <p className="text-base text-[#8B949E]">
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

              <p className="text-sm text-[#8B949E] text-center mt-4">
                초대 횟수 무제한
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
