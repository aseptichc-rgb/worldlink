'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Pencil, Trash2, Check, Filter } from 'lucide-react';
import { useGroupStore, GROUP_COLORS, GROUP_ICONS } from '@/store/groupStore';

export default function GroupManagementPanel() {
  const {
    groups,
    memberships,
    isGroupPanelOpen,
    setGroupPanelOpen,
    activeGroupFilter,
    setActiveGroupFilter,
    createGroup,
    updateGroup,
    deleteGroup,
    getNodesInGroup,
  } = useGroupStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(GROUP_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(GROUP_ICONS[0]);

  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editIcon, setEditIcon] = useState('');

  const handleCreateGroup = () => {
    if (!newName.trim()) return;
    createGroup(newName.trim(), selectedColor, selectedIcon);
    setNewName('');
    setSelectedColor(GROUP_COLORS[0]);
    setSelectedIcon(GROUP_ICONS[0]);
    setShowCreateForm(false);
  };

  const startEdit = (group: { id: string; name: string; color: string; icon: string }) => {
    setEditingGroupId(group.id);
    setEditName(group.name);
    setEditColor(group.color);
    setEditIcon(group.icon);
  };

  const handleSaveEdit = () => {
    if (!editingGroupId || !editName.trim()) return;
    updateGroup(editingGroupId, { name: editName.trim(), color: editColor, icon: editIcon });
    setEditingGroupId(null);
  };

  const handleDelete = (groupId: string) => {
    deleteGroup(groupId);
    if (editingGroupId === groupId) setEditingGroupId(null);
  };

  return (
    <AnimatePresence>
      {isGroupPanelOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setGroupPanelOpen(false)}
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
            <div className="flex items-center justify-between p-6 pb-4">
              <h2 className="text-lg font-semibold text-white">그룹 관리</h2>
              <button
                onClick={() => setGroupPanelOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#30363D] transition-colors"
              >
                <X size={18} className="text-[#8B949E]" />
              </button>
            </div>

            {/* Active Filter Indicator */}
            {activeGroupFilter && (
              <div className="mx-6 mb-3 px-3 py-2 rounded-xl bg-[#58A6FF]/10 border border-[#58A6FF]/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter size={12} className="text-[#58A6FF]" />
                  <span className="text-sm text-[#58A6FF]">
                    {groups.find(g => g.id === activeGroupFilter)?.name} 필터 적용 중
                  </span>
                </div>
                <button
                  onClick={() => setActiveGroupFilter(null)}
                  className="text-sm text-[#8B949E] hover:text-white transition-colors"
                >
                  해제
                </button>
              </div>
            )}

            {/* Group List */}
            <div className="flex-1 overflow-y-auto px-6">
              {groups.length === 0 && !showCreateForm ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-xl bg-[#1C2333] flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🏷️</span>
                  </div>
                  <p className="text-[#8B949E] text-base mb-1">아직 그룹이 없습니다</p>
                  <p className="text-[#484F58] text-sm mb-4">인맥을 그룹으로 분류해보세요</p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#58A6FF]/10 text-[#58A6FF] text-sm font-medium hover:bg-[#58A6FF]/20 transition-colors"
                  >
                    <Plus size={14} />
                    첫 그룹 만들기
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {groups.map((group) => {
                    const memberCount = getNodesInGroup(group.id).length;
                    const isActive = activeGroupFilter === group.id;

                    if (editingGroupId === group.id) {
                      return (
                        <div key={group.id} className="p-3 rounded-xl bg-[#1C2333] border border-[#30363D] space-y-3">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            maxLength={20}
                            className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-3 py-2 text-base text-white focus:outline-none focus:border-[#58A6FF] transition-colors"
                            autoFocus
                          />
                          <div className="flex flex-wrap gap-1.5">
                            {GROUP_COLORS.map((color) => (
                              <button
                                key={color}
                                onClick={() => setEditColor(color)}
                                className={`w-6 h-6 rounded-full transition-all ${
                                  editColor === color ? 'ring-2 ring-white ring-offset-1 ring-offset-[#1C2333]' : ''
                                }`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {GROUP_ICONS.map((icon) => (
                              <button
                                key={icon}
                                onClick={() => setEditIcon(icon)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${
                                  editIcon === icon ? 'bg-[#58A6FF]/20 ring-1 ring-[#58A6FF]' : 'hover:bg-[#30363D]'
                                }`}
                              >
                                {icon}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingGroupId(null)}
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
                      );
                    }

                    return (
                      <div
                        key={group.id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group/item ${
                          isActive
                            ? 'bg-[#58A6FF]/10 border border-[#58A6FF]/30'
                            : 'hover:bg-[#1C2333] border border-transparent'
                        }`}
                        onClick={() => {
                          setActiveGroupFilter(isActive ? null : group.id);
                          setGroupPanelOpen(false);
                        }}
                      >
                        <span className="text-lg flex-shrink-0">{group.icon}</span>
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: group.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-base text-white block truncate">{group.name}</span>
                          <span className="text-[10px] text-[#484F58]">{memberCount}명</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(group);
                            }}
                            className="p-1.5 rounded-lg hover:bg-[#30363D] transition-colors"
                          >
                            <Pencil size={12} className="text-[#8B949E]" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(group.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-[#30363D] transition-colors"
                          >
                            <Trash2 size={12} className="text-[#F85149]" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Create Group Form / Button */}
            <div className="p-6 pt-3 border-t border-[#30363D]">
              {showCreateForm ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="그룹 이름"
                    maxLength={20}
                    className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl px-4 py-2.5 text-base text-white placeholder:text-[#484F58] focus:outline-none focus:border-[#58A6FF] transition-colors"
                    autoFocus
                  />
                  <div>
                    <p className="text-sm text-[#8B949E] mb-1.5">색상</p>
                    <div className="flex flex-wrap gap-2">
                      {GROUP_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`w-7 h-7 rounded-full transition-all ${
                            selectedColor === color
                              ? 'ring-2 ring-white ring-offset-2 ring-offset-[#161B22] scale-110'
                              : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-[#8B949E] mb-1.5">아이콘</p>
                    <div className="flex flex-wrap gap-1.5">
                      {GROUP_ICONS.map((icon) => (
                        <button
                          key={icon}
                          onClick={() => setSelectedIcon(icon)}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                            selectedIcon === icon
                              ? 'bg-[#58A6FF]/20 ring-1 ring-[#58A6FF]'
                              : 'hover:bg-[#1C2333]'
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
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
              ) : (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-[#58A6FF] bg-[#58A6FF]/10 hover:bg-[#58A6FF]/20 transition-colors"
                >
                  <Plus size={16} />
                  새 그룹 만들기
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
