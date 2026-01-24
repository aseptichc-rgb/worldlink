'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Building2,
  Briefcase,
  Users,
  Clock,
  Trash2,
  MoreVertical,
  X,
  StickyNote,
  Network,
  Image as ImageIcon
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCardStore } from '@/store/cardStore';
import { SavedCard } from '@/types';
import Avatar from '@/components/ui/Avatar';
import BottomNav from '@/components/ui/BottomNav';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function CardsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { savedCards, removeSavedCard, updateSavedCardMemo } = useCardStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCard, setSelectedCard] = useState<SavedCard | null>(null);
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [memoText, setMemoText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState<string | null>(null);

  // 검색 필터링
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return savedCards;

    const query = searchQuery.toLowerCase();
    return savedCards.filter(saved => {
      const card = saved.card;
      return (
        card.name.toLowerCase().includes(query) ||
        card.company?.toLowerCase().includes(query) ||
        card.position?.toLowerCase().includes(query) ||
        card.keywords?.some(k => k.toLowerCase().includes(query)) ||
        saved.memo?.toLowerCase().includes(query)
      );
    });
  }, [savedCards, searchQuery]);

  const handleViewNetwork = (cardId: string) => {
    router.push(`/network/${cardId}`);
  };

  const handleEditMemo = (saved: SavedCard) => {
    setSelectedCard(saved);
    setMemoText(saved.memo || '');
    setShowMemoModal(true);
  };

  const handleSaveMemo = () => {
    if (selectedCard) {
      updateSavedCardMemo(selectedCard.cardId, memoText);
      setShowMemoModal(false);
      setSelectedCard(null);
      setMemoText('');
    }
  };

  const handleDelete = (cardId: string) => {
    removeSavedCard(cardId);
    setShowDeleteConfirm(null);
  };

  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ko });
  };

  // 비로그인 사용자도 로컬에 저장된 명함 볼 수 있음

  return (
    <div className="min-h-screen bg-[#0A0E1A] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0A0E1A]/80 backdrop-blur-xl border-b border-[#21262D]">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-white mb-3">명함첩</h1>

          {/* 검색바 */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#484F58]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름, 회사, 키워드로 검색"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#161B22] border border-[#21262D] text-white placeholder:text-[#484F58] focus:outline-none focus:border-[#00E5FF]"
            />
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* 카드 수 */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-[#8B949E]">
            총 {filteredCards.length}개의 명함
          </span>
          <button className="flex items-center gap-1 text-sm text-[#8B949E]">
            <Filter size={16} />
            필터
          </button>
        </div>

        {/* 명함 목록 */}
        {filteredCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-[#161B22] flex items-center justify-center mb-4">
              <Users size={32} className="text-[#484F58]" />
            </div>
            <p className="text-[#8B949E] text-center">
              {searchQuery ? '검색 결과가 없습니다' : '저장된 명함이 없습니다'}
            </p>
            <p className="text-sm text-[#484F58] mt-1">
              {!searchQuery && 'QR 코드를 스캔해서 명함을 저장해보세요'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCards.map((saved, index) => (
              <motion.div
                key={saved.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative p-4 rounded-xl bg-[#161B22] border border-[#21262D]"
              >
                {/* 명함 이미지 썸네일 */}
                {saved.cardImage && (
                  <button
                    onClick={() => setShowImageModal(saved.cardImage!)}
                    className="w-full mb-3 relative group"
                  >
                    <img
                      src={saved.cardImage}
                      alt="명함 이미지"
                      className="w-full h-24 object-cover rounded-lg border border-[#21262D]"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex items-center justify-center">
                      <ImageIcon size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                )}

                <div className="flex items-start gap-3">
                  <button onClick={() => handleViewNetwork(saved.cardId)}>
                    <Avatar
                      src={saved.card.profileImage}
                      name={saved.card.name}
                      size="md"
                    />
                  </button>

                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => handleViewNetwork(saved.cardId)}
                      className="text-left"
                    >
                      <h3 className="font-semibold text-white">{saved.card.name}</h3>
                    </button>

                    {(saved.card.position || saved.card.company) && (
                      <div className="flex items-center gap-2 text-sm text-[#8B949E] mt-0.5">
                        {saved.card.position && (
                          <span>{saved.card.position}</span>
                        )}
                        {saved.card.position && saved.card.company && (
                          <span className="text-[#484F58]">@</span>
                        )}
                        {saved.card.company && (
                          <span>{saved.card.company}</span>
                        )}
                      </div>
                    )}

                    {/* 키워드 */}
                    {saved.card.keywords && saved.card.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {saved.card.keywords.slice(0, 3).map((keyword, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-xs rounded-full bg-[#7C4DFF]/10 text-[#7C4DFF]"
                          >
                            {keyword}
                          </span>
                        ))}
                        {saved.card.keywords.length > 3 && (
                          <span className="px-2 py-0.5 text-xs text-[#484F58]">
                            +{saved.card.keywords.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* 메모 */}
                    {saved.memo && (
                      <div className="mt-2 p-2 rounded-lg bg-[#0D1117] border border-[#21262D]">
                        <p className="text-xs text-[#8B949E] line-clamp-2">{saved.memo}</p>
                      </div>
                    )}

                    {/* 저장 시간 */}
                    <div className="flex items-center gap-1 mt-2 text-xs text-[#484F58]">
                      <Clock size={12} />
                      <span>{formatDate(saved.savedAt)}</span>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleViewNetwork(saved.cardId)}
                      className="p-2 rounded-lg bg-[#00E5FF]/10 text-[#00E5FF] hover:bg-[#00E5FF]/20 transition-colors"
                      title="인맥 보기"
                    >
                      <Network size={18} />
                    </button>
                    <button
                      onClick={() => handleEditMemo(saved)}
                      className="p-2 rounded-lg bg-[#21262D] text-[#8B949E] hover:bg-[#2D333B] transition-colors"
                      title="메모"
                    >
                      <StickyNote size={18} />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(saved.cardId)}
                      className="p-2 rounded-lg bg-[#21262D] text-[#8B949E] hover:bg-[#FF5252]/20 hover:text-[#FF5252] transition-colors"
                      title="삭제"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* 삭제 확인 */}
                <AnimatePresence>
                  {showDeleteConfirm === saved.cardId && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 rounded-xl bg-[#0D1117]/95 backdrop-blur-sm flex items-center justify-center"
                    >
                      <div className="text-center">
                        <p className="text-white mb-4">명함을 삭제하시겠습니까?</p>
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="px-4 py-2 rounded-lg bg-[#21262D] text-white"
                          >
                            취소
                          </button>
                          <button
                            onClick={() => handleDelete(saved.cardId)}
                            className="px-4 py-2 rounded-lg bg-[#FF5252] text-white"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 메모 모달 */}
      <AnimatePresence>
        {showMemoModal && selectedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end"
            onClick={() => setShowMemoModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-[#161B22] rounded-t-3xl border-t border-[#21262D] p-6"
            >
              <div className="w-12 h-1 bg-[#484F58] rounded-full mx-auto mb-6" />

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">메모</h3>
                <button onClick={() => setShowMemoModal(false)}>
                  <X size={24} className="text-[#8B949E]" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <Avatar
                  src={selectedCard.card.profileImage}
                  name={selectedCard.card.name}
                  size="sm"
                />
                <div>
                  <p className="font-medium text-white">{selectedCard.card.name}</p>
                  <p className="text-sm text-[#8B949E]">
                    {selectedCard.card.position} @ {selectedCard.card.company}
                  </p>
                </div>
              </div>

              <textarea
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
                placeholder="이 사람에 대한 메모를 작성하세요..."
                className="w-full h-32 p-4 rounded-xl bg-[#0D1117] border border-[#21262D] text-white placeholder:text-[#484F58] resize-none focus:outline-none focus:border-[#00E5FF]"
              />

              <button
                onClick={handleSaveMemo}
                className="w-full mt-4 py-4 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#7C4DFF] text-black font-medium"
              >
                저장
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 명함 이미지 모달 */}
      <AnimatePresence>
        {showImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowImageModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowImageModal(null)}
                className="absolute -top-12 right-0 p-2 text-white"
              >
                <X size={24} />
              </button>
              <img
                src={showImageModal}
                alt="명함 이미지"
                className="w-full rounded-xl border border-[#21262D]"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
