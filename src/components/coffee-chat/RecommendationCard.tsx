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
              <h3 className="font-semibold text-white truncate">
                {displayInfo.name}
              </h3>
              <span className="text-xs text-[#2C529C] bg-[#2C529C]/20 px-2 py-0.5 rounded-full">
                {recommendation.connectionPath.length - 1}촌
              </span>
            </div>
            <p className="text-sm text-[#8BA4C4] truncate">
              {[displayInfo.company, displayInfo.position].filter(Boolean).join(' · ') || '정보 비공개'}
            </p>

            {/* Reason */}
            <div className="flex items-center gap-1.5 mt-2 text-xs text-[#86C9F2]">
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
            <div className="mt-3 pt-3 border-t border-[#1E3A5F]">
              <p className="text-xs text-[#4A5E7A] mb-2">연결 경로</p>
              <div className="flex items-center gap-1 text-xs">
                {recommendation.connectionPath.map((userId, i) => (
                  <span key={userId} className="flex items-center">
                    {i === 0 ? (
                      <span className="text-[#86C9F2]">나</span>
                    ) : i === recommendation.connectionPath.length - 1 ? (
                      <span className="text-[#2C529C]">{recommendation.user.name}</span>
                    ) : (
                      <span className="text-[#8BA4C4]">연결</span>
                    )}
                    {i < recommendation.connectionPath.length - 1 && (
                      <ArrowRight size={12} className="mx-1 text-[#4A5E7A]" />
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
            bg-gradient-to-r from-[#86C9F2]/10 to-[#2C529C]/10
            border border-[#1E3A5F] rounded-xl
            text-sm font-medium text-white
            hover:border-[#86C9F2] transition-all
          "
        >
          연결 요청하기
        </button>
      </Card>
    </motion.div>
  );
}
