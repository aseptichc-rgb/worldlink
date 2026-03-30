'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, Bell, BellOff, Loader2 } from 'lucide-react';
import { useNewsAlertStore } from '@/store/newsAlertStore';
import { ManagedGroupMember, User } from '@/types';

interface NewsAlertButtonProps {
  groupId: string;
  groupName: string;
  members: (ManagedGroupMember & { user?: User })[];
  variant?: 'icon' | 'full';
}

export default function NewsAlertButton({
  groupId,
  groupName,
  members,
  variant = 'icon',
}: NewsAlertButtonProps) {
  const {
    news,
    newNewsCount,
    isMonitoring,
    isLoading,
    monitoringGroupId,
    searchNews,
    startMonitoring,
    stopMonitoring,
    openDrawer,
  } = useNewsAlertStore();

  const hasAutoSearched = useRef(false);

  // 멤버 정보를 검색용 형식으로 변환
  const memberSearchData = members
    .filter(m => m.user?.name)
    .map(m => ({
      name: m.user!.name,
      company: m.user?.company,
    }));

  // 페이지 진입 시 자동 뉴스 검색 (24시간 이내)
  useEffect(() => {
    if (memberSearchData.length > 0 && !hasAutoSearched.current && news.length === 0 && !isLoading) {
      hasAutoSearched.current = true;
      searchNews(memberSearchData, '1d');
    }
  }, [memberSearchData.length]);

  // 이 그룹이 모니터링 중인지 확인
  const isThisGroupMonitoring = isMonitoring && monitoringGroupId === groupId;

  const handleToggleMonitoring = () => {
    if (isThisGroupMonitoring) {
      stopMonitoring();
    } else {
      startMonitoring(groupId, memberSearchData);
    }
  };

  // 컴포넌트 언마운트 시 모니터링 유지 (다른 페이지 이동해도 계속)
  // 하지만 다른 그룹 모니터링 시작하면 기존 것은 중지됨

  if (variant === 'icon') {
    return (
      <motion.button
        onClick={openDrawer}
        whileTap={{ scale: 0.92 }}
        className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#58A6FF]/15 border border-[#58A6FF]/30 text-[#58A6FF] hover:bg-[#58A6FF]/25 hover:border-[#58A6FF]/60 transition-all"
        title="멤버 뉴스 알림"
      >
        <Newspaper size={15} strokeWidth={2} />
        <span className="text-xs font-semibold">새소식</span>
        {newNewsCount > 0 ? (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-[#F85149] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg shadow-[#F85149]/40"
          >
            {newNewsCount > 9 ? '9+' : newNewsCount}
          </motion.span>
        ) : (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#3FB950] rounded-full border border-[#0D1117]" />
        )}
      </motion.button>
    );
  }

  return (
    <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#58A6FF]/15 flex items-center justify-center">
            <Newspaper size={20} className="text-[#58A6FF]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#F0F6FC]">뉴스 모니터링</h3>
            <p className="text-xs text-[#8B949E]">
              멤버 관련 뉴스를 1시간마다 자동 검색
            </p>
          </div>
        </div>
        {newNewsCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="px-2.5 py-1 bg-[#F85149] text-white text-xs font-bold rounded-full"
          >
            {newNewsCount}
          </motion.div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleToggleMonitoring}
          disabled={isLoading}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            isThisGroupMonitoring
              ? 'bg-[#F85149]/15 text-[#F85149] border border-[#F85149]/30'
              : 'bg-[#238636] text-white'
          }`}
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : isThisGroupMonitoring ? (
            <>
              <BellOff size={16} />
              모니터링 중지
            </>
          ) : (
            <>
              <Bell size={16} />
              모니터링 시작
            </>
          )}
        </button>

        <button
          onClick={openDrawer}
          className="px-4 py-2.5 bg-[#21262D] text-[#F0F6FC] rounded-xl text-sm font-medium hover:bg-[#30363D] transition-colors"
        >
          뉴스 보기
        </button>
      </div>

      {isThisGroupMonitoring && (
        <p className="text-[10px] text-[#3FB950] mt-3 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-[#3FB950] rounded-full animate-pulse" />
          뉴스 모니터링이 활성화되어 있습니다
        </p>
      )}
    </div>
  );
}
