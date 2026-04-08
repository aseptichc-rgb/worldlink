import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  inviteCode: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setInviteCode: (code: string | null) => void;
  logout: () => void;
}

// localStorage에서 복원된 유저가 이전 형식(keywords/company)일 수 있으므로 안전 기본값 적용
function normalizeUser(u: User | null): User | null {
  if (!u) return null;
  const raw = u as any;
  return {
    ...u,
    researchInterests: u.researchInterests || raw.keywords || [],
    researchKeywords: u.researchKeywords || [],
    institution: u.institution || raw.company || '',
    researchField: u.researchField || raw.category,
    meetingStatus: u.meetingStatus || raw.coffeeStatus || 'available',
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      inviteCode: null,
      setUser: (user) => set({ user: normalizeUser(user), isAuthenticated: !!user, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      setInviteCode: (inviteCode) => set({ inviteCode }),
      logout: () => {
        // Clear persisted data from other stores to prevent data leakage
        try {
          localStorage.removeItem('nexus-cards');
          localStorage.removeItem('nodded-contacts');
          localStorage.removeItem('nodded-memos');
          localStorage.removeItem('nodded-groups');
          localStorage.removeItem('nodded_demo_mode');
          localStorage.removeItem('nodded_fcm_user_id');
          localStorage.removeItem('nodded_news_initial_search_done');
        } catch { /* ignore */ }
        set({ user: null, isAuthenticated: false, inviteCode: null });
      },
    }),
    {
      name: 'nexus-auth',
      partialize: (state) => {
        // 데모 모드일 때는 유저 데이터도 persist (Firebase Auth가 없으므로)
        const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('nodded_demo_mode') === 'true';
        if (isDemoMode && state.user) {
          return { inviteCode: state.inviteCode, user: state.user, isAuthenticated: true };
        }
        return { inviteCode: state.inviteCode };
      },
    }
  )
);
