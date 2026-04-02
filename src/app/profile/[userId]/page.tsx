'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Users,
  Coffee,
  Mail,
  Hash,
  Layers,
  UserPlus,
  MessageCircle,
  Share2,
  Phone,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCardStore } from '@/store/cardStore';
import { getUser, getUserConnectionsWithDetails, getDirectConnections } from '@/lib/firebase-services';
import { demoUsers, demoConnections } from '@/lib/demo-data';
import { User } from '@/types';
import Avatar from '@/components/ui/Avatar';
import BottomNav from '@/components/ui/BottomNav';

export default function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const { savedCards } = useCardStore();
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [connectionCount, setConnectionCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('nodded_demo_mode') === 'true';

      // 1. Firebase에서 사용자 정보 가져오기
      try {
        const userData = await getUser(userId);
        if (userData) {
          setTargetUser(userData);
          try {
            const conns = await getUserConnectionsWithDetails(userId);
            setConnectionCount(conns.length);
          } catch {
            // ignore
          }
          setIsLoading(false);
          return;
        }
      } catch {
        // fallback below
      }

      // 2. 저장된 명함에서 찾기
      const savedCard = savedCards.find(c => c.cardId === userId);
      if (savedCard) {
        setTargetUser({
          id: savedCard.card.userId,
          name: savedCard.card.name,
          email: savedCard.card.email || '',
          company: savedCard.card.company,
          position: savedCard.card.position,
          bio: savedCard.card.bio,
          profileImage: savedCard.card.profileImage,
          keywords: savedCard.card.keywords || [],
          inviteCode: '',
          invitesRemaining: 0,
          coffeeStatus: 'available',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as User);
        try {
          const conns = await getUserConnectionsWithDetails(userId);
          setConnectionCount(conns.length);
        } catch {
          // ignore
        }
        setIsLoading(false);
        return;
      }

      // 3. 데모 모드에서 demoUsers에서 찾기
      if (isDemoMode) {
        const demoUser = demoUsers.find(u => u.id === userId);
        if (demoUser) {
          setTargetUser(demoUser as User);
          const connectionIds = demoConnections[userId] || [];
          setConnectionCount(connectionIds.length);
          setIsLoading(false);
          return;
        }
      }

      setIsLoading(false);
    };

    loadUserData();
  }, [userId, savedCards]);

  // 현재 사용자와 대상 사용자 간 인맥 여부 확인
  useEffect(() => {
    const checkConnectionStatus = async () => {
      if (!currentUser || currentUser.id === userId) return;
      try {
        const connections = await getDirectConnections(currentUser.id);
        const connected = connections.some(
          conn => conn.fromUserId === userId || conn.toUserId === userId
        );
        setIsConnected(connected);
      } catch {
        // ignore
      }
    };
    checkConnectionStatus();
  }, [currentUser, userId]);

  const isMyProfile = currentUser?.id === userId;

  const coffeeStatusLabel = (status?: string) => {
    switch (status) {
      case 'available': return '커피챗 가능';
      case 'busy': return '바쁨';
      case 'pending': return '대기 중';
      default: return '';
    }
  };

  const coffeeStatusColor = (status?: string) => {
    switch (status) {
      case 'available': return 'text-[#3FB950] bg-[#3FB950]/10';
      case 'busy': return 'text-[#F85149] bg-[#F85149]/10';
      case 'pending': return 'text-[#D29922] bg-[#D29922]/10';
      default: return 'text-[#8B949E] bg-[#8B949E]/10';
    }
  };

  const companySizeLabel = (size?: string) => {
    switch (size) {
      case 'startup': return '스타트업';
      case 'sme': return '중소기업';
      case 'enterprise': return '대기업';
      case 'freelance': return '프리랜서';
      default: return '';
    }
  };

  const positionLevelLabel = (level?: string) => {
    switch (level) {
      case 'entry': return '사원급';
      case 'staff': return '대리/과장급';
      case 'manager': return '부장/이사급';
      case 'executive': return '임원/대표급';
      default: return '';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!targetUser) {
    return (
      <div className="min-h-screen bg-[#0D1117] pb-24">
        <div className="sticky top-0 z-30 bg-[#0D1117]/80 backdrop-blur-xl border-b border-[#30363D]">
          <div className="flex items-center px-4 py-3">
            <button onClick={() => router.back()} className="p-2 -ml-2">
              <ArrowLeft size={24} className="text-white" />
            </button>
            <h1 className="text-lg font-semibold text-white ml-2">프로필</h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-[#8B949E]">사용자를 찾을 수 없습니다</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1117] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0D1117]/80 backdrop-blur-xl border-b border-[#30363D]">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white">프로필</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* 프로필 메인 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-[#1C2333] to-[#161B22] border border-[#30363D]"
        >
          <div className="flex flex-col items-center text-center">
            <Avatar
              src={targetUser.profileImage}
              name={targetUser.name}
              size="xl"
              hasGlow
            />
            <h2 className="text-2xl font-bold text-white mt-4">{targetUser.name}</h2>

            {/* 직함 & 회사 */}
            {(targetUser.position || targetUser.company) && (
              <div className="mt-2 space-y-1">
                {targetUser.position && (
                  <div className="flex items-center justify-center gap-2 text-[#8B949E]">
                    <Briefcase size={14} />
                    <span>{targetUser.position}</span>
                  </div>
                )}
                {targetUser.company && (
                  <div className="flex items-center justify-center gap-2 text-[#8B949E]">
                    <Building2 size={14} />
                    <span>{targetUser.company}</span>
                  </div>
                )}
              </div>
            )}

            {/* 커피챗 상태 */}
            {targetUser.coffeeStatus && (
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full mt-3 text-sm ${coffeeStatusColor(targetUser.coffeeStatus)}`}>
                <Coffee size={14} />
                <span>{coffeeStatusLabel(targetUser.coffeeStatus)}</span>
              </div>
            )}
          </div>

          {/* 키워드 */}
          {targetUser.keywords && targetUser.keywords.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-5 pt-4 border-t border-[#30363D]">
              {targetUser.keywords.map((keyword, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 text-sm rounded-full bg-[#58A6FF]/10 text-[#58A6FF]"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* 소개 (bio) */}
        {targetUser.bio && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-5 rounded-2xl bg-[#161B22] border border-[#30363D]"
          >
            <h3 className="text-sm font-semibold text-[#8B949E] mb-2">소개</h3>
            <p className="text-[#F0F6FC] text-sm leading-relaxed whitespace-pre-wrap">{targetUser.bio}</p>
          </motion.div>
        )}

        {/* 상세 정보 */}
        {(targetUser.industry || targetUser.companySize || targetUser.positionLevel || targetUser.category || targetUser.email || (isConnected && targetUser.phone)) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-5 rounded-2xl bg-[#161B22] border border-[#30363D] space-y-3"
          >
            <h3 className="text-sm font-semibold text-[#8B949E] mb-1">상세 정보</h3>

            {targetUser.industry && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1F6FEB]/10 flex items-center justify-center">
                  <Layers size={16} className="text-[#1F6FEB]" />
                </div>
                <div>
                  <p className="text-xs text-[#484F58]">업종</p>
                  <p className="text-sm text-[#F0F6FC]">{targetUser.industry}</p>
                </div>
              </div>
            )}

            {targetUser.companySize && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#3FB950]/10 flex items-center justify-center">
                  <Building2 size={16} className="text-[#3FB950]" />
                </div>
                <div>
                  <p className="text-xs text-[#484F58]">회사 규모</p>
                  <p className="text-sm text-[#F0F6FC]">{companySizeLabel(targetUser.companySize)}</p>
                </div>
              </div>
            )}

            {targetUser.positionLevel && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#D29922]/10 flex items-center justify-center">
                  <Briefcase size={16} className="text-[#D29922]" />
                </div>
                <div>
                  <p className="text-xs text-[#484F58]">직급</p>
                  <p className="text-sm text-[#F0F6FC]">{positionLevelLabel(targetUser.positionLevel)}</p>
                </div>
              </div>
            )}

            {targetUser.category && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#BC8CFF]/10 flex items-center justify-center">
                  <Hash size={16} className="text-[#BC8CFF]" />
                </div>
                <div>
                  <p className="text-xs text-[#484F58]">분야</p>
                  <p className="text-sm text-[#F0F6FC]">{targetUser.category}</p>
                </div>
              </div>
            )}

            {targetUser.email && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#58A6FF]/10 flex items-center justify-center">
                  <Mail size={16} className="text-[#58A6FF]" />
                </div>
                <div>
                  <p className="text-xs text-[#484F58]">이메일</p>
                  <p className="text-sm text-[#F0F6FC]">{targetUser.email}</p>
                </div>
              </div>
            )}

            {isConnected && targetUser.phone && (
              <a href={`tel:${targetUser.phone}`} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#3FB950]/10 flex items-center justify-center">
                  <Phone size={16} className="text-[#3FB950]" />
                </div>
                <div>
                  <p className="text-xs text-[#484F58]">전화번호</p>
                  <p className="text-sm text-[#F0F6FC]">{targetUser.phone}</p>
                </div>
              </a>
            )}
          </motion.div>
        )}

        {/* 인맥 정보 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-5 rounded-2xl bg-[#161B22] border border-[#30363D]"
        >
          <button
            onClick={() => router.push(`/network/${userId}`)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1F6FEB]/10 flex items-center justify-center">
                <Users size={20} className="text-[#1F6FEB]" />
              </div>
              <div className="text-left">
                <p className="text-sm text-[#8B949E]">인맥</p>
                <p className="text-lg font-bold text-white">{connectionCount}명</p>
              </div>
            </div>
            <ArrowLeft size={18} className="text-[#484F58] rotate-180" />
          </button>
        </motion.div>

        {/* 액션 버튼 */}
        {!isMyProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex gap-3"
          >
            <button
              onClick={() => router.push(`/network/${userId}`)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#1F6FEB]/15 text-[#58A6FF] font-medium text-sm border border-[#1F6FEB]/30 hover:bg-[#1F6FEB]/25 transition-colors"
            >
              <Share2 size={18} />
              인맥 보기
            </button>
          </motion.div>
        )}

        {isMyProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <button
              onClick={() => router.push('/profile')}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#58A6FF]/15 text-[#58A6FF] font-medium text-sm border border-[#58A6FF]/30 hover:bg-[#58A6FF]/25 transition-colors"
            >
              내 프로필 편집
            </button>
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
