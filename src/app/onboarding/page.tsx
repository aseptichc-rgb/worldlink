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
} from '@/lib/firebase-services';
import { useAuthStore } from '@/store/authStore';
import { Mail, Lock } from 'lucide-react';

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
        name: profile.name,
        company: profile.company,
        position: profile.position,
        bio: profile.bio,
        keywords: profile.keywords,
        profileImage: profileImageUrl,
        inviteCode: userInviteCode,
        invitesRemaining: 3,
        invitedBy: inviterId,
        coffeeStatus: 'available',
      });

      await useInviteCode(inviteCode, firebaseUser.uid);

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

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="stars-bg" />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <h1 className="text-4xl md:text-5xl font-bold gradient-text breathing">
          NEXUS
        </h1>
        <p className="text-[#8B949E] mt-2 text-sm md:text-base">
          신뢰 기반 비즈니스 네트워크
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {step === 'invite' && (
          <motion.div
            key="invite"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md"
          >
            <InviteCodeInput onValidCode={handleValidCode} />
          </motion.div>
        )}

        {step === 'auth' && (
          <motion.div
            key="auth"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md"
          >
            <div className="glass rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-bold text-white mb-2 text-center">
                계정 생성
              </h2>
              <p className="text-[#8B949E] text-sm text-center mb-6">
                NEXUS에 오신 것을 환영합니다
              </p>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
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
                  className="w-full"
                  size="lg"
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md"
          >
            <div className="glass rounded-2xl p-6 md:p-8">
              <ProfileSetup
                onComplete={handleProfileComplete}
                isLoading={isLoading}
              />
              {error && (
                <p className="mt-4 text-[#FF4081] text-sm text-center">{error}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {step === 'invite' && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-[#8B949E] text-sm"
        >
          이미 계정이 있으신가요?{' '}
          <button
            onClick={() => router.push('/login')}
            className="text-[#00E5FF] hover:underline"
          >
            로그인
          </button>
        </motion.p>
      )}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="spinner mx-auto mb-4" />
        <p className="text-[#8B949E]">로딩 중...</p>
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
