'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeftRight } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { getDemoCompatibleId, getDemoMatches, demoUsers } from '@/lib/demo-data';
import { NetworkNode } from '@/types';

interface SmartMatchCardProps {
  nodes: NetworkNode[];
}

export default function SmartMatchCard({ nodes }: SmartMatchCardProps) {
  const { user } = useAuthStore();

  const matches = useMemo(() => {
    if (!user) return [];
    const demoId = getDemoCompatibleId(user);
    return getDemoMatches(demoId);
  }, [user]);

  const getPersonInfo = (userId: string) => {
    const node = nodes.find(n => n.id === userId);
    if (node) return { name: node.name, company: node.institution, profileImage: node.profileImage };
    const demo = demoUsers.find(u => u.id === userId);
    if (demo) return { name: demo.name, company: demo.institution, profileImage: demo.profileImage };
    return { name: '알 수 없음', company: '', profileImage: undefined };
  };

  if (matches.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-[#161B22] border border-[#A371F7]/20 rounded-2xl p-5"
    >
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[#A371F7] mb-4">
        <Sparkles size={14} />
        소개 추천
        <span className="text-[10px] text-[#484F58] font-normal">AI 기반</span>
      </h3>

      <div className="space-y-3">
        {matches.map((match, index) => {
          const person1 = getPersonInfo(match.person1Id);
          const person2 = getPersonInfo(match.person2Id);

          return (
            <div
              key={index}
              className="bg-[#0D1117] rounded-xl p-4 border border-[#30363D]/50"
            >
              {/* People */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Avatar src={person1.profileImage} name={person1.name} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs text-white font-medium truncate">{person1.name}</p>
                    <p className="text-[10px] text-[#8B949E] truncate">{person1.company}</p>
                  </div>
                </div>

                <div className="mx-3 flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-[#A371F7]/10 flex items-center justify-center">
                    <ArrowLeftRight size={14} className="text-[#A371F7]" />
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                  <div className="min-w-0 text-right">
                    <p className="text-xs text-white font-medium truncate">{person2.name}</p>
                    <p className="text-[10px] text-[#8B949E] truncate">{person2.company}</p>
                  </div>
                  <Avatar src={person2.profileImage} name={person2.name} size="sm" />
                </div>
              </div>

              {/* Reason */}
              <p className="text-xs text-[#8B949E] mb-2">{match.reason}</p>

              {/* Benefit tag */}
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#A371F7]/10 border border-[#A371F7]/20">
                <Sparkles size={10} className="text-[#A371F7]" />
                <span className="text-[10px] text-[#A371F7] font-medium">{match.benefit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
