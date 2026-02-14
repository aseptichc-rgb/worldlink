import { User, NetworkNode, NetworkEdge, Recommendation } from '@/types';

// future2members.json 기반 멤버 데이터
// 모든 멤버는 서로 인맥 (완전 연결 그래프)

const memberData = [
  { id: 'member_1', name: '강대원', company: '(주)메디라인액티브코리아', position: '대표', bio: 'Non-PVC 수액세트 등 의료용 소모품 제조 및 수입·유통 전문 기업입니다.', keywords: ['의료기기', '수액세트', '제조', '유통', '수입'], specialRole: null, category: '의료기기' },
  { id: 'member_2', name: '고상원', company: '(주)마케시안', position: '대표', bio: '헬스케어 비즈니스 전략 수립 및 이커머스 마케팅 솔루션을 제공합니다.', keywords: ['헬스케어', '마케팅', '이커머스', '전략', '솔루션'], specialRole: '👑 회장', category: '솔루션' },
  { id: 'member_3', name: '권인호', company: '데일리파트너스', position: '전무', bio: '바이오 및 헬스케어 혁신 기업에 투자하는 벤처캐피탈(VC)입니다.', keywords: ['투자', 'VC', '바이오', '헬스케어', '스타트업'], specialRole: null, category: '투자' },
  { id: 'member_4', name: '김국배', company: '애니메디솔루션', position: '대표', bio: 'AI와 3D 프린팅 기술을 활용한 환자 맞춤형 수술 솔루션 전문 기업입니다.', keywords: ['AI', '3D프린팅', '수술', '맞춤형', '의료기기'], specialRole: '재무부회장', category: '의료기기' },
  { id: 'member_5', name: '김선욱', company: '법무법인 세승', position: '대표변호사', bio: '의료 소송 및 병원 경영 자문에 특화된 국내 대표 의료 전문 로펌입니다.', keywords: ['법률', '의료소송', '병원자문', '로펌'], specialRole: null, category: '법률' },
  { id: 'member_6', name: '김성포', company: '(주)엠에스바이오', position: '대표', bio: '체외진단용 의료기기 및 바이오 소재 연구·개발 전문 기업입니다.', keywords: ['체외진단', '바이오', '의료기기', '연구개발'], specialRole: null, category: '바이오' },
  { id: 'member_7', name: '김소은', company: '한국오가논(주)', position: '대표', bio: '글로벌 제약사로, 특히 여성 건강 및 만성 질환 치료 분야에 집중합니다.', keywords: ['제약', '글로벌', '여성건강', '만성질환'], specialRole: null, category: '제약' },
  { id: 'member_8', name: '김재영', company: '아셉틱 /오크우드봄의원', position: '심사역 /내과 원장', bio: '"ASEPTIC GROUP"은 바이오-헬스케어 분야를 주력으로 Company Building, Pre-Seed, Seed, Series A 단계에 투자하는 "Bio-Health care specific Startup Studio"입니다. 진료와 병행하여 투자 및 의료 AI 관련 업무를 하고 있습니다.', keywords: ['투자', '디지털헬스', '내과', 'AI'], specialRole: '상조부회장', category: '솔루션' },
  { id: 'member_9', name: '김재형', company: '신한메디칼(주)', position: '대표', bio: '호흡기 진단 등 정밀 의료 장비를 수입하여 공급하는 전문 기업입니다.', keywords: ['의료기기', '호흡기', '진단장비', '수입', '유통'], specialRole: null, category: '의료기기' },
  { id: 'member_10', name: '김학준', company: '고려대의료원', position: '의학연구처 처장', bio: '고려대학교 산하 병원의 의학 연구 인프라와 산학협력을 총괄합니다.', keywords: ['대학병원', '연구', '산학협력', '의학연구'], specialRole: null, category: '의료기관' },
  { id: 'member_11', name: '김홍주', company: '(주)에이치피앤씨', position: '부사장', bio: '전문 의약품 및 코스메슈티컬 제품을 생산하는 헬스케어 제조 기업입니다.', keywords: ['제약', '의약품', '코스메슈티컬', '헬스케어', '제조'], specialRole: null, category: '제약' },
  { id: 'member_12', name: '나해란', company: '나해란정신의학과의원', position: '원장', bio: '정신건강의학 진료 및 디지털 헬스케어 자문 활동을 병행합니다.', keywords: ['정신건강', '디지털헬스', '의원', '자문'], specialRole: null, category: '의료기관' },
  { id: 'member_13', name: '박재은', company: '두잉랩', position: '경영지원그룹 그룹장', bio: 'AI 기반 음식 인식 및 영양 분석 솔루션 \'푸드렌즈\'를 개발했습니다.', keywords: ['AI', '영양분석', '푸드테크', '솔루션', '헬스케어'], specialRole: null, category: '솔루션' },
  { id: 'member_14', name: '변희병', company: '대원제약', position: '대외협력실 전무', bio: '국내 주요 제약사로, 짜먹는 감기약 등 개량신약에 강점을 보유합니다.', keywords: ['제약', '개량신약', '의약품', '제조'], specialRole: null, category: '제약' },
  { id: 'member_15', name: '선경훈', company: '선치과병원 / 인스텍', position: '병원장 / 대표', bio: '디지털 기술을 접목한 고도화된 치과 진료 서비스를 제공하는 병원입니다. 금속 3D 프린팅 하드웨어, 소프트웨어 및 재료공정 기술을 보유한 인스텍의 대표입니다.', keywords: ['치과', '병원', '디지털', '진료', '3D프린팅'], specialRole: '명예회장', category: '의료기관' },
  { id: 'member_16', name: '송재준', company: '고려대학교 구로병원 / 뉴라이브', position: '이비인후과 교수 / 대표', bio: '임상 진료와 함께 의생명 공학 분야의 다양한 연구 활동을 수행합니다. 미주 신경 자극 기술을 활용한 이명 디지털 치료제 \'뉴라이브\'의 대표입니다.', keywords: ['대학병원', '이비인후과', '연구', '의생명공학', '디지털치료제'], specialRole: null, category: '의료기관' },
  { id: 'member_17', name: '송진규', company: '(주)진바이오', position: '대표', bio: '발효 기술 기반의 기능성 원료 및 바이오 소재 개발 전문 기업입니다.', keywords: ['바이오', '발효', '기능성원료', '연구개발'], specialRole: null, category: '바이오' },
  { id: 'member_18', name: '신현주', company: '(주)엔윤', position: '대표', bio: '자수직물 및 섬유고급소재를 제조, 수출하는 글로벌 의류 기업입니다', keywords: ['비즈니스', '전략', '글로벌', '의류'], specialRole: null, category: '비즈니스' },
  { id: 'member_19', name: '양성용', company: '(주)다루소프트', position: 'IT사업본부 이사', bio: '의료 시스템 구축 및 데이터 분석 솔루션 개발 전문 IT 기업입니다.', keywords: ['IT', '의료시스템', '데이터분석', '솔루션', '개발'], specialRole: '교육부회장', category: '솔루션' },
  { id: 'member_20', name: '양정희', company: '고려대의료원', position: '연구전략본부 연구교수', bio: '의료원의 중장기 연구 전략 수립 및 연구 기획을 담당하는 기관입니다.', keywords: ['대학병원', '연구', '전략기획'], specialRole: null, category: '의료기관' },
  { id: 'member_21', name: '오가나', company: '오가나셀 피부과의원', position: '대표원장', bio: '피부과 전문 진료와 함께 프리미엄 스킨케어 브랜드를 운영합니다.', keywords: ['피부과', '의원', '스킨케어', '뷰티'], specialRole: null, category: '의료기관' },
  { id: 'member_22', name: '윤동욱', company: '법률사무소 서희', position: '대표변호사', bio: '의료 소송 및 지식재산권 분야 법률 서비스를 제공하는 사무소입니다.', keywords: ['법률', '의료소송', '지식재산권', '특허'], specialRole: null, category: '법률' },
  { id: 'member_23', name: '윤여혜', company: '(주)중헌제약', position: '품질부서 차장', bio: '안과 의약품 및 히알루론산 기반 필러를 제조하는 제약사입니다.', keywords: ['제약', '안과', '히알루론산', '필러', '제조'], specialRole: null, category: '제약' },
  { id: 'member_24', name: '윤정로', company: '뉴대성병원', position: '병원장', bio: '지역사회 중심의 종합 의료 서비스를 제공하는 거점 의료기관입니다.', keywords: ['종합병원', '지역의료', '병원경영'], specialRole: null, category: '의료기관' },
  { id: 'member_25', name: '이민우', company: '고려대 구로병원', position: '운영기획실 실장', bio: '헬스케어 스타트업의 병원 연계 실증 및 사업화를 지원하는 조직입니다.', keywords: ['대학병원', '스타트업', '실증', '사업화'], specialRole: null, category: '의료기관' },
  { id: 'member_26', name: '이석구', company: '에스지엘', position: '대표', bio: '중동 지역 의료 진출 및 글로벌 비즈니스 자문을 수행합니다.', keywords: ['컨설팅', '글로벌', '해외진출', '중동'], specialRole: null, category: '비즈니스' },
  { id: 'member_27', name: '이성현', company: '고려대 구로병원', position: '의생명연구센터 연구교수', bio: '첨단 의료기기 개발 및 임상 시험 관련 연구 활동을 수행합니다.', keywords: ['대학병원', '연구', '의료기기', '임상시험'], specialRole: null, category: '의료기관' },
  { id: 'member_28', name: '이승아', company: '휴이노', position: '부사장', bio: 'AI 기반 웨어러블 심전도 모니터링 및 원격 의료 솔루션을 선도합니다.', keywords: ['AI', '웨어러블', '심전도', '원격의료', '모니터링'], specialRole: null, category: '의료기기' },
  { id: 'member_29', name: '이승표', company: '(주)소망헬스케어', position: '대표/이사장', bio: '마음건강 케어 및 사회적 의료 서비스를 제공하는 재단 및 기업입니다.', keywords: ['정신건강', '사회적기업', '헬스케어'], specialRole: null, category: '의료기관' },
  { id: 'member_30', name: '이영환', company: '휴니버스 글로벌', position: '빅데이터본부 이사', bio: '클라우드 기반 병원정보시스템(P-HIS) 및 의료 빅데이터 전문 기업입니다.', keywords: ['클라우드', '병원정보시스템', '빅데이터', 'IT'], specialRole: null, category: '솔루션' },
  { id: 'member_31', name: '이예하', company: 'VUNO', position: '대표', bio: '딥러닝 기반 의료 영상 및 생체신호 분석 AI 솔루션 전문 기업 뷰노입니다.', keywords: ['AI', '딥러닝', '의료영상', '생체신호', '분석'], specialRole: null, category: '솔루션' },
  { id: 'member_32', name: '이종근', company: '특허법인 MAPS', position: '변리사', bio: '바이오 및 ICT 융합 기술 분야 특허 권리화와 컨설팅을 전담합니다.', keywords: ['특허', '변리사', '바이오', 'ICT', '지식재산권'], specialRole: null, category: '특허' },
  { id: 'member_33', name: '이태규', company: '스케일업파트너스', position: '대표', bio: '기술 기반 유망 기업의 성장 가속화를 돕는 엑셀러레이터입니다.', keywords: ['투자', '엑셀러레이터', '스타트업', '성장지원'], specialRole: null, category: '투자' },
  { id: 'member_34', name: '임환', company: 'KIST/홍릉강소특구', position: '본부장/단장', bio: '바이오·의료 클러스터 조성 및 기술 사업화를 지원하는 공공기관입니다.', keywords: ['공공기관', '바이오', '클러스터', '기술사업화', '연구'], specialRole: null, category: '비즈니스' },
  { id: 'member_35', name: '장강호', company: '인사이트에퀴티파트너스', position: '투자팀 상무', bio: '바이오 및 첨단 소재 기업에 투자하는 전문 사모펀드 운용사입니다.', keywords: ['투자', '사모펀드', '바이오', '첨단소재'], specialRole: '골프부회장', category: '투자' },
  { id: 'member_36', name: '장우석', company: '나누리병원/나누리에쿼티', position: '법인장/본부장', bio: '병원 경영 지원과 함께 연관 산업 투자를 진행하는 법인입니다.', keywords: ['병원', '경영지원', '투자', '척추전문'], specialRole: null, category: '의료기관' },
  { id: 'member_37', name: '정경진', company: '가천대 길병원/유에프유헬스', position: '과장/대표', bio: '비뇨기 질환 치료를 위한 마이크로니들 등 신약 물질을 연구합니다.', keywords: ['바이오', '비뇨기', '마이크로니들', '신약개발', '연구'], specialRole: null, category: '바이오' },
  { id: 'member_38', name: '정성관', company: '우리아이들병원', position: '이사장', bio: '소아청소년 전문 병원으로, 지역 기반 어린이 맞춤형 진료를 제공합니다.', keywords: ['소아청소년', '전문병원', '지역의료'], specialRole: null, category: '의료기관' },
  { id: 'member_39', name: '조경희', company: '고려대학교 안암병원', position: '신경과 교수', bio: '뇌신경 질환 진료와 함께 디지털 인지 치료 관련 연구를 수행합니다.', keywords: ['대학병원', '신경과', '디지털치료', '연구'], specialRole: null, category: '의료기관' },
  { id: 'member_40', name: '주이신', company: '뉴대성병원', position: '전략기획본부 본부장', bio: '병원의 미래 성장 동력 발굴 및 운영 효율화 기획을 담당합니다.', keywords: ['병원', '전략기획', '경영'], specialRole: null, category: '의료기관' },
  { id: 'member_41', name: '주형로', company: '하나이비인후과', position: '원장', bio: '이비인후과 전문 질환의 특화 진료 및 수술을 전담하는 의료기관입니다.', keywords: ['이비인후과', '의원', '수술'], specialRole: null, category: '의료기관' },
  { id: 'member_42', name: '최승현', company: '(주)아피셀테라퓨틱스', position: '플랫폼연구실 실장', bio: '차세대 유전자 세포치료제를 개발하는 바이오 테크 기업입니다.', keywords: ['바이오', '세포치료제', '유전자치료', '연구개발'], specialRole: null, category: '바이오' },
  { id: 'member_43', name: '최종일', company: '고려대학교 안암병원', position: '적정진료관리부장/교수', bio: '의료 서비스 품질 관리와 심혈관 질환 임상 연구를 총괄합니다.', keywords: ['대학병원', '심혈관', '품질관리', '연구'], specialRole: null, category: '의료기관' },
  { id: 'member_44', name: '최준', company: '고려대학교 안산병원', position: '이비인후과 교수(과장)', bio: '임상 진료 외 의료 분쟁 및 의료 관련 규제 분야 연구도 활발합니다.', keywords: ['대학병원', '이비인후과', '의료법', '연구'], specialRole: null, category: '의료기관' },
  { id: 'member_45', name: '태범식', company: '고려대학교 안산병원', position: '비뇨의학과 부교수', bio: '로봇 수술 등 첨단 비뇨기 수술 및 암 연구 전문의입니다.', keywords: ['대학병원', '비뇨의학', '로봇수술', '암연구'], specialRole: null, category: '의료기관' },
  { id: 'member_46', name: '한예성', company: '(주)파인더패턴', position: '대표', bio: '헬스케어 기반의 데이터 분석 기술 및 비즈니스 모델을 개발합니다.', keywords: ['데이터분석', '헬스케어', 'AI', '솔루션'], specialRole: null, category: '솔루션' },
  { id: 'member_47', name: '한성희', company: '고려대학교 안암병원', position: '연구부원장보', bio: '병원의 연구 인프라 고도화 및 대형 국책 과제 기획을 총괄합니다.', keywords: ['대학병원', '연구', '국책과제', '인프라'], specialRole: null, category: '의료기관' },
  { id: 'member_48', name: '허기나', company: '로완', position: '영업마케팅 본부장', bio: '디지털 인지 훈련 솔루션인 디지털 치료기기를 전문 개발·유통합니다.', keywords: ['디지털치료기기', '인지훈련', '솔루션', '개발'], specialRole: null, category: '의료기기' },
  { id: 'member_49', name: '홍석원', company: '재단법인 대성재단', position: '이사장', bio: '종합병원 운영과 함께 노인 요양 등 복합 의료 서비스를 제공합니다.', keywords: ['재단', '종합병원', '노인요양', '복합의료'], specialRole: null, category: '의료기관' },
  { id: 'member_50', name: '황은경', company: '창헬스케어', position: '부사장', bio: '맞춤형 건강 검진 및 질병 예방을 위한 헬스케어 대행사입니다.', keywords: ['건강검진', '예방의학', '헬스케어', '대행'], specialRole: '고문', category: '비즈니스' },
  // [가상] 고상원 인맥 + 김재영 공통 인맥
  { id: 'member_51', name: '박지훈', company: '테크브릿지벤처스', position: '대표이사 / CEO', bio: '[가상] IT 벤처 투자 및 스타트업 육성 전문 기업입니다.', keywords: ['투자', 'IT', '스타트업', '벤처'], specialRole: null, category: '투자', networkOwners: ['고상원', '김재영'] },
  { id: 'member_52', name: '이서연', company: '블루오션캐피탈', position: '파트너 / 상무', bio: '[가상] 헬스케어 및 바이오 분야 전문 투자사입니다.', keywords: ['투자', 'VC', '헬스케어', '바이오'], specialRole: null, category: '투자', networkOwners: ['고상원', '김재영'] },
  { id: 'member_53', name: '정민수', company: '법무법인 정의', position: '변호사', bio: '[가상] 기업 자문 및 M&A 전문 법률 서비스를 제공합니다.', keywords: ['법률', '기업자문', 'M&A', '변호사'], specialRole: null, category: '법률', networkOwners: ['고상원', '김재영'] },
  // [가상] 고상원 인맥만
  { id: 'member_54', name: '김동현', company: '디지털마케팅랩', position: '이사', bio: '[가상] 헬스케어 분야 디지털 마케팅 전문 기업입니다.', keywords: ['마케팅', '디지털', '헬스케어', '브랜딩'], specialRole: null, category: '솔루션', networkOwners: ['고상원'] },
  { id: 'member_55', name: '최유진', company: '헬스케어플러스', position: '대표이사', bio: '[가상] 헬스케어 스타트업 액셀러레이터입니다.', keywords: ['헬스케어', '스타트업', '액셀러레이터'], specialRole: null, category: '솔루션', networkOwners: ['고상원'] },
  { id: 'member_56', name: '송현우', company: '미래병원', position: '원장 / 정형외과 전문의', bio: '[가상] 첨단 정형외과 수술 및 재활 전문 병원입니다.', keywords: ['정형외과', '병원', '재활', '수술'], specialRole: null, category: '의료기관', networkOwners: ['고상원'] },
  { id: 'member_57', name: '한지민', company: '글로벌컨설팅그룹', position: '시니어 컨설턴트', bio: '[가상] 헬스케어 산업 전략 컨설팅 전문입니다.', keywords: ['컨설팅', '전략', '헬스케어', '경영'], specialRole: null, category: '비즈니스', networkOwners: ['고상원'] },
  { id: 'member_58', name: '오준혁', company: '서울대학교', position: '부교수', bio: '[가상] 의료경영 및 헬스케어 정책 연구를 수행합니다.', keywords: ['연구', '의료경영', '정책', '대학'], specialRole: null, category: '의료기관', networkOwners: ['고상원'] },
  { id: 'member_59', name: '윤서희', company: '크리에이티브스튜디오', position: '대표 / 크리에이티브 디렉터', bio: '[가상] 의료 브랜딩 및 UX 디자인 전문 에이전시입니다.', keywords: ['디자인', '브랜딩', 'UX', '크리에이티브'], specialRole: null, category: '솔루션', networkOwners: ['고상원'] },
  { id: 'member_60', name: '장원석', company: '코리아텍', position: '상무이사', bio: '[가상] 의료기기 부품 제조 전문 기업입니다.', keywords: ['제조', '의료기기', '부품', '생산'], specialRole: null, category: '의료기기', networkOwners: ['고상원'] },
];

// 이름으로 카테고리 조회 (Firebase 데이터에 category가 없을 때 fallback용)
const nameToCategoryMap = new Map(memberData.map(m => [m.name, m.category]));
export const getCategoryByName = (name: string): string | undefined => nameToCategoryMap.get(name);

// User 객체로 변환
export const demoUsers: User[] = memberData.map(m => ({
  id: m.id,
  name: m.name,
  email: '',
  company: m.company,
  position: m.position,
  bio: m.bio,
  keywords: m.keywords,
  profileImage: `/faces/${m.name}.jpg`,
  inviteCode: `INV-${m.id.split('_')[1]?.padStart(3, '0') || '000'}`,
  invitesRemaining: 999,
  coffeeStatus: 'available' as const,
  privacySettings: {
    allowProfileDiscovery: true,
    displaySettings: {
      nameDisplay: 'full' as const,
      companyDisplay: 'full' as const,
      positionDisplay: 'full' as const,
    },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
}));

// 연락처 인터페이스 (추후 사용을 위해 유지)
export interface Contact {
  id: string;
  name: string;
  phone: string;
  company: string;
  department: string;
  position: string;
  email: string;
  registeredAt: string;
  isInvited: boolean;
  invitedAt?: Date;
}

// 연락처 데이터 - 비활성화됨
export const contacts: Contact[] = [];

// 모든 멤버 ID
const allMemberIds = memberData.map(m => m.id);

// 이름으로 멤버 ID 찾기
const nameToIdMap = new Map(memberData.map(m => [m.name, m.id]));

// 연결 관계 생성
// - 기존 멤버(member_1 ~ member_50): 서로 완전 연결
// - 가상 멤버(member_51+): networkOwners에 지정된 사람과만 연결
export const demoConnections: Record<string, string[]> = {};

const originalMemberIds = memberData.filter(m => !m.networkOwners).map(m => m.id);
const virtualMembers = memberData.filter(m => m.networkOwners);

// 기존 멤버들은 서로 완전 연결
for (const id of originalMemberIds) {
  demoConnections[id] = originalMemberIds.filter(otherId => otherId !== id);
}

// 가상 멤버는 networkOwners와만 연결
for (const virtual of virtualMembers) {
  const ownerIds = (virtual.networkOwners || [])
    .map(name => nameToIdMap.get(name))
    .filter((id): id is string => !!id);

  demoConnections[virtual.id] = ownerIds;

  // 양방향 연결
  for (const ownerId of ownerIds) {
    if (demoConnections[ownerId] && !demoConnections[ownerId].includes(virtual.id)) {
      demoConnections[ownerId].push(virtual.id);
    }
  }
}

// 실제 사용자를 데모 멤버에 매핑 (ID 또는 이름으로 매칭)
// 매칭되지 않으면 null 반환
export const findMatchingMember = (user: { id?: string; name?: string; email?: string; phone?: string }): typeof memberData[0] | null => {
  if (user.id && memberData.find(m => m.id === user.id)) {
    return memberData.find(m => m.id === user.id)!;
  }
  if (user.name) {
    const found = memberData.find(m => m.name === user.name);
    if (found) return found;
  }
  return null;
};

// 사용자의 데모 호환 ID를 반환 (매칭되는 멤버가 있으면 해당 member_X ID, 없으면 원래 ID)
export const getDemoCompatibleId = (user: { id: string; name?: string; email?: string; phone?: string }): string => {
  const match = findMatchingMember(user);
  return match ? match.id : user.id;
};

// 실제 사용자를 데모 네트워크에 동적으로 추가 (아직 없는 경우)
export const ensureUserInDemoNetwork = (userId: string): void => {
  if (!demoConnections[userId]) {
    // 모든 멤버와 연결
    demoConnections[userId] = [...allMemberIds];
    // 기존 멤버들에도 이 사용자 추가
    for (const id of allMemberIds) {
      if (!demoConnections[id].includes(userId)) {
        demoConnections[id].push(userId);
      }
    }
  }
};

// 네트워크 그래프
export const getDemoNetworkGraph = (userId: string, userData?: { name?: string; profileImage?: string; company?: string; position?: string; keywords?: string[] }): { nodes: NetworkNode[]; edges: NetworkEdge[] } => {
  let currentUser = demoUsers.find(u => u.id === userId) || demoUsers.find(u => u.name === userId);

  // 실제 사용자를 데모 네트워크에 추가
  if (!currentUser) {
    ensureUserInDemoNetwork(userId);
    // userData가 있으면 해당 정보로 임시 User 생성
    if (userData) {
      currentUser = {
        id: userId,
        name: userData.name || '나',
        email: '',
        profileImage: userData.profileImage,
        company: userData.company,
        position: userData.position,
        keywords: userData.keywords || [],
        inviteCode: '',
        invitesRemaining: 0,
        coffeeStatus: 'available' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } else {
      currentUser = demoUsers[0]!;
    }
  }
  const userConnections = demoConnections[currentUser.id] || demoConnections[userId] || [];

  const getMemberCategory = (id: string) => memberData.find(m => m.id === id)?.category || '기타';

  const nodes: NetworkNode[] = [
    {
      id: currentUser.id,
      name: currentUser.name,
      profileImage: currentUser.profileImage,
      company: currentUser.company,
      position: currentUser.position,
      keywords: currentUser.keywords,
      degree: 0,
      connectionCount: userConnections.length,
      category: getMemberCategory(currentUser.id),
    },
  ];

  const addedNodeIds = new Set<string>([currentUser.id]);

  // 1촌 추가
  userConnections.forEach(connId => {
    const connUser = demoUsers.find(u => u.id === connId);
    if (connUser && !addedNodeIds.has(connId)) {
      addedNodeIds.add(connId);
      nodes.push({
        id: connUser.id,
        name: connUser.name,
        profileImage: connUser.profileImage,
        company: connUser.company,
        position: connUser.position,
        keywords: connUser.keywords,
        degree: 1,
        connectionCount: (demoConnections[connUser.id] || []).length,
        category: getMemberCategory(connUser.id),
      });
    }
  });

  // 2촌 추가 (1촌의 인맥 중 아직 추가되지 않은 사람들)
  userConnections.forEach(connId => {
    const secondDegreeConnections = demoConnections[connId] || [];
    secondDegreeConnections.forEach(secondConnId => {
      if (!addedNodeIds.has(secondConnId)) {
        const secondUser = demoUsers.find(u => u.id === secondConnId);
        if (secondUser) {
          addedNodeIds.add(secondConnId);
          nodes.push({
            id: secondUser.id,
            name: secondUser.name,
            profileImage: secondUser.profileImage,
            company: secondUser.company,
            position: secondUser.position,
            keywords: secondUser.keywords,
            degree: 2,
            connectionCount: (demoConnections[secondUser.id] || []).length,
            category: getMemberCategory(secondUser.id),
          });
        }
      }
    });
  });

  // 본인과 1촌 연결
  const edges: NetworkEdge[] = userConnections.map(connId => ({
    source: currentUser.id,
    target: connId,
    degree: 1,
  }));

  // 1촌 간 상호 연결
  for (let i = 0; i < userConnections.length; i++) {
    for (let j = i + 1; j < userConnections.length; j++) {
      // 실제로 연결되어 있는지 확인
      const conn1 = demoConnections[userConnections[i]] || [];
      if (conn1.includes(userConnections[j])) {
        edges.push({
          source: userConnections[i],
          target: userConnections[j],
          degree: 2,
        });
      }
    }
  }

  // 1촌과 2촌 연결
  userConnections.forEach(connId => {
    const secondDegreeConnections = demoConnections[connId] || [];
    secondDegreeConnections.forEach(secondConnId => {
      if (secondConnId !== currentUser.id && !userConnections.includes(secondConnId)) {
        edges.push({
          source: connId,
          target: secondConnId,
          degree: 2,
        });
      }
    });
  });

  return { nodes, edges };
};

// Demo recommendations - 빈 상태
export const getDemoRecommendations = (userId: string): Recommendation[] => {
  return [];
};

// Initial invite codes for demo
export const demoInviteCodes = [
  'INV-008',
  'NEX-001',
  'DEV-123',
];

// BFS로 두 사용자 간의 최단 연결 경로 찾기
export const findDemoConnectionPath = (fromUserId: string, toUserId: string): string[] => {
  if (fromUserId === toUserId) return [fromUserId];

  const visited = new Set<string>();
  const queue: { userId: string; path: string[] }[] = [{ userId: fromUserId, path: [fromUserId] }];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const { userId, path } = current;

    if (userId === toUserId) {
      return path;
    }

    if (visited.has(userId)) continue;
    visited.add(userId);

    const connections = demoConnections[userId] || [];
    for (const connId of connections) {
      if (!visited.has(connId)) {
        queue.push({ userId: connId, path: [...path, connId] });
      }
    }
  }

  return [];
};

// 특정 사용자 중심의 네트워크 그래프 동적 생성
export const getDemoNetworkGraphForUser = (centerId: string): { nodes: NetworkNode[]; edges: NetworkEdge[] } => {
  return getDemoNetworkGraph(centerId);
};

// 멤버 원본 데이터 (seed 스크립트 등에서 사용)
export const memberRawData = memberData;
