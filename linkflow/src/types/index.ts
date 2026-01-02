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
  // 고정 좌표
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
  '의료기기/솔루션': '#3B82F6',    // 파랑
  '투자/법률/특허': '#EF4444',     // 빨강
  '제약/바이오': '#8B5CF6',        // 보라
  '의료기관': '#10B981',           // 초록
  '기타': '#F59E0B',               // 노랑
  '기타/공공': '#F59E0B',          // 노랑
  '의료기관/솔루션': '#06B6D4',    // 청록
  '의료기관/투자': '#14B8A6',      // 틸
  '의료기관/바이오': '#22C55E',    // 라임
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
