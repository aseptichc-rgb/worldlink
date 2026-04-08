'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, ArrowLeft, BookOpen } from 'lucide-react';
import { usePaperStore } from '@/store/paperStore';
import { useAuthStore } from '@/store/authStore';
import PaperCard from '@/components/papers/PaperCard';
import PaperUploadForm from '@/components/papers/PaperUploadForm';
import type { Paper, ResearchField } from '@/types';
import { FIELD_LABELS } from '@/lib/category-utils';
import BottomNav from '@/components/ui/BottomNav';

export default function PapersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { papers, addPaper, toggleFeatured, removePaper } = usePaperStore();
  const [showUpload, setShowUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterField, setFilterField] = useState<ResearchField | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<Paper['status'] | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  if (!user) {
    router.push('/login');
    return null;
  }

  const myPapers = papers.filter(p => p.researcherId === user.id);

  const filteredPapers = myPapers.filter(p => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchAuthor = p.authors.some(a => a.name.toLowerCase().includes(q));
      const matchJournal = p.journal?.toLowerCase().includes(q);
      const matchTag = p.tags.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchAuthor && !matchJournal && !matchTag) return false;
    }
    if (filterField !== 'all' && p.researchField !== filterField) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    return true;
  });

  const featuredPapers = filteredPapers.filter(p => p.isFeatured);
  const otherPapers = filteredPapers.filter(p => !p.isFeatured);

  const totalCitations = myPapers.reduce((sum, p) => sum + (p.citationCount || 0), 0);

  const handleSubmitPaper = (paper: Paper) => {
    addPaper(paper);
    setShowUpload(false);
  };

  return (
    <div className="min-h-screen bg-[#121212] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#121212]/95 backdrop-blur-xl border-b border-[#30363D]">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={20} className="text-[#8B949E]" />
          </button>
          <h1 className="text-lg font-bold text-[#F0F6FC]">내 논문</h1>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg ${showFilters ? 'bg-[#0EA5E9]/10 text-[#0EA5E9]' : 'text-[#8B949E]'}`}
            >
              <Filter size={18} />
            </button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0EA5E9] text-white text-sm font-medium"
            >
              <Plus size={16} />
              논문 추가
            </motion.button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#484F58]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="논문 제목, 저자, 학술지, 태그 검색"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#1E1E1E] border border-[#30363D] text-[#F0F6FC] text-sm focus:outline-none focus:border-[#0EA5E9] placeholder:text-[#484F58]"
            />
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-3 overflow-hidden"
            >
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                <select
                  value={filterField}
                  onChange={(e) => setFilterField(e.target.value as ResearchField | 'all')}
                  className="px-3 py-1.5 rounded-lg bg-[#252525] text-[#8B949E] text-xs border border-[#30363D]"
                >
                  <option value="all">모든 분야</option>
                  {Object.entries(FIELD_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as Paper['status'] | 'all')}
                  className="px-3 py-1.5 rounded-lg bg-[#252525] text-[#8B949E] text-xs border border-[#30363D]"
                >
                  <option value="all">모든 상태</option>
                  <option value="published">출판</option>
                  <option value="preprint">프리프린트</option>
                  <option value="under-review">심사 중</option>
                  <option value="accepted">게재 확정</option>
                  <option value="draft">초안</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-[#1E1E1E] border border-[#30363D] text-center">
            <p className="text-xl font-bold text-[#F0F6FC]">{myPapers.length}</p>
            <p className="text-xs text-[#8B949E] mt-0.5">전체 논문</p>
          </div>
          <div className="p-3 rounded-xl bg-[#1E1E1E] border border-[#30363D] text-center">
            <p className="text-xl font-bold text-[#F59E0B]">{totalCitations}</p>
            <p className="text-xs text-[#8B949E] mt-0.5">총 인용</p>
          </div>
          <div className="p-3 rounded-xl bg-[#1E1E1E] border border-[#30363D] text-center">
            <p className="text-xl font-bold text-[#0EA5E9]">{featuredPapers.length}</p>
            <p className="text-xs text-[#8B949E] mt-0.5">대표 논문</p>
          </div>
        </div>
      </div>

      {/* Papers List */}
      <div className="px-4 space-y-3">
        {filteredPapers.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen size={48} className="text-[#30363D] mx-auto mb-4" />
            <p className="text-[#8B949E] text-sm">
              {myPapers.length === 0 ? '등록된 논문이 없습니다' : '검색 결과가 없습니다'}
            </p>
            {myPapers.length === 0 && (
              <button
                onClick={() => setShowUpload(true)}
                className="mt-4 px-4 py-2 rounded-lg bg-[#0EA5E9]/10 text-[#0EA5E9] text-sm font-medium"
              >
                첫 논문 등록하기
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Featured Papers */}
            {featuredPapers.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-[#F59E0B] mb-2 flex items-center gap-1.5">
                  <BookOpen size={14} />
                  대표 논문
                </h2>
                <div className="space-y-2.5">
                  {featuredPapers.map(p => (
                    <PaperCard
                      key={p.id}
                      paper={p}
                      showActions
                      onToggleFeatured={toggleFeatured}
                      onDelete={removePaper}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Other Papers */}
            {otherPapers.length > 0 && (
              <div className={featuredPapers.length > 0 ? 'mt-4' : ''}>
                {featuredPapers.length > 0 && (
                  <h2 className="text-sm font-semibold text-[#8B949E] mb-2">전체 논문</h2>
                )}
                <div className="space-y-2.5">
                  {otherPapers.map(p => (
                    <PaperCard
                      key={p.id}
                      paper={p}
                      showActions
                      onToggleFeatured={toggleFeatured}
                      onDelete={removePaper}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center"
            onClick={(e) => e.target === e.currentTarget && setShowUpload(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg bg-[#1E1E1E] rounded-t-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-[#1E1E1E] px-4 py-4 border-b border-[#30363D]">
                <div className="w-10 h-1 rounded-full bg-[#363636] mx-auto mb-3" />
                <h2 className="text-lg font-bold text-[#F0F6FC]">논문 등록</h2>
                <p className="text-xs text-[#8B949E] mt-1">DOI를 입력하면 논문 정보를 자동으로 가져옵니다</p>
              </div>
              <div className="p-4">
                <PaperUploadForm
                  researcherId={user.id}
                  onSubmit={handleSubmitPaper}
                  onCancel={() => setShowUpload(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
