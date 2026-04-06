import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import app from './firebase';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { db } from './firebase';

let messaging: Messaging | null = null;

function getMessagingInstance(): Messaging | null {
  if (typeof window === 'undefined') return null;
  if (!('Notification' in window)) return null;
  if (!app) return null;

  if (!messaging) {
    try {
      messaging = getMessaging(app);
    } catch (e) {
      console.error('FCM 초기화 실패:', e);
      return null;
    }
  }
  return messaging;
}

/**
 * FCM 푸시 알림 권한 요청 및 토큰 발급.
 * 발급된 토큰은 Firestore의 fcmTokens/{userId} 에 저장.
 */
export async function requestNotificationPermission(userId: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error(
      permission === 'denied'
        ? '알림 권한이 차단되어 있습니다. 브라우저 설정에서 알림을 허용해주세요.'
        : '알림 권한이 거부되었습니다.'
    );
  }

  const msg = getMessagingInstance();
  if (!msg) {
    throw new Error('이 브라우저에서는 푸시 알림이 지원되지 않습니다.');
  }

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    throw new Error('푸시 알림 설정(VAPID Key)이 누락되었습니다. 관리자에게 문의하세요.');
  }

  // 서비스 워커 등록 후 활성화 대기
  const sw = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

  if (!sw.active) {
    await new Promise<void>((resolve, reject) => {
      const worker = sw.installing || sw.waiting;
      if (!worker) { resolve(); return; }
      const timeout = setTimeout(() => reject(new Error('서비스 워커 활성화 시간 초과')), 10000);
      worker.addEventListener('statechange', () => {
        if (worker.state === 'activated') {
          clearTimeout(timeout);
          resolve();
        }
      });
    });
  }

  let token: string;
  try {
    token = await getToken(msg, {
      vapidKey,
      serviceWorkerRegistration: sw,
    });
  } catch (e: any) {
    // 기존 서비스 워커 캐시가 남아있을 수 있으므로 갱신 후 재시도
    if (e?.message?.includes('installations') || e?.code === 'messaging/token-subscribe-failed') {
      await sw.update();
      token = await getToken(msg, {
        vapidKey,
        serviceWorkerRegistration: sw,
      });
    } else {
      throw e;
    }
  }

  if (!token) {
    throw new Error('FCM 토큰 발급에 실패했습니다. 잠시 후 다시 시도해주세요.');
  }

  if (db) {
    await setDoc(doc(db, 'fcmTokens', userId), {
      token,
      updatedAt: new Date().toISOString(),
      platform: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    }, { merge: true });
  }

  localStorage.setItem('nodded_fcm_user_id', userId);
  return token;
}

/**
 * 포그라운드 메시지 수신 리스너 등록.
 * 앱이 열려있을 때 도착하는 푸시를 처리.
 */
export function onForegroundMessage(callback: (payload: any) => void): (() => void) | null {
  const msg = getMessagingInstance();
  if (!msg) return null;

  return onMessage(msg, callback);
}
