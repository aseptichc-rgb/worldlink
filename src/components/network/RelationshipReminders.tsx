'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { useInteractionStore } from '@/store/interactionStore';
import { useNetworkStore } from '@/store/networkStore';
import { RelationshipStatus } from '@/types';
import { demoUsers } from '@/lib/demo-data';

const STATUS_CONFIG: Record<RelationshipStatus, { color: string; label: string }> = {
  active: { color: '#3FB950', label: '활발' },
  warm: { color: '#D29922', label: '보통' },
  cold: { color: '#FF6B8A', label: '소원' },
  dormant: { color: '#F85149', label: '위험' },
};

export default function RelationshipReminders() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { nodes, setSelectedNode } = useNetworkStore();
  const { getReminders } = useInteractionStore();

  const connectionIds = nodes.filter(n => n.degree === 1).map(n => n.id);
  const reminders = getReminders(connectionIds);

  if (reminders.length === 0) return null;

  const handlePersonClick = (targetUserId: string) => {
    const node = nodes.find(n => n.id === targetUserId);
    if (node) {
      setSelectedNode(node);
    }
  };

  const getName = (userId: string) => {
    const node = nodes.find(n => n.id === userId);
    if (node) return node.name;
    const demo = demoUsers.find(u => u.id === userId);
    return demo?.name || '알 수 없음';
  };

  const getProfileImage = (userId: string) => {
    const node = nodes.find(n => n.id === userId);
    if (node) return node.profileImage;
    const demo = demoUsers.find(u => u.id === userId);
    return demo?.profileImage;
  };

  return (
    <div className="w-full max-w-[240px]">
      {/* 접힌 상태: 요약 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full glass-light rounded-xl px-3 py-2.5 flex items-center gap-2 hover:bg-[#1C2333]/80 transition-colors"
      >
        <div className="relative">
          <Bell size={16} className="text-[#FF6B8A]" />
          <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] bg-[#FF6B8A] text-white text-[8px] font-bold rounded-full flex items-center justify-center px-0.5">
            {reminders.length}
          </span>
        </div>
        <span className="text-xs text-[#8B949E] flex-1 text-left">
          연락이 필요한 인맥 <span className="text-[#FF6B8A] font-semibold">{reminders.length}명</span>
        </span>
        {isExpanded ? (
          <ChevronDown size={14} className="text-[#484F58]" />
        ) : (
          <ChevronUp size={14} className="text-[#484F58]" />
        )}
      </button>

      {/* 펼친 상태: 리스트 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 glass-light rounded-xl p-2 space-y-1 max-h-[240px] overflow-y-auto">
              {reminders.slice(0, 8).map((reminder) => {
                const config = STATUS_CONFIG[reminder.status];
                return (
                  <button
                    key={reminder.targetUserId}
                    onClick={() => handlePersonClick(reminder.targetUserId)}
                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[#252525] transition-colors"
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar
                        src={getProfileImage(reminder.targetUserId)}
                        name={getName(reminder.targetUserId)}
                        size="xs"
                      />
                      <div
                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#161B22]"
                        style={{ backgroundColor: config.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs text-white truncate font-medium">
                        {getName(reminder.targetUserId)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Clock size={10} className="text-[#484F58]" />
                      <span
                        className="text-[10px] font-medium"
                        style={{ color: config.color }}
                      >
                        {reminder.daysSince}일
                      </span>
                    </div>
                  </button>
                );
              })}
              {reminders.length > 8 && (
                <p className="text-[10px] text-[#484F58] text-center py-1">
                  +{reminders.length - 8}명 더
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
