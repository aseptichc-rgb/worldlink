'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGroupStore } from '@/store/groupStore';
import { Plus, Users } from 'lucide-react';

export default function GroupSidePanel() {
  const {
    groups,
    activeGroupFilter,
    setActiveGroupFilter,
    getNodesInGroup,
    toggleGroupPanel
  } = useGroupStore();

  if (groups.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2"
    >
      {/* 전체 보기 버튼 */}
      <button
        onClick={() => setActiveGroupFilter(null)}
        className={`
          w-12 h-12 rounded-xl flex items-center justify-center
          transition-all duration-200 group relative
          ${activeGroupFilter === null
            ? 'bg-[#58A6FF]/20 border-2 border-[#58A6FF] shadow-lg shadow-[#58A6FF]/20'
            : 'bg-[#161B22]/80 backdrop-blur-xl border border-[#30363D]/50 hover:border-[#484F58] hover:bg-[#1C2333]'
          }
        `}
        title="전체 보기"
      >
        <Users
          size={20}
          className={activeGroupFilter === null ? 'text-[#58A6FF]' : 'text-[#8B949E] group-hover:text-white'}
        />
        {/* 툴팁 */}
        <span className="absolute left-full ml-2 px-2 py-1 bg-[#161B22] border border-[#30363D] rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          전체 보기
        </span>
      </button>

      {/* 구분선 */}
      <div className="w-8 h-px bg-[#30363D] mx-auto" />

      {/* 그룹 버튼들 */}
      <AnimatePresence>
        {groups.map((group, index) => {
          const isActive = activeGroupFilter === group.id;
          const count = getNodesInGroup(group.id).length;

          return (
            <motion.button
              key={group.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setActiveGroupFilter(isActive ? null : group.id)}
              className={`
                w-12 h-12 rounded-xl flex items-center justify-center
                transition-all duration-200 group relative
                ${isActive
                  ? 'shadow-lg scale-105'
                  : 'bg-[#161B22]/80 backdrop-blur-xl border border-[#30363D]/50 hover:border-[#484F58] hover:bg-[#1C2333] hover:scale-105'
                }
              `}
              style={{
                backgroundColor: isActive ? `${group.color}20` : undefined,
                borderColor: isActive ? group.color : undefined,
                borderWidth: isActive ? 2 : undefined,
                boxShadow: isActive ? `0 4px 20px ${group.color}40` : undefined,
              }}
              title={group.name}
            >
              {/* 그룹 아이콘 또는 색상 */}
              <span className="text-lg">{group.icon}</span>

              {/* 멤버 수 배지 */}
              {count > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1"
                  style={{ backgroundColor: group.color }}
                >
                  {count}
                </span>
              )}

              {/* 툴팁 */}
              <span className="absolute left-full ml-2 px-2 py-1 bg-[#161B22] border border-[#30363D] rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  {group.name}
                  {count > 0 && <span className="text-[#8B949E]">({count}명)</span>}
                </span>
              </span>
            </motion.button>
          );
        })}
      </AnimatePresence>

      {/* 그룹 추가 버튼 */}
      <button
        onClick={() => toggleGroupPanel()}
        className="
          w-12 h-12 rounded-xl flex items-center justify-center
          bg-[#161B22]/80 backdrop-blur-xl border border-dashed border-[#30363D]/50
          hover:border-[#58A6FF]/50 hover:bg-[#58A6FF]/10
          transition-all duration-200 group relative
        "
        title="그룹 관리"
      >
        <Plus size={20} className="text-[#484F58] group-hover:text-[#58A6FF]" />
        {/* 툴팁 */}
        <span className="absolute left-full ml-2 px-2 py-1 bg-[#161B22] border border-[#30363D] rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          그룹 관리
        </span>
      </button>
    </motion.div>
  );
}