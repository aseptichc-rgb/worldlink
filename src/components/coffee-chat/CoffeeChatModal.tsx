'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Handshake, Briefcase, Lightbulb, Coffee, Send, Calendar, Clock } from 'lucide-react';
import { Modal, Button, Avatar } from '@/components/ui';
import { useCoffeeChatStore } from '@/store/coffeeChatStore';
import { useAuthStore } from '@/store/authStore';
import { getUser, getUserTimeSlots, createCoffeeChatRequest } from '@/lib/firebase-services';
import { User, TimeSlot, CoffeeChatRequest } from '@/types';
import { format, addDays, setHours, setMinutes } from 'date-fns';
import { ko } from 'date-fns/locale';

const purposes = [
  { id: 'collaboration', label: '협업 제안', icon: Handshake },
  { id: 'hiring', label: '채용/이직', icon: Briefcase },
  { id: 'insight', label: '인사이트 공유', icon: Lightbulb },
  { id: 'networking', label: '그냥 친해지고 싶어요', icon: Coffee },
] as const;

export default function CoffeeChatModal() {
  const { isRequestModalOpen, targetUserId, closeRequestModal } = useCoffeeChatStore();
  const { user: currentUser } = useAuthStore();

  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedPurpose, setSelectedPurpose] = useState<typeof purposes[number]['id'] | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!targetUserId) return;

      try {
        const user = await getUser(targetUserId);
        setTargetUser(user);

        const slots = await getUserTimeSlots(targetUserId);
        setAvailableSlots(slots);
      } catch (err) {
        console.error('Error loading user data:', err);
      }
    };

    if (isRequestModalOpen && targetUserId) {
      loadData();
    }
  }, [isRequestModalOpen, targetUserId]);

  const handleSubmit = async () => {
    if (!currentUser || !targetUserId || !selectedPurpose || !selectedSlot) return;

    setIsLoading(true);
    setError(null);

    try {
      // Calculate scheduled date based on slot
      const today = new Date();
      let scheduledDate = today;

      // Find next occurrence of the day
      const daysUntilSlot = (selectedSlot.dayOfWeek - today.getDay() + 7) % 7;
      scheduledDate = addDays(today, daysUntilSlot || 7);

      // Set time
      const [hours, minutes] = selectedSlot.startTime.split(':').map(Number);
      scheduledDate = setHours(setMinutes(scheduledDate, minutes), hours);

      await createCoffeeChatRequest({
        fromUserId: currentUser.id,
        toUserId: targetUserId,
        slotId: selectedSlot.id,
        purpose: selectedPurpose,
        message,
        status: 'pending',
        scheduledDate,
      });

      setIsSent(true);

      // Close modal after animation
      setTimeout(() => {
        closeRequestModal();
        resetForm();
      }, 2000);
    } catch (err) {
      console.error('Error sending request:', err);
      setError('요청을 보내는 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTargetUser(null);
    setAvailableSlots([]);
    setSelectedPurpose(null);
    setSelectedSlot(null);
    setMessage('');
    setIsSent(false);
    setError(null);
  };

  const handleClose = () => {
    closeRequestModal();
    resetForm();
  };

  const getDayName = (day: number) => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[day];
  };

  // Mock slots for demo
  const mockSlots: TimeSlot[] = [
    { id: '1', userId: targetUserId || '', dayOfWeek: 1, startTime: '10:00', endTime: '11:00', isRecurring: true, isAvailable: true },
    { id: '2', userId: targetUserId || '', dayOfWeek: 3, startTime: '14:00', endTime: '15:00', isRecurring: true, isAvailable: true },
    { id: '3', userId: targetUserId || '', dayOfWeek: 4, startTime: '16:00', endTime: '17:00', isRecurring: true, isAvailable: true },
  ];

  const displaySlots = availableSlots.length > 0 ? availableSlots : mockSlots;

  return (
    <Modal isOpen={isRequestModalOpen} onClose={handleClose} size="lg">
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
            <h3 className="text-xl font-bold text-white mb-2">제안을 보냈습니다!</h3>
            <p className="text-[#8B949E]">
              {targetUser?.name}님이 수락하면 알림을 보내드릴게요
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
                {targetUser?.name}님께 티타임을 제안합니다
              </h3>
            </div>

            {/* Purpose Selection */}
            <div className="mb-6">
              <p className="text-sm text-[#8B949E] mb-3">목적을 선택해주세요</p>
              <div className="grid grid-cols-2 gap-2">
                {purposes.map((purpose) => {
                  const Icon = purpose.icon;
                  const isSelected = selectedPurpose === purpose.id;
                  return (
                    <button
                      key={purpose.id}
                      onClick={() => setSelectedPurpose(purpose.id)}
                      className={`
                        flex items-center gap-2 p-3 rounded-xl
                        border transition-all duration-200
                        ${isSelected
                          ? 'bg-gradient-to-r from-[#00E5FF]/20 to-[#7C4DFF]/20 border-[#00E5FF] text-white'
                          : 'bg-[#161B22] border-[#21262D] text-[#8B949E] hover:border-[#484F58]'
                        }
                      `}
                    >
                      <Icon size={18} className={isSelected ? 'text-[#00E5FF]' : ''} />
                      <span className="text-sm">{purpose.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slot Selection */}
            <div className="mb-6">
              <p className="text-sm text-[#8B949E] mb-3">
                <Calendar size={14} className="inline mr-1" />
                가능한 시간을 선택해주세요
              </p>
              <div className="flex flex-wrap gap-2">
                {displaySlots.map((slot) => {
                  const isSelected = selectedSlot?.id === slot.id;
                  return (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-xl
                        border transition-all duration-200
                        ${isSelected
                          ? 'bg-[#00E5FF] border-[#00E5FF] text-black'
                          : 'bg-[#161B22] border-[#21262D] text-[#8B949E] hover:border-[#484F58]'
                        }
                      `}
                    >
                      <Clock size={14} />
                      <span className="text-sm">
                        {getDayName(slot.dayOfWeek)} {slot.startTime}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message */}
            <div className="mb-6">
              <p className="text-sm text-[#8B949E] mb-2">간단한 인사를 남겨주세요</p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="안녕하세요! 함께 이야기 나누고 싶습니다."
                maxLength={150}
                className="
                  w-full bg-[#161B22] border border-[#21262D] text-white
                  rounded-xl py-3 px-4 text-sm resize-none
                  focus:outline-none focus:border-[#00E5FF]
                  placeholder:text-[#484F58]
                "
                rows={3}
              />
              <p className="text-xs text-[#484F58] mt-1 text-right">
                {message.length}/150
              </p>
            </div>

            {/* Error */}
            {error && (
              <p className="text-[#FF4081] text-sm mb-4">{error}</p>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!selectedPurpose || !selectedSlot}
              isLoading={isLoading}
              className="w-full"
              size="lg"
              rightIcon={<Send size={18} />}
            >
              제안 보내기
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
