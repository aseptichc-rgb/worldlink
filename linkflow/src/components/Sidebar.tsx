'use client';

interface SidebarProps {
  categories: string[];
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  memberCount: number;
  filteredCount: number;
  isOpen: boolean;
  onToggle: () => void;
}

const MAIN_CATEGORIES = [
  { name: '의료기기', color: '#3B82F6' },
  { name: '솔루션', color: '#06B6D4' },
  { name: '투자', color: '#EF4444' },
  { name: '법률', color: '#F97316' },
  { name: '특허', color: '#FB923C' },
  { name: '제약', color: '#8B5CF6' },
  { name: '바이오', color: '#A855F7' },
  { name: '의료기관', color: '#10B981' },
  { name: '비즈니스', color: '#F59E0B' },
];

export default function Sidebar({
  categories,
  selectedCategories,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  memberCount,
  filteredCount,
  isOpen,
  onToggle,
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
    <>
      {/* 모바일 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* 사이드바 */}
      <div
        className={`
          fixed md:relative z-50 md:z-auto
          w-[280px] h-screen bg-gray-900 border-r border-gray-800 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* 모바일 닫기 버튼 */}
        <button
          onClick={onToggle}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white md:hidden"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 헤더 */}
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold text-white mb-1">LinkFlow</h1>
          <p className="text-sm text-gray-400">원우들의 인맥을 시각화해서 새로운 기회를 발견해보세요</p>
        </div>

        {/* 검색바 */}
        <div className="p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="이름, 소속, 직책, 태그 검색..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              spellCheck={false}
              autoComplete="off"
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
            {MAIN_CATEGORIES.map((cat) => {
              const isSelected = selectedCategories.length === 0 || selectedCategories.includes(cat.name);

              return (
                <button
                  key={cat.name}
                  onClick={() => handleCategoryToggle(cat.name)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isSelected
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-900 text-gray-500 hover:bg-gray-800/50'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color, opacity: isSelected ? 1 : 0.4 }}
                  />
                  <span className="flex-1 text-left text-sm">{cat.name}</span>
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
          <div className="flex justify-between text-sm mb-3">
            <span className="text-gray-500">표시 중</span>
            <span className="text-white font-medium">
              {filteredCount} / {memberCount}명
            </span>
          </div>
          <a
            href="/admin"
            className="block w-full py-2 px-3 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-center text-sm rounded-lg transition-colors"
          >
            관리자 페이지
          </a>
        </div>
      </div>
    </>
  );
}
