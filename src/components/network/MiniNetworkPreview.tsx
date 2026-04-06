'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { User } from '@/types';

interface MiniNetworkPreviewProps {
  centerName: string;
  centerImage?: string;
  connections: User[];
  myConnectionIds: Set<string>;
  onConnectionClick: (user: User) => void;
  onViewFullNetwork: () => void;
}

export default function MiniNetworkPreview({
  centerName,
  centerImage,
  connections,
  myConnectionIds,
  onConnectionClick,
  onViewFullNetwork,
}: MiniNetworkPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const [containerWidth, setContainerWidth] = useState(320);

  const MAX_DISPLAY = 12;
  const displayConnections = connections.slice(0, MAX_DISPLAY);
  const remainingCount = Math.max(0, connections.length - MAX_DISPLAY);
  const HEIGHT = 280;

  // Measure container width
  useEffect(() => {
    if (!containerRef.current) return;
    setContainerWidth(containerRef.current.clientWidth);
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Load profile images
  useEffect(() => {
    imagesRef.current.clear();
    setImagesLoaded(0);

    const load = (src: string, key: string) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imagesRef.current.set(key, img);
        setImagesLoaded((p) => p + 1);
      };
      img.onerror = () => setImagesLoaded((p) => p + 1);
      img.src = src;
    };

    if (centerImage) load(centerImage, 'center');
    displayConnections.forEach((c) => {
      if (c.profileImage) load(c.profileImage, c.id);
    });
  }, [centerImage, connections]);

  // Draw the mini graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = containerWidth;
    const h = HEIGHT;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = '#0D1117';
    ctx.fillRect(0, 0, w, h);

    // Subtle stars
    const seed = centerName.length * 7;
    for (let i = 0; i < 25; i++) {
      const sx = ((seed * (i + 1) * 13.37) % 1000) / 1000 * w;
      const sy = ((seed * (i + 1) * 7.91) % 1000) / 1000 * h;
      const sr = ((seed * (i + 1) * 3.14) % 100) / 100 * 1.2 + 0.3;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(139, 148, 158, ${0.15 + ((i * 17) % 20) / 100})`;
      ctx.fill();
    }

    const cx = w / 2;
    const cy = h / 2;
    const n = displayConnections.length;
    const graphRadius = Math.min(cx, cy) - 44;
    const centerR = 24;
    const nodeR = 17;

    // Draw edges with gradient
    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      const nx = cx + graphRadius * Math.cos(angle);
      const ny = cy + graphRadius * Math.sin(angle);
      const isMutual = myConnectionIds.has(displayConnections[i].id);

      const grad = ctx.createLinearGradient(cx, cy, nx, ny);
      grad.addColorStop(0, 'rgba(88, 166, 255, 0.35)');
      grad.addColorStop(1, isMutual ? 'rgba(255, 184, 0, 0.25)' : 'rgba(31, 111, 235, 0.15)');

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(nx, ny);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Helper: draw a node (circular avatar or initial)
    const drawNode = (
      x: number, y: number, r: number,
      imageKey: string, name: string,
      borderColor: string, glowColor?: string,
    ) => {
      // Glow ring
      if (glowColor) {
        ctx.save();
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(x, y, r + 2, 0, Math.PI * 2);
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      // Border
      ctx.beginPath();
      ctx.arc(x, y, r + 2, 0, Math.PI * 2);
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      const img = imagesRef.current.get(imageKey);
      if (img) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
        ctx.restore();
      } else {
        // Fallback: gradient circle + initial
        const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
        g.addColorStop(0, '#2a3a5c');
        g.addColorStop(1, '#1a2744');
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        ctx.fillStyle = '#c9d1d9';
        ctx.font = `bold ${Math.round(r * 0.85)}px -apple-system, "Noto Sans KR", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name?.charAt(0) || '?', x, y);
      }
    };

    // Draw connection nodes
    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      const nx = cx + graphRadius * Math.cos(angle);
      const ny = cy + graphRadius * Math.sin(angle);
      const conn = displayConnections[i];
      const isMutual = myConnectionIds.has(conn.id);

      drawNode(
        nx, ny, nodeR,
        conn.id, conn.name,
        isMutual ? '#FFB800' : '#30363D',
        isMutual ? 'rgba(255, 184, 0, 0.35)' : undefined,
      );

      // Name label
      ctx.fillStyle = isMutual ? '#FFB800' : '#8B949E';
      ctx.font = '10px -apple-system, "Noto Sans KR", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(conn.name?.slice(0, 3) || '?', nx, ny + nodeR + 14);
    }

    // Draw center node
    drawNode(cx, cy, centerR, 'center', centerName, '#58A6FF', 'rgba(88, 166, 255, 0.5)');

    // Remaining count
    if (remainingCount > 0) {
      ctx.fillStyle = '#484F58';
      ctx.font = '11px -apple-system, "Noto Sans KR", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`+${remainingCount}명 더`, cx, h - 10);
    }
  }, [containerWidth, displayConnections, myConnectionIds, centerName, imagesLoaded, remainingCount]);

  // Click handler – detect which node was clicked
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const w = containerWidth;
      const h = HEIGHT;
      const cx = w / 2;
      const cy = h / 2;
      const n = displayConnections.length;
      const graphRadius = Math.min(cx, cy) - 44;
      const nodeR = 17;

      // Check connection nodes
      for (let i = 0; i < n; i++) {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
        const nx = cx + graphRadius * Math.cos(angle);
        const ny = cy + graphRadius * Math.sin(angle);
        const dist = Math.sqrt((x - nx) ** 2 + (y - ny) ** 2);
        if (dist <= nodeR + 6) {
          onConnectionClick(displayConnections[i]);
          return;
        }
      }

      // Check center node
      const cd = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (cd <= 24 + 6) {
        onViewFullNetwork();
      }
    },
    [containerWidth, displayConnections, onConnectionClick, onViewFullNetwork],
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <canvas
        ref={canvasRef}
        className="w-full rounded-xl cursor-pointer"
        style={{ height: `${HEIGHT}px` }}
        onClick={handleClick}
      />
      <button
        onClick={onViewFullNetwork}
        className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-[#58A6FF]/10 border border-[#58A6FF]/30 text-[#58A6FF] text-xs font-medium hover:bg-[#58A6FF]/20 transition-colors"
      >
        전체 인맥 보기 →
      </button>
    </div>
  );
}
