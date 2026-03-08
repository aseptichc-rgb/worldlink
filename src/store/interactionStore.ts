import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Interaction, InteractionType, RelationshipStatus, QuickCapture } from '@/types';

interface InteractionState {
  interactions: Record<string, Interaction[]>; // targetUserId → 기록 배열
  quickCaptures: QuickCapture[];
  _demoInitialized: boolean;

  // Interaction actions
  addInteraction: (
    userId: string,
    targetUserId: string,
    type: InteractionType,
    note?: string,
    isAutoTracked?: boolean,
    nextAction?: string,
    date?: Date,
  ) => void;
  getInteractions: (targetUserId: string) => Interaction[];
  getLastInteractionDate: (targetUserId: string) => Date | null;
  getDaysSinceLastContact: (targetUserId: string) => number;
  getRelationshipStatus: (targetUserId: string) => RelationshipStatus;
  getReminders: (connectionIds: string[]) => Array<{
    targetUserId: string;
    daysSince: number;
    status: RelationshipStatus;
    lastType?: InteractionType;
  }>;

  // Quick Capture actions
  addQuickCapture: (name: string, company?: string, memo?: string) => void;
  removeQuickCapture: (id: string) => void;

  // Demo
  initDemoInteractions: (userId: string, connectionIds: string[]) => void;
}

// 간단한 시드 랜덤 생성기 (데모용)
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const INTERACTION_TYPES: InteractionType[] = ['meeting', 'call', 'message', 'coffee_chat', 'other'];
const DEMO_NOTES: Record<InteractionType, string[]> = {
  meeting: ['점심 미팅', '오피스 방문', '세미나에서 만남', '네트워킹 행사', '프로젝트 미팅'],
  call: ['투자 관련 통화', '근황 통화', '협업 논의', '조언 요청', '인사 전화'],
  message: ['카카오톡 안부', '이메일 회신', '링크드인 메시지', '자료 공유'],
  coffee_chat: ['커피챗 미팅', '1:1 대화', '오프라인 만남'],
  memo: ['메모 업데이트'],
  other: ['소개 연결', '행사 초대', '선물 전달'],
};

export const useInteractionStore = create<InteractionState>()(
  persist(
    (set, get) => ({
      interactions: {},
      quickCaptures: [],
      _demoInitialized: false,

      addInteraction: (userId, targetUserId, type, note, isAutoTracked = false, nextAction, date) => {
        const now = new Date();
        const interaction: Interaction = {
          id: `int-${targetUserId}-${Date.now()}`,
          userId,
          targetUserId,
          type,
          note,
          nextAction,
          date: date || now,
          createdAt: now,
          isAutoTracked,
        };

        set((state) => {
          const existing = state.interactions[targetUserId] || [];
          return {
            interactions: {
              ...state.interactions,
              [targetUserId]: [...existing, interaction],
            },
          };
        });
      },

      getInteractions: (targetUserId) => {
        const interactions = get().interactions[targetUserId] || [];
        return [...interactions].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      },

      getLastInteractionDate: (targetUserId) => {
        const interactions = get().interactions[targetUserId];
        if (!interactions || interactions.length === 0) return null;
        const sorted = [...interactions].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        return new Date(sorted[0].date);
      },

      getDaysSinceLastContact: (targetUserId) => {
        const lastDate = get().getLastInteractionDate(targetUserId);
        if (!lastDate) return 999;
        const now = new Date();
        const diffMs = now.getTime() - lastDate.getTime();
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
      },

      getRelationshipStatus: (targetUserId) => {
        const days = get().getDaysSinceLastContact(targetUserId);
        if (days < 14) return 'active';
        if (days < 30) return 'warm';
        if (days < 60) return 'cold';
        return 'dormant';
      },

      getReminders: (connectionIds) => {
        const state = get();
        const reminders = connectionIds
          .map((id) => {
            const daysSince = state.getDaysSinceLastContact(id);
            const status = state.getRelationshipStatus(id);
            const interactions = state.interactions[id];
            const lastType = interactions && interactions.length > 0
              ? [...interactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.type
              : undefined;
            return { targetUserId: id, daysSince, status, lastType };
          })
          .filter((r) => r.status === 'cold' || r.status === 'dormant')
          .sort((a, b) => b.daysSince - a.daysSince);

        return reminders;
      },

      addQuickCapture: (name, company, memo) => {
        const capture: QuickCapture = {
          id: `qc-${Date.now()}`,
          name,
          company,
          memo,
          createdAt: new Date(),
        };
        set((state) => ({
          quickCaptures: [capture, ...state.quickCaptures],
        }));
      },

      removeQuickCapture: (id) => {
        set((state) => ({
          quickCaptures: state.quickCaptures.filter((qc) => qc.id !== id),
        }));
      },

      initDemoInteractions: (userId, connectionIds) => {
        if (get()._demoInitialized) return;

        const rand = seededRandom(42);
        const now = new Date();
        const newInteractions: Record<string, Interaction[]> = {};

        connectionIds.forEach((connId, index) => {
          const count = Math.floor(rand() * 4) + 1; // 1~4개 기록
          const interactions: Interaction[] = [];

          for (let i = 0; i < count; i++) {
            // 마지막 연락일을 다양하게 분포: 일부 최근, 일부 오래됨
            const isRecent = rand() < 0.3; // 30%는 최근
            const maxDays = isRecent ? 14 : 120;
            const minDays = isRecent ? 1 : 15;
            const daysAgo = Math.floor(rand() * (maxDays - minDays)) + minDays;
            const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

            const type = INTERACTION_TYPES[Math.floor(rand() * INTERACTION_TYPES.length)];
            const notes = DEMO_NOTES[type];
            const note = notes[Math.floor(rand() * notes.length)];

            interactions.push({
              id: `demo-int-${connId}-${i}`,
              userId,
              targetUserId: connId,
              type,
              note,
              date,
              createdAt: date,
              isAutoTracked: rand() < 0.4,
            });
          }

          newInteractions[connId] = interactions;
        });

        set({
          interactions: newInteractions,
          _demoInitialized: true,
        });
      },
    }),
    {
      name: 'nodded-interactions',
    }
  )
);
