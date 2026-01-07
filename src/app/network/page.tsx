'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Menu, Bell, User as UserIcon, Sparkles, X } from 'lucide-react';
import NetworkGraph from '@/components/network/NetworkGraph';
import ProfileSheet from '@/components/network/ProfileSheet';
import SearchBar from '@/components/network/SearchBar';
import CoffeeChatModal from '@/components/coffee-chat/CoffeeChatModal';
import RecommendationCard from '@/components/coffee-chat/RecommendationCard';
import { Avatar, Button } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useNetworkStore } from '@/store/networkStore';
import { getNetworkGraph, getRecommendations, onAuthChange, getUser } from '@/lib/firebase-services';
import { Recommendation } from '@/types';

export default function NetworkPage() {
  const router = useRouter();
  const { user, setUser, isAuthenticated, isLoading: authLoading, setLoading } = useAuthStore();
  const { setNodes, setEdges, setLoading: setNetworkLoading, isLoading: networkLoading } = useNetworkStore();

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-[#8B949E]">로딩 중...</p>
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
      <div className="fixed top-0 left-0 right-0 z-30">
        <div className="glass-light mx-4 mt-4 rounded-2xl px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Menu Button */}
            <button
              onClick={() => setShowMenu(true)}
              className="p-2 rounded-xl hover:bg-[#21262D] transition-colors"
            >
              <Menu size={22} className="text-[#8B949E]" />
            </button>

            {/* Search Bar */}
            <div className="flex-1">
              <SearchBar />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-xl hover:bg-[#21262D] transition-colors relative">
                <Bell size={22} className="text-[#8B949E]" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF4081] rounded-full" />
              </button>
              <button
                onClick={() => router.push('/profile')}
                className="p-1"
              >
                <Avatar
                  src={user.profileImage}
                  name={user.name}
                  size="sm"
                  hasGlow
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations Panel */}
      <motion.div
        initial={false}
        animate={{
          x: showRecommendations ? 0 : '100%',
        }}
        transition={{ type: 'spring', damping: 25 }}
        className="fixed top-20 right-0 bottom-0 w-full max-w-sm z-20"
      >
        <div className="h-full bg-[#0D1117]/95 backdrop-blur-xl border-l border-[#21262D] p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#00E5FF]" />
              <h2 className="font-semibold text-white">오늘의 추천</h2>
            </div>
            <button
              onClick={() => setShowRecommendations(false)}
              className="p-1.5 rounded-lg hover:bg-[#21262D] transition-colors"
            >
              <X size={18} className="text-[#8B949E]" />
            </button>
          </div>

          <div className="space-y-4">
            {recommendations.length > 0 ? (
              recommendations.map((rec, i) => (
                <RecommendationCard key={rec.userId} recommendation={rec} index={i} />
              ))
            ) : (
              <div className="text-center py-8">
                <Sparkles size={32} className="text-[#484F58] mx-auto mb-3" />
                <p className="text-[#8B949E]">추천할 인맥이 없습니다</p>
                <p className="text-[#484F58] text-sm mt-1">
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
            bg-gradient-to-r from-[#00E5FF] to-[#7C4DFF]
            rounded-l-2xl shadow-lg
            text-black font-medium text-sm
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
        <div className="glass-light rounded-2xl px-4 py-3 flex items-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-[#00E5FF]">
              {useNetworkStore.getState().nodes.filter(n => n.degree === 1).length}
            </p>
            <p className="text-xs text-[#8B949E]">1촌</p>
          </div>
          <div className="w-px h-8 bg-[#21262D]" />
          <div className="text-center">
            <p className="text-2xl font-bold text-[#7C4DFF]">
              {useNetworkStore.getState().nodes.filter(n => n.degree === 2).length}
            </p>
            <p className="text-xs text-[#8B949E]">2촌</p>
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
            className="fixed top-0 left-0 bottom-0 w-72 bg-[#0D1117] border-r border-[#21262D] z-50 p-6"
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
                <p className="text-sm text-[#8B949E]">{user.company}</p>
              </div>
            </div>

            <nav className="space-y-2">
              <button
                onClick={() => {
                  setShowMenu(false);
                  router.push('/profile');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#8B949E] hover:bg-[#161B22] hover:text-white transition-colors"
              >
                <UserIcon size={20} />
                <span>내 프로필</span>
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  router.push('/coffee-chat');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#8B949E] hover:bg-[#161B22] hover:text-white transition-colors"
              >
                <Sparkles size={20} />
                <span>커피챗 관리</span>
              </button>
            </nav>

            <div className="absolute bottom-6 left-6 right-6">
              <div className="p-4 bg-[#161B22] rounded-xl mb-4">
                <p className="text-xs text-[#8B949E] mb-2">내 초대 코드</p>
                <p className="font-mono text-lg text-[#00E5FF]">{user.inviteCode}</p>
                <p className="text-xs text-[#484F58] mt-1">
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

      {/* Loading Overlay */}
      {networkLoading && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="spinner mx-auto mb-4" />
            <p className="text-[#8B949E]">네트워크 로딩 중...</p>
          </div>
        </div>
      )}
    </div>
  );
}
