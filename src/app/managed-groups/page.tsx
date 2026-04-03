'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Users, Loader2, AlertTriangle, Newspaper, ExternalLink, ChevronDown, ChevronUp, Bell, BellOff, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useManagedGroupStore } from '@/store/managedGroupStore';
import { useNewsAlertStore } from '@/store/newsAlertStore';
import { ManagedGroup } from '@/types';
import ManagedGroupCard from '@/components/managed-group/ManagedGroupCard';
import ManagedGroupCreateModal from '@/components/managed-group/ManagedGroupCreateModal';
import BottomNav from '@/components/ui/BottomNav';
import { demoUsers } from '@/lib/demo-data';
import { getUser } from '@/lib/firebase-services';
import type { NewsItem } from '@/app/api/news/route';

export default function ManagedGroupsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { groups, isLoading, fetchMyGroups, openCreateModal, deleteGroup, leaveGroup } = useManagedGroupStore();
  const { searchNewsForAllGroups, groupNewsMap, groupNewsItems, allGroupNews, latestNewsIds, isLoading: newsLoading, lastCheckedAt, readNewsIds, markAsRead } = useNewsAlertStore();
  const [confirmTarget, setConfirmTarget] = useState<ManagedGroup | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushRequesting, setPushRequesting] = useState(false);

  // 푸시 알림 상태 확인
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const hasFcmToken = !!localStorage.getItem('nodded_fcm_user_id');
      setPushEnabled(Notification.permission === 'granted' && hasFcmToken);
    }
  }, []);

  const handleTogglePush = async () => {
    if (!user?.id) return;
    if (pushEnabled) return; // 이미 활성화된 경우 브라우저 설정에서 변경해야 함

    setPushRequesting(true);
    try {
      const { requestNotificationPermission } = await import('@/lib/fcm');
      const token = await requestNotificationPermission(user.id);
      setPushEnabled(!!token);
    } catch (err) {
      console.error('푸시 알림 설정 실패:', err);
    } finally {
      setPushRequesting(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/onboarding');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user?.id) {
      fetchMyGroups(user.id);
    }
  }, [user?.id, fetchMyGroups]);

  const buildGroupInfos = async () => {
    const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('nodded_demo_mode') === 'true';
    return Promise.all(
      groups.map(async (group) => {
        const memberResults = await Promise.all(
          group.members.map(async (member) => {
            if (isDemoMode) {
              const demoUser = demoUsers.find(u => u.id === member.userId);
              return demoUser ? { name: demoUser.name, company: demoUser.company } : null;
            }
            try {
              const userData = await getUser(member.userId);
              return userData ? { name: userData.name, company: userData.company } : null;
            } catch {
              return null;
            }
          })
        );
        const members = memberResults.filter((m): m is NonNullable<typeof m> => m !== null);

        if (members.length === 0 && group.name) {
          members.push({ name: group.name, company: undefined });
        }

        return { id: group.id, members };
      })
    );
  };

  const runSearch = async (timeRange: string) => {
    const groupInfos = await buildGroupInfos();
    searchNewsForAllGroups(groupInfos, timeRange);
  };

  // 뉴스 수동 새로고침 핸들러
  const handleNewsRefresh = () => {
    runSearch('1d');
  };

  // 모든 그룹의 뉴스 검색: 캐시가 1시간 이상 지난 경우에만 자동 검색
  useEffect(() => {
    if (groups.length === 0) return;

    const INITIAL_SEARCH_KEY = 'nodded_news_initial_search_done';
    const ONE_HOUR = 60 * 60 * 1000;

    const isInitialSearch = !localStorage.getItem(INITIAL_SEARCH_KEY);

    if (isInitialSearch) {
      // 첫 로그인: 최근 6개월 뉴스 검색
      runSearch('6m').then(() => {
        localStorage.setItem(INITIAL_SEARCH_KEY, new Date().toISOString());
      });
    } else {
      // 이미 캐시된 결과가 있고 1시간 이내면 검색 생략
      const elapsed = lastCheckedAt ? Date.now() - new Date(lastCheckedAt).getTime() : Infinity;
      if (elapsed >= ONE_HOUR) {
        runSearch('1d');
      }
    }

    // 1시간마다 자동 반복
    const intervalId = window.setInterval(() => runSearch('1d'), ONE_HOUR);

    return () => clearInterval(intervalId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);

  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleNewsClick = (newsId: string) => {
    markAsRead(newsId);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const handleRemove = async () => {
    if (!confirmTarget || !user?.id) return;
    setIsRemoving(true);
    try {
      const isOwner = confirmTarget.ownerId === user.id;
      if (isOwner) {
        await deleteGroup(confirmTarget.id);
      } else {
        await leaveGroup(confirmTarget.id, user.id);
      }
    } finally {
      setIsRemoving(false);
      setConfirmTarget(null);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#58A6FF]" />
      </div>
    );
  }

  const isOwnerOfTarget = confirmTarget?.ownerId === user?.id;
  const totalNewsCount = allGroupNews.length;

  return (
    <div className="min-h-screen bg-[#0D1117] pb-24">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-[#0D1117]/80 backdrop-blur-xl border-b border-[rgba(240,246,252,0.05)]">
        <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 text-[#8B949E] hover:text-white"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-base font-bold text-[#F0F6FC]">나의 모임</h1>
          <button
            onClick={openCreateModal}
            className="flex-shrink-0 flex items-center gap-1.5 px-6 py-2 bg-[#58A6FF] text-[#0D1117] text-sm font-bold rounded-lg whitespace-nowrap"
          >
            <Plus size={16} />
            &nbsp;&nbsp;만들기&nbsp;&nbsp;
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {/* 24시간 뉴스 요약 헤더 */}
        {!isLoading && groups.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-[#161B22] border border-[#30363D] rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#58A6FF]/15 flex items-center justify-center">
                <Newspaper size={20} className="text-[#58A6FF]" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[#F0F6FC]">24시간 멤버 뉴스</h3>
                <p className="text-xs text-[#8B949E]">
                  {newsLoading ? (
                    '검색 중...'
                  ) : totalNewsCount > 0 ? (
                    `${totalNewsCount}건의 뉴스가 발견되었습니다`
                  ) : (
                    '최근 24시간 내 관련 뉴스가 없습니다'
                  )}
                </p>
              </div>
              {newsLoading ? (
                <Loader2 size={18} className="animate-spin text-[#58A6FF]" />
              ) : (
                <button
                  onClick={handleNewsRefresh}
                  className="p-1.5 text-[#484F58] hover:text-[#58A6FF] transition-colors rounded-lg hover:bg-[#21262D]"
                  title="뉴스 새로고침"
                >
                  <RefreshCw size={15} />
                </button>
              )}
            </div>

            {/* 푸시 알림 토글 */}
            <button
              onClick={handleTogglePush}
              disabled={pushRequesting || pushEnabled}
              className={`mt-3 ml-[52px] flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                pushEnabled
                  ? 'bg-[#238636]/20 text-[#3FB950] cursor-default'
                  : 'bg-[#21262D] text-[#8B949E] hover:bg-[#30363D] hover:text-[#F0F6FC]'
              }`}
            >
              {pushRequesting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : pushEnabled ? (
                <Bell size={14} />
              ) : (
                <BellOff size={14} />
              )}
              {pushEnabled ? '스마트폰 알림 켜짐' : '스마트폰 알림 받기'}
            </button>

            {lastCheckedAt && (
              <p className="text-[10px] text-[#484F58] mt-2 pl-[52px]">
                마지막 검색: {formatTime(lastCheckedAt)}
              </p>
            )}
          </motion.div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-[#58A6FF]" />
          </div>
        ) : groups.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-[rgba(88,166,255,0.15)] to-[rgba(31,111,235,0.15)] flex items-center justify-center">
              <Users size={36} className="text-[#58A6FF]" />
            </div>
            <h2 className="text-xl font-bold text-[#F0F6FC] mb-3">
              첫 나의 모임을 만들어보세요
            </h2>
            <p className="text-sm text-[#8B949E] mb-6 leading-relaxed">
              그룹을 만들고 멤버를 초대하면<br />
              멤버들이 자동으로 서로 인맥이 됩니다
            </p>
            <button
              onClick={openCreateModal}
              className="inline-block px-10 py-3 bg-[#58A6FF] text-[#0D1117] font-bold rounded-xl text-sm whitespace-nowrap"
            >
              &nbsp;&nbsp;그룹 만들기&nbsp;&nbsp;
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {groups.map((group, index) => {
              const newsItems = groupNewsItems[group.id] || [];
              const newsCount = groupNewsMap[group.id] || 0;
              const isExpanded = expandedGroups.has(group.id);
              const previewCount = 3;

              return (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ManagedGroupCard
                    group={group}
                    currentUserId={user!.id}
                    newsCount={newsCount}
                    onClick={() => router.push(`/managed-groups/${group.id}`)}
                    onRemove={() => setConfirmTarget(group)}
                  />

                  {/* 그룹별 뉴스 인라인 표시 */}
                  {newsItems.length > 0 && (() => {
                    const newItems = newsItems.filter(n => latestNewsIds.has(n.id));
                    const oldItems = newsItems.filter(n => !latestNewsIds.has(n.id));
                    const oldVisible = isExpanded ? oldItems : oldItems.slice(0, previewCount);

                    const renderNewsItem = (item: typeof newsItems[0], i: number, isFirst: boolean) => {
                      const isRead = readNewsIds.has(item.id);
                      return (
                        <a
                          key={item.id}
                          href={item.link && item.link !== '#' ? item.link : undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleNewsClick(item.id)}
                          className={`block w-full text-left px-4 py-3 transition-colors flex items-start gap-2.5 ${
                            !isFirst ? 'border-t border-[#21262D]' : ''
                          } ${isRead ? 'hover:bg-[#161B22]/50' : 'hover:bg-[#161B22]'}`}
                        >
                          {!isRead ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#58A6FF] mt-1.5 shrink-0" />
                          ) : (
                            <span className="w-1.5 h-1.5 mt-1.5 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium line-clamp-1 ${isRead ? 'text-[#484F58]' : 'text-[#F0F6FC]'}`}>
                              {item.title}
                            </p>
                            <div className={`flex items-center gap-1.5 mt-1 text-[10px] ${isRead ? 'text-[#30363D]' : 'text-[#484F58]'}`}>
                              {item.memberName && (
                                <span className={`px-1.5 py-0.5 rounded ${isRead ? 'bg-[#161B22] text-[#484F58]' : 'bg-[#21262D] text-[#8B949E]'}`}>
                                  {item.memberName}
                                </span>
                              )}
                              {item.source && <span>{item.source}</span>}
                              <span>{formatTime(item.pubDate)}</span>
                            </div>
                          </div>
                          <ExternalLink size={12} className={`shrink-0 mt-1 ${isRead ? 'text-[#30363D]' : 'text-[#484F58]'}`} />
                        </a>
                      );
                    };

                    return (
                      <div className="mt-1 ml-2 mr-2">
                        <div className="bg-[#0D1117] border border-[#21262D] rounded-xl overflow-hidden">
                          {/* 새 뉴스 섹션 */}
                          {newItems.length > 0 && (
                            <>
                              {(oldItems.length > 0 || latestNewsIds.size > 0) && (
                                <div className="px-4 py-1.5 bg-[#58A6FF]/8 border-b border-[#21262D] flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#58A6FF]" />
                                  <span className="text-[10px] font-semibold text-[#58A6FF]">새 뉴스 {newItems.length}건</span>
                                </div>
                              )}
                              {newItems.map((item, i) => renderNewsItem(item, i, i === 0))}
                            </>
                          )}

                          {/* 이전 뉴스 섹션 */}
                          {oldItems.length > 0 && (
                            <>
                              <div className={`px-4 py-1.5 flex items-center gap-1.5 ${newItems.length > 0 ? 'border-t border-[#21262D]' : ''} bg-[#161B22]/50`}>
                                <span className="text-[10px] font-medium text-[#484F58]">이전 뉴스</span>
                              </div>
                              {oldVisible.map((item, i) => renderNewsItem(item, i, i === 0))}
                              {oldItems.length > previewCount && (
                                <button
                                  onClick={() => toggleGroupExpand(group.id)}
                                  className="w-full px-4 py-2 text-center text-[11px] font-medium text-[#484F58] hover:bg-[#161B22] transition-colors border-t border-[#21262D] flex items-center justify-center gap-1"
                                >
                                  {isExpanded ? (
                                    <>접기 <ChevronUp size={12} /></>
                                  ) : (
                                    <>{oldItems.length - previewCount}건 더보기 <ChevronDown size={12} /></>
                                  )}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <AnimatePresence>
        {confirmTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6"
            onClick={() => !isRemoving && setConfirmTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#161B22] border border-[#30363D] rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#DA3633]/15 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-[#DA3633]" />
                </div>
                <h3 className="text-base font-bold text-[#F0F6FC]">
                  {isOwnerOfTarget ? '모임 삭제' : '모임 나가기'}
                </h3>
              </div>
              <p className="text-sm text-[#8B949E] mb-6 leading-relaxed">
                {isOwnerOfTarget
                  ? <>
                      <span className="text-[#F0F6FC] font-semibold">{confirmTarget.name}</span>
                      을(를) 삭제하시겠습니까?<br />
                      모든 멤버와 데이터가 삭제됩니다.
                    </>
                  : <>
                      <span className="text-[#F0F6FC] font-semibold">{confirmTarget.name}</span>
                      에서 나가시겠습니까?
                    </>
                }
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmTarget(null)}
                  disabled={isRemoving}
                  className="flex-1 py-2.5 text-sm font-semibold text-[#8B949E] bg-[#21262D] rounded-xl hover:bg-[#30363D] transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleRemove}
                  disabled={isRemoving}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#DA3633] rounded-xl hover:bg-[#DA3633]/80 transition-colors flex items-center justify-center gap-2"
                >
                  {isRemoving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    isOwnerOfTarget ? '삭제' : '나가기'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ManagedGroupCreateModal />
      <BottomNav />
    </div>
  );
}
