'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Hash, User, Building, ArrowRight } from 'lucide-react';
import { useNetworkStore } from '@/store/networkStore';
import { useAuthStore } from '@/store/authStore';
import { Avatar, Tag } from '@/components/ui';
import { demoUsers, demoConnections, findDemoConnectionPath } from '@/lib/demo-data';
import { NetworkNode } from '@/types';

const popularKeywords = [
  '스타트업', 'AI', '투자', '마케팅', '개발', 'SaaS', 'B2B', '디자인'
];

interface PersonResult {
  id: string;
  name: string;
  company: string;
  position: string;
  profileImage?: string;
  keywords: string[];
  degree: number; // 연결 단계
  path: string[]; // 연결 경로
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [keywordSuggestions, setKeywordSuggestions] = useState<string[]>([]);
  const [personResults, setPersonResults] = useState<PersonResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    nodes,
    highlightedKeyword,
    setHighlightedKeyword,
    setSelectedNode,
    setFocusedNodeId,
  } = useNetworkStore();

  const { user: currentUser } = useAuthStore();

  // 현재 사용자 ID
  const currentUserId = useMemo(() => {
    if (!currentUser) return 'demo-user-1';
    return currentUser.id.startsWith('demo-user-') ? currentUser.id : 'demo-user-1';
  }, [currentUser]);

  // BFS로 연결 가능한 모든 사용자 검색
  const searchConnectedPeople = useMemo(() => {
    return (searchQuery: string): PersonResult[] => {
      if (!searchQuery || searchQuery.length < 1) return [];

      const query = searchQuery.toLowerCase();
      const results: PersonResult[] = [];
      const visited = new Set<string>();

      // BFS로 모든 연결된 사람들 탐색
      const queue: { userId: string; path: string[]; degree: number }[] = [
        { userId: currentUserId, path: [currentUserId], degree: 0 }
      ];

      while (queue.length > 0) {
        const current = queue.shift()!;
        const { userId, path, degree } = current;

        if (visited.has(userId)) continue;
        visited.add(userId);

        // 현재 사용자가 아닌 경우만 검색 결과에 포함
        if (userId !== currentUserId) {
          const user = demoUsers.find(u => u.id === userId);
          if (user) {
            // 이름, 회사, 직책, 키워드로 검색
            const nameMatch = user.name.toLowerCase().includes(query);
            const companyMatch = user.company?.toLowerCase().includes(query) ?? false;
            const positionMatch = user.position?.toLowerCase().includes(query) ?? false;
            const keywordMatch = user.keywords.some(k => k.toLowerCase().includes(query));

            if (nameMatch || companyMatch || positionMatch || keywordMatch) {
              results.push({
                id: user.id,
                name: user.name,
                company: user.company ?? "",
                position: user.position ?? "",
                profileImage: user.profileImage,
                keywords: user.keywords,
                degree: degree,
                path: path,
              });
            }
          }
        }

        // 연결된 사람들 큐에 추가
        const connections = demoConnections[userId] || [];
        for (const connId of connections) {
          if (!visited.has(connId)) {
            queue.push({
              userId: connId,
              path: [...path, connId],
              degree: degree + 1
            });
          }
        }
      }

      // 연결 단계 순으로 정렬
      return results.sort((a, b) => a.degree - b.degree).slice(0, 8);
    };
  }, [currentUserId]);

  // 검색어 변경 시 결과 업데이트
  useEffect(() => {
    if (query && query.length >= 1) {
      // 키워드 검색
      const allKeywords = new Set<string>();
      nodes.forEach(node => {
        node.keywords.forEach(k => {
          if (k.toLowerCase().includes(query.toLowerCase())) {
            allKeywords.add(k);
          }
        });
      });
      setKeywordSuggestions(Array.from(allKeywords).slice(0, 4));

      // 인물 검색 (연결된 모든 사람)
      const people = searchConnectedPeople(query);
      setPersonResults(people);
    } else {
      setKeywordSuggestions([]);
      setPersonResults([]);
    }
  }, [query, nodes, searchConnectedPeople]);

  const handleKeywordSearch = (keyword: string) => {
    setHighlightedKeyword(keyword);
    setQuery('');
    setIsFocused(false);
  };

  const handlePersonSelect = (person: PersonResult) => {
    // 노드가 현재 그래프에 있는지 확인
    const existingNode = nodes.find(n => n.id === person.id);

    if (existingNode) {
      // 그래프에 있으면 해당 노드 선택
      setSelectedNode(existingNode);
      setFocusedNodeId(person.id);
    } else {
      // 그래프에 없으면 (2촌 이상) 새 노드 객체 생성해서 표시
      const newNode: NetworkNode = {
        id: person.id,
        name: person.name,
        company: person.company,
        position: person.position,
        profileImage: person.profileImage,
        keywords: person.keywords,
        degree: person.degree,
        connectionCount: demoConnections[person.id]?.length || 0,
      };
      setSelectedNode(newNode);
      // 그래프에 없으므로 포커스는 설정하지 않음
    }

    setQuery('');
    setIsFocused(false);
    setHighlightedKeyword(null);
  };

  const clearSearch = () => {
    setQuery('');
    setHighlightedKeyword(null);
    setPersonResults([]);
    inputRef.current?.focus();
  };

  // 연결 경로를 표시용 문자열로 변환
  const getPathString = (path: string[]): string => {
    if (path.length <= 2) return '';
    const middleNames = path.slice(1, -1).map(id => {
      const user = demoUsers.find(u => u.id === id);
      return user?.name.slice(0, 2) || '';
    });
    return middleNames.join(' → ');
  };

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <div className={`
        relative flex items-center gap-3
        bg-[#0D1117]/90 backdrop-blur-xl
        border rounded-xl
        transition-all duration-300 ease-out
        ${isFocused
          ? 'border-[#00E5FF]/60 shadow-[0_0_20px_rgba(0,229,255,0.15)]'
          : 'border-[#21262D]/80 hover:border-[#21262D]'}
      `}>
        {/* Search Icon */}
        <div className={`
          pl-4 transition-colors duration-200
          ${isFocused ? 'text-[#00E5FF]' : 'text-[#484F58]'}
        `}>
          <Search size={18} />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query) {
              if (personResults.length > 0) {
                handlePersonSelect(personResults[0]);
              } else if (keywordSuggestions.length > 0) {
                handleKeywordSearch(keywordSuggestions[0]);
              } else {
                handleKeywordSearch(query);
              }
            }
          }}
          placeholder="이름, 회사, 키워드로 검색"
          className="
            flex-1 bg-transparent text-white
            py-3 pr-4
            text-sm font-medium
            placeholder:text-[#6E7681]
            focus:outline-none
            tracking-wide
          "
        />

        {/* Clear Button */}
        {(query || highlightedKeyword) && (
          <button
            onClick={clearSearch}
            className="pr-4 text-[#484F58] hover:text-[#00E5FF] transition-colors duration-200"
          >
            <X size={16} />
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

      {/* Search Results Dropdown */}
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
              max-h-[400px] overflow-y-auto no-scrollbar
            "
          >
            {/* Person Results */}
            {personResults.length > 0 && (
              <div className="p-3 border-b border-[#21262D]">
                <p className="text-xs text-[#8B949E] mb-2 px-1 flex items-center gap-1">
                  <User size={12} />
                  인물 검색 결과
                </p>
                <div className="space-y-1">
                  {personResults.map((person) => (
                    <button
                      key={person.id}
                      onClick={() => handlePersonSelect(person)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#161B22] transition-colors text-left"
                    >
                      <Avatar
                        src={person.profileImage}
                        name={person.name}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium truncate">
                            {person.name}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            person.degree === 1
                              ? 'bg-[#00E5FF]/20 text-[#00E5FF]'
                              : person.degree === 2
                                ? 'bg-[#7C4DFF]/20 text-[#7C4DFF]'
                                : 'bg-[#FFB800]/20 text-[#FFB800]'
                          }`}>
                            {person.degree}촌
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-[#8B949E]">
                          <Building size={10} />
                          <span className="truncate">{person.company}</span>
                          <span className="mx-1">·</span>
                          <span className="truncate">{person.position}</span>
                        </div>
                        {person.degree > 1 && person.path.length > 2 && (
                          <div className="flex items-center gap-1 text-[10px] text-[#484F58] mt-0.5">
                            <ArrowRight size={10} />
                            <span>{getPathString(person.path)} 통해 연결</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Keyword Suggestions */}
            {keywordSuggestions.length > 0 ? (
              <div className="p-3">
                <p className="text-xs text-[#8B949E] mb-2 px-1 flex items-center gap-1">
                  <Hash size={12} />
                  키워드
                </p>
                <div className="flex flex-wrap gap-2">
                  {keywordSuggestions.map((keyword) => (
                    <button
                      key={keyword}
                      onClick={() => handleKeywordSearch(keyword)}
                      className="tag hover:tag-highlight"
                    >
                      <Hash size={12} />
                      {keyword}
                    </button>
                  ))}
                </div>
              </div>
            ) : !query ? (
              <div className="p-3">
                <p className="text-xs text-[#8B949E] mb-2 px-1">인기 키워드</p>
                <div className="flex flex-wrap gap-2">
                  {popularKeywords.map((keyword) => (
                    <button
                      key={keyword}
                      onClick={() => handleKeywordSearch(keyword)}
                      className="tag hover:tag-highlight"
                    >
                      <Hash size={12} />
                      {keyword}
                    </button>
                  ))}
                </div>
              </div>
            ) : personResults.length === 0 && (
              <div className="p-4 text-center">
                <p className="text-[#8B949E] text-sm">검색 결과가 없습니다</p>
                <p className="text-[#484F58] text-xs mt-1">
                  다른 이름이나 키워드로 검색해보세요
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
