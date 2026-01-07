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
      logout: () => set({ user: null, isAuthenticated: false, inviteCode: null }),
    }),
    {
      name: 'nexus-auth',
      partialize: (state) => ({ inviteCode: state.inviteCode }),
    }
  )
);
