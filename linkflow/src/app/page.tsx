'use client';

import { useState, useMemo, useEffect } from 'react';
import NetworkGraph from '@/components/NetworkGraph';
import Sidebar from '@/components/Sidebar';
import ProfileCard from '@/components/ProfileCard';
import { Member, GraphNode, GraphLink, getCategoryColor } from '@/types';

// 직급 기반 노드 크기 계산
function getNodeSize(role: string): number {
  if (role.includes('대표') || role.includes('이사장') || role.includes('원장') || role.includes('병원장')) {
    return 12;
  }
  if (role.includes('부사장') || role.includes('본부장') || role.includes('처장') || role.includes('실장')) {
    return 10;
  }
  if (role.includes('이사') || role.includes('전무') || role.includes('상무')) {
    return 9;
  }
  if (role.includes('교수') || role.includes('과장')) {
    return 8;
  }
  return 7;
}

export default function Home() {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  // API에서 데이터 로드
  useEffect(() => {
    const loadMembers = async () => {
      try {
        const response = await fetch('/api/members');
        if (response.ok) {
          const data = await response.json();
          setMembers(data);
        }
      } catch (error) {
        console.error('데이터 로드 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadMembers();
  }, []);

  // 그래프 데이터 생성
  const graphData = useMemo(() => {
    const nodes: GraphNode[] = members.map(member => ({
      id: member.id,
      name: member.name,
      company: member.company,
      role: member.role,
      category: member.category,
      photoUrl: member.photoUrl,
      val: getNodeSize(member.role),
      color: getCategoryColor(member.category),
      member,
      specialRole: member.specialRole,
    }));

    const links: GraphLink[] = [];

    // 카테고리 키워드가 동일한 경우 연결 (예: '의료기기/솔루션' 중 '의료기기' 또는 '솔루션'이 같으면 연결)
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const cat1Parts = members[i].category.split('/');
        const cat2Parts = members[j].category.split('/');

        // 카테고리 키워드 중 하나라도 일치하면 연결
        const sharedCategoryKeywords = cat1Parts.filter(p => cat2Parts.includes(p));

        if (sharedCategoryKeywords.length > 0) {
          links.push({
            source: members[i].id,
            target: members[j].id,
            type: 'category',
            strength: 0.3,
          });
        }
      }
    }

    // 태그 키워드 공유 연결 (모든 멤버 간)
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const sharedTags = members[i].tags.filter(tag =>
          members[j].tags.includes(tag)
        );

        if (sharedTags.length >= 1) {
          // 이미 카테고리로 연결된 경우 중복 체크
          const alreadyLinked = links.some(
            l => (l.source === members[i].id && l.target === members[j].id) ||
                 (l.source === members[j].id && l.target === members[i].id)
          );

          if (!alreadyLinked) {
            links.push({
              source: members[i].id,
              target: members[j].id,
              type: 'keyword',
              strength: 0.1 * sharedTags.length,
            });
          }
        }
      }
    }

    return { nodes, links };
  }, [members]);

  // 카테고리 목록
  const categories = useMemo(() => {
    return Array.from(new Set(members.map(m => m.category))).sort();
  }, [members]);

  // 필터링된 노드 수
  const filteredCount = useMemo(() => {
    return graphData.nodes.filter(node => {
      // 카테고리 매칭: 선택된 카테고리와 노드 카테고리가 일치하는지 확인
      const categoryMatch = selectedCategories.length === 0 ||
        selectedCategories.includes(node.category);
      const searchMatch = searchQuery === '' ||
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.member.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return categoryMatch && searchMatch;
    }).length;
  }, [graphData.nodes, selectedCategories, searchQuery]);

  // 로딩 중일 때 표시
  if (isLoading) {
    return (
      <main className="flex h-screen bg-gray-900 items-center justify-center">
        <div className="text-white text-lg">데이터를 불러오는 중...</div>
      </main>
    );
  }

  return (
    <main className="flex h-screen bg-gray-900">
      {/* 사이드바 */}
      <Sidebar
        categories={categories}
        selectedCategories={selectedCategories}
        onCategoryChange={setSelectedCategories}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        memberCount={members.length}
        filteredCount={filteredCount}
      />

      {/* 네트워크 그래프 */}
      <div className="flex-1 relative">
        <NetworkGraph
          nodes={graphData.nodes}
          links={graphData.links}
          selectedCategories={selectedCategories}
          searchQuery={searchQuery}
          onNodeClick={setSelectedNode}
          hoveredNode={hoveredNode}
          onNodeHover={setHoveredNode}
          selectedNode={selectedNode}
        />

        {/* 범례 */}
        <div className="absolute bottom-6 left-6 bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">범례</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3B82F6' }} />
              <span className="text-gray-300">의료기기</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#06B6D4' }} />
              <span className="text-gray-300">솔루션</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#EF4444' }} />
              <span className="text-gray-300">투자</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F97316' }} />
              <span className="text-gray-300">법률</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FB923C' }} />
              <span className="text-gray-300">특허</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#8B5CF6' }} />
              <span className="text-gray-300">제약</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#A855F7' }} />
              <span className="text-gray-300">바이오</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10B981' }} />
              <span className="text-gray-300">의료기관</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F59E0B' }} />
              <span className="text-gray-300">비즈니스</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-700 space-y-2 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-6 h-px bg-white/30" />
              <span>같은 카테고리</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-px bg-purple-500/50" style={{ borderTop: '1px dashed' }} />
              <span>키워드 연결</span>
            </div>
          </div>
        </div>

        {/* 조작 가이드 */}
        <div className="absolute top-6 right-6 bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 border border-gray-700">
          <div className="text-xs text-gray-400 space-y-1">
            <p>마우스 휠: 줌</p>
            <p>드래그: 이동</p>
            <p>노드 클릭: 상세 정보</p>
          </div>
        </div>
      </div>

      {/* 프로필 카드 */}
      <ProfileCard
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
      />
    </main>
  );
}
