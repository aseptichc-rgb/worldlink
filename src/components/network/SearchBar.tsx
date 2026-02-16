'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Hash, User, Building, ArrowRight, StickyNote, Sparkles, Loader2 } from 'lucide-react';
import { useNetworkStore } from '@/store/networkStore';
import { useAuthStore } from '@/store/authStore';
import { useMemoStore } from '@/store/memoStore';
import { Avatar, Tag } from '@/components/ui';
import { demoUsers, demoConnections, findDemoConnectionPath, getDemoCompatibleId, ensureUserInDemoNetwork } from '@/lib/demo-data';
import { NetworkNode } from '@/types';
import { auth } from '@/lib/firebase';

const popularKeywords = [
  '스타트업', 'AI', '투자', '마케팅', '개발', 'SaaS', 'B2B', '디자인'
];

interface AiResult {
  memberId: string;
  relevanceScore: number;
  reason: string;
  traits: string[];
}

interface AiSearchResponse {
  summary: string;
  results: AiResult[];
}

interface PersonResult {
  id: string;
  name: string;
  company: string;
  position: string;
  profileImage?: string;
  keywords: string[];
  degree: number; // 연결 단계
  path: string[]; // 연결 경로
  memoMatch?: string; // 메모 검색 일치 내용
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [keywordSuggestions, setKeywordSuggestions] = useState<string[]>([]);
  const [personResults, setPersonResults] = useState<PersonResult[]>([]);
  const [aiResponse, setAiResponse] = useState<AiSearchResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const aiAbortRef = useRef<AbortController | null>(null);

  const {
    nodes,
    highlightedKeyword,
    setHighlightedKeyword,
    setSelectedNode,
    setFocusedNodeId,
  } = useNetworkStore();

  const { user: currentUser } = useAuthStore();
  const { memos } = useMemoStore();

  // 현재 사용자 ID
  const currentUserId = useMemo(() => {
    if (!currentUser) return 'member_1';
    const demoId = getDemoCompatibleId(currentUser);
    if (demoId !== currentUser.id) return demoId;
    ensureUserInDemoNetwork(currentUser.id);
    return currentUser.id;
  }, [currentUser]);

  // BFS로 연결된 사용자 + 전체 공개 사용자 검색
  const searchConnectedPeople = useMemo(() => {
    return (searchQuery: string): PersonResult[] => {
      if (!searchQuery || searchQuery.length < 1) return [];

      const queryWords = searchQuery.toLowerCase().split(/\s+/).filter(w => w.length > 0);
      if (queryWords.length === 0) return [];
      const results: PersonResult[] = [];
      const visited = new Set<string>();

      // BFS로 연결된 사람들 탐색 (최대 3단계까지)
      const MAX_BFS_DEGREE = 3;
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
            // 이름, 회사, 직책, 키워드로 검색 (각 단어를 OR로 매칭)
            const nameMatch = queryWords.some(w => user.name.toLowerCase().includes(w));
            const companyMatch = queryWords.some(w => user.company?.toLowerCase().includes(w)) ?? false;
            const positionMatch = queryWords.some(w => user.position?.toLowerCase().includes(w)) ?? false;
            const keywordMatch = user.keywords.some(k => queryWords.some(w => k.toLowerCase().includes(w)));

            // 메모 검색 (나만의 메모)
            const userMemo = memos[userId];
            const memoMatch = queryWords.some(w => userMemo?.content.toLowerCase().includes(w));
            const memoMatchContent = memoMatch ? userMemo.content : undefined;

            if (nameMatch || companyMatch || positionMatch || keywordMatch || memoMatch) {
              results.push({
                id: user.id,
                name: user.name,
                company: user.company ?? "",
                position: user.position ?? "",
                profileImage: user.profileImage,
                keywords: user.keywords,
                degree: degree,
                path: path,
                memoMatch: memoMatchContent,
              });
            }
          }
        }

        // 연결된 사람들 큐에 추가 (깊이 제한)
        if (degree < MAX_BFS_DEGREE) {
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
      }

      // 전체 공개 설정한 사용자 중 키워드 매칭되는 사람 추가 검색
      // (아직 결과에 없고, allowProfileDiscovery가 true인 경우)
      for (const user of demoUsers) {
        if (visited.has(user.id) || user.id === currentUserId) continue;

        // 전체 공개 설정 확인
        if (!user.privacySettings?.allowProfileDiscovery) continue;

        // 키워드 매칭 검색 (이름, 회사, 직책, 키워드 - 각 단어 OR 매칭)
        const nameMatch = queryWords.some(w => user.name.toLowerCase().includes(w));
        const companyMatch = queryWords.some(w => user.company?.toLowerCase().includes(w)) ?? false;
        const positionMatch = queryWords.some(w => user.position?.toLowerCase().includes(w)) ?? false;
        const keywordMatch = user.keywords.some(k => queryWords.some(w => k.toLowerCase().includes(w)));

        if (nameMatch || companyMatch || positionMatch || keywordMatch) {
          results.push({
            id: user.id,
            name: user.name,
            company: user.company ?? "",
            position: user.position ?? "",
            profileImage: user.profileImage,
            keywords: user.keywords,
            degree: -1, // 연결되지 않은 전체 공개 사용자 표시
            path: [],
          });
        }
      }

      // 연결 단계 순으로 정렬 (전체 공개 사용자는 마지막에)
      return results.sort((a, b) => {
        // -1(전체 공개)은 맨 뒤로
        if (a.degree === -1 && b.degree !== -1) return 1;
        if (a.degree !== -1 && b.degree === -1) return -1;
        return a.degree - b.degree;
      }).slice(0, 10);
    };
  }, [currentUserId, memos]);

  // 검색어 변경 시 결과 업데이트
  useEffect(() => {
    if (query && query.length >= 1) {
      // 키워드 검색 (각 단어 OR 매칭)
      const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
      const allKeywords = new Set<string>();
      nodes.forEach(node => {
        node.keywords.forEach(k => {
          if (queryWords.some(w => k.toLowerCase().includes(w))) {
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

  const triggerAiSearch = useCallback(async (searchQuery: string) => {
    if (aiAbortRef.current) aiAbortRef.current.abort();
    const controller = new AbortController();
    aiAbortRef.current = controller;

    setAiLoading(true);
    setAiResponse(null);

    const members = demoUsers.map(u => ({
      id: u.id,
      name: u.name,
      company: u.company || '',
      position: u.position || '',
      bio: u.bio || '',
      keywords: u.keywords,
      category: u.category || '',
    }));

    try {
      const idToken = await auth?.currentUser?.getIdToken();
      const res = await fetch('/api/ai-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ query: searchQuery, members }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error('AI search failed');
      const data: AiSearchResponse = await res.json();
      setAiResponse(data);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('AI search error:', err);
      }
    } finally {
      setAiLoading(false);
    }
  }, []);

  // 로컬 검색 결과가 없을 때 AI 검색 자동 트리거 (디바운스 800ms)
  useEffect(() => {
    if (query && query.length >= 2 && personResults.length === 0 && keywordSuggestions.length === 0 && !aiLoading && !aiResponse) {
      const timer = setTimeout(() => {
        triggerAiSearch(query);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [query, personResults.length, keywordSuggestions.length, aiLoading, aiResponse, triggerAiSearch]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => { aiAbortRef.current?.abort(); };
  }, []);

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
      // 그래프에 없으면 (2촌 이상 또는 전체 공개) 새 노드 객체 생성해서 표시
      // degree가 -1인 경우 (전체 공개)는 99로 설정하여 연결되지 않음을 표시
      const displayDegree = person.degree === -1 ? 99 : person.degree;
      const newNode: NetworkNode = {
        id: person.id,
        name: person.degree === -1 ? `${person.name[0]}*님` : person.name,
        company: person.company,
        position: person.position,
        profileImage: person.degree === -1 ? undefined : person.profileImage,
        keywords: person.keywords,
        degree: displayDegree,
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
    setAiResponse(null);
    setAiLoading(false);
    if (aiAbortRef.current) aiAbortRef.current.abort();
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
        bg-[#161B22]/90 backdrop-blur-xl
        border rounded-xl
        transition-all duration-300 ease-out
        ${isFocused
          ? 'border-[#58A6FF]/60 shadow-[0_0_20px_rgba(0,229,255,0.15)]'
          : 'border-[#30363D]/80 hover:border-[#30363D]'}
      `}>
        {/* Search Icon */}
        <div className={`
          pl-4 transition-colors duration-200
          ${isFocused ? 'text-[#58A6FF]' : 'text-[#484F58]'}
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
              // AI 검색 트리거 (자연어 질문)
              triggerAiSearch(query);
              if (personResults.length > 0) {
                // 기존 검색 결과가 있으면 선택하지 않고 AI 결과를 기다림
              } else if (keywordSuggestions.length > 0) {
                handleKeywordSearch(keywordSuggestions[0]);
              }
            }
          }}
          placeholder="AI에게 인맥 추천을 요청해보세요"
          className="
            flex-1 bg-transparent text-white
            py-3 pr-4
            text-base font-medium
            placeholder:text-[#484F58]
            focus:outline-none
            tracking-wide
          "
        />

        {/* Clear Button */}
        {(query || highlightedKeyword) && (
          <button
            onClick={clearSearch}
            className="pr-4 text-[#484F58] hover:text-[#58A6FF] transition-colors duration-200"
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
            <span className="text-sm text-[#8B949E]">필터:</span>
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
        {(isFocused || aiLoading || aiResponse) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="
              absolute top-full left-0 right-0 mt-2
              bg-[#161B22] border border-[#30363D] rounded-xl
              shadow-2xl overflow-hidden z-50
              max-h-[400px] overflow-y-auto no-scrollbar
            "
          >
            {/* AI Search Results */}
            {(aiLoading || aiResponse) && (
              <div className="p-3 border-b border-[#30363D]">
                <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-sm text-[#A78BFA] flex items-center gap-1">
                  <Sparkles size={12} />
                  AI 추천
                </p>
                {!aiLoading && aiResponse && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAiResponse(null);
                    }}
                    className="text-[#484F58] hover:text-[#A78BFA] transition-colors duration-200 p-0.5 rounded hover:bg-[#A78BFA]/10"
                    title="AI 추천 닫기"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
                {aiLoading ? (
                  <div className="flex items-center gap-2 p-3 text-[#8B949E] text-base">
                    <Loader2 size={16} className="animate-spin text-[#A78BFA]" />
                    인맥을 분석하고 있습니다...
                  </div>
                ) : aiResponse && (
                  <div>
                    <p className="text-sm text-[#C4B5FD] mb-2 px-1 bg-[#A78BFA]/10 rounded-lg py-2">
                      {aiResponse.summary}
                    </p>
                    {aiResponse.results.length === 0 ? (
                      <div className="p-3 text-center">
                        <p className="text-sm text-[#8B949E]">네트워크에서 관련 인물을 찾지 못했습니다</p>
                        <p className="text-xs text-[#484F58] mt-1">다른 키워드로 검색해보세요</p>
                      </div>
                    ) : (
                    <div className="space-y-2">
                      {aiResponse.results.map((aiResult, index) => {
                        const member = demoUsers.find(u => u.id === aiResult.memberId);
                        if (!member) return null;
                        const personResult: PersonResult = {
                          id: member.id,
                          name: member.name,
                          company: member.company ?? '',
                          position: member.position ?? '',
                          profileImage: member.profileImage,
                          keywords: member.keywords,
                          degree: 1,
                          path: [currentUserId, member.id],
                        };
                        const score = aiResult.relevanceScore ?? 50;
                        const scoreColor = score >= 80 ? '#A78BFA' : score >= 60 ? '#8B5CF6' : '#6D28D9';
                        return (
                          <button
                            key={aiResult.memberId}
                            onClick={() => handlePersonSelect(personResult)}
                            className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-[#1C2333] transition-colors text-left"
                          >
                            {/* 순위 번호 */}
                            <div className="flex flex-col items-center gap-1 pt-0.5">
                              <span className="text-[10px] font-bold text-[#A78BFA] bg-[#A78BFA]/15 w-5 h-5 rounded-full flex items-center justify-center">
                                {index + 1}
                              </span>
                            </div>
                            <Avatar
                              src={member.profileImage}
                              name={member.name}
                              size="sm"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium truncate">
                                  {member.name}
                                </span>
                                {/* 관련성 점수 */}
                                <span
                                  className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                  style={{ backgroundColor: `${scoreColor}20`, color: scoreColor }}
                                >
                                  관련도 {score}%
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-[#8B949E]">
                                <Building size={10} />
                                <span className="truncate">{member.company}</span>
                                <span className="mx-1">·</span>
                                <span className="truncate">{member.position}</span>
                              </div>
                              {/* 추천 이유 박스 */}
                              <div className="mt-2 p-2 bg-[#A78BFA]/5 border border-[#A78BFA]/15 rounded-lg">
                                <p className="text-xs font-medium text-[#A78BFA] mb-1 flex items-center gap-1">
                                  <Sparkles size={10} />
                                  추천 이유
                                </p>
                                <p className="text-sm text-[#E2D9F3] leading-relaxed">
                                  {aiResult.reason}
                                </p>
                              </div>
                              {aiResult.traits && aiResult.traits.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {aiResult.traits.map((trait, i) => (
                                    <span
                                      key={i}
                                      className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#A78BFA]/10 text-[#A78BFA]/80 border border-[#A78BFA]/20"
                                    >
                                      {trait}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Person Results */}
            {personResults.length > 0 && (
              <div className="p-3 border-b border-[#30363D]">
                <p className="text-sm text-[#8B949E] mb-2 px-1 flex items-center gap-1">
                  <User size={12} />
                  인물 검색 결과
                </p>
                <div className="space-y-1">
                  {personResults.map((person) => (
                    <button
                      key={person.id}
                      onClick={() => handlePersonSelect(person)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#1C2333] transition-colors text-left"
                    >
                      <Avatar
                        src={person.degree === -1 ? undefined : person.profileImage}
                        name={person.name}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium truncate">
                            {person.degree === -1 ? `${person.name[0]}*님` : person.name}
                          </span>
                          {person.degree === -1 ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981]">
                              전체 공개
                            </span>
                          ) : (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                              person.degree === 1
                                ? 'bg-[#58A6FF]/20 text-[#58A6FF]'
                                : person.degree === 2
                                  ? 'bg-[#1F6FEB]/20 text-[#1F6FEB]'
                                  : 'bg-[#FFB800]/20 text-[#FFB800]'
                            }`}>
                              {person.degree}촌
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-[#8B949E]">
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
                        {person.degree === -1 && (
                          <div className="flex items-center gap-1 text-[10px] text-[#10B981] mt-0.5">
                            <span>키워드 매칭으로 검색됨</span>
                          </div>
                        )}
                        {person.memoMatch && (
                          <div className="flex items-center gap-1 text-[10px] text-[#1F6FEB] mt-0.5">
                            <StickyNote size={10} />
                            <span className="truncate">메모: {person.memoMatch.slice(0, 30)}{person.memoMatch.length > 30 ? '...' : ''}</span>
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
                <p className="text-sm text-[#8B949E] mb-2 px-1 flex items-center gap-1">
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
                <p className="text-sm text-[#8B949E] mb-2 px-1">인기 키워드</p>
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
            ) : personResults.length === 0 && !aiLoading && !aiResponse && (
              <div className="p-4 text-center">
                <p className="text-[#8B949E] text-base">검색 결과가 없습니다</p>
                <p className="text-[#484F58] text-sm mt-1">
                  이름, 회사, 키워드 또는 메모 내용으로 검색해보세요
                </p>
                <button
                  onClick={() => triggerAiSearch(query)}
                  className="mt-3 px-4 py-2 rounded-lg bg-[#A78BFA]/20 text-[#A78BFA] text-sm hover:bg-[#A78BFA]/30 transition-colors inline-flex items-center gap-1.5"
                >
                  <Sparkles size={14} />
                  AI에게 추천 요청하기
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
