// =============================================================================
// 통합 카테고리 시스템 - 분야별 자동 분류 및 색상 매핑
// =============================================================================

/** 10개 표준 카테고리 */
export const CATEGORIES = [
  'IT/기술',
  '투자/금융',
  '헬스케어/바이오',
  '법률/특허',
  '미디어/콘텐츠',
  '교육/연구',
  '제조/에너지',
  '공공/정책',
  '디자인/건축',
  'F&B/라이프스타일',
] as const;

export type CategoryName = (typeof CATEGORIES)[number] | '기타';

/** 카테고리별 색상 */
export const CATEGORY_COLORS: Record<string, string> = {
  'IT/기술':           '#58A6FF',  // 밝은 파랑
  '투자/금융':         '#F85149',  // 빨강
  '헬스케어/바이오':    '#3FB950',  // 초록
  '법률/특허':         '#D29922',  // 주황/골드
  '미디어/콘텐츠':     '#A371F7',  // 보라
  '교육/연구':         '#79C0FF',  // 하늘
  '제조/에너지':       '#F97316',  // 진한 주황
  '공공/정책':         '#1ABC9C',  // 청록
  '디자인/건축':       '#EC4899',  // 핑크
  'F&B/라이프스타일':   '#FFC642',  // 노란색
  '기타':              '#8B949E',  // 회색
};

// 카테고리별 키워드 매핑 (자동 분류용)
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'IT/기술': [
    'IT', '기술', '개발', '소프트웨어', 'AI', '인공지능', '머신러닝', '딥러닝',
    '데이터', '클라우드', 'SaaS', '플랫폼', '앱', '모바일', '웹', '블록체인',
    '보안', '인프라', 'DevOps', 'CTO', '프론트엔드', '백엔드', '풀스택',
    '스타트업', 'IoT', '로봇', '자동화', '빅데이터', 'API',
    'software', 'engineer', 'developer', 'tech', 'startup',
  ],
  '투자/금융': [
    '투자', '금융', 'VC', 'PE', '벤처', '펀드', '자산운용', '증권', '은행',
    '핀테크', '보험', '크라우드펀딩', '엔젤', 'M&A', 'IPO', '상장',
    'IB', '심사역', '파트너', '대출', '보증', '리서치', '애널리스트',
    '포트폴리오', '액셀러레이터', '시드', '성장투자',
    'venture', 'capital', 'finance', 'investment',
  ],
  '헬스케어/바이오': [
    '의료', '헬스케어', '바이오', '제약', '의료기기', '병원', '의원', '진료',
    '임상', '신약', '의사', '간호', '건강', '웰니스', '진단', '치료',
    '유전체', '의약', '식약처', 'FDA', 'GMP', '의공학', '생명공학',
    'health', 'medical', 'pharma', 'bio', 'clinical',
  ],
  '법률/특허': [
    '법률', '특허', '변호사', '법무', '변리사', '지식재산', 'IP', '소송',
    '계약', '컴플라이언스', '규제', '인허가', '로펌', '법무법인',
    '라이선스', '상표', '저작권', '법학',
    'legal', 'patent', 'lawyer', 'attorney',
  ],
  '미디어/콘텐츠': [
    '미디어', '콘텐츠', '방송', '영상', '출판', '마케팅', '광고', 'PR',
    '브랜딩', '크리에이터', '유튜브', 'SNS', '소셜미디어', '저널리즘',
    '기자', '편집', '작가', '엔터테인먼트', '게임', '음악', '영화',
    'media', 'content', 'marketing', 'brand',
  ],
  '교육/연구': [
    '교육', '연구', '대학', '교수', '학원', '에듀테크', '학술', '논문',
    '강의', '커리큘럼', '훈련', '멘토링', '장학', '연구소', '박사',
    '석사', '학위', 'R&D', '연구개발', 'STEM',
    'education', 'research', 'professor', 'university', 'academic',
  ],
  '제조/에너지': [
    '제조', '에너지', '공장', '생산', '산업', '전기', '전자', '반도체',
    '배터리', '태양광', '신재생', '수소', '원자력', '석유', '화학',
    '자동차', '조선', '항공', '건설', '철강', '소재', '부품',
    'manufacturing', 'energy', 'semiconductor', 'battery',
  ],
  '공공/정책': [
    '공공', '정책', '정부', '공무원', '국회', '지자체', '시청', '공기업',
    '공단', '진흥원', '재단', 'NGO', '비영리', '사회적기업', '국제기구',
    '외교', '통상', '규제', '행정', '복지',
    'government', 'policy', 'public',
  ],
  '디자인/건축': [
    '디자인', '건축', 'UX', 'UI', '인테리어', '공간', '설계', '시각',
    '그래픽', '제품디자인', '산업디자인', 'BX', '경험디자인', '조경',
    '도시계획', '건설', '부동산', '개발', '시공',
    'design', 'architect', 'UX', 'UI',
  ],
  'F&B/라이프스타일': [
    'F&B', '식품', '음식', '요리', '셰프', '레스토랑', '카페', '베이커리',
    '와인', '커피', '프랜차이즈', '유통', '리테일', '패션', '뷰티',
    '화장품', '여행', '관광', '호텔', '스포츠', '피트니스', '라이프',
    'food', 'fashion', 'beauty', 'lifestyle', 'retail',
  ],
};

// 산업(industry) → 카테고리 매핑
const INDUSTRY_CATEGORY_MAP: Record<string, CategoryName> = {
  'IT': 'IT/기술',
  'IT/통신': 'IT/기술',
  '소프트웨어': 'IT/기술',
  '인터넷': 'IT/기술',
  '테크': 'IT/기술',
  '금융': '투자/금융',
  '은행': '투자/금융',
  '증권': '투자/금융',
  '보험': '투자/금융',
  '핀테크': '투자/금융',
  '의료': '헬스케어/바이오',
  '제약': '헬스케어/바이오',
  '바이오': '헬스케어/바이오',
  '헬스케어': '헬스케어/바이오',
  '병원': '헬스케어/바이오',
  '법률': '법률/특허',
  '법무': '법률/특허',
  '미디어': '미디어/콘텐츠',
  '광고': '미디어/콘텐츠',
  '엔터테인먼트': '미디어/콘텐츠',
  '게임': '미디어/콘텐츠',
  '교육': '교육/연구',
  '연구': '교육/연구',
  '학술': '교육/연구',
  '제조': '제조/에너지',
  '에너지': '제조/에너지',
  '반도체': '제조/에너지',
  '자동차': '제조/에너지',
  '화학': '제조/에너지',
  '건설': '디자인/건축',
  '부동산': '디자인/건축',
  '건축': '디자인/건축',
  '디자인': '디자인/건축',
  '공공': '공공/정책',
  '정부': '공공/정책',
  '비영리': '공공/정책',
  '식품': 'F&B/라이프스타일',
  '외식': 'F&B/라이프스타일',
  '유통': 'F&B/라이프스타일',
  '패션': 'F&B/라이프스타일',
  '뷰티': 'F&B/라이프스타일',
  '여행': 'F&B/라이프스타일',
};

/**
 * 사용자 정보를 기반으로 카테고리를 자동 추론
 * 우선순위: category > industry > keywords > position > company
 */
export function inferCategory(user: {
  category?: string;
  industry?: string;
  keywords?: string[];
  position?: string;
  company?: string;
}): CategoryName {
  // 1. 이미 유효한 카테고리가 있으면 그대로 사용
  if (user.category && CATEGORIES.includes(user.category as any)) {
    return user.category as CategoryName;
  }

  // 2. industry 기반 매핑
  if (user.industry) {
    const mapped = INDUSTRY_CATEGORY_MAP[user.industry];
    if (mapped) return mapped;

    // industry 문자열이 카테고리 키워드에 포함되는지 확인
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(k => user.industry!.toLowerCase().includes(k.toLowerCase()))) {
        return cat as CategoryName;
      }
    }
  }

  // 3. keywords 기반 스코어링 (가장 많이 매칭되는 카테고리)
  if (user.keywords && user.keywords.length > 0) {
    const scores: Record<string, number> = {};

    for (const [cat, catKeywords] of Object.entries(CATEGORY_KEYWORDS)) {
      let score = 0;
      for (const userKw of user.keywords) {
        const normalizedKw = userKw.toLowerCase().replace(/^#/, '');
        for (const catKw of catKeywords) {
          if (normalizedKw.includes(catKw.toLowerCase()) || catKw.toLowerCase().includes(normalizedKw)) {
            score++;
          }
        }
      }
      if (score > 0) scores[cat] = score;
    }

    const bestMatch = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    if (bestMatch) return bestMatch[0] as CategoryName;
  }

  // 4. position 기반 추론
  if (user.position) {
    const pos = user.position.toLowerCase();
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(k => pos.includes(k.toLowerCase()))) {
        return cat as CategoryName;
      }
    }
  }

  // 5. company 기반 추론
  if (user.company) {
    const comp = user.company.toLowerCase();
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(k => comp.includes(k.toLowerCase()))) {
        return cat as CategoryName;
      }
    }
  }

  return '기타';
}

/** 카테고리 색상 반환 */
export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS['기타'];
}

/** 노드 배열에서 카테고리별 수 집계 */
export function getCategoryCounts(
  nodes: Array<{ category?: string; industry?: string; keywords?: string[]; position?: string; company?: string; degree?: number }>
): Record<CategoryName, number> {
  const counts = {} as Record<CategoryName, number>;
  for (const cat of [...CATEGORIES, '기타' as const]) {
    counts[cat] = 0;
  }
  nodes.forEach(node => {
    if (node.degree !== undefined && node.degree !== 1) return; // 1촌만 집계
    const cat = inferCategory(node);
    counts[cat] = (counts[cat] || 0) + 1;
  });
  return counts;
}

/** 사용자 배열을 카테고리별로 그룹화 */
export function categorizeUsers<T extends { category?: string; industry?: string; keywords?: string[]; position?: string; company?: string }>(
  users: T[]
): Record<CategoryName, T[]> {
  const grouped = {} as Record<CategoryName, T[]>;
  for (const cat of [...CATEGORIES, '기타' as const]) {
    grouped[cat] = [];
  }
  users.forEach(user => {
    const cat = inferCategory(user);
    grouped[cat].push(user);
  });
  return grouped;
}
