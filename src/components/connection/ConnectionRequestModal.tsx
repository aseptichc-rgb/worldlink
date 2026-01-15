'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Send, Building, Briefcase, ArrowRight } from 'lucide-react';
import { Modal, Button, Avatar } from '@/components/ui';
import { useConnectionRequestStore } from '@/store/connectionRequestStore';
import { useAuthStore } from '@/store/authStore';
import { demoUsers, demoConnections, findDemoConnectionPath } from '@/lib/demo-data';
import { User } from '@/types';

export default function ConnectionRequestModal() {
  const { isRequestModalOpen, targetUserId, closeRequestModal } = useConnectionRequestStore();
  const { user: currentUser } = useAuthStore();

  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [connectionPath, setConnectionPath] = useState<User[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    if (!isRequestModalOpen || !targetUserId) return;

    // 데모 사용자 찾기
    const user = demoUsers.find(u => u.id === targetUserId);
    setTargetUser(user || null);

    // 연결 경로 찾기
    if (user && currentUser) {
      const fromUserId = currentUser.id.startsWith('demo-user-') ? currentUser.id : 'demo-user-1';
      const pathIds = findDemoConnectionPath(fromUserId, targetUserId);
      const pathUsers: User[] = pathIds.map(id => {
        const demoUser = demoUsers.find(u => u.id === id);
        if (demoUser) return demoUser;
        return { id, name: '나', email: '', inviteCode: '', invitesRemaining: 0, coffeeStatus: 'available' as const, keywords: [], createdAt: new Date(), updatedAt: new Date() };
      });
      setConnectionPath(pathUsers);
    }
  }, [isRequestModalOpen, targetUserId, currentUser]);

  const handleSubmit = async () => {
    if (!currentUser || !targetUserId) return;

    setIsLoading(true);

    // 시뮬레이션 (실제로는 Firebase에 저장)
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsSent(true);
    setIsLoading(false);

    // 2초 후 모달 닫기
    setTimeout(() => {
      closeRequestModal();
      resetForm();
    }, 2000);
  };

  const resetForm = () => {
    setTargetUser(null);
    setConnectionPath([]);
    setMessage('');
    setIsSent(false);
  };

  const handleClose = () => {
    closeRequestModal();
    resetForm();
  };

  const connectionDegree = connectionPath.length > 0 ? connectionPath.length - 1 : 2;

  // 중간 연결자 (1촌 친구)
  const middleConnector = connectionPath.length >= 2 ? connectionPath[1] : null;

  return (
    <Modal isOpen={isRequestModalOpen} onClose={handleClose} size="md">
      <AnimatePresence mode="wait">
        {isSent ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="p-8 text-center"
          >
            <motion.div
              initial={{ scale: 1 }}
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 0.5 }}
              className="inline-block mb-6"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#00E5FF] to-[#7C4DFF] flex items-center justify-center mx-auto">
                <UserPlus size={32} className="text-white" />
              </div>
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2">인맥 신청을 보냈습니다!</h3>
            <p className="text-[#8B949E]">
              {middleConnector?.name}님을 통해 {targetUser?.name}님께 전달됩니다
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-6"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <div className="relative inline-block mb-4">
                <Avatar
                  src={targetUser?.profileImage}
                  name={targetUser?.name}
                  size="xl"
                  className="mx-auto"
                />
                <span className="absolute -bottom-1 -right-1 text-xs px-2 py-0.5 rounded-full bg-[#FFB800]/20 text-[#FFB800] font-medium">
                  {connectionDegree}촌
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                {targetUser?.name}
              </h3>
              <div className="flex items-center justify-center gap-2 text-sm text-[#8B949E]">
                <Building size={14} />
                <span>{targetUser?.company}</span>
                <span>·</span>
                <Briefcase size={14} />
                <span>{targetUser?.position}</span>
              </div>
            </div>

            {/* Connection Path */}
            {connectionPath.length > 2 && (
              <div className="mb-6 p-4 bg-[#161B22] rounded-xl">
                <p className="text-xs text-[#8B949E] mb-3">연결 경로</p>
                <div className="flex items-center justify-center gap-2">
                  {connectionPath.map((user, idx) => (
                    <div key={user.id} className="flex items-center gap-2">
                      <div className="flex flex-col items-center">
                        <Avatar
                          src={user.profileImage}
                          name={user.name}
                          size="sm"
                          hasGlow={idx === 0 || idx === connectionPath.length - 1}
                        />
                        <span className="text-[10px] text-[#8B949E] mt-1">
                          {idx === 0 ? '나' : user.name.slice(0, 3)}
                        </span>
                      </div>
                      {idx < connectionPath.length - 1 && (
                        <ArrowRight size={14} className={idx === 0 ? 'text-[#00E5FF]' : 'text-[#7C4DFF]'} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="mb-6 p-4 bg-gradient-to-r from-[#00E5FF]/10 to-[#7C4DFF]/10 rounded-xl border border-[#00E5FF]/20">
              <p className="text-sm text-white mb-1">
                <span className="text-[#00E5FF] font-medium">{middleConnector?.name}</span>님을 통해 연결됩니다
              </p>
              <p className="text-xs text-[#8B949E]">
                {middleConnector?.name}님이 수락하면 {targetUser?.name}님과 1촌이 됩니다
              </p>
            </div>

            {/* Message */}
            <div className="mb-6">
              <p className="text-sm text-[#8B949E] mb-2">소개 메시지 (선택)</p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`안녕하세요! ${targetUser?.name}님과 인맥을 맺고 싶습니다.`}
                maxLength={200}
                className="
                  w-full bg-[#161B22] border border-[#21262D] text-white
                  rounded-xl py-3 px-4 text-sm resize-none
                  focus:outline-none focus:border-[#00E5FF]
                  placeholder:text-[#484F58]
                "
                rows={3}
              />
              <p className="text-xs text-[#484F58] mt-1 text-right">
                {message.length}/200
              </p>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              isLoading={isLoading}
              className="w-full bg-gradient-to-r from-[#00E5FF] to-[#7C4DFF]"
              size="lg"
              leftIcon={<UserPlus size={18} />}
            >
              인맥 신청 보내기
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
