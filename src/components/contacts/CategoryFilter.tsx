'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ContactCategory, CATEGORY_INFO, CategoryStats } from '@/types/contacts';

interface CategoryFilterProps {
  stats: CategoryStats[];
  selectedCategory: ContactCategory | 'all';
  onSelectCategory: (category: ContactCategory | 'all') => void;
}

export default function CategoryFilter({
  stats,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Scroll to selected category
  useEffect(() => {
    if (selectedRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const element = selectedRef.current;
      const containerWidth = container.offsetWidth;
      const elementLeft = element.offsetLeft;
      const elementWidth = element.offsetWidth;

      container.scrollTo({
        left: elementLeft - containerWidth / 2 + elementWidth / 2,
        behavior: 'smooth',
      });
    }
  }, [selectedCategory]);

  const totalCount = stats.reduce((sum, s) => sum + s.count, 0);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {/* All Category */}
      <button
        ref={selectedCategory === 'all' ? selectedRef : null}
        onClick={() => onSelectCategory('all')}
        className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
          selectedCategory === 'all'
            ? 'bg-white text-black'
            : 'bg-[#21262D] text-[#8B949E] hover:bg-[#30363D] hover:text-white'
        }`}
      >
        <span className="text-sm">전체</span>
        <span
          className={`text-xs px-1.5 py-0.5 rounded-full ${
            selectedCategory === 'all' ? 'bg-black/10' : 'bg-[#30363D]'
          }`}
        >
          {totalCount}
        </span>
      </button>

      {/* Category Buttons */}
      {stats.map((stat) => {
        const info = CATEGORY_INFO[stat.category];
        const isSelected = selectedCategory === stat.category;

        return (
          <button
            key={stat.category}
            ref={isSelected ? selectedRef : null}
            onClick={() => onSelectCategory(stat.category)}
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full transition-all`}
            style={{
              backgroundColor: isSelected ? info.color : '#21262D',
              color: isSelected ? 'white' : info.color,
            }}
          >
            <span className="text-base">{info.icon}</span>
            <span className="text-sm whitespace-nowrap">{info.name}</span>
            <span
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : info.bgColor,
              }}
            >
              {stat.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
