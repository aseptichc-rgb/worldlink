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
            className="fixed inset-0 bg-[rgba(0,0,0,0.3)] backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed top-0 left-0 bottom-0 w-80 bg-white border-r border-[#E2E8F0] z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-[#E2E8F0]">
              <button
                onClick={handleBack}
                className="p-1.5 rounded-lg hover:bg-[#F1F3F5] transition-colors"
              >
                <ArrowLeft size={18} className="text-[#64748B]" />
              </button>
              <h2 className="text-lg font-semibold text-[#1A1A2E]">그룹 상세</h2>
              <button
                onClick={closeGroupDetailPanel}
                className="p-1.5 rounded-lg hover:bg-[#F1F3F5] transition-colors"
              >
                <X size={18} className="text-[#64748B]" />
              </button>
            </div>

            {/* Group Info */}
            <div className="p-6 border-b border-[#E2E8F0]">
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={20}
                    className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg px-3 py-2 text-base text-[#1A1A2E] focus:outline-none focus:border-[#2563EB] transition-colors"
                    autoFocus
                  />
                  <div>
                    <p className="text-sm text-[#64748B] mb-2">색상</p>
                    <div className="flex flex-wrap gap-2">
                      {GROUP_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setEditColor(color)}
                          className={`w-7 h-7 rounded-full transition-all ${
                            editColor === color
                              ? 'ring-2 ring-[#1A1A2E] ring-offset-1 ring-offset-white'
                              : ''
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-[#64748B] mb-2">아이콘</p>
                    <div className="flex flex-wrap gap-1.5">
                      {GROUP_ICONS.map((icon) => (
                        <button
                          key={icon}
                          onClick={() => setEditIcon(icon)}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${
                            editIcon === icon
                              ? 'bg-[#2563EB]/20 ring-1 ring-[#2563EB]'
                              : 'hover:bg-[#F1F3F5]'
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
                      className="flex-1 py-2 rounded-lg text-sm text-[#64748B] hover:bg-[#F1F3F5] transition-colors"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={!editName.trim()}
                      className="flex-1 py-2 rounded-lg text-sm font-medium bg-[#2563EB] text-white hover:bg-[#2563EB]/80 disabled:opacity-50 transition-colors"
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
                    <h3 className="text-xl font-bold text-[#1A1A2E]">{group.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="text-sm text-[#64748B]">
                        {memberNodes.length}명의 인맥
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleStartEdit}
                      className="p-2 rounded-lg hover:bg-[#F1F3F5] transition-colors"
                    >
                      <Pencil size={14} className="text-[#64748B]" />
                    </button>
                    <button
                      onClick={handleDelete}
                      className="p-2 rounded-lg hover:bg-[#F1F3F5] transition-colors"
                    >
                      <Trash2 size={14} className="text-[#EF4444]" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Members List */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-[#64748B] uppercase tracking-wider">
                    멤버 ({memberNodes.length})
                  </h4>
                  <button
                    onClick={openAddMembersModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[#2563EB] hover:bg-[#2563EB]/10 transition-colors"
                  >
                    <Plus size={14} />
                    인맥 추가
                  </button>
                </div>

                {memberNodes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 rounded-xl bg-[#F1F3F5] flex items-center justify-center mx-auto mb-4">
                      <Users size={24} className="text-[#94A3B8]" />
                    </div>
                    <p className="text-[#64748B] text-base mb-1">멤버가 없습니다</p>
                    <p className="text-[#94A3B8] text-sm mb-4">
                      이 그룹에 인맥을 추가해보세요
                    </p>
                    <button
                      onClick={openAddMembersModal}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563EB]/10 text-[#2563EB] text-sm font-medium hover:bg-[#2563EB]/20 transition-colors"
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
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F1F3F5] transition-colors group"
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
                            <p className="text-base text-[#1A1A2E] truncate">
                              {node.name}
                            </p>
                            <p className="text-xs text-[#64748B] truncate">
                              {node.company} {node.position && `· ${node.position}`}
                            </p>
                          </div>
                        </button>
                        <button
                          onClick={() => handleRemoveMember(node.id)}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[#F1F3F5] transition-all"
                          title="그룹에서 제거"
                        >
                          <UserMinus size={14} className="text-[#EF4444]" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Auto-connection Info */}
            {memberNodes.length > 0 && (
              <div className="px-4 py-3 bg-[#10B981]/10 border-t border-[#10B981]/20">
                <div className="flex items-center gap-2 text-xs text-[#10B981]">
                  <Users size={12} />
                  <span>그룹 멤버끼리는 자동으로 서로 인맥이 됩니다</span>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="p-4 border-t border-[#E2E8F0] space-y-2">
              <button
                onClick={() => detailGroupId && openGroupInviteModal(detailGroupId)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-white bg-[#2563EB] hover:bg-[#2563EB]/80 transition-colors"
              >
                <Share2 size={16} />
                그룹 전체 초대하기
              </button>
              <button
                onClick={openAddMembersModal}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-[#2563EB] bg-[#2563EB]/10 hover:bg-[#2563EB]/20 transition-colors"
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
