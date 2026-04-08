'use client';

import { useMemo } from 'react';
import { CATEGORY_COLORS, inferCategory, type CategoryName } from '@/lib/category-utils';
import { User } from '@/types';

interface MiniNetworkVizProps {
  connections: User[];
  myConnectionIds: Set<string>;
  centerName: string;
  centerImage?: string;
  onNodeClick?: (user: User) => void;
}

export default function MiniNetworkViz({
  connections,
  myConnectionIds,
  centerName,
  centerImage,
  onNodeClick,
}: MiniNetworkVizProps) {
  const SIZE = 220;
  const CENTER = SIZE / 2;
  const INNER_R = 60;
  const OUTER_R = 95;

  const { arcs, nodes } = useMemo(() => {
    // 카테고리별 그룹화
    const grouped: Record<string, User[]> = {};
    connections.forEach(u => {
      const cat = inferCategory(u);
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(u);
    });

    const categories = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);
    const total = connections.length || 1;

    // 각 카테고리에 아크 각도 할당
    let currentAngle = -Math.PI / 2; // 12시부터 시작
    const arcData: Array<{
      category: string;
      color: string;
      startAngle: number;
      endAngle: number;
      count: number;
      unknownCount: number;
    }> = [];
    const nodeData: Array<{
      user: User;
      x: number;
      y: number;
      color: string;
      isKnown: boolean;
    }> = [];

    categories.forEach(([cat, users]) => {
      const sweep = (users.length / total) * Math.PI * 2;
      const color = CATEGORY_COLORS[cat] || CATEGORY_COLORS['기타'];
      const unknownCount = users.filter(u => !myConnectionIds.has(u.id)).length;

      arcData.push({
        category: cat,
        color,
        startAngle: currentAngle,
        endAngle: currentAngle + sweep,
        count: users.length,
        unknownCount,
      });

      // 노드 배치 (최대 8개만 표시)
      const displayUsers = users.slice(0, 8);
      displayUsers.forEach((user, i) => {
        const angleStep = sweep / (displayUsers.length + 1);
        const angle = currentAngle + angleStep * (i + 1);
        const isKnown = myConnectionIds.has(user.id);
        const r = isKnown ? INNER_R : OUTER_R;
        nodeData.push({
          user,
          x: CENTER + Math.cos(angle) * r,
          y: CENTER + Math.sin(angle) * r,
          color,
          isKnown,
        });
      });

      currentAngle += sweep;
    });

    return { arcs: arcData, nodes: nodeData };
  }, [connections, myConnectionIds]);

  const describeArc = (startAngle: number, endAngle: number, r: number) => {
    const x1 = CENTER + Math.cos(startAngle) * r;
    const y1 = CENTER + Math.sin(startAngle) * r;
    const x2 = CENTER + Math.cos(endAngle) * r;
    const y2 = CENTER + Math.sin(endAngle) * r;
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  const unknownTotal = connections.filter(u => !myConnectionIds.has(u.id)).length;

  return (
    <div className="flex flex-col items-center">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="overflow-visible">
        {/* 배경 원 */}
        <circle cx={CENTER} cy={CENTER} r={OUTER_R + 8} fill="none" stroke="#1E1E1E" strokeWidth="1" />
        <circle cx={CENTER} cy={CENTER} r={INNER_R - 8} fill="none" stroke="#1E1E1E" strokeWidth="1" />

        {/* 카테고리별 아크 */}
        {arcs.map((arc, i) => (
          <g key={i}>
            {/* 외곽 아크 */}
            <path
              d={describeArc(arc.startAngle, arc.endAngle - 0.03, OUTER_R + 8)}
              fill="none"
              stroke={arc.color}
              strokeWidth="3"
              strokeLinecap="round"
              opacity={0.3}
            />
            {/* 내곽 연결선 (아는 사람 영역) */}
            <path
              d={describeArc(arc.startAngle, arc.endAngle - 0.03, INNER_R - 8)}
              fill="none"
              stroke={arc.color}
              strokeWidth="2"
              strokeLinecap="round"
              opacity={0.15}
            />
          </g>
        ))}

        {/* 연결선 */}
        {nodes.map((node, i) => (
          <line
            key={`line-${i}`}
            x1={CENTER}
            y1={CENTER}
            x2={node.x}
            y2={node.y}
            stroke={node.color}
            strokeWidth={node.isKnown ? 1 : 0.5}
            opacity={node.isKnown ? 0.3 : 0.15}
            strokeDasharray={node.isKnown ? undefined : '3,3'}
          />
        ))}

        {/* 노드 */}
        {nodes.map((node, i) => (
          <g
            key={`node-${i}`}
            onClick={() => onNodeClick?.(node.user)}
            className="cursor-pointer"
          >
            {node.isKnown ? (
              // 아는 사람: 채워진 원
              <circle
                cx={node.x}
                cy={node.y}
                r={6}
                fill={node.color}
                opacity={0.9}
              />
            ) : (
              // 모르는 사람: 점선 원 + 반짝이 효과
              <>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={6}
                  fill="transparent"
                  stroke={node.color}
                  strokeWidth="1.5"
                  strokeDasharray="2,2"
                  opacity={0.7}
                >
                  <animate
                    attributeName="opacity"
                    values="0.4;0.9;0.4"
                    dur="2s"
                    repeatCount="indefinite"
                    begin={`${i * 0.2}s`}
                  />
                </circle>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={2}
                  fill={node.color}
                  opacity={0.5}
                >
                  <animate
                    attributeName="opacity"
                    values="0.3;0.8;0.3"
                    dur="2s"
                    repeatCount="indefinite"
                    begin={`${i * 0.2}s`}
                  />
                </circle>
              </>
            )}
          </g>
        ))}

        {/* 중앙 노드 */}
        <circle cx={CENTER} cy={CENTER} r={18} fill="#1E1E1E" stroke="#58A6FF" strokeWidth="2" />
        {centerImage ? (
          <clipPath id="center-clip">
            <circle cx={CENTER} cy={CENTER} r={16} />
          </clipPath>
        ) : null}
        <text
          x={CENTER}
          y={CENTER}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize="10"
          fontWeight="600"
        >
          {centerName.slice(0, 2)}
        </text>
      </svg>

      {/* 범례 */}
      {unknownTotal > 0 && (
        <div className="flex items-center gap-3 mt-2 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#58A6FF]" />
            <span className="text-[#8B949E]">아는 인맥</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full border border-dashed border-[#58A6FF]" />
            <span className="text-[#8B949E]">새로운 기회 {unknownTotal}명</span>
          </span>
        </div>
      )}
    </div>
  );
}
