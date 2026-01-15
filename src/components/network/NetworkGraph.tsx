'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNetworkStore } from '@/store/networkStore';
import { NetworkNode } from '@/types';

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

export default function NetworkGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);

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
  const lastPosRef = useRef({ x: 0, y: 0 });

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

  // Initialize nodes with fixed positions (no physics)
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
        // Center node
        x = centerX;
        y = centerY;
      } else if (node.degree === 1) {
        // 1st degree - arrange in circle around center
        const index = degree1Nodes.findIndex(n => n.id === node.id);
        const angle = (index / degree1Nodes.length) * Math.PI * 2 - Math.PI / 2;
        const radius = 160;
        x = centerX + Math.cos(angle) * radius;
        y = centerY + Math.sin(angle) * radius;
      } else if (node.degree === 2) {
        // 2nd degree - arrange in outer circle
        const index = degree2Nodes.findIndex(n => n.id === node.id);
        const angle = (index / degree2Nodes.length) * Math.PI * 2 - Math.PI / 2;
        const radius = 320;
        x = centerX + Math.cos(angle) * radius;
        y = centerY + Math.sin(angle) * radius;
      }

      return {
        ...node,
        x,
        y,
        vx: 0,
        vy: 0,
        fx: x, // Fixed position
        fy: y, // Fixed position
      };
    });

    edgesRef.current = edges.map(edge => ({
      ...edge,
      source: edge.source,
      target: edge.target,
    }));
  }, [nodes, edges, dimensions]);

  // Physics simulation
  const simulate = useCallback(() => {
    const nodes = nodesRef.current;
    const edges = edgesRef.current;

    if (nodes.length === 0) return;

    // Apply forces
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.fx !== null && node.fx !== undefined) {
        node.x = node.fx;
        node.vx = 0;
      }
      if (node.fy !== null && node.fy !== undefined) {
        node.y = node.fy;
        node.vy = 0;
      }

      // Repulsion between nodes
      for (let j = i + 1; j < nodes.length; j++) {
        const other = nodes[j];
        const dx = (other.x || 0) - (node.x || 0);
        const dy = (other.y || 0) - (node.y || 0);
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = 2000 / (dist * dist);

        if (node.fx === null || node.fx === undefined) {
          node.vx = (node.vx || 0) - (dx / dist) * force * 0.1;
          node.vy = (node.vy || 0) - (dy / dist) * force * 0.1;
        }
        if (other.fx === null || other.fx === undefined) {
          other.vx = (other.vx || 0) + (dx / dist) * force * 0.1;
          other.vy = (other.vy || 0) + (dy / dist) * force * 0.1;
        }
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const source = nodes.find(n => n.id === (typeof edge.source === 'string' ? edge.source : edge.source.id));
      const target = nodes.find(n => n.id === (typeof edge.target === 'string' ? edge.target : edge.target.id));

      if (!source || !target) continue;

      const dx = (target.x || 0) - (source.x || 0);
      const dy = (target.y || 0) - (source.y || 0);
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const targetDist = edge.degree === 1 ? 150 : 200;
      const force = (dist - targetDist) * 0.02;

      if (source.fx === null || source.fx === undefined) {
        source.vx = (source.vx || 0) + (dx / dist) * force;
        source.vy = (source.vy || 0) + (dy / dist) * force;
      }
      if (target.fx === null || target.fx === undefined) {
        target.vx = (target.vx || 0) - (dx / dist) * force;
        target.vy = (target.vy || 0) - (dy / dist) * force;
      }
    }

    // Update positions with damping
    for (const node of nodes) {
      if (node.fx !== null && node.fx !== undefined) continue;

      node.vx = (node.vx || 0) * 0.9;
      node.vy = (node.vy || 0) * 0.9;
      node.x = (node.x || 0) + (node.vx || 0);
      node.y = (node.y || 0) + (node.vy || 0);

      // Boundary constraints
      const padding = 50;
      if (node.x !== undefined) {
        node.x = Math.max(padding, Math.min(dimensions.width - padding, node.x));
      }
      if (node.y !== undefined) {
        node.y = Math.max(padding, Math.min(dimensions.height - padding, node.y));
      }
    }
  }, [dimensions]);

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

  // Render
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const nodes = nodesRef.current;
    const edges = edgesRef.current;

    // 포커스된 노드와 연결된 노드들 계산
    const connectedNodeIds = getConnectedNodeIds(focusedNodeId);
    const hasFocusedNode = focusedNodeId !== null;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);

    // Draw edges (연결되지 않은 것들 먼저 - 뒤에 그려짐)
    for (const edge of edges) {
      const source = nodes.find(n => n.id === (typeof edge.source === 'string' ? edge.source : edge.source.id));
      const target = nodes.find(n => n.id === (typeof edge.target === 'string' ? edge.target : edge.target.id));

      if (!source || !target) continue;

      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;

      // 포커스된 노드와 연결된 엣지인지 확인
      const isConnectedToFocused = hasFocusedNode &&
        (sourceId === focusedNodeId || targetId === focusedNodeId);

      const isHighlighted = highlightedKeyword &&
        (source.keywords.includes(highlightedKeyword) || target.keywords.includes(highlightedKeyword));

      // 연결된 엣지는 나중에 그림 (앞에 보이도록)
      if (isConnectedToFocused) continue;

      ctx.beginPath();
      ctx.moveTo(source.x || 0, source.y || 0);
      ctx.lineTo(target.x || 0, target.y || 0);

      // 포커스된 노드가 있을 때, 연결되지 않은 엣지는 흐리게
      const dimmedByFocus = hasFocusedNode && !isConnectedToFocused;

      if (edge.degree === 1) {
        ctx.strokeStyle = dimmedByFocus
          ? 'rgba(0, 229, 255, 0.1)'
          : isHighlighted ? '#00E5FF' : 'rgba(0, 229, 255, 0.4)';
        ctx.lineWidth = isHighlighted ? 2 : 1;
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = dimmedByFocus
          ? 'rgba(124, 77, 255, 0.08)'
          : isHighlighted ? '#7C4DFF' : 'rgba(124, 77, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
      }

      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw connected edges (포커스된 노드와 연결된 엣지들 - 앞에 그려짐)
    for (const edge of edges) {
      const source = nodes.find(n => n.id === (typeof edge.source === 'string' ? edge.source : edge.source.id));
      const target = nodes.find(n => n.id === (typeof edge.target === 'string' ? edge.target : edge.target.id));

      if (!source || !target) continue;

      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;

      const isConnectedToFocused = hasFocusedNode &&
        (sourceId === focusedNodeId || targetId === focusedNodeId);

      if (!isConnectedToFocused) continue;

      ctx.beginPath();
      ctx.moveTo(source.x || 0, source.y || 0);
      ctx.lineTo(target.x || 0, target.y || 0);

      // 연결된 엣지는 밝은 주황색/노란색으로 강조
      ctx.strokeStyle = '#FFB800';
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.stroke();
    }

    // Draw nodes (연결되지 않은 것들 먼저)
    for (const node of nodes) {
      const isConnectedToFocused = connectedNodeIds.has(node.id);

      // 연결된 노드는 나중에 그림
      if (hasFocusedNode && isConnectedToFocused) continue;

      const isHighlighted = highlightedKeyword && node.keywords.includes(highlightedKeyword);
      const isHovered = hoveredNode?.id === node.id;
      const isDimmed = (highlightedKeyword && !isHighlighted) || (hasFocusedNode && !isConnectedToFocused);

      // Node size based on degree
      let radius = node.degree === 0 ? 30 : node.degree === 1 ? 20 : 15;
      if (isHovered) radius += 5;

      // Glow effect
      if ((node.degree === 0 || isHighlighted || isHovered) && !isDimmed) {
        const gradient = ctx.createRadialGradient(
          node.x || 0, node.y || 0, radius,
          node.x || 0, node.y || 0, radius * 2.5
        );
        gradient.addColorStop(0, node.degree === 0 ? 'rgba(0, 229, 255, 0.4)' : 'rgba(124, 77, 255, 0.4)');
        gradient.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(node.x || 0, node.y || 0, radius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x || 0, node.y || 0, radius, 0, Math.PI * 2);

      if (node.degree === 0) {
        const gradient = ctx.createLinearGradient(
          (node.x || 0) - radius, (node.y || 0) - radius,
          (node.x || 0) + radius, (node.y || 0) + radius
        );
        gradient.addColorStop(0, isDimmed ? 'rgba(0, 229, 255, 0.3)' : '#00E5FF');
        gradient.addColorStop(1, isDimmed ? 'rgba(124, 77, 255, 0.3)' : '#7C4DFF');
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = isDimmed ? 'rgba(22, 27, 34, 0.3)' : '#161B22';
      }
      ctx.fill();

      // Border
      ctx.strokeStyle = isDimmed
        ? 'rgba(33, 38, 45, 0.3)'
        : isHighlighted
          ? '#00E5FF'
          : node.degree === 1
            ? '#00E5FF'
            : '#7C4DFF';
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.stroke();

      // Name label
      ctx.fillStyle = isDimmed ? 'rgba(139, 148, 158, 0.3)' : '#FFFFFF';
      ctx.font = `${node.degree === 0 ? 14 : 12}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const name = node.name.length > 8 ? node.name.slice(0, 8) + '...' : node.name;
      ctx.fillText(name, node.x || 0, (node.y || 0) + radius + 16);
    }

    // Draw connected nodes (포커스된 노드와 연결된 노드들 - 앞에 그려짐)
    if (hasFocusedNode) {
      for (const node of nodes) {
        const isConnectedToFocused = connectedNodeIds.has(node.id);
        if (!isConnectedToFocused) continue;

        const isFocused = focusedNodeId === node.id;
        const isHovered = hoveredNode?.id === node.id;

        // Node size based on degree
        let radius = node.degree === 0 ? 30 : node.degree === 1 ? 20 : 15;
        if (isHovered || isFocused) radius += 5;

        // Glow effect for connected/focused nodes
        const gradient = ctx.createRadialGradient(
          node.x || 0, node.y || 0, radius,
          node.x || 0, node.y || 0, radius * 2.5
        );
        if (isFocused && node.degree !== 0) {
          gradient.addColorStop(0, 'rgba(255, 184, 0, 0.7)');
        } else if (node.degree === 0) {
          gradient.addColorStop(0, 'rgba(0, 229, 255, 0.5)');
        } else {
          gradient.addColorStop(0, 'rgba(255, 184, 0, 0.4)');
        }
        gradient.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(node.x || 0, node.y || 0, radius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x || 0, node.y || 0, radius, 0, Math.PI * 2);

        if (node.degree === 0) {
          const grad = ctx.createLinearGradient(
            (node.x || 0) - radius, (node.y || 0) - radius,
            (node.x || 0) + radius, (node.y || 0) + radius
          );
          grad.addColorStop(0, '#00E5FF');
          grad.addColorStop(1, '#7C4DFF');
          ctx.fillStyle = grad;
        } else if (isFocused) {
          ctx.fillStyle = '#FFB800';
        } else {
          // 연결된 노드는 밝은 배경
          ctx.fillStyle = '#2D3748';
        }
        ctx.fill();

        // Border
        if (isFocused && node.degree !== 0) {
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 4;
        } else if (node.degree === 0) {
          ctx.strokeStyle = '#00E5FF';
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = '#FFB800';
          ctx.lineWidth = 3;
        }
        ctx.stroke();

        // Name label
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${node.degree === 0 || isFocused ? 14 : 13}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const name = node.name.length > 8 ? node.name.slice(0, 8) + '...' : node.name;
        ctx.fillText(name, node.x || 0, (node.y || 0) + radius + 16);
      }
    }

    ctx.restore();
  }, [transform, highlightedKeyword, hoveredNode, focusedNodeId, getConnectedNodeIds]);

  // Smooth animation to target transform
  useEffect(() => {
    if (!targetTransform) return;

    const animateToTarget = () => {
      setTransform(prev => {
        const dx = targetTransform.x - prev.x;
        const dy = targetTransform.y - prev.y;
        const ds = targetTransform.scale - prev.scale;

        // Easing factor (0.1 = smooth, 0.3 = faster)
        const ease = 0.12;

        const newX = prev.x + dx * ease;
        const newY = prev.y + dy * ease;
        const newScale = prev.scale + ds * ease;

        // Check if we're close enough to stop
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(ds) < 0.01) {
          setTargetTransform(null);
          return targetTransform;
        }

        return { x: newX, y: newY, scale: newScale };
      });
    };

    const intervalId = setInterval(animateToTarget, 16); // ~60fps
    return () => clearInterval(intervalId);
  }, [targetTransform]);

  // Animation loop (render only, no physics simulation)
  useEffect(() => {
    const animate = () => {
      // simulate(); // Disabled physics simulation for fixed positions
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
      const radius = node.degree === 0 ? 30 : node.degree === 1 ? 20 : 15;

      if (dx * dx + dy * dy < radius * radius) {
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
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (draggedNode) {
      draggedNode.fx = (x - transform.x) / transform.scale;
      draggedNode.fy = (y - transform.y) / transform.scale;
    } else if (isDragging) {
      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;
      setTransform(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));
      lastPosRef.current = { x: e.clientX, y: e.clientY };
    } else {
      const node = getNodeAtPosition(x, y);
      setHoveredNode(node);
      if (canvasRef.current) {
        canvasRef.current.style.cursor = node ? 'pointer' : 'grab';
      }
    }
  };

  const handleMouseUp = () => {
    if (draggedNode) {
      // Keep the node fixed at the new position after drag
      draggedNode.x = draggedNode.fx ?? draggedNode.x;
      draggedNode.y = draggedNode.fy ?? draggedNode.y;
      setDraggedNode(null);
    }
    setIsDragging(false);
  };

  // 특정 노드를 화면 중앙으로 부드럽게 이동
  const focusOnNode = (node: GraphNode) => {
    if (!node.x || !node.y) return;

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    // 노드를 화면 중앙에 위치시키기 위한 transform 계산
    const targetX = centerX - node.x * transform.scale;
    const targetY = centerY - node.y * transform.scale;

    setTargetTransform({
      x: targetX,
      y: targetY,
      scale: transform.scale,
    });

    // 포커스된 노드 설정
    setFocusedNodeId(node.id);
  };

  const handleClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const node = getNodeAtPosition(x, y);

    if (node) {
      // 노드 클릭 시 부드럽게 해당 노드로 이동
      focusOnNode(node);

      // degree가 0이 아닌 경우에만 프로필 시트 열기
      if (node.degree !== 0) {
        setSelectedNode(node);
      }
    } else {
      // 빈 공간 클릭 시 포커스 해제
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

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative"
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
        className="cursor-grab active:cursor-grabbing"
      />

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(3, prev.scale * 1.2) }))}
          className="w-10 h-10 rounded-full bg-[#161B22] border border-[#21262D] text-white hover:border-[#00E5FF] transition-colors flex items-center justify-center"
        >
          +
        </button>
        <button
          onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(0.3, prev.scale * 0.8) }))}
          className="w-10 h-10 rounded-full bg-[#161B22] border border-[#21262D] text-white hover:border-[#00E5FF] transition-colors flex items-center justify-center"
        >
          -
        </button>
        <button
          onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
          className="w-10 h-10 rounded-full bg-[#161B22] border border-[#21262D] text-[#8B949E] hover:border-[#00E5FF] hover:text-white transition-colors flex items-center justify-center text-xs"
        >
          1:1
        </button>
      </div>
    </div>
  );
}
