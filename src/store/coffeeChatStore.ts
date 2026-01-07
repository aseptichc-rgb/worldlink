import { create } from 'zustand';
import { TimeSlot, CoffeeChatRequest } from '@/types';

interface CoffeeChatState {
  mySlots: TimeSlot[];
  pendingRequests: CoffeeChatRequest[];
  sentRequests: CoffeeChatRequest[];
  selectedSlot: TimeSlot | null;
  isRequestModalOpen: boolean;
  targetUserId: string | null;
  setMySlots: (slots: TimeSlot[]) => void;
  setPendingRequests: (requests: CoffeeChatRequest[]) => void;
  setSentRequests: (requests: CoffeeChatRequest[]) => void;
  setSelectedSlot: (slot: TimeSlot | null) => void;
  openRequestModal: (userId: string) => void;
  closeRequestModal: () => void;
}

export const useCoffeeChatStore = create<CoffeeChatState>((set) => ({
  mySlots: [],
  pendingRequests: [],
  sentRequests: [],
  selectedSlot: null,
  isRequestModalOpen: false,
  targetUserId: null,
  setMySlots: (mySlots) => set({ mySlots }),
  setPendingRequests: (pendingRequests) => set({ pendingRequests }),
  setSentRequests: (sentRequests) => set({ sentRequests }),
  setSelectedSlot: (selectedSlot) => set({ selectedSlot }),
  openRequestModal: (targetUserId) => set({ isRequestModalOpen: true, targetUserId }),
  closeRequestModal: () => set({ isRequestModalOpen: false, targetUserId: null, selectedSlot: null }),
}));
