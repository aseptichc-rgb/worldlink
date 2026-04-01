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
    console.log('알림 권한 거부됨');
    return null;
  }

  const msg = getMessagingInstance();
  if (!msg) return null;

  try {
    // 서비스 워커 등록 후 활성화 대기
    const sw = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    // 서비스 워커가 active 상태가 될 때까지 대기
    if (!sw.active) {
      await new Promise<void>((resolve) => {
        const worker = sw.installing || sw.waiting;
        if (!worker) { resolve(); return; }
        worker.addEventListener('statechange', () => {
          if (worker.state === 'activated') resolve();
        });
      });
    }

    const token = await getToken(msg, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: sw,
    });

    if (token && db) {
      // Firestore에 토큰 저장
      await setDoc(doc(db, 'fcmTokens', userId), {
        token,
        updatedAt: new Date().toISOString(),
        platform: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      }, { merge: true });

      // 푸시 알림 전송 시 유저 식별용
      localStorage.setItem('nodded_fcm_user_id', userId);
    }

    return token;
  } catch (err) {
    console.error('FCM 토큰 발급 실패:', err);
    return null;
  }
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
