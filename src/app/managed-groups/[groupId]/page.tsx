'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Settings, UserPlus, Edit3, Trash2, LogOut, Loader2, Users, X, Check, List, Share2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useManagedGroupStore } from '@/store/managedGroupStore';
import { GROUP_COLORS, GROUP_ICONS } from '@/store/groupStore';
import ManagedGroupMemberList, { MemberInfo } from '@/components/managed-group/ManagedGroupMemberList';
import ManagedGroupInviteModal from '@/components/managed-group/ManagedGroupInviteModal';
import ManagedGroupAddMemberModal from '@/components/managed-group/ManagedGroupAddMemberModal';
import MemberRoleSheet from '@/components/managed-group/MemberRoleSheet';
import GroupNetworkGraph from '@/components/managed-group/GroupNetworkGraph';
import BottomNav from '@/components/ui/BottomNav';
import { getUser, getGroupMemberConnections, MemberConnection } from '@/lib/firebase-services';
import { ManagedGroupMember, User } from '@/types';
import { demoUsers } from '@/lib/demo-data';

export default function ManagedGroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId as string;

  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const {
    selectedGroup,
    isLoading,
    fetchGroupDetail,
    updateGroup,
    deleteGroup,
    removeMember,
    leaveGroup,
    openInviteModal,
    openAddMemberModal,
    setSelectedGroup,
  } = useManagedGroupStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [autoConnect, setAutoConnect] = useState(true);
  const [allowMemberInvite, setAllowMemberInvite] = useState(false);
  const [viewMode, setViewMode] = useState<string>('network');
  const [roleSheetMember, setRoleSheetMember] = useState<MemberInfo | null>(null);
  const [membersWithUser, setMembersWithUser] = useState<(ManagedGroupMember & { user?: User })[]>([]);
  const [memberConnections, setMemberConnections] = useState<MemberConnection[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/onboarding');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (groupId) {
      fetchGroupDetail(groupId);
    }
    return () => setSelectedGroup(null);
  }, [groupId, fetchGroupDetail, setSelectedGroup]);

  useEffect(() => {
    if (selectedGroup) {
      setEditName(selectedGroup.name);
      setEditDescription(selectedGroup.description || '');
      setEditColor(selectedGroup.color);
      setEditIcon(selectedGroup.icon);
      setAutoConnect(selectedGroup.settings.autoConnect);
      setAllowMemberInvite(selectedGroup.settings.allowMemberInvite);
    }
  }, [selectedGroup]);

  // Load member user data for network graph
  useEffect(() => {
    if (!selectedGroup?.members) return;
    const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('nodded_demo_mode') === 'true';
    const loadMembersData = async () => {
      const loaded = await Promise.all(
        selectedGroup.members.map(async (member) => {
          // 데모 모드: 로컬 데모 유저 데이터 사용
          if (isDemoMode) {
            const demoUser = demoUsers.find(u => u.id === member.userId);
            return { ...member, user: demoUser || undefined };
          }
          try {
            const userData = await getUser(member.userId);
            return { ...member, user: userData || undefined };
          } catch {
            // Firebase 실패 시 데모 데이터 fallback
            const demoUser = demoUsers.find(u => u.id === member.userId);
            return { ...member, user: demoUser || undefined };
          }
        })
      );
      setMembersWithUser(loaded);
    };
    loadMembersData();
  }, [selectedGroup?.members]);

  // Load member connections for network graph
  useEffect(() => {
    if (!selectedGroup?.memberUserIds || selectedGroup.memberUserIds.length < 2) {
      setMemberConnections([]);
      return;
    }

    const loadConnections = async () => {
      setIsLoadingConnections(true);
      try {
        const connections = await getGroupMemberConnections(selectedGroup.memberUserIds);
        setMemberConnections(connections);
      } catch (error) {
        console.error('Failed to load member connections:', error);
        setMemberConnections([]);
      } finally {
        setIsLoadingConnections(false);
      }
    };

    // 네트워크 뷰에서만 로드 (최적화)
    if (viewMode === 'network') {
      loadConnections();
    }
  }, [selectedGroup?.memberUserIds, viewMode]);

  if (authLoading || isLoading || !selectedGroup) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#58A6FF]" />
      </div>
    );
  }

  const isOwner = user?.id === selectedGroup.ownerId;
  // 현재 사용자의 역할 확인
  const currentUserMember = selectedGroup.members.find(m => m.userId === user?.id);
  const isPresident = currentUserMember?.role === 'president';
  const isExecutive = currentUserMember?.role === 'executive';
  // 회장 또는 회장단은 역할 편집 가능
  const canEditRoles = isPresident || isExecutive;
  const canInvite = isOwner || selectedGroup.settings.allowMemberInvite;

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    await updateGroup(groupId, {
      name: editName.trim(),
      description: editDescription.trim() || undefined,
      color: editColor,
      icon: editIcon,
    });
    setIsEditing(false);
  };

  const handleSaveSettings = async () => {
    await updateGroup(groupId, {
      settings: { autoConnect, allowMemberInvite },
    });
    setShowSettings(false);
  };

  const handleDelete = async () => {
    await deleteGroup(groupId);
    router.replace('/managed-groups');
  };

  const handleLeave = async () => {
    if (!user) return;
    await leaveGroup(groupId, user.id);
    router.replace('/managed-groups');
  };

  const handleRemoveMember = async (userId: string) => {
    await removeMember(groupId, userId);
  };

  const handleMemberTap = (member: MemberInfo | (ManagedGroupMember & { user?: User })) => {
    // 회장 또는 회장단은 역할 변경 가능 (목록 뷰에서만)
    if (canEditRoles) {
      setRoleSheetMember(member as MemberInfo);
    }
  };

  // 목록에서 멤버 클릭 시 프로필 페이지로 이동
  const handleMemberClick = (member: MemberInfo) => {
    router.push(`/network/${member.userId}`);
  };

  // 네트워크 그래프에서 노드 클릭 시 프로필 페이지로 이동
  const handleNodeClick = (member: ManagedGroupMember & { user?: User }) => {
    router.push(`/network/${member.userId}`);
  };

  return (
    <div className="min-h-screen bg-[#0D1117] pb-24">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-[#0D1117]/80 backdrop-blur-xl border-b border-[rgba(240,246,252,0.05)]">
        <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
          <button
            onClick={() => router.push('/managed-groups')}
            className="p-2 -ml-2 text-[#8B949E] hover:text-white"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-base font-bold text-[#F0F6FC] truncate mx-4">{selectedGroup.name}</h1>
          <div className="flex items-center gap-1">
            {isOwner && (
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-[#8B949E] hover:text-white"
              >
                <Settings size={20} />
              </button>
            )}
            {canInvite && (
              <button
                onClick={openInviteModal}
                className="p-2 text-[#58A6FF]"
              >
                <UserPlus size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      {viewMode === 'network' ? (
        /* Network View - Full Screen */
        <div className="relative" style={{ height: 'calc(100vh - 56px - 96px)' }}>
          <GroupNetworkGraph
            members={membersWithUser}
            ownerId={selectedGroup.ownerId}
            groupColor={selectedGroup.color}
            connections={memberConnections}
            isLoadingConnections={isLoadingConnections}
            onMemberTap={handleNodeClick}
          />
          {/* View Toggle overlay */}
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-[#161B22]/90 backdrop-blur-sm border border-[#30363D] rounded-xl p-1">
            <button
              onClick={() => setViewMode('list')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#8B949E] hover:text-white"
            >
              <List size={14} />
              목록
            </button>
            <button
              onClick={() => setViewMode('network')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#58A6FF]/20 text-[#58A6FF]"
            >
              <Share2 size={14} />
              네트워크
            </button>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
          {/* Group Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#161B22] border border-[#30363D] rounded-2xl p-5"
          >
            {!isEditing ? (
              <div>
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                    style={{ backgroundColor: selectedGroup.color + '20' }}
                  >
                    {selectedGroup.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-[#F0F6FC]">{selectedGroup.name}</h2>
                    {selectedGroup.description && (
                      <p className="text-sm text-[#8B949E] mt-1">{selectedGroup.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Users size={14} className="text-[#484F58]" />
                      <span className="text-sm text-[#484F58]">멤버 {selectedGroup.members.length}명</span>
                    </div>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="shrink-0 p-2 text-[#8B949E] hover:text-[#58A6FF]"
                    >
                      <Edit3 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Edit Mode */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#F0F6FC]">그룹 정보 수정</h3>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="p-1 text-[#8B949E]"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Preview */}
                <div className="flex items-center gap-3 p-3 bg-[#0D1117] rounded-xl">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: editColor + '20' }}
                  >
                    {editIcon}
                  </div>
                  <div>
                    <p className="text-[#F0F6FC] font-medium">{editName || '그룹 이름'}</p>
                    <p className="text-xs text-[#8B949E]">{editDescription || '설명 없음'}</p>
                  </div>
                </div>

                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value.slice(0, 30))}
                  placeholder="그룹 이름"
                  className="w-full px-4 py-3 bg-[#0D1117] border border-[#30363D] rounded-xl text-white placeholder-[#484F58] focus:outline-none focus:border-[#58A6FF] text-sm"
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value.slice(0, 200))}
                  placeholder="설명 (선택)"
                  rows={2}
                  className="w-full px-4 py-3 bg-[#0D1117] border border-[#30363D] rounded-xl text-white placeholder-[#484F58] focus:outline-none focus:border-[#58A6FF] text-sm resize-none"
                />

                {/* Color */}
                <div>
                  <label className="block text-xs text-[#8B949E] mb-2">색상</label>
                  <div className="flex flex-wrap gap-2">
                    {GROUP_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setEditColor(color)}
                        className={`w-7 h-7 rounded-full transition-all ${
                          editColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#161B22] scale-110' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Icon */}
                <div>
                  <label className="block text-xs text-[#8B949E] mb-2">아이콘</label>
                  <div className="flex flex-wrap gap-2">
                    {GROUP_ICONS.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setEditIcon(icon)}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                          editIcon === icon
                            ? 'bg-[#58A6FF]/20 ring-2 ring-[#58A6FF]'
                            : 'bg-[#0D1117] hover:bg-[#1C2333]'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-2.5 bg-[#0D1117] text-[#8B949E] text-sm font-medium rounded-xl border border-[#30363D]"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={!editName.trim()}
                    className="flex-1 py-2.5 bg-[#58A6FF] text-[#0D1117] text-sm font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    <Check size={16} />
                    저장
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Settings Panel (Owner Only) */}
          <AnimatePresence>
            {showSettings && isOwner && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-[#F0F6FC]">그룹 설정</h3>

                  <label className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#F0F6FC]">자동 인맥 연결</p>
                      <p className="text-xs text-[#484F58]">새 멤버가 기존 멤버와 자동 연결</p>
                    </div>
                    <div
                      onClick={() => setAutoConnect(!autoConnect)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        autoConnect ? 'bg-[#58A6FF]' : 'bg-[#30363D]'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        autoConnect ? 'translate-x-[22px]' : 'translate-x-0.5'
                      }`} />
                    </div>
                  </label>

                  <label className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#F0F6FC]">멤버 초대 허용</p>
                      <p className="text-xs text-[#484F58]">일반 멤버도 초대 링크 생성 가능</p>
                    </div>
                    <div
                      onClick={() => setAllowMemberInvite(!allowMemberInvite)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        allowMemberInvite ? 'bg-[#58A6FF]' : 'bg-[#30363D]'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        allowMemberInvite ? 'translate-x-[22px]' : 'translate-x-0.5'
                      }`} />
                    </div>
                  </label>

                  <button
                    onClick={handleSaveSettings}
                    className="w-full py-2.5 bg-[#58A6FF] text-[#0D1117] text-sm font-bold rounded-xl"
                  >
                    설정 저장
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Member Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#161B22] border border-[#30363D] rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#F0F6FC]">
                멤버 ({selectedGroup.members.length})
              </h3>
              <div className="flex items-center gap-2">
                {isOwner && (
                  <button
                    onClick={openAddMemberModal}
                    className="flex items-center gap-1 text-xs text-[#3FB950] font-medium px-2 py-1.5"
                  >
                    <Users size={14} />
                    인맥 추가
                  </button>
                )}
                {canInvite && (
                  <button
                    onClick={openInviteModal}
                    className="flex items-center gap-1 text-xs text-[#58A6FF] font-medium px-2 py-1.5"
                  >
                    <UserPlus size={14} />
                    초대
                  </button>
                )}
              </div>
            </div>

            {/* View Toggle - 큰 탭 버튼 */}
            <div className="flex items-center gap-1 bg-[#0D1117] rounded-xl p-1 mb-4">
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'list'
                    ? 'bg-[#58A6FF]/15 text-[#58A6FF] shadow-sm'
                    : 'text-[#484F58] hover:text-[#8B949E]'
                }`}
              >
                <List size={18} />
                목록
              </button>
              <button
                onClick={() => setViewMode('network')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'network'
                    ? 'bg-[#58A6FF]/15 text-[#58A6FF] shadow-sm'
                    : 'text-[#484F58] hover:text-[#8B949E]'
                }`}
              >
                <Share2 size={18} />
                관계 시각화
              </button>
            </div>

            {/* Tip for role editors */}
            {canEditRoles && viewMode === 'list' && (
              <p className="text-[10px] text-[#484F58] mb-3">
                멤버를 탭하면 프로필로 이동합니다. 연필 아이콘으로 역할을 편집할 수 있습니다.
              </p>
            )}

            <ManagedGroupMemberList
              members={selectedGroup.members}
              ownerId={selectedGroup.ownerId}
              currentUserId={user!.id}
              currentUserRole={currentUserMember?.role}
              onRemoveMember={handleRemoveMember}
              onMemberClick={handleMemberClick}
              onRoleEdit={canEditRoles ? handleMemberTap : undefined}
            />
          </motion.div>

          {/* Danger Zone */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="pb-4"
          >
            {isOwner ? (
              /* Owner: Delete Group */
              !showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 text-[#F85149] text-sm font-medium rounded-xl border border-[#F85149]/20 hover:bg-[#F85149]/10 transition-colors"
                >
                  <Trash2 size={16} />
                  그룹 삭제
                </button>
              ) : (
                <div className="bg-[#F85149]/10 border border-[#F85149]/30 rounded-2xl p-4 space-y-3">
                  <p className="text-sm text-[#F85149] font-medium text-center">
                    정말 이 그룹을 삭제하시겠습니까?
                  </p>
                  <p className="text-xs text-[#8B949E] text-center">이 작업은 되돌릴 수 없습니다</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-2.5 bg-[#0D1117] text-[#8B949E] text-sm font-medium rounded-xl border border-[#30363D]"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex-1 py-2.5 bg-[#F85149] text-white text-sm font-bold rounded-xl"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              )
            ) : (
              /* Member: Leave Group */
              !showLeaveConfirm ? (
                <button
                  onClick={() => setShowLeaveConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 text-[#8B949E] text-sm font-medium rounded-xl border border-[#30363D] hover:text-[#F85149] hover:border-[#F85149]/30 transition-colors"
                >
                  <LogOut size={16} />
                  그룹 나가기
                </button>
              ) : (
                <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-4 space-y-3">
                  <p className="text-sm text-[#F0F6FC] font-medium text-center">
                    정말 그룹을 나가시겠습니까?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowLeaveConfirm(false)}
                      className="flex-1 py-2.5 bg-[#0D1117] text-[#8B949E] text-sm font-medium rounded-xl border border-[#30363D]"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleLeave}
                      className="flex-1 py-2.5 bg-[#F85149] text-white text-sm font-bold rounded-xl"
                    >
                      나가기
                    </button>
                  </div>
                </div>
              )
            )}
          </motion.div>
        </div>
      )}

      {/* Role Assignment Sheet */}
      <MemberRoleSheet
        isOpen={!!roleSheetMember}
        onClose={() => setRoleSheetMember(null)}
        member={roleSheetMember}
        groupId={groupId}
        currentUserRole={currentUserMember?.role}
      />

      <ManagedGroupInviteModal />
      <ManagedGroupAddMemberModal />
      <BottomNav />
    </div>
  );
}
