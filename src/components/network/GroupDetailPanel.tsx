'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Pencil, Trash2, Check, ArrowLeft, UserMinus, Users, Share2 } from 'lucide-react';
import { useGroupStore, GROUP_COLORS, GROUP_ICONS } from '@/store/groupStore';
import { useNetworkStore } from '@/store/networkStore';
import { Avatar } from '@/components/ui';

export default function GroupDetailPanel() {
  const {
    groups,
    isGroupDetailPanelOpen,
    detailGroupId,
    closeGroupDetailPanel,
    openAddMembersModal,
    openGroupInviteModal,
    getNodesInGroup,
    removeNodeFromGroup,
    updateGroup,
    deleteGroup,
    setGroupPanelOpen,
  } = useGroupStore();

  const { nodes, setSelectedNode, setFocusedNodeId } = useNetworkStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editIcon, setEditIcon] = useState('');

  const group = groups.find((g) => g.id === detailGroupId);
  const memberNodeIds = detailGroupId ? getNodesInGroup(detailGroupId) : [];
  const memberNodes = nodes.filter((n) => memberNodeIds.includes(n.id));

  const handleStartEdit = () => {
    if (!group) return;
    setEditName(group.name);
    setEditColor(group.color);
    setEditIcon(group.icon);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!detailGroupId || !editName.trim()) return;
    updateGroup(detailGroupId, {
      name: editName.trim(),
      color: editColor,
      icon: editIcon,
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!detailGroupId) return;
    deleteGroup(detailGroupId);
    closeGroupDetailPanel();
  };

  const handleRemoveMember = (nodeId: string) => {
    if (!detailGroupId) return;
    removeNodeFromGroup(nodeId, detailGroupId);
  };

  const handleMemberClick = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      setSelectedNode(node);
      setFocusedNodeId(nodeId);
      closeGroupDetailPanel();
    }
  };

  const handleBack = () => {
    closeGroupDetailPanel();
    setGroupPanelOpen(true);
  };

  return (
    <AnimatePresence>
      {isGroupDetailPanelOpen && group && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeGroupDetailPanel}
            className="fixed inset-0 bg-[#0D1117]/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed top-0 left-0 bottom-0 w-80 bg-[#161B22] border-r border-[#30363D] z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-[#30363D]">
              <button
                onClick={handleBack}
                className="p-1.5 rounded-lg hover:bg-[#30363D] transition-colors"
              >
                <ArrowLeft size={18} className="text-[#8B949E]" />
              </button>
              <h2 className="text-lg font-semibold text-white">그룹 상세</h2>
              <button
                onClick={closeGroupDetailPanel}
                className="p-1.5 rounded-lg hover:bg-[#30363D] transition-colors"
              >
                <X size={18} className="text-[#8B949E]" />
              </button>
            </div>

            {/* Group Info */}
            <div className="p-6 border-b border-[#30363D]">
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={20}
                    className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-3 py-2 text-base text-white focus:outline-none focus:border-[#58A6FF] transition-colors"
                    autoFocus
                  />
                  <div>
                    <p className="text-sm text-[#8B949E] mb-2">색상</p>
                    <div className="flex flex-wrap gap-2">
                      {GROUP_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setEditColor(color)}
                          className={`w-7 h-7 rounded-full transition-all ${
                            editColor === color
                              ? 'ring-2 ring-white ring-offset-1 ring-offset-[#161B22]'
                              : ''
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-[#8B949E] mb-2">아이콘</p>
                    <div className="flex flex-wrap gap-1.5">
                      {GROUP_ICONS.map((icon) => (
                        <button
                          key={icon}
                          onClick={() => setEditIcon(icon)}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${
                            editIcon === icon
                              ? 'bg-[#58A6FF]/20 ring-1 ring-[#58A6FF]'
                              : 'hover:bg-[#30363D]'
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-2 rounded-lg text-sm text-[#8B949E] hover:bg-[#30363D] transition-colors"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={!editName.trim()}
                      className="flex-1 py-2 rounded-lg text-sm font-medium bg-[#58A6FF] text-white hover:bg-[#58A6FF]/80 disabled:opacity-50 transition-colors"
                    >
                      저장
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: group.color + '20' }}
                  >
                    {group.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">{group.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="text-sm text-[#8B949E]">
                        {memberNodes.length}명의 인맥
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleStartEdit}
                      className="p-2 rounded-lg hover:bg-[#30363D] transition-colors"
                    >
                      <Pencil size={14} className="text-[#8B949E]" />
                    </button>
                    <button
                      onClick={handleDelete}
                      className="p-2 rounded-lg hover:bg-[#30363D] transition-colors"
                    >
                      <Trash2 size={14} className="text-[#F85149]" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Members List */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-[#8B949E] uppercase tracking-wider">
                    멤버 ({memberNodes.length})
                  </h4>
                  <button
                    onClick={openAddMembersModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[#58A6FF] hover:bg-[#58A6FF]/10 transition-colors"
                  >
                    <Plus size={14} />
                    인맥 추가
                  </button>
                </div>

                {memberNodes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 rounded-xl bg-[#1C2333] flex items-center justify-center mx-auto mb-4">
                      <Users size={24} className="text-[#484F58]" />
                    </div>
                    <p className="text-[#8B949E] text-base mb-1">멤버가 없습니다</p>
                    <p className="text-[#484F58] text-sm mb-4">
                      이 그룹에 인맥을 추가해보세요
                    </p>
                    <button
                      onClick={openAddMembersModal}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#58A6FF]/10 text-[#58A6FF] text-sm font-medium hover:bg-[#58A6FF]/20 transition-colors"
                    >
                      <Plus size={14} />
                      인맥 추가하기
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {memberNodes.map((node) => (
                      <div
                        key={node.id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#1C2333] transition-colors group"
                      >
                        <button
                          onClick={() => handleMemberClick(node.id)}
                          className="flex items-center gap-3 flex-1 min-w-0"
                        >
                          <Avatar
                            src={node.profileImage}
                            name={node.name}
                            size="sm"
                          />
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-base text-white truncate">
                              {node.name}
                            </p>
                            <p className="text-xs text-[#8B949E] truncate">
                              {node.company} {node.position && `· ${node.position}`}
                            </p>
                          </div>
                        </button>
                        <button
                          onClick={() => handleRemoveMember(node.id)}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[#30363D] transition-all"
                          title="그룹에서 제거"
                        >
                          <UserMinus size={14} className="text-[#F85149]" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Auto-connection Info */}
            {memberNodes.length > 0 && (
              <div className="px-4 py-3 bg-[#3FB950]/10 border-t border-[#3FB950]/20">
                <div className="flex items-center gap-2 text-xs text-[#3FB950]">
                  <Users size={12} />
                  <span>그룹 멤버끼리는 자동으로 서로 인맥이 됩니다</span>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="p-4 border-t border-[#30363D] space-y-2">
              <button
                onClick={() => detailGroupId && openGroupInviteModal(detailGroupId)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-white bg-[#58A6FF] hover:bg-[#58A6FF]/80 transition-colors"
              >
                <Share2 size={16} />
                그룹 전체 초대하기
              </button>
              <button
                onClick={openAddMembersModal}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-[#58A6FF] bg-[#58A6FF]/10 hover:bg-[#58A6FF]/20 transition-colors"
              >
                <Plus size={16} />
                내 인맥 추가하기
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
