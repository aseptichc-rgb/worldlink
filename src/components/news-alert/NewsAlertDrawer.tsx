'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Newspaper, ExternalLink, Clock, CheckCheck, RefreshCw, Loader2 } from 'lucide-react';
import { useNewsAlertStore } from '@/store/newsAlertStore';
import type { NewsItem } from '@/app/api/news/route';

interface NewsAlertDrawerProps {
  groupName?: string;
}

export default function NewsAlertDrawer({ groupName }: NewsAlertDrawerProps) {
  const {
    news,
    newNewsCount,
    lastCheckedAt,
    isLoading,
    error,
    readNewsIds,
    isDrawerOpen,
    closeDrawer,
    markAsRead,
    markAllAsRead,
  } = useNewsAlertStore();

  const drawerRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        closeDrawer();
      }
    };

    if (isDrawerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDrawerOpen, closeDrawer]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDrawer();
      }
    };

    if (isDrawerOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDrawerOpen, closeDrawer]);

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const handleNewsClick = (newsId: string, link: string) => {
    markAsRead(newsId);
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60"
          />

          {/* Drawer */}
          <motion.div
            ref={drawerRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[#0D1117] border-l border-[#30363D] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 h-16 border-b border-[#30363D] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#58A6FF]/15 flex items-center justify-center">
                  <Newspaper size={20} className="text-[#58A6FF]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#F0F6FC]">뉴스 알림</h2>
                  {groupName && (
                    <p className="text-xs text-[#8B949E]">{groupName}</p>
                  )}
                </div>
              </div>
              <button
                onClick={closeDrawer}
                className="p-2 text-[#8B949E] hover:text-white"
              >
                <X size={22} />
              </button>
            </div>

            {/* Status Bar */}
            <div className="px-5 py-3 border-b border-[#21262D] bg-[#161B22]/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-xs text-[#8B949E]">
                <Clock size={14} />
                {lastCheckedAt ? (
                  <span>마지막 확인: {formatTime(lastCheckedAt)}</span>
                ) : (
                  <span>검색 대기 중</span>
                )}
              </div>
              {newNewsCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1.5 text-xs text-[#58A6FF] font-medium"
                >
                  <CheckCheck size={14} />
                  모두 읽음
                </button>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {isLoading && news.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 size={32} className="animate-spin text-[#58A6FF] mb-4" />
                  <p className="text-sm text-[#8B949E]">뉴스를 검색하고 있습니다...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-20 px-6">
                  <div className="w-16 h-16 rounded-full bg-[#F85149]/15 flex items-center justify-center mb-4">
                    <Newspaper size={28} className="text-[#F85149]" />
                  </div>
                  <p className="text-sm text-[#F85149] text-center mb-2">오류가 발생했습니다</p>
                  <p className="text-xs text-[#8B949E] text-center">{error}</p>
                </div>
              ) : news.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-6">
                  <div className="w-16 h-16 rounded-full bg-[#30363D]/50 flex items-center justify-center mb-4">
                    <Newspaper size={28} className="text-[#8B949E]" />
                  </div>
                  <p className="text-sm text-[#8B949E] text-center">
                    아직 관련 뉴스가 없습니다
                  </p>
                  <p className="text-xs text-[#484F58] text-center mt-1">
                    1시간마다 자동으로 검색됩니다
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#21262D]">
                  {news.map((item) => {
                    const isRead = readNewsIds.has(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNewsClick(item.id, item.link)}
                        className={`w-full text-left px-5 py-4 transition-colors hover:bg-[#161B22] ${
                          isRead ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {!isRead && (
                            <div className="w-2 h-2 rounded-full bg-[#58A6FF] mt-2 shrink-0" />
                          )}
                          <div className={`flex-1 min-w-0 ${isRead ? 'ml-5' : ''}`}>
                            <h3 className="text-sm font-medium text-[#F0F6FC] line-clamp-2 mb-1">
                              {item.title}
                            </h3>
                            <p className="text-xs text-[#8B949E] line-clamp-2 mb-2">
                              {item.description}
                            </p>
                            <div className="flex items-center flex-wrap gap-1.5 text-[10px] text-[#484F58]">
                              {item.memberName && (
                                <span className="px-1.5 py-0.5 bg-[#1C2D3F] border border-[#58A6FF]/40 rounded text-[#58A6FF] font-medium">
                                  {item.memberName}
                                  {item.memberCompany && ` (${item.memberCompany})`}
                                </span>
                              )}
                              {(item as NewsItem & { source?: string }).source && (
                                <span className="text-[#8B949E]">
                                  {(item as NewsItem & { source?: string }).source}
                                </span>
                              )}
                              <span>{formatTime(item.pubDate)}</span>
                            </div>
                          </div>
                          <ExternalLink size={14} className="text-[#484F58] shrink-0 mt-1" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer - Loading indicator */}
            {isLoading && news.length > 0 && (
              <div className="px-5 py-3 border-t border-[#21262D] bg-[#161B22]/50 flex items-center justify-center gap-2 shrink-0">
                <RefreshCw size={14} className="animate-spin text-[#58A6FF]" />
                <span className="text-xs text-[#8B949E]">업데이트 중...</span>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
