'use client';

import { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { GraphNode, GraphLink, Member, getCategoryColor } from '@/types';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
});

// 카테고리별 색상
const CATEGORY_MAIN_COLORS: Record<string, string> = {
  '의료기기': '#EF4444',
  '솔루션': '#EF4444',
  '투자': '#A855F7',
  '법률': '#A855F7',
  '특허': '#A855F7',
  '제약': '#22C55E',
  '바이오': '#22C55E',
  '의료기관': '#3B82F6',
  '비즈니스': '#F59E0B',
};

interface NetworkGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  selectedCategories: string[];
  searchQuery: string;
  onNodeClick: (node: GraphNode | null) => void;
  hoveredNode: GraphNode | null;
  onNodeHover: (node: GraphNode | null) => void;
  selectedNode: GraphNode | null;
}

export default function NetworkGraph({
  nodes,
  links,
  selectedCategories,
  searchQuery,
  onNodeClick,
  hoveredNode,
  onNodeHover,
  selectedNode,
}: NetworkGraphProps) {
  const fgRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [imageCache, setImageCache] = useState<Record<string, HTMLImageElement>>({});

  // 윈도우 크기 감지
  useEffect(() => {
    const updateDimensions = () => {
      const sidebarWidth = 280;
      setDimensions({
        width: window.innerWidth - sidebarWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // 이미지 프리로드
  useEffect(() => {
    const cache: Record<string, HTMLImageElement> = {};
    nodes.forEach(node => {
      if (node.photoUrl) {
        const img = new Image();
        img.src = node.photoUrl;
        img.onload = () => {
          cache[node.id] = img;
          setImageCache(prev => ({ ...prev, [node.id]: img }));
        };
        img.onerror = () => {
          // 이미지 로드 실패 시 무시
        };
      }
    });
  }, [nodes]);

  // 노드에 고정 위치 할당 (중심 인물 + 좌우 균형 배치)
  const positionedNodes = useMemo(() => {
    const NODE_SPACING = 60; // 노드 간 간격
    const INNER_RADIUS = 90; // 내부 원 반경 (핵심 인물들)

    // 핵심 인물 정의
    const centerPerson = '고상원';
    const innerCircle = ['선경훈', '황은경', '김국배', '양성용', '장강호', '김재영'];

    // 노드 분류
    const centerNode = nodes.find(n => n.name === centerPerson);
    const innerNodes = nodes.filter(n => innerCircle.includes(n.name));
    const outerNodes = nodes.filter(n => n.name !== centerPerson && !innerCircle.includes(n.name));

    const positionedNodes: GraphNode[] = [];

    // 1. 중앙 인물 배치
    if (centerNode) {
      positionedNodes.push({
        ...centerNode,
        x: 0,
        y: 0,
        fx: 0,
        fy: 0,
      });
    }

    // 2. 내부 원형 배치 (6명)
    innerNodes.forEach((node, idx) => {
      const angle = (idx * 2 * Math.PI / innerNodes.length) - Math.PI / 2;
      const x = Math.cos(angle) * INNER_RADIUS;
      const y = Math.sin(angle) * INNER_RADIUS;

      positionedNodes.push({
        ...node,
        x,
        y,
        fx: x,
        fy: y,
      });
    });

    // 3. 나머지 노드들을 카테고리별로 그룹화
    const categoryGroups: Record<string, GraphNode[]> = {};
    outerNodes.forEach(node => {
      const cat = node.category;
      if (!categoryGroups[cat]) {
        categoryGroups[cat] = [];
      }
      categoryGroups[cat].push(node);
    });

    const categoryOrder = ['의료기기', '솔루션', '투자', '법률', '특허', '제약', '바이오', '의료기관', '비즈니스'];
    const sortedCategories = Object.keys(categoryGroups).sort(
      (a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
      }
    );

    // 좌우 영역에 카테고리 분배
    // 왼쪽: 의료기기, 법률, 바이오, 의료기관
    // 오른쪽: 솔루션, 투자, 특허, 제약, 기타
    const leftCategories = ['의료기기', '법률', '바이오', '의료기관'];
    const rightCategories = ['솔루션', '투자', '특허', '제약', '비즈니스'];

    const LEFT_X = -280;
    const RIGHT_X = 280;
    const START_Y = -250;

    // 왼쪽 영역 배치
    let leftY = START_Y;
    sortedCategories.filter(c => leftCategories.includes(c)).forEach((category) => {
      const nodesInCategory = categoryGroups[category];
      if (!nodesInCategory) return;

      // 3열 그리드로 배치
      const nodesPerRow = 3;
      nodesInCategory.forEach((node, nodeIndex) => {
        const row = Math.floor(nodeIndex / nodesPerRow);
        const col = nodeIndex % nodesPerRow;
        const nodesInThisRow = Math.min(nodesPerRow, nodesInCategory.length - row * nodesPerRow);
        const rowWidth = (nodesInThisRow - 1) * NODE_SPACING;

        const nodeX = LEFT_X + col * NODE_SPACING - rowWidth / 2;
        const nodeY = leftY + row * NODE_SPACING;

        positionedNodes.push({
          ...node,
          x: nodeX,
          y: nodeY,
          fx: nodeX,
          fy: nodeY,
        });
      });

      const rowCount = Math.ceil(nodesInCategory.length / nodesPerRow);
      leftY += rowCount * NODE_SPACING + 50;
    });

    // 오른쪽 영역 배치
    let rightY = START_Y;
    sortedCategories.filter(c => rightCategories.includes(c)).forEach((category) => {
      const nodesInCategory = categoryGroups[category];
      if (!nodesInCategory) return;

      // 3열 그리드로 배치
      const nodesPerRow = 3;
      nodesInCategory.forEach((node, nodeIndex) => {
        const row = Math.floor(nodeIndex / nodesPerRow);
        const col = nodeIndex % nodesPerRow;
        const nodesInThisRow = Math.min(nodesPerRow, nodesInCategory.length - row * nodesPerRow);
        const rowWidth = (nodesInThisRow - 1) * NODE_SPACING;

        const nodeX = RIGHT_X + col * NODE_SPACING - rowWidth / 2;
        const nodeY = rightY + row * NODE_SPACING;

        positionedNodes.push({
          ...node,
          x: nodeX,
          y: nodeY,
          fx: nodeX,
          fy: nodeY,
        });
      });

      const rowCount = Math.ceil(nodesInCategory.length / nodesPerRow);
      rightY += rowCount * NODE_SPACING + 50;
    });

    return positionedNodes;
  }, [nodes]);

  // 필터링된 데이터 (positionedNodes 사용)
  const filteredNodes = useMemo(() => {
    return positionedNodes.filter(node => {
      // 카테고리 매칭: 선택된 카테고리와 노드 카테고리가 일치하는지 확인
      const categoryMatch = selectedCategories.length === 0 ||
        selectedCategories.includes(node.category);

      const searchMatch = searchQuery === '' ||
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.member.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      return categoryMatch && searchMatch;
    });
  }, [positionedNodes, selectedCategories, searchQuery]);

  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));

  const filteredLinks = links.filter(link => {
    const sourceId = typeof link.source === 'object' ? (link.source as any).id : link.source;
    const targetId = typeof link.target === 'object' ? (link.target as any).id : link.target;
    return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
  });

  // 선택된 노드와 연결된 노드 ID 집합
  const connectedNodeIds = useMemo(() => {
    if (!selectedNode) return new Set<string>();

    const connected = new Set<string>();
    connected.add(selectedNode.id);

    links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? (link.source as any).id : link.source;
      const targetId = typeof link.target === 'object' ? (link.target as any).id : link.target;

      if (sourceId === selectedNode.id) {
        connected.add(targetId);
      } else if (targetId === selectedNode.id) {
        connected.add(sourceId);
      }
    });

    return connected;
  }, [selectedNode, links]);

  // 필터링/검색 시 해당 노드들 중심으로 포커스
  const selectedCategoriesKey = selectedCategories.join(',');
  const filteredNodesCount = filteredNodes.length;

  useEffect(() => {
    // 카테고리 선택이 있을 때만 중앙으로 이동
    if (fgRef.current && selectedCategoriesKey && filteredNodes.length > 0) {
      // 필터링된 노드들의 중심점 계산
      const sumX = filteredNodes.reduce((acc, n) => acc + (n.fx ?? n.x ?? 0), 0);
      const sumY = filteredNodes.reduce((acc, n) => acc + (n.fy ?? n.y ?? 0), 0);
      const centerX = sumX / filteredNodes.length;
      const centerY = sumY / filteredNodes.length;

      // 약간의 딜레이 후 이동
      const timer = setTimeout(() => {
        if (fgRef.current) {
          fgRef.current.centerAt(centerX, centerY, 500);
          // 노드가 적으면 줌인
          if (filteredNodes.length < 15) {
            fgRef.current.zoom(1.8, 500);
          } else if (filteredNodes.length < 30) {
            fgRef.current.zoom(1.3, 500);
          }
        }
      }, 150);

      return () => clearTimeout(timer);
    }

    // 카테고리 선택이 해제되면 전체 보기
    if (fgRef.current && !selectedCategoriesKey && !searchQuery) {
      const timer = setTimeout(() => {
        if (fgRef.current) {
          fgRef.current.zoomToFit(500, 50);
        }
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [selectedCategoriesKey, filteredNodesCount]);

  // 검색어 변경 시 해당 노드들 중심으로 포커스
  useEffect(() => {
    if (fgRef.current && searchQuery && filteredNodes.length > 0) {
      const sumX = filteredNodes.reduce((acc, n) => acc + (n.fx ?? n.x ?? 0), 0);
      const sumY = filteredNodes.reduce((acc, n) => acc + (n.fy ?? n.y ?? 0), 0);
      const centerX = sumX / filteredNodes.length;
      const centerY = sumY / filteredNodes.length;

      const timer = setTimeout(() => {
        if (fgRef.current) {
          fgRef.current.centerAt(centerX, centerY, 500);
          if (filteredNodes.length <= 5) {
            fgRef.current.zoom(2, 500);
          }
        }
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [searchQuery, filteredNodesCount]);

  // 노드 그리기 함수
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const baseSize = 16; // 기본 크기 (컴팩트하게)
    const isHovered = hoveredNode?.id === node.id;
    const isSelected = selectedNode?.id === node.id;
    const isConnected = connectedNodeIds.has(node.id);
    const isHighlighted = searchQuery && (
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.member.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // 선택된 노드는 크기를 키움
    const size = isSelected ? baseSize * 1.5 : baseSize;

    // 노드 테두리
    ctx.beginPath();
    ctx.arc(node.x, node.y, size + 3, 0, 2 * Math.PI, false);
    if (isSelected) {
      ctx.fillStyle = '#FFD700'; // 선택된 노드는 금색
    } else if (selectedNode && isConnected) {
      ctx.fillStyle = '#00FFFF'; // 연결된 노드는 시안색
    } else if (isHovered || isHighlighted) {
      ctx.fillStyle = '#fff';
    } else {
      ctx.fillStyle = node.color;
    }
    ctx.fill();

    // 내부 원 (배경) - 흰색으로 변경하여 밝게
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // 이미지 또는 이니셜
    const img = imageCache[node.id];
    if (img && img.complete) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x, node.y, size - 1, 0, 2 * Math.PI, false);
      ctx.clip();
      ctx.drawImage(
        img,
        node.x - size + 1,
        node.y - size + 1,
        (size - 1) * 2,
        (size - 1) * 2
      );
      ctx.restore();
    } else {
      // 이니셜 표시
      ctx.font = `bold ${size}px Sans-Serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = node.color;
      ctx.fillText(node.name.charAt(0), node.x, node.y);
    }

    // 이름 라벨 (항상 표시)
    ctx.font = `bold 11px Sans-Serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    if (isSelected) {
      ctx.fillStyle = '#FFD700';
    } else if (selectedNode && isConnected) {
      ctx.fillStyle = '#00FFFF';
    } else if (isHovered || isHighlighted) {
      ctx.fillStyle = '#fff';
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
    }
    ctx.fillText(node.name, node.x, node.y + size + 4);

    // 특별 보직 표시 (이름 아래)
    if (node.specialRole || node.member?.specialRole) {
      const specialRole = node.specialRole || node.member?.specialRole;
      ctx.font = `bold 9px Sans-Serif`;
      // 고상원 회장만 금색, 나머지는 하늘색
      if (node.name === '고상원') {
        ctx.fillStyle = '#FFD700'; // 금색 (고상원 회장)
      } else {
        ctx.fillStyle = '#00BFFF'; // 하늘색 (기타 보직)
      }
      ctx.fillText(specialRole, node.x, node.y + size + 17);
    }
  }, [imageCache, hoveredNode, searchQuery, selectedNode, connectedNodeIds]);

  // 링크 그리기
  const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
    const start = link.source;
    const end = link.target;

    if (!start.x || !end.x) return;

    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;

    // 선택된 노드와 연결된 링크인지 확인
    const isConnectedLink = selectedNode && (
      sourceId === selectedNode.id || targetId === selectedNode.id
    );

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);

    if (isConnectedLink) {
      // 연결된 링크는 밝은 시안색으로 강조
      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
    } else if (link.type === 'category') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
    } else {
      ctx.strokeStyle = 'rgba(147, 51, 234, 0.3)';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([5, 5]);
    }

    ctx.stroke();
    ctx.setLineDash([]);
  }, [selectedNode]);

  // 초기 줌 설정 - 전체가 보이도록
  useEffect(() => {
    if (fgRef.current) {
      setTimeout(() => {
        fgRef.current.zoomToFit(500, 50);
      }, 500);
    }
  }, []);

  // 배경 클릭 시 선택 해제
  const handleBackgroundClick = useCallback(() => {
    onNodeClick(null);
  }, [onNodeClick]);

  return (
    <div className="bg-gray-900">
      <ForceGraph2D
        ref={fgRef}
        graphData={{ nodes: filteredNodes, links: filteredLinks }}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="#111827"
        nodeCanvasObject={nodeCanvasObject}
        linkCanvasObject={linkCanvasObject}
        nodeRelSize={8}
        linkDirectionalParticles={0}
        d3AlphaDecay={0}
        d3VelocityDecay={1}
        cooldownTicks={0}
        onNodeClick={(node: any) => onNodeClick(node as GraphNode)}
        onNodeHover={(node: any) => onNodeHover(node as GraphNode | null)}
        onBackgroundClick={handleBackgroundClick}
        enableNodeDrag={false}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />
    </div>
  );
}
