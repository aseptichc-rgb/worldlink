let initialized = false;

export function loadKakaoSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Cannot load Kakao SDK on server'));
      return;
    }

    if (initialized && window.Kakao?.isInitialized()) {
      resolve();
      return;
    }

    const existing = document.getElementById('kakao-sdk');
    if (existing) {
      if (window.Kakao?.isInitialized()) {
        initialized = true;
        resolve();
        return;
      }
      existing.addEventListener('load', () => {
        initKakao();
        resolve();
      });
      return;
    }

    const script = document.createElement('script');
    script.id = 'kakao-sdk';
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js';
    script.integrity = '';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      initKakao();
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Kakao SDK'));
    document.head.appendChild(script);
  });
}

function initKakao() {
  const appKey = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
  if (appKey && window.Kakao && !window.Kakao.isInitialized()) {
    window.Kakao.init(appKey);
    initialized = true;
  }
}

export function sendKakaoInvite(params: {
  senderName: string;
  recipientName?: string;
  inviteLink: string;
}) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  window.Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: `${params.senderName}님이 NODDED 일촌을 신청했습니다`,
      description: params.recipientName
        ? `${params.recipientName}님, 비즈니스 네트워킹의 새로운 방법을 경험해보세요.`
        : '비즈니스 네트워킹의 새로운 방법을 경험해보세요.',
      imageUrl: `${origin}/og-image.png`,
      link: {
        mobileWebUrl: params.inviteLink,
        webUrl: params.inviteLink,
      },
    },
    buttons: [
      {
        title: '초대 수락하기',
        link: {
          mobileWebUrl: params.inviteLink,
          webUrl: params.inviteLink,
        },
      },
    ],
  });
}
