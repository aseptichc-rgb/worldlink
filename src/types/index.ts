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
  bio?: string;
  keywords: string[];
  inviteCode: string;
  invitesRemaining: number;
  invitedBy?: string;
  coffeeStatus: 'available' | 'busy' | 'pending';
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
}

export interface NetworkEdge {
  source: string;
  target: string;
  degree: number;
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
