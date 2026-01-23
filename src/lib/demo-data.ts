import { User, NetworkNode, NetworkEdge, Recommendation } from '@/types';

// 김재영 프로필 (본인) - 중심 유저
export const demoUsers: User[] = [
  {
    id: 'user-jaeyoung',
    name: '김재영',
    email: 'jaeyoung.kim@example.com',
    phone: '010-8286-0906',
    company: '',
    position: '',
    companySize: 'startup',
    industry: 'IT/소프트웨어',
    positionLevel: 'executive',
    bio: '다양한 분야의 전문가들과 네트워크를 구축하고 있습니다',
    keywords: ['네트워킹', '투자', '헬스케어', 'AI', '스타트업'],
    profileImage: undefined,
    inviteCode: 'JYK-001',
    invitesRemaining: 999,
    coffeeStatus: 'available',
    // 개인정보 공개 설정
    privacySettings: {
      allowProfileDiscovery: true,
      displaySettings: {
        nameDisplay: 'full',
        companyDisplay: 'full',
        positionDisplay: 'full',
      },
      consentedAt: new Date(),
      updatedAt: new Date(),
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// CSV 주소록 연락처 (초대 대상) - 202601191412_remember.csv 기반
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

export const contacts: Contact[] = [
  { id: 'contact-1', name: '김요한', phone: '010-4442-2512', company: '현대미학성형외과의원', department: '성형외과', position: '원장 / 성형외과 전문의', email: '', registeredAt: '2022년 08월 19일', isInvited: false },
  { id: 'contact-2', name: '최성민', phone: '010-3170-2181', company: 'MEDIHUB', department: '경영지원팀', position: '리더', email: 'smc@medihub.kr', registeredAt: '2022년 08월 20일', isInvited: false },
  { id: 'contact-3', name: '금상호', phone: '010-7507-0043', company: '', department: '', position: '', email: '', registeredAt: '2022년 09월 07일', isInvited: false },
  { id: 'contact-4', name: '모건식', phone: '010-9492-1981', company: 'SEOJUNG ART', department: '영업', position: '이사', email: 'm01094921981@gmail.com', registeredAt: '2024년 10월 23일', isInvited: false },
  { id: 'contact-5', name: '최형섭', phone: '010-5475-0001', company: 'BIG MOVE VENTURES', department: '', position: 'CEO', email: 'matthew@bigmoveventures.com', registeredAt: '2022년 10월 17일', isInvited: false },
  { id: 'contact-6', name: '김병진', phone: '010-8840-7321', company: '원익투자파트너스', department: '벤처투자부문', position: '투자이사', email: 'bkim7321@wonik.com', registeredAt: '2024년 06월 03일', isInvited: false },
  { id: 'contact-7', name: '장백산', phone: '010-6284-7315', company: '제이앤엘 글로벌 그룹', department: '', position: '대표', email: 'jang@jnl.kr', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-8', name: '박민우', phone: '010-5131-2960', company: '크라우드웍스', department: '', position: '의장 / Founder', email: 'minupark@crowdworks.kr', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-9', name: '유준일', phone: '010-3242-4980', company: '대한근감소증학회', department: '정형외과', position: '총무이사 / 교수', email: 'furim@daum.net', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-10', name: '김영웅', phone: '010-5593-9876', company: '한국디지털헬스산업협회', department: '', position: '회장', email: 'yeongwoong.kim@lulumedic.com', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-11', name: '박우진', phone: '010-3697-7693', company: '뮤토피아랩', department: '', position: 'CEO / Co-Founder / Medical Doctor', email: 'woojin@mutopialab.com', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-12', name: '황보율', phone: '010-8885-2812', company: '위뉴', department: 'Healthcare Content Platform', position: 'M.D. / Ph.D. / Co-founder / 대표', email: 'yulhwangbo@weknew.com', registeredAt: '2024년 06월 03일', isInvited: false },
  { id: 'contact-13', name: '백철현', phone: '010-4403-6653', company: '이지케어텍', department: '기업문화혁신실', position: '실장 / 상무', email: 'white@ezcaretech.com', registeredAt: '2024년 06월 03일', isInvited: false },
  { id: 'contact-14', name: '정원호', phone: '010-6201-7276', company: 'SKS프라이빗에쿼티', department: '신사업개발실', position: '상무 / 실장', email: 'whchung@skspe.com', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-15', name: '김태규', phone: '010-3001-7053', company: '(주)딥노이드', department: '', position: '전무이사', email: 'great@deepnoid.com', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-16', name: '이용석', phone: '010-6569-1433', company: '피오인베스트먼트', department: '', position: '투자본부장(CIO) / 공인회계사', email: 'ylee@pio-investment.com', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-17', name: '조규훈', phone: '010-3204-2811', company: 'IBK벤처투자', department: '', position: '경영학박사 / 투자본부장 / 상무 / CIO', email: 'khcho@ibkvc.kr', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-18', name: '구평모', phone: '010-8828-5303', company: '코리아에셋투자증권', department: '중소벤처기업금융센터', position: 'CFA / 이사', email: 'ping.gu@kasset.co.kr', registeredAt: '2024년 06월 03일', isInvited: false },
  { id: 'contact-19', name: '김재학', phone: '010-3785-8510', company: '뷰브레인헬스케어', department: '', position: 'Ph. D. / MBA / CEO', email: 'jhak111@beaubrain.bio', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-20', name: '조상운', phone: '010-2628-5411', company: 'Huray', department: '사업개발팀', position: '수석', email: 'swcho@huray.net', registeredAt: '2024년 06월 03일', isInvited: false },
  { id: 'contact-21', name: '김종호', phone: '010-3283-3157', company: '', department: '', position: '', email: '', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-22', name: '송종안', phone: '010-9545-1140', company: '올바른개원', department: '', position: '대표이사', email: 'allbarun@hanmail.net', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-23', name: '안근용', phone: '010-3297-4901', company: '뷰브레인헬스케어', department: '', position: 'KICPA / CFO', email: 'annssam@beaubrain.bio', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-24', name: '최우식', phone: '010-2712-3056', company: 'DEEP NOID', department: '', position: '대표이사', email: 'adnwap@deepnoid.com', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-25', name: '이주호', phone: '010-7570-2739', company: '지오영', department: '기획조정본부', position: '부사장', email: 'juhoyi@geo-young.com', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-26', name: '오병엽', phone: '010-5183-0621', company: '케어스퀘어', department: '', position: '대표이사', email: 'brian@caresquare.kr', registeredAt: '2024년 06월 03일', isInvited: false },
  { id: 'contact-27', name: '구인회', phone: '010-8976-0852', company: '피오인베스트먼트', department: '', position: '대표이사 / 공인회계사', email: 'kyle.ikoo@gmail.com', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-28', name: '김창인', phone: '010-8856-7114', company: '', department: '', position: '', email: '', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-29', name: '이현영', phone: '010-6879-4001', company: 'YMF', department: '', position: '대표이사', email: 'aloha_ymf@naver.com', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-30', name: '이수진', phone: '010-8649-7772', company: 'KKR Korea LLC', department: '', position: '부장', email: 'sophia.lee@kkr.com', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-31', name: '지용구', phone: '010-4266-7935', company: '더존비즈온', department: '성장전략부문 / AI연구소 / 더존TIPS', position: '부사장 / CGO', email: 'todcode@douzone.com', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-32', name: '고진수', phone: '010-4236-2625', company: '뉴로핏(주)', department: 'Business Div.', position: 'Director', email: 'jsko@neurophet.com', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-33', name: '김연준', phone: '010-6362-1332', company: 'BIOCONNECT', department: '', position: '대표이사', email: 'cso@bioconnect.co.kr', registeredAt: '2024년 06월 03일', isInvited: false },
  { id: 'contact-34', name: '이후정', phone: '010-3747-5691', company: '이화여자대학교의료원', department: '이화의생명연구원', position: '연구부원장', email: 'tallhjlee@naver.com', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-35', name: '조원양', phone: '010-9531-8863', company: 'SMARTSOUND Corporation.', department: '연구개발본부 / IAI융합팀', position: '부문장 / 이사', email: 'wycho@ismartsound.com', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-36', name: '김창섭', phone: '010-4084-4820', company: '도체오', department: '', position: '이사/대표원장', email: 'changseopkorea@gmail.com', registeredAt: '2024년 06월 03일', isInvited: false },
  { id: 'contact-37', name: '이은미', phone: '010-7535-3138', company: '', department: '', position: '', email: '', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-38', name: '배수현', phone: '010-3280-6767', company: '메이크어스', department: '', position: 'COO', email: 'soohyunbae@makeus.com', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-39', name: '임종혁', phone: '010-2815-7440', company: '케어스퀘어', department: '', position: '부사장 / COO', email: 'tom@caresquare.kr', registeredAt: '2024년 06월 03일', isInvited: false },
  { id: 'contact-40', name: '김경식', phone: '010-3357-7988', company: '', department: '헬스케어사업본부', position: '이사 / 본부장', email: 'kimks@medizencare.com', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-41', name: '최승우', phone: '010-8845-7749', company: '아이센스', department: 'PM팀', position: '대리', email: 'swchoe@i-sens.com', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-42', name: '정대한', phone: '010-3935-0403', company: '삼도회계법인', department: '', position: '파트너 / 공인회계사(한국,미국) / CFA', email: 'dajung@samdovn.com', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-43', name: '하성민', phone: '010-4073-7271', company: '연세대학교', department: '의료영상처리 및 분석연구팀', position: '책임연구원', email: 'seongminha@yonsei.ac.kr', registeredAt: '2024년 06월 03일', isInvited: false },
  { id: 'contact-44', name: '마영민', phone: '010-4317-6939', company: '케어캠프', department: '사업개발부', position: '이사', email: 'ym.ma@carecamp.com', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-45', name: '윤제선', phone: '010-7522-4043', company: '법무법인 창천', department: '', position: '변호사', email: 'jsyoon@lawcc.co.kr', registeredAt: '2024년 06월 03일', isInvited: false },
  { id: 'contact-46', name: '김용현', phone: '010-9327-7831', company: 'envisioning partners', department: '', position: '대표', email: 'yong.kim@envisioning.partners', registeredAt: '2024년 06월 03일', isInvited: false },
  { id: 'contact-47', name: '서보성', phone: '010-3280-0227', company: '세나클소프트', department: 'Strategy&Planning, Business', position: '사업기획 팀장', email: 's1b1s@cenacle.com', registeredAt: '2024년 06월 03일', isInvited: false },
  { id: 'contact-48', name: '송유석', phone: '010-5047-6764', company: '민트 벤처파트너스', department: '사업개발', position: '수석팀장', email: 'yoosuk.song@mintventures.bio', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-49', name: '한태화', phone: '010-3469-6191', company: '연세대학교 의료원', department: '의과대학 뇌심혈관질환연구센터', position: '연구부교수', email: 'hanth2015@yuhs.ac', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-50', name: '허창영', phone: '010-5124-3957', company: '특허그룹정성/테크비즈랩정성', department: '총괄', position: '대표/변리사/기술거래사', email: 'cyher@trueheart.co.kr', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-51', name: '김병주', phone: '010-4757-1226', company: '참약사', department: '', position: '대표이사', email: 'ceo@charmacist.com', registeredAt: '2024년 06월 03일', isInvited: false },
  { id: 'contact-52', name: '이완희', phone: '010-6213-3242', company: '에비드넷', department: 'Data Technology Group', position: 'CTO & CISO / 상무', email: 'whlee21@evidnet.com', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-53', name: '서광희', phone: '010-6306-0744', company: '지앤넷', department: '', position: '대표이사', email: 'black@gnnet.co.kr', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-54', name: '김선욱', phone: '010-5195-3284', company: '한국전자통신연구원', department: '인공지능연구소 초성능컴퓨팅연구본부', position: '책임연구원 / 전산학박사', email: 'swkim99@etri.re.kr', registeredAt: '2024년 06월 03일', isInvited: false },
  { id: 'contact-55', name: '이슬아', phone: '010-4563-1233', company: 'Accel.B', department: '', position: '대표이사', email: 'stella@accelb.co.kr', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-56', name: '강훈모', phone: '010-7334-8480', company: '하나벤처스', department: '투자본부', position: '상무 / 변리사', email: 'hunmo.kang@hanafn.com', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-57', name: '엄현진', phone: '010-9033-9827', company: 'DEEP NOID', department: '의료AI영업본부 / 제품인사이트팀', position: '과장', email: 'hjeom@deepnoid.com', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-58', name: '김상욱', phone: '010-6669-0311', company: 'Huray', department: '사업개발팀', position: '책임', email: 'swkim@huray.net', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-59', name: '김지혜', phone: '010-2690-8323', company: 'DEEP NOID', department: '보안AI사업본부 / 보안영업팀', position: '과장', email: 'dighkdbal@deepnoid.com', registeredAt: '2023년 02월 27일', isInvited: false },
  { id: 'contact-60', name: '김동명', phone: '010-2883-4301', company: 'IT조선', department: '디지털플랫폼부 (제약바이오 담당)', position: '기자', email: 'simalo@chosunbiz.com', registeredAt: '2024년 06월 03일', isInvited: false },
];

// 연결 관계 - 초기에는 빈 상태 (초대 수락 시 연결됨)
export const demoConnections: Record<string, string[]> = {
  'user-jaeyoung': [],
};

// Demo network graph - 초기에는 본인만 표시
export const getDemoNetworkGraph = (userId: string): { nodes: NetworkNode[]; edges: NetworkEdge[] } => {
  const currentUser = demoUsers.find(u => u.id === userId) || demoUsers[0];
  const userConnections = demoConnections[currentUser.id] || [];

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
    },
  ];

  // 1촌 연결이 있으면 추가
  userConnections.forEach(connId => {
    const connUser = demoUsers.find(u => u.id === connId);
    if (connUser) {
      nodes.push({
        id: connUser.id,
        name: connUser.name,
        profileImage: connUser.profileImage,
        company: connUser.company,
        position: connUser.position,
        keywords: connUser.keywords,
        degree: 1,
        connectionCount: (demoConnections[connUser.id] || []).length,
      });
    }
  });

  const edges: NetworkEdge[] = userConnections.map(connId => ({
    source: currentUser.id,
    target: connId,
    degree: 1,
  }));

  return { nodes, edges };
};

// Demo recommendations - 빈 상태
export const getDemoRecommendations = (userId: string): Recommendation[] => {
  return [];
};

// Initial invite codes for demo
export const demoInviteCodes = [
  'JYK-001',
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
