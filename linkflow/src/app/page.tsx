'use client';

import { useState, useMemo } from 'react';
import NetworkGraph from '@/components/NetworkGraph';
import Sidebar from '@/components/Sidebar';
import ProfileCard from '@/components/ProfileCard';
import { Member, GraphNode, GraphLink, getCategoryColor } from '@/types';
import membersData from '../../data/members.json';

export default function Home() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  // Members 데이터 로드
  const members: Member[] = membersData as Member[];

  // 그래프 데이터 생성 - 컴팩트한 그리드 배치
  const graphData = useMemo(() => {
    // 먼저 타 카테고리 연결 수 계산
    const crossCategoryLinks: Record<string, number> = {};
    members.forEach(m => {
      crossCategoryLinks[m.id] = 0;
    });

    // 키워드 공유로 타 카테고리 연결 계산
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const cat1Main = members[i].category.split('/')[0];
        const cat2Main = members[j].category.split('/')[0];

        if (cat1Main !== cat2Main) {
          const sharedTags = members[i].tags.filter(tag =>
            members[j].tags.includes(tag)
          );
          if (sharedTags.length >= 1) {
            crossCategoryLinks[members[i].id]++;
            crossCategoryLinks[members[j].id]++;
          }
        }
      }
    }

    // 카테고리별 그룹화
    const categoryGroups: Record<string, Member[]> = {};
    members.forEach(m => {
      const mainCat = m.category.split('/')[0];
      if (!categoryGroups[mainCat]) categoryGroups[mainCat] = [];
      categoryGroups[mainCat].push(m);
    });

    // 카테고리별 중심 위치 - 원형 배치로 빈 공간 없이
    const categories = Object.keys(categoryGroups);
    const categoryPositions: Record<string, { cx: number; cy: number }> = {};

    // 카테고리를 원형으로 배치 (중앙에 빈 공간 없음)
    const mainRadius = 400;
    categories.forEach((cat, idx) => {
      const angle = (2 * Math.PI * idx) / categories.length - Math.PI / 2;
      categoryPositions[cat] = {
        cx: mainRadius * Math.cos(angle),
        cy: mainRadius * Math.sin(angle),
      };
    });

    // 노드 간 최소 간격 (픽셀)
    const NODE_SPACING = 70;

    // 노드 생성 및 위치 할당 - 나선형 배치로 겹침 방지
    const nodes: GraphNode[] = members.map((member) => {
      const mainCat = member.category.split('/')[0];
      const catMembers = categoryGroups[mainCat];
      const memberIdx = catMembers.indexOf(member);
      const totalInCat = catMembers.length;

      const catPos = categoryPositions[mainCat];

      // 나선형 배치 - 중심에서 바깥으로 퍼지며 배치
      // 각 노드가 일정 간격을 유지하도록 나선형으로 배치
      const spiralA = 0; // 시작 반경
      const spiralB = NODE_SPACING / (2 * Math.PI); // 나선 간격
      const theta = Math.sqrt(memberIdx * 2 * Math.PI * NODE_SPACING / spiralB);
      const r = spiralA + spiralB * theta;

      // 타 카테고리 연결 수에 따른 노드 크기 (기본 8, 연결 많으면 커짐)
      const crossLinks = crossCategoryLinks[member.id];
      const nodeSize = 8 + Math.min(crossLinks * 2, 8); // 최소 8, 최대 16

      return {
        id: member.id,
        name: member.name,
        company: member.company,
        role: member.role,
        category: member.category,
        photoUrl: member.photoUrl,
        val: nodeSize,
        color: getCategoryColor(member.category),
        member,
        // 고정 좌표 - 나선형 배치
        x: catPos.cx + r * Math.cos(theta),
        y: catPos.cy + r * Math.sin(theta),
        fx: catPos.cx + r * Math.cos(theta),
        fy: catPos.cy + r * Math.sin(theta),
      };
    });

    const links: GraphLink[] = [];

    // 같은 카테고리 연결 (선 없이 - 시각적으로 깔끔하게)
    // 제거함

    // 키워드 공유 연결 (같은 카테고리 + 타 카테고리 모두)
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const cat1Main = members[i].category.split('/')[0];
        const cat2Main = members[j].category.split('/')[0];
        const isSameCategory = cat1Main === cat2Main;

        const sharedTags = members[i].tags.filter(tag =>
          members[j].tags.includes(tag)
        );

        if (sharedTags.length >= 1) {
          links.push({
            source: members[i].id,
            target: members[j].id,
            type: isSameCategory ? 'category' : 'keyword',
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
    <main className="network-page flex h-screen bg-gray-900">
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
              <div className="w-6 h-px bg-green-500" />
              <span>키워드 연결 (같은 카테고리)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-px bg-purple-400" />
              <span>키워드 연결 (타 카테고리)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-gray-400" />
              <span>노드 크기 = 타 분야 연결 수</span>
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
          <a
            href="/admin"
            className="mt-3 block text-center text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            어드민 →
          </a>
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
