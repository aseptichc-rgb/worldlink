'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, UserPlus, Check, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useGroupStore } from '@/store/groupStore';
import { getUser, addMemberToManagedGroup } from '@/lib/firebase-services';
import { User } from '@/types';

function GroupInviteContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  const fromUserId = searchParams.get('from');

  const { user, isAuthenticated } = useAuthStore();
  const { groups, getNodesInGroup, addNodeToGroup } = useGroupStore();

  const [inviter, setInviter] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const group = groups.find((g) => g.id === groupId);
  const memberNodeIds = groupId ? getNodesInGroup(groupId) : [];

  useEffect(() => {
    const loadInviter = async () => {
      if (fromUserId) {
        const inviterData = await getUser(fromUserId);
        setInviter(inviterData);
      }
      setIsLoading(false);
    };
    loadInviter();
  }, [fromUserId]);

  const handleAcceptInvite = async () => {
    if (!user || !group) return;

    setIsAccepting(true);
    try {
      // 1. 그룹에 새 멤버 추가 (로컬 상태)
      addNodeToGroup(user.id, groupId);

      // 2. 관리 모임에 멤버로 추가 (초대자만 invite, 나머지는 managed_group으로 자동 연결)
      await addMemberToManagedGroup(groupId, user.id, 'member', fromUserId || undefined);

      setAccepted(true);

      // 3초 후 네트워크 페이지로 이동
      setTimeout(() => {
        router.push('/network');
      }, 3000);
    } catch (err) {
      console.error('Failed to accept invite:', err);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleLoginFirst = () => {
    // 초대 정보를 세션에 저장하고 로그인/가입 페이지로
    sessionStorage.setItem('pendingGroupInvite', JSON.stringify({
      groupId,
      fromUserId,
    }));
    sessionStorage.setItem('redirectAfterAuth', `/invite/group/${groupId}?from=${fromUserId}`);
    router.push('/onboarding');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <Loader2 size={32} className="text-[#58A6FF] animate-spin" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center px-6">
        <div className="text-center">
          <Users size={48} className="text-[#484F58] mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white mb-2">그룹을 찾을 수 없습니다</h1>
          <p className="text-[#8B949E] mb-6">
            유효하지 않은 초대 링크이거나, 그룹이 삭제되었을 수 있습니다.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-[#58A6FF] text-white font-medium rounded-xl"
          >
            홈으로 가기
          </button>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#3FB950]/20 flex items-center justify-center"
          >
            <Check size={40} className="text-[#3FB950]" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-2">환영합니다!</h1>
          <p className="text-[#8B949E] mb-2">
            <span className="text-white font-medium">{group.name}</span> 그룹에 합류했습니다
          </p>
          <p className="text-[#58A6FF] mb-6">
            {memberNodeIds.length}명의 멤버와 인맥이 되었습니다
          </p>
          <Loader2 size={20} className="text-[#484F58] mx-auto animate-spin" />
          <p className="text-sm text-[#484F58] mt-2">잠시 후 네트워크로 이동합니다...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1117] px-6 py-12">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center text-4xl"
            style={{ backgroundColor: group.color + '20' }}
          >
            {group.icon}
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{group.name}</h1>
          {inviter && (
            <p className="text-[#8B949E]">
              <span className="text-white">{inviter.name}</span>님이 초대했습니다
            </p>
          )}
        </div>

        {/* Info Banner */}
        <div className="bg-[#58A6FF]/10 border border-[#58A6FF]/20 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#58A6FF]/20 flex items-center justify-center flex-shrink-0">
              <UserPlus size={20} className="text-[#58A6FF]" />
            </div>
            <div>
              <p className="text-sm text-[#58A6FF] font-medium">자동 인맥 연결</p>
              <p className="text-sm text-[#8B949E] mt-1">
                이 그룹에 들어오면 <span className="text-white font-medium">{memberNodeIds.length}명</span>의 멤버 전체와 자동으로 서로 인맥이 됩니다
              </p>
            </div>
          </div>
        </div>

        {/* Member Preview */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 mb-6">
          <h3 className="text-sm text-[#8B949E] mb-3">그룹 멤버 ({memberNodeIds.length}명)</h3>
          {memberNodeIds.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {memberNodeIds.slice(0, 8).map((_, idx) => (
                <div
                  key={idx}
                  className="w-10 h-10 rounded-full bg-[#30363D] flex items-center justify-center"
                >
                  <Users size={16} className="text-[#484F58]" />
                </div>
              ))}
              {memberNodeIds.length > 8 && (
                <div className="w-10 h-10 rounded-full bg-[#30363D] flex items-center justify-center text-xs text-[#8B949E]">
                  +{memberNodeIds.length - 8}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-[#484F58]">아직 멤버가 없습니다</p>
          )}
        </div>

        {/* Action Buttons */}
        {isAuthenticated && user ? (
          <button
            onClick={handleAcceptInvite}
            disabled={isAccepting}
            className="w-full py-4 bg-[#58A6FF] hover:bg-[#58A6FF]/90 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
          >
            {isAccepting ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <UserPlus size={20} />
                그룹 참여하기
              </>
            )}
          </button>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleLoginFirst}
              className="w-full py-4 bg-[#58A6FF] text-white font-semibold rounded-xl flex items-center justify-center gap-2"
            >
              가입하고 그룹 참여하기
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => router.push('/login')}
              className="w-full py-3 bg-[#21262D] text-[#F0F6FC] font-medium rounded-xl border border-[#30363D]"
            >
              이미 계정이 있어요
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-[#484F58] mt-6">
          그룹에 참여하면 멤버들과 서로의 프로필을 볼 수 있습니다
        </p>
      </div>
    </div>
  );
}

export default function GroupInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
          <Loader2 size={32} className="text-[#58A6FF] animate-spin" />
        </div>
      }
    >
      <GroupInviteContent />
    </Suspense>
  );
}
