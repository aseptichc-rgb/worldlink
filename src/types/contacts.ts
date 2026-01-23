// Contact Types for Address Book Visualization

export interface Contact {
  id: string;
  name: string;
  phone: string;
  company: string;
  department: string;
  position: string;
  email: string;
  workPhone: string;
  workFax: string;
  address: string;
  registeredDate: string;
  group: string;
  memo: string;
  category: ContactCategory;
}

export type ContactCategory =
  | 'healthcare'      // 의료/헬스케어
  | 'investment'      // 투자/VC
  | 'startup'         // 스타트업/IT
  | 'legal'           // 법률/컨설팅
  | 'media'           // 언론/미디어
  | 'academia'        // 학계/연구
  | 'government'      // 정부/공공
  | 'corporate'       // 대기업/일반기업
  | 'other';          // 기타

export interface CategoryInfo {
  id: ContactCategory;
  name: string;
  nameEn: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  keywords: string[];
}

export const CATEGORY_INFO: Record<ContactCategory, CategoryInfo> = {
  healthcare: {
    id: 'healthcare',
    name: '의료/헬스케어',
    nameEn: 'Healthcare',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    icon: '🏥',
    keywords: [
      '병원', '의원', '클리닉', '의료', '헬스케어', '바이오', '제약', '진단',
      '의사', '전문의', '원장', '교수', '연구원', 'MD', 'Ph.D', '의학박사',
      '내과', '외과', '정형외과', '피부과', '성형외과', '신경과', '정신과',
      '삼성서울병원', '서울대병원', '연세대병원', '가톨릭', '고려대병원',
      'Healthcare', 'Medical', 'Bio', 'Pharma', 'Clinic', 'Hospital'
    ]
  },
  investment: {
    id: 'investment',
    name: '투자/VC',
    nameEn: 'Investment',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    icon: '💰',
    keywords: [
      '투자', '벤처', 'VC', '캐피탈', '파트너스', '인베스트', '에쿼티',
      '펀드', 'PE', '심사역', '투자이사', '투자본부', 'CIO', '파트너',
      'Investment', 'Venture', 'Capital', 'Partners', 'Fund'
    ]
  },
  startup: {
    id: 'startup',
    name: '스타트업/IT',
    nameEn: 'Startup/IT',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.4)',
    icon: '🚀',
    keywords: [
      '스타트업', 'CEO', 'CTO', 'COO', 'CFO', '대표이사', '창업',
      'Founder', 'Co-founder', '개발', 'Developer', 'AI', '인공지능',
      '소프트웨어', '플랫폼', '테크', 'Tech', 'Lab', '랩'
    ]
  },
  legal: {
    id: 'legal',
    name: '법률/컨설팅',
    nameEn: 'Legal/Consulting',
    color: '#6366F1',
    bgColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: 'rgba(99, 102, 241, 0.4)',
    icon: '⚖️',
    keywords: [
      '법무법인', '변호사', '변리사', '특허', '컨설팅', '회계',
      '공인회계사', 'KICPA', 'CPA', 'CFA', '세무사', '법률'
    ]
  },
  media: {
    id: 'media',
    name: '언론/미디어',
    nameEn: 'Media',
    color: '#EC4899',
    bgColor: 'rgba(236, 72, 153, 0.15)',
    borderColor: 'rgba(236, 72, 153, 0.4)',
    icon: '📰',
    keywords: [
      '기자', '편집', '언론', '미디어', '뉴스', '신문', '방송',
      '청년의사', '메디컬', '헬스경향', 'IT조선', '동아', '조선'
    ]
  },
  academia: {
    id: 'academia',
    name: '학계/연구',
    nameEn: 'Academia',
    color: '#14B8A6',
    bgColor: 'rgba(20, 184, 166, 0.15)',
    borderColor: 'rgba(20, 184, 166, 0.4)',
    icon: '🎓',
    keywords: [
      '대학교', '대학', '교수', '연구', '연구원', '박사', '석사',
      '연세대', '서울대', '고려대', 'KAIST', '한양대', '중앙대',
      'University', 'Professor', 'Research', 'Institute'
    ]
  },
  government: {
    id: 'government',
    name: '정부/공공',
    nameEn: 'Government',
    color: '#0EA5E9',
    bgColor: 'rgba(14, 165, 233, 0.15)',
    borderColor: 'rgba(14, 165, 233, 0.4)',
    icon: '🏛️',
    keywords: [
      '국회', '정부', '공공', '협회', '진흥원', '식약처', '보건복지부',
      '산업통상자원부', '국회의원', '비서관', '공무원', '이사회'
    ]
  },
  corporate: {
    id: 'corporate',
    name: '대기업/일반',
    nameEn: 'Corporate',
    color: '#64748B',
    bgColor: 'rgba(100, 116, 139, 0.15)',
    borderColor: 'rgba(100, 116, 139, 0.4)',
    icon: '🏢',
    keywords: [
      '삼성', 'SK', 'LG', '현대', '카카오', '네이버', 'NAVER',
      '구글', 'Google', '대상', '롯데'
    ]
  },
  other: {
    id: 'other',
    name: '기타',
    nameEn: 'Other',
    color: '#94A3B8',
    bgColor: 'rgba(148, 163, 184, 0.15)',
    borderColor: 'rgba(148, 163, 184, 0.4)',
    icon: '👤',
    keywords: []
  }
};

// CSV 파싱 및 카테고리 분류 함수
export function parseCSV(csvText: string): Contact[] {
  const lines = csvText.split('\n');
  if (lines.length < 2) return [];

  const contacts: Contact[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // CSV 파싱 (쌍따옴표 내의 쉼표 처리)
    const values = parseCSVLine(line);
    if (values.length < 12) continue;

    const [name, phone, company, department, position, email, workPhone, workFax, address, registeredDate, group, memo] = values;

    if (!name) continue;

    const contact: Contact = {
      id: `contact-${i}`,
      name: name.trim(),
      phone: phone?.trim() || '',
      company: company?.trim() || '',
      department: department?.trim() || '',
      position: position?.trim() || '',
      email: email?.trim() || '',
      workPhone: workPhone?.trim() || '',
      workFax: workFax?.trim() || '',
      address: address?.trim() || '',
      registeredDate: registeredDate?.trim() || '',
      group: group?.trim() || '',
      memo: memo?.trim() || '',
      category: 'other'
    };

    contact.category = categorizeContact(contact);
    contacts.push(contact);
  }

  return contacts;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);

  return values;
}

function categorizeContact(contact: Contact): ContactCategory {
  const searchText = `${contact.company} ${contact.department} ${contact.position} ${contact.name}`.toLowerCase();

  // 우선순위대로 카테고리 매칭
  const categoryPriority: ContactCategory[] = [
    'investment',
    'healthcare',
    'legal',
    'media',
    'government',
    'academia',
    'corporate',
    'startup',
    'other'
  ];

  for (const categoryId of categoryPriority) {
    const info = CATEGORY_INFO[categoryId];
    for (const keyword of info.keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return categoryId;
      }
    }
  }

  // 스타트업 키워드가 매칭되지 않았지만 CEO/대표이사 등이면 startup으로 분류
  if (searchText.includes('ceo') || searchText.includes('대표이사') ||
      searchText.includes('cto') || searchText.includes('founder')) {
    return 'startup';
  }

  return 'other';
}

// 카테고리별 그룹화
export function groupByCategory(contacts: Contact[]): Map<ContactCategory, Contact[]> {
  const grouped = new Map<ContactCategory, Contact[]>();

  for (const category of Object.keys(CATEGORY_INFO) as ContactCategory[]) {
    grouped.set(category, []);
  }

  for (const contact of contacts) {
    const list = grouped.get(contact.category) || [];
    list.push(contact);
    grouped.set(contact.category, list);
  }

  return grouped;
}

// 통계 계산
export interface CategoryStats {
  category: ContactCategory;
  count: number;
  percentage: number;
}

export function calculateCategoryStats(contacts: Contact[]): CategoryStats[] {
  const grouped = groupByCategory(contacts);
  const total = contacts.length;

  return Array.from(grouped.entries())
    .map(([category, list]) => ({
      category,
      count: list.length,
      percentage: total > 0 ? (list.length / total) * 100 : 0
    }))
    .filter(stat => stat.count > 0)
    .sort((a, b) => b.count - a.count);
}
