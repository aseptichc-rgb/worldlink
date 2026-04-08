'use client';

import { motion } from 'framer-motion';
import { Star, ExternalLink, FileText, Quote } from 'lucide-react';
import type { Paper } from '@/types';
import { getCategoryColor, getFieldLabel } from '@/lib/category-utils';

interface PaperCardProps {
  paper: Paper;
  onToggleFeatured?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: () => void;
  showActions?: boolean;
  compact?: boolean;
}

export default function PaperCard({ paper, onToggleFeatured, onDelete, onClick, showActions = false, compact = false }: PaperCardProps) {
  const fieldColor = getCategoryColor(paper.researchField);
  const fieldLabel = getFieldLabel(paper.researchField);

  const statusLabels: Record<string, { label: string; color: string }> = {
    'published': { label: '출판', color: '#3FB950' },
    'preprint': { label: '프리프린트', color: '#F59E0B' },
    'under-review': { label: '심사 중', color: '#0EA5E9' },
    'accepted': { label: '게재 확정', color: '#A371F7' },
    'draft': { label: '초안', color: '#8B949E' },
  };

  const status = statusLabels[paper.status] || statusLabels['draft'];

  // Format authors: highlight platform users
  const authorText = paper.authors
    .map(a => a.name)
    .join(', ');

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`relative p-4 rounded-xl bg-[#1E1E1E] border border-[#30363D] hover:border-[#0EA5E9]/30 transition-all ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Featured star */}
      {paper.isFeatured && (
        <div className="absolute top-3 right-3">
          <Star size={16} className="text-[#F59E0B] fill-[#F59E0B]" />
        </div>
      )}

      {/* Title */}
      <h3 className={`font-semibold text-[#F0F6FC] leading-snug ${compact ? 'text-sm line-clamp-2' : 'text-base line-clamp-3'}`}
        style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
      >
        {paper.title}
      </h3>

      {/* Authors */}
      <p className={`text-[#8B949E] mt-1.5 ${compact ? 'text-xs line-clamp-1' : 'text-sm line-clamp-2'}`}>
        {authorText}
      </p>

      {/* Journal/Venue + Year */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {(paper.journal || paper.venue) && (
          <span className="text-xs text-[#8B949E] italic">
            {paper.journal || paper.venue}
          </span>
        )}
        <span className="text-xs text-[#484F58]">{paper.year}</span>
        {paper.volume && (
          <span className="text-xs text-[#484F58]">Vol. {paper.volume}</span>
        )}
      </div>

      {/* Bottom row: citations, status, field, tags */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {/* Citation count */}
        {paper.citationCount != null && paper.citationCount > 0 && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F59E0B]/10 text-[#F59E0B]">
            <Quote size={10} />
            <span className="text-xs font-medium">{paper.citationCount}</span>
          </div>
        )}

        {/* Status badge */}
        <span
          className="text-xs px-2 py-0.5 rounded-md font-medium"
          style={{ backgroundColor: `${status.color}15`, color: status.color }}
        >
          {status.label}
        </span>

        {/* Research field */}
        <span
          className="text-xs px-2 py-0.5 rounded-md"
          style={{ backgroundColor: `${fieldColor}15`, color: fieldColor }}
        >
          {fieldLabel}
        </span>

        {/* 논문 링크 (DOI 우선, 없으면 pdfUrl) */}
        {(paper.doi || paper.pdfUrl) && (
          <a
            href={paper.doi ? `https://doi.org/${paper.doi}` : paper.pdfUrl!}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="ml-auto flex items-center gap-1 text-xs text-[#0EA5E9] hover:text-[#0EA5E9]/80 transition-colors"
          >
            <ExternalLink size={12} />
            <span>논문 보기</span>
          </a>
        )}

        {/* 별도 PDF 링크 (DOI와 pdfUrl 둘 다 있을 때만) */}
        {paper.doi && paper.pdfUrl && paper.pdfUrl !== `https://doi.org/${paper.doi}` && (
          <a
            href={paper.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[#8B949E] hover:text-[#F85149] transition-colors"
          >
            <FileText size={14} />
          </a>
        )}
      </div>

      {/* Tags */}
      {!compact && paper.tags.length > 0 && (
        <div className="flex gap-1.5 mt-2.5 flex-wrap">
          {paper.tags.slice(0, 4).map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded bg-[#252525] text-[#8B949E]">
              {tag}
            </span>
          ))}
          {paper.tags.length > 4 && (
            <span className="text-xs text-[#484F58]">+{paper.tags.length - 4}</span>
          )}
        </div>
      )}

      {/* Action buttons */}
      {showActions && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-[#30363D]">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFeatured?.(paper.id); }}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${paper.isFeatured ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 'bg-[#252525] text-[#8B949E] hover:text-[#F59E0B]'}`}
          >
            <Star size={12} className={`inline mr-1 ${paper.isFeatured ? 'fill-current' : ''}`} />
            {paper.isFeatured ? '대표 논문' : '대표 설정'}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(paper.id); }}
            className="text-xs px-3 py-1.5 rounded-lg bg-[#252525] text-[#8B949E] hover:text-[#F85149] transition-colors ml-auto"
          >
            삭제
          </button>
        </div>
      )}
    </motion.div>
  );
}
