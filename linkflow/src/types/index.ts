export interface Member {
  id: string;
  name: string;
  company: string;
  role: string;
  phone: string;
  email: string;
  description: string;
  category: string;
  tags: string[];
  photoUrl: string | null;
  specialRole?: string | null; // 특별 보직 (회장, 부회장 등)
}

export interface GraphNode {
  id: string;
  name: string;
  company: string;
  role: string;
  category: string;
  photoUrl: string | null;
  val: number;
  color: string;
  member: Member;
  specialRole?: string | null;
  // force-graph 위치 속성
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: 'category' | 'keyword';
  strength: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export const CATEGORY_COLORS: Record<string, string> = {
  '의료기기': '#3B82F6',     // 파랑
  '솔루션': '#06B6D4',       // 청록
  '투자': '#EF4444',         // 빨강
  '법률': '#F97316',         // 오렌지
  '특허': '#FB923C',         // 연오렌지
  '제약': '#8B5CF6',         // 보라
  '바이오': '#A855F7',       // 연보라
  '의료기관': '#10B981',     // 초록
  '비즈니스': '#F59E0B',     // 노랑
};

export const getCategoryColor = (category: string): string => {
  // 정확히 일치하는 경우
  if (CATEGORY_COLORS[category]) {
    return CATEGORY_COLORS[category];
  }
  // 부분 일치 체크
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (category.includes(key) || key.includes(category)) {
      return color;
    }
  }
  return '#6B7280'; // 기본 회색
};
