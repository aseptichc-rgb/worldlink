'use client';

import { useState, useMemo } from 'react';
import NetworkGraph from '@/components/NetworkGraph';
import Sidebar from '@/components/Sidebar';
import ProfileCard from '@/components/ProfileCard';
import { Member, GraphNode, GraphLink, getCategoryColor } from '@/types';
import membersData from '../../data/members.json';

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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  // Members 데이터 로드
  const members: Member[] = membersData as Member[];

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
    }));

    const links: GraphLink[] = [];

    // 같은 카테고리 연결
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const cat1 = members[i].category;
        const cat2 = members[j].category;

        // 같은 카테고리거나 카테고리가 겹치는 경우
        const cat1Parts = cat1.split('/');
        const cat2Parts = cat2.split('/');
        const hasOverlap = cat1Parts.some(p => cat2Parts.includes(p));

        if (cat1 === cat2 || hasOverlap) {
          links.push({
            source: members[i].id,
            target: members[j].id,
            type: 'category',
            strength: 0.3,
          });
        }
      }
    }

    // 키워드 공유 연결 (다른 카테고리 간)
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        if (members[i].category === members[j].category) continue;

        const sharedTags = members[i].tags.filter(tag =>
          members[j].tags.includes(tag)
        );

        if (sharedTags.length >= 2) {
          links.push({
            source: members[i].id,
            target: members[j].id,
            type: 'keyword',
            strength: 0.1 * sharedTags.length,
          });
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
      const categoryMatch = selectedCategories.length === 0 ||
        selectedCategories.some(cat => node.category.includes(cat));
      const searchMatch = searchQuery === '' ||
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.company.toLowerCase().includes(searchQuery.toLowerCase());
      return categoryMatch && searchMatch;
    }).length;
  }, [graphData.nodes, selectedCategories, searchQuery]);

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
        />

        {/* 범례 */}
        <div className="absolute bottom-6 left-6 bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">범례</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-gray-300">의료기기/솔루션</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-gray-300">투자/법률/특허</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-gray-300">제약/바이오</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-300">의료기관</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-gray-300">기타/공공</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-700 space-y-2 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-6 h-px bg-white/30" />
              <span>같은 분야</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-px bg-purple-500/50 border-dashed border-t" style={{ borderStyle: 'dashed' }} />
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
