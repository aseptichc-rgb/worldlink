'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Menu, Bell, User as UserIcon, Sparkles, X, MessageCircle, Mail, LogOut, ArrowLeft, Users, FolderOpen } from 'lucide-react';
import NetworkGraph from '@/components/network/NetworkGraph';
import ProfileSheet from '@/components/network/ProfileSheet';
import SearchBar from '@/components/network/SearchBar';
import CoffeeChatModal from '@/components/coffee-chat/CoffeeChatModal';
import ConnectionRequestModal from '@/components/connection/ConnectionRequestModal';
import RecommendationCard from '@/components/coffee-chat/RecommendationCard';
import GroupManagementPanel from '@/components/network/GroupManagementPanel';
import GroupFilterBar from '@/components/network/GroupFilterBar';
import GroupAssignModal from '@/components/network/GroupAssignModal';
import GroupDetailPanel from '@/components/network/GroupDetailPanel';
import AddMembersToGroupModal from '@/components/network/AddMembersToGroupModal';
import GroupInviteModal from '@/components/network/GroupInviteModal';
import { Avatar, Button } from '@/components/ui';
import BottomNav from '@/components/ui/BottomNav';
import { useAuthStore } from '@/store/authStore';
import { useNetworkStore } from '@/store/networkStore';
import { useGroupStore, flushGroupSync } from '@/store/groupStore';
import { useMessageStore, Message } from '@/store/messageStore';
import { demoUsers, getDemoCompatibleId, ensureUserInDemoNetwork } from '@/lib/demo-data';
import { getNetworkGraph, getRecommendations, onAuthChange, getUser, logoutUser } from '@/lib/firebase-services';
import { Recommendation } from '@/types';

export default function NetworkPage() {
  const router = useRouter();
  const { user, setUser, isAuthenticated, isLoading: authLoading, setLoading, logout } = useAuthStore();
  const { setNodes, setEdges, setLoading: setNetworkLoading, isLoading: networkLoading, centerUserId, setCenterUserId } = useNetworkStore();
  const { messages, setMessages } = useMessageStore();
  const { groups, toggleGroupPanel, loadFromFirebase, clearGroups } = useGroupStore();

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [centerUserName, setCenterUserName] = useState<string | null>(null);

  // 로그인 시 Firebase에서 그룹 불러오기
  useEffect(() => {
    if (user) {
      loadFromFirebase(user.id);
    }
  }, [user, loadFromFirebase]);

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

  // Load network data (centerUserId가 바뀌면 해당 인물 중심으로 재로드)
  useEffect(() => {
    const loadNetworkData = async () => {
      if (!user) return;

      const targetUserId = centerUserId || user.id;
      const isMyNetwork = !centerUserId || centerUserId === user.id;

      setNetworkLoading(true);
      try {
        if (isMyNetwork) {
          // 내 네트워크
          const { nodes: fetchedNodes, edges } = await getNetworkGraph(user.id, {
            name: user.name,
            profileImage: user.profileImage,
            company: user.company,
            position: user.position,
            keywords: user.keywords,
          });
          const demoId = getDemoCompatibleId(user);
          const syncedNodes = fetchedNodes.map(node =>
            (node.id === user.id || node.id === demoId) && node.degree === 0 && user.profileImage
              ? { ...node, profileImage: user.profileImage }
              : node
          );
          setNodes(syncedNodes);
          setEdges(edges);
          setCenterUserName(null);
        } else {
          // 다른 인물의 네트워크
          const { nodes: fetchedNodes, edges } = await getNetworkGraph(targetUserId);
          setNodes(fetchedNodes);
          setEdges(edges);
          // 중심 인물 이름 저장
          const centerNode = fetchedNodes.find(n => n.degree === 0);
          setCenterUserName(centerNode?.name || null);
        }

        // Load recommendations (내 네트워크일 때만)
        if (isMyNetwork) {
          const recs = await getRecommendations(user.id, 3);
          setRecommendations(recs);
        }
      } catch (error) {
        console.error('Error loading network data:', error);
      } finally {
        setNetworkLoading(false);
      }
    };

    loadNetworkData();
  }, [user, centerUserId, setNodes, setEdges, setNetworkLoading]);

  // Load demo messages
  useEffect(() => {
    if (user && messages.length === 0) {
      const demoId = getDemoCompatibleId(user);
      ensureUserInDemoNetwork(user.id);
      const currentUserId = demoId !== user.id ? demoId : user.id;
      const demoMessages = generateDemoMessages(currentUserId);
      setMessages(demoMessages);
    }
  }, [user, messages.length, setMessages]);

  // 읽지 않은 메세지 수
  const currentUserId = user ? (getDemoCompatibleId(user) !== user.id ? getDemoCompatibleId(user) : user.id) : 'member_1';
  const unreadCount = messages.filter(m => m.toUserId === currentUserId && !m.isRead).length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-[#64748B]">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC] relative overflow-hidden">
      {/* Network Graph - Full Screen */}
      <div className="network-container">
        <NetworkGraph />
      </div>

      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-30 safe-area-top">
        <div className="mx-5 mt-4 bg-white/90 backdrop-blur-xl border border-[#E2E8F0] rounded-xl px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Menu Button 또는 뒤로가기 버튼 */}
            {centerUserId && centerUserId !== user.id ? (
              <button
                onClick={() => setCenterUserId(null)}
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[#2563EB]/10 transition-all duration-200 group"
              >
                <ArrowLeft size={20} className="text-[#2563EB] group-hover:text-[#1D4ED8] transition-colors" />
              </button>
            ) : (
              <button
                onClick={() => setShowMenu(true)}
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[#F1F3F5] transition-all duration-200 group"
              >
                <Menu size={20} className="text-[#94A3B8] group-hover:text-[#1A1A2E] transition-colors" />
              </button>
            )}

            {/* Search Bar 또는 인맥 보기 표시 */}
            {centerUserId && centerUserId !== user.id ? (
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <Users size={16} className="text-[#2563EB] flex-shrink-0" />
                <span className="text-base font-medium text-[#1A1A2E] truncate">
                  {centerUserName || '인물'}님의 인맥
                </span>
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <SearchBar />
              </div>
            )}

            {/* Right Actions - 통일된 아이콘 스타일 */}
            <div className="flex-shrink-0 flex items-center gap-2">
              {/* Messages */}
              <button
                onClick={() => router.push('/messages')}
                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[#F1F3F5] transition-all duration-200 relative group"
              >
                <Mail size={20} className="text-[#94A3B8] group-hover:text-[#1A1A2E] transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-[16px] bg-[#EF4444] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications */}
              <button className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[#F1F3F5] transition-all duration-200 group">
                <Bell size={20} className="text-[#94A3B8] group-hover:text-[#1A1A2E] transition-colors" />
              </button>

              {/* Profile */}
              <button
                onClick={() => router.push('/profile')}
                className="ml-1 relative group"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#E2E8F0] group-hover:border-[#2563EB]/50 transition-all duration-300">
                  <Avatar
                    src={user.profileImage}
                    name={user.name}
                    size="sm"
                  />
                </div>
                {/* 온라인 상태 표시 */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#10B981] border-2 border-white rounded-full" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Group Filter Bar */}
      {groups.length > 0 && (
        <div className="fixed top-[88px] left-0 right-0 z-25 px-5">
          <div className="bg-white/80 backdrop-blur-xl rounded-xl px-3 py-1.5">
            <GroupFilterBar />
          </div>
        </div>
      )}

      {/* Recommendations Panel - ProfileSheet보다 낮은 z-index */}
      <motion.div
        initial={false}
        animate={{
          x: showRecommendations ? 0 : '100%',
        }}
        transition={{ type: 'spring', damping: 25 }}
        className="fixed top-20 right-0 bottom-0 w-full max-w-sm z-20"
      >
        <div className="h-full bg-white/95 backdrop-blur-xl border-l border-[#E2E8F0] p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#2563EB]" />
              <h2 className="font-semibold text-[#1A1A2E]">오늘의 추천</h2>
            </div>
            <button
              onClick={() => setShowRecommendations(false)}
              className="p-1.5 rounded-lg hover:bg-[#F1F3F5] transition-colors"
            >
              <X size={18} className="text-[#64748B]" />
            </button>
          </div>

          <div className="space-y-4">
            {recommendations.length > 0 ? (
              recommendations.map((rec, i) => (
                <RecommendationCard key={rec.userId} recommendation={rec} index={i} />
              ))
            ) : (
              <div className="text-center py-8">
                <Sparkles size={32} className="text-[#94A3B8] mx-auto mb-3" />
                <p className="text-[#64748B]">추천할 인맥이 없습니다</p>
                <p className="text-[#94A3B8] text-base mt-1">
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
            bg-gradient-to-r from-[#2563EB] to-[#3B82F6]
            rounded-l-2xl shadow-lg
            text-white font-medium text-base
          "
        >
          <Sparkles size={18} />
          <span className="hidden sm:inline">추천</span>
          {recommendations.length > 0 && (
            <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs">
              {recommendations.length}
            </span>
          )}
        </motion.button>
      )}

      {/* Network Stats */}
      <div className="fixed bottom-4 left-4 z-20">
        <div className="bg-white rounded-xl px-4 py-3 flex items-center gap-4 shadow-[0_4px_6px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.03)] border border-[#E2E8F0]">
          <div className="text-center min-w-[48px]">
            <p className="text-2xl font-bold text-[#2563EB]">
              {useNetworkStore.getState().nodes.filter(n => n.degree === 1).length}
            </p>
            <p className="text-sm text-[#64748B]">1촌</p>
          </div>
          <div className="w-px h-8 bg-[#E2E8F0]" />
          <div className="text-center min-w-[48px]">
            <p className="text-2xl font-bold text-[#3B82F6]">
              {useNetworkStore.getState().nodes.filter(n => n.degree === 2).length}
            </p>
            <p className="text-sm text-[#64748B]">2촌</p>
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
            className="fixed inset-0 bg-[rgba(0,0,0,0.3)] backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed top-0 left-0 bottom-0 w-72 bg-white border-r border-[#E2E8F0] z-50 p-6"
          >
            <div className="flex items-center gap-3 mb-8">
              <Avatar
                src={user.profileImage}
                name={user.name}
                size="lg"
                hasGlow
              />
              <div>
                <h3 className="font-semibold text-[#1A1A2E]">{user.name}</h3>
                <p className="text-base text-[#64748B]">{user.company}</p>
              </div>
            </div>

            <nav className="space-y-2">
              <button
                onClick={() => {
                  setShowMenu(false);
                  router.push('/profile');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#64748B] hover:bg-[#F1F3F5] hover:text-[#1A1A2E] transition-colors"
              >
                <UserIcon size={20} />
                <span>내 프로필</span>
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  router.push('/messages');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#64748B] hover:bg-[#F1F3F5] hover:text-[#1A1A2E] transition-colors"
              >
                <MessageCircle size={20} />
                <span>메세지</span>
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  toggleGroupPanel();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#64748B] hover:bg-[#F1F3F5] hover:text-[#1A1A2E] transition-colors"
              >
                <FolderOpen size={20} />
                <span>그룹 관리</span>
                {groups.length > 0 && (
                  <span className="ml-auto text-sm text-[#94A3B8]">{groups.length}</span>
                )}
              </button>
              <button
                onClick={async () => {
                  setShowMenu(false);
                  try {
                    await flushGroupSync(); // 대기 중인 그룹 데이터를 Firebase에 즉시 저장
                    await logoutUser();
                    clearGroups();
                    logout();
                    router.push('/onboarding');
                  } catch (error) {
                    console.error('Error logging out:', error);
                  }
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
              >
                <LogOut size={20} />
                <span>로그아웃</span>
              </button>
            </nav>

            <div className="absolute bottom-6 left-6 right-6">
              <div className="p-4 bg-[#F1F3F5] rounded-xl mb-4">
                <p className="text-sm text-[#64748B] mb-2">내 초대 코드</p>
                <p className="font-mono text-lg text-[#2563EB]">{user.inviteCode}</p>
                <p className="text-sm text-[#94A3B8] mt-1">
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

      {/* Group Management Panel */}
      <GroupManagementPanel />

      {/* Group Assign Modal */}
      <GroupAssignModal />

      {/* Group Detail Panel */}
      <GroupDetailPanel />

      {/* Add Members to Group Modal */}
      <AddMembersToGroupModal />

      {/* Group Invite Modal */}
      <GroupInviteModal />

      {/* Loading Overlay */}
      {networkLoading && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.3)] flex items-center justify-center z-50">
          <div className="text-center">
            <div className="spinner mx-auto mb-4" />
            <p className="text-[#64748B]">네트워크 로딩 중...</p>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
