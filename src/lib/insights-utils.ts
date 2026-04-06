import { Interaction, RelationshipStatus } from '@/types';

export interface RelationshipDistribution {
  active: number;
  warm: number;
  cold: number;
  dormant: number;
  total: number;
}

export interface MonthlyActivity {
  interactionCount: number;
  uniqueContacts: number;
}

export interface NetworkHealthData {
  score: number;
  distribution: RelationshipDistribution;
  monthlyActivity: MonthlyActivity;
  categoryDiversity: Record<string, number>;
  weakening: Array<{ targetUserId: string; daysSince: number; status: RelationshipStatus }>;
}

function getStatusForDays(days: number): RelationshipStatus {
  if (days < 14) return 'active';
  if (days < 30) return 'warm';
  if (days < 60) return 'cold';
  return 'dormant';
}

export function getRelationshipDistribution(
  interactions: Record<string, Interaction[]>,
  connectionIds: string[]
): RelationshipDistribution {
  const now = new Date();
  let active = 0, warm = 0, cold = 0, dormant = 0;

  connectionIds.forEach(id => {
    const records = interactions[id];
    if (!records || records.length === 0) {
      dormant++;
      return;
    }
    const sorted = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastDate = new Date(sorted[0].date);
    const days = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    const status = getStatusForDays(days);
    if (status === 'active') active++;
    else if (status === 'warm') warm++;
    else if (status === 'cold') cold++;
    else dormant++;
  });

  return { active, warm, cold, dormant, total: connectionIds.length };
}

export function getMonthlyActivity(
  interactions: Record<string, Interaction[]>
): MonthlyActivity {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const uniqueContacts = new Set<string>();
  let count = 0;

  Object.entries(interactions).forEach(([targetId, records]) => {
    records.forEach(r => {
      if (new Date(r.date) >= monthStart) {
        count++;
        uniqueContacts.add(targetId);
      }
    });
  });

  return { interactionCount: count, uniqueContacts: uniqueContacts.size };
}

export function getCategoryDiversity(
  nodes: Array<{ id: string; category?: string; degree: number }>
): Record<string, number> {
  const counts: Record<string, number> = {};
  nodes.filter(n => n.degree === 1).forEach(n => {
    const cat = n.category || '기타';
    counts[cat] = (counts[cat] || 0) + 1;
  });
  return counts;
}

export function calculateNetworkHealthScore(
  distribution: RelationshipDistribution,
  monthlyActivity: MonthlyActivity,
  categoryDiversity: Record<string, number>
): number {
  if (distribution.total === 0) return 0;

  // active 비율 (40%)
  const activeRatio = (distribution.active / distribution.total) * 40;

  // warm 비율 (30%)
  const warmRatio = ((distribution.active + distribution.warm) / distribution.total) * 30;

  // 이번 달 활동 (15%) - 최소 5개 기록이면 만점
  const activityScore = Math.min(monthlyActivity.interactionCount / 5, 1) * 15;

  // 카테고리 다양성 (15%) - 3개 이상이면 만점
  const categories = Object.keys(categoryDiversity).length;
  const diversityScore = Math.min(categories / 3, 1) * 15;

  return Math.round(activeRatio + warmRatio + activityScore + diversityScore);
}

export function getWeakeningRelationships(
  interactions: Record<string, Interaction[]>,
  connectionIds: string[]
): Array<{ targetUserId: string; daysSince: number; status: RelationshipStatus }> {
  const now = new Date();
  return connectionIds
    .map(id => {
      const records = interactions[id];
      if (!records || records.length === 0) {
        return { targetUserId: id, daysSince: 999, status: 'dormant' as RelationshipStatus };
      }
      const sorted = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const lastDate = new Date(sorted[0].date);
      const daysSince = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      return { targetUserId: id, daysSince, status: getStatusForDays(daysSince) };
    })
    .filter(r => r.status === 'cold' || r.status === 'dormant')
    .sort((a, b) => b.daysSince - a.daysSince);
}

/** 상대방 네트워크를 통한 확장 기회 계산 */
export function calculateNetworkExpansion(
  myCategoryCounts: Record<string, number>,
  theirNewCategoryCounts: Record<string, number>
): {
  gaps: Array<{ category: string; myCount: number; theirNewCount: number }>;
  totalNewReach: number;
  diversityIncrease: number;
} {
  const myCategories = Object.keys(myCategoryCounts).filter(k => myCategoryCounts[k] > 0).length;
  const totalNew = Object.values(theirNewCategoryCounts).reduce((a, b) => a + b, 0);

  // 내가 약한데 상대방이 강한 분야 찾기
  const gaps = Object.entries(theirNewCategoryCounts)
    .filter(([, count]) => count > 0)
    .map(([category, theirNewCount]) => ({
      category,
      myCount: myCategoryCounts[category] || 0,
      theirNewCount,
    }))
    .sort((a, b) => {
      // 내가 0인 분야 우선, 그 다음 상대방 인맥 수 내림차순
      if (a.myCount === 0 && b.myCount > 0) return -1;
      if (a.myCount > 0 && b.myCount === 0) return 1;
      return b.theirNewCount - a.theirNewCount;
    });

  // 다양성 증가율: 새로 추가되는 카테고리 수 기반
  const newCategories = gaps.filter(g => g.myCount === 0).length;
  const diversityIncrease = myCategories > 0
    ? Math.round((newCategories / myCategories) * 100)
    : newCategories > 0 ? 100 : 0;

  return { gaps, totalNewReach: totalNew, diversityIncrease };
}
