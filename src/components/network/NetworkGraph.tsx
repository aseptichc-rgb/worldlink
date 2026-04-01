'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNetworkStore } from '@/store/networkStore';
import { useGroupStore } from '@/store/groupStore';
import { useNewsAlertStore } from '@/store/newsAlertStore';
import { NetworkNode, NodeGroup } from '@/types';
import { Plus, Minus, Maximize2, RotateCcw, Home } from 'lucide-react';

interface GraphNode extends NetworkNode {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  importance?: number; // 중심성/중요도 점수 (연결 수 기반)
}

interface GraphEdge {
  source: string | GraphNode;
  target: string | GraphNode;
  degree: number;
}

// 색상 상수 - 계층별 차별화
const COLORS = {
  // 노드 색상
  nodeCore: '#58A6FF',           // 중앙 노드 - 밝은 청색
  nodePrimary: '#4A90E2',        // 1차 연결 - 청색
  nodeSecondary: '#1F6FEB',      // 2차 연결 - 보라색
  nodeTertiary: '#9B8ED9',       // 3차 연결 - 연보라
  nodeImported: '#3FB950',       // 가져온 연락처 - 녹색

  // 엣지 색상
  edgePrimary: '#4A90E2',        // 1차 연결선
  edgeSecondary: '#1F6FEB',      // 2차 연결선
  edgeTertiary: '#9B8ED9',       // 3차 연결선
  edgeHighlighted: '#FFB800',    // 강조된 연결선
  edgeImported: '#3FB950',       // 가져온 연락처 연결선

  // 상호작용 색상
  hover: '#58A6FF',
  selected: '#FFD700',
  focused: '#FFB800',
  mutual: '#00E5FF',           // 공통 인맥 표시

  // 배경 색상
  nodeBg: '#1C2333',
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

// 노드 크기 상수 — 계층별 크기 차별화 (시각적 위계)
const NODE_SIZES = {
  core: 44,        // 중앙 노드 (가장 크게 — 시선 집중)
  primary: 26,     // 1차 연결 (프로필 보이되 적당히)
  secondary: 16,   // 2차 연결 (1차보다 확실히 작게)
  tertiary: 10,    // 3차 연결 (최소)
};

// 폰트 크기 상수
const FONT_SIZES = {
  core: 20,
  primary: 17,
  secondary: 14,
  tertiary: 13,
};

// 레이아웃 상수 (라디얼 레이아웃 — 충돌 방지용 넉넉한 간격)
const LAYOUT = {
  clusterOrbitRadius: 280,   // 중앙에서 클러스터 중심까지 거리
  baseRadius: 200,           // degree 1 기본 반경 (넓게 → 겹침 방지)
  radialRingGap: 80,         // 라디얼 링 간격 (충분히 넓게)
  minNodeSpacing: 80,        // 최소 노드 간격 (라벨 포함)
  sectorPadding: 0.05,       // 섹터 양쪽 패딩 비율
  degree2OuterGap: 130,      // degree 2 바깥 링 추가 거리
  collisionRadius: 85,       // 충돌 판정 반경 (노드 + 라벨 여유)
  collisionIterations: 12,   // 충돌 해소 반복 횟수
};

// 라디얼(극좌표) 위치 계산 - 섹터 내 동심원 배치
// 카테고리 섹터의 startAngle~endAngle 범위 안에서 노드들을 동심원으로 배치
function radialPackPosition(
  index: number,
  totalInCategory: number,
  sectorStart: number,
  sectorEnd: number,
  centerX: number,
  centerY: number,
  baseRadius: number,
  ringGap: number,
): { x: number; y: number } {
  const sectorSpan = sectorEnd - sectorStart;
  const padding = sectorSpan * LAYOUT.sectorPadding;
  const usableStart = sectorStart + padding;
  const usableEnd = sectorEnd - padding;
  const usableSpan = usableEnd - usableStart;

  // 링당 최대 노드 수를 호 길이 기반으로 계산
  const getMaxNodesInRing = (ringIdx: number): number => {
    const ringRadius = baseRadius + ringIdx * ringGap;
    const arcLength = ringRadius * usableSpan;
    return Math.max(1, Math.floor(arcLength / (LAYOUT.minNodeSpacing)));
  };

  // 몇 번째 링의 몇 번째 노드인지 계산
  let ring = 0;
  let consumed = 0;
  while (consumed + getMaxNodesInRing(ring) <= index) {
    consumed += getMaxNodesInRing(ring);
    ring++;
  }
  const indexInRing = index - consumed;
  const nodesInRing = Math.min(getMaxNodesInRing(ring), totalInCategory - consumed);
  const radius = baseRadius + ring * ringGap;

  // 호 위에 균등 분포 (극좌표 → 데카르트 변환)
  const angle = nodesInRing === 1
    ? (usableStart + usableEnd) / 2
    : usableStart + (indexInRing / (nodesInRing - 1)) * usableSpan;

  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle),
  };
}

// 트랜지션 이징 함수
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// ===================================================================
// ===== 어안 렌즈(Fish-eye) 왜곡 함수 (Sarkar & Brown 모델) =====
// ===================================================================
// 터치/마우스 지점을 중심으로 주변 노드를 확대하고 먼 노드를 밀어내는 효과
function fisheyeDistort(
  nodeX: number, nodeY: number,
  focusX: number, focusY: number,
  radius: number,  // 왜곡 영향 반경 (G)
  mag: number,     // 확대 배율 (M)
): { nx: number; ny: number; s: number } {
  const dx = nodeX - focusX;
  const dy = nodeY - focusY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // 영향 범위 밖이거나 중앙이면 원래 위치 유지
  if (dist > radius || dist === 0) return { nx: nodeX, ny: nodeY, s: 1 };

  // 어안 렌즈 공식: d' = ((M+1) * G * d) / (M * d + G)
  const newDist = ((mag + 1) * radius * dist) / (mag * dist + radius);
  const ratio = newDist / dist;

  return {
    nx: focusX + dx * ratio,
    ny: focusY + dy * ratio,
    s: 1 + (mag - 1) * (1 - dist / radius) * 0.3, // 크기 스케일 (부드러운 감쇠)
  };
}

// 노드 중요도(Importance) 계산 — 연결 수 + degree 기반
function calcImportance(node: NetworkNode, edgeCount: number): number {
  if (node.degree === 0) return 100; // 중앙 노드: 최대 중요도
  const degreeWeight = node.degree === 1 ? 3 : node.degree === 2 ? 1 : 0.5;
  return (edgeCount * 2 + degreeWeight * 10 + (node.connectionCount || 0) * 0.5);
}

// ===================================================================
// ===== 의미론적 줌 (Semantic Zoom) — 정보 위계(Hierarchy) 설정 =====
// ===================================================================
// 핵심 원칙: "모든 걸 보여주지 않는다. 지금 중요한 것만 보여준다."

// 라벨(이름) 표시 여부 — 매우 보수적으로 제한
function shouldShowLabel(
  node: GraphNode, scale: number, _importance: number, rank: number
): boolean {
  if (node.degree === 0) return true;

  // ★ 2촌 이상은 절대 자동 표시하지 않음 (포커스/호버 시에만 별도 처리)
  if (node.degree >= 2) return false;

  // ★ 1촌(degree 1) — 줌 레벨별로 엄격하게 상위 N명만 이름 표시
  if (scale < 0.55) return rank < 3;    // 극단적 줌아웃: 3명
  if (scale < 0.7) return rank < 5;     // 줌아웃: 5명
  if (scale < 0.85) return rank < 8;    // 중간: 8명
  if (scale < 1.0) return rank < 12;    // 기본 줌: 12명
  if (scale < 1.3) return rank < 20;    // 약간 줌인: 20명
  return true; // 많이 줌인해야 전체 표시
}

// 노드 렌더링 모드 — full(원+이미지), dot(작은 점), hidden(안 보임)
function shouldShowNodeDetail(
  node: GraphNode, scale: number, rank: number
): 'full' | 'dot' | 'hidden' {
  if (node.degree === 0) return 'full';

  // ★ 2촌 노드: 기본적으로 숨김, 확장 시에만 작은 점으로 표시
  if (node.degree >= 2) {
    if (scale >= 1.2) return 'dot';
    return 'hidden';
  }

  // 1촌 노드: 줌아웃 시 하위 노드는 점으로
  if (scale < 0.55) return rank < 6 ? 'full' : 'dot';
  if (scale < 0.7) return rank < 12 ? 'full' : 'dot';
  return 'full';
}

// 시각적 깊이감: degree에 따른 투명도 (3단계 동심원)
function getDepthAlpha(degree: number, scale: number): number {
  if (degree === 0) return 1;
  if (degree === 1) {
    if (scale < 0.55) return 0.5;
    if (scale < 0.85) return 0.75;
    return 1;
  }
  // 2촌: 항상 반투명 (점으로 표시될 때 눈에 띄지 않게)
  if (degree === 2) return scale < 0.85 ? 0.15 : scale < 1.2 ? 0.35 : 0.55;
  return 0.2;
}

// 시각적 깊이감: degree에 따른 노드 크기 스케일
function getDepthScale(degree: number, scale: number): number {
  if (degree === 0) return 1;
  if (degree === 1) return 1;
  if (degree === 2) return 0.55; // 2촌은 항상 작게
  return 0.4;
}

// 트랜지션 상태 타입
interface TransitionState {
  isActive: boolean;
  startTime: number;
  duration: number;
  prevPositions: Map<string, { x: number; y: number }>;
  targetPositions: Map<string, { x: number; y: number }>;
  fadingNodes: GraphNode[];
  centerX: number;
  centerY: number;
}

// 프로필 이미지 캐시
const imageCache = new Map<string, HTMLImageElement>();
const imageLoadingSet = new Set<string>();
// 노드 ID별 마지막으로 로드한 이미지 URL 추적 (캐시 무효화용)
const nodeImageUrlMap = new Map<string, string>();

function getProfileImage(src: string): HTMLImageElement | null {
  if (imageCache.has(src)) return imageCache.get(src)!;
  if (imageLoadingSet.has(src)) return null;

  imageLoadingSet.add(src);
  const img = new Image();
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

// 노드의 프로필 이미지가 변경되었는지 확인하고 캐시 무효화
function invalidateNodeImageCache(nodeId: string, newImageUrl: string | undefined): void {
  if (!newImageUrl) return;

  const prevUrl = nodeImageUrlMap.get(nodeId);
  if (prevUrl && prevUrl !== newImageUrl) {
    // 이전 이미지 URL 캐시 삭제
    imageCache.delete(prevUrl);
    imageLoadingSet.delete(prevUrl);
  }
  nodeImageUrlMap.set(nodeId, newImageUrl);
}

// 시맨틱 줌 레벨 상수
const ZOOM_CLUSTER_THRESHOLD = 0.7;   // 이하: 클러스터 뷰
const ZOOM_DETAIL_THRESHOLD = 1.4;    // 이상: 상세 뷰 (회사/직책 추가)
const PROFILE_IMAGE_ZOOM_THRESHOLD = 0.5; // 프로필 이미지를 더 낮은 줌에서부터 표시

export default function NetworkGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const edgeAnimFrameRef = useRef<number>(0);
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const edgeAnimationRef = useRef<number>(0);
  const categoryAnglesRef = useRef<Map<string, { start: number; end: number; nodes: NetworkNode[]; clusterCenter?: { x: number; y: number } }>>(new Map());
  const transitionRef = useRef<TransitionState>({
    isActive: false,
    startTime: 0,
    duration: 800,
    prevPositions: new Map(),
    targetPositions: new Map(),
    fadingNodes: [],
    centerX: 0,
    centerY: 0,
  });

  const {
    nodes,
    edges,
    highlightedKeyword,
    setSelectedNode,
    focusedNodeId,
    setFocusedNodeId,
    setCenterUserId,
    centerUserId,
    centerUserOriginalDegree,
  } = useNetworkStore();

  const {
    groups: allGroups,
    memberships: allMemberships,
    activeGroupFilter,
    getGroupsForNode,
    getNodesInGroup,
  } = useGroupStore();

  const { allGroupNews, readNewsIds } = useNewsAlertStore();

  // 뉴스가 있는 인물 이름 집합 (읽지 않은 뉴스 기준)
  const nodesWithNews = useMemo(() => {
    const set = new Set<string>();
    for (const item of allGroupNews) {
      if (item.memberName && !readNewsIds.has(item.id)) {
        set.add(item.memberName);
      }
    }
    return set;
  }, [allGroupNews, readNewsIds]);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [targetTransform, setTargetTransform] = useState<{ x: number; y: number; scale: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: GraphNode } | null>(null);
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());
  // 어안 렌즈(Fish-eye) 상태: 터치/마우스가 머무는 캔버스 좌표 (world space)
  const fisheyeFocusRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const fisheyeAnimRef = useRef<{ targetX: number; targetY: number; currentX: number; currentY: number; strength: number }>({
    targetX: 0, targetY: 0, currentX: 0, currentY: 0, strength: 0,
  });
  const lastClickTimeRef = useRef<number>(0);
  const lastClickNodeRef = useRef<string | null>(null);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPinchDistRef = useRef<number>(0);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const dprRef = useRef<number>(1);

  // Initialize dimensions + DPR (모바일 고해상도 Retina 디스플레이 대응)
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const dpr = window.devicePixelRatio || 1;
        dprRef.current = dpr;
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        setDimensions({ width: w, height: h });

        // Canvas 물리적 해상도를 DPR만큼 키워 선명하게 렌더링
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = w * dpr;
          canvas.height = h * dpr;
          canvas.style.width = `${w}px`;
          canvas.style.height = `${h}px`;
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.scale(dpr, dpr);
        }
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // centerUserId 변경 시 뷰를 부드럽게 전환
  const prevCenterRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (prevCenterRef.current !== undefined && prevCenterRef.current !== centerUserId) {
      // 부드럽게 뷰 리셋 (instant 대신 smooth transition)
      setTargetTransform({ x: 0, y: 0, scale: 1 });
      setExpandedNodeIds(new Set());
    }
    prevCenterRef.current = centerUserId;
  }, [centerUserId]);

  // Edge animation offset (separate rAF ref to avoid overwriting animationRef)
  useEffect(() => {
    const animate = () => {
      edgeAnimationRef.current = (edgeAnimationRef.current + 0.5) % 20;
      edgeAnimFrameRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      if (edgeAnimFrameRef.current) {
        cancelAnimationFrame(edgeAnimFrameRef.current);
      }
    };
  }, []);

  // Initialize nodes with fixed positions (category-based clustering)
  useEffect(() => {
    if (nodes.length === 0 || dimensions.width === 0) return;

    // 프로필 이미지 캐시 무효화 (이미지가 변경된 노드 감지)
    for (const node of nodes) {
      if (node.profileImage) {
        invalidateNodeImageCache(node.id, node.profileImage);
      }
    }

    // 트랜지션을 위해 이전 노드 위치 저장
    const prevPositions = new Map<string, { x: number; y: number }>();
    const prevNodesCopy: GraphNode[] = [];
    for (const node of nodesRef.current) {
      if (node.x != null && node.y != null) {
        prevPositions.set(node.id, { x: node.x, y: node.y });
        prevNodesCopy.push({ ...node });
      }
    }

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

    // 카테고리별 섹터 배치 - 각 카테고리가 부채꼴 영역을 차지
    const totalNodes = degree1Nodes.length;
    const gapAngle = 0.2; // 카테고리 사이 간격
    const totalGaps = sortedCategories.length * gapAngle;
    const usableAngle = Math.PI * 2 - totalGaps;
    let currentAngle = -Math.PI / 2;

    const categoryAngles = new Map<string, { start: number; end: number; nodes: NetworkNode[]; clusterCenter: { x: number; y: number } }>();
    sortedCategories.forEach(([category, categoryNodes]) => {
      const angleSpan = (categoryNodes.length / totalNodes) * usableAngle;
      const midAngle = currentAngle + angleSpan / 2;
      categoryAngles.set(category, {
        start: currentAngle,
        end: currentAngle + angleSpan,
        nodes: categoryNodes,
        clusterCenter: { x: centerX + Math.cos(midAngle) * 250, y: centerY + Math.sin(midAngle) * 250 },
      });
      currentAngle += angleSpan + gapAngle;
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
        // 카테고리 섹터 내 라디얼(극좌표) 배치
        const category = node.category || '기타';
        const categoryInfo = categoryAngles.get(category);

        if (categoryInfo) {
          const { start, end, nodes: categoryNodes } = categoryInfo;
          const nodeIndex = categoryNodes.findIndex(n => n.id === node.id);

          // 극좌표 → 데카르트 변환으로 동심원 배치
          const pos = radialPackPosition(
            nodeIndex,
            categoryNodes.length,
            start,
            end,
            centerX,
            centerY,
            LAYOUT.baseRadius,
            LAYOUT.radialRingGap,
          );
          x = pos.x;
          y = pos.y;
        }
      } else if (node.degree === 2) {
        // degree 2 노드: 해당 카테고리 섹터 바깥쪽에 배치
        const connectedEdge = edges.find(e => {
          const sourceId = typeof e.source === 'string' ? e.source : (e.source as GraphNode).id;
          const targetId = typeof e.target === 'string' ? e.target : (e.target as GraphNode).id;
          return (sourceId === node.id && e.degree === 2) || (targetId === node.id && e.degree === 2);
        });

        let parentCategory = '기타';
        if (connectedEdge) {
          const parentId = typeof connectedEdge.source === 'string' ? connectedEdge.source : (connectedEdge.source as GraphNode).id;
          const targetId = typeof connectedEdge.target === 'string' ? connectedEdge.target : (connectedEdge.target as GraphNode).id;
          const parentNodeId = parentId === node.id ? targetId : parentId;
          const parentNode = degree1Nodes.find(n => n.id === parentNodeId);
          if (parentNode) {
            parentCategory = parentNode.category || '기타';
          }
        }

        const categoryInfo = categoryAngles.get(parentCategory);
        if (categoryInfo) {
          const { start, end } = categoryInfo;
          // 같은 카테고리에 속한 degree 2 노드들
          const deg2InSameCategory = degree2Nodes.filter(n => {
            const edge = edges.find(e => {
              const src = typeof e.source === 'string' ? e.source : (e.source as GraphNode).id;
              const tgt = typeof e.target === 'string' ? e.target : (e.target as GraphNode).id;
              return (src === n.id || tgt === n.id) && e.degree === 2;
            });
            if (!edge) return false;
            const pId = typeof edge.source === 'string' ? edge.source : (edge.source as GraphNode).id;
            const tId = typeof edge.target === 'string' ? edge.target : (edge.target as GraphNode).id;
            const pNodeId = pId === n.id ? tId : pId;
            const pNode = degree1Nodes.find(nd => nd.id === pNodeId);
            return pNode && (pNode.category || '기타') === parentCategory;
          });

          const idxInCategory = deg2InSameCategory.findIndex(n => n.id === node.id);
          const totalInCategory = deg2InSameCategory.length;

          // 라디얼 방식으로 바깥 링에 배치 (1차 노드보다 더 바깥)
          const sectorPadding = (end - start) * LAYOUT.sectorPadding;
          const usableStart = start + sectorPadding;
          const usableEnd = end - sectorPadding;
          const usableSpan = usableEnd - usableStart;
          const nodeAngle = totalInCategory === 1
            ? (usableStart + usableEnd) / 2
            : usableStart + (idxInCategory / (totalInCategory - 1)) * usableSpan;

          // 카테고리 내 1차 노드 최대 반경 + 추가 간격
          const catDeg1Nodes = nodesRef.current.filter(n => n.category === (node.category || '기타') && n.degree === 1);
          let maxDeg1Radius = LAYOUT.baseRadius;
          for (const d1 of catDeg1Nodes) {
            const dist = Math.sqrt(((d1.x || centerX) - centerX) ** 2 + ((d1.y || centerY) - centerY) ** 2);
            if (dist > maxDeg1Radius) maxDeg1Radius = dist;
          }
          const outerRadius = maxDeg1Radius + LAYOUT.degree2OuterGap + Math.floor(idxInCategory / 10) * 45;

          x = centerX + Math.cos(nodeAngle) * outerRadius;
          y = centerY + Math.sin(nodeAngle) * outerRadius;
        } else {
          const index = degree2Nodes.findIndex(n => n.id === node.id);
          const angle = (index / degree2Nodes.length) * Math.PI * 2 - Math.PI / 2;
          x = centerX + Math.cos(angle) * 380;
          y = centerY + Math.sin(angle) * 380;
        }
      }

      // 노드별 연결 엣지 수 계산 → 중요도 산출
      const edgeCount = edges.filter(e => {
        const sid = typeof e.source === 'string' ? e.source : e.source;
        const tid = typeof e.target === 'string' ? e.target : e.target;
        return sid === node.id || tid === node.id;
      }).length;

      return {
        ...node,
        x,
        y,
        vx: 0,
        vy: 0,
        fx: x,
        fy: y,
        importance: calcImportance(node, edgeCount),
      };
    });

    edgesRef.current = edges.map(edge => ({
      ...edge,
      source: edge.source,
      target: edge.target,
    }));

    // ===== 포스트 레이아웃 충돌 해소 (Collision Detection) =====
    // 라디얼 배치 후 겹치는 노드들을 서로 밀어내어 이름 겹침 방지
    const placedNodes = nodesRef.current.filter(n => n.degree !== 0);
    for (let iter = 0; iter < LAYOUT.collisionIterations; iter++) {
      let anyCollision = false;
      for (let i = 0; i < placedNodes.length; i++) {
        for (let j = i + 1; j < placedNodes.length; j++) {
          const a = placedNodes[i];
          const b = placedNodes[j];
          const dx = (b.x || 0) - (a.x || 0);
          const dy = (b.y || 0) - (a.y || 0);
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = LAYOUT.collisionRadius;

          if (dist < minDist && dist > 0.1) {
            anyCollision = true;
            const overlap = (minDist - dist) / 2;
            const nx = dx / dist;
            const ny = dy / dist;

            // degree가 높은 노드를 더 많이 밀어냄 (1차 노드 우선)
            const aWeight = a.degree === 1 ? 0.3 : 0.7;
            const bWeight = b.degree === 1 ? 0.3 : 0.7;
            a.x = (a.x || 0) - nx * overlap * aWeight;
            a.y = (a.y || 0) - ny * overlap * aWeight;
            b.x = (b.x || 0) + nx * overlap * bWeight;
            b.y = (b.y || 0) + ny * overlap * bWeight;

            a.fx = a.x;
            a.fy = a.y;
            b.fx = b.x;
            b.fy = b.y;
          }
        }
      }
      if (!anyCollision) break;
    }

    // 트랜지션 애니메이션 설정: 이전 위치가 있으면 부드럽게 이동
    if (prevPositions.size > 0 && nodesRef.current.length > 0) {
      const targetPositions = new Map<string, { x: number; y: number }>();
      const fadingNodes: GraphNode[] = [];

      // 새 노드들의 최종 목표 위치 저장
      nodesRef.current.forEach(node => {
        if (node.x != null && node.y != null) {
          targetPositions.set(node.id, { x: node.x, y: node.y });
        }
      });

      // 사라지는 노드 찾기 (이전에 있었지만 새 데이터에 없는 노드)
      for (const prevNode of prevNodesCopy) {
        if (!nodesRef.current.find(n => n.id === prevNode.id)) {
          fadingNodes.push(prevNode);
        }
      }

      // 노드들을 이전 위치에서 시작하도록 설정
      nodesRef.current.forEach(node => {
        const prev = prevPositions.get(node.id);
        if (prev) {
          node.x = prev.x;
          node.y = prev.y;
          node.fx = prev.x;
          node.fy = prev.y;
        } else {
          // 새로 나타나는 노드: 중앙에서 시작
          node.x = centerX;
          node.y = centerY;
          node.fx = centerX;
          node.fy = centerY;
        }
      });

      transitionRef.current = {
        isActive: true,
        startTime: performance.now(),
        duration: 800,
        prevPositions,
        targetPositions,
        fadingNodes,
        centerX,
        centerY,
      };
    }
  }, [nodes, edges, dimensions]);

  // 충돌 해소 함수: 모든 노드가 서로 겹치지 않도록 위치 조정
  const resolveCollisions = useCallback((
    nodesToPlace: GraphNode[],
    allVisibleNodes: GraphNode[],
    minDistance: number,
    iterations: number = 50
  ) => {
    for (let iter = 0; iter < iterations; iter++) {
      let hasCollision = false;

      // 배치할 노드들 간의 충돌 해소
      for (let i = 0; i < nodesToPlace.length; i++) {
        for (let j = i + 1; j < nodesToPlace.length; j++) {
          const nodeA = nodesToPlace[i];
          const nodeB = nodesToPlace[j];

          const dx = (nodeB.x || 0) - (nodeA.x || 0);
          const dy = (nodeB.y || 0) - (nodeA.y || 0);
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < minDistance && dist > 0) {
            hasCollision = true;
            const overlap = (minDistance - dist) / 2;
            const angle = Math.atan2(dy, dx);

            // 서로 밀어냄
            nodeA.x = (nodeA.x || 0) - Math.cos(angle) * overlap;
            nodeA.y = (nodeA.y || 0) - Math.sin(angle) * overlap;
            nodeB.x = (nodeB.x || 0) + Math.cos(angle) * overlap;
            nodeB.y = (nodeB.y || 0) + Math.sin(angle) * overlap;
          }
        }
      }

      // 기존 노드들(degree 0, 1)과의 충돌 해소
      for (const newNode of nodesToPlace) {
        for (const existingNode of allVisibleNodes) {
          if (newNode.id === existingNode.id) continue;
          if (existingNode.degree === 2) continue; // degree 2끼리는 위에서 처리

          const dx = (newNode.x || 0) - (existingNode.x || 0);
          const dy = (newNode.y || 0) - (existingNode.y || 0);
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < minDistance && dist > 0) {
            hasCollision = true;
            const overlap = minDistance - dist;
            const angle = Math.atan2(dy, dx);

            // 새 노드만 밀어냄 (기존 노드는 고정)
            newNode.x = (newNode.x || 0) + Math.cos(angle) * overlap;
            newNode.y = (newNode.y || 0) + Math.sin(angle) * overlap;
          }
        }
      }

      // 충돌이 없으면 조기 종료
      if (!hasCollision) break;
    }

    // 최종 위치 고정
    nodesToPlace.forEach(node => {
      node.fx = node.x;
      node.fy = node.y;
    });
  }, []);

  // expandedNodeIds가 변경되면 degree 2 노드 위치를 연결된 1차 노드 주변으로 재배치
  useEffect(() => {
    if (expandedNodeIds.size === 0) return;

    const expandedId = Array.from(expandedNodeIds)[0];
    const expandedNode = nodesRef.current.find(n => n.id === expandedId);
    if (!expandedNode || expandedNode.degree !== 1) return;

    // 이 1차 노드에 연결된 degree 2 노드들 찾기
    const connectedDegree2Nodes: GraphNode[] = [];
    for (const edge of edgesRef.current) {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;

      if (sourceId === expandedId) {
        const targetNode = nodesRef.current.find(n => n.id === targetId);
        if (targetNode?.degree === 2) connectedDegree2Nodes.push(targetNode);
      } else if (targetId === expandedId) {
        const sourceNode = nodesRef.current.find(n => n.id === sourceId);
        if (sourceNode?.degree === 2) connectedDegree2Nodes.push(sourceNode);
      }
    }

    if (connectedDegree2Nodes.length === 0) return;

    const baseX = expandedNode.x || 0;
    const baseY = expandedNode.y || 0;
    const baseRadius = 150;
    const nodeCount = connectedDegree2Nodes.length;

    // 초기 배치: 원형으로 균등 배치
    connectedDegree2Nodes.forEach((node, index) => {
      const angle = (index / nodeCount) * Math.PI * 2 - Math.PI / 2;
      node.x = baseX + Math.cos(angle) * baseRadius;
      node.y = baseY + Math.sin(angle) * baseRadius;
    });

    // 충돌 해소 (노드 크기 + 라벨 여유 공간 고려)
    const minDistance = NODE_SIZES.secondary * 2 + 60; // 노드 직경 + 라벨/여백
    const visibleNodes = nodesRef.current.filter(n => n.degree === 0 || n.degree === 1);

    resolveCollisions(connectedDegree2Nodes, visibleNodes, minDistance, 100);
  }, [expandedNodeIds, resolveCollisions]);

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
  // peer 엣지(degree1↔degree1)는 선으로 표시하지 않음 (노드 하이라이트로만 표현)
  const isEdgeVisible = useCallback((edge: GraphEdge, visibleIds: Set<string>): boolean => {
    const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
    const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
    if (!visibleIds.has(sourceId) || !visibleIds.has(targetId)) return false;

    // peer 엣지는 선으로 그리지 않음
    const sourceNode = nodesRef.current.find(n => n.id === sourceId);
    const targetNode = nodesRef.current.find(n => n.id === targetId);
    if (sourceNode?.degree === 1 && targetNode?.degree === 1) return false;

    return true;
  }, []);

  // 포커스된 노드와 연결된 노드 ID들을 계산
  // peer 엣지 포함 — 선은 안 그리지만 노드 하이라이트에 사용
  const getConnectedNodeIds = useCallback((nodeId: string | null): Set<string> => {
    if (!nodeId) return new Set();

    const connectedIds = new Set<string>();
    connectedIds.add(nodeId);

    for (const edge of edgesRef.current) {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;

      if (sourceId === nodeId) connectedIds.add(targetId);
      else if (targetId === nodeId) connectedIds.add(sourceId);
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
      isMutual?: boolean;
      hasNews?: boolean;
    }
  ) => {
    const { isHovered, isFocused, isConnected, isDimmed, isHighlighted, isMutual, hasNews } = options;
    const radius = getNodeSize(node, isHovered, isFocused);
    const x = node.x || 0;
    const y = node.y || 0;

    // 1. Outer Glow Effect (호버/포커스/중앙 노드만)
    if ((node.degree === 0 || isHovered || isFocused || isConnected) && !isDimmed) {
      const glowRadius = radius * (isHovered || isFocused ? 3 : 2.5);
      const gradient = ctx.createRadialGradient(x, y, radius, x, y, glowRadius);

      if (isMutual) {
        gradient.addColorStop(0, 'rgba(0, 229, 255, 0.7)');
      } else if (isFocused && node.degree !== 0) {
        gradient.addColorStop(0, 'rgba(255, 184, 0, 0.6)');
      } else if (isConnected && !isFocused) {
        gradient.addColorStop(0, 'rgba(255, 184, 0, 0.55)');
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
      // 연결된 노드: 카테고리 색상으로 밝게 채우기
      const category = node.category || '기타';
      const catColor = CATEGORY_COLORS[category] || COLORS.nodePrimary;
      const cr = parseInt(catColor.slice(1, 3), 16);
      const cg = parseInt(catColor.slice(3, 5), 16);
      const cb = parseInt(catColor.slice(5, 7), 16);
      ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, 0.35)`;
    } else {
      ctx.fillStyle = isDimmed ? 'rgba(22, 27, 34, 0.15)' : COLORS.nodeBg;
    }
    ctx.fill();

    // 3. Border (카테고리별 색상)
    ctx.lineWidth = isHovered ? 3 : isFocused ? 4 : isMutual ? 3 : 2;

    // 가져온 연락처는 점선 테두리
    if (node.isImported && !isDimmed) {
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = COLORS.nodeImported;
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      if (isDimmed) {
        ctx.strokeStyle = 'rgba(33, 38, 45, 0.15)';
      } else if (isMutual) {
        ctx.strokeStyle = COLORS.mutual;
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
    }

    // 3.5. Mutual connection outer ring (공통 인맥 이중 링)
    if (isMutual && !isDimmed) {
      ctx.beginPath();
      ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS.mutual;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 4. Profile Image (줌 레벨이 충분히 높을 때만 표시)
    if (node.profileImage && transform.scale >= PROFILE_IMAGE_ZOOM_THRESHOLD) {
      const img = getProfileImage(node.profileImage);
      if (img) {
        // 줌 레벨에 따른 이미지 투명도 (부드러운 페이드인)
        const fadeStart = PROFILE_IMAGE_ZOOM_THRESHOLD;
        const fadeEnd = PROFILE_IMAGE_ZOOM_THRESHOLD + 0.2;
        const zoomAlpha = Math.min(1, (transform.scale - fadeStart) / (fadeEnd - fadeStart));
        // dimmed 노드는 낮은 투명도로 표시
        const imageAlpha = isDimmed ? zoomAlpha * 0.2 : zoomAlpha;

        ctx.save();
        ctx.globalAlpha = imageAlpha;

        // 원형 클리핑 - 프로필 이미지를 완벽한 원형으로 렌더링
        ctx.beginPath();
        ctx.arc(x, y, radius - 1.5, 0, Math.PI * 2);
        ctx.clip();

        // 이미지를 원 안에 중앙 맞춤 (cover 방식 - 잘린 부분은 자연스럽게 처리)
        const imgSize = (radius - 1.5) * 2;
        const imgAspect = img.width / img.height;
        let drawW = imgSize;
        let drawH = imgSize;
        let drawX = x - radius + 1.5;
        let drawY = y - radius + 1.5;
        if (imgAspect > 1) {
          drawW = imgSize * imgAspect;
          drawX = x - drawW / 2;
        } else if (imgAspect < 1) {
          drawH = imgSize / imgAspect;
          drawY = y - drawH / 2;
        }
        ctx.drawImage(img, drawX, drawY, drawW, drawH);

        ctx.restore();

        // 이미지 위에 깔끔한 원형 테두리 다시 그리기
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.lineWidth = isHovered ? 3.5 : isFocused ? 4.5 : isMutual ? 3.5 : 2.5;
        if (isMutual) {
          ctx.strokeStyle = COLORS.mutual;
        } else if (isFocused && node.degree !== 0) {
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

        // 호버/포커스 시 밝은 외곽 링 추가 (인터랙션 피드백)
        if (isHovered || isFocused) {
          ctx.beginPath();
          ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
          ctx.strokeStyle = isHovered ? 'rgba(88, 166, 255, 0.5)' : 'rgba(255, 215, 0, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
    }

    // 5. 연결 수 뱃지 (degree 1 노드에 degree 2 연결 수 표시)
    if (node.degree === 1 && !isDimmed && transform.scale >= 0.5) {
      const degree2Count = edgesRef.current.filter(e => {
        const sid = typeof e.source === 'string' ? e.source : e.source.id;
        const tid = typeof e.target === 'string' ? e.target : e.target.id;
        return (sid === node.id || tid === node.id) && e.degree === 2;
      }).length;
      if (degree2Count > 0) {
        const badgeX = x + radius * 0.7;
        const badgeY = y - radius * 0.7;
        const badgeRadius = 10;
        // 뱃지 배경
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(30, 30, 50, 0.85)';
        ctx.fill();
        const category = node.category || '기타';
        ctx.strokeStyle = CATEGORY_COLORS[category] || COLORS.nodePrimary;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // 뱃지 텍스트
        ctx.font = 'bold 9px -apple-system, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`+${degree2Count}`, badgeX, badgeY);
      }
    }

    // 6. 뉴스 인디케이터 (뉴스가 있는 인물에 빨간 점 표시)
    if (hasNews && !isDimmed && node.degree !== 0) {
      const dotX = x - radius * 0.68;
      const dotY = y - radius * 0.68;
      const dotR = Math.max(4, radius * 0.22);

      // 글로우
      const glowGrad = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, dotR * 2.8);
      glowGrad.addColorStop(0, 'rgba(255, 59, 48, 0.55)');
      glowGrad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotR * 2.8, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();

      // 점 본체
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
      ctx.fillStyle = '#FF3B30';
      ctx.fill();

      // 흰 테두리 (배경과 구분)
      ctx.strokeStyle = '#0D1117';
      ctx.lineWidth = 1.5;
      ctx.stroke();
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
    options: { isDimmed: boolean; isFocused: boolean; allNodes: GraphNode[]; isMutual?: boolean }
  ) => {
    const { isDimmed, isFocused, allNodes, isMutual } = options;
    const radius = getNodeSize(node, false, isFocused);
    const x = node.x || 0;
    const y = node.y || 0;

    const baseFontSize = node.degree === 0 ? FONT_SIZES.core :
                     node.degree === 1 ? FONT_SIZES.primary : 11;
    // 줌 아웃 시 폰트가 너무 작아지지 않도록 보정 (scale < 1일 때 폰트를 키움)
    const fontScale = transform.scale < 1 ? Math.max(1, 1 / Math.sqrt(transform.scale)) : 1;
    const fontSize = baseFontSize * fontScale;

    ctx.font = `${isFocused || node.degree === 0 ? 'bold' : '500'} ${fontSize}px -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif`;

    const name = node.name.length > 6 ? node.name.slice(0, 6) + '...' : node.name;

    // 항상 노드 바로 아래 중앙 정렬
    const labelX = x;
    const labelY = y + radius + 14 * fontScale;
    const textWidth = ctx.measureText(name).width;
    const labelHalfW = textWidth / 2 + 5 * fontScale;
    const labelHalfH = 9 * fontScale;

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

    // 공통 인맥 배지
    if (isMutual && !isDimmed) {
      const badgeText = '공통';
      ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      const badgeWidth = ctx.measureText(badgeText).width + 8;
      const badgeX = x + radius + 2;
      const badgeY = y - radius - 2;

      ctx.fillStyle = COLORS.mutual;
      ctx.beginPath();
      ctx.roundRect(badgeX - badgeWidth / 2, badgeY - 7, badgeWidth, 14, 7);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, badgeX, badgeY);

      // 원래 폰트 복원
      ctx.font = `${isFocused || node.degree === 0 ? 'bold' : '500'} ${fontSize}px -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif`;
    }

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

  // 그룹 배지 그리기 (노드 주변에 소속 그룹 색상 점 표시)
  const drawGroupBadges = useCallback((
    ctx: CanvasRenderingContext2D,
    node: GraphNode,
    nodeGroups: NodeGroup[],
    radius: number
  ) => {
    if (nodeGroups.length === 0 || transform.scale < PROFILE_IMAGE_ZOOM_THRESHOLD) return;

    const x = node.x || 0;
    const y = node.y || 0;
    const badgeSize = 4.5;
    const maxBadges = Math.min(nodeGroups.length, 4);

    for (let i = 0; i < maxBadges; i++) {
      const angle = -Math.PI * 0.75 + (i / Math.max(maxBadges - 1, 1)) * (Math.PI * 0.5);
      const badgeX = x + Math.cos(angle) * (radius + 9);
      const badgeY = y + Math.sin(angle) * (radius + 9);

      // 배지 외곽 글로우
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, badgeSize + 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#0D1117';
      ctx.fill();

      // 배지 본체
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, badgeSize, 0, Math.PI * 2);
      ctx.fillStyle = nodeGroups[i].color;
      ctx.fill();
    }

    // 4개 초과 시 "+N" 표시
    if (nodeGroups.length > 4) {
      const lastAngle = -Math.PI * 0.75 + (Math.PI * 0.5) + 0.3;
      const extraX = x + Math.cos(lastAngle) * (radius + 9);
      const extraY = y + Math.sin(lastAngle) * (radius + 9);

      ctx.font = 'bold 8px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#8B949E';
      ctx.fillText(`+${nodeGroups.length - 4}`, extraX, extraY);
    }
  }, [transform.scale]);

  // Render
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const allNodes = nodesRef.current;
    const allEdges = edgesRef.current;

    const visibleIds = getVisibleNodeIds();
    const nodes = allNodes.filter(n => visibleIds.has(n.id));

    // 중요도 순위 계산 (의미론적 줌에 사용)
    const sortedByImportance = [...nodes].sort((a, b) => (b.importance || 0) - (a.importance || 0));
    const importanceRankMap = new Map<string, number>();
    sortedByImportance.forEach((n, i) => importanceRankMap.set(n.id, i));

    // 어안 렌즈 보간 (부드러운 이동)
    const fe = fisheyeAnimRef.current;
    const feActive = fisheyeFocusRef.current.active;
    if (feActive) {
      fe.currentX += (fe.targetX - fe.currentX) * 0.15;
      fe.currentY += (fe.targetY - fe.currentY) * 0.15;
      fe.strength += (3.0 - fe.strength) * 0.1; // 부드럽게 강도 증가
    } else {
      fe.strength *= 0.85; // 부드럽게 소멸
    }
    const edges = allEdges.filter(e => isEdgeVisible(e, visibleIds));

    const connectedNodeIds = getConnectedNodeIds(focusedNodeId);
    const hasFocusedNode = focusedNodeId !== null;

    // 공통 인맥: 나(degree 0)와 포커스된 노드 양쪽에 연결된 노드
    const mutualNodeIds = new Set<string>();
    if (hasFocusedNode) {
      const cNode = allNodes.find(n => n.degree === 0);
      if (cNode && focusedNodeId !== cNode.id) {
        const myConnIds = new Set<string>();
        const focusedConnIds = new Set<string>();
        for (const edge of allEdges) {
          const sid = typeof edge.source === 'string' ? edge.source : edge.source.id;
          const tid = typeof edge.target === 'string' ? edge.target : edge.target.id;
          if (sid === cNode.id) myConnIds.add(tid);
          else if (tid === cNode.id) myConnIds.add(sid);
          if (sid === focusedNodeId && tid !== cNode.id) focusedConnIds.add(tid);
          else if (tid === focusedNodeId && sid !== cNode.id) focusedConnIds.add(sid);
        }
        for (const id of focusedConnIds) {
          if (myConnIds.has(id) && id !== focusedNodeId) mutualNodeIds.add(id);
        }
      }
    }

    // 그룹 필터: 활성화 시 해당 그룹 소속 노드 ID 셋
    const filteredGroupNodeIds = activeGroupFilter
      ? new Set(getNodesInGroup(activeGroupFilter))
      : null;

    const dpr = dprRef.current;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // DPR 리셋 후 다시 적용
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const categoryAngles = categoryAnglesRef.current;
    const isClusterView = transform.scale < ZOOM_CLUSTER_THRESHOLD;
    const isDetailView = transform.scale >= ZOOM_DETAIL_THRESHOLD;

    // ===================================================================
    // ===== 트랜지션 시각 효과 (노드 전환 시 리플 + 트레일 + 고스트) =====
    // ===================================================================
    const transition = transitionRef.current;
    if (transition.isActive) {
      const elapsed = performance.now() - transition.startTime;
      const rawProgress = Math.min(1, elapsed / transition.duration);
      const eased = easeOutCubic(rawProgress);

      // 1. 리플 웨이브 - 중앙에서 바깥으로 퍼지는 원형 파동 (2겹)
      for (let i = 0; i < 2; i++) {
        const rippleDelay = i * 0.15;
        const rippleT = Math.max(0, Math.min(1, (rawProgress - rippleDelay) / (1 - rippleDelay)));
        if (rippleT <= 0) continue;

        const rippleMaxRadius = 700;
        const rippleRadius = rippleMaxRadius * rippleT;
        const rippleOpacity = Math.max(0, 0.25 * (1 - rippleT));
        const ringWidth = 40 - 20 * rippleT;

        const rippleGrad = ctx.createRadialGradient(
          centerX, centerY, Math.max(0, rippleRadius - ringWidth),
          centerX, centerY, rippleRadius
        );
        rippleGrad.addColorStop(0, 'transparent');
        rippleGrad.addColorStop(0.4, `rgba(88, 166, 255, ${rippleOpacity})`);
        rippleGrad.addColorStop(0.6, `rgba(88, 166, 255, ${rippleOpacity * 0.6})`);
        rippleGrad.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(centerX, centerY, rippleRadius, 0, Math.PI * 2);
        ctx.fillStyle = rippleGrad;
        ctx.fill();
      }

      // 2. 트레일 라인 - 이전 위치에서 현재 위치까지 잔상 선
      const trailOpacity = Math.max(0, 0.35 * (1 - eased));
      if (trailOpacity > 0.01) {
        for (const node of nodes) {
          const prev = transition.prevPositions.get(node.id);
          if (prev && node.x != null && node.y != null) {
            const dx = node.x - prev.x;
            const dy = node.y - prev.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 15) {
              const category = node.category || '기타';
              const catColor = CATEGORY_COLORS[category] || COLORS.nodePrimary;
              const cr = parseInt(catColor.slice(1, 3), 16);
              const cg = parseInt(catColor.slice(3, 5), 16);
              const cb = parseInt(catColor.slice(5, 7), 16);

              // 그라디언트 트레일 (이전 위치는 투명, 현재 위치 근처는 색상)
              const grad = ctx.createLinearGradient(prev.x, prev.y, node.x, node.y);
              grad.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, 0)`);
              grad.addColorStop(0.6, `rgba(${cr}, ${cg}, ${cb}, ${trailOpacity * 0.5})`);
              grad.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, ${trailOpacity})`);

              ctx.beginPath();
              ctx.moveTo(prev.x, prev.y);
              ctx.lineTo(node.x, node.y);
              ctx.strokeStyle = grad;
              ctx.lineWidth = 2;
              ctx.setLineDash([6, 4]);
              ctx.stroke();
              ctx.setLineDash([]);
            }
          }
        }
      }

      // 3. 사라지는 고스트 노드 (이전에 있었지만 사라지는 노드들)
      for (const fadeNode of transition.fadingNodes) {
        const fadeOpacity = Math.max(0, 0.4 * (1 - eased));
        if (fadeOpacity < 0.01) continue;

        ctx.save();
        ctx.globalAlpha = fadeOpacity;

        const r = fadeNode.degree === 0 ? NODE_SIZES.core : NODE_SIZES.primary;
        const shrinkR = r * (1 - eased * 0.6);
        const fx = fadeNode.x || 0;
        const fy = fadeNode.y || 0;

        // 글로우
        const glowGrad = ctx.createRadialGradient(fx, fy, shrinkR, fx, fy, shrinkR * 2);
        glowGrad.addColorStop(0, 'rgba(88, 166, 255, 0.3)');
        glowGrad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(fx, fy, shrinkR * 2, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.fill();

        // 노드 원
        ctx.beginPath();
        ctx.arc(fx, fy, shrinkR, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.nodeBg;
        ctx.fill();
        ctx.strokeStyle = 'rgba(88, 166, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();
      }
    }

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
          hasNews: nodesWithNews.has(centerNode.name),
        });
        drawNodeLabel(ctx, centerNode, { isDimmed: false, isFocused: false, allNodes: nodes });
      }

      // 카테고리별 '슈퍼 노드' (Hierarchical Clustering) 그리기
      // 중앙에서 각 클러스터로 연결선을 먼저 그림
      const clusterCenters: { cx: number; cy: number; category: string; color: string }[] = [];
      categoryAngles.forEach((info, category) => {
        const { start, end, nodes: categoryNodes } = info;
        const midAngle = (start + end) / 2;
        const categoryColor = CATEGORY_COLORS[category] || COLORS.nodePrimary;

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
        clusterCenters.push({ cx, cy, category, color: categoryColor });
      });

      // 중앙 → 클러스터 연결선 (부드러운 곡선)
      for (const cc of clusterCenters) {
        const r = parseInt(cc.color.slice(1, 3), 16);
        const g = parseInt(cc.color.slice(3, 5), 16);
        const b = parseInt(cc.color.slice(5, 7), 16);

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        // 베지어 곡선으로 부드러운 연결
        const midX = (centerX + cc.cx) / 2;
        const midY = (centerY + cc.cy) / 2;
        const perpX = -(cc.cy - centerY) * 0.15;
        const perpY = (cc.cx - centerX) * 0.15;
        ctx.quadraticCurveTo(midX + perpX, midY + perpY, cc.cx, cc.cy);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.2)`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 클러스터 원 그리기
      categoryAngles.forEach((info, category) => {
        const { start, end, nodes: categoryNodes } = info;
        const midAngle = (start + end) / 2;
        const categoryColor = CATEGORY_COLORS[category] || COLORS.nodePrimary;
        const r = parseInt(categoryColor.slice(1, 3), 16);
        const g = parseInt(categoryColor.slice(3, 5), 16);
        const b = parseInt(categoryColor.slice(5, 7), 16);

        const cc = clusterCenters.find(c => c.category === category)!;
        const { cx, cy } = cc;

        const clusterRadius = Math.min(80, 40 + categoryNodes.length * 3);

        // 클러스터 글로우 (부드러운 그라디언트)
        const glowGrad = ctx.createRadialGradient(cx, cy, clusterRadius * 0.5, cx, cy, clusterRadius * 2.5);
        glowGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.25)`);
        glowGrad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.1)`);
        glowGrad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(cx, cy, clusterRadius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.fill();

        // 클러스터 원 (이중 링으로 고급스러운 느낌)
        ctx.beginPath();
        ctx.arc(cx, cy, clusterRadius, 0, Math.PI * 2);
        const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, clusterRadius);
        bgGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.3)`);
        bgGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.12)`);
        ctx.fillStyle = bgGrad;
        ctx.fill();
        ctx.strokeStyle = categoryColor;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 외곽 링 (점선)
        ctx.beginPath();
        ctx.arc(cx, cy, clusterRadius + 6, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.2)`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // 미니 노드 미리보기 (클러스터 안에 3~5개의 작은 점)
        const previewCount = Math.min(5, categoryNodes.length);
        for (let i = 0; i < previewCount; i++) {
          const angle = (i / previewCount) * Math.PI * 2 - Math.PI / 2;
          const pr = clusterRadius * 0.45;
          const px = cx + Math.cos(angle) * pr;
          const py = cy + Math.sin(angle) * pr;
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, 0.4)`;
          ctx.fill();
        }

        // 카테고리명 + 인원수
        const labelText = category;
        const countText = `${categoryNodes.length}명`;
        ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(labelText, cx, cy - 8);

        ctx.font = '16px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.9)`;
        ctx.fillText(countText, cx, cy + 16);
      });

      ctx.restore();
      return;
    }

    // ===================================================================
    // ===== NODE VIEW & DETAIL VIEW (scale >= 0.7) =====
    // ===================================================================

    // ===== 라디얼 가이드 링 (배경 동심원) =====
    // 극좌표 기반 레이아웃의 구조를 시각적으로 보여주는 얇은 동심원
    const ringRadii = [LAYOUT.baseRadius, LAYOUT.baseRadius + LAYOUT.radialRingGap, LAYOUT.baseRadius + LAYOUT.radialRingGap * 2];
    for (const ringR of ringRadii) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(88, 166, 255, 0.06)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

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
      const catFontScale = transform.scale < 1 ? Math.max(1, 1 / Math.sqrt(transform.scale)) : 1;
      ctx.font = `bold ${13 * catFontScale}px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const textWidth = ctx.measureText(labelText).width;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.beginPath();
      ctx.roundRect(labelX - textWidth / 2 - 8 * catFontScale, labelY - 11 * catFontScale, textWidth + 16 * catFontScale, 22 * catFontScale, 6);
      ctx.fill();

      ctx.strokeStyle = categoryColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = categoryColor;
      ctx.fillText(labelText, labelX, labelY);
    });

    // ===================================================================
    // ===== Fish-eye 왜곡 좌표 사전 계산 =====
    // ===================================================================
    const feStrength = fe.strength;
    const useFisheye = feStrength > 0.05;
    const fisheyePositions = new Map<string, { nx: number; ny: number; s: number }>();
    if (useFisheye) {
      for (const node of nodes) {
        const pos = fisheyeDistort(
          node.x || 0, node.y || 0,
          fe.currentX, fe.currentY,
          280, // 왜곡 영향 반경
          feStrength,
        );
        fisheyePositions.set(node.id, pos);
      }
    }

    // 노드의 렌더링 좌표 (fish-eye 적용 시 왜곡 좌표, 아닐 시 원래 좌표)
    const getNodeRenderPos = (node: GraphNode) => {
      const fePos = fisheyePositions.get(node.id);
      return fePos || { nx: node.x || 0, ny: node.y || 0, s: 1 };
    };

    // ===== Draw Edges =====
    // 스마트 엣지 렌더링: hover 또는 focus된 노드의 엣지만 표시
    const activeNodeId = focusedNodeId || hoveredNode?.id || null;
    if (activeNodeId) {
      for (const edge of edges) {
        const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
        const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;

        // 활성 노드에 연결된 엣지만 그리기
        if (sourceId !== activeNodeId && targetId !== activeNodeId) continue;

        const source = nodes.find(n => n.id === sourceId);
        const target = nodes.find(n => n.id === targetId);
        if (!source || !target) continue;

        // Fish-eye 적용된 좌표 사용
        const sPos = getNodeRenderPos(source);
        const tPos = getNodeRenderPos(target);

        ctx.beginPath();
        ctx.moveTo(sPos.nx, sPos.ny);
        ctx.lineTo(tPos.nx, tPos.ny);

        // 가져온 연락처와의 연결은 녹색 점선
        const isImportedEdge = source.isImported || target.isImported;

        if (isImportedEdge) {
          ctx.strokeStyle = COLORS.edgeImported;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
        } else if (edge.degree === 1) {
          ctx.strokeStyle = 'rgba(74, 144, 226, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([]);
        } else {
          ctx.strokeStyle = 'rgba(123, 104, 238, 0.3)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 8]);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // ===== Draw Nodes =====
    // 트랜지션 중 새 노드 페이드인을 위한 진행도 계산
    const isTransitioning = transition.isActive;
    let transEased = 1;
    if (isTransitioning) {
      const elapsed = performance.now() - transition.startTime;
      transEased = easeOutCubic(Math.min(1, elapsed / transition.duration));
    }

    // Fish-eye + 시각적 깊이감 + LOD를 적용한 노드 그리기 헬퍼
    const drawNodeWithFisheye = (
      node: GraphNode,
      opts: Parameters<typeof drawNode>[2],
      rank: number,
    ) => {
      const fePos = getNodeRenderPos(node);
      const depthAlpha = getDepthAlpha(node.degree, transform.scale);
      const depthSc = getDepthScale(node.degree, transform.scale);
      const detail = shouldShowNodeDetail(node, transform.scale, rank);

      // 좌표 백업 (Fish-eye 복원용)
      const origX = node.x;
      const origY = node.y;
      if (useFisheye) {
        node.x = fePos.nx;
        node.y = fePos.ny;
      }

      // ★ 'hidden' 노드 처리
      if (detail === 'hidden' && !opts.isFocused && !opts.isHovered) {
        if (opts.isConnected) {
          // 연결된 hidden 노드는 작은 점(dot)으로만 표시
          ctx.save();
          ctx.globalAlpha = 0.35;
          ctx.beginPath();
          ctx.arc(node.x || 0, node.y || 0, 4, 0, Math.PI * 2);
          ctx.fillStyle = CATEGORY_COLORS[node.category || '기타'] || COLORS.nodePrimary;
          ctx.fill();
          ctx.restore();
        }
        node.x = origX;
        node.y = origY;
        return;
      }

      ctx.save();
      ctx.globalAlpha = (ctx.globalAlpha || 1) * depthAlpha;

      // ★ 'dot' 모드: 이름/프로필 없이 작은 색상 점으로만 표시
      if (detail === 'dot' && !opts.isConnected && !opts.isFocused && !opts.isHovered) {
        const nx = node.x || 0;
        const ny = node.y || 0;
        const dotRadius = 5 * depthSc;
        const catColor = CATEGORY_COLORS[node.category || '기타'] || COLORS.nodePrimary;

        // 작은 글로우
        const glowGrad = ctx.createRadialGradient(nx, ny, dotRadius, nx, ny, dotRadius * 3);
        glowGrad.addColorStop(0, catColor + '40');
        glowGrad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(nx, ny, dotRadius * 3, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.fill();

        // 점 본체
        ctx.beginPath();
        ctx.arc(nx, ny, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = catColor;
        ctx.fill();

        ctx.restore();
        node.x = origX;
        node.y = origY;
        return;
      }

      // ★ 'full' 모드: Fish-eye 확대 + 깊이 스케일 적용
      const totalScale = depthSc * (useFisheye && fePos.s > 1.01 ? fePos.s : 1);
      if (totalScale !== 1) {
        const cx = node.x || 0;
        const cy = node.y || 0;
        ctx.translate(cx, cy);
        ctx.scale(totalScale, totalScale);
        ctx.translate(-cx, -cy);
      }

      drawNode(ctx, node, opts);
      ctx.restore();

      node.x = origX;
      node.y = origY;
    };

    // 1. Non-connected nodes first (뒤쪽 레이어)
    for (const node of nodes) {
      const isConnectedToFocused = connectedNodeIds.has(node.id);
      if (hasFocusedNode && isConnectedToFocused) continue;

      const isHighlighted = !!(highlightedKeyword && node.keywords.includes(highlightedKeyword));
      const isHovered = hoveredNode?.id === node.id;
      const isDimmed = false;
      const rank = importanceRankMap.get(node.id) || 999;

      // 새로 나타나는 노드: 페이드인
      const isNewNode = isTransitioning && !transition.prevPositions.has(node.id);
      if (isNewNode) {
        ctx.save();
        ctx.globalAlpha = transEased;
      }

      drawNodeWithFisheye(node, {
        isHovered,
        isFocused: false,
        isConnected: false,
        isDimmed,
        isHighlighted,
        hasNews: nodesWithNews.has(node.name),
      }, rank);

      if (isNewNode) {
        ctx.restore();
      }
    }

    // 2. Connected nodes (drawn on top - 앞쪽 레이어, 항상 full detail)
    if (hasFocusedNode) {
      for (const node of nodes) {
        const isConnectedToFocused = connectedNodeIds.has(node.id);
        if (!isConnectedToFocused) continue;

        const isFocused = focusedNodeId === node.id;
        const isHovered = hoveredNode?.id === node.id;

        drawNodeWithFisheye(node, {
          isHovered,
          isFocused,
          isConnected: true,
          isDimmed: false,
          isHighlighted: false,
          isMutual: mutualNodeIds.has(node.id),
          hasNews: nodesWithNews.has(node.name),
        }, 0); // rank 0 = always full detail
      }
    }

    // ===== Draw Labels (separate pass - always on top of all nodes) =====
    // 의미론적 줌 + 라벨-노드 충돌 감지로 가독성 극대화
    // 이미 표시된 라벨 영역 추적 (겹침 방지)
    const placedLabels: { cx: number; cy: number; hw: number; hh: number }[] = [];

    for (const node of nodes) {
      const isFocused = focusedNodeId === node.id;
      const isConnected = connectedNodeIds.has(node.id);
      const rank = importanceRankMap.get(node.id) || 999;
      const importance = node.importance || 0;

      // 의미론적 줌 — 줌 아웃 시 상위 노드만 라벨 표시
      let showLabel = shouldShowLabel(node, transform.scale, importance, rank);

      // 포커스된 노드 및 연결된 노드는 항상 라벨 표시
      if (isFocused || (hasFocusedNode && isConnected)) showLabel = true;

      // Fish-eye 확대 중인 노드는 항상 라벨 표시
      const fePos = fisheyePositions.get(node.id);
      const isFisheyeEnlarged = fePos && fePos.s > 1.3;
      if (isFisheyeEnlarged) showLabel = true;

      // 호버 중인 노드도 라벨 표시
      if (hoveredNode?.id === node.id) showLabel = true;

      if (!showLabel) continue;

      // Fish-eye 좌표 적용
      const origX = node.x;
      const origY = node.y;
      if (useFisheye && fePos) {
        node.x = fePos.nx;
        node.y = fePos.ny;
      }

      const depthAlpha = getDepthAlpha(node.degree, transform.scale);
      const labelX = node.x || 0;
      const radius = getNodeSize(node, false, isFocused);
      const labelY = (node.y || 0) + radius + 14;

      // 라벨-라벨 겹침 방지: 새 라벨이 기존 라벨과 겹치면 건너뜀
      // (한글 이름 3자 기준 약 45px 폭 + 여유)
      const estHW = 45;
      const estHH = 14;
      let overlaps = false;
      for (const placed of placedLabels) {
        if (
          Math.abs(labelX - placed.cx) < (estHW + placed.hw) &&
          Math.abs(labelY - placed.cy) < (estHH + placed.hh)
        ) {
          overlaps = true;
          break;
        }
      }

      // 중요한 노드(포커스, 호버, 중앙)는 겹침이 있어도 표시
      if (overlaps && !isFocused && node.degree !== 0 && hoveredNode?.id !== node.id) {
        node.x = origX;
        node.y = origY;
        continue;
      }

      placedLabels.push({ cx: labelX, cy: labelY, hw: estHW, hh: estHH });

      ctx.save();
      ctx.globalAlpha = depthAlpha;

      drawNodeLabel(ctx, node, { isDimmed: false, isFocused, allNodes: nodes, isMutual: mutualNodeIds.has(node.id) });

      ctx.restore();
      node.x = origX;
      node.y = origY;

      // 그룹 배지 그리기
      if (node.degree !== 0) {
        const nodeGroups = getGroupsForNode(node.id);
        if (nodeGroups.length > 0) {
          const feP = getNodeRenderPos(node);
          const origX2 = node.x;
          const origY2 = node.y;
          if (useFisheye) { node.x = feP.nx; node.y = feP.ny; }
          const r = getNodeSize(node, hoveredNode?.id === node.id, isFocused);
          drawGroupBadges(ctx, node, nodeGroups, r);
          node.x = origX2;
          node.y = origY2;
        }
      }
    }

    // Fish-eye 렌즈 시각적 인디케이터 (터치 영역 표시)
    if (useFisheye && feStrength > 0.3) {
      ctx.beginPath();
      ctx.arc(fe.currentX, fe.currentY, 280, 0, Math.PI * 2);
      const lensAlpha = Math.min(0.12, feStrength * 0.04);
      ctx.strokeStyle = `rgba(88, 166, 255, ${lensAlpha})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 8]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 렌즈 중심 십자표시
      const crossSize = 8;
      ctx.strokeStyle = `rgba(88, 166, 255, ${lensAlpha * 2})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(fe.currentX - crossSize, fe.currentY);
      ctx.lineTo(fe.currentX + crossSize, fe.currentY);
      ctx.moveTo(fe.currentX, fe.currentY - crossSize);
      ctx.lineTo(fe.currentX, fe.currentY + crossSize);
      ctx.stroke();
    }

    ctx.restore();
  }, [transform, highlightedKeyword, hoveredNode, focusedNodeId, getConnectedNodeIds, getVisibleNodeIds, isEdgeVisible, drawNode, drawNodeLabel, drawGroupBadges, getGroupsForNode, getNodeSize, activeGroupFilter, getNodesInGroup, allMemberships, allGroups, dimensions.width, dimensions.height, nodesWithNews]);

  // Smooth animation to target transform
  useEffect(() => {
    if (!targetTransform) return;

    const animateToTarget = () => {
      setTransform(prev => {
        const dx = targetTransform.x - prev.x;
        const dy = targetTransform.y - prev.y;
        const ds = targetTransform.scale - prev.scale;
        const ease = 0.15; // 더 부드러운 감속 이징

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

  // Animation loop (트랜지션 위치 보간 포함)
  useEffect(() => {
    const animate = () => {
      // 트랜지션 활성화 시 노드 위치를 보간
      const transition = transitionRef.current;
      if (transition.isActive) {
        const elapsed = performance.now() - transition.startTime;
        const rawProgress = Math.min(1, elapsed / transition.duration);
        const eased = easeOutCubic(rawProgress);

        for (const node of nodesRef.current) {
          const target = transition.targetPositions.get(node.id);
          const prev = transition.prevPositions.get(node.id);

          if (prev && target) {
            // 기존 노드: 이전 위치 → 새 위치로 부드럽게 이동
            node.x = prev.x + (target.x - prev.x) * eased;
            node.y = prev.y + (target.y - prev.y) * eased;
            node.fx = node.x;
            node.fy = node.y;
          } else if (target) {
            // 새 노드: 중앙에서 퍼져나감
            node.x = transition.centerX + (target.x - transition.centerX) * eased;
            node.y = transition.centerY + (target.y - transition.centerY) * eased;
            node.fx = node.x;
            node.fy = node.y;
          }
        }

        if (rawProgress >= 1) {
          // 완료: 최종 위치 확정
          for (const node of nodesRef.current) {
            const target = transition.targetPositions.get(node.id);
            if (target) {
              node.x = target.x;
              node.y = target.y;
              node.fx = target.x;
              node.fy = target.y;
            }
          }
          transition.isActive = false;
          transition.fadingNodes = [];
        }
      }

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

  // Mouse interactions — 보로노이(Voronoi) 기반 최근접 노드 선택
  // 정확히 노드 위를 터치하지 않아도 가장 가까운 노드가 선택됨 (모바일 최적화)
  const getNodeAtPosition = (x: number, y: number): GraphNode | null => {
    const adjustedX = (x - transform.x) / transform.scale;
    const adjustedY = (y - transform.y) / transform.scale;

    const visibleIds = getVisibleNodeIds();
    let closestNode: GraphNode | null = null;
    let closestDist = Infinity;

    // 1단계: 정확한 히트 검사 (노드 원 내부)
    for (const node of nodesRef.current) {
      if (!visibleIds.has(node.id)) continue;
      const dx = (node.x || 0) - adjustedX;
      const dy = (node.y || 0) - adjustedY;
      const radius = node.degree === 0 ? NODE_SIZES.core :
                     node.degree === 1 ? NODE_SIZES.primary : NODE_SIZES.secondary;

      const distSq = dx * dx + dy * dy;
      if (distSq < (radius + 10) * (radius + 10)) {
        if (distSq < closestDist) {
          closestDist = distSq;
          closestNode = node;
        }
      }
    }

    // 2단계: 정확한 히트가 없으면 보로노이 방식으로 최근접 노드 선택
    // (반경 60px 이내에서만 — 너무 먼 빈 공간은 null)
    if (!closestNode) {
      const voronoiMaxDist = 60 / transform.scale; // 화면 크기 대비 60px
      const voronoiMaxDistSq = voronoiMaxDist * voronoiMaxDist;

      for (const node of nodesRef.current) {
        if (!visibleIds.has(node.id)) continue;
        const dx = (node.x || 0) - adjustedX;
        const dy = (node.y || 0) - adjustedY;
        const distSq = dx * dx + dy * dy;

        if (distSq < voronoiMaxDistSq && distSq < closestDist) {
          closestDist = distSq;
          closestNode = node;
        }
      }
    }

    return closestNode;
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

    // 월드 좌표 변환 (드래그에 사용)
    const worldX = (x - transform.x) / transform.scale;
    const worldY = (y - transform.y) / transform.scale;

    if (draggedNode) {
      draggedNode.fx = worldX;
      draggedNode.fy = worldY;
      setTooltip(null);
      // 드래그 중에는 fish-eye 비활성화
      fisheyeFocusRef.current.active = false;
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
      fisheyeFocusRef.current.active = false;
    } else {
      const node = getNodeAtPosition(x, y);
      setHoveredNode(node);

      // Fish-eye 비활성화: 노드 움직임으로 클릭이 어려워지는 문제 방지
      fisheyeFocusRef.current.active = false;

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
    fisheyeFocusRef.current.active = false;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  // ===== Touch Event Handlers (모바일 핀치 줌 & 패닝) =====
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setTooltip(null);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const node = getNodeAtPosition(x, y);

      // Fish-eye 비활성화: 노드 움직임으로 클릭이 어려워지는 문제 방지
      fisheyeFocusRef.current.active = false;

      // 노드 터치 여부와 관계없이 항상 패닝 시작 (노드 드래그 비활성화)
      setIsDragging(true);

      lastPosRef.current = { x: touch.clientX, y: touch.clientY };
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    } else if (e.touches.length === 2) {
      // 핀치 줌 시작 - 드래그 중지
      setIsDragging(false);
      setDraggedNode(null);
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDistRef.current = Math.sqrt(dx * dx + dy * dy);
      // 두 손가락 중심점 저장
      lastPosRef.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 1 && !lastPinchDistRef.current) {
      const touch = e.touches[0];

      if (draggedNode) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        draggedNode.fx = (x - transform.x) / transform.scale;
        draggedNode.fy = (y - transform.y) / transform.scale;
      } else if (isDragging) {
        const dx = touch.clientX - lastPosRef.current.x;
        const dy = touch.clientY - lastPosRef.current.y;
        setTransform(prev => ({
          ...prev,
          x: prev.x + dx,
          y: prev.y + dy,
        }));
      }
      lastPosRef.current = { x: touch.clientX, y: touch.clientY };
    } else if (e.touches.length === 2) {
      // 핀치 줌
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

      if (lastPinchDistRef.current > 0) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const pinchX = centerX - rect.left;
        const pinchY = centerY - rect.top;

        const scaleFactor = dist / lastPinchDistRef.current;
        const newScale = Math.max(0.3, Math.min(3, transform.scale * scaleFactor));

        // 두 손가락 중심점으로 줌 + 패닝
        const panDx = centerX - lastPosRef.current.x;
        const panDy = centerY - lastPosRef.current.y;

        setTransform(prev => ({
          x: pinchX - (pinchX - prev.x) * (newScale / prev.scale) + panDx,
          y: pinchY - (pinchY - prev.y) * (newScale / prev.scale) + panDy,
          scale: newScale,
        }));
      }

      lastPinchDistRef.current = dist;
      lastPosRef.current = { x: centerX, y: centerY };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();

    // Fish-eye 비활성화 (터치 종료)
    fisheyeFocusRef.current.active = false;

    // 탭 감지: 터치 시작 위치에서 거의 움직이지 않았으면 클릭으로 처리
    if (e.changedTouches.length === 1 && touchStartPosRef.current && !lastPinchDistRef.current) {
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartPosRef.current.x;
      const dy = touch.clientY - touchStartPosRef.current.y;
      const moved = Math.sqrt(dx * dx + dy * dy);

      if (moved < 10) {
        // 탭 → 클릭 이벤트 시뮬레이션
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const x = touch.clientX - rect.left;
          const y = touch.clientY - rect.top;

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
          } else {
            const node = getNodeAtPosition(x, y);
            if (node) {
              // 탭 시 프로필 표시 (더블탭 recenter 없음)
              if (focusedNodeId === node.id) {
                setFocusedNodeId(null);
                setSelectedNode(null);
                setExpandedNodeIds(prev => {
                  const next = new Set(prev);
                  next.delete(node.id);
                  return next;
                });
              } else if (node.degree !== 0) {
                focusOnNode(node);
                setSelectedNode(node);
                setExpandedNodeIds(prev => {
                  const next = new Set(prev);
                  if (next.has(node.id)) {
                    next.delete(node.id);
                  } else {
                    next.clear();
                    next.add(node.id);
                  }
                  return next;
                });
              } else {
                focusOnNode(node);
                if (centerUserId && centerUserOriginalDegree != null) {
                  setSelectedNode({ ...node, degree: centerUserOriginalDegree });
                } else {
                  setSelectedNode(node);
                }
                setExpandedNodeIds(new Set());
              }
            } else {
              setFocusedNodeId(null);
              setSelectedNode(null);
              setExpandedNodeIds(new Set());
            }
          }
        }
      }
    }

    if (draggedNode) {
      draggedNode.x = draggedNode.fx ?? draggedNode.x;
      draggedNode.y = draggedNode.fy ?? draggedNode.y;
      setDraggedNode(null);
    }
    setIsDragging(false);
    touchStartPosRef.current = null;

    // 모든 손가락이 떼어졌을 때 핀치 상태 초기화
    if (e.touches.length === 0) {
      lastPinchDistRef.current = 0;
    }
  };

  const focusOnNode = (node: GraphNode) => {
    if (node.x == null || node.y == null) return;

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    // 클릭 시 약간 줌인하면서 중앙으로 이동 (최소 1.0 배율 보장)
    const targetScale = Math.max(1.0, Math.min(1.8, transform.scale * 1.15));

    const targetX = centerX - node.x * targetScale;
    const targetY = centerY - node.y * targetScale;

    setTargetTransform({
      x: targetX,
      y: targetY,
      scale: targetScale,
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
        lastClickTimeRef.current = 0;
        lastClickNodeRef.current = null;
        return;
      }

      // degree 0이 아닌 노드: 클릭=expand 토글 + 포커스
      if (node.degree !== 0) {
        focusOnNode(node);
        setSelectedNode(node);
        setExpandedNodeIds(prev => {
          const next = new Set(prev);
          if (next.has(node.id)) {
            next.delete(node.id);
          } else {
            next.clear(); // 하나만 확장
            next.add(node.id);
          }
          return next;
        });
        return;
      }

      // 중앙 노드 클릭 시 모든 확장 해제
      focusOnNode(node);
      // 다른 인물의 네트워크를 보고 있을 때는 원래 촌수로 프로필 표시
      if (centerUserId && centerUserOriginalDegree != null) {
        setSelectedNode({ ...node, degree: centerUserOriginalDegree });
      } else {
        setSelectedNode(node);
      }
      setExpandedNodeIds(new Set());
    } else {
      setFocusedNodeId(null);
      setSelectedNode(null);
      // 빈 공간 클릭 시 모든 확장 해제
      setExpandedNodeIds(new Set());
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // 진행 중인 자동 이동 애니메이션을 즉시 취소 (휠과 충돌 방지)
    setTargetTransform(null);

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;

    setTransform(prev => {
      const newScale = Math.max(0.3, Math.min(3, prev.scale * delta));
      return {
        x: x - (x - prev.x) * (newScale / prev.scale),
        y: y - (y - prev.y) * (newScale / prev.scale),
        scale: newScale,
      };
    });
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
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
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
            <div className="bg-[#151922]/95 backdrop-blur-xl border border-[#30363D] rounded-xl px-4 py-3 shadow-2xl">
              <div className="text-base font-semibold text-white mb-1">{tooltip.node.name}</div>
              <div className="text-sm text-[#8B949E]">{tooltip.node.company}</div>
              <div className="text-sm text-[#8B949E]">{tooltip.node.position}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFB800]/20 text-[#FFB800]">
                  {tooltip.node.degree}단계
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#58A6FF]/20 text-[#58A6FF]">
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
          <Plus size={20} className="group-hover:text-[#58A6FF] transition-colors" />
        </button>
        <button
          onClick={handleZoomOut}
          className="zoom-btn group"
          title="축소"
        >
          <Minus size={20} className="group-hover:text-[#58A6FF] transition-colors" />
        </button>
        <button
          onClick={handleFitToScreen}
          className="zoom-btn group"
          title="전체 보기"
        >
          <Maximize2 size={18} className="group-hover:text-[#58A6FF] transition-colors" />
        </button>
        <button
          onClick={handleReset}
          className="zoom-btn group"
          title="초기화"
        >
          <RotateCcw size={18} className="group-hover:text-[#58A6FF] transition-colors" />
        </button>
      </div>

      {/* 나의 노드로 돌아가기 버튼 */}
      <AnimatePresence>
        {centerUserId && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={() => setCenterUserId(null)}
            className="absolute bottom-16 left-6 z-20 flex items-center gap-2 px-4 py-2.5 rounded-full
              bg-[#58A6FF]/15 backdrop-blur-xl border border-[#58A6FF]/40
              hover:bg-[#58A6FF]/25 hover:border-[#58A6FF]/70 hover:scale-105
              active:scale-95 transition-all duration-200 cursor-pointer group shadow-lg shadow-[#58A6FF]/10"
          >
            <Home size={16} className="text-[#58A6FF] group-hover:text-white transition-colors" />
            <span className="text-sm font-medium text-[#58A6FF] group-hover:text-white transition-colors">
              나의 인맥으로
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Zoom Level Indicator */}
      <div className="absolute bottom-6 left-6 text-sm text-[#484F58] bg-[#1C2333]/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-[#30363D] flex items-center gap-2">
        <span>{Math.round(transform.scale * 100)}%</span>
        <span className="text-[#58A6FF]">
          {transform.scale < ZOOM_CLUSTER_THRESHOLD ? '클러스터' :
           transform.scale >= ZOOM_DETAIL_THRESHOLD ? '상세' : '노드'}
        </span>
      </div>

    </div>
  );
}
