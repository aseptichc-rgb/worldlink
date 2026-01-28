import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Contact, ContactCategory, parseCSV, groupByCategory, calculateCategoryStats, CategoryStats } from '@/types/contacts';

// 초대 상태를 추가한 Contact 확장
export interface InvitableContact extends Contact {
  isInvited: boolean;
  invitedAt?: Date;
}

interface ContactStore {
  contacts: InvitableContact[];
  filteredContacts: InvitableContact[];
  selectedCategory: ContactCategory | 'all';
  selectedContact: InvitableContact | null;
  searchQuery: string;
  categoryStats: CategoryStats[];
  isLoading: boolean;

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

      loadContacts: (csvText: string) => {
        set({ isLoading: true });

        const parsed = parseCSV(csvText);
        const contacts: InvitableContact[] = parsed.map(c => ({
          ...c,
          isInvited: false,
        }));
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

        let filtered = category === 'all'
          ? contacts
          : contacts.filter(c => c.category === category);

        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(c =>
            c.name.toLowerCase().includes(query) ||
            c.company.toLowerCase().includes(query) ||
            c.position.toLowerCase().includes(query)
          );
        }

        set({ selectedCategory: category, filteredContacts: filtered });
      },

      setSelectedContact: (contact: InvitableContact | null) => {
        set({ selectedContact: contact });
      },

      setSearchQuery: (query: string) => {
        const { contacts, selectedCategory } = get();

        let filtered = selectedCategory === 'all'
          ? contacts
          : contacts.filter(c => c.category === selectedCategory);

        if (query) {
          const q = query.toLowerCase();
          filtered = filtered.filter(c =>
            c.name.toLowerCase().includes(q) ||
            c.company.toLowerCase().includes(q) ||
            c.position.toLowerCase().includes(q) ||
            c.department.toLowerCase().includes(q)
          );
        }

        set({ searchQuery: query, filteredContacts: filtered });
      },

      getContactsByCategory: (category: ContactCategory) => {
        const { contacts } = get();
        return contacts.filter(c => c.category === category);
      },

      inviteContact: (contactId: string) => {
        const { contacts, filteredContacts, selectedCategory, searchQuery } = get();

        const updatedContacts = contacts.map(c =>
          c.id === contactId
            ? { ...c, isInvited: true, invitedAt: new Date() }
            : c
        );

        // filteredContacts도 업데이트
        let filtered = selectedCategory === 'all'
          ? updatedContacts
          : updatedContacts.filter(c => c.category === selectedCategory);

        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(c =>
            c.name.toLowerCase().includes(q) ||
            c.company.toLowerCase().includes(q) ||
            c.position.toLowerCase().includes(q) ||
            c.department.toLowerCase().includes(q)
          );
        }

        set({ contacts: updatedContacts, filteredContacts: filtered });
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
    }
  )
);
