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
  Mail,
  Search,
  Loader2,
  BookOpen,
  Award,
  ExternalLink,
  Quote,
} from 'lucide-react';
import { Avatar, Input, Tag, Card } from '@/components/ui';
import BottomNav from '@/components/ui/BottomNav';
import { InviteManager } from '@/components/invite/InviteManager';
import PaperCard from '@/components/papers/PaperCard';
import AchievementTimeline from '@/components/profile/AchievementTimeline';
import { useAuthStore } from '@/store/authStore';
import { useNetworkStore } from '@/store/networkStore';
import { usePaperStore } from '@/store/paperStore';
import { flushGroupSync } from '@/store/groupStore';
import { getCategoryColor, getFieldLabel } from '@/lib/category-utils';
import {
  updateUser,
  uploadProfileImage,
  logoutUser,
  onAuthChange,
  getUser,
  savePublicCard,
} from '@/lib/firebase-services';

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, logout, setLoading } = useAuthStore();
  const { updateNodeProfileImage } = useNetworkStore();
  const { papers, toggleFeatured, removePaper, achievements, addAchievement, removeAchievement } = usePaperStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);
  const [newKeyword, setNewKeyword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);

  useEffect(() => {
    const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('nodded_demo_mode') === 'true';
    if (isDemoMode) {
      setLoading(false);
      return;
    }

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

  const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('nodded_demo_mode') === 'true';

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingImage(true);
    try {
      if (isDemoMode) {
        // 데모 모드에서는 로컬 URL로 미리보기만 제공
        const localUrl = URL.createObjectURL(file);
        setUser({ ...user, profileImage: localUrl });
        setEditedUser(prev => prev ? { ...prev, profileImage: localUrl } : prev);
        updateNodeProfileImage(user.id, localUrl);
        return;
      }
      const imageUrl = await uploadProfileImage(user.id, file);

      // 프로필 업데이트와 공개 명함 업데이트를 병렬로 실행
      await Promise.all([
        updateUser(user.id, { profileImage: imageUrl }),
        savePublicCard({
          id: user.id,
          name: user.name,
          institution: user.institution,
          position: user.position,
          email: user.email,
          phone: user.phone,
          bio: user.bio,
          profileImage: imageUrl,
          researchInterests: user.researchInterests,
        }),
      ]);

      setUser({ ...user, profileImage: imageUrl });
      setEditedUser(prev => prev ? { ...prev, profileImage: imageUrl } : prev);
      updateNodeProfileImage(user.id, imageUrl);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(`프로필 이미지 업로드 실패: ${error?.message || '알 수 없는 오류'}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!user || !editedUser) return;

    setIsSaving(true);
    try {
      if (!isDemoMode) {
        await updateUser(user.id, {
          name: editedUser.name,
          institution: editedUser.institution,
          position: editedUser.position,
          bio: editedUser.bio,
          researchInterests: editedUser.researchInterests,
        });

        // 공개 프로필 카드도 자동 업데이트 (QR 코드 스캔 시 최신 정보 표시)
        await savePublicCard({
          id: editedUser.id,
          name: editedUser.name,
          institution: editedUser.institution,
          position: editedUser.position,
          email: editedUser.email,
          phone: editedUser.phone,
          bio: editedUser.bio,
          profileImage: editedUser.profileImage,
          researchInterests: editedUser.researchInterests,
        });
      }

      setUser(editedUser);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addKeyword = async () => {
    if (!editedUser || !user || !newKeyword.trim() || editedUser.researchInterests.length >= 5) return;
    const keyword = newKeyword.trim().replace(/^#/, '');
    if (!editedUser.researchInterests.includes(keyword)) {
      const newKeywords = [...editedUser.researchInterests, keyword];
      setEditedUser({
        ...editedUser,
        researchInterests: newKeywords,
      });
      setNewKeyword('');

      if (isDemoMode) {
        setUser({ ...user, researchInterests: newKeywords });
      } else {
        try {
          await updateUser(user.id, { researchInterests: newKeywords });
          await savePublicCard({
            id: user.id,
            name: editedUser.name,
            institution: editedUser.institution,
            position: editedUser.position,
            email: editedUser.email,
            phone: editedUser.phone,
            bio: editedUser.bio,
            profileImage: editedUser.profileImage,
            researchInterests: newKeywords,
          });
          setUser({ ...user, researchInterests: newKeywords });
        } catch (error) {
          console.error('Error saving keyword:', error);
        }
      }
    } else {
      setNewKeyword('');
    }
  };

  const removeKeyword = async (keyword: string) => {
    if (!editedUser || !user) return;
    const newKeywords = editedUser.researchInterests.filter(k => k !== keyword);
    setEditedUser({
      ...editedUser,
      researchInterests: newKeywords,
    });

    if (isDemoMode) {
      setUser({ ...user, researchInterests: newKeywords });
    } else {
      try {
        await updateUser(user.id, { researchInterests: newKeywords });
        await savePublicCard({
          id: user.id,
          name: editedUser.name,
          institution: editedUser.institution,
          position: editedUser.position,
          email: editedUser.email,
          phone: editedUser.phone,
          bio: editedUser.bio,
          profileImage: editedUser.profileImage,
          researchInterests: newKeywords,
        });
        setUser({ ...user, researchInterests: newKeywords });
      } catch (error) {
        console.error('Error removing keyword:', error);
      }
    }
  };

  const handleLogout = async () => {
    try {
      if (!isDemoMode) {
        await flushGroupSync();
        await logoutUser();
      }
      logout();
      router.push('/onboarding');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (!user || !editedUser) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] pb-32">
      {/* Header - 모바일 safe-area 적용 */}
      <div
        className="fixed top-0 left-0 right-0 z-30 glass-light"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2.5 rounded-lg hover:bg-[#252525] active:bg-[#303030] transition-colors touch-manipulation"
          >
            <ArrowLeft size={22} className="text-[#8B949E]" />
          </button>
          <h1 className="text-lg font-semibold text-white">프로필</h1>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={isSaving}
            className="p-2.5 rounded-lg hover:bg-[#252525] active:bg-[#303030] transition-colors touch-manipulation min-w-[60px] flex justify-end"
          >
            {isEditing ? (
              <span className="text-[#58A6FF] text-base font-medium">
                {isSaving ? '저장 중...' : '완료'}
              </span>
            ) : (
              <Edit2 size={20} className="text-[#8B949E]" />
            )}
          </button>
        </div>
      </div>

      <div className="pt-20 px-4 sm:px-5">
        {/* Profile Card - 통합된 프로필 카드 */}
        <Card className="px-6 py-8 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            {/* 프로필 사진 */}
            <div className="relative inline-block mb-5">
              <Avatar
                src={editedUser.profileImage}
                name={editedUser.name}
                size="2xl"
                hasGlow
              />
              {isEditing && (
                <label className="absolute bottom-0 right-0 w-10 h-10 bg-gradient-to-r from-[#58A6FF] to-[#1F6FEB] rounded-full flex items-center justify-center cursor-pointer touch-manipulation active:scale-95 transition-transform shadow-lg">
                  <Camera size={18} className="text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* 이름 및 직책 */}
            {isEditing ? (
              <Input
                value={editedUser.name}
                onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                className="text-center text-2xl font-bold mb-2"
              />
            ) : (
              <h2 className="text-2xl font-bold text-white mb-1">{editedUser.name}</h2>
            )}

            {isEditing ? (
              <div className="flex gap-3 justify-center mb-6">
                <Input
                  value={editedUser.institution}
                  onChange={(e) => setEditedUser({ ...editedUser, institution: e.target.value })}
                  placeholder="소속 기관"
                  className="w-1/2 text-center"
                />
                <Input
                  value={editedUser.position}
                  onChange={(e) => setEditedUser({ ...editedUser, position: e.target.value })}
                  placeholder="직함"
                  className="w-1/2 text-center"
                />
              </div>
            ) : (
              <p className="text-base text-[#8B949E] mb-6">
                {editedUser.institution} · {editedUser.position}
              </p>
            )}
          </motion.div>

          {/* 한 줄 소개 */}
          <div className="border-t border-[rgba(255,255,255,0.06)] pt-6 mb-6 px-2">
            <h3 className="text-base font-medium text-[#8B949E] mb-3 pl-1">한 줄 소개</h3>
            {isEditing ? (
              <textarea
                value={editedUser.bio}
                onChange={(e) => setEditedUser({ ...editedUser, bio: e.target.value })}
                placeholder="나를 한 문장으로 표현해주세요"
                maxLength={100}
                className="
                  w-full bg-[#252525] border border-[#363636] text-white
                  rounded-xl py-4 px-5 text-base resize-none leading-relaxed
                  focus:outline-none focus:border-[#58A6FF]
                  placeholder:text-[#484F58]
                "
                rows={3}
              />
            ) : (
              <p className="text-white text-lg leading-relaxed pl-1">
                {editedUser.bio || '아직 소개가 없습니다'}
              </p>
            )}
          </div>

          {/* 연구 관심사 - 항상 편집 가능 */}
          <div className="border-t border-[rgba(255,255,255,0.06)] pt-6 mb-6 px-2">
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-base font-medium text-[#8B949E]">연구 관심사</h3>
              <span className="text-sm text-[#484F58]">{editedUser.researchInterests.length}/5</span>
            </div>
            <div className="flex flex-wrap gap-3 mb-4 px-1">
              {editedUser.researchInterests.map((keyword) => (
                <Tag
                  key={keyword}
                  label={keyword}
                  isActive
                  onRemove={() => removeKeyword(keyword)}
                />
              ))}
              {editedUser.researchInterests.length === 0 && (
                <p className="text-[#484F58] text-base">연구 관심사를 추가해보세요</p>
              )}
            </div>
            {editedUser.researchInterests.length < 5 && (
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                  placeholder="연구 관심사 입력 (예: 강화학습, 단백질)"
                  maxLength={20}
                  className="
                    flex-1 bg-[#252525] text-white text-base
                    border border-[#363636] rounded-xl py-3.5 px-4
                    focus:outline-none focus:border-[#58A6FF]
                    placeholder:text-[#484F58]
                  "
                />
                <button
                  onClick={addKeyword}
                  disabled={!newKeyword.trim()}
                  className="
                    px-5 py-3.5 rounded-xl text-base font-medium
                    bg-gradient-to-r from-[#58A6FF] to-[#1F6FEB]
                    text-white disabled:opacity-50 disabled:cursor-not-allowed
                    hover:opacity-90 transition-opacity
                  "
                >
                  추가
                </button>
              </div>
            )}
          </div>

          {/* 개인정보 공개 설정 - 카드 내부 리스트 아이템 형태 */}
          <div className="border-t border-[rgba(255,255,255,0.06)] pt-6 px-2">
            <button
              onClick={() => setShowPrivacySettings(true)}
              className="w-full flex items-center justify-between py-3 px-3 bg-[#252525] rounded-xl hover:bg-[#2a2a2a] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-[#1F6FEB]/20 rounded-lg">
                  <Shield size={22} className="text-[#1F6FEB]" />
                </div>
                <div className="text-left">
                  <h3 className="text-white text-base font-medium">개인정보 공개 설정</h3>
                  <p className="text-[#8B949E] text-sm mt-1">
                    {user.privacySettings?.allowProfileDiscovery
                      ? (user.privacySettings?.allowGlobalSearch ? '검색 허용 · 네트워크 공개' : '검색 비허용 · 네트워크 공개')
                    : '비공개 모드'}
                  </p>
                </div>
              </div>
              <ChevronRight size={22} className="text-[#484F58]" />
            </button>
          </div>
        </Card>

        {/* Research Metrics */}
        {(() => {
          const myPapers = papers.filter(p => p.researcherId === user.id);
          const totalCitations = myPapers.reduce((sum, p) => sum + (p.citationCount || 0), 0);
          const fieldColor = user.researchField ? getCategoryColor(user.researchField) : '#0EA5E9';
          const fieldLabel = user.researchField ? getFieldLabel(user.researchField) : '';
          const featuredPapers = myPapers.filter(p => p.isFeatured);
          const myAchievements = achievements.filter(a => a.researcherId === user.id || a.researcherId === '');
          return (
            <>
              {/* Research Field Badge + External Links */}
              <div className="flex items-center gap-2 flex-wrap mb-4">
                {fieldLabel && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${fieldColor}15`, color: fieldColor }}>
                    {fieldLabel}
                  </span>
                )}
                {user.orcid && (
                  <a href={`https://orcid.org/${user.orcid}`} target="_blank" rel="noopener noreferrer"
                    className="px-2 py-1 rounded-md bg-[#A6CE39]/10 text-[#A6CE39] text-xs flex items-center gap-1">
                    ORCID <ExternalLink size={10} />
                  </a>
                )}
                {user.googleScholarId && (
                  <a href={`https://scholar.google.com/citations?user=${user.googleScholarId}`} target="_blank" rel="noopener noreferrer"
                    className="px-2 py-1 rounded-md bg-[#4285F4]/10 text-[#4285F4] text-xs flex items-center gap-1">
                    Google Scholar <ExternalLink size={10} />
                  </a>
                )}
              </div>

              {/* Metrics Cards */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-3 rounded-xl bg-[#1E1E1E] border border-[#30363D] text-center">
                  <p className="text-xl font-bold text-[#F0F6FC]">{user.hIndex || myPapers.length}</p>
                  <p className="text-[10px] text-[#8B949E] mt-0.5">{user.hIndex ? 'h-index' : '논문'}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#1E1E1E] border border-[#30363D] text-center">
                  <p className="text-xl font-bold text-[#F59E0B]">{user.totalCitations || totalCitations}</p>
                  <p className="text-[10px] text-[#8B949E] mt-0.5">인용</p>
                </div>
                <div className="p-3 rounded-xl bg-[#1E1E1E] border border-[#30363D] text-center">
                  <p className="text-xl font-bold text-[#0EA5E9]">{user.totalPublications || myPapers.length}</p>
                  <p className="text-[10px] text-[#8B949E] mt-0.5">출판</p>
                </div>
              </div>

              {/* Featured Papers */}
              {featuredPapers.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-[#F59E0B] flex items-center gap-1.5">
                      <BookOpen size={14} />
                      대표 논문
                    </h3>
                    <button onClick={() => router.push('/papers')} className="text-xs text-[#0EA5E9]">
                      전체 보기
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {featuredPapers.slice(0, 3).map(p => (
                      <PaperCard key={p.id} paper={p} compact />
                    ))}
                  </div>
                </div>
              )}

              {/* All Papers Link (if no featured but has papers) */}
              {featuredPapers.length === 0 && myPapers.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-[#8B949E] flex items-center gap-1.5">
                      <BookOpen size={14} />
                      최근 논문
                    </h3>
                    <button onClick={() => router.push('/papers')} className="text-xs text-[#0EA5E9]">
                      전체 보기
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {myPapers.slice(0, 2).map(p => (
                      <PaperCard key={p.id} paper={p} compact />
                    ))}
                  </div>
                </div>
              )}

              {/* Add Paper Button (if no papers) */}
              {myPapers.length === 0 && (
                <button
                  onClick={() => router.push('/papers')}
                  className="w-full mb-6 p-4 rounded-xl border border-dashed border-[#30363D] text-[#8B949E] text-sm flex items-center justify-center gap-2 hover:border-[#0EA5E9]/30 hover:text-[#0EA5E9] transition-colors"
                >
                  <BookOpen size={16} />
                  논문 등록하기
                </button>
              )}

              {/* Achievements */}
              <div className="mb-6">
                <AchievementTimeline
                  achievements={myAchievements}
                  editable
                  onAdd={(ach) => addAchievement({ ...ach, researcherId: user.id })}
                  onRemove={removeAchievement}
                />
              </div>
            </>
          );
        })()}

        {/* Invite Manager */}
        <div className="mb-8">
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
          className="w-full flex items-center justify-center gap-3 py-5 text-[#FF6B8A] text-lg font-medium hover:bg-[#FF6B8A]/10 rounded-xl transition-colors"
        >
          <LogOut size={22} />
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
            className="fixed inset-0 z-50 bg-[#121212]/80 backdrop-blur-sm flex items-end"
            onClick={() => setShowPrivacySettings(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-h-[85vh] bg-[#1E1E1E] rounded-t-[16px] border-t border-[#363636] overflow-hidden"
            >
              <div className="sticky top-0 bg-[#1E1E1E] border-b border-[#363636] px-8 py-5 z-10">
                <div className="w-12 h-1 bg-[#484F58] rounded-full mx-auto mb-5" />
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">개인정보 공개 설정</h3>
                  <button
                    onClick={() => setShowPrivacySettings(false)}
                    className="text-base text-[#58A6FF] py-1 px-2"
                  >
                    완료
                  </button>
                </div>
              </div>

              <div className="px-8 py-6 space-y-7 overflow-y-auto max-h-[calc(85vh-90px)]">
                {/* 공개 동의 토글 */}
                <div className="p-5 bg-[#252525] border border-[#363636] rounded-[10px]">
                  <div className="flex items-start gap-4">
                    <button
                      type="button"
                      onClick={async () => {
                        const newAllowDiscovery = !(user.privacySettings?.allowProfileDiscovery ?? false);
                        const newSettings = {
                          allowProfileDiscovery: newAllowDiscovery,
                          allowGlobalSearch: newAllowDiscovery ? (user.privacySettings?.allowGlobalSearch ?? false) : false,
                          displaySettings: {
                            nameDisplay: (user.privacySettings?.displaySettings?.nameDisplay || 'partial') as 'full' | 'partial',
                            institutionDisplay: (user.privacySettings?.displaySettings?.institutionDisplay || 'department') as 'full' | 'department' | 'hidden',
                            positionDisplay: (user.privacySettings?.displaySettings?.positionDisplay || 'level') as 'full' | 'level' | 'hidden',
                            emailDisplay: (user.privacySettings?.displaySettings?.emailDisplay || 'hidden') as 'full' | 'partial' | 'hidden',
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
                          ? 'bg-[#58A6FF]'
                          : 'bg-[#30363D]'}
                      `}
                    >
                      <div className={`
                        w-5 h-5 mt-1 rounded-full bg-white shadow-md transition-transform duration-300
                        ${user.privacySettings?.allowProfileDiscovery ? 'translate-x-6' : 'translate-x-1'}
                      `} />
                    </button>
                    <div className="flex-1">
                      <h4 className="text-white font-medium mb-2">네트워크에 프로필 공개</h4>
                      <p className="text-[#8B949E] text-base leading-relaxed">
                        {user.privacySettings?.allowProfileDiscovery
                          ? '다른 회원들이 나를 발견하고 연결을 요청할 수 있습니다.'
                          : '비공개 모드입니다. 초대받은 경우에만 연결됩니다.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 전체 검색 허용 토글 */}
                {user.privacySettings?.allowProfileDiscovery && (
                  <div className="p-5 bg-[#252525] border border-[#363636] rounded-lg">
                    <div className="flex items-start gap-4">
                      <button
                        type="button"
                        onClick={async () => {
                          const newAllowGlobalSearch = !(user.privacySettings?.allowGlobalSearch ?? false);
                          const newSettings = {
                            allowProfileDiscovery: user.privacySettings?.allowProfileDiscovery ?? false,
                            allowGlobalSearch: newAllowGlobalSearch,
                            displaySettings: {
                              nameDisplay: (user.privacySettings?.displaySettings?.nameDisplay || 'partial') as 'full' | 'partial',
                              institutionDisplay: (user.privacySettings?.displaySettings?.institutionDisplay || 'department') as 'full' | 'department' | 'hidden',
                              positionDisplay: (user.privacySettings?.displaySettings?.positionDisplay || 'level') as 'full' | 'level' | 'hidden',
                              emailDisplay: (user.privacySettings?.displaySettings?.emailDisplay || 'hidden') as 'full' | 'partial' | 'hidden',
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
                          ${user.privacySettings?.allowGlobalSearch
                            ? 'bg-[#58A6FF]'
                            : 'bg-[#30363D]'}
                        `}
                      >
                        <div className={`
                          w-5 h-5 mt-1 rounded-full bg-white shadow-md transition-transform duration-300
                          ${user.privacySettings?.allowGlobalSearch ? 'translate-x-6' : 'translate-x-1'}
                        `} />
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Search size={16} className="text-[#58A6FF]" />
                          <h4 className="text-white font-medium">전체 검색 허용</h4>
                        </div>
                        <p className="text-[#8B949E] text-base leading-relaxed">
                          {user.privacySettings?.allowGlobalSearch
                            ? '다른 회원들이 이름이나 연구 관심사로 나를 검색할 수 있습니다.'
                            : '검색에 노출되지 않습니다. 네트워크 탐색에서만 발견됩니다.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 상세 설정 (공개 시에만) */}
                {user.privacySettings?.allowProfileDiscovery && (
                  <div className="space-y-5">
                    {/* 이름 표시 설정 */}
                    <div className="p-5 bg-[#252525] border border-[#363636] rounded-lg">
                      <div className="flex items-center gap-2.5 mb-4">
                        <UserIcon size={16} className="text-[#1F6FEB]" />
                        <h4 className="text-white font-medium text-base">이름 표시</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
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
                                  allowGlobalSearch: user.privacySettings?.allowGlobalSearch ?? false,
                                  displaySettings: {
                                    nameDisplay: option.value as 'full' | 'partial',
                                    institutionDisplay: (user.privacySettings?.displaySettings?.institutionDisplay || 'department') as 'full' | 'department' | 'hidden',
                                    positionDisplay: (user.privacySettings?.displaySettings?.positionDisplay || 'level') as 'full' | 'level' | 'hidden',
                                    emailDisplay: (user.privacySettings?.displaySettings?.emailDisplay || 'hidden') as 'full' | 'partial' | 'hidden',
                                  },
                                  updatedAt: new Date(),
                                };
                                await updateUser(user.id, { privacySettings: newSettings });
                                const updatedUser = { ...user, privacySettings: newSettings };
                                setUser(updatedUser);
                                setEditedUser(updatedUser);
                              }}
                              className={`
                                p-4 rounded-lg border transition-all text-left
                                ${isSelected
                                  ? 'bg-[#58A6FF]/10 border-[#58A6FF] text-[#58A6FF]'
                                  : 'bg-[#1E1E1E] border-[#363636] text-[#8B949E] hover:border-[#484F58]'}
                              `}
                            >
                              <span className="text-base font-medium block">{option.label}</span>
                              <span className="text-sm opacity-70 mt-1 block">예: {option.example}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 소속 기관 표시 설정 */}
                    <div className="p-5 bg-[#252525] border border-[#363636] rounded-lg">
                      <div className="flex items-center gap-2.5 mb-4">
                        <Building2 size={16} className="text-[#1F6FEB]" />
                        <h4 className="text-white font-medium text-base">소속 기관 표시</h4>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 'full', label: '기관명 공개', example: user.institution || '소속 기관' },
                          { value: 'department', label: '학과만', example: user.department || '학과' },
                          { value: 'hidden', label: '비공개', example: '표시 안 함' },
                        ].map((option) => {
                          const isSelected = user.privacySettings?.displaySettings?.institutionDisplay === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={async () => {
                                const newSettings = {
                                  allowProfileDiscovery: user.privacySettings?.allowProfileDiscovery ?? false,
                                  allowGlobalSearch: user.privacySettings?.allowGlobalSearch ?? false,
                                  displaySettings: {
                                    nameDisplay: (user.privacySettings?.displaySettings?.nameDisplay || 'partial') as 'full' | 'partial',
                                    institutionDisplay: option.value as 'full' | 'department' | 'hidden',
                                    positionDisplay: (user.privacySettings?.displaySettings?.positionDisplay || 'level') as 'full' | 'level' | 'hidden',
                                    emailDisplay: (user.privacySettings?.displaySettings?.emailDisplay || 'hidden') as 'full' | 'partial' | 'hidden',
                                  },
                                  updatedAt: new Date(),
                                };
                                await updateUser(user.id, { privacySettings: newSettings });
                                const updatedUser = { ...user, privacySettings: newSettings };
                                setUser(updatedUser);
                                setEditedUser(updatedUser);
                              }}
                              className={`
                                p-4 rounded-lg border transition-all text-left
                                ${isSelected
                                  ? 'bg-[#58A6FF]/10 border-[#58A6FF] text-[#58A6FF]'
                                  : 'bg-[#1E1E1E] border-[#363636] text-[#8B949E] hover:border-[#484F58]'}
                              `}
                            >
                              <span className="text-base font-medium block">{option.label}</span>
                              <span className="text-sm opacity-70 mt-1 block">{option.example}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 직책 표시 설정 */}
                    <div className="p-5 bg-[#252525] border border-[#363636] rounded-lg">
                      <div className="flex items-center gap-2.5 mb-4">
                        <UserIcon size={16} className="text-[#1F6FEB]" />
                        <h4 className="text-white font-medium text-base">직책 표시</h4>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 'level', label: '직급 수준', example: user.degree === 'professor' ? '교수급' : user.degree === 'postdoc' ? '박사후연구원' : user.degree === 'phd' ? '박사과정' : '연구원' },
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
                                  allowGlobalSearch: user.privacySettings?.allowGlobalSearch ?? false,
                                  displaySettings: {
                                    nameDisplay: (user.privacySettings?.displaySettings?.nameDisplay || 'partial') as 'full' | 'partial',
                                    institutionDisplay: (user.privacySettings?.displaySettings?.institutionDisplay || 'department') as 'full' | 'department' | 'hidden',
                                    positionDisplay: option.value as 'full' | 'level' | 'hidden',
                                    emailDisplay: (user.privacySettings?.displaySettings?.emailDisplay || 'hidden') as 'full' | 'partial' | 'hidden',
                                  },
                                  updatedAt: new Date(),
                                };
                                await updateUser(user.id, { privacySettings: newSettings });
                                const updatedUser = { ...user, privacySettings: newSettings };
                                setUser(updatedUser);
                                setEditedUser(updatedUser);
                              }}
                              className={`
                                p-4 rounded-lg border transition-all text-left
                                ${isSelected
                                  ? 'bg-[#58A6FF]/10 border-[#58A6FF] text-[#58A6FF]'
                                  : 'bg-[#1E1E1E] border-[#363636] text-[#8B949E] hover:border-[#484F58]'}
                              `}
                            >
                              <span className="text-sm font-medium block">{option.label}</span>
                              <span className="text-xs opacity-70 mt-1 block">{option.example}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 이메일 표시 설정 */}
                    <div className="p-5 bg-[#252525] border border-[#363636] rounded-lg">
                      <div className="flex items-center gap-2.5 mb-4">
                        <Mail size={16} className="text-[#1F6FEB]" />
                        <h4 className="text-white font-medium text-base">이메일 표시</h4>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 'full', label: '전체 공개', example: user.email || 'email@example.com' },
                          { value: 'partial', label: '부분 공개', example: user.email ? `${user.email.slice(0, 2)}***@${user.email.split('@')[1]}` : 'em***@example.com' },
                          { value: 'hidden', label: '비공개', example: '표시 안 함' },
                        ].map((option) => {
                          const isSelected = (user.privacySettings?.displaySettings?.emailDisplay || 'hidden') === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={async () => {
                                const newSettings = {
                                  allowProfileDiscovery: user.privacySettings?.allowProfileDiscovery ?? false,
                                  allowGlobalSearch: user.privacySettings?.allowGlobalSearch ?? false,
                                  displaySettings: {
                                    nameDisplay: (user.privacySettings?.displaySettings?.nameDisplay || 'partial') as 'full' | 'partial',
                                    institutionDisplay: (user.privacySettings?.displaySettings?.institutionDisplay || 'department') as 'full' | 'department' | 'hidden',
                                    positionDisplay: (user.privacySettings?.displaySettings?.positionDisplay || 'level') as 'full' | 'level' | 'hidden',
                                    emailDisplay: option.value as 'full' | 'partial' | 'hidden',
                                  },
                                  updatedAt: new Date(),
                                };
                                await updateUser(user.id, { privacySettings: newSettings });
                                const updatedUser = { ...user, privacySettings: newSettings };
                                setUser(updatedUser);
                                setEditedUser(updatedUser);
                              }}
                              className={`
                                p-4 rounded-lg border transition-all text-left
                                ${isSelected
                                  ? 'bg-[#58A6FF]/10 border-[#58A6FF] text-[#58A6FF]'
                                  : 'bg-[#1E1E1E] border-[#363636] text-[#8B949E] hover:border-[#484F58]'}
                              `}
                            >
                              <span className="text-sm font-medium block">{option.label}</span>
                              <span className="text-xs opacity-70 mt-1 block truncate">{option.example}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 미리보기 */}
                    <div className="p-5 bg-[#1E1E1E] border border-[#363636] rounded-[10px]">
                      <h4 className="text-[#8B949E] text-sm font-medium mb-4 flex items-center gap-2">
                        <Eye size={14} />
                        다른 회원에게 표시되는 모습
                      </h4>
                      <div className="flex items-center gap-4 p-4 bg-[#252525] rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#58A6FF] to-[#1F6FEB] flex items-center justify-center text-white font-bold text-base">
                          {user.name?.[0] || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-base">
                            {user.privacySettings?.displaySettings?.nameDisplay === 'partial'
                              ? `${user.name?.[0] || '?'}*님`
                              : user.name || '이름'}
                          </p>
                          <p className="text-[#8B949E] text-sm">
                            {(() => {
                              const parts = [];
                              const ds = user.privacySettings?.displaySettings;
                              if (ds?.institutionDisplay !== 'hidden') {
                                if (ds?.institutionDisplay === 'department') {
                                  parts.push(user.department || '학과');
                                } else {
                                  parts.push(user.institution || '소속 기관');
                                }
                              }
                              if (ds?.positionDisplay !== 'hidden') {
                                if (ds?.positionDisplay === 'level') {
                                  const levelLabels: Record<string, string> = {
                                    professor: '교수급', postdoc: '박사후연구원', phd: '박사과정', master: '석사과정', bachelor: '학부생'
                                  };
                                  parts.push(levelLabels[user.degree || ''] || '연구원');
                                } else {
                                  parts.push(user.position || '직위');
                                }
                              }
                              return parts.length > 0 ? parts.join(' · ') : '비공개';
                            })()}
                          </p>
                          {/* 이메일 미리보기 */}
                          {user.privacySettings?.displaySettings?.emailDisplay !== 'hidden' && (
                            <p className="text-[#58A6FF] text-sm mt-1 truncate">
                              {(() => {
                                const ds = user.privacySettings?.displaySettings;
                                if (ds?.emailDisplay === 'full') {
                                  return user.email || 'email@example.com';
                                } else if (ds?.emailDisplay === 'partial' && user.email) {
                                  const [local, domain] = user.email.split('@');
                                  return `${local.slice(0, 2)}***@${domain}`;
                                }
                                return '';
                              })()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 비공개 안내 */}
                {!user.privacySettings?.allowProfileDiscovery && (
                  <div className="p-5 bg-[#1E1E1E] border border-[#363636] rounded-[10px]">
                    <div className="flex items-start gap-4">
                      <EyeOff size={20} className="text-[#8B949E] flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-white font-medium text-base mb-1">비공개 모드</h4>
                        <p className="text-[#8B949E] text-sm leading-relaxed">
                          네트워크에서 검색되지 않으며, 다른 회원이 나를 발견할 수 없습니다.
                          초대 링크를 통해서만 연결할 수 있습니다.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 개인정보 처리방침 링크 */}
                <div className="text-center pt-6">
                  <p className="text-[#484F58] text-sm">
                    설정 변경은 즉시 적용됩니다.{' '}
                    <button className="text-[#58A6FF] underline">개인정보 처리방침</button>
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
