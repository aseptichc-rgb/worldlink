import { create } from 'zustand';
import { NewsItem } from '@/app/api/news/route';

const STORAGE_KEY = 'nodded_news_alert';
const CHECK_INTERVAL = 60 * 60 * 1000; // 1시간

// 데모 모드 체크
function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('nodded_demo_mode') === 'true';
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

  // 각 멤버에 대해 1-2개의 뉴스 생성
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

      // 최근 7일 내 랜덤 시간
      const randomHours = Math.floor(Math.random() * 168);
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

  // 최신순 정렬
  return news.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
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

  // Monitoring state
  monitoringGroupId: string | null;
  intervalId: number | null;

  // UI State
  isDrawerOpen: boolean;

  // Actions
  searchNews: (members: { name: string; company?: string }[]) => Promise<void>;
  startMonitoring: (groupId: string, members: { name: string; company?: string }[]) => void;
  stopMonitoring: () => void;
  markAsRead: (newsId: string) => void;
  markAllAsRead: () => void;
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
    // 최근 500개만 유지 (오래된 것 정리)
    const arr = Array.from(ids).slice(-500);
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

export const useNewsAlertStore = create<NewsAlertState>((set, get) => ({
  news: [],
  newNewsCount: 0,
  lastCheckedAt: loadLastCheckedAt(),
  isMonitoring: false,
  isLoading: false,
  error: null,
  readNewsIds: loadReadNewsIds(),
  monitoringGroupId: null,
  intervalId: null,
  isDrawerOpen: false,

  searchNews: async (members) => {
    set({ isLoading: true, error: null });

    try {
      let newNews: NewsItem[];

      // 데모 모드: 예시 뉴스 생성
      if (isDemoMode()) {
        // 로딩 효과를 위한 딜레이
        await new Promise(resolve => setTimeout(resolve, 500));
        newNews = generateDemoNews(members);
      } else {
        const response = await fetch('/api/news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ members }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '뉴스 검색 실패');
        }

        const data = await response.json();
        newNews = data.news as NewsItem[];
      }

      const readIds = get().readNewsIds;

      // 새 뉴스 개수 계산 (읽지 않은 뉴스)
      const unreadCount = newNews.filter(n => !readIds.has(n.id)).length;

      const now = new Date().toISOString();
      saveLastCheckedAt(now);

      set({
        news: newNews,
        newNewsCount: unreadCount,
        lastCheckedAt: now,
        isLoading: false,
      });

      // 새 뉴스가 있으면 브라우저 알림 표시 (데모 모드에서는 생략)
      if (!isDemoMode() && unreadCount > 0 && typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('새로운 뉴스가 있습니다', {
            body: `나의 모임 멤버 관련 ${unreadCount}개의 새 뉴스가 발견되었습니다.`,
            icon: '/favicon.ico',
            tag: 'news-alert',
          });
        }
      }
    } catch (err) {
      console.error('News search error:', err);
      set({
        error: (err as Error).message,
        isLoading: false,
      });
    }
  },

  startMonitoring: (groupId, members) => {
    const { intervalId, searchNews, isMonitoring } = get();

    // 이미 모니터링 중이면 중지
    if (intervalId) {
      clearInterval(intervalId);
    }

    // 즉시 한 번 검색
    searchNews(members);

    // 1시간마다 반복
    const newIntervalId = window.setInterval(() => {
      searchNews(members);
    }, CHECK_INTERVAL);

    set({
      isMonitoring: true,
      monitoringGroupId: groupId,
      intervalId: newIntervalId,
    });

    // 브라우저 알림 권한 요청
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
    get().news.forEach(n => readIds.add(n.id));
    saveReadNewsIds(readIds);

    set({
      readNewsIds: readIds,
      newNewsCount: 0,
    });
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
      monitoringGroupId: null,
      intervalId: null,
      isDrawerOpen: false,
    });
  },
}));
