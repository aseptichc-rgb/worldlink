'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Play, Check } from 'lucide-react';
import { Button } from '@/components/ui';
import { loginWithEmail, getUser } from '@/lib/firebase-services';
import { useAuthStore } from '@/store/authStore';
import { User } from '@/types';

const STORAGE_KEY = 'nodded_saved_credentials';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFBFC]" />}>
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
  const [rememberMe, setRememberMe] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { email: savedEmail, password: savedPassword } = JSON.parse(saved);
        if (savedEmail) setEmail(savedEmail);
        if (savedPassword) setPassword(savedPassword);
        setRememberMe(true);
      }
    } catch (e) {
      console.error('Failed to load saved credentials:', e);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const userCredential = await loginWithEmail(email, password);
      const userData = await getUser(userCredential.user.uid);

      if (userData) {
        if (rememberMe) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ email, password }));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
        setUser(userData);
        router.push('/network');
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
    router.push('/network');
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative mb-12 text-center z-10"
      >
        <h1 className="text-5xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-b from-[#1A1A2E] to-[#2563EB] bg-clip-text text-transparent">
            NODDED
          </span>
        </h1>
        <p className="text-[#94A3B8] mt-2 text-sm font-medium tracking-[0.2em] uppercase">
          신뢰 기반 비즈니스 네트워크
        </p>
      </motion.div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[380px] z-10"
      >
        <div className="relative bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-[0_4px_6px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.03)]">
          <div className="relative">
            {/* Title */}
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-[#1A1A2E] mb-1">
                다시 만나서 반갑습니다
              </h2>
              <p className="text-sm text-[#94A3B8]">
                네트워크로 돌아가기
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-2 uppercase tracking-wider">
                  이메일
                </label>
                <div className={`relative rounded-lg transition-all duration-300 ${emailFocused ? 'shadow-[0_0_0_3px_rgba(37,99,235,0.15)]' : ''}`}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    placeholder="email@example.com"
                    required
                    className="w-full bg-[#F8F9FA] border border-[#E2E8F0] text-[#1A1A2E] rounded-lg py-3.5 px-4 text-[15px] transition-all duration-300 focus:outline-none focus:border-[rgba(37,99,235,0.4)] placeholder:text-[#94A3B8] hover:border-[#CBD5E1]"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-2 uppercase tracking-wider">
                  비밀번호
                </label>
                <div className={`relative rounded-lg transition-all duration-300 ${passwordFocused ? 'shadow-[0_0_0_3px_rgba(37,99,235,0.15)]' : ''}`}>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-[#F8F9FA] border border-[#E2E8F0] text-[#1A1A2E] rounded-lg py-3.5 px-4 text-[15px] transition-all duration-300 focus:outline-none focus:border-[rgba(37,99,235,0.4)] placeholder:text-[#94A3B8] hover:border-[#CBD5E1]"
                  />
                </div>
                {error && (
                  <p className="mt-2 text-xs text-[#EF4444]">{error}</p>
                )}
              </div>

              {/* Remember Me - custom checkbox */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                <div
                  className={`w-[18px] h-[18px] rounded flex items-center justify-center border transition-all duration-200 ${
                    rememberMe
                      ? 'bg-[#2563EB] border-[#2563EB]'
                      : 'bg-transparent border-[#E2E8F0] group-hover:border-[#94A3B8]'
                  }`}
                  onClick={() => setRememberMe(!rememberMe)}
                >
                  {rememberMe && <Check size={12} className="text-white" strokeWidth={3} />}
                </div>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="hidden"
                />
                <span className="text-sm text-[#64748B] group-hover:text-[#1A1A2E] transition-colors">로그인 정보 저장</span>
              </label>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full py-3.5 text-[15px] font-semibold"
                size="lg"
                isLoading={isLoading}
                rightIcon={!isLoading ? <ArrowRight size={16} /> : undefined}
              >
                로그인
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#E2E8F0] to-transparent" />
              <span className="text-xs text-[#94A3B8] uppercase tracking-wider">또는</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#E2E8F0] to-transparent" />
            </div>

            {/* Demo Button */}
            <button
              onClick={handleDemoMode}
              className="w-full py-3 rounded-lg bg-[rgba(37,99,235,0.06)] border border-[rgba(37,99,235,0.15)] text-[#2563EB] text-sm font-medium flex items-center justify-center gap-2 hover:bg-[rgba(37,99,235,0.12)] hover:border-[rgba(37,99,235,0.3)] transition-all duration-300"
            >
              <Play size={15} fill="currentColor" />
              데모로 체험하기
            </button>

            {/* Sign Up */}
            <div className="text-center mt-6 pt-6 border-t border-[#E2E8F0]">
              <p className="text-xs text-[#94A3B8] mb-2.5">
                아직 계정이 없으신가요?
              </p>
              <button
                onClick={() => router.push('/onboarding')}
                className="inline-flex items-center gap-1.5 text-[#60A5FA] hover:text-[#2563EB] transition-colors text-sm font-medium group"
              >
                <Sparkles size={13} className="group-hover:rotate-12 transition-transform" />
                회원가입하기
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-[10px] text-[#94A3B8] text-center z-10 tracking-wide"
      >
        로그인 시 서비스 이용약관 및 개인정보처리방침에 동의합니다
      </motion.p>
    </div>
  );
}
