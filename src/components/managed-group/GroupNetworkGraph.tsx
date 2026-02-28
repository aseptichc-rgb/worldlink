'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ManagedGroupMember, User } from '@/types';
import { Plus, Minus, Maximize2 } from 'lucide-react';

interface MemberNode extends ManagedGroupMember {
  user?: User;
  x: number;
  y: number;
  ring: number; // 0=president, 1=executive/admin, 2=member
  radius: number;
}

interface GroupNetworkGraphProps {
  members: (ManagedGroupMember & { user?: User })[];
  ownerId: string;
  groupColor: string;
  onMemberTap?: (member: ManagedGroupMember & { user?: User }) => void;
}

// Node sizes by ring
const NODE_SIZES = {
  0: 42, // President
  1: 32, // Executive / Admin
  2: 26, // Regular member
} as const;

// Font sizes
const FONT_SIZES = {
  0: 16,
  1: 13,
  2: 11,
} as const;

// Image cache
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

  const lastPosRef = useRef({ x: 0, y: 0 });
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

  // Layout nodes in concentric rings
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

    // If no president, the admin/owner goes to center
    const centerMember = president || members.find(m => m.userId === ownerId);
    const innerRing = president
      ? executives.concat(
          members.filter(m => m.userId === ownerId && m.userId !== president.userId && !executives.some(e => e.userId === m.userId))
        )
      : executives;
    const outerRing = president
      ? regulars.filter(m => m.userId !== president.userId && !innerRing.some(e => e.userId === m.userId))
      : regulars.filter(m => m.userId !== centerMember?.userId && !innerRing.some(e => e.userId === m.userId));

    const nodes: MemberNode[] = [];

    // Center node
    if (centerMember) {
      nodes.push({
        ...centerMember,
        x: centerX,
        y: centerY,
        ring: 0,
        radius: NODE_SIZES[0],
      });
    }

    // Inner ring (executives)
    const minDim = Math.min(dimensions.width, dimensions.height);
    const innerRadius = Math.max(120, minDim * 0.2);
    innerRing.forEach((member, i) => {
      const angle = (i / Math.max(innerRing.length, 1)) * Math.PI * 2 - Math.PI / 2;
      nodes.push({
        ...member,
        x: centerX + Math.cos(angle) * innerRadius,
        y: centerY + Math.sin(angle) * innerRadius,
        ring: 1,
        radius: NODE_SIZES[1],
      });
    });

    // Outer ring (regular members)
    const outerRadius = Math.max(220, minDim * 0.36);
    outerRing.forEach((member, i) => {
      const angle = (i / Math.max(outerRing.length, 1)) * Math.PI * 2 - Math.PI / 2;
      nodes.push({
        ...member,
        x: centerX + Math.cos(angle) * outerRadius,
        y: centerY + Math.sin(angle) * outerRadius,
        ring: 2,
        radius: NODE_SIZES[2],
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

      // Draw edges
      if (centerNode) {
        nodes.forEach(node => {
          if (node.ring === 0) return;

          const sourceNode = node.ring === 1 ? centerNode : null;
          if (!sourceNode) return;

          ctx.beginPath();
          ctx.moveTo(sourceNode.x, sourceNode.y);
          ctx.lineTo(node.x, node.y);
          ctx.strokeStyle = node.ring === 1
            ? hexToRgba('#FFD700', 0.25)
            : hexToRgba(groupColor, 0.12);
          ctx.lineWidth = node.ring === 1 ? 1.5 : 1;
          if (node.ring === 2) ctx.setLineDash([3, 6]);
          ctx.stroke();
          ctx.setLineDash([]);
        });

        // Edges from executives to nearby outer members
        const executives = nodes.filter(n => n.ring === 1);
        const outerMembers = nodes.filter(n => n.ring === 2);
        executives.forEach(exec => {
          outerMembers.forEach(member => {
            const dx = exec.x - member.x;
            const dy = exec.y - member.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const threshold = Math.min(dimensions.width, dimensions.height) * 0.3;
            if (dist < threshold) {
              ctx.beginPath();
              ctx.moveTo(exec.x, exec.y);
              ctx.lineTo(member.x, member.y);
              ctx.strokeStyle = hexToRgba(groupColor, 0.08);
              ctx.lineWidth = 0.5;
              ctx.setLineDash([2, 6]);
              ctx.stroke();
              ctx.setLineDash([]);
            }
          });
        });
      }

      // Draw nodes
      nodes.forEach(node => {
        const isHovered = hoveredNode?.userId === node.userId;
        const { x, y, radius } = node;
        const effectiveRadius = isHovered ? radius + 4 : radius;

        // Glow
        if (node.ring === 0 || isHovered) {
          const glowRadius = effectiveRadius * (node.ring === 0 ? 2.8 : 2.2);
          const glowGrad = ctx.createRadialGradient(x, y, effectiveRadius * 0.5, x, y, glowRadius);
          const glowColor = node.ring === 0 ? '#FFD700' : groupColor;
          glowGrad.addColorStop(0, hexToRgba(glowColor, node.ring === 0 ? 0.35 : 0.25));
          glowGrad.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
          ctx.fillStyle = glowGrad;
          ctx.fill();
        }

        // Node circle background
        ctx.beginPath();
        ctx.arc(x, y, effectiveRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#161B22';
        ctx.fill();

        // Border
        const borderColor = node.ring === 0 ? '#FFD700' :
          node.role === 'executive' ? groupColor :
          node.userId === ownerId ? '#FFA657' :
          hexToRgba(groupColor, 0.6);
        ctx.lineWidth = node.ring === 0 ? 3.5 : isHovered ? 3 : 2;
        ctx.strokeStyle = borderColor;
        ctx.stroke();

        // Profile image
        const imgUrl = node.user?.profileImage;
        if (imgUrl && transform.scale >= 0.5) {
          const img = getProfileImage(imgUrl);
          if (img) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, effectiveRadius - 2, 0, Math.PI * 2);
            ctx.clip();
            const imgSize = (effectiveRadius - 2) * 2;
            ctx.drawImage(img, x - effectiveRadius + 2, y - effectiveRadius + 2, imgSize, imgSize);
            ctx.restore();

            // Re-draw border
            ctx.beginPath();
            ctx.arc(x, y, effectiveRadius, 0, Math.PI * 2);
            ctx.lineWidth = node.ring === 0 ? 3.5 : isHovered ? 3 : 2;
            ctx.strokeStyle = borderColor;
            ctx.stroke();
          } else {
            // Draw initials while image loads
            drawInitials(ctx, node, effectiveRadius);
          }
        } else if (!imgUrl) {
          drawInitials(ctx, node, effectiveRadius);
        }

        // Name label
        const fontSize = FONT_SIZES[node.ring as keyof typeof FONT_SIZES] || 11;
        const scaledFontSize = fontSize / Math.max(transform.scale, 0.5);
        ctx.font = `600 ${Math.min(fontSize, scaledFontSize)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
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

        // Title/role badge
        const displayTitle = node.role === 'president'
          ? (node.title || '회장')
          : node.role === 'executive'
            ? (node.title || '회장단')
            : node.userId === ownerId && node.ring <= 1
              ? '그룹장'
              : null;

        if (displayTitle && transform.scale >= 0.6) {
          const badgeFontSize = Math.max(9, fontSize - 3);
          ctx.font = `700 ${badgeFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
          const badgeWidth = ctx.measureText(displayTitle).width;
          const badgeY = y - effectiveRadius - badgeFontSize - 2;

          const badgeColor = node.role === 'president' ? '#FFD700' :
            node.role === 'executive' ? groupColor : '#FFA657';

          // Badge background
          ctx.fillStyle = hexToRgba(badgeColor, 0.2);
          const badgePadH = 6;
          const badgePadV = 3;
          const bx = x - badgeWidth / 2 - badgePadH;
          const by = badgeY - badgeFontSize + 1 - badgePadV;
          const bw = badgeWidth + badgePadH * 2;
          const bh = badgeFontSize + badgePadV * 2 + 2;
          ctx.beginPath();
          ctx.roundRect(bx, by, bw, bh, 4);
          ctx.fill();

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
  }, [dimensions, transform, hoveredNode, groupColor, ownerId, members]);

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

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-[#161B22]/90 backdrop-blur-sm border border-[#30363D] rounded-xl px-3 py-2 text-[10px]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#FFD700' }} />
            <span className="text-[#8B949E]">회장</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: groupColor }} />
            <span className="text-[#8B949E]">회장단</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hexToRgba(groupColor, 0.5) }} />
            <span className="text-[#8B949E]">멤버</span>
          </span>
        </div>
      </div>

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
