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
  category?: string;
}

interface GroupNetworkGraphProps {
  members: (ManagedGroupMember & { user?: User })[];
  ownerId: string;
  groupColor: string;
  connections?: MemberConnection[];
  isLoadingConnections?: boolean;
  onMemberTap?: (member: ManagedGroupMember & { user?: User }) => void;
}

// Category colors - 스크린샷과 유사하게
const CATEGORY_COLORS: Record<string, string> = {
  '의료기기': '#58A6FF',
  '솔루션': '#79C0FF',
  '투자': '#F85149',
  '법률': '#FFA657',
  '특허': '#A5854E',
  '바이오': '#3FB950',
  '의료기관': '#56D364',
  '비즈니스': '#DB8B00',
  '제약': '#A371F7',
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

// 프로필 이미지 URL 결정 (profileImage 없으면 /faces/{name}.jpg 폴백)
function resolveProfileImageUrl(user?: User): string | null {
  if (user?.profileImage) return user.profileImage;
  if (user?.name) return `/faces/${user.name}.jpg`;
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

  // Layout nodes - 스크린샷처럼 정렬된 레이아웃
  useEffect(() => {
    if (members.length === 0 || dimensions.width === 0) return;

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    const president = members.find(m => m.role === 'president');
    const executives = members.filter(m =>
      m.role === 'executive' || (m.role === 'admin' && m.userId !== president?.userId)
    );
    const regulars = members.filter(m => {
      if (m.role === 'president') return false;
      if (m.role === 'executive') return false;
      if (m.role === 'admin') return false;
      return true;
    });

    const centerMember = president || members.find(m => m.userId === ownerId);
    const innerRing = president
      ? executives.concat(
          members.filter(m => m.userId === ownerId && m.userId !== president.userId && !executives.some(e => e.userId === m.userId))
        )
      : executives;
    const outerRing = president
      ? regulars.filter(m => m.userId !== president.userId && !innerRing.some(e => e.userId === m.userId))
      : regulars.filter(m => m.userId !== centerMember?.userId && !innerRing.some(e => e.userId === m.userId));

    // 카테고리별 그룹핑
    const categoryGroups = new Map<string, typeof outerRing>();
    outerRing.forEach(m => {
      const cat = (m.user as any)?.category || 'default';
      if (!categoryGroups.has(cat)) categoryGroups.set(cat, []);
      categoryGroups.get(cat)!.push(m);
    });

    const nodes: MemberNode[] = [];

    // 1. 회장 - 정중앙
    if (centerMember) {
      nodes.push({
        ...centerMember,
        x: centerX,
        y: centerY,
        vx: 0,
        vy: 0,
        ring: 0,
        radius: NODE_SIZES[0],
        category: (centerMember.user as any)?.category,
      });
    }

    // 2. 회장단 - 회장 주변 원형 배치 (겹치지 않게 넓게)
    const executiveRadius = 140;
    const execCount = innerRing.length;
    innerRing.forEach((member, i) => {
      // 첫 번째는 우측 상단부터 시작, 균등 분배 (세로 겹침 방지)
      const startAngle = -Math.PI / 3; // -60도에서 시작
      const angleSpan = Math.PI * 1.5; // 270도 범위로 분산
      const angle = execCount === 1
        ? 0 // 1명이면 오른쪽
        : startAngle + (i / (execCount - 1 || 1)) * angleSpan;

      nodes.push({
        ...member,
        x: centerX + Math.cos(angle) * executiveRadius,
        y: centerY + Math.sin(angle) * executiveRadius,
        vx: 0,
        vy: 0,
        ring: 1,
        radius: NODE_SIZES[1],
        category: (member.user as any)?.category,
      });
    });

    // 3. 일반 멤버 - 회장/회장단 외곽에 원형으로 균등 배치
    const outerRadius = 280; // 외곽 반경
    const totalOuterMembers = outerRing.length;

    outerRing.forEach((member, i) => {
      // 360도 전체에 균등 분배
      const angle = (i / Math.max(totalOuterMembers, 1)) * Math.PI * 2 - Math.PI / 2;

      nodes.push({
        ...member,
        x: centerX + Math.cos(angle) * outerRadius,
        y: centerY + Math.sin(angle) * outerRadius,
        vx: 0,
        vy: 0,
        ring: 2,
        radius: NODE_SIZES[2],
        category: (member.user as any)?.category || 'default',
      });
    });

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

      // Draw ring guides
      if (centerNode) {
        const minDim = Math.min(dimensions.width, dimensions.height);
        const innerRadius = Math.max(120, minDim * 0.2);
        const outerRadius = Math.max(220, minDim * 0.36);

        [innerRadius, outerRadius].forEach(r => {
          ctx.beginPath();
          ctx.arc(centerNode.x, centerNode.y, r, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(48, 54, 61, 0.3)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 8]);
          ctx.stroke();
          ctx.setLineDash([]);
        });
      }

      // Draw edges - 실제 인맥 연결 관계
      const nodeMap = new Map(nodes.map(n => [n.userId, n]));

      // 1. 회장 → 회장단 연결 (골드/그룹색 강조)
      if (centerNode) {
        nodes.forEach(node => {
          if (node.ring !== 1) return; // 회장단만

          ctx.beginPath();
          ctx.moveTo(centerNode.x, centerNode.y);
          ctx.lineTo(node.x, node.y);
          ctx.strokeStyle = hexToRgba('#FFD700', 0.35);
          ctx.lineWidth = 2.5;
          ctx.stroke();
        });
      }

      // Draw nodes - 회장/회장단을 마지막에 그려서 위에 표시
      const sortedNodes = [...nodes].sort((a, b) => b.ring - a.ring);

      sortedNodes.forEach(node => {
        const isHovered = hoveredNode?.userId === node.userId;
        const { x, y, radius } = node;
        const effectiveRadius = isHovered ? radius + 5 : radius;

        // Glow - 회장/회장단에게 항상 글로우 적용
        if (node.ring <= 1 || isHovered) {
          const glowMult = GLOW_MULTIPLIERS[node.ring as keyof typeof GLOW_MULTIPLIERS] || 1.8;
          const glowRadius = effectiveRadius * glowMult;
          const glowGrad = ctx.createRadialGradient(x, y, effectiveRadius * 0.3, x, y, glowRadius);

          let glowColor: string;
          let glowAlpha: number;
          if (node.ring === 0) {
            glowColor = '#FFD700';
            glowAlpha = 0.45;
          } else if (node.ring === 1) {
            glowColor = groupColor;
            glowAlpha = 0.25;
          } else {
            glowColor = groupColor;
            glowAlpha = 0.15;
          }

          glowGrad.addColorStop(0, hexToRgba(glowColor, glowAlpha));
          glowGrad.addColorStop(0.6, hexToRgba(glowColor, glowAlpha * 0.3));
          glowGrad.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
          ctx.fillStyle = glowGrad;
          ctx.fill();
        }

        // Border color - 회장/회장단은 역할 색상, 일반 멤버는 카테고리 색상
        let borderColor: string;
        if (node.ring === 0) {
          borderColor = '#FFD700'; // 회장 - 골드
        } else if (node.ring === 1) {
          borderColor = '#FFA657'; // 회장단 - 오렌지
        } else {
          borderColor = CATEGORY_COLORS[node.category || 'default'] || CATEGORY_COLORS['default'];
        }
        const borderWidth = node.ring === 0 ? 4 : node.ring === 1 ? 3.5 : isHovered ? 3 : 2.5;

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
