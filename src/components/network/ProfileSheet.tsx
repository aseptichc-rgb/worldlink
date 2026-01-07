'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Coffee, Building, Briefcase } from 'lucide-react';
import { BottomSheet, Avatar, Tag, Button } from '@/components/ui';
import { useNetworkStore } from '@/store/networkStore';
import { useCoffeeChatStore } from '@/store/coffeeChatStore';
import { useAuthStore } from '@/store/authStore';
import { findConnectionPath, getUser } from '@/lib/firebase-services';
import { User } from '@/types';

export default function ProfileSheet() {
  const { selectedNode, setSelectedNode } = useNetworkStore();
  const { openRequestModal } = useCoffeeChatStore();
  const { user: currentUser } = useAuthStore();

  const [connectionPath, setConnectionPath] = useState<User[]>([]);
  const [isLoadingPath, setIsLoadingPath] = useState(false);

  useEffect(() => {
    const loadConnectionPath = async () => {
      if (!selectedNode || !currentUser) return;

      setIsLoadingPath(true);
      try {
        const pathIds = await findConnectionPath(currentUser.id, selectedNode.id);
        const pathUsers: User[] = [];

        for (const userId of pathIds) {
          const user = await getUser(userId);
          if (user) pathUsers.push(user);
        }

        setConnectionPath(pathUsers);
      } catch (error) {
        console.error('Error loading connection path:', error);
      } finally {
        setIsLoadingPath(false);
      }
    };

    loadConnectionPath();
  }, [selectedNode, currentUser]);

  const handleCoffeeChatClick = () => {
    if (selectedNode) {
      openRequestModal(selectedNode.id);
    }
  };

  if (!selectedNode) return null;

  return (
    <BottomSheet
      isOpen={!!selectedNode}
      onClose={() => setSelectedNode(null)}
    >
      <div className="px-6 pb-6">
        {/* Profile Header */}
        <div className="flex items-start gap-4 mb-6">
          <Avatar
            src={selectedNode.profileImage}
            name={selectedNode.name}
            size="xl"
            hasGlow={selectedNode.degree === 1}
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white truncate">
              {selectedNode.name}
            </h2>
            <div className="flex items-center gap-2 text-[#8B949E] mt-1">
              <Building size={14} />
              <span className="truncate">{selectedNode.company}</span>
            </div>
            <div className="flex items-center gap-2 text-[#8B949E] mt-0.5">
              <Briefcase size={14} />
              <span className="truncate">{selectedNode.position}</span>
            </div>
          </div>
        </div>

        {/* Connection Path (Trust Path) */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-[#8B949E] mb-3">연결 경로</h3>
          {isLoadingPath ? (
            <div className="flex items-center justify-center py-4">
              <div className="spinner w-6 h-6" />
            </div>
          ) : connectionPath.length > 0 ? (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
              {connectionPath.map((user, index) => (
                <div key={user.id} className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex flex-col items-center">
                    <Avatar
                      src={user.profileImage}
                      name={user.name}
                      size="sm"
                      hasGlow={index === 0 || index === connectionPath.length - 1}
                    />
                    <span className="text-xs text-[#8B949E] mt-1 max-w-[60px] truncate">
                      {index === 0 ? '나' : user.name}
                    </span>
                  </div>
                  {index < connectionPath.length - 1 && (
                    <div className={`
                      w-8 h-0.5 flex-shrink-0
                      ${index === 0 ? 'bg-[#00E5FF]' : 'bg-[#7C4DFF]'}
                    `} />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#484F58] text-sm">연결 경로를 찾을 수 없습니다</p>
          )}
        </div>

        {/* Keywords */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-[#8B949E] mb-3">관심 분야</h3>
          <div className="flex flex-wrap gap-2">
            {selectedNode.keywords.map((keyword) => {
              const isMatching = currentUser?.keywords.includes(keyword);
              return (
                <Tag
                  key={keyword}
                  label={keyword}
                  isHighlighted={isMatching}
                  size="sm"
                />
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#161B22] rounded-xl p-4">
            <p className="text-2xl font-bold text-white">{selectedNode.connectionCount}</p>
            <p className="text-sm text-[#8B949E]">연결된 인맥</p>
          </div>
          <div className="bg-[#161B22] rounded-xl p-4">
            <p className="text-2xl font-bold text-[#00E5FF]">
              {selectedNode.degree === 1 ? '1촌' : `${selectedNode.degree}촌`}
            </p>
            <p className="text-sm text-[#8B949E]">연결 거리</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            leftIcon={<Star size={18} />}
          >
            관심 인맥
          </Button>
          <Button
            className="flex-1"
            leftIcon={<Coffee size={18} />}
            onClick={handleCoffeeChatClick}
          >
            커피챗 신청
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
