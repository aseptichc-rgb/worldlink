import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Memo {
  id: string;
  userId: string; // 메모 대상 인물 ID
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MemoState {
  memos: Record<string, Memo>; // userId를 키로 사용
  getMemo: (userId: string) => Memo | null;
  setMemo: (userId: string, content: string) => void;
  deleteMemo: (userId: string) => void;
}

export const useMemoStore = create<MemoState>()(
  persist(
    (set, get) => ({
      memos: {},
      getMemo: (userId: string) => {
        return get().memos[userId] || null;
      },
      setMemo: (userId: string, content: string) => {
        const now = new Date();
        const existingMemo = get().memos[userId];

        set((state) => ({
          memos: {
            ...state.memos,
            [userId]: {
              id: existingMemo?.id || `memo-${userId}-${Date.now()}`,
              userId,
              content,
              createdAt: existingMemo?.createdAt || now,
              updatedAt: now,
            },
          },
        }));
      },
      deleteMemo: (userId: string) => {
        set((state) => {
          const newMemos = { ...state.memos };
          delete newMemos[userId];
          return { memos: newMemos };
        });
      },
    }),
    {
      name: 'worldlink-memos',
    }
  )
);
