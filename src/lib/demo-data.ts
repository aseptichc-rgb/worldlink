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
  // 1촌 인맥들
  {
    id: 'user-jungwoo',
    name: '이정우',
    email: 'jungwoo.lee@biobytes.com',
    phone: '010-0000-0001',
    company: '바이오바이츠',
    position: '대표',
    companySize: 'startup',
    industry: '바이오/헬스케어',
    positionLevel: 'executive',
    bio: '바이오 스타트업을 이끌고 있습니다',
    keywords: ['바이오', '스타트업', '헬스케어'],
    profileImage: undefined,
    inviteCode: 'LJW-001',
    invitesRemaining: 10,
    coffeeStatus: 'available',
    privacySettings: {
      allowProfileDiscovery: true,
      displaySettings: {
        nameDisplay: 'full',
        companyDisplay: 'full',
        positionDisplay: 'full',
      },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'user-gangho',
    name: '장강호',
    email: 'gangho.jang@insightep.com',
    phone: '010-0000-0002',
    company: '인사이트에퀴티파트너스',
    position: '파트너',
    companySize: 'sme',
    industry: '금융/투자',
    positionLevel: 'executive',
    bio: '바이오헬스케어 투자 전문',
    keywords: ['투자', 'PE', '바이오', '헬스케어'],
    profileImage: undefined,
    inviteCode: 'JGH-001',
    invitesRemaining: 10,
    coffeeStatus: 'available',
    privacySettings: {
      allowProfileDiscovery: true,
      displaySettings: {
        nameDisplay: 'full',
        companyDisplay: 'full',
        positionDisplay: 'full',
      },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'user-sangwon',
    name: '고상원',
    email: 'sangwon.ko@markesian.com',
    phone: '010-0000-0003',
    company: '마케시안',
    position: '대표',
    companySize: 'startup',
    industry: '마케팅/광고',
    positionLevel: 'executive',
    bio: '디지털 마케팅 전문가',
    keywords: ['마케팅', '브랜딩', '디지털'],
    profileImage: undefined,
    inviteCode: 'KSW-001',
    invitesRemaining: 10,
    coffeeStatus: 'available',
    privacySettings: {
      allowProfileDiscovery: true,
      displaySettings: {
        nameDisplay: 'full',
        companyDisplay: 'full',
        positionDisplay: 'full',
      },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'user-kyunghoon',
    name: '선경훈',
    email: 'kyunghoon.sun@example.com',
    phone: '010-0000-0004',
    company: '',
    position: '',
    companySize: 'freelance',
    industry: '기타',
    positionLevel: 'staff',
    bio: '',
    keywords: [],
    profileImage: undefined,
    inviteCode: 'SKH-001',
    invitesRemaining: 10,
    coffeeStatus: 'available',
    privacySettings: {
      allowProfileDiscovery: true,
      displaySettings: {
        nameDisplay: 'full',
        companyDisplay: 'hidden',
        positionDisplay: 'hidden',
      },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'user-minwoo',
    name: '이민우',
    email: 'minwoo.lee@assembly.go.kr',
    phone: '010-0000-0005',
    company: '국회의장실',
    position: '비서관',
    companySize: 'enterprise',
    industry: '공공/정부',
    positionLevel: 'manager',
    bio: '국회 정책 업무 담당',
    keywords: ['정책', '공공', '국회'],
    profileImage: undefined,
    inviteCode: 'LMW-001',
    invitesRemaining: 10,
    coffeeStatus: 'busy',
    privacySettings: {
      allowProfileDiscovery: true,
      displaySettings: {
        nameDisplay: 'full',
        companyDisplay: 'full',
        positionDisplay: 'full',
      },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

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

// 연결 관계 - 1촌 인맥
export const demoConnections: Record<string, string[]> = {
  'user-jaeyoung': ['user-jungwoo', 'user-gangho', 'user-sangwon', 'user-kyunghoon', 'user-minwoo'],
  'user-jungwoo': ['user-jaeyoung'],
  // 장강호, 고상원, 선경훈, 이민우는 서로 1촌
  'user-gangho': ['user-jaeyoung', 'user-sangwon', 'user-kyunghoon', 'user-minwoo'],
  'user-sangwon': ['user-jaeyoung', 'user-gangho', 'user-kyunghoon', 'user-minwoo'],
  'user-kyunghoon': ['user-jaeyoung', 'user-gangho', 'user-sangwon', 'user-minwoo'],
  'user-minwoo': ['user-jaeyoung', 'user-gangho', 'user-sangwon', 'user-kyunghoon'],
};

// Demo network graph - 본인과 1촌, 그리고 1촌간의 연결도 표시
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

  // 본인과 1촌 연결
  const edges: NetworkEdge[] = userConnections.map(connId => ({
    source: currentUser.id,
    target: connId,
    degree: 1,
  }));

  // 1촌들 사이의 연결 (2촌 관계) 추가
  const addedEdges = new Set<string>();
  for (const connId of userConnections) {
    const connUserConnections = demoConnections[connId] || [];
    for (const secondConnId of connUserConnections) {
      // 현재 유저와의 연결은 이미 추가됨
      if (secondConnId === currentUser.id) continue;
      // 1촌 목록에 있는 사람들 사이의 연결만 추가
      if (!userConnections.includes(secondConnId)) continue;

      // 중복 방지 (A-B와 B-A는 같은 연결)
      const edgeKey = [connId, secondConnId].sort().join('-');
      if (addedEdges.has(edgeKey)) continue;
      addedEdges.add(edgeKey);

      edges.push({
        source: connId,
        target: secondConnId,
        degree: 2, // 1촌들 사이의 연결
      });
    }
  }

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
