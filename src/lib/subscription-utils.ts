// 구독 관련 유틸리티
import { User, Subscription, SubscriptionPlan } from '@/types';

// 프리미엄 가격 정보
export const PREMIUM_PRICE = {
  monthly: 4900,
  yearly: 39000, // 연간 구독 시 약 33% 할인
};

// 프리미엄 기능 목록
export const PREMIUM_FEATURES = [
  {
    title: 'QR 명함 생성 및 공유',
    description: '나만의 QR 명함을 생성하고 공유하세요',
    icon: 'qr-code',
  },
  {
    title: '명함 링크 공유',
    description: 'URL 링크로 명함을 쉽게 공유하세요',
    icon: 'link',
  },
  {
    title: 'QR 이미지 다운로드',
    description: 'QR 코드를 이미지로 저장하세요',
    icon: 'download',
  },
  {
    title: '무제한 명함 저장',
    description: '받은 명함을 무제한으로 저장하세요',
    icon: 'folder',
  },
];

// 무료 기능 목록
export const FREE_FEATURES = [
  {
    title: 'QR 스캔으로 명함 받기',
    description: '다른 사람의 QR 명함을 스캔하여 저장',
    icon: 'scan',
  },
  {
    title: '명함 저장 및 관리',
    description: '받은 명함을 저장하고 메모 추가',
    icon: 'bookmark',
  },
  {
    title: '네트워크 탐색',
    description: '인맥 네트워크 그래프 확인',
    icon: 'network',
  },
  {
    title: '메시지 및 커피챗',
    description: '인맥과 메시지 및 미팅 요청',
    icon: 'message',
  },
];

/**
 * 사용자의 구독 플랜 확인
 */
export function getSubscriptionPlan(user: User | null): SubscriptionPlan {
  if (!user?.subscription) return 'free';

  // 만료 확인
  if (user.subscription.expiresAt) {
    const now = new Date();
    const expiresAt = new Date(user.subscription.expiresAt);
    if (now > expiresAt) {
      return 'free';
    }
  }

  return user.subscription.plan;
}

/**
 * 프리미엄 사용자인지 확인
 */
export function isPremiumUser(user: User | null): boolean {
  // 현재 모든 기능 무료 개방 (추후 프리미엄 범위 재설정 예정)
  return true;
}

/**
 * QR 명함 기능 사용 가능 여부
 */
export function canUseQRCard(user: User | null): boolean {
  return isPremiumUser(user);
}

/**
 * 명함 공유 기능 사용 가능 여부
 */
export function canShareCard(user: User | null): boolean {
  return isPremiumUser(user);
}

/**
 * 구독 만료까지 남은 일수
 */
export function getDaysUntilExpiry(user: User | null): number | null {
  if (!user?.subscription?.expiresAt) return null;

  const now = new Date();
  const expiresAt = new Date(user.subscription.expiresAt);
  const diffTime = expiresAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
}

/**
 * 구독 상태 텍스트
 */
export function getSubscriptionStatusText(user: User | null): string {
  const plan = getSubscriptionPlan(user);

  if (plan === 'free') {
    return '무료 플랜';
  }

  const daysLeft = getDaysUntilExpiry(user);
  if (daysLeft !== null && daysLeft <= 7) {
    return `프리미엄 (${daysLeft}일 남음)`;
  }

  return '프리미엄';
}

/**
 * 기본 구독 정보 반환 (새 사용자용)
 */
export function getDefaultSubscription(): Subscription {
  return {
    plan: 'free',
  };
}
