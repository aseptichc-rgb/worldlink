'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, Grid3X3, Sparkles } from 'lucide-react';
import { useNetworkStore } from '@/store/networkStore';
import { CATEGORIES, CATEGORY_COLORS, getCategoryCounts, inferCategory, type CategoryName } from '@/lib/category-utils';

interface CategoryDashboardProps {
  onCategorySelect: (category: string) => void;
}

export default function CategoryDashboard({ onCategorySelect }: CategoryDashboardProps) {
  const { nodes } = useNetworkStore();

  const { counts, total, strongest, weakest } = useMemo(() => {
    const c = getCategoryCounts(nodes);
    const total = Object.values(c).reduce((a, b) => a + b, 0);

    // 0이 아닌 카테고리 중 가장 강한/약한 분야
    const nonZero = Object.entries(c).filter(([, v]) => v > 0);
    const strongest = nonZero.sort((a, b) => b[1] - a[1])[0];
    const weakest = nonZero.sort((a, b) => a[1] - b[1])[0];

    return { counts: c, total, strongest, weakest };
  }, [nodes]);

  // 기타를 포함한 표시할 카테고리 (0인 것도 보여줌)
  const allCategories: CategoryName[] = [...CATEGORIES];

  return (
    <div className="fixed inset-0 z-20 bg-[#0D1117] overflow-y-auto pb-28 pt-20">
      <div className="px-5 space-y-5">
        {/* 요약 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#161B22] border border-[#30363D]/50 rounded-2xl p-4 space-y-3"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Users size={16} className="text-[#58A6FF]" />
            내 인맥 분포
          </div>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{total}</div>
              <div className="text-[10px] text-[#484F58]">총 인맥</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-[#3FB950]">
                {Object.values(counts).filter(v => v > 0).length}
              </div>
              <div className="text-[10px] text-[#484F58]">활동 분야</div>
            </div>
            {strongest && (
              <div className="text-center">
                <div className="flex items-center gap-1">
                  <TrendingUp size={12} className="text-[#3FB950]" />
                  <span className="text-xs font-medium" style={{ color: CATEGORY_COLORS[strongest[0]] }}>
                    {strongest[0]}
                  </span>
                </div>
                <div className="text-[10px] text-[#484F58]">가장 강한 분야</div>
              </div>
            )}
          </div>

          {/* 없는 분야 안내 */}
          {(() => {
            const emptyCategories = CATEGORIES.filter(c => !counts[c] || counts[c] === 0);
            if (emptyCategories.length === 0) return null;
            return (
              <div className="flex items-start gap-2 bg-[#58A6FF]/5 rounded-lg p-2.5 border border-[#58A6FF]/10">
                <Sparkles size={12} className="text-[#58A6FF] flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#8B949E] leading-relaxed">
                  <span className="text-[#58A6FF] font-medium">{emptyCategories.length}개 분야</span>에 아직 인맥이 없어요. 네트워크를 확장해보세요!
                </p>
              </div>
            );
          })()}
        </motion.div>

        {/* 카테고리 그리드 */}
        <div className="grid grid-cols-2 gap-3">
          {allCategories.map((cat, idx) => {
            const count = counts[cat] || 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const color = CATEGORY_COLORS[cat];
            const isEmpty = count === 0;

            return (
              <motion.button
                key={cat}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => {
                  if (!isEmpty) onCategorySelect(cat);
                }}
                className={`relative bg-[#161B22] border rounded-xl p-3.5 text-left transition-all duration-200 group ${
                  isEmpty
                    ? 'border-[#30363D]/30 opacity-50'
                    : 'border-[#30363D]/50 hover:border-[#58A6FF]/30 active:scale-[0.98]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: color, opacity: isEmpty ? 0.3 : 1 }}
                    />
                    <span className="text-xs font-medium text-[#C9D1D9] truncate max-w-[80px]">{cat}</span>
                  </div>
                  <span className={`text-lg font-bold ${isEmpty ? 'text-[#484F58]' : 'text-white'}`}>
                    {count}
                  </span>
                </div>

                {/* 비율 바 */}
                <div className="h-1.5 bg-[#0D1117] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(pct, isEmpty ? 0 : 3)}%` }}
                    transition={{ delay: idx * 0.03 + 0.2, duration: 0.5, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                  />
                </div>

                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-[#484F58]">{pct}%</span>
                  {isEmpty && (
                    <span className="text-[10px] text-[#58A6FF]/60">확장 기회</span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
