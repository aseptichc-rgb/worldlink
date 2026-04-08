import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Paper, Achievement } from '@/types';

interface PaperState {
  // 내 논문 목록
  papers: Paper[];
  // 내 업적 목록
  achievements: Achievement[];
  // 로딩 상태
  isLoading: boolean;

  // Paper Actions
  setPapers: (papers: Paper[]) => void;
  addPaper: (paper: Paper) => void;
  updatePaper: (id: string, updates: Partial<Paper>) => void;
  removePaper: (id: string) => void;
  toggleFeatured: (id: string) => void;

  // Achievement Actions
  setAchievements: (achievements: Achievement[]) => void;
  addAchievement: (achievement: Achievement) => void;
  updateAchievement: (id: string, updates: Partial<Achievement>) => void;
  removeAchievement: (id: string) => void;

  setLoading: (loading: boolean) => void;
}

export const usePaperStore = create<PaperState>()(
  persist(
    (set) => ({
      papers: [],
      achievements: [],
      isLoading: false,

      setPapers: (papers) => set({ papers }),

      addPaper: (paper) => set((state) => ({
        papers: [paper, ...state.papers.filter(p => p.id !== paper.id)]
      })),

      updatePaper: (id, updates) => set((state) => ({
        papers: state.papers.map(p =>
          p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
        )
      })),

      removePaper: (id) => set((state) => ({
        papers: state.papers.filter(p => p.id !== id)
      })),

      toggleFeatured: (id) => set((state) => ({
        papers: state.papers.map(p =>
          p.id === id ? { ...p, isFeatured: !p.isFeatured } : p
        )
      })),

      setAchievements: (achievements) => set({ achievements }),

      addAchievement: (achievement) => set((state) => ({
        achievements: [achievement, ...state.achievements.filter(a => a.id !== achievement.id)]
      })),

      updateAchievement: (id, updates) => set((state) => ({
        achievements: state.achievements.map(a =>
          a.id === id ? { ...a, ...updates } : a
        )
      })),

      removeAchievement: (id) => set((state) => ({
        achievements: state.achievements.filter(a => a.id !== id)
      })),

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'researchnexus-papers',
    }
  )
);
