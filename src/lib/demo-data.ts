import { User, NetworkNode, NetworkEdge, Recommendation } from '@/types';

// Demo users for testing without Firebase
export const demoUsers: User[] = [
  // 현재 가입자 (중심 유저)
  {
    id: 'demo-user-1',
    name: '김민수',
    email: 'minsu@example.com',
    phone: '010-1234-5678',
    company: 'TechStartup Inc.',
    position: 'CEO & Founder',
    bio: '기술로 세상을 바꾸는 꿈을 꾸고 있습니다',
    keywords: ['스타트업', 'AI', '투자', 'B2B', 'SaaS'],
    profileImage: undefined,
    inviteCode: 'NEX-001',
    invitesRemaining: 3,
    coffeeStatus: 'available',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // 1차 연결 (직접 연결된 사람들) - 8명
  {
    id: 'demo-user-2',
    name: '이서연',
    email: 'seoyeon@example.com',
    phone: '010-2345-6789',
    company: 'DesignLab',
    position: 'Creative Director',
    bio: '디자인으로 브랜드의 가치를 높입니다',
    keywords: ['UX디자인', '브랜딩', '스타트업', '마케팅'],
    profileImage: undefined,
    inviteCode: 'NEX-002',
    invitesRemaining: 2,
    coffeeStatus: 'available',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-user-3',
    name: '박준영',
    email: 'junyoung@example.com',
    phone: '010-3456-7890',
    company: 'Alpha Ventures',
    position: 'Partner',
    bio: '혁신적인 스타트업을 발굴하고 성장시킵니다',
    keywords: ['투자', '스타트업', '핀테크', 'Web3'],
    profileImage: undefined,
    inviteCode: 'NEX-003',
    invitesRemaining: 5,
    coffeeStatus: 'busy',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-user-4',
    name: '최지은',
    email: 'jieun@example.com',
    phone: '010-4567-8901',
    company: 'GrowthHackers',
    position: 'CMO',
    bio: '데이터 기반 마케팅 전략 전문가',
    keywords: ['마케팅', '그로스해킹', 'B2B', '콘텐츠'],
    profileImage: undefined,
    inviteCode: 'NEX-004',
    invitesRemaining: 3,
    coffeeStatus: 'available',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-user-5',
    name: '정현우',
    email: 'hyunwoo@example.com',
    phone: '010-5678-9012',
    company: 'CodeFactory',
    position: 'CTO',
    bio: '확장 가능한 아키텍처를 설계합니다',
    keywords: ['개발', 'AI', 'SaaS', '클라우드'],
    profileImage: undefined,
    inviteCode: 'NEX-005',
    invitesRemaining: 4,
    coffeeStatus: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-user-6',
    name: '강예진',
    email: 'yejin@example.com',
    phone: '010-6789-0123',
    company: 'MediCare Plus',
    position: 'Product Manager',
    bio: '헬스케어의 미래를 만들어갑니다',
    keywords: ['헬스케어', 'PM', '스타트업', 'B2B'],
    profileImage: undefined,
    inviteCode: 'NEX-006',
    invitesRemaining: 2,
    coffeeStatus: 'available',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-user-7',
    name: '윤성민',
    email: 'sungmin@example.com',
    phone: '010-7890-1234',
    company: 'EduNext',
    position: 'CEO',
    bio: '교육의 패러다임을 바꾸는 에듀테크',
    keywords: ['에듀테크', '스타트업', 'AI', '콘텐츠'],
    profileImage: undefined,
    inviteCode: 'NEX-007',
    invitesRemaining: 3,
    coffeeStatus: 'available',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-user-8',
    name: '한소희',
    email: 'sohee@example.com',
    phone: '010-8901-2345',
    company: 'Naver',
    position: 'Senior Engineer',
    bio: '검색 알고리즘 최적화 전문가',
    keywords: ['검색', 'AI', '머신러닝', '대기업'],
    profileImage: undefined,
    inviteCode: 'NEX-008',
    invitesRemaining: 4,
    coffeeStatus: 'available',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-user-9',
    name: '오진우',
    email: 'jinwoo@example.com',
    phone: '010-9012-3456',
    company: 'Kakao',
    position: 'Product Owner',
    bio: '사용자 중심의 제품을 만듭니다',
    keywords: ['PM', '플랫폼', 'B2C', '모빌리티'],
    profileImage: undefined,
    inviteCode: 'NEX-009',
    invitesRemaining: 3,
    coffeeStatus: 'busy',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // 2차 연결 (친구의 친구) - 21명
  {
    id: 'demo-user-10',
    name: '임지현',
    email: 'jihyun@example.com',
    phone: '010-1122-3344',
    company: 'BrandStudio',
    position: 'Brand Manager',
    bio: '브랜드 스토리텔링의 힘을 믿습니다',
    keywords: ['브랜딩', '마케팅', '콘텐츠', '광고'],
    profileImage: undefined,
    inviteCode: 'NEX-010',
    invitesRemaining: 3,
    coffeeStatus: 'available',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-user-11',
    name: '송태현',
    email: 'taehyun@example.com',
    phone: '010-2233-4455',
    company: 'DataInsight',
    position: 'Data Scientist',
    bio: '데이터에서 인사이트를 발굴합니다',
    keywords: ['AI', '데이터', 'SaaS', '머신러닝'],
    profileImage: undefined,
    inviteCode: 'NEX-011',
    invitesRemaining: 2,
    coffeeStatus: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-user-12',
    name: '한수진',
    email: 'sujin@example.com',
    phone: '010-3344-5566',
    company: 'FinanceHub',
    position: 'CFO',
    bio: '스타트업 재무 전략 전문가',
    keywords: ['핀테크', '투자', 'Web3', '재무'],
    profileImage: undefined,
    inviteCode: 'NEX-012',
    invitesRemaining: 4,
    coffeeStatus: 'available',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-user-13',
    name: '권도윤',
    email: 'doyun@example.com',
    phone: '010-4455-6677',
    company: 'BlockChain Labs',
    position: 'Blockchain Developer',
    bio: '탈중앙화 금융의 미래를 만듭니다',
    keywords: ['Web3', '블록체인', '크립토', 'DeFi'],
    profileImage: undefined,
    inviteCode: 'NEX-013',
    invitesRemaining: 3,
    coffeeStatus: 'available',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-user-14',
    name: '신유나',
    email: 'yuna@example.com',
    phone: '010-5566-7788',
    company: 'ContentFirst',
    position: 'Content Strategist',
    bio: '콘텐츠로 성장을 이끕니다',
    keywords: ['콘텐츠', '마케팅', 'SNS', '인플루언서'],
    profileImage: undefined,
    inviteCode: 'NEX-014',
    invitesRemaining: 2,
    coffeeStatus: 'busy',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-user-15',
    name: '조민재',
    email: 'minjae@example.com',
    phone: '010-6677-8899',
    company: 'Samsung Electronics',
    position: 'AI Researcher',
    bio: '차세대 AI 기술을 연구합니다',
    keywords: ['AI', '딥러닝', '연구', '대기업'],
    profileImage: undefined,
    inviteCode: 'NEX-015',
    invitesRemaining: 5,
    coffeeStatus: 'available',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-user-16',
    name: '백서영',
    email: 'seoyoung@example.com',
    phone: '010-7788-9900',
    company: 'HR Partners',
    position: 'HR Director',
    bio: '인재 채용과 조직문화 전문가',
    keywords: ['HR', '채용', '조직문화', '스타트업'],
    profileImage: undefined,
    inviteCode: 'NEX-016',
    invitesRemaining: 3,
    coffeeStatus: 'available',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-user-17',
    name: '류준혁',
    email: 'junhyuk@example.com',
    phone: '010-8899-0011',
    company: 'LegalTech',
    position: 'Legal Counsel',
    bio: '스타트업 법률 자문 전문가',
    keywords: ['법률', '스타트업', '계약', '지식재산'],
    profileImage: undefined,
    inviteCode: 'NEX-017',
    invitesRemaining: 2,
    coffeeStatus: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-user-18',
    name: '장하은',
    email: 'haeun@example.com',
    phone: '010-9900-1122',
    company: 'FoodTech Korea',
    position: 'Operations Manager',
    bio: '푸드테크 서비스 운영 전문가',
    keywords: ['푸드테크', '운영', 'O2O', '물류'],
    profileImage: undefined,
    inviteCode: 'NEX-018',
    invitesRemaining: 4,
    coffeeStatus: 'available',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-user-19',
    name: '김동현',
    email: 'donghyun@example.com',
    phone: '010-1111-2222',
    company: 'TravelNow',
    position: 'CEO',
    bio: '여행의 새로운 경험을 만듭니다',
    keywords: ['트래블테크', '스타트업', 'B2C', '여행'],
    profileImage: undefined,
    inviteCode: 'NEX-019',
    invitesRemaining: 3,
    coffeeStatus: 'busy',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-user-20',
    name: '이수빈',
    email: 'subin@example.com',
    phone: '010-2222-3333',
    company: 'PropTech Solutions',
    position: 'Business Developer',
    bio: '부동산 테크 비즈니스 개발',
    keywords: ['프롭테크', '부동산', 'B2B', '영업'],
    profileImage: undefined,
    inviteCode: 'NEX-020',
    invitesRemaining: 2,
    coffeeStatus: 'available',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-user-21',
    name: '박예린',
    email: 'yerin@example.com',
    phone: '010-3333-4444',
    company: 'Fashion Forward',
    position: 'Creative Lead',
    bio: '패션과 테크의 만남',
    keywords: ['패션테크', 'D2C', '이커머스', '브랜딩'],
    profileImage: undefined,
    inviteCode: 'NEX-021',
    invitesRemaining: 3,
    coffeeStatus: 'available',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-user-22',
    name: '문성훈',
    email: 'sunghoon@example.com',
    phone: '010-4444-5555',
    company: 'GameDev Studio',
    position: 'Game Director',
    bio: '재미있는 게임을 만듭니다',
    keywords: ['게임', '메타버스', '콘텐츠', 'NFT'],
    profileImage: undefined,
    inviteCode: 'NEX-022',
    invitesRemaining: 4,
    coffeeStatus: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-user-23',
    name: '서민지',
    email: 'minji@example.com',
    phone: '010-5555-6666',
    company: 'CleanEnergy',
    position: 'Sustainability Manager',
    bio: '지속가능한 미래를 위해',
    keywords: ['ESG', '그린테크', '에너지', '지속가능성'],
    profileImage: undefined,
    inviteCode: 'NEX-023',
    invitesRemaining: 2,
    coffeeStatus: 'available',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-user-24',
    name: '황재민',
    email: 'jaemin@example.com',
    phone: '010-6666-7777',
    company: 'RoboTech',
    position: 'Robotics Engineer',
    bio: '로봇 자동화의 미래',
    keywords: ['로보틱스', 'AI', '자동화', '하드웨어'],
    profileImage: undefined,
    inviteCode: 'NEX-024',
    invitesRemaining: 3,
    coffeeStatus: 'available',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-user-25',
    name: '안지영',
    email: 'jiyoung@example.com',
    phone: '010-7777-8888',
    company: 'Beauty Tech',
    position: 'Product Director',
    bio: '뷰티 산업의 디지털 혁신',
    keywords: ['뷰티테크', 'D2C', '이커머스', 'PM'],
    profileImage: undefined,
    inviteCode: 'NEX-025',
    invitesRemaining: 4,
    coffeeStatus: 'busy',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-user-26',
    name: '노현석',
    email: 'hyunseok@example.com',
    phone: '010-8888-9999',
    company: 'Security First',
    position: 'Security Engineer',
    bio: '사이버 보안 전문가',
    keywords: ['보안', '클라우드', '인프라', '개발'],
    profileImage: undefined,
    inviteCode: 'NEX-026',
    invitesRemaining: 2,
    coffeeStatus: 'available',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-user-27',
    name: '유다은',
    email: 'daeun@example.com',
    phone: '010-9999-0000',
    company: 'PetCare',
    position: 'Marketing Manager',
    bio: '반려동물 시장의 성장을 이끕니다',
    keywords: ['펫테크', '마케팅', 'B2C', '브랜딩'],
    profileImage: undefined,
    inviteCode: 'NEX-027',
    invitesRemaining: 3,
    coffeeStatus: 'available',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-user-28',
    name: '홍승우',
    email: 'seungwoo@example.com',
    phone: '010-0000-1111',
    company: 'AgriTech',
    position: 'CEO',
    bio: '스마트팜으로 농업의 미래를',
    keywords: ['애그테크', '스타트업', 'IoT', '지속가능성'],
    profileImage: undefined,
    inviteCode: 'NEX-028',
    invitesRemaining: 5,
    coffeeStatus: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-user-29',
    name: '차민서',
    email: 'minseo@example.com',
    phone: '010-1212-3434',
    company: 'Coupang',
    position: 'UX Designer',
    bio: '사용자 경험을 디자인합니다',
    keywords: ['UX디자인', '이커머스', '대기업', '리서치'],
    profileImage: undefined,
    inviteCode: 'NEX-029',
    invitesRemaining: 3,
    coffeeStatus: 'available',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-user-30',
    name: '고은채',
    email: 'eunchae@example.com',
    phone: '010-5656-7878',
    company: 'MusicTech',
    position: 'Business Manager',
    bio: '음악 산업의 디지털 전환',
    keywords: ['뮤직테크', '콘텐츠', '엔터테인먼트', 'B2B'],
    profileImage: undefined,
    inviteCode: 'NEX-030',
    invitesRemaining: 2,
    coffeeStatus: 'available',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Demo network graph
export const getDemoNetworkGraph = (userId: string): { nodes: NetworkNode[]; edges: NetworkEdge[] } => {
  const currentUser = demoUsers.find(u => u.id === userId) || demoUsers[0];

  const nodes: NetworkNode[] = [
    // Center node (current user)
    {
      id: currentUser.id,
      name: currentUser.name,
      profileImage: currentUser.profileImage,
      company: currentUser.company,
      position: currentUser.position,
      keywords: currentUser.keywords,
      degree: 0,
      connectionCount: 8,
    },
    // 1st degree connections (8명)
    {
      id: 'demo-user-2',
      name: '이서연',
      company: 'DesignLab',
      position: 'Creative Director',
      keywords: ['UX디자인', '브랜딩', '스타트업', '마케팅'],
      degree: 1,
      connectionCount: 4,
    },
    {
      id: 'demo-user-3',
      name: '박준영',
      company: 'Alpha Ventures',
      position: 'Partner',
      keywords: ['투자', '스타트업', '핀테크', 'Web3'],
      degree: 1,
      connectionCount: 5,
    },
    {
      id: 'demo-user-4',
      name: '최지은',
      company: 'GrowthHackers',
      position: 'CMO',
      keywords: ['마케팅', '그로스해킹', 'B2B', '콘텐츠'],
      degree: 1,
      connectionCount: 4,
    },
    {
      id: 'demo-user-5',
      name: '정현우',
      company: 'CodeFactory',
      position: 'CTO',
      keywords: ['개발', 'AI', 'SaaS', '클라우드'],
      degree: 1,
      connectionCount: 5,
    },
    {
      id: 'demo-user-6',
      name: '강예진',
      company: 'MediCare Plus',
      position: 'Product Manager',
      keywords: ['헬스케어', 'PM', '스타트업', 'B2B'],
      degree: 1,
      connectionCount: 3,
    },
    {
      id: 'demo-user-7',
      name: '윤성민',
      company: 'EduNext',
      position: 'CEO',
      keywords: ['에듀테크', '스타트업', 'AI', '콘텐츠'],
      degree: 1,
      connectionCount: 4,
    },
    {
      id: 'demo-user-8',
      name: '한소희',
      company: 'Naver',
      position: 'Senior Engineer',
      keywords: ['검색', 'AI', '머신러닝', '대기업'],
      degree: 1,
      connectionCount: 4,
    },
    {
      id: 'demo-user-9',
      name: '오진우',
      company: 'Kakao',
      position: 'Product Owner',
      keywords: ['PM', '플랫폼', 'B2C', '모빌리티'],
      degree: 1,
      connectionCount: 3,
    },
    // 2nd degree connections (21명)
    {
      id: 'demo-user-10',
      name: '임지현',
      company: 'BrandStudio',
      position: 'Brand Manager',
      keywords: ['브랜딩', '마케팅', '콘텐츠', '광고'],
      degree: 2,
      connectionCount: 3,
    },
    {
      id: 'demo-user-11',
      name: '송태현',
      company: 'DataInsight',
      position: 'Data Scientist',
      keywords: ['AI', '데이터', 'SaaS', '머신러닝'],
      degree: 2,
      connectionCount: 2,
    },
    {
      id: 'demo-user-12',
      name: '한수진',
      company: 'FinanceHub',
      position: 'CFO',
      keywords: ['핀테크', '투자', 'Web3', '재무'],
      degree: 2,
      connectionCount: 4,
    },
    {
      id: 'demo-user-13',
      name: '권도윤',
      company: 'BlockChain Labs',
      position: 'Blockchain Developer',
      keywords: ['Web3', '블록체인', '크립토', 'DeFi'],
      degree: 2,
      connectionCount: 3,
    },
    {
      id: 'demo-user-14',
      name: '신유나',
      company: 'ContentFirst',
      position: 'Content Strategist',
      keywords: ['콘텐츠', '마케팅', 'SNS', '인플루언서'],
      degree: 2,
      connectionCount: 2,
    },
    {
      id: 'demo-user-15',
      name: '조민재',
      company: 'Samsung Electronics',
      position: 'AI Researcher',
      keywords: ['AI', '딥러닝', '연구', '대기업'],
      degree: 2,
      connectionCount: 3,
    },
    {
      id: 'demo-user-16',
      name: '백서영',
      company: 'HR Partners',
      position: 'HR Director',
      keywords: ['HR', '채용', '조직문화', '스타트업'],
      degree: 2,
      connectionCount: 2,
    },
    {
      id: 'demo-user-17',
      name: '류준혁',
      company: 'LegalTech',
      position: 'Legal Counsel',
      keywords: ['법률', '스타트업', '계약', '지식재산'],
      degree: 2,
      connectionCount: 2,
    },
    {
      id: 'demo-user-18',
      name: '장하은',
      company: 'FoodTech Korea',
      position: 'Operations Manager',
      keywords: ['푸드테크', '운영', 'O2O', '물류'],
      degree: 2,
      connectionCount: 3,
    },
    {
      id: 'demo-user-19',
      name: '김동현',
      company: 'TravelNow',
      position: 'CEO',
      keywords: ['트래블테크', '스타트업', 'B2C', '여행'],
      degree: 2,
      connectionCount: 2,
    },
    {
      id: 'demo-user-20',
      name: '이수빈',
      company: 'PropTech Solutions',
      position: 'Business Developer',
      keywords: ['프롭테크', '부동산', 'B2B', '영업'],
      degree: 2,
      connectionCount: 2,
    },
    {
      id: 'demo-user-21',
      name: '박예린',
      company: 'Fashion Forward',
      position: 'Creative Lead',
      keywords: ['패션테크', 'D2C', '이커머스', '브랜딩'],
      degree: 2,
      connectionCount: 3,
    },
    {
      id: 'demo-user-22',
      name: '문성훈',
      company: 'GameDev Studio',
      position: 'Game Director',
      keywords: ['게임', '메타버스', '콘텐츠', 'NFT'],
      degree: 2,
      connectionCount: 2,
    },
    {
      id: 'demo-user-23',
      name: '서민지',
      company: 'CleanEnergy',
      position: 'Sustainability Manager',
      keywords: ['ESG', '그린테크', '에너지', '지속가능성'],
      degree: 2,
      connectionCount: 2,
    },
    {
      id: 'demo-user-24',
      name: '황재민',
      company: 'RoboTech',
      position: 'Robotics Engineer',
      keywords: ['로보틱스', 'AI', '자동화', '하드웨어'],
      degree: 2,
      connectionCount: 3,
    },
    {
      id: 'demo-user-25',
      name: '안지영',
      company: 'Beauty Tech',
      position: 'Product Director',
      keywords: ['뷰티테크', 'D2C', '이커머스', 'PM'],
      degree: 2,
      connectionCount: 2,
    },
    {
      id: 'demo-user-26',
      name: '노현석',
      company: 'Security First',
      position: 'Security Engineer',
      keywords: ['보안', '클라우드', '인프라', '개발'],
      degree: 2,
      connectionCount: 3,
    },
    {
      id: 'demo-user-27',
      name: '유다은',
      company: 'PetCare',
      position: 'Marketing Manager',
      keywords: ['펫테크', '마케팅', 'B2C', '브랜딩'],
      degree: 2,
      connectionCount: 2,
    },
    {
      id: 'demo-user-28',
      name: '홍승우',
      company: 'AgriTech',
      position: 'CEO',
      keywords: ['애그테크', '스타트업', 'IoT', '지속가능성'],
      degree: 2,
      connectionCount: 2,
    },
    {
      id: 'demo-user-29',
      name: '차민서',
      company: 'Coupang',
      position: 'UX Designer',
      keywords: ['UX디자인', '이커머스', '대기업', '리서치'],
      degree: 2,
      connectionCount: 3,
    },
    {
      id: 'demo-user-30',
      name: '고은채',
      company: 'MusicTech',
      position: 'Business Manager',
      keywords: ['뮤직테크', '콘텐츠', '엔터테인먼트', 'B2B'],
      degree: 2,
      connectionCount: 2,
    },
  ];

  // 각 사용자별 인맥 관계 정의 (각 사용자당 약 10명씩)
  const allConnections: Record<string, string[]> = {
    // 김민수(1) - CEO & Founder: 스타트업, AI, 투자 관련 인맥
    'demo-user-1': ['demo-user-2', 'demo-user-3', 'demo-user-4', 'demo-user-5', 'demo-user-6', 'demo-user-7', 'demo-user-8', 'demo-user-9', 'demo-user-15', 'demo-user-11'],
    // 이서연(2) - Creative Director: UX디자인, 브랜딩 인맥
    'demo-user-2': ['demo-user-1', 'demo-user-10', 'demo-user-21', 'demo-user-29', 'demo-user-4', 'demo-user-25', 'demo-user-27', 'demo-user-14', 'demo-user-7', 'demo-user-6'],
    // 박준영(3) - VC Partner: 투자, 핀테크, Web3 인맥
    'demo-user-3': ['demo-user-1', 'demo-user-12', 'demo-user-13', 'demo-user-19', 'demo-user-28', 'demo-user-5', 'demo-user-7', 'demo-user-17', 'demo-user-22', 'demo-user-20'],
    // 최지은(4) - CMO: 마케팅, 그로스해킹 인맥
    'demo-user-4': ['demo-user-1', 'demo-user-2', 'demo-user-14', 'demo-user-27', 'demo-user-10', 'demo-user-21', 'demo-user-30', 'demo-user-18', 'demo-user-9', 'demo-user-6'],
    // 정현우(5) - CTO: 개발, AI, SaaS 인맥
    'demo-user-5': ['demo-user-1', 'demo-user-11', 'demo-user-15', 'demo-user-24', 'demo-user-26', 'demo-user-8', 'demo-user-3', 'demo-user-22', 'demo-user-13', 'demo-user-23'],
    // 강예진(6) - PM: 헬스케어, B2B 인맥
    'demo-user-6': ['demo-user-1', 'demo-user-16', 'demo-user-25', 'demo-user-2', 'demo-user-4', 'demo-user-9', 'demo-user-18', 'demo-user-20', 'demo-user-17', 'demo-user-7'],
    // 윤성민(7) - CEO: 에듀테크, 콘텐츠 인맥
    'demo-user-7': ['demo-user-1', 'demo-user-17', 'demo-user-22', 'demo-user-30', 'demo-user-2', 'demo-user-3', 'demo-user-6', 'demo-user-14', 'demo-user-19', 'demo-user-28'],
    // 한소희(8) - Senior Engineer: AI, 대기업 인맥
    'demo-user-8': ['demo-user-1', 'demo-user-15', 'demo-user-11', 'demo-user-29', 'demo-user-5', 'demo-user-24', 'demo-user-26', 'demo-user-9', 'demo-user-23', 'demo-user-16'],
    // 오진우(9) - Product Owner: 플랫폼, B2C 인맥
    'demo-user-9': ['demo-user-1', 'demo-user-18', 'demo-user-20', 'demo-user-23', 'demo-user-4', 'demo-user-6', 'demo-user-8', 'demo-user-27', 'demo-user-19', 'demo-user-29'],
    // 임지현(10) - Brand Manager: 브랜딩, 마케팅 인맥
    'demo-user-10': ['demo-user-2', 'demo-user-4', 'demo-user-14', 'demo-user-21', 'demo-user-27', 'demo-user-30', 'demo-user-25', 'demo-user-7', 'demo-user-18', 'demo-user-29'],
    // 송태현(11) - Data Scientist: AI, 데이터 인맥
    'demo-user-11': ['demo-user-5', 'demo-user-8', 'demo-user-15', 'demo-user-24', 'demo-user-26', 'demo-user-1', 'demo-user-13', 'demo-user-23', 'demo-user-22', 'demo-user-3'],
    // 한수진(12) - CFO: 핀테크, 투자 인맥
    'demo-user-12': ['demo-user-3', 'demo-user-13', 'demo-user-17', 'demo-user-19', 'demo-user-20', 'demo-user-28', 'demo-user-16', 'demo-user-6', 'demo-user-7', 'demo-user-23'],
    // 권도윤(13) - Blockchain Dev: Web3, 블록체인 인맥
    'demo-user-13': ['demo-user-3', 'demo-user-12', 'demo-user-5', 'demo-user-11', 'demo-user-22', 'demo-user-28', 'demo-user-24', 'demo-user-26', 'demo-user-19', 'demo-user-15'],
    // 신유나(14) - Content Strategist: 콘텐츠, 마케팅 인맥
    'demo-user-14': ['demo-user-4', 'demo-user-10', 'demo-user-27', 'demo-user-30', 'demo-user-7', 'demo-user-2', 'demo-user-21', 'demo-user-22', 'demo-user-18', 'demo-user-25'],
    // 조민재(15) - AI Researcher: AI, 딥러닝 인맥
    'demo-user-15': ['demo-user-5', 'demo-user-8', 'demo-user-11', 'demo-user-24', 'demo-user-1', 'demo-user-13', 'demo-user-26', 'demo-user-29', 'demo-user-23', 'demo-user-16'],
    // 백서영(16) - HR Director: HR, 조직문화 인맥
    'demo-user-16': ['demo-user-6', 'demo-user-17', 'demo-user-12', 'demo-user-8', 'demo-user-15', 'demo-user-7', 'demo-user-19', 'demo-user-28', 'demo-user-20', 'demo-user-25'],
    // 류준혁(17) - Legal Counsel: 법률, 스타트업 인맥
    'demo-user-17': ['demo-user-7', 'demo-user-3', 'demo-user-12', 'demo-user-16', 'demo-user-6', 'demo-user-19', 'demo-user-28', 'demo-user-20', 'demo-user-22', 'demo-user-30'],
    // 장하은(18) - Operations Manager: 푸드테크, O2O 인맥
    'demo-user-18': ['demo-user-9', 'demo-user-20', 'demo-user-23', 'demo-user-4', 'demo-user-6', 'demo-user-10', 'demo-user-14', 'demo-user-27', 'demo-user-19', 'demo-user-21'],
    // 김동현(19) - CEO: 트래블테크, B2C 인맥
    'demo-user-19': ['demo-user-3', 'demo-user-7', 'demo-user-9', 'demo-user-12', 'demo-user-13', 'demo-user-16', 'demo-user-17', 'demo-user-18', 'demo-user-20', 'demo-user-28'],
    // 이수빈(20) - Business Dev: 프롭테크, B2B 인맥
    'demo-user-20': ['demo-user-9', 'demo-user-12', 'demo-user-16', 'demo-user-17', 'demo-user-18', 'demo-user-19', 'demo-user-23', 'demo-user-6', 'demo-user-3', 'demo-user-28'],
    // 박예린(21) - Creative Lead: 패션테크, D2C 인맥
    'demo-user-21': ['demo-user-2', 'demo-user-10', 'demo-user-25', 'demo-user-27', 'demo-user-14', 'demo-user-4', 'demo-user-18', 'demo-user-30', 'demo-user-29', 'demo-user-7'],
    // 문성훈(22) - Game Director: 게임, 메타버스 인맥
    'demo-user-22': ['demo-user-7', 'demo-user-13', 'demo-user-5', 'demo-user-11', 'demo-user-14', 'demo-user-17', 'demo-user-30', 'demo-user-24', 'demo-user-3', 'demo-user-26'],
    // 서민지(23) - Sustainability Manager: ESG, 그린테크 인맥
    'demo-user-23': ['demo-user-9', 'demo-user-18', 'demo-user-20', 'demo-user-28', 'demo-user-5', 'demo-user-8', 'demo-user-11', 'demo-user-12', 'demo-user-15', 'demo-user-24'],
    // 황재민(24) - Robotics Engineer: 로보틱스, AI 인맥
    'demo-user-24': ['demo-user-5', 'demo-user-11', 'demo-user-15', 'demo-user-8', 'demo-user-13', 'demo-user-22', 'demo-user-23', 'demo-user-26', 'demo-user-28', 'demo-user-1'],
    // 안지영(25) - Product Director: 뷰티테크, D2C 인맥
    'demo-user-25': ['demo-user-6', 'demo-user-2', 'demo-user-10', 'demo-user-14', 'demo-user-16', 'demo-user-21', 'demo-user-27', 'demo-user-4', 'demo-user-29', 'demo-user-30'],
    // 노현석(26) - Security Engineer: 보안, 클라우드 인맥
    'demo-user-26': ['demo-user-5', 'demo-user-8', 'demo-user-11', 'demo-user-13', 'demo-user-15', 'demo-user-22', 'demo-user-24', 'demo-user-23', 'demo-user-28', 'demo-user-1'],
    // 유다은(27) - Marketing Manager: 펫테크, 마케팅 인맥
    'demo-user-27': ['demo-user-4', 'demo-user-10', 'demo-user-14', 'demo-user-21', 'demo-user-25', 'demo-user-9', 'demo-user-18', 'demo-user-2', 'demo-user-30', 'demo-user-6'],
    // 홍승우(28) - CEO: 애그테크, IoT 인맥
    'demo-user-28': ['demo-user-3', 'demo-user-7', 'demo-user-12', 'demo-user-13', 'demo-user-16', 'demo-user-17', 'demo-user-19', 'demo-user-20', 'demo-user-23', 'demo-user-24'],
    // 차민서(29) - UX Designer: UX디자인, 이커머스 인맥
    'demo-user-29': ['demo-user-2', 'demo-user-8', 'demo-user-9', 'demo-user-10', 'demo-user-15', 'demo-user-21', 'demo-user-25', 'demo-user-4', 'demo-user-1', 'demo-user-30'],
    // 고은채(30) - Business Manager: 뮤직테크, 콘텐츠 인맥
    'demo-user-30': ['demo-user-7', 'demo-user-14', 'demo-user-17', 'demo-user-21', 'demo-user-22', 'demo-user-25', 'demo-user-27', 'demo-user-4', 'demo-user-10', 'demo-user-29'],
  };

  // 현재 사용자의 1차 연결 가져오기
  const userConnections = allConnections[currentUser.id] || allConnections['demo-user-1'];
  const firstDegreeIds = new Set(userConnections);

  // 2차 연결 찾기 (1차 연결의 연결 중 현재 사용자와 1차 연결이 아닌 사람들)
  const secondDegreeIds = new Set<string>();
  const secondDegreeConnections: { firstDegree: string; secondDegree: string }[] = [];

  userConnections.forEach(firstDegreeId => {
    const theirConnections = allConnections[firstDegreeId] || [];
    theirConnections.forEach(connId => {
      if (connId !== currentUser.id && !firstDegreeIds.has(connId)) {
        if (!secondDegreeIds.has(connId)) {
          secondDegreeIds.add(connId);
        }
        secondDegreeConnections.push({ firstDegree: firstDegreeId, secondDegree: connId });
      }
    });
  });

  // 노드 업데이트 - degree 재계산
  const updatedNodes = nodes.map(node => {
    if (node.id === currentUser.id) {
      return { ...node, degree: 0, connectionCount: userConnections.length };
    } else if (firstDegreeIds.has(node.id)) {
      return { ...node, degree: 1, connectionCount: (allConnections[node.id] || []).length };
    } else if (secondDegreeIds.has(node.id)) {
      return { ...node, degree: 2, connectionCount: (allConnections[node.id] || []).length };
    }
    return node;
  }).filter(node =>
    node.id === currentUser.id || firstDegreeIds.has(node.id) || secondDegreeIds.has(node.id)
  );

  // 엣지 생성
  const edges: NetworkEdge[] = [];

  // 1차 연결 엣지
  userConnections.forEach(connId => {
    edges.push({ source: currentUser.id, target: connId, degree: 1 });
  });

  // 2차 연결 엣지 (중복 제거)
  const edgeSet = new Set<string>();
  secondDegreeConnections.forEach(({ firstDegree, secondDegree }) => {
    const edgeKey = `${firstDegree}-${secondDegree}`;
    if (!edgeSet.has(edgeKey)) {
      edgeSet.add(edgeKey);
      edges.push({ source: firstDegree, target: secondDegree, degree: 2 });
    }
  });

  return { nodes: updatedNodes, edges };
};

// Demo recommendations
export const getDemoRecommendations = (userId: string): Recommendation[] => {
  return [
    {
      userId: 'demo-user-11',
      user: demoUsers[10],
      score: 0.92,
      keywordMatch: 0.8,
      proximityScore: 0.6,
      mutualConnections: 2,
      connectionPath: [userId, 'demo-user-5', 'demo-user-11'],
      reason: 'AI, SaaS에 대한 깊은 관심이 있습니다',
    },
    {
      userId: 'demo-user-15',
      user: demoUsers[14],
      score: 0.88,
      keywordMatch: 0.75,
      proximityScore: 0.5,
      mutualConnections: 2,
      connectionPath: [userId, 'demo-user-8', 'demo-user-15'],
      reason: 'AI 분야 전문가입니다',
    },
    {
      userId: 'demo-user-12',
      user: demoUsers[11],
      score: 0.85,
      keywordMatch: 0.6,
      proximityScore: 0.5,
      mutualConnections: 1,
      connectionPath: [userId, 'demo-user-3', 'demo-user-12'],
      reason: '투자/핀테크 분야 경험이 풍부합니다',
    },
    {
      userId: 'demo-user-24',
      user: demoUsers[23],
      score: 0.82,
      keywordMatch: 0.7,
      proximityScore: 0.5,
      mutualConnections: 1,
      connectionPath: [userId, 'demo-user-5', 'demo-user-24'],
      reason: 'AI, 자동화 기술에 관심이 있습니다',
    },
    {
      userId: 'demo-user-13',
      user: demoUsers[12],
      score: 0.78,
      keywordMatch: 0.5,
      proximityScore: 0.5,
      mutualConnections: 1,
      connectionPath: [userId, 'demo-user-3', 'demo-user-13'],
      reason: 'Web3/블록체인 전문가입니다',
    },
    {
      userId: 'demo-user-28',
      user: demoUsers[27],
      score: 0.75,
      keywordMatch: 0.55,
      proximityScore: 0.5,
      mutualConnections: 1,
      connectionPath: [userId, 'demo-user-3', 'demo-user-28'],
      reason: '스타트업 CEO로서 IoT 분야에서 활동 중입니다',
    },
  ];
};

// Initial invite codes for demo
export const demoInviteCodes = [
  'ABC-123',
  'DEF-456',
  'GHI-789',
  'JKL-012',
  'MNO-345',
];

// 데모 사용자 연결 관계 (export)
export const demoConnections: Record<string, string[]> = {
  'demo-user-1': ['demo-user-2', 'demo-user-3', 'demo-user-4', 'demo-user-5', 'demo-user-6', 'demo-user-7', 'demo-user-8', 'demo-user-9', 'demo-user-15', 'demo-user-11'],
  'demo-user-2': ['demo-user-1', 'demo-user-10', 'demo-user-21', 'demo-user-29', 'demo-user-4', 'demo-user-25', 'demo-user-27', 'demo-user-14', 'demo-user-7', 'demo-user-6'],
  'demo-user-3': ['demo-user-1', 'demo-user-12', 'demo-user-13', 'demo-user-19', 'demo-user-28', 'demo-user-5', 'demo-user-7', 'demo-user-17', 'demo-user-22', 'demo-user-20'],
  'demo-user-4': ['demo-user-1', 'demo-user-2', 'demo-user-14', 'demo-user-27', 'demo-user-10', 'demo-user-21', 'demo-user-30', 'demo-user-18', 'demo-user-9', 'demo-user-6'],
  'demo-user-5': ['demo-user-1', 'demo-user-11', 'demo-user-15', 'demo-user-24', 'demo-user-26', 'demo-user-8', 'demo-user-3', 'demo-user-22', 'demo-user-13', 'demo-user-23'],
  'demo-user-6': ['demo-user-1', 'demo-user-16', 'demo-user-25', 'demo-user-2', 'demo-user-4', 'demo-user-9', 'demo-user-18', 'demo-user-20', 'demo-user-17', 'demo-user-7'],
  'demo-user-7': ['demo-user-1', 'demo-user-17', 'demo-user-22', 'demo-user-30', 'demo-user-2', 'demo-user-3', 'demo-user-6', 'demo-user-14', 'demo-user-19', 'demo-user-28'],
  'demo-user-8': ['demo-user-1', 'demo-user-15', 'demo-user-11', 'demo-user-29', 'demo-user-5', 'demo-user-24', 'demo-user-26', 'demo-user-9', 'demo-user-23', 'demo-user-16'],
  'demo-user-9': ['demo-user-1', 'demo-user-18', 'demo-user-20', 'demo-user-23', 'demo-user-4', 'demo-user-6', 'demo-user-8', 'demo-user-27', 'demo-user-19', 'demo-user-29'],
  'demo-user-10': ['demo-user-2', 'demo-user-4', 'demo-user-14', 'demo-user-21', 'demo-user-27', 'demo-user-30', 'demo-user-25', 'demo-user-7', 'demo-user-18', 'demo-user-29'],
  'demo-user-11': ['demo-user-5', 'demo-user-8', 'demo-user-15', 'demo-user-24', 'demo-user-26', 'demo-user-1', 'demo-user-13', 'demo-user-23', 'demo-user-22', 'demo-user-3'],
  'demo-user-12': ['demo-user-3', 'demo-user-13', 'demo-user-17', 'demo-user-19', 'demo-user-20', 'demo-user-28', 'demo-user-16', 'demo-user-6', 'demo-user-7', 'demo-user-23'],
  'demo-user-13': ['demo-user-3', 'demo-user-12', 'demo-user-5', 'demo-user-11', 'demo-user-22', 'demo-user-28', 'demo-user-24', 'demo-user-26', 'demo-user-19', 'demo-user-15'],
  'demo-user-14': ['demo-user-4', 'demo-user-10', 'demo-user-27', 'demo-user-30', 'demo-user-7', 'demo-user-2', 'demo-user-21', 'demo-user-22', 'demo-user-18', 'demo-user-25'],
  'demo-user-15': ['demo-user-5', 'demo-user-8', 'demo-user-11', 'demo-user-24', 'demo-user-1', 'demo-user-13', 'demo-user-26', 'demo-user-29', 'demo-user-23', 'demo-user-16'],
  'demo-user-16': ['demo-user-6', 'demo-user-17', 'demo-user-12', 'demo-user-8', 'demo-user-15', 'demo-user-7', 'demo-user-19', 'demo-user-28', 'demo-user-20', 'demo-user-25'],
  'demo-user-17': ['demo-user-7', 'demo-user-3', 'demo-user-12', 'demo-user-16', 'demo-user-6', 'demo-user-19', 'demo-user-28', 'demo-user-20', 'demo-user-22', 'demo-user-30'],
  'demo-user-18': ['demo-user-9', 'demo-user-20', 'demo-user-23', 'demo-user-4', 'demo-user-6', 'demo-user-10', 'demo-user-14', 'demo-user-27', 'demo-user-19', 'demo-user-21'],
  'demo-user-19': ['demo-user-3', 'demo-user-7', 'demo-user-9', 'demo-user-12', 'demo-user-13', 'demo-user-16', 'demo-user-17', 'demo-user-18', 'demo-user-20', 'demo-user-28'],
  'demo-user-20': ['demo-user-9', 'demo-user-12', 'demo-user-16', 'demo-user-17', 'demo-user-18', 'demo-user-19', 'demo-user-23', 'demo-user-6', 'demo-user-3', 'demo-user-28'],
  'demo-user-21': ['demo-user-2', 'demo-user-10', 'demo-user-25', 'demo-user-27', 'demo-user-14', 'demo-user-4', 'demo-user-18', 'demo-user-30', 'demo-user-29', 'demo-user-7'],
  'demo-user-22': ['demo-user-7', 'demo-user-13', 'demo-user-5', 'demo-user-11', 'demo-user-14', 'demo-user-17', 'demo-user-30', 'demo-user-24', 'demo-user-3', 'demo-user-26'],
  'demo-user-23': ['demo-user-9', 'demo-user-18', 'demo-user-20', 'demo-user-28', 'demo-user-5', 'demo-user-8', 'demo-user-11', 'demo-user-12', 'demo-user-15', 'demo-user-24'],
  'demo-user-24': ['demo-user-5', 'demo-user-11', 'demo-user-15', 'demo-user-8', 'demo-user-13', 'demo-user-22', 'demo-user-23', 'demo-user-26', 'demo-user-28', 'demo-user-1'],
  'demo-user-25': ['demo-user-6', 'demo-user-2', 'demo-user-10', 'demo-user-14', 'demo-user-16', 'demo-user-21', 'demo-user-27', 'demo-user-4', 'demo-user-29', 'demo-user-30'],
  'demo-user-26': ['demo-user-5', 'demo-user-8', 'demo-user-11', 'demo-user-13', 'demo-user-15', 'demo-user-22', 'demo-user-24', 'demo-user-23', 'demo-user-28', 'demo-user-1'],
  'demo-user-27': ['demo-user-4', 'demo-user-10', 'demo-user-14', 'demo-user-21', 'demo-user-25', 'demo-user-9', 'demo-user-18', 'demo-user-2', 'demo-user-30', 'demo-user-6'],
  'demo-user-28': ['demo-user-3', 'demo-user-7', 'demo-user-12', 'demo-user-13', 'demo-user-16', 'demo-user-17', 'demo-user-19', 'demo-user-20', 'demo-user-23', 'demo-user-24'],
  'demo-user-29': ['demo-user-2', 'demo-user-8', 'demo-user-9', 'demo-user-10', 'demo-user-15', 'demo-user-21', 'demo-user-25', 'demo-user-4', 'demo-user-1', 'demo-user-30'],
  'demo-user-30': ['demo-user-7', 'demo-user-14', 'demo-user-17', 'demo-user-21', 'demo-user-22', 'demo-user-25', 'demo-user-27', 'demo-user-4', 'demo-user-10', 'demo-user-29'],
};

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
  const centerUser = demoUsers.find(u => u.id === centerId);
  if (!centerUser) return { nodes: [], edges: [] };

  const nodes: NetworkNode[] = [];
  const edges: NetworkEdge[] = [];
  const addedNodeIds = new Set<string>();

  // 중심 노드 추가 (degree: 0)
  nodes.push({
    id: centerUser.id,
    name: centerUser.name,
    profileImage: centerUser.profileImage,
    company: centerUser.company,
    position: centerUser.position,
    keywords: centerUser.keywords,
    degree: 0,
    connectionCount: demoConnections[centerId]?.length || 0,
  });
  addedNodeIds.add(centerId);

  // 1촌 연결 추가
  const firstDegreeIds = demoConnections[centerId] || [];
  for (const connId of firstDegreeIds) {
    const connUser = demoUsers.find(u => u.id === connId);
    if (connUser && !addedNodeIds.has(connId)) {
      nodes.push({
        id: connUser.id,
        name: connUser.name,
        profileImage: connUser.profileImage,
        company: connUser.company,
        position: connUser.position,
        keywords: connUser.keywords,
        degree: 1,
        connectionCount: demoConnections[connId]?.length || 0,
      });
      addedNodeIds.add(connId);

      edges.push({
        source: centerId,
        degree: 1,
        target: connId,
      });
    }
  }

  // 2촌 연결 추가 (1촌의 연결)
  for (const firstDegreeId of firstDegreeIds) {
    const secondDegreeIds = demoConnections[firstDegreeId] || [];
    for (const secondId of secondDegreeIds) {
      if (secondId === centerId) continue; // 중심 노드 제외

      const secondUser = demoUsers.find(u => u.id === secondId);
      if (secondUser && !addedNodeIds.has(secondId)) {
        nodes.push({
          id: secondUser.id,
          name: secondUser.name,
          profileImage: secondUser.profileImage,
          company: secondUser.company,
          position: secondUser.position,
          keywords: secondUser.keywords,
          degree: 2,
          connectionCount: demoConnections[secondId]?.length || 0,
        });
        addedNodeIds.add(secondId);
      }

      // 1촌과 2촌 사이의 엣지 추가
      if (addedNodeIds.has(secondId)) {
        edges.push({
          source: firstDegreeId,
          degree: 2,
          target: secondId,
        });
      }
    }
  }

  return { nodes, edges };
};
