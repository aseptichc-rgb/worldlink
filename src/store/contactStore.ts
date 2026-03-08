import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Contact, ContactCategory, parseCSV, groupByCategory, calculateCategoryStats, CategoryStats } from '@/types/contacts';

// 초대 상태를 추가한 Contact 확장
export interface InvitableContact extends Contact {
  isInvited: boolean;
  invitedAt?: Date;
}

// 초대 상태 저장용 타입
interface InviteStatus {
  id: string;
  invitedAt?: string;
}

// 공통 필터 헬퍼
function applyFilters(
  contacts: InvitableContact[],
  category: ContactCategory | 'all',
  query: string
): InvitableContact[] {
  let filtered = category === 'all'
    ? contacts
    : contacts.filter(c => c.category === category);

  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.position.toLowerCase().includes(q) ||
      c.department.toLowerCase().includes(q)
    );
  }

  return filtered;
}

interface ContactStore {
  contacts: InvitableContact[];
  filteredContacts: InvitableContact[];
  selectedCategory: ContactCategory | 'all';
  selectedContact: InvitableContact | null;
  searchQuery: string;
  categoryStats: CategoryStats[];
  isLoading: boolean;
  // 초대 상태만 persist 용
  _inviteStatuses: InviteStatus[];

  // Actions
  loadContacts: (csvText: string) => void;
  setSelectedCategory: (category: ContactCategory | 'all') => void;
  setSelectedContact: (contact: InvitableContact | null) => void;
  setSearchQuery: (query: string) => void;
  getContactsByCategory: (category: ContactCategory) => InvitableContact[];
  inviteContact: (contactId: string) => void;
  getInvitedContacts: () => InvitableContact[];
  getPendingContacts: () => InvitableContact[];
}

export const useContactStore = create<ContactStore>()(
  persist(
    (set, get) => ({
      contacts: [],
      filteredContacts: [],
      selectedCategory: 'all',
      selectedContact: null,
      searchQuery: '',
      categoryStats: [],
      isLoading: false,
      _inviteStatuses: [],

      loadContacts: (csvText: string) => {
        set({ isLoading: true });

        const parsed = parseCSV(csvText);
        const { _inviteStatuses } = get();

        // 저장된 초대 상태 복원
        const inviteMap = new Map(
          _inviteStatuses.map(s => [s.id, s])
        );

        const contacts: InvitableContact[] = parsed.map(c => {
          const invite = inviteMap.get(c.id);
          return {
            ...c,
            isInvited: !!invite,
            invitedAt: invite?.invitedAt ? new Date(invite.invitedAt) : undefined,
          };
        });
        const stats = calculateCategoryStats(contacts);

        set({
          contacts,
          filteredContacts: contacts,
          categoryStats: stats,
          isLoading: false
        });
      },

      setSelectedCategory: (category: ContactCategory | 'all') => {
        const { contacts, searchQuery } = get();
        const filtered = applyFilters(contacts, category, searchQuery);
        set({ selectedCategory: category, filteredContacts: filtered });
      },

      setSelectedContact: (contact: InvitableContact | null) => {
        set({ selectedContact: contact });
      },

      setSearchQuery: (query: string) => {
        const { contacts, selectedCategory } = get();
        const filtered = applyFilters(contacts, selectedCategory, query);
        set({ searchQuery: query, filteredContacts: filtered });
      },

      getContactsByCategory: (category: ContactCategory) => {
        const { contacts } = get();
        return contacts.filter(c => c.category === category);
      },

      inviteContact: (contactId: string) => {
        const { contacts, selectedCategory, searchQuery, _inviteStatuses } = get();

        const now = new Date();
        const updatedContacts = contacts.map(c =>
          c.id === contactId
            ? { ...c, isInvited: true, invitedAt: now }
            : c
        );

        const filtered = applyFilters(updatedContacts, selectedCategory, searchQuery);

        // 초대 상태 업데이트
        const newInviteStatuses = [
          ..._inviteStatuses.filter(s => s.id !== contactId),
          { id: contactId, invitedAt: now.toISOString() },
        ];

        set({
          contacts: updatedContacts,
          filteredContacts: filtered,
          _inviteStatuses: newInviteStatuses,
        });
      },

      getInvitedContacts: () => {
        const { contacts } = get();
        return contacts.filter(c => c.isInvited);
      },

      getPendingContacts: () => {
        const { contacts } = get();
        return contacts.filter(c => !c.isInvited);
      },
    }),
    {
      name: 'nodded-contacts',
      // 초대 상태만 localStorage에 저장 (전체 연락처 X)
      partialize: (state) => ({
        _inviteStatuses: state._inviteStatuses,
      }),
    }
  )
);
