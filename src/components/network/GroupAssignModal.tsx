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
            className="absolute inset-0 bg-[rgba(0,0,0,0.3)] backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm bg-white border border-[#E2E8F0] rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.1)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
              <div>
                <h2 className="text-lg font-semibold text-[#1A1A2E]">그룹 지정</h2>
                {targetNode && (
                  <p className="text-sm text-[#64748B] mt-0.5">{targetNode.name}</p>
                )}
              </div>
              <button
                onClick={handleClose}
                className="p-1 text-[#64748B] hover:text-[#1A1A2E] transition-colors rounded-lg hover:bg-[#F1F3F5]"
              >
                <X size={20} />
              </button>
            </div>

            {/* Group List */}
            <div className="px-6 py-4 max-h-[300px] overflow-y-auto">
              {groups.length === 0 && !showCreateForm ? (
                <div className="text-center py-6">
                  <p className="text-[#94A3B8] text-base mb-3">아직 그룹이 없습니다</p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563EB]/10 text-[#2563EB] text-sm font-medium hover:bg-[#2563EB]/20 transition-colors"
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
                            ? 'bg-[#2563EB]/10 border border-[#2563EB]/30'
                            : 'hover:bg-[#F1F3F5] border border-transparent'
                          }
                        `}
                      >
                        <span className="text-lg">{group.icon}</span>
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: group.color }}
                        />
                        <span className="flex-1 text-left text-base text-[#1A1A2E]">{group.name}</span>
                        {isInGroup && (
                          <Check size={16} className="text-[#2563EB] flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Create Group Form */}
            {showCreateForm ? (
              <div className="px-6 py-4 border-t border-[#E2E8F0]">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="그룹 이름 입력"
                  maxLength={20}
                  className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-base text-[#1A1A2E] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] transition-colors mb-3"
                  autoFocus
                />

                {/* Color Picker */}
                <p className="text-sm text-[#64748B] mb-2">색상</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {GROUP_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-7 h-7 rounded-full transition-all duration-200 ${
                        selectedColor === color
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-white scale-110'
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {/* Icon Picker */}
                <p className="text-sm text-[#64748B] mb-2">아이콘</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {GROUP_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setSelectedIcon(icon)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all duration-200 ${
                        selectedIcon === icon
                          ? 'bg-[#2563EB]/20 ring-1 ring-[#2563EB]'
                          : 'hover:bg-[#F1F3F5]'
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
                    className="flex-1 py-2.5 rounded-xl text-sm text-[#64748B] hover:bg-[#F1F3F5] transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleCreateGroup}
                    disabled={!newName.trim()}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[#2563EB] text-white hover:bg-[#2563EB]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    만들기
                  </button>
                </div>
              </div>
            ) : groups.length > 0 ? (
              <div className="px-6 py-3 border-t border-[#E2E8F0]">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-[#64748B] hover:bg-[#F1F3F5] hover:text-[#1A1A2E] transition-colors"
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
