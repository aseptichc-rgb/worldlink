# NEXUS - 신뢰 기반 비즈니스 네트워크

단순한 주소록을 넘어, 비즈니스 기회의 지도를 그리다.

## 핵심 기능

### 1. 초대 기반 폐쇄형 온보딩
- 기존 가입자의 초대 코드가 있어야만 가입 가능
- 상호 수락 기반 연결 시스템
- 신뢰할 수 있는 네트워크 구축

### 2. 키워드 중심 스마트 프로필
- 해시태그 기반 전문 분야 설정
- 키워드 기반 인맥 탐색
- 관심사 매칭 시스템

### 3. 인맥 시각화 - 네트워크 그래프
- 1촌, 2촌 인맥을 동적 그래프로 시각화
- 연결 경로 확인
- 키워드 필터링

### 4. AI 기반 기회 매칭
- 매일 3명의 추천 인맥
- 키워드 일치도 + 인맥 근접도 기반 알고리즘

### 5. 커피챗 시스템
- 대화 가능 시간 슬롯 설정
- 목적별 미팅 신청
- 실시간 알림

## 기술 스택

- **Frontend:** Next.js 16, TypeScript, Tailwind CSS
- **Backend:** Firebase (Auth, Firestore, Storage)
- **Animation:** Framer Motion
- **State Management:** Zustand
- **Deployment:** Vercel

## 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.local.example`을 `.env.local`로 복사하고 Firebase 설정을 입력하세요:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. 개발 서버 실행
```bash
npm run dev
```

### 4. 빌드
```bash
npm run build
```

## Firebase 설정

1. [Firebase Console](https://console.firebase.google.com)에서 새 프로젝트 생성
2. Authentication > Sign-in method에서 Email/Password 활성화
3. Firestore Database 생성 (보안 규칙 설정)
4. Storage 활성화
5. 프로젝트 설정에서 웹 앱 추가 및 설정 정보 복사

### Firestore 보안 규칙 예시
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // Connections collection
    match /connections/{connectionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null &&
        (resource.data.fromUserId == request.auth.uid ||
         resource.data.toUserId == request.auth.uid);
    }

    // Invite codes
    match /inviteCodes/{code} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }

    // Time slots
    match /timeSlots/{slotId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        request.resource.data.userId == request.auth.uid;
    }

    // Coffee chat requests
    match /coffeeChatRequests/{requestId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null &&
        (resource.data.fromUserId == request.auth.uid ||
         resource.data.toUserId == request.auth.uid);
    }
  }
}
```

## Vercel 배포

1. [Vercel](https://vercel.com)에 GitHub 저장소 연결
2. 환경 변수 설정 (Firebase 설정 추가)
3. 자동 배포 완료

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── page.tsx           # 랜딩 페이지
│   ├── login/             # 로그인
│   ├── onboarding/        # 회원가입 (초대 코드)
│   ├── network/           # 메인 네트워크 그래프
│   └── profile/           # 프로필 관리
├── components/
│   ├── ui/                # 공통 UI 컴포넌트
│   ├── network/           # 네트워크 관련 컴포넌트
│   ├── onboarding/        # 온보딩 컴포넌트
│   ├── coffee-chat/       # 커피챗 컴포넌트
│   └── profile/           # 프로필 컴포넌트
├── lib/
│   ├── firebase.ts        # Firebase 설정
│   ├── firebase-services.ts # Firebase 서비스 함수
│   └── demo-data.ts       # 데모 데이터
├── store/                 # Zustand 상태 관리
├── types/                 # TypeScript 타입 정의
└── hooks/                 # 커스텀 훅
```

## 라이선스

MIT License
