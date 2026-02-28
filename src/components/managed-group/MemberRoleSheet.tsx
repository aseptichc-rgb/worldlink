'use client';

import { useState, useEffect } from 'react';
import { Crown, Shield, User as UserIcon, Loader2 } from 'lucide-react';
import { ManagedGroupMember, ManagedGroupRole, User } from '@/types';
import { useManagedGroupStore } from '@/store/managedGroupStore';
import BottomSheet from '@/components/ui/BottomSheet';

interface MemberRoleSheetProps {
  isOpen: boolean;
  onClose: () => void;
  member: (ManagedGroupMember & { user?: User }) | null;
  groupId: string;
}

const ROLE_OPTIONS: {
  role: ManagedGroupRole;
  label: string;
  description: string;
  color: string;
  icon: typeof Crown;
}[] = [
  {
    role: 'president',
    label: '회장',
    description: '모임의 대표 (1명만 가능)',
    color: '#FFD700',
    icon: Crown,
  },
  {
    role: 'executive',
    label: '회장단',
    description: '운영진 / 임원',
    color: '#58A6FF',
    icon: Shield,
  },
  {
    role: 'member',
    label: '일반 멤버',
    description: '모임 멤버',
    color: '#8B949E',
    icon: UserIcon,
  },
];

export default function MemberRoleSheet({
  isOpen,
  onClose,
  member,
  groupId,
}: MemberRoleSheetProps) {
  const { updateMemberRole } = useManagedGroupStore();

  const [selectedRole, setSelectedRole] = useState<ManagedGroupRole>('member');
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (member) {
      setSelectedRole(member.role === 'admin' ? 'member' : member.role);
      setTitle(member.title || '');
    }
  }, [member]);

  if (!member) return null;

  const name = member.user?.name || '알 수 없음';

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateMemberRole(
        groupId,
        member.userId,
        selectedRole,
        selectedRole !== 'member' ? title.trim() || undefined : undefined
      );
      onClose();
    } catch {
      // error handled in store
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    selectedRole !== (member.role === 'admin' ? 'member' : member.role) ||
    title.trim() !== (member.title || '');

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="px-5 pb-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          {member.user?.profileImage ? (
            <img
              src={member.user.profileImage}
              alt={name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#58A6FF] flex items-center justify-center text-white font-bold text-lg">
              {name.charAt(0)}
            </div>
          )}
          <div>
            <p className="text-base font-bold text-[#F0F6FC]">{name}</p>
            <p className="text-xs text-[#8B949E]">
              {[member.user?.company, member.user?.position].filter(Boolean).join(' · ') || '정보 없음'}
            </p>
          </div>
        </div>

        {/* Role Selection */}
        <p className="text-sm font-semibold text-[#F0F6FC] mb-3">역할 설정</p>
        <div className="space-y-2 mb-4">
          {ROLE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedRole === option.role;
            return (
              <button
                key={option.role}
                onClick={() => setSelectedRole(option.role)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-[' + option.color + '] bg-[' + option.color + ']/10'
                    : 'border-[#30363D] bg-[#0D1117] hover:border-[#484F58]'
                }`}
                style={isSelected ? { borderColor: option.color, backgroundColor: option.color + '15' } : {}}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: option.color + '20' }}
                >
                  <Icon size={16} style={{ color: option.color }} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-[#F0F6FC]">{option.label}</p>
                  <p className="text-xs text-[#8B949E]">{option.description}</p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected ? '' : 'border-[#30363D]'
                  }`}
                  style={isSelected ? { borderColor: option.color } : {}}
                >
                  {isSelected && (
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Title Input */}
        {selectedRole !== 'member' && (
          <div className="mb-5">
            <label className="block text-xs text-[#8B949E] mb-2">
              직책명 (선택)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 20))}
              placeholder={selectedRole === 'president' ? '회장' : '예: 부회장, 감사, 총무'}
              className="w-full px-4 py-3 bg-[#0D1117] border border-[#30363D] rounded-xl text-white placeholder-[#484F58] focus:outline-none focus:border-[#58A6FF] text-sm"
            />
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="w-full py-3 bg-[#58A6FF] text-[#0D1117] text-sm font-bold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {isSaving && <Loader2 size={16} className="animate-spin" />}
          저장
        </button>
      </div>
    </BottomSheet>
  );
}
