'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui';
import { loginWithEmail, getUser } from '@/lib/firebase-services';
import { useAuthStore } from '@/store/authStore';
import { DEMO_MEMBERS, DEMO_ACCOUNT_INDEX } from '@/lib/demo-seed-data';

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

  const handleDemoLogin = () => {
    const demo = DEMO_MEMBERS[DEMO_ACCOUNT_INDEX];
    const demoUser = {
      id: demo.id,
      name: demo.name,
      email: demo.email,
      phone: demo.phone,
      company: demo.company,
      position: demo.position,
      bio: demo.bio,
      keywords: demo.keywords,
      category: demo.category,
      profileImage: `/faces/${demo.name}.jpg`,
      inviteCode: 'DEMO-001',
      invitesRemaining: 999,
      coffeeStatus: 'available' as const,
      privacySettings: {
        allowProfileDiscovery: true,
        displaySettings: {
          nameDisplay: 'full' as const,
          companyDisplay: 'full' as const,
          positionDisplay: 'full' as const,
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setUser(demoUser);
    localStorage.setItem('nodded_demo_mode', 'true');
    router.push('/network');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // 데모 계정 로그인: Firebase 없이 로컬 데모 데이터 사용
    if (email === 'demo@nodded.app' && password === 'demo1234') {
      handleDemoLogin();
      setIsLoading(false);
      return;
    }

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

        // 초대 링크 등에서 리디렉션 경로가 있으면 해당 경로로 이동
        const redirectPath = sessionStorage.getItem('redirectAfterAuth');
        if (redirectPath) {
          sessionStorage.removeItem('redirectAfterAuth');
          router.push(redirectPath);
        } else {
          router.push('/network');
        }
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
        className="w-full max-w-[440px] px-12 z-10"
      >
        <div>
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
            <form onSubmit={handleSubmit} className="space-y-7">
              {/* Email */}
              <div>
                <label className="block text-[13px] font-medium text-[#8B949E] mb-3 pl-1 tracking-wide">
                  이메일
                </label>
                {/* 외부 컨테이너 */}
                <div className="relative bg-[#161B22] rounded-2xl p-2.5 transition-all duration-300 ease-out">
                  {/* 내부 입력창 */}
                  <div className={`bg-[#21262D] rounded-xl h-[48px] pl-5 pr-4 flex items-center transition-all duration-300 ${emailFocused ? 'bg-[#282E36] ring-1 ring-[#30363D]' : ''}`}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      placeholder="email@example.com"
                      required
                      className="flex-1 bg-transparent border-0 text-[#FFFFFF] h-full text-base font-medium focus:outline-none placeholder:text-[#484F58] pl-2"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="pt-10">
                <label className="block text-[13px] font-medium text-[#8B949E] mb-3 pl-1 tracking-wide">
                  비밀번호
                </label>
                {/* 외부 컨테이너 */}
                <div className="relative bg-[#161B22] rounded-2xl p-2.5 transition-all duration-300 ease-out">
                  {/* 내부 입력창 */}
                  <div className={`bg-[#21262D] rounded-xl h-[48px] pl-5 pr-4 flex items-center transition-all duration-300 ${passwordFocused ? 'bg-[#282E36] ring-1 ring-[#30363D]' : ''}`}>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      placeholder="••••••••"
                      required
                      className="flex-1 bg-transparent border-0 text-[#FFFFFF] h-full text-base font-medium focus:outline-none placeholder:text-[#484F58] pl-2"
                    />
                  </div>
                </div>
                {error && (
                  <p className="mt-3 text-sm text-[#F85149] pl-1">{error}</p>
                )}
              </div>

              {/* Remember Me - custom checkbox */}
              <label className="flex items-center gap-3 py-3 mt-2 cursor-pointer select-none group">
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center border transition-all duration-200 ${
                    rememberMe
                      ? 'bg-[#58A6FF] border-[#58A6FF]'
                      : 'bg-transparent border-[#30363D] group-hover:border-[#484F58]'
                  }`}
                >
                  {rememberMe && <Check size={14} className="text-white" strokeWidth={3} />}
                </div>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="hidden"
                />
                <span className="text-base text-[#8B949E] group-hover:text-[#F0F6FC] transition-colors">로그인 정보 저장</span>
              </label>

              {/* Login Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full py-4 text-base font-semibold"
                  size="lg"
                  isLoading={isLoading}
                  rightIcon={!isLoading ? <ArrowRight size={18} /> : undefined}
                >
                  로그인
                </Button>
              </div>
            </form>

            {/* Demo Login */}
            <div className="mt-8">
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full py-3 rounded-xl border border-[#30363D] bg-[#161B22] text-[#8B949E] hover:text-[#F0F6FC] hover:border-[#58A6FF]/50 hover:bg-[#1C2128] transition-all text-sm font-medium"
              >
                데모 계정으로 체험하기
              </button>
            </div>

            {/* Sign Up */}
            <div className="text-center mt-10 pt-10 border-t border-[rgba(240,246,252,0.05)]">
              <p className="text-sm text-[#30363D] mb-4">
                아직 계정이 없으신가요?
              </p>
              <button
                onClick={() => router.push('/onboarding')}
                className="inline-flex items-center gap-2 text-[#7EE0FF] hover:text-white transition-colors text-base font-medium group"
              >
                <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
                회원가입하기
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
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
