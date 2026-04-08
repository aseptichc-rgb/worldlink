'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, X, Loader2, ExternalLink } from 'lucide-react';
import type { Paper, PaperAuthor, ResearchField } from '@/types';
import { FIELD_LABELS } from '@/lib/category-utils';
import { v4 as uuidv4 } from 'uuid';

interface PaperUploadFormProps {
  researcherId: string;
  onSubmit: (paper: Paper) => void;
  onCancel: () => void;
}

export default function PaperUploadForm({ researcherId, onSubmit, onCancel }: PaperUploadFormProps) {
  const [doi, setDoi] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [tagInput, setTagInput] = useState('');

  const [form, setForm] = useState({
    title: '',
    authors: [] as PaperAuthor[],
    abstract: '',
    journal: '',
    venue: '',
    year: new Date().getFullYear(),
    month: undefined as number | undefined,
    volume: '',
    issue: '',
    pages: '',
    doi: '',
    arxivId: '',
    pdfUrl: '',
    tags: [] as string[],
    researchField: 'other' as ResearchField,
    citationCount: 0,
    status: 'published' as Paper['status'],
    isFeatured: false,
  });

  const [authorInput, setAuthorInput] = useState({ name: '', affiliation: '' });

  // DOI lookup via CrossRef
  const handleDoiLookup = async () => {
    if (!doi.trim()) return;
    setIsLookingUp(true);
    setLookupError('');

    try {
      const res = await fetch('/api/paper-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doi: doi.trim() }),
      });
      const data = await res.json();

      if (data.success && data.data) {
        const p = data.data;
        setForm(prev => ({
          ...prev,
          title: p.title || prev.title,
          authors: (p.authors || []).map((a: { name: string; affiliation?: string }) => ({
            name: a.name,
            affiliation: a.affiliation,
          })),
          abstract: p.abstract || prev.abstract,
          journal: p.journal || prev.journal,
          year: p.year || prev.year,
          month: p.month,
          volume: p.volume || prev.volume,
          issue: p.issue || prev.issue,
          pages: p.pages || prev.pages,
          doi: p.doi || doi.trim(),
          citationCount: p.citationCount || 0,
        }));
      } else {
        setLookupError(data.error || '논문을 찾을 수 없습니다.');
      }
    } catch {
      setLookupError('조회 중 오류가 발생했습니다.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const addAuthor = () => {
    if (!authorInput.name.trim()) return;
    setForm(prev => ({
      ...prev,
      authors: [...prev.authors, { name: authorInput.name.trim(), affiliation: authorInput.affiliation.trim() || undefined }],
    }));
    setAuthorInput({ name: '', affiliation: '' });
  };

  const removeAuthor = (index: number) => {
    setForm(prev => ({
      ...prev,
      authors: prev.authors.filter((_, i) => i !== index),
    }));
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
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
      venue: form.venue.trim() || undefined,
      year: form.year,
      month: form.month,
      volume: form.volume.trim() || undefined,
      issue: form.issue.trim() || undefined,
      pages: form.pages.trim() || undefined,
      doi: form.doi.trim() || undefined,
      arxivId: form.arxivId.trim() || undefined,
      pdfUrl: form.pdfUrl.trim() || undefined,
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

  return (
    <div className="space-y-6">
      {/* DOI Lookup */}
      <div className="p-4 rounded-xl bg-[#0EA5E9]/5 border border-[#0EA5E9]/20">
        <h3 className="text-sm font-semibold text-[#0EA5E9] mb-2">DOI로 자동 입력</h3>
        <div className="flex gap-2">
          <input
            value={doi}
            onChange={(e) => setDoi(e.target.value)}
            placeholder="10.1234/example.2024"
            className="flex-1 px-3 py-2.5 rounded-lg bg-[#1E1E1E] border border-[#30363D] text-[#F0F6FC] text-sm focus:outline-none focus:border-[#0EA5E9]"
            onKeyDown={(e) => e.key === 'Enter' && handleDoiLookup()}
          />
          <button
            onClick={handleDoiLookup}
            disabled={isLookingUp || !doi.trim()}
            className="px-4 py-2.5 rounded-lg bg-[#0EA5E9] text-white text-sm font-medium disabled:opacity-50 flex items-center gap-1.5"
          >
            {isLookingUp ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            조회
          </button>
        </div>
        {lookupError && <p className="text-xs text-[#F85149] mt-2">{lookupError}</p>}
      </div>

      {/* Title */}
      <div>
        <label className="text-sm font-medium text-[#F0F6FC] mb-1.5 block">논문 제목 *</label>
        <input
          value={form.title}
          onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
          placeholder="논문 제목을 입력하세요"
          className="w-full px-3 py-2.5 rounded-lg bg-[#1E1E1E] border border-[#30363D] text-[#F0F6FC] text-sm focus:outline-none focus:border-[#0EA5E9]"
          style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
        />
      </div>

      {/* Authors */}
      <div>
        <label className="text-sm font-medium text-[#F0F6FC] mb-1.5 block">저자</label>
        {form.authors.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {form.authors.map((a, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#252525] text-xs text-[#F0F6FC]">
                {a.name}
                {a.affiliation && <span className="text-[#8B949E]">({a.affiliation})</span>}
                <button onClick={() => removeAuthor(i)} className="text-[#484F58] hover:text-[#F85149]">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={authorInput.name}
            onChange={(e) => setAuthorInput(prev => ({ ...prev, name: e.target.value }))}
            placeholder="저자명"
            className="flex-1 px-3 py-2 rounded-lg bg-[#1E1E1E] border border-[#30363D] text-[#F0F6FC] text-sm focus:outline-none focus:border-[#0EA5E9]"
          />
          <input
            value={authorInput.affiliation}
            onChange={(e) => setAuthorInput(prev => ({ ...prev, affiliation: e.target.value }))}
            placeholder="소속 (선택)"
            className="flex-1 px-3 py-2 rounded-lg bg-[#1E1E1E] border border-[#30363D] text-[#F0F6FC] text-sm focus:outline-none focus:border-[#0EA5E9]"
          />
          <button onClick={addAuthor} className="p-2 rounded-lg bg-[#252525] text-[#8B949E] hover:text-[#0EA5E9]">
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Journal/Venue + Year */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-[#F0F6FC] mb-1.5 block">학술지</label>
          <input
            value={form.journal}
            onChange={(e) => setForm(prev => ({ ...prev, journal: e.target.value }))}
            placeholder="Nature, Science..."
            className="w-full px-3 py-2.5 rounded-lg bg-[#1E1E1E] border border-[#30363D] text-[#F0F6FC] text-sm focus:outline-none focus:border-[#0EA5E9]"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-[#F0F6FC] mb-1.5 block">출판 연도</label>
          <input
            type="number"
            value={form.year}
            onChange={(e) => setForm(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
            className="w-full px-3 py-2.5 rounded-lg bg-[#1E1E1E] border border-[#30363D] text-[#F0F6FC] text-sm focus:outline-none focus:border-[#0EA5E9]"
          />
        </div>
      </div>

      {/* Abstract */}
      <div>
        <label className="text-sm font-medium text-[#F0F6FC] mb-1.5 block">초록</label>
        <textarea
          value={form.abstract}
          onChange={(e) => setForm(prev => ({ ...prev, abstract: e.target.value }))}
          placeholder="논문 초록을 입력하세요"
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg bg-[#1E1E1E] border border-[#30363D] text-[#F0F6FC] text-sm focus:outline-none focus:border-[#0EA5E9] resize-none"
        />
      </div>

      {/* Research Field + Status */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-[#F0F6FC] mb-1.5 block">연구 분야</label>
          <select
            value={form.researchField}
            onChange={(e) => setForm(prev => ({ ...prev, researchField: e.target.value as ResearchField }))}
            className="w-full px-3 py-2.5 rounded-lg bg-[#1E1E1E] border border-[#30363D] text-[#F0F6FC] text-sm focus:outline-none focus:border-[#0EA5E9]"
          >
            {Object.entries(FIELD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-[#F0F6FC] mb-1.5 block">상태</label>
          <select
            value={form.status}
            onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value as Paper['status'] }))}
            className="w-full px-3 py-2.5 rounded-lg bg-[#1E1E1E] border border-[#30363D] text-[#F0F6FC] text-sm focus:outline-none focus:border-[#0EA5E9]"
          >
            <option value="published">출판</option>
            <option value="preprint">프리프린트</option>
            <option value="under-review">심사 중</option>
            <option value="accepted">게재 확정</option>
            <option value="draft">초안</option>
          </select>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="text-sm font-medium text-[#F0F6FC] mb-1.5 block">태그</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {form.tags.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#252525] text-xs text-[#8B949E]">
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-[#F85149]"><X size={12} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="태그 추가"
            className="flex-1 px-3 py-2 rounded-lg bg-[#1E1E1E] border border-[#30363D] text-[#F0F6FC] text-sm focus:outline-none focus:border-[#0EA5E9]"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          />
          <button onClick={addTag} className="p-2 rounded-lg bg-[#252525] text-[#8B949E] hover:text-[#0EA5E9]">
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* PDF URL + arXiv */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-[#F0F6FC] mb-1.5 block">PDF URL</label>
          <input
            value={form.pdfUrl}
            onChange={(e) => setForm(prev => ({ ...prev, pdfUrl: e.target.value }))}
            placeholder="https://..."
            className="w-full px-3 py-2.5 rounded-lg bg-[#1E1E1E] border border-[#30363D] text-[#F0F6FC] text-sm focus:outline-none focus:border-[#0EA5E9]"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-[#F0F6FC] mb-1.5 block">arXiv ID</label>
          <input
            value={form.arxivId}
            onChange={(e) => setForm(prev => ({ ...prev, arxivId: e.target.value }))}
            placeholder="2301.12345"
            className="w-full px-3 py-2.5 rounded-lg bg-[#1E1E1E] border border-[#30363D] text-[#F0F6FC] text-sm focus:outline-none focus:border-[#0EA5E9]"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl bg-[#252525] text-[#8B949E] font-medium text-sm"
        >
          취소
        </button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={!form.title.trim()}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] text-white font-medium text-sm disabled:opacity-50"
        >
          논문 등록
        </motion.button>
      </div>
    </div>
  );
}
