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
      const groups = await getUserManagedGroups(userId);
      set({ groups, isLoading: false });
    } catch (err) {
      console.error('Failed to fetch managed groups:', err);
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchGroupDetail: async (groupId) => {
    set({ isLoading: true, error: null });
    try {
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
