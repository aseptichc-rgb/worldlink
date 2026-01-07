'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Hash } from 'lucide-react';
import { useNetworkStore } from '@/store/networkStore';
import { Tag } from '@/components/ui';

const popularKeywords = [
  '스타트업', 'AI', '투자', '마케팅', '개발', 'SaaS', 'B2B', '디자인'
];

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    nodes,
    highlightedKeyword,
    setHighlightedKeyword,
    setSelectedNode,
  } = useNetworkStore();

  // Get unique keywords from all nodes
  useEffect(() => {
    if (query) {
      const allKeywords = new Set<string>();
      nodes.forEach(node => {
        node.keywords.forEach(k => {
          if (k.toLowerCase().includes(query.toLowerCase())) {
            allKeywords.add(k);
          }
        });
      });
      setSuggestions(Array.from(allKeywords).slice(0, 6));
    } else {
      setSuggestions([]);
    }
  }, [query, nodes]);

  const handleSearch = (keyword: string) => {
    setHighlightedKeyword(keyword);
    setQuery('');
    setIsFocused(false);
  };

  const clearSearch = () => {
    setQuery('');
    setHighlightedKeyword(null);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full max-w-md">
      {/* Search Input */}
      <div className={`
        relative flex items-center
        bg-[rgba(13,17,23,0.8)] backdrop-blur-xl
        border rounded-2xl
        transition-all duration-300
        ${isFocused ? 'border-[#00E5FF] shadow-[0_0_0_3px_rgba(0,229,255,0.15)]' : 'border-[#21262D]'}
      `}>
        <Search
          size={18}
          className={`absolute left-4 transition-colors ${isFocused ? 'text-[#00E5FF]' : 'text-[#484F58]'}`}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query) {
              handleSearch(query);
            }
          }}
          placeholder="키워드로 인맥 검색 (예: #투자, #마케팅)"
          className="
            w-full bg-transparent text-white
            py-3 pl-11 pr-10
            text-sm
            placeholder:text-[#484F58]
            focus:outline-none
          "
        />
        {(query || highlightedKeyword) && (
          <button
            onClick={clearSearch}
            className="absolute right-4 text-[#484F58] hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Active Filter */}
      <AnimatePresence>
        {highlightedKeyword && !isFocused && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 flex items-center gap-2"
          >
            <span className="text-xs text-[#8B949E]">필터:</span>
            <Tag
              label={highlightedKeyword}
              isActive
              onRemove={() => setHighlightedKeyword(null)}
              size="sm"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="
              absolute top-full left-0 right-0 mt-2
              bg-[#0D1117] border border-[#21262D] rounded-xl
              shadow-2xl overflow-hidden z-50
            "
          >
            {suggestions.length > 0 ? (
              <div className="p-3">
                <p className="text-xs text-[#8B949E] mb-2 px-1">검색 결과</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((keyword) => (
                    <button
                      key={keyword}
                      onClick={() => handleSearch(keyword)}
                      className="tag hover:tag-highlight"
                    >
                      <Hash size={12} />
                      {keyword}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3">
                <p className="text-xs text-[#8B949E] mb-2 px-1">인기 키워드</p>
                <div className="flex flex-wrap gap-2">
                  {popularKeywords.map((keyword) => (
                    <button
                      key={keyword}
                      onClick={() => handleSearch(keyword)}
                      className="tag hover:tag-highlight"
                    >
                      <Hash size={12} />
                      {keyword}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
