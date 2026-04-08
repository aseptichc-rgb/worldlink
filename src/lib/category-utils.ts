// =============================================================================
// ResearchNexus - 연구 분야 분류 시스템
// =============================================================================

import type { ResearchField } from '@/types';

/** 16개 연구 분야 */
export const CATEGORIES = [
  'computer-science',
  'artificial-intelligence',
  'biology',
  'medicine',
  'physics',
  'chemistry',
  'mathematics',
  'engineering',
  'social-sciences',
  'economics',
  'humanities',
  'environmental-science',
  'materials-science',
  'neuroscience',
  'interdisciplinary',
  'other',
] as const;

export type CategoryName = ResearchField;

/** 연구 분야 한국어 라벨 */
export const FIELD_LABELS: Record<ResearchField, string> = {
  'computer-science': '컴퓨터과학',
  'artificial-intelligence': 'AI/머신러닝',
  'biology': '생물학',
  'medicine': '의학',
  'physics': '물리학',
  'chemistry': '화학',
  'mathematics': '수학',
  'engineering': '공학',
  'social-sciences': '사회과학',
  'economics': '경제학',
  'humanities': '인문학',
  'environmental-science': '환경과학',
  'materials-science': '재료과학',
  'neuroscience': '뇌과학',
  'interdisciplinary': '융합연구',
  'other': '기타',
};

/** 연구 분야별 색상 */
export const CATEGORY_COLORS: Record<string, string> = {
  'computer-science':        '#58A6FF',  // 파랑
  'artificial-intelligence': '#A371F7',  // 보라
  'biology':                 '#3FB950',  // 초록
  'medicine':                '#F85149',  // 빨강
  'physics':                 '#79C0FF',  // 하늘
  'chemistry':               '#F97316',  // 주황
  'mathematics':             '#D29922',  // 골드
  'engineering':             '#1ABC9C',  // 청록
  'social-sciences':         '#EC4899',  // 핑크
  'economics':               '#FFC642',  // 노란색
  'humanities':              '#C9D1D9',  // 은색
  'environmental-science':   '#2EA043',  // 진한 초록
  'materials-science':       '#8B5CF6',  // 진한 보라
  'neuroscience':            '#06B6D4',  // 시안
  'interdisciplinary':       '#0EA5E9',  // 틸블루
  'other':                   '#8B949E',  // 회색
};

/** 연구 분야별 키워드 (자동 분류용) */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'computer-science': [
    '컴퓨터', '소프트웨어', '알고리즘', '프로그래밍', '네트워크', '보안', '데이터베이스',
    '운영체제', '컴파일러', '분산시스템', '병렬컴퓨팅', 'HCI', '컴퓨터비전',
    'computer science', 'software', 'algorithm', 'database', 'distributed systems',
    'cybersecurity', 'operating system', 'programming language',
  ],
  'artificial-intelligence': [
    'AI', '인공지능', '머신러닝', '딥러닝', 'NLP', '자연어처리', '강화학습',
    '컴퓨터비전', '생성모델', 'LLM', '대규모언어모델', '신경망', 'GPT',
    'transformer', '추천시스템', '자율주행', '로보틱스',
    'machine learning', 'deep learning', 'reinforcement learning', 'neural network',
    'natural language processing', 'computer vision', 'generative AI',
  ],
  'biology': [
    '생물학', '유전학', '분자생물학', '세포생물학', '생태학', '진화', '미생물학',
    '유전체', '게노믹스', '프로테오믹스', '생명공학', '바이오인포매틱스',
    '합성생물학', 'CRISPR', '줄기세포',
    'biology', 'genetics', 'genomics', 'molecular biology', 'ecology',
    'bioinformatics', 'synthetic biology', 'microbiology',
  ],
  'medicine': [
    '의학', '의료', '임상', '진단', '치료', '제약', '신약', '약학', '간호',
    '공중보건', '역학', '바이오마커', '면역학', '종양학', '암',
    'FDA', '임상시험', '의생명', '재활', '정밀의료',
    'medicine', 'clinical', 'pharmaceutical', 'oncology', 'immunology',
    'epidemiology', 'public health', 'drug discovery',
  ],
  'physics': [
    '물리학', '양자', '양자역학', '양자컴퓨팅', '입자물리', '천체물리',
    '광학', '반도체', '초전도', '플라즈마', '핵물리', '응집물질',
    '상대성이론', '열역학', '통계역학',
    'physics', 'quantum', 'astrophysics', 'condensed matter', 'optics',
    'particle physics', 'thermodynamics',
  ],
  'chemistry': [
    '화학', '유기화학', '무기화학', '물리화학', '분석화학', '고분자',
    '촉매', '전기화학', '나노화학', '계산화학', '약물화학',
    'chemistry', 'organic', 'inorganic', 'catalysis', 'polymer',
    'electrochemistry', 'computational chemistry',
  ],
  'mathematics': [
    '수학', '통계학', '확률론', '대수학', '위상수학', '해석학', '미분방정식',
    '조합론', '수론', '최적화', '수치해석', '응용수학',
    'mathematics', 'statistics', 'probability', 'optimization', 'algebra',
    'topology', 'numerical analysis',
  ],
  'engineering': [
    '공학', '기계공학', '전기공학', '전자공학', '화학공학', '토목공학',
    '항공우주', '산업공학', '로봇공학', '자동화', '제어시스템',
    'IoT', '반도체공학', '통신공학', '에너지공학',
    'engineering', 'mechanical', 'electrical', 'civil', 'aerospace',
    'robotics', 'automation', 'semiconductor',
  ],
  'social-sciences': [
    '사회과학', '심리학', '사회학', '정치학', '인류학', '교육학',
    '언어학', '커뮤니케이션', '미디어', '법학', '행정학', '국제관계',
    'social science', 'psychology', 'sociology', 'political science',
    'anthropology', 'education', 'linguistics',
  ],
  'economics': [
    '경제학', '경영학', '재무', '마케팅', '회계', '금융공학',
    '행동경제학', '계량경제학', '국제경제', '거시경제', '미시경제',
    'economics', 'finance', 'marketing', 'management', 'accounting',
    'behavioral economics', 'econometrics',
  ],
  'humanities': [
    '인문학', '철학', '역사학', '문학', '종교학', '고고학', '미술사',
    '음악학', '윤리학', '논리학', '문화연구', '기호학',
    'humanities', 'philosophy', 'history', 'literature', 'archaeology',
    'art history', 'cultural studies',
  ],
  'environmental-science': [
    '환경과학', '기후변화', '생태', '지구과학', '해양학', '대기과학',
    '지질학', '수자원', '환경공학', '탄소중립', '신재생에너지',
    '지속가능', 'ESG',
    'environmental', 'climate', 'ecology', 'geoscience', 'oceanography',
    'sustainability', 'renewable energy',
  ],
  'materials-science': [
    '재료과학', '나노재료', '금속공학', '세라믹', '복합재료', '바이오소재',
    '배터리', '에너지저장', '표면공학', '박막', '3D프린팅',
    'materials science', 'nanomaterials', 'battery', 'thin film',
    'biomaterials', 'composite', 'additive manufacturing',
  ],
  'neuroscience': [
    '뇌과학', '신경과학', '인지과학', '뇌영상', 'fMRI', 'EEG',
    '신경공학', '뇌-컴퓨터 인터페이스', 'BCI', '계산신경과학',
    '신경심리학', '신경생물학',
    'neuroscience', 'cognitive science', 'brain', 'neural',
    'neuroimaging', 'brain-computer interface', 'computational neuroscience',
  ],
  'interdisciplinary': [
    '융합', '학제간', '다학제', '바이오인포매틱스', '디지털휴먼',
    '메디컬AI', 'AI헬스', '에너지AI', '핀테크', '에듀테크',
    '디지털트윈', 'XR', '메타버스',
    'interdisciplinary', 'multidisciplinary', 'cross-disciplinary',
    'digital twin', 'fintech', 'edtech',
  ],
};

/** 기관/학과명 → 연구 분야 매핑 */
const INSTITUTION_FIELD_MAP: Record<string, ResearchField> = {
  '컴퓨터': 'computer-science',
  '소프트웨어': 'computer-science',
  '정보': 'computer-science',
  '전산': 'computer-science',
  'AI': 'artificial-intelligence',
  '인공지능': 'artificial-intelligence',
  '데이터사이언스': 'artificial-intelligence',
  '생물': 'biology',
  '생명': 'biology',
  '유전': 'biology',
  '의학': 'medicine',
  '의과': 'medicine',
  '약학': 'medicine',
  '간호': 'medicine',
  '물리': 'physics',
  '천문': 'physics',
  '화학': 'chemistry',
  '수학': 'mathematics',
  '통계': 'mathematics',
  '기계': 'engineering',
  '전기': 'engineering',
  '전자': 'engineering',
  '토목': 'engineering',
  '항공': 'engineering',
  '산업': 'engineering',
  '사회': 'social-sciences',
  '심리': 'social-sciences',
  '교육': 'social-sciences',
  '경제': 'economics',
  '경영': 'economics',
  '철학': 'humanities',
  '역사': 'humanities',
  '문학': 'humanities',
  '환경': 'environmental-science',
  '지구': 'environmental-science',
  '해양': 'environmental-science',
  '재료': 'materials-science',
  '나노': 'materials-science',
  '뇌': 'neuroscience',
  '신경': 'neuroscience',
  '인지': 'neuroscience',
};

/**
 * 연구자 정보를 기반으로 연구 분야를 자동 추론
 * 우선순위: researchField > department > researchInterests > position > institution
 */
export function inferCategory(user: {
  category?: string;
  researchField?: string;
  industry?: string;
  department?: string;
  keywords?: string[];
  researchInterests?: string[];
  position?: string;
  company?: string;
  institution?: string;
}): CategoryName {
  // 1. 이미 유효한 연구 분야가 있으면 그대로 사용
  const field = user.researchField || user.category;
  if (field && (CATEGORIES as readonly string[]).includes(field)) {
    return field as CategoryName;
  }

  // 2. department 기반 매핑
  const dept = user.department || user.industry;
  if (dept) {
    for (const [keyword, fieldName] of Object.entries(INSTITUTION_FIELD_MAP)) {
      if (dept.includes(keyword)) {
        return fieldName;
      }
    }
  }

  // 3. researchInterests/keywords 기반 스코어링
  const interests = user.researchInterests || user.keywords;
  if (interests && interests.length > 0) {
    const scores: Record<string, number> = {};

    for (const [cat, catKeywords] of Object.entries(CATEGORY_KEYWORDS)) {
      let score = 0;
      for (const userKw of interests) {
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

  // 5. institution 기반 추론
  const inst = user.institution || user.company;
  if (inst) {
    for (const [keyword, fieldName] of Object.entries(INSTITUTION_FIELD_MAP)) {
      if (inst.includes(keyword)) {
        return fieldName;
      }
    }
  }

  return 'other';
}

/** 연구 분야 색상 반환 */
export function getCategoryColor(field: string): string {
  return CATEGORY_COLORS[field] || CATEGORY_COLORS['other'];
}

/** 연구 분야 한국어 라벨 반환 */
export function getFieldLabel(field: string): string {
  return FIELD_LABELS[field as ResearchField] || '기타';
}
