'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, UserPlus, Check, Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getManagedGroupInvite, getManagedGroup, getUser, acceptManagedGroupInvite, onAuthChange } from '@/lib/firebase-services';
import { ManagedGroup, ManagedGroupInvite, User } from '@/types';

export default function ManagedGroupInvitePage() {
  const params = useParams();
  const router = useRouter();
  const inviteId = params.inviteId as string;

  const { user, isAuthenticated, isLoading: authLoading, setUser, setLoading } = useAuthStore();

  const [invite, setInvite] = useState<ManagedGroupInvite | null>(null);
  const [group, setGroup] = useState<ManagedGroup | null>(null);
  const [inviter, setInviter] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);

  // Firebase 인증 상태 초기화 (authLoading stuck 방지)
  useEffect(() => {
    const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('nodded_demo_mode') === 'true';
    if (isDemoMode) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await getUser(firebaseUser.uid);
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [setUser, setLoading]);

  useEffect(() => {
    const loadInviteData = async () => {
      try {
        const inviteData = await getManagedGroupInvite(inviteId);
        if (!inviteData) {
          setError('유효하지 않은 초대 링크입니다');
          setIsLoading(false);
          return;
        }
        setInvite(inviteData);

        const [groupData, inviterData] = await Promise.all([
          getManagedGroup(inviteData.groupId),
          getUser(inviteData.inviterId),
        ]);
        setGroup(groupData);
        setInviter(inviterData);
      } catch {
        setError('초대 정보를 불러오는데 실패했습니다');
      }
      setIsLoading(false);
    };
    loadInviteData();
  }, [inviteId]);

  // 이미 멤버인지 확인
  useEffect(() => {
    if (user && group) {
      if (group.memberUserIds.includes(user.id)) {
        setAlreadyMember(true);
      }
    }
  }, [user, group]);

  const handleAccept = async () => {
    if (!user) return;
    setIsAccepting(true);
    try {
      await acceptManagedGroupInvite(inviteId, user.id);
      setAccepted(true);
      setTimeout(() => {
        router.push(`/managed-groups/${group?.id}`);
      }, 2000);
    } catch (err) {
      setError((err as Error).message);
    }
    setIsAccepting(false);
  };

  const handleGoToSignup = () => {
    sessionStorage.setItem('redirectAfterAuth', `/invite/managed-group/${inviteId}`);
    router.push('/onboarding');
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#58A6FF]" />
      </div>
    );
  }

  // Error state
  if (error && !invite) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F85149]/15 flex items-center justify-center">
            <AlertCircle size={32} className="text-[#F85149]" />
          </div>
          <h2 className="text-lg font-bold text-[#F0F6FC] mb-2">초대 링크 오류</h2>
          <p className="text-sm text-[#8B949E] mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-[#58A6FF] text-[#0D1117] font-bold rounded-xl text-sm"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // Accepted state
  if (accepted) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15, delay: 0.2 }}
            className="w-20 h-20 mx-auto mb-5 rounded-full bg-[#3FB950]/15 flex items-center justify-center"
          >
            <Check size={40} className="text-[#3FB950]" />
          </motion.div>
          <h2 className="text-xl font-bold text-[#F0F6FC] mb-2">그룹에 참여했습니다!</h2>
          <p className="text-sm text-[#8B949E]">잠시 후 그룹 페이지로 이동합니다...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Group Info Card */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6 mb-4">
          {group && (
            <div className="text-center">
              <div
                className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center text-4xl"
                style={{ backgroundColor: group.color + '20' }}
              >
                {group.icon}
              </div>
              <h2 className="text-xl font-bold text-[#F0F6FC] mb-1">{group.name}</h2>
              {group.description && (
                <p className="text-sm text-[#8B949E] mb-3">{group.description}</p>
              )}
              <div className="flex items-center justify-center gap-2 text-sm text-[#484F58]">
                <Users size={14} />
                <span>멤버 {group.members.length}명</span>
              </div>
            </div>
          )}

          {/* Inviter Info */}
          {inviter && (
            <div className="mt-5 pt-5 border-t border-[#30363D]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#58A6FF] flex items-center justify-center text-white font-bold text-sm">
                  {inviter.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm text-[#F0F6FC] font-medium">{inviter.name}님의 초대</p>
                  <p className="text-xs text-[#8B949E]">
                    {[inviter.company, inviter.position].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Auto-connect Info */}
        {group?.settings.autoConnect && (
          <div className="bg-[#58A6FF]/10 border border-[#58A6FF]/20 rounded-xl p-3 mb-4">
            <div className="flex items-start gap-2">
              <UserPlus size={16} className="text-[#58A6FF] mt-0.5 shrink-0" />
              <p className="text-xs text-[#58A6FF]">
                그룹에 참여하면 멤버 {group.members.length}명 전원과 자동으로 인맥이 됩니다
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-[#F85149]/10 border border-[#F85149]/20 rounded-xl p-3 mb-4">
            <p className="text-xs text-[#F85149]">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        {!isAuthenticated ? (
          /* Not Logged In */
          <div className="space-y-3">
            <button
              onClick={handleGoToSignup}
              className="w-full py-4 bg-[#58A6FF] text-[#0D1117] font-bold rounded-xl text-base"
            >
              가입하고 그룹 참여하기
            </button>
            <button
              onClick={() => {
                sessionStorage.setItem('redirectAfterAuth', `/invite/managed-group/${inviteId}`);
                router.push('/login');
              }}
              className="w-full py-4 bg-[#161B22] text-[#F0F6FC] font-medium rounded-xl border border-[#30363D]"
            >
              이미 계정이 있어요
            </button>
          </div>
        ) : alreadyMember ? (
          /* Already a Member */
          <div className="text-center space-y-3">
            <p className="text-sm text-[#8B949E]">이미 이 그룹에 참여하고 있습니다</p>
            <button
              onClick={() => router.push(`/managed-groups/${group?.id}`)}
              className="w-full py-4 bg-[#58A6FF] text-[#0D1117] font-bold rounded-xl"
            >
              그룹 보러 가기
            </button>
          </div>
        ) : (
          /* Authenticated, can join */
          <button
            onClick={handleAccept}
            disabled={isAccepting}
            className="w-full py-4 bg-[#58A6FF] text-[#0D1117] font-bold rounded-xl text-base disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isAccepting ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <UserPlus size={20} />
            )}
            그룹 참여하기
          </button>
        )}
      </motion.div>
    </div>
  );
}
