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
    <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Ambient background layers */}
      <div className="absolute inset-0">
        {/* Top gradient orb */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.12, 0.18, 0.12] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#58A6FF] rounded-full blur-[150px]"
        />
        {/* Bottom-left accent */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.14, 0.08] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-[#7EE0FF] rounded-full blur-[130px]"
        />
        {/* Bottom-right accent */}
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.06, 0.1, 0.06] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          className="absolute -bottom-20 -right-20 w-[300px] h-[300px] bg-[#1F6FEB] rounded-full blur-[120px]"
        />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(88,166,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(88,166,255,0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative mb-12 text-center z-10"
      >
        <h1 className="text-5xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-b from-white via-[#58A6FF] to-[#1F6FEB] bg-clip-text text-transparent">
            NODDED
          </span>
        </h1>
        <p className="text-[#484F58] mt-2 text-sm font-medium tracking-[0.2em] uppercase">
          신뢰 기반 비즈니스 네트워크
        </p>
      </motion.div>

      {/* Login Card - Glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[380px] z-10"
      >
        <div className="relative bg-[rgba(22,27,34,0.6)] backdrop-blur-2xl border border-[rgba(240,246,252,0.08)] rounded-2xl px-9 py-10 shadow-[0_16px_64px_rgba(0,0,0,0.4)]">
          {/* Subtle card inner glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[rgba(88,166,255,0.04)] to-transparent pointer-events-none" />

          <div className="relative">
            {/* Title */}
            <div className="text-center mb-10">
              <h2 className="text-xl font-semibold text-[#F0F6FC] mb-3">
                다시 만나서 반갑습니다
              </h2>
              <p className="text-sm text-[#484F58]">
                네트워크로 돌아가기
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-[#8B949E] mb-3 uppercase tracking-wider">
                  이메일
                </label>
                <div className={`relative rounded-lg transition-all duration-300 ${emailFocused ? 'shadow-[0_0_0_2px_rgba(88,166,255,0.3)]' : ''}`}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    placeholder="email@example.com"
                    required
                    className="w-full bg-[rgba(13,17,23,0.8)] border border-[rgba(240,246,252,0.08)] text-[#F0F6FC] rounded-lg py-4 px-5 text-[15px] transition-all duration-300 focus:outline-none focus:border-[rgba(88,166,255,0.4)] placeholder:text-[#30363D] hover:border-[rgba(240,246,252,0.15)]"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-[#8B949E] mb-3 uppercase tracking-wider">
                  비밀번호
                </label>
                <div className={`relative rounded-lg transition-all duration-300 ${passwordFocused ? 'shadow-[0_0_0_2px_rgba(88,166,255,0.3)]' : ''}`}>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-[rgba(13,17,23,0.8)] border border-[rgba(240,246,252,0.08)] text-[#F0F6FC] rounded-lg py-4 px-5 text-[15px] transition-all duration-300 focus:outline-none focus:border-[rgba(88,166,255,0.4)] placeholder:text-[#30363D] hover:border-[rgba(240,246,252,0.15)]"
                  />
                </div>
                {error && (
                  <p className="mt-3 text-xs text-[#F85149] px-1">{error}</p>
                )}
              </div>

              {/* Remember Me - custom checkbox */}
              <label className="flex items-center gap-2.5 py-1 cursor-pointer select-none group">
                <div
                  className={`w-[18px] h-[18px] rounded flex items-center justify-center border transition-all duration-200 ${
                    rememberMe
                      ? 'bg-[#58A6FF] border-[#58A6FF]'
                      : 'bg-transparent border-[#30363D] group-hover:border-[#484F58]'
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
                <span className="text-sm text-[#8B949E] group-hover:text-[#F0F6FC] transition-colors">로그인 정보 저장</span>
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
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[rgba(240,246,252,0.08)] to-transparent" />
              <span className="text-xs text-[#30363D] uppercase tracking-wider">또는</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[rgba(240,246,252,0.08)] to-transparent" />
            </div>

            {/* Demo Button */}
            <button
              onClick={handleDemoMode}
              className="w-full py-3.5 rounded-lg bg-[rgba(88,166,255,0.06)] border border-[rgba(88,166,255,0.15)] text-[#58A6FF] text-sm font-medium flex items-center justify-center gap-2 hover:bg-[rgba(88,166,255,0.12)] hover:border-[rgba(88,166,255,0.3)] transition-all duration-300"
            >
              <Play size={15} fill="currentColor" />
              데모로 체험하기
            </button>

            {/* Sign Up */}
            <div className="text-center mt-8 pt-8 border-t border-[rgba(240,246,252,0.05)]">
              <p className="text-xs text-[#30363D] mb-3">
                아직 계정이 없으신가요?
              </p>
              <button
                onClick={() => router.push('/onboarding')}
                className="inline-flex items-center gap-1.5 text-[#7EE0FF] hover:text-white transition-colors text-sm font-medium group"
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
        className="mt-10 text-[10px] text-[#30363D] text-center z-10 tracking-wide py-2"
      >
        로그인 시 서비스 이용약관 및 개인정보처리방침에 동의합니다
      </motion.p>
    </div>
  );
}
