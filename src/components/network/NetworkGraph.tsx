'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNetworkStore } from '@/store/networkStore';
import { NetworkNode } from '@/types';
import { Plus, Minus, Maximize2, RotateCcw } from 'lucide-react';

interface GraphNode extends NetworkNode {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphEdge {
  source: string | GraphNode;
  target: string | GraphNode;
  degree: number;
}

// 색상 상수 - 계층별 차별화
const COLORS = {
  // 노드 색상
  nodeCore: '#86C9F2',           // 중앙 노드 - 밝은 청색
  nodePrimary: '#4A90E2',        // 1차 연결 - 청색
  nodeSecondary: '#2C529C',      // 2차 연결 - 보라색
  nodeTertiary: '#9B8ED9',       // 3차 연결 - 연보라

  // 엣지 색상
  edgePrimary: '#4A90E2',        // 1차 연결선
  edgeSecondary: '#2C529C',      // 2차 연결선
  edgeTertiary: '#9B8ED9',       // 3차 연결선
  edgeHighlighted: '#FFB800',    // 강조된 연결선

  // 상호작용 색상
  hover: '#86C9F2',
  selected: '#FFD700',
  focused: '#FFB800',

  // 배경 색상
  nodeBg: '#162A4A',
  nodeBgHover: '#2D3748',

  // 텍스트 색상
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textDimmed: 'rgba(139, 148, 158, 0.3)',
};

// 카테고리별 색상 매핑
const CATEGORY_COLORS: { [key: string]: string } = {
  '의료기기': '#4A90E2',    // 파랑
  '솔루션': '#9B59B6',      // 보라
  '투자': '#E74C3C',        // 빨강
  '바이오': '#2ECC71',      // 초록
  '제약': '#F39C12',        // 주황
  '법률': '#1ABC9C',        // 청록
  '의료기관': '#3498DB',    // 하늘
  '비즈니스': '#E67E22',    // 진한 주황
  '특허': '#16A085',        // 진한 청록
};

// 노드 크기 상수 - 프로필 이미지가 잘 보이도록 확대
const NODE_SIZES = {
  core: 40,        // 중앙 노드
  primary: 32,     // 1차 연결 (얼굴이 잘 보이도록)
  secondary: 20,   // 2차 연결
  tertiary: 14,    // 3차 연결 (최소)
};

// 폰트 크기 상수
const FONT_SIZES = {
  core: 16,
  primary: 14,
  secondary: 12,
  tertiary: 11,
};

// 프로필 이미지 캐시
const imageCache = new Map<string, HTMLImageElement>();
const imageLoadingSet = new Set<string>();

function getProfileImage(src: string): HTMLImageElement | null {
  if (imageCache.has(src)) return imageCache.get(src)!;
  if (imageLoadingSet.has(src)) return null;

  imageLoadingSet.add(src);
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    imageCache.set(src, img);
    imageLoadingSet.delete(src);
  };
  img.onerror = () => {
    imageLoadingSet.delete(src);
  };
  img.src = src;
  return null;
}

// 시맨틱 줌 레벨 상수
const ZOOM_CLUSTER_THRESHOLD = 0.7;   // 이하: 클러스터 뷰
const ZOOM_DETAIL_THRESHOLD = 1.4;    // 이상: 상세 뷰 (회사/직책 추가)
const PROFILE_IMAGE_ZOOM_THRESHOLD = 0.8; // 프로필 이미지는 기본 줌부터 표시

export default function NetworkGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const edgeAnimationRef = useRef<number>(0);
  const categoryAnglesRef = useRef<Map<string, { start: number; end: number; nodes: NetworkNode[] }>>(new Map());

  const {
    nodes,
    edges,
    highlightedKeyword,
    setSelectedNode,
    focusedNodeId,
    setFocusedNodeId,
  } = useNetworkStore();

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [targetTransform, setTargetTransform] = useState<{ x: number; y: number; scale: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: GraphNode } | null>(null);
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());
  const lastPosRef = useRef({ x: 0, y: 0 });
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Edge animation offset
  useEffect(() => {
    const animate = () => {
      edgeAnimationRef.current = (edgeAnimationRef.current + 0.5) % 20;
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Initialize nodes with fixed positions (category-based clustering)
  useEffect(() => {
    if (nodes.length === 0 || dimensions.width === 0) return;

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    // Group nodes by degree
    const degree0Nodes = nodes.filter(n => n.degree === 0);
    const degree1Nodes = nodes.filter(n => n.degree === 1);
    const degree2Nodes = nodes.filter(n => n.degree === 2);

    // Group degree 1 nodes by category
    const categoriesMap = new Map<string, NetworkNode[]>();
    degree1Nodes.forEach(node => {
      const category = node.category || '기타';
      if (!categoriesMap.has(category)) {
        categoriesMap.set(category, []);
      }
      categoriesMap.get(category)!.push(node);
    });

    // Sort categories by size (largest first) for better visual balance
    const sortedCategories = Array.from(categoriesMap.entries())
      .sort((a, b) => b[1].length - a[1].length);

    // Calculate angle sectors for each category with gaps
    const totalNodes = degree1Nodes.length;
    const gapAngle = 0.15; // Larger gap between sectors for clearer separation
    const totalGaps = sortedCategories.length * gapAngle;
    const usableAngle = Math.PI * 2 - totalGaps;
    let currentAngle = -Math.PI / 2; // Start at top

    const categoryAngles = new Map<string, { start: number; end: number; nodes: NetworkNode[] }>();
    sortedCategories.forEach(([category, categoryNodes]) => {
      const angleSpan = (categoryNodes.length / totalNodes) * usableAngle;
      categoryAngles.set(category, {
        start: currentAngle,
        end: currentAngle + angleSpan,
        nodes: categoryNodes,
      });
      currentAngle += angleSpan + gapAngle; // Add gap after each sector
    });

    // Store for rendering category labels
    categoryAnglesRef.current = categoryAngles;

    nodesRef.current = nodes.map((node) => {
      let x = centerX;
      let y = centerY;

      if (node.degree === 0) {
        x = centerX;
        y = centerY;
      } else if (node.degree === 1) {
        // Position within category sector - multi-ring layout for large categories
        const category = node.category || '기타';
        const categoryInfo = categoryAngles.get(category);

        if (categoryInfo) {
          const { start, end, nodes: categoryNodes } = categoryInfo;
          const nodeIndex = categoryNodes.findIndex(n => n.id === node.id);
          const nodesInCategory = categoryNodes.length;

          // Calculate how many nodes fit per ring based on arc length
          // Minimum spacing between nodes (in pixels) to avoid overlap
          const minNodeSpacing = 110;
          const baseRadius = 300;
          const ringGap = 95; // distance between rings
          const sectorPadding = 0.05;
          const sectorAngle = (end - start) * (1 - 2 * sectorPadding);

          // Calculate max nodes per ring at the base radius
          const arcLength = sectorAngle * baseRadius;
          const nodesPerRing = Math.max(1, Math.floor(arcLength / minNodeSpacing));

          // Determine which ring this node belongs to
          const ringIndex = Math.floor(nodeIndex / nodesPerRing);
          const indexInRing = nodeIndex % nodesPerRing;
          const nodesInThisRing = Math.min(nodesPerRing, nodesInCategory - ringIndex * nodesPerRing);

          const radius = baseRadius + ringIndex * ringGap;
          const angle = nodesInThisRing === 1
            ? (start + end) / 2
            : start + (end - start) * sectorPadding +
              (indexInRing / (nodesInThisRing - 1)) * sectorAngle;

          x = centerX + Math.cos(angle) * radius;
          y = centerY + Math.sin(angle) * radius;
        }
      } else if (node.degree === 2) {
        const index = degree2Nodes.findIndex(n => n.id === node.id);
        const angle = (index / degree2Nodes.length) * Math.PI * 2 - Math.PI / 2;
        const radius = 550;
        x = centerX + Math.cos(angle) * radius;
        y = centerY + Math.sin(angle) * radius;
      }

      return {
        ...node,
        x,
        y,
        vx: 0,
        vy: 0,
        fx: x,
        fy: y,
      };
    });

    edgesRef.current = edges.map(edge => ({
      ...edge,
      source: edge.source,
      target: edge.target,
    }));
  }, [nodes, edges, dimensions]);

  // 확장 상태에 따라 보이는 노드 ID를 계산
  const getVisibleNodeIds = useCallback((): Set<string> => {
    const visible = new Set<string>();

    // degree 0 (나 자신)은 항상 보임
    for (const node of nodesRef.current) {
      if (node.degree === 0) visible.add(node.id);
    }

    // degree 1 (직접 인맥)은 항상 보임
    for (const node of nodesRef.current) {
      if (node.degree === 1) visible.add(node.id);
    }

    // degree 2 노드는 연결된 degree 1 노드가 확장된 경우에만 보임
    for (const edge of edgesRef.current) {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
      const sourceNode = nodesRef.current.find(n => n.id === sourceId);
      const targetNode = nodesRef.current.find(n => n.id === targetId);

      if (sourceNode?.degree === 1 && targetNode?.degree === 2 && expandedNodeIds.has(sourceId)) {
        visible.add(targetId);
      }
      if (targetNode?.degree === 1 && sourceNode?.degree === 2 && expandedNodeIds.has(targetId)) {
        visible.add(sourceId);
      }
    }

    return visible;
  }, [expandedNodeIds]);

  // 보이는 엣지인지 판단
  const isEdgeVisible = useCallback((edge: GraphEdge, visibleIds: Set<string>): boolean => {
    const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
    const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
    return visibleIds.has(sourceId) && visibleIds.has(targetId);
  }, []);

  // 포커스된 노드와 연결된 노드 ID들을 계산
  const getConnectedNodeIds = useCallback((nodeId: string | null): Set<string> => {
    if (!nodeId) return new Set();

    const connectedIds = new Set<string>();
    connectedIds.add(nodeId);

    for (const edge of edgesRef.current) {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;

      if (sourceId === nodeId) {
        connectedIds.add(targetId);
      } else if (targetId === nodeId) {
        connectedIds.add(sourceId);
      }
    }

    return connectedIds;
  }, []);

  // 노드 크기 계산
  const getNodeSize = useCallback((node: GraphNode, isHovered: boolean, isFocused: boolean): number => {
    let size = node.degree === 0 ? NODE_SIZES.core :
               node.degree === 1 ? NODE_SIZES.primary :
               node.degree === 2 ? NODE_SIZES.secondary : NODE_SIZES.tertiary;

    if (isHovered) size += 6;
    if (isFocused && node.degree !== 0) size += 4;

    return size;
  }, []);

  // 노드 색상 계산 (카테고리 기반)
  const getNodeColor = useCallback((node: GraphNode, isDimmed: boolean): string => {
    if (node.degree === 0) {
      return isDimmed ? 'rgba(0, 217, 255, 0.3)' : COLORS.nodeCore;
    }

    const category = node.category || '기타';
    const categoryColor = CATEGORY_COLORS[category] || COLORS.nodePrimary;

    if (isDimmed) {
      // Convert hex to rgba with opacity
      const r = parseInt(categoryColor.slice(1, 3), 16);
      const g = parseInt(categoryColor.slice(3, 5), 16);
      const b = parseInt(categoryColor.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, 0.3)`;
    }

    return categoryColor;
  }, []);

  // 노드 그리기 헬퍼 함수
  const drawNode = useCallback((
    ctx: CanvasRenderingContext2D,
    node: GraphNode,
    options: {
      isHovered: boolean;
      isFocused: boolean;
      isConnected: boolean;
      isDimmed: boolean;
      isHighlighted: boolean;
    }
  ) => {
    const { isHovered, isFocused, isConnected, isDimmed, isHighlighted } = options;
    const radius = getNodeSize(node, isHovered, isFocused);
    const x = node.x || 0;
    const y = node.y || 0;

    // 1. Outer Glow Effect (호버/포커스/중앙 노드만)
    if ((node.degree === 0 || isHovered || isFocused || isConnected) && !isDimmed) {
      const glowRadius = radius * (isHovered || isFocused ? 3 : 2.5);
      const gradient = ctx.createRadialGradient(x, y, radius, x, y, glowRadius);

      if (isFocused && node.degree !== 0) {
        gradient.addColorStop(0, 'rgba(255, 184, 0, 0.6)');
      } else if (isConnected && !isFocused) {
        gradient.addColorStop(0, 'rgba(255, 184, 0, 0.4)');
      } else if (node.degree === 0) {
        gradient.addColorStop(0, 'rgba(0, 217, 255, 0.5)');
      } else if (isHighlighted) {
        gradient.addColorStop(0, 'rgba(0, 229, 255, 0.5)');
      } else {
        // Use category color for glow
        const category = node.category || '기타';
        const categoryColor = CATEGORY_COLORS[category] || COLORS.nodePrimary;
        const r = parseInt(categoryColor.slice(1, 3), 16);
        const g = parseInt(categoryColor.slice(3, 5), 16);
        const b = parseInt(categoryColor.slice(5, 7), 16);
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.4)`);
      }
      gradient.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // 2. Node Circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);

    if (node.degree === 0) {
      // 중앙 노드: 그라디언트
      const gradient = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
      gradient.addColorStop(0, isDimmed ? 'rgba(0, 217, 255, 0.3)' : COLORS.nodeCore);
      gradient.addColorStop(1, isDimmed ? 'rgba(123, 104, 238, 0.3)' : COLORS.nodeSecondary);
      ctx.fillStyle = gradient;
    } else if (isFocused) {
      ctx.fillStyle = COLORS.focused;
    } else if (isConnected) {
      ctx.fillStyle = COLORS.nodeBgHover;
    } else {
      ctx.fillStyle = isDimmed ? 'rgba(22, 27, 34, 0.3)' : COLORS.nodeBg;
    }
    ctx.fill();

    // 3. Border (카테고리별 색상)
    ctx.lineWidth = isHovered ? 3 : isFocused ? 4 : 2;
    if (isDimmed) {
      ctx.strokeStyle = 'rgba(33, 38, 45, 0.3)';
    } else if (isFocused && node.degree !== 0) {
      ctx.strokeStyle = COLORS.selected;
    } else if (isConnected && node.degree !== 0) {
      ctx.strokeStyle = COLORS.focused;
    } else if (isHighlighted) {
      ctx.strokeStyle = COLORS.hover;
    } else if (node.degree === 0) {
      ctx.strokeStyle = COLORS.nodeCore;
    } else {
      // Use category color for border
      const category = node.category || '기타';
      ctx.strokeStyle = CATEGORY_COLORS[category] || COLORS.nodePrimary;
    }
    ctx.stroke();

    // 4. Profile Image (줌 레벨이 충분히 높을 때만 표시)
    if (node.profileImage && transform.scale >= PROFILE_IMAGE_ZOOM_THRESHOLD && !isDimmed) {
      const img = getProfileImage(node.profileImage);
      if (img) {
        // 줌 레벨에 따른 이미지 투명도 (부드러운 페이드인)
        const fadeStart = PROFILE_IMAGE_ZOOM_THRESHOLD;
        const fadeEnd = PROFILE_IMAGE_ZOOM_THRESHOLD + 0.3;
        const imageAlpha = Math.min(1, (transform.scale - fadeStart) / (fadeEnd - fadeStart));

        ctx.save();
        ctx.globalAlpha = imageAlpha;

        // 원형 클리핑
        ctx.beginPath();
        ctx.arc(x, y, radius - 2, 0, Math.PI * 2);
        ctx.clip();

        // 이미지를 원 안에 맞춰 그리기
        ctx.drawImage(img, x - radius + 2, y - radius + 2, (radius - 2) * 2, (radius - 2) * 2);

        ctx.restore();

        // 이미지 위에 테두리 다시 그리기
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.lineWidth = isHovered ? 3 : isFocused ? 4 : 2.5;
        if (isFocused && node.degree !== 0) {
          ctx.strokeStyle = COLORS.selected;
        } else if (isConnected && node.degree !== 0) {
          ctx.strokeStyle = COLORS.focused;
        } else if (node.degree === 0) {
          ctx.strokeStyle = COLORS.nodeCore;
        } else {
          const category = node.category || '기타';
          ctx.strokeStyle = CATEGORY_COLORS[category] || COLORS.nodePrimary;
        }
        ctx.stroke();
      }
    }

    // Labels are drawn separately in a second pass (see drawNodeLabel)
  }, [getNodeSize, transform.scale]);

  // 라벨 영역이 다른 노드 원과 겹치는지 검사
  const labelOverlapsNode = useCallback((
    labelCenterX: number, labelCenterY: number, labelHalfW: number, labelHalfH: number,
    node: GraphNode, allNodes: GraphNode[]
  ): boolean => {
    for (const other of allNodes) {
      if (other.id === node.id) continue;
      const ox = other.x || 0;
      const oy = other.y || 0;
      const or = other.degree === 0 ? NODE_SIZES.core :
                 other.degree === 1 ? NODE_SIZES.primary : NODE_SIZES.secondary;

      // 사각형(라벨)과 원(노드) 충돌 검사
      const closestX = Math.max(labelCenterX - labelHalfW, Math.min(ox, labelCenterX + labelHalfW));
      const closestY = Math.max(labelCenterY - labelHalfH, Math.min(oy, labelCenterY + labelHalfH));
      const dx = ox - closestX;
      const dy = oy - closestY;
      if (dx * dx + dy * dy < or * or) return true;
    }
    return false;
  }, []);

  // 노드 라벨 그리기 (별도 패스로 모든 노드 위에 렌더링)
  const drawNodeLabel = useCallback((
    ctx: CanvasRenderingContext2D,
    node: GraphNode,
    options: { isDimmed: boolean; isFocused: boolean; allNodes: GraphNode[] }
  ) => {
    const { isDimmed, isFocused, allNodes } = options;
    const radius = getNodeSize(node, false, isFocused);
    const x = node.x || 0;
    const y = node.y || 0;

    const fontSize = node.degree === 0 ? FONT_SIZES.core :
                     node.degree === 1 ? FONT_SIZES.primary : 11;

    ctx.font = `${isFocused || node.degree === 0 ? 'bold' : '500'} ${fontSize}px -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif`;

    const name = node.name.length > 6 ? node.name.slice(0, 6) + '...' : node.name;

    // 항상 노드 바로 아래 중앙 정렬
    const labelX = x;
    const labelY = y + radius + 14;
    const textWidth = ctx.measureText(name).width;
    const labelHalfW = textWidth / 2 + 5;
    const labelHalfH = 9;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (!isDimmed) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.roundRect(labelX - labelHalfW, labelY - labelHalfH, labelHalfW * 2, labelHalfH * 2, 4);
      ctx.fill();
    }

    ctx.fillStyle = isDimmed ? COLORS.textDimmed : COLORS.textPrimary;
    ctx.fillText(name, labelX, labelY);

    // 상세 뷰: 회사명 + 직책 표시
    if (transform.scale >= ZOOM_DETAIL_THRESHOLD && !isDimmed && node.degree !== 0) {
      const detailFadeStart = ZOOM_DETAIL_THRESHOLD;
      const detailFadeEnd = ZOOM_DETAIL_THRESHOLD + 0.3;
      const detailAlpha = Math.min(1, (transform.scale - detailFadeStart) / (detailFadeEnd - detailFadeStart));

      const companyText = node.company || '';
      const positionText = node.position || '';
      if (companyText || positionText) {
        ctx.save();
        ctx.globalAlpha = detailAlpha;
        ctx.font = '11px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const detailY = labelY + 15;
        const detailText = companyText && positionText
          ? `${companyText} · ${positionText}`
          : companyText || positionText;
        const truncDetail = detailText.length > 14 ? detailText.slice(0, 14) + '...' : detailText;

        const detailWidth = ctx.measureText(truncDetail).width;
        const detailHalfW = detailWidth / 2 + 5;
        const detailHalfH = 8;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.beginPath();
        ctx.roundRect(labelX - detailHalfW, detailY - detailHalfH, detailHalfW * 2, detailHalfH * 2, 3);
        ctx.fill();

        ctx.fillStyle = COLORS.textSecondary;
        ctx.fillText(truncDetail, labelX, detailY);
        ctx.restore();
      }
    }
  }, [getNodeSize, transform.scale, labelOverlapsNode]);

  // Render
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const allNodes = nodesRef.current;
    const allEdges = edgesRef.current;

    const visibleIds = getVisibleNodeIds();
    const nodes = allNodes.filter(n => visibleIds.has(n.id));
    const edges = allEdges.filter(e => isEdgeVisible(e, visibleIds));

    const connectedNodeIds = getConnectedNodeIds(focusedNodeId);
    const hasFocusedNode = focusedNodeId !== null;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const categoryAngles = categoryAnglesRef.current;
    const isClusterView = transform.scale < ZOOM_CLUSTER_THRESHOLD;
    const isDetailView = transform.scale >= ZOOM_DETAIL_THRESHOLD;

    // ===================================================================
    // ===== CLUSTER VIEW (줌 아웃 시: 카테고리별 하나의 큰 원) =====
    // ===================================================================
    if (isClusterView) {
      // 중앙 노드 그리기
      const centerNode = nodes.find(n => n.degree === 0);
      if (centerNode) {
        drawNode(ctx, centerNode, {
          isHovered: hoveredNode?.id === centerNode.id,
          isFocused: false,
          isConnected: false,
          isDimmed: false,
          isHighlighted: false,
        });
        drawNodeLabel(ctx, centerNode, { isDimmed: false, isFocused: false, allNodes: nodes });
      }

      // 카테고리별 클러스터 원 그리기
      categoryAngles.forEach((info, category) => {
        const { start, end, nodes: categoryNodes } = info;
        const midAngle = (start + end) / 2;
        const categoryColor = CATEGORY_COLORS[category] || COLORS.nodePrimary;
        const r = parseInt(categoryColor.slice(1, 3), 16);
        const g = parseInt(categoryColor.slice(3, 5), 16);
        const b = parseInt(categoryColor.slice(5, 7), 16);

        // 클러스터 중심 좌표 (카테고리 노드들의 평균 위치)
        let cx = 0, cy = 0;
        const catGraphNodes = nodesRef.current.filter(n => n.category === category && n.degree === 1);
        if (catGraphNodes.length > 0) {
          catGraphNodes.forEach(n => { cx += (n.x || 0); cy += (n.y || 0); });
          cx /= catGraphNodes.length;
          cy /= catGraphNodes.length;
        } else {
          cx = centerX + Math.cos(midAngle) * 280;
          cy = centerY + Math.sin(midAngle) * 280;
        }

        const clusterRadius = Math.min(80, 40 + categoryNodes.length * 3);

        // 클러스터 글로우
        const glowGrad = ctx.createRadialGradient(cx, cy, clusterRadius, cx, cy, clusterRadius * 2.5);
        glowGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.35)`);
        glowGrad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(cx, cy, clusterRadius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.fill();

        // 클러스터 원
        ctx.beginPath();
        ctx.arc(cx, cy, clusterRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.25)`;
        ctx.fill();
        ctx.strokeStyle = categoryColor;
        ctx.lineWidth = 3;
        ctx.stroke();

        // 카테고리명 + 인원수
        const labelText = category;
        const countText = `${categoryNodes.length}명`;
        ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(labelText, cx, cy - 8);

        ctx.font = '13px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.9)`;
        ctx.fillText(countText, cx, cy + 12);
      });

      ctx.restore();
      return;
    }

    // ===================================================================
    // ===== NODE VIEW & DETAIL VIEW (scale >= 0.7) =====
    // ===================================================================

    // (섹터 배경 쐐기 제거 — 노드 테두리 색상만으로 카테고리 구분)

    // Draw category labels (바깥쪽)
    categoryAngles.forEach((info, category) => {
      const { start, end, nodes: catNodes } = info;
      const midAngle = (start + end) / 2;
      const categoryColor = CATEGORY_COLORS[category] || COLORS.nodePrimary;

      // 카테고리 노드들의 최대 반경 기반으로 라벨 위치 계산
      const catGraphNodes = nodesRef.current.filter(n => n.category === category && n.degree === 1);
      let maxDist = 280;
      catGraphNodes.forEach(n => {
        const dist = Math.sqrt(((n.x || 0) - centerX) ** 2 + ((n.y || 0) - centerY) ** 2);
        if (dist > maxDist) maxDist = dist;
      });
      const labelRadius = maxDist + 65; // 노드 바깥쪽

      const labelX = centerX + Math.cos(midAngle) * labelRadius;
      const labelY = centerY + Math.sin(midAngle) * labelRadius;

      const labelText = `${category} (${catNodes.length})`;
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const textWidth = ctx.measureText(labelText).width;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.beginPath();
      ctx.roundRect(labelX - textWidth / 2 - 8, labelY - 11, textWidth + 16, 22, 6);
      ctx.fill();

      ctx.strokeStyle = categoryColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = categoryColor;
      ctx.fillText(labelText, labelX, labelY);
    });

    // ===== Draw Edges =====
    // 1. Non-connected edges first (drawn behind)
    for (const edge of edges) {
      const source = nodes.find(n => n.id === (typeof edge.source === 'string' ? edge.source : edge.source.id));
      const target = nodes.find(n => n.id === (typeof edge.target === 'string' ? edge.target : edge.target.id));
      if (!source || !target) continue;

      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
      const isConnectedToFocused = hasFocusedNode && (sourceId === focusedNodeId || targetId === focusedNodeId);

      if (isConnectedToFocused) continue;

      const isHighlighted = highlightedKeyword &&
        (source.keywords.includes(highlightedKeyword) || target.keywords.includes(highlightedKeyword));
      const dimmedByFocus = hasFocusedNode && !isConnectedToFocused;

      ctx.beginPath();
      ctx.moveTo(source.x || 0, source.y || 0);
      ctx.lineTo(target.x || 0, target.y || 0);

      if (edge.degree === 1) {
        ctx.strokeStyle = dimmedByFocus
          ? 'rgba(74, 144, 226, 0.05)'
          : isHighlighted ? COLORS.edgePrimary : 'rgba(74, 144, 226, 0.15)';
        ctx.lineWidth = isHighlighted ? 2 : 1;
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = dimmedByFocus
          ? 'rgba(123, 104, 238, 0.03)'
          : isHighlighted ? COLORS.edgeSecondary : 'rgba(123, 104, 238, 0.1)';
        ctx.lineWidth = 0.5;
        ctx.setLineDash([4, 8]);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 2. Connected edges (drawn on top with animation)
    for (const edge of edges) {
      const source = nodes.find(n => n.id === (typeof edge.source === 'string' ? edge.source : edge.source.id));
      const target = nodes.find(n => n.id === (typeof edge.target === 'string' ? edge.target : edge.target.id));
      if (!source || !target) continue;

      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
      const isConnectedToFocused = hasFocusedNode && (sourceId === focusedNodeId || targetId === focusedNodeId);

      if (!isConnectedToFocused) continue;

      // Main edge
      ctx.beginPath();
      ctx.moveTo(source.x || 0, source.y || 0);
      ctx.lineTo(target.x || 0, target.y || 0);
      ctx.strokeStyle = COLORS.edgeHighlighted;
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.stroke();

      // Animated flow effect
      ctx.beginPath();
      ctx.moveTo(source.x || 0, source.y || 0);
      ctx.lineTo(target.x || 0, target.y || 0);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 16]);
      ctx.lineDashOffset = -edgeAnimationRef.current;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
    }

    // ===== Draw Nodes =====
    // 1. Non-connected nodes first
    for (const node of nodes) {
      const isConnectedToFocused = connectedNodeIds.has(node.id);
      if (hasFocusedNode && isConnectedToFocused) continue;

      const isHighlighted = !!(highlightedKeyword && node.keywords.includes(highlightedKeyword));
      const isHovered = hoveredNode?.id === node.id;
      const isDimmed = !!(highlightedKeyword && !isHighlighted) || (hasFocusedNode && !isConnectedToFocused);

      drawNode(ctx, node, {
        isHovered,
        isFocused: false,
        isConnected: false,
        isDimmed,
        isHighlighted,
      });
    }

    // 2. Connected nodes (drawn on top)
    if (hasFocusedNode) {
      for (const node of nodes) {
        const isConnectedToFocused = connectedNodeIds.has(node.id);
        if (!isConnectedToFocused) continue;

        const isFocused = focusedNodeId === node.id;
        const isHovered = hoveredNode?.id === node.id;

        drawNode(ctx, node, {
          isHovered,
          isFocused,
          isConnected: true,
          isDimmed: false,
          isHighlighted: false,
        });
      }
    }

    // ===== Draw Labels (separate pass - always on top of all nodes) =====
    for (const node of nodes) {
      const isConnectedToFocused = connectedNodeIds.has(node.id);
      const isHighlighted = !!(highlightedKeyword && node.keywords.includes(highlightedKeyword));
      const isDimmed = !!(highlightedKeyword && !isHighlighted) || (hasFocusedNode && !isConnectedToFocused);
      const isFocused = focusedNodeId === node.id;

      drawNodeLabel(ctx, node, { isDimmed, isFocused, allNodes: nodes });
    }

    ctx.restore();
  }, [transform, highlightedKeyword, hoveredNode, focusedNodeId, getConnectedNodeIds, getVisibleNodeIds, isEdgeVisible, drawNode, drawNodeLabel, dimensions.width, dimensions.height]);

  // Smooth animation to target transform
  useEffect(() => {
    if (!targetTransform) return;

    const animateToTarget = () => {
      setTransform(prev => {
        const dx = targetTransform.x - prev.x;
        const dy = targetTransform.y - prev.y;
        const ds = targetTransform.scale - prev.scale;
        const ease = 0.12;

        const newX = prev.x + dx * ease;
        const newY = prev.y + dy * ease;
        const newScale = prev.scale + ds * ease;

        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(ds) < 0.01) {
          setTargetTransform(null);
          return targetTransform;
        }

        return { x: newX, y: newY, scale: newScale };
      });
    };

    const intervalId = setInterval(animateToTarget, 16);
    return () => clearInterval(intervalId);
  }, [targetTransform]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      render();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [render]);

  // Mouse interactions
  const getNodeAtPosition = (x: number, y: number): GraphNode | null => {
    const adjustedX = (x - transform.x) / transform.scale;
    const adjustedY = (y - transform.y) / transform.scale;

    const visibleIds = getVisibleNodeIds();
    for (const node of nodesRef.current) {
      if (!visibleIds.has(node.id)) continue;
      const dx = (node.x || 0) - adjustedX;
      const dy = (node.y || 0) - adjustedY;
      const radius = node.degree === 0 ? NODE_SIZES.core :
                     node.degree === 1 ? NODE_SIZES.primary : NODE_SIZES.secondary;

      if (dx * dx + dy * dy < (radius + 10) * (radius + 10)) {
        return node;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const node = getNodeAtPosition(x, y);

    if (node) {
      setDraggedNode(node);
      node.fx = node.x;
      node.fy = node.y;
    } else {
      setIsDragging(true);
    }

    lastPosRef.current = { x: e.clientX, y: e.clientY };

    // Clear tooltip
    setTooltip(null);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (draggedNode) {
      draggedNode.fx = (x - transform.x) / transform.scale;
      draggedNode.fy = (y - transform.y) / transform.scale;
      setTooltip(null);
    } else if (isDragging) {
      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;
      setTransform(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));
      lastPosRef.current = { x: e.clientX, y: e.clientY };
      setTooltip(null);
    } else {
      const node = getNodeAtPosition(x, y);
      setHoveredNode(node);

      if (canvasRef.current) {
        if (transform.scale < ZOOM_CLUSTER_THRESHOLD) {
          const cluster = getClusterAtPosition(x, y);
          canvasRef.current.style.cursor = cluster ? 'pointer' : 'grab';
        } else {
          canvasRef.current.style.cursor = node ? 'pointer' : 'grab';
        }
      }

      // Tooltip logic with delay
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }

      if (node && node.degree !== 0) {
        hoverTimeoutRef.current = setTimeout(() => {
          setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top - 60, node });
        }, 500);
      } else {
        setTooltip(null);
      }
    }
  };

  const handleMouseUp = () => {
    if (draggedNode) {
      draggedNode.x = draggedNode.fx ?? draggedNode.x;
      draggedNode.y = draggedNode.fy ?? draggedNode.y;
      setDraggedNode(null);
    }
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    handleMouseUp();
    setHoveredNode(null);
    setTooltip(null);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const focusOnNode = (node: GraphNode) => {
    if (!node.x || !node.y) return;

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    const targetX = centerX - node.x * transform.scale;
    const targetY = centerY - node.y * transform.scale;

    setTargetTransform({
      x: targetX,
      y: targetY,
      scale: transform.scale,
    });

    setFocusedNodeId(node.id);
  };

  // 클러스터 뷰에서 클릭한 카테고리 감지
  const getClusterAtPosition = (x: number, y: number): string | null => {
    const adjustedX = (x - transform.x) / transform.scale;
    const adjustedY = (y - transform.y) / transform.scale;
    const categoryAngles = categoryAnglesRef.current;

    for (const [category, info] of categoryAngles) {
      const catGraphNodes = nodesRef.current.filter(n => n.category === category && n.degree === 1);
      if (catGraphNodes.length === 0) continue;

      let cx = 0, cy = 0;
      catGraphNodes.forEach(n => { cx += (n.x || 0); cy += (n.y || 0); });
      cx /= catGraphNodes.length;
      cy /= catGraphNodes.length;

      const clusterRadius = Math.min(80, 40 + info.nodes.length * 3);
      const dx = adjustedX - cx;
      const dy = adjustedY - cy;
      if (dx * dx + dy * dy < clusterRadius * clusterRadius) {
        return category;
      }
    }
    return null;
  };

  const handleClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 클러스터 뷰에서는 카테고리 클릭 → 줌인
    if (transform.scale < ZOOM_CLUSTER_THRESHOLD) {
      const category = getClusterAtPosition(x, y);
      if (category) {
        const catGraphNodes = nodesRef.current.filter(n => n.category === category && n.degree === 1);
        if (catGraphNodes.length > 0) {
          let cx = 0, cy = 0;
          catGraphNodes.forEach(n => { cx += (n.x || 0); cy += (n.y || 0); });
          cx /= catGraphNodes.length;
          cy /= catGraphNodes.length;

          const targetScale = 1.0;
          setTargetTransform({
            x: dimensions.width / 2 - cx * targetScale,
            y: dimensions.height / 2 - cy * targetScale,
            scale: targetScale,
          });
        }
      }
      return;
    }

    const node = getNodeAtPosition(x, y);

    if (node) {
      // 같은 노드를 다시 클릭하면 포커스 해제
      if (focusedNodeId === node.id) {
        setFocusedNodeId(null);
        setSelectedNode(null);
        setExpandedNodeIds(prev => {
          const next = new Set(prev);
          next.delete(node.id);
          return next;
        });
        return;
      }

      focusOnNode(node);
      setSelectedNode(node);

      // degree 1 노드 클릭 시 2차 인맥 확장/축소 토글
      if (node.degree === 1) {
        setExpandedNodeIds(prev => {
          const next = new Set(prev);
          if (next.has(node.id)) {
            next.delete(node.id);
          } else {
            next.add(node.id);
          }
          return next;
        });
      }
    } else {
      setFocusedNodeId(null);
      setSelectedNode(null);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.3, Math.min(3, transform.scale * delta));

    setTransform(prev => ({
      x: x - (x - prev.x) * (newScale / prev.scale),
      y: y - (y - prev.y) * (newScale / prev.scale),
      scale: newScale,
    }));
  };

  const handleZoomIn = () => {
    setTransform(prev => ({
      ...prev,
      scale: Math.min(3, prev.scale * 1.25),
    }));
  };

  const handleZoomOut = () => {
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.3, prev.scale * 0.8),
    }));
  };

  const handleFitToScreen = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
    setFocusedNodeId(null);
  };

  const handleReset = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
    setFocusedNodeId(null);
    setSelectedNode(null);
  };

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onWheel={handleWheel}
        className="cursor-grab active:cursor-grabbing"
      />

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute pointer-events-none z-50"
            style={{ left: tooltip.x, top: tooltip.y, transform: 'translateX(-50%)' }}
          >
            <div className="bg-[#151922]/95 backdrop-blur-xl border border-[#1E3A5F] rounded-xl px-4 py-3 shadow-2xl">
              <div className="text-sm font-semibold text-white mb-1">{tooltip.node.name}</div>
              <div className="text-xs text-[#8BA4C4]">{tooltip.node.company}</div>
              <div className="text-xs text-[#8BA4C4]">{tooltip.node.position}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFB800]/20 text-[#FFB800]">
                  {tooltip.node.degree}단계
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#86C9F2]/20 text-[#86C9F2]">
                  {tooltip.node.connectionCount}명 연결
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zoom Controls */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
        <button
          onClick={handleZoomIn}
          className="zoom-btn group"
          title="확대"
        >
          <Plus size={20} className="group-hover:text-[#86C9F2] transition-colors" />
        </button>
        <button
          onClick={handleZoomOut}
          className="zoom-btn group"
          title="축소"
        >
          <Minus size={20} className="group-hover:text-[#86C9F2] transition-colors" />
        </button>
        <button
          onClick={handleFitToScreen}
          className="zoom-btn group"
          title="전체 보기"
        >
          <Maximize2 size={18} className="group-hover:text-[#86C9F2] transition-colors" />
        </button>
        <button
          onClick={handleReset}
          className="zoom-btn group"
          title="초기화"
        >
          <RotateCcw size={18} className="group-hover:text-[#86C9F2] transition-colors" />
        </button>
      </div>

      {/* Zoom Level Indicator */}
      <div className="absolute bottom-6 left-6 text-xs text-[#4A5E7A] bg-[#162A4A]/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-[#1E3A5F] flex items-center gap-2">
        <span>{Math.round(transform.scale * 100)}%</span>
        <span className="text-[#86C9F2]">
          {transform.scale < ZOOM_CLUSTER_THRESHOLD ? '클러스터' :
           transform.scale >= ZOOM_DETAIL_THRESHOLD ? '상세' : '노드'}
        </span>
      </div>

      {/* Category Legend */}
      <div className="absolute top-6 right-6 bg-[#151922]/90 backdrop-blur-xl border border-[#1E3A5F] rounded-xl px-4 py-3 shadow-2xl max-w-xs">
        <div className="text-xs font-semibold text-white mb-2">분야별 인맥</div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
            <div key={category} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-[11px] text-[#8BA4C4]">{category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
