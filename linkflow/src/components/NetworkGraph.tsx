'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { GraphNode, GraphLink, Member, getCategoryColor } from '@/types';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
});

interface NetworkGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  selectedCategories: string[];
  searchQuery: string;
  onNodeClick: (node: GraphNode) => void;
  hoveredNode: GraphNode | null;
  onNodeHover: (node: GraphNode | null) => void;
}

export default function NetworkGraph({
  nodes,
  links,
  selectedCategories,
  searchQuery,
  onNodeClick,
  hoveredNode,
  onNodeHover,
}: NetworkGraphProps) {
  const fgRef = useRef<any>();
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

  // 필터링된 데이터
  const filteredNodes = nodes.filter(node => {
    const categoryMatch = selectedCategories.length === 0 ||
      selectedCategories.some(cat => node.category.includes(cat));

    const searchMatch = searchQuery === '' ||
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.member.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    return categoryMatch && searchMatch;
  });

  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));

  const filteredLinks = links.filter(link => {
    const sourceId = typeof link.source === 'object' ? (link.source as any).id : link.source;
    const targetId = typeof link.target === 'object' ? (link.target as any).id : link.target;
    return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
  });

  // 검색어가 있으면 해당 노드로 포커스
  useEffect(() => {
    if (searchQuery && fgRef.current) {
      const matchedNode = filteredNodes.find(
        n => n.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (matchedNode) {
        fgRef.current.centerAt(matchedNode.x, matchedNode.y, 1000);
        fgRef.current.zoom(2, 1000);
      }
    }
  }, [searchQuery, filteredNodes]);

  // 노드 그리기 함수
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const size = node.val * 2;
    const fontSize = Math.max(10 / globalScale, 3);
    const isHovered = hoveredNode?.id === node.id;
    const isHighlighted = searchQuery && (
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.member.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // 그림자 효과 (호버 시)
    if (isHovered || isHighlighted) {
      ctx.shadowColor = node.color;
      ctx.shadowBlur = 20;
    }

    // 노드 테두리
    ctx.beginPath();
    ctx.arc(node.x, node.y, size + 2, 0, 2 * Math.PI, false);
    ctx.fillStyle = isHovered || isHighlighted ? '#fff' : node.color;
    ctx.fill();

    // 내부 원 (배경)
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    ctx.fillStyle = '#1f2937';
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

    // 그림자 리셋
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // 이름 라벨 (호버 또는 줌 시)
    if (isHovered || isHighlighted || globalScale > 1.5) {
      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#fff';
      ctx.fillText(node.name, node.x, node.y + size + 3);
    }
  }, [imageCache, hoveredNode, searchQuery]);

  // 링크 그리기
  const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
    const start = link.source;
    const end = link.target;

    if (!start.x || !end.x) return;

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);

    if (link.type === 'category') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
    } else {
      ctx.strokeStyle = 'rgba(147, 51, 234, 0.3)';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([5, 5]);
    }

    ctx.stroke();
    ctx.setLineDash([]);
  }, []);

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
        nodeRelSize={6}
        linkDirectionalParticles={0}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        cooldownTicks={100}
        onNodeClick={(node: any) => onNodeClick(node as GraphNode)}
        onNodeHover={(node: any) => onNodeHover(node as GraphNode | null)}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />
    </div>
  );
}
