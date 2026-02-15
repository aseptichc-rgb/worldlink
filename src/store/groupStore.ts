import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NodeGroup, GroupMembership } from '@/types';

// 그룹 색상 팔레트
export const GROUP_COLORS = [
  '#FF6B8A', // 핑크
  '#FF9F43', // 주황
  '#FECA57', // 노랑
  '#48DBFB', // 하늘
  '#0ABDE3', // 시안
  '#10AC84', // 녹색
  '#EE5A24', // 빨강
  '#A29BFE', // 라벤더
  '#6C5CE7', // 보라
  '#FD79A8', // 핫핑크
];

// 그룹 아이콘 목록
export const GROUP_ICONS = [
  '🏷️', '⭐', '🎯', '💼', '🏌️', '🎓', '🚀', '💡', '🤝', '📌', '🔥', '💎',
];

interface GroupState {
  groups: NodeGroup[];
  memberships: GroupMembership[];
  activeGroupFilter: string | null;
  isGroupPanelOpen: boolean;
  isGroupAssignModalOpen: boolean;
  assignTargetNodeId: string | null;

  createGroup: (name: string, color: string, icon: string) => NodeGroup;
  updateGroup: (groupId: string, updates: Partial<Pick<NodeGroup, 'name' | 'color' | 'icon'>>) => void;
  deleteGroup: (groupId: string) => void;

  addNodeToGroup: (nodeId: string, groupId: string) => void;
  removeNodeFromGroup: (nodeId: string, groupId: string) => void;
  getGroupsForNode: (nodeId: string) => NodeGroup[];
  getNodesInGroup: (groupId: string) => string[];

  setActiveGroupFilter: (groupId: string | null) => void;
  toggleGroupPanel: () => void;
  setGroupPanelOpen: (open: boolean) => void;
  openGroupAssignModal: (nodeId: string) => void;
  closeGroupAssignModal: () => void;
}

export const useGroupStore = create<GroupState>()(
  persist(
    (set, get) => ({
      groups: [],
      memberships: [],
      activeGroupFilter: null,
      isGroupPanelOpen: false,
      isGroupAssignModalOpen: false,
      assignTargetNodeId: null,

      createGroup: (name, color, icon) => {
        const newGroup: NodeGroup = {
          id: `group-${Date.now()}`,
          name,
          color,
          icon,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({ groups: [...state.groups, newGroup] }));
        return newGroup;
      },

      updateGroup: (groupId, updates) => {
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId ? { ...g, ...updates, updatedAt: new Date() } : g
          ),
        }));
      },

      deleteGroup: (groupId) => {
        set((state) => ({
          groups: state.groups.filter((g) => g.id !== groupId),
          memberships: state.memberships.filter((m) => m.groupId !== groupId),
          activeGroupFilter: state.activeGroupFilter === groupId ? null : state.activeGroupFilter,
        }));
      },

      addNodeToGroup: (nodeId, groupId) => {
        const { memberships } = get();
        if (memberships.some((m) => m.nodeId === nodeId && m.groupId === groupId)) return;
        set((state) => ({
          memberships: [...state.memberships, { groupId, nodeId, addedAt: new Date() }],
        }));
      },

      removeNodeFromGroup: (nodeId, groupId) => {
        set((state) => ({
          memberships: state.memberships.filter(
            (m) => !(m.nodeId === nodeId && m.groupId === groupId)
          ),
        }));
      },

      getGroupsForNode: (nodeId) => {
        const { memberships, groups } = get();
        const groupIds = memberships.filter((m) => m.nodeId === nodeId).map((m) => m.groupId);
        return groups.filter((g) => groupIds.includes(g.id));
      },

      getNodesInGroup: (groupId) => {
        const { memberships } = get();
        return memberships.filter((m) => m.groupId === groupId).map((m) => m.nodeId);
      },

      setActiveGroupFilter: (groupId) => set({ activeGroupFilter: groupId }),
      toggleGroupPanel: () => set((state) => ({ isGroupPanelOpen: !state.isGroupPanelOpen })),
      setGroupPanelOpen: (open) => set({ isGroupPanelOpen: open }),
      openGroupAssignModal: (nodeId) => set({ isGroupAssignModalOpen: true, assignTargetNodeId: nodeId }),
      closeGroupAssignModal: () => set({ isGroupAssignModalOpen: false, assignTargetNodeId: null }),
    }),
    {
      name: 'nodded-groups',
    }
  )
);
