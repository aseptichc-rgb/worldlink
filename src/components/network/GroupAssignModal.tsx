'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check } from 'lucide-react';
import { useGroupStore, GROUP_COLORS, GROUP_ICONS } from '@/store/groupStore';
import { useNetworkStore } from '@/store/networkStore';

export default function GroupAssignModal() {
  const {
    isGroupAssignModalOpen,
    assignTargetNodeId,
    closeGroupAssignModal,
    groups,
    memberships,
    addNodeToGroup,
    removeNodeFromGroup,
    createGroup,
  } = useGroupStore();

  const { nodes } = useNetworkStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(GROUP_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(GROUP_ICONS[0]);

  const targetNode = assignTargetNodeId
    ? nodes.find((n) => n.id === assignTargetNodeId)
    : null;

  const nodeGroupIds = new Set(
    memberships
      .filter((m) => m.nodeId === assignTargetNodeId)
      .map((m) => m.groupId)
  );

  const handleToggleGroup = (groupId: string) => {
    if (!assignTargetNodeId) return;
    if (nodeGroupIds.has(groupId)) {
      removeNodeFromGroup(assignTargetNodeId, groupId);
    } else {
      addNodeToGroup(assignTargetNodeId, groupId);
    }
  };

  const handleCreateGroup = () => {
    if (!newName.trim() || !assignTargetNodeId) return;
    const group = createGroup(newName.trim(), selectedColor, selectedIcon);
    addNodeToGroup(assignTargetNodeId, group.id);
    setNewName('');
    setSelectedColor(GROUP_COLORS[0]);
    setSelectedIcon(GROUP_ICONS[0]);
    setShowCreateForm(false);
  };

  const handleClose = () => {
    setShowCreateForm(false);
    setNewName('');
    closeGroupAssignModal();
  };

  return (
    <AnimatePresence>
      {isGroupAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-[rgba(1,4,9,0.85)] backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm bg-[rgba(22,27,34,0.95)] backdrop-blur-xl border border-[rgba(240,246,252,0.1)] rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.4)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(240,246,252,0.1)]">
              <div>
                <h2 className="text-lg font-semibold text-[#F0F6FC]">그룹 지정</h2>
                {targetNode && (
                  <p className="text-xs text-[#8B949E] mt-0.5">{targetNode.name}</p>
                )}
              </div>
              <button
                onClick={handleClose}
                className="p-1 text-[#8B949E] hover:text-[#F0F6FC] transition-colors rounded-lg hover:bg-[rgba(240,246,252,0.05)]"
              >
                <X size={20} />
              </button>
            </div>

            {/* Group List */}
            <div className="px-6 py-4 max-h-[300px] overflow-y-auto">
              {groups.length === 0 && !showCreateForm ? (
                <div className="text-center py-6">
                  <p className="text-[#484F58] text-sm mb-3">아직 그룹이 없습니다</p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#58A6FF]/10 text-[#58A6FF] text-sm font-medium hover:bg-[#58A6FF]/20 transition-colors"
                  >
                    <Plus size={14} />
                    새 그룹 만들기
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {groups.map((group) => {
                    const isInGroup = nodeGroupIds.has(group.id);
                    return (
                      <button
                        key={group.id}
                        onClick={() => handleToggleGroup(group.id)}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                          ${isInGroup
                            ? 'bg-[#58A6FF]/10 border border-[#58A6FF]/30'
                            : 'hover:bg-[#1C2333] border border-transparent'
                          }
                        `}
                      >
                        <span className="text-lg">{group.icon}</span>
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: group.color }}
                        />
                        <span className="flex-1 text-left text-sm text-white">{group.name}</span>
                        {isInGroup && (
                          <Check size={16} className="text-[#58A6FF] flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Create Group Form */}
            {showCreateForm ? (
              <div className="px-6 py-4 border-t border-[rgba(240,246,252,0.1)]">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="그룹 이름 입력"
                  maxLength={20}
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#484F58] focus:outline-none focus:border-[#58A6FF] transition-colors mb-3"
                  autoFocus
                />

                {/* Color Picker */}
                <p className="text-xs text-[#8B949E] mb-2">색상</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {GROUP_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-7 h-7 rounded-full transition-all duration-200 ${
                        selectedColor === color
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-[#161B22] scale-110'
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {/* Icon Picker */}
                <p className="text-xs text-[#8B949E] mb-2">아이콘</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {GROUP_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setSelectedIcon(icon)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all duration-200 ${
                        selectedIcon === icon
                          ? 'bg-[#58A6FF]/20 ring-1 ring-[#58A6FF]'
                          : 'hover:bg-[#1C2333]'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewName('');
                    }}
                    className="flex-1 py-2.5 rounded-xl text-sm text-[#8B949E] hover:bg-[#1C2333] transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleCreateGroup}
                    disabled={!newName.trim()}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[#58A6FF] text-white hover:bg-[#58A6FF]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    만들기
                  </button>
                </div>
              </div>
            ) : groups.length > 0 ? (
              <div className="px-6 py-3 border-t border-[rgba(240,246,252,0.1)]">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-[#8B949E] hover:bg-[#1C2333] hover:text-white transition-colors"
                >
                  <Plus size={14} />
                  새 그룹 만들기
                </button>
              </div>
            ) : null}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
