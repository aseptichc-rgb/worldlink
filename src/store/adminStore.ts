import { create } from 'zustand';
import { User } from '@/types';

interface AdminState {
  users: User[];
  totalUserCount: number;
  connectionStats: {
    total: number;
    accepted: number;
    pending: number;
    rejected: number;
  };
  invitationStats: {
    total: number;
    byStatus: { pending: number; sent: number; accepted: number; expired: number };
    byMethod: { email: number; kakao: number; sms: number; link: number };
  };
  isLoading: boolean;
  searchQuery: string;
  trendRange: 'daily' | 'weekly';

  setUsers: (users: User[]) => void;
  setTotalUserCount: (count: number) => void;
  setConnectionStats: (stats: AdminState['connectionStats']) => void;
  setInvitationStats: (stats: AdminState['invitationStats']) => void;
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;
  setTrendRange: (range: 'daily' | 'weekly') => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  users: [],
  totalUserCount: 0,
  connectionStats: { total: 0, accepted: 0, pending: 0, rejected: 0 },
  invitationStats: {
    total: 0,
    byStatus: { pending: 0, sent: 0, accepted: 0, expired: 0 },
    byMethod: { email: 0, kakao: 0, sms: 0, link: 0 },
  },
  isLoading: true,
  searchQuery: '',
  trendRange: 'daily',

  setUsers: (users) => set({ users }),
  setTotalUserCount: (totalUserCount) => set({ totalUserCount }),
  setConnectionStats: (connectionStats) => set({ connectionStats }),
  setInvitationStats: (invitationStats) => set({ invitationStats }),
  setLoading: (isLoading) => set({ isLoading }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setTrendRange: (trendRange) => set({ trendRange }),
}));
