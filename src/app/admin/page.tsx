'use client';

import { useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users, Link2, UserPlus, TrendingUp, Search, RefreshCw,
  ArrowLeft, Tag, BarChart3, Shield, Mail, MessageCircle, Loader2,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import { Avatar } from '@/components/ui';
import StatCard from '@/components/admin/StatCard';
import TrendChart from '@/components/admin/TrendChart';
import { useAdminStore } from '@/store/adminStore';
import {
  getAllUsers,
  getConnectionStats,
  getInvitationStats,
  getKeywordDistribution,
  getCategoryDistribution,
  getDailySignUpTrend,
  getWeeklySignUpTrend,
} from '@/lib/admin-services';

const CATEGORY_COLORS: Record<string, string> = {
  '의료기관': '#58A6FF',
  '의료기기': '#1F6FEB',
  '솔루션': '#7EE0FF',
  '제약': '#3FB950',
  '바이오': '#A371F7',
  '투자': '#FF6B8A',
  '법률': '#D29922',
  '비즈니스': '#F97316',
  '특허': '#EC4899',
  '미분류': '#484F58',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return new Date(date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export default function AdminPage() {
  const router = useRouter();
  const {
    users, totalUserCount, connectionStats, invitationStats,
    isLoading, searchQuery, trendRange,
    setUsers, setTotalUserCount, setConnectionStats, setInvitationStats,
    setLoading, setSearchQuery, setTrendRange,
  } = useAdminStore();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersData, connStats, invStats] = await Promise.all([
        getAllUsers(),
        getConnectionStats(),
        getInvitationStats(),
      ]);
      setUsers(usersData);
      setTotalUserCount(usersData.length);
      setConnectionStats(connStats);
      setInvitationStats(invStats);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  }, [setUsers, setTotalUserCount, setConnectionStats, setInvitationStats, setLoading]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Computed data
  const acceptanceRate = useMemo(() => {
    if (connectionStats.total === 0) return 0;
    return Math.round((connectionStats.accepted / connectionStats.total) * 100);
  }, [connectionStats]);

  const keywords = useMemo(() => getKeywordDistribution(users), [users]);
  const categories = useMemo(() => getCategoryDistribution(users), [users]);

  const trendData = useMemo(() => {
    if (trendRange === 'daily') {
      return getDailySignUpTrend(users, 30).map(d => ({
        label: d.date.split('-').slice(1).join('/'),
        value: d.count,
      }));
    }
    return getWeeklySignUpTrend(users, 12).map(d => ({
      label: d.week,
      value: d.count,
    }));
  }, [users, trendRange]);

  const recentUsers = useMemo(() => users.slice(0, 10), [users]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.company?.toLowerCase().includes(q) ||
      u.position?.toLowerCase().includes(q) ||
      u.category?.toLowerCase().includes(q) ||
      u.keywords?.some(k => k.toLowerCase().includes(q))
    );
  }, [users, searchQuery]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 size={36} className="text-[#58A6FF] animate-spin" />
          <p className="text-[#8B949E] text-sm">어드민 데이터를 불러오는 중...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#121212]/90 backdrop-blur-xl border-b border-[rgba(240,246,252,0.06)]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/network')}
              className="p-2 text-[#8B949E] hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Shield size={20} className="text-[#58A6FF]" />
              <h1 className="text-lg font-bold text-white">NODDED Admin</h1>
            </div>
          </div>
          <button
            onClick={loadData}
            className="p-2 text-[#8B949E] hover:text-[#58A6FF] transition-colors"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto px-4 py-6 space-y-6 pb-12"
      >
        {/* Overview Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={<Users size={22} className="text-[#58A6FF]" />}
            label="전체 회원"
            value={totalUserCount}
            color="#58A6FF"
          />
          <StatCard
            icon={<Link2 size={22} className="text-[#1F6FEB]" />}
            label="총 인맥"
            value={connectionStats.accepted}
            color="#1F6FEB"
          />
          <StatCard
            icon={<UserPlus size={22} className="text-[#3FB950]" />}
            label="총 초대"
            value={invitationStats.total}
            color="#3FB950"
          />
          <StatCard
            icon={<TrendingUp size={22} className="text-[#FF6B8A]" />}
            label="인맥 수락률"
            value={`${acceptanceRate}%`}
            color="#FF6B8A"
          />
        </motion.div>

        {/* Connection Stats */}
        <motion.div variants={itemVariants}>
          <Card className="p-5">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Link2 size={18} className="text-[#1F6FEB]" />
              인맥 현황
            </h2>
            {/* Distribution Bar */}
            {connectionStats.total > 0 && (
              <div className="flex h-3 rounded-full overflow-hidden mb-4">
                <div
                  className="bg-[#3FB950] transition-all"
                  style={{ width: `${(connectionStats.accepted / connectionStats.total) * 100}%` }}
                />
                <div
                  className="bg-[#D29922] transition-all"
                  style={{ width: `${(connectionStats.pending / connectionStats.total) * 100}%` }}
                />
                <div
                  className="bg-[#F85149] transition-all"
                  style={{ width: `${(connectionStats.rejected / connectionStats.total) * 100}%` }}
                />
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-[#3FB950]/10">
                <p className="text-xl font-bold text-[#3FB950]">{connectionStats.accepted}</p>
                <p className="text-xs text-[#8B949E] mt-1">수락됨</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-[#D29922]/10">
                <p className="text-xl font-bold text-[#D29922]">{connectionStats.pending}</p>
                <p className="text-xs text-[#8B949E] mt-1">대기중</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-[#F85149]/10">
                <p className="text-xl font-bold text-[#F85149]">{connectionStats.rejected}</p>
                <p className="text-xs text-[#8B949E] mt-1">거절됨</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Invitation Stats */}
        <motion.div variants={itemVariants}>
          <Card className="p-5">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <UserPlus size={18} className="text-[#3FB950]" />
              초대 현황
            </h2>
            {/* By Status */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              <div className="text-center p-2.5 rounded-lg bg-[#D29922]/10">
                <p className="text-lg font-bold text-[#D29922]">{invitationStats.byStatus.pending}</p>
                <p className="text-[11px] text-[#8B949E]">대기</p>
              </div>
              <div className="text-center p-2.5 rounded-lg bg-[#58A6FF]/10">
                <p className="text-lg font-bold text-[#58A6FF]">{invitationStats.byStatus.sent}</p>
                <p className="text-[11px] text-[#8B949E]">발송</p>
              </div>
              <div className="text-center p-2.5 rounded-lg bg-[#3FB950]/10">
                <p className="text-lg font-bold text-[#3FB950]">{invitationStats.byStatus.accepted}</p>
                <p className="text-[11px] text-[#8B949E]">수락</p>
              </div>
              <div className="text-center p-2.5 rounded-lg bg-[#484F58]/10">
                <p className="text-lg font-bold text-[#484F58]">{invitationStats.byStatus.expired}</p>
                <p className="text-[11px] text-[#8B949E]">만료</p>
              </div>
            </div>
            {/* By Method */}
            <p className="text-xs text-[#8B949E] mb-3">초대 방법별</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#FEE500]/5 border border-[#FEE500]/15">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#FEE500">
                  <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.82 5.32 4.55 6.73-.15.54-.82 2.93-.86 3.15 0 0-.02.14.07.19.09.06.2.03.2.03.26-.04 3.04-1.99 3.52-2.32.83.12 1.68.18 2.52.18 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-white">{invitationStats.byMethod.kakao}</p>
                  <p className="text-[11px] text-[#8B949E]">카카오톡</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#58A6FF]/5 border border-[#58A6FF]/15">
                <Mail size={20} className="text-[#58A6FF]" />
                <div>
                  <p className="text-sm font-semibold text-white">{invitationStats.byMethod.email}</p>
                  <p className="text-[11px] text-[#8B949E]">이메일</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#3FB950]/5 border border-[#3FB950]/15">
                <MessageCircle size={20} className="text-[#3FB950]" />
                <div>
                  <p className="text-sm font-semibold text-white">{invitationStats.byMethod.sms}</p>
                  <p className="text-[11px] text-[#8B949E]">SMS</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#A371F7]/5 border border-[#A371F7]/15">
                <Link2 size={20} className="text-[#A371F7]" />
                <div>
                  <p className="text-sm font-semibold text-white">{invitationStats.byMethod.link}</p>
                  <p className="text-[11px] text-[#8B949E]">링크</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Growth Trends */}
        <motion.div variants={itemVariants}>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <BarChart3 size={18} className="text-[#58A6FF]" />
                가입 추이
              </h2>
              <div className="flex bg-[#1C2333] rounded-lg p-0.5">
                <button
                  onClick={() => setTrendRange('daily')}
                  className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                    trendRange === 'daily'
                      ? 'bg-[#58A6FF] text-[#0D1117] font-medium'
                      : 'text-[#8B949E] hover:text-white'
                  }`}
                >
                  일별
                </button>
                <button
                  onClick={() => setTrendRange('weekly')}
                  className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                    trendRange === 'weekly'
                      ? 'bg-[#58A6FF] text-[#0D1117] font-medium'
                      : 'text-[#8B949E] hover:text-white'
                  }`}
                >
                  주별
                </button>
              </div>
            </div>
            <TrendChart data={trendData} />
          </Card>
        </motion.div>

        {/* Keywords & Categories */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Keywords */}
          <Card className="p-5">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Tag size={18} className="text-[#7EE0FF]" />
              인기 키워드
            </h2>
            <div className="flex flex-wrap gap-2">
              {keywords.slice(0, 20).map(([kw, count], i) => (
                <span
                  key={kw}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all ${
                    i < 5
                      ? 'bg-[#58A6FF]/15 border-[#58A6FF]/30 text-[#58A6FF]'
                      : 'bg-[#1C2333] border-[#30363D] text-[#8B949E]'
                  }`}
                >
                  {kw}
                  <span className={`text-[10px] ${i < 5 ? 'text-[#58A6FF]/70' : 'text-[#484F58]'}`}>
                    {count}
                  </span>
                </span>
              ))}
              {keywords.length === 0 && (
                <p className="text-sm text-[#484F58]">키워드 데이터가 없습니다</p>
              )}
            </div>
          </Card>

          {/* Categories */}
          <Card className="p-5">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-[#A371F7]" />
              분야별 분포
            </h2>
            <div className="space-y-3">
              {categories.slice(0, 10).map(([cat, count]) => {
                const maxCat = categories[0]?.[1] || 1;
                const color = CATEGORY_COLORS[cat] || '#8B949E';
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[#C9D1D9]">{cat}</span>
                      <span className="text-xs text-[#8B949E]">{count}명</span>
                    </div>
                    <div className="h-2 bg-[#1C2333] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / maxCat) * 100}%` }}
                        transition={{ duration: 0.6 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
              {categories.length === 0 && (
                <p className="text-sm text-[#484F58]">분야 데이터가 없습니다</p>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Recent Users */}
        <motion.div variants={itemVariants}>
          <Card className="p-5">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Users size={18} className="text-[#58A6FF]" />
              최근 가입자
            </h2>
            {recentUsers.length > 0 ? (
              <div className="space-y-0">
                {recentUsers.map((user, i) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 py-3 border-b border-[rgba(240,246,252,0.06)] last:border-0"
                  >
                    <Avatar src={user.profileImage} name={user.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{user.name}</p>
                      <p className="text-[#8B949E] text-xs truncate">
                        {[user.company, user.position].filter(Boolean).join(' · ') || '정보 없음'}
                      </p>
                    </div>
                    {user.category && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0"
                        style={{
                          color: CATEGORY_COLORS[user.category] || '#8B949E',
                          borderColor: `${CATEGORY_COLORS[user.category] || '#8B949E'}30`,
                          backgroundColor: `${CATEGORY_COLORS[user.category] || '#8B949E'}10`,
                        }}
                      >
                        {user.category}
                      </span>
                    )}
                    <span className="text-[11px] text-[#484F58] whitespace-nowrap flex-shrink-0">
                      {formatRelativeDate(user.createdAt)}
                    </span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#484F58] text-center py-8">가입자가 없습니다</p>
            )}
          </Card>
        </motion.div>

        {/* User List */}
        <motion.div variants={itemVariants}>
          <Card className="p-5">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Users size={18} className="text-[#1F6FEB]" />
              전체 회원 목록
              <span className="text-xs text-[#484F58] font-normal ml-1">({users.length}명)</span>
            </h2>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#484F58]" size={18} />
              <input
                type="text"
                placeholder="이름, 이메일, 회사, 키워드로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#1C2333] border border-[#30363D] rounded-xl text-white placeholder-[#484F58] text-sm focus:outline-none focus:border-[#58A6FF]/50 transition-colors"
              />
            </div>
            {/* Table */}
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-[#30363D]">
                    <th className="text-left py-3 px-3 text-xs text-[#8B949E] font-medium">회원</th>
                    <th className="text-left py-3 px-3 text-xs text-[#8B949E] font-medium">이메일</th>
                    <th className="text-left py-3 px-3 text-xs text-[#8B949E] font-medium">회사 / 직책</th>
                    <th className="text-left py-3 px-3 text-xs text-[#8B949E] font-medium">분야</th>
                    <th className="text-left py-3 px-3 text-xs text-[#8B949E] font-medium">키워드</th>
                    <th className="text-left py-3 px-3 text-xs text-[#8B949E] font-medium">가입일</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-[rgba(240,246,252,0.04)] hover:bg-[#1C2333]/50 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar src={user.profileImage} name={user.name} size="xs" />
                          <span className="text-sm text-white font-medium whitespace-nowrap">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-xs text-[#8B949E] max-w-[180px] truncate">
                        {user.email || '-'}
                      </td>
                      <td className="py-3 px-3">
                        <p className="text-xs text-[#C9D1D9] truncate max-w-[160px]">
                          {user.company || '-'}
                        </p>
                        <p className="text-[11px] text-[#484F58] truncate max-w-[160px]">
                          {user.position || ''}
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        {user.category ? (
                          <span
                            className="text-[11px] px-2 py-0.5 rounded-full border whitespace-nowrap"
                            style={{
                              color: CATEGORY_COLORS[user.category] || '#8B949E',
                              borderColor: `${CATEGORY_COLORS[user.category] || '#8B949E'}30`,
                              backgroundColor: `${CATEGORY_COLORS[user.category] || '#8B949E'}10`,
                            }}
                          >
                            {user.category}
                          </span>
                        ) : (
                          <span className="text-xs text-[#484F58]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {user.keywords?.slice(0, 3).map(kw => (
                            <span key={kw} className="text-[10px] px-1.5 py-0.5 bg-[#1C2333] text-[#8B949E] rounded">
                              {kw}
                            </span>
                          ))}
                          {(user.keywords?.length || 0) > 3 && (
                            <span className="text-[10px] text-[#484F58]">+{user.keywords!.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-xs text-[#484F58] whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Search size={24} className="text-[#484F58] mx-auto mb-2" />
                  <p className="text-sm text-[#484F58]">
                    {searchQuery ? '검색 결과가 없습니다' : '회원이 없습니다'}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
