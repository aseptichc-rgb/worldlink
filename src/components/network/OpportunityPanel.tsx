'use client';

import { useMemo } from 'react';
import { Sparkles, TrendingUp, ArrowRight } from 'lucide-react';
import { CATEGORY_COLORS, getCategoryCounts, inferCategory, type CategoryName } from '@/lib/category-utils';
import { calculateNetworkExpansion } from '@/lib/insights-utils';
import { useNetworkStore } from '@/store/networkStore';
import { User } from '@/types';

interface OpportunityPanelProps {
  theirConnections: User[];
  myConnectionIds: Set<string>;
  personName: string;
  onRequestIntro?: (category: string) => void;
}

export default function OpportunityPanel({
  theirConnections,
  myConnectionIds,
  personName,
  onRequestIntro,
}: OpportunityPanelProps) {
  const { nodes } = useNetworkStore();

  const expansion = useMemo(() => {
    const myCategoryCounts = getCategoryCounts(nodes);

    // 상대방의 "내가 모르는" 인맥 카테고리 분포
    const theirNewUsers = theirConnections.filter(u => !myConnectionIds.has(u.id));
    const theirNewCounts: Record<string, number> = {};
    theirNewUsers.forEach(u => {
      const cat = inferCategory(u);
      theirNewCounts[cat] = (theirNewCounts[cat] || 0) + 1;
    });

    return calculateNetworkExpansion(myCategoryCounts, theirNewCounts);
  }, [nodes, theirConnections, myConnectionIds]);

  if (expansion.totalNewReach === 0) return null;

  const topGaps = expansion.gaps.slice(0, 4);

  return (
    <section className="mt-1">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[#8B949E] uppercase tracking-wider mb-2">
        <Sparkles size={12} className="text-[#58A6FF]" />
        네트워크 확장 기회
      </h3>

      <div className="info-card space-y-3">
        {/* 요약 */}
        <div className="flex items-center gap-2 bg-[#58A6FF]/5 rounded-lg p-2.5 border border-[#58A6FF]/10">
          <TrendingUp size={14} className="text-[#58A6FF] flex-shrink-0" />
          <p className="text-[11px] text-[#C9D1D9] leading-relaxed">
            {personName}님을 통해{' '}
            <span className="text-[#58A6FF] font-semibold">{expansion.totalNewReach}명</span>의 새 인맥을 만날 수 있어요
            {expansion.diversityIncrease > 0 && (
              <>
                {' '}· 다양성{' '}
                <span className="text-[#3FB950] font-semibold">+{expansion.diversityIncrease}%</span>
              </>
            )}
          </p>
        </div>

        {/* 카테고리별 갭 */}
        <div className="space-y-2">
          {topGaps.map(gap => {
            const color = CATEGORY_COLORS[gap.category] || CATEGORY_COLORS['기타'];
            const isNew = gap.myCount === 0;

            return (
              <button
                key={gap.category}
                onClick={() => onRequestIntro?.(gap.category)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#1E1E1E] transition-colors group"
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#C9D1D9]">{gap.category}</span>
                    {isNew && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#58A6FF]/10 text-[#58A6FF] font-medium">
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[#484F58]">
                    <span>내 인맥 {gap.myCount}명</span>
                    <ArrowRight size={8} />
                    <span className="text-[#58A6FF]">+{gap.theirNewCount}명 확장 가능</span>
                  </div>
                </div>

                {/* 미니 바 */}
                <div className="w-12 h-1.5 bg-[#0D1117] rounded-full overflow-hidden flex-shrink-0">
                  <div
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: color,
                      width: `${Math.min(100, (gap.theirNewCount / Math.max(expansion.totalNewReach, 1)) * 100)}%`,
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {expansion.gaps.length > 4 && (
          <p className="text-[10px] text-[#484F58] text-center pt-1 border-t border-[#363636]/50">
            +{expansion.gaps.length - 4}개 분야 더
          </p>
        )}
      </div>
    </section>
  );
}
