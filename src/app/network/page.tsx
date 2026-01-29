'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Menu, Bell, User as UserIcon, Sparkles, X, MessageCircle, Mail } from 'lucide-react';
import NetworkGraph from '@/components/network/NetworkGraph';
import ProfileSheet from '@/components/network/ProfileSheet';
import SearchBar from '@/components/network/SearchBar';
import CoffeeChatModal from '@/components/coffee-chat/CoffeeChatModal';
import ConnectionRequestModal from '@/components/connection/ConnectionRequestModal';
import RecommendationCard from '@/components/coffee-chat/RecommendationCard';
import { Avatar, Button } from '@/components/ui';
import BottomNav from '@/components/ui/BottomNav';
import { useAuthStore } from '@/store/authStore';
import { useNetworkStore } from '@/store/networkStore';
import { useMessageStore, Message } from '@/store/messageStore';
import { demoUsers } from '@/lib/demo-data';
import { getNetworkGraph, getRecommendations, onAuthChange, getUser } from '@/lib/firebase-services';
import { Recommendation } from '@/types';

export default function NetworkPage() {
  const router = useRouter();
  const { user, setUser, isAuthenticated, isLoading: authLoading, setLoading } = useAuthStore();
  const { setNodes, setEdges, setLoading: setNetworkLoading, isLoading: networkLoading } = useNetworkStore();
  const { messages, setMessages } = useMessageStore();

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // 데모 메세지 생성 함수
  const generateDemoMessages = (currentUserId: string): Message[] => {
    const otherUsers = demoUsers.filter(u => u.id !== currentUserId).slice(0, 5);
    return [
      {
        id: 'msg-1',
        fromUserId: otherUsers[0]?.id || 'demo-user-2',
        toUserId: currentUserId,
        content: '안녕하세요! 프로필 보고 연락드립니다. AI 관련해서 이야기 나눠보고 싶어요.',
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
        isRead: false,
      },
      {
        id: 'msg-2',
        fromUserId: otherUsers[1]?.id || 'demo-user-3',
        toUserId: currentUserId,
        content: '스타트업 투자 관련해서 조언 부탁드려도 될까요?',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        isRead: false,
      },
    ];
  };

  // Auth state listener
  useEffect(() => {
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

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/onboarding');
    }
  }, [authLoading, isAuthenticated, router]);

  // Load network data
  useEffect(() => {
    const loadNetworkData = async () => {
      if (!user) return;

      setNetworkLoading(true);
      try {
        const { nodes, edges } = await getNetworkGraph(user.id);
        setNodes(nodes);
        setEdges(edges);

        // Load recommendations
        const recs = await getRecommendations(user.id, 3);
        setRecommendations(recs);
      } catch (error) {
        console.error('Error loading network data:', error);
      } finally {
        setNetworkLoading(false);
      }
    };

    loadNetworkData();
  }, [user, setNodes, setEdges, setNetworkLoading]);

  // Load demo messages
  useEffect(() => {
    if (user && messages.length === 0) {
      const currentUserId = user.id.startsWith('demo-user-') ? user.id : 'demo-user-1';
      const demoMessages = generateDemoMessages(currentUserId);
      setMessages(demoMessages);
    }
  }, [user, messages.length, setMessages]);

  // 읽지 않은 메세지 수
  const currentUserId = user?.id.startsWith('demo-user-') ? user.id : 'demo-user-1';
  const unreadCount = messages.filter(m => m.toUserId === currentUserId && !m.isRead).length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-[#8BA4C4]">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Stars Background */}
      <div className="stars-bg" />

      {/* Network Graph - Full Screen */}
      <div className="network-container">
        <NetworkGraph />
      </div>

      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-30 safe-area-top">
        <div className="mx-5 mt-4 bg-[#101D33]/80 backdrop-blur-2xl border border-[#1E3A5F]/50 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Menu Button */}
            <button
              onClick={() => setShowMenu(true)}
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[#1E3A5F]/80 transition-all duration-200 group"
            >
              <Menu size={20} className="text-[#4A5E7A] group-hover:text-white transition-colors" />
            </button>

            {/* Search Bar */}
            <div className="flex-1 min-w-0">
              <SearchBar />
            </div>

            {/* Right Actions - 통일된 아이콘 스타일 */}
            <div className="flex-shrink-0 flex items-center gap-2">
              {/* Messages */}
              <button
                onClick={() => router.push('/messages')}
                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[#1E3A5F]/80 transition-all duration-200 relative group"
              >
                <Mail size={20} className="text-[#4A5E7A] group-hover:text-white transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-[16px] bg-[#FF4081] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications */}
              <button className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[#1E3A5F]/80 transition-all duration-200 group">
                <Bell size={20} className="text-[#4A5E7A] group-hover:text-white transition-colors" />
              </button>

              {/* Profile - 절제된 글로우 효과 */}
              <button
                onClick={() => router.push('/profile')}
                className="ml-1 relative group"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#1E3A5F] group-hover:border-[#86C9F2]/50 transition-all duration-300">
                  <Avatar
                    src={user.profileImage}
                    name={user.name}
                    size="sm"
                  />
                </div>
                {/* 온라인 상태 표시 (항상 켜진 글로우 대신) */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#00E676] border-2 border-[#101D33] rounded-full" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations Panel - ProfileSheet보다 낮은 z-index */}
      <motion.div
        initial={false}
        animate={{
          x: showRecommendations ? 0 : '100%',
        }}
        transition={{ type: 'spring', damping: 25 }}
        className="fixed top-20 right-0 bottom-0 w-full max-w-sm z-20"
      >
        <div className="h-full bg-[#101D33]/95 backdrop-blur-xl border-l border-[#1E3A5F] p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#86C9F2]" />
              <h2 className="font-semibold text-white">오늘의 추천</h2>
            </div>
            <button
              onClick={() => setShowRecommendations(false)}
              className="p-1.5 rounded-lg hover:bg-[#1E3A5F] transition-colors"
            >
              <X size={18} className="text-[#8BA4C4]" />
            </button>
          </div>

          <div className="space-y-4">
            {recommendations.length > 0 ? (
              recommendations.map((rec, i) => (
                <RecommendationCard key={rec.userId} recommendation={rec} index={i} />
              ))
            ) : (
              <div className="text-center py-8">
                <Sparkles size={32} className="text-[#4A5E7A] mx-auto mb-3" />
                <p className="text-[#8BA4C4]">추천할 인맥이 없습니다</p>
                <p className="text-[#4A5E7A] text-sm mt-1">
                  더 많은 사람들과 연결해보세요
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Recommendations Toggle Button */}
      {!showRecommendations && (
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setShowRecommendations(true)}
          className="
            fixed right-4 top-1/2 -translate-y-1/2 z-20
            flex items-center gap-2 px-4 py-3
            bg-gradient-to-r from-[#86C9F2] to-[#2C529C]
            rounded-l-2xl shadow-lg
            text-white font-medium text-sm
          "
        >
          <Sparkles size={18} />
          <span className="hidden sm:inline">추천</span>
          {recommendations.length > 0 && (
            <span className="w-5 h-5 bg-black/20 rounded-full flex items-center justify-center text-xs">
              {recommendations.length}
            </span>
          )}
        </motion.button>
      )}

      {/* Network Stats */}
      <div className="fixed bottom-4 left-4 z-20">
        <div className="glass-light rounded-2xl px-4 py-3 flex items-center gap-4">
          <div className="text-center min-w-[48px]">
            <p className="text-2xl font-bold text-[#86C9F2]">
              {useNetworkStore.getState().nodes.filter(n => n.degree === 1).length}
            </p>
            <p className="text-xs text-[#8BA4C4]">1촌</p>
          </div>
          <div className="w-px h-8 bg-[#1E3A5F]" />
          <div className="text-center min-w-[48px]">
            <p className="text-2xl font-bold text-[#2C529C]">
              {useNetworkStore.getState().nodes.filter(n => n.degree === 2).length}
            </p>
            <p className="text-xs text-[#8BA4C4]">2촌</p>
          </div>
        </div>
      </div>

      {/* Side Menu */}
      {showMenu && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMenu(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed top-0 left-0 bottom-0 w-72 bg-[#101D33] border-r border-[#1E3A5F] z-50 p-6"
          >
            <div className="flex items-center gap-3 mb-8">
              <Avatar
                src={user.profileImage}
                name={user.name}
                size="lg"
                hasGlow
              />
              <div>
                <h3 className="font-semibold text-white">{user.name}</h3>
                <p className="text-sm text-[#8BA4C4]">{user.company}</p>
              </div>
            </div>

            <nav className="space-y-2">
              <button
                onClick={() => {
                  setShowMenu(false);
                  router.push('/profile');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#8BA4C4] hover:bg-[#162A4A] hover:text-white transition-colors"
              >
                <UserIcon size={20} />
                <span>내 프로필</span>
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  router.push('/messages');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#8BA4C4] hover:bg-[#162A4A] hover:text-white transition-colors"
              >
                <MessageCircle size={20} />
                <span>메세지</span>
              </button>
            </nav>

            <div className="absolute bottom-6 left-6 right-6">
              <div className="p-4 bg-[#162A4A] rounded-xl mb-4">
                <p className="text-xs text-[#8BA4C4] mb-2">내 초대 코드</p>
                <p className="font-mono text-lg text-[#86C9F2]">{user.inviteCode}</p>
                <p className="text-xs text-[#4A5E7A] mt-1">
                  남은 초대권: {user.invitesRemaining}개
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Profile Sheet */}
      <ProfileSheet />

      {/* Coffee Chat Modal */}
      <CoffeeChatModal />

      {/* Connection Request Modal */}
      <ConnectionRequestModal />

      {/* Loading Overlay */}
      {networkLoading && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="spinner mx-auto mb-4" />
            <p className="text-[#8BA4C4]">네트워크 로딩 중...</p>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
