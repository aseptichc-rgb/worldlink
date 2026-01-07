'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Camera,
  Settings,
  Share2,
  Coffee,
  Users,
  Edit2,
  Plus,
  Trash2,
  Clock,
  LogOut,
} from 'lucide-react';
import { Avatar, Button, Input, Tag, Card, Modal } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import {
  updateUser,
  createTimeSlot,
  getUserTimeSlots,
  uploadProfileImage,
  logoutUser,
  onAuthChange,
  getUser,
} from '@/lib/firebase-services';
import { TimeSlot } from '@/types';

const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
const coffeeStatuses = [
  { id: 'available', label: '커피챗 가능', color: 'bg-[#00E676]' },
  { id: 'busy', label: '바쁨', color: 'bg-[#FF4081]' },
  { id: 'pending', label: '제안 대기', color: 'bg-[#FFA726]' },
] as const;

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, logout, setLoading } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);
  const [newKeyword, setNewKeyword] = useState('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [newSlot, setNewSlot] = useState({
    dayOfWeek: 1,
    startTime: '10:00',
    endTime: '11:00',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await getUser(firebaseUser.uid);
        setUser(userData);
        setEditedUser(userData);
      } else {
        setUser(null);
        router.push('/onboarding');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading, router]);

  useEffect(() => {
    const loadTimeSlots = async () => {
      if (!user) return;
      try {
        const slots = await getUserTimeSlots(user.id);
        setTimeSlots(slots);
      } catch (error) {
        console.error('Error loading time slots:', error);
      }
    };
    loadTimeSlots();
  }, [user]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      const imageUrl = await uploadProfileImage(user.id, file);
      await updateUser(user.id, { profileImage: imageUrl });
      setUser({ ...user, profileImage: imageUrl });
      setEditedUser(prev => prev ? { ...prev, profileImage: imageUrl } : prev);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleSave = async () => {
    if (!user || !editedUser) return;

    setIsSaving(true);
    try {
      await updateUser(user.id, {
        name: editedUser.name,
        company: editedUser.company,
        position: editedUser.position,
        bio: editedUser.bio,
        keywords: editedUser.keywords,
        coffeeStatus: editedUser.coffeeStatus,
      });
      setUser(editedUser);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addKeyword = () => {
    if (!editedUser || !newKeyword.trim() || editedUser.keywords.length >= 5) return;
    const keyword = newKeyword.trim().replace(/^#/, '');
    if (!editedUser.keywords.includes(keyword)) {
      setEditedUser({
        ...editedUser,
        keywords: [...editedUser.keywords, keyword],
      });
    }
    setNewKeyword('');
  };

  const removeKeyword = (keyword: string) => {
    if (!editedUser) return;
    setEditedUser({
      ...editedUser,
      keywords: editedUser.keywords.filter(k => k !== keyword),
    });
  };

  const handleAddSlot = async () => {
    if (!user) return;

    try {
      const slot = await createTimeSlot({
        userId: user.id,
        dayOfWeek: newSlot.dayOfWeek,
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
        isRecurring: true,
        isAvailable: true,
      });
      setTimeSlots([...timeSlots, slot]);
      setShowSlotModal(false);
    } catch (error) {
      console.error('Error adding slot:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      logout();
      router.push('/onboarding');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (!user || !editedUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-30 glass-light">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-[#21262D] transition-colors"
          >
            <ArrowLeft size={22} className="text-[#8B949E]" />
          </button>
          <h1 className="text-lg font-semibold text-white">내 프로필</h1>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={isSaving}
            className="p-2 rounded-xl hover:bg-[#21262D] transition-colors"
          >
            {isEditing ? (
              <span className="text-[#00E5FF] text-sm font-medium">
                {isSaving ? '저장 중...' : '완료'}
              </span>
            ) : (
              <Edit2 size={20} className="text-[#8B949E]" />
            )}
          </button>
        </div>
      </div>

      <div className="pt-20 px-4">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="relative inline-block mb-4">
            <Avatar
              src={editedUser.profileImage}
              name={editedUser.name}
              size="xl"
              hasGlow
            />
            {isEditing && (
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-r from-[#00E5FF] to-[#7C4DFF] rounded-full flex items-center justify-center cursor-pointer">
                <Camera size={16} className="text-black" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {isEditing ? (
            <Input
              value={editedUser.name}
              onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
              className="text-center text-xl font-bold mb-2"
            />
          ) : (
            <h2 className="text-2xl font-bold text-white mb-1">{editedUser.name}</h2>
          )}

          {isEditing ? (
            <div className="flex gap-2 justify-center">
              <Input
                value={editedUser.company}
                onChange={(e) => setEditedUser({ ...editedUser, company: e.target.value })}
                placeholder="회사"
                className="w-1/2 text-center text-sm"
              />
              <Input
                value={editedUser.position}
                onChange={(e) => setEditedUser({ ...editedUser, position: e.target.value })}
                placeholder="직함"
                className="w-1/2 text-center text-sm"
              />
            </div>
          ) : (
            <p className="text-[#8B949E]">
              {editedUser.company} · {editedUser.position}
            </p>
          )}
        </motion.div>

        {/* Coffee Status */}
        <Card className="p-4 mb-6">
          <h3 className="text-sm font-medium text-[#8B949E] mb-3 flex items-center gap-2">
            <Coffee size={16} />
            커피챗 상태
          </h3>
          <div className="flex gap-2">
            {coffeeStatuses.map((status) => (
              <button
                key={status.id}
                onClick={() => isEditing && setEditedUser({ ...editedUser, coffeeStatus: status.id })}
                className={`
                  flex-1 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${editedUser.coffeeStatus === status.id
                    ? `${status.color} text-black`
                    : 'bg-[#161B22] text-[#8B949E] hover:bg-[#21262D]'
                  }
                  ${!isEditing && 'cursor-default'}
                `}
              >
                {status.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Bio */}
        <Card className="p-4 mb-6">
          <h3 className="text-sm font-medium text-[#8B949E] mb-3">한 줄 소개</h3>
          {isEditing ? (
            <textarea
              value={editedUser.bio}
              onChange={(e) => setEditedUser({ ...editedUser, bio: e.target.value })}
              placeholder="나를 한 문장으로 표현해주세요"
              maxLength={100}
              className="
                w-full bg-[#161B22] border border-[#21262D] text-white
                rounded-xl py-3 px-4 text-sm resize-none
                focus:outline-none focus:border-[#00E5FF]
                placeholder:text-[#484F58]
              "
              rows={2}
            />
          ) : (
            <p className="text-white">
              {editedUser.bio || '아직 소개가 없습니다'}
            </p>
          )}
        </Card>

        {/* Keywords */}
        <Card className="p-4 mb-6">
          <h3 className="text-sm font-medium text-[#8B949E] mb-3">관심 키워드</h3>
          <div className="flex flex-wrap gap-2">
            {editedUser.keywords.map((keyword) => (
              <Tag
                key={keyword}
                label={keyword}
                isActive
                onRemove={isEditing ? () => removeKeyword(keyword) : undefined}
              />
            ))}
            {isEditing && editedUser.keywords.length < 5 && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                  placeholder="+ 추가"
                  className="
                    bg-transparent text-white text-sm
                    border-b border-[#21262D] py-1 px-2 w-20
                    focus:outline-none focus:border-[#00E5FF]
                  "
                />
              </div>
            )}
          </div>
        </Card>

        {/* Time Slots */}
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-[#8B949E] flex items-center gap-2">
              <Clock size={16} />
              커피챗 가능 시간
            </h3>
            <button
              onClick={() => setShowSlotModal(true)}
              className="text-[#00E5FF] text-sm flex items-center gap-1"
            >
              <Plus size={16} />
              추가
            </button>
          </div>
          {timeSlots.length > 0 ? (
            <div className="space-y-2">
              {timeSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-3 bg-[#161B22] rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-[#21262D] rounded-lg flex items-center justify-center text-sm text-white">
                      {daysOfWeek[slot.dayOfWeek]}
                    </span>
                    <span className="text-white text-sm">
                      {slot.startTime} - {slot.endTime}
                    </span>
                  </div>
                  {slot.isRecurring && (
                    <span className="text-xs text-[#484F58]">매주</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#484F58] text-sm text-center py-4">
              아직 등록된 시간이 없습니다
            </p>
          )}
        </Card>

        {/* Invite Code */}
        <Card className="p-4 mb-6">
          <h3 className="text-sm font-medium text-[#8B949E] mb-3 flex items-center gap-2">
            <Share2 size={16} />
            초대 코드
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xl text-[#00E5FF]">{user.inviteCode}</p>
              <p className="text-xs text-[#484F58] mt-1">
                남은 초대권: {user.invitesRemaining}개
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigator.clipboard.writeText(user.inviteCode)}
            >
              복사
            </Button>
          </div>
        </Card>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 text-[#FF4081] hover:bg-[#FF4081]/10 rounded-xl transition-colors"
        >
          <LogOut size={18} />
          <span>로그아웃</span>
        </button>
      </div>

      {/* Add Slot Modal */}
      <Modal
        isOpen={showSlotModal}
        onClose={() => setShowSlotModal(false)}
        title="커피챗 시간 추가"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-[#8B949E] mb-2">요일</label>
            <div className="flex gap-2">
              {daysOfWeek.map((day, i) => (
                <button
                  key={day}
                  onClick={() => setNewSlot({ ...newSlot, dayOfWeek: i })}
                  className={`
                    w-10 h-10 rounded-lg text-sm
                    ${newSlot.dayOfWeek === i
                      ? 'bg-[#00E5FF] text-black'
                      : 'bg-[#161B22] text-[#8B949E]'
                    }
                  `}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-[#8B949E] mb-2">시작 시간</label>
              <input
                type="time"
                value={newSlot.startTime}
                onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                className="input-dark"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-[#8B949E] mb-2">종료 시간</label>
              <input
                type="time"
                value={newSlot.endTime}
                onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                className="input-dark"
              />
            </div>
          </div>

          <Button onClick={handleAddSlot} className="w-full" size="lg">
            추가하기
          </Button>
        </div>
      </Modal>
    </div>
  );
}
