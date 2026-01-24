'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Sparkles, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { getUserConnectionsWithDetails } from '@/lib/firebase-services';
import { Avatar } from '@/components/ui';

interface NetworkNode {
  id: string;
  user: User;
  x: number;
  y: number;
  radius: number;
  angle: number;
}

interface MyNetworkVisualizationProps {
  userId: string;
  userName: string;
  userImage?: string;
}

export default function MyNetworkVisualization({ userId, userName, userImage }: MyNetworkVisualizationProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const nodesRef = useRef<NetworkNode[]>([]);
  const pulseRef = useRef<number>(0);

  const [connections, setConnections] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);

  // 연결된 인맥 불러오기
  useEffect(() => {
    const loadConnections = async () => {
      setIsLoading(true);
      try {
        const connectedUsers = await getUserConnectionsWithDetails(userId);
        setConnections(connectedUsers);
      } catch (error) {
        console.error('Error loading connections:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConnections();
  }, [userId]);

  // 컨테이너 크기 설정
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

  // 노드 생성
  useEffect(() => {
    if (connections.length === 0 || dimensions.width === 0) {
      nodesRef.current = [];
      return;
    }

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const maxRadius = Math.min(dimensions.width, dimensions.height) * 0.35;

    const nodes: NetworkNode[] = connections.map((user, index) => {
      const angle = (index / connections.length) * Math.PI * 2 - Math.PI / 2;
      const radius = maxRadius * (0.6 + Math.random() * 0.4);

      return {
        id: user.id,
        user,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        radius: 20 + Math.random() * 8,
        angle,
      };
    });

    nodesRef.current = nodes;
  }, [connections, dimensions]);

  // 렌더링
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || dimensions.width === 0) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    // 중앙 사용자 노드 (나)
    const pulseSize = 35 + Math.sin(pulseRef.current * 0.05) * 3;

    // 연결선 그리기
    for (const node of nodesRef.current) {
      const isHovered = hoveredNode?.id === node.id;
      const isSelected = selectedNode?.id === node.id;

      // 곡선 연결선
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);

      const midX = (centerX + node.x) / 2;
      const midY = (centerY + node.y) / 2;
      const offset = 20;
      const ctrlX = midX + Math.cos(node.angle + Math.PI / 2) * offset;
      const ctrlY = midY + Math.sin(node.angle + Math.PI / 2) * offset;

      ctx.quadraticCurveTo(ctrlX, ctrlY, node.x, node.y);

      const gradient = ctx.createLinearGradient(centerX, centerY, node.x, node.y);
      if (isHovered || isSelected) {
        gradient.addColorStop(0, '#00E5FF');
        gradient.addColorStop(1, '#7C4DFF');
        ctx.lineWidth = 3;
      } else {
        gradient.addColorStop(0, 'rgba(0, 229, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(124, 77, 255, 0.2)');
        ctx.lineWidth = 1.5;
      }
      ctx.strokeStyle = gradient;
      ctx.stroke();

      // 애니메이션 효과 (흐르는 점)
      if (isHovered || isSelected) {
        const t = (pulseRef.current * 0.02) % 1;
        const animX = centerX + (node.x - centerX) * t;
        const animY = centerY + (node.y - centerY) * t;

        ctx.beginPath();
        ctx.arc(animX, animY, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
      }
    }

    // 중앙 노드 글로우
    const centerGlow = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, pulseSize * 2
    );
    centerGlow.addColorStop(0, 'rgba(0, 229, 255, 0.3)');
    centerGlow.addColorStop(0.5, 'rgba(124, 77, 255, 0.1)');
    centerGlow.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseSize * 2, 0, Math.PI * 2);
    ctx.fillStyle = centerGlow;
    ctx.fill();

    // 중앙 노드
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
    const centerGradient = ctx.createRadialGradient(
      centerX - 10, centerY - 10, 0,
      centerX, centerY, pulseSize
    );
    centerGradient.addColorStop(0, '#00E5FF');
    centerGradient.addColorStop(1, '#7C4DFF');
    ctx.fillStyle = centerGradient;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 중앙 라벨
    ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, Pretendard, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('나', centerX, centerY + 4);

    // 연결된 노드들 그리기
    for (const node of nodesRef.current) {
      const isHovered = hoveredNode?.id === node.id;
      const isSelected = selectedNode?.id === node.id;
      const displayRadius = isHovered || isSelected ? node.radius * 1.3 : node.radius;

      // 노드 글로우
      if (isHovered || isSelected) {
        const glow = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, displayRadius * 2.5
        );
        glow.addColorStop(0, 'rgba(0, 229, 255, 0.4)');
        glow.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(node.x, node.y, displayRadius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      // 노드 배경
      ctx.beginPath();
      ctx.arc(node.x, node.y, displayRadius, 0, Math.PI * 2);
      const nodeGradient = ctx.createRadialGradient(
        node.x - displayRadius * 0.3, node.y - displayRadius * 0.3, 0,
        node.x, node.y, displayRadius
      );
      nodeGradient.addColorStop(0, '#2D333B');
      nodeGradient.addColorStop(1, '#161B22');
      ctx.fillStyle = nodeGradient;
      ctx.fill();

      // 노드 테두리
      ctx.strokeStyle = isHovered || isSelected ? '#00E5FF' : '#21262D';
      ctx.lineWidth = isHovered || isSelected ? 2 : 1;
      ctx.stroke();

      // 이름 첫 글자
      ctx.font = `bold ${displayRadius * 0.7}px -apple-system, BlinkMacSystemFont, Pretendard, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isHovered || isSelected ? '#00E5FF' : '#8B949E';
      ctx.fillText(node.user.name[0], node.x, node.y);

      // 이름 라벨 (hover/selected 시)
      if (isHovered || isSelected) {
        ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, Pretendard, sans-serif';
        const labelY = node.y + displayRadius + 16;
        const labelText = node.user.name;
        const labelWidth = ctx.measureText(labelText).width + 16;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.beginPath();
        ctx.roundRect(node.x - labelWidth / 2, labelY - 10, labelWidth, 20, 6);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(labelText, node.x, labelY);

        // 회사 정보
        if (node.user.company) {
          ctx.font = '10px -apple-system, BlinkMacSystemFont, Pretendard, sans-serif';
          const companyY = labelY + 18;
          ctx.fillStyle = '#8B949E';
          ctx.fillText(node.user.company, node.x, companyY);
        }
      }
    }

    pulseRef.current += 1;
  }, [dimensions, hoveredNode, selectedNode]);

  // 애니메이션 루프
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

  // 마우스 이벤트
  const getNodeAtPosition = (clientX: number, clientY: number): NetworkNode | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    for (const node of nodesRef.current) {
      const dx = node.x - x;
      const dy = node.y - y;
      if (dx * dx + dy * dy < (node.radius + 10) * (node.radius + 10)) {
        return node;
      }
    }
    return null;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const node = getNodeAtPosition(e.clientX, e.clientY);
    setHoveredNode(node);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = node ? 'pointer' : 'default';
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    const node = getNodeAtPosition(e.clientX, e.clientY);
    if (node) {
      setSelectedNode(node);
    } else {
      setSelectedNode(null);
    }
  };

  const handleViewProfile = (userId: string) => {
    router.push(`/network/${userId}`);
  };

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  // 인맥이 없는 경우
  if (connections.length === 0) {
    return (
      <div className="w-full py-12 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-full bg-[#161B22] border border-[#21262D] flex items-center justify-center mb-4">
          <Users size={32} className="text-[#484F58]" />
        </div>
        <h3 className="text-white font-semibold mb-2">아직 인맥이 없습니다</h3>
        <p className="text-[#8B949E] text-sm mb-6 max-w-xs">
          네트워크에서 새로운 사람들과 연결하거나<br />
          초대 링크를 통해 인맥을 만들어보세요
        </p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/network')}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00E5FF] to-[#7C4DFF] rounded-xl text-black font-medium"
        >
          <UserPlus size={18} />
          인맥 찾아보기
        </motion.button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-[#00E5FF]" />
          <h3 className="text-white font-semibold">내 인맥 네트워크</h3>
        </div>
        <span className="text-sm text-[#8B949E]">{connections.length}명</span>
      </div>

      {/* 그래프 컨테이너 */}
      <div
        ref={containerRef}
        className="relative w-full h-64 bg-[#0D1117] rounded-xl border border-[#21262D] overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          onMouseLeave={() => setHoveredNode(null)}
        />

        {/* 선택된 노드 상세 정보 */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-4 left-4 right-4 bg-[#161B22]/95 backdrop-blur-xl border border-[#21262D] rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  src={selectedNode.user.profileImage}
                  name={selectedNode.user.name}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-semibold">{selectedNode.user.name}</h4>
                  <p className="text-[#8B949E] text-sm truncate">
                    {selectedNode.user.company} · {selectedNode.user.position}
                  </p>
                </div>
                <button
                  onClick={() => handleViewProfile(selectedNode.user.id)}
                  className="flex items-center gap-1 px-3 py-2 bg-[#00E5FF]/10 text-[#00E5FF] rounded-lg text-sm hover:bg-[#00E5FF]/20 transition-colors"
                >
                  <ExternalLink size={14} />
                  <span>보기</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 전체보기 버튼 */}
      <button
        onClick={() => router.push('/network')}
        className="w-full mt-4 py-3 text-center text-[#00E5FF] text-sm hover:bg-[#00E5FF]/5 rounded-xl transition-colors"
      >
        네트워크에서 더 많은 인맥 찾아보기 →
      </button>
    </div>
  );
}
