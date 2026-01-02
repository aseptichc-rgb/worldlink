'use client';

import { CATEGORY_COLORS } from '@/types';

interface SidebarProps {
  categories: string[];
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  memberCount: number;
  filteredCount: number;
}

const MAIN_CATEGORIES = [
  '의료기기/솔루션',
  '투자/법률/특허',
  '제약/바이오',
  '의료기관',
  '기타',
];

export default function Sidebar({
  categories,
  selectedCategories,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  memberCount,
  filteredCount,
}: SidebarProps) {
  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoryChange(selectedCategories.filter(c => c !== category));
    } else {
      onCategoryChange([...selectedCategories, category]);
    }
  };

  const handleSelectAll = () => {
    onCategoryChange([]);
  };

  return (
    <div className="w-[280px] h-screen bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white mb-1">LinkFlow</h1>
        <p className="text-sm text-gray-400">헬스케어 인사이트 네트워크</p>
      </div>

      {/* 검색바 */}
      <div className="p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="이름 또는 소속 검색..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <svg
            className="absolute right-3 top-3.5 w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            카테고리
          </h2>
          <button
            onClick={handleSelectAll}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            전체 선택
          </button>
        </div>

        <div className="space-y-2">
          {MAIN_CATEGORIES.map((category) => {
            const color = CATEGORY_COLORS[category] || '#6B7280';
            const isSelected = selectedCategories.length === 0 || selectedCategories.includes(category);
            const count = categories.filter(c => c.includes(category) || category.includes(c.split('/')[0])).length;

            return (
              <button
                key={category}
                onClick={() => handleCategoryToggle(category)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isSelected
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-900 text-gray-500 hover:bg-gray-800/50'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color, opacity: isSelected ? 1 : 0.4 }}
                />
                <span className="flex-1 text-left text-sm">{category}</span>
                {isSelected && (
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 푸터 통계 */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">표시 중</span>
          <span className="text-white font-medium">
            {filteredCount} / {memberCount}명
          </span>
        </div>
      </div>
    </div>
  );
}
