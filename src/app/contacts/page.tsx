'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContactStore } from '@/store/contactStore';
import { CATEGORY_INFO, ContactCategory, Contact } from '@/types/contacts';
import ContactGraph from '@/components/contacts/ContactGraph';
import ContactList from '@/components/contacts/ContactList';
import ContactDetail from '@/components/contacts/ContactDetail';
import CategoryFilter from '@/components/contacts/CategoryFilter';
import { Search, LayoutGrid, Network, Users, ChevronLeft, Loader2 } from 'lucide-react';

type ViewMode = 'graph' | 'list';

export default function ContactsPage() {
  const {
    contacts,
    filteredContacts,
    selectedCategory,
    selectedContact,
    searchQuery,
    categoryStats,
    loadContacts,
    setSelectedCategory,
    setSelectedContact,
    setSearchQuery
  } = useContactStore();

  const [viewMode, setViewMode] = useState<ViewMode>('graph');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/contacts.csv');
        if (!response.ok) {
          throw new Error('Failed to fetch contacts');
        }
        const csvText = await response.text();
        loadContacts(csvText);
        setError(null);
      } catch (err) {
        console.error('Error loading contacts:', err);
        setError('연락처를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContacts();
  }, [loadContacts]);

  const handleBack = () => {
    if (selectedContact) {
      setSelectedContact(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-[#00D9FF] animate-spin" />
        <p className="text-[#8B949E]">연락처를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-center gap-4 px-4">
        <div className="text-5xl">😢</div>
        <p className="text-white font-semibold">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-[#00D9FF]/20 text-[#00D9FF] rounded-lg hover:bg-[#00D9FF]/30 transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1117] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0D1117]/95 backdrop-blur-xl border-b border-[#21262D]">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            {selectedContact ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-[#8B949E] hover:text-white transition-colors"
              >
                <ChevronLeft size={20} />
                <span>뒤로</span>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D9FF] to-[#7B68EE] flex items-center justify-center">
                  <Users size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">내 네트워크</h1>
                  <p className="text-xs text-[#8B949E]">{contacts.length}명의 연락처</p>
                </div>
              </div>
            )}

            {!selectedContact && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('graph')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'graph'
                      ? 'bg-[#00D9FF]/20 text-[#00D9FF]'
                      : 'text-[#8B949E] hover:text-white'
                  }`}
                >
                  <Network size={20} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-[#00D9FF]/20 text-[#00D9FF]'
                      : 'text-[#8B949E] hover:text-white'
                  }`}
                >
                  <LayoutGrid size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Search */}
          {!selectedContact && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#484F58]" size={18} />
              <input
                type="text"
                placeholder="이름, 회사, 직책으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#161B22] border border-[#21262D] rounded-xl text-white placeholder-[#484F58] focus:outline-none focus:border-[#00D9FF]/50 transition-colors"
              />
            </div>
          )}
        </div>

        {/* Category Filter */}
        {!selectedContact && (
          <CategoryFilter
            stats={categoryStats}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        )}
      </header>

      {/* Main Content */}
      <main className="relative">
        <AnimatePresence mode="wait">
          {selectedContact ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ContactDetail contact={selectedContact} />
            </motion.div>
          ) : viewMode === 'graph' ? (
            <motion.div
              key="graph"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[calc(100vh-180px)]"
            >
              <ContactGraph
                contacts={filteredContacts}
                onSelectContact={setSelectedContact}
              />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ContactList
                contacts={filteredContacts}
                onSelectContact={setSelectedContact}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
