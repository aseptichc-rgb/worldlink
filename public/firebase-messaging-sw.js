// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/12.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.10.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDSf4eUaIyE0tXOuZBHTmCKhpikfLbTZOc',
  authDomain: 'worldlink-bcd6f.firebaseapp.com',
  projectId: 'worldlink-bcd6f',
  storageBucket: 'worldlink-bcd6f.firebasestorage.app',
  messagingSenderId: '935111705464',
  appId: '1:935111705464:web:f802922920d7e530cdbe8d',
});

const messaging = firebase.messaging();

// 백그라운드 메시지 수신 처리
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon, url } = payload.data || {};

  const notificationTitle = title || payload.notification?.title || '새로운 뉴스';
  const notificationOptions = {
    body: body || payload.notification?.body || '나의 모임에서 새로운 뉴스가 발견되었습니다.',
    icon: icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'news-alert',
    renotify: true,
    data: { url: url || '/managed-groups' },
    actions: [
      { action: 'open', title: '뉴스 보기' },
    ],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 클릭 시 앱 열기
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/managed-groups';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 이미 열린 탭이 있으면 포커스
      for (const client of clientList) {
        if (client.url.includes('/managed-groups') && 'focus' in client) {
          return client.focus();
        }
      }
      // 없으면 새 탭 열기
      return clients.openWindow(url);
    })
  );
});
