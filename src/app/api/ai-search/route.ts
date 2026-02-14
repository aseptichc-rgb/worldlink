import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifyAuthToken } from '@/lib/firebase-admin';

// 멤버 데이터 (demo-data와 동일)
const memberData = [
  { id: 'member_1', name: '강대원', company: '(주)메디라인액티브코리아', position: '대표', bio: 'Non-PVC 수액세트 등 의료용 소모품 제조 및 수입·유통 전문 기업입니다.', keywords: ['의료기기', '수액세트', '제조', '유통', '수입'], category: '의료기기' },
  { id: 'member_2', name: '고상원', company: '(주)마케시안', position: '대표', bio: '헬스케어 비즈니스 전략 수립 및 이커머스 마케팅 솔루션을 제공합니다.', keywords: ['헬스케어', '마케팅', '이커머스', '전략', '솔루션'], category: '솔루션' },
  { id: 'member_3', name: '권인호', company: '데일리파트너스', position: '전무', bio: '바이오 및 헬스케어 혁신 기업에 투자하는 벤처캐피탈(VC)입니다.', keywords: ['투자', 'VC', '바이오', '헬스케어', '스타트업'], category: '투자' },
  { id: 'member_4', name: '김국배', company: '애니메디솔루션', position: '대표', bio: 'AI와 3D 프린팅 기술을 활용한 환자 맞춤형 수술 솔루션 전문 기업입니다.', keywords: ['AI', '3D프린팅', '수술', '맞춤형', '의료기기'], category: '의료기기' },
  { id: 'member_5', name: '김선욱', company: '법무법인 세승', position: '대표변호사', bio: '의료 소송 및 병원 경영 자문에 특화된 국내 대표 의료 전문 로펌입니다.', keywords: ['법률', '의료소송', '병원자문', '로펌'], category: '법률' },
  { id: 'member_6', name: '김성포', company: '(주)엠에스바이오', position: '대표', bio: '체외진단용 의료기기 및 바이오 소재 연구·개발 전문 기업입니다.', keywords: ['체외진단', '바이오', '의료기기', '연구개발'], category: '바이오' },
  { id: 'member_7', name: '김소은', company: '한국오가논(주)', position: '대표', bio: '글로벌 제약사로, 특히 여성 건강 및 만성 질환 치료 분야에 집중합니다.', keywords: ['제약', '글로벌', '여성건강', '만성질환'], category: '제약' },
  { id: 'member_8', name: '김재영', company: '아셉틱 /오크우드봄의원', position: '심사역 /내과 원장', bio: '"ASEPTIC GROUP"은 바이오-헬스케어 분야를 주력으로 Company Building, Pre-Seed, Seed, Series A 단계에 투자하는 "Bio-Health care specific Startup Studio"입니다.', keywords: ['투자', '디지털헬스', '내과', 'AI'], category: '솔루션' },
  { id: 'member_9', name: '김재형', company: '신한메디칼(주)', position: '대표', bio: '호흡기 진단 등 정밀 의료 장비를 수입하여 공급하는 전문 기업입니다.', keywords: ['의료기기', '호흡기', '진단장비', '수입', '유통'], category: '의료기기' },
  { id: 'member_10', name: '김학준', company: '고려대의료원', position: '의학연구처 처장', bio: '고려대학교 산하 병원의 의학 연구 인프라와 산학협력을 총괄합니다.', keywords: ['대학병원', '연구', '산학협력', '의학연구'], category: '의료기관' },
  { id: 'member_11', name: '김홍주', company: '(주)에이치피앤씨', position: '부사장', bio: '전문 의약품 및 코스메슈티컬 제품을 생산하는 헬스케어 제조 기업입니다.', keywords: ['제약', '의약품', '코스메슈티컬', '헬스케어', '제조'], category: '제약' },
  { id: 'member_12', name: '나해란', company: '나해란정신의학과의원', position: '원장', bio: '정신건강의학 진료 및 디지털 헬스케어 자문 활동을 병행합니다.', keywords: ['정신건강', '디지털헬스', '의원', '자문'], category: '의료기관' },
  { id: 'member_13', name: '박재은', company: '두잉랩', position: '경영지원그룹 그룹장', bio: 'AI 기반 음식 인식 및 영양 분석 솔루션 \'푸드렌즈\'를 개발했습니다.', keywords: ['AI', '영양분석', '푸드테크', '솔루션', '헬스케어'], category: '솔루션' },
  { id: 'member_14', name: '변희병', company: '대원제약', position: '대외협력실 전무', bio: '국내 주요 제약사로, 짜먹는 감기약 등 개량신약에 강점을 보유합니다.', keywords: ['제약', '개량신약', '의약품', '제조'], category: '제약' },
  { id: 'member_15', name: '선경훈', company: '선치과병원 / 인스텍', position: '병원장 / 대표', bio: '디지털 기술을 접목한 고도화된 치과 진료 서비스를 제공하는 병원입니다. 금속 3D 프린팅 하드웨어, 소프트웨어 및 재료공정 기술을 보유한 인스텍의 대표입니다.', keywords: ['치과', '병원', '디지털', '진료', '3D프린팅'], category: '의료기관' },
  { id: 'member_16', name: '송재준', company: '고려대학교 구로병원 / 뉴라이브', position: '이비인후과 교수 / 대표', bio: '임상 진료와 함께 의생명 공학 분야의 다양한 연구 활동을 수행합니다. 미주 신경 자극 기술을 활용한 이명 디지털 치료제 \'뉴라이브\'의 대표입니다.', keywords: ['대학병원', '이비인후과', '연구', '의생명공학', '디지털치료제'], category: '의료기관' },
  { id: 'member_17', name: '송진규', company: '(주)진바이오', position: '대표', bio: '발효 기술 기반의 기능성 원료 및 바이오 소재 개발 전문 기업입니다.', keywords: ['바이오', '발효', '기능성원료', '연구개발'], category: '바이오' },
  { id: 'member_18', name: '신현주', company: '(주)엔윤', position: '대표', bio: '자수직물 및 섬유고급소재를 제조, 수출하는 글로벌 의류 기업입니다', keywords: ['비즈니스', '전략', '글로벌', '의류'], category: '비즈니스' },
  { id: 'member_19', name: '양성용', company: '(주)다루소프트', position: 'IT사업본부 이사', bio: '의료 시스템 구축 및 데이터 분석 솔루션 개발 전문 IT 기업입니다.', keywords: ['IT', '의료시스템', '데이터분석', '솔루션', '개발'], category: '솔루션' },
  { id: 'member_20', name: '양정희', company: '고려대의료원', position: '연구전략본부 연구교수', bio: '의료원의 중장기 연구 전략 수립 및 연구 기획을 담당하는 기관입니다.', keywords: ['대학병원', '연구', '전략기획'], category: '의료기관' },
  { id: 'member_21', name: '오가나', company: '오가나셀 피부과의원', position: '대표원장', bio: '피부과 전문 진료와 함께 프리미엄 스킨케어 브랜드를 운영합니다.', keywords: ['피부과', '의원', '스킨케어', '뷰티'], category: '의료기관' },
  { id: 'member_22', name: '윤동욱', company: '법률사무소 서희', position: '대표변호사', bio: '의료 소송 및 지식재산권 분야 법률 서비스를 제공하는 사무소입니다.', keywords: ['법률', '의료소송', '지식재산권', '특허'], category: '법률' },
  { id: 'member_23', name: '윤여혜', company: '(주)중헌제약', position: '품질부서 차장', bio: '안과 의약품 및 히알루론산 기반 필러를 제조하는 제약사입니다.', keywords: ['제약', '안과', '히알루론산', '필러', '제조'], category: '제약' },
  { id: 'member_24', name: '윤정로', company: '뉴대성병원', position: '병원장', bio: '지역사회 중심의 종합 의료 서비스를 제공하는 거점 의료기관입니다.', keywords: ['종합병원', '지역의료', '병원경영'], category: '의료기관' },
  { id: 'member_25', name: '이민우', company: '고려대 구로병원', position: '운영기획실 실장', bio: '헬스케어 스타트업의 병원 연계 실증 및 사업화를 지원하는 조직입니다.', keywords: ['대학병원', '스타트업', '실증', '사업화'], category: '의료기관' },
  { id: 'member_26', name: '이석구', company: '에스지엘', position: '대표', bio: '중동 지역 의료 진출 및 글로벌 비즈니스 자문을 수행합니다.', keywords: ['컨설팅', '글로벌', '해외진출', '중동'], category: '비즈니스' },
  { id: 'member_27', name: '이성현', company: '고려대 구로병원', position: '의생명연구센터 연구교수', bio: '첨단 의료기기 개발 및 임상 시험 관련 연구 활동을 수행합니다.', keywords: ['대학병원', '연구', '의료기기', '임상시험'], category: '의료기관' },
  { id: 'member_28', name: '이승아', company: '휴이노', position: '부사장', bio: 'AI 기반 웨어러블 심전도 모니터링 및 원격 의료 솔루션을 선도합니다.', keywords: ['AI', '웨어러블', '심전도', '원격의료', '모니터링'], category: '의료기기' },
  { id: 'member_29', name: '이승표', company: '(주)소망헬스케어', position: '대표/이사장', bio: '마음건강 케어 및 사회적 의료 서비스를 제공하는 재단 및 기업입니다.', keywords: ['정신건강', '사회적기업', '헬스케어'], category: '의료기관' },
  { id: 'member_30', name: '이영환', company: '휴니버스 글로벌', position: '빅데이터본부 이사', bio: '클라우드 기반 병원정보시스템(P-HIS) 및 의료 빅데이터 전문 기업입니다.', keywords: ['클라우드', '병원정보시스템', '빅데이터', 'IT'], category: '솔루션' },
  { id: 'member_31', name: '이예하', company: 'VUNO', position: '대표', bio: '딥러닝 기반 의료 영상 및 생체신호 분석 AI 솔루션 전문 기업 뷰노입니다.', keywords: ['AI', '딥러닝', '의료영상', '생체신호', '분석'], category: '솔루션' },
  { id: 'member_32', name: '이종근', company: '특허법인 MAPS', position: '변리사', bio: '바이오 및 ICT 융합 기술 분야 특허 권리화와 컨설팅을 전담합니다.', keywords: ['특허', '변리사', '바이오', 'ICT', '지식재산권'], category: '특허' },
  { id: 'member_33', name: '이태규', company: '스케일업파트너스', position: '대표', bio: '기술 기반 유망 기업의 성장 가속화를 돕는 엑셀러레이터입니다.', keywords: ['투자', '엑셀러레이터', '스타트업', '성장지원'], category: '투자' },
  { id: 'member_34', name: '임환', company: 'KIST/홍릉강소특구', position: '본부장/단장', bio: '바이오·의료 클러스터 조성 및 기술 사업화를 지원하는 공공기관입니다.', keywords: ['공공기관', '바이오', '클러스터', '기술사업화', '연구'], category: '비즈니스' },
  { id: 'member_35', name: '장강호', company: '인사이트에퀴티파트너스', position: '투자팀 상무', bio: '바이오 및 첨단 소재 기업에 투자하는 전문 사모펀드 운용사입니다.', keywords: ['투자', '사모펀드', '바이오', '첨단소재'], category: '투자' },
  { id: 'member_36', name: '장우석', company: '나누리병원/나누리에쿼티', position: '법인장/본부장', bio: '병원 경영 지원과 함께 연관 산업 투자를 진행하는 법인입니다.', keywords: ['병원', '경영지원', '투자', '척추전문'], category: '의료기관' },
  { id: 'member_37', name: '정경진', company: '가천대 길병원/유에프유헬스', position: '과장/대표', bio: '비뇨기 질환 치료를 위한 마이크로니들 등 신약 물질을 연구합니다.', keywords: ['바이오', '비뇨기', '마이크로니들', '신약개발', '연구'], category: '바이오' },
  { id: 'member_38', name: '정성관', company: '우리아이들병원', position: '이사장', bio: '소아청소년 전문 병원으로, 지역 기반 어린이 맞춤형 진료를 제공합니다.', keywords: ['소아청소년', '전문병원', '지역의료'], category: '의료기관' },
  { id: 'member_39', name: '조경희', company: '고려대학교 안암병원', position: '신경과 교수', bio: '뇌신경 질환 진료와 함께 디지털 인지 치료 관련 연구를 수행합니다.', keywords: ['대학병원', '신경과', '디지털치료', '연구'], category: '의료기관' },
  { id: 'member_40', name: '주이신', company: '뉴대성병원', position: '전략기획본부 본부장', bio: '병원의 미래 성장 동력 발굴 및 운영 효율화 기획을 담당합니다.', keywords: ['병원', '전략기획', '경영'], category: '의료기관' },
  { id: 'member_41', name: '주형로', company: '하나이비인후과', position: '원장', bio: '이비인후과 전문 질환의 특화 진료 및 수술을 전담하는 의료기관입니다.', keywords: ['이비인후과', '의원', '수술'], category: '의료기관' },
  { id: 'member_42', name: '최승현', company: '(주)아피셀테라퓨틱스', position: '플랫폼연구실 실장', bio: '차세대 유전자 세포치료제를 개발하는 바이오 테크 기업입니다.', keywords: ['바이오', '세포치료제', '유전자치료', '연구개발'], category: '바이오' },
  { id: 'member_43', name: '최종일', company: '고려대학교 안암병원', position: '적정진료관리부장/교수', bio: '의료 서비스 품질 관리와 심혈관 질환 임상 연구를 총괄합니다.', keywords: ['대학병원', '심혈관', '품질관리', '연구'], category: '의료기관' },
  { id: 'member_44', name: '최준', company: '고려대학교 안산병원', position: '이비인후과 교수(과장)', bio: '임상 진료 외 의료 분쟁 및 의료 관련 규제 분야 연구도 활발합니다.', keywords: ['대학병원', '이비인후과', '의료법', '연구'], category: '의료기관' },
  { id: 'member_45', name: '태범식', company: '고려대학교 안산병원', position: '비뇨의학과 부교수', bio: '로봇 수술 등 첨단 비뇨기 수술 및 암 연구 전문의입니다.', keywords: ['대학병원', '비뇨의학', '로봇수술', '암연구'], category: '의료기관' },
  { id: 'member_46', name: '한예성', company: '(주)파인더패턴', position: '대표', bio: '헬스케어 기반의 데이터 분석 기술 및 비즈니스 모델을 개발합니다.', keywords: ['데이터분석', '헬스케어', 'AI', '솔루션'], category: '솔루션' },
  { id: 'member_47', name: '한성희', company: '고려대학교 안암병원', position: '연구부원장보', bio: '병원의 연구 인프라 고도화 및 대형 국책 과제 기획을 총괄합니다.', keywords: ['대학병원', '연구', '국책과제', '인프라'], category: '의료기관' },
  { id: 'member_48', name: '허기나', company: '로완', position: '영업마케팅 본부장', bio: '디지털 인지 훈련 솔루션인 디지털 치료기기를 전문 개발·유통합니다.', keywords: ['디지털치료기기', '인지훈련', '솔루션', '개발'], category: '의료기기' },
  { id: 'member_49', name: '홍석원', company: '재단법인 대성재단', position: '이사장', bio: '종합병원 운영과 함께 노인 요양 등 복합 의료 서비스를 제공합니다.', keywords: ['재단', '종합병원', '노인요양', '복합의료'], category: '의료기관' },
  { id: 'member_50', name: '황은경', company: '창헬스케어', position: '부사장', bio: '맞춤형 건강 검진 및 질병 예방을 위한 헬스케어 대행사입니다.', keywords: ['건강검진', '예방의학', '헬스케어', '대행'], category: '비즈니스' },
];

export async function POST(req: NextRequest) {
  // Verify authenticated user
  const uid = await verifyAuthToken(req);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
  }

  try {
    const { query } = await req.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    const membersContext = memberData.map(m =>
      `[${m.id}] ${m.name} | ${m.company} | ${m.position} | ${m.bio} | 키워드: ${m.keywords.join(', ')} | 분야: ${m.category}`
    ).join('\n');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `당신은 인맥 네트워크 추천 AI 어시스턴트입니다.
아래는 사용자의 인맥 목록입니다:

${membersContext}

사용자의 요청: "${query}"

위 인맥 목록에서 사용자의 요청에 가장 적합한 사람을 1~5명 추천해주세요.

반드시 아래 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):
{
  "summary": "추천 요약 (1-2문장, 한국어)",
  "results": [
    {
      "memberId": "member_X",
      "reason": "추천 이유 (1문장, 한국어)"
    }
  ]
}

규칙:
- memberId는 반드시 위 목록에 있는 ID만 사용
- 요청과 관련 없는 사람은 추천하지 마세요
- 가장 적합한 순서대로 정렬`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const jsonStr = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    return NextResponse.json({
      summary: parsed.summary || '',
      results: (parsed.results || []).map((r: { memberId: string; reason: string }) => ({
        memberId: r.memberId,
        reason: r.reason,
      })),
    });
  } catch (err) {
    console.error('AI Search error:', err);
    return NextResponse.json({ error: 'AI search failed' }, { status: 500 });
  }
}
