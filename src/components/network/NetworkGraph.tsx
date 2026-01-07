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
  } = useNetworkStore();

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
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

  // Initialize nodes with physics
  useEffect(() => {
    if (nodes.length === 0) return;

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    nodesRef.current = nodes.map((node, i) => {
      // Position based on degree
      let angle = (i / nodes.filter(n => n.degree === node.degree).length) * Math.PI * 2;
      let radius = node.degree === 0 ? 0 : node.degree === 1 ? 150 : 300;

      return {
        ...node,
        x: centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 50,
        y: centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 50,
        vx: 0,
        vy: 0,
        fx: node.degree === 0 ? centerX : null,
        fy: node.degree === 0 ? centerY : null,
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

  // Render
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const nodes = nodesRef.current;
    const edges = edgesRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);

    // Draw edges
    for (const edge of edges) {
      const source = nodes.find(n => n.id === (typeof edge.source === 'string' ? edge.source : edge.source.id));
      const target = nodes.find(n => n.id === (typeof edge.target === 'string' ? edge.target : edge.target.id));

      if (!source || !target) continue;

      const isHighlighted = highlightedKeyword &&
        (source.keywords.includes(highlightedKeyword) || target.keywords.includes(highlightedKeyword));

      ctx.beginPath();
      ctx.moveTo(source.x || 0, source.y || 0);
      ctx.lineTo(target.x || 0, target.y || 0);

      if (edge.degree === 1) {
        ctx.strokeStyle = isHighlighted ? '#00E5FF' : 'rgba(0, 229, 255, 0.4)';
        ctx.lineWidth = isHighlighted ? 2 : 1;
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = isHighlighted ? '#7C4DFF' : 'rgba(124, 77, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
      }

      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw nodes
    for (const node of nodes) {
      const isHighlighted = highlightedKeyword && node.keywords.includes(highlightedKeyword);
      const isHovered = hoveredNode?.id === node.id;
      const isDimmed = highlightedKeyword && !isHighlighted;

      // Node size based on degree
      let radius = node.degree === 0 ? 30 : node.degree === 1 ? 20 : 15;
      if (isHovered) radius += 5;

      // Glow effect
      if (node.degree === 0 || isHighlighted || isHovered) {
        const gradient = ctx.createRadialGradient(
          node.x || 0, node.y || 0, radius,
          node.x || 0, node.y || 0, radius * 2
        );
        gradient.addColorStop(0, node.degree === 0 ? 'rgba(0, 229, 255, 0.4)' : 'rgba(124, 77, 255, 0.4)');
        gradient.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(node.x || 0, node.y || 0, radius * 2, 0, Math.PI * 2);
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
        gradient.addColorStop(0, '#00E5FF');
        gradient.addColorStop(1, '#7C4DFF');
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = isDimmed ? 'rgba(22, 27, 34, 0.5)' : '#161B22';
      }
      ctx.fill();

      // Border
      ctx.strokeStyle = isDimmed
        ? 'rgba(33, 38, 45, 0.5)'
        : isHighlighted
          ? '#00E5FF'
          : node.degree === 1
            ? '#00E5FF'
            : '#7C4DFF';
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.stroke();

      // Name label
      ctx.fillStyle = isDimmed ? 'rgba(139, 148, 158, 0.5)' : '#FFFFFF';
      ctx.font = `${node.degree === 0 ? 14 : 12}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const name = node.name.length > 8 ? node.name.slice(0, 8) + '...' : node.name;
      ctx.fillText(name, node.x || 0, (node.y || 0) + radius + 16);
    }

    ctx.restore();
  }, [transform, highlightedKeyword, hoveredNode]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      simulate();
      render();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [simulate, render]);

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
      draggedNode.fx = null;
      draggedNode.fy = null;
      setDraggedNode(null);
    }
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const node = getNodeAtPosition(x, y);

    if (node && node.degree !== 0) {
      setSelectedNode(node);
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
