import { create } from 'zustand';
import { ManagedGroup } from '@/types';
import {
  getUserManagedGroups,
  getManagedGroup,
  createManagedGroup as fbCreateManagedGroup,
  updateManagedGroup as fbUpdateManagedGroup,
  deleteManagedGroup as fbDeleteManagedGroup,
  removeMemberFromManagedGroup,
  leaveManagedGroup as fbLeaveManagedGroup,
  createManagedGroupInviteLink,
  generateManagedGroupInviteUrl,
  addMemberToManagedGroup,
  updateMemberRole as fbUpdateMemberRole,
} from '@/lib/firebase-services';
import { ManagedGroupRole, ManagedGroupSettings } from '@/types';
import { DEMO_MEMBERS, DEMO_ACCOUNT_INDEX, DEMO_GROUPS } from '@/lib/demo-seed-data';
import { demoUsers } from '@/lib/demo-data';

// 데모 모드 체크
function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('nodded_demo_mode') === 'true';
}

// 데모 그룹 데이터 생성
function generateDemoGroups(userId: string): ManagedGroup[] {
  return DEMO_GROUPS
    .filter(g => g.memberIndices.includes(DEMO_ACCOUNT_INDEX) || g.ownerIndex === DEMO_ACCOUNT_INDEX)
    .map((g, idx) => {
      const members = g.memberIndices.map(mIdx => {
        const member = DEMO_MEMBERS[mIdx];
        const roleInfo = g.roles[mIdx];
        return {
          userId: member.id,
          role: (roleInfo?.role || 'member') as ManagedGroupRole,
          ...(roleInfo?.title ? { title: roleInfo.title } : {}),
          joinedAt: new Date(),
        };
      });

      return {
        id: `demo_group_${idx + 1}`,
        name: g.name,
        description: g.description,
        color: g.color,
        icon: g.icon,
        ownerId: DEMO_MEMBERS[g.ownerIndex].id,
        members,
        memberUserIds: g.memberIndices.map(i => DEMO_MEMBERS[i].id),
        settings: { autoConnect: true, allowMemberInvite: true },
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ManagedGroup;
    });
}

interface ManagedGroupState {
  // Data
  groups: ManagedGroup[];
  selectedGroup: ManagedGroup | null;
  isLoading: boolean;
  error: string | null;

  // UI State
  isCreateModalOpen: boolean;
  isInviteModalOpen: boolean;
  isAddMemberModalOpen: boolean;
  inviteLink: string | null;

  // Actions
  fetchMyGroups: (userId: string) => Promise<void>;
  fetchGroupDetail: (groupId: string) => Promise<void>;
  createGroup: (ownerId: string, data: {
    name: string;
    description?: string;
    color: string;
    icon: string;
    settings?: Partial<ManagedGroupSettings>;
  }) => Promise<ManagedGroup>;
  updateGroup: (groupId: string, updates: Partial<Pick<ManagedGroup, 'name' | 'description' | 'color' | 'icon' | 'settings'>>) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  removeMember: (groupId: string, userId: string) => Promise<void>;
  leaveGroup: (groupId: string, userId: string) => Promise<void>;
  generateInviteLink: (groupId: string, inviterId: string) => Promise<string>;
  addMembersFromConnections: (groupId: string, userIds: string[]) => Promise<void>;
  updateMemberRole: (groupId: string, userId: string, role: ManagedGroupRole, title?: string) => Promise<void>;

  // UI Actions
  openCreateModal: () => void;
  closeCreateModal: () => void;
  openInviteModal: () => void;
  closeInviteModal: () => void;
  openAddMemberModal: () => void;
  closeAddMemberModal: () => void;
  setSelectedGroup: (group: ManagedGroup | null) => void;
  clearError: () => void;
  reset: () => void;
}

export const useManagedGroupStore = create<ManagedGroupState>((set, get) => ({
  groups: [],
  selectedGroup: null,
  isLoading: false,
  error: null,
  isCreateModalOpen: false,
  isInviteModalOpen: false,
  isAddMemberModalOpen: false,
  inviteLink: null,

  fetchMyGroups: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      // 데모 모드: 로컬 데모 그룹 사용
      if (isDemoMode()) {
        const demoGroups = generateDemoGroups(userId);
        set({ groups: demoGroups, isLoading: false });
        return;
      }
      const groups = await getUserManagedGroups(userId);
      set({ groups, isLoading: false });
    } catch (err) {
      console.error('Failed to fetch managed groups:', err);
      // Firebase 에러 시 데모 데이터 fallback
      if (isDemoMode()) {
        const demoGroups = generateDemoGroups(userId);
        set({ groups: demoGroups, isLoading: false });
      } else {
        set({ error: (err as Error).message, isLoading: false });
      }
    }
  },

  fetchGroupDetail: async (groupId) => {
    set({ isLoading: true, error: null });
    try {
      // 데모 모드: 로컬에서 그룹 찾기
      if (isDemoMode()) {
        const { groups } = get();
        let group = groups.find(g => g.id === groupId);
        if (!group) {
          const allDemoGroups = generateDemoGroups(DEMO_MEMBERS[DEMO_ACCOUNT_INDEX].id);
          group = allDemoGroups.find(g => g.id === groupId);
        }
        set({ selectedGroup: group || null, isLoading: false });
        return;
      }
      const group = await getManagedGroup(groupId);
      set({ selectedGroup: group, isLoading: false });
    } catch (err) {
      console.error('Failed to fetch group detail:', err);
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  createGroup: async (ownerId, data) => {
    set({ isLoading: true, error: null });
    try {
      const group = await fbCreateManagedGroup(ownerId, data);
      set((state) => ({
        groups: [group, ...state.groups],
        isLoading: false,
        isCreateModalOpen: false,
      }));
      return group;
    } catch (err) {
      console.error('Failed to create managed group:', err);
      set({ error: (err as Error).message, isLoading: false });
      throw err;
    }
  },

  updateGroup: async (groupId, updates) => {
    try {
      await fbUpdateManagedGroup(groupId, updates);
      set((state) => ({
        groups: state.groups.map(g =>
          g.id === groupId ? { ...g, ...updates, updatedAt: new Date() } : g
        ),
        selectedGroup: state.selectedGroup?.id === groupId
          ? { ...state.selectedGroup, ...updates, updatedAt: new Date() }
          : state.selectedGroup,
      }));
    } catch (err) {
      console.error('Failed to update managed group:', err);
      set({ error: (err as Error).message });
    }
  },

  deleteGroup: async (groupId) => {
    try {
      await fbDeleteManagedGroup(groupId);
      set((state) => ({
        groups: state.groups.filter(g => g.id !== groupId),
        selectedGroup: state.selectedGroup?.id === groupId ? null : state.selectedGroup,
      }));
    } catch (err) {
      console.error('Failed to delete managed group:', err);
      set({ error: (err as Error).message });
    }
  },

  removeMember: async (groupId, userId) => {
    try {
      await removeMemberFromManagedGroup(groupId, userId);
      const group = await getManagedGroup(groupId);
      set((state) => ({
        selectedGroup: group,
        groups: state.groups.map(g => g.id === groupId && group ? group : g),
      }));
    } catch (err) {
      console.error('Failed to remove member:', err);
      set({ error: (err as Error).message });
    }
  },

  leaveGroup: async (groupId, userId) => {
    try {
      await fbLeaveManagedGroup(groupId, userId);
      set((state) => ({
        groups: state.groups.filter(g => g.id !== groupId),
        selectedGroup: state.selectedGroup?.id === groupId ? null : state.selectedGroup,
      }));
    } catch (err) {
      console.error('Failed to leave managed group:', err);
      set({ error: (err as Error).message });
    }
  },

  generateInviteLink: async (groupId, inviterId) => {
    try {
      const invite = await createManagedGroupInviteLink(groupId, inviterId);
      const url = generateManagedGroupInviteUrl(invite.id);
      set({ inviteLink: url });
      return url;
    } catch (err) {
      console.error('Failed to generate invite link:', err);
      set({ error: (err as Error).message });
      throw err;
    }
  },

  addMembersFromConnections: async (groupId, userIds) => {
    set({ isLoading: true, error: null });
    try {
      for (const userId of userIds) {
        await addMemberToManagedGroup(groupId, userId);
      }
      const group = await getManagedGroup(groupId);
      set((state) => ({
        selectedGroup: group,
        groups: state.groups.map(g => g.id === groupId && group ? group : g),
        isLoading: false,
        isAddMemberModalOpen: false,
      }));
    } catch (err) {
      console.error('Failed to add members from connections:', err);
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  updateMemberRole: async (groupId, userId, role, title) => {
    try {
      await fbUpdateMemberRole(groupId, userId, role, title);
      const group = await getManagedGroup(groupId);
      set((state) => ({
        selectedGroup: group,
        groups: state.groups.map(g => g.id === groupId && group ? group : g),
      }));
    } catch (err) {
      console.error('Failed to update member role:', err);
      set({ error: (err as Error).message });
    }
  },

  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),
  openInviteModal: () => set({ isInviteModalOpen: true, inviteLink: null }),
  closeInviteModal: () => set({ isInviteModalOpen: false, inviteLink: null }),
  openAddMemberModal: () => set({ isAddMemberModalOpen: true }),
  closeAddMemberModal: () => set({ isAddMemberModalOpen: false }),
  setSelectedGroup: (group) => set({ selectedGroup: group }),
  clearError: () => set({ error: null }),
  reset: () => set({
    groups: [],
    selectedGroup: null,
    isLoading: false,
    error: null,
    isCreateModalOpen: false,
    isInviteModalOpen: false,
    isAddMemberModalOpen: false,
    inviteLink: null,
  }),
}));
