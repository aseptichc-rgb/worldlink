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
  groupName?: string;
}) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const title = params.groupName
    ? `${params.senderName}님이 "${params.groupName}" 그룹에 초대했습니다`
    : `${params.senderName}님이 NODDED 일촌을 신청했습니다`;

  const description = params.groupName
    ? '그룹에 참여하고 멤버들과 비즈니스 네트워크를 만들어보세요.'
    : params.recipientName
      ? `${params.recipientName}님, 비즈니스 네트워킹의 새로운 방법을 경험해보세요.`
      : '비즈니스 네트워킹의 새로운 방법을 경험해보세요.';

  const buttonTitle = params.groupName ? '그룹 참여하기' : '초대 수락하기';

  window.Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title,
      description,
      imageUrl: `${origin}/og-image.png`,
      link: {
        mobileWebUrl: params.inviteLink,
        webUrl: params.inviteLink,
      },
    },
    buttons: [
      {
        title: buttonTitle,
        link: {
          mobileWebUrl: params.inviteLink,
          webUrl: params.inviteLink,
        },
      },
    ],
  });
}
