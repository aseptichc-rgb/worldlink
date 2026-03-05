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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      inviteCode: null,
      setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
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
