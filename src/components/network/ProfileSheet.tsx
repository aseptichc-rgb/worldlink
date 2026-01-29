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
} from 'lucide-react';
import { Avatar, Tag, Button } from '@/components/ui';
import { useNetworkStore } from '@/store/networkStore';
import { useCoffeeChatStore } from '@/store/coffeeChatStore';
import { useConnectionRequestStore } from '@/store/connectionRequestStore';
import { useMemoStore } from '@/store/memoStore';
import { useAuthStore } from '@/store/authStore';
import { findConnectionPath, getUser, getUserConnectionsWithDetails, getDirectConnections } from '@/lib/firebase-services';
import { findDemoConnectionPath, demoUsers, demoConnections } from '@/lib/demo-data';
import { getDisplayInfo } from '@/lib/privacy-utils';
import { User, NetworkNode } from '@/types';

export default function ProfileSheet() {
  const { selectedNode, setSelectedNode, setFocusedNodeId, nodes } = useNetworkStore();
  const { openRequestModal } = useCoffeeChatStore();
  const { openRequestModal: openConnectionRequestModal } = useConnectionRequestStore();
  const { getMemo, setMemo, deleteMemo } = useMemoStore();
  const { user: currentUser } = useAuthStore();

  const [connectionPath, setConnectionPath] = useState<User[]>([]);
  const [isLoadingPath, setIsLoadingPath] = useState(false);
  const [theirConnections, setTheirConnections] = useState<User[]>([]);
  const [selectedUserData, setSelectedUserData] = useState<User | null>(null);
  const [myConnectionIds, setMyConnectionIds] = useState<Set<string>>(new Set());

  // 메모 관련 상태
  const [isEditingMemo, setIsEditingMemo] = useState(false);
  const [memoText, setMemoText] = useState('');

  // 선택된 노드의 메모 가져오기
  const currentMemo = selectedNode ? getMemo(selectedNode.id) : null;

  // 노드가 바뀌면 메모 편집 모드 초기화
  useEffect(() => {
    setIsEditingMemo(false);
    setMemoText(currentMemo?.content || '');
  }, [selectedNode?.id, currentMemo?.content]);

  // 내 1촌 목록 불러오기 (공통 인맥 표시용)
  useEffect(() => {
    const loadMyConnections = async () => {
      if (!currentUser) return;

      try {
        if (currentUser.id.startsWith('demo-user-') || currentUser.id === 'user-jaeyoung') {
          // 데모 사용자의 경우
          const myConnIds = demoConnections[currentUser.id] || demoConnections['user-jaeyoung'] || [];
          setMyConnectionIds(new Set(myConnIds));
        } else {
          // 실제 사용자의 경우
          const connections = await getDirectConnections(currentUser.id);
          const connIds = connections.map(conn =>
            conn.fromUserId === currentUser.id ? conn.toUserId : conn.fromUserId
          );
          setMyConnectionIds(new Set(connIds));
        }
      } catch (error) {
        console.error('Error loading my connections:', error);
      }
    };

    loadMyConnections();
  }, [currentUser]);

  useEffect(() => {
    const loadConnectionPath = async () => {
      if (!selectedNode || !currentUser) return;

      setIsLoadingPath(true);
      try {
        if (selectedNode.id.startsWith('demo-user-')) {
          const fromUserId = currentUser.id.startsWith('demo-user-') ? currentUser.id : 'demo-user-1';
          const pathIds = findDemoConnectionPath(fromUserId, selectedNode.id);
          const pathUsers: User[] = pathIds.map(id => {
            const demoUser = demoUsers.find(u => u.id === id);
            if (demoUser) return demoUser;
            return { id, name: '나', email: '', inviteCode: '', invitesRemaining: 0, coffeeStatus: 'available' as const, keywords: [], createdAt: new Date(), updatedAt: new Date() };
          });
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
            // 1촌이 아니면 인맥 수만 보여주기 위해 빈 배열 설정
            const theirConnectionIds = demoConnections[selectedNode.id] || [];
            setTheirConnections(theirConnectionIds.map(id => ({ id } as User)));
          }
        } else {
          const pathIds = await findConnectionPath(currentUser.id, selectedNode.id);
          const pathUsers: User[] = [];

          for (const userId of pathIds) {
            const user = await getUser(userId);
            if (user) pathUsers.push(user);
          }

          setConnectionPath(pathUsers);

          const userData = await getUser(selectedNode.id);
          setSelectedUserData(userData);

          // 1촌일 때만 상대방의 인맥 목록 가져오기
          const isFirstDegree = pathIds.length === 2;
          if (isFirstDegree && userData) {
            const connections = await getUserConnectionsWithDetails(selectedNode.id);
            setTheirConnections(connections);
          } else if (userData) {
            // 1촌이 아니면 인맥 수만 표시하기 위해 임시 객체 설정
            const connections = await getUserConnectionsWithDetails(selectedNode.id);
            setTheirConnections(connections.map(c => ({ id: c.id } as User)));
          } else {
            setTheirConnections([]);
          }
        }
      } catch (error) {
        console.error('Error loading connection path:', error);
      } finally {
        setIsLoadingPath(false);
      }
    };

    loadConnectionPath();
  }, [selectedNode, currentUser]);

  const handleCoffeeChatClick = () => {
    if (selectedNode) {
      openRequestModal(selectedNode.id);
    }
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
    const currentUserId = currentUser?.id.startsWith('demo-user-') ? currentUser.id : 'demo-user-1';
    if (user.id === currentUserId) return;

    const existingNode = nodes.find(n => n.id === user.id);

    if (existingNode) {
      setSelectedNode(existingNode);
      setFocusedNodeId(user.id);
    } else {
      const pathIds = findDemoConnectionPath(currentUserId, user.id);
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
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-0 right-0 bottom-0 w-full max-w-[380px] z-30 pointer-events-auto"
        >
          {/* Panel Container */}
          <div className="h-full bg-gradient-to-l from-[#0B162C]/98 via-[#101D33]/95 to-transparent">
            {/* Content Area */}
            <div className="h-full w-[340px] ml-auto bg-[#101D33]/98 backdrop-blur-2xl border-l border-[#1E3A5F]/60 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E3A5F]/50 bg-[#0B162C]/50">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#86C9F2] animate-pulse" />
                  <span className="text-sm font-medium text-[#8BA4C4]">프로필</span>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg hover:bg-[#1E3A5F] transition-all duration-200 group"
                >
                  <X size={18} className="text-[#8BA4C4] group-hover:text-white transition-colors" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto no-scrollbar">
                {/* Profile Header Section */}
                <div className="px-5 py-5 bg-gradient-to-b from-[#0B162C]/80 to-transparent">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar
                        src={selectedNode.degree === 1 ? selectedNode.profileImage : undefined}
                        name={selectedNode.name}
                        size="xl"
                        hasGlow={selectedNode.degree === 1}
                      />
                      {selectedNode.degree === 1 && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#86C9F2] flex items-center justify-center">
                          <Link2 size={12} className="text-[#0B162C]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      {/* 1촌이면 전체 정보, 아니면 비식별화된 정보 표시 */}
                      {(() => {
                        const isConnected = selectedNode.degree === 1;
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
                              <div className="flex items-center gap-2 mt-1.5 text-[#8BA4C4] text-sm">
                                <Building size={14} className="text-[#4A90E2] flex-shrink-0" />
                                <span className="truncate">{displayInfo.company}</span>
                              </div>
                            )}
                            {displayInfo.position && (
                              <div className="flex items-center gap-2 mt-1 text-[#8BA4C4] text-sm">
                                <Briefcase size={14} className="text-[#2C529C] flex-shrink-0" />
                                <span className="truncate">{displayInfo.position}</span>
                              </div>
                            )}
                            {!displayInfo.company && !displayInfo.position && !isConnected && (
                              <div className="flex items-center gap-2 mt-1.5 text-[#4A5E7A] text-sm">
                                <span className="text-xs">1촌 연결 시 상세 정보 확인 가능</span>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Stats Badges */}
                  <div className="flex items-center gap-3 mt-5">
                    <div className="stat-badge flex-1">
                      <span className="stat-badge-value text-[#FFB800]">{connectionDegree}</span>
                      <span className="stat-badge-label">단계 거리</span>
                    </div>
                    <div className="stat-badge flex-1">
                      <span className="stat-badge-value text-[#86C9F2]">{selectedNode.connectionCount}</span>
                      <span className="stat-badge-label">연결된 인맥</span>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5 space-y-5">
                  {/* Contact Info - 1촌에게만 표시 */}
                  {selectedNode.degree === 1 && selectedUserData && (selectedUserData.email || selectedUserData.phone) && (
                    <section>
                      <h3 className="flex items-center gap-2 text-xs font-semibold text-[#8BA4C4] uppercase tracking-wider mb-3">
                        <Mail size={12} />
                        연락처
                      </h3>
                      <div className="info-card space-y-2.5">
                        {selectedUserData.email && (
                          <a
                            href={`mailto:${selectedUserData.email}`}
                            className="flex items-center gap-3 text-sm text-[#8BA4C4] hover:text-[#86C9F2] transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-[#1E3A5F] flex items-center justify-center group-hover:bg-[#86C9F2]/10 transition-colors">
                              <Mail size={14} className="text-[#86C9F2]" />
                            </div>
                            <span className="truncate">{selectedUserData.email}</span>
                          </a>
                        )}
                        {selectedUserData.phone && (
                          <a
                            href={`tel:${selectedUserData.phone}`}
                            className="flex items-center gap-3 text-sm text-[#8BA4C4] hover:text-[#86C9F2] transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-[#1E3A5F] flex items-center justify-center group-hover:bg-[#86C9F2]/10 transition-colors">
                              <Phone size={14} className="text-[#86C9F2]" />
                            </div>
                            <span>{selectedUserData.phone}</span>
                          </a>
                        )}
                      </div>
                    </section>
                  )}

                  {/* Connection Path */}
                  <section>
                    <h3 className="flex items-center gap-2 text-xs font-semibold text-[#8BA4C4] uppercase tracking-wider mb-3">
                      <Link2 size={12} />
                      연결 경로
                    </h3>
                    {isLoadingPath ? (
                      <div className="info-card flex items-center justify-center py-6">
                        <div className="spinner w-6 h-6" />
                      </div>
                    ) : connectionPath.length > 0 ? (
                      <div className="info-card info-card-highlight">
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                          {connectionPath.map((user, idx) => (
                            <div key={user.id} className="flex items-center gap-2 flex-shrink-0">
                              <div className="flex flex-col items-center">
                                <div className="relative">
                                  <Avatar
                                    src={user.profileImage}
                                    name={user.name}
                                    size="sm"
                                    hasGlow={idx === 0 || idx === connectionPath.length - 1}
                                  />
                                  {idx === 0 && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#86C9F2] flex items-center justify-center text-[8px] font-bold text-[#0B162C]">
                                      나
                                    </div>
                                  )}
                                </div>
                                <span className="text-[10px] text-[#8BA4C4] mt-1.5 max-w-[48px] truncate text-center font-medium">
                                  {idx === 0 ? '나' : user.name.slice(0, 4)}
                                </span>
                              </div>
                              {idx < connectionPath.length - 1 && (
                                <div className="flex items-center">
                                  <div className={`w-6 h-0.5 ${idx === 0 ? 'bg-[#86C9F2]' : 'bg-[#2C529C]'}`} />
                                  <ArrowRight size={14} className={`flex-shrink-0 -mx-1 ${idx === 0 ? 'text-[#86C9F2]' : 'text-[#2C529C]'}`} />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="info-card">
                        <p className="text-[#4A5E7A] text-sm text-center py-2">연결 경로를 찾을 수 없습니다</p>
                      </div>
                    )}
                  </section>

                  {/* Keywords */}
                  {selectedNode.keywords.length > 0 && (
                    <section>
                      <h3 className="flex items-center gap-2 text-xs font-semibold text-[#8BA4C4] uppercase tracking-wider mb-3">
                        <Hash size={12} />
                        관심 분야
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedNode.keywords.map((keyword) => {
                          const isMatching = currentUser?.keywords.includes(keyword);
                          return (
                            <Tag
                              key={keyword}
                              label={keyword}
                              isHighlighted={isMatching}
                              size="sm"
                            />
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {/* Memo - 1촌에게만 메모 남기기 가능 */}
                  {selectedNode.degree === 1 && (
                    <section>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="flex items-center gap-2 text-xs font-semibold text-[#8BA4C4] uppercase tracking-wider">
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
                              className="p-1.5 rounded-lg hover:bg-[#1E3A5F] transition-colors"
                            >
                              <Pencil size={12} className="text-[#8BA4C4]" />
                            </button>
                            <button
                              onClick={handleDeleteMemo}
                              className="p-1.5 rounded-lg hover:bg-[#1E3A5F] transition-colors"
                            >
                              <Trash2 size={12} className="text-[#FF5252]" />
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
                              w-full bg-transparent text-white text-sm
                              resize-none focus:outline-none
                              placeholder:text-[#4A5E7A]
                              min-h-[80px]
                            "
                            autoFocus
                          />
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1E3A5F]/50">
                            <span className="text-[10px] text-[#4A5E7A]">{memoText.length}/200</span>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => {
                                  setIsEditingMemo(false);
                                  setMemoText(currentMemo?.content || '');
                                }}
                                className="text-xs text-[#8BA4C4] hover:text-white transition-colors"
                              >
                                취소
                              </button>
                              <button
                                onClick={handleSaveMemo}
                                disabled={!memoText.trim()}
                                className="flex items-center gap-1.5 text-xs font-medium text-[#86C9F2] hover:text-[#86C9F2]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Check size={12} />
                                저장
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : currentMemo ? (
                        <div className="info-card">
                          <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">{currentMemo.content}</p>
                          <p className="text-[10px] text-[#4A5E7A] mt-3 pt-2 border-t border-[#1E3A5F]/50">
                            {new Date(currentMemo.updatedAt).toLocaleDateString('ko-KR')} 수정됨
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsEditingMemo(true)}
                          className="w-full info-card border-2 border-dashed border-[#1E3A5F] hover:border-[#86C9F2]/50 transition-all duration-200 text-left group"
                        >
                          <div className="flex items-center gap-3 py-1">
                            <div className="w-8 h-8 rounded-lg bg-[#1E3A5F] flex items-center justify-center group-hover:bg-[#86C9F2]/10 transition-colors">
                              <StickyNote size={14} className="text-[#4A5E7A] group-hover:text-[#86C9F2] transition-colors" />
                            </div>
                            <span className="text-sm text-[#4A5E7A] group-hover:text-[#8BA4C4] transition-colors">
                              메모 추가하기
                            </span>
                          </div>
                        </button>
                      )}
                    </section>
                  )}

                  {/* Their Network - 1촌에게만 분야별로 표시 */}
                  {theirConnections.length > 0 && (
                    <section>
                      {(() => {
                        const mutualCount = theirConnections.filter(u => myConnectionIds.has(u.id)).length;
                        return (
                          <>
                            <h3 className="flex items-center gap-2 text-xs font-semibold text-[#8BA4C4] uppercase tracking-wider mb-2">
                              <Users size={12} />
                              {selectedNode.name}님의 인맥
                              <span className="text-[#86C9F2]">({theirConnections.length})</span>
                            </h3>
                            {selectedNode.degree === 1 && mutualCount > 0 && (
                              <div className="flex items-center gap-2 mb-3 px-2 py-1.5 rounded-lg bg-[#FFB800]/10 border border-[#FFB800]/20">
                                <div className="w-3 h-3 rounded-full bg-[#FFB800] flex items-center justify-center">
                                  <Users size={7} className="text-[#0B162C]" />
                                </div>
                                <span className="text-[10px] text-[#FFB800]">
                                  공통 인맥 {mutualCount}명
                                </span>
                              </div>
                            )}
                          </>
                        );
                      })()}
                      {selectedNode.degree === 1 ? (
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
                                  <div className="w-2 h-2 rounded-full bg-[#86C9F2]" />
                                  <span className="text-xs font-medium text-[#8BA4C4]">
                                    {industry}
                                  </span>
                                  <span className="text-[10px] text-[#4A5E7A]">
                                    ({groupedByIndustry[industry].length}명)
                                  </span>
                                </div>
                                <div className="grid grid-cols-5 gap-3">
                                  {groupedByIndustry[industry].slice(0, 10).map((user) => {
                                    const isMutualConnection = myConnectionIds.has(user.id);
                                    return (
                                    <button
                                      key={user.id}
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
                                            <Users size={8} className="text-[#0B162C]" />
                                          </div>
                                        )}
                                        <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-[#86C9F2]/50 transition-colors" />
                                      </div>
                                      <span className={`text-[10px] mt-1.5 max-w-[48px] truncate text-center ${isMutualConnection ? 'text-[#FFB800] font-medium' : 'text-[#8BA4C4]'}`}>
                                        {user.name?.slice(0, 4) || '?'}
                                      </span>
                                    </button>
                                    );
                                  })}
                                </div>
                                {groupedByIndustry[industry].length > 10 && (
                                  <p className="text-[10px] text-[#4A5E7A] text-center mt-3 pt-3 border-t border-[#1E3A5F]/50">
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
                                <div className="w-8 h-8 rounded-full bg-[#4A5E7A]" />
                                <div className="w-10 h-2 mt-1.5 rounded bg-[#4A5E7A]" />
                              </div>
                            ))}
                          </div>
                          {/* 잠금 오버레이 */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#162A4A]/70 backdrop-blur-[1px]">
                            <div className="flex items-center gap-2 text-[#8BA4C4] mb-2">
                              <Users size={18} />
                              <span className="text-xl font-bold text-white">{theirConnections.length}</span>
                              <span className="text-sm">명</span>
                            </div>
                            <p className="text-xs text-[#4A5E7A]">
                              1촌과 연결하면 볼 수 있어요
                            </p>
                          </div>
                        </div>
                      )}
                    </section>
                  )}
                </div>
              </div>

              {/* Action Buttons - 하단 고정 */}
              <div className="px-5 py-4 border-t border-[#1E3A5F]/50 bg-[#0B162C]/80 backdrop-blur-xl">
                {selectedNode.degree === 1 ? (
                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      className="flex-1 text-sm py-2.5"
                      leftIcon={<Star size={16} />}
                    >
                      관심
                    </Button>
                    <Button
                      className="flex-1 text-sm py-2.5"
                      leftIcon={<MessageCircle size={16} />}
                      onClick={handleCoffeeChatClick}
                    >
                      메세지
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Button
                      className="w-full text-sm py-3 bg-gradient-to-r from-[#86C9F2] to-[#2C529C] hover:from-[#86C9F2] hover:to-[#8B7EFF] transition-all duration-300"
                      leftIcon={<UserPlus size={16} />}
                      onClick={handleConnectionRequestClick}
                    >
                      인맥 신청하기
                    </Button>
                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        className="flex-1 text-sm py-2.5"
                        leftIcon={<Star size={16} />}
                      >
                        관심
                      </Button>
                      <Button
                        variant="secondary"
                        className="flex-1 text-sm py-2.5"
                        leftIcon={<MessageCircle size={16} />}
                        onClick={handleCoffeeChatClick}
                      >
                        메세지
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
