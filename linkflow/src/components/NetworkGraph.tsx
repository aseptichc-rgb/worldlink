'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import * as d3Force from 'd3-force';
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

    const query = searchQuery.toLowerCase();
    const member = node.member;
    const searchMatch = searchQuery === '' ||
      node.name.toLowerCase().includes(query) ||
      node.company.toLowerCase().includes(query) ||
      node.category.toLowerCase().includes(query) ||
      member.phone.includes(searchQuery) ||
      member.email.toLowerCase().includes(query) ||
      member.description.toLowerCase().includes(query) ||
      member.role.toLowerCase().includes(query) ||
      member.tags.some(tag => tag.toLowerCase().includes(query));

    return categoryMatch && searchMatch;
  });

  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));

  const filteredLinks = links.filter(link => {
    const sourceId = typeof link.source === 'object' ? (link.source as any).id : link.source;
    const targetId = typeof link.target === 'object' ? (link.target as any).id : link.target;
    return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
  });

  // 필터링된 노드들의 중심으로 포커스
  useEffect(() => {
    if (fgRef.current && filteredNodes.length > 0) {
      // 필터링된 노드들의 중심점 계산
      const sumX = filteredNodes.reduce((acc, n) => acc + (n.x || 0), 0);
      const sumY = filteredNodes.reduce((acc, n) => acc + (n.y || 0), 0);
      const centerX = sumX / filteredNodes.length;
      const centerY = sumY / filteredNodes.length;

      // 노드들의 범위 계산
      const minX = Math.min(...filteredNodes.map(n => n.x || 0));
      const maxX = Math.max(...filteredNodes.map(n => n.x || 0));
      const minY = Math.min(...filteredNodes.map(n => n.y || 0));
      const maxY = Math.max(...filteredNodes.map(n => n.y || 0));
      const rangeX = maxX - minX;
      const rangeY = maxY - minY;

      // 범위에 따라 줌 레벨 계산
      const padding = 100;
      const zoomX = dimensions.width / (rangeX + padding * 2);
      const zoomY = dimensions.height / (rangeY + padding * 2);
      const zoom = Math.min(zoomX, zoomY, 3); // 최대 줌 3배 제한

      setTimeout(() => {
        fgRef.current.centerAt(centerX, centerY, 500);
        fgRef.current.zoom(zoom, 500);
      }, 100);
    }
  }, [searchQuery, selectedCategories, filteredNodes.length, dimensions]);

  // 노드 그리기 함수
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const size = node.val * 1.5; // 노드 크기 줄임
    const fontSize = Math.max(10 / globalScale, 3);
    const isHovered = hoveredNode?.id === node.id;
    const isHighlighted = searchQuery && (
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.company.toLowerCase().includes(searchQuery.toLowerCase())
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

    // 이름 라벨 - 항상 표시
    const labelFontSize = Math.max(12 / globalScale, 4);
    ctx.font = `bold ${labelFontSize}px Sans-Serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = isHovered || isHighlighted ? '#fff' : 'rgba(255,255,255,0.9)';
    ctx.fillText(node.name, node.x, node.y + size + 5);
  }, [imageCache, hoveredNode, searchQuery]);

  // 링크 그리기 - 같은 카테고리(초록)와 타 카테고리(보라) 구분
  const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
    const start = link.source;
    const end = link.target;

    if (!start.x || !end.x) return;

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);

    // 연결 강도에 따라 선 굵기와 투명도 조절
    const strength = link.strength || 0.1;

    // 같은 카테고리: 초록색, 타 카테고리: 보라색
    if (link.type === 'category') {
      ctx.strokeStyle = `rgba(34, 197, 94, ${0.3 + strength * 0.5})`;
    } else {
      ctx.strokeStyle = `rgba(168, 85, 247, ${0.3 + strength * 0.5})`;
    }
    ctx.lineWidth = 1 + strength * 2;

    ctx.stroke();
  }, []);

  // 초기 줌 설정 - 전체가 보이도록
  useEffect(() => {
    if (fgRef.current) {
      setTimeout(() => {
        fgRef.current.zoomToFit(500, 100);
      }, 300);
    }
  }, []);

  return (
    <div className="bg-gray-900" style={{ cursor: 'grab' }}>
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
        d3AlphaDecay={1}
        d3VelocityDecay={1}
        cooldownTicks={0}
        warmupTicks={0}
        onNodeClick={(node: any) => {
          if (node) {
            onNodeClick(node as GraphNode);
          }
        }}
        onNodeHover={(node: any) => onNodeHover(node as GraphNode | null)}
        nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
          const size = (node.val || 8) * 2;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, size + 5, 0, 2 * Math.PI, false);
          ctx.fill();
        }}
        enableNodeDrag={false}
        enableZoomPanInteraction={true}
        minZoom={0.1}
        maxZoom={10}
      />
    </div>
  );
}
