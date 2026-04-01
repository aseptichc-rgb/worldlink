'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Activity, TrendingUp, Users, BarChart3, AlertTriangle, Lightbulb, ArrowRight } from 'lucide-react';
import { Avatar } from '@/components/ui';
import BottomNav from '@/components/ui/BottomNav';
import SmartMatchCard from '@/components/insights/SmartMatchCard';
import { useAuthStore } from '@/store/authStore';
import { useNetworkStore } from '@/store/networkStore';
import { useInteractionStore } from '@/store/interactionStore';
import { demoUsers, getDemoCompatibleId, getDemoNetworkGraph, demoConnections } from '@/lib/demo-data';
import {
  getRelationshipDistribution,
  getMonthlyActivity,
  getCategoryDiversity,
  calculateNetworkHealthScore,
  getWeakeningRelationships,
} from '@/lib/insights-utils';
import { RelationshipStatus } from '@/types';

const STATUS_CONFIG: Record<RelationshipStatus, { color: string; label: string }> = {
  active: { color: '#3FB950', label: '활발' },
  warm: { color: '#D29922', label: '보통' },
  cold: { color: '#FF6B8A', label: '소원' },
  dormant: { color: '#F85149', label: '위험' },
};

const TIPS = [
  '매주 2-3명에게 안부 메시지를 보내보세요.',
  '커피챗은 관계를 깊게 만드는 가장 좋은 방법입니다.',
  '다양한 분야의 인맥이 예상치 못한 기회를 만들어줍니다.',
  '메모를 남기면 다음 만남이 더 의미 있어집니다.',
  '소개를 해주면 네트워크의 허브가 될 수 있습니다.',
];

export default function InsightsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { nodes } = useNetworkStore();
  const { interactions, initDemoInteractions } = useInteractionStore();

  // 데모 데이터 초기화 (데모 멤버와 매칭되는 사용자만)
  useEffect(() => {
    if (user) {
      const demoId = getDemoCompatibleId(user);
      const isDemoUser = demoId !== user.id || user.id.startsWith('member_') || user.id.startsWith('demo_');
      if (!isDemoUser) return;
      const connIds = demoConnections[demoId] || [];
      if (connIds.length > 0) {
        initDemoInteractions(demoId, connIds);
      }
    }
  }, [user, initDemoInteractions]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/onboarding');
    }
  }, [isLoading, isAuthenticated, router]);

  // 네트워크 노드가 없으면 데모 모드에서만 데모 데이터 사용
  const effectiveNodes = useMemo(() => {
    if (nodes.length > 0) return nodes;
    if (!user) return [];
    const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('nodded_demo_mode') === 'true';
    if (!isDemoMode) return [];
    const demoId = getDemoCompatibleId(user);
    // 데모 멤버와 매칭되지 않는 실제 계정은 데모 데이터 사용하지 않음
    const isDemoUser = demoId !== user.id || user.id.startsWith('member_') || user.id.startsWith('demo_');
    if (!isDemoUser) return [];
    const { nodes: demoNodes } = getDemoNetworkGraph(demoId);
    return demoNodes;
  }, [nodes, user]);

  const connectionIds = useMemo(
    () => effectiveNodes.filter(n => n.degree === 1).map(n => n.id),
    [effectiveNodes]
  );

  const distribution = useMemo(
    () => getRelationshipDistribution(interactions, connectionIds),
    [interactions, connectionIds]
  );

  const monthly = useMemo(
    () => getMonthlyActivity(interactions),
    [interactions]
  );

  const diversity = useMemo(
    () => getCategoryDiversity(effectiveNodes),
    [effectiveNodes]
  );

  const healthScore = useMemo(
    () => calculateNetworkHealthScore(distribution, monthly, diversity),
    [distribution, monthly, diversity]
  );

  const weakening = useMemo(
    () => getWeakeningRelationships(interactions, connectionIds).slice(0, 5),
    [interactions, connectionIds]
  );

  const tip = useMemo(() => TIPS[Math.floor(Math.random() * TIPS.length)], []);

  const maxCategoryCount = useMemo(
    () => Math.max(...Object.values(diversity), 1),
    [diversity]
  );

  const sortedCategories = useMemo(
    () => Object.entries(diversity).sort((a, b) => b[1] - a[1]),
    [diversity]
  );

  const getName = (userId: string) => {
    const node = effectiveNodes.find(n => n.id === userId);
    if (node) return node.name;
    const demo = demoUsers.find(u => u.id === userId);
    return demo?.name || '알 수 없음';
  };

  const getProfileImage = (userId: string) => {
    const node = effectiveNodes.find(n => n.id === userId);
    if (node) return node.profileImage;
    const demo = demoUsers.find(u => u.id === userId);
    return demo?.profileImage;
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="spinner mx-auto" />
      </div>
    );
  }

  // 도넛 차트 CSS 계산
  const total = distribution.total || 1;
  const segments = [
    { pct: (distribution.active / total) * 100, color: '#3FB950' },
    { pct: (distribution.warm / total) * 100, color: '#D29922' },
    { pct: (distribution.cold / total) * 100, color: '#FF6B8A' },
    { pct: (distribution.dormant / total) * 100, color: '#F85149' },
  ];
  let cumulativePct = 0;
  const gradientParts = segments.map(s => {
    const start = cumulativePct;
    cumulativePct += s.pct;
    return `${s.color} ${start}% ${cumulativePct}%`;
  });
  const donutGradient = `conic-gradient(${gradientParts.join(', ')})`;

  return (
    <div className="min-h-screen bg-[#0D1117] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0D1117]/90 backdrop-blur-xl border-b border-[#30363D]/50">
        <div className="px-5 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-[#30363D]/80 transition-colors">
            <ArrowLeft size={20} className="text-[#8B949E]" />
          </button>
          <div className="flex items-center gap-2">
            <BarChart3 size={20} className="text-[#58A6FF]" />
            <h1 className="text-lg font-bold text-white">인맥 인사이트</h1>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-5">
        {/* Network Health Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#161B22] border border-[#30363D]/50 rounded-2xl p-6"
        >
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#30363D" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke={healthScore >= 70 ? '#3FB950' : healthScore >= 40 ? '#D29922' : '#F85149'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${healthScore * 2.64} ${264 - healthScore * 2.64}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{healthScore}</span>
                <span className="text-[10px] text-[#8B949E]">/ 100</span>
              </div>
            </div>
            <div>
              <h2 className="text-base font-semibold text-white mb-1">네트워크 건강 점수</h2>
              <p className="text-sm text-[#8B949E]">
                {healthScore >= 70 ? '인맥을 잘 관리하고 계십니다!' :
                 healthScore >= 40 ? '조금 더 적극적으로 연락해보세요.' :
                 '소원해진 인맥에 안부를 전해보세요.'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Monthly Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#161B22] border border-[#30363D]/50 rounded-2xl p-5"
        >
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[#8B949E] mb-4">
            <TrendingUp size={14} />
            이번 달 활동
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center bg-[#0D1117] rounded-xl py-3">
              <p className="text-2xl font-bold text-[#58A6FF]">{connectionIds.length}</p>
              <p className="text-xs text-[#8B949E] mt-0.5">전체 인맥</p>
            </div>
            <div className="text-center bg-[#0D1117] rounded-xl py-3">
              <p className="text-2xl font-bold text-[#3FB950]">{monthly.interactionCount}</p>
              <p className="text-xs text-[#8B949E] mt-0.5">연락 기록</p>
            </div>
            <div className="text-center bg-[#0D1117] rounded-xl py-3">
              <p className="text-2xl font-bold text-[#D29922]">{monthly.uniqueContacts}</p>
              <p className="text-xs text-[#8B949E] mt-0.5">연락한 인맥</p>
            </div>
          </div>
        </motion.div>

        {/* Relationship Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#161B22] border border-[#30363D]/50 rounded-2xl p-5"
        >
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[#8B949E] mb-4">
            <Activity size={14} />
            관계 현황
          </h3>
          <div className="flex items-center gap-6">
            <div className="relative w-20 h-20 flex-shrink-0">
              <div
                className="w-full h-full rounded-full"
                style={{ background: donutGradient }}
              />
              <div className="absolute inset-[25%] rounded-full bg-[#161B22]" />
            </div>
            <div className="flex-1 space-y-2">
              {(['active', 'warm', 'cold', 'dormant'] as RelationshipStatus[]).map(status => {
                const config = STATUS_CONFIG[status];
                const count = distribution[status];
                return (
                  <div key={status} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: config.color }} />
                    <span className="text-xs text-[#8B949E] flex-1">{config.label}</span>
                    <span className="text-xs font-medium" style={{ color: config.color }}>
                      {count}명
                    </span>
                    <span className="text-[10px] text-[#484F58]">
                      {distribution.total > 0 ? Math.round((count / distribution.total) * 100) : 0}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Category Diversity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#161B22] border border-[#30363D]/50 rounded-2xl p-5"
        >
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[#8B949E] mb-4">
            <Users size={14} />
            분야 다양성
            <span className="text-[10px] text-[#484F58] font-normal">{sortedCategories.length}개 분야</span>
          </h3>
          <div className="space-y-2.5">
            {sortedCategories.map(([category, count]) => (
              <div key={category} className="flex items-center gap-3">
                <span className="text-xs text-[#8B949E] w-24 truncate flex-shrink-0">{category}</span>
                <div className="flex-1 h-4 bg-[#0D1117] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / maxCategoryCount) * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="h-full rounded-full bg-gradient-to-r from-[#58A6FF] to-[#1F6FEB]"
                  />
                </div>
                <span className="text-xs text-[#58A6FF] font-medium w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Weakening Relationships */}
        {weakening.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#161B22] border border-[#F85149]/20 rounded-2xl p-5"
          >
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[#F85149] mb-4">
              <AlertTriangle size={14} />
              약해지는 관계
            </h3>
            <div className="space-y-2">
              {weakening.map(item => {
                const config = STATUS_CONFIG[item.status];
                return (
                  <button
                    key={item.targetUserId}
                    onClick={() => router.push('/network')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#0D1117] transition-colors"
                  >
                    <Avatar
                      src={getProfileImage(item.targetUserId)}
                      name={getName(item.targetUserId)}
                      size="sm"
                    />
                    <div className="flex-1 text-left">
                      <p className="text-sm text-white font-medium">{getName(item.targetUserId)}</p>
                    </div>
                    <span
                      className="text-xs font-medium px-2 py-1 rounded-full"
                      style={{ color: config.color, backgroundColor: config.color + '15' }}
                    >
                      {item.daysSince}일 전
                    </span>
                    <ArrowRight size={14} className="text-[#484F58]" />
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Smart Match Section */}
        <SmartMatchCard nodes={effectiveNodes} />

        {/* Tip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-[#58A6FF]/5 border border-[#58A6FF]/20 rounded-2xl p-5"
        >
          <div className="flex items-start gap-3">
            <Lightbulb size={18} className="text-[#58A6FF] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#58A6FF] mb-1">관계 관리 팁</p>
              <p className="text-sm text-[#8B949E]">{tip}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
}
