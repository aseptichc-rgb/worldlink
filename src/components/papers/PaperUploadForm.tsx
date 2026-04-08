'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link2, Loader2, Sparkles, Plus, X } from 'lucide-react';
import type { Paper, PaperAuthor, ResearchField } from '@/types';
import { FIELD_LABELS } from '@/lib/category-utils';
import { v4 as uuidv4 } from 'uuid';

interface PaperUploadFormProps {
  researcherId: string;
  onSubmit: (paper: Paper) => void;
  onCancel: () => void;
}

/** 링크에서 DOI를 추출하는 헬퍼 */
function extractDoi(input: string): string | null {
  // doi.org URL
  const doiUrlMatch = input.match(/doi\.org\/(.+)/i);
  if (doiUrlMatch) return doiUrlMatch[1].trim();
  // 10.xxxx/xxxxx 패턴
  const doiMatch = input.match(/(10\.\d{4,}\/[^\s]+)/);
  if (doiMatch) return doiMatch[1].trim();
  return null;
}

export default function PaperUploadForm({ researcherId, onSubmit, onCancel }: PaperUploadFormProps) {
  const [link, setLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'link' | 'detail'>('link');
  const [tagInput, setTagInput] = useState('');

  const [form, setForm] = useState({
    title: '',
    authors: [] as PaperAuthor[],
    abstract: '',
    journal: '',
    year: new Date().getFullYear(),
    doi: '',
    pdfUrl: '',
    link: '',
    tags: [] as string[],
    researchField: 'other' as ResearchField,
    citationCount: 0,
    status: 'published' as Paper['status'],
    isFeatured: false,
  });

  // 링크 붙여넣기 → DOI 추출 → CrossRef 자동 조회
  const handleLinkSubmit = async () => {
    const url = link.trim();
    if (!url) return;

    setIsLoading(true);
    setError('');

    const doi = extractDoi(url);

    if (doi) {
      // DOI가 있으면 CrossRef에서 메타데이터 가져오기
      try {
        const res = await fetch('/api/paper-lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ doi }),
        });
        const data = await res.json();

        if (data.success && data.data) {
          const p = data.data;
          setForm(prev => ({
            ...prev,
            title: p.title || '',
            authors: (p.authors || []).map((a: { name: string; affiliation?: string }) => ({
              name: a.name,
              affiliation: a.affiliation,
            })),
            abstract: p.abstract || '',
            journal: p.journal || '',
            year: p.year || prev.year,
            doi: p.doi || doi,
            citationCount: p.citationCount || 0,
            link: url,
          }));
          setStep('detail');
          setIsLoading(false);
          return;
        }
      } catch {
        // CrossRef 실패 시 수동 입력으로
      }
    }

    // DOI가 없거나 조회 실패 → 링크만 저장하고 수동 입력
    setForm(prev => ({ ...prev, link: url, pdfUrl: url }));
    setStep('detail');
    setIsLoading(false);
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setTagInput('');
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;

    const paper: Paper = {
      id: uuidv4(),
      researcherId,
      title: form.title.trim(),
      authors: form.authors,
      abstract: form.abstract.trim() || undefined,
      journal: form.journal.trim() || undefined,
      year: form.year,
      doi: form.doi.trim() || undefined,
      pdfUrl: form.link || form.pdfUrl || undefined,
      tags: form.tags,
      researchField: form.researchField,
      citationCount: form.citationCount,
      coAuthorIds: [],
      status: form.status,
      isFeatured: form.isFeatured,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    onSubmit(paper);
  };

  // Step 1: 링크 입력
  if (step === 'link') {
    return (
      <div className="space-y-5">
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0EA5E9]/10 flex items-center justify-center mx-auto mb-3">
            <Link2 size={24} className="text-[#0EA5E9]" />
          </div>
          <h3 className="text-lg font-bold text-[#F0F6FC]">논문 링크 등록</h3>
          <p className="text-sm text-[#8B949E] mt-1">
            논문 링크를 붙여넣으세요. DOI 링크면 자동으로 정보를 가져옵니다.
          </p>
        </div>

        <div>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://doi.org/10.1234/... 또는 논문 URL"
            className="w-full px-4 py-3.5 rounded-xl bg-[#252525] border border-[#30363D] text-[#F0F6FC] text-sm focus:outline-none focus:border-[#0EA5E9] placeholder:text-[#484F58]"
            onKeyDown={(e) => e.key === 'Enter' && handleLinkSubmit()}
            autoFocus
          />
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#252525] text-[#484F58]">DOI 링크</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#252525] text-[#484F58]">Google Scholar</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#252525] text-[#484F58]">arXiv</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#252525] text-[#484F58]">직접 URL</span>
          </div>
        </div>

        {error && <p className="text-xs text-[#F85149]">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-[#252525] text-[#8B949E] font-medium text-sm">
            취소
          </button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleLinkSubmit}
            disabled={!link.trim() || isLoading}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] text-white font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <><Loader2 size={16} className="animate-spin" /> 조회 중...</>
            ) : (
              <><Sparkles size={16} /> 다음</>
            )}
          </motion.button>
        </div>

        {/* 링크 없이 직접 입력 */}
        <button
          onClick={() => setStep('detail')}
          className="w-full text-center text-xs text-[#484F58] hover:text-[#8B949E] transition-colors py-2"
        >
          링크 없이 직접 입력하기
        </button>
      </div>
    );
  }

  // Step 2: 상세 정보 (자동 채워진 상태 또는 수동)
  return (
    <div className="space-y-4">
      {/* 자동 조회 성공 표시 */}
      {form.doi && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#3FB950]/10 border border-[#3FB950]/20">
          <Sparkles size={14} className="text-[#3FB950]" />
          <span className="text-xs text-[#3FB950]">DOI에서 논문 정보를 자동으로 가져왔습니다</span>
        </div>
      )}

      {/* 링크 표시 */}
      {form.link && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#252525] border border-[#30363D]">
          <Link2 size={12} className="text-[#0EA5E9] flex-shrink-0" />
          <span className="text-xs text-[#8B949E] truncate">{form.link}</span>
        </div>
      )}

      {/* Title */}
      <div>
        <label className="text-xs font-medium text-[#8B949E] mb-1 block">논문 제목 *</label>
        <input
          value={form.title}
          onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
          placeholder="논문 제목"
          className="w-full px-3 py-2.5 rounded-lg bg-[#252525] border border-[#30363D] text-[#F0F6FC] text-sm focus:outline-none focus:border-[#0EA5E9]"
          style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
        />
      </div>

      {/* Authors (read-only if auto-filled, or editable) */}
      {form.authors.length > 0 && (
        <div>
          <label className="text-xs font-medium text-[#8B949E] mb-1 block">저자</label>
          <p className="text-sm text-[#F0F6FC]">
            {form.authors.map(a => a.name).join(', ')}
          </p>
        </div>
      )}

      {/* Journal + Year */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-medium text-[#8B949E] mb-1 block">학술지/학회</label>
          <input
            value={form.journal}
            onChange={(e) => setForm(prev => ({ ...prev, journal: e.target.value }))}
            placeholder="Nature, NeurIPS..."
            className="w-full px-3 py-2.5 rounded-lg bg-[#252525] border border-[#30363D] text-[#F0F6FC] text-sm focus:outline-none focus:border-[#0EA5E9]"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[#8B949E] mb-1 block">연도</label>
          <input
            type="number"
            value={form.year}
            onChange={(e) => setForm(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
            className="w-full px-3 py-2.5 rounded-lg bg-[#252525] border border-[#30363D] text-[#F0F6FC] text-sm focus:outline-none focus:border-[#0EA5E9]"
          />
        </div>
      </div>

      {/* Research Field */}
      <div>
        <label className="text-xs font-medium text-[#8B949E] mb-1 block">연구 분야</label>
        <select
          value={form.researchField}
          onChange={(e) => setForm(prev => ({ ...prev, researchField: e.target.value as ResearchField }))}
          className="w-full px-3 py-2.5 rounded-lg bg-[#252525] border border-[#30363D] text-[#F0F6FC] text-sm focus:outline-none focus:border-[#0EA5E9]"
        >
          {Object.entries(FIELD_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Tags */}
      <div>
        <label className="text-xs font-medium text-[#8B949E] mb-1 block">태그 (선택)</label>
        {form.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {form.tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#1E1E1E] text-xs text-[#8B949E]">
                {tag}
                <button onClick={() => setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))}><X size={10} /></button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="태그 추가"
            className="flex-1 px-3 py-2 rounded-lg bg-[#252525] border border-[#30363D] text-[#F0F6FC] text-xs focus:outline-none focus:border-[#0EA5E9]"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          />
          <button onClick={addTag} className="px-2 rounded-lg bg-[#1E1E1E] text-[#8B949E] hover:text-[#0EA5E9]">
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button onClick={() => setStep('link')} className="flex-1 py-3 rounded-xl bg-[#252525] text-[#8B949E] font-medium text-sm">
          이전
        </button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={!form.title.trim()}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] text-white font-medium text-sm disabled:opacity-50"
        >
          등록 완료
        </motion.button>
      </div>
    </div>
  );
}
