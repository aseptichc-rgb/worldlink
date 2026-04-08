// =============================================================================
// NODDED Demo Seed Data - 100명의 다양한 분야 연구자
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
  'computer-science',
  'artificial-intelligence',
  'biology',
  'medicine',
  'physics',
  'chemistry',
  'engineering',
  'mathematics',
  'neuroscience',
  'environmental-science',
] as const;

// 카테고리 간 인접 관계 (자연스럽게 교류하는 분야)
const CATEGORY_ADJACENCY: Record<string, string[]> = {
  'computer-science':        ['artificial-intelligence', 'mathematics', 'engineering'],
  'artificial-intelligence': ['computer-science', 'neuroscience', 'mathematics', 'engineering'],
  'biology':                 ['medicine', 'chemistry', 'neuroscience', 'environmental-science'],
  'medicine':                ['biology', 'neuroscience', 'chemistry'],
  'physics':                 ['chemistry', 'engineering', 'mathematics'],
  'chemistry':               ['biology', 'physics', 'medicine', 'environmental-science'],
  'engineering':             ['computer-science', 'physics', 'artificial-intelligence', 'environmental-science'],
  'mathematics':             ['computer-science', 'physics', 'artificial-intelligence'],
  'neuroscience':            ['biology', 'medicine', 'artificial-intelligence'],
  'environmental-science':   ['biology', 'chemistry', 'engineering'],
};

// =============================================================================
// 100명 데모 멤버 데이터
// =============================================================================
export const DEMO_ACCOUNT_INDEX = 0; // 데모 계정은 첫 번째 (computer-science 카테고리)

export const DEMO_MEMBERS: DemoMember[] = [
  // =========================================================================
  // 컴퓨터과학 (10명) - 인덱스 0~9
  // =========================================================================
  { id: 'demo_1', name: '김도현', company: '서울대학교', position: '교수', bio: '분산 시스템과 클라우드 컴퓨팅 연구. ACM Fellow.', keywords: ['분산시스템', '클라우드컴퓨팅', '병렬처리', '대규모시스템'], category: 'computer-science', email: 'demo@snu.ac.kr', phone: '010-0000-0000', specialRole: null },
  { id: 'demo_2', name: '박서준', company: 'KAIST', position: '부교수', bio: '프로그래밍 언어 이론과 소프트웨어 검증 연구를 수행합니다.', keywords: ['프로그래밍언어', '소프트웨어검증', '형식검증', '타입이론'], category: 'computer-science', email: 'researcher02@kaist.ac.kr', phone: '010-0000-0002', specialRole: null },
  { id: 'demo_3', name: '이지은', company: '포항공과대학교', position: '조교수', bio: '컴퓨터 네트워크 보안 및 프라이버시 보호 기술을 연구합니다.', keywords: ['네트워크보안', '프라이버시', '암호학', '보안프로토콜'], category: 'computer-science', email: 'researcher03@postech.ac.kr', phone: '010-0000-0003', specialRole: null },
  { id: 'demo_4', name: '정우성', company: 'ETRI', position: '선임연구원', bio: '고성능 컴퓨팅 아키텍처와 차세대 프로세서를 설계합니다.', keywords: ['고성능컴퓨팅', '프로세서설계', 'HPC', '컴퓨터아키텍처'], category: 'computer-science', email: 'researcher04@etri.re.kr', phone: '010-0000-0004', specialRole: null },
  { id: 'demo_5', name: '한소희', company: '연세대학교', position: '연구교수', bio: '데이터베이스 시스템 최적화와 질의 처리 알고리즘을 연구합니다.', keywords: ['데이터베이스', '질의최적화', '트랜잭션', '인메모리DB'], category: 'computer-science', email: 'researcher05@yonsei.ac.kr', phone: '010-0000-0005', specialRole: null },
  { id: 'demo_6', name: '최민호', company: '고려대학교', position: '교수', bio: '운영체제 커널 및 시스템 소프트웨어의 성능 최적화를 연구합니다.', keywords: ['운영체제', '시스템소프트웨어', '커널', '가상화'], category: 'computer-science', email: 'researcher06@korea.ac.kr', phone: '010-0000-0006', specialRole: null },
  { id: 'demo_7', name: '윤세아', company: '성균관대학교', position: '부교수', bio: '소프트웨어 공학 방법론과 코드 분석 자동화를 연구합니다.', keywords: ['소프트웨어공학', '코드분석', '자동화테스트', '정적분석'], category: 'computer-science', email: 'researcher07@skku.edu', phone: '010-0000-0007', specialRole: null },
  { id: 'demo_8', name: '강태준', company: 'KIST', position: '책임연구원', bio: '사물인터넷 미들웨어와 엣지 컴퓨팅 플랫폼을 개발합니다.', keywords: ['IoT', '엣지컴퓨팅', '미들웨어', '임베디드시스템'], category: 'computer-science', email: 'researcher08@kist.re.kr', phone: '010-0000-0008', specialRole: null },
  { id: 'demo_9', name: '임수진', company: '한양대학교', position: '조교수', bio: 'HCI 분야에서 사용자 인터페이스 설계 및 사용성 평가를 연구합니다.', keywords: ['HCI', '사용자인터페이스', '사용성', '인터랙션디자인'], category: 'computer-science', email: 'researcher09@hanyang.ac.kr', phone: '010-0000-0009', specialRole: null },
  { id: 'demo_10', name: '서동욱', company: '한국과학기술원', position: '박사후연구원', bio: '컴파일러 최적화 및 프로그램 분석 기법을 연구합니다.', keywords: ['컴파일러', '프로그램분석', '최적화', 'LLVM'], category: 'computer-science', email: 'researcher10@kaist.ac.kr', phone: '010-0000-0010', specialRole: null },

  // =========================================================================
  // AI/머신러닝 (10명) - 인덱스 10~19
  // =========================================================================
  { id: 'demo_11', name: '장현우', company: 'KAIST', position: '석좌교수', bio: '강화학습과 대규모 언어모델 연구의 세계적 권위자입니다.', keywords: ['강화학습', 'LLM', '자연어처리', '대규모언어모델'], category: 'artificial-intelligence', email: 'researcher11@kaist.ac.kr', phone: '010-0000-0011', specialRole: null },
  { id: 'demo_12', name: '김나연', company: '서울대학교', position: '부교수', bio: '컴퓨터 비전과 영상 인식 분야에서 딥러닝 모델을 개발합니다.', keywords: ['컴퓨터비전', '딥러닝', '영상인식', '객체탐지'], category: 'artificial-intelligence', email: 'researcher12@snu.ac.kr', phone: '010-0000-0012', specialRole: null },
  { id: 'demo_13', name: '오준혁', company: '기초과학연구원 IBS', position: '연구위원', bio: '생성형 AI 모델의 이론적 기반과 안전성을 연구합니다.', keywords: ['생성AI', 'AI안전성', '확산모델', 'AI이론'], category: 'artificial-intelligence', email: 'researcher13@ibs.re.kr', phone: '010-0000-0013', specialRole: null },
  { id: 'demo_14', name: '배수진', company: '포항공과대학교', position: '조교수', bio: '음성 인식 및 음성 합성 기술의 최신 딥러닝 기법을 연구합니다.', keywords: ['음성인식', '음성합성', 'TTS', '오디오딥러닝'], category: 'artificial-intelligence', email: 'researcher14@postech.ac.kr', phone: '010-0000-0014', specialRole: null },
  { id: 'demo_15', name: '류승민', company: 'ETRI', position: '수석연구원', bio: '자율주행 인지 시스템을 위한 멀티모달 AI를 개발합니다.', keywords: ['자율주행', '멀티모달AI', '센서퓨전', '인지시스템'], category: 'artificial-intelligence', email: 'researcher15@etri.re.kr', phone: '010-0000-0015', specialRole: null },
  { id: 'demo_16', name: '송지원', company: '연세대학교', position: '연구교수', bio: '추천 시스템과 그래프 신경망 기반 사용자 모델링을 연구합니다.', keywords: ['추천시스템', '그래프신경망', '사용자모델링', '협업필터링'], category: 'artificial-intelligence', email: 'researcher16@yonsei.ac.kr', phone: '010-0000-0016', specialRole: null },
  { id: 'demo_17', name: '조민재', company: '고려대학교', position: '교수', bio: '지식 그래프와 온톨로지 기반 추론 시스템을 연구합니다.', keywords: ['지식그래프', '온톨로지', '시멘틱웹', '지식추론'], category: 'artificial-intelligence', email: 'researcher17@korea.ac.kr', phone: '010-0000-0017', specialRole: null },
  { id: 'demo_18', name: '허연주', company: '한국전자통신연구원', position: '선임연구원', bio: '의료 AI와 임상 의사결정 지원 시스템을 개발합니다.', keywords: ['의료AI', '임상의사결정', '의료영상', 'XAI'], category: 'artificial-intelligence', email: 'researcher18@etri.re.kr', phone: '010-0000-0018', specialRole: null },
  { id: 'demo_19', name: '남기현', company: '울산과학기술원', position: '부교수', bio: '로봇 학습과 매니퓰레이션을 위한 AI 제어 기술을 연구합니다.', keywords: ['로봇학습', '매니퓰레이션', 'AI제어', '모방학습'], category: 'artificial-intelligence', email: 'researcher19@unist.ac.kr', phone: '010-0000-0019', specialRole: null },
  { id: 'demo_20', name: '이하은', company: '성균관대학교', position: '조교수', bio: 'AI 공정성과 편향 탐지, 설명 가능한 AI를 연구합니다.', keywords: ['AI공정성', '편향탐지', '설명가능AI', 'AI윤리'], category: 'artificial-intelligence', email: 'researcher20@skku.edu', phone: '010-0000-0020', specialRole: null },

  // =========================================================================
  // 생물학 (10명) - 인덱스 20~29
  // =========================================================================
  { id: 'demo_21', name: '박지영', company: '서울대학교', position: '교수', bio: '유전체학과 후성유전학 분야에서 유전자 발현 조절을 연구합니다.', keywords: ['유전체학', '후성유전학', '유전자발현', '크로마틴'], category: 'biology', email: 'researcher21@snu.ac.kr', phone: '010-0000-0021', specialRole: null },
  { id: 'demo_22', name: '김태윤', company: '한국생명공학연구원', position: '책임연구원', bio: 'CRISPR 유전자 편집 기술을 활용한 질병 모델 개발을 수행합니다.', keywords: ['CRISPR', '유전자편집', '질병모델', '유전공학'], category: 'biology', email: 'researcher22@kribb.re.kr', phone: '010-0000-0022', specialRole: null },
  { id: 'demo_23', name: '정예린', company: '기초과학연구원 IBS', position: '연구위원', bio: '합성생물학으로 인공 유전회로와 미생물 세포공장을 설계합니다.', keywords: ['합성생물학', '유전회로', '세포공장', '대사공학'], category: 'biology', email: 'researcher23@ibs.re.kr', phone: '010-0000-0023', specialRole: null },
  { id: 'demo_24', name: '이준호', company: 'KAIST', position: '부교수', bio: '줄기세포 분화 메커니즘과 조직 재생 기술을 연구합니다.', keywords: ['줄기세포', '분화', '조직재생', '오가노이드'], category: 'biology', email: 'researcher24@kaist.ac.kr', phone: '010-0000-0024', specialRole: null },
  { id: 'demo_25', name: '최수빈', company: '포항공과대학교', position: '조교수', bio: '단백질 구조생물학과 크라이오전자현미경 기법을 연구합니다.', keywords: ['구조생물학', '크라이오EM', '단백질구조', 'X선결정학'], category: 'biology', email: 'researcher25@postech.ac.kr', phone: '010-0000-0025', specialRole: null },
  { id: 'demo_26', name: '안정현', company: '한국해양과학기술원', position: '선임연구원', bio: '해양 미생물 생태학과 메타게놈 분석을 연구합니다.', keywords: ['해양미생물', '메타게놈', '미생물생태학', '환경미생물'], category: 'biology', email: 'researcher26@kiost.ac.kr', phone: '010-0000-0026', specialRole: null },
  { id: 'demo_27', name: '유민서', company: '연세대학교', position: '연구교수', bio: '식물 분자생물학과 작물 유전체 개량을 연구합니다.', keywords: ['식물생물학', '작물유전체', '분자육종', '광합성'], category: 'biology', email: 'researcher27@yonsei.ac.kr', phone: '010-0000-0027', specialRole: null },
  { id: 'demo_28', name: '권혁재', company: '한국생명공학연구원', position: '수석연구원', bio: '바이오인포매틱스와 단일세포 전사체 분석을 수행합니다.', keywords: ['바이오인포매틱스', '단일세포분석', '전사체', '시스템생물학'], category: 'biology', email: 'researcher28@kribb.re.kr', phone: '010-0000-0028', specialRole: null },
  { id: 'demo_29', name: '신하린', company: '고려대학교', position: '박사과정', bio: '면역세포 신호전달과 자가면역질환 메커니즘을 연구합니다.', keywords: ['면역학', '신호전달', '자가면역', 'T세포'], category: 'biology', email: 'researcher29@korea.ac.kr', phone: '010-0000-0029', specialRole: null },
  { id: 'demo_30', name: '문성호', company: '서울대학교', position: '부교수', bio: '진화생물학과 집단유전학 이론 및 계통분석을 연구합니다.', keywords: ['진화생물학', '집단유전학', '계통분석', '분자진화'], category: 'biology', email: 'researcher30@snu.ac.kr', phone: '010-0000-0030', specialRole: null },

  // =========================================================================
  // 의학 (10명) - 인덱스 30~39
  // =========================================================================
  { id: 'demo_31', name: '황민지', company: '서울대학교병원', position: '교수', bio: '종양면역학 기반 항암 면역치료 임상 연구를 이끌고 있습니다.', keywords: ['종양면역학', '면역치료', '항암제', '임상시험'], category: 'medicine', email: 'researcher31@snuh.org', phone: '010-0000-0031', specialRole: null },
  { id: 'demo_32', name: '조현준', company: '연세대학교 의과대학', position: '부교수', bio: '정밀의료와 유전체 기반 맞춤형 치료 전략을 연구합니다.', keywords: ['정밀의료', '유전체의학', '약물유전체', '맞춤치료'], category: 'medicine', email: 'researcher32@yuhs.ac', phone: '010-0000-0032', specialRole: null },
  { id: 'demo_33', name: '나영은', company: '삼성서울병원', position: '조교수', bio: '신경퇴행성 질환의 바이오마커 발굴과 조기 진단을 연구합니다.', keywords: ['신경퇴행성질환', '바이오마커', '알츠하이머', '조기진단'], category: 'medicine', email: 'researcher33@samsung.com', phone: '010-0000-0033', specialRole: null },
  { id: 'demo_34', name: '김재혁', company: '서울아산병원', position: '교수', bio: '심혈관 중재시술과 인공혈관 스텐트 기술을 연구합니다.', keywords: ['심혈관', '중재시술', '스텐트', '인공혈관'], category: 'medicine', email: 'researcher34@amc.seoul.kr', phone: '010-0000-0034', specialRole: null },
  { id: 'demo_35', name: '이소율', company: '가톨릭대학교 의과대학', position: '연구교수', bio: '감염병 역학과 백신 면역반응 연구를 수행합니다.', keywords: ['감염병역학', '백신', '면역반응', '공중보건'], category: 'medicine', email: 'researcher35@catholic.ac.kr', phone: '010-0000-0035', specialRole: null },
  { id: 'demo_36', name: '백승환', company: '한국한의학연구원', position: '선임연구원', bio: '전통 한약 성분의 약리기전과 임상 근거를 과학적으로 규명합니다.', keywords: ['한의학', '약리기전', '천연물', '임상근거'], category: 'medicine', email: 'researcher36@kiom.re.kr', phone: '010-0000-0036', specialRole: null },
  { id: 'demo_37', name: '오세연', company: '국립암센터', position: '연구의', bio: '소화기 종양의 분자병리와 표적치료제 개발을 연구합니다.', keywords: ['소화기종양', '분자병리', '표적치료', '암유전체'], category: 'medicine', email: 'researcher37@ncc.re.kr', phone: '010-0000-0037', specialRole: null },
  { id: 'demo_38', name: '정다은', company: '서울대학교 약학대학', position: '부교수', bio: '약물전달시스템과 나노의약품 설계를 연구합니다.', keywords: ['약물전달', '나노의약품', '약제학', 'DDS'], category: 'medicine', email: 'researcher38@snu.ac.kr', phone: '010-0000-0038', specialRole: null },
  { id: 'demo_39', name: '구본혁', company: '분당서울대학교병원', position: '교수', bio: '의료 빅데이터와 전자건강기록 기반 임상 연구를 수행합니다.', keywords: ['의료빅데이터', 'EHR', '임상정보학', '실세계데이터'], category: 'medicine', email: 'researcher39@snubh.org', phone: '010-0000-0039', specialRole: null },
  { id: 'demo_40', name: '장유진', company: 'KAIST 의과학대학원', position: '조교수', bio: '재생의학과 3D 바이오프린팅 기반 인공조직을 연구합니다.', keywords: ['재생의학', '바이오프린팅', '인공조직', '조직공학'], category: 'medicine', email: 'researcher40@kaist.ac.kr', phone: '010-0000-0040', specialRole: null },

  // =========================================================================
  // 물리학 (10명) - 인덱스 40~49
  // =========================================================================
  { id: 'demo_41', name: '한지민', company: '서울대학교', position: '교수', bio: '양자 컴퓨팅 이론과 양자 오류 보정 알고리즘을 연구합니다.', keywords: ['양자컴퓨팅', '양자오류보정', '양자알고리즘', '양자정보'], category: 'physics', email: 'researcher41@snu.ac.kr', phone: '010-0000-0041', specialRole: null },
  { id: 'demo_42', name: '류현진', company: '기초과학연구원 IBS', position: '연구단장', bio: '초전도 양자소자와 양자 센싱 기술의 세계적 연구자입니다.', keywords: ['초전도', '양자소자', '양자센싱', '저온물리'], category: 'physics', email: 'researcher42@ibs.re.kr', phone: '010-0000-0042', specialRole: null },
  { id: 'demo_43', name: '전소미', company: 'KAIST', position: '부교수', bio: '응집물질 이론과 위상학적 물질의 전자구조를 연구합니다.', keywords: ['응집물질', '위상물질', '전자구조', '밴드이론'], category: 'physics', email: 'researcher43@kaist.ac.kr', phone: '010-0000-0043', specialRole: null },
  { id: 'demo_44', name: '이광수', company: '포항공과대학교', position: '교수', bio: '포항 방사광 가속기를 활용한 물질과학 실험을 수행합니다.', keywords: ['방사광', '가속기', '물질과학', 'X선분광'], category: 'physics', email: 'researcher44@postech.ac.kr', phone: '010-0000-0044', specialRole: null },
  { id: 'demo_45', name: '윤보라', company: '한국천문연구원', position: '선임연구원', bio: '천체물리학과 중력파 관측 데이터 분석을 연구합니다.', keywords: ['천체물리', '중력파', '관측천문학', '우주론'], category: 'physics', email: 'researcher45@kasi.re.kr', phone: '010-0000-0045', specialRole: null },
  { id: 'demo_46', name: '차승원', company: '고려대학교', position: '교수', bio: '입자물리학과 가속기 실험에서 새로운 입자를 탐색합니다.', keywords: ['입자물리', '가속기실험', 'LHC', '표준모형'], category: 'physics', email: 'researcher46@korea.ac.kr', phone: '010-0000-0046', specialRole: null },
  { id: 'demo_47', name: '김유정', company: '울산과학기술원', position: '조교수', bio: '나노 광학과 메타물질을 이용한 광소자를 설계합니다.', keywords: ['나노광학', '메타물질', '광소자', '플라즈모닉스'], category: 'physics', email: 'researcher47@unist.ac.kr', phone: '010-0000-0047', specialRole: null },
  { id: 'demo_48', name: '박보검', company: '한국핵융합에너지연구원', position: '책임연구원', bio: '핵융합 플라즈마 물리와 KSTAR 토카막 운전을 연구합니다.', keywords: ['핵융합', '플라즈마', 'KSTAR', '토카막'], category: 'physics', email: 'researcher48@kfe.re.kr', phone: '010-0000-0048', specialRole: null },
  { id: 'demo_49', name: '강다니엘', company: '성균관대학교', position: '부교수', bio: '반도체 물리와 2차원 물질의 전자 수송 현상을 연구합니다.', keywords: ['반도체물리', '2차원물질', '전자수송', '그래핀'], category: 'physics', email: 'researcher49@skku.edu', phone: '010-0000-0049', specialRole: null },
  { id: 'demo_50', name: '이서진', company: '기초과학연구원 IBS', position: '박사후연구원', bio: '양자광학과 양자 얽힘 기반 통신 프로토콜을 연구합니다.', keywords: ['양자광학', '양자얽힘', '양자통신', '광자'], category: 'physics', email: 'researcher50@ibs.re.kr', phone: '010-0000-0050', specialRole: null },

  // =========================================================================
  // 화학 (10명) - 인덱스 50~59
  // =========================================================================
  { id: 'demo_51', name: '양현석', company: 'KAIST', position: '석좌교수', bio: '유기 합성 화학과 의약 화학 분야의 세계적 석학입니다.', keywords: ['유기합성', '의약화학', '촉매반응', '전합성'], category: 'chemistry', email: 'researcher51@kaist.ac.kr', phone: '010-0000-0051', specialRole: null },
  { id: 'demo_52', name: '조은비', company: '서울대학교', position: '교수', bio: '전기화학과 에너지 저장 소재의 기초 원리를 연구합니다.', keywords: ['전기화학', '에너지저장', '배터리소재', '전극촉매'], category: 'chemistry', email: 'researcher52@snu.ac.kr', phone: '010-0000-0052', specialRole: null },
  { id: 'demo_53', name: '문정혁', company: '한국화학연구원', position: '책임연구원', bio: '고분자 합성과 기능성 고분자 재료 개발을 수행합니다.', keywords: ['고분자', '기능성재료', '고분자합성', '나노복합소재'], category: 'chemistry', email: 'researcher53@krict.re.kr', phone: '010-0000-0053', specialRole: null },
  { id: 'demo_54', name: '한재경', company: '포항공과대학교', position: '부교수', bio: '계산화학으로 화학반응 메커니즘과 촉매 설계를 시뮬레이션합니다.', keywords: ['계산화학', '반응메커니즘', '촉매설계', 'DFT'], category: 'chemistry', email: 'researcher54@postech.ac.kr', phone: '010-0000-0054', specialRole: null },
  { id: 'demo_55', name: '신우진', company: '기초과학연구원 IBS', position: '연구위원', bio: '나노화학과 자기조립 나노구조체를 연구합니다.', keywords: ['나노화학', '자기조립', '나노구조체', '콜로이드'], category: 'chemistry', email: 'researcher55@ibs.re.kr', phone: '010-0000-0055', specialRole: null },
  { id: 'demo_56', name: '이채원', company: '연세대학교', position: '조교수', bio: '분석화학과 질량분석 기반 대사체 프로파일링을 연구합니다.', keywords: ['분석화학', '질량분석', '대사체학', '프로테오믹스'], category: 'chemistry', email: 'researcher56@yonsei.ac.kr', phone: '010-0000-0056', specialRole: null },
  { id: 'demo_57', name: '고영민', company: '한국과학기술연구원', position: '선임연구원', bio: '광촉매와 인공 광합성으로 태양에너지 변환을 연구합니다.', keywords: ['광촉매', '인공광합성', '태양에너지', '수소생산'], category: 'chemistry', email: 'researcher57@kist.re.kr', phone: '010-0000-0057', specialRole: null },
  { id: 'demo_58', name: '정수민', company: '고려대학교', position: '교수', bio: '무기화학과 금속유기골격체(MOF) 기반 가스 분리를 연구합니다.', keywords: ['무기화학', 'MOF', '가스분리', '다공성물질'], category: 'chemistry', email: 'researcher58@korea.ac.kr', phone: '010-0000-0058', specialRole: null },
  { id: 'demo_59', name: '배진영', company: '한양대학교', position: '연구교수', bio: '생화학과 효소 공학을 통한 산업용 바이오촉매를 개발합니다.', keywords: ['생화학', '효소공학', '바이오촉매', '단백질공학'], category: 'chemistry', email: 'researcher59@hanyang.ac.kr', phone: '010-0000-0059', specialRole: null },
  { id: 'demo_60', name: '홍서윤', company: '한국화학연구원', position: '수석연구원', bio: '그린 케미스트리와 친환경 용매 개발을 연구합니다.', keywords: ['그린케미스트리', '친환경용매', '지속가능화학', '촉매공정'], category: 'chemistry', email: 'researcher60@krict.re.kr', phone: '010-0000-0060', specialRole: null },

  // =========================================================================
  // 공학 (10명) - 인덱스 60~69
  // =========================================================================
  { id: 'demo_61', name: '김진우', company: 'KAIST', position: '교수', bio: '로봇공학과 자율주행 로봇 시스템 설계를 연구합니다.', keywords: ['로봇공학', '자율주행로봇', '제어시스템', '로봇비전'], category: 'engineering', email: 'researcher61@kaist.ac.kr', phone: '010-0000-0061', specialRole: null },
  { id: 'demo_62', name: '박소현', company: '서울대학교', position: '부교수', bio: '반도체 공정 기술과 차세대 메모리 소자를 연구합니다.', keywords: ['반도체공정', '메모리소자', '나노소자', '박막기술'], category: 'engineering', email: 'researcher62@snu.ac.kr', phone: '010-0000-0062', specialRole: null },
  { id: 'demo_63', name: '이동훈', company: '한국기계연구원', position: '책임연구원', bio: '스마트 제조 시스템과 디지털 트윈 기반 생산 최적화를 연구합니다.', keywords: ['스마트제조', '디지털트윈', '생산최적화', 'CPS'], category: 'engineering', email: 'researcher63@kimm.re.kr', phone: '010-0000-0063', specialRole: null },
  { id: 'demo_64', name: '최윤정', company: '포항공과대학교', position: '조교수', bio: '신재생에너지 시스템과 연료전지 설계를 연구합니다.', keywords: ['신재생에너지', '연료전지', '에너지시스템', '수소에너지'], category: 'engineering', email: 'researcher64@postech.ac.kr', phone: '010-0000-0064', specialRole: null },
  { id: 'demo_65', name: '강승호', company: '한국건설기술연구원', position: '선임연구원', bio: '구조 건전성 모니터링과 스마트 인프라 기술을 연구합니다.', keywords: ['구조공학', '건전성모니터링', '스마트인프라', '센서네트워크'], category: 'engineering', email: 'researcher65@kict.re.kr', phone: '010-0000-0065', specialRole: null },
  { id: 'demo_66', name: '임혜진', company: '울산과학기술원', position: '교수', bio: '신소재 공학과 2차전지용 전극 소재를 개발합니다.', keywords: ['신소재', '전극소재', '2차전지', '소재공학'], category: 'engineering', email: 'researcher66@unist.ac.kr', phone: '010-0000-0066', specialRole: null },
  { id: 'demo_67', name: '서준혁', company: '한국항공우주연구원', position: '책임연구원', bio: '위성 시스템 설계와 우주 발사체 구조 해석을 수행합니다.', keywords: ['위성시스템', '발사체', '항공우주', '구조해석'], category: 'engineering', email: 'researcher67@kari.re.kr', phone: '010-0000-0067', specialRole: null },
  { id: 'demo_68', name: '오승민', company: '한양대학교', position: '연구교수', bio: '생체재료와 의료기기용 임플란트를 설계합니다.', keywords: ['생체재료', '의료기기', '임플란트', '생체역학'], category: 'engineering', email: 'researcher68@hanyang.ac.kr', phone: '010-0000-0068', specialRole: null },
  { id: 'demo_69', name: '유태영', company: '한국전기연구원', position: '수석연구원', bio: '전력전자와 고효율 전력 변환 시스템을 연구합니다.', keywords: ['전력전자', '전력변환', '인버터', '전기에너지'], category: 'engineering', email: 'researcher69@keri.re.kr', phone: '010-0000-0069', specialRole: null },
  { id: 'demo_70', name: '전지현', company: '성균관대학교', position: '부교수', bio: 'MEMS/NEMS 기술과 초소형 센서 시스템을 연구합니다.', keywords: ['MEMS', 'NEMS', '초소형센서', '마이크로가공'], category: 'engineering', email: 'researcher70@skku.edu', phone: '010-0000-0070', specialRole: null },

  // =========================================================================
  // 수학/통계 (10명) - 인덱스 70~79
  // =========================================================================
  { id: 'demo_71', name: '김상우', company: '서울대학교', position: '교수', bio: '대수기하학과 모듈라이 공간의 구조를 연구합니다.', keywords: ['대수기하학', '모듈라이공간', '대수다양체', '호몰로지대수'], category: 'mathematics', email: 'researcher71@snu.ac.kr', phone: '010-0000-0071', specialRole: null },
  { id: 'demo_72', name: '이민아', company: 'KAIST', position: '부교수', bio: '확률론과 확률미분방정식의 이론적 기반을 연구합니다.', keywords: ['확률론', '확률미분방정식', '마팅게일', '확률과정'], category: 'mathematics', email: 'researcher72@kaist.ac.kr', phone: '010-0000-0072', specialRole: null },
  { id: 'demo_73', name: '박현수', company: '포항공과대학교', position: '교수', bio: '편미분방정식과 비선형 해석학을 연구합니다.', keywords: ['편미분방정식', '비선형해석', '수치해석', '함수해석학'], category: 'mathematics', email: 'researcher73@postech.ac.kr', phone: '010-0000-0073', specialRole: null },
  { id: 'demo_74', name: '최은서', company: '고려대학교', position: '조교수', bio: '수리통계학과 베이즈 추론 방법론을 연구합니다.', keywords: ['수리통계', '베이즈추론', '통계모델링', '비모수통계'], category: 'mathematics', email: 'researcher74@korea.ac.kr', phone: '010-0000-0074', specialRole: null },
  { id: 'demo_75', name: '정태훈', company: '국가수리과학연구소', position: '선임연구원', bio: '암호학적 이론과 수론 기반 보안 프로토콜을 연구합니다.', keywords: ['암호학', '수론', '보안프로토콜', '격자암호'], category: 'mathematics', email: 'researcher75@nims.re.kr', phone: '010-0000-0075', specialRole: null },
  { id: 'demo_76', name: '노은주', company: '연세대학교', position: '교수', bio: '위상수학과 매듭 이론의 불변량을 연구합니다.', keywords: ['위상수학', '매듭이론', '불변량', '저차원위상'], category: 'mathematics', email: 'researcher76@yonsei.ac.kr', phone: '010-0000-0076', specialRole: null },
  { id: 'demo_77', name: '강민성', company: '서울대학교', position: '부교수', bio: '최적화 이론과 대규모 볼록 최적화 알고리즘을 연구합니다.', keywords: ['최적화', '볼록최적화', '수치최적화', '연속최적화'], category: 'mathematics', email: 'researcher77@snu.ac.kr', phone: '010-0000-0077', specialRole: null },
  { id: 'demo_78', name: '윤서영', company: '한국과학기술원', position: '박사후연구원', bio: '조합론과 그래프 이론의 극값 문제를 연구합니다.', keywords: ['조합론', '그래프이론', '극값조합론', '이산수학'], category: 'mathematics', email: 'researcher78@kaist.ac.kr', phone: '010-0000-0078', specialRole: null },
  { id: 'demo_79', name: '도현빈', company: '기초과학연구원 IBS', position: '연구위원', bio: '표현론과 리 군의 구조 이론을 연구합니다.', keywords: ['표현론', '리군', '대수적구조', '리대수'], category: 'mathematics', email: 'researcher79@ibs.re.kr', phone: '010-0000-0079', specialRole: null },
  { id: 'demo_80', name: '신지호', company: '울산과학기술원', position: '조교수', bio: '응용수학과 수학적 모델링으로 생물학적 시스템을 분석합니다.', keywords: ['응용수학', '수학적모델링', '생물수학', '동역학시스템'], category: 'mathematics', email: 'researcher80@unist.ac.kr', phone: '010-0000-0080', specialRole: null },

  // =========================================================================
  // 뇌과학 (10명) - 인덱스 80~89
  // =========================================================================
  { id: 'demo_81', name: '김하늘', company: 'KAIST', position: '교수', bio: '뇌-컴퓨터 인터페이스와 신경공학 기술을 연구합니다.', keywords: ['BCI', '신경공학', '뇌-컴퓨터인터페이스', '뉴로피드백'], category: 'neuroscience', email: 'researcher81@kaist.ac.kr', phone: '010-0000-0081', specialRole: null },
  { id: 'demo_82', name: '이준서', company: '서울대학교', position: '부교수', bio: '인지신경과학과 기억 형성의 신경 메커니즘을 연구합니다.', keywords: ['인지신경과학', '기억형성', '해마', '시냅스가소성'], category: 'neuroscience', email: 'researcher82@snu.ac.kr', phone: '010-0000-0082', specialRole: null },
  { id: 'demo_83', name: '윤예진', company: '기초과학연구원 IBS', position: '연구위원', bio: '뇌 커넥톰 분석과 신경회로 매핑을 수행합니다.', keywords: ['커넥톰', '신경회로', '뇌영상', '뇌매핑'], category: 'neuroscience', email: 'researcher83@ibs.re.kr', phone: '010-0000-0083', specialRole: null },
  { id: 'demo_84', name: '권태민', company: '한국뇌연구원', position: '책임연구원', bio: '신경퇴행성 질환의 분자 메커니즘과 치료 표적을 연구합니다.', keywords: ['신경퇴행', '파킨슨병', '신경보호', '분자메커니즘'], category: 'neuroscience', email: 'researcher84@kbri.re.kr', phone: '010-0000-0084', specialRole: null },
  { id: 'demo_85', name: '장서연', company: '연세대학교', position: '조교수', bio: '감정과 의사결정의 신경생물학적 기반을 연구합니다.', keywords: ['감정신경과학', '의사결정', '편도체', '전전두엽'], category: 'neuroscience', email: 'researcher85@yonsei.ac.kr', phone: '010-0000-0085', specialRole: null },
  { id: 'demo_86', name: '홍재민', company: '포항공과대학교', position: '교수', bio: '광유전학으로 신경회로를 조절하고 행동을 분석합니다.', keywords: ['광유전학', '신경회로조절', '행동분석', '광섬유기록'], category: 'neuroscience', email: 'researcher86@postech.ac.kr', phone: '010-0000-0086', specialRole: null },
  { id: 'demo_87', name: '문소율', company: '고려대학교', position: '연구교수', bio: '수면과 각성 조절의 신경과학적 메커니즘을 연구합니다.', keywords: ['수면신경과학', '각성조절', '생체리듬', '시상하부'], category: 'neuroscience', email: 'researcher87@korea.ac.kr', phone: '010-0000-0087', specialRole: null },
  { id: 'demo_88', name: '최하영', company: '한국뇌연구원', position: '선임연구원', bio: '뇌 발달과 신경줄기세포의 분화 과정을 연구합니다.', keywords: ['뇌발달', '신경줄기세포', '신경분화', '발달신경과학'], category: 'neuroscience', email: 'researcher88@kbri.re.kr', phone: '010-0000-0088', specialRole: null },
  { id: 'demo_89', name: '조윤호', company: 'KAIST', position: '박사과정', bio: '계산신경과학과 인공신경망의 생물학적 타당성을 연구합니다.', keywords: ['계산신경과학', '인공신경망', '신경정보처리', '뇌모사컴퓨팅'], category: 'neuroscience', email: 'researcher89@kaist.ac.kr', phone: '010-0000-0089', specialRole: null },
  { id: 'demo_90', name: '배지우', company: '서울대학교 의과대학', position: '부교수', bio: '신경영상학과 fMRI 기반 뇌 기능 연결성 분석을 연구합니다.', keywords: ['신경영상', 'fMRI', '뇌연결성', '뇌네트워크'], category: 'neuroscience', email: 'researcher90@snu.ac.kr', phone: '010-0000-0090', specialRole: null },

  // =========================================================================
  // 환경과학 (10명) - 인덱스 90~99
  // =========================================================================
  { id: 'demo_91', name: '송민기', company: '서울대학교', position: '교수', bio: '기후변화 모델링과 탄소순환 시뮬레이션을 연구합니다.', keywords: ['기후변화', '탄소순환', '기후모델링', '지구시스템'], category: 'environmental-science', email: 'researcher91@snu.ac.kr', phone: '010-0000-0091', specialRole: null },
  { id: 'demo_92', name: '이가은', company: '한국환경연구원', position: '선임연구원', bio: '대기오염 모니터링과 미세먼지 저감 기술을 연구합니다.', keywords: ['대기오염', '미세먼지', '대기질모니터링', '저감기술'], category: 'environmental-science', email: 'researcher92@kei.re.kr', phone: '010-0000-0092', specialRole: null },
  { id: 'demo_93', name: '황정민', company: 'KAIST', position: '부교수', bio: '수질 환경공학과 하폐수 처리의 고도산화 공정을 연구합니다.', keywords: ['수질환경', '하폐수처리', '고도산화', '수처리공정'], category: 'environmental-science', email: 'researcher93@kaist.ac.kr', phone: '010-0000-0093', specialRole: null },
  { id: 'demo_94', name: '나연수', company: '국립생태원', position: '책임연구원', bio: '생태계 서비스 평가와 생물다양성 보전 전략을 연구합니다.', keywords: ['생태계서비스', '생물다양성', '보전생태학', '서식지복원'], category: 'environmental-science', email: 'researcher94@nie.re.kr', phone: '010-0000-0094', specialRole: null },
  { id: 'demo_95', name: '유다인', company: '포항공과대학교', position: '조교수', bio: '토양 오염 정화와 환경 미생물의 생물정화 기술을 연구합니다.', keywords: ['토양오염', '생물정화', '환경미생물', '오염정화'], category: 'environmental-science', email: 'researcher95@postech.ac.kr', phone: '010-0000-0095', specialRole: null },
  { id: 'demo_96', name: '권동혁', company: '한국해양과학기술원', position: '선임연구원', bio: '해양 환경 변화와 해수면 상승 메커니즘을 연구합니다.', keywords: ['해양환경', '해수면상승', '해양순환', '해양관측'], category: 'environmental-science', email: 'researcher96@kiost.ac.kr', phone: '010-0000-0096', specialRole: null },
  { id: 'demo_97', name: '정유나', company: '연세대학교', position: '연구교수', bio: '재생에너지 정책과 탄소중립 달성 경로를 분석합니다.', keywords: ['재생에너지', '탄소중립', '에너지정책', '넷제로'], category: 'environmental-science', email: 'researcher97@yonsei.ac.kr', phone: '010-0000-0097', specialRole: null },
  { id: 'demo_98', name: '박건우', company: '한국환경연구원', position: '수석연구원', bio: '환경 영향 평가와 지속가능 발전 지표를 연구합니다.', keywords: ['환경영향평가', '지속가능발전', 'ESG환경', '환경정책'], category: 'environmental-science', email: 'researcher98@kei.re.kr', phone: '010-0000-0098', specialRole: null },
  { id: 'demo_99', name: '신지수', company: '고려대학교', position: '교수', bio: '환경독성학과 내분비교란물질의 생태 위해성을 평가합니다.', keywords: ['환경독성학', '내분비교란물질', '생태위해성', '위해성평가'], category: 'environmental-science', email: 'researcher99@korea.ac.kr', phone: '010-0000-0099', specialRole: null },
  { id: 'demo_100', name: '조미래', company: '울산과학기술원', position: '조교수', bio: '폐자원 순환과 바이오매스 에너지 전환 기술을 연구합니다.', keywords: ['폐자원순환', '바이오매스', '순환경제', '에너지전환'], category: 'environmental-science', email: 'researcher100@unist.ac.kr', phone: '010-0000-0100', specialRole: null },
];

// =============================================================================
// 성별 분류 및 프로필 이미지 매핑
// =============================================================================
const MALE_IDS = new Set([
  'demo_1', 'demo_2', 'demo_4', 'demo_6', 'demo_8', 'demo_10',       // 컴퓨터과학
  'demo_11', 'demo_13', 'demo_15', 'demo_17', 'demo_19',              // AI/머신러닝
  'demo_22', 'demo_24', 'demo_26', 'demo_28', 'demo_30',              // 생물학
  'demo_32', 'demo_34', 'demo_36', 'demo_39',                         // 의학
  'demo_42', 'demo_44', 'demo_46', 'demo_48', 'demo_49',              // 물리학
  'demo_51', 'demo_53', 'demo_55', 'demo_57', 'demo_59',              // 화학
  'demo_61', 'demo_63', 'demo_65', 'demo_67', 'demo_69',              // 공학
  'demo_71', 'demo_73', 'demo_75', 'demo_77', 'demo_79', 'demo_80',   // 수학/통계
  'demo_82', 'demo_84', 'demo_86', 'demo_89', 'demo_90',              // 뇌과학
  'demo_91', 'demo_93', 'demo_96', 'demo_98',                         // 환경과학
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
// 관리형 그룹 정의 (8개 연구실/연구센터)
// =============================================================================
export const DEMO_GROUPS: DemoGroupDef[] = [
  {
    name: 'AI 융합연구실',
    description: 'AI와 컴퓨터과학의 최신 연구 동향을 공유하고, 공동 연구 과제를 발굴하는 융합 연구 모임입니다.',
    color: '#58A6FF',
    icon: '🚀',
    ownerIndex: 0, // 김도현 (데모계정)
    memberIndices: [0, 11, 12, 15, 20, 24, 25, 51, 52, 55, 57, 65, 71, 81, 92],
    roles: {
      0: { role: 'admin' as ManagedGroupRole },
      11: { role: 'president' as ManagedGroupRole, title: '연구실장' },
      51: { role: 'executive' as ManagedGroupRole, title: '학술위원장' },
      55: { role: 'executive' as ManagedGroupRole, title: '기술자문' },
    },
  },
  {
    name: '차세대 반도체·양자 연구회',
    description: '반도체, 양자 물리, 나노 기술 분야 연구자들의 학술 교류 및 공동 연구 네트워크입니다.',
    color: '#FF6B8A',
    icon: '💡',
    ownerIndex: 8, // 강태준 (KIST)
    memberIndices: [0, 5, 8, 13, 16, 17, 24, 41, 53, 57, 81, 92],
    roles: {
      8: { role: 'admin' as ManagedGroupRole },
      0: { role: 'executive' as ManagedGroupRole, title: '자문위원' },
      5: { role: 'president' as ManagedGroupRole, title: '회장' },
      53: { role: 'executive' as ManagedGroupRole, title: '학술위원' },
    },
  },
  {
    name: '컴퓨터과학 콜로키움',
    description: '분산시스템, 알고리즘, 소프트웨어 공학 등 CS 핵심 분야 정기 세미나 그룹입니다.',
    color: '#10AC84',
    icon: '💼',
    ownerIndex: 1, // 박서준 (KAIST)
    memberIndices: [0, 1, 2, 3, 4, 6, 7, 8, 9, 10],
    roles: {
      1: { role: 'admin' as ManagedGroupRole },
      0: { role: 'president' as ManagedGroupRole, title: '학회장' },
      3: { role: 'executive' as ManagedGroupRole, title: '부학회장' },
      7: { role: 'executive' as ManagedGroupRole, title: '총무' },
    },
  },
  {
    name: '유기화학·의약화학 연구실',
    description: '유기 합성, 의약 화학, 촉매 화학 분야의 첨단 연구 성과를 공유하는 학술 모임입니다.',
    color: '#A29BFE',
    icon: '🎓',
    ownerIndex: 51, // 양현석 (KAIST)
    memberIndices: [0, 11, 15, 23, 25, 29, 51, 52, 55, 56, 59, 63],
    roles: {
      51: { role: 'admin' as ManagedGroupRole },
      55: { role: 'president' as ManagedGroupRole, title: '연구실장' },
      56: { role: 'executive' as ManagedGroupRole, title: '연구이사' },
      0: { role: 'member' as ManagedGroupRole },
    },
  },
  {
    name: '학제간 연구자 네트워크',
    description: '다양한 분야의 연구자들이 모여 학제간 협력 연구를 기획하고 공동 논문을 발표하는 프리미엄 연구 모임입니다.',
    color: '#FFA657',
    icon: '⭐',
    ownerIndex: 0, // 김도현 (데모계정)
    memberIndices: [0, 1, 4, 11, 21, 22, 31, 41, 42, 51, 58, 61, 62, 67, 71, 78, 82, 86, 91, 94],
    roles: {
      0: { role: 'admin' as ManagedGroupRole },
      1: { role: 'president' as ManagedGroupRole, title: '네트워크 의장' },
      31: { role: 'executive' as ManagedGroupRole, title: '의학분과장' },
      71: { role: 'executive' as ManagedGroupRole, title: '수학분과장' },
      58: { role: 'executive' as ManagedGroupRole, title: '학술위원' },
    },
  },
  {
    name: '신진연구자 모임',
    description: '조교수, 박사후연구원, 박사과정 등 신진 연구자들의 커리어 개발 및 멘토링 네트워크입니다.',
    color: '#FF9F43',
    icon: '🔥',
    ownerIndex: 13, // 오준혁 (IBS)
    memberIndices: [0, 5, 13, 17, 24, 49, 53, 81],
    roles: {
      13: { role: 'admin' as ManagedGroupRole },
      5: { role: 'president' as ManagedGroupRole, title: '회장' },
      53: { role: 'executive' as ManagedGroupRole, title: '부회장' },
      0: { role: 'member' as ManagedGroupRole },
    },
  },
  {
    name: '바이오의학 연구센터',
    description: '생물학, 의학, 뇌과학 연구자들이 모여 질병 메커니즘과 치료 기술을 논의하는 연구 모임입니다.',
    color: '#48DBFB',
    icon: '💎',
    ownerIndex: 24, // 이준호 (KAIST)
    memberIndices: [0, 21, 22, 23, 24, 25, 26, 27, 28, 29],
    roles: {
      24: { role: 'admin' as ManagedGroupRole },
      21: { role: 'president' as ManagedGroupRole, title: '학술의장' },
      25: { role: 'executive' as ManagedGroupRole, title: '구조생물분과장' },
      0: { role: 'executive' as ManagedGroupRole, title: '정보과학자문' },
    },
  },
  {
    name: '기후·환경 연구 포럼',
    description: '기후변화, 환경오염, 생태계 보전 등 환경과학 전반의 연구 동향을 교류하는 전문 포럼입니다.',
    color: '#6C5CE7',
    icon: '🤝',
    ownerIndex: 0, // 김도현 (데모계정)
    memberIndices: [0, 4, 7, 10, 22, 28, 33, 40, 46, 62, 67, 69, 78, 94],
    roles: {
      0: { role: 'admin' as ManagedGroupRole },
      7: { role: 'president' as ManagedGroupRole, title: '포럼 의장' },
      40: { role: 'executive' as ManagedGroupRole, title: '의학분과자문' },
      78: { role: 'executive' as ManagedGroupRole, title: '수리모델링자문' },
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
  { fromIndex: 11, purpose: 'collaboration' as const, message: '강화학습과 분산시스템을 결합한 공동 연구 가능성에 대해 논의하고 싶습니다.', status: 'pending' as const },
  { fromIndex: 24, purpose: 'networking' as const, message: '줄기세포 분화 연구에 컴퓨터 시뮬레이션을 적용하는 방안에 대해 이야기 나누고 싶습니다.', status: 'accepted' as const },
  { fromIndex: 53, purpose: 'insight' as const, message: '고분자 합성 데이터의 자동 분석 파이프라인 구축에 대해 조언을 구하고 싶습니다.', status: 'completed' as const },
];

// =============================================================================
// 이름 → 카테고리 맵 (firebase-services.ts 호환용)
// =============================================================================
export const DEMO_NAME_CATEGORY_MAP: Record<string, string> = Object.fromEntries(
  DEMO_MEMBERS.map(m => [m.name, m.category])
);
