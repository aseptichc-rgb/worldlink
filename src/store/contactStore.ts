import { create } from 'zustand';
import { Contact, ContactCategory, parseCSV, groupByCategory, calculateCategoryStats, CategoryStats } from '@/types/contacts';

interface ContactStore {
  contacts: Contact[];
  filteredContacts: Contact[];
  selectedCategory: ContactCategory | 'all';
  selectedContact: Contact | null;
  searchQuery: string;
  categoryStats: CategoryStats[];
  isLoading: boolean;

  // Actions
  loadContacts: (csvText: string) => void;
  setSelectedCategory: (category: ContactCategory | 'all') => void;
  setSelectedContact: (contact: Contact | null) => void;
  setSearchQuery: (query: string) => void;
  getContactsByCategory: (category: ContactCategory) => Contact[];
}

export const useContactStore = create<ContactStore>((set, get) => ({
  contacts: [],
  filteredContacts: [],
  selectedCategory: 'all',
  selectedContact: null,
  searchQuery: '',
  categoryStats: [],
  isLoading: false,

  loadContacts: (csvText: string) => {
    set({ isLoading: true });

    const contacts = parseCSV(csvText);
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

  setSelectedContact: (contact: Contact | null) => {
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
  }
}));
