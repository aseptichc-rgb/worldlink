'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock } from 'lucide-react';
import { Input, Button } from '@/components/ui';
import { loginWithEmail, getUser } from '@/lib/firebase-services';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
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
        router.push('/network');
      } else {
        setError('사용자 정보를 찾을 수 없습니다');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Stars Background */}
      <div className="stars-bg" />

      {/* Logo */}
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

      {/* Login Form */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="glass rounded-2xl p-6 md:p-8">
          <h2 className="text-xl font-bold text-white mb-2 text-center">
            다시 만나서 반갑습니다
          </h2>
          <p className="text-[#8B949E] text-sm text-center mb-6">
            네트워크로 돌아가기
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock size={18} />}
              error={error || undefined}
              required
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              로그인
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#8B949E] text-sm">
              아직 계정이 없으신가요?{' '}
              <button
                onClick={() => router.push('/onboarding')}
                className="text-[#00E5FF] hover:underline"
              >
                초대 코드로 가입
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
