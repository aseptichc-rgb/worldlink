'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  MessageCircle,
  Building,
  Briefcase,
  Users,
  ArrowRight,
  X,
  UserPlus,
  StickyNote,
  Check,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Link2,
  Hash,
  Send,
  Loader2,
  FolderOpen,
  Plus,
  Upload,
  Clock,
  CalendarPlus,
  Newspaper,
} from 'lucide-react';
import { Avatar, Tag, Button } from '@/components/ui';
import InteractionLogModal from '@/components/interaction/InteractionLogModal';
import InteractionTimeline from '@/components/interaction/InteractionTimeline';
import { useNetworkStore } from '@/store/networkStore';
import { useCoffeeChatStore } from '@/store/coffeeChatStore';
import { useConnectionRequestStore } from '@/store/connectionRequestStore';
import { useMemoStore } from '@/store/memoStore';
import { useGroupStore } from '@/store/groupStore';
import { useAuthStore } from '@/store/authStore';
import { useMessageStore } from '@/store/messageStore';
import { useInteractionStore } from '@/store/interactionStore';
import { useNewsAlertStore } from '@/store/newsAlertStore';
import { findConnectionPath, getUser, getUserConnectionsWithDetails, getDirectConnections } from '@/lib/firebase-services';
import { findDemoConnectionPath, demoUsers, demoConnections, getDemoCompatibleId, ensureUserInDemoNetwork } from '@/lib/demo-data';
import { getDisplayInfo } from '@/lib/privacy-utils';
import { User, NetworkNode } from '@/types';

export default function ProfileSheet() {
  const { selectedNode, setSelectedNode, setFocusedNodeId, nodes } = useNetworkStore();
  const { openRequestModal } = useCoffeeChatStore();
  const { openRequestModal: openConnectionRequestModal } = useConnectionRequestStore();
  const { getMemo, setMemo, deleteMemo } = useMemoStore();
  const { getGroupsForNode, removeNodeFromGroup, openGroupAssignModal } = useGroupStore();
  const { user: currentUser } = useAuthStore();
  const { sendMessageToUser } = useMessageStore();

  const [connectionPath, setConnectionPath] = useState<User[]>([]);
  const [isLoadingPath, setIsLoadingPath] = useState(false);
  const [theirConnections, setTheirConnections] = useState<User[]>([]);
  const [selectedUserData, setSelectedUserData] = useState<User | null>(null);
  const [myConnectionIds, setMyConnectionIds] = useState<Set<string>>(new Set());
  const [myConnectionMethods, setMyConnectionMethods] = useState<Map<string, string>>(new Map());

  // 메모 관련 상태
  const [isEditingMemo, setIsEditingMemo] = useState(false);
  const [memoText, setMemoText] = useState('');

  // 연락 기록 모달 상태
  const [showInteractionModal, setShowInteractionModal] = useState(false);

  const { getDaysSinceLastContact, getRelationshipStatus, addInteraction } = useInteractionStore();
  const { allGroupNews, markAsRead } = useNewsAlertStore();

  // 선택된 인물의 관련 뉴스 (캐시 + 개별 검색)
  const [profileNews, setProfileNews] = useState<import('@/app/api/news/route').NewsItem[]>([]);

  useEffect(() => {
    if (!selectedNode) {
      setProfileNews([]);
      return;
    }

    // 1) 캐시에서 먼저 확인
    const cached = allGroupNews.filter(n => n.memberName === selectedNode.name);
    if (cached.length > 0) {
      setProfileNews(cached);
      return;
    }

    // 2) 캐시에 없으면 직접 API 검색
    const member = { name: selectedNode.name, company: selectedNode.company };
    if (!member.name) return;

    let cancelled = false;
    fetch('/api/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ members: [member], timeRange: '6m' }),
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!cancelled && data?.news?.length > 0) {
          setProfileNews(data.news);
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [selectedNode?.id, selectedNode?.name, selectedNode?.company, allGroupNews]);

  const memberNews = profileNews;

  // 메시지 관련 상태
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  // 선택된 노드의 메모 가져오기
  const currentMemo = selectedNode ? getMemo(selectedNode.id) : null;

  // 노드가 바뀌면 메모 편집 모드 및 메시지 모달 초기화
  useEffect(() => {
    setIsEditingMemo(false);
    setMemoText(currentMemo?.content || '');
    setShowMessageModal(false);
    setMessageContent('');
    setMessageSent(false);
  }, [selectedNode?.id, currentMemo?.content]);

  // 내 1촌 목록 불러오기 (공통 인맥 표시용)
  useEffect(() => {
    const loadMyConnections = async () => {
      if (!currentUser) return;

      try {
        const demoId = getDemoCompatibleId(currentUser);
        const isDemoUser = demoId !== currentUser.id || currentUser.id.startsWith('member_') || currentUser.id.startsWith('demo_');
        if (isDemoUser) {
          // 데모 사용자의 경우
          ensureUserInDemoNetwork(demoId);
          const myConnIds = demoConnections[demoId] || [];
          setMyConnectionIds(new Set(myConnIds));
        } else {
          // 실제 사용자의 경우
          const connections = await getDirectConnections(currentUser.id);
          const connIds = connections.map(conn =>
            conn.fromUserId === currentUser.id ? conn.toUserId : conn.fromUserId
          );
          setMyConnectionIds(new Set(connIds));
          const methodMap = new Map<string, string>();
          connections.forEach(conn => {
            const otherId = conn.fromUserId === currentUser.id ? conn.toUserId : conn.fromUserId;
            // 이미 더 강한 연결(managed_group 아닌)이 있으면 덮어쓰지 않음
            if (!methodMap.has(otherId) || methodMap.get(otherId) === 'managed_group') {
              methodMap.set(otherId, conn.method);
            }
          });
          setMyConnectionMethods(methodMap);
        }
      } catch (error) {
        console.error('Error loading my connections:', error);
      }
    };

    loadMyConnections();
  }, [currentUser]);

  useEffect(() => {
    let cancelled = false;

    // 노드 변경 시 이전 데이터 즉시 초기화 (stale 데이터 방지)
    setConnectionPath([]);
    setSelectedUserData(null);
    setTheirConnections([]);

    const loadConnectionPath = async () => {
      if (!selectedNode || !currentUser) return;

      setIsLoadingPath(true);
      try {
        // 가져온 연락처인 경우: 노드 정보를 직접 사용
        if (selectedNode.isImported) {
          const importedUserData: User = {
            id: selectedNode.id,
            name: selectedNode.name,
            email: selectedNode.email || '',
            phone: selectedNode.phone,
            company: selectedNode.company,
            position: selectedNode.position,
            keywords: selectedNode.keywords || [],
            inviteCode: '',
            invitesRemaining: 0,
            coffeeStatus: 'available' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          if (cancelled) return;
          setConnectionPath([currentUser, importedUserData]);
          setSelectedUserData(importedUserData);
          setTheirConnections([]);
          setIsLoadingPath(false);
          return;
        }

        const fromDemoId = getDemoCompatibleId(currentUser);
        const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('nodded_demo_mode') === 'true';
        const isDemoNode = selectedNode.id.startsWith('demo_') || selectedNode.id.startsWith('member_');
        if (isDemoNode) {
          ensureUserInDemoNetwork(fromDemoId);
          const pathIds = findDemoConnectionPath(fromDemoId !== currentUser.id ? fromDemoId : currentUser.id, selectedNode.id);
          const pathUsers: User[] = pathIds.map(id => {
            const demoUser = demoUsers.find(u => u.id === id);
            if (demoUser) return demoUser;
            return { id, name: '나', email: '', inviteCode: '', invitesRemaining: 0, coffeeStatus: 'available' as const, keywords: [], createdAt: new Date(), updatedAt: new Date() };
          });
          if (cancelled) return;
          setConnectionPath(pathUsers);

          const demoUserData = demoUsers.find(u => u.id === selectedNode.id);
          setSelectedUserData(demoUserData || null);

          // 1촌일 때만 인맥 보여주기
          const isFirstDegree = pathIds.length === 2; // 나 -> 상대 = 2 노드
          if (isFirstDegree) {
            const theirConnectionIds = demoConnections[selectedNode.id] || [];
            const theirConnectionUsers = theirConnectionIds
              .map(id => demoUsers.find(u => u.id === id))
              .filter((u): u is User => u !== undefined);
            setTheirConnections(theirConnectionUsers);
          } else {
            // 2촌 이상에서도 공통 인맥 표시를 위해 전체 User 데이터 로드
            const theirConnectionIds = demoConnections[selectedNode.id] || [];
            const theirConnectionUsers = theirConnectionIds
              .map(id => demoUsers.find(u => u.id === id))
              .filter((u): u is User => u !== undefined);
            setTheirConnections(theirConnectionUsers);
          }
        } else {
          const pathIds = await findConnectionPath(currentUser.id, selectedNode.id);
          if (cancelled) return;
          const pathUsers: User[] = [];

          for (const userId of pathIds) {
            const user = await getUser(userId);
            if (cancelled) return;
            if (user) pathUsers.push(user);
          }

          setConnectionPath(pathUsers);

          const userData = await getUser(selectedNode.id);
          if (cancelled) return;
          setSelectedUserData(userData);

          // 1촌일 때만 상대방의 인맥 목록 가져오기
          const isFirstDegree = pathIds.length === 2;
          if (isFirstDegree && userData) {
            const connections = await getUserConnectionsWithDetails(selectedNode.id);
            if (cancelled) return;
            setTheirConnections(connections);
          } else if (userData) {
            // 2촌 이상에서도 공통 인맥 표시를 위해 전체 User 데이터 유지
            const connections = await getUserConnectionsWithDetails(selectedNode.id);
            if (cancelled) return;
            setTheirConnections(connections);
          } else {
            setTheirConnections([]);
          }
        }
      } catch (error) {
        if (!cancelled) console.error('Error loading connection path:', error);
      } finally {
        if (!cancelled) setIsLoadingPath(false);
      }
    };

    loadConnectionPath();
    return () => { cancelled = true; };
  }, [selectedNode, currentUser]);

  const handleCoffeeChatClick = () => {
    if (selectedNode) {
      openRequestModal(selectedNode.id);
    }
  };

  // 메시지 보내기 핸들러 (1촌 + 2촌)
  const [sendError, setSendError] = useState('');
  const handleSendMessage = async () => {
    if (!selectedNode || !currentUser || !messageContent.trim()) return;

    setIsSendingMessage(true);
    setSendError('');

    const currentUserId = getDemoCompatibleId(currentUser) !== currentUser.id
      ? getDemoCompatibleId(currentUser)
      : currentUser.id;

    const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('nodded_demo_mode') === 'true';

    const result = await sendMessageToUser(
      currentUserId,
      selectedNode.id,
      messageContent.trim(),
      isDemoMode
    );

    if (result.success) {
      addInteraction(currentUserId, selectedNode.id, 'message', messageContent.trim(), true);
      setMessageSent(true);
      setIsSendingMessage(false);

      setTimeout(() => {
        setShowMessageModal(false);
        setMessageContent('');
        setMessageSent(false);
      }, 1500);
    } else {
      setSendError(result.error || '메시지 전송에 실패했습니다.');
      setIsSendingMessage(false);
    }
  };

  // 메시지 버튼 클릭 (1촌 + 2촌)
  const handleMessageClick = () => {
    setSendError('');
    setShowMessageModal(true);
  };

  const handleConnectionRequestClick = () => {
    if (selectedNode) {
      openConnectionRequestModal(selectedNode.id);
    }
  };

  const handleSaveMemo = () => {
    if (selectedNode && memoText.trim()) {
      setMemo(selectedNode.id, memoText.trim());
      setIsEditingMemo(false);
      if (currentUser) {
        const userId = getDemoCompatibleId(currentUser);
        addInteraction(userId, selectedNode.id, 'memo', memoText.trim(), true);
      }
    }
  };

  const handleDeleteMemo = () => {
    if (selectedNode) {
      deleteMemo(selectedNode.id);
      setMemoText('');
      setIsEditingMemo(false);
    }
  };

  const handleClose = () => {
    setSelectedNode(null);
    setFocusedNodeId(null);
  };

  // 인맥 클릭 시 해당 인물로 이동
  const handleConnectionClick = (user: User) => {
    if (!currentUser) return;
    const currentDemoId = getDemoCompatibleId(currentUser);
    if (user.id === currentUser.id || user.id === currentDemoId) return;

    const existingNode = nodes.find(n => n.id === user.id);

    if (existingNode) {
      setSelectedNode(existingNode);
      setFocusedNodeId(user.id);
    } else {
      ensureUserInDemoNetwork(currentDemoId);
      const pathIds = findDemoConnectionPath(currentDemoId !== currentUser.id ? currentDemoId : currentUser.id, user.id);
      const degree = pathIds.length > 0 ? pathIds.length - 1 : 2;

      const newNode: NetworkNode = {
        id: user.id,
        name: user.name,
        company: user.company || '',
        position: user.position || '',
        profileImage: user.profileImage,
        keywords: user.keywords || [],
        degree: degree,
        connectionCount: demoConnections[user.id]?.length || 0,
      };
      setSelectedNode(newNode);
    }
  };

  if (!selectedNode) return null;

  const connectionDegree = connectionPath.length > 0 ? connectionPath.length - 1 : selectedNode.degree;

  return (
    <AnimatePresence>
      {selectedNode && (
        <motion.div
          key={`profile-${selectedNode.id}`}
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-0 right-0 bottom-0 w-full sm:max-w-[380px] z-30 pointer-events-auto"
        >
          {/* Panel Container - 모바일에서는 전체 화면 */}
          <div className="h-full bg-[#121212] sm:bg-gradient-to-l sm:from-[#121212]/98 sm:via-[#1E1E1E]/95 sm:to-transparent">
            {/* Content Area */}
            <div className="h-full w-full sm:w-[340px] sm:ml-auto bg-[#1E1E1E] sm:bg-[#1E1E1E]/98 sm:backdrop-blur-2xl sm:border-l border-[#363636]/60 overflow-hidden flex flex-col">
              {/* Header - 모바일에서 더 큰 터치 영역 */}
              <div
                className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-[#363636]/50 bg-[#121212]/50"
                style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#58A6FF] animate-pulse" />
                  <span className="text-base font-medium text-[#8B949E]">프로필</span>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2.5 sm:p-2 rounded-lg hover:bg-[#363636] active:bg-[#404040] transition-all duration-200 touch-manipulation"
                >
                  <X size={20} className="sm:w-[18px] sm:h-[18px] text-[#8B949E] hover:text-white transition-colors" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto no-scrollbar">
                {/* Profile Header Section */}
                <div className="px-5 py-5 bg-gradient-to-b from-[#121212]/80 to-transparent">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar
                        src={selectedNode.profileImage}
                        name={selectedNode.name}
                        size="xl"
                        hasGlow={connectionDegree === 1 && !selectedNode.isImported}
                      />
                      {selectedNode.isImported ? (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#3FB950] flex items-center justify-center">
                          <Upload size={10} className="text-[#121212]" />
                        </div>
                      ) : connectionDegree === 1 && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#58A6FF] flex items-center justify-center">
                          <Link2 size={12} className="text-[#121212]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      {/* 1촌이거나 가져온 연락처면 전체 정보, 아니면 비식별화된 정보 표시 */}
                      {(() => {
                        const isConnected = (connectionDegree === 1 && myConnectionMethods.get(selectedNode.id) !== 'managed_group') || !!selectedNode.isImported;
                        const displayInfo = selectedUserData
                          ? getDisplayInfo(selectedUserData, isConnected)
                          : {
                              name: isConnected ? selectedNode.name : `${selectedNode.name?.[0] || '?'}*님`,
                              company: isConnected ? selectedNode.company : null,
                              position: isConnected ? selectedNode.position : null,
                              isPublic: true
                            };

                        return (
                          <>
                            <h2 className="text-xl font-bold text-white truncate tracking-tight">
                              {displayInfo.name}
                            </h2>
                            {displayInfo.company && (
                              <div className="flex items-center gap-2 mt-1.5 text-[#8B949E] text-base">
                                <Building size={14} className="text-[#58A6FF] flex-shrink-0" />
                                <span className="truncate">{displayInfo.company}</span>
                              </div>
                            )}
                            {displayInfo.position && (
                              <div className="flex items-center gap-2 mt-1 text-[#8B949E] text-base">
                                <Briefcase size={14} className="text-[#1F6FEB] flex-shrink-0" />
                                <span className="truncate">{displayInfo.position}</span>
                              </div>
                            )}
                            {!displayInfo.company && !displayInfo.position && !isConnected && (
                              <div className="flex items-center gap-2 mt-1.5 text-[#484F58] text-base">
                                <span className="text-sm">1촌 연결 시 상세 정보 확인 가능</span>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Stats Badges */}
                  {(() => {
                    const mutualCount = theirConnections
                      .map(u => u.id)
                      .filter(id => myConnectionIds.has(id)).length;

                    // 가져온 연락처인 경우 다른 뱃지 표시
                    if (selectedNode.isImported) {
                      // 내가 가져온 연락처인 경우에만 전화번호/이메일 표시
                      const isMyImportedContact = currentUser?.id === selectedNode.importedByUserId;

                      return (
                        <div className="mt-5">
                          <div className="flex items-center gap-2 px-3 py-2 bg-[#3FB950]/10 rounded-lg border border-[#3FB950]/30 mb-3">
                            <Upload size={14} className="text-[#3FB950]" />
                            <span className="text-sm text-[#3FB950]">가져온 연락처</span>
                          </div>
                          {isMyImportedContact && selectedNode.phone && (
                            <div className="flex items-center gap-2 text-[#8B949E] text-sm mb-1">
                              <Phone size={14} className="text-[#58A6FF]" />
                              <span>{selectedNode.phone}</span>
                            </div>
                          )}
                          {isMyImportedContact && selectedNode.email && (
                            <div className="flex items-center gap-2 text-[#8B949E] text-sm">
                              <Mail size={14} className="text-[#58A6FF]" />
                              <span>{selectedNode.email}</span>
                            </div>
                          )}
                          {!isMyImportedContact && (
                            <div className="text-[#484F58] text-sm">
                              연락처 소유자만 개인정보 열람 가능
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div className="flex items-center gap-3 mt-5">
                        <div className="stat-badge flex-1">
                          {connectionDegree >= 99 ? (
                            <>
                              <span className="stat-badge-value text-[#10B981] text-sm">전체</span>
                              <span className="stat-badge-label">공개 프로필</span>
                            </>
                          ) : (
                            <>
                              <span className="stat-badge-value text-[#FFB800]">{connectionDegree}</span>
                              <span className="stat-badge-label">단계 거리</span>
                            </>
                          )}
                        </div>
                        <div className="stat-badge flex-1">
                          <span className="stat-badge-value text-[#58A6FF]">{selectedNode.connectionCount}</span>
                          <span className="stat-badge-label">연결된 인맥</span>
                        </div>
                        {mutualCount > 0 && (
                          <div className="stat-badge flex-1">
                            <span className="stat-badge-value text-[#FFB800]">{mutualCount}</span>
                            <span className="stat-badge-label">공통 인맥</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="px-5 pb-5 space-y-5">
                  {/* Contact Info - 1촌(모임 자동연결 제외) 또는 가져온 연락처에게 표시 */}
                  {((connectionDegree === 1 && myConnectionMethods.get(selectedNode.id) !== 'managed_group') || selectedNode.isImported) && selectedUserData && (selectedUserData.email || selectedUserData.phone) && (
                    <section>
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-[#8B949E] uppercase tracking-wider mb-3">
                        <Mail size={12} />
                        연락처
                      </h3>
                      <div className="info-card space-y-2.5">
                        {selectedUserData.email && (
                          <a
                            href={`mailto:${selectedUserData.email}`}
                            className="flex items-center gap-3 text-base text-[#8B949E] hover:text-[#58A6FF] transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-[#363636] flex items-center justify-center group-hover:bg-[#58A6FF]/10 transition-colors">
                              <Mail size={14} className="text-[#58A6FF]" />
                            </div>
                            <span className="truncate">{selectedUserData.email}</span>
                          </a>
                        )}
                        {selectedUserData.phone && (
                          <a
                            href={`tel:${selectedUserData.phone}`}
                            className="flex items-center gap-3 text-base text-[#8B949E] hover:text-[#58A6FF] transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-[#363636] flex items-center justify-center group-hover:bg-[#58A6FF]/10 transition-colors">
                              <Phone size={14} className="text-[#58A6FF]" />
                            </div>
                            <span>{selectedUserData.phone}</span>
                          </a>
                        )}
                      </div>
                    </section>
                  )}

                  {/* Connection Path */}
                  <section>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-[#8B949E] uppercase tracking-wider mb-3">
                      <Link2 size={12} />
                      {connectionDegree >= 99 ? '프로필 공개 상태' : '연결 경로'}
                    </h3>
                    {connectionDegree >= 99 ? (
                      <div className="info-card border border-[#10B981]/30 bg-[#10B981]/5">
                        <div className="flex items-center gap-3 py-2">
                          <div className="w-10 h-10 rounded-full bg-[#10B981]/20 flex items-center justify-center">
                            <Users size={20} className="text-[#10B981]" />
                          </div>
                          <div>
                            <p className="text-[#10B981] text-base font-medium">전체 공개 프로필</p>
                            <p className="text-[#484F58] text-sm mt-0.5">인맥 신청을 통해 연결해보세요</p>
                          </div>
                        </div>
                      </div>
                    ) : isLoadingPath ? (
                      <div className="info-card flex items-center justify-center py-6">
                        <div className="spinner w-6 h-6" />
                      </div>
                    ) : connectionPath.length > 0 ? (
                      <div className="info-card info-card-highlight">
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                          {connectionPath.map((user, idx) => (
                            <div key={`path-${user.id || ''}-${idx}`} className="flex items-center gap-2 flex-shrink-0">
                              <div className="flex flex-col items-center">
                                <div className="relative">
                                  <Avatar
                                    src={user.profileImage}
                                    name={user.name}
                                    size="sm"
                                    hasGlow={idx === 0 || idx === connectionPath.length - 1}
                                  />
                                  {idx === 0 && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#58A6FF] flex items-center justify-center text-[8px] font-bold text-[#121212]">
                                      나
                                    </div>
                                  )}
                                </div>
                                <span className="text-[10px] text-[#8B949E] mt-1.5 max-w-[48px] truncate text-center font-medium">
                                  {idx === 0 ? '나' : user.name.slice(0, 4)}
                                </span>
                              </div>
                              {idx < connectionPath.length - 1 && (
                                <div className="flex items-center">
                                  <div className={`w-6 h-0.5 ${idx === 0 ? 'bg-[#58A6FF]' : 'bg-[#1F6FEB]'}`} />
                                  <ArrowRight size={14} className={`flex-shrink-0 -mx-1 ${idx === 0 ? 'text-[#58A6FF]' : 'text-[#1F6FEB]'}`} />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="info-card">
                        <p className="text-[#484F58] text-base text-center py-2">연결 경로를 찾을 수 없습니다</p>
                      </div>
                    )}
                  </section>

                  {/* Keywords & Tags */}
                  {selectedNode.keywords.length > 0 && (
                    <section>
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-[#8B949E] uppercase tracking-wider mb-3">
                        <Hash size={12} />
                        {selectedNode.name}님은
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedNode.keywords.filter(k => k && k.trim() !== '').map((keyword, idx) => {
                          const isMatching = currentUser?.keywords.includes(keyword);
                          return (
                            <Tag
                              key={`${keyword}-${idx}`}
                              label={`#${keyword.replace(/^#/, '')}`}
                              isHighlighted={isMatching}
                              size="sm"
                            />
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {/* Groups Section */}
                  {connectionDegree !== 0 && (
                    <section>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#8B949E] uppercase tracking-wider">
                          <FolderOpen size={12} />
                          그룹
                        </h3>
                        <button
                          onClick={() => openGroupAssignModal(selectedNode.id)}
                          className="p-1.5 rounded-lg hover:bg-[#363636] transition-colors"
                        >
                          <Plus size={12} className="text-[#8B949E]" />
                        </button>
                      </div>

                      {(() => {
                        const nodeGroups = getGroupsForNode(selectedNode.id);
                        return nodeGroups.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {nodeGroups.map((group) => (
                              <span
                                key={group.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-[#252525] border border-[#363636]"
                                style={{ borderColor: group.color + '60' }}
                              >
                                <span>{group.icon}</span>
                                <span style={{ color: group.color }}>{group.name}</span>
                                <button
                                  onClick={() => removeNodeFromGroup(selectedNode.id, group.id)}
                                  className="ml-0.5 hover:text-[#F85149] transition-colors"
                                >
                                  <X size={10} className="text-[#484F58]" />
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <button
                            onClick={() => openGroupAssignModal(selectedNode.id)}
                            className="w-full info-card border-2 border-dashed border-[#363636] hover:border-[#58A6FF]/50 transition-all duration-200 text-left group"
                          >
                            <div className="flex items-center gap-3 py-1">
                              <div className="w-8 h-8 rounded-lg bg-[#363636] flex items-center justify-center group-hover:bg-[#58A6FF]/10 transition-colors">
                                <FolderOpen size={14} className="text-[#484F58] group-hover:text-[#58A6FF] transition-colors" />
                              </div>
                              <span className="text-base text-[#484F58] group-hover:text-[#8B949E] transition-colors">
                                그룹에 추가하기
                              </span>
                            </div>
                          </button>
                        );
                      })()}
                    </section>
                  )}

                  {/* Memo - 1촌 또는 가져온 연락처에게 메모 남기기 가능 */}
                  {(connectionDegree === 1 || selectedNode.isImported) && (
                    <section>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#8B949E] uppercase tracking-wider">
                          <StickyNote size={12} />
                          나만의 메모
                        </h3>
                        {currentMemo && !isEditingMemo && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setMemoText(currentMemo.content);
                                setIsEditingMemo(true);
                              }}
                              className="p-1.5 rounded-lg hover:bg-[#363636] transition-colors"
                            >
                              <Pencil size={12} className="text-[#8B949E]" />
                            </button>
                            <button
                              onClick={handleDeleteMemo}
                              className="p-1.5 rounded-lg hover:bg-[#363636] transition-colors"
                            >
                              <Trash2 size={12} className="text-[#F85149]" />
                            </button>
                          </div>
                        )}
                      </div>

                      {isEditingMemo ? (
                        <div className="info-card">
                          <textarea
                            value={memoText}
                            onChange={(e) => setMemoText(e.target.value)}
                            placeholder="이 인물에 대한 메모를 남겨보세요..."
                            maxLength={200}
                            className="
                              w-full bg-transparent text-white text-base
                              resize-none focus:outline-none
                              placeholder:text-[#484F58]
                              min-h-[80px]
                            "
                            autoFocus
                          />
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#363636]/50">
                            <span className="text-[10px] text-[#484F58]">{memoText.length}/200</span>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => {
                                  setIsEditingMemo(false);
                                  setMemoText(currentMemo?.content || '');
                                }}
                                className="text-sm text-[#8B949E] hover:text-white transition-colors"
                              >
                                취소
                              </button>
                              <button
                                onClick={handleSaveMemo}
                                disabled={!memoText.trim()}
                                className="flex items-center gap-1.5 text-sm font-medium text-[#58A6FF] hover:text-[#58A6FF]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Check size={12} />
                                저장
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : currentMemo ? (
                        <div className="info-card">
                          <p className="text-base text-white whitespace-pre-wrap leading-relaxed">{currentMemo.content}</p>
                          <p className="text-[10px] text-[#484F58] mt-3 pt-2 border-t border-[#363636]/50">
                            {new Date(currentMemo.updatedAt).toLocaleDateString('ko-KR')} 수정됨
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsEditingMemo(true)}
                          className="w-full info-card border-2 border-dashed border-[#363636] hover:border-[#58A6FF]/50 transition-all duration-200 text-left group"
                        >
                          <div className="flex items-center gap-3 py-1">
                            <div className="w-8 h-8 rounded-lg bg-[#363636] flex items-center justify-center group-hover:bg-[#58A6FF]/10 transition-colors">
                              <StickyNote size={14} className="text-[#484F58] group-hover:text-[#58A6FF] transition-colors" />
                            </div>
                            <span className="text-base text-[#484F58] group-hover:text-[#8B949E] transition-colors">
                              메모 추가하기
                            </span>
                          </div>
                        </button>
                      )}
                    </section>
                  )}

                  {/* 연락 기록 - 1촌 또는 가져온 연락처에게 표시 */}
                  {(connectionDegree === 1 || selectedNode.isImported) && (
                    <section>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#8B949E] uppercase tracking-wider">
                          <Clock size={12} />
                          연락 기록
                          {(() => {
                            const days = getDaysSinceLastContact(selectedNode.id);
                            if (days < 999) {
                              const status = getRelationshipStatus(selectedNode.id);
                              const statusColor = status === 'active' ? '#3FB950' : status === 'warm' ? '#D29922' : status === 'cold' ? '#FF6B8A' : '#F85149';
                              return (
                                <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-full" style={{ color: statusColor, backgroundColor: statusColor + '15' }}>
                                  {days}일 전
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </h3>
                        <button
                          onClick={() => setShowInteractionModal(true)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#58A6FF]/10 hover:bg-[#58A6FF]/20 transition-colors"
                        >
                          <CalendarPlus size={12} className="text-[#58A6FF]" />
                          <span className="text-[11px] text-[#58A6FF] font-medium">기록하기</span>
                        </button>
                      </div>
                      <div className="info-card">
                        <InteractionTimeline targetUserId={selectedNode.id} />
                      </div>
                    </section>
                  )}

                  {/* 관련 뉴스 - 해당 인물의 기사가 있을 때 표시 */}
                  {memberNews.length > 0 && (
                    <section>
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-[#8B949E] uppercase tracking-wider mb-3">
                        <Newspaper size={12} />
                        관련 뉴스
                        <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-full bg-[#F85149]/15 text-[#F85149]">
                          {memberNews.length}건
                        </span>
                      </h3>
                      <div className="space-y-2">
                        {memberNews.slice(0, 5).map((news) => (
                          <a
                            key={news.id}
                            href={news.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => markAsRead(news.id)}
                            className="block info-card hover:bg-[#2D3748] transition-colors cursor-pointer"
                          >
                            <p className="text-[13px] text-white font-medium leading-snug line-clamp-2">
                              {news.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              {news.source && (
                                <span className="text-[10px] text-[#8B949E]">{news.source}</span>
                              )}
                              <span className="text-[10px] text-[#8B949E]">
                                {new Date(news.pubDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* 공통 인맥 - 모든 degree에서 표시 */}
                  {connectionDegree !== 0 && (() => {
                    const mutualIds = theirConnections
                      .map(u => u.id)
                      .filter(id => myConnectionIds.has(id));

                    if (mutualIds.length === 0) return null;

                    const mutualUsers = mutualIds
                      .map(id => {
                        const fromConnections = theirConnections.find(u => u.id === id && u.name);
                        if (fromConnections) return fromConnections;
                        return demoUsers.find(u => u.id === id) || null;
                      })
                      .filter((u): u is User => u !== null);

                    if (mutualUsers.length === 0) return null;

                    return (
                      <section>
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#8B949E] uppercase tracking-wider mb-3">
                          <Users size={12} />
                          공통 인맥
                          <span className="text-[#FFB800]">({mutualUsers.length})</span>
                        </h3>
                        <div className="info-card border border-[#FFB800]/20 bg-[#FFB800]/5">
                          <div className="grid grid-cols-5 gap-3">
                            {mutualUsers.slice(0, 15).map((user, idx) => (
                              <button
                                key={`${user.id}-${idx}`}
                                onClick={() => handleConnectionClick(user)}
                                className="flex flex-col items-center hover:opacity-80 transition-all duration-200 cursor-pointer group"
                              >
                                <div className="relative">
                                  <Avatar
                                    src={user.profileImage}
                                    name={user.name}
                                    size="sm"
                                  />
                                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#FFB800] flex items-center justify-center">
                                    <Users size={8} className="text-[#121212]" />
                                  </div>
                                  <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-[#FFB800]/50 transition-colors" />
                                </div>
                                <span className="text-[10px] mt-1.5 max-w-[48px] truncate text-center text-[#FFB800] font-medium">
                                  {user.name?.slice(0, 4) || '?'}
                                </span>
                              </button>
                            ))}
                          </div>
                          {mutualUsers.length > 15 && (
                            <p className="text-[10px] text-[#484F58] text-center mt-3 pt-3 border-t border-[#363636]/50">
                              +{mutualUsers.length - 15}명 더
                            </p>
                          )}
                        </div>
                      </section>
                    );
                  })()}

                  {/* Their Network - 1촌에게만 분야별로 표시 */}
                  {theirConnections.length > 0 && connectionDegree !== 0 && (
                    <section>
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-[#8B949E] uppercase tracking-wider mb-2">
                        <Users size={12} />
                        {selectedNode.name}님의 인맥
                        <span className="text-[#58A6FF]">({theirConnections.length})</span>
                      </h3>
                      {connectionDegree === 1 ? (
                        <div className="space-y-4">
                          {/* 분야별로 그룹화하여 표시 */}
                          {(() => {
                            // industry 기준으로 그룹화
                            const groupedByIndustry = theirConnections.reduce((acc, user) => {
                              const industry = user.industry || '기타';
                              if (!acc[industry]) {
                                acc[industry] = [];
                              }
                              acc[industry].push(user);
                              return acc;
                            }, {} as Record<string, User[]>);

                            const sortedIndustries = Object.keys(groupedByIndustry).sort((a, b) => {
                              if (a === '기타') return 1;
                              if (b === '기타') return -1;
                              return groupedByIndustry[b].length - groupedByIndustry[a].length;
                            });

                            return sortedIndustries.map((industry) => (
                              <div key={industry} className="info-card">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-2 h-2 rounded-full bg-[#58A6FF]" />
                                  <span className="text-sm font-medium text-[#8B949E]">
                                    {industry}
                                  </span>
                                  <span className="text-[10px] text-[#484F58]">
                                    ({groupedByIndustry[industry].length}명)
                                  </span>
                                </div>
                                <div className="grid grid-cols-5 gap-3">
                                  {groupedByIndustry[industry].slice(0, 10).map((user, idx) => {
                                    const isMutualConnection = myConnectionIds.has(user.id);
                                    return (
                                    <button
                                      key={`${user.id}-${idx}`}
                                      onClick={() => handleConnectionClick(user)}
                                      className="flex flex-col items-center hover:opacity-80 transition-all duration-200 cursor-pointer group"
                                    >
                                      <div className="relative">
                                        <Avatar
                                          src={user.profileImage}
                                          name={user.name}
                                          size="sm"
                                        />
                                        {isMutualConnection && (
                                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#FFB800] flex items-center justify-center" title="공통 인맥">
                                            <Users size={8} className="text-[#121212]" />
                                          </div>
                                        )}
                                        <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-[#58A6FF]/50 transition-colors" />
                                      </div>
                                      <span className={`text-[10px] mt-1.5 max-w-[48px] truncate text-center ${isMutualConnection ? 'text-[#FFB800] font-medium' : 'text-[#8B949E]'}`}>
                                        {user.name?.slice(0, 4) || '?'}
                                      </span>
                                    </button>
                                    );
                                  })}
                                </div>
                                {groupedByIndustry[industry].length > 10 && (
                                  <p className="text-[10px] text-[#484F58] text-center mt-3 pt-3 border-t border-[#363636]/50">
                                    +{groupedByIndustry[industry].length - 10}명 더
                                  </p>
                                )}
                              </div>
                            ));
                          })()}
                        </div>
                      ) : (
                        <div className="info-card relative overflow-hidden">
                          {/* 흐린 아바타 배경 */}
                          <div className="grid grid-cols-5 gap-3 opacity-20 blur-[2px]">
                            {Array.from({ length: Math.min(10, theirConnections.length) }).map((_, idx) => (
                              <div key={idx} className="flex flex-col items-center">
                                <div className="w-8 h-8 rounded-full bg-[#484F58]" />
                                <div className="w-10 h-2 mt-1.5 rounded bg-[#484F58]" />
                              </div>
                            ))}
                          </div>
                          {/* 잠금 오버레이 */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#252525]/70 backdrop-blur-[1px]">
                            <div className="flex items-center gap-2 text-[#8B949E] mb-2">
                              <Users size={18} />
                              <span className="text-xl font-bold text-white">{theirConnections.length}</span>
                              <span className="text-base">명</span>
                            </div>
                            <p className="text-sm text-[#484F58]">
                              1촌과 연결하면 볼 수 있어요
                            </p>
                          </div>
                        </div>
                      )}
                    </section>
                  )}
                </div>
              </div>

              {/* Action Buttons - 하단 고정, 모바일에서 safe-area 적용 */}
              <div
                className="px-4 sm:px-5 py-4 border-t border-[#363636]/50 bg-[#121212]/80 backdrop-blur-xl"
                style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
              >
                {connectionDegree === 1 ? (
                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      className="flex-1 text-sm py-3 sm:py-2.5 touch-manipulation"
                      leftIcon={<Star size={16} />}
                    >
                      관심
                    </Button>
                    <Button
                      className="flex-1 text-sm py-3 sm:py-2.5 touch-manipulation"
                      leftIcon={<MessageCircle size={16} />}
                      onClick={handleMessageClick}
                    >
                      쪽지 보내기
                    </Button>
                  </div>
                ) : connectionDegree === 2 ? (
                  <div className="flex flex-col gap-3">
                    <Button
                      className="w-full text-sm py-3.5 sm:py-3 bg-gradient-to-r from-[#58A6FF] to-[#1F6FEB] hover:from-[#58A6FF] hover:to-[#8B7EFF] transition-all duration-300 touch-manipulation"
                      leftIcon={<UserPlus size={16} />}
                      onClick={handleConnectionRequestClick}
                    >
                      인맥 신청하기
                    </Button>
                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        className="flex-1 text-sm py-3 sm:py-2.5 touch-manipulation"
                        leftIcon={<Star size={16} />}
                      >
                        관심
                      </Button>
                      <Button
                        variant="secondary"
                        className="flex-1 text-sm py-3 sm:py-2.5 touch-manipulation"
                        leftIcon={<MessageCircle size={16} />}
                        onClick={handleMessageClick}
                      >
                        쪽지 보내기
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Button
                      className="w-full text-sm py-3.5 sm:py-3 bg-gradient-to-r from-[#58A6FF] to-[#1F6FEB] hover:from-[#58A6FF] hover:to-[#8B7EFF] transition-all duration-300 touch-manipulation"
                      leftIcon={<UserPlus size={16} />}
                      onClick={handleConnectionRequestClick}
                    >
                      인맥 신청하기
                    </Button>
                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        className="flex-1 text-sm py-3 sm:py-2.5 touch-manipulation"
                        leftIcon={<Star size={16} />}
                      >
                        관심
                      </Button>
                      <Button
                        variant="secondary"
                        className="flex-1 text-sm py-3 sm:py-2.5 touch-manipulation"
                        leftIcon={<MessageCircle size={16} />}
                        onClick={handleCoffeeChatClick}
                      >
                        커피챗
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 쪽지 보내기 모달 (1촌 + 2촌) */}
      {showMessageModal && selectedNode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => {
            if (!isSendingMessage) {
              setShowMessageModal(false);
              setMessageContent('');
              setSendError('');
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#1E1E1E] border border-[#363636] rounded-[10px] p-5 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {messageSent ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#58A6FF]/20 flex items-center justify-center">
                  <Check size={32} className="text-[#58A6FF]" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">쪽지 전송 완료!</h3>
                <p className="text-base text-[#8B949E]">
                  {selectedNode.name}님에게 쪽지를 보냈습니다
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={selectedNode.profileImage}
                      name={selectedNode.name}
                      size="md"
                    />
                    <div>
                      <h3 className="font-bold text-white">{selectedNode.name}</h3>
                      <p className="text-sm text-[#8B949E]">
                        {selectedNode.company} · {selectedNode.position}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowMessageModal(false);
                      setMessageContent('');
                      setSendError('');
                    }}
                    className="p-2 rounded-lg hover:bg-[#363636] transition-colors"
                  >
                    <X size={18} className="text-[#8B949E]" />
                  </button>
                </div>

                {/* 연결 거리 표시 */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    connectionDegree === 1
                      ? 'bg-[#58A6FF]/15 text-[#58A6FF]'
                      : 'bg-[#9B8ED9]/15 text-[#9B8ED9]'
                  }`}>
                    {connectionDegree === 1 ? '1촌 인맥' : '2촌 · 인맥의 인맥'}
                  </span>
                </div>

                <div className="mb-4">
                  <textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder={connectionDegree === 2
                      ? `${selectedNode.name}님에게 보낼 쪽지를 작성하세요...\n간단한 자기소개와 연락 목적을 적으면 좋아요!`
                      : `${selectedNode.name}님에게 보낼 쪽지를 작성하세요...`
                    }
                    className="w-full bg-[#121212] border border-[#363636] text-white rounded-[10px] py-3 px-4 text-base resize-none focus:outline-none focus:border-[#58A6FF] placeholder:text-[#484F58] min-h-[120px]"
                    autoFocus
                    maxLength={500}
                  />
                  <div className="flex justify-end mt-2">
                    <span className="text-xs text-[#484F58]">{messageContent.length}/500</span>
                  </div>
                </div>

                {sendError && (
                  <div className="mb-4 px-3 py-2 bg-[#F85149]/10 border border-[#F85149]/30 rounded-lg">
                    <p className="text-sm text-[#F85149]">{sendError}</p>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleSendMessage}
                  disabled={!messageContent.trim() || isSendingMessage}
                  leftIcon={isSendingMessage ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                >
                  {isSendingMessage ? '전송 중...' : '쪽지 보내기'}
                </Button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
      {/* 연락 기록 모달 */}
      {selectedNode && (
        <InteractionLogModal
          isOpen={showInteractionModal}
          onClose={() => setShowInteractionModal(false)}
          targetUserId={selectedNode.id}
          targetName={selectedNode.name}
        />
      )}
    </AnimatePresence>
  );
}
