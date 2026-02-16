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
      <div className="min-h-screen bg-[#FAFBFC] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-[#2563EB] animate-spin" />
        <p className="text-[#64748B]">연락처를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex flex-col items-center justify-center gap-4 px-4">
        <div className="text-5xl">😢</div>
        <p className="text-[#1A1A2E] font-semibold">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-[#EFF6FF] text-[#2563EB] rounded-lg hover:bg-[#DBEAFE] transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC] text-[#1A1A2E]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#FAFBFC]/95 backdrop-blur-xl border-b border-[#E2E8F0]">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-4">
            {selectedContact ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-[#64748B] hover:text-[#1A1A2E] transition-colors"
              >
                <ChevronLeft size={20} />
                <span>뒤로</span>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#3B82F6] flex items-center justify-center">
                  <Users size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">내 연락처</h1>
                  <p className="text-sm text-[#64748B]">
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
                      ? 'bg-[#EFF6FF] text-[#2563EB]'
                      : 'text-[#64748B] hover:text-[#1A1A2E]'
                  }`}
                >
                  <LayoutGrid size={20} />
                </button>
                <button
                  onClick={() => setViewMode('graph')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'graph'
                      ? 'bg-[#EFF6FF] text-[#2563EB]'
                      : 'text-[#64748B] hover:text-[#1A1A2E]'
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
              <input
                type="text"
                placeholder="이름, 회사, 직책으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#F1F3F5] border border-[#E2E8F0] rounded-xl text-[#1A1A2E] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB]/50 transition-colors"
              />
            </div>
          )}

          {/* Filter Tabs */}
          {!selectedContact && (
            <div className="flex gap-2">
              <button
                onClick={() => setFilterMode('all')}
                className={`flex-1 py-2 px-3 rounded-lg text-base font-medium transition-all ${
                  filterMode === 'all'
                    ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]'
                    : 'bg-[#F1F3F5] text-[#64748B] border border-[#E2E8F0]'
                }`}
              >
                전체 ({contacts.length})
              </button>
              <button
                onClick={() => setFilterMode('pending')}
                className={`flex-1 py-2 px-3 rounded-lg text-base font-medium transition-all flex items-center justify-center gap-1 ${
                  filterMode === 'pending'
                    ? 'bg-[#FFFBEB] text-[#F59E0B] border border-[#FEF3C7]'
                    : 'bg-[#F1F3F5] text-[#64748B] border border-[#E2E8F0]'
                }`}
              >
                <UserPlus size={14} />
                대기 ({pendingCount})
              </button>
              <button
                onClick={() => setFilterMode('invited')}
                className={`flex-1 py-2 px-3 rounded-lg text-base font-medium transition-all flex items-center justify-center gap-1 ${
                  filterMode === 'invited'
                    ? 'bg-[#ECFDF5] text-[#10B981] border border-[#D1FAE5]'
                    : 'bg-[#F1F3F5] text-[#64748B] border border-[#E2E8F0]'
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
