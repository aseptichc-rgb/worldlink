'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import InviteCodeInput from '@/components/onboarding/InviteCodeInput';
import ProfileSetup, { ProfileData } from '@/components/onboarding/ProfileSetup';
import { Input, Button } from '@/components/ui';
import {
  registerWithEmail,
  createUser,
  useInviteCode,
  createConnection,
  generateInviteCode,
  uploadProfileImage,
  acceptInvitation,
} from '@/lib/firebase-services';
import { useAuthStore } from '@/store/authStore';
import { Mail, Lock, ArrowRight, ArrowLeft, User, Sparkles } from 'lucide-react';

type OnboardingStep = 'invite' | 'auth' | 'profile';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, inviteCode: storedInviteCode } = useAuthStore();

  const [step, setStep] = useState<OnboardingStep>('invite');
  const [inviteCode, setInviteCode] = useState('');
  const [inviterId, setInviterId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode) {
      setInviteCode(urlCode);
    } else if (storedInviteCode) {
      setInviteCode(storedInviteCode);
    }
  }, [searchParams, storedInviteCode]);

  const handleValidCode = (code: string, inviter: string) => {
    setInviteCode(code);
    setInviterId(inviter);
    setStep('auth');
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
        bio: profile.bio,
        keywords: profile.keywords,
        profileImage: profileImageUrl,
        inviteCode: userInviteCode,
        invitesRemaining: 10,
        invitedBy: inviterId,
        coffeeStatus: 'available',
      });

      await useInviteCode(inviteCode, firebaseUser.uid);
      await acceptInvitation(inviteCode, firebaseUser.uid);

      if (inviterId) {
        await createConnection(inviterId, firebaseUser.uid, 'invite');
      }

      setUser(newUser);
      router.push('/network');
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

  // Step indicator
  const steps = [
    { key: 'invite', label: '초대 코드', icon: Sparkles },
    { key: 'auth', label: '계정 생성', icon: Mail },
    { key: 'profile', label: '프로필 설정', icon: User },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="stars-bg" />

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-[#00E5FF]/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-[#7B68EE]/10 rounded-full blur-[100px]" />

      {/* Logo Section */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="mb-8 text-center"
      >
        <div className="relative inline-block">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-[#00D9FF] via-[#00E5FF] to-[#7B68EE] bg-clip-text text-transparent">
              NEXUS
            </span>
          </h1>
          <div className="absolute inset-0 bg-gradient-to-r from-[#00E5FF]/20 to-[#7B68EE]/20 blur-2xl -z-10" />
        </div>
        <p className="text-[#6E7681] mt-3 text-sm md:text-base font-medium tracking-wide">
          신뢰 기반 비즈니스 네트워크
        </p>
      </motion.div>

      {/* Step Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-2 mb-8"
      >
        {steps.map((s, index) => {
          const Icon = s.icon;
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;

          return (
            <div key={s.key} className="flex items-center">
              <div
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
                  transition-all duration-300
                  ${isActive
                    ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40'
                    : isCompleted
                      ? 'bg-[#00E676]/20 text-[#00E676]'
                      : 'text-[#484F58]'}
                `}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 h-px mx-2 ${isCompleted ? 'bg-[#00E676]' : 'bg-[#21262D]'}`} />
              )}
            </div>
          );
        })}
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {step === 'invite' && (
          <motion.div
            key="invite"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-[420px]"
          >
            <div className="bg-[#0D1117]/80 backdrop-blur-2xl border border-[#21262D]/60 rounded-2xl p-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  초대 코드 입력
                </h2>
                <p className="text-[#6E7681] text-sm mt-2">
                  초대받은 코드를 입력해주세요
                </p>
              </div>

              <InviteCodeInput onValidCode={handleValidCode} />
            </div>
          </motion.div>
        )}

        {step === 'auth' && (
          <motion.div
            key="auth"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-[400px]"
          >
            <div className="bg-[#0D1117]/80 backdrop-blur-2xl border border-[#21262D]/60 rounded-2xl p-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  계정 생성
                </h2>
                <p className="text-[#6E7681] text-sm mt-2">
                  NEXUS에 오신 것을 환영합니다
                </p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-5">
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

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    size="lg"
                    leftIcon={<ArrowLeft size={18} />}
                    onClick={() => setStep('invite')}
                  >
                    이전
                  </Button>
                  <Button
                    type="submit"
                    className="flex-[2] bg-gradient-to-r from-[#00D9FF] to-[#7B68EE] hover:from-[#00E5FF] hover:to-[#8B7EFF]"
                    size="lg"
                    rightIcon={<ArrowRight size={18} />}
                  >
                    다음
                  </Button>
                </div>
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
            <div className="bg-[#0D1117]/80 backdrop-blur-2xl border border-[#21262D]/60 rounded-2xl p-8">
              <ProfileSetup
                onComplete={handleProfileComplete}
                isLoading={isLoading}
                onBack={() => setStep('auth')}
              />
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 text-[#FF5252] text-sm text-center"
                >
                  {error}
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Link */}
      {step === 'invite' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-[#6E7681] text-sm">
            이미 계정이 있으신가요?
          </p>
          <button
            onClick={() => router.push('/login')}
            className="mt-2 inline-flex items-center gap-2 text-[#00E5FF] hover:text-[#00E5FF]/80 transition-colors text-sm font-medium group"
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
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
      <div className="text-center">
        <div className="spinner mx-auto mb-4" />
        <p className="text-[#6E7681]">로딩 중...</p>
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
