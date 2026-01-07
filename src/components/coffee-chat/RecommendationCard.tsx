'use client';

import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Avatar, Tag, Card } from '@/components/ui';
import { Recommendation } from '@/types';
import { useCoffeeChatStore } from '@/store/coffeeChatStore';
import { useNetworkStore } from '@/store/networkStore';

interface RecommendationCardProps {
  recommendation: Recommendation;
  index: number;
}

export default function RecommendationCard({ recommendation, index }: RecommendationCardProps) {
  const { openRequestModal } = useCoffeeChatStore();
  const { setHighlightedKeyword } = useNetworkStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card hoverable className="p-4">
        <div className="flex items-start gap-3">
          <Avatar
            src={recommendation.user.profileImage}
            name={recommendation.user.name}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white truncate">
                {recommendation.user.name}
              </h3>
              <span className="text-xs text-[#7C4DFF] bg-[#7C4DFF]/20 px-2 py-0.5 rounded-full">
                {recommendation.connectionPath.length - 1}촌
              </span>
            </div>
            <p className="text-sm text-[#8B949E] truncate">
              {recommendation.user.company} · {recommendation.user.position}
            </p>

            {/* Reason */}
            <div className="flex items-center gap-1.5 mt-2 text-xs text-[#00E5FF]">
              <Sparkles size={12} />
              <span>{recommendation.reason}</span>
            </div>

            {/* Keywords */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {recommendation.user.keywords.slice(0, 3).map((keyword) => (
                <Tag
                  key={keyword}
                  label={keyword}
                  size="sm"
                  onClick={() => setHighlightedKeyword(keyword)}
                />
              ))}
            </div>

            {/* Connection Path */}
            <div className="mt-3 pt-3 border-t border-[#21262D]">
              <p className="text-xs text-[#484F58] mb-2">연결 경로</p>
              <div className="flex items-center gap-1 text-xs">
                {recommendation.connectionPath.map((userId, i) => (
                  <span key={userId} className="flex items-center">
                    {i === 0 ? (
                      <span className="text-[#00E5FF]">나</span>
                    ) : i === recommendation.connectionPath.length - 1 ? (
                      <span className="text-[#7C4DFF]">{recommendation.user.name}</span>
                    ) : (
                      <span className="text-[#8B949E]">연결</span>
                    )}
                    {i < recommendation.connectionPath.length - 1 && (
                      <ArrowRight size={12} className="mx-1 text-[#484F58]" />
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action */}
        <button
          onClick={() => openRequestModal(recommendation.userId)}
          className="
            w-full mt-4 py-2.5
            bg-gradient-to-r from-[#00E5FF]/10 to-[#7C4DFF]/10
            border border-[#21262D] rounded-xl
            text-sm font-medium text-white
            hover:border-[#00E5FF] transition-all
          "
        >
          연결 요청하기
        </button>
      </Card>
    </motion.div>
  );
}
