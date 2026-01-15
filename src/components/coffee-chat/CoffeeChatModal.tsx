'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
import { Modal, Button, Avatar } from '@/components/ui';
import { useCoffeeChatStore } from '@/store/coffeeChatStore';
import { useAuthStore } from '@/store/authStore';
import { getUser } from '@/lib/firebase-services';
import { demoUsers } from '@/lib/demo-data';
import { User } from '@/types';

export default function CoffeeChatModal() {
  const { isRequestModalOpen, targetUserId, closeRequestModal } = useCoffeeChatStore();
  const { user: currentUser } = useAuthStore();

  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!targetUserId) return;

      try {
        // 데모 유저인 경우
        if (targetUserId.startsWith('demo-user-')) {
          const demoUser = demoUsers.find(u => u.id === targetUserId);
          if (demoUser) {
            setTargetUser(demoUser);
            return;
          }
        }
        const user = await getUser(targetUserId);
        setTargetUser(user);
      } catch (err) {
        console.error('Error loading user data:', err);
      }
    };

    if (isRequestModalOpen && targetUserId) {
      loadData();
    }
  }, [isRequestModalOpen, targetUserId]);

  const handleSubmit = async () => {
    if (!currentUser || !targetUserId || !message.trim()) return;

    setIsLoading(true);

    // 실제 메세지 전송 로직 (데모용으로 시뮬레이션)
    await new Promise(resolve => setTimeout(resolve, 500));

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
    setMessage('');
    setIsSent(false);
  };

  const handleClose = () => {
    closeRequestModal();
    resetForm();
  };

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
              initial={{ rotate: 0, x: 0, y: 0 }}
              animate={{
                rotate: [0, 15, 15],
                x: [0, 100, 200],
                y: [0, -50, -100],
                opacity: [1, 1, 0],
              }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="inline-block mb-6"
            >
              <Send size={48} className="text-[#00E5FF]" />
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2">메세지를 보냈습니다!</h3>
            <p className="text-[#8B949E]">
              {targetUser?.name}님이 확인하면 알림을 보내드릴게요
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
              <Avatar
                src={targetUser?.profileImage}
                name={targetUser?.name}
                size="lg"
                className="mx-auto mb-3"
              />
              <h3 className="text-lg font-bold text-white">
                {targetUser?.name}님께 메세지 보내기
              </h3>
              {targetUser?.company && (
                <p className="text-sm text-[#8B949E] mt-1">
                  {targetUser.company} · {targetUser.position}
                </p>
              )}
            </div>

            {/* Message */}
            <div className="mb-6">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="메세지를 입력해주세요..."
                maxLength={500}
                className="
                  w-full bg-[#161B22] border border-[#21262D] text-white
                  rounded-xl py-3 px-4 text-sm resize-none
                  focus:outline-none focus:border-[#00E5FF]
                  placeholder:text-[#484F58]
                "
                rows={4}
              />
              <p className="text-xs text-[#484F58] mt-1 text-right">
                {message.length}/500
              </p>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!message.trim()}
              isLoading={isLoading}
              className="w-full"
              size="lg"
              rightIcon={<Send size={18} />}
            >
              보내기
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
