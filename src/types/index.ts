// 개인정보 공개 설정 타입
export interface PrivacySettings {
  // 등록 현황 공개 동의 (네트워크에 표시되기 위한 필수 조건)
  allowProfileDiscovery: boolean;
  // 전체 검색 허용 (다른 회원이 키워드/이름으로 검색 가능)
  allowGlobalSearch?: boolean;
  // 공개 범위 설정
  displaySettings: {
    // 이름 표시 방식: 'full' = 전체, 'partial' = 성씨만 (예: 김*님)
    nameDisplay: 'full' | 'partial';
    // 회사 표시 방식: 'full' = 회사명, 'industry' = 업종만 (예: IT/통신), 'size' = 규모만 (예: 대기업)
    companyDisplay: 'full' | 'industry' | 'size' | 'hidden';
    // 직책 표시 방식: 'full' = 전체, 'level' = 직급 수준 (예: 실무자급, 관리자급)
    positionDisplay: 'full' | 'level' | 'hidden';
    // 이메일 표시 방식: 'full' = 전체 공개, 'partial' = 부분 공개 (예: u***@example.com), 'hidden' = 비공개
    emailDisplay?: 'full' | 'partial' | 'hidden';
  };
  // 동의 일시
  consentedAt?: Date;
  // 마지막 수정 일시
  updatedAt?: Date;
}

// 구독 플랜 타입
export type SubscriptionPlan = 'free' | 'premium';

// 구독 정보 타입
export interface Subscription {
  plan: SubscriptionPlan;
  // 구독 시작일
  startedAt?: Date;
  // 구독 만료일 (premium인 경우)
  expiresAt?: Date;
  // 자동 갱신 여부
  autoRenew?: boolean;
  // 결제 방법
  paymentMethod?: 'card' | 'kakao' | 'apple' | 'google';
  // 마지막 결제일
  lastPaymentAt?: Date;
}

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  phoneHash?: string;
  profileImage?: string;
  company?: string;
  position?: string;
  // 회사 규모 (비식별화 표시용)
  companySize?: 'startup' | 'sme' | 'enterprise' | 'freelance';
  // 업종 (비식별화 표시용)
  industry?: string;
  // 직급 수준 (비식별화 표시용)
  positionLevel?: 'entry' | 'staff' | 'manager' | 'executive';
  bio?: string;
  keywords: string[];
  category?: string; // 분야/카테고리 (예: 의료기기, 솔루션, 투자 등)
  inviteCode: string;
  invitesRemaining: number;
  invitedBy?: string;
  coffeeStatus: 'available' | 'busy' | 'pending';
  // 개인정보 공개 설정
  privacySettings?: PrivacySettings;
  // 구독 정보
  subscription?: Subscription;
  createdAt: Date;
  updatedAt: Date;
}

// Connection Types
export interface Connection {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  method: 'invite' | 'contact_sync' | 'search';
  createdAt: Date;
  acceptedAt?: Date;
}

// Invite Code Types
export interface InviteCode {
  code: string;
  createdBy: string;
  usedBy?: string;
  usedAt?: Date;
  createdAt: Date;
  isValid: boolean;
}

// Invitation Types (초대 발송 기록)
export interface Invitation {
  id: string;
  senderId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  inviteCode: string;
  method: 'email' | 'kakao' | 'sms' | 'link';
  status: 'pending' | 'sent' | 'accepted' | 'expired';
  sentAt: Date;
  acceptedAt?: Date;
  acceptedBy?: string;
  connectionId?: string;
}

// Keyword Types
export interface Keyword {
  id: string;
  tag: string;
  category?: string;
  useCount: number;
}

// Coffee Chat Types
export interface TimeSlot {
  id: string;
  userId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string;
  isRecurring: boolean;
  specificDate?: Date;
  isAvailable: boolean;
}

export interface CoffeeChatRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  slotId: string;
  purpose: 'collaboration' | 'hiring' | 'insight' | 'networking';
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  scheduledDate: Date;
  createdAt: Date;
  respondedAt?: Date;
}

// Network Graph Types
export interface NetworkNode {
  id: string;
  name: string;
  profileImage?: string;
  company?: string;
  position?: string;
  keywords: string[];
  degree: number; // 1 = direct connection, 2 = friend of friend
  connectionCount: number;
  category?: string; // 분야/카테고리 (예: 의료기기, 솔루션, 투자 등)
}

export interface NetworkEdge {
  source: string;
  target: string;
  degree: number;
}

// Custom Group Types (사용자 정의 그룹)
export interface NodeGroup {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMembership {
  groupId: string;
  nodeId: string;
  addedAt: Date;
}

// 그룹 내 연결 (그룹 멤버들 간의 자동 연결)
export interface GroupConnection {
  groupId: string;
  sourceNodeId: string;
  targetNodeId: string;
  createdAt: Date;
}

export interface NetworkGraph {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

// Recommendation Types
export interface Recommendation {
  userId: string;
  user: User;
  score: number;
  keywordMatch: number;
  proximityScore: number;
  mutualConnections: number;
  connectionPath: string[];
  reason: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Search Types
export interface SearchFilters {
  keywords?: string[];
  company?: string;
  degree?: number;
  coffeeStatus?: 'available' | 'busy' | 'pending';
}

export interface SearchResult {
  users: NetworkNode[];
  total: number;
  hasMore: boolean;
}

// Business Card Types (QR 명함)
export interface BusinessCard {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  bio?: string;
  profileImage?: string;
  keywords: string[];
  // 인맥 공개 설정
  networkVisibility: 'public' | 'connections_only' | 'private';
  // QR 코드용 고유 식별자
  qrCode: string;
  createdAt: Date;
  updatedAt: Date;
}

// 저장된 명함 (내가 받은 명함)
export interface SavedCard {
  id: string;
  ownerId: string; // 명함을 저장한 사용자
  cardId: string; // 저장된 명함의 ID
  card: BusinessCard; // 명함 정보
  cardImage?: string; // 촬영한 명함 이미지 (base64 또는 URL)
  memo?: string; // 메모
  tags?: string[]; // 커스텀 태그
  savedAt: Date;
  lastViewedAt?: Date;
}

// 소개 요청
export interface IntroductionRequest {
  id: string;
  requesterId: string; // 요청자
  introducerId: string; // 소개해주는 사람 (중간 연결자)
  targetId: string; // 소개받고 싶은 사람
  message: string; // 요청 메시지
  purpose: 'business' | 'collaboration' | 'hiring' | 'networking' | 'other';
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  requesterCard?: BusinessCard;
  createdAt: Date;
  respondedAt?: Date;
  completedAt?: Date;
}

// ==================== 관리형 그룹 (Managed Group) ====================

export type ManagedGroupRole = 'admin' | 'member';

export interface ManagedGroupMember {
  userId: string;
  role: ManagedGroupRole;
  joinedAt: Date;
}

export interface ManagedGroupSettings {
  autoConnect: boolean;       // 가입 시 기존 멤버와 자동 인맥 연결
  allowMemberInvite: boolean; // 멤버도 초대 가능 여부
}

export interface ManagedGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  ownerId: string;           // 그룹장 userId
  members: ManagedGroupMember[];
  memberUserIds: string[];   // Firestore array-contains 쿼리용 비정규화 필드
  settings: ManagedGroupSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface ManagedGroupInvite {
  id: string;
  groupId: string;
  groupName: string;
  inviterId: string;
  status: 'active' | 'expired';
  maxUses?: number;
  useCount: number;
  createdAt: Date;
  expiresAt?: Date;
}
