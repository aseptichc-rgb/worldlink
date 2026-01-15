'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageCircle, Building, Briefcase, Users, ArrowRight, X, UserPlus, StickyNote, Check, Pencil, Trash2, Mail, Phone } from 'lucide-react';
import { Avatar, Tag, Button } from '@/components/ui';
import { useNetworkStore } from '@/store/networkStore';
import { useCoffeeChatStore } from '@/store/coffeeChatStore';
import { useConnectionRequestStore } from '@/store/connectionRequestStore';
import { useMemoStore } from '@/store/memoStore';
import { useAuthStore } from '@/store/authStore';
import { findConnectionPath, getUser } from '@/lib/firebase-services';
import { findDemoConnectionPath, demoUsers, demoConnections } from '@/lib/demo-data';
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

          // 선택된 유저의 전체 데이터 가져오기
          const demoUserData = demoUsers.find(u => u.id === selectedNode.id);
          setSelectedUserData(demoUserData || null);

          const theirConnectionIds = demoConnections[selectedNode.id] || [];
          const theirConnectionUsers = theirConnectionIds
            .map(id => demoUsers.find(u => u.id === id))
            .filter((u): u is User => u !== undefined);
          setTheirConnections(theirConnectionUsers);
        } else {
          const pathIds = await findConnectionPath(currentUser.id, selectedNode.id);
          const pathUsers: User[] = [];

          for (const userId of pathIds) {
            const user = await getUser(userId);
            if (user) pathUsers.push(user);
          }

          setConnectionPath(pathUsers);
          setTheirConnections([]);

          // 선택된 유저의 전체 데이터 가져오기
          const userData = await getUser(selectedNode.id);
          setSelectedUserData(userData);
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
    // 현재 사용자(나)는 클릭 불가
    const currentUserId = currentUser?.id.startsWith('demo-user-') ? currentUser.id : 'demo-user-1';
    if (user.id === currentUserId) return;

    // 그래프에 있는 노드인지 확인
    const existingNode = nodes.find(n => n.id === user.id);

    if (existingNode) {
      // 그래프에 있으면 해당 노드 선택 및 포커스
      setSelectedNode(existingNode);
      setFocusedNodeId(user.id);
    } else {
      // 그래프에 없으면 새 노드 객체 생성
      // 연결 경로를 통해 degree 계산
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
      // 그래프에 없으므로 포커스는 설정하지 않음
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
          className="fixed top-0 right-0 bottom-0 w-full max-w-[360px] z-30 pointer-events-auto"
        >
          {/* Panel Container - 투명 배경으로 그래프가 보이도록 */}
          <div className="h-full bg-gradient-to-l from-[#0D1117]/95 via-[#0D1117]/90 to-transparent">
            {/* Content Area - 오른쪽에 고정 */}
            <div className="h-full w-[320px] ml-auto bg-[#0D1117]/95 backdrop-blur-xl border-l border-[#21262D]/50 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#21262D]/50">
                <span className="text-sm text-[#8B949E]">인물 정보</span>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg hover:bg-[#21262D] transition-colors"
                >
                  <X size={18} className="text-[#8B949E]" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4">
                {/* Profile Header - 컴팩트하게 */}
                <div className="flex items-center gap-3 mb-4">
                  <Avatar
                    src={selectedNode.profileImage}
                    name={selectedNode.name}
                    size="lg"
                    hasGlow={selectedNode.degree === 1}
                  />
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-white truncate">
                      {selectedNode.name}
                    </h2>
                    <div className="flex items-center gap-1.5 text-[#8B949E] text-sm">
                      <Building size={12} />
                      <span className="truncate">{selectedNode.company}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#8B949E] text-sm">
                      <Briefcase size={12} />
                      <span className="truncate">{selectedNode.position}</span>
                    </div>
                  </div>
                </div>

                {/* Connection Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#FFB800]/20 text-[#FFB800] font-medium">
                    {connectionDegree}단계 거리
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#00E5FF]/20 text-[#00E5FF]">
                    {selectedNode.connectionCount}명 연결
                  </span>
                </div>

                {/* Contact Info - 1촌에게만 표시 */}
                {selectedNode.degree === 1 && selectedUserData && (
                  <div className="mb-4">
                    <h3 className="text-xs font-medium text-[#8B949E] mb-2">연락처</h3>
                    <div className="bg-[#161B22]/80 rounded-xl p-3 space-y-2">
                      {selectedUserData.email && (
                        <a
                          href={`mailto:${selectedUserData.email}`}
                          className="flex items-center gap-2 text-sm text-[#8B949E] hover:text-[#00E5FF] transition-colors"
                        >
                          <Mail size={14} className="text-[#00E5FF]" />
                          <span>{selectedUserData.email}</span>
                        </a>
                      )}
                      {selectedUserData.phone && (
                        <a
                          href={`tel:${selectedUserData.phone}`}
                          className="flex items-center gap-2 text-sm text-[#8B949E] hover:text-[#00E5FF] transition-colors"
                        >
                          <Phone size={14} className="text-[#00E5FF]" />
                          <span>{selectedUserData.phone}</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Connection Path */}
                <div className="mb-4">
                  <h3 className="text-xs font-medium text-[#8B949E] mb-2">나와의 연결 경로</h3>
                  {isLoadingPath ? (
                    <div className="flex items-center justify-center py-3">
                      <div className="spinner w-5 h-5" />
                    </div>
                  ) : connectionPath.length > 0 ? (
                    <div className="bg-[#161B22]/80 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        {connectionPath.map((user, idx) => (
                          <div key={user.id} className="flex items-center gap-1.5 flex-shrink-0">
                            <div className="flex flex-col items-center">
                              <Avatar
                                src={user.profileImage}
                                name={user.name}
                                size="xs"
                                hasGlow={idx === 0 || idx === connectionPath.length - 1}
                              />
                              <span className="text-[10px] text-[#8B949E] mt-0.5 max-w-[40px] truncate">
                                {idx === 0 ? '나' : user.name.slice(0, 3)}
                              </span>
                            </div>
                            {idx < connectionPath.length - 1 && (
                              <ArrowRight size={12} className={`flex-shrink-0 ${idx === 0 ? 'text-[#00E5FF]' : 'text-[#7C4DFF]'}`} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[#484F58] text-xs">연결 경로를 찾을 수 없습니다</p>
                  )}
                </div>

                {/* Keywords */}
                <div className="mb-4">
                  <h3 className="text-xs font-medium text-[#8B949E] mb-2">관심 분야</h3>
                  <div className="flex flex-wrap gap-1.5">
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
                </div>

                {/* Memo - 1촌에게만 메모 남기기 가능 */}
                {selectedNode.degree === 1 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-medium text-[#8B949E] flex items-center gap-1">
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
                            className="p-1 rounded hover:bg-[#21262D] transition-colors"
                          >
                            <Pencil size={12} className="text-[#8B949E]" />
                          </button>
                          <button
                            onClick={handleDeleteMemo}
                            className="p-1 rounded hover:bg-[#21262D] transition-colors"
                          >
                            <Trash2 size={12} className="text-[#FF4081]" />
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditingMemo ? (
                      <div className="bg-[#161B22]/80 rounded-xl p-3">
                        <textarea
                          value={memoText}
                          onChange={(e) => setMemoText(e.target.value)}
                          placeholder="이 인물에 대한 메모를 남겨보세요..."
                          maxLength={200}
                          className="
                            w-full bg-transparent text-white text-sm
                            resize-none focus:outline-none
                            placeholder:text-[#484F58]
                          "
                          rows={3}
                          autoFocus
                        />
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-[#484F58]">{memoText.length}/200</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setIsEditingMemo(false);
                                setMemoText(currentMemo?.content || '');
                              }}
                              className="text-xs text-[#8B949E] hover:text-white transition-colors"
                            >
                              취소
                            </button>
                            <button
                              onClick={handleSaveMemo}
                              disabled={!memoText.trim()}
                              className="flex items-center gap-1 text-xs text-[#00E5FF] hover:text-[#00E5FF]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Check size={12} />
                              저장
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : currentMemo ? (
                      <div className="bg-[#161B22]/80 rounded-xl p-3">
                        <p className="text-sm text-white whitespace-pre-wrap">{currentMemo.content}</p>
                        <p className="text-[10px] text-[#484F58] mt-2">
                          {new Date(currentMemo.updatedAt).toLocaleDateString('ko-KR')} 수정됨
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsEditingMemo(true)}
                        className="w-full bg-[#161B22]/80 rounded-xl p-3 border border-dashed border-[#21262D] hover:border-[#00E5FF]/50 transition-colors text-left"
                      >
                        <p className="text-xs text-[#484F58]">
                          + 메모 추가하기
                        </p>
                      </button>
                    )}
                  </div>
                )}

                {/* Their Network - 1촌만 실제 인맥 표시, 2촌 이상은 흐리게 처리 */}
                {theirConnections.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-xs font-medium text-[#8B949E] mb-2">
                      <Users size={12} className="inline mr-1" />
                      {selectedNode.name}님의 인맥 ({theirConnections.length}명)
                    </h3>
                    {selectedNode.degree === 1 ? (
                      // 1촌인 경우: 실제 인맥 목록 표시 (클릭 가능)
                      <div className="bg-[#161B22]/80 rounded-xl p-3">
                        <div className="grid grid-cols-5 gap-2">
                          {theirConnections.slice(0, 10).map((user) => (
                            <button
                              key={user.id}
                              onClick={() => handleConnectionClick(user)}
                              className="flex flex-col items-center hover:opacity-80 transition-opacity cursor-pointer"
                            >
                              <Avatar
                                src={user.profileImage}
                                name={user.name}
                                size="xs"
                              />
                              <span className="text-[10px] text-[#8B949E] mt-0.5 max-w-[40px] truncate text-center">
                                {user.name.slice(0, 3)}
                              </span>
                            </button>
                          ))}
                        </div>
                        {theirConnections.length > 10 && (
                          <p className="text-[10px] text-[#484F58] text-center mt-2">
                            +{theirConnections.length - 10}명 더
                          </p>
                        )}
                      </div>
                    ) : (
                      // 2촌 이상인 경우: 흐리게 처리하고 숫자만 표시
                      <div className="bg-[#161B22]/80 rounded-xl p-4 relative overflow-hidden">
                        {/* 흐린 아바타 배경 (장식용) */}
                        <div className="grid grid-cols-5 gap-2 opacity-20 blur-[2px]">
                          {Array.from({ length: Math.min(10, theirConnections.length) }).map((_, idx) => (
                            <div key={idx} className="flex flex-col items-center">
                              <div className="w-6 h-6 rounded-full bg-[#484F58]" />
                              <div className="w-8 h-2 mt-1 rounded bg-[#484F58]" />
                            </div>
                          ))}
                        </div>
                        {/* 잠금 오버레이 */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#161B22]/60 backdrop-blur-[1px]">
                          <div className="flex items-center gap-2 text-[#8B949E]">
                            <Users size={16} />
                            <span className="text-lg font-bold text-white">{theirConnections.length}명</span>
                          </div>
                          <p className="text-[10px] text-[#484F58] mt-1">
                            1촌과 연결하면 볼 수 있어요
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons - 하단 고정 */}
              <div className="px-4 py-3 border-t border-[#21262D]/50 bg-[#0D1117]">
                {selectedNode.degree === 1 ? (
                  // 1촌인 경우: 관심 + 메세지 버튼
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      className="flex-1 text-sm py-2"
                      leftIcon={<Star size={16} />}
                    >
                      관심
                    </Button>
                    <Button
                      className="flex-1 text-sm py-2"
                      leftIcon={<MessageCircle size={16} />}
                      onClick={handleCoffeeChatClick}
                    >
                      메세지
                    </Button>
                  </div>
                ) : (
                  // 2촌 이상인 경우: 인맥 신청 + 메세지 버튼
                  <div className="flex flex-col gap-2">
                    <Button
                      className="w-full text-sm py-2.5 bg-gradient-to-r from-[#00E5FF] to-[#7C4DFF]"
                      leftIcon={<UserPlus size={16} />}
                      onClick={handleConnectionRequestClick}
                    >
                      인맥 신청하기
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        className="flex-1 text-sm py-2"
                        leftIcon={<Star size={16} />}
                      >
                        관심
                      </Button>
                      <Button
                        variant="secondary"
                        className="flex-1 text-sm py-2"
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
