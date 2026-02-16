'use client';

import { useGroupStore } from '@/store/groupStore';

export default function GroupFilterBar() {
  const { groups, activeGroupFilter, setActiveGroupFilter, getNodesInGroup } = useGroupStore();

  if (groups.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
      {/* 전체 칩 */}
      <button
        onClick={() => setActiveGroupFilter(null)}
        className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
          activeGroupFilter === null
            ? 'bg-[#58A6FF]/20 text-[#58A6FF] border border-[#58A6FF]/40'
            : 'bg-[#1C2333]/80 text-[#8B949E] border border-[#30363D]/50 hover:border-[#484F58]'
        }`}
      >
        전체
      </button>

      {/* 그룹 칩들 */}
      {groups.map((group) => {
        const isActive = activeGroupFilter === group.id;
        const count = getNodesInGroup(group.id).length;
        return (
          <button
            key={group.id}
            onClick={() => setActiveGroupFilter(isActive ? null : group.id)}
            className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-[#58A6FF]/20 text-white border border-[#58A6FF]/40'
                : 'bg-[#1C2333]/80 text-[#8B949E] border border-[#30363D]/50 hover:border-[#484F58]'
            }`}
          >
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: group.color }}
            />
            <span>{group.icon}</span>
            <span>{group.name}</span>
            {count > 0 && (
              <span className="text-[10px] text-[#484F58]">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
