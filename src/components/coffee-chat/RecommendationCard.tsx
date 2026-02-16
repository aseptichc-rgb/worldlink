'use client';

import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Avatar, Tag, Card } from '@/components/ui';
import { Recommendation } from '@/types';
import { useCoffeeChatStore } from '@/store/coffeeChatStore';
import { useNetworkStore } from '@/store/networkStore';
import { getDisplayInfo } from '@/lib/privacy-utils';

interface RecommendationCardProps {
  recommendation: Recommendation;
  index: number;
}

export default function RecommendationCard({ recommendation, index }: RecommendationCardProps) {
  const { openRequestModal } = useCoffeeChatStore();
  const { setHighlightedKeyword } = useNetworkStore();

  // 추천에서는 아직 1촌이 아니므로 비식별화된 정보 표시
  const displayInfo = getDisplayInfo(recommendation.user, false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card hoverable className="p-4">
        <div className="flex items-start gap-3">
          <Avatar
            src={undefined} // 비식별화를 위해 프로필 이미지 숨김
            name={displayInfo.name}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-[#1A1A2E] truncate">
                {displayInfo.name}
              </h3>
              <span className="text-xs text-[#3B82F6] bg-[#3B82F6]/20 px-2 py-0.5 rounded-full">
                {recommendation.connectionPath.length - 1}촌
              </span>
            </div>
            <p className="text-base text-[#64748B] truncate">
              {[displayInfo.company, displayInfo.position].filter(Boolean).join(' · ') || '정보 비공개'}
            </p>

            {/* Reason */}
            <div className="flex items-center gap-1.5 mt-2 text-sm text-[#2563EB]">
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
            <div className="mt-3 pt-3 border-t border-[#E2E8F0]">
              <p className="text-sm text-[#94A3B8] mb-2">연결 경로</p>
              <div className="flex items-center gap-1 text-sm">
                {recommendation.connectionPath.map((userId, i) => (
                  <span key={userId} className="flex items-center">
                    {i === 0 ? (
                      <span className="text-[#2563EB]">나</span>
                    ) : i === recommendation.connectionPath.length - 1 ? (
                      <span className="text-[#3B82F6]">{recommendation.user.name}</span>
                    ) : (
                      <span className="text-[#64748B]">연결</span>
                    )}
                    {i < recommendation.connectionPath.length - 1 && (
                      <ArrowRight size={12} className="mx-1 text-[#94A3B8]" />
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
            bg-[#EFF6FF]
            border border-[#E2E8F0] rounded-xl
            text-base font-medium text-[#1A1A2E]
            hover:border-[#2563EB] transition-all
          "
        >
          연결 요청하기
        </button>
      </Card>
    </motion.div>
  );
}
