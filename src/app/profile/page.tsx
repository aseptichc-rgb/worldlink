'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Camera,
  Edit2,
  LogOut,
} from 'lucide-react';
import { Avatar, Button, Input, Tag, Card } from '@/components/ui';
import { InviteManager } from '@/components/invite/InviteManager';
import { useAuthStore } from '@/store/authStore';
import {
  updateUser,
  uploadProfileImage,
  logoutUser,
  onAuthChange,
  getUser,
} from '@/lib/firebase-services';

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, logout, setLoading } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);
  const [newKeyword, setNewKeyword] = useState('');
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

        {/* Invite Manager */}
        <div className="mb-6">
          <InviteManager
            userId={user.id}
            invitesRemaining={user.invitesRemaining}
            userName={user.name}
            onInviteSent={async () => {
              // 초대 발송 후 사용자 정보 새로고침
              const updatedUser = await getUser(user.id);
              if (updatedUser) {
                setUser(updatedUser);
                setEditedUser(updatedUser);
              }
            }}
          />
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 text-[#FF4081] hover:bg-[#FF4081]/10 rounded-xl transition-colors"
        >
          <LogOut size={18} />
          <span>로그아웃</span>
        </button>
      </div>

    </div>
  );
}
