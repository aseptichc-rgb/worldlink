// =============================================================================
// ResearchNexus - 연구자 인맥 소개 플랫폼 타입 정의
// =============================================================================

// ==================== 연구 분야 ====================

export type ResearchField =
  | 'computer-science'
  | 'artificial-intelligence'
  | 'biology'
  | 'medicine'
  | 'physics'
  | 'chemistry'
  | 'mathematics'
  | 'engineering'
  | 'social-sciences'
  | 'economics'
  | 'humanities'
  | 'environmental-science'
  | 'materials-science'
  | 'neuroscience'
  | 'interdisciplinary'
  | 'other';

// ==================== 개인정보 공개 설정 ====================

export interface PrivacySettings {
  allowProfileDiscovery: boolean;
  allowGlobalSearch?: boolean;
  displaySettings: {
    nameDisplay: 'full' | 'partial';
    // 기관 표시: 'full' = 기관명, 'department' = 학과만, 'hidden' = 비공개
    institutionDisplay: 'full' | 'department' | 'hidden';
    positionDisplay: 'full' | 'level' | 'hidden';
    emailDisplay?: 'full' | 'partial' | 'hidden';
  };
  consentedAt?: Date;
  updatedAt?: Date;
}

// ==================== 구독 ====================

export type SubscriptionPlan = 'free' | 'premium';

export interface Subscription {
  plan: SubscriptionPlan;
  startedAt?: Date;
  expiresAt?: Date;
  autoRenew?: boolean;
  paymentMethod?: 'card' | 'kakao' | 'apple' | 'google';
  lastPaymentAt?: Date;
}

// ==================== 연구자 (User 대체) ====================

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;

  // 학술 신원
  institution?: string;          // 소속 기관 (대학, 연구소)
  department?: string;           // 학과/부서
  position?: string;             // 직위 (조교수, 박사과정 등)
  degree?: 'bachelor' | 'master' | 'phd' | 'postdoc' | 'professor';

  // 외부 프로필 링크
  orcid?: string;
  googleScholarId?: string;
  researchGateUrl?: string;
  personalWebsite?: string;

  // 연구 정보
  researchInterests: string[];   // 연구 관심사 (예: 강화학습, 단백질 구조)
  researchKeywords: string[];    // 세부 키워드 태그
  researchField?: ResearchField; // 주요 연구 분야
  bio?: string;

  // 연구 지표
  hIndex?: number;
  totalCitations?: number;
  totalPublications?: number;

  // 플랫폼 메커니즘
  inviteCode: string;
  invitesRemaining: number;
  invitedBy?: string;
  meetingStatus: 'available' | 'busy' | 'pending';

  privacySettings?: PrivacySettings;
  subscription?: Subscription;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== 논문 (Paper) ====================

export interface PaperAuthor {
  name: string;
  researcherId?: string;       // 플랫폼 내 사용자 ID (없으면 null)
  isCorresponding?: boolean;
  affiliation?: string;
}

export interface Paper {
  id: string;
  researcherId: string;        // 등록한 연구자 ID

  // 서지 정보
  title: string;
  authors: PaperAuthor[];
  abstract?: string;
  journal?: string;            // 학술지명
  venue?: string;              // 학회/워크숍명
  year: number;
  month?: number;
  volume?: string;
  issue?: string;
  pages?: string;

  // 식별자
  doi?: string;
  arxivId?: string;
  pmid?: string;               // PubMed ID

  // 콘텐츠
  pdfUrl?: string;
  thumbnailUrl?: string;
  tags: string[];
  researchField: ResearchField;

  // 지표
  citationCount?: number;

  // 협업 추적
  coAuthorIds: string[];       // 플랫폼 내 공저자 ID 목록

  // 상태
  status: 'published' | 'preprint' | 'under-review' | 'accepted' | 'draft';
  isFeatured: boolean;         // 프로필 상단 고정 여부

  createdAt: Date;
  updatedAt: Date;
}

// ==================== 연구 업적 (Achievement) ====================

export type AchievementType = 'award' | 'grant' | 'patent' | 'invited-talk' | 'fellowship' | 'editorial' | 'other';

export interface Achievement {
  id: string;
  researcherId: string;
  type: AchievementType;
  title: string;
  description?: string;
  organization?: string;       // 수여 기관
  year: number;
  amount?: string;             // 그랜트 금액 등
  url?: string;
  createdAt: Date;
}

// ==================== 연결 (Connection) ====================

export interface Connection {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  method: 'invite' | 'coauthor' | 'search' | 'lab';
  createdAt: Date;
  acceptedAt?: Date;
}

// ==================== 초대 코드 ====================

export interface InviteCode {
  code: string;
  createdBy: string;
  usedBy?: string;
  usedAt?: Date;
  createdAt: Date;
  isValid: boolean;
}

// ==================== 초대 발송 기록 ====================

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

// ==================== 키워드 ====================

export interface Keyword {
  id: string;
  tag: string;
  researchField?: ResearchField;
  useCount: number;
}

// ==================== 연구 미팅 (Coffee Chat 대체) ====================

export interface TimeSlot {
  id: string;
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  specificDate?: Date;
  isAvailable: boolean;
}

export type MeetingPurpose = 'paper-discussion' | 'collaboration' | 'methodology' | 'mentoring' | 'grant-proposal';

export interface CoffeeChatRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  slotId: string;
  purpose: MeetingPurpose;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  scheduledDate: Date;
  createdAt: Date;
  respondedAt?: Date;
}

// ==================== 네트워크 그래프 ====================

export interface NetworkNode {
  id: string;
  name: string;
  profileImage?: string;
  institution?: string;          // company → institution
  position?: string;
  researchInterests: string[];   // keywords → researchInterests
  degree: number;                // 1 = 직접 연결, 2 = 간접 연결
  connectionCount: number;
  researchField?: ResearchField; // category → researchField
  hIndex?: number;               // 노드 크기 결정용
  isCoAuthor?: boolean;          // 공저 관계 여부
  coAuthorPaperCount?: number;   // 공저 논문 수
  email?: string;
}

export interface NetworkEdge {
  source: string;
  target: string;
  degree: number;
  isCoAuthor?: boolean;          // 공저 관계 엣지 강조용
}

// ==================== 사용자 정의 그룹 ====================

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

// ==================== 추천 / 매칭 ====================

export interface Recommendation {
  userId: string;
  user: User;
  score: number;
  interestOverlap: number;      // keywordMatch → interestOverlap
  fieldRelevance: number;        // proximityScore → fieldRelevance
  mutualConnections: number;
  connectionPath: string[];
  sharedTopics?: string[];       // 공통 연구 토픽
  reason: string;
}

// ==================== API 응답 ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ==================== 검색 ====================

export interface SearchFilters {
  researchInterests?: string[];  // keywords → researchInterests
  institution?: string;          // company → institution
  degree?: number;
  researchField?: ResearchField;
  meetingStatus?: 'available' | 'busy' | 'pending';
}

export interface SearchResult {
  users: NetworkNode[];
  total: number;
  hasMore: boolean;
}

// ==================== 학술 프로필 카드 (BusinessCard 대체) ====================

export interface BusinessCard {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  institution?: string;          // company → institution
  department?: string;
  position?: string;
  bio?: string;
  profileImage?: string;
  researchInterests: string[];   // keywords → researchInterests
  researchField?: ResearchField;
  hIndex?: number;
  featuredPaperTitles?: string[];
  orcid?: string;
  networkVisibility: 'public' | 'connections_only' | 'private';
  qrCode: string;
  createdAt: Date;
  updatedAt: Date;
}

// 저장된 프로필 카드
export interface SavedCard {
  id: string;
  ownerId: string;
  cardId: string;
  card: BusinessCard;
  memo?: string;
  tags?: string[];
  savedAt: Date;
  lastViewedAt?: Date;
}

// ==================== 소개 요청 ====================

export interface IntroductionRequest {
  id: string;
  requesterId: string;
  introducerId: string;
  targetId: string;
  message: string;
  purpose: 'collaboration' | 'mentoring' | 'grant-proposal' | 'networking' | 'other';
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  requesterCard?: BusinessCard;
  createdAt: Date;
  respondedAt?: Date;
  completedAt?: Date;
}

// ==================== 연구실 (ManagedGroup 대체) ====================

export type LabRole = 'pi' | 'co-pi' | 'postdoc' | 'phd-student' | 'masters-student' | 'researcher' | 'collaborator'
  | 'admin' | 'president' | 'executive' | 'member'; // 기존 호환용
// 기존 코드 호환용 alias
export type ManagedGroupRole = LabRole;

export interface LabMember {
  userId: string;
  role: LabRole;
  title?: string;
  joinedAt: Date;
}
// 기존 코드 호환용 alias
export type ManagedGroupMember = LabMember;

export interface LabSettings {
  autoConnect: boolean;
  allowMemberInvite: boolean;
  isPublic?: boolean;
  acceptingMembers?: boolean;
}
// 기존 코드 호환용 alias
export type ManagedGroupSettings = LabSettings;

export interface ResearchLab {
  id: string;
  name: string;
  description?: string;
  institution?: string;
  department?: string;
  researchFields?: ResearchField[];
  color: string;
  icon: string;
  piId: string;                  // 지도교수 / PI
  ownerId: string;               // piId alias (기존 코드 호환용)
  members: LabMember[];
  memberUserIds: string[];
  settings: LabSettings;
  websiteUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
// 기존 코드 호환용 alias
export type ManagedGroup = ResearchLab;

// ==================== 인터랙션 & 관계 관리 ====================

export type InteractionType = 'meeting' | 'call' | 'message' | 'research_meeting' | 'memo' | 'other';

export interface Interaction {
  id: string;
  userId: string;
  targetUserId: string;
  type: InteractionType;
  note?: string;
  nextAction?: string;
  date: Date;
  createdAt: Date;
  isAutoTracked: boolean;
}

export type RelationshipStatus = 'active' | 'warm' | 'cold' | 'dormant';

export interface QuickCapture {
  id: string;
  name: string;
  institution?: string;          // company → institution
  memo?: string;
  photo?: string;
  createdAt: Date;
  convertedToContactId?: string;
}

// ==================== 연구실 초대 (ManagedGroupInvite 대체) ====================

export interface LabInvite {
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
// 기존 코드 호환용 alias
export type ManagedGroupInvite = LabInvite;

// ==================== 협업 기회 (신규) ====================

export type CollaborationType = 'co-authoring' | 'grant-proposal' | 'data-sharing' | 'postdoc-position' | 'consulting' | 'other';

export interface CollaborationOpportunity {
  id: string;
  postedBy: string;
  title: string;
  description: string;
  type: CollaborationType;
  researchFields: ResearchField[];
  requiredSkills: string[];
  deadline?: Date;
  isOpen: boolean;
  applicantIds: string[];
  createdAt: Date;
  updatedAt: Date;
}
