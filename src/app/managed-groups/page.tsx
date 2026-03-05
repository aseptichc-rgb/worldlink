'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Users, Loader2, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useManagedGroupStore } from '@/store/managedGroupStore';
import { ManagedGroup } from '@/types';
import ManagedGroupCard from '@/components/managed-group/ManagedGroupCard';
import ManagedGroupCreateModal from '@/components/managed-group/ManagedGroupCreateModal';
import BottomNav from '@/components/ui/BottomNav';

export default function ManagedGroupsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { groups, isLoading, fetchMyGroups, openCreateModal, deleteGroup, leaveGroup } = useManagedGroupStore();
  const [confirmTarget, setConfirmTarget] = useState<ManagedGroup | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/onboarding');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user?.id) {
      fetchMyGroups(user.id);
    }
  }, [user?.id, fetchMyGroups]);

  const handleRemove = async () => {
    if (!confirmTarget || !user?.id) return;
    setIsRemoving(true);
    try {
      const isOwner = confirmTarget.ownerId === user.id;
      if (isOwner) {
        await deleteGroup(confirmTarget.id);
      } else {
        await leaveGroup(confirmTarget.id, user.id);
      }
    } finally {
      setIsRemoving(false);
      setConfirmTarget(null);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#58A6FF]" />
      </div>
    );
  }

  const isOwnerOfTarget = confirmTarget?.ownerId === user?.id;

  return (
    <div className="min-h-screen bg-[#0D1117] pb-24">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-[#0D1117]/80 backdrop-blur-xl border-b border-[rgba(240,246,252,0.05)]">
        <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 text-[#8B949E] hover:text-white"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-base font-bold text-[#F0F6FC]">나의 모임</h1>
          <button
            onClick={openCreateModal}
            className="flex-shrink-0 flex items-center gap-1.5 px-6 py-2 bg-[#58A6FF] text-[#0D1117] text-sm font-bold rounded-lg whitespace-nowrap"
          >
            <Plus size={16} />
            &nbsp;&nbsp;만들기&nbsp;&nbsp;
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-[#58A6FF]" />
          </div>
        ) : groups.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-[rgba(88,166,255,0.15)] to-[rgba(31,111,235,0.15)] flex items-center justify-center">
              <Users size={36} className="text-[#58A6FF]" />
            </div>
            <h2 className="text-xl font-bold text-[#F0F6FC] mb-3">
              첫 나의 모임을 만들어보세요
            </h2>
            <p className="text-sm text-[#8B949E] mb-6 leading-relaxed">
              그룹을 만들고 멤버를 초대하면<br />
              멤버들이 자동으로 서로 인맥이 됩니다
            </p>
            <button
              onClick={openCreateModal}
              className="inline-block px-10 py-3 bg-[#58A6FF] text-[#0D1117] font-bold rounded-xl text-sm whitespace-nowrap"
            >
              &nbsp;&nbsp;그룹 만들기&nbsp;&nbsp;
            </button>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {groups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ManagedGroupCard
                  group={group}
                  currentUserId={user!.id}
                  onClick={() => router.push(`/managed-groups/${group.id}`)}
                  onRemove={() => setConfirmTarget(group)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <AnimatePresence>
        {confirmTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6"
            onClick={() => !isRemoving && setConfirmTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#161B22] border border-[#30363D] rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#DA3633]/15 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-[#DA3633]" />
                </div>
                <h3 className="text-base font-bold text-[#F0F6FC]">
                  {isOwnerOfTarget ? '모임 삭제' : '모임 나가기'}
                </h3>
              </div>
              <p className="text-sm text-[#8B949E] mb-6 leading-relaxed">
                {isOwnerOfTarget
                  ? <>
                      <span className="text-[#F0F6FC] font-semibold">{confirmTarget.name}</span>
                      을(를) 삭제하시겠습니까?<br />
                      모든 멤버와 데이터가 삭제됩니다.
                    </>
                  : <>
                      <span className="text-[#F0F6FC] font-semibold">{confirmTarget.name}</span>
                      에서 나가시겠습니까?
                    </>
                }
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmTarget(null)}
                  disabled={isRemoving}
                  className="flex-1 py-2.5 text-sm font-semibold text-[#8B949E] bg-[#21262D] rounded-xl hover:bg-[#30363D] transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleRemove}
                  disabled={isRemoving}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#DA3633] rounded-xl hover:bg-[#DA3633]/80 transition-colors flex items-center justify-center gap-2"
                >
                  {isRemoving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    isOwnerOfTarget ? '삭제' : '나가기'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ManagedGroupCreateModal />
      <BottomNav />
    </div>
  );
}
