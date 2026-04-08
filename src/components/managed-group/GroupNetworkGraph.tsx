'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ManagedGroupMember, User } from '@/types';
import { Plus, Minus, Maximize2, Loader2 } from 'lucide-react';
import { MemberConnection } from '@/lib/firebase-services';

interface MemberNode extends ManagedGroupMember {
  user?: User;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ring: number; // 0=president, 1=executive/admin, 2=member
  radius: number;
  researchField?: string;
}

interface GroupNetworkGraphProps {
  members: (ManagedGroupMember & { user?: User })[];
  ownerId: string;
  groupColor: string;
  connections?: MemberConnection[];
  isLoadingConnections?: boolean;
  onMemberTap?: (member: ManagedGroupMember & { user?: User }) => void;
}

// Category colors - category-utils.ts에서 임포트
import { CATEGORY_COLORS as SHARED_CATEGORY_COLORS } from '@/lib/category-utils';
const CATEGORY_COLORS: Record<string, string> = {
  ...SHARED_CATEGORY_COLORS,
  'default': '#8B949E',
};

// Node sizes by ring - 회장/회장단 강조
const NODE_SIZES = {
  0: 48, // President
  1: 38, // Executive / Admin
  2: 28, // Regular member
} as const;

// Font sizes
const FONT_SIZES = {
  0: 14,
  1: 12,
  2: 11,
} as const;

// Glow intensity by role
const GLOW_MULTIPLIERS = {
  0: 2.8, // President - 강한 글로우
  1: 2.2, // Executive
  2: 1.6, // Member
} as const;

// Image cache
const imageCache = new Map<string, HTMLImageElement>();
const imageLoadingSet = new Set<string>();
const failedImageSet = new Set<string>();
let imageLoadCallback: (() => void) | null = null;

function setImageLoadCallback(callback: (() => void) | null) {
  imageLoadCallback = callback;
}

function getProfileImage(src: string): HTMLImageElement | null {
  if (imageCache.has(src)) return imageCache.get(src)!;
  if (imageLoadingSet.has(src)) return null;
  if (failedImageSet.has(src)) return null;

  imageLoadingSet.add(src);
  const img = new Image();
  img.onload = () => {
    imageCache.set(src, img);
    imageLoadingSet.delete(src);
    if (imageLoadCallback) imageLoadCallback();
  };
  img.onerror = () => {
    imageLoadingSet.delete(src);
    failedImageSet.add(src);
    if (imageLoadCallback) imageLoadCallback();
  };
  img.src = src;
  return null;
}

// 프로필 이미지 URL 결정
function resolveProfileImageUrl(user?: User): string | null {
  if (user?.profileImage) return user.profileImage;
  return null;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function GroupNetworkGraph({
  members,
  ownerId,
  groupColor,
  connections = [],
  isLoadingConnections = false,
  onMemberTap,
}: GroupNetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const nodesRef = useRef<MemberNode[]>([]);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<MemberNode | null>(null);
  const [imageLoadCount, setImageLoadCount] = useState(0);

  const lastPosRef = useRef({ x: 0, y: 0 });

  // 이미지 프리로딩 및 로드 완료 시 리렌더링
  useEffect(() => {
    // 이미지 로드 완료 콜백 등록 - 즉시 리렌더링 트리거
    setImageLoadCallback(() => {
      setImageLoadCount(c => c + 1);
    });

    // 모든 멤버의 프로필 이미지 프리로딩 시작
    members.forEach(member => {
      const imgUrl = resolveProfileImageUrl(member.user);
      if (imgUrl) {
        getProfileImage(imgUrl);
      }
    });

    return () => {
      setImageLoadCallback(null);
    };
  }, [members]);
  const lastPinchDistRef = useRef<number>(0);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

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

  // Layout nodes - 중앙 임원단 + 주변 멤버 방사형 배치 (모바일 최적화)
  useEffect(() => {
    // 유저 데이터 없는 멤버 제외
    const validMembers = members.filter(m => m.user?.name);
    if (validMembers.length === 0 || dimensions.width === 0) return;

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const isMobile = dimensions.width < 500;

    const president = validMembers.find(m => m.role === 'president');
    const executives = validMembers.filter(m =>
      m.role === 'executive' || (m.role === 'admin' && m.userId !== president?.userId)
    );
    const regulars = validMembers.filter(m => {
      if (m.role === 'president') return false;
      if (m.role === 'executive') return false;
      if (m.role === 'admin') return false;
      return true;
    });

    const centerMember = president || validMembers.find(m => m.userId === ownerId);
    const innerRing = president
      ? executives.concat(
          validMembers.filter(m => m.userId === ownerId && m.userId !== president.userId && !executives.some(e => e.userId === m.userId))
        )
      : executives;
    const outerRing = president
      ? regulars.filter(m => m.userId !== president.userId && !innerRing.some(e => e.userId === m.userId))
      : regulars.filter(m => m.userId !== centerMember?.userId && !innerRing.some(e => e.userId === m.userId));

    const nodes: MemberNode[] = [];

    // 분야별로 멤버 그룹핑 (분야 없으면 인덱스 기반으로 분산)
    const categoryMap = new Map<string, typeof outerRing>();
    const categoryColors = Object.keys(CATEGORY_COLORS).filter(k => k !== 'default');

    outerRing.forEach((m, idx) => {
      let cat: string = m.user?.researchField
        // 분야 정보가 없으면 색상 팔레트를 순환하며 분배
        || categoryColors[idx % categoryColors.length]
        || 'default';
      if (!categoryMap.has(cat)) categoryMap.set(cat, []);
      categoryMap.get(cat)!.push({ ...m, assignedCategory: cat } as typeof m & { assignedCategory: string });
    });

    const categories = Array.from(categoryMap.keys());
    const numCategories = Math.max(categories.length, 1);

    // 1. 회장 - 중앙
    if (centerMember) {
      nodes.push({
        ...centerMember,
        x: centerX,
        y: centerY,
        vx: 0,
        vy: 0,
        ring: 0,
        radius: isMobile ? 40 : NODE_SIZES[0],
        researchField: (centerMember.user as any)?.researchField,
      });
    }

    // 2. 임원단 - 회장 주변 원형 배치
    const execRadius = isMobile ? 70 : 100;
    innerRing.forEach((member, i) => {
      const angle = (i / Math.max(innerRing.length, 1)) * Math.PI * 2 - Math.PI / 2;
      nodes.push({
        ...member,
        x: centerX + Math.cos(angle) * execRadius,
        y: centerY + Math.sin(angle) * execRadius,
        vx: 0,
        vy: 0,
        ring: 1,
        radius: isMobile ? 32 : NODE_SIZES[1],
        researchField: (member.user as any)?.researchField,
      });
    });

    // 3. 일반 멤버 - 분야별로 섹터에 배치
    const minDim = Math.min(dimensions.width, dimensions.height);
    const baseRadius = isMobile ? minDim * 0.38 : minDim * 0.35;
    const nodeSize = isMobile ? 24 : NODE_SIZES[2];
    const nodeSpacing = isMobile ? 55 : 65;

    categories.forEach((category, catIdx) => {
      const membersInCategory = categoryMap.get(category)!;
      const numMembers = membersInCategory.length;

      // 각 분야가 차지하는 각도 범위
      const sectorAngle = (Math.PI * 2) / numCategories;
      const sectorStart = catIdx * sectorAngle - Math.PI / 2;

      // 멤버들을 여러 층으로 배치
      const maxPerRing = Math.max(3, Math.floor(sectorAngle * baseRadius / nodeSpacing));
      const numRings = Math.ceil(numMembers / maxPerRing);

      membersInCategory.forEach((member, idx) => {
        const ringIdx = Math.floor(idx / maxPerRing);
        const posInRing = idx % maxPerRing;
        const membersInThisRing = Math.min(maxPerRing, numMembers - ringIdx * maxPerRing);

        // 현재 링의 반경
        const radius = baseRadius + ringIdx * nodeSpacing;

        // 섹터 내 각도 (양쪽 여백 포함)
        const padding = sectorAngle * 0.1;
        const usableAngle = sectorAngle - padding * 2;
        const angleStep = membersInThisRing > 1 ? usableAngle / (membersInThisRing - 1) : 0;
        const angle = sectorStart + padding + posInRing * angleStep;

        const assignedCat = (member as any).assignedCategory || category;

        nodes.push({
          ...member,
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          vx: 0,
          vy: 0,
          ring: 2,
          radius: nodeSize,
          researchField: assignedCat,
        });
      });
    });

    // 4. 충돌 방지
    const minDistance = isMobile ? 45 : 55;
    for (let iter = 0; iter < 30; iter++) {
      let moved = false;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = a.radius + b.radius + minDistance;

          if (dist < minDist && dist > 0) {
            const overlap = (minDist - dist) / 2;
            const nx = dx / dist;
            const ny = dy / dist;

            const weightA = a.ring === 0 ? 0 : a.ring === 1 ? 0.1 : 1;
            const weightB = b.ring === 0 ? 0 : b.ring === 1 ? 0.1 : 1;
            const total = weightA + weightB || 1;

            a.x -= nx * overlap * (weightA / total);
            a.y -= ny * overlap * (weightA / total);
            b.x += nx * overlap * (weightB / total);
            b.y += ny * overlap * (weightB / total);
            moved = true;
          }
        }
      }
      if (!moved) break;
    }

    nodesRef.current = nodes;
  }, [members, ownerId, dimensions]);

  // Find node at position
  const getNodeAtPosition = useCallback((clientX: number, clientY: number): MemberNode | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - transform.x) / transform.scale;
    const y = (clientY - rect.top - transform.y) / transform.scale;

    // Check in reverse order (top nodes first)
    for (let i = nodesRef.current.length - 1; i >= 0; i--) {
      const node = nodesRef.current[i];
      const dx = node.x - x;
      const dy = node.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= node.radius + 8) return node;
    }
    return null;
  }, [transform]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const node = getNodeAtPosition(e.clientX, e.clientY);
    if (node) {
      if (onMemberTap) onMemberTap(node);
      return;
    }
    setIsDragging(true);
    lastPosRef.current = { x: e.clientX, y: e.clientY };
  }, [getNodeAtPosition, onMemberTap]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;
      setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastPosRef.current = { x: e.clientX, y: e.clientY };
    } else {
      const node = getNodeAtPosition(e.clientX, e.clientY);
      setHoveredNode(node);
      const canvas = canvasRef.current;
      if (canvas) canvas.style.cursor = node ? 'pointer' : 'grab';
    }
  }, [isDragging, getNodeAtPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => {
      const newScale = Math.max(0.3, Math.min(3, prev.scale * delta));
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return prev;
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      return {
        x: mx - (mx - prev.x) * (newScale / prev.scale),
        y: my - (my - prev.y) * (newScale / prev.scale),
        scale: newScale,
      };
    });
  }, []);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      lastPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setIsDragging(true);
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDistRef.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - lastPosRef.current.x;
      const dy = e.touches[0].clientY - lastPosRef.current.y;
      setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastPinchDistRef.current > 0) {
        const delta = dist / lastPinchDistRef.current;
        setTransform(prev => ({
          ...prev,
          scale: Math.max(0.3, Math.min(3, prev.scale * delta)),
        }));
      }
      lastPinchDistRef.current = dist;
    }
  }, [isDragging]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.changedTouches.length === 1 && touchStartPosRef.current) {
      const dx = e.changedTouches[0].clientX - touchStartPosRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartPosRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 10) {
        const node = getNodeAtPosition(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        if (node && onMemberTap) onMemberTap(node);
      }
    }
    setIsDragging(false);
    touchStartPosRef.current = null;
    lastPinchDistRef.current = 0;
  }, [getNodeAtPosition, onMemberTap]);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const render = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      ctx.save();
      ctx.translate(transform.x, transform.y);
      ctx.scale(transform.scale, transform.scale);

      const nodes = nodesRef.current;
      const centerNode = nodes.find(n => n.ring === 0);

      // Draw category labels (분야 그룹 바깥쪽에 표시 - 겹침 방지)
      if (transform.scale >= 0.5 && centerNode) {
        const memberNodes = nodes.filter(n => n.ring === 2);
        const categoryData = new Map<string, { sumX: number; sumY: number; maxDist: number; count: number }>();

        // 각 분야별 중심과 최대 거리 계산
        memberNodes.forEach(node => {
          const cat = node.researchField || 'default';
          if (!categoryData.has(cat)) {
            categoryData.set(cat, { sumX: 0, sumY: 0, maxDist: 0, count: 0 });
          }
          const data = categoryData.get(cat)!;
          data.sumX += node.x;
          data.sumY += node.y;
          const dist = Math.sqrt(Math.pow(node.x - centerNode.x, 2) + Math.pow(node.y - centerNode.y, 2));
          data.maxDist = Math.max(data.maxDist, dist);
          data.count++;
        });

        // 분야 라벨 그리기 (중심에서 바깥 방향으로)
        categoryData.forEach((data, category) => {
          if (data.count === 0) return;

          // 분야 그룹 중심
          const avgX = data.sumX / data.count;
          const avgY = data.sumY / data.count;

          // 중심에서 바깥 방향 계산
          const dx = avgX - centerNode.x;
          const dy = avgY - centerNode.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist === 0) return;

          // 라벨을 가장 바깥쪽 노드보다 더 바깥에 배치
          const labelDist = data.maxDist + 50;
          const labelX = centerNode.x + (dx / dist) * labelDist;
          const labelY = centerNode.y + (dy / dist) * labelDist;

          const categoryColor = CATEGORY_COLORS[category] || CATEGORY_COLORS['default'];

          // 라벨 배경
          ctx.font = '600 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
          const textWidth = ctx.measureText(category).width;
          ctx.fillStyle = hexToRgba(categoryColor, 0.2);
          ctx.beginPath();
          ctx.roundRect(labelX - textWidth / 2 - 8, labelY - 9, textWidth + 16, 18, 9);
          ctx.fill();

          // 라벨 테두리
          ctx.strokeStyle = hexToRgba(categoryColor, 0.5);
          ctx.lineWidth = 1;
          ctx.stroke();

          // 라벨 텍스트
          ctx.fillStyle = categoryColor;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(category, labelX, labelY);
          ctx.textBaseline = 'alphabetic';
        });
      }

      // Draw edges - 임원단에서 각 분야 그룹으로 연결
      const executiveNodes = nodes.filter(n => n.ring === 1);
      const memberNodes = nodes.filter(n => n.ring === 2);

      // 분야별 그룹핑
      const categoryGroups = new Map<string, MemberNode[]>();
      memberNodes.forEach(node => {
        const cat = node.researchField || 'default';
        if (!categoryGroups.has(cat)) categoryGroups.set(cat, []);
        categoryGroups.get(cat)!.push(node);
      });

      // 1. 임원단/회장 → 각 멤버 연결 (방사형)
      const coreNodes = centerNode ? [centerNode, ...executiveNodes] : executiveNodes;

      memberNodes.forEach(member => {
        // 가장 가까운 임원/회장 찾기
        let closestCore = coreNodes[0];
        let minDist = Infinity;
        coreNodes.forEach(core => {
          const dx = core.x - member.x;
          const dy = core.y - member.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDist) {
            minDist = dist;
            closestCore = core;
          }
        });

        const catColor = CATEGORY_COLORS[member.researchField || 'default'] || CATEGORY_COLORS['default'];

        ctx.beginPath();
        ctx.moveTo(closestCore.x, closestCore.y);
        ctx.lineTo(member.x, member.y);
        ctx.strokeStyle = hexToRgba(catColor, 0.15);
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // 2. 회장 → 임원단 연결 (골드 강조)
      if (centerNode) {
        executiveNodes.forEach(node => {
          ctx.beginPath();
          ctx.moveTo(centerNode.x, centerNode.y);
          ctx.lineTo(node.x, node.y);
          ctx.strokeStyle = hexToRgba('#FFD700', 0.4);
          ctx.lineWidth = 2;
          ctx.stroke();
        });
      }

      // Draw nodes - 회장/회장단을 마지막에 그려서 위에 표시
      const sortedNodes = [...nodes].sort((a, b) => b.ring - a.ring);

      sortedNodes.forEach(node => {
        const isHovered = hoveredNode?.userId === node.userId;
        const { x, y, radius } = node;
        const effectiveRadius = isHovered ? radius + 5 : radius;

        // Border color - 분야별 색상 적용
        let borderColor: string;
        if (node.ring === 0) {
          borderColor = '#FFD700'; // 회장 - 골드
        } else if (node.ring === 1) {
          borderColor = '#FFA657'; // 회장단 - 오렌지
        } else {
          // 일반 멤버 - 분야별 색상
          borderColor = CATEGORY_COLORS[node.researchField || 'default'] || CATEGORY_COLORS['default'];
        }

        // Glow - 모든 노드에 분야별 색상 글로우 적용
        const glowMult = node.ring === 0 ? 2.8 : node.ring === 1 ? 2.2 : 1.8;
        const glowRadius = effectiveRadius * glowMult;
        const glowGrad = ctx.createRadialGradient(x, y, effectiveRadius * 0.3, x, y, glowRadius);

        let glowColor: string;
        let glowAlpha: number;
        if (node.ring === 0) {
          glowColor = '#FFD700';
          glowAlpha = 0.5;
        } else if (node.ring === 1) {
          glowColor = '#FFA657';
          glowAlpha = 0.35;
        } else {
          glowColor = borderColor; // 분야별 색상으로 글로우
          glowAlpha = isHovered ? 0.4 : 0.2;
        }

        glowGrad.addColorStop(0, hexToRgba(glowColor, glowAlpha));
        glowGrad.addColorStop(0.5, hexToRgba(glowColor, glowAlpha * 0.3));
        glowGrad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.fill();

        const borderWidth = node.ring === 0 ? 4 : node.ring === 1 ? 3.5 : 3;

        // Node circle background
        ctx.beginPath();
        ctx.arc(x, y, effectiveRadius, 0, Math.PI * 2);
        ctx.fillStyle = node.ring === 0 ? '#1C1F26' : '#161B22';
        ctx.fill();

        // Profile image (profileImage 또는 /faces/{name}.jpg 폴백)
        const imgUrl = resolveProfileImageUrl(node.user);
        let imageDrawn = false;

        if (imgUrl) {
          const img = getProfileImage(imgUrl);
          if (img) {
            const clipRadius = effectiveRadius - borderWidth;

            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, clipRadius, 0, Math.PI * 2);
            ctx.clip();
            const imgSize = clipRadius * 2;
            ctx.drawImage(img, x - clipRadius, y - clipRadius, imgSize, imgSize);
            ctx.restore();
            imageDrawn = true;
          }
        }

        // 이미지가 없거나 로딩 중이면 이니셜 표시
        if (!imageDrawn) {
          drawInitials(ctx, node, effectiveRadius);
        }

        // White inner ring (이미지와 테두리 사이 흰색 링)
        if (imageDrawn) {
          ctx.beginPath();
          ctx.arc(x, y, effectiveRadius - borderWidth + 1, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Colored outer border
        ctx.beginPath();
        ctx.arc(x, y, effectiveRadius, 0, Math.PI * 2);
        ctx.lineWidth = borderWidth;
        ctx.strokeStyle = borderColor;
        ctx.stroke();

        // Name label
        const fontSize = FONT_SIZES[node.ring as keyof typeof FONT_SIZES] || 11;
        ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';

        const name = node.user?.name || '알 수 없음';
        const labelY = y + effectiveRadius + fontSize + 4;

        // Label background
        const textWidth = ctx.measureText(name).width;
        ctx.fillStyle = 'rgba(13, 17, 23, 0.85)';
        ctx.fillRect(x - textWidth / 2 - 4, labelY - fontSize + 1, textWidth + 8, fontSize + 4);

        // Label text
        ctx.fillStyle = '#F0F6FC';
        ctx.fillText(name, x, labelY);

        // Title/role badge - 이름 아래에 표시 (참조 이미지 스타일)
        const displayTitle = node.role === 'president'
          ? (node.title || '회장')
          : node.role === 'executive'
            ? (node.title || '회장단')
            : node.userId === ownerId && node.ring <= 1
              ? '그룹장'
              : null;

        if (displayTitle && transform.scale >= 0.6) {
          const badgeFontSize = Math.max(9, fontSize - 2);
          ctx.font = `700 ${badgeFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

          const badgeColor = node.role === 'president' ? '#FFD700' :
            node.role === 'executive' ? groupColor : '#FFA657';

          // Badge below name
          const badgeY = labelY + badgeFontSize + 3;
          const badgeTextWidth = ctx.measureText(displayTitle).width;

          // Badge background
          ctx.fillStyle = hexToRgba(badgeColor, 0.2);
          const badgePadH = 6;
          const badgePadV = 2;
          const bx = x - badgeTextWidth / 2 - badgePadH;
          const by = badgeY - badgeFontSize + 1 - badgePadV;
          const bw = badgeTextWidth + badgePadH * 2;
          const bh = badgeFontSize + badgePadV * 2 + 2;
          ctx.beginPath();
          ctx.roundRect(bx, by, bw, bh, 4);
          ctx.fill();

          // Badge border
          ctx.strokeStyle = hexToRgba(badgeColor, 0.4);
          ctx.lineWidth = 1;
          ctx.stroke();

          // Badge text
          ctx.fillStyle = badgeColor;
          ctx.textAlign = 'center';
          ctx.fillText(displayTitle, x, badgeY);
        }
      });

      ctx.restore();
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [dimensions, transform, hoveredNode, groupColor, ownerId, members, connections, imageLoadCount]);

  const resetView = () => setTransform({ x: 0, y: 0, scale: 1 });
  const zoomIn = () => setTransform(prev => ({ ...prev, scale: Math.min(3, prev.scale * 1.2) }));
  const zoomOut = () => setTransform(prev => ({ ...prev, scale: Math.max(0.3, prev.scale * 0.8) }));

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0D1117] overflow-hidden">
      <canvas
        ref={canvasRef}
        style={{ width: dimensions.width, height: dimensions.height }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="touch-none"
      />

      {/* Loading indicator */}
      {isLoadingConnections && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#161B22]/90 backdrop-blur-sm border border-[#30363D] rounded-lg px-2 py-1">
          <Loader2 size={12} className="animate-spin text-[#58A6FF]" />
          <span className="text-[10px] text-[#8B949E]">인맥 연결 로딩...</span>
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button
          onClick={zoomIn}
          className="w-8 h-8 bg-[#161B22]/90 backdrop-blur-sm border border-[#30363D] rounded-lg flex items-center justify-center text-[#8B949E] hover:text-white"
        >
          <Plus size={14} />
        </button>
        <button
          onClick={zoomOut}
          className="w-8 h-8 bg-[#161B22]/90 backdrop-blur-sm border border-[#30363D] rounded-lg flex items-center justify-center text-[#8B949E] hover:text-white"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={resetView}
          className="w-8 h-8 bg-[#161B22]/90 backdrop-blur-sm border border-[#30363D] rounded-lg flex items-center justify-center text-[#8B949E] hover:text-white"
        >
          <Maximize2 size={14} />
        </button>
      </div>

      {/* Member count */}
      <div className="absolute top-3 right-3 text-[10px] text-[#484F58]">
        {members.length}명
      </div>
    </div>
  );
}

function drawInitials(ctx: CanvasRenderingContext2D, node: MemberNode, radius: number) {
  const name = node.user?.name || '?';
  const initials = name.charAt(0);
  const fontSize = Math.max(12, radius * 0.7);
  ctx.font = `700 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText(initials, node.x, node.y);
  ctx.textBaseline = 'alphabetic';
}
