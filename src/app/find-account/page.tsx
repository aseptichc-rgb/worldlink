'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Mail, KeyRound, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { findEmailByNameAndPhone, sendPasswordReset } from '@/lib/firebase-services';

type Tab = 'find-id' | 'reset-password';

export default function FindAccountPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('find-id');

  // 아이디 찾기
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [foundEmail, setFoundEmail] = useState<string | null>(null);
  const [findError, setFindError] = useState<string | null>(null);
  const [findLoading, setFindLoading] = useState(false);

  // 비밀번호 재설정
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const formatPhone = (value: string) => {
    const nums = value.replace(/\D/g, '');
    if (nums.length <= 3) return nums;
    if (nums.length <= 7) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
    return `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7, 11)}`;
  };

  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (local.length <= 2) return `${local[0]}*@${domain}`;
    return `${local.slice(0, 2)}${'*'.repeat(local.length - 2)}@${domain}`;
  };

  const handleFindId = async (e: React.FormEvent) => {
    e.preventDefault();
    setFindError(null);
    setFoundEmail(null);
    setFindLoading(true);

    try {
      const email = await findEmailByNameAndPhone(name, phone);
      if (email) {
        setFoundEmail(email);
      } else {
        setFindError('일치하는 계정을 찾을 수 없습니다');
      }
    } catch {
      setFindError('조회 중 오류가 발생했습니다');
    } finally {
      setFindLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSent(false);
    setResetLoading(true);

    try {
      await sendPasswordReset(resetEmail);
      setResetSent(true);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setResetError('등록되지 않은 이메일입니다');
      } else if (err.code === 'auth/invalid-email') {
        setResetError('올바른 이메일 형식을 입력해주세요');
      } else {
        setResetError('이메일 발송 중 오류가 발생했습니다');
      }
    } finally {
      setResetLoading(false);
    }
  };

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    setFindError(null);
    setFoundEmail(null);
    setResetError(null);
    setResetSent(false);
  };

  return (
    <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.12, 0.18, 0.12] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#58A6FF] rounded-full blur-[150px]"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.14, 0.08] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-[#7EE0FF] rounded-full blur-[130px]"
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(88,166,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(88,166,255,0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => router.push('/login')}
        className="absolute top-12 left-6 z-20 flex items-center gap-2 text-[#8B949E] hover:text-[#F0F6FC] transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="text-sm">로그인으로 돌아가기</span>
      </motion.button>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[440px] z-10"
      >
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-[#F0F6FC] mb-2">계정 찾기</h1>
          <p className="text-sm text-[#484F58]">아이디 또는 비밀번호를 찾을 수 있습니다</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#161B22] rounded-2xl p-1.5 mb-8">
          <button
            onClick={() => switchTab('find-id')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === 'find-id'
                ? 'bg-[#21262D] text-[#F0F6FC] shadow-lg'
                : 'text-[#484F58] hover:text-[#8B949E]'
            }`}
          >
            <Search size={16} />
            아이디 찾기
          </button>
          <button
            onClick={() => switchTab('reset-password')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === 'reset-password'
                ? 'bg-[#21262D] text-[#F0F6FC] shadow-lg'
                : 'text-[#484F58] hover:text-[#8B949E]'
            }`}
          >
            <KeyRound size={16} />
            비밀번호 찾기
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'find-id' ? (
            <motion.div
              key="find-id"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {!foundEmail ? (
                <form onSubmit={handleFindId} className="space-y-6">
                  <p className="text-sm text-[#8B949E] mb-2">
                    가입 시 등록한 이름과 전화번호를 입력하면 이메일을 찾을 수 있습니다.
                  </p>

                  {/* Name */}
                  <div>
                    <label className="block text-[13px] font-medium text-[#8B949E] mb-3 pl-1 tracking-wide">
                      이름
                    </label>
                    <div className="relative bg-[#161B22] rounded-2xl p-2.5">
                      <div className="bg-[#21262D] rounded-xl h-[48px] pl-5 pr-4 flex items-center focus-within:bg-[#282E36] focus-within:ring-1 focus-within:ring-[#30363D] transition-all duration-300">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="홍길동"
                          required
                          className="flex-1 bg-transparent border-0 text-[#FFFFFF] h-full text-base font-medium focus:outline-none placeholder:text-[#484F58] pl-2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-[13px] font-medium text-[#8B949E] mb-3 pl-1 tracking-wide">
                      전화번호
                    </label>
                    <div className="relative bg-[#161B22] rounded-2xl p-2.5">
                      <div className="bg-[#21262D] rounded-xl h-[48px] pl-5 pr-4 flex items-center focus-within:bg-[#282E36] focus-within:ring-1 focus-within:ring-[#30363D] transition-all duration-300">
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(formatPhone(e.target.value))}
                          placeholder="010-1234-5678"
                          required
                          maxLength={13}
                          className="flex-1 bg-transparent border-0 text-[#FFFFFF] h-full text-base font-medium focus:outline-none placeholder:text-[#484F58] pl-2"
                        />
                      </div>
                    </div>
                  </div>

                  {findError && (
                    <p className="text-sm text-[#F85149] pl-1">{findError}</p>
                  )}

                  <div className="pt-2">
                    <Button
                      type="submit"
                      className="w-full py-4 text-base font-semibold"
                      size="lg"
                      isLoading={findLoading}
                      rightIcon={!findLoading ? <Search size={18} /> : undefined}
                    >
                      아이디 찾기
                    </Button>
                  </div>
                </form>
              ) : (
                /* Found Email Result */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6"
                >
                  <div className="w-16 h-16 rounded-full bg-[#238636]/20 flex items-center justify-center mx-auto mb-6">
                    <Check size={32} className="text-[#3FB950]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#F0F6FC] mb-2">
                    계정을 찾았습니다
                  </h3>
                  <p className="text-sm text-[#8B949E] mb-6">
                    가입된 이메일 주소입니다
                  </p>
                  <div className="bg-[#161B22] rounded-2xl p-5 mb-8">
                    <div className="flex items-center justify-center gap-3">
                      <Mail size={20} className="text-[#58A6FF]" />
                      <span className="text-lg font-medium text-[#F0F6FC]">
                        {maskEmail(foundEmail)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setResetEmail(foundEmail);
                        switchTab('reset-password');
                      }}
                      className="flex-1 py-3 rounded-xl border border-[#30363D] bg-[#161B22] text-[#8B949E] hover:text-[#F0F6FC] hover:border-[#58A6FF]/50 transition-all text-sm font-medium"
                    >
                      비밀번호 재설정
                    </button>
                    <Button
                      onClick={() => router.push('/login')}
                      className="flex-1 py-3 text-sm font-medium"
                      size="lg"
                      rightIcon={<ArrowRight size={16} />}
                    >
                      로그인하기
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="reset-password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {!resetSent ? (
                <form onSubmit={handleResetPassword} className="space-y-6">
                  <p className="text-sm text-[#8B949E] mb-2">
                    가입한 이메일 주소를 입력하면 비밀번호 재설정 링크를 보내드립니다.
                  </p>

                  {/* Email */}
                  <div>
                    <label className="block text-[13px] font-medium text-[#8B949E] mb-3 pl-1 tracking-wide">
                      이메일
                    </label>
                    <div className="relative bg-[#161B22] rounded-2xl p-2.5">
                      <div className="bg-[#21262D] rounded-xl h-[48px] pl-5 pr-4 flex items-center focus-within:bg-[#282E36] focus-within:ring-1 focus-within:ring-[#30363D] transition-all duration-300">
                        <input
                          type="email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="email@example.com"
                          required
                          className="flex-1 bg-transparent border-0 text-[#FFFFFF] h-full text-base font-medium focus:outline-none placeholder:text-[#484F58] pl-2"
                        />
                      </div>
                    </div>
                  </div>

                  {resetError && (
                    <p className="text-sm text-[#F85149] pl-1">{resetError}</p>
                  )}

                  <div className="pt-2">
                    <Button
                      type="submit"
                      className="w-full py-4 text-base font-semibold"
                      size="lg"
                      isLoading={resetLoading}
                      rightIcon={!resetLoading ? <Mail size={18} /> : undefined}
                    >
                      재설정 링크 발송
                    </Button>
                  </div>
                </form>
              ) : (
                /* Reset Email Sent */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6"
                >
                  <div className="w-16 h-16 rounded-full bg-[#1F6FEB]/20 flex items-center justify-center mx-auto mb-6">
                    <Mail size={32} className="text-[#58A6FF]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#F0F6FC] mb-2">
                    이메일을 발송했습니다
                  </h3>
                  <p className="text-sm text-[#8B949E] mb-2">
                    <span className="text-[#58A6FF] font-medium">{resetEmail}</span>
                  </p>
                  <p className="text-sm text-[#484F58] mb-8">
                    이메일의 링크를 클릭하여 새 비밀번호를 설정해주세요.
                    <br />
                    메일이 오지 않으면 스팸함을 확인해주세요.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setResetSent(false);
                        setResetEmail('');
                      }}
                      className="flex-1 py-3 rounded-xl border border-[#30363D] bg-[#161B22] text-[#8B949E] hover:text-[#F0F6FC] hover:border-[#58A6FF]/50 transition-all text-sm font-medium"
                    >
                      다시 발송
                    </button>
                    <Button
                      onClick={() => router.push('/login')}
                      className="flex-1 py-3 text-sm font-medium"
                      size="lg"
                      rightIcon={<ArrowRight size={16} />}
                    >
                      로그인하기
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
