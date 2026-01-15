import { create } from 'zustand';
import { NetworkNode, NetworkEdge, SearchFilters } from '@/types';

interface NetworkState {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  selectedNode: NetworkNode | null;
  focusedNodeId: string | null; // 현재 포커스된 노드 (화면 중앙에 있는 노드)
  highlightedKeyword: string | null;
  searchFilters: SearchFilters;
  isLoading: boolean;
  setNodes: (nodes: NetworkNode[]) => void;
  setEdges: (edges: NetworkEdge[]) => void;
  setSelectedNode: (node: NetworkNode | null) => void;
  setFocusedNodeId: (nodeId: string | null) => void;
  setHighlightedKeyword: (keyword: string | null) => void;
  setSearchFilters: (filters: SearchFilters) => void;
  setLoading: (loading: boolean) => void;
  resetNetwork: () => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  focusedNodeId: null,
  highlightedKeyword: null,
  searchFilters: {},
  isLoading: false,
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setSelectedNode: (selectedNode) => set({ selectedNode }),
  setFocusedNodeId: (focusedNodeId) => set({ focusedNodeId }),
  setHighlightedKeyword: (highlightedKeyword) => set({ highlightedKeyword }),
  setSearchFilters: (searchFilters) => set({ searchFilters }),
  setLoading: (isLoading) => set({ isLoading }),
  resetNetwork: () => set({
    nodes: [],
    edges: [],
    selectedNode: null,
    focusedNodeId: null,
    highlightedKeyword: null,
    searchFilters: {}
  }),
}));
