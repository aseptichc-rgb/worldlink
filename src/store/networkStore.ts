import { create } from 'zustand';
import { NetworkNode, NetworkEdge, SearchFilters } from '@/types';

interface NetworkState {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  selectedNode: NetworkNode | null;
  focusedNodeId: string | null; // 현재 포커스된 노드 (화면 중앙에 있는 노드)
  centerUserId: string | null; // 현재 그래프 중심 인물 ID (null이면 로그인 사용자)
  centerUserOriginalDegree: number | null; // 중심 인물의 로그인 사용자 기준 촌수
  highlightedKeyword: string | null;
  searchFilters: SearchFilters;
  categoryFilter: string | null; // 카테고리 필터 (null이면 전체)
  isLoading: boolean;
  setNodes: (nodes: NetworkNode[]) => void;
  setEdges: (edges: NetworkEdge[]) => void;
  setSelectedNode: (node: NetworkNode | null) => void;
  setFocusedNodeId: (nodeId: string | null) => void;
  setCenterUserId: (userId: string | null, originalDegree?: number) => void;
  setHighlightedKeyword: (keyword: string | null) => void;
  setSearchFilters: (filters: SearchFilters) => void;
  setCategoryFilter: (category: string | null) => void;
  setLoading: (loading: boolean) => void;
  updateNodeProfileImage: (nodeId: string, profileImage: string) => void;
  resetNetwork: () => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  focusedNodeId: null,
  centerUserId: null,
  centerUserOriginalDegree: null,
  highlightedKeyword: null,
  searchFilters: {},
  categoryFilter: null,
  isLoading: false,
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setSelectedNode: (selectedNode) => set({ selectedNode }),
  setFocusedNodeId: (focusedNodeId) => set({ focusedNodeId }),
  setCenterUserId: (centerUserId, originalDegree) => set({ centerUserId, centerUserOriginalDegree: originalDegree ?? null, selectedNode: null, focusedNodeId: null }),
  setHighlightedKeyword: (highlightedKeyword) => set({ highlightedKeyword }),
  setSearchFilters: (searchFilters) => set({ searchFilters }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  setLoading: (isLoading) => set({ isLoading }),
  updateNodeProfileImage: (nodeId, profileImage) => set((state) => ({
    nodes: state.nodes.map(node =>
      node.id === nodeId ? { ...node, profileImage } : node
    ),
    selectedNode: state.selectedNode?.id === nodeId
      ? { ...state.selectedNode, profileImage }
      : state.selectedNode,
  })),
  resetNetwork: () => set({
    nodes: [],
    edges: [],
    selectedNode: null,
    focusedNodeId: null,
    centerUserId: null,
    centerUserOriginalDegree: null,
    highlightedKeyword: null,
    searchFilters: {},
    categoryFilter: null,
  }),
}));
