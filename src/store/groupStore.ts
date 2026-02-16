import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NodeGroup, GroupMembership, GroupConnection } from '@/types';
import { saveUserGroups, loadUserGroups } from '@/lib/firebase-services';

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

// Firebase 동기화를 위한 debounce 타이머
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let currentUserId: string | null = null;

const syncToFirebase = (state: { groups: NodeGroup[]; memberships: GroupMembership[]; groupConnections: GroupConnection[] }) => {
  if (!currentUserId) return;
  if (syncTimer) clearTimeout(syncTimer);
  const userId = currentUserId;
  syncTimer = setTimeout(() => {
    saveUserGroups(userId, {
      groups: state.groups,
      memberships: state.memberships,
      groupConnections: state.groupConnections,
    }).catch(err => console.error('그룹 동기화 실패:', err));
  }, 1000);
};

interface GroupState {
  groups: NodeGroup[];
  memberships: GroupMembership[];
  groupConnections: GroupConnection[]; // 그룹 내 연결
  activeGroupFilter: string | null;
  isGroupPanelOpen: boolean;
  isGroupAssignModalOpen: boolean;
  assignTargetNodeId: string | null;

  // 그룹 상세 패널 상태
  isGroupDetailPanelOpen: boolean;
  detailGroupId: string | null;
  isAddMembersModalOpen: boolean;

  // 그룹 초대 모달 상태
  isGroupInviteModalOpen: boolean;
  inviteGroupId: string | null;

  // Firebase 동기화
  loadFromFirebase: (userId: string) => Promise<void>;
  clearGroups: () => void;

  createGroup: (name: string, color: string, icon: string) => NodeGroup;
  updateGroup: (groupId: string, updates: Partial<Pick<NodeGroup, 'name' | 'color' | 'icon'>>) => void;
  deleteGroup: (groupId: string) => void;

  addNodeToGroup: (nodeId: string, groupId: string) => void;
  addNodesToGroup: (nodeIds: string[], groupId: string) => void; // 여러 노드 한번에 추가
  removeNodeFromGroup: (nodeId: string, groupId: string) => void;
  getGroupsForNode: (nodeId: string) => NodeGroup[];
  getNodesInGroup: (groupId: string) => string[];
  getGroupConnections: (groupId: string) => GroupConnection[];
  isConnectedInGroup: (nodeId1: string, nodeId2: string, groupId: string) => boolean;

  setActiveGroupFilter: (groupId: string | null) => void;
  toggleGroupPanel: () => void;
  setGroupPanelOpen: (open: boolean) => void;
  openGroupAssignModal: (nodeId: string) => void;
  closeGroupAssignModal: () => void;

  // 그룹 상세 패널 액션
  openGroupDetailPanel: (groupId: string) => void;
  closeGroupDetailPanel: () => void;
  openAddMembersModal: () => void;
  closeAddMembersModal: () => void;

  // 그룹 초대 액션
  openGroupInviteModal: (groupId: string) => void;
  closeGroupInviteModal: () => void;
}

export const useGroupStore = create<GroupState>()(
  persist(
    (set, get) => ({
      groups: [],
      memberships: [],
      groupConnections: [],
      activeGroupFilter: null,
      isGroupPanelOpen: false,
      isGroupAssignModalOpen: false,
      assignTargetNodeId: null,
      isGroupDetailPanelOpen: false,
      detailGroupId: null,
      isAddMembersModalOpen: false,
      isGroupInviteModalOpen: false,
      inviteGroupId: null,

      loadFromFirebase: async (userId) => {
        currentUserId = userId;
        try {
          const data = await loadUserGroups(userId);
          if (data) {
            set({
              groups: data.groups,
              memberships: data.memberships,
              groupConnections: data.groupConnections,
            });
          }
        } catch (err) {
          console.error('그룹 불러오기 실패:', err);
        }
      },

      clearGroups: () => {
        currentUserId = null;
        if (syncTimer) clearTimeout(syncTimer);
        set({
          groups: [],
          memberships: [],
          groupConnections: [],
          activeGroupFilter: null,
        });
      },

      createGroup: (name, color, icon) => {
        const newGroup: NodeGroup = {
          id: `group-${Date.now()}`,
          name,
          color,
          icon,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => {
          const newState = { groups: [...state.groups, newGroup] };
          syncToFirebase({ ...state, ...newState });
          return newState;
        });
        return newGroup;
      },

      updateGroup: (groupId, updates) => {
        set((state) => {
          const newState = {
            groups: state.groups.map((g) =>
              g.id === groupId ? { ...g, ...updates, updatedAt: new Date() } : g
            ),
          };
          syncToFirebase({ ...state, ...newState });
          return newState;
        });
      },

      deleteGroup: (groupId) => {
        set((state) => {
          const newState = {
            groups: state.groups.filter((g) => g.id !== groupId),
            memberships: state.memberships.filter((m) => m.groupId !== groupId),
            groupConnections: state.groupConnections.filter((c) => c.groupId !== groupId),
            activeGroupFilter: state.activeGroupFilter === groupId ? null : state.activeGroupFilter,
          };
          syncToFirebase(newState);
          return newState;
        });
      },

      addNodeToGroup: (nodeId, groupId) => {
        const { memberships, groupConnections } = get();
        if (memberships.some((m) => m.nodeId === nodeId && m.groupId === groupId)) return;

        // 그룹 내 기존 멤버들과 연결 생성
        const existingMembers = memberships.filter((m) => m.groupId === groupId);
        const newConnections: GroupConnection[] = existingMembers.map((m) => ({
          groupId,
          sourceNodeId: nodeId,
          targetNodeId: m.nodeId,
          createdAt: new Date(),
        }));

        set((state) => {
          const newState = {
            memberships: [...state.memberships, { groupId, nodeId, addedAt: new Date() }],
            groupConnections: [...state.groupConnections, ...newConnections],
          };
          syncToFirebase({ ...state, ...newState });
          return newState;
        });
      },

      addNodesToGroup: (nodeIds, groupId) => {
        const { memberships, groupConnections } = get();
        const existingMemberIds = new Set(
          memberships.filter((m) => m.groupId === groupId).map((m) => m.nodeId)
        );

        // 이미 그룹에 있는 노드는 제외
        const newNodeIds = nodeIds.filter((id) => !existingMemberIds.has(id));
        if (newNodeIds.length === 0) return;

        // 새 멤버십 생성
        const newMemberships: GroupMembership[] = newNodeIds.map((nodeId) => ({
          groupId,
          nodeId,
          addedAt: new Date(),
        }));

        // 기존 멤버들과 새 멤버들 간의 연결 생성
        const newConnections: GroupConnection[] = [];

        // 새 노드들과 기존 멤버들 간의 연결
        for (const newNodeId of newNodeIds) {
          for (const existingId of existingMemberIds) {
            newConnections.push({
              groupId,
              sourceNodeId: newNodeId,
              targetNodeId: existingId,
              createdAt: new Date(),
            });
          }
        }

        // 새 노드들끼리의 연결
        for (let i = 0; i < newNodeIds.length; i++) {
          for (let j = i + 1; j < newNodeIds.length; j++) {
            newConnections.push({
              groupId,
              sourceNodeId: newNodeIds[i],
              targetNodeId: newNodeIds[j],
              createdAt: new Date(),
            });
          }
        }

        set((state) => {
          const newState = {
            memberships: [...state.memberships, ...newMemberships],
            groupConnections: [...state.groupConnections, ...newConnections],
          };
          syncToFirebase({ ...state, ...newState });
          return newState;
        });
      },

      removeNodeFromGroup: (nodeId, groupId) => {
        set((state) => {
          const newState = {
            memberships: state.memberships.filter(
              (m) => !(m.nodeId === nodeId && m.groupId === groupId)
            ),
            // 해당 노드와 관련된 그룹 연결도 제거
            groupConnections: state.groupConnections.filter(
              (c) => !(c.groupId === groupId && (c.sourceNodeId === nodeId || c.targetNodeId === nodeId))
            ),
          };
          syncToFirebase({ ...state, ...newState });
          return newState;
        });
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

      getGroupConnections: (groupId) => {
        const { groupConnections } = get();
        return groupConnections.filter((c) => c.groupId === groupId);
      },

      isConnectedInGroup: (nodeId1, nodeId2, groupId) => {
        const { groupConnections } = get();
        return groupConnections.some(
          (c) =>
            c.groupId === groupId &&
            ((c.sourceNodeId === nodeId1 && c.targetNodeId === nodeId2) ||
              (c.sourceNodeId === nodeId2 && c.targetNodeId === nodeId1))
        );
      },

      setActiveGroupFilter: (groupId) => set({ activeGroupFilter: groupId }),
      toggleGroupPanel: () => set((state) => ({ isGroupPanelOpen: !state.isGroupPanelOpen })),
      setGroupPanelOpen: (open) => set({ isGroupPanelOpen: open }),
      openGroupAssignModal: (nodeId) => set({ isGroupAssignModalOpen: true, assignTargetNodeId: nodeId }),
      closeGroupAssignModal: () => set({ isGroupAssignModalOpen: false, assignTargetNodeId: null }),

      // 그룹 상세 패널 액션
      openGroupDetailPanel: (groupId) => set({
        isGroupDetailPanelOpen: true,
        detailGroupId: groupId,
        isGroupPanelOpen: false, // 메인 패널 닫기
      }),
      closeGroupDetailPanel: () => set({
        isGroupDetailPanelOpen: false,
        detailGroupId: null,
        isAddMembersModalOpen: false,
      }),
      openAddMembersModal: () => set({ isAddMembersModalOpen: true }),
      closeAddMembersModal: () => set({ isAddMembersModalOpen: false }),

      // 그룹 초대 액션
      openGroupInviteModal: (groupId) => set({ isGroupInviteModalOpen: true, inviteGroupId: groupId }),
      closeGroupInviteModal: () => set({ isGroupInviteModalOpen: false, inviteGroupId: null }),
    }),
    {
      name: 'nodded-groups',
    }
  )
);
