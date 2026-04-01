import { create } from 'zustand';
import { NewsItem } from '@/app/api/news/route';

const STORAGE_KEY = 'nodded_news_alert';
const CHECK_INTERVAL = 60 * 60 * 1000; // 1시간
const CACHE_MAX_ITEMS = 1000; // 캐시할 최대 뉴스 수 (6개월 대응)

// 데모 모드 체크
function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('nodded_demo_mode') === 'true';
}

// FCM 푸시 알림 전송
async function sendPushNotification(title: string, body: string, newsCount: number) {
  if (typeof window === 'undefined') return;

  // FCM 토큰이 등록된 유저만 푸시 전송
  const fcmUserId = localStorage.getItem('nodded_fcm_user_id');
  if (!fcmUserId) return;

  try {
    await fetch('/api/push-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: fcmUserId, title, body, newsCount, url: '/managed-groups' }),
    });
  } catch (err) {
    console.error('푸시 알림 전송 실패:', err);
  }
}

// 데모 뉴스 데이터 생성
function generateDemoNews(members: { name: string; company?: string }[]): NewsItem[] {
  const newsTemplates = [
    {
      titleTemplate: '{company}, 신규 투자 유치 성공... {name} 대표 "시장 확대 계획"',
      descTemplate: '{company}가 시리즈 B 투자 유치에 성공했다. {name} 대표는 "글로벌 시장 진출을 본격화할 것"이라고 밝혔다.',
    },
    {
      titleTemplate: '{name} {company} 대표, CES 2025 기조연설자로 선정',
      descTemplate: '{company}의 {name} 대표가 세계 최대 IT 전시회 CES 2025의 기조연설자로 선정됐다.',
    },
    {
      titleTemplate: '{company}, AI 기반 신제품 출시 예고... 업계 주목',
      descTemplate: '{name} 대표가 이끄는 {company}가 혁신적인 AI 기반 신제품 출시를 예고하며 업계의 이목을 집중시키고 있다.',
    },
    {
      titleTemplate: '"{name} 리더십의 비결은?" {company} 성장 스토리 화제',
      descTemplate: '{company}의 빠른 성장 배경에 {name} 대표의 독특한 리더십이 있다는 분석이 나왔다.',
    },
    {
      titleTemplate: '{company}, 대기업과 전략적 파트너십 체결',
      descTemplate: '{name} 대표의 {company}가 국내 대기업과 전략적 파트너십을 체결하며 사업 영역을 확장한다.',
    },
    {
      titleTemplate: '[인터뷰] {name} {company} 대표 "혁신은 고객 관점에서 시작"',
      descTemplate: '{company}를 이끄는 {name} 대표와의 특별 인터뷰. 그가 말하는 혁신과 성장의 비결을 들어봤다.',
    },
    {
      titleTemplate: '{company}, 올해의 스타트업 어워드 수상',
      descTemplate: '{name} 대표가 이끄는 {company}가 2024 올해의 스타트업 어워드를 수상했다.',
    },
    {
      titleTemplate: '{name} 대표 "{company}, 내년 IPO 추진 검토 중"',
      descTemplate: '{company}의 {name} 대표가 내년 기업공개(IPO)를 검토 중이라고 밝혀 화제다.',
    },
  ];

  const sources = ['매일경제', '한국경제', '조선비즈', '서울경제', '이데일리', 'ZDNet Korea', '디지털타임스', '전자신문'];

  const news: NewsItem[] = [];
  const now = Date.now();

  members.slice(0, 8).forEach((member, memberIdx) => {
    const numNews = Math.min(2, Math.floor(Math.random() * 2) + 1);

    for (let i = 0; i < numNews; i++) {
      const templateIdx = (memberIdx * 2 + i) % newsTemplates.length;
      const template = newsTemplates[templateIdx];
      const company = member.company || '회사';

      const title = template.titleTemplate
        .replace(/{name}/g, member.name)
        .replace(/{company}/g, company);

      const description = template.descTemplate
        .replace(/{name}/g, member.name)
        .replace(/{company}/g, company);

      // 최근 24시간 내 랜덤 시간
      const randomHours = Math.floor(Math.random() * 24);
      const pubDate = new Date(now - randomHours * 60 * 60 * 1000);

      news.push({
        id: `demo-news-${memberIdx}-${i}`,
        title,
        description,
        link: '#',
        pubDate: pubDate.toISOString(),
        searchQuery: member.company ? `${member.name} ${member.company}` : member.name,
        memberName: member.name,
        memberCompany: member.company,
        source: sources[Math.floor(Math.random() * sources.length)],
      });
    }
  });

  return news.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
}

interface GroupInfo {
  id: string;
  members: { name: string; company?: string }[];
}

interface NewsAlertState {
  // Data
  news: NewsItem[];
  newNewsCount: number;
  lastCheckedAt: string | null;
  isMonitoring: boolean;
  isLoading: boolean;
  error: string | null;
  readNewsIds: Set<string>;

  // Multi-group news tracking
  groupNewsMap: Record<string, number>; // groupId -> unread news count
  groupNewsItems: Record<string, NewsItem[]>; // groupId -> news items (최신 + 이전 합산)
  allGroupNews: NewsItem[]; // 전체 그룹 뉴스 (최신 + 이전 합산)
  latestNewsIds: Set<string>; // 가장 최근 검색에서 가져온 뉴스 ID
  totalGroupUnread: number;

  // Monitoring state
  monitoringGroupId: string | null;
  intervalId: number | null;

  // UI State
  isDrawerOpen: boolean;

  // Actions
  searchNews: (members: { name: string; company?: string }[], timeRange?: string) => Promise<void>;
  searchNewsForAllGroups: (groups: GroupInfo[], timeRange?: string) => Promise<void>;
  loadCachedNewsForGroup: (groupId: string) => void;
  startMonitoring: (groupId: string, members: { name: string; company?: string }[]) => void;
  stopMonitoring: () => void;
  markAsRead: (newsId: string) => void;
  markAllAsRead: () => void;
  getGroupUnreadCount: (groupId: string) => number;
  getGroupNews: (groupId: string) => NewsItem[];
  openDrawer: () => void;
  closeDrawer: () => void;
  clearError: () => void;
  reset: () => void;
}

// LocalStorage에서 읽은 뉴스 ID 로드
function loadReadNewsIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_read`);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

// LocalStorage에 읽은 뉴스 ID 저장
function saveReadNewsIds(ids: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    const arr = Array.from(ids).slice(-2000);
    localStorage.setItem(`${STORAGE_KEY}_read`, JSON.stringify(arr));
  } catch {
    // ignore
  }
}

// LocalStorage에서 마지막 검색 시간 로드
function loadLastCheckedAt(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(`${STORAGE_KEY}_lastChecked`);
  } catch {
    return null;
  }
}

// LocalStorage에 마지막 검색 시간 저장
function saveLastCheckedAt(time: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY}_lastChecked`, time);
  } catch {
    // ignore
  }
}

// LocalStorage에서 그룹 뉴스 캐시 로드
function loadCachedGroupNews(): {
  groupNewsMap: Record<string, number>;
  groupNewsItems: Record<string, NewsItem[]>;
  allGroupNews: NewsItem[];
  latestNewsIds: string[];
} {
  const empty = { groupNewsMap: {}, groupNewsItems: {}, allGroupNews: [], latestNewsIds: [] };
  if (typeof window === 'undefined') return empty;
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_groupNews`);
    if (!stored) return empty;
    return { ...empty, ...JSON.parse(stored) };
  } catch {
    return empty;
  }
}

// LocalStorage에 그룹 뉴스 캐시 저장
function saveCachedGroupNews(
  groupNewsMap: Record<string, number>,
  groupNewsItems: Record<string, NewsItem[]>,
  allGroupNews: NewsItem[],
  latestNewsIds: string[],
) {
  if (typeof window === 'undefined') return;
  try {
    const truncatedAllGroupNews = allGroupNews.slice(0, CACHE_MAX_ITEMS);
    const truncatedGroupNewsItems: Record<string, NewsItem[]> = {};
    for (const [gid, items] of Object.entries(groupNewsItems)) {
      truncatedGroupNewsItems[gid] = items.slice(0, 500);
    }
    localStorage.setItem(
      `${STORAGE_KEY}_groupNews`,
      JSON.stringify({ groupNewsMap, groupNewsItems: truncatedGroupNewsItems, allGroupNews: truncatedAllGroupNews, latestNewsIds }),
    );
  } catch {
    // ignore (storage full 등)
  }
}

// Bing 리다이렉트 URL이 캐시된 경우 초기화
function clearStaleNewsCache() {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_groupNews`);
    if (!stored) return;
    const data = JSON.parse(stored);
    const allNews: NewsItem[] = data.allGroupNews || [];
    const hasBingRedirect = allNews.some(
      (n) => n.link && n.link.includes('bing.com/news/apiclick.aspx'),
    );
    if (hasBingRedirect) {
      // Bing 리다이렉트 URL이 있는 뉴스만 제거하고 나머지는 유지
      const cleanedNews = allNews.filter(
        (n) => !n.link || !n.link.includes('bing.com/news/apiclick.aspx'),
      );
      const cleanedGroupNewsItems: Record<string, NewsItem[]> = {};
      for (const [gid, items] of Object.entries((data.groupNewsItems || {}) as Record<string, NewsItem[]>)) {
        cleanedGroupNewsItems[gid] = items.filter(
          (n) => !n.link || !n.link.includes('bing.com/news/apiclick.aspx'),
        );
      }
      data.allGroupNews = cleanedNews;
      data.groupNewsItems = cleanedGroupNewsItems;
      localStorage.setItem(`${STORAGE_KEY}_groupNews`, JSON.stringify(data));
    }
  } catch {
    // ignore
  }
}

clearStaleNewsCache();
const _cachedGroupNews = loadCachedGroupNews();

export const useNewsAlertStore = create<NewsAlertState>((set, get) => ({
  news: [],
  newNewsCount: 0,
  lastCheckedAt: loadLastCheckedAt(),
  isMonitoring: false,
  isLoading: false,
  error: null,
  readNewsIds: loadReadNewsIds(),
  groupNewsMap: _cachedGroupNews.groupNewsMap,
  groupNewsItems: _cachedGroupNews.groupNewsItems,
  allGroupNews: _cachedGroupNews.allGroupNews,
  latestNewsIds: new Set(_cachedGroupNews.latestNewsIds),
  totalGroupUnread: Object.values(_cachedGroupNews.groupNewsMap).reduce((s, c) => s + c, 0),
  monitoringGroupId: null,
  intervalId: null,
  isDrawerOpen: false,

  searchNews: async (members, timeRange = '1d') => {
    set({ isLoading: true, error: null });

    try {
      let newNews: NewsItem[];

      if (isDemoMode()) {
        await new Promise(resolve => setTimeout(resolve, 500));
        newNews = generateDemoNews(members);
      } else {
        const response = await fetch('/api/news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ members, timeRange }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || '뉴스 검색 실패');
        }

        const data = await response.json();
        newNews = data.news as NewsItem[];
      }

      const readIds = get().readNewsIds;

      // 최신 검색 결과의 ID 집합
      const latestIds = new Set(newNews.map(n => n.id));

      // 이전 뉴스 중 최신 검색에 없는 것만 유지 (중복 제거)
      const previousNews = get().news.filter(n => !latestIds.has(n.id));

      // 병합: 최신 뉴스 먼저, 그 다음 이전 뉴스
      const mergedNews = [...newNews, ...previousNews];

      const unreadCount = mergedNews.filter(n => !readIds.has(n.id)).length;

      const now = new Date().toISOString();
      saveLastCheckedAt(now);

      set({
        news: mergedNews,
        newNewsCount: unreadCount,
        lastCheckedAt: now,
        isLoading: false,
      });

      // FCM 푸시 알림 전송
      if (!isDemoMode() && unreadCount > 0) {
        sendPushNotification(
          '새로운 뉴스가 있습니다',
          `나의 모임 멤버 관련 ${unreadCount}개의 새 뉴스가 발견되었습니다.`,
          unreadCount,
        );
      }
    } catch (err) {
      console.error('News search error:', err);
      set({
        error: null,
        news: get().news, // 기존 뉴스 유지
        isLoading: false,
      });
    }
  },

  searchNewsForAllGroups: async (groups, timeRange = '1d') => {
    if (groups.length === 0) {
      set({ groupNewsMap: {}, groupNewsItems: {}, allGroupNews: [], totalGroupUnread: 0 });
      saveCachedGroupNews({}, {}, [], []);
      return;
    }

    // 모든 그룹의 멤버를 합쳐서 한 번에 뉴스 검색
    const allMembers: { name: string; company?: string }[] = [];
    const memberToGroups: Record<string, string[]> = {};

    for (const group of groups) {
      for (const member of group.members) {
        const key = `${member.name}|${member.company || ''}`;
        if (!memberToGroups[key]) {
          memberToGroups[key] = [];
          allMembers.push(member);
        }
        memberToGroups[key].push(group.id);
      }
    }

    set({ isLoading: true, error: null });

    try {
      let allNews: NewsItem[];

      if (isDemoMode()) {
        await new Promise(resolve => setTimeout(resolve, 300));
        allNews = generateDemoNews(allMembers);
      } else {
        const response = await fetch('/api/news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ members: allMembers, timeRange }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || '뉴스 검색 실패');
        }

        const data = await response.json();
        allNews = data.news as NewsItem[];
      }

      const readIds = get().readNewsIds;

      // 최신 검색 결과의 ID 집합
      const latestIds = new Set(allNews.map(n => n.id));

      // 이전 뉴스 중 최신 검색에 없는 것만 유지 (중복 제거)
      const previousNews = get().allGroupNews.filter(n => !latestIds.has(n.id));

      // 병합: 최신 뉴스 먼저, 그 다음 이전 뉴스
      const mergedNews = [...allNews, ...previousNews];

      // 각 뉴스를 해당 그룹에 매핑
      const groupNewsMap: Record<string, number> = {};
      const groupNewsItems: Record<string, NewsItem[]> = {};
      for (const group of groups) {
        groupNewsMap[group.id] = 0;
        groupNewsItems[group.id] = [];
      }

      for (const newsItem of mergedNews) {
        const key = `${newsItem.memberName || ''}|${newsItem.memberCompany || ''}`;
        const groupIds = memberToGroups[key];
        if (groupIds) {
          for (const gid of groupIds) {
            groupNewsItems[gid].push(newsItem);
            if (!readIds.has(newsItem.id)) {
              groupNewsMap[gid] = (groupNewsMap[gid] || 0) + 1;
            }
          }
        }
      }

      const totalGroupUnread = Object.values(groupNewsMap).reduce((sum, c) => sum + c, 0);
      const latestIdsArr = Array.from(latestIds);

      const now = new Date().toISOString();
      saveLastCheckedAt(now);
      saveCachedGroupNews(groupNewsMap, groupNewsItems, mergedNews, latestIdsArr);

      set({
        groupNewsMap,
        groupNewsItems,
        allGroupNews: mergedNews,
        latestNewsIds: latestIds,
        totalGroupUnread,
        lastCheckedAt: now,
        isLoading: false,
      });

      // FCM 푸시 알림 전송
      if (!isDemoMode() && totalGroupUnread > 0) {
        sendPushNotification(
          '새로운 뉴스가 있습니다',
          `나의 모임 멤버 관련 ${totalGroupUnread}개의 새 뉴스가 발견되었습니다.`,
          totalGroupUnread,
        );
      }
    } catch (err) {
      console.error('News search for all groups error:', err);
      set({ error: null, isLoading: false });
    }
  },

  loadCachedNewsForGroup: (groupId) => {
    const cached = get().groupNewsItems[groupId] || [];
    const readIds = get().readNewsIds;
    const unreadCount = cached.filter(n => !readIds.has(n.id)).length;
    set({ news: cached, newNewsCount: unreadCount });
  },

  startMonitoring: (groupId, members) => {
    const { intervalId, searchNews } = get();

    if (intervalId) {
      clearInterval(intervalId);
    }

    searchNews(members, '6m');

    const newIntervalId = window.setInterval(() => {
      searchNews(members, '6m');
    }, CHECK_INTERVAL);

    set({
      isMonitoring: true,
      monitoringGroupId: groupId,
      intervalId: newIntervalId,
    });

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  },

  stopMonitoring: () => {
    const { intervalId } = get();
    if (intervalId) {
      clearInterval(intervalId);
    }
    set({
      isMonitoring: false,
      monitoringGroupId: null,
      intervalId: null,
    });
  },

  markAsRead: (newsId) => {
    const readIds = new Set(get().readNewsIds);
    readIds.add(newsId);
    saveReadNewsIds(readIds);

    const newCount = get().news.filter(n => !readIds.has(n.id)).length;

    set({
      readNewsIds: readIds,
      newNewsCount: newCount,
    });
  },

  markAllAsRead: () => {
    const readIds = new Set(get().readNewsIds);
    // news (단일 그룹)과 allGroupNews (전체) 모두 읽음 처리
    get().news.forEach(n => readIds.add(n.id));
    get().allGroupNews.forEach(n => readIds.add(n.id));
    saveReadNewsIds(readIds);

    set({
      readNewsIds: readIds,
      newNewsCount: 0,
    });
  },

  getGroupUnreadCount: (groupId) => {
    return get().groupNewsMap[groupId] || 0;
  },

  getGroupNews: (groupId) => {
    return get().groupNewsItems[groupId] || [];
  },

  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  clearError: () => set({ error: null }),

  reset: () => {
    const { intervalId } = get();
    if (intervalId) {
      clearInterval(intervalId);
    }
    set({
      news: [],
      newNewsCount: 0,
      lastCheckedAt: null,
      isMonitoring: false,
      isLoading: false,
      error: null,
      groupNewsMap: {},
      groupNewsItems: {},
      allGroupNews: [],
      latestNewsIds: new Set(),
      totalGroupUnread: 0,
      monitoringGroupId: null,
      intervalId: null,
      isDrawerOpen: false,
    });
  },
}));
