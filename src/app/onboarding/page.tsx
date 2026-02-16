'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileSetup, { ProfileData } from '@/components/onboarding/ProfileSetup';
import { Input, Button } from '@/components/ui';
import Avatar from '@/components/ui/Avatar';
import {
  registerWithEmail,
  createUser,
  generateInviteCode,
  uploadProfileImage,
  savePublicCard,
  getInvitationByCode,
  acceptInvitation,
  createAutoConnection,
  createConnection,
  getUser,
} from '@/lib/firebase-services';
import { useAuthStore } from '@/store/authStore';
import { useGroupStore } from '@/store/groupStore';
import { User as UserType, Invitation } from '@/types';
import { Mail, Lock, ArrowRight, User, Users, Check, X, Shield, Eye, EyeOff } from 'lucide-react';

type OnboardingStep = 'auth' | 'profile' | 'connection';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();
  const { groups, getNodesInGroup, addNodeToGroup } = useGroupStore();

  const [step, setStep] = useState<OnboardingStep>('auth');
  const [pendingGroupInvite, setPendingGroupInvite] = useState<{ groupId: string; fromUserId: string } | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 일촌 수락 관련 상태
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviterInfo, setInviterInfo] = useState<UserType | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [newUserId, setNewUserId] = useState<string | null>(null);
  const [connectionLoading, setConnectionLoading] = useState(false);

  // 정보 공개 설정
  const [privacyChoices, setPrivacyChoices] = useState({
    nameDisplay: 'full' as 'full' | 'partial',
    companyDisplay: 'full' as 'full' | 'industry' | 'size' | 'hidden',
    positionDisplay: 'full' as 'full' | 'level' | 'hidden',
  });

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setInviteCode(code);
      // 초대자 정보 미리 로드
      loadInviterInfo(code);
    }

    // 그룹 초대 정보 확인
    const pendingInvite = sessionStorage.getItem('pendingGroupInvite');
    if (pendingInvite) {
      try {
        const parsed = JSON.parse(pendingInvite);
        setPendingGroupInvite(parsed);
      } catch (e) {
        sessionStorage.removeItem('pendingGroupInvite');
      }
    }
  }, [searchParams]);

  const loadInviterInfo = async (code: string) => {
    try {
      const inv = await getInvitationByCode(code);
      if (inv) {
        setInvitation(inv);
        const sender = await getUser(inv.senderId);
        if (sender) {
          setInviterInfo(sender);
        }
      }
    } catch (err) {
      console.error('Failed to load inviter info:', err);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다');
      return;
    }

    setStep('profile');
  };

  const handleProfileComplete = async (profile: ProfileData) => {
    setIsLoading(true);
    setError(null);

    try {
      const userCredential = await registerWithEmail(email, password);
      const firebaseUser = userCredential.user;

      let profileImageUrl: string | undefined;
      if (profile.profileImage) {
        profileImageUrl = await uploadProfileImage(firebaseUser.uid, profile.profileImage);
      }

      const userInviteCode = generateInviteCode();

      const newUser = await createUser({
        id: firebaseUser.uid,
        email: email,
        phone: profile.phone,
        name: profile.name,
        company: profile.company,
        position: profile.position,
        companySize: profile.companySize,
        industry: profile.industry,
        positionLevel: profile.positionLevel,
        bio: profile.bio,
        keywords: profile.keywords,
        profileImage: profileImageUrl,
        inviteCode: userInviteCode,
        invitesRemaining: 10,
        invitedBy: invitation?.senderId,
        coffeeStatus: 'available',
        privacySettings: {
          allowProfileDiscovery: profile.privacyConsent.allowProfileDiscovery,
          displaySettings: profile.privacyConsent.displaySettings,
          consentedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Firebase에 공개 명함 자동 저장
      await savePublicCard({
        id: newUser.id,
        name: newUser.name,
        company: newUser.company,
        position: newUser.position,
        email: newUser.email,
        phone: newUser.phone,
        bio: newUser.bio,
        profileImage: newUser.profileImage,
        keywords: newUser.keywords,
      });

      setUser(newUser);
      setNewUserId(firebaseUser.uid);

      // 그룹 초대가 있으면 처리
      if (pendingGroupInvite) {
        try {
          const { groupId, fromUserId } = pendingGroupInvite;
          const memberNodeIds = getNodesInGroup(groupId);

          // 그룹에 새 멤버 추가
          addNodeToGroup(firebaseUser.uid, groupId);

          // 초대한 사람과 인맥 연결
          if (fromUserId && fromUserId !== firebaseUser.uid) {
            await createAutoConnection(firebaseUser.uid, fromUserId);
          }

          // 기존 그룹 멤버들과 인맥 연결
          for (const memberId of memberNodeIds) {
            if (memberId !== firebaseUser.uid && memberId !== fromUserId) {
              await createAutoConnection(firebaseUser.uid, memberId);
            }
          }

          sessionStorage.removeItem('pendingGroupInvite');
          sessionStorage.removeItem('redirectAfterAuth');
          router.push('/network');
          return;
        } catch (err) {
          console.error('Failed to process group invite:', err);
        }
      }

      // 초대 코드가 있고 초대자 정보가 있으면 일촌 수락 단계로
      if (inviteCode && inviterInfo) {
        setStep('connection');
      } else {
        router.push('/network');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('이미 사용 중인 이메일입니다');
        setStep('auth');
      } else {
        setError('가입 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptConnection = async () => {
    if (!newUserId || !inviterInfo || !inviteCode) return;
    setConnectionLoading(true);

    try {
      // 일촌 연결 생성 (바로 accepted)
      await createAutoConnection(inviterInfo.id, newUserId);
      // 초대 수락 처리
      await acceptInvitation(inviteCode, newUserId);
      router.push('/network');
    } catch (err) {
      console.error('Failed to accept connection:', err);
      router.push('/network');
    } finally {
      setConnectionLoading(false);
    }
  };

  const handleRejectConnection = async () => {
    if (!newUserId || !inviteCode) return;
    setConnectionLoading(true);

    try {
      // 초대는 수락 처리하되 (가입은 완료됨) 일촌 연결은 생성하지 않음
      await acceptInvitation(inviteCode, newUserId);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setConnectionLoading(false);
      router.push('/network');
    }
  };

  // Step indicator
  const hasInviteCode = !!inviteCode;
  const steps = [
    { key: 'auth', label: '계정 생성', icon: Mail },
    { key: 'profile', label: '프로필 설정', icon: User },
    ...(hasInviteCode ? [{ key: 'connection', label: '일촌 수락', icon: Users }] : []),
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="min-h-screen bg-[#FAFBFC] flex flex-col items-center justify-center px-8 py-10 relative overflow-hidden">
      {/* Logo Section */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="mb-8 text-center"
      >
        <div className="relative inline-block">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-[#2563EB] via-[#2563EB] to-[#1D4ED8] bg-clip-text text-transparent">
              NODDED
            </span>
          </h1>
        </div>
        <p className="text-[#94A3B8] mt-3 text-base md:text-lg font-medium tracking-wide">
          신뢰 기반 비즈니스 네트워크
        </p>
      </motion.div>

      {/* Step Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-3 mb-10"
      >
        {steps.map((s, index) => {
          const Icon = s.icon;
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;

          return (
            <div key={s.key} className="flex items-center">
              <div
                className={`
                  flex items-center gap-2.5 px-4 py-2 rounded-full text-base font-medium
                  transition-all duration-300
                  ${isActive
                    ? 'bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/50 shadow-[0_0_12px_rgba(37,99,235,0.15)]'
                    : isCompleted
                      ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30'
                      : 'text-[#94A3B8] border border-transparent'}
                `}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-10 h-0.5 mx-3 rounded-full ${isCompleted ? 'bg-[#10B981]' : 'bg-[#E2E8F0]'}`} />
              )}
            </div>
          );
        })}
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {step === 'auth' && (
          <motion.div
            key="auth"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-[400px]"
          >
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] px-6 pt-10 pb-8 shadow-[0_4px_6px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.03)]">
              {/* 초대자 정보 표시 */}
              {inviterInfo && (
                <div className="mb-7 p-5 rounded-[12px] bg-[#2563EB]/5 border border-[#2563EB]/20">
                  <div className="flex items-center gap-3">
                    <Avatar src={inviterInfo.profileImage} name={inviterInfo.name} size="sm" />
                    <div>
                      <p className="text-sm text-[#2563EB]">초대한 사람</p>
                      <p className="text-base text-[#1A1A2E] font-medium">{inviterInfo.name}</p>
                      {inviterInfo.company && (
                        <p className="text-sm text-[#64748B]">{inviterInfo.company} {inviterInfo.position}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="text-center mb-10">
                <h2 className="text-[20px] font-bold text-[#1A1A2E] tracking-tight">
                  계정 생성
                </h2>
                <p className="text-[#94A3B8] text-sm mt-2">
                  NODDED에 오신 것을 환영합니다
                </p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-6">
                <Input
                  type="email"
                  label="이메일"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail size={20} />}
                  required
                />

                <Input
                  type="password"
                  label="비밀번호"
                  placeholder="최소 6자 이상"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock size={20} />}
                  required
                />

                <Input
                  type="password"
                  label="비밀번호 확인"
                  placeholder="비밀번호를 다시 입력해주세요"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock size={20} />}
                  error={error || undefined}
                  required
                />

                <Button
                  type="submit"
                  className="w-full mt-2 relative"
                  size="lg"
                >
                  <span className="text-[16px]">다음</span>
                  <ArrowRight size={18} className="absolute right-6" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}

        {step === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-[480px]"
          >
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] px-6 pt-10 pb-8 shadow-[0_4px_6px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.03)]">
              <ProfileSetup
                onComplete={handleProfileComplete}
                isLoading={isLoading}
                onBack={() => setStep('auth')}
              />
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 text-[#EF4444] text-xs text-center"
                >
                  {error}
                </motion.p>
              )}
            </div>
          </motion.div>
        )}

        {step === 'connection' && inviterInfo && (
          <motion.div
            key="connection"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-[440px]"
          >
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] px-6 pt-10 pb-8 shadow-[0_4px_6px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.03)]">
              <div className="text-center mb-8">
                <h2 className="text-[20px] font-bold text-[#1A1A2E] tracking-tight">
                  일촌 요청
                </h2>
                <p className="text-[#94A3B8] text-sm mt-2">
                  아래 사람과 일촌을 맺으시겠습니까?
                </p>
              </div>

              {/* 초대자 프로필 */}
              <div className="flex flex-col items-center mb-7 p-7 rounded-xl bg-[#F1F3F5] border border-[#E2E8F0]">
                <Avatar src={inviterInfo.profileImage} name={inviterInfo.name} size="lg" hasGlow />
                <h3 className="text-lg font-bold text-[#1A1A2E] mt-3">{inviterInfo.name}</h3>
                {inviterInfo.position && (
                  <p className="text-base text-[#64748B] mt-1">{inviterInfo.position}</p>
                )}
                {inviterInfo.company && (
                  <p className="text-base text-[#64748B]">{inviterInfo.company}</p>
                )}
                {inviterInfo.keywords && inviterInfo.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
                    {inviterInfo.keywords.slice(0, 5).map((kw, i) => (
                      <span key={i} className="px-2 py-0.5 text-sm rounded-full bg-[#2563EB]/10 text-[#2563EB]">
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 내 정보 공개 설정 */}
              <div className="mb-7 p-5 rounded-xl bg-[#F1F3F5] border border-[#E2E8F0]">
                <div className="flex items-center gap-3 mb-5">
                  <Shield size={16} className="text-[#2563EB]" />
                  <h4 className="text-base font-medium text-[#1A1A2E]">내 정보 공개 범위</h4>
                </div>

                <div className="space-y-4">
                  {/* 이름 공개 */}
                  <div className="flex items-center justify-between">
                    <span className="text-base text-[#64748B]">이름</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPrivacyChoices(p => ({ ...p, nameDisplay: 'full' }))}
                        className={`px-3 py-1 text-sm rounded-full transition-all ${
                          privacyChoices.nameDisplay === 'full'
                            ? 'bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/40'
                            : 'bg-[#E2E8F0] text-[#94A3B8]'
                        }`}
                      >
                        전체 공개
                      </button>
                      <button
                        onClick={() => setPrivacyChoices(p => ({ ...p, nameDisplay: 'partial' }))}
                        className={`px-3 py-1 text-sm rounded-full transition-all ${
                          privacyChoices.nameDisplay === 'partial'
                            ? 'bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/40'
                            : 'bg-[#E2E8F0] text-[#94A3B8]'
                        }`}
                      >
                        성만 표시
                      </button>
                    </div>
                  </div>

                  {/* 회사 공개 */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#64748B]">회사</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPrivacyChoices(p => ({ ...p, companyDisplay: 'full' }))}
                        className={`px-3 py-1 text-sm rounded-full transition-all ${
                          privacyChoices.companyDisplay === 'full'
                            ? 'bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/40'
                            : 'bg-[#E2E8F0] text-[#94A3B8]'
                        }`}
                      >
                        공개
                      </button>
                      <button
                        onClick={() => setPrivacyChoices(p => ({ ...p, companyDisplay: 'hidden' }))}
                        className={`px-3 py-1 text-sm rounded-full transition-all ${
                          privacyChoices.companyDisplay === 'hidden'
                            ? 'bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/40'
                            : 'bg-[#E2E8F0] text-[#94A3B8]'
                        }`}
                      >
                        비공개
                      </button>
                    </div>
                  </div>

                  {/* 직책 공개 */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#64748B]">직책</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPrivacyChoices(p => ({ ...p, positionDisplay: 'full' }))}
                        className={`px-3 py-1 text-sm rounded-full transition-all ${
                          privacyChoices.positionDisplay === 'full'
                            ? 'bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/40'
                            : 'bg-[#E2E8F0] text-[#94A3B8]'
                        }`}
                      >
                        공개
                      </button>
                      <button
                        onClick={() => setPrivacyChoices(p => ({ ...p, positionDisplay: 'hidden' }))}
                        className={`px-3 py-1 text-sm rounded-full transition-all ${
                          privacyChoices.positionDisplay === 'hidden'
                            ? 'bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/40'
                            : 'bg-[#E2E8F0] text-[#94A3B8]'
                        }`}
                      >
                        비공개
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 수락/거절 버튼 */}
              <div className="flex gap-3">
                <button
                  onClick={handleRejectConnection}
                  disabled={connectionLoading}
                  className="flex-1 py-4 rounded-lg bg-[#E2E8F0] text-[#64748B] font-medium flex items-center justify-center gap-2 hover:bg-[#CBD5E1] transition-colors"
                >
                  <X size={18} />
                  거절
                </button>
                <button
                  onClick={handleAcceptConnection}
                  disabled={connectionLoading}
                  className="flex-1 py-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  {connectionLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check size={18} />
                      일촌 수락
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Link */}
      {step === 'auth' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-[#94A3B8] text-sm">
            이미 계정이 있으신가요?{' '}
            <button
              onClick={() => router.push('/login')}
              className="text-[#2563EB] underline hover:text-[#2563EB]/80 transition-colors font-medium"
            >
              로그인하기
            </button>
          </p>
        </motion.div>
      )}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
      <div className="text-center">
        <div className="spinner mx-auto mb-4" />
        <p className="text-[#94A3B8]">로딩 중...</p>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OnboardingContent />
    </Suspense>
  );
}
