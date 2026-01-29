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

// 노드 크기 상수 - 계층별 차별화
const NODE_SIZES = {
  core: 36,        // 중앙 노드 (크게)
  primary: 26,     // 1차 연결 (기존보다 20% 확대)
  secondary: 18,   // 2차 연결 (기존보다 10% 축소)
  tertiary: 14,    // 3차 연결 (최소)
};

// 폰트 크기 상수
const FONT_SIZES = {
  core: 16,
  primary: 14,
  secondary: 12,
  tertiary: 11,
};

export default function NetworkGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const edgeAnimationRef = useRef<number>(0);

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

  // Initialize nodes with fixed positions
  useEffect(() => {
    if (nodes.length === 0 || dimensions.width === 0) return;

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    // Group nodes by degree
    const degree0Nodes = nodes.filter(n => n.degree === 0);
    const degree1Nodes = nodes.filter(n => n.degree === 1);
    const degree2Nodes = nodes.filter(n => n.degree === 2);

    nodesRef.current = nodes.map((node) => {
      let x = centerX;
      let y = centerY;

      if (node.degree === 0) {
        x = centerX;
        y = centerY;
      } else if (node.degree === 1) {
        const index = degree1Nodes.findIndex(n => n.id === node.id);
        const angle = (index / degree1Nodes.length) * Math.PI * 2 - Math.PI / 2;
        const radius = 180; // 약간 넓게
        x = centerX + Math.cos(angle) * radius;
        y = centerY + Math.sin(angle) * radius;
      } else if (node.degree === 2) {
        const index = degree2Nodes.findIndex(n => n.id === node.id);
        const angle = (index / degree2Nodes.length) * Math.PI * 2 - Math.PI / 2;
        const radius = 360; // 더 넓게
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

  // 노드 색상 계산
  const getNodeColor = useCallback((node: GraphNode, isDimmed: boolean): string => {
    if (isDimmed) {
      return node.degree === 0 ? 'rgba(0, 217, 255, 0.3)' :
             node.degree === 1 ? 'rgba(74, 144, 226, 0.3)' :
             'rgba(123, 104, 238, 0.3)';
    }
    return node.degree === 0 ? COLORS.nodeCore :
           node.degree === 1 ? COLORS.nodePrimary : COLORS.nodeSecondary;
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

    // 1. Outer Glow Effect
    if ((node.degree === 0 || isHighlighted || isHovered || isFocused || isConnected) && !isDimmed) {
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
      } else if (node.degree === 1) {
        gradient.addColorStop(0, 'rgba(74, 144, 226, 0.4)');
      } else {
        gradient.addColorStop(0, 'rgba(123, 104, 238, 0.3)');
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

    // 3. Border
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
    } else if (node.degree === 1) {
      ctx.strokeStyle = COLORS.nodePrimary;
    } else {
      ctx.strokeStyle = COLORS.nodeSecondary;
    }
    ctx.stroke();

    // 4. Name Label with background
    const fontSize = node.degree === 0 ? FONT_SIZES.core :
                     node.degree === 1 ? FONT_SIZES.primary :
                     FONT_SIZES.secondary;

    ctx.font = `${isFocused || node.degree === 0 ? 'bold' : '500'} ${fontSize}px -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const name = node.name.length > 6 ? node.name.slice(0, 6) + '...' : node.name;
    const labelY = y + radius + 18;

    // Label background
    if (!isDimmed) {
      const textWidth = ctx.measureText(name).width;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.roundRect(x - textWidth / 2 - 6, labelY - 8, textWidth + 12, 16, 4);
      ctx.fill();
    }

    // Label text
    ctx.fillStyle = isDimmed ? COLORS.textDimmed : COLORS.textPrimary;
    ctx.fillText(name, x, labelY);
  }, [getNodeSize]);

  // Render
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const nodes = nodesRef.current;
    const edges = edgesRef.current;

    const connectedNodeIds = getConnectedNodeIds(focusedNodeId);
    const hasFocusedNode = focusedNodeId !== null;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);

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
          ? 'rgba(74, 144, 226, 0.1)'
          : isHighlighted ? COLORS.edgePrimary : 'rgba(74, 144, 226, 0.5)';
        ctx.lineWidth = isHighlighted ? 2.5 : 1.5;
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = dimmedByFocus
          ? 'rgba(123, 104, 238, 0.08)'
          : isHighlighted ? COLORS.edgeSecondary : 'rgba(123, 104, 238, 0.35)';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 6]);
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

    ctx.restore();
  }, [transform, highlightedKeyword, hoveredNode, focusedNodeId, getConnectedNodeIds, drawNode]);

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

    for (const node of nodesRef.current) {
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
        canvasRef.current.style.cursor = node ? 'pointer' : 'grab';
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

  const handleClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const node = getNodeAtPosition(x, y);

    if (node) {
      focusOnNode(node);
      if (node.degree !== 0) {
        setSelectedNode(node);
      }
    } else {
      setFocusedNodeId(null);
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
      <div className="absolute bottom-6 left-6 text-xs text-[#4A5E7A] bg-[#162A4A]/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-[#1E3A5F]">
        {Math.round(transform.scale * 100)}%
      </div>
    </div>
  );
}
