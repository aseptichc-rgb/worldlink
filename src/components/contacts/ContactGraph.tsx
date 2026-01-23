'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Contact, ContactCategory, CATEGORY_INFO } from '@/types/contacts';
import { Plus, Minus, RotateCcw, Link2, Building2, Star } from 'lucide-react';

interface GraphNode {
  id: string;
  name: string;
  company: string;
  position: string;
  category: ContactCategory;
  x: number;
  y: number;
  radius: number;
  contact: Contact;
  companyId: string; // For grouping same company
  isHub: boolean; // Has connections to multiple categories
  hubScore: number;
}

interface CompanyConnection {
  from: GraphNode;
  to: GraphNode;
  company: string;
}

interface CategoryCluster {
  category: ContactCategory;
  centerX: number;
  centerY: number;
  radius: number;
  nodes: GraphNode[];
}

interface ContactGraphProps {
  contacts: Contact[];
  onSelectContact: (contact: Contact) => void;
}

// Normalize company name for matching
function normalizeCompany(company: string): string {
  if (!company) return '';
  return company
    .toLowerCase()
    .replace(/\(주\)|\(유\)|주식회사|㈜/g, '')
    .replace(/\s+/g, '')
    .replace(/inc\.|corp\.|co\.,?ltd\.?|llc/gi, '')
    .trim();
}

// Force-directed layout simulation
function simulateForces(nodes: GraphNode[], iterations: number = 50) {
  const repulsionForce = 600;
  const damping = 0.85;

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < nodes.length; i++) {
      let fx = 0, fy = 0;

      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;

        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const minDist = nodes[i].radius + nodes[j].radius + 6;

        if (dist < minDist * 4) {
          const force = repulsionForce / (dist * dist);
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        }
      }

      nodes[i].x += fx * damping * (1 - iter / iterations);
      nodes[i].y += fy * damping * (1 - iter / iterations);
    }
  }

  return nodes;
}

export default function ContactGraph({ contacts, onSelectContact }: ContactGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const nodesRef = useRef<GraphNode[]>([]);
  const clustersRef = useRef<CategoryCluster[]>([]);
  const companyConnectionsRef = useRef<CompanyConnection[]>([]);
  const edgeAnimationRef = useRef<number>(0);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.7 });
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: GraphNode } | null>(null);
  const [showCompanyLinks, setShowCompanyLinks] = useState(true);
  const [showHubs, setShowHubs] = useState(true);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Edge animation
  useEffect(() => {
    const animate = () => {
      edgeAnimationRef.current = (edgeAnimationRef.current + 0.3) % 20;
      requestAnimationFrame(animate);
    };
    const id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, []);

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

  // Create clusters, nodes, and connections
  useEffect(() => {
    if (contacts.length === 0 || dimensions.width === 0) return;

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    // Group contacts by category
    const categoryGroups = new Map<ContactCategory, Contact[]>();
    for (const contact of contacts) {
      const list = categoryGroups.get(contact.category) || [];
      list.push(contact);
      categoryGroups.set(contact.category, list);
    }

    // Find people in same companies (cross-category connections)
    const companyMap = new Map<string, Contact[]>();
    for (const contact of contacts) {
      const normalizedCompany = normalizeCompany(contact.company);
      if (normalizedCompany && normalizedCompany.length > 2) {
        const list = companyMap.get(normalizedCompany) || [];
        list.push(contact);
        companyMap.set(normalizedCompany, list);
      }
    }

    // Calculate hub scores (people connected to multiple categories through same company)
    const hubScores = new Map<string, { score: number; categories: Set<ContactCategory> }>();
    for (const [company, people] of companyMap.entries()) {
      if (people.length >= 2) {
        const categories = new Set(people.map(p => p.category));
        for (const person of people) {
          const existing = hubScores.get(person.id) || { score: 0, categories: new Set() };
          existing.score += people.length - 1;
          categories.forEach(c => existing.categories.add(c));
          hubScores.set(person.id, existing);
        }
      }
    }

    // Get active categories sorted by size
    const categories = Array.from(categoryGroups.entries())
      .filter(([_, list]) => list.length > 0)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([cat]) => cat);

    const clusters: CategoryCluster[] = [];
    const allNodes: GraphNode[] = [];
    const nodeMap = new Map<string, GraphNode>();

    const baseClusterRadius = Math.min(dimensions.width, dimensions.height) * 0.35;

    categories.forEach((category, index) => {
      const categoryContacts = categoryGroups.get(category) || [];
      const count = categoryContacts.length;

      const angle = (index / categories.length) * Math.PI * 2 - Math.PI / 2;
      const clusterDistance = baseClusterRadius + Math.sqrt(count) * 12;
      const clusterCenterX = centerX + Math.cos(angle) * clusterDistance;
      const clusterCenterY = centerY + Math.sin(angle) * clusterDistance;

      const nodesPerRing = 10;
      const ringCount = Math.ceil(count / nodesPerRing);
      const clusterRadius = Math.max(70, ringCount * 22 + 50);

      const nodes: GraphNode[] = categoryContacts.map((contact, i) => {
        const ring = Math.floor(i / nodesPerRing);
        const indexInRing = i % nodesPerRing;
        const nodesInThisRing = Math.min(nodesPerRing, count - ring * nodesPerRing);

        const ringRadius = 25 + ring * 20;
        const nodeAngle = (indexInRing / nodesInThisRing) * Math.PI * 2 + ring * 0.3;

        const x = clusterCenterX + Math.cos(nodeAngle) * ringRadius;
        const y = clusterCenterY + Math.sin(nodeAngle) * ringRadius;

        const hubData = hubScores.get(contact.id);
        const isHub = (hubData?.categories.size || 0) >= 2;
        const hubScore = hubData?.score || 0;

        const node: GraphNode = {
          id: contact.id,
          name: contact.name,
          company: contact.company,
          position: contact.position,
          category: contact.category,
          x,
          y,
          radius: isHub ? 8 + Math.min(hubScore, 4) : 5,
          contact,
          companyId: normalizeCompany(contact.company),
          isHub,
          hubScore,
        };

        nodeMap.set(contact.id, node);
        return node;
      });

      simulateForces(nodes, 25);

      clusters.push({
        category,
        centerX: clusterCenterX,
        centerY: clusterCenterY,
        radius: clusterRadius,
        nodes,
      });

      allNodes.push(...nodes);
    });

    // Create company connections (only cross-category)
    const connections: CompanyConnection[] = [];
    for (const [company, people] of companyMap.entries()) {
      if (people.length >= 2) {
        const categories = new Set(people.map(p => p.category));
        // Only show connections if they span multiple categories
        if (categories.size >= 2) {
          for (let i = 0; i < people.length; i++) {
            for (let j = i + 1; j < people.length; j++) {
              const from = nodeMap.get(people[i].id);
              const to = nodeMap.get(people[j].id);
              if (from && to && from.category !== to.category) {
                connections.push({ from, to, company: people[i].company });
              }
            }
          }
        }
      }
    }

    clustersRef.current = clusters;
    nodesRef.current = allNodes;
    companyConnectionsRef.current = connections;

    setTransform({ x: 0, y: 0, scale: 0.65 });
  }, [contacts, dimensions]);

  // Render
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2 + transform.x, canvas.height / 2 + transform.y);
    ctx.scale(transform.scale, transform.scale);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    // Draw cluster backgrounds
    for (const cluster of clustersRef.current) {
      const info = CATEGORY_INFO[cluster.category];

      const gradient = ctx.createRadialGradient(
        cluster.centerX, cluster.centerY, 0,
        cluster.centerX, cluster.centerY, cluster.radius * 1.3
      );
      gradient.addColorStop(0, info.bgColor);
      gradient.addColorStop(0.6, info.bgColor.replace('0.15', '0.05'));
      gradient.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(cluster.centerX, cluster.centerY, cluster.radius * 1.3, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Dashed border
      ctx.beginPath();
      ctx.arc(cluster.centerX, cluster.centerY, cluster.radius, 0, Math.PI * 2);
      ctx.strokeStyle = info.borderColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, Pretendard, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const labelText = `${info.icon} ${info.name}`;
      const labelWidth = ctx.measureText(labelText).width + 16;
      const labelY = cluster.centerY - cluster.radius - 16;

      ctx.fillStyle = 'rgba(13, 17, 23, 0.9)';
      ctx.beginPath();
      ctx.roundRect(cluster.centerX - labelWidth / 2, labelY - 10, labelWidth, 20, 10);
      ctx.fill();
      ctx.strokeStyle = info.borderColor;
      ctx.stroke();

      ctx.fillStyle = info.color;
      ctx.fillText(labelText, cluster.centerX, labelY);

      // Count
      ctx.font = '10px -apple-system, BlinkMacSystemFont, Pretendard, sans-serif';
      const countText = `${cluster.nodes.length}명`;
      const countWidth = ctx.measureText(countText).width + 14;
      const countY = cluster.centerY + cluster.radius + 14;

      ctx.fillStyle = info.bgColor;
      ctx.beginPath();
      ctx.roundRect(cluster.centerX - countWidth / 2, countY - 9, countWidth, 18, 9);
      ctx.fill();
      ctx.fillStyle = info.color;
      ctx.fillText(countText, cluster.centerX, countY);
    }

    // Draw company connections (cross-category links)
    if (showCompanyLinks) {
      for (const conn of companyConnectionsRef.current) {
        const isHighlighted = hoveredNode &&
          (hoveredNode.id === conn.from.id || hoveredNode.id === conn.to.id);

        if (isHighlighted || !hoveredNode) {
          // Curved line
          const midX = (conn.from.x + conn.to.x) / 2;
          const midY = (conn.from.y + conn.to.y) / 2;
          const dx = conn.to.x - conn.from.x;
          const dy = conn.to.y - conn.from.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const curveOffset = dist * 0.15;
          const perpX = -dy / dist * curveOffset;
          const perpY = dx / dist * curveOffset;
          const ctrlX = midX + perpX;
          const ctrlY = midY + perpY;

          ctx.beginPath();
          ctx.moveTo(conn.from.x, conn.from.y);
          ctx.quadraticCurveTo(ctrlX, ctrlY, conn.to.x, conn.to.y);

          if (isHighlighted) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([]);
          } else {
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.25)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 6]);
          }
          ctx.stroke();
          ctx.setLineDash([]);

          // Animated flow for highlighted
          if (isHighlighted) {
            ctx.beginPath();
            ctx.moveTo(conn.from.x, conn.from.y);
            ctx.quadraticCurveTo(ctrlX, ctrlY, conn.to.x, conn.to.y);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 12]);
            ctx.lineDashOffset = -edgeAnimationRef.current;
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.lineDashOffset = 0;
          }
        }
      }
    }

    // Draw nodes
    for (const node of nodesRef.current) {
      const info = CATEGORY_INFO[node.category];
      const isHovered = hoveredNode?.id === node.id;
      const isConnectedToHovered = hoveredNode && companyConnectionsRef.current.some(
        c => (c.from.id === hoveredNode.id && c.to.id === node.id) ||
             (c.to.id === hoveredNode.id && c.from.id === node.id)
      );
      const isDimmed = hoveredNode && !isHovered && !isConnectedToHovered;

      let radius = node.radius;
      if (isHovered) radius *= 2;
      else if (isConnectedToHovered) radius *= 1.5;

      // Hub indicator (star glow)
      if (showHubs && node.isHub && !isDimmed) {
        const hubGlow = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, radius * 4
        );
        hubGlow.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
        hubGlow.addColorStop(0.5, 'rgba(255, 215, 0, 0.1)');
        hubGlow.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 4, 0, Math.PI * 2);
        ctx.fillStyle = hubGlow;
        ctx.fill();
      }

      // Hover glow
      if (isHovered) {
        const glow = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, radius * 3
        );
        glow.addColorStop(0, info.color + '80');
        glow.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      // Node
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);

      const nodeGradient = ctx.createRadialGradient(
        node.x - radius * 0.3, node.y - radius * 0.3, 0,
        node.x, node.y, radius
      );

      if (isDimmed) {
        nodeGradient.addColorStop(0, info.color + '40');
        nodeGradient.addColorStop(1, info.color + '20');
      } else if (isConnectedToHovered) {
        nodeGradient.addColorStop(0, '#FFD700');
        nodeGradient.addColorStop(1, info.color);
      } else {
        nodeGradient.addColorStop(0, isHovered ? '#FFFFFF' : info.color);
        nodeGradient.addColorStop(1, info.color + 'CC');
      }
      ctx.fillStyle = nodeGradient;
      ctx.fill();

      // Border
      if (node.isHub && showHubs && !isDimmed) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = isDimmed ? info.color + '30' : (isHovered ? '#FFFFFF' : info.color + '80');
        ctx.lineWidth = isHovered ? 2 : 1;
      }
      ctx.stroke();

      // Name label
      if (isHovered || isConnectedToHovered) {
        ctx.font = `bold ${isHovered ? 12 : 10}px -apple-system, BlinkMacSystemFont, Pretendard, sans-serif`;
        ctx.textAlign = 'center';
        const labelY = node.y + radius + 14;

        const displayName = node.name;
        const textWidth = ctx.measureText(displayName).width;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.beginPath();
        ctx.roundRect(node.x - textWidth / 2 - 6, labelY - 9, textWidth + 12, 18, 5);
        ctx.fill();

        ctx.fillStyle = isConnectedToHovered && !isHovered ? '#FFD700' : '#FFFFFF';
        ctx.fillText(displayName, node.x, labelY);
      }
    }

    ctx.restore();
  }, [transform, hoveredNode, showCompanyLinks, showHubs]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      render();
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [render]);

  // Mouse interactions
  const getNodeAtPosition = (clientX: number, clientY: number): GraphNode | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const worldX = (x - canvas.width / 2 - transform.x) / transform.scale + canvas.width / 2;
    const worldY = (y - canvas.height / 2 - transform.y) / transform.scale + canvas.height / 2;

    for (let i = nodesRef.current.length - 1; i >= 0; i--) {
      const node = nodesRef.current[i];
      const dx = node.x - worldX;
      const dy = node.y - worldY;
      const hitRadius = (node.radius + 6);

      if (dx * dx + dy * dy < hitRadius * hitRadius) {
        return node;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const node = getNodeAtPosition(e.clientX, e.clientY);
    if (!node) setIsDragging(true);
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    setTooltip(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;
      setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastPosRef.current = { x: e.clientX, y: e.clientY };
      setTooltip(null);
    } else {
      const node = getNodeAtPosition(e.clientX, e.clientY);
      setHoveredNode(node);
      if (canvasRef.current) {
        canvasRef.current.style.cursor = node ? 'pointer' : 'grab';
      }

      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

      if (node) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          hoverTimeoutRef.current = setTimeout(() => {
            setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top - 100, node });
          }, 300);
        }
      } else {
        setTooltip(null);
      }
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleMouseLeave = () => {
    handleMouseUp();
    setHoveredNode(null);
    setTooltip(null);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  };

  const handleClick = (e: React.MouseEvent) => {
    const node = getNodeAtPosition(e.clientX, e.clientY);
    if (node) onSelectContact(node.contact);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => ({ ...prev, scale: Math.max(0.2, Math.min(2.5, prev.scale * delta)) }));
  };

  // Count stats
  const hubCount = nodesRef.current.filter(n => n.isHub).length;
  const connectionCount = companyConnectionsRef.current.length;

  return (
    <div ref={containerRef} className="w-full h-full relative bg-[#0D1117]">
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
            <div className="bg-[#151922]/95 backdrop-blur-xl border border-[#21262D] rounded-xl px-4 py-3 shadow-2xl min-w-[220px]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-white">{tooltip.node.name}</span>
                {tooltip.node.isHub && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FFD700]/20 text-[#FFD700] flex items-center gap-1">
                    <Star size={10} fill="currentColor" /> 허브
                  </span>
                )}
              </div>
              {tooltip.node.company && (
                <div className="text-xs text-[#8B949E] mb-0.5 flex items-center gap-1">
                  <Building2 size={12} />
                  {tooltip.node.company}
                </div>
              )}
              {tooltip.node.position && (
                <div className="text-xs text-[#6E7681] line-clamp-2">{tooltip.node.position}</div>
              )}

              {/* Connected people from same company */}
              {(() => {
                const sameCompanyConnections = companyConnectionsRef.current.filter(
                  c => c.from.id === tooltip.node.id || c.to.id === tooltip.node.id
                );
                if (sameCompanyConnections.length > 0) {
                  return (
                    <div className="mt-2 pt-2 border-t border-[#21262D]">
                      <div className="text-[10px] text-[#FFD700] mb-1 flex items-center gap-1">
                        <Link2 size={10} />
                        다른 분야 동료
                      </div>
                      <div className="space-y-0.5">
                        {sameCompanyConnections.slice(0, 3).map((conn, i) => {
                          const other = conn.from.id === tooltip.node.id ? conn.to : conn.from;
                          return (
                            <div key={i} className="text-xs text-[#8B949E] flex items-center gap-1">
                              <span style={{ color: CATEGORY_INFO[other.category].color }}>●</span>
                              {other.name}
                              <span className="text-[10px] text-[#484F58]">
                                ({CATEGORY_INFO[other.category].name})
                              </span>
                            </div>
                          );
                        })}
                        {sameCompanyConnections.length > 3 && (
                          <div className="text-[10px] text-[#484F58]">
                            +{sameCompanyConnections.length - 3}명 더
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="mt-2 pt-2 border-t border-[#21262D]">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: CATEGORY_INFO[tooltip.node.category].bgColor,
                    color: CATEGORY_INFO[tooltip.node.category].color,
                  }}
                >
                  {CATEGORY_INFO[tooltip.node.category].icon} {CATEGORY_INFO[tooltip.node.category].name}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
        <button
          onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(2.5, prev.scale * 1.3) }))}
          className="w-10 h-10 rounded-xl bg-[#161B22]/90 backdrop-blur-sm border border-[#21262D] flex items-center justify-center text-[#8B949E] hover:text-[#00D9FF] hover:border-[#00D9FF]/50 transition-all"
        >
          <Plus size={20} />
        </button>
        <button
          onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(0.2, prev.scale * 0.7) }))}
          className="w-10 h-10 rounded-xl bg-[#161B22]/90 backdrop-blur-sm border border-[#21262D] flex items-center justify-center text-[#8B949E] hover:text-[#00D9FF] hover:border-[#00D9FF]/50 transition-all"
        >
          <Minus size={20} />
        </button>
        <button
          onClick={() => setTransform({ x: 0, y: 0, scale: 0.65 })}
          className="w-10 h-10 rounded-xl bg-[#161B22]/90 backdrop-blur-sm border border-[#21262D] flex items-center justify-center text-[#8B949E] hover:text-[#00D9FF] hover:border-[#00D9FF]/50 transition-all"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Toggle buttons */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button
          onClick={() => setShowCompanyLinks(!showCompanyLinks)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
            showCompanyLinks
              ? 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/40'
              : 'bg-[#161B22]/90 text-[#8B949E] border border-[#21262D]'
          }`}
        >
          <Link2 size={14} />
          <span>회사 연결 ({connectionCount})</span>
        </button>
        <button
          onClick={() => setShowHubs(!showHubs)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
            showHubs
              ? 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/40'
              : 'bg-[#161B22]/90 text-[#8B949E] border border-[#21262D]'
          }`}
        >
          <Star size={14} />
          <span>허브 인맥 ({hubCount})</span>
        </button>
      </div>

      {/* Instructions */}
      <div className="absolute top-4 left-4 text-xs text-[#484F58] bg-[#161B22]/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-[#21262D]">
        <div className="text-[#8B949E] font-medium mb-1">인사이트</div>
        <div>• 금색 테두리 = 여러 분야 연결 허브</div>
        <div>• 금색 선 = 같은 회사, 다른 분야</div>
        <div className="mt-1 pt-1 border-t border-[#21262D] text-[#484F58]">
          드래그: 이동 | 스크롤: 확대/축소
        </div>
      </div>

      {/* Zoom Level */}
      <div className="absolute bottom-6 left-6 text-xs text-[#484F58] bg-[#161B22]/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-[#21262D]">
        {Math.round(transform.scale * 100)}%
      </div>
    </div>
  );
}
