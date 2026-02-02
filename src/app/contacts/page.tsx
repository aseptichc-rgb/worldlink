'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContactStore, InvitableContact } from '@/store/contactStore';
import { CATEGORY_INFO, ContactCategory } from '@/types/contacts';
import ContactGraph from '@/components/contacts/ContactGraph';
import ContactList from '@/components/contacts/ContactList';
import ContactDetail from '@/components/contacts/ContactDetail';
import CategoryFilter from '@/components/contacts/CategoryFilter';
import { Search, LayoutGrid, Network, Users, ChevronLeft, Loader2, UserPlus, Check, Filter } from 'lucide-react';
import KakaoInvitePrompt from '@/components/invite/KakaoInvitePrompt';

type ViewMode = 'graph' | 'list';
type FilterMode = 'all' | 'invited' | 'pending';

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
    setSearchQuery,
    inviteContact,
    getInvitedContacts,
    getPendingContacts,
  } = useContactStore();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showKakaoPrompt, setShowKakaoPrompt] = useState(false);
  const [inviteTarget, setInviteTarget] = useState<{ name: string; phone?: string; email?: string } | null>(null);

  useEffect(() => {
    const fetchContacts = async () => {
      // 이미 로드된 데이터가 있으면 스킵
      if (contacts.length > 0) {
        setIsLoading(false);
        return;
      }

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
  }, [loadContacts, contacts.length]);

  const handleBack = () => {
    if (selectedContact) {
      setSelectedContact(null);
    }
  };

  const handleInvite = (contactId: string) => {
    inviteContact(contactId);
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      setInviteTarget({
        name: contact.name,
        phone: contact.phone || undefined,
        email: contact.email || undefined,
      });
      setShowKakaoPrompt(true);
    }
  };

  // 필터 적용된 연락처
  const getDisplayContacts = (): InvitableContact[] => {
    let displayContacts = filteredContacts;

    if (filterMode === 'invited') {
      displayContacts = displayContacts.filter(c => c.isInvited);
    } else if (filterMode === 'pending') {
      displayContacts = displayContacts.filter(c => !c.isInvited);
    }

    return displayContacts;
  };

  const invitedCount = contacts.filter(c => c.isInvited).length;
  const pendingCount = contacts.filter(c => !c.isInvited).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#101D33] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-[#86C9F2] animate-spin" />
        <p className="text-[#8BA4C4]">연락처를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#101D33] flex flex-col items-center justify-center gap-4 px-4">
        <div className="text-5xl">😢</div>
        <p className="text-white font-semibold">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-[#86C9F2]/20 text-[#86C9F2] rounded-lg hover:bg-[#86C9F2]/30 transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101D33] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#101D33]/95 backdrop-blur-xl border-b border-[#1E3A5F]">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            {selectedContact ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-[#8BA4C4] hover:text-white transition-colors"
              >
                <ChevronLeft size={20} />
                <span>뒤로</span>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#86C9F2] to-[#2C529C] flex items-center justify-center">
                  <Users size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">내 연락처</h1>
                  <p className="text-xs text-[#8BA4C4]">
                    {contacts.length}명 중 {invitedCount}명 초대됨
                  </p>
                </div>
              </div>
            )}

            {!selectedContact && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-[#86C9F2]/20 text-[#86C9F2]'
                      : 'text-[#8BA4C4] hover:text-white'
                  }`}
                >
                  <LayoutGrid size={20} />
                </button>
                <button
                  onClick={() => setViewMode('graph')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'graph'
                      ? 'bg-[#86C9F2]/20 text-[#86C9F2]'
                      : 'text-[#8BA4C4] hover:text-white'
                  }`}
                >
                  <Network size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Search */}
          {!selectedContact && (
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5E7A]" size={18} />
              <input
                type="text"
                placeholder="이름, 회사, 직책으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#162A4A] border border-[#1E3A5F] rounded-xl text-white placeholder-[#4A5E7A] focus:outline-none focus:border-[#86C9F2]/50 transition-colors"
              />
            </div>
          )}

          {/* Filter Tabs */}
          {!selectedContact && (
            <div className="flex gap-2">
              <button
                onClick={() => setFilterMode('all')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  filterMode === 'all'
                    ? 'bg-[#86C9F2]/20 text-[#86C9F2] border border-[#86C9F2]/50'
                    : 'bg-[#162A4A] text-[#8BA4C4] border border-[#1E3A5F]'
                }`}
              >
                전체 ({contacts.length})
              </button>
              <button
                onClick={() => setFilterMode('pending')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                  filterMode === 'pending'
                    ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/50'
                    : 'bg-[#162A4A] text-[#8BA4C4] border border-[#1E3A5F]'
                }`}
              >
                <UserPlus size={14} />
                대기 ({pendingCount})
              </button>
              <button
                onClick={() => setFilterMode('invited')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                  filterMode === 'invited'
                    ? 'bg-[#3FB950]/20 text-[#3FB950] border border-[#3FB950]/50'
                    : 'bg-[#162A4A] text-[#8BA4C4] border border-[#1E3A5F]'
                }`}
              >
                <Check size={14} />
                초대됨 ({invitedCount})
              </button>
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
              className="h-[calc(100vh-220px)]"
            >
              <ContactGraph
                contacts={getDisplayContacts()}
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
                contacts={getDisplayContacts()}
                onSelectContact={setSelectedContact}
                onInvite={handleInvite}
                showInviteButton={true}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {showKakaoPrompt && inviteTarget && (
        <KakaoInvitePrompt
          recipientName={inviteTarget.name}
          recipientPhone={inviteTarget.phone}
          recipientEmail={inviteTarget.email}
          onClose={() => {
            setShowKakaoPrompt(false);
            setInviteTarget(null);
          }}
          onSent={() => {
            setShowKakaoPrompt(false);
            setInviteTarget(null);
          }}
        />
      )}
    </div>
  );
}
