'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MessageCircle, Send, Inbox, Check, CheckCheck, Users, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useMessageStore, Message } from '@/store/messageStore';
import { demoUsers, getDemoCompatibleId, ensureUserInDemoNetwork } from '@/lib/demo-data';
import { onAuthChange, getUser } from '@/lib/firebase-services';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

type TabType = 'received' | 'sent';

export default function MessagesPage() {
  const router = useRouter();
  const { user, setUser, isAuthenticated, isLoading: authLoading, setLoading } = useAuthStore();
  const { messages, loadMessages, markAsRead, sendMessageToUser } = useMessageStore();
  const [activeTab, setActiveTab] = useState<TabType>('received');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [messagesLoaded, setMessagesLoaded] = useState(false);

  // Auth state listener (데모 모드에서는 건너뜀)
  useEffect(() => {
    const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('nodded_demo_mode') === 'true';
    if (isDemoMode) {
      setLoading(false);
      return;
    }

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

  // Firebase/데모 메시지 로드
  useEffect(() => {
    if (user && !messagesLoaded) {
      const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('nodded_demo_mode') === 'true';
      const demoId = getDemoCompatibleId(user);
      const isDemoUser = demoId !== user.id || user.id.startsWith('member_') || user.id.startsWith('demo_');

      if (isDemoMode && isDemoUser) {
        ensureUserInDemoNetwork(demoId);
      }

      const userId = isDemoMode && isDemoUser ? demoId : user.id;
      loadMessages(userId);
      setMessagesLoaded(true);
    }
  }, [user, messagesLoaded, loadMessages]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
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

  const currentUserId = getDemoCompatibleId(user) !== user.id ? getDemoCompatibleId(user) : user.id;

  const receivedMessages = messages.filter(m => m.toUserId === currentUserId);
  const sentMessages = messages.filter(m => m.fromUserId === currentUserId);
  const unreadCount = receivedMessages.filter(m => !m.isRead).length;

  const displayMessages = activeTab === 'received' ? receivedMessages : sentMessages;

  const getUserInfo = (userId: string) => {
    return demoUsers.find(u => u.id === userId);
  };

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    setReplyError('');
    if (!message.isRead && message.toUserId === currentUserId) {
      markAsRead(message.id);
    }
  };

  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 24) {
      return format(date, 'a h:mm', { locale: ko });
    } else if (hours < 48) {
      return '어제';
    } else {
      return format(date, 'M월 d일', { locale: ko });
    }
  };

  const getDegreeLabel = (degree: number) => {
    if (degree === 1) return '1촌';
    if (degree === 2) return '2촌';
    return `${degree}촌`;
  };

  const getDegreeColor = (degree: number) => {
    if (degree === 1) return { bg: 'bg-[#58A6FF]/15', text: 'text-[#58A6FF]' };
    return { bg: 'bg-[#9B8ED9]/15', text: 'text-[#9B8ED9]' };
  };

  const handleReply = async () => {
    if (!selectedMessage || !replyContent.trim()) return;

    setIsSending(true);
    setReplyError('');

    const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('nodded_demo_mode') === 'true';

    const result = await sendMessageToUser(
      currentUserId,
      selectedMessage.fromUserId,
      replyContent.trim(),
      isDemoMode
    );

    if (result.success) {
      setReplyContent('');
      setShowReplyInput(false);
      setSelectedMessage(null);
      setActiveTab('sent');
    } else {
      setReplyError(result.error || '답장 전송에 실패했습니다.');
    }

    setIsSending(false);
  };

  return (
    <div className="min-h-screen bg-[#0D1117]">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-[#161B22] border-b border-[#30363D]">
        <div className="flex items-center gap-4 px-5 py-4">
          <button
            onClick={() => router.push('/network')}
            className="p-2 rounded-xl hover:bg-[#30363D] transition-colors"
          >
            <ArrowLeft size={22} className="text-[#8B949E]" />
          </button>
          <h1 className="text-lg font-bold text-white">쪽지함</h1>
        </div>

        {/* Tabs */}
        <div className="flex px-5 gap-2 pb-3">
          <button
            onClick={() => setActiveTab('received')}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all
              ${activeTab === 'received'
                ? 'bg-[#58A6FF] text-white'
                : 'bg-[#1C2333] text-[#8B949E] hover:text-white'
              }
            `}
          >
            <Inbox size={16} />
            받은 쪽지
            {unreadCount > 0 && (
              <span className="w-5 h-5 bg-[#FF6B8A] text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all
              ${activeTab === 'sent'
                ? 'bg-[#58A6FF] text-white'
                : 'bg-[#1C2333] text-[#8B949E] hover:text-white'
              }
            `}
          >
            <Send size={16} />
            보낸 쪽지
          </button>
        </div>
      </div>

      {/* Message List */}
      <div className="pt-32 pb-8 px-5">
        {displayMessages.length > 0 ? (
          <div className="space-y-2">
            {displayMessages.map((message) => {
              const otherUserId = activeTab === 'received' ? message.fromUserId : message.toUserId;
              const otherUser = getUserInfo(otherUserId);
              const degreeStyle = getDegreeColor(message.connectionDegree);

              return (
                <motion.button
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => handleMessageClick(message)}
                  className={`
                    w-full flex items-start gap-3 p-4 rounded-xl text-left transition-all
                    ${!message.isRead && activeTab === 'received'
                      ? 'bg-[#58A6FF]/10 border border-[#58A6FF]/30'
                      : 'bg-[#1C2333] border border-[#30363D] hover:border-[#484F58]'
                    }
                  `}
                >
                  <Avatar
                    src={otherUser?.profileImage}
                    name={otherUser?.name}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${!message.isRead && activeTab === 'received' ? 'text-white' : 'text-[#C9D1D9]'}`}>
                          {otherUser?.name || '알 수 없음'}
                        </span>
                        {/* 촌수 뱃지 */}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${degreeStyle.bg} ${degreeStyle.text}`}>
                          {getDegreeLabel(message.connectionDegree)}
                        </span>
                      </div>
                      <span className="text-sm text-[#484F58]">
                        {formatMessageTime(message.createdAt)}
                      </span>
                    </div>
                    <p className="text-base text-[#8B949E] truncate">
                      {otherUser?.company} · {otherUser?.position}
                    </p>
                    <p className={`text-base mt-2 truncate ${!message.isRead && activeTab === 'received' ? 'text-white' : 'text-[#8B949E]'}`}>
                      {message.content}
                    </p>
                  </div>
                  {activeTab === 'received' && (
                    <div className="flex-shrink-0">
                      {message.isRead ? (
                        <CheckCheck size={16} className="text-[#58A6FF]" />
                      ) : (
                        <div className="w-2 h-2 bg-[#58A6FF] rounded-full" />
                      )}
                    </div>
                  )}
                  {activeTab === 'sent' && (
                    <div className="flex-shrink-0">
                      <Check size={16} className="text-[#484F58]" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <MessageCircle size={48} className="text-[#484F58] mx-auto mb-4" />
            <p className="text-[#8B949E]">
              {activeTab === 'received' ? '받은 쪽지가 없습니다' : '보낸 쪽지가 없습니다'}
            </p>
            <p className="text-[#484F58] text-base mt-2">
              1촌 또는 2촌(인맥의 인맥)에게 쪽지를 보내보세요
            </p>
          </div>
        )}
      </div>

      {/* Message Detail Modal */}
      <AnimatePresence>
        {selectedMessage && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedMessage(null);
                setShowReplyInput(false);
                setReplyContent('');
                setReplyError('');
              }}
              className="fixed inset-0 bg-[#0D1117]/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#161B22] border-t border-[#30363D] rounded-t-2xl max-h-[70vh] overflow-y-auto"
            >
              <div className="p-6">
                {/* Handle */}
                <div className="w-12 h-1 bg-[#484F58] rounded-full mx-auto mb-6" />

                {(() => {
                  const otherUserId = selectedMessage.toUserId === currentUserId
                    ? selectedMessage.fromUserId
                    : selectedMessage.toUserId;
                  const otherUser = getUserInfo(otherUserId);
                  const isReceived = selectedMessage.toUserId === currentUserId;
                  const degreeStyle = getDegreeColor(selectedMessage.connectionDegree);

                  return (
                    <>
                      {/* User Info */}
                      <div className="flex items-center gap-3 mb-6">
                        <Avatar
                          src={otherUser?.profileImage}
                          name={otherUser?.name}
                          size="lg"
                        />
                        <div>
                          <h3 className="font-bold text-white">{otherUser?.name}</h3>
                          <p className="text-base text-[#8B949E]">
                            {otherUser?.company} · {otherUser?.position}
                          </p>
                        </div>
                      </div>

                      {/* Direction + Degree */}
                      <div className="flex items-center gap-2 mb-4">
                        {isReceived ? (
                          <span className="text-sm px-3 py-1.5 rounded-full bg-[#58A6FF]/20 text-[#58A6FF]">
                            받은 쪽지
                          </span>
                        ) : (
                          <span className="text-sm px-3 py-1.5 rounded-full bg-[#1F6FEB]/20 text-[#1F6FEB]">
                            보낸 쪽지
                          </span>
                        )}
                        <span className={`text-sm px-3 py-1.5 rounded-full font-medium ${degreeStyle.bg} ${degreeStyle.text}`}>
                          <Users size={12} className="inline mr-1" />
                          {getDegreeLabel(selectedMessage.connectionDegree)}
                        </span>
                        <span className="text-sm text-[#484F58]">
                          {format(selectedMessage.createdAt, 'yyyy년 M월 d일 a h:mm', { locale: ko })}
                        </span>
                      </div>

                      {/* Message Content */}
                      <div className="bg-[#1C2333] rounded-xl p-5 mb-6">
                        <p className="text-white whitespace-pre-wrap">{selectedMessage.content}</p>
                      </div>

                      {/* Actions */}
                      {isReceived && (
                        <>
                          {showReplyInput ? (
                            <div className="space-y-3">
                              <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="답장 내용을 입력하세요..."
                                className="w-full bg-[#1C2333] border border-[#30363D] text-white rounded-xl py-4 px-5 text-base resize-none focus:outline-none focus:border-[#58A6FF] placeholder:text-[#484F58]"
                                rows={3}
                                autoFocus
                                maxLength={500}
                              />
                              {replyError && (
                                <div className="px-3 py-2 bg-[#F85149]/10 border border-[#F85149]/30 rounded-lg">
                                  <p className="text-sm text-[#F85149]">{replyError}</p>
                                </div>
                              )}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setShowReplyInput(false);
                                    setReplyContent('');
                                    setReplyError('');
                                  }}
                                  className="flex-1 py-3 bg-[#1C2333] text-[#8B949E] font-medium rounded-xl border border-[#30363D]"
                                >
                                  취소
                                </button>
                                <button
                                  onClick={handleReply}
                                  disabled={!replyContent.trim() || isSending}
                                  className="flex-1 py-3 bg-gradient-to-r from-[#58A6FF] to-[#1F6FEB] text-white font-medium rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                  {isSending ? (
                                    <div className="spinner w-4 h-4" />
                                  ) : (
                                    <>
                                      <Send size={16} />
                                      답장 보내기
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowReplyInput(true)}
                              className="w-full py-3 bg-gradient-to-r from-[#58A6FF] to-[#1F6FEB] text-white font-medium rounded-xl flex items-center justify-center gap-2"
                            >
                              <Send size={16} />
                              답장하기
                            </button>
                          )}
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
