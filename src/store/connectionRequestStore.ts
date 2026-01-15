import { create } from 'zustand';

interface ConnectionRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

interface ConnectionRequestState {
  pendingRequests: ConnectionRequest[];
  sentRequests: ConnectionRequest[];
  isRequestModalOpen: boolean;
  targetUserId: string | null;
  setPendingRequests: (requests: ConnectionRequest[]) => void;
  setSentRequests: (requests: ConnectionRequest[]) => void;
  openRequestModal: (userId: string) => void;
  closeRequestModal: () => void;
}

export const useConnectionRequestStore = create<ConnectionRequestState>((set) => ({
  pendingRequests: [],
  sentRequests: [],
  isRequestModalOpen: false,
  targetUserId: null,
  setPendingRequests: (pendingRequests) => set({ pendingRequests }),
  setSentRequests: (sentRequests) => set({ sentRequests }),
  openRequestModal: (targetUserId) => set({ isRequestModalOpen: true, targetUserId }),
  closeRequestModal: () => set({ isRequestModalOpen: false, targetUserId: null }),
}));
