'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileSetup, { ProfileData } from '@/components/onboarding/ProfileSetup';
import { Input, Button } from '@/components/ui';
import {
  registerWithEmail,
  createUser,
  generateInviteCode,
  uploadProfileImage,
} from '@/lib/firebase-services';
import { useAuthStore } from '@/store/authStore';
import { Mail, Lock, ArrowRight, User } from 'lucide-react';

type OnboardingStep = 'auth' | 'profile';

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
        coffeeStatus: 'available',
        privacySettings: {
          allowProfileDiscovery: profile.privacyConsent.allowProfileDiscovery,
          displaySettings: profile.privacyConsent.displaySettings,
          consentedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      setUser(newUser);
      router.push('/card');
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
    { key: 'auth', label: '계정 생성', icon: Mail },
    { key: 'profile', label: '프로필 설정', icon: User },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="min-h-screen bg-[#0B162C] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="stars-bg" />

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-[#86C9F2]/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-[#2C529C]/10 rounded-full blur-[100px]" />

      {/* Logo Section */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="mb-8 text-center"
      >
        <div className="relative inline-block">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-[#86C9F2] via-[#86C9F2] to-[#2C529C] bg-clip-text text-transparent">
              NODDED
            </span>
          </h1>
          <div className="absolute inset-0 bg-gradient-to-r from-[#86C9F2]/20 to-[#2C529C]/20 blur-2xl -z-10" />
        </div>
        <p className="text-[#4A5E7A] mt-3 text-sm md:text-base font-medium tracking-wide">
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
                    ? 'bg-[#86C9F2]/20 text-[#86C9F2] border border-[#86C9F2]/40'
                    : isCompleted
                      ? 'bg-[#00E676]/20 text-[#00E676]'
                      : 'text-[#4A5E7A]'}
                `}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 h-px mx-2 ${isCompleted ? 'bg-[#00E676]' : 'bg-[#1E3A5F]'}`} />
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
            <div className="bg-[#101D33]/80 backdrop-blur-2xl border border-[#1E3A5F]/60 rounded-2xl p-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  계정 생성
                </h2>
                <p className="text-[#4A5E7A] text-sm mt-2">
                  NODDED에 오신 것을 환영합니다
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

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#86C9F2] to-[#2C529C] hover:from-[#86C9F2] hover:to-[#8B7EFF]"
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
            <div className="bg-[#101D33]/80 backdrop-blur-2xl border border-[#1E3A5F]/60 rounded-2xl p-8">
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
      {step === 'auth' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-[#4A5E7A] text-sm">
            이미 계정이 있으신가요?
          </p>
          <button
            onClick={() => router.push('/login')}
            className="mt-2 inline-flex items-center gap-2 text-[#86C9F2] hover:text-[#86C9F2]/80 transition-colors text-sm font-medium group"
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
    <div className="min-h-screen bg-[#0B162C] flex items-center justify-center">
      <div className="text-center">
        <div className="spinner mx-auto mb-4" />
        <p className="text-[#4A5E7A]">로딩 중...</p>
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
