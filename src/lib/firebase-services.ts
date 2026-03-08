import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  increment,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCustomToken,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from './firebase';
import { User, Connection, InviteCode, Invitation, TimeSlot, CoffeeChatRequest, NetworkNode, NetworkEdge, Recommendation, ManagedGroup, ManagedGroupMember, ManagedGroupRole, ManagedGroupSettings, ManagedGroupInvite } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// ==================== AUTH SERVICES ====================

export const registerWithEmail = async (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const loginWithEmail = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const logoutUser = async () => {
  return signOut(auth);
};

export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const loginWithCustomToken = async (customToken: string) => {
  return signInWithCustomToken(auth, customToken);
};

// ==================== USER SERVICES ====================

export const createUser = async (userData: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User> => {
  const userRef = doc(db, 'users', userData.id);
  const now = serverTimestamp();

  // undefined 필드 제거 (Firestore는 undefined를 지원하지 않음)
  const cleanedData = Object.fromEntries(
    Object.entries(userData).filter(([_, value]) => value !== undefined)
  );

  const user = {
    ...cleanedData,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(userRef, user);

  return {
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

export const getUser = async (userId: string): Promise<User | null> => {
  const userRef = doc(db, 'users', userId);
  let userSnap;
  try {
    userSnap = await getDocFromServer(userRef);
  } catch {
    userSnap = await getDoc(userRef);
  }

  if (!userSnap.exists()) {
    // Firebase에 없으면 데모 데이터에서 찾기
    const { demoUsers } = await import('./demo-data');
    const demoUser = demoUsers.find(u => u.id === userId);
    return demoUser || null;
  }

  const data = userSnap.data();
  return {
    ...data,
    id: userSnap.id,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as User;
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const searchUsersByKeyword = async (keywords: string[]): Promise<User[]> => {
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('keywords', 'array-contains-any', keywords),
    limit(50)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
  })) as User[];
};

// 모든 사용자 조회
export const getAllUsers = async (): Promise<User[]> => {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
  })) as User[];
};

// 현재 사용자와 모든 다른 사용자 사이에 connection 생성 (이미 있는 연결은 건너뜀)
export const connectWithAllUsers = async (currentUserId: string): Promise<number> => {
  const allUsers = await getAllUsers();
  const existingConnections = await getDirectConnections(currentUserId);

  // 이미 연결된 사용자 ID 목록
  const connectedUserIds = new Set(
    existingConnections.map(conn =>
      conn.fromUserId === currentUserId ? conn.toUserId : conn.fromUserId
    )
  );

  let newConnectionsCount = 0;
  const batch = writeBatch(db);

  for (const user of allUsers) {
    // 자기 자신이거나 이미 연결된 경우 건너뜀
    if (user.id === currentUserId || connectedUserIds.has(user.id)) {
      continue;
    }

    const connRef = doc(collection(db, 'connections'));
    batch.set(connRef, {
      id: connRef.id,
      fromUserId: currentUserId,
      toUserId: user.id,
      status: 'accepted',
      method: 'auto',
      createdAt: serverTimestamp(),
      acceptedAt: serverTimestamp(),
    });
    newConnectionsCount++;

    // Firestore batch는 500개 제한이 있으므로 나눠서 처리
    if (newConnectionsCount % 450 === 0) {
      await batch.commit();
    }
  }

  if (newConnectionsCount % 450 !== 0) {
    await batch.commit();
  }

  console.log(`[connectWithAllUsers] Created ${newConnectionsCount} new connections`);
  return newConnectionsCount;
};

// ==================== INVITE CODE SERVICES ====================

export const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${code.slice(0, 3)}-${code.slice(3)}`;
};

export const createInviteCode = async (userId: string): Promise<InviteCode> => {
  const code = generateInviteCode();
  const inviteRef = doc(db, 'inviteCodes', code);

  const invite: InviteCode = {
    code,
    createdBy: userId,
    createdAt: new Date(),
    isValid: true,
  };

  await setDoc(inviteRef, {
    ...invite,
    createdAt: serverTimestamp(),
  });

  return invite;
};

export const validateInviteCode = async (code: string): Promise<{ valid: boolean; createdBy?: string }> => {
  // 테스트용 초대 코드 - 개발 환경에서만 사용 (형식: XXX-XXX)
  if (process.env.NODE_ENV === 'development') {
    const TEST_CODES = ['TES-T00', 'NEX-TST', 'DEV-123'];
    if (TEST_CODES.includes(code.toUpperCase())) {
      return { valid: true, createdBy: 'admin' };
    }
  }

  const inviteRef = doc(db, 'inviteCodes', code.toUpperCase());
  const inviteSnap = await getDoc(inviteRef);

  if (!inviteSnap.exists()) {
    return { valid: false };
  }

  const data = inviteSnap.data();
  if (!data.isValid || data.usedBy) {
    return { valid: false };
  }

  return { valid: true, createdBy: data.createdBy };
};

export const useInviteCode = async (code: string, userId: string): Promise<void> => {
  // 테스트 코드는 Firestore에 저장하지 않음 (개발 환경 전용)
  if (process.env.NODE_ENV === 'development') {
    const TEST_CODES = ['TES-T00', 'NEX-TST', 'DEV-123'];
    if (TEST_CODES.includes(code.toUpperCase())) {
      return;
    }
  }

  const inviteRef = doc(db, 'inviteCodes', code.toUpperCase());
  await updateDoc(inviteRef, {
    usedBy: userId,
    usedAt: serverTimestamp(),
    isValid: false,
  });
};

// ==================== INVITATION SERVICES ====================

// 초대장 발송 기록 생성
export const createInvitation = async (
  senderId: string,
  method: Invitation['method'],
  recipientEmail?: string,
  recipientPhone?: string
): Promise<Invitation> => {
  // 사용자 확인
  const sender = await getUser(senderId);
  if (!sender) throw new Error('사용자를 찾을 수 없습니다');
  // 초대 횟수 무제한

  // 새로운 초대 코드 생성
  const inviteCode = await createInviteCode(senderId);

  const invitationRef = doc(collection(db, 'invitations'));

  const invitation: Invitation = {
    id: invitationRef.id,
    senderId,
    recipientEmail,
    recipientPhone,
    inviteCode: inviteCode.code,
    method,
    status: 'pending',
    sentAt: new Date(),
  };

  // Firebase에 저장할 때 undefined 값 제거
  const firestoreData: Record<string, unknown> = {
    id: invitationRef.id,
    senderId,
    inviteCode: inviteCode.code,
    method,
    status: 'pending',
    sentAt: serverTimestamp(),
  };

  // undefined가 아닌 경우에만 추가
  if (recipientEmail) firestoreData.recipientEmail = recipientEmail;
  if (recipientPhone) firestoreData.recipientPhone = recipientPhone;

  await setDoc(invitationRef, firestoreData);

  // 초대 횟수 무제한이므로 감소하지 않음

  return invitation;
};

// 초대 상태 업데이트
export const updateInvitationStatus = async (
  invitationId: string,
  status: Invitation['status'],
  acceptedBy?: string
): Promise<void> => {
  const invitationRef = doc(db, 'invitations', invitationId);
  const updates: Record<string, unknown> = { status };

  if (status === 'accepted' && acceptedBy) {
    updates.acceptedAt = serverTimestamp();
    updates.acceptedBy = acceptedBy;
  }

  await updateDoc(invitationRef, updates);
};

// 사용자의 발송한 초대 목록 조회
export const getSentInvitations = async (userId: string): Promise<Invitation[]> => {
  const invitationsRef = collection(db, 'invitations');
  const q = query(
    invitationsRef,
    where('senderId', '==', userId),
    orderBy('sentAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      sentAt: data.sentAt?.toDate() || new Date(),
      acceptedAt: data.acceptedAt?.toDate(),
    };
  }) as Invitation[];
};

// 초대 코드로 초대 정보 조회 (가입 시 연결용)
export const getInvitationByCode = async (code: string): Promise<Invitation | null> => {
  const invitationsRef = collection(db, 'invitations');
  const q = query(
    invitationsRef,
    where('inviteCode', '==', code.toUpperCase()),
    where('status', '==', 'pending'),
    limit(1)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    sentAt: data.sentAt?.toDate() || new Date(),
    acceptedAt: data.acceptedAt?.toDate(),
  } as Invitation;
};

// 초대 수락 처리 (가입 완료 시)
export const acceptInvitation = async (inviteCode: string, acceptedUserId: string): Promise<void> => {
  const invitation = await getInvitationByCode(inviteCode);
  if (invitation) {
    await updateInvitationStatus(invitation.id, 'accepted', acceptedUserId);
  }
};

// 초대 링크 생성
export const generateInviteLink = (inviteCode: string): string => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || '';
  return `${baseUrl}/onboarding?code=${inviteCode}`;
};

// ==================== CONNECTION SERVICES ====================

export const createConnection = async (fromUserId: string, toUserId: string, method: Connection['method'] = 'invite'): Promise<Connection> => {
  const connectionRef = doc(collection(db, 'connections'));

  const connection: Connection = {
    id: connectionRef.id,
    fromUserId,
    toUserId,
    status: 'pending',
    method,
    createdAt: new Date(),
  };

  await setDoc(connectionRef, {
    ...connection,
    createdAt: serverTimestamp(),
  });

  return connection;
};

// 초대 링크를 통한 자동 인맥 연결 (바로 accepted 상태)
export const createAutoConnection = async (fromUserId: string, toUserId: string): Promise<Connection> => {
  const connectionRef = doc(collection(db, 'connections'));

  const connection: Connection = {
    id: connectionRef.id,
    fromUserId,
    toUserId,
    status: 'accepted',
    method: 'invite',
    createdAt: new Date(),
    acceptedAt: new Date(),
  };

  await setDoc(connectionRef, {
    ...connection,
    createdAt: serverTimestamp(),
    acceptedAt: serverTimestamp(),
  });

  return connection;
};

export const acceptConnection = async (connectionId: string): Promise<void> => {
  const connectionRef = doc(db, 'connections', connectionId);
  await updateDoc(connectionRef, {
    status: 'accepted',
    acceptedAt: serverTimestamp(),
  });
};

export const rejectConnection = async (connectionId: string): Promise<void> => {
  const connectionRef = doc(db, 'connections', connectionId);
  await updateDoc(connectionRef, {
    status: 'rejected',
  });
};

export const getDirectConnections = async (userId: string): Promise<Connection[]> => {
  console.log('[getDirectConnections] Querying for userId:', userId);
  const connectionsRef = collection(db, 'connections');

  // Get connections where user is either sender or receiver
  const sentQuery = query(
    connectionsRef,
    where('fromUserId', '==', userId),
    where('status', '==', 'accepted')
  );

  const receivedQuery = query(
    connectionsRef,
    where('toUserId', '==', userId),
    where('status', '==', 'accepted')
  );

  const [sentSnap, receivedSnap] = await Promise.all([
    getDocs(sentQuery),
    getDocs(receivedQuery)
  ]);

  const connections: Connection[] = [];
  const seenPairs = new Set<string>();  // 중복 연결 방지를 위한 Set

  sentSnap.docs.forEach(doc => {
    const data = doc.data();
    // 연결 쌍 키 생성 (순서 정렬하여 양방향 중복 방지)
    const pairKey = [userId, data.toUserId].sort().join('-');
    if (!seenPairs.has(pairKey)) {
      seenPairs.add(pairKey);
      connections.push({
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        acceptedAt: data.acceptedAt?.toDate(),
      } as Connection);
    }
  });

  receivedSnap.docs.forEach(doc => {
    const data = doc.data();
    // 연결 쌍 키 생성 (순서 정렬하여 양방향 중복 방지)
    const pairKey = [userId, data.fromUserId].sort().join('-');
    if (!seenPairs.has(pairKey)) {
      seenPairs.add(pairKey);
      connections.push({
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        acceptedAt: data.acceptedAt?.toDate(),
      } as Connection);
    }
  });

  return connections;
};

export const getPendingConnections = async (userId: string): Promise<Connection[]> => {
  const connectionsRef = collection(db, 'connections');
  const q = query(
    connectionsRef,
    where('toUserId', '==', userId),
    where('status', '==', 'pending')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Connection[];
};

// 특정 사용자의 1촌 인맥 목록을 User 정보와 함께 반환
export const getUserConnectionsWithDetails = async (userId: string): Promise<User[]> => {
  const connections = await getDirectConnections(userId);

  if (connections.length === 0) {
    // Firebase에 연결이 없으면 데모 데이터 사용
    const { demoConnections, demoUsers, getDemoCompatibleId: getCompId, ensureUserInDemoNetwork: ensureUser } = await import('./demo-data');
    const demoId = getCompId({ id: userId });
    ensureUser(userId);
    const demoConnectionIds = demoConnections[demoId] || demoConnections[userId] || [];

    return demoUsers.filter(user => demoConnectionIds.includes(user.id));
  }

  // 연결된 사용자 ID 추출 (중복 제거)
  const connectedUserIds = [...new Set(
    connections.map(conn =>
      conn.fromUserId === userId ? conn.toUserId : conn.fromUserId
    )
  )];

  // 각 사용자 정보 병렬로 가져오기
  const userResults = await Promise.all(
    connectedUserIds.map(id => getUser(id))
  );

  return userResults.filter((u): u is User => u !== null);
};

// 현재 사용자가 대상 사용자와 1촌인지 확인
export const isFirstDegreeConnection = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
  const connectionsRef = collection(db, 'connections');

  // 양방향으로 확인 (currentUser -> target 또는 target -> currentUser)
  const query1 = query(
    connectionsRef,
    where('fromUserId', '==', currentUserId),
    where('toUserId', '==', targetUserId),
    where('status', '==', 'accepted')
  );

  const query2 = query(
    connectionsRef,
    where('fromUserId', '==', targetUserId),
    where('toUserId', '==', currentUserId),
    where('status', '==', 'accepted')
  );

  const [snap1, snap2] = await Promise.all([
    getDocs(query1),
    getDocs(query2)
  ]);

  return !snap1.empty || !snap2.empty;
};

// ==================== NETWORK GRAPH SERVICES ====================

import { getDemoNetworkGraph, getDemoRecommendations as getDemoRecs, getDemoCompatibleId, ensureUserInDemoNetwork } from './demo-data';
import { DEMO_NAME_CATEGORY_MAP } from './demo-seed-data';

// 이름 → 카테고리 매핑 (Firestore에 category가 없는 기존 데이터 호환용)
const NAME_CATEGORY_MAP: Record<string, string> = {
  ...DEMO_NAME_CATEGORY_MAP,
};

export const getNetworkGraph = async (userId: string, userData?: { name?: string; profileImage?: string; company?: string; position?: string; keywords?: string[] }): Promise<{ nodes: NetworkNode[]; edges: NetworkEdge[] }> => {
  // 먼저 Firebase에서 실제 연결 데이터 확인
  const directConnections = await getDirectConnections(userId);

  console.log('[getNetworkGraph] userId:', userId);
  console.log('[getNetworkGraph] directConnections:', directConnections.length, directConnections);

  // 실제 연결이 없으면 데모 데이터 사용
  if (directConnections.length === 0) {
    // 실제 사용자를 데모 멤버에 매핑 시도
    const demoId = getDemoCompatibleId({ id: userId, name: userData?.name });
    if (demoId !== userId) {
      return getDemoNetworkGraph(demoId, userData);
    }
    return getDemoNetworkGraph(userId, userData);
  }

  const nodes: NetworkNode[] = [];
  const edges: NetworkEdge[] = [];
  const userMap = new Map<string, User>();

  // Get current user
  const currentUser = await getUser(userId);
  if (!currentUser) throw new Error('User not found');

  // Add current user as center node
  nodes.push({
    id: currentUser.id,
    name: currentUser.name,
    profileImage: currentUser.profileImage,
    company: currentUser.company,
    position: currentUser.position,
    keywords: currentUser.keywords,
    degree: 0,
    connectionCount: 0,
    category: currentUser.category || NAME_CATEGORY_MAP[currentUser.name],
  });
  userMap.set(currentUser.id, currentUser);

  // Get 1st degree connections (parallel fetch) - 중복 제거
  const firstDegreeIds = new Set<string>();
  directConnections.forEach(conn => {
    const connectedId = conn.fromUserId === userId ? conn.toUserId : conn.fromUserId;
    firstDegreeIds.add(connectedId);
  });

  const firstDegreeUsers = await Promise.all(
    [...firstDegreeIds].map(id => getUser(id))
  );

  for (const connectedUser of firstDegreeUsers) {
    if (connectedUser && !userMap.has(connectedUser.id)) {
      userMap.set(connectedUser.id, connectedUser);
      nodes.push({
        id: connectedUser.id,
        name: connectedUser.name,
        profileImage: connectedUser.profileImage,
        company: connectedUser.company,
        position: connectedUser.position,
        keywords: connectedUser.keywords,
        degree: 1,
        connectionCount: 0,
        category: connectedUser.category || NAME_CATEGORY_MAP[connectedUser.name],
      });

      edges.push({
        source: userId,
        target: connectedUser.id,
        degree: 1,
      });
    }
  }

  // Get 2nd degree connections (parallel fetch of all 1st-degree connections)
  const secondDegreeConnectionsByFirst = await Promise.all(
    [...firstDegreeIds].map(async (firstDegreeId) => ({
      firstDegreeId,
      connections: await getDirectConnections(firstDegreeId),
    }))
  );

  // Collect 2nd degree user IDs to fetch
  const secondDegreeToFetch = new Set<string>();
  const secondDegreeEdges: { source: string; target: string }[] = [];

  for (const { firstDegreeId, connections: conns } of secondDegreeConnectionsByFirst) {
    for (const conn of conns) {
      const secondDegreeUserId = conn.fromUserId === firstDegreeId ? conn.toUserId : conn.fromUserId;
      if (secondDegreeUserId === userId || firstDegreeIds.has(secondDegreeUserId)) continue;

      secondDegreeEdges.push({ source: firstDegreeId, target: secondDegreeUserId });
      if (!userMap.has(secondDegreeUserId)) {
        secondDegreeToFetch.add(secondDegreeUserId);
      }
    }
  }

  // Parallel fetch all 2nd degree users
  const secondDegreeUsers = await Promise.all(
    [...secondDegreeToFetch].map(id => getUser(id))
  );

  for (const user of secondDegreeUsers) {
    if (user) {
      userMap.set(user.id, user);
      nodes.push({
        id: user.id,
        name: user.name,
        profileImage: user.profileImage,
        company: user.company,
        position: user.position,
        keywords: user.keywords,
        degree: 2,
        connectionCount: 0,
        category: user.category || NAME_CATEGORY_MAP[user.name],
      });
    }
  }

  // Add all 2nd degree edges (only for users that were successfully fetched)
  for (const { source, target } of secondDegreeEdges) {
    if (userMap.has(target)) {
      edges.push({ source, target, degree: 2 });
    }
  }

  // 이름 기반 중복 제거 - 같은 이름의 노드가 여러 개 있으면 가장 가까운 것(degree가 낮은 것)만 유지
  const nameToNode = new Map<string, NetworkNode>();
  const duplicateIds = new Set<string>();

  for (const node of nodes) {
    const existingNode = nameToNode.get(node.name);
    if (existingNode) {
      // 기존 노드보다 더 가까우면(degree가 낮으면) 교체
      if (node.degree < existingNode.degree) {
        duplicateIds.add(existingNode.id);
        nameToNode.set(node.name, node);
      } else {
        duplicateIds.add(node.id);
      }
    } else {
      nameToNode.set(node.name, node);
    }
  }

  // 중복 노드 제거
  const filteredNodes = nodes.filter(node => !duplicateIds.has(node.id));

  // 중복 노드와 연결된 엣지도 제거
  const filteredEdges = edges.filter(
    edge => !duplicateIds.has(edge.source) && !duplicateIds.has(edge.target)
  );

  // Update connection counts and ensure category
  filteredNodes.forEach(node => {
    node.connectionCount = filteredEdges.filter(
      edge => edge.source === node.id || edge.target === node.id
    ).length;
    // category fallback: Firestore에 category가 없으면 이름으로 매핑
    if (!node.category) {
      node.category = NAME_CATEGORY_MAP[node.name];
    }
  });

  console.log('[getNetworkGraph] Removed duplicates:', duplicateIds.size, 'nodes');

  // importedContacts 추가 (가져온 연락처)
  const userDoc = await getDoc(doc(db, 'users', userId));
  const importedContacts = userDoc.data()?.importedContacts || [];

  if (importedContacts.length > 0) {
    console.log('[getNetworkGraph] Adding imported contacts:', importedContacts.length);

    // 이미 추가된 이름 집합 (중복 방지)
    const existingNames = new Set(filteredNodes.map(n => n.name));

    for (const contact of importedContacts) {
      // 이미 같은 이름의 노드가 있으면 건너뛰기
      if (existingNames.has(contact.name)) continue;

      const importedNode: NetworkNode = {
        id: contact.id || `imported_${contact.phone?.replace(/[^0-9]/g, '') || Date.now()}`,
        name: contact.name,
        company: contact.company,
        position: contact.position,
        keywords: [],
        degree: 1,
        connectionCount: 0,
        isImported: true,
        importedByUserId: userId,
        phone: contact.phone,
        email: contact.email,
      };

      filteredNodes.push(importedNode);
      existingNames.add(contact.name);

      // 중심 사용자와 연결
      filteredEdges.push({
        source: userId,
        target: importedNode.id,
        degree: 1,
      });
    }

    console.log('[getNetworkGraph] Total nodes after imports:', filteredNodes.length);
  }

  return { nodes: filteredNodes, edges: filteredEdges };
};

export const findConnectionPath = async (fromUserId: string, toUserId: string): Promise<string[]> => {
  // BFS to find shortest path (max 3 degrees to prevent excessive Firestore reads)
  const MAX_DEPTH = 3;
  const visited = new Set<string>();
  const queue: { userId: string; path: string[] }[] = [{ userId: fromUserId, path: [fromUserId] }];

  while (queue.length > 0) {
    const { userId, path } = queue.shift()!;

    if (userId === toUserId) {
      return path;
    }

    if (visited.has(userId)) continue;
    visited.add(userId);

    // Stop expanding beyond max depth
    if (path.length > MAX_DEPTH) continue;

    const connections = await getDirectConnections(userId);
    for (const conn of connections) {
      const nextUserId = conn.fromUserId === userId ? conn.toUserId : conn.fromUserId;
      if (!visited.has(nextUserId)) {
        queue.push({ userId: nextUserId, path: [...path, nextUserId] });
      }
    }
  }

  return []; // No path found
};

// ==================== COFFEE CHAT SERVICES ====================

export const createTimeSlot = async (slot: Omit<TimeSlot, 'id'>): Promise<TimeSlot> => {
  const slotRef = doc(collection(db, 'timeSlots'));

  const timeSlot: TimeSlot = {
    ...slot,
    id: slotRef.id,
  };

  await setDoc(slotRef, timeSlot);
  return timeSlot;
};

export const getUserTimeSlots = async (userId: string): Promise<TimeSlot[]> => {
  const slotsRef = collection(db, 'timeSlots');
  const q = query(
    slotsRef,
    where('userId', '==', userId),
    where('isAvailable', '==', true)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
  })) as TimeSlot[];
};

export const createCoffeeChatRequest = async (request: Omit<CoffeeChatRequest, 'id' | 'createdAt'>): Promise<CoffeeChatRequest> => {
  const requestRef = doc(collection(db, 'coffeeChatRequests'));

  const chatRequest: CoffeeChatRequest = {
    ...request,
    id: requestRef.id,
    createdAt: new Date(),
  };

  await setDoc(requestRef, {
    ...chatRequest,
    createdAt: serverTimestamp(),
  });

  return chatRequest;
};

export const respondToCoffeeChatRequest = async (
  requestId: string,
  status: 'accepted' | 'rejected'
): Promise<void> => {
  const requestRef = doc(db, 'coffeeChatRequests', requestId);
  await updateDoc(requestRef, {
    status,
    respondedAt: serverTimestamp(),
  });
};

export const getPendingCoffeeChatRequests = async (userId: string): Promise<CoffeeChatRequest[]> => {
  const requestsRef = collection(db, 'coffeeChatRequests');
  const q = query(
    requestsRef,
    where('toUserId', '==', userId),
    where('status', '==', 'pending')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      scheduledDate: data.scheduledDate?.toDate() || new Date(),
    };
  }) as CoffeeChatRequest[];
};

// ==================== RECOMMENDATION SERVICES ====================

export const getRecommendations = async (userId: string, count: number = 3): Promise<Recommendation[]> => {
  // 실제 연결이 없으면 데모 추천 데이터 사용
  const directConnections = await getDirectConnections(userId);
  if (directConnections.length === 0) {
    return getDemoRecs(userId).slice(0, count);
  }

  const currentUser = await getUser(userId);
  if (!currentUser) return [];

  const { nodes } = await getNetworkGraph(userId);

  // Filter to only 2nd degree connections
  const secondDegreeNodes = nodes.filter(node => node.degree === 2);

  // Calculate recommendation scores
  const recommendations: Recommendation[] = [];

  for (const node of secondDegreeNodes) {
    // Calculate keyword match (intersection / union)
    const userKeywords = new Set(currentUser.keywords.map(k => k.toLowerCase()));
    const nodeKeywords = new Set(node.keywords.map(k => k.toLowerCase()));
    const intersection = [...userKeywords].filter(k => nodeKeywords.has(k)).length;
    const union = new Set([...userKeywords, ...nodeKeywords]).size;
    const keywordMatch = union > 0 ? intersection / union : 0;

    // Proximity score (inverse of degree)
    const proximityScore = 1 / node.degree;

    // Get mutual connections count
    const mutualConnections = node.connectionCount;

    // Calculate total score: S = 0.6K + 0.4P (simplified from the original formula)
    const score = 0.6 * keywordMatch + 0.4 * proximityScore;

    // Get connection path
    const connectionPath = await findConnectionPath(userId, node.id);

    const nodeUser = await getUser(node.id);
    if (nodeUser) {
      recommendations.push({
        userId: node.id,
        user: nodeUser,
        score,
        keywordMatch,
        proximityScore,
        mutualConnections,
        connectionPath,
        reason: keywordMatch > 0
          ? `${currentUser.name}님과 관심사가 비슷합니다`
          : `${mutualConnections}명의 공통 인맥이 있습니다`,
      });
    }
  }

  // Sort by score and return top N
  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
};

// ==================== PUBLIC CARD SERVICES ====================

export const savePublicCard = async (card: {
  id: string;
  name: string;
  company?: string;
  position?: string;
  email?: string;
  phone?: string;
  bio?: string;
  profileImage?: string;
  keywords: string[];
}): Promise<void> => {
  const cardRef = doc(db, 'publicCards', card.id);
  const cleanedData = Object.fromEntries(
    Object.entries(card).filter(([_, value]) => value !== undefined)
  );
  await setDoc(cardRef, {
    ...cleanedData,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

export const getPublicCard = async (cardId: string): Promise<{
  id: string;
  name: string;
  company?: string;
  position?: string;
  email?: string;
  phone?: string;
  bio?: string;
  profileImage?: string;
  keywords: string[];
} | null> => {
  const cardRef = doc(db, 'publicCards', cardId);
  const cardSnap = await getDoc(cardRef);
  if (!cardSnap.exists()) return null;
  const data = cardSnap.data();
  return {
    id: cardSnap.id,
    name: data.name,
    company: data.company,
    position: data.position,
    email: data.email,
    phone: data.phone,
    bio: data.bio,
    profileImage: data.profileImage,
    keywords: data.keywords || [],
  };
};

// ==================== STORAGE SERVICES ====================

export const uploadProfileImage = async (userId: string, file: File): Promise<string> => {
  // 파일명에 타임스탬프를 추가하여 매번 고유한 URL 생성 (브라우저 캐시 무효화)
  const timestamp = Date.now();
  const extension = file.name.split('.').pop() || 'jpg';
  const fileName = `profile_${timestamp}.${extension}`;
  const storageRef = ref(storage, `profiles/${userId}/${fileName}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

// ==================== KEYWORD SERVICES ====================

export const getPopularKeywords = async (limitCount: number = 20): Promise<string[]> => {
  const keywordsRef = collection(db, 'keywords');
  const q = query(keywordsRef, orderBy('useCount', 'desc'), limit(limitCount));

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data().tag);
};

export const incrementKeywordCount = async (tag: string): Promise<void> => {
  const keywordRef = doc(db, 'keywords', tag.toLowerCase());
  await setDoc(keywordRef, {
    tag,
    useCount: increment(1),
    createdAt: serverTimestamp(),
  }, { merge: true });
};

// ==================== GROUP INVITE SERVICES ====================

// 사용자 그룹 데이터 저장 (전체 덮어쓰기)
export const saveUserGroups = async (
  userId: string,
  data: {
    groups: { id: string; name: string; color: string; icon: string; createdAt: Date; updatedAt: Date }[];
    memberships: { groupId: string; nodeId: string; addedAt: Date }[];
    groupConnections: { groupId: string; sourceNodeId: string; targetNodeId: string; createdAt: Date }[];
  }
): Promise<void> => {
  const groupsRef = doc(db, 'userGroups', userId);
  await setDoc(groupsRef, {
    groups: data.groups.map(g => ({
      ...g,
      createdAt: g.createdAt instanceof Date ? Timestamp.fromDate(g.createdAt) : g.createdAt,
      updatedAt: g.updatedAt instanceof Date ? Timestamp.fromDate(g.updatedAt) : g.updatedAt,
    })),
    memberships: data.memberships.map(m => ({
      ...m,
      addedAt: m.addedAt instanceof Date ? Timestamp.fromDate(m.addedAt) : m.addedAt,
    })),
    groupConnections: data.groupConnections.map(c => ({
      ...c,
      createdAt: c.createdAt instanceof Date ? Timestamp.fromDate(c.createdAt) : c.createdAt,
    })),
    updatedAt: serverTimestamp(),
  });
};

// 사용자 그룹 데이터 불러오기
export const loadUserGroups = async (
  userId: string
): Promise<{
  groups: { id: string; name: string; color: string; icon: string; createdAt: Date; updatedAt: Date }[];
  memberships: { groupId: string; nodeId: string; addedAt: Date }[];
  groupConnections: { groupId: string; sourceNodeId: string; targetNodeId: string; createdAt: Date }[];
} | null> => {
  const groupsRef = doc(db, 'userGroups', userId);
  const groupsSnap = await getDoc(groupsRef);

  if (!groupsSnap.exists()) return null;

  const data = groupsSnap.data();

  return {
    groups: (data.groups || []).map((g: Record<string, unknown>) => ({
      id: g.id as string,
      name: g.name as string,
      color: g.color as string,
      icon: g.icon as string,
      createdAt: (g.createdAt as Timestamp)?.toDate?.() || new Date(),
      updatedAt: (g.updatedAt as Timestamp)?.toDate?.() || new Date(),
    })),
    memberships: (data.memberships || []).map((m: Record<string, unknown>) => ({
      groupId: m.groupId as string,
      nodeId: m.nodeId as string,
      addedAt: (m.addedAt as Timestamp)?.toDate?.() || new Date(),
    })),
    groupConnections: (data.groupConnections || []).map((c: Record<string, unknown>) => ({
      groupId: c.groupId as string,
      sourceNodeId: c.sourceNodeId as string,
      targetNodeId: c.targetNodeId as string,
      createdAt: (c.createdAt as Timestamp)?.toDate?.() || new Date(),
    })),
  };
};

// 그룹 초대 정보 저장
export const createGroupInvite = async (
  groupId: string,
  groupName: string,
  inviterId: string,
  memberIds: string[]
): Promise<string> => {
  const inviteRef = doc(collection(db, 'groupInvites'));

  await setDoc(inviteRef, {
    id: inviteRef.id,
    groupId,
    groupName,
    inviterId,
    memberIds,
    createdAt: serverTimestamp(),
    status: 'pending',
  });

  return inviteRef.id;
};

// 그룹 초대 정보 조회
export const getGroupInvite = async (inviteId: string): Promise<{
  id: string;
  groupId: string;
  groupName: string;
  inviterId: string;
  memberIds: string[];
  status: string;
} | null> => {
  const inviteRef = doc(db, 'groupInvites', inviteId);
  const inviteSnap = await getDoc(inviteRef);

  if (!inviteSnap.exists()) return null;

  const data = inviteSnap.data();
  return {
    id: inviteSnap.id,
    groupId: data.groupId,
    groupName: data.groupName,
    inviterId: data.inviterId,
    memberIds: data.memberIds || [],
    status: data.status,
  };
};

// 그룹 초대 수락 - 모든 멤버와 자동 인맥 연결
export const acceptGroupInvite = async (
  inviteId: string,
  acceptedUserId: string
): Promise<void> => {
  const invite = await getGroupInvite(inviteId);
  if (!invite) throw new Error('초대를 찾을 수 없습니다');

  const batch = writeBatch(db);

  // 초대한 사람과 연결
  if (invite.inviterId !== acceptedUserId) {
    const connRef1 = doc(collection(db, 'connections'));
    batch.set(connRef1, {
      id: connRef1.id,
      fromUserId: acceptedUserId,
      toUserId: invite.inviterId,
      status: 'accepted',
      method: 'group_invite',
      createdAt: serverTimestamp(),
      acceptedAt: serverTimestamp(),
    });
  }

  // 모든 그룹 멤버와 연결
  for (const memberId of invite.memberIds) {
    if (memberId !== acceptedUserId && memberId !== invite.inviterId) {
      const connRef = doc(collection(db, 'connections'));
      batch.set(connRef, {
        id: connRef.id,
        fromUserId: acceptedUserId,
        toUserId: memberId,
        status: 'accepted',
        method: 'group_invite',
        createdAt: serverTimestamp(),
        acceptedAt: serverTimestamp(),
      });
    }
  }

  // 초대 상태 업데이트
  const inviteRef = doc(db, 'groupInvites', inviteId);
  batch.update(inviteRef, {
    status: 'accepted',
    acceptedBy: acceptedUserId,
    acceptedAt: serverTimestamp(),
  });

  await batch.commit();
};

// ==================== MANAGED GROUP SERVICES (나의 모임) ====================

// Helper: Firestore 문서 → ManagedGroup 변환
const parseManagedGroupDoc = (docSnap: any): ManagedGroup => {
  const data = docSnap.data();

  // 멤버 중복 제거 (userId 기준)
  const seenUserIds = new Set<string>();
  const uniqueMembers = (data.members || [])
    .map((m: any) => ({
      userId: m.userId,
      role: m.role,
      ...(m.title ? { title: m.title } : {}),
      joinedAt: m.joinedAt?.toDate?.() || new Date(),
    }))
    .filter((m: any) => {
      if (seenUserIds.has(m.userId)) return false;
      seenUserIds.add(m.userId);
      return true;
    });

  // memberUserIds도 중복 제거
  const uniqueMemberUserIds = [...new Set((data.memberUserIds || []) as string[])];

  return {
    id: docSnap.id,
    name: data.name,
    description: data.description,
    color: data.color,
    icon: data.icon,
    ownerId: data.ownerId,
    members: uniqueMembers,
    memberUserIds: uniqueMemberUserIds,
    settings: data.settings || { autoConnect: true, allowMemberInvite: false },
    createdAt: data.createdAt?.toDate?.() || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || new Date(),
  };
};

// 나의 모임 생성
export const createManagedGroup = async (
  ownerId: string,
  data: { name: string; description?: string; color: string; icon: string; settings?: Partial<ManagedGroupSettings> }
): Promise<ManagedGroup> => {
  const groupRef = doc(collection(db, 'managedGroups'));

  const now = new Date();
  const group: ManagedGroup = {
    id: groupRef.id,
    name: data.name,
    description: data.description || '',
    color: data.color,
    icon: data.icon,
    ownerId,
    members: [{ userId: ownerId, role: 'president', joinedAt: now }],
    memberUserIds: [ownerId],
    settings: {
      autoConnect: true,
      allowMemberInvite: false,
      ...data.settings,
    },
    createdAt: now,
    updatedAt: now,
  };

  // Firestore는 undefined 값을 허용하지 않으므로 제거
  const firestoreData: Record<string, any> = {
    id: group.id,
    name: group.name,
    color: group.color,
    icon: group.icon,
    ownerId: group.ownerId,
    memberUserIds: group.memberUserIds,
    settings: group.settings,
    members: group.members.map(m => ({
      userId: m.userId,
      role: m.role,
      joinedAt: Timestamp.fromDate(m.joinedAt),
    })),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (group.description) {
    firestoreData.description = group.description;
  }

  await setDoc(groupRef, firestoreData);

  return group;
};

// 나의 모임 단건 조회
export const getManagedGroup = async (groupId: string): Promise<ManagedGroup | null> => {
  const groupRef = doc(db, 'managedGroups', groupId);
  const groupSnap = await getDoc(groupRef);
  if (!groupSnap.exists()) return null;
  return parseManagedGroupDoc(groupSnap);
};

// 사용자가 속한 모든 나의 모임 조회
export const getUserManagedGroups = async (userId: string): Promise<ManagedGroup[]> => {
  const groupsRef = collection(db, 'managedGroups');

  // ownerId 또는 memberUserIds에 포함된 그룹 조회
  const ownerQuery = query(groupsRef, where('ownerId', '==', userId));
  const memberQuery = query(groupsRef, where('memberUserIds', 'array-contains', userId));

  const [ownerSnap, memberSnap] = await Promise.all([
    getDocs(ownerQuery),
    getDocs(memberQuery),
  ]);

  const groupMap = new Map<string, ManagedGroup>();
  ownerSnap.docs.forEach(d => groupMap.set(d.id, parseManagedGroupDoc(d)));
  memberSnap.docs.forEach(d => {
    if (!groupMap.has(d.id)) groupMap.set(d.id, parseManagedGroupDoc(d));
  });

  return Array.from(groupMap.values()).sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  );
};

// 나의 모임 정보 수정
export const updateManagedGroup = async (
  groupId: string,
  updates: Partial<Pick<ManagedGroup, 'name' | 'description' | 'color' | 'icon' | 'settings'>>
): Promise<void> => {
  const groupRef = doc(db, 'managedGroups', groupId);
  const cleanedUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  );
  await updateDoc(groupRef, {
    ...cleanedUpdates,
    updatedAt: serverTimestamp(),
  });
};

// 나의 모임 삭제
export const deleteManagedGroup = async (groupId: string): Promise<void> => {
  // 관련 초대 링크도 삭제
  const invitesRef = collection(db, 'managedGroupInvites');
  const inviteQuery = query(invitesRef, where('groupId', '==', groupId));
  const inviteSnap = await getDocs(inviteQuery);

  const batch = writeBatch(db);
  inviteSnap.docs.forEach(d => batch.delete(d.ref));
  batch.delete(doc(db, 'managedGroups', groupId));
  await batch.commit();
};

// 나의 모임에 멤버 추가 + 자동 연결
export const addMemberToManagedGroup = async (
  groupId: string,
  userId: string,
  role: ManagedGroupRole = 'member'
): Promise<void> => {
  const group = await getManagedGroup(groupId);
  if (!group) throw new Error('그룹을 찾을 수 없습니다');

  if (group.members.some(m => m.userId === userId)) {
    throw new Error('이미 그룹 멤버입니다');
  }

  const batch = writeBatch(db);
  const groupRef = doc(db, 'managedGroups', groupId);

  const newMember = {
    userId,
    role,
    joinedAt: Timestamp.fromDate(new Date()),
  };

  const updatedMembers = [
    ...group.members.map(m => ({ ...m, joinedAt: Timestamp.fromDate(m.joinedAt) })),
    newMember,
  ];
  // memberUserIds 중복 방지
  const updatedMemberUserIds = group.memberUserIds.includes(userId)
    ? group.memberUserIds
    : [...group.memberUserIds, userId];

  batch.update(groupRef, {
    members: updatedMembers,
    memberUserIds: updatedMemberUserIds,
    updatedAt: serverTimestamp(),
  });

  // autoConnect 설정 시 기존 멤버 전원과 자동 연결
  if (group.settings.autoConnect) {
    for (const existingMember of group.members) {
      if (existingMember.userId !== userId) {
        const connRef = doc(collection(db, 'connections'));
        batch.set(connRef, {
          id: connRef.id,
          fromUserId: userId,
          toUserId: existingMember.userId,
          status: 'accepted',
          method: 'managed_group',
          createdAt: serverTimestamp(),
          acceptedAt: serverTimestamp(),
        });
      }
    }
  }

  await batch.commit();
};

// 나의 모임에서 멤버 제거
export const removeMemberFromManagedGroup = async (
  groupId: string,
  userId: string
): Promise<void> => {
  const group = await getManagedGroup(groupId);
  if (!group) throw new Error('그룹을 찾을 수 없습니다');
  if (group.ownerId === userId) throw new Error('그룹장은 제거할 수 없습니다');

  const updatedMembers = group.members
    .filter(m => m.userId !== userId)
    .map(m => ({ ...m, joinedAt: Timestamp.fromDate(m.joinedAt) }));
  const updatedMemberUserIds = updatedMembers.map(m => m.userId);

  const groupRef = doc(db, 'managedGroups', groupId);
  await updateDoc(groupRef, {
    members: updatedMembers,
    memberUserIds: updatedMemberUserIds,
    updatedAt: serverTimestamp(),
  });
};

// 멤버 자발적 탈퇴
export const leaveManagedGroup = async (
  groupId: string,
  userId: string
): Promise<void> => {
  const group = await getManagedGroup(groupId);
  if (!group) throw new Error('그룹을 찾을 수 없습니다');
  if (group.ownerId === userId) throw new Error('그룹장은 그룹을 나갈 수 없습니다. 그룹을 삭제해주세요.');
  await removeMemberFromManagedGroup(groupId, userId);
};

// 나의 모임 멤버 역할 변경
export const updateMemberRole = async (
  groupId: string,
  targetUserId: string,
  newRole: ManagedGroupRole,
  title?: string
): Promise<void> => {
  const group = await getManagedGroup(groupId);
  if (!group) throw new Error('그룹을 찾을 수 없습니다');

  if (!group.members.some(m => m.userId === targetUserId)) {
    throw new Error('해당 멤버를 찾을 수 없습니다');
  }

  const updatedMembers = group.members.map(m => {
    const base: Record<string, unknown> = {
      userId: m.userId,
      role: m.role,
      joinedAt: Timestamp.fromDate(m.joinedAt),
    };
    if (m.title) base.title = m.title;

    if (m.userId === targetUserId) {
      base.role = newRole;
      if (title) {
        base.title = title;
      } else if (newRole === 'member') {
        delete base.title;
      }
    } else if (newRole === 'president' && m.role === 'president') {
      // 기존 회장은 회장단으로 변경 (회장은 1명만 가능)
      base.role = 'executive';
    }

    return base;
  });

  const groupRef = doc(db, 'managedGroups', groupId);
  await updateDoc(groupRef, {
    members: updatedMembers,
    updatedAt: serverTimestamp(),
  });
};

// 나의 모임 초대 링크 생성
export const createManagedGroupInviteLink = async (
  groupId: string,
  inviterId: string,
  options?: { maxUses?: number; expiresInHours?: number }
): Promise<ManagedGroupInvite> => {
  const group = await getManagedGroup(groupId);
  if (!group) throw new Error('그룹을 찾을 수 없습니다');

  const inviteRef = doc(collection(db, 'managedGroupInvites'));
  const now = new Date();

  const invite: ManagedGroupInvite = {
    id: inviteRef.id,
    groupId,
    groupName: group.name,
    inviterId,
    status: 'active',
    maxUses: options?.maxUses,
    useCount: 0,
    createdAt: now,
    expiresAt: options?.expiresInHours
      ? new Date(Date.now() + options.expiresInHours * 60 * 60 * 1000)
      : undefined,
  };

  const firestoreData: Record<string, unknown> = {
    ...invite,
    createdAt: serverTimestamp(),
  };
  if (invite.expiresAt) {
    firestoreData.expiresAt = Timestamp.fromDate(invite.expiresAt);
  }
  Object.keys(firestoreData).forEach(k => {
    if (firestoreData[k] === undefined) delete firestoreData[k];
  });

  await setDoc(inviteRef, firestoreData);
  return invite;
};

// 초대 조회 + 유효성 검증
export const getManagedGroupInvite = async (inviteId: string): Promise<ManagedGroupInvite | null> => {
  const inviteRef = doc(db, 'managedGroupInvites', inviteId);
  const inviteSnap = await getDoc(inviteRef);
  if (!inviteSnap.exists()) return null;

  const data = inviteSnap.data();
  const invite: ManagedGroupInvite = {
    id: inviteSnap.id,
    groupId: data.groupId,
    groupName: data.groupName,
    inviterId: data.inviterId,
    status: data.status,
    maxUses: data.maxUses,
    useCount: data.useCount || 0,
    createdAt: data.createdAt?.toDate?.() || new Date(),
    expiresAt: data.expiresAt?.toDate?.(),
  };

  if (invite.expiresAt && invite.expiresAt < new Date()) return null;
  if (invite.maxUses && invite.useCount >= invite.maxUses) return null;
  if (invite.status !== 'active') return null;

  return invite;
};

// 나의 모임 초대 수락
export const acceptManagedGroupInvite = async (
  inviteId: string,
  userId: string
): Promise<ManagedGroup> => {
  const invite = await getManagedGroupInvite(inviteId);
  if (!invite) throw new Error('유효하지 않은 초대입니다');

  await addMemberToManagedGroup(invite.groupId, userId);

  // 사용 횟수 증가
  const inviteRef = doc(db, 'managedGroupInvites', inviteId);
  await updateDoc(inviteRef, { useCount: increment(1) });

  const group = await getManagedGroup(invite.groupId);
  if (!group) throw new Error('그룹을 찾을 수 없습니다');
  return group;
};

// 초대 URL 생성
export const generateManagedGroupInviteUrl = (inviteId: string): string => {
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || '';
  return `${baseUrl}/invite/managed-group/${inviteId}`;
};

// ==================== GROUP MEMBER CONNECTIONS ====================

// 그룹 멤버들 간의 인맥 연결 관계를 가져오는 함수
export interface MemberConnection {
  fromUserId: string;
  toUserId: string;
}

export const getGroupMemberConnections = async (memberUserIds: string[]): Promise<MemberConnection[]> => {
  if (memberUserIds.length < 2) return [];

  const connections: MemberConnection[] = [];
  const memberSet = new Set(memberUserIds);

  // 각 멤버의 연결 확인 (Firebase 쿼리 최적화를 위해 배치로 처리)
  for (const userId of memberUserIds) {
    const userConnections = await getDirectConnections(userId);

    for (const conn of userConnections) {
      const otherUserId = conn.fromUserId === userId ? conn.toUserId : conn.fromUserId;

      // 상대방이 같은 그룹 멤버인 경우에만 추가
      if (memberSet.has(otherUserId)) {
        // 중복 방지 (A-B와 B-A 중 하나만)
        const existsReverse = connections.some(
          c => c.fromUserId === otherUserId && c.toUserId === userId
        );
        if (!existsReverse) {
          connections.push({ fromUserId: userId, toUserId: otherUserId });
        }
      }
    }
  }

  return connections;
};
