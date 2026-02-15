'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, User, Network, X, UserPlus, Users, Share2, Mail, Copy, Check, MessageCircle, Link2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useGroupStore } from '@/store/groupStore';
import { Avatar } from '@/components/ui';
import { createInvitation, generateInviteLink } from '@/lib/firebase-services';
import { loadKakaoSDK, sendKakaoInvite } from '@/lib/kakao-sdk';

interface NavItem {
  path: string;
  icon: typeof QrCode;
  label: string;
  requiresAuth: boolean;
  isInvite?: boolean;
}

const navItems: NavItem[] = [
  { path: '/card', icon: QrCode, label: '내 명함', requiresAuth: true },
  { path: '/network', icon: Network, label: '인맥', requiresAuth: true },
  { path: '/invite', icon: UserPlus, label: '초대하기', requiresAuth: true, isInvite: true },
  { path: '/profile', icon: User, label: '프로필', requiresAuth: true },
];

type InviteMethod = 'email' | 'kakao' | 'sms' | 'link';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { groups, getNodesInGroup, openGroupInviteModal } = useGroupStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [targetPath, setTargetPath] = useState('');

  // 초대 관련 상태
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteStep, setInviteStep] = useState<'select' | 'personal' | 'group'>('select');
  const [selectedMethod, setSelectedMethod] = useState<InviteMethod | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');

  const handleNavClick = (path: string, requiresAuth: boolean, isInvite?: boolean) => {
    if (requiresAuth && !isAuthenticated) {
      setTargetPath(path);
      setShowAuthModal(true);
      return;
    }
    if (isInvite) {
      setShowInviteModal(true);
      setInviteStep('select');
      return;
    }
    router.push(path);
  };

  const resetInviteModal = () => {
    setShowInviteModal(false);
    setInviteStep('select');
    setSelectedMethod(null);
    setEmail('');
    setPhone('');
    setGeneratedLink('');
    setCopied(false);
  };

  const handleSendPersonalInvite = async () => {
    if (!selectedMethod || !user) return;

    setIsSending(true);
    try {
      const invitation = await createInvitation(
        user.id,
        selectedMethod,
        selectedMethod === 'email' ? email : undefined,
        selectedMethod === 'sms' || selectedMethod === 'kakao' ? phone : undefined
      );

      const inviteLink = generateInviteLink(invitation.inviteCode);
      setGeneratedLink(inviteLink);

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

      if (selectedMethod === 'email') {
        const subject = encodeURIComponent(`${user.name}님이 NODDED에 초대했습니다`);
        const body = encodeURIComponent(
          `안녕하세요!\n\n${user.name}님이 NODDED에 초대했습니다.\n\n아래 링크를 통해 가입해주세요:\n\n${inviteLink}`
        );
        window.open(`mailto:${email}?subject=${subject}&body=${body}`);
      } else if (selectedMethod === 'kakao') {
        try {
          await loadKakaoSDK();
          sendKakaoInvite({ senderName: user.name, inviteLink });
        } catch {
          await copyToClipboard(`${user.name}님이 NODDED에 초대했습니다!\n\n${inviteLink}`);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          window.open('kakaotalk://');
        }
      } else if (selectedMethod === 'sms') {
        const smsBody = encodeURIComponent(`${user.name}님이 NODDED에 초대했습니다!\n가입 링크: ${inviteLink}`);
        window.location.href = `sms:${phone}?body=${smsBody}`;
      } else if (selectedMethod === 'link') {
        await copyToClipboard(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }

      if (selectedMethod !== 'link') {
        resetInviteModal();
      }
    } catch (err) {
      console.error('Invite failed:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectGroup = (groupId: string) => {
    resetInviteModal();
    openGroupInviteModal(groupId);
  };

  const handleAuth = () => {
    sessionStorage.setItem('redirectAfterAuth', targetPath);
    router.push('/onboarding');
    setShowAuthModal(false);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[rgba(13,17,23,0.95)] backdrop-blur-xl border-t border-[rgba(240,246,252,0.05)] safe-area-bottom">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = item.isInvite ? showInviteModal : pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path, item.requiresAuth, item.isInvite)}
                className="relative flex flex-col items-center justify-center w-16 h-full"
              >
                <Icon
                  size={22}
                  className={`transition-colors duration-200 ${isActive ? 'text-[#58A6FF]' : 'text-[#484F58]'}`}
                />
                <span
                  className={`text-sm mt-1 transition-colors duration-200 ${
                    isActive ? 'text-[#58A6FF]' : 'text-[#484F58]'
                  }`}
                >
                  {item.label}
                </span>
                {isActive && !item.isInvite && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-0 w-6 h-0.5 rounded-full bg-[#58A6FF] shadow-[0_0_8px_rgba(88,166,255,0.5)]"
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[rgba(1,4,9,0.85)] backdrop-blur-sm flex items-end"
            onClick={() => setShowAuthModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-[rgba(22,27,34,0.95)] backdrop-blur-xl rounded-t-2xl border-t border-[rgba(240,246,252,0.1)] px-8 py-6"
            >
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 p-2"
              >
                <X size={20} className="text-[#8B949E]" />
              </button>

              <div className="w-12 h-1 bg-[#30363D] rounded-full mx-auto mb-6" />

              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[rgba(88,166,255,0.15)] to-[rgba(31,111,235,0.15)] flex items-center justify-center">
                  <UserPlus size={28} className="text-[#58A6FF]" />
                </div>
                <h3 className="text-xl font-semibold text-[#F0F6FC] mb-2">
                  로그인이 필요해요
                </h3>
                <p className="text-base text-[#8B949E]">
                  내 명함을 만들고 네트워크를 확장하려면<br />
                  간단한 가입이 필요해요
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleAuth}
                  className="w-full py-4 bg-[#58A6FF] text-[#0D1117] font-semibold rounded-xl"
                >
                  30초만에 가입하기
                </button>
                <button
                  onClick={() => {
                    router.push('/login');
                    setShowAuthModal(false);
                  }}
                  className="w-full py-4 bg-[rgba(22,27,34,0.7)] text-[#F0F6FC] font-medium rounded-xl border border-[#30363D]"
                >
                  이미 계정이 있어요
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[rgba(1,4,9,0.85)] backdrop-blur-sm flex items-end"
            onClick={resetInviteModal}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-[rgba(22,27,34,0.95)] backdrop-blur-xl rounded-t-2xl border-t border-[rgba(240,246,252,0.1)] px-8 py-6 max-h-[80vh] overflow-y-auto"
            >
              <button
                onClick={resetInviteModal}
                className="absolute top-4 right-4 p-2"
              >
                <X size={20} className="text-[#8B949E]" />
              </button>

              <div className="w-12 h-1 bg-[#30363D] rounded-full mx-auto mb-6" />

              {inviteStep === 'select' && (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[rgba(88,166,255,0.15)] to-[rgba(31,111,235,0.15)] flex items-center justify-center">
                      <UserPlus size={28} className="text-[#58A6FF]" />
                    </div>
                    <h3 className="text-xl font-semibold text-[#F0F6FC] mb-2">
                      초대하기
                    </h3>
                    <p className="text-base text-[#8B949E]">
                      새로운 인맥을 초대해보세요
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => setInviteStep('personal')}
                      className="w-full py-4 bg-[#58A6FF] text-[#0D1117] font-semibold rounded-xl flex items-center justify-center gap-3"
                    >
                      <User size={20} />
                      개인 초대하기
                    </button>
                    <button
                      onClick={() => setInviteStep('group')}
                      className="w-full py-4 bg-[rgba(22,27,34,0.7)] text-[#F0F6FC] font-medium rounded-xl border border-[#30363D] flex items-center justify-center gap-3"
                    >
                      <Users size={20} />
                      그룹으로 초대하기
                    </button>
                    <p className="text-xs text-[#484F58] text-center pt-2">
                      그룹 초대 시 초대받은 분은 그룹원 전체와 자동으로 인맥이 됩니다
                    </p>
                  </div>
                </>
              )}

              {inviteStep === 'personal' && (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <button
                      onClick={() => { setInviteStep('select'); setSelectedMethod(null); }}
                      className="p-2 text-[#8B949E] hover:text-white"
                    >
                      <X size={18} />
                    </button>
                    <h3 className="text-lg font-semibold text-[#F0F6FC]">
                      개인 초대하기
                    </h3>
                  </div>

                  {!selectedMethod ? (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setSelectedMethod('kakao')}
                        className="flex flex-col items-center justify-center gap-2 py-5 bg-[#FEE500]/10 border border-[#FEE500]/30 rounded-xl"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#FEE500">
                          <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.82 5.32 4.55 6.73-.15.54-.82 2.93-.86 3.15 0 0-.02.14.07.19.09.06.2.03.2.03.26-.04 3.04-1.99 3.52-2.32.83.12 1.68.18 2.52.18 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
                        </svg>
                        <span className="text-sm text-[#FEE500]">카카오톡</span>
                      </button>
                      <button
                        onClick={() => setSelectedMethod('email')}
                        className="flex flex-col items-center justify-center gap-2 py-5 bg-[#58A6FF]/10 border border-[#58A6FF]/30 rounded-xl"
                      >
                        <Mail size={24} className="text-[#58A6FF]" />
                        <span className="text-sm text-[#58A6FF]">이메일</span>
                      </button>
                      <button
                        onClick={() => setSelectedMethod('sms')}
                        className="flex flex-col items-center justify-center gap-2 py-5 bg-[#3FB950]/10 border border-[#3FB950]/30 rounded-xl"
                      >
                        <MessageCircle size={24} className="text-[#3FB950]" />
                        <span className="text-sm text-[#3FB950]">문자</span>
                      </button>
                      <button
                        onClick={() => setSelectedMethod('link')}
                        className="flex flex-col items-center justify-center gap-2 py-5 bg-[#A371F7]/10 border border-[#A371F7]/30 rounded-xl"
                      >
                        <Link2 size={24} className="text-[#A371F7]" />
                        <span className="text-sm text-[#A371F7]">링크 복사</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedMethod === 'email' && (
                        <>
                          <input
                            type="email"
                            placeholder="friend@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-[#0D1117] border border-[#30363D] rounded-xl text-white placeholder-[#484F58] focus:outline-none focus:border-[#58A6FF]"
                          />
                          <button
                            onClick={handleSendPersonalInvite}
                            disabled={!email || isSending}
                            className="w-full py-3 bg-[#58A6FF] text-white font-medium rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <Mail size={18} />
                            이메일로 초대하기
                          </button>
                        </>
                      )}

                      {selectedMethod === 'kakao' && (
                        <button
                          onClick={handleSendPersonalInvite}
                          disabled={isSending}
                          className="w-full py-3 bg-[#FEE500] text-[#3C1E1E] font-medium rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.82 5.32 4.55 6.73-.15.54-.82 2.93-.86 3.15 0 0-.02.14.07.19.09.06.2.03.2.03.26-.04 3.04-1.99 3.52-2.32.83.12 1.68.18 2.52.18 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
                          </svg>
                          카카오톡으로 초대하기
                        </button>
                      )}

                      {selectedMethod === 'sms' && (
                        <>
                          <input
                            type="tel"
                            placeholder="010-1234-5678"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-3 bg-[#0D1117] border border-[#30363D] rounded-xl text-white placeholder-[#484F58] focus:outline-none focus:border-[#58A6FF]"
                          />
                          <button
                            onClick={handleSendPersonalInvite}
                            disabled={!phone || isSending}
                            className="w-full py-3 bg-[#3FB950] text-white font-medium rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <MessageCircle size={18} />
                            문자로 초대하기
                          </button>
                        </>
                      )}

                      {selectedMethod === 'link' && (
                        <>
                          {generatedLink ? (
                            <div className="space-y-3">
                              <div className="p-3 bg-[#0D1117] border border-[#30363D] rounded-xl">
                                <p className="text-xs text-[#484F58] mb-1">초대 링크</p>
                                <p className="text-sm text-white break-all">{generatedLink}</p>
                              </div>
                              <button
                                onClick={async () => {
                                  await navigator.clipboard.writeText(generatedLink);
                                  setCopied(true);
                                  setTimeout(() => setCopied(false), 2000);
                                }}
                                className="w-full py-3 bg-[#A371F7] text-white font-medium rounded-xl flex items-center justify-center gap-2"
                              >
                                {copied ? <Check size={18} /> : <Copy size={18} />}
                                {copied ? '복사됨!' : '다시 복사하기'}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={handleSendPersonalInvite}
                              disabled={isSending}
                              className="w-full py-3 bg-[#A371F7] text-white font-medium rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              <Link2 size={18} />
                              초대 링크 생성하기
                            </button>
                          )}
                        </>
                      )}

                      <button
                        onClick={() => { setSelectedMethod(null); setGeneratedLink(''); }}
                        className="w-full py-2 text-[#8B949E] text-sm"
                      >
                        다른 방법으로 초대
                      </button>
                    </div>
                  )}
                </>
              )}

              {inviteStep === 'group' && (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <button
                      onClick={() => setInviteStep('select')}
                      className="p-2 text-[#8B949E] hover:text-white"
                    >
                      <X size={18} />
                    </button>
                    <h3 className="text-lg font-semibold text-[#F0F6FC]">
                      그룹으로 초대하기
                    </h3>
                  </div>

                  <div className="bg-[#58A6FF]/10 border border-[#58A6FF]/20 rounded-xl p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <UserPlus size={18} className="text-[#58A6FF] mt-0.5" />
                      <div>
                        <p className="text-sm text-[#58A6FF] font-medium">자동 인맥 연결</p>
                        <p className="text-xs text-[#8B949E] mt-1">
                          그룹으로 초대하면 초대받은 분이 그룹원 전체와 자동으로 서로 인맥이 됩니다
                        </p>
                      </div>
                    </div>
                  </div>

                  {groups.length === 0 ? (
                    <div className="text-center py-8">
                      <Users size={32} className="text-[#484F58] mx-auto mb-3" />
                      <p className="text-[#8B949E] mb-4">아직 그룹이 없습니다</p>
                      <button
                        onClick={() => {
                          resetInviteModal();
                          router.push('/network');
                        }}
                        className="px-4 py-2 bg-[#58A6FF] text-white text-sm font-medium rounded-lg"
                      >
                        그룹 만들러 가기
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {groups.map((group) => {
                        const memberCount = getNodesInGroup(group.id).length;
                        return (
                          <button
                            key={group.id}
                            onClick={() => handleSelectGroup(group.id)}
                            className="w-full flex items-center gap-3 p-4 bg-[#0D1117] border border-[#30363D] rounded-xl hover:border-[#58A6FF] transition-colors"
                          >
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                              style={{ backgroundColor: group.color + '20' }}
                            >
                              {group.icon}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-white font-medium">{group.name}</p>
                              <p className="text-xs text-[#8B949E]">
                                {memberCount}명의 멤버
                              </p>
                            </div>
                            <Share2 size={18} className="text-[#58A6FF]" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
