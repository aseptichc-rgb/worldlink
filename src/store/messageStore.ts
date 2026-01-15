import { create } from 'zustand';

export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  createdAt: Date;
  isRead: boolean;
}

interface MessageState {
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  markAsRead: (messageId: string) => void;
  getUnreadCount: () => number;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({
    messages: [message, ...state.messages]
  })),
  markAsRead: (messageId) => set((state) => ({
    messages: state.messages.map((m) =>
      m.id === messageId ? { ...m, isRead: true } : m
    ),
  })),
  getUnreadCount: () => {
    const state = get();
    return state.messages.filter((m) => !m.isRead).length;
  },
}));
