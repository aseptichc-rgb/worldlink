'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Play } from 'lucide-react';
import { Input, Button } from '@/components/ui';
import { loginWithEmail, loginWithCustomToken, getUser, createUser, generateInviteCode } from '@/lib/firebase-services';
import { useAuthStore } from '@/store/authStore';
import { User } from '@/types';

const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;

function getRedirectUri() {
  return typeof window !== 'undefined' ? `${window.location.origin}/login` : '';
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B162C]" />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'kakao' | 'naver' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // OAuth callback 처리
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) return;

    // state가 있으면 네이버, 없으면 카카오
    if (state) {
      handleNaverCallback(code, state);
    } else {
      handleKakaoCallback(code);
    }
  }, [searchParams]);

  const handleKakaoCallback = async (code: string) => {
    setSocialLoading('kakao');
    setError(null);
    try {
      const res = await fetch('/api/auth/kakao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri: getRedirectUri() }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '카카오 로그인 실패');
      }

      const data = await res.json();
      await handleSocialLoginSuccess(data);
    } catch (err: any) {
      console.error('Kakao callback error:', err);
      setError(err.message || '카카오 로그인 중 오류가 발생했습니다');
    } finally {
      setSocialLoading(null);
      // URL에서 code 파라미터 제거
      window.history.replaceState({}, '', '/login');
    }
  };

  const handleNaverCallback = async (code: string, state: string) => {
    setSocialLoading('naver');
    setError(null);
    try {
      const res = await fetch('/api/auth/naver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri: getRedirectUri(), state }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '네이버 로그인 실패');
      }

      const data = await res.json();
      await handleSocialLoginSuccess(data);
    } catch (err: any) {
      console.error('Naver callback error:', err);
      setError(err.message || '네이버 로그인 중 오류가 발생했습니다');
    } finally {
      setSocialLoading(null);
      window.history.replaceState({}, '', '/login');
    }
  };

  const handleSocialLoginSuccess = async (data: {
    customToken: string;
    user: { name: string; email: string; profileImage: string };
    isNewUser: boolean;
    uid: string;
  }) => {
    // Firebase Custom Token으로 로그인
    await loginWithCustomToken(data.customToken);

    // Firestore에서 사용자 정보 조회
    const existingUser = await getUser(data.uid);

    if (existingUser) {
      // 기존 사용자 - 바로 메인으로
      setUser(existingUser);
      router.push('/card');
    } else {
      // 신규 사용자 - Firestore에 기본 정보 생성 후 온보딩으로
      const newUser = await createUser({
        id: data.uid,
        name: data.user.name,
        email: data.user.email,
        profileImage: data.user.profileImage,
        keywords: [],
        inviteCode: generateInviteCode(),
        invitesRemaining: 10,
        coffeeStatus: 'available',
      });
      setUser(newUser);
      router.push('/onboarding?social=true');
    }
  };

  const handleKakaoLogin = () => {
    if (!KAKAO_CLIENT_ID) {
      setError('카카오 로그인 설정이 되어있지 않습니다');
      return;
    }
    const redirectUri = getRedirectUri();
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
    window.location.href = kakaoAuthUrl;
  };

  const handleNaverLogin = () => {
    if (!NAVER_CLIENT_ID) {
      setError('네이버 로그인 설정이 되어있지 않습니다');
      return;
    }
    const redirectUri = getRedirectUri();
    const state = Math.random().toString(36).substring(2, 15);
    const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?client_id=${NAVER_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}`;
    window.location.href = naverAuthUrl;
  };

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
      id: 'demo-user-001',
      name: '김데모',
      email: 'demo@nexus.app',
      phone: '010-1234-5678',
      company: 'NODDED',
      position: 'Product Manager',
      bio: '네트워킹을 좋아하는 PM입니다',
      keywords: ['스타트업', 'PM', '네트워킹', 'AI'],
      inviteCode: 'DEMO2024',
      invitesRemaining: 10,
      coffeeStatus: 'available',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setUser(demoUser);
    router.push('/card');
  };

  const isSocialLoading = socialLoading !== null;

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
        className="mb-10 text-center"
      >
        <div className="relative inline-block">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-[#86C9F2] via-[#86C9F2] to-[#2C529C] bg-clip-text text-transparent">
              NODDED
            </span>
          </h1>
          {/* Subtle glow effect - 절제된 방식 */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#86C9F2]/20 to-[#2C529C]/20 blur-2xl -z-10" />
        </div>
        <p className="text-[#4A5E7A] mt-3 text-sm md:text-base font-medium tracking-wide">
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
        <div className="bg-[#101D33]/80 backdrop-blur-2xl border border-[#1E3A5F]/60 rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-white tracking-tight">
              다시 만나서 반갑습니다
            </h2>
            <p className="text-[#4A5E7A] text-sm mt-2">
              네트워크로 돌아가기
            </p>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            {/* 카카오 로그인 */}
            <button
              onClick={handleKakaoLogin}
              disabled={isSocialLoading || isLoading}
              className="w-full py-3 rounded-xl bg-[#FEE500] text-[#191919] font-semibold flex items-center justify-center gap-2 hover:bg-[#FEE500]/90 transition-colors disabled:opacity-50"
            >
              {socialLoading === 'kakao' ? (
                <div className="w-5 h-5 border-2 border-[#191919]/30 border-t-[#191919] rounded-full animate-spin" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 3C5.58172 3 2 5.79086 2 9.20988C2 11.3175 3.38093 13.1671 5.49419 14.2392L4.58065 17.5929C4.52006 17.8131 4.76688 17.9893 4.95938 17.8615L8.84062 15.2613C9.22014 15.3096 9.60711 15.3348 10 15.3348C14.4183 15.3348 18 12.5439 18 9.12494C18 5.79086 14.4183 3 10 3Z" fill="#191919"/>
                </svg>
              )}
              카카오로 시작하기
            </button>

            {/* 네이버 로그인 */}
            <button
              onClick={handleNaverLogin}
              disabled={isSocialLoading || isLoading}
              className="w-full py-3 rounded-xl bg-[#03C75A] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#03C75A]/90 transition-colors disabled:opacity-50"
            >
              {socialLoading === 'naver' ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M13.5615 10.5077L6.11077 3H3V17H6.43846V9.49231L13.8892 17H17V3H13.5615V10.5077Z" fill="white"/>
                </svg>
              )}
              네이버로 시작하기
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[#1E3A5F]" />
            <span className="text-[#4A5E7A] text-xs">또는 이메일로 로그인</span>
            <div className="flex-1 h-px bg-[#1E3A5F]" />
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
              className="w-full mt-2 bg-gradient-to-r from-[#86C9F2] to-[#2C529C] hover:from-[#86C9F2] hover:to-[#8B7EFF] transition-all duration-300"
              size="lg"
              isLoading={isLoading}
              rightIcon={!isLoading ? <ArrowRight size={18} /> : undefined}
            >
              로그인
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-[#1E3A5F]" />
            <span className="text-[#4A5E7A] text-xs">또는</span>
            <div className="flex-1 h-px bg-[#1E3A5F]" />
          </div>

          {/* Demo Mode Button */}
          <button
            onClick={handleDemoMode}
            className="w-full py-3 rounded-xl bg-[#2C529C]/20 border border-[#2C529C]/40 text-[#2C529C] font-medium flex items-center justify-center gap-2 hover:bg-[#2C529C]/30 transition-colors"
          >
            <Play size={18} />
            데모로 체험하기
          </button>

          {/* Sign Up Link */}
          <div className="text-center mt-4">
            <p className="text-[#4A5E7A] text-sm">
              아직 계정이 없으신가요?
            </p>
            <button
              onClick={() => router.push('/onboarding')}
              className="mt-2 inline-flex items-center gap-2 text-[#86C9F2] hover:text-[#86C9F2]/80 transition-colors text-sm font-medium group"
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
        className="mt-8 text-[#4A5E7A] text-xs text-center"
      >
        로그인 시 서비스 이용약관 및 개인정보처리방침에 동의합니다
      </motion.p>
    </div>
  );
}
