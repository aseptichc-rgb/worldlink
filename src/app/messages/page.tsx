'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MessageCircle, Send, Inbox, Check, CheckCheck } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useMessageStore, Message } from '@/store/messageStore';
import { demoUsers, getDemoCompatibleId, ensureUserInDemoNetwork } from '@/lib/demo-data';
import { onAuthChange, getUser } from '@/lib/firebase-services';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

// 데모용 메세지 데이터
const generateDemoMessages = (currentUserId: string): Message[] => {
  const otherUsers = demoUsers.filter(u => u.id !== currentUserId).slice(0, 5);

  return [
    {
      id: 'msg-1',
      fromUserId: otherUsers[0]?.id || 'demo-user-2',
      toUserId: currentUserId,
      content: '안녕하세요! 프로필 보고 연락드립니다. AI 관련해서 이야기 나눠보고 싶어요.',
      createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30분 전
      isRead: false,
    },
    {
      id: 'msg-2',
      fromUserId: otherUsers[1]?.id || 'demo-user-3',
      toUserId: currentUserId,
      content: '스타트업 투자 관련해서 조언 부탁드려도 될까요?',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2시간 전
      isRead: false,
    },
    {
      id: 'msg-3',
      fromUserId: currentUserId,
      toUserId: otherUsers[2]?.id || 'demo-user-4',
      content: '안녕하세요! 협업 제안드리고 싶어서 연락드립니다.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1일 전
      isRead: true,
    },
    {
      id: 'msg-4',
      fromUserId: otherUsers[3]?.id || 'demo-user-5',
      toUserId: currentUserId,
      content: '마케팅 전략에 대해 이야기 나눠보고 싶습니다.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2일 전
      isRead: true,
    },
  ];
};

type TabType = 'received' | 'sent';

export default function MessagesPage() {
  const router = useRouter();
  const { user, setUser, isAuthenticated, isLoading: authLoading, setLoading } = useAuthStore();
  const { messages, setMessages, markAsRead, addMessage } = useMessageStore();
  const [activeTab, setActiveTab] = useState<TabType>('received');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSending, setIsSending] = useState(false);

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

  const handleReply = async () => {
    if (!selectedMessage || !replyContent.trim()) return;

    setIsSending(true);

    // 답장 메세지 생성
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      fromUserId: currentUserId,
      toUserId: selectedMessage.fromUserId,
      content: replyContent.trim(),
      createdAt: new Date(),
      isRead: true,
    };

    // 시뮬레이션 딜레이
    await new Promise(resolve => setTimeout(resolve, 500));

    addMessage(newMessage);
    setReplyContent('');
    setShowReplyInput(false);
    setSelectedMessage(null);
    setActiveTab('sent');
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
          <h1 className="text-lg font-bold text-white">메세지</h1>
        </div>

        {/* Tabs */}
        <div className="flex px-5 gap-2 pb-3">
          <button
            onClick={() => setActiveTab('received')}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
              ${activeTab === 'received'
                ? 'bg-[#58A6FF] text-white'
                : 'bg-[#1C2333] text-[#8B949E] hover:text-white'
              }
            `}
          >
            <Inbox size={16} />
            받은 메세지
            {unreadCount > 0 && (
              <span className="w-5 h-5 bg-[#FF6B8A] text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
              ${activeTab === 'sent'
                ? 'bg-[#58A6FF] text-white'
                : 'bg-[#1C2333] text-[#8B949E] hover:text-white'
              }
            `}
          >
            <Send size={16} />
            보낸 메세지
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
                      <span className={`font-medium ${!message.isRead && activeTab === 'received' ? 'text-white' : 'text-[#C9D1D9]'}`}>
                        {otherUser?.name || '알 수 없음'}
                      </span>
                      <span className="text-sm text-[#484F58]">
                        {formatMessageTime(message.createdAt)}
                      </span>
                    </div>
                    <p className="text-base text-[#8B949E] truncate">
                      {otherUser?.company} · {otherUser?.position}
                    </p>
                    <p className={`text-base mt-1 truncate ${!message.isRead && activeTab === 'received' ? 'text-white' : 'text-[#8B949E]'}`}>
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
              {activeTab === 'received' ? '받은 메세지가 없습니다' : '보낸 메세지가 없습니다'}
            </p>
            <p className="text-[#484F58] text-base mt-1">
              인맥에게 메세지를 보내보세요
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

                      {/* Direction */}
                      <div className="flex items-center gap-2 mb-4">
                        {isReceived ? (
                          <span className="text-sm px-2 py-1 rounded-full bg-[#58A6FF]/20 text-[#58A6FF]">
                            받은 메세지
                          </span>
                        ) : (
                          <span className="text-sm px-2 py-1 rounded-full bg-[#1F6FEB]/20 text-[#1F6FEB]">
                            보낸 메세지
                          </span>
                        )}
                        <span className="text-sm text-[#484F58]">
                          {format(selectedMessage.createdAt, 'yyyy년 M월 d일 a h:mm', { locale: ko })}
                        </span>
                      </div>

                      {/* Message Content */}
                      <div className="bg-[#1C2333] rounded-xl p-4 mb-6">
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
                                className="w-full bg-[#1C2333] border border-[#30363D] text-white rounded-xl py-3 px-4 text-base resize-none focus:outline-none focus:border-[#58A6FF] placeholder:text-[#484F58]"
                                rows={3}
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setShowReplyInput(false);
                                    setReplyContent('');
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
                                      보내기
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
