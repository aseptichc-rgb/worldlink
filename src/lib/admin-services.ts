import {
  collection,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { User, Connection, Invitation } from '@/types';
import { demoUsers, demoConnections } from './demo-data';

// ==================== USER STATS ====================

export const getAllUsers = async (): Promise<User[]> => {
  // Firestore에서 실제 사용자 가져오기
  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  const firestoreUsers = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
    } as User;
  });

  // Firestore 사용자 ID와 이름 Set
  const firestoreIds = new Set(firestoreUsers.map(u => u.id));
  const firestoreNames = new Set(firestoreUsers.map(u => u.name));

  // 데모 멤버 중 Firestore에 없는 멤버만 추가 (중복 방지)
  const uniqueDemoUsers = demoUsers.filter(
    du => !firestoreIds.has(du.id) && !firestoreNames.has(du.name)
  );

  // Firestore 사용자를 앞에, 데모 멤버를 뒤에 배치
  return [...firestoreUsers, ...uniqueDemoUsers];
};

// ==================== CONNECTION STATS ====================

export const getConnectionStats = async (): Promise<{
  total: number;
  accepted: number;
  pending: number;
  rejected: number;
}> => {
  // Firestore 연결 데이터
  const connectionsRef = collection(db, 'connections');
  const snapshot = await getDocs(connectionsRef);

  let firestoreAccepted = 0, pending = 0, rejected = 0;
  snapshot.docs.forEach(doc => {
    const status = doc.data().status;
    if (status === 'accepted') firestoreAccepted++;
    else if (status === 'pending') pending++;
    else if (status === 'rejected') rejected++;
  });

  // 데모 연결 수 계산 (완전 연결 그래프: n*(n-1)/2)
  const demoMemberCount = demoUsers.length;
  const demoConnectionCount = (demoMemberCount * (demoMemberCount - 1)) / 2;

  const accepted = firestoreAccepted + demoConnectionCount;
  const total = accepted + pending + rejected;

  return { total, accepted, pending, rejected };
};

// ==================== INVITATION STATS ====================

export const getInvitationStats = async (): Promise<{
  total: number;
  byStatus: { pending: number; sent: number; accepted: number; expired: number };
  byMethod: { email: number; kakao: number; sms: number; link: number };
}> => {
  const invitationsRef = collection(db, 'invitations');
  const snapshot = await getDocs(invitationsRef);

  const byStatus = { pending: 0, sent: 0, accepted: 0, expired: 0 };
  const byMethod = { email: 0, kakao: 0, sms: 0, link: 0 };

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const status = data.status as keyof typeof byStatus;
    const method = data.method as keyof typeof byMethod;
    if (status in byStatus) byStatus[status]++;
    if (method in byMethod) byMethod[method]++;
  });

  return { total: snapshot.size, byStatus, byMethod };
};

// ==================== KEYWORD & CATEGORY ANALYTICS ====================

export const getKeywordDistribution = (users: User[]): [string, number][] => {
  const keywordMap = new Map<string, number>();
  users.forEach(user => {
    user.researchInterests?.forEach(kw => {
      keywordMap.set(kw, (keywordMap.get(kw) || 0) + 1);
    });
  });
  return [...keywordMap.entries()].sort((a, b) => b[1] - a[1]);
};

export const getCategoryDistribution = (users: User[]): [string, number][] => {
  const categoryMap = new Map<string, number>();
  users.forEach(user => {
    const cat = user.researchField || '미분류';
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
  });
  return [...categoryMap.entries()].sort((a, b) => b[1] - a[1]);
};

// ==================== GROWTH TRENDS ====================

export const getDailySignUpTrend = (
  users: User[],
  days: number = 30
): { date: string; count: number }[] => {
  const now = new Date();
  const dateMap = new Map<string, number>();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '');
    dateMap.set(key, 0);
  }

  users.forEach(user => {
    if (user.createdAt) {
      const key = new Date(user.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '');
      if (dateMap.has(key)) {
        dateMap.set(key, (dateMap.get(key) || 0) + 1);
      }
    }
  });

  return [...dateMap.entries()].map(([date, count]) => ({ date, count }));
};

export const getWeeklySignUpTrend = (
  users: User[],
  weeks: number = 12
): { week: string; count: number }[] => {
  const now = new Date();
  const results: { start: Date; key: string; count: number }[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const weekStart = new Date(d);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const key = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
    results.push({ start: weekStart, key, count: 0 });
  }

  users.forEach(user => {
    if (user.createdAt) {
      const userDate = new Date(user.createdAt);
      for (let i = results.length - 1; i >= 0; i--) {
        if (userDate >= results[i].start) {
          results[i].count++;
          break;
        }
      }
    }
  });

  return results.map(r => ({ week: r.key, count: r.count }));
};
