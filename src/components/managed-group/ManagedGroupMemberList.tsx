'use client';

import { useState, useEffect } from 'react';
import { Crown, X, Loader2 } from 'lucide-react';
import { ManagedGroupMember } from '@/types';
import { getUser } from '@/lib/firebase-services';
import { User } from '@/types';

interface ManagedGroupMemberListProps {
  members: ManagedGroupMember[];
  ownerId: string;
  currentUserId: string;
  onRemoveMember: (userId: string) => void;
}

interface MemberInfo extends ManagedGroupMember {
  user?: User;
}

export default function ManagedGroupMemberList({
  members,
  ownerId,
  currentUserId,
  onRemoveMember,
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
      // 그룹장을 맨 위로
      infos.sort((a, b) => {
        if (a.userId === ownerId) return -1;
        if (b.userId === ownerId) return 1;
        return 0;
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

        return (
          <div
            key={info.userId}
            className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#161B22] transition-colors"
          >
            {/* Avatar */}
            {info.user?.profileImage ? (
              <img
                src={info.user.profileImage}
                alt={name}
                className="w-10 h-10 rounded-full object-cover shrink-0"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ backgroundColor: isMemberOwner ? '#FFA657' : '#58A6FF' }}
              >
                {initials}
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm text-[#F0F6FC] font-medium truncate">{name}</p>
                {isMemberOwner && (
                  <span className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 bg-[#FFA657]/15 text-[#FFA657] text-[10px] font-medium rounded-full">
                    <Crown size={9} />
                    그룹장
                  </span>
                )}
                {isSelf && !isMemberOwner && (
                  <span className="shrink-0 text-[10px] text-[#484F58]">나</span>
                )}
              </div>
              <p className="text-xs text-[#8B949E] truncate">
                {[info.user?.company, info.user?.position].filter(Boolean).join(' · ') || '정보 없음'}
              </p>
            </div>

            {/* Remove Button (owner only, not for self/owner) */}
            {isOwner && !isMemberOwner && !isSelf && (
              <button
                onClick={() => handleRemove(info.userId)}
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
