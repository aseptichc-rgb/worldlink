import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];

  // Admin SDK 전용 env가 있으면 사용, 없으면 클라이언트 env로 fallback
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (clientEmail && privateKey) {
    return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }

  // service account 없이 projectId만으로 초기화 (로컬 개발용)
  return initializeApp({ projectId });
}

export async function POST(request: NextRequest) {
  try {
    const { email, secret } = await request.json();

    if (secret !== 'temp-delete-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const app = getAdminApp();
    const adminAuth = getAuth(app);
    const adminDb = getFirestore(app);

    // 1. Firebase Auth에서 유저 찾기
    let uid: string;
    try {
      const userRecord = await adminAuth.getUserByEmail(email);
      uid = userRecord.uid;
    } catch (e: any) {
      return NextResponse.json({ error: `Auth user not found: ${e.message}` }, { status: 404 });
    }

    // 2. Firestore users 컬렉션에서 삭제
    const usersSnap = await adminDb.collection('users').where('email', '==', email).get();
    const firestoreUid = usersSnap.empty ? null : usersSnap.docs[0].id;
    const deleteId = firestoreUid || uid;

    let deletedUsers = 0;
    for (const d of usersSnap.docs) {
      await d.ref.delete();
      deletedUsers++;
    }

    // uid 기반 doc도 삭제
    const uidDoc = adminDb.collection('users').doc(uid);
    const uidSnap = await uidDoc.get();
    if (uidSnap.exists) {
      await uidDoc.delete();
      deletedUsers++;
    }

    // 3. connections 삭제
    const deletedIds = new Set<string>();
    let deletedConns = 0;
    for (const id of new Set([deleteId, uid])) {
      for (const field of ['userId', 'connectedUserId']) {
        const snap = await adminDb.collection('connections').where(field, '==', id).get();
        for (const d of snap.docs) {
          if (!deletedIds.has(d.id)) {
            await d.ref.delete();
            deletedIds.add(d.id);
            deletedConns++;
          }
        }
      }
    }

    // 4. managed groups에서 멤버 제거
    let updatedGroups = 0;
    for (const id of new Set([deleteId, uid])) {
      const snap = await adminDb.collection('managedGroups').where('memberUserIds', 'array-contains', id).get();
      for (const d of snap.docs) {
        const data = d.data();
        const members = (data.members || []).filter((m: any) => m.userId !== id);
        const memberUserIds = (data.memberUserIds || []).filter((mid: string) => mid !== id);
        await d.ref.update({ members, memberUserIds });
        updatedGroups++;
      }
    }

    // 5. Firebase Auth에서 삭제
    await adminAuth.deleteUser(uid);

    return NextResponse.json({
      success: true,
      deleted: { email, authUid: uid, firestoreDoc: firestoreUid, usersDeleted: deletedUsers, connections: deletedConns, groupsUpdated: updatedGroups },
    });
  } catch (err: any) {
    console.error('Delete account error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
