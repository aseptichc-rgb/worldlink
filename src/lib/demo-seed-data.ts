// =============================================================================
// NODDED Demo Seed Data - 100명의 다양한 분야 가상 인물
// =============================================================================

import { ManagedGroupRole } from '@/types';

export interface DemoMember {
  id: string;
  name: string;
  company: string;
  position: string;
  bio: string;
  keywords: string[];
  category: string;
  email: string;
  phone: string;
  specialRole?: string | null;
}

export interface DemoGroupDef {
  name: string;
  description: string;
  color: string;
  icon: string;
  ownerIndex: number;
  memberIndices: number[];
  roles: Record<number, { role: ManagedGroupRole; title?: string }>;
}

// =============================================================================
// 카테고리 정의 및 인접 관계
// =============================================================================
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

// 카테고리 간 인접 관계 (자연스럽게 교류하는 분야)
const CATEGORY_ADJACENCY: Record<string, string[]> = {
  'IT/기술':         ['투자/금융', '교육/연구', '디자인/건축', '미디어/콘텐츠'],
  '투자/금융':       ['IT/기술', '헬스케어/바이오', '제조/에너지', 'F&B/라이프스타일'],
  '헬스케어/바이오':  ['투자/금융', '교육/연구', '법률/특허', '공공/정책'],
  '법률/특허':       ['헬스케어/바이오', 'IT/기술', '투자/금융'],
  '미디어/콘텐츠':   ['IT/기술', 'F&B/라이프스타일', '디자인/건축'],
  '교육/연구':       ['헬스케어/바이오', 'IT/기술', '공공/정책'],
  '제조/에너지':     ['투자/금융', '공공/정책', '교육/연구'],
  '공공/정책':       ['교육/연구', '헬스케어/바이오', '제조/에너지'],
  '디자인/건축':     ['IT/기술', '미디어/콘텐츠', 'F&B/라이프스타일'],
  'F&B/라이프스타일': ['투자/금융', '미디어/콘텐츠', '디자인/건축'],
};

// =============================================================================
// 100명 데모 멤버 데이터
// =============================================================================
export const DEMO_ACCOUNT_INDEX = 0; // 데모 계정은 첫 번째 (투자/금융 카테고리)

export const DEMO_MEMBERS: DemoMember[] = [
  // =========================================================================
  // 투자/금융 (10명) - 인덱스 0~9
  // =========================================================================
  { id: 'demo_1', name: '김도현', company: '넥서스벤처스', position: '대표파트너', bio: '다양한 산업 분야의 혁신 기업에 투자하고 비즈니스 네트워크를 연결하는 벤처캐피탈입니다.', keywords: ['투자', 'VC', '스타트업', '네트워킹', '비즈니스'], category: '투자/금융', email: 'demo@nodded.app', phone: '010-0000-0000', specialRole: null },
  { id: 'demo_2', name: '박서준', company: '한강인베스트먼트', position: 'PE 심사역', bio: '중견기업 바이아웃 및 성장투자를 전문으로 하는 사모펀드입니다.', keywords: ['PE', '바이아웃', '성장투자', '중견기업'], category: '투자/금융', email: 'demo2@nodded.app', phone: '010-0000-0002', specialRole: null },
  { id: 'demo_3', name: '이지은', company: '시드파트너스', position: '엔젤투자자', bio: '초기 스타트업에 투자하며 창업 멘토링을 병행하는 시리얼 엔젤입니다.', keywords: ['엔젤투자', '시드', '멘토링', '초기투자'], category: '투자/금융', email: 'demo3@nodded.app', phone: '010-0000-0003', specialRole: null },
  { id: 'demo_4', name: '정우성', company: '신한은행', position: 'IB본부 상무', bio: '기업금융 및 투자은행 업무를 총괄하는 은행 임원입니다.', keywords: ['은행', 'IB', '기업금융', 'M&A'], category: '투자/금융', email: 'demo4@nodded.app', phone: '010-0000-0004', specialRole: null },
  { id: 'demo_5', name: '한소희', company: '페이브릿지', position: '대표', bio: '블록체인 기반 결제 인프라를 구축하는 핀테크 스타트업입니다.', keywords: ['핀테크', '블록체인', '결제', '인프라'], category: '투자/금융', email: 'demo5@nodded.app', phone: '010-0000-0005', specialRole: null },
  { id: 'demo_6', name: '최민호', company: 'KB증권', position: '리서치센터 이사', bio: '테크 섹터 분석 및 투자전략을 수립하는 증권사 이사입니다.', keywords: ['증권', '리서치', '투자전략', '테크분석'], category: '투자/금융', email: 'demo6@nodded.app', phone: '010-0000-0006', specialRole: null },
  { id: 'demo_7', name: '윤세아', company: '미래에셋자산운용', position: '펀드매니저', bio: '글로벌 테크 펀드를 운용하는 자산운용 전문가입니다.', keywords: ['자산운용', '글로벌펀드', '테크투자', '포트폴리오'], category: '투자/금융', email: 'demo7@nodded.app', phone: '010-0000-0007', specialRole: null },
  { id: 'demo_8', name: '강태준', company: '스파크랩', position: '대표', bio: '글로벌 액셀러레이터로 초기 스타트업의 성장을 지원합니다.', keywords: ['액셀러레이터', '글로벌', '스타트업', '성장지원'], category: '투자/금융', email: 'demo8@nodded.app', phone: '010-0000-0008', specialRole: null },
  { id: 'demo_9', name: '임수진', company: '와디즈', position: '투자사업부 이사', bio: '크라우드펀딩 플랫폼을 통한 혁신 프로젝트 투자를 이끌고 있습니다.', keywords: ['크라우드펀딩', '플랫폼', '투자', '혁신'], category: '투자/금융', email: 'demo9@nodded.app', phone: '010-0000-0009', specialRole: null },
  { id: 'demo_10', name: '서동욱', company: '한국벤처금융', position: '벤처금융 이사', bio: '벤처기업 대출 및 보증 프로그램을 통해 스타트업 성장을 돕습니다.', keywords: ['벤처금융', '대출', '보증', '성장지원'], category: '투자/금융', email: 'demo10@nodded.app', phone: '010-0000-0010', specialRole: null },

  // =========================================================================
  // IT/기술 (10명) - 인덱스 10~19
  // =========================================================================
  { id: 'demo_11', name: '장현우', company: '딥마인드코리아', position: 'AI연구소장', bio: '자연어 처리 및 멀티모달 AI 연구를 이끌고 있습니다.', keywords: ['AI', '딥러닝', 'NLP', '멀티모달', '연구'], category: 'IT/기술', email: 'demo11@nodded.app', phone: '010-0000-0011', specialRole: null },
  { id: 'demo_12', name: '김나연', company: '클라우드웨이브', position: '클라우드 아키텍트', bio: '엔터프라이즈 클라우드 마이그레이션 및 인프라 설계 전문가입니다.', keywords: ['클라우드', 'AWS', '인프라', '마이그레이션'], category: 'IT/기술', email: 'demo12@nodded.app', phone: '010-0000-0012', specialRole: null },
  { id: 'demo_13', name: '오준혁', company: '체인링크코리아', position: 'CTO', bio: '블록체인 오라클 네트워크 및 Web3 인프라를 개발합니다.', keywords: ['블록체인', 'Web3', '오라클', '스마트컨트랙트'], category: 'IT/기술', email: 'demo13@nodded.app', phone: '010-0000-0013', specialRole: null },
  { id: 'demo_14', name: '배수진', company: '시큐어넥스', position: '사이버보안 팀장', bio: '기업 보안 컨설팅 및 침투 테스트 전문 보안 기업입니다.', keywords: ['사이버보안', '침투테스트', '보안컨설팅', 'ISMS'], category: 'IT/기술', email: 'demo14@nodded.app', phone: '010-0000-0014', specialRole: null },
  { id: 'demo_15', name: '류승민', company: '데이터릭스', position: '수석 데이터사이언티스트', bio: '대규모 데이터 분석 및 ML 파이프라인 구축 전문가입니다.', keywords: ['데이터사이언스', 'ML', '빅데이터', '분석'], category: 'IT/기술', email: 'demo15@nodded.app', phone: '010-0000-0015', specialRole: null },
  { id: 'demo_16', name: '송지원', company: '코드스테이츠', position: 'SW개발 리드', bio: '풀스택 개발 및 개발자 교육 플랫폼을 운영합니다.', keywords: ['풀스택', '개발교육', '플랫폼', 'React'], category: 'IT/기술', email: 'demo16@nodded.app', phone: '010-0000-0016', specialRole: null },
  { id: 'demo_17', name: '조민재', company: '씽스플로우', position: 'IoT 사업부 대표', bio: 'IoT 센서 및 스마트 디바이스 솔루션을 개발하는 기업입니다.', keywords: ['IoT', '센서', '스마트디바이스', '임베디드'], category: 'IT/기술', email: 'demo17@nodded.app', phone: '010-0000-0017', specialRole: null },
  { id: 'demo_18', name: '허연주', company: '인프라닉스', position: 'DevOps 리드', bio: '클라우드 네이티브 DevOps 및 CI/CD 파이프라인 자동화 전문가입니다.', keywords: ['DevOps', 'CI/CD', '쿠버네티스', '자동화'], category: 'IT/기술', email: 'demo18@nodded.app', phone: '010-0000-0018', specialRole: null },
  { id: 'demo_19', name: '남기현', company: '토스페이먼츠', position: '시니어 개발자', bio: '대규모 결제 시스템의 백엔드 아키텍처를 설계합니다.', keywords: ['핀테크', '결제시스템', '백엔드', '대규모트래픽'], category: 'IT/기술', email: 'demo19@nodded.app', phone: '010-0000-0019', specialRole: null },
  { id: 'demo_20', name: '이하은', company: '프로덕트랩', position: 'PM/PO', bio: 'SaaS 제품의 기획부터 론칭까지 전 과정을 리드하는 프로덕트 매니저입니다.', keywords: ['프로덕트', 'SaaS', '기획', 'UX리서치'], category: 'IT/기술', email: 'demo20@nodded.app', phone: '010-0000-0020', specialRole: null },

  // =========================================================================
  // 헬스케어/바이오 (10명) - 인덱스 20~29
  // =========================================================================
  { id: 'demo_21', name: '박지영', company: '서울대학교병원', position: '내과 교수', bio: '면역학 및 감염내과 전문의로 임상 연구를 이끌고 있습니다.', keywords: ['대학병원', '면역학', '감염내과', '임상연구'], category: '헬스케어/바이오', email: 'demo21@nodded.app', phone: '010-0000-0021', specialRole: null },
  { id: 'demo_22', name: '김태윤', company: '셀트리온헬스케어', position: '바이오사업부 상무', bio: '바이오시밀러 글로벌 마케팅 및 사업개발을 담당합니다.', keywords: ['바이오시밀러', '글로벌', '사업개발', '제약'], category: '헬스케어/바이오', email: 'demo22@nodded.app', phone: '010-0000-0022', specialRole: null },
  { id: 'demo_23', name: '정예린', company: '진메디신', position: '연구소장', bio: 'RNA 기반 차세대 치료제를 연구 개발하는 바이오텍 기업입니다.', keywords: ['RNA', '신약개발', '바이오텍', '유전자치료'], category: '헬스케어/바이오', email: 'demo23@nodded.app', phone: '010-0000-0023', specialRole: null },
  { id: 'demo_24', name: '이준호', company: '라이프시맨틱스', position: '대표', bio: '의료 데이터 표준화 및 디지털 헬스 플랫폼을 운영합니다.', keywords: ['디지털헬스', '의료데이터', 'FHIR', '플랫폼'], category: '헬스케어/바이오', email: 'demo24@nodded.app', phone: '010-0000-0024', specialRole: null },
  { id: 'demo_25', name: '최수빈', company: '뷰노', position: '부사장', bio: 'AI 의료영상 진단 솔루션으로 글로벌 시장을 개척하고 있습니다.', keywords: ['AI', '의료영상', '진단', 'FDA'], category: '헬스케어/바이오', email: 'demo25@nodded.app', phone: '010-0000-0025', specialRole: null },
  { id: 'demo_26', name: '안정현', company: '닥터나우', position: 'CTO', bio: '원격진료 플랫폼의 기술 개발 및 운영을 총괄합니다.', keywords: ['원격의료', '텔레메디슨', '플랫폼', '헬스테크'], category: '헬스케어/바이오', email: 'demo26@nodded.app', phone: '010-0000-0026', specialRole: null },
  { id: 'demo_27', name: '유민서', company: '한미약품', position: '신약개발 이사', bio: '글로벌 기술수출 실적을 보유한 제약사의 신약 파이프라인을 관리합니다.', keywords: ['신약개발', '기술수출', '제약', '임상시험'], category: '헬스케어/바이오', email: 'demo27@nodded.app', phone: '010-0000-0027', specialRole: null },
  { id: 'demo_28', name: '권혁재', company: '메디팜CRO', position: '대표', bio: '임상시험 수탁기관으로 글로벌 임상 관리 서비스를 제공합니다.', keywords: ['CRO', '임상시험', '글로벌', '규제'], category: '헬스케어/바이오', email: 'demo28@nodded.app', phone: '010-0000-0028', specialRole: null },
  { id: 'demo_29', name: '신하린', company: '지노믹트리', position: '정밀의료 연구원', bio: '유전체 분석 기반 정밀의료 진단 기술을 연구합니다.', keywords: ['정밀의료', '유전체', '진단', '바이오마커'], category: '헬스케어/바이오', email: 'demo29@nodded.app', phone: '010-0000-0029', specialRole: null },
  { id: 'demo_30', name: '문성호', company: '자생한방병원', position: '원장', bio: '한방 치료와 현대 의학을 접목한 통합의료를 실천합니다.', keywords: ['한방', '통합의료', '비수술', '척추'], category: '헬스케어/바이오', email: 'demo30@nodded.app', phone: '010-0000-0030', specialRole: null },

  // =========================================================================
  // 법률/특허 (10명) - 인덱스 30~39
  // =========================================================================
  { id: 'demo_31', name: '황민지', company: '법무법인 율촌', position: '파트너 변호사', bio: '기업 M&A 및 사모펀드 투자 자문을 전문으로 합니다.', keywords: ['M&A', '기업법무', '투자자문', 'PE'], category: '법률/특허', email: 'demo31@nodded.app', phone: '010-0000-0031', specialRole: null },
  { id: 'demo_32', name: '조현준', company: '특허법인 아이피큐브', position: 'AI 특허 변리사', bio: 'AI 및 소프트웨어 분야의 특허 출원·등록을 전문으로 합니다.', keywords: ['특허', 'AI특허', 'SW', '지식재산권'], category: '법률/특허', email: 'demo32@nodded.app', phone: '010-0000-0032', specialRole: null },
  { id: 'demo_33', name: '나영은', company: '법무법인 세종', position: '시니어 변호사', bio: 'M&A 및 기업 구조조정 분야의 전문 변호사입니다.', keywords: ['M&A', '구조조정', '기업법', '금융규제'], category: '법률/특허', email: 'demo33@nodded.app', phone: '010-0000-0033', specialRole: null },
  { id: 'demo_34', name: '김재혁', company: '노무법인 정의', position: '공인노무사', bio: '스타트업 및 IT기업의 노동 관련 법률 자문을 전문으로 합니다.', keywords: ['노동법', '노무', '스타트업', '인사'], category: '법률/특허', email: 'demo34@nodded.app', phone: '010-0000-0034', specialRole: null },
  { id: 'demo_35', name: '이소율', company: '법률사무소 이노', position: '스타트업 법률자문', bio: '스타트업의 설립부터 투자유치까지 법률 자문을 제공합니다.', keywords: ['스타트업', '법률자문', '투자계약', '회사법'], category: '법률/특허', email: 'demo35@nodded.app', phone: '010-0000-0035', specialRole: null },
  { id: 'demo_36', name: '백승환', company: '특허법인 넥스트', position: '바이오 변리사', bio: '바이오·제약 분야의 특허 소송 및 권리화를 전담합니다.', keywords: ['특허소송', '바이오특허', '변리사', '기술이전'], category: '법률/특허', email: 'demo36@nodded.app', phone: '010-0000-0036', specialRole: null },
  { id: 'demo_37', name: '오세연', company: 'KISTA 기술이전센터', position: '기술이전 전문위원', bio: '공공 연구성과의 기술이전 및 사업화를 지원합니다.', keywords: ['기술이전', '사업화', '라이선싱', '공공연구'], category: '법률/특허', email: 'demo37@nodded.app', phone: '010-0000-0037', specialRole: null },
  { id: 'demo_38', name: '정다은', company: '법무법인 메디로', position: '의료법 변호사', bio: '의료 분쟁 및 헬스케어 규제 분야 전문 변호사입니다.', keywords: ['의료법', '의료분쟁', '규제', '헬스케어'], category: '법률/특허', email: 'demo38@nodded.app', phone: '010-0000-0038', specialRole: null },
  { id: 'demo_39', name: '구본혁', company: '법무법인 공정', position: '공정거래 변호사', bio: '공정거래 및 소비자보호 분야 소송과 자문을 전문으로 합니다.', keywords: ['공정거래', '소비자보호', '경쟁법', '규제'], category: '법률/특허', email: 'demo39@nodded.app', phone: '010-0000-0039', specialRole: null },
  { id: 'demo_40', name: '장유진', company: '법무법인 글로벌파트너스', position: '해외법무 변호사', bio: '해외 진출 기업의 국제 거래 및 분쟁 해결을 자문합니다.', keywords: ['국제법', '해외진출', '통상', '분쟁해결'], category: '법률/특허', email: 'demo40@nodded.app', phone: '010-0000-0040', specialRole: null },

  // =========================================================================
  // 미디어/콘텐츠 (10명) - 인덱스 40~49
  // =========================================================================
  { id: 'demo_41', name: '한지민', company: '브릿지마케팅', position: '대표', bio: '데이터 기반 디지털 마케팅 전략을 수립하는 에이전시입니다.', keywords: ['디지털마케팅', '퍼포먼스', '데이터', '전략'], category: '미디어/콘텐츠', email: 'demo41@nodded.app', phone: '010-0000-0041', specialRole: null },
  { id: 'demo_42', name: '류현진', company: 'CJ ENM', position: '콘텐츠PD', bio: '오리지널 시리즈 및 다큐멘터리 콘텐츠를 기획 제작합니다.', keywords: ['콘텐츠', 'OTT', '기획', '제작'], category: '미디어/콘텐츠', email: 'demo42@nodded.app', phone: '010-0000-0042', specialRole: null },
  { id: 'demo_43', name: '전소미', company: '브랜드플레이', position: '브랜딩 디렉터', bio: '스타트업과 중견기업의 브랜드 전략 및 아이덴티티를 설계합니다.', keywords: ['브랜딩', 'BI', '전략', '아이덴티티'], category: '미디어/콘텐츠', email: 'demo43@nodded.app', phone: '010-0000-0043', specialRole: null },
  { id: 'demo_44', name: '이광수', company: '프레임PR', position: 'PR에이전시 대표', bio: '테크 기업 전문 PR 및 위기관리 커뮤니케이션을 제공합니다.', keywords: ['PR', '위기관리', '커뮤니케이션', '테크'], category: '미디어/콘텐츠', email: 'demo44@nodded.app', phone: '010-0000-0044', specialRole: null },
  { id: 'demo_45', name: '윤보라', company: '다이아TV', position: 'MCN사업 이사', bio: '크리에이터 매니지먼트 및 콘텐츠 커머스를 운영합니다.', keywords: ['MCN', '크리에이터', '유튜브', '콘텐츠커머스'], category: '미디어/콘텐츠', email: 'demo45@nodded.app', phone: '010-0000-0045', specialRole: null },
  { id: 'demo_46', name: '차승원', company: '이노션월드와이드', position: '크리에이티브 디렉터', bio: '글로벌 브랜드 광고 캠페인의 크리에이티브를 총괄합니다.', keywords: ['광고', '캠페인', '크리에이티브', '글로벌'], category: '미디어/콘텐츠', email: 'demo46@nodded.app', phone: '010-0000-0046', specialRole: null },
  { id: 'demo_47', name: '김유정', company: '넥슨코리아', position: '게임기획 PD', bio: '대규모 온라인 게임의 기획 및 라이브 서비스를 총괄합니다.', keywords: ['게임', '기획', 'MMORPG', '라이브서비스'], category: '미디어/콘텐츠', email: 'demo47@nodded.app', phone: '010-0000-0047', specialRole: null },
  { id: 'demo_48', name: '박보검', company: '민음사', position: '편집장', bio: '인문·사회 분야 양서 출판 및 디지털 콘텐츠 사업을 이끕니다.', keywords: ['출판', '편집', '인문', '디지털콘텐츠'], category: '미디어/콘텐츠', email: 'demo48@nodded.app', phone: '010-0000-0048', specialRole: null },
  { id: 'demo_49', name: '강다니엘', company: '소셜비', position: 'SNS마케팅 대표', bio: '인스타그램·틱톡 중심의 소셜 미디어 마케팅 전문 에이전시입니다.', keywords: ['SNS', '인스타그램', '틱톡', '인플루언서'], category: '미디어/콘텐츠', email: 'demo49@nodded.app', phone: '010-0000-0049', specialRole: null },
  { id: 'demo_50', name: '이서진', company: '아트비전', position: '미디어아트 감독', bio: '기술과 예술을 융합한 인터랙티브 미디어아트를 제작합니다.', keywords: ['미디어아트', '인터랙티브', '전시', '기술융합'], category: '미디어/콘텐츠', email: 'demo50@nodded.app', phone: '010-0000-0050', specialRole: null },

  // =========================================================================
  // 교육/연구 (10명) - 인덱스 50~59
  // =========================================================================
  { id: 'demo_51', name: '양현석', company: 'KAIST', position: 'AI학과 교수', bio: '강화학습 및 자연어 처리 분야의 세계적인 연구자입니다.', keywords: ['AI', '강화학습', 'NLP', 'KAIST'], category: '교육/연구', email: 'demo51@nodded.app', phone: '010-0000-0051', specialRole: null },
  { id: 'demo_52', name: '조은비', company: '서울대학교', position: '데이터사이언스 연구교수', bio: '의료 빅데이터 분석 및 예측 모델 연구를 수행합니다.', keywords: ['데이터사이언스', '빅데이터', '예측모델', '서울대'], category: '교육/연구', email: 'demo52@nodded.app', phone: '010-0000-0052', specialRole: null },
  { id: 'demo_53', name: '문정혁', company: '클래스101', position: '교육테크 대표', bio: '크리에이터 이코노미 기반의 온라인 교육 플랫폼입니다.', keywords: ['에듀테크', '온라인교육', '크리에이터', '플랫폼'], category: '교육/연구', email: 'demo53@nodded.app', phone: '010-0000-0053', specialRole: null },
  { id: 'demo_54', name: '한재경', company: '한국직업능력연구원', position: '원장', bio: '국가 직업교육 정책 수립 및 인적자원개발 연구를 총괄합니다.', keywords: ['직업교육', '인적자원', '정책연구', '국가기관'], category: '교육/연구', email: 'demo54@nodded.app', phone: '010-0000-0054', specialRole: null },
  { id: 'demo_55', name: '신우진', company: '한국전자통신연구원(ETRI)', position: 'AI연구소장', bio: 'AI 핵심 원천기술 개발 및 산업 적용 연구를 이끕니다.', keywords: ['ETRI', 'AI', '원천기술', '산업적용'], category: '교육/연구', email: 'demo55@nodded.app', phone: '010-0000-0055', specialRole: null },
  { id: 'demo_56', name: '이채원', company: 'KIST', position: '뇌과학연구 선임연구원', bio: '뇌-컴퓨터 인터페이스 및 인지과학 연구를 수행합니다.', keywords: ['뇌과학', 'BCI', '인지과학', 'KIST'], category: '교육/연구', email: 'demo56@nodded.app', phone: '010-0000-0056', specialRole: null },
  { id: 'demo_57', name: '고영민', company: '엘리스', position: '교육콘텐츠 대표', bio: 'AI 기반 맞춤형 코딩 교육 플랫폼을 운영합니다.', keywords: ['AI교육', '코딩', '맞춤형학습', '에듀테크'], category: '교육/연구', email: 'demo57@nodded.app', phone: '010-0000-0057', specialRole: null },
  { id: 'demo_58', name: '정수민', company: '연세대학교', position: '산학협력처장', bio: '대학의 연구성과를 산업으로 연결하는 기술사업화를 총괄합니다.', keywords: ['산학협력', '기술사업화', '연세대', '대학연구'], category: '교육/연구', email: 'demo58@nodded.app', phone: '010-0000-0058', specialRole: null },
  { id: 'demo_59', name: '배진영', company: 'R&D컨설팅그룹', position: 'R&D 컨설턴트', bio: '국책 R&D 과제 기획 및 연구 관리 컨설팅을 제공합니다.', keywords: ['R&D', '국책과제', '연구관리', '컨설팅'], category: '교육/연구', email: 'demo59@nodded.app', phone: '010-0000-0059', specialRole: null },
  { id: 'demo_60', name: '홍서윤', company: '한국과학기술기획평가원(KISTEP)', position: '연구위원', bio: '국가 과학기술 혁신 전략 및 예산 배분 연구를 수행합니다.', keywords: ['과학기술정책', '혁신전략', 'KISTEP', '예산'], category: '교육/연구', email: 'demo60@nodded.app', phone: '010-0000-0060', specialRole: null },

  // =========================================================================
  // 제조/에너지 (10명) - 인덱스 60~69
  // =========================================================================
  { id: 'demo_61', name: '김진우', company: '스마트팩토리솔루션즈', position: '대표', bio: '제조업 디지털 전환 및 스마트공장 구축 전문 기업입니다.', keywords: ['스마트팩토리', '디지털전환', '제조', 'MES'], category: '제조/에너지', email: 'demo61@nodded.app', phone: '010-0000-0061', specialRole: null },
  { id: 'demo_62', name: '박소현', company: '한화에너지', position: '신재생에너지 이사', bio: '태양광·풍력 등 신재생에너지 사업 개발 및 운영을 총괄합니다.', keywords: ['신재생에너지', '태양광', '풍력', 'ESG'], category: '제조/에너지', email: 'demo62@nodded.app', phone: '010-0000-0062', specialRole: null },
  { id: 'demo_63', name: '이동훈', company: '세메스', position: '반도체장비 CTO', bio: '차세대 반도체 공정장비의 연구개발을 총괄합니다.', keywords: ['반도체', '장비', 'R&D', '공정기술'], category: '제조/에너지', email: 'demo63@nodded.app', phone: '010-0000-0063', specialRole: null },
  { id: 'demo_64', name: '최윤정', company: '만도', position: '자동차부품 대표', bio: '자율주행 핵심 부품 및 전동화 파워트레인을 개발합니다.', keywords: ['자동차부품', '자율주행', '전동화', 'ADAS'], category: '제조/에너지', email: 'demo64@nodded.app', phone: '010-0000-0064', specialRole: null },
  { id: 'demo_65', name: '강승호', company: '로보티즈', position: '로봇연구 팀장', bio: '서비스 로봇 및 산업용 협동 로봇을 연구 개발합니다.', keywords: ['로봇', '협동로봇', '자동화', '서비스로봇'], category: '제조/에너지', email: 'demo65@nodded.app', phone: '010-0000-0065', specialRole: null },
  { id: 'demo_66', name: '임혜진', company: '롯데케미칼', position: '첨단소재연구소장', bio: '바이오 플라스틱 및 고기능성 화학소재를 연구합니다.', keywords: ['화학소재', '바이오플라스틱', '연구개발', '친환경'], category: '제조/에너지', email: 'demo66@nodded.app', phone: '010-0000-0066', specialRole: null },
  { id: 'demo_67', name: '서준혁', company: '에코프로비엠', position: '대표', bio: '2차전지 양극재 전문 기업으로 글로벌 배터리 공급망의 핵심입니다.', keywords: ['2차전지', '양극재', '배터리', '전기차'], category: '제조/에너지', email: 'demo67@nodded.app', phone: '010-0000-0067', specialRole: null },
  { id: 'demo_68', name: '오승민', company: '에코솔루션', position: '환경기술 대표', bio: '산업 폐수 처리 및 대기오염 저감 기술을 개발합니다.', keywords: ['환경기술', '폐수처리', '대기', '친환경'], category: '제조/에너지', email: 'demo68@nodded.app', phone: '010-0000-0068', specialRole: null },
  { id: 'demo_69', name: '유태영', company: 'HD현대중공업', position: '조선기자재 이사', bio: 'LNG선 및 차세대 친환경 선박 건조 기술을 이끕니다.', keywords: ['조선', 'LNG', '친환경선박', '해양'], category: '제조/에너지', email: 'demo69@nodded.app', phone: '010-0000-0069', specialRole: null },
  { id: 'demo_70', name: '전지현', company: '3D시스템즈코리아', position: '3D프린팅 대표', bio: '금속·폴리머 3D프린팅 솔루션으로 제조 혁신을 이끕니다.', keywords: ['3D프린팅', '적층제조', '금속', '프로토타이핑'], category: '제조/에너지', email: 'demo70@nodded.app', phone: '010-0000-0070', specialRole: null },

  // =========================================================================
  // 공공/정책 (10명) - 인덱스 70~79
  // =========================================================================
  { id: 'demo_71', name: '김상우', company: '과학기술정보통신부', position: 'AI정책과장', bio: '국가 AI 전략 수립 및 디지털 혁신 정책을 담당합니다.', keywords: ['AI정책', '디지털혁신', '과기부', '국가전략'], category: '공공/정책', email: 'demo71@nodded.app', phone: '010-0000-0071', specialRole: null },
  { id: 'demo_72', name: '이민아', company: '중소벤처기업부', position: '창업정책 사무관', bio: '스타트업 생태계 활성화 및 창업 지원 정책을 기획합니다.', keywords: ['창업정책', '스타트업', '중기부', '생태계'], category: '공공/정책', email: 'demo72@nodded.app', phone: '010-0000-0072', specialRole: null },
  { id: 'demo_73', name: '박현수', company: '한국정보화진흥원(NIA)', position: '연구위원', bio: '디지털 정부 및 공공데이터 활용 전략을 연구합니다.', keywords: ['디지털정부', '공공데이터', 'NIA', '정보화'], category: '공공/정책', email: 'demo73@nodded.app', phone: '010-0000-0073', specialRole: null },
  { id: 'demo_74', name: '최은서', company: '서울특별시', position: '스마트시티 혁신담당', bio: '서울시 스마트시티 프로젝트 및 디지털 트윈 사업을 추진합니다.', keywords: ['스마트시티', '디지털트윈', '지자체', '도시혁신'], category: '공공/정책', email: 'demo74@nodded.app', phone: '010-0000-0074', specialRole: null },
  { id: 'demo_75', name: '정태훈', company: '한국데이터산업진흥원', position: '데이터센터장', bio: '공공·민간 데이터 거래 및 활용 생태계를 조성합니다.', keywords: ['데이터', '데이터거래', '공공데이터', '생태계'], category: '공공/정책', email: 'demo75@nodded.app', phone: '010-0000-0075', specialRole: null },
  { id: 'demo_76', name: '노은주', company: '규제혁신위원회', position: '규제샌드박스 심의관', bio: '혁신 기술·서비스의 규제 특례 심사 및 승인을 담당합니다.', keywords: ['규제샌드박스', '규제혁신', '특례', '심의'], category: '공공/정책', email: 'demo76@nodded.app', phone: '010-0000-0076', specialRole: null },
  { id: 'demo_77', name: '강민성', company: '기술보증기금', position: '기술평가 팀장', bio: '기술 기반 스타트업의 기술 가치 평가 및 보증을 담당합니다.', keywords: ['기술보증', '기술평가', '스타트업', '보증기금'], category: '공공/정책', email: 'demo77@nodded.app', phone: '010-0000-0077', specialRole: null },
  { id: 'demo_78', name: '윤서영', company: '한국무역협회', position: '통상전략 부장', bio: '수출 기업 지원 및 통상 환경 분석 업무를 수행합니다.', keywords: ['무역', '통상', '수출', '무역협회'], category: '공공/정책', email: 'demo78@nodded.app', phone: '010-0000-0078', specialRole: null },
  { id: 'demo_79', name: '도현빈', company: '산업연구원(KIET)', position: '산업전략 연구위원', bio: '국가 산업 경쟁력 분석 및 미래 성장산업 전략을 연구합니다.', keywords: ['산업전략', 'KIET', '경쟁력', '성장산업'], category: '공공/정책', email: 'demo79@nodded.app', phone: '010-0000-0079', specialRole: null },
  { id: 'demo_80', name: '신지호', company: '국회', position: '과학기술 정책보좌관', bio: '과학기술 관련 입법 및 정책 대안을 연구·자문합니다.', keywords: ['국회', '입법', '과학기술', '정책보좌'], category: '공공/정책', email: 'demo80@nodded.app', phone: '010-0000-0080', specialRole: null },

  // =========================================================================
  // 디자인/건축 (10명) - 인덱스 80~89
  // =========================================================================
  { id: 'demo_81', name: '김하늘', company: 'UX스튜디오', position: 'UX디자인 대표', bio: '사용자 경험 중심의 디지털 프로덕트 디자인 에이전시입니다.', keywords: ['UX', 'UI', '프로덕트디자인', '사용자경험'], category: '디자인/건축', email: 'demo81@nodded.app', phone: '010-0000-0081', specialRole: null },
  { id: 'demo_82', name: '이준서', company: '건축사사무소 공간', position: '소장', bio: '친환경 건축 및 리노베이션 프로젝트를 전문으로 합니다.', keywords: ['건축', '친환경', '리노베이션', '설계'], category: '디자인/건축', email: 'demo82@nodded.app', phone: '010-0000-0082', specialRole: null },
  { id: 'demo_83', name: '윤예진', company: '삼성디자인경영센터', position: '산업디자인 이사', bio: '삼성전자 제품의 산업 디자인 전략을 수립합니다.', keywords: ['산업디자인', '제품디자인', '디자인전략', '삼성'], category: '디자인/건축', email: 'demo83@nodded.app', phone: '010-0000-0083', specialRole: null },
  { id: 'demo_84', name: '권태민', company: '스페이스랩', position: '인테리어 디렉터', bio: '상업공간 및 오피스 인테리어 디자인을 전문으로 합니다.', keywords: ['인테리어', '상업공간', '오피스', '공간디자인'], category: '디자인/건축', email: 'demo84@nodded.app', phone: '010-0000-0084', specialRole: null },
  { id: 'demo_85', name: '장서연', company: '펜타브리드', position: '브랜드디자인 실장', bio: '브랜드 아이덴티티 및 패키지 디자인을 전문으로 합니다.', keywords: ['브랜드디자인', '패키지', 'BI', '시각디자인'], category: '디자인/건축', email: 'demo85@nodded.app', phone: '010-0000-0085', specialRole: null },
  { id: 'demo_86', name: '홍재민', company: '해안건축', position: '도시설계 파트너', bio: '대규모 복합개발 및 도시 재생 프로젝트를 설계합니다.', keywords: ['도시설계', '복합개발', '도시재생', '마스터플랜'], category: '디자인/건축', email: 'demo86@nodded.app', phone: '010-0000-0086', specialRole: null },
  { id: 'demo_87', name: '문소율', company: '디자인파크', position: '제품디자인 대표', bio: '생활가전 및 전자기기의 제품 디자인을 전문으로 합니다.', keywords: ['제품디자인', '생활가전', 'CMF', '디자인씽킹'], category: '디자인/건축', email: 'demo87@nodded.app', phone: '010-0000-0087', specialRole: null },
  { id: 'demo_88', name: '최하영', company: '로우파티션', position: '공간디자인 팀장', bio: '전시 공간 및 팝업 스토어의 공간 기획·디자인을 합니다.', keywords: ['공간디자인', '전시', '팝업스토어', '공간기획'], category: '디자인/건축', email: 'demo88@nodded.app', phone: '010-0000-0088', specialRole: null },
  { id: 'demo_89', name: '조윤호', company: '플러스엑스', position: '그래픽디자인 CD', bio: '모션그래픽 및 비주얼 아이덴티티 디자인을 총괄합니다.', keywords: ['그래픽디자인', '모션그래픽', 'VI', '비주얼'], category: '디자인/건축', email: 'demo89@nodded.app', phone: '010-0000-0089', specialRole: null },
  { id: 'demo_90', name: '배지우', company: '가든스튜디오', position: '환경디자인 소장', bio: '조경 및 친환경 외부 공간 디자인을 전문으로 합니다.', keywords: ['조경', '환경디자인', '친환경', '외부공간'], category: '디자인/건축', email: 'demo90@nodded.app', phone: '010-0000-0090', specialRole: null },

  // =========================================================================
  // F&B/라이프스타일 (10명) - 인덱스 90~99
  // =========================================================================
  { id: 'demo_91', name: '송민기', company: '배달의민족', position: '프랜차이즈사업 대표', bio: '배민을 통한 외식 프랜차이즈 컨설팅 및 사업 확장을 이끕니다.', keywords: ['프랜차이즈', '외식', '배달', '플랫폼'], category: 'F&B/라이프스타일', email: 'demo91@nodded.app', phone: '010-0000-0091', specialRole: null },
  { id: 'demo_92', name: '이가은', company: '누비랩', position: '식품테크 CTO', bio: 'AI 기반 식품 인식 기술로 급식 잔반 관리 솔루션을 개발합니다.', keywords: ['푸드테크', 'AI', '식품인식', '지속가능'], category: 'F&B/라이프스타일', email: 'demo92@nodded.app', phone: '010-0000-0092', specialRole: null },
  { id: 'demo_93', name: '황정민', company: '외식경영연구소', position: '외식컨설팅 대표', bio: '레스토랑 브랜딩 및 외식 사업 전략 컨설팅을 제공합니다.', keywords: ['외식', '컨설팅', '레스토랑', '브랜딩'], category: 'F&B/라이프스타일', email: 'demo93@nodded.app', phone: '010-0000-0093', specialRole: null },
  { id: 'demo_94', name: '나연수', company: '파라다이스호텔', position: '총지배인', bio: '럭셔리 호텔의 운영 및 호스피탈리티 서비스를 총괄합니다.', keywords: ['호텔', '호스피탈리티', '럭셔리', '서비스'], category: 'F&B/라이프스타일', email: 'demo94@nodded.app', phone: '010-0000-0094', specialRole: null },
  { id: 'demo_95', name: '유다인', company: '마인드풀라이프', position: '웰니스 브랜드 대표', bio: '명상·요가 기반 웰니스 프로그램 및 제품 브랜드를 운영합니다.', keywords: ['웰니스', '명상', '요가', '라이프스타일'], category: 'F&B/라이프스타일', email: 'demo95@nodded.app', phone: '010-0000-0095', specialRole: null },
  { id: 'demo_96', name: '권동혁', company: '와인앤모어', position: '와인수입 대표', bio: '유럽 프리미엄 와인 수입 및 와인 교육 사업을 운영합니다.', keywords: ['와인', '수입', '프리미엄', '교육'], category: 'F&B/라이프스타일', email: 'demo96@nodded.app', phone: '010-0000-0096', specialRole: null },
  { id: 'demo_97', name: '정유나', company: '프릳츠커피', position: '커피로스터리 대표', bio: '싱글 오리진 스페셜티 커피 로스팅 및 카페를 운영합니다.', keywords: ['커피', '로스터리', '스페셜티', '카페'], category: 'F&B/라이프스타일', email: 'demo97@nodded.app', phone: '010-0000-0097', specialRole: null },
  { id: 'demo_98', name: '박건우', company: '종근당건강', position: '건강식품 이사', bio: '프로바이오틱스 등 기능성 건강식품의 마케팅을 총괄합니다.', keywords: ['건강식품', '프로바이오틱스', '기능성', '마케팅'], category: 'F&B/라이프스타일', email: 'demo98@nodded.app', phone: '010-0000-0098', specialRole: null },
  { id: 'demo_99', name: '신지수', company: '무신사', position: '패션브랜드 디렉터', bio: '무신사 자체 브랜드의 기획 및 크리에이티브 방향을 설계합니다.', keywords: ['패션', '브랜드', '크리에이티브', 'D2C'], category: 'F&B/라이프스타일', email: 'demo99@nodded.app', phone: '010-0000-0099', specialRole: null },
  { id: 'demo_100', name: '조미래', company: '아모레퍼시픽', position: '뷰티테크 대표', bio: 'AI 기반 퍼스널 뷰티 진단 및 맞춤형 화장품 솔루션을 개발합니다.', keywords: ['뷰티테크', 'AI', '맞춤화장품', 'K뷰티'], category: 'F&B/라이프스타일', email: 'demo100@nodded.app', phone: '010-0000-0100', specialRole: null },
];

// =============================================================================
// 성별 분류 및 프로필 이미지 매핑
// =============================================================================
const MALE_IDS = new Set([
  'demo_1', 'demo_2', 'demo_4', 'demo_6', 'demo_8', 'demo_10',       // 투자/금융
  'demo_11', 'demo_13', 'demo_15', 'demo_17', 'demo_19',              // IT/기술
  'demo_22', 'demo_24', 'demo_26', 'demo_28', 'demo_30',              // 헬스케어/바이오
  'demo_32', 'demo_34', 'demo_36', 'demo_39',                         // 법률/특허
  'demo_42', 'demo_44', 'demo_46', 'demo_48', 'demo_49',              // 미디어/콘텐츠
  'demo_51', 'demo_53', 'demo_55', 'demo_57', 'demo_59',              // 교육/연구
  'demo_61', 'demo_63', 'demo_65', 'demo_67', 'demo_69',              // 제조/에너지
  'demo_71', 'demo_73', 'demo_75', 'demo_77', 'demo_79', 'demo_80',   // 공공/정책
  'demo_82', 'demo_84', 'demo_86', 'demo_89', 'demo_90',              // 디자인/건축
  'demo_91', 'demo_93', 'demo_96', 'demo_98',                         // F&B/라이프스타일
]);

const MALE_IMAGES = [
  'man_01', 'man_02', 'man_03', 'man_04', 'man_05',
  'man_06', 'man_07', 'man_08', 'man_09', 'man_10',
  'man_11', 'man_12', 'man_13', 'man_14', 'man_15',
  'man_16', 'man_17', 'man_18', 'man_19', 'man_20',
  'man_21', 'man_22', 'man_23', 'man_24', 'man_25',
  'man_27', 'man_28', 'man_29', 'man_30',
];

const FEMALE_IMAGES = [
  'woman_01', 'woman_02', 'woman_03', 'woman_04', 'woman_05',
  'woman_06', 'woman_07', 'woman_08', 'woman_09', 'woman_10',
  'woman_11', 'woman_12', 'woman_13', 'woman_14', 'woman_15',
  'woman_16', 'woman_17', 'woman_18', 'woman_19', 'woman_20',
  'woman_21', 'woman_22', 'woman_23', 'woman_24', 'woman_25',
  'woman_26', 'woman_27', 'woman_28', 'woman_29', 'woman_30',
  'woman_61',
];

// 멤버 ID → 프로필 이미지 경로 매핑 생성
const _profileImageMap = new Map<string, string>();
let _maleIdx = 0;
let _femaleIdx = 0;
for (const m of DEMO_MEMBERS) {
  if (MALE_IDS.has(m.id)) {
    _profileImageMap.set(m.id, `/faces/${MALE_IMAGES[_maleIdx % MALE_IMAGES.length]}.png`);
    _maleIdx++;
  } else {
    _profileImageMap.set(m.id, `/faces/${FEMALE_IMAGES[_femaleIdx % FEMALE_IMAGES.length]}.png`);
    _femaleIdx++;
  }
}

/** 데모 멤버 ID로 프로필 이미지 경로 반환 */
export const getDemoProfileImage = (id: string): string =>
  _profileImageMap.get(id) || '/faces/man_01.png';

/** 데모 멤버 이름으로 프로필 이미지 경로 반환 */
export const getDemoProfileImageByName = (name: string): string => {
  const member = DEMO_MEMBERS.find(m => m.name === name);
  return member ? getDemoProfileImage(member.id) : '/faces/man_01.png';
};

// =============================================================================
// 결정적 연결 생성 (Seeded PRNG)
// =============================================================================
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function generateDemoConnections(): [string, string][] {
  const rand = seededRandom(42);
  const pairs: [string, string][] = [];

  const membersByCategory: Record<string, number[]> = {};
  DEMO_MEMBERS.forEach((m, idx) => {
    if (!membersByCategory[m.category]) membersByCategory[m.category] = [];
    membersByCategory[m.category].push(idx);
  });

  const demoIdx = DEMO_ACCOUNT_INDEX;

  for (let i = 0; i < DEMO_MEMBERS.length; i++) {
    for (let j = i + 1; j < DEMO_MEMBERS.length; j++) {
      const catA = DEMO_MEMBERS[i].category;
      const catB = DEMO_MEMBERS[j].category;
      const isDemo = i === demoIdx || j === demoIdx;

      let prob: number;
      if (isDemo) {
        // 데모 계정은 같은 카테고리 95%, 인접 80%, 먼 카테고리 50%
        if (catA === catB) prob = 0.95;
        else if (CATEGORY_ADJACENCY[catA]?.includes(catB)) prob = 0.80;
        else prob = 0.50;
      } else if (catA === catB) {
        prob = 0.75;
      } else if (CATEGORY_ADJACENCY[catA]?.includes(catB)) {
        prob = 0.35;
      } else {
        prob = 0.12;
      }

      if (rand() < prob) {
        pairs.push([DEMO_MEMBERS[i].id, DEMO_MEMBERS[j].id]);
      }
    }
  }

  return pairs;
}

// 연결을 adjacency list 형태로 변환
export function buildConnectionMap(pairs: [string, string][]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const m of DEMO_MEMBERS) {
    map[m.id] = [];
  }
  for (const [a, b] of pairs) {
    if (map[a]) map[a].push(b);
    if (map[b]) map[b].push(a);
  }
  return map;
}

// =============================================================================
// 관리형 그룹 정의 (8개)
// =============================================================================
export const DEMO_GROUPS: DemoGroupDef[] = [
  {
    name: 'AI & 디지털 혁신 포럼',
    description: 'AI 기술의 산업 적용에 관심 있는 다양한 분야 전문가 모임입니다. 최신 AI 트렌드 공유와 협업 기회를 모색합니다.',
    color: '#58A6FF',
    icon: '🚀',
    ownerIndex: 0, // 김도현 (데모계정)
    memberIndices: [0, 11, 12, 15, 20, 24, 25, 51, 52, 55, 57, 65, 71, 81, 92],
    roles: {
      0: { role: 'admin' as ManagedGroupRole },
      11: { role: 'president' as ManagedGroupRole, title: '포럼 의장' },
      51: { role: 'executive' as ManagedGroupRole, title: '학술위원장' },
      55: { role: 'executive' as ManagedGroupRole, title: '기술자문' },
    },
  },
  {
    name: '스타트업 창업자 모임',
    description: '창업 경험을 공유하고 서로 도우며 성장하는 창업자 네트워크입니다.',
    color: '#FF6B8A',
    icon: '💡',
    ownerIndex: 8, // 강태준 (스파크랩)
    memberIndices: [0, 5, 8, 13, 16, 17, 24, 41, 53, 57, 81, 92],
    roles: {
      8: { role: 'admin' as ManagedGroupRole },
      0: { role: 'executive' as ManagedGroupRole, title: '투자멘토' },
      5: { role: 'president' as ManagedGroupRole, title: '회장' },
      53: { role: 'executive' as ManagedGroupRole, title: '교육위원' },
    },
  },
  {
    name: '투자자 네트워크',
    description: 'VC, PE, 엔젤 투자자 간 딜소싱 및 투자 정보 교류 그룹입니다.',
    color: '#10AC84',
    icon: '💼',
    ownerIndex: 1, // 박서준 (한강인베스트먼트)
    memberIndices: [0, 1, 2, 3, 4, 6, 7, 8, 9, 10],
    roles: {
      1: { role: 'admin' as ManagedGroupRole },
      0: { role: 'president' as ManagedGroupRole, title: '회장' },
      3: { role: 'executive' as ManagedGroupRole, title: '부회장' },
      7: { role: 'executive' as ManagedGroupRole, title: '사무총장' },
    },
  },
  {
    name: '미래기술 연구회',
    description: '첨단 기술 트렌드와 연구 성과를 공유하는 학술 교류 모임입니다.',
    color: '#A29BFE',
    icon: '🎓',
    ownerIndex: 51, // 양현석 (KAIST)
    memberIndices: [0, 11, 15, 23, 25, 29, 51, 52, 55, 56, 59, 63],
    roles: {
      51: { role: 'admin' as ManagedGroupRole },
      55: { role: 'president' as ManagedGroupRole, title: '학회장' },
      56: { role: 'executive' as ManagedGroupRole, title: '연구이사' },
      0: { role: 'member' as ManagedGroupRole },
    },
  },
  {
    name: '비즈니스 리더스 클럽',
    description: '각 분야 리더들이 모여 비즈니스 인사이트를 교류하고 협업 기회를 만드는 프리미엄 모임입니다.',
    color: '#FFA657',
    icon: '⭐',
    ownerIndex: 0, // 김도현 (데모계정)
    memberIndices: [0, 1, 4, 11, 21, 22, 31, 41, 42, 51, 58, 61, 62, 67, 71, 78, 82, 86, 91, 94],
    roles: {
      0: { role: 'admin' as ManagedGroupRole },
      1: { role: 'president' as ManagedGroupRole, title: '클럽 회장' },
      31: { role: 'executive' as ManagedGroupRole, title: '법률고문' },
      71: { role: 'executive' as ManagedGroupRole, title: '정책자문' },
      58: { role: 'executive' as ManagedGroupRole, title: '학술위원' },
    },
  },
  {
    name: '청년 기업인 모임',
    description: '30-40대 청년 기업인들의 네트워킹 및 동반 성장 모임입니다.',
    color: '#FF9F43',
    icon: '🔥',
    ownerIndex: 13, // 오준혁 (체인링크코리아)
    memberIndices: [0, 5, 13, 17, 24, 49, 53, 81],
    roles: {
      13: { role: 'admin' as ManagedGroupRole },
      5: { role: 'president' as ManagedGroupRole, title: '회장' },
      53: { role: 'executive' as ManagedGroupRole, title: '부회장' },
      0: { role: 'member' as ManagedGroupRole },
    },
  },
  {
    name: '헬스케어 혁신 네트워크',
    description: '디지털 헬스케어 및 바이오 혁신에 관심 있는 전문가들의 모임입니다.',
    color: '#48DBFB',
    icon: '💎',
    ownerIndex: 24, // 이준호 (라이프시맨틱스)
    memberIndices: [0, 21, 22, 23, 24, 25, 26, 27, 28, 29],
    roles: {
      24: { role: 'admin' as ManagedGroupRole },
      21: { role: 'president' as ManagedGroupRole, title: '학술의장' },
      25: { role: 'executive' as ManagedGroupRole, title: 'AI분과장' },
      0: { role: 'executive' as ManagedGroupRole, title: '투자자문' },
    },
  },
  {
    name: '글로벌 비즈니스 포럼',
    description: '해외 진출 및 글로벌 비즈니스 전략을 논의하는 전문가 모임입니다.',
    color: '#6C5CE7',
    icon: '🤝',
    ownerIndex: 0, // 김도현 (데모계정)
    memberIndices: [0, 4, 7, 10, 22, 28, 33, 40, 46, 62, 67, 69, 78, 94],
    roles: {
      0: { role: 'admin' as ManagedGroupRole },
      7: { role: 'president' as ManagedGroupRole, title: '포럼 의장' },
      40: { role: 'executive' as ManagedGroupRole, title: '국제법 자문' },
      78: { role: 'executive' as ManagedGroupRole, title: '통상위원' },
    },
  },
];

// =============================================================================
// 커피챗 데모 데이터
// =============================================================================
export const DEMO_COFFEE_SLOTS = [
  { dayOfWeek: 1, startTime: '10:00', endTime: '11:00', isRecurring: true },
  { dayOfWeek: 3, startTime: '14:00', endTime: '15:00', isRecurring: true },
  { dayOfWeek: 5, startTime: '16:00', endTime: '17:00', isRecurring: true },
];

export const DEMO_COFFEE_REQUESTS = [
  { fromIndex: 11, purpose: 'collaboration' as const, message: 'AI 기반 투자 분석 도구에 대해 의견을 나누고 싶습니다.', status: 'pending' as const },
  { fromIndex: 24, purpose: 'networking' as const, message: '디지털 헬스 스타트업 투자 트렌드에 대해 이야기 나누고 싶습니다.', status: 'accepted' as const },
  { fromIndex: 53, purpose: 'insight' as const, message: '에듀테크 분야 투자 기회에 대해 조언을 구하고 싶습니다.', status: 'completed' as const },
];

// =============================================================================
// 이름 → 카테고리 맵 (firebase-services.ts 호환용)
// =============================================================================
export const DEMO_NAME_CATEGORY_MAP: Record<string, string> = Object.fromEntries(
  DEMO_MEMBERS.map(m => [m.name, m.category])
);
