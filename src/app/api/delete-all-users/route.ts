import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (clientEmail && privateKey) {
    return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }

  return initializeApp({ projectId });
}

export async function POST(request: NextRequest) {
  try {
    const { secret } = await request.json();

    if (secret !== 'temp-delete-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const app = getAdminApp();
    const adminAuth = getAuth(app);
    const adminDb = getFirestore(app);

    // 전체 users 컬렉션 조회
    const allUsersSnap = await adminDb.collection('users').get();

    const keepNames = ['김재영'];
    const deletedUsers: string[] = [];
    const skippedUsers: string[] = [];

    for (const doc of allUsersSnap.docs) {
      const data = doc.data();
      const userId = doc.id;
      const userName = data.name || '';

      // 데모 계정 건너뛰기
      if (userId.startsWith('demo_')) {
        skippedUsers.push(`${userName} (demo)`);
        continue;
      }

      // 보존할 사용자 건너뛰기
      if (keepNames.includes(userName)) {
        skippedUsers.push(`${userName} (kept)`);
        continue;
      }

      // 1. connections 삭제
      for (const field of ['userId', 'connectedUserId', 'fromUserId', 'toUserId']) {
        const connSnap = await adminDb.collection('connections').where(field, '==', userId).get();
        for (const d of connSnap.docs) {
          await d.ref.delete();
        }
      }

      // 2. managedGroups에서 멤버 제거
      const groupSnap = await adminDb.collection('managedGroups').where('memberUserIds', 'array-contains', userId).get();
      for (const d of groupSnap.docs) {
        const gData = d.data();
        const members = (gData.members || []).filter((m: any) => m.userId !== userId);
        const memberUserIds = (gData.memberUserIds || []).filter((mid: string) => mid !== userId);
        await d.ref.update({ members, memberUserIds });
      }

      // 3. Firestore users 문서 삭제
      await doc.ref.delete();

      // 4. Firebase Auth 삭제
      try {
        if (data.email) {
          const userRecord = await adminAuth.getUserByEmail(data.email);
          await adminAuth.deleteUser(userRecord.uid);
        } else {
          // email 없으면 uid로 시도
          await adminAuth.deleteUser(userId);
        }
      } catch {
        // Auth에 없는 경우 무시
      }

      deletedUsers.push(`${userName} (${userId})`);
    }

    return NextResponse.json({
      success: true,
      deleted: deletedUsers,
      skipped: skippedUsers,
      deletedCount: deletedUsers.length,
      skippedCount: skippedUsers.length,
    });
  } catch (err: any) {
    console.error('Delete all users error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
