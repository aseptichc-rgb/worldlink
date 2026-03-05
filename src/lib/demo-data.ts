import { User, NetworkNode, NetworkEdge, Recommendation } from '@/types';
import { DEMO_MEMBERS, generateDemoConnections, buildConnectionMap, DEMO_ACCOUNT_INDEX } from './demo-seed-data';

// =============================================================================
// 100명의 다양한 분야 데모 멤버 데이터 (demo-seed-data.ts 기반)
// =============================================================================

// 이름으로 카테고리 조회 (Firebase 데이터에 category가 없을 때 fallback용)
const nameToCategoryMap = new Map(DEMO_MEMBERS.map(m => [m.name, m.category]));
export const getCategoryByName = (name: string): string | undefined => nameToCategoryMap.get(name);

// User 객체로 변환
export const demoUsers: User[] = DEMO_MEMBERS.map(m => ({
  id: m.id,
  name: m.name,
  email: m.email,
  company: m.company,
  position: m.position,
  bio: m.bio,
  keywords: m.keywords,
  category: m.category,
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
const allMemberIds = DEMO_MEMBERS.map(m => m.id);

// 이름으로 멤버 ID 찾기
const nameToIdMap = new Map(DEMO_MEMBERS.map(m => [m.name, m.id]));

// 클러스터 기반 현실적 연결 관계 생성
const connectionPairs = generateDemoConnections();
export const demoConnections: Record<string, string[]> = buildConnectionMap(connectionPairs);

// 실제 사용자를 데모 멤버에 매핑 (ID 또는 이름으로 매칭)
export const findMatchingMember = (user: { id?: string; name?: string; email?: string; phone?: string }): typeof DEMO_MEMBERS[0] | null => {
  if (user.id) {
    const found = DEMO_MEMBERS.find(m => m.id === user.id);
    if (found) return found;
  }
  if (user.name) {
    const found = DEMO_MEMBERS.find(m => m.name === user.name);
    if (found) return found;
  }
  return null;
};

// 사용자의 데모 호환 ID를 반환
export const getDemoCompatibleId = (user: { id: string; name?: string; email?: string; phone?: string }): string => {
  const match = findMatchingMember(user);
  return match ? match.id : user.id;
};

// 실제 사용자를 데모 네트워크에 동적으로 추가 (아직 없는 경우)
export const ensureUserInDemoNetwork = (userId: string): void => {
  if (!demoConnections[userId]) {
    // 데모 계정의 연결 목록을 기반으로 연결 (모든 멤버가 아닌 현실적 수준)
    const demoAccountId = DEMO_MEMBERS[DEMO_ACCOUNT_INDEX].id;
    const demoAccountConns = demoConnections[demoAccountId] || [];
    demoConnections[userId] = [...demoAccountConns];
    // 기존 멤버들에도 이 사용자 추가
    for (const connId of demoAccountConns) {
      if (demoConnections[connId] && !demoConnections[connId].includes(userId)) {
        demoConnections[connId].push(userId);
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
  } else if (userData?.profileImage) {
    currentUser = { ...currentUser, profileImage: userData.profileImage };
  }
  const userConnections = demoConnections[currentUser.id] || demoConnections[userId] || [];

  const getMemberCategory = (id: string) => DEMO_MEMBERS.find(m => m.id === id)?.category || '기타';

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
  'INV-001',
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
export const memberRawData = DEMO_MEMBERS;
