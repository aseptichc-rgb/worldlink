import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BusinessCard, SavedCard, IntroductionRequest } from '@/types';

interface CardState {
  // 내 명함
  myCard: BusinessCard | null;
  // 저장한 명함들
  savedCards: SavedCard[];
  // 소개 요청 (보낸 것 + 받은 것)
  introductionRequests: IntroductionRequest[];

  // Actions
  setMyCard: (card: BusinessCard | null) => void;
  updateMyCard: (updates: Partial<BusinessCard>) => void;

  addSavedCard: (card: SavedCard) => void;
  removeSavedCard: (cardId: string) => void;
  updateSavedCardMemo: (cardId: string, memo: string) => void;

  addIntroductionRequest: (request: IntroductionRequest) => void;
  updateIntroductionRequest: (id: string, updates: Partial<IntroductionRequest>) => void;
}

export const useCardStore = create<CardState>()(
  persist(
    (set) => ({
      myCard: null,
      savedCards: [],
      introductionRequests: [],

      setMyCard: (card) => set({ myCard: card }),

      updateMyCard: (updates) => set((state) => ({
        myCard: state.myCard ? { ...state.myCard, ...updates, updatedAt: new Date() } : null
      })),

      addSavedCard: (card) => set((state) => ({
        savedCards: [card, ...state.savedCards.filter(c => c.cardId !== card.cardId)]
      })),

      removeSavedCard: (cardId) => set((state) => ({
        savedCards: state.savedCards.filter(c => c.cardId !== cardId)
      })),

      updateSavedCardMemo: (cardId, memo) => set((state) => ({
        savedCards: state.savedCards.map(c =>
          c.cardId === cardId ? { ...c, memo } : c
        )
      })),

      addIntroductionRequest: (request) => set((state) => ({
        introductionRequests: [request, ...state.introductionRequests]
      })),

      updateIntroductionRequest: (id, updates) => set((state) => ({
        introductionRequests: state.introductionRequests.map(r =>
          r.id === id ? { ...r, ...updates } : r
        )
      })),
    }),
    {
      name: 'nexus-cards',
    }
  )
);
