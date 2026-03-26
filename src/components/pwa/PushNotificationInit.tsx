'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';

export default function PushNotificationInit() {
  const { user, isAuthenticated } = useAuthStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.id || initialized.current) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (!('serviceWorker' in navigator)) return;

    // 데모 모드에서는 푸시 알림 설정하지 않음
    const isDemoMode = localStorage.getItem('nodded_demo_mode') === 'true';
    if (isDemoMode) return;

    initialized.current = true;

    // 이미 권한이 허용된 경우 자동으로 토큰 등록
    if (Notification.permission === 'granted') {
      import('@/lib/fcm').then(({ requestNotificationPermission }) => {
        requestNotificationPermission(user.id);
      });
    }
  }, [isAuthenticated, user?.id]);

  return null;
}
