'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Lock,
  UserPlus,
  MessageCircle,
  Building2,
  Briefcase,
  Users,
  Share2
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCardStore } from '@/store/cardStore';
import { getUser, getUserConnectionsWithDetails } from '@/lib/firebase-services';
import { demoUsers, demoConnections } from '@/lib/demo-data';
import { BusinessCard, IntroductionRequest, User } from '@/types';
import Avatar from '@/components/ui/Avatar';
import BottomNav from '@/components/ui/BottomNav';
import { v4 as uuidv4 } from 'uuid';

export default function UserNetworkPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const { savedCards, addIntroductionRequest } = useCardStore();
  const [targetUser, setTargetUser] = useState<BusinessCard | null>(null);
  const [connections, setConnections] = useState<BusinessCard[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<BusinessCard | null>(null);
  const [introMessage, setIntroMessage] = useState('');
  const [introPurpose, setIntroPurpose] = useState<IntroductionRequest['purpose']>('networking');
  const [introSent, setIntroSent] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('nodded_demo_mode') === 'true';

      // 저장된 명함에서 사용자 찾기
      const savedCard = savedCards.find(c => c.cardId === userId);
      if (savedCard) {
        setTargetUser(savedCard.card);
        // 인맥 공개 설정 확인
        if (savedCard.card.networkVisibility === 'private') {
          setIsLocked(true);
        } else {
          // getUserConnectionsWithDetails가 데모 fallback을 내부적으로 처리
          try {
            const userConnections = await getUserConnectionsWithDetails(userId);
            const connectionCards: BusinessCard[] = userConnections.map(conn => ({
              id: conn.id,
              userId: conn.id,
              name: conn.name || '알 수 없음',
              company: conn.company || '',
              position: conn.position || '',
              keywords: conn.keywords || [],
              profileImage: conn.profileImage,
              networkVisibility: 'connections_only' as const,
              qrCode: '',
              createdAt: new Date(),
              updatedAt: new Date(),
            }));
            setConnections(connectionCards);
          } catch {
            // 연결 로드 실패 시 빈 배열
          }
        }
        return;
      }

      // getUser로 사용자 정보 가져오기
      try {
        const userData = await getUser(userId);
        if (userData) {
          // User 데이터를 BusinessCard 형식으로 변환
          setTargetUser({
            id: userData.id,
            userId: userData.id,
            name: userData.name || '사용자',
            company: userData.company || '',
            position: userData.position || '',
            keywords: userData.keywords || [],
            profileImage: userData.profileImage,
            networkVisibility: 'connections_only',
            qrCode: '',
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          // 사용자의 실제 인맥 가져오기
          try {
            const userConnections = await getUserConnectionsWithDetails(userId);
            if (userConnections.length > 0) {
              // User 데이터를 BusinessCard 형식으로 변환
              const connectionCards: BusinessCard[] = userConnections.map(conn => ({
                id: conn.id,
                userId: conn.id,
                name: conn.name || '알 수 없음',
                company: conn.company || '',
                position: conn.position || '',
                keywords: conn.keywords || [],
                profileImage: conn.profileImage,
                networkVisibility: 'connections_only',
                qrCode: '',
                createdAt: new Date(),
                updatedAt: new Date(),
              }));
              setConnections(connectionCards);
            } else if (isDemoMode) {
              // 데모 모드에서 Firebase 연결이 없으면 demoConnections 사용
              const connectionIds = demoConnections[userId] || [];
              const connectionCards: BusinessCard[] = connectionIds
                .map(id => demoUsers.find(u => u.id === id))
                .filter((u): u is User => u !== undefined)
                .map(conn => ({
                  id: conn.id,
                  userId: conn.id,
                  name: conn.name,
                  company: conn.company || '',
                  position: conn.position || '',
                  keywords: conn.keywords || [],
                  profileImage: conn.profileImage,
                  networkVisibility: 'connections_only' as const,
                  qrCode: '',
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }));
              setConnections(connectionCards);
            }
          } catch {
            if (isDemoMode) {
              const connectionIds = demoConnections[userId] || [];
              const connectionCards: BusinessCard[] = connectionIds
                .map(id => demoUsers.find(u => u.id === id))
                .filter((u): u is User => u !== undefined)
                .map(conn => ({
                  id: conn.id,
                  userId: conn.id,
                  name: conn.name,
                  company: conn.company || '',
                  position: conn.position || '',
                  keywords: conn.keywords || [],
                  profileImage: conn.profileImage,
                  networkVisibility: 'connections_only' as const,
                  qrCode: '',
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }));
              setConnections(connectionCards);
            }
          }
          return;
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      }

      // 데모 모드에서 demoUsers에서 다시 찾기
      if (isDemoMode) {
        const demoUser = demoUsers.find(u => u.id === userId);
        if (demoUser) {
          setTargetUser({
            id: demoUser.id,
            userId: demoUser.id,
            name: demoUser.name,
            company: demoUser.company || '',
            position: demoUser.position || '',
            keywords: demoUser.keywords || [],
            profileImage: demoUser.profileImage,
            networkVisibility: 'connections_only',
            qrCode: '',
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          const connectionIds = demoConnections[userId] || [];
          const connectionCards: BusinessCard[] = connectionIds
            .map(id => demoUsers.find(u => u.id === id))
            .filter((u): u is User => u !== undefined)
            .map(conn => ({
              id: conn.id,
              userId: conn.id,
              name: conn.name,
              company: conn.company || '',
              position: conn.position || '',
              keywords: conn.keywords || [],
              profileImage: conn.profileImage,
              networkVisibility: 'connections_only' as const,
              qrCode: '',
              createdAt: new Date(),
              updatedAt: new Date(),
            }));
          setConnections(connectionCards);
          return;
        }
      }

      // 최종 fallback: 빈 프로필 (사용자를 찾지 못한 경우)
      setTargetUser({
        id: userId,
        userId: userId,
        name: '알 수 없는 사용자',
        company: '',
        position: '',
        keywords: [],
        networkVisibility: 'connections_only',
        qrCode: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      setConnections([]);
    };

    loadUserData();
  }, [userId, savedCards]);

  const handleRequestIntro = (connection: BusinessCard) => {
    setSelectedConnection(connection);
    setShowIntroModal(true);
  };

  const handleSendIntroRequest = () => {
    if (!user || !targetUser || !selectedConnection) return;

    const request: IntroductionRequest = {
      id: uuidv4(),
      requesterId: user.id,
      introducerId: targetUser.userId,
      targetId: selectedConnection.userId,
      message: introMessage,
      purpose: introPurpose,
      status: 'pending',
      createdAt: new Date(),
    };

    addIntroductionRequest(request);
    setIntroSent(true);

    setTimeout(() => {
      setShowIntroModal(false);
      setIntroSent(false);
      setIntroMessage('');
      setSelectedConnection(null);
    }, 2000);
  };

  const purposes = [
    { value: 'business', label: '비즈니스 협업' },
    { value: 'collaboration', label: '프로젝트 협업' },
    { value: 'hiring', label: '채용/이직' },
    { value: 'networking', label: '네트워킹' },
    { value: 'other', label: '기타' },
  ] as const;

  if (!targetUser) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="spinner" />
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
          <h1 className="text-lg font-semibold text-white">{targetUser.name}의 인맥</h1>
          <button className="p-2 -mr-2">
            <Share2 size={24} className="text-[#8B949E]" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* 프로필 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-gradient-to-br from-[#1C2333] to-[#161B22] border border-[#30363D]"
        >
          <div className="flex items-center gap-4">
            <Avatar
              src={targetUser.profileImage}
              name={targetUser.name}
              size="lg"
              hasGlow
            />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{targetUser.name}</h2>
              {targetUser.position && (
                <div className="flex items-center gap-2 text-[#8B949E] mt-1">
                  <Briefcase size={14} />
                  <span className="text-base">{targetUser.position}</span>
                </div>
              )}
              {targetUser.company && (
                <div className="flex items-center gap-2 text-[#8B949E]">
                  <Building2 size={14} />
                  <span className="text-base">{targetUser.company}</span>
                </div>
              )}
            </div>
          </div>

          {/* 키워드 */}
          {targetUser.keywords && targetUser.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#30363D]">
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

          {/* 인맥 수 */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#30363D]">
            <Users size={18} className="text-[#1F6FEB]" />
            <span className="text-white font-medium">{connections.length}명</span>
            <span className="text-[#8B949E]">의 인맥</span>
          </div>
        </motion.div>

        {/* 인맥 목록 */}
        {isLocked ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-[#1C2333] flex items-center justify-center mb-4">
              <Lock size={32} className="text-[#484F58]" />
            </div>
            <p className="text-white font-medium mb-2">비공개 인맥</p>
            <p className="text-base text-[#8B949E] text-center">
              {targetUser.name}님이 인맥을 비공개로 설정했습니다
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">인맥 목록</h3>
              <span className="text-base text-[#8B949E]">{connections.length}명</span>
            </div>

            <div className="space-y-3">
              {connections.map((connection, index) => (
                <motion.div
                  key={connection.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl bg-[#1C2333] border border-[#30363D]"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={connection.profileImage}
                      name={connection.name}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white">{connection.name}</h4>
                      <p className="text-base text-[#8B949E]">
                        {connection.position} @ {connection.company}
                      </p>
                      {connection.keywords && connection.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {connection.keywords.slice(0, 2).map((keyword, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 text-sm rounded-full bg-[#1F6FEB]/10 text-[#1F6FEB]"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRequestIntro(connection)}
                      className="p-2 rounded-lg bg-[#58A6FF]/10 text-[#58A6FF] hover:bg-[#58A6FF]/20 transition-colors"
                    >
                      <UserPlus size={20} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 소개 요청 모달 */}
      <AnimatePresence>
        {showIntroModal && selectedConnection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end"
            onClick={() => setShowIntroModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-h-[85vh] overflow-y-auto bg-[#1C2333] rounded-t-2xl border-t border-[#30363D] p-6"
            >
              <div className="w-12 h-1 bg-[#484F58] rounded-full mx-auto mb-6" />

              {introSent ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="py-8 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-[#3FB950]/20 flex items-center justify-center mx-auto mb-4">
                    <MessageCircle size={32} className="text-[#3FB950]" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">소개 요청 완료!</h3>
                  <p className="text-[#8B949E]">
                    {targetUser.name}님에게 소개 요청을 보냈습니다
                  </p>
                </motion.div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-white mb-4">소개 요청하기</h3>

                  {/* 소개 경로 */}
                  <div className="flex items-center justify-center gap-3 mb-6 p-4 rounded-lg bg-[#161B22]">
                    <div className="text-center">
                      <Avatar src={user?.profileImage} name={user?.name || '나'} size="sm" />
                      <p className="text-sm text-[#8B949E] mt-1">나</p>
                    </div>
                    <div className="flex-1 h-0.5 bg-gradient-to-r from-[#58A6FF] to-[#1F6FEB]" />
                    <div className="text-center">
                      <Avatar src={targetUser.profileImage} name={targetUser.name} size="sm" />
                      <p className="text-sm text-[#8B949E] mt-1">{targetUser.name}</p>
                    </div>
                    <div className="flex-1 h-0.5 bg-gradient-to-r from-[#1F6FEB] to-[#58A6FF]" />
                    <div className="text-center">
                      <Avatar src={selectedConnection.profileImage} name={selectedConnection.name} size="sm" />
                      <p className="text-sm text-[#8B949E] mt-1">{selectedConnection.name}</p>
                    </div>
                  </div>

                  {/* 소개받고 싶은 사람 정보 */}
                  <div className="p-4 rounded-lg bg-[#161B22] border border-[#30363D] mb-4">
                    <p className="text-base text-[#8B949E] mb-2">소개받고 싶은 분</p>
                    <div className="flex items-center gap-3">
                      <Avatar src={selectedConnection.profileImage} name={selectedConnection.name} size="md" />
                      <div>
                        <p className="font-medium text-white">{selectedConnection.name}</p>
                        <p className="text-base text-[#8B949E]">
                          {selectedConnection.position} @ {selectedConnection.company}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 목적 선택 */}
                  <div className="mb-4">
                    <p className="text-base text-[#8B949E] mb-2">소개 목적</p>
                    <div className="flex flex-wrap gap-2">
                      {purposes.map((purpose) => (
                        <button
                          key={purpose.value}
                          onClick={() => setIntroPurpose(purpose.value)}
                          className={`px-3 py-2 rounded-lg text-base transition-all ${
                            introPurpose === purpose.value
                              ? 'bg-[#58A6FF]/20 text-[#58A6FF] border border-[#58A6FF]'
                              : 'bg-[#30363D] text-[#8B949E] border border-transparent'
                          }`}
                        >
                          {purpose.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 메시지 */}
                  <div className="mb-6">
                    <p className="text-base text-[#8B949E] mb-2">소개 요청 메시지</p>
                    <textarea
                      value={introMessage}
                      onChange={(e) => setIntroMessage(e.target.value)}
                      placeholder={`${targetUser.name}님에게 ${selectedConnection.name}님을 왜 소개받고 싶은지 설명해주세요...`}
                      className="w-full h-32 p-4 rounded-xl bg-[#161B22] border border-[#30363D] text-white placeholder:text-[#484F58] resize-none focus:outline-none focus:border-[#58A6FF]"
                    />
                  </div>

                  <button
                    onClick={handleSendIntroRequest}
                    disabled={!introMessage.trim()}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#58A6FF] to-[#1F6FEB] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    소개 요청 보내기
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
