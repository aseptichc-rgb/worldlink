'use client';

import { motion } from 'framer-motion';
import { Users, Crown } from 'lucide-react';
import { ManagedGroup } from '@/types';

interface ManagedGroupCardProps {
  group: ManagedGroup;
  currentUserId: string;
  onClick: () => void;
}

export default function ManagedGroupCard({ group, currentUserId, onClick }: ManagedGroupCardProps) {
  const isOwner = group.ownerId === currentUserId;
  const memberCount = group.members.length;

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className="w-full flex items-center gap-4 p-4 bg-[#161B22] border border-[#30363D] rounded-xl hover:border-[#58A6FF]/50 transition-colors text-left"
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
        style={{ backgroundColor: group.color + '20' }}
      >
        {group.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[#F0F6FC] font-semibold truncate">{group.name}</p>
          {isOwner && (
            <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 bg-[#FFA657]/15 text-[#FFA657] text-xs font-medium rounded-full">
              <Crown size={10} />
              그룹장
            </span>
          )}
          {!isOwner && (
            <span className="shrink-0 px-2 py-0.5 bg-[#58A6FF]/15 text-[#58A6FF] text-xs font-medium rounded-full">
              멤버
            </span>
          )}
        </div>
        {group.description && (
          <p className="text-xs text-[#8B949E] mt-0.5 truncate">{group.description}</p>
        )}
        <div className="flex items-center gap-1.5 mt-1">
          <Users size={12} className="text-[#484F58]" />
          <span className="text-xs text-[#484F58]">{memberCount}명</span>
        </div>
      </div>
    </motion.button>
  );
}
