'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Camera,
  Edit2,
  LogOut,
  Shield,
  Eye,
  EyeOff,
  ChevronRight,
  Building2,
  User as UserIcon,
  Check,
} from 'lucide-react';
import { Avatar, Input, Tag, Card } from '@/components/ui';
import BottomNav from '@/components/ui/BottomNav';
import { InviteManager } from '@/components/invite/InviteManager';
import MyNetworkVisualization from '@/components/network/MyNetworkVisualization';
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
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);

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
    <div className="min-h-screen bg-black pb-32">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-30 glass-light">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-[#21262D] transition-colors"
          >
            <ArrowLeft size={22} className="text-[#8B949E]" />
          </button>
          <div className="w-8" />
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

      <div className="pt-24 px-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
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
        <Card className="p-5 mb-8">
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
        <Card className="p-5 mb-8">
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

        {/* My Network Visualization */}
        <Card className="p-5 mb-8">
          <MyNetworkVisualization
            userId={user.id}
            userName={user.name}
            userImage={user.profileImage}
          />
        </Card>

        {/* Privacy Settings */}
        <Card className="p-5 mb-8">
          <button
            onClick={() => setShowPrivacySettings(true)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#7C4DFF]/20 flex items-center justify-center">
                <Shield size={20} className="text-[#7C4DFF]" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-medium">개인정보 공개 설정</h3>
                <p className="text-[#8B949E] text-sm">
                  {user.privacySettings?.allowProfileDiscovery ? '네트워크에 공개 중' : '비공개 모드'}
                </p>
              </div>
            </div>
            <ChevronRight size={20} className="text-[#484F58]" />
          </button>
        </Card>

        {/* Invite Manager */}
        <div className="mb-10">
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

      {/* Privacy Settings Modal */}
      <AnimatePresence>
        {showPrivacySettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end"
            onClick={() => setShowPrivacySettings(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-h-[85vh] bg-[#161B22] rounded-t-3xl border-t border-[#21262D] overflow-hidden"
            >
              <div className="sticky top-0 bg-[#161B22] border-b border-[#21262D] px-6 py-4 z-10">
                <div className="w-12 h-1 bg-[#484F58] rounded-full mx-auto mb-4" />
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">개인정보 공개 설정</h3>
                  <button
                    onClick={() => setShowPrivacySettings(false)}
                    className="text-sm text-[#00E5FF]"
                  >
                    완료
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(85vh-80px)]">
                {/* 공개 동의 토글 */}
                <div className="p-4 bg-[#0D1117] border border-[#21262D] rounded-xl">
                  <div className="flex items-start gap-4">
                    <button
                      type="button"
                      onClick={async () => {
                        const newAllowDiscovery = !(user.privacySettings?.allowProfileDiscovery ?? false);
                        const newSettings = {
                          allowProfileDiscovery: newAllowDiscovery,
                          displaySettings: {
                            nameDisplay: (user.privacySettings?.displaySettings?.nameDisplay || 'partial') as 'full' | 'partial',
                            companyDisplay: (user.privacySettings?.displaySettings?.companyDisplay || 'industry') as 'full' | 'industry' | 'size' | 'hidden',
                            positionDisplay: (user.privacySettings?.displaySettings?.positionDisplay || 'level') as 'full' | 'level' | 'hidden',
                          },
                          updatedAt: new Date(),
                        };
                        await updateUser(user.id, { privacySettings: newSettings });
                        const updatedUser = { ...user, privacySettings: newSettings };
                        setUser(updatedUser);
                        setEditedUser(updatedUser);
                      }}
                      className={`
                        flex-shrink-0 w-12 h-7 rounded-full transition-all duration-300
                        ${user.privacySettings?.allowProfileDiscovery
                          ? 'bg-[#00E5FF]'
                          : 'bg-[#21262D]'}
                      `}
                    >
                      <div className={`
                        w-5 h-5 mt-1 rounded-full bg-white shadow-md transition-transform duration-300
                        ${user.privacySettings?.allowProfileDiscovery ? 'translate-x-6' : 'translate-x-1'}
                      `} />
                    </button>
                    <div className="flex-1">
                      <h4 className="text-white font-medium mb-1">네트워크에 프로필 공개</h4>
                      <p className="text-[#8B949E] text-sm leading-relaxed">
                        {user.privacySettings?.allowProfileDiscovery
                          ? '다른 회원들이 나를 발견하고 연결을 요청할 수 있습니다.'
                          : '비공개 모드입니다. 초대받은 경우에만 연결됩니다.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 상세 설정 (공개 시에만) */}
                {user.privacySettings?.allowProfileDiscovery && (
                  <div className="space-y-4">
                    {/* 이름 표시 설정 */}
                    <div className="p-4 bg-[#0D1117] border border-[#21262D] rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <UserIcon size={16} className="text-[#7C4DFF]" />
                        <h4 className="text-white font-medium text-sm">이름 표시</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'partial', label: '성씨만', example: `${user.name?.[0] || '김'}*님` },
                          { value: 'full', label: '전체 공개', example: user.name || '홍길동' },
                        ].map((option) => {
                          const isSelected = user.privacySettings?.displaySettings?.nameDisplay === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={async () => {
                                const newSettings = {
                                  allowProfileDiscovery: user.privacySettings?.allowProfileDiscovery ?? false,
                                  displaySettings: {
                                    nameDisplay: option.value as 'full' | 'partial',
                                    companyDisplay: (user.privacySettings?.displaySettings?.companyDisplay || 'industry') as 'full' | 'industry' | 'size' | 'hidden',
                                    positionDisplay: (user.privacySettings?.displaySettings?.positionDisplay || 'level') as 'full' | 'level' | 'hidden',
                                  },
                                  updatedAt: new Date(),
                                };
                                await updateUser(user.id, { privacySettings: newSettings });
                                const updatedUser = { ...user, privacySettings: newSettings };
                                setUser(updatedUser);
                                setEditedUser(updatedUser);
                              }}
                              className={`
                                p-3 rounded-lg border transition-all text-left
                                ${isSelected
                                  ? 'bg-[#00E5FF]/10 border-[#00E5FF] text-[#00E5FF]'
                                  : 'bg-[#161B22] border-[#21262D] text-[#8B949E] hover:border-[#484F58]'}
                              `}
                            >
                              <span className="text-sm font-medium block">{option.label}</span>
                              <span className="text-xs opacity-70">예: {option.example}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 회사 표시 설정 */}
                    <div className="p-4 bg-[#0D1117] border border-[#21262D] rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Building2 size={16} className="text-[#7C4DFF]" />
                        <h4 className="text-white font-medium text-sm">회사 표시</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'industry', label: '업종만', example: user.industry || 'IT/소프트웨어' },
                          { value: 'size', label: '규모만', example: user.companySize === 'startup' ? '스타트업' : user.companySize === 'sme' ? '중소기업' : user.companySize === 'enterprise' ? '대기업' : '프리랜서' },
                          { value: 'full', label: '회사명 공개', example: user.company || '회사명' },
                          { value: 'hidden', label: '비공개', example: '표시 안 함' },
                        ].map((option) => {
                          const isSelected = user.privacySettings?.displaySettings?.companyDisplay === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={async () => {
                                const newSettings = {
                                  allowProfileDiscovery: user.privacySettings?.allowProfileDiscovery ?? false,
                                  displaySettings: {
                                    nameDisplay: (user.privacySettings?.displaySettings?.nameDisplay || 'partial') as 'full' | 'partial',
                                    companyDisplay: option.value as 'full' | 'industry' | 'size' | 'hidden',
                                    positionDisplay: (user.privacySettings?.displaySettings?.positionDisplay || 'level') as 'full' | 'level' | 'hidden',
                                  },
                                  updatedAt: new Date(),
                                };
                                await updateUser(user.id, { privacySettings: newSettings });
                                const updatedUser = { ...user, privacySettings: newSettings };
                                setUser(updatedUser);
                                setEditedUser(updatedUser);
                              }}
                              className={`
                                p-3 rounded-lg border transition-all text-left
                                ${isSelected
                                  ? 'bg-[#00E5FF]/10 border-[#00E5FF] text-[#00E5FF]'
                                  : 'bg-[#161B22] border-[#21262D] text-[#8B949E] hover:border-[#484F58]'}
                              `}
                            >
                              <span className="text-sm font-medium block">{option.label}</span>
                              <span className="text-xs opacity-70">{option.example}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 직책 표시 설정 */}
                    <div className="p-4 bg-[#0D1117] border border-[#21262D] rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <UserIcon size={16} className="text-[#7C4DFF]" />
                        <h4 className="text-white font-medium text-sm">직책 표시</h4>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'level', label: '직급 수준', example: user.positionLevel === 'entry' ? '사원급' : user.positionLevel === 'staff' ? '실무자급' : user.positionLevel === 'manager' ? '관리자급' : '임원급' },
                          { value: 'full', label: '전체 공개', example: user.position || '직책' },
                          { value: 'hidden', label: '비공개', example: '표시 안 함' },
                        ].map((option) => {
                          const isSelected = user.privacySettings?.displaySettings?.positionDisplay === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={async () => {
                                const newSettings = {
                                  allowProfileDiscovery: user.privacySettings?.allowProfileDiscovery ?? false,
                                  displaySettings: {
                                    nameDisplay: (user.privacySettings?.displaySettings?.nameDisplay || 'partial') as 'full' | 'partial',
                                    companyDisplay: (user.privacySettings?.displaySettings?.companyDisplay || 'industry') as 'full' | 'industry' | 'size' | 'hidden',
                                    positionDisplay: option.value as 'full' | 'level' | 'hidden',
                                  },
                                  updatedAt: new Date(),
                                };
                                await updateUser(user.id, { privacySettings: newSettings });
                                const updatedUser = { ...user, privacySettings: newSettings };
                                setUser(updatedUser);
                                setEditedUser(updatedUser);
                              }}
                              className={`
                                p-3 rounded-lg border transition-all text-left
                                ${isSelected
                                  ? 'bg-[#00E5FF]/10 border-[#00E5FF] text-[#00E5FF]'
                                  : 'bg-[#161B22] border-[#21262D] text-[#8B949E] hover:border-[#484F58]'}
                              `}
                            >
                              <span className="text-xs font-medium block">{option.label}</span>
                              <span className="text-[10px] opacity-70">{option.example}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 미리보기 */}
                    <div className="p-4 bg-[#161B22] border border-[#21262D] rounded-xl">
                      <h4 className="text-[#8B949E] text-xs font-medium mb-3 flex items-center gap-2">
                        <Eye size={14} />
                        다른 회원에게 표시되는 모습
                      </h4>
                      <div className="flex items-center gap-3 p-3 bg-[#0D1117] rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#00E5FF] to-[#7C4DFF] flex items-center justify-center text-white font-bold text-sm">
                          {user.name?.[0] || '?'}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">
                            {user.privacySettings?.displaySettings?.nameDisplay === 'partial'
                              ? `${user.name?.[0] || '?'}*님`
                              : user.name || '이름'}
                          </p>
                          <p className="text-[#8B949E] text-xs">
                            {(() => {
                              const parts = [];
                              const ds = user.privacySettings?.displaySettings;
                              if (ds?.companyDisplay !== 'hidden') {
                                if (ds?.companyDisplay === 'industry') {
                                  parts.push(user.industry || 'IT/소프트웨어');
                                } else if (ds?.companyDisplay === 'size') {
                                  const sizeLabels: Record<string, string> = {
                                    startup: '스타트업', sme: '중소기업', enterprise: '대기업', freelance: '프리랜서'
                                  };
                                  parts.push(sizeLabels[user.companySize || ''] || '기업');
                                } else {
                                  parts.push(user.company || '회사명');
                                }
                              }
                              if (ds?.positionDisplay !== 'hidden') {
                                if (ds?.positionDisplay === 'level') {
                                  const levelLabels: Record<string, string> = {
                                    entry: '사원급', staff: '실무자급', manager: '관리자급', executive: '임원급'
                                  };
                                  parts.push(levelLabels[user.positionLevel || ''] || '실무자급');
                                } else {
                                  parts.push(user.position || '직책');
                                }
                              }
                              return parts.length > 0 ? parts.join(' · ') : '비공개';
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 비공개 안내 */}
                {!user.privacySettings?.allowProfileDiscovery && (
                  <div className="p-4 bg-[#161B22] border border-[#21262D] rounded-xl">
                    <div className="flex items-start gap-3">
                      <EyeOff size={20} className="text-[#8B949E] flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-white font-medium text-sm mb-1">비공개 모드</h4>
                        <p className="text-[#8B949E] text-xs leading-relaxed">
                          네트워크에서 검색되지 않으며, 다른 회원이 나를 발견할 수 없습니다.
                          초대 링크를 통해서만 연결할 수 있습니다.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 개인정보 처리방침 링크 */}
                <div className="text-center pt-4">
                  <p className="text-[#484F58] text-xs">
                    설정 변경은 즉시 적용됩니다.{' '}
                    <button className="text-[#00E5FF] underline">개인정보 처리방침</button>
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
