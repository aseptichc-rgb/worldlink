import {
  collection,
  doc,
  getDoc,
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
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from './firebase';
import { User, Connection, InviteCode, TimeSlot, CoffeeChatRequest, NetworkNode, NetworkEdge, Recommendation } from '@/types';
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
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return null;

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
  const TEST_CODES = ['TES-T00', 'NEX-TST', 'DEV-123'];
  if (TEST_CODES.includes(code.toUpperCase())) {
    return { valid: true, createdBy: 'admin' };
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
  // 테스트 코드는 Firestore에 저장하지 않음
  const TEST_CODES = ['TES-T00', 'NEX-TST', 'DEV-123'];
  if (TEST_CODES.includes(code.toUpperCase())) {
    return;
  }

  const inviteRef = doc(db, 'inviteCodes', code.toUpperCase());
  await updateDoc(inviteRef, {
    usedBy: userId,
    usedAt: serverTimestamp(),
    isValid: false,
  });
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

  sentSnap.docs.forEach(doc => {
    const data = doc.data();
    connections.push({
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      acceptedAt: data.acceptedAt?.toDate(),
    } as Connection);
  });

  receivedSnap.docs.forEach(doc => {
    const data = doc.data();
    connections.push({
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      acceptedAt: data.acceptedAt?.toDate(),
    } as Connection);
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

// ==================== NETWORK GRAPH SERVICES ====================

import { getDemoNetworkGraph, getDemoRecommendations as getDemoRecs } from './demo-data';

export const getNetworkGraph = async (userId: string): Promise<{ nodes: NetworkNode[]; edges: NetworkEdge[] }> => {
  // 먼저 Firebase에서 실제 연결 데이터 확인
  const directConnections = await getDirectConnections(userId);

  // 실제 연결이 없으면 데모 데이터 사용
  if (directConnections.length === 0) {
    return getDemoNetworkGraph(userId);
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
  });
  userMap.set(currentUser.id, currentUser);

  // Get 1st degree connections
  const firstDegreeIds = new Set<string>();

  for (const conn of directConnections) {
    const connectedUserId = conn.fromUserId === userId ? conn.toUserId : conn.fromUserId;
    firstDegreeIds.add(connectedUserId);

    const connectedUser = await getUser(connectedUserId);
    if (connectedUser) {
      userMap.set(connectedUserId, connectedUser);
      nodes.push({
        id: connectedUser.id,
        name: connectedUser.name,
        profileImage: connectedUser.profileImage,
        company: connectedUser.company,
        position: connectedUser.position,
        keywords: connectedUser.keywords,
        degree: 1,
        connectionCount: 0,
      });

      edges.push({
        source: userId,
        target: connectedUserId,
        degree: 1,
      });
    }
  }

  // Get 2nd degree connections
  for (const firstDegreeId of firstDegreeIds) {
    const secondDegreeConnections = await getDirectConnections(firstDegreeId);

    for (const conn of secondDegreeConnections) {
      const secondDegreeUserId = conn.fromUserId === firstDegreeId ? conn.toUserId : conn.fromUserId;

      // Skip if it's the current user or already a 1st degree connection
      if (secondDegreeUserId === userId || firstDegreeIds.has(secondDegreeUserId)) continue;

      // Skip if already added as 2nd degree
      if (userMap.has(secondDegreeUserId)) {
        // Just add the edge
        edges.push({
          source: firstDegreeId,
          target: secondDegreeUserId,
          degree: 2,
        });
        continue;
      }

      const secondDegreeUser = await getUser(secondDegreeUserId);
      if (secondDegreeUser) {
        userMap.set(secondDegreeUserId, secondDegreeUser);
        nodes.push({
          id: secondDegreeUser.id,
          name: secondDegreeUser.name,
          profileImage: secondDegreeUser.profileImage,
          company: secondDegreeUser.company,
          position: secondDegreeUser.position,
          keywords: secondDegreeUser.keywords,
          degree: 2,
          connectionCount: 0,
        });

        edges.push({
          source: firstDegreeId,
          target: secondDegreeUserId,
          degree: 2,
        });
      }
    }
  }

  // Update connection counts
  nodes.forEach(node => {
    node.connectionCount = edges.filter(
      edge => edge.source === node.id || edge.target === node.id
    ).length;
  });

  return { nodes, edges };
};

export const findConnectionPath = async (fromUserId: string, toUserId: string): Promise<string[]> => {
  // BFS to find shortest path
  const visited = new Set<string>();
  const queue: { userId: string; path: string[] }[] = [{ userId: fromUserId, path: [fromUserId] }];

  while (queue.length > 0) {
    const { userId, path } = queue.shift()!;

    if (userId === toUserId) {
      return path;
    }

    if (visited.has(userId)) continue;
    visited.add(userId);

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

// ==================== STORAGE SERVICES ====================

export const uploadProfileImage = async (userId: string, file: File): Promise<string> => {
  const storageRef = ref(storage, `profiles/${userId}/${file.name}`);
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
  const keywordSnap = await getDoc(keywordRef);

  if (keywordSnap.exists()) {
    await updateDoc(keywordRef, {
      useCount: (keywordSnap.data().useCount || 0) + 1,
    });
  } else {
    await setDoc(keywordRef, {
      tag,
      useCount: 1,
      createdAt: serverTimestamp(),
    });
  }
};
