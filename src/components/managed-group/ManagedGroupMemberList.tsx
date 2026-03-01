'use client';

import { useState, useEffect } from 'react';
import { Crown, Shield, X, Loader2, Edit3 } from 'lucide-react';
import { ManagedGroupMember } from '@/types';
import { getUser } from '@/lib/firebase-services';
import { User } from '@/types';

export interface MemberInfo extends ManagedGroupMember {
  user?: User;
}

interface ManagedGroupMemberListProps {
  members: ManagedGroupMember[];
  ownerId: string;
  currentUserId: string;
  onRemoveMember: (userId: string) => void;
  onMemberTap?: (member: MemberInfo) => void;
  onMemberClick?: (member: MemberInfo) => void;
  onRoleEdit?: (member: MemberInfo) => void;
}

const ROLE_PRIORITY: Record<string, number> = {
  president: 0,
  admin: 1,
  executive: 2,
  member: 3,
};

export default function ManagedGroupMemberList({
  members,
  ownerId,
  currentUserId,
  onRemoveMember,
  onMemberTap,
  onMemberClick,
  onRoleEdit,
}: ManagedGroupMemberListProps) {
  const [memberInfos, setMemberInfos] = useState<MemberInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const isOwner = currentUserId === ownerId;

  useEffect(() => {
    const loadMembers = async () => {
      setIsLoading(true);
      const infos = await Promise.all(
        members.map(async (member) => {
          try {
            const user = await getUser(member.userId);
            return { ...member, user: user || undefined };
          } catch {
            return { ...member };
          }
        })
      );
      // 역할 기반 정렬: 회장 → 그룹장 → 회장단 → 일반 멤버
      infos.sort((a, b) => {
        if (a.userId === ownerId && a.role !== 'president') return -1;
        if (b.userId === ownerId && b.role !== 'president') return 1;
        const aPriority = ROLE_PRIORITY[a.role] ?? 3;
        const bPriority = ROLE_PRIORITY[b.role] ?? 3;
        return aPriority - bPriority;
      });
      setMemberInfos(infos);
      setIsLoading(false);
    };
    loadMembers();
  }, [members, ownerId]);

  const handleRemove = (userId: string) => {
    if (confirmRemoveId === userId) {
      onRemoveMember(userId);
      setConfirmRemoveId(null);
    } else {
      setConfirmRemoveId(userId);
      setTimeout(() => setConfirmRemoveId(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={24} className="animate-spin text-[#58A6FF]" />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {memberInfos.map((info) => {
        const isMemberOwner = info.userId === ownerId;
        const isSelf = info.userId === currentUserId;
        const name = info.user?.name || '알 수 없음';
        const initials = name.charAt(0);

        const avatarColor =
          info.role === 'president' ? '#FFD700' :
          isMemberOwner ? '#FFA657' :
          info.role === 'executive' ? '#58A6FF' :
          '#58A6FF';

        const handleClick = () => {
          if (onMemberClick) {
            onMemberClick(info);
          } else if (onMemberTap) {
            onMemberTap(info);
          }
        };

        const isClickable = onMemberClick || onMemberTap;

        return (
          <div
            key={info.userId}
            onClick={handleClick}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
              isClickable ? 'cursor-pointer hover:bg-[#1C2333]' : 'hover:bg-[#161B22]'
            }`}
          >
            {/* Avatar */}
            {info.user?.profileImage ? (
              <img
                src={info.user.profileImage}
                alt={name}
                className="w-10 h-10 rounded-full object-cover shrink-0"
                style={info.role === 'president' ? { border: '2px solid #FFD700' } : undefined}
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ backgroundColor: avatarColor }}
              >
                {initials}
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm text-[#F0F6FC] font-medium truncate">{name}</p>
                {info.role === 'president' && (
                  <span className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 bg-[#FFD700]/15 text-[#FFD700] text-[10px] font-medium rounded-full">
                    <Crown size={9} />
                    {info.title || '회장'}
                  </span>
                )}
                {info.role === 'executive' && (
                  <span className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 bg-[#58A6FF]/15 text-[#58A6FF] text-[10px] font-medium rounded-full">
                    <Shield size={9} />
                    {info.title || '회장단'}
                  </span>
                )}
                {isMemberOwner && info.role !== 'president' && (
                  <span className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 bg-[#FFA657]/15 text-[#FFA657] text-[10px] font-medium rounded-full">
                    <Crown size={9} />
                    그룹장
                  </span>
                )}
                {isSelf && !isMemberOwner && info.role === 'member' && (
                  <span className="shrink-0 text-[10px] text-[#484F58]">나</span>
                )}
              </div>
              <p className="text-xs text-[#8B949E] truncate">
                {[info.user?.company, info.user?.position].filter(Boolean).join(' · ') || '정보 없음'}
              </p>
            </div>

            {/* Role Edit Button (for president, not for self) */}
            {onRoleEdit && !isSelf && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRoleEdit(info);
                }}
                className="shrink-0 p-1.5 text-[#484F58] hover:text-[#58A6FF] hover:bg-[#58A6FF]/10 rounded-lg transition-all"
                title="역할 편집"
              >
                <Edit3 size={14} />
              </button>
            )}

            {/* Remove Button (owner only, not for self/owner) */}
            {isOwner && !isMemberOwner && !isSelf && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(info.userId);
                }}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  confirmRemoveId === info.userId
                    ? 'bg-[#F85149]/20 text-[#F85149] border border-[#F85149]/30'
                    : 'text-[#484F58] hover:text-[#F85149] hover:bg-[#F85149]/10'
                }`}
              >
                {confirmRemoveId === info.userId ? '확인' : <X size={16} />}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
