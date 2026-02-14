'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Play } from 'lucide-react';
import { Input, Button } from '@/components/ui';
import { loginWithEmail, getUser } from '@/lib/firebase-services';
import { useAuthStore } from '@/store/authStore';
import { User } from '@/types';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0D1117]" />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const userCredential = await loginWithEmail(email, password);
      const userData = await getUser(userCredential.user.uid);

      if (userData) {
        setUser(userData);
        router.push('/card');
      } else {
        setError('사용자 정보를 찾을 수 없습니다');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('이메일 또는 비밀번호가 올바르지 않습니다');
      } else if (err.code === 'auth/invalid-email') {
        setError('올바른 이메일 형식을 입력해주세요');
      } else {
        setError('로그인 중 오류가 발생했습니다');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 데모 모드로 진입
  const handleDemoMode = () => {
    const demoUser: User = {
      id: 'member_8',
      name: '김재영',
      email: 'kjykjj04@naver.com',
      phone: '010-8286-0906',
      company: '아셉틱 /오크우드봄의원',
      position: '심사역 /내과 원장',
      bio: '"ASEPTIC GROUP"은 바이오-헬스케어 분야를 주력으로 투자하는 Startup Studio입니다.',
      keywords: ['투자', '디지털헬스', '내과', 'AI'],
      profileImage: '/faces/김재영.jpg',
      inviteCode: 'INV-008',
      invitesRemaining: 999,
      coffeeStatus: 'available',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setUser(demoUser);
    router.push('/card');
  };

  return (
    <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-center p-6 relative overflow-hidden">
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
        className="mb-10 text-center"
      >
        <div className="relative inline-block">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-[#58A6FF] via-[#58A6FF] to-[#1F6FEB] bg-clip-text text-transparent">
              NODDED
            </span>
          </h1>
          {/* Subtle glow effect - 절제된 방식 */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#58A6FF]/20 to-[#1F6FEB]/20 blur-2xl -z-10" />
        </div>
        <p className="text-[#484F58] mt-3 text-sm md:text-base font-medium tracking-wide">
          신뢰 기반 비즈니스 네트워크
        </p>
      </motion.div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-[400px]"
      >
        <div className="bg-[#161B22]/80 backdrop-blur-2xl border border-[#30363D]/60 rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-white tracking-tight">
              다시 만나서 반갑습니다
            </h2>
            <p className="text-[#484F58] text-sm mt-2">
              네트워크로 돌아가기
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              type="email"
              label="이메일"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              type="password"
              label="비밀번호"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error || undefined}
              required
            />

            <Button
              type="submit"
              className="w-full mt-2 bg-gradient-to-r from-[#58A6FF] to-[#1F6FEB] hover:from-[#58A6FF] hover:to-[#8B7EFF] transition-all duration-300"
              size="lg"
              isLoading={isLoading}
              rightIcon={!isLoading ? <ArrowRight size={18} /> : undefined}
            >
              로그인
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-[#30363D]" />
            <span className="text-[#484F58] text-xs">또는</span>
            <div className="flex-1 h-px bg-[#30363D]" />
          </div>

          {/* Demo Mode Button */}
          <button
            onClick={handleDemoMode}
            className="w-full py-3 rounded-xl bg-[#1F6FEB]/20 border border-[#1F6FEB]/40 text-[#1F6FEB] font-medium flex items-center justify-center gap-2 hover:bg-[#1F6FEB]/30 transition-colors"
          >
            <Play size={18} />
            데모로 체험하기
          </button>

          {/* Sign Up Link */}
          <div className="text-center mt-4">
            <p className="text-[#484F58] text-sm">
              아직 계정이 없으신가요?
            </p>
            <button
              onClick={() => router.push('/onboarding')}
              className="mt-2 inline-flex items-center gap-2 text-[#58A6FF] hover:text-[#58A6FF]/80 transition-colors text-sm font-medium group"
            >
              <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />
              회원가입하기
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 text-[#484F58] text-xs text-center"
      >
        로그인 시 서비스 이용약관 및 개인정보처리방침에 동의합니다
      </motion.p>
    </div>
  );
}
