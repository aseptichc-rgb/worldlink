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
import { User as UserType, Invitation } from '@/types';
import { Mail, Lock, ArrowRight, User, Users, Check, X, Shield, Eye, EyeOff } from 'lucide-react';

type OnboardingStep = 'auth' | 'profile' | 'connection';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();

  const [step, setStep] = useState<OnboardingStep>('auth');
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
    <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-center px-8 py-10 relative overflow-hidden">
      {/* Background Effects */}
      <div className="stars-bg" />

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-[#58A6FF]/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-[#1F6FEB]/10 rounded-full blur-[100px]" />

      {/* Logo Section */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="mb-8 text-center"
      >
        <div className="relative inline-block">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-[#58A6FF] via-[#58A6FF] to-[#1F6FEB] bg-clip-text text-transparent">
              NODDED
            </span>
          </h1>
          <div className="absolute inset-0 bg-gradient-to-r from-[#58A6FF]/20 to-[#1F6FEB]/20 blur-2xl -z-10" />
        </div>
        <p className="text-[#484F58] mt-3 text-base md:text-lg font-medium tracking-wide">
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
                    ? 'bg-[#58A6FF]/20 text-[#58A6FF] border border-[#58A6FF]/50 shadow-[0_0_12px_rgba(88,166,255,0.2)]'
                    : isCompleted
                      ? 'bg-[#3FB950]/20 text-[#3FB950] border border-[#3FB950]/30'
                      : 'text-[#484F58] border border-transparent'}
                `}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-10 h-0.5 mx-3 rounded-full ${isCompleted ? 'bg-[#3FB950]' : 'bg-[#30363D]'}`} />
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
            <div className="bg-[#161B22]/80 backdrop-blur-2xl border border-[#30363D]/60 rounded-xl px-10 py-10">
              {/* 초대자 정보 표시 */}
              {inviterInfo && (
                <div className="mb-7 p-5 rounded-xl bg-[#58A6FF]/5 border border-[#58A6FF]/20">
                  <div className="flex items-center gap-3">
                    <Avatar src={inviterInfo.profileImage} name={inviterInfo.name} size="sm" />
                    <div>
                      <p className="text-sm text-[#58A6FF]">초대한 사람</p>
                      <p className="text-base text-white font-medium">{inviterInfo.name}</p>
                      {inviterInfo.company && (
                        <p className="text-sm text-[#8B949E]">{inviterInfo.company} {inviterInfo.position}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="text-center mb-10">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  계정 생성
                </h2>
                <p className="text-[#484F58] text-base mt-2">
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
                  leftIcon={<Mail size={18} />}
                  required
                />

                <Input
                  type="password"
                  label="비밀번호"
                  placeholder="최소 6자 이상"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock size={18} />}
                  required
                />

                <Input
                  type="password"
                  label="비밀번호 확인"
                  placeholder="비밀번호를 다시 입력해주세요"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock size={18} />}
                  error={error || undefined}
                  required
                />

                <Button
                  type="submit"
                  className="w-full mt-2 bg-gradient-to-r from-[#58A6FF] to-[#1F6FEB] hover:from-[#58A6FF] hover:to-[#8B7EFF]"
                  size="lg"
                  rightIcon={<ArrowRight size={18} />}
                >
                  다음
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
            <div className="bg-[#161B22]/80 backdrop-blur-2xl border border-[#30363D]/60 rounded-xl px-10 py-10">
              <ProfileSetup
                onComplete={handleProfileComplete}
                isLoading={isLoading}
                onBack={() => setStep('auth')}
              />
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 text-[#F85149] text-sm text-center"
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
            <div className="bg-[#161B22]/80 backdrop-blur-2xl border border-[#30363D]/60 rounded-xl px-10 py-10">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  일촌 요청
                </h2>
                <p className="text-[#484F58] text-base mt-2">
                  아래 사람과 일촌을 맺으시겠습니까?
                </p>
              </div>

              {/* 초대자 프로필 */}
              <div className="flex flex-col items-center mb-7 p-7 rounded-xl bg-[#1C2333] border border-[#30363D]">
                <Avatar src={inviterInfo.profileImage} name={inviterInfo.name} size="lg" hasGlow />
                <h3 className="text-lg font-bold text-white mt-3">{inviterInfo.name}</h3>
                {inviterInfo.position && (
                  <p className="text-base text-[#8B949E] mt-1">{inviterInfo.position}</p>
                )}
                {inviterInfo.company && (
                  <p className="text-base text-[#8B949E]">{inviterInfo.company}</p>
                )}
                {inviterInfo.keywords && inviterInfo.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
                    {inviterInfo.keywords.slice(0, 5).map((kw, i) => (
                      <span key={i} className="px-2 py-0.5 text-sm rounded-full bg-[#58A6FF]/10 text-[#58A6FF]">
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 내 정보 공개 설정 */}
              <div className="mb-7 p-5 rounded-xl bg-[#1C2333] border border-[#30363D]">
                <div className="flex items-center gap-3 mb-5">
                  <Shield size={16} className="text-[#58A6FF]" />
                  <h4 className="text-base font-medium text-white">내 정보 공개 범위</h4>
                </div>

                <div className="space-y-4">
                  {/* 이름 공개 */}
                  <div className="flex items-center justify-between">
                    <span className="text-base text-[#8B949E]">이름</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPrivacyChoices(p => ({ ...p, nameDisplay: 'full' }))}
                        className={`px-3 py-1 text-sm rounded-full transition-all ${
                          privacyChoices.nameDisplay === 'full'
                            ? 'bg-[#58A6FF]/20 text-[#58A6FF] border border-[#58A6FF]/40'
                            : 'bg-[#30363D] text-[#484F58]'
                        }`}
                      >
                        전체 공개
                      </button>
                      <button
                        onClick={() => setPrivacyChoices(p => ({ ...p, nameDisplay: 'partial' }))}
                        className={`px-3 py-1 text-sm rounded-full transition-all ${
                          privacyChoices.nameDisplay === 'partial'
                            ? 'bg-[#58A6FF]/20 text-[#58A6FF] border border-[#58A6FF]/40'
                            : 'bg-[#30363D] text-[#484F58]'
                        }`}
                      >
                        성만 표시
                      </button>
                    </div>
                  </div>

                  {/* 회사 공개 */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#8B949E]">회사</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPrivacyChoices(p => ({ ...p, companyDisplay: 'full' }))}
                        className={`px-3 py-1 text-sm rounded-full transition-all ${
                          privacyChoices.companyDisplay === 'full'
                            ? 'bg-[#58A6FF]/20 text-[#58A6FF] border border-[#58A6FF]/40'
                            : 'bg-[#30363D] text-[#484F58]'
                        }`}
                      >
                        공개
                      </button>
                      <button
                        onClick={() => setPrivacyChoices(p => ({ ...p, companyDisplay: 'hidden' }))}
                        className={`px-3 py-1 text-sm rounded-full transition-all ${
                          privacyChoices.companyDisplay === 'hidden'
                            ? 'bg-[#58A6FF]/20 text-[#58A6FF] border border-[#58A6FF]/40'
                            : 'bg-[#30363D] text-[#484F58]'
                        }`}
                      >
                        비공개
                      </button>
                    </div>
                  </div>

                  {/* 직책 공개 */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#8B949E]">직책</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPrivacyChoices(p => ({ ...p, positionDisplay: 'full' }))}
                        className={`px-3 py-1 text-sm rounded-full transition-all ${
                          privacyChoices.positionDisplay === 'full'
                            ? 'bg-[#58A6FF]/20 text-[#58A6FF] border border-[#58A6FF]/40'
                            : 'bg-[#30363D] text-[#484F58]'
                        }`}
                      >
                        공개
                      </button>
                      <button
                        onClick={() => setPrivacyChoices(p => ({ ...p, positionDisplay: 'hidden' }))}
                        className={`px-3 py-1 text-sm rounded-full transition-all ${
                          privacyChoices.positionDisplay === 'hidden'
                            ? 'bg-[#58A6FF]/20 text-[#58A6FF] border border-[#58A6FF]/40'
                            : 'bg-[#30363D] text-[#484F58]'
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
                  className="flex-1 py-4 rounded-lg bg-[#30363D] text-[#8B949E] font-medium flex items-center justify-center gap-2 hover:bg-[#253D5E] transition-colors"
                >
                  <X size={18} />
                  거절
                </button>
                <button
                  onClick={handleAcceptConnection}
                  disabled={connectionLoading}
                  className="flex-1 py-4 rounded-lg bg-gradient-to-r from-[#58A6FF] to-[#1F6FEB] text-white font-medium flex items-center justify-center gap-2"
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
          <p className="text-[#484F58] text-base">
            이미 계정이 있으신가요?
          </p>
          <button
            onClick={() => router.push('/login')}
            className="mt-2 inline-flex items-center gap-2 text-[#58A6FF] hover:text-[#58A6FF]/80 transition-colors text-base font-medium group"
          >
            로그인하기
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      )}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
      <div className="text-center">
        <div className="spinner mx-auto mb-4" />
        <p className="text-[#484F58]">로딩 중...</p>
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
