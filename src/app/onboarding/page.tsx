'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileSetup, { ProfileData } from '@/components/onboarding/ProfileSetup';
import { Input, Button } from '@/components/ui';
import Avatar from '@/components/ui/Avatar';
import {
  registerWithEmail,
  createUser,
  generateInviteCode,
  uploadProfileImage,
  savePublicCard,
  getInvitationByCode,
  acceptInvitation,
  createAutoConnection,
  createConnection,
  getUser,
} from '@/lib/firebase-services';
import { useAuthStore } from '@/store/authStore';
import { useGroupStore } from '@/store/groupStore';
import { User as UserType, Invitation } from '@/types';
import { Mail, Lock, ArrowRight, User, Users, Check, X, Shield, Eye, EyeOff, Sparkles, Handshake } from 'lucide-react';
import { DEMO_MEMBERS, DEMO_ACCOUNT_INDEX, getDemoProfileImage } from '@/lib/demo-seed-data';

type OnboardingStep = 'welcome' | 'auth' | 'profile' | 'connection';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser, setUser } = useAuthStore();
  const { groups, getNodesInGroup, addNodeToGroup } = useGroupStore();

  const [step, setStep] = useState<OnboardingStep>('auth');
  const [initialStepSet, setInitialStepSet] = useState(false);
  const [pendingGroupInvite, setPendingGroupInvite] = useState<{ groupId: string; fromUserId: string } | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 일촌 수락 관련 상태
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviterInfo, setInviterInfo] = useState<UserType | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [newUserId, setNewUserId] = useState<string | null>(null);
  const [connectionLoading, setConnectionLoading] = useState(false);

  // 정보 공개 설정
  const [privacyChoices, setPrivacyChoices] = useState({
    nameDisplay: 'full' as 'full' | 'partial',
    institutionDisplay: 'full' as 'full' | 'department' | 'hidden',
    positionDisplay: 'full' as 'full' | 'level' | 'hidden',
  });

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      // 이미 로그인된 사용자가 초대 링크를 클릭한 경우 → 바로 인맥 연결
      if (currentUser) {
        (async () => {
          try {
            const inv = await getInvitationByCode(code);
            if (inv && inv.senderId !== currentUser.id) {
              await createAutoConnection(inv.senderId, currentUser.id);
              await acceptInvitation(code, currentUser.id);
            }
          } catch (err) {
            console.error('Failed to process invite for logged-in user:', err);
          }
          router.push('/network');
        })();
        return;
      }

      setInviteCode(code);
      // 초대 코드가 있으면 환영 화면부터 시작
      if (!initialStepSet) {
        setStep('welcome');
        setInitialStepSet(true);
      }
      // 초대자 정보 미리 로드
      loadInviterInfo(code);
    }

    // 그룹 초대 정보 확인
    const pendingInvite = sessionStorage.getItem('pendingGroupInvite');
    if (pendingInvite) {
      try {
        const parsed = JSON.parse(pendingInvite);
        setPendingGroupInvite(parsed);
      } catch (e) {
        sessionStorage.removeItem('pendingGroupInvite');
      }
    }
  }, [searchParams]);

  const loadInviterInfo = async (code: string) => {
    try {
      const inv = await getInvitationByCode(code);
      if (inv) {
        setInvitation(inv);
        const sender = await getUser(inv.senderId);
        if (sender) {
          setInviterInfo(sender);
        }
      }
    } catch (err) {
      console.error('Failed to load inviter info:', err);
    }
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
        institution: profile.institution,
        department: profile.department || undefined,
        position: profile.position,
        degree: (profile.degree || undefined) as any,
        orcid: profile.orcid || undefined,
        bio: profile.bio,
        researchInterests: profile.researchInterests,
        researchKeywords: [],
        profileImage: profileImageUrl,
        inviteCode: userInviteCode,
        invitesRemaining: 10,
        invitedBy: invitation?.senderId,
        meetingStatus: 'available',
        privacySettings: {
          allowProfileDiscovery: profile.privacyConsent.allowProfileDiscovery,
          displaySettings: profile.privacyConsent.displaySettings,
          consentedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Firebase에 공개 프로필 카드 자동 저장
      await savePublicCard({
        id: newUser.id,
        name: newUser.name,
        institution: newUser.institution,
        position: newUser.position,
        email: newUser.email,
        phone: newUser.phone,
        bio: newUser.bio,
        profileImage: newUser.profileImage,
        researchInterests: newUser.researchInterests,
      });

      setUser(newUser);
      setNewUserId(firebaseUser.uid);

      // 그룹 초대가 있으면 처리
      if (pendingGroupInvite) {
        try {
          const { groupId, fromUserId } = pendingGroupInvite;
          const memberNodeIds = getNodesInGroup(groupId);

          // 그룹에 새 멤버 추가
          addNodeToGroup(firebaseUser.uid, groupId);

          // 초대한 사람과 인맥 연결
          if (fromUserId && fromUserId !== firebaseUser.uid) {
            await createAutoConnection(firebaseUser.uid, fromUserId);
          }

          // 기존 그룹 멤버들과 인맥 연결
          for (const memberId of memberNodeIds) {
            if (memberId !== firebaseUser.uid && memberId !== fromUserId) {
              await createAutoConnection(firebaseUser.uid, memberId);
            }
          }

          sessionStorage.removeItem('pendingGroupInvite');
          sessionStorage.removeItem('redirectAfterAuth');
          router.push('/network');
          return;
        } catch (err) {
          console.error('Failed to process group invite:', err);
        }
      }

      // 초대 코드가 있고 초대자 정보가 있으면 일촌 수락 단계로
      if (inviteCode && inviterInfo) {
        setStep('connection');
      } else {
        // 나의 모임 초대 등 리디렉션 경로가 있으면 해당 경로로 이동
        const redirectPath = sessionStorage.getItem('redirectAfterAuth');
        if (redirectPath) {
          sessionStorage.removeItem('redirectAfterAuth');
          router.push(redirectPath);
        } else {
          router.push('/network');
        }
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        // 초대 코드가 있으면 저장 후 로그인 페이지로 이동
        if (inviteCode) {
          sessionStorage.setItem('pendingInviteCode', inviteCode);
          router.push('/login?from=invite');
          return;
        }
        setError('이미 사용 중인 이메일입니다');
        setStep('auth');
      } else {
        setError('가입 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptConnection = async () => {
    if (!newUserId || !inviterInfo || !inviteCode) return;
    setConnectionLoading(true);

    try {
      // 일촌 연결 생성 (바로 accepted)
      await createAutoConnection(inviterInfo.id, newUserId);
      // 초대 수락 처리
      await acceptInvitation(inviteCode, newUserId);
      router.push('/network');
    } catch (err) {
      console.error('Failed to accept connection:', err);
      router.push('/network');
    } finally {
      setConnectionLoading(false);
    }
  };

  const handleRejectConnection = async () => {
    if (!newUserId || !inviteCode) return;
    setConnectionLoading(true);

    try {
      // 초대는 수락 처리하되 (가입은 완료됨) 일촌 연결은 생성하지 않음
      await acceptInvitation(inviteCode, newUserId);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setConnectionLoading(false);
      router.push('/network');
    }
  };

  // Step indicator
  const hasInviteCode = !!inviteCode;
  const steps = [
    ...(hasInviteCode ? [{ key: 'welcome', label: '초대', icon: Sparkles }] : []),
    { key: 'auth', label: '계정 생성', icon: Mail },
    { key: 'profile', label: '프로필 설정', icon: User },
    ...(hasInviteCode ? [{ key: 'connection', label: '일촌 수락', icon: Users }] : []),
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-center px-8 py-10 relative overflow-hidden">
      {/* Background Effects */}
      <div className="stars-bg" />

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-[#007AFF]/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-[#0055CC]/10 rounded-full blur-[100px]" />

      {/* Logo Section */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="mb-8 text-center"
      >
        <div className="relative inline-block">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-[#007AFF] via-[#007AFF] to-[#0055CC] bg-clip-text text-transparent">
              NODDED
            </span>
          </h1>
          <div className="absolute inset-0 bg-gradient-to-r from-[#007AFF]/20 to-[#0055CC]/20 blur-2xl -z-10" />
        </div>
        <p className="text-[#484F58] mt-3 text-base md:text-lg font-medium tracking-wide">
          신뢰 기반 연구 네트워크
        </p>
      </motion.div>

      {/* Step Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-3 mb-10"
      >
        {steps.map((s, index) => {
          const Icon = s.icon;
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;

          return (
            <div key={s.key} className="flex items-center">
              <div
                className={`
                  flex items-center gap-2.5 px-4 py-2 rounded-full text-base font-medium
                  transition-all duration-300
                  ${isActive
                    ? 'bg-[#007AFF]/15 text-[#007AFF]'
                    : isCompleted
                      ? 'bg-[#3FB950]/15 text-[#3FB950]'
                      : 'text-[#484F58]'}
                `}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-10 h-0.5 mx-3 rounded-full ${isCompleted ? 'bg-[#3FB950]' : 'bg-[#30363D]'}`} />
              )}
            </div>
          );
        })}
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {step === 'welcome' && inviterInfo && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full max-w-[440px] px-6"
          >
            <div className="relative rounded-2xl bg-gradient-to-b from-[#1C2333] to-[#161B22] border border-[#30363D] overflow-hidden">
              {/* 상단 장식 그라데이션 */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#007AFF] via-[#3B82F6] to-[#0055CC]" />

              <div className="px-8 pt-10 pb-8">
                {/* 초대자 프로필 */}
                <div className="flex flex-col items-center mb-8">
                  <div className="relative">
                    <Avatar src={inviterInfo.profileImage} name={inviterInfo.name} size="lg" hasGlow />
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#007AFF] rounded-full flex items-center justify-center border-2 border-[#1C2333]">
                      <Handshake size={14} className="text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-4">{inviterInfo.name}</h3>
                  {(inviterInfo.institution || inviterInfo.position) && (
                    <p className="text-[#8B949E] text-sm mt-1">
                      {inviterInfo.institution}{inviterInfo.institution && inviterInfo.position ? ' · ' : ''}{inviterInfo.position}
                    </p>
                  )}
                </div>

                {/* 초대 메시지 */}
                <div className="text-center mb-8 space-y-3">
                  <p className="text-[#C9D1D9] text-base leading-relaxed">
                    <span className="text-white font-semibold">{inviterInfo.name}</span>님이
                    <br />
                    당신을 소중한 연구 인맥으로
                    <br />
                    <span className="text-[#007AFF] font-semibold">NODDED</span>에 초대했습니다.
                  </p>
                </div>

                {/* 가치 제안 */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#0D1117]/60">
                    <div className="w-8 h-8 rounded-lg bg-[#007AFF]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Users size={16} className="text-[#007AFF]" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">신뢰 기반 네트워킹</p>
                      <p className="text-[#8B949E] text-xs mt-0.5">
                        초대를 통해서만 연결되는 검증된 연구 네트워크
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#0D1117]/60">
                    <div className="w-8 h-8 rounded-lg bg-[#007AFF]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles size={16} className="text-[#007AFF]" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">네트워킹 기회 확장</p>
                      <p className="text-[#8B949E] text-xs mt-0.5">
                        {inviterInfo.name}님의 인맥을 시작으로 연구 협업 기회를 넓혀보세요
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA 버튼 */}
                <Button
                  onClick={() => setStep('auth')}
                  className="w-full relative"
                  size="lg"
                >
                  <span className="text-[16px]">NODDED 시작하기</span>
                  <ArrowRight size={18} className="absolute right-6" />
                </Button>

                {/* 이미 계정이 있는 경우 */}
                <p className="text-[#888888] text-sm text-center mt-5">
                  이미 계정이 있으신가요?{' '}
                  <button
                    onClick={() => router.push('/login')}
                    className="text-[#007AFF] underline hover:text-[#007AFF]/80 transition-colors font-medium"
                  >
                    로그인하기
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'welcome' && !inviterInfo && inviteCode && (
          <motion.div
            key="welcome-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-[440px] px-6 flex flex-col items-center"
          >
            <div className="w-10 h-10 border-2 border-[#007AFF]/30 border-t-[#007AFF] rounded-full animate-spin mb-4" />
            <p className="text-[#8B949E] text-sm">초대 정보를 불러오는 중...</p>
          </motion.div>
        )}

        {step === 'auth' && (
          <motion.div
            key="auth"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-[440px] px-12"
          >
            <div>
              {/* 초대자 정보 표시 */}
              {inviterInfo && (
                <div className="mb-7 p-5 rounded-[12px] bg-[#007AFF]/5 border border-[#007AFF]/20">
                  <div className="flex items-center gap-3">
                    <Avatar src={inviterInfo.profileImage} name={inviterInfo.name} size="sm" />
                    <div>
                      <p className="text-sm text-[#007AFF]">초대한 사람</p>
                      <p className="text-base text-white font-medium">{inviterInfo.name}</p>
                      {inviterInfo.institution && (
                        <p className="text-sm text-[#8B949E]">{inviterInfo.institution} {inviterInfo.position}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="text-center mb-10">
                <h2 className="text-[20px] font-bold text-white tracking-tight">
                  계정 생성
                </h2>
                <p className="text-[#999999] text-sm mt-2">
                  NODDED에 오신 것을 환영합니다
                </p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-6">
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
                  placeholder="최소 6자 이상"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <Input
                  type="password"
                  label="비밀번호 확인"
                  placeholder="비밀번호를 다시 입력해주세요"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={error || undefined}
                  required
                />

                <Button
                  type="submit"
                  className="w-full mt-2 relative"
                  size="lg"
                >
                  <span className="text-[16px]">다음</span>
                  <ArrowRight size={18} className="absolute right-6" />
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
            <div className="bg-[#1E1E1E] backdrop-blur-2xl rounded-[12px] px-10 pt-10 pb-8">
              <ProfileSetup
                onComplete={handleProfileComplete}
                isLoading={isLoading}
                onBack={() => setStep('auth')}
              />
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 text-[#FF4D4D] text-xs text-center"
                >
                  {error}
                </motion.p>
              )}
            </div>
          </motion.div>
        )}

        {step === 'connection' && inviterInfo && (
          <motion.div
            key="connection"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-[440px]"
          >
            <div className="bg-[#1E1E1E] backdrop-blur-2xl rounded-[12px] px-10 pt-10 pb-8">
              <div className="text-center mb-8">
                <h2 className="text-[20px] font-bold text-white tracking-tight">
                  일촌 요청
                </h2>
                <p className="text-[#999999] text-sm mt-2">
                  아래 사람과 일촌을 맺으시겠습니까?
                </p>
              </div>

              {/* 초대자 프로필 */}
              <div className="flex flex-col items-center mb-7 p-7 rounded-xl bg-[#1C2333] border border-[#30363D]">
                <Avatar src={inviterInfo.profileImage} name={inviterInfo.name} size="lg" hasGlow />
                <h3 className="text-lg font-bold text-white mt-3">{inviterInfo.name}</h3>
                {inviterInfo.position && (
                  <p className="text-base text-[#8B949E] mt-1">{inviterInfo.position}</p>
                )}
                {inviterInfo.institution && (
                  <p className="text-base text-[#8B949E]">{inviterInfo.institution}</p>
                )}
                {inviterInfo.researchInterests && inviterInfo.researchInterests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
                    {inviterInfo.researchInterests.slice(0, 5).map((kw, i) => (
                      <span key={i} className="px-2 py-0.5 text-sm rounded-full bg-[#007AFF]/10 text-[#007AFF]">
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 내 정보 공개 설정 */}
              <div className="mb-7 p-5 rounded-xl bg-[#1C2333] border border-[#30363D]">
                <div className="flex items-center gap-3 mb-5">
                  <Shield size={16} className="text-[#007AFF]" />
                  <h4 className="text-base font-medium text-white">내 정보 공개 범위</h4>
                </div>

                <div className="space-y-4">
                  {/* 이름 공개 */}
                  <div className="flex items-center justify-between">
                    <span className="text-base text-[#8B949E]">이름</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPrivacyChoices(p => ({ ...p, nameDisplay: 'full' }))}
                        className={`px-3 py-1 text-sm rounded-full transition-all ${
                          privacyChoices.nameDisplay === 'full'
                            ? 'bg-[#007AFF]/20 text-[#007AFF] border border-[#007AFF]/40'
                            : 'bg-[#30363D] text-[#484F58]'
                        }`}
                      >
                        전체 공개
                      </button>
                      <button
                        onClick={() => setPrivacyChoices(p => ({ ...p, nameDisplay: 'partial' }))}
                        className={`px-3 py-1 text-sm rounded-full transition-all ${
                          privacyChoices.nameDisplay === 'partial'
                            ? 'bg-[#007AFF]/20 text-[#007AFF] border border-[#007AFF]/40'
                            : 'bg-[#30363D] text-[#484F58]'
                        }`}
                      >
                        성만 표시
                      </button>
                    </div>
                  </div>

                  {/* 소속 기관 공개 */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#8B949E]">소속 기관</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPrivacyChoices(p => ({ ...p, institutionDisplay: 'full' }))}
                        className={`px-3 py-1 text-sm rounded-full transition-all ${
                          privacyChoices.institutionDisplay === 'full'
                            ? 'bg-[#007AFF]/20 text-[#007AFF] border border-[#007AFF]/40'
                            : 'bg-[#30363D] text-[#484F58]'
                        }`}
                      >
                        공개
                      </button>
                      <button
                        onClick={() => setPrivacyChoices(p => ({ ...p, institutionDisplay: 'hidden' }))}
                        className={`px-3 py-1 text-sm rounded-full transition-all ${
                          privacyChoices.institutionDisplay === 'hidden'
                            ? 'bg-[#007AFF]/20 text-[#007AFF] border border-[#007AFF]/40'
                            : 'bg-[#30363D] text-[#484F58]'
                        }`}
                      >
                        비공개
                      </button>
                    </div>
                  </div>

                  {/* 직책 공개 */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#8B949E]">직책</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPrivacyChoices(p => ({ ...p, positionDisplay: 'full' }))}
                        className={`px-3 py-1 text-sm rounded-full transition-all ${
                          privacyChoices.positionDisplay === 'full'
                            ? 'bg-[#007AFF]/20 text-[#007AFF] border border-[#007AFF]/40'
                            : 'bg-[#30363D] text-[#484F58]'
                        }`}
                      >
                        공개
                      </button>
                      <button
                        onClick={() => setPrivacyChoices(p => ({ ...p, positionDisplay: 'hidden' }))}
                        className={`px-3 py-1 text-sm rounded-full transition-all ${
                          privacyChoices.positionDisplay === 'hidden'
                            ? 'bg-[#007AFF]/20 text-[#007AFF] border border-[#007AFF]/40'
                            : 'bg-[#30363D] text-[#484F58]'
                        }`}
                      >
                        비공개
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 수락/거절 버튼 */}
              <div className="flex gap-3">
                <button
                  onClick={handleRejectConnection}
                  disabled={connectionLoading}
                  className="flex-1 py-4 rounded-lg bg-[#30363D] text-[#8B949E] font-medium flex items-center justify-center gap-2 hover:bg-[#253D5E] transition-colors"
                >
                  <X size={18} />
                  거절
                </button>
                <button
                  onClick={handleAcceptConnection}
                  disabled={connectionLoading}
                  className="flex-1 py-4 rounded-lg bg-[#007AFF] hover:bg-[#0066DD] text-white font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  {connectionLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check size={18} />
                      일촌 수락
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Link & Demo */}
      {step === 'auth' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center space-y-4"
        >
          <button
            type="button"
            onClick={() => {
              const demo = DEMO_MEMBERS[DEMO_ACCOUNT_INDEX];
              // 데모 모드 플래그를 먼저 설정해야 zustand persist가 올바르게 user를 저장함
              localStorage.setItem('nodded_demo_mode', 'true');
              setUser({
                id: demo.id,
                name: demo.name,
                email: demo.email,
                phone: demo.phone,
                institution: demo.company,
                position: demo.position,
                bio: demo.bio,
                researchInterests: demo.keywords,
                researchKeywords: [],
                profileImage: getDemoProfileImage(demo.id),
                inviteCode: 'DEMO-001',
                invitesRemaining: 999,
                meetingStatus: 'available' as const,
                privacySettings: {
                  allowProfileDiscovery: true,
                  displaySettings: {
                    nameDisplay: 'full' as const,
                    institutionDisplay: 'full' as const,
                    positionDisplay: 'full' as const,
                  },
                },
                createdAt: new Date(),
                updatedAt: new Date(),
              });
              router.push('/network');
            }}
            className="w-64 mx-auto block py-3 rounded-xl border border-[#30363D] bg-[#161B22] text-[#8B949E] hover:text-[#F0F6FC] hover:border-[#58A6FF]/50 hover:bg-[#1C2128] transition-all text-sm font-medium"
          >
            데모 계정으로 체험하기
          </button>
          <p className="text-[#888888] text-sm">
            이미 계정이 있으신가요?{' '}
            <button
              onClick={() => router.push('/login')}
              className="text-[#007AFF] underline hover:text-[#007AFF]/80 transition-colors font-medium"
            >
              로그인하기
            </button>
          </p>
        </motion.div>
      )}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
      <div className="text-center">
        <div className="spinner mx-auto mb-4" />
        <p className="text-[#484F58]">로딩 중...</p>
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
