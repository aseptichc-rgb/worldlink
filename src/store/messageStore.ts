import { create } from 'zustand';
import {
  sendMessage as firebaseSendMessage,
  getReceivedMessages,
  getSentMessages,
  markMessageAsRead,
  getConnectionDegree,
  FirestoreMessage,
} from '@/lib/firebase-services';
import { demoUsers, demoConnections, getDemoCompatibleId, findDemoConnectionPath } from '@/lib/demo-data';

export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  connectionDegree: number; // 1 = 1촌, 2 = 2촌
  createdAt: Date;
  isRead: boolean;
}

interface MessageState {
  messages: Message[];
  isLoading: boolean;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  markAsRead: (messageId: string) => void;
  getUnreadCount: () => number;

  // Firebase 연동
  loadMessages: (userId: string) => Promise<void>;
  sendMessageToUser: (
    fromUserId: string,
    toUserId: string,
    content: string,
    isDemoMode: boolean
  ) => Promise<{ success: boolean; degree: number; error?: string }>;
}

// 데모 모드에서 연결 거리(촌수) 계산
const getDemoConnectionDegree = (fromUserId: string, toUserId: string): number => {
  const path = findDemoConnectionPath(fromUserId, toUserId);
  if (path.length === 0) return 0;
  return path.length - 1; // path에는 본인 포함이므로 -1
};

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: [],
  isLoading: false,
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({
    messages: [message, ...state.messages]
  })),
  markAsRead: (messageId) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, isRead: true } : m
      ),
    }));
    // Firebase에서도 읽음 처리 (데모 모드가 아닐 때)
    const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('nodded_demo_mode') === 'true';
    if (!isDemoMode) {
      markMessageAsRead(messageId).catch(console.warn);
    }
  },
  getUnreadCount: () => {
    const state = get();
    return state.messages.filter((m) => !m.isRead).length;
  },

  // Firebase에서 메시지 로드
  loadMessages: async (userId: string) => {
    const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('nodded_demo_mode') === 'true';

    if (isDemoMode) {
      // 데모 모드: 데모 메시지 생성
      const demoId = getDemoCompatibleId({ id: userId });
      const otherUsers = demoUsers.filter(u => u.id !== demoId);
      const myConnections = demoConnections[demoId] || [];

      // 1촌에서 받은 메시지
      const firstDegreeUser = myConnections.length > 0
        ? demoUsers.find(u => u.id === myConnections[0])
        : otherUsers[0];

      // 2촌 찾기: 1촌의 1촌 중 내 1촌이 아닌 사람
      let secondDegreeUser = null;
      for (const connId of myConnections) {
        const theirConns = demoConnections[connId] || [];
        for (const theirConnId of theirConns) {
          if (theirConnId !== demoId && !myConnections.includes(theirConnId)) {
            secondDegreeUser = demoUsers.find(u => u.id === theirConnId);
            if (secondDegreeUser) break;
          }
        }
        if (secondDegreeUser) break;
      }

      const demoMessages: Message[] = [];

      if (firstDegreeUser) {
        demoMessages.push({
          id: 'msg-demo-1',
          fromUserId: firstDegreeUser.id,
          toUserId: demoId,
          content: '안녕하세요! 프로필 보고 연락드립니다. AI 관련해서 이야기 나눠보고 싶어요.',
          connectionDegree: 1,
          createdAt: new Date(Date.now() - 1000 * 60 * 30),
          isRead: false,
        });
      }

      if (secondDegreeUser) {
        demoMessages.push({
          id: 'msg-demo-2',
          fromUserId: secondDegreeUser.id,
          toUserId: demoId,
          content: '공통 인맥을 통해 알게 되었습니다. 협업 가능성에 대해 이야기 나눠보고 싶어요.',
          connectionDegree: 2,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
          isRead: false,
        });
      }

      if (myConnections.length > 1) {
        const sentTarget = demoUsers.find(u => u.id === myConnections[1]);
        if (sentTarget) {
          demoMessages.push({
            id: 'msg-demo-3',
            fromUserId: demoId,
            toUserId: sentTarget.id,
            content: '안녕하세요! 협업 제안드리고 싶어서 연락드립니다.',
            connectionDegree: 1,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
            isRead: true,
          });
        }
      }

      set({ messages: demoMessages, isLoading: false });
      return;
    }

    // Firebase 모드
    set({ isLoading: true });
    try {
      const [received, sent] = await Promise.all([
        getReceivedMessages(userId),
        getSentMessages(userId),
      ]);

      const allMessages: Message[] = [
        ...received.map(m => ({ ...m })),
        ...sent.map(m => ({ ...m })),
      ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // 중복 제거
      const seen = new Set<string>();
      const unique = allMessages.filter(m => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });

      set({ messages: unique, isLoading: false });
    } catch (err) {
      console.warn('[loadMessages] Failed:', err);
      set({ isLoading: false });
    }
  },

  // 쪽지 보내기 (1촌 또는 2촌만 가능)
  sendMessageToUser: async (fromUserId, toUserId, content, isDemoMode) => {
    if (isDemoMode) {
      const degree = getDemoConnectionDegree(fromUserId, toUserId);
      if (degree === 0 || degree > 2) {
        return { success: false, degree: 0, error: '1촌 또는 2촌(인맥의 인맥)에게만 쪽지를 보낼 수 있습니다.' };
      }

      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        fromUserId,
        toUserId,
        content,
        connectionDegree: degree,
        createdAt: new Date(),
        isRead: false,
      };

      set((state) => ({ messages: [newMessage, ...state.messages] }));
      return { success: true, degree };
    }

    // Firebase 모드
    try {
      const degree = await getConnectionDegree(fromUserId, toUserId);
      if (degree === 0 || degree > 2) {
        return { success: false, degree: 0, error: '1촌 또는 2촌(인맥의 인맥)에게만 쪽지를 보낼 수 있습니다.' };
      }

      const saved = await firebaseSendMessage(fromUserId, toUserId, content, degree);
      const newMessage: Message = { ...saved };

      set((state) => ({ messages: [newMessage, ...state.messages] }));
      return { success: true, degree };
    } catch (err) {
      console.warn('[sendMessageToUser] Failed:', err);
      return { success: false, degree: 0, error: '메시지 전송에 실패했습니다.' };
    }
  },
}));
