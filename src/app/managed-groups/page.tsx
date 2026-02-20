'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Users, Crown, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useManagedGroupStore } from '@/store/managedGroupStore';
import ManagedGroupCard from '@/components/managed-group/ManagedGroupCard';
import ManagedGroupCreateModal from '@/components/managed-group/ManagedGroupCreateModal';
import BottomNav from '@/components/ui/BottomNav';

export default function ManagedGroupsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { groups, isLoading, fetchMyGroups, openCreateModal } = useManagedGroupStore();

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

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#58A6FF]" />
      </div>
    );
  }

  const myGroups = groups.filter(g => g.ownerId === user?.id);
  const joinedGroups = groups.filter(g => g.ownerId !== user?.id);

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
          <h1 className="text-base font-bold text-[#F0F6FC]">관리형 그룹</h1>
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
              첫 관리형 그룹을 만들어보세요
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
          <div className="space-y-6">
            {/* 내가 만든 그룹 */}
            {myGroups.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Crown size={16} className="text-[#FFA657]" />
                  <h2 className="text-sm font-semibold text-[#FFA657]">
                    내가 만든 그룹 ({myGroups.length})
                  </h2>
                </div>
                <div className="space-y-2">
                  {myGroups.map((group, index) => (
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
                      />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* 참여 중인 그룹 */}
            {joinedGroups.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Users size={16} className="text-[#58A6FF]" />
                  <h2 className="text-sm font-semibold text-[#58A6FF]">
                    참여 중인 그룹 ({joinedGroups.length})
                  </h2>
                </div>
                <div className="space-y-2">
                  {joinedGroups.map((group, index) => (
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
                      />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <ManagedGroupCreateModal />
      <BottomNav />
    </div>
  );
}
