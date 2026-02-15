'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Check, Users, Sparkles, Loader2 } from 'lucide-react';
import { useGroupStore } from '@/store/groupStore';
import { useNetworkStore } from '@/store/networkStore';
import { Avatar } from '@/components/ui';
import { auth } from '@/lib/firebase';
import { demoUsers } from '@/lib/demo-data';

interface AiResult {
  memberId: string;
  reason: string;
}

interface AiRecommendResponse {
  summary: string;
  results: AiResult[];
}

export default function AddMembersToGroupModal() {
  const {
    groups,
    isAddMembersModalOpen,
    detailGroupId,
    closeAddMembersModal,
    getNodesInGroup,
    addNodeToGroup,
  } = useGroupStore();

  const { nodes } = useNetworkStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [aiRecommendations, setAiRecommendations] = useState<AiRecommendResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const aiAbortRef = useRef<AbortController | null>(null);

  const group = groups.find((g) => g.id === detailGroupId);
  const existingMemberIds = detailGroupId ? new Set(getNodesInGroup(detailGroupId)) : new Set<string>();

  // 1촌 인맥만 필터링 (degree === 1)
  const availableNodes = useMemo(() => {
    return nodes.filter((n) => n.degree === 1 && !existingMemberIds.has(n.id));
  }, [nodes, existingMemberIds]);

  // AI 추천 요청
  const fetchAiRecommendations = useCallback(async () => {
    if (!group) return;

    // 로그인 상태 확인
    if (!auth?.currentUser) {
      return;
    }

    if (aiAbortRef.current) aiAbortRef.current.abort();
    const controller = new AbortController();
    aiAbortRef.current = controller;

    setAiLoading(true);
    setAiRecommendations(null);

    try {
      const idToken = await auth.currentUser.getIdToken();
      // 그룹 특성을 기반으로 추천 요청
      const groupContext = `"${group.name}" 그룹에 적합한 인맥을 추천해주세요. 이 그룹은 ${group.icon} 아이콘을 사용합니다.`;

      const res = await fetch('/api/ai-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ query: groupContext }),
        signal: controller.signal,
      });

      if (!res.ok) {
        return;
      }
      const data: AiRecommendResponse = await res.json();

      // 이미 그룹에 있는 멤버만 제외 (1촌 제한 없이 전체 추천)
      const filteredResults = data.results.filter(
        (r) => !existingMemberIds.has(r.memberId)
      );

      setAiRecommendations({
        summary: data.summary,
        results: filteredResults,
      });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        // 에러 발생 시 조용히 실패
      }
    } finally {
      setAiLoading(false);
    }
  }, [group, existingMemberIds]);

  // 모달 열릴 때 AI 추천 자동 요청
  useEffect(() => {
    if (isAddMembersModalOpen && group) {
      fetchAiRecommendations();
    }
    return () => {
      aiAbortRef.current?.abort();
    };
  }, [isAddMembersModalOpen, group?.id]);

  // 검색어로 AI 추천 요청
  const triggerAiSearchWithQuery = useCallback(async (query: string) => {
    if (!query.trim()) return;

    // 로그인 상태 확인
    if (!auth?.currentUser) {
      return;
    }

    if (aiAbortRef.current) aiAbortRef.current.abort();
    const controller = new AbortController();
    aiAbortRef.current = controller;

    setAiLoading(true);
    setAiRecommendations(null);

    try {
      const idToken = await auth.currentUser.getIdToken();

      const res = await fetch('/api/ai-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      });

      if (!res.ok) {
        return;
      }
      const data: AiRecommendResponse = await res.json();

      // 이미 그룹에 있는 멤버만 제외 (1촌 제한 없이 전체 추천)
      const filteredResults = data.results.filter(
        (r) => !existingMemberIds.has(r.memberId)
      );

      setAiRecommendations({
        summary: data.summary,
        results: filteredResults,
      });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        // 에러 발생 시 조용히 실패
      }
    } finally {
      setAiLoading(false);
    }
  }, [existingMemberIds]);

  // 검색 필터
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return availableNodes;
    const query = searchQuery.toLowerCase();
    return availableNodes.filter(
      (n) =>
        n.name.toLowerCase().includes(query) ||
        n.company?.toLowerCase().includes(query) ||
        n.position?.toLowerCase().includes(query) ||
        n.keywords.some((k) => k.toLowerCase().includes(query))
    );
  }, [availableNodes, searchQuery]);

  const handleToggleNode = (nodeId: string) => {
    setSelectedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedNodeIds.size === filteredNodes.length) {
      setSelectedNodeIds(new Set());
    } else {
      setSelectedNodeIds(new Set(filteredNodes.map((n) => n.id)));
    }
  };

  const handleAddMembers = () => {
    if (!detailGroupId) return;
    selectedNodeIds.forEach((nodeId) => {
      addNodeToGroup(nodeId, detailGroupId);
    });
    setSelectedNodeIds(new Set());
    setSearchQuery('');
    closeAddMembersModal();
  };

  const handleClose = () => {
    setSelectedNodeIds(new Set());
    setSearchQuery('');
    setAiRecommendations(null);
    setAiLoading(false);
    closeAddMembersModal();
  };

  // AI 추천 결과에서 노드 정보 가져오기
  const getNodeFromAiResult = (memberId: string) => {
    // 1촌 인맥에서 먼저 찾기
    const availableNode = availableNodes.find((n) => n.id === memberId);
    if (availableNode) return { node: availableNode, isFirstDegree: true };

    // demoUsers에서 찾기
    const demoUser = demoUsers.find((u) => u.id === memberId);
    if (demoUser) return { node: demoUser, isFirstDegree: false };

    return null;
  };

  return (
    <AnimatePresence>
      {isAddMembersModalOpen && group && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-[rgba(1,4,9,0.85)] backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-[rgba(22,27,34,0.98)] backdrop-blur-xl border border-[rgba(240,246,252,0.1)] rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.4)] overflow-hidden max-h-[80vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(240,246,252,0.1)]">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                  style={{ backgroundColor: group.color + '20' }}
                >
                  {group.icon}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#F0F6FC]">인맥 추가</h2>
                  <p className="text-sm text-[#8B949E]">{group.name} 그룹에 추가</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1 text-[#8B949E] hover:text-[#F0F6FC] transition-colors rounded-lg hover:bg-[rgba(240,246,252,0.05)]"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-3 border-b border-[rgba(240,246,252,0.1)]">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#484F58]"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      triggerAiSearchWithQuery(searchQuery);
                    }
                  }}
                  placeholder="AI에게 관련 업종 인맥 추천 요청..."
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl pl-10 pr-12 py-2.5 text-base text-white placeholder:text-[#484F58] focus:outline-none focus:border-[#58A6FF] transition-colors"
                />
                <button
                  onClick={() => searchQuery.trim() && triggerAiSearchWithQuery(searchQuery)}
                  disabled={!searchQuery.trim() || aiLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-[#A78BFA]/20 text-[#A78BFA] hover:bg-[#A78BFA]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="AI 추천 검색"
                >
                  <Sparkles size={14} />
                </button>
              </div>
              <p className="text-xs text-[#484F58] mt-1.5 px-1">
                예: &quot;투자 관련 인맥&quot;, &quot;AI 전문가&quot;, &quot;마케팅 담당자&quot;
              </p>
            </div>

            {/* AI Recommendations */}
            {(aiLoading || aiRecommendations) && (
              <div className="px-6 py-3 border-b border-[rgba(240,246,252,0.1)] bg-[#A78BFA]/5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-[#A78BFA] flex items-center gap-1.5 font-medium">
                    <Sparkles size={14} />
                    AI 추천
                  </p>
                  {!aiLoading && aiRecommendations && (
                    <button
                      onClick={() => setAiRecommendations(null)}
                      className="text-[#484F58] hover:text-[#A78BFA] transition-colors p-0.5 rounded hover:bg-[#A78BFA]/10"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {aiLoading ? (
                  <div className="flex items-center gap-2 py-3 text-[#8B949E] text-sm">
                    <Loader2 size={16} className="animate-spin text-[#A78BFA]" />
                    관련 인맥을 분석하고 있습니다...
                  </div>
                ) : aiRecommendations && (
                  <div>
                    <p className="text-sm text-[#C4B5FD] mb-2 px-2 py-1.5 bg-[#A78BFA]/10 rounded-lg">
                      {aiRecommendations.summary}
                    </p>
                    <div className="space-y-1 max-h-[200px] overflow-y-auto">
                      {aiRecommendations.results.length > 0 ? (
                        aiRecommendations.results.map((result) => {
                          const nodeInfo = getNodeFromAiResult(result.memberId);
                          if (!nodeInfo) return null;
                          const { node, isFirstDegree } = nodeInfo;
                          const isSelected = selectedNodeIds.has(result.memberId);
                          return (
                            <button
                              key={result.memberId}
                              onClick={() => handleToggleNode(result.memberId)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                                isSelected
                                  ? 'bg-[#A78BFA]/20 border border-[#A78BFA]/40'
                                  : 'hover:bg-[#1C2333] border border-transparent'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                  isSelected
                                    ? 'bg-[#A78BFA] border-[#A78BFA]'
                                    : 'border-[#30363D]'
                                }`}
                              >
                                {isSelected && <Check size={12} className="text-white" />}
                              </div>
                              <Avatar src={node.profileImage} name={node.name} size="sm" />
                              <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm text-white truncate">{node.name}</p>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#A78BFA]/20 text-[#A78BFA] flex-shrink-0">
                                    AI 추천
                                  </span>
                                  {isFirstDegree ? (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#58A6FF]/20 text-[#58A6FF] flex-shrink-0">
                                      1촌
                                    </span>
                                  ) : (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#FFB800]/20 text-[#FFB800] flex-shrink-0">
                                      연결 필요
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-[#8B949E] truncate">
                                  {node.company} {node.position && `· ${node.position}`}
                                </p>
                                <p className="text-[10px] text-[#C4B5FD] truncate mt-0.5">
                                  {result.reason}
                                </p>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <p className="text-sm text-[#8B949E] py-2 text-center">
                          추가 가능한 추천 인맥이 없습니다
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Select All */}
            {filteredNodes.length > 0 && (
              <div className="px-6 py-2 border-b border-[rgba(240,246,252,0.1)] flex items-center justify-between">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 text-sm text-[#58A6FF] hover:text-[#58A6FF]/80 transition-colors"
                >
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      selectedNodeIds.size === filteredNodes.length && filteredNodes.length > 0
                        ? 'bg-[#58A6FF] border-[#58A6FF]'
                        : 'border-[#30363D]'
                    }`}
                  >
                    {selectedNodeIds.size === filteredNodes.length && filteredNodes.length > 0 && (
                      <Check size={12} className="text-white" />
                    )}
                  </div>
                  전체 선택
                </button>
                <span className="text-sm text-[#484F58]">
                  {selectedNodeIds.size}명 선택됨
                </span>
              </div>
            )}

            {/* Node List */}
            <div className="flex-1 overflow-y-auto px-6 py-3">
              {availableNodes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-xl bg-[#1C2333] flex items-center justify-center mx-auto mb-4">
                    <Users size={24} className="text-[#484F58]" />
                  </div>
                  <p className="text-[#8B949E] text-base mb-1">추가할 인맥이 없습니다</p>
                  <p className="text-[#484F58] text-sm">
                    모든 1촌 인맥이 이미 그룹에 있습니다
                  </p>
                </div>
              ) : filteredNodes.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[#8B949E] text-base">검색 결과가 없습니다</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredNodes.map((node) => {
                    const isSelected = selectedNodeIds.has(node.id);
                    return (
                      <button
                        key={node.id}
                        onClick={() => handleToggleNode(node.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                          isSelected
                            ? 'bg-[#58A6FF]/10 border border-[#58A6FF]/30'
                            : 'hover:bg-[#1C2333] border border-transparent'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            isSelected
                              ? 'bg-[#58A6FF] border-[#58A6FF]'
                              : 'border-[#30363D]'
                          }`}
                        >
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                        <Avatar src={node.profileImage} name={node.name} size="sm" />
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-base text-white truncate">{node.name}</p>
                          <p className="text-xs text-[#8B949E] truncate">
                            {node.company} {node.position && `· ${node.position}`}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[rgba(240,246,252,0.1)] flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-xl text-sm text-[#8B949E] hover:bg-[#1C2333] transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleAddMembers}
                disabled={selectedNodeIds.size === 0}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[#58A6FF] text-white hover:bg-[#58A6FF]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {selectedNodeIds.size > 0
                  ? `${selectedNodeIds.size}명 추가하기`
                  : '인맥 선택'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
