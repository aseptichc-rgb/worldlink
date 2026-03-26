import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function POST(request: NextRequest) {
  try {
    const { userId, title, body, newsCount, url } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId가 필요합니다' }, { status: 400 });
    }

    const app = getAdminApp();
    const firestore = getFirestore(app);
    const messaging = getMessaging(app);

    // Firestore에서 해당 유저의 FCM 토큰 조회
    const tokenDoc = await firestore.collection('fcmTokens').doc(userId).get();
    if (!tokenDoc.exists) {
      return NextResponse.json({ error: '등록된 알림 토큰이 없습니다', sent: false });
    }

    const { token } = tokenDoc.data()!;
    if (!token) {
      return NextResponse.json({ error: '유효한 토큰이 없습니다', sent: false });
    }

    const notificationTitle = title || '새로운 뉴스가 있습니다';
    const notificationBody = body || `나의 모임 멤버 관련 ${newsCount || 0}개의 새 뉴스가 발견되었습니다.`;

    const message = {
      token,
      notification: {
        title: notificationTitle,
        body: notificationBody,
      },
      data: {
        title: notificationTitle,
        body: notificationBody,
        url: url || '/managed-groups',
        newsCount: String(newsCount || 0),
      },
      webpush: {
        fcmOptions: {
          link: url || '/managed-groups',
        },
        notification: {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'news-alert',
          renotify: true,
        },
      },
    };

    const response = await messaging.send(message);

    return NextResponse.json({ success: true, messageId: response });
  } catch (error: any) {
    // 토큰이 만료/무효한 경우 정리
    if (error?.code === 'messaging/registration-token-not-registered' ||
        error?.code === 'messaging/invalid-registration-token') {
      try {
        const { userId } = await request.clone().json();
        const app = getAdminApp();
        const firestore = getFirestore(app);
        await firestore.collection('fcmTokens').doc(userId).delete();
      } catch {}
      return NextResponse.json({ error: '토큰이 만료되었습니다. 재등록이 필요합니다.', sent: false });
    }

    console.error('푸시 알림 전송 실패:', error);
    return NextResponse.json(
      { error: '푸시 알림 전송 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
