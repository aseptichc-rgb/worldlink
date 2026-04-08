'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Plus, X, Search, Shield, Eye, EyeOff, Building2, User as UserIcon, Check, Info } from 'lucide-react';
import { Button, Input, Tag, Avatar } from '@/components/ui';
import { getPopularKeywords } from '@/lib/firebase-services';

interface ProfileSetupProps {
  onComplete: (profile: ProfileData) => void;
  isLoading?: boolean;
  onBack?: () => void;
}

export interface PrivacyConsentData {
  allowProfileDiscovery: boolean;
  displaySettings: {
    nameDisplay: 'full' | 'partial';
    institutionDisplay: 'full' | 'department' | 'hidden';
    positionDisplay: 'full' | 'level' | 'hidden';
  };
}

export interface ProfileData {
  name: string;
  phone: string;
  institution: string;
  department: string;
  position: string;
  degree: string;
  orcid: string;
  bio: string;
  researchInterests: string[];
  profileImage?: File;
  privacyConsent: PrivacyConsentData;
}

const suggestedKeywords = [
  'AI', '머신러닝', '자연어처리', '컴퓨터비전', '데이터사이언스', '로보틱스',
  '신경과학', '생명공학', '재료과학', '양자컴퓨팅', '기후변화', '유전공학',
  '나노기술', '약학', '천문학', '경제학', '심리학', '사회학'
];


export default function ProfileSetup({ onComplete, isLoading, onBack }: ProfileSetupProps) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    phone: '',
    institution: '',
    department: '',
    position: '',
    degree: '',
    orcid: '',
    bio: '',
    researchInterests: [],
    privacyConsent: {
      allowProfileDiscovery: false,
      displaySettings: {
        nameDisplay: 'partial',
        institutionDisplay: 'full',
        positionDisplay: 'full',
      },
    },
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [keywordInput, setKeywordInput] = useState('');
  const [popularKeywords, setPopularKeywords] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileData, string>>>({});

  useEffect(() => {
    const loadKeywords = async () => {
      try {
        const keywords = await getPopularKeywords();
        if (keywords.length > 0) {
          setPopularKeywords(keywords);
        }
      } catch (error) {
        // 인기 연구 관심사 로드 실패 시 기본 연구 관심사 사용
      }
    };
    loadKeywords();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfile({ ...profile, profileImage: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addKeyword = (keyword: string) => {
    const cleanKeyword = keyword.trim().replace(/^#/, '');
    if (
      cleanKeyword &&
      !profile.researchInterests.includes(cleanKeyword) &&
      profile.researchInterests.length < 5
    ) {
      setProfile({ ...profile, researchInterests: [...profile.researchInterests, cleanKeyword] });
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setProfile({
      ...profile,
      researchInterests: profile.researchInterests.filter((k) => k !== keyword),
    });
  };

  const validateStep1 = () => {
    const newErrors: Partial<Record<keyof ProfileData, string>> = {};

    if (!profile.name.trim()) {
      newErrors.name = '이름을 입력해주세요';
    }
    if (!profile.phone.trim()) {
      newErrors.phone = '전화번호를 입력해주세요';
    } else if (!/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/.test(profile.phone.replace(/-/g, ''))) {
      newErrors.phone = '올바른 전화번호 형식이 아닙니다';
    }
    if (!profile.institution.trim()) {
      newErrors.institution = '소속 기관을 입력해주세요';
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    if (profile.researchInterests.length === 0) {
      setErrors({ researchInterests: '최소 1개의 연구 관심사를 선택해주세요' });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3); // 개인정보 공개 설정 단계로 이동
    } else if (step === 3) {
      onComplete(profile);
    }
  };

  const filteredSuggestions = (popularKeywords.length > 0 ? popularKeywords : suggestedKeywords)
    .filter(
      (k) =>
        !profile.researchInterests.includes(k) &&
        (keywordInput === '' || k.toLowerCase().includes(keywordInput.toLowerCase()))
    )
    .slice(0, 8);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Progress Bar */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              s <= step ? 'bg-gradient-to-r from-[#58A6FF] to-[#1F6FEB]' : 'bg-[#30363D]'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-white mb-3">프로필 설정</h2>
              <p className="text-[#8B949E]">나를 소개하는 첫 번째 단계입니다</p>
            </div>

            {/* Profile Image */}
            <div className="flex justify-center mb-8">
              <label className="relative cursor-pointer group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <div className={`
                  w-24 h-24 rounded-full overflow-hidden
                  border-2 border-dashed border-[#30363D]
                  flex items-center justify-center
                  bg-[#161B22]
                  transition-all duration-300
                  group-hover:border-[#58A6FF]
                `}>
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="text-[#484F58] group-hover:text-[#58A6FF] transition-colors" size={32} />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-r from-[#58A6FF] to-[#1F6FEB] flex items-center justify-center">
                  <Plus size={16} className="text-white" />
                </div>
              </label>
            </div>

            <Input
              label="이름"
              placeholder="실명을 입력해주세요"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              error={errors.name}
            />

            <Input
              type="tel"
              label="전화번호"
              placeholder="010-1234-5678"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              error={errors.phone}
            />

            <Input
              label="소속 기관"
              placeholder="대학교, 연구소, 기관명"
              value={profile.institution}
              onChange={(e) => setProfile({ ...profile, institution: e.target.value })}
              error={errors.institution}
            />

            <Input
              label="학과/부서"
              placeholder="예: 컴퓨터공학과, AI연구실"
              value={profile.department}
              onChange={(e) => setProfile({ ...profile, department: e.target.value })}
            />

            <Input
              label="직위"
              placeholder="예: 조교수, 박사과정, 연구원"
              value={profile.position}
              onChange={(e) => setProfile({ ...profile, position: e.target.value })}
              error={errors.position}
            />

            <div>
              <label className="block text-base font-medium text-[#8B949E] mb-3">학위</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'bachelor', label: '학사' },
                  { value: 'master', label: '석사' },
                  { value: 'phd', label: '박사' },
                  { value: 'postdoc', label: '포닥' },
                  { value: 'professor', label: '교수' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setProfile({ ...profile, degree: opt.value })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      profile.degree === opt.value
                        ? 'bg-[#0EA5E9]/10 text-[#0EA5E9] border border-[#0EA5E9]/30'
                        : 'bg-[#252525] text-[#8B949E] border border-[#30363D]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="ORCID (선택)"
              placeholder="0000-0000-0000-0000"
              value={profile.orcid}
              onChange={(e) => setProfile({ ...profile, orcid: e.target.value })}
            />

            <div>
              <label className="block text-base font-medium text-[#8B949E] mb-3">
                한 줄 소개 (선택)
              </label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="나를 한 문장으로 표현해주세요"
                maxLength={100}
                className="
                  w-full bg-[#161B22] border border-[#30363D] text-white
                  rounded-lg py-4 px-5 text-base leading-relaxed
                  transition-all duration-300 resize-none
                  focus:outline-none focus:border-[#58A6FF] focus:shadow-[0_0_0_3px_rgba(88,166,255,0.15)]
                  placeholder:text-[#484F58]
                "
                rows={3}
              />
              <p className="text-xs text-[#484F58] mt-1 text-right">
                {profile.bio.length}/100
              </p>
            </div>

            <div className={`flex gap-3 ${onBack ? '' : ''}`}>
              {onBack && (
                <Button
                  variant="secondary"
                  onClick={onBack}
                  className="flex-1"
                  size="lg"
                >
                  이전
                </Button>
              )}
              <Button
                onClick={handleNext}
                className={onBack ? "flex-[2] bg-gradient-to-r from-[#58A6FF] to-[#1F6FEB] hover:from-[#58A6FF] hover:to-[#8B7EFF]" : "w-full bg-gradient-to-r from-[#58A6FF] to-[#1F6FEB] hover:from-[#58A6FF] hover:to-[#8B7EFF]"}
                size="lg"
              >
                다음
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-white mb-3">연구 관심사</h2>
              <p className="text-[#8B949E]">
                나를 표현하는 연구 관심사를 선택해주세요 (1~5개)
              </p>
            </div>

            {/* Selected Keywords */}
            <div className="min-h-[60px] p-5 bg-[#161B22] border border-[#30363D] rounded-lg">
              {profile.researchInterests.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.researchInterests.map((keyword) => (
                    <Tag
                      key={keyword}
                      label={keyword}
                      isActive
                      onRemove={() => removeKeyword(keyword)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-[#484F58] text-base text-center">
                  아래에서 연구 관심사를 선택하거나 직접 입력하세요
                </p>
              )}
            </div>

            {errors.researchInterests && (
              <p className="text-[#FF6B8A] text-base">{errors.researchInterests}</p>
            )}

            {/* Keyword Input */}
            <div className="relative">
              <Input
                placeholder="연구 관심사 검색 또는 직접 입력"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addKeyword(keywordInput);
                  }
                }}
                leftIcon={<Search size={18} />}
              />
              {keywordInput && (
                <button
                  onClick={() => addKeyword(keywordInput)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 text-sm rounded-full bg-[#30363D] text-white hover:bg-[#30363D] transition-colors"
                >
                  추가
                </button>
              )}
            </div>

            {/* Suggested Keywords */}
            <div>
              <p className="text-base text-[#8B949E] mb-4">추천 연구 관심사</p>
              <div className="flex flex-wrap gap-2.5">
                {filteredSuggestions.map((keyword) => (
                  <Tag
                    key={keyword}
                    label={keyword}
                    onClick={() => addKeyword(keyword)}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setStep(1)}
                className="flex-1"
                size="lg"
              >
                이전
              </Button>
              <Button
                onClick={handleNext}
                className="flex-[2] bg-gradient-to-r from-[#58A6FF] to-[#1F6FEB] hover:from-[#58A6FF] hover:to-[#8B7EFF]"
                size="lg"
                disabled={profile.researchInterests.length === 0}
              >
                다음
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gradient-to-r from-[#58A6FF]/20 to-[#1F6FEB]/20 flex items-center justify-center">
                <Shield size={32} className="text-[#58A6FF]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">개인정보 공개 설정</h2>
              <p className="text-[#8B949E] text-base">
                네트워크에서 내 정보가 어떻게 표시될지 선택하세요
              </p>
            </div>

            {/* 공개 동의 토글 */}
            <div className="p-5 bg-[#161B22] border border-[#30363D] rounded-lg">
              <div className="flex items-start gap-4">
                <button
                  type="button"
                  onClick={() => setProfile({
                    ...profile,
                    privacyConsent: {
                      ...profile.privacyConsent,
                      allowProfileDiscovery: !profile.privacyConsent.allowProfileDiscovery
                    }
                  })}
                  className={`
                    flex-shrink-0 w-12 h-7 rounded-full transition-all duration-300
                    ${profile.privacyConsent.allowProfileDiscovery
                      ? 'bg-[#58A6FF]'
                      : 'bg-[#30363D]'}
                  `}
                >
                  <div className={`
                    w-5 h-5 mt-1 rounded-full bg-white shadow-md transition-transform duration-300
                    ${profile.privacyConsent.allowProfileDiscovery ? 'translate-x-6' : 'translate-x-1'}
                  `} />
                </button>
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-1">네트워크에 내 프로필 공개</h3>
                  <p className="text-[#8B949E] text-base leading-relaxed">
                    다른 회원들이 나를 발견하고 연결을 요청할 수 있습니다.
                    비공개 시 초대받은 경우에만 연결됩니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 상세 공개 설정 (공개 동의 시에만 표시) */}
            <AnimatePresence>
              {profile.privacyConsent.allowProfileDiscovery && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-5 overflow-hidden"
                >
                  {/* 공개 범위 안내 */}
                  <div className="p-4 bg-[#58A6FF]/10 border border-[#58A6FF]/20 rounded-xl">
                    <div className="flex items-start gap-2">
                      <Info size={16} className="text-[#58A6FF] flex-shrink-0 mt-0.5" />
                      <p className="text-[#58A6FF] text-sm leading-relaxed">
                        개인정보 보호를 위해 기본적으로 비식별화된 형태로 표시됩니다.
                        원하시면 더 많은 정보를 공개할 수 있습니다.
                      </p>
                    </div>
                  </div>

                  {/* 이름 표시 설정 */}
                  <div className="p-5 bg-[#161B22] border border-[#30363D] rounded-lg">
                    <div className="flex items-center gap-2.5 mb-4">
                      <UserIcon size={16} className="text-[#1F6FEB]" />
                      <h4 className="text-white font-medium text-base">이름 표시</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'partial', label: '성씨만', example: `${profile.name?.[0] || '김'}*님` },
                        { value: 'full', label: '전체 공개', example: profile.name || '홍길동' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setProfile({
                            ...profile,
                            privacyConsent: {
                              ...profile.privacyConsent,
                              displaySettings: {
                                ...profile.privacyConsent.displaySettings,
                                nameDisplay: option.value as 'full' | 'partial'
                              }
                            }
                          })}
                          className={`
                            p-4 rounded-lg border transition-all text-left
                            ${profile.privacyConsent.displaySettings.nameDisplay === option.value
                              ? 'bg-[#58A6FF]/10 border-[#58A6FF] text-[#58A6FF]'
                              : 'bg-[#1C2333] border-[#30363D] text-[#8B949E] hover:border-[#484F58]'}
                          `}
                        >
                          <span className="text-base font-medium block">{option.label}</span>
                          <span className="text-sm opacity-70">예: {option.example}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 소속 기관 표시 설정 */}
                  <div className="p-5 bg-[#161B22] border border-[#30363D] rounded-lg">
                    <div className="flex items-center gap-2.5 mb-4">
                      <Building2 size={16} className="text-[#1F6FEB]" />
                      <h4 className="text-white font-medium text-base">소속 기관 표시</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 'full', label: '전체 공개', example: profile.institution || '기관명' },
                          { value: 'department', label: '학과/부서만', example: '컴퓨터공학과' },
                          { value: 'hidden', label: '비공개', example: '표시 안 함' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setProfile({
                              ...profile,
                              privacyConsent: {
                                ...profile.privacyConsent,
                                displaySettings: {
                                  ...profile.privacyConsent.displaySettings,
                                  institutionDisplay: option.value as 'full' | 'department' | 'hidden'
                                }
                              }
                            })}
                            className={`
                              p-4 rounded-lg border transition-all text-left
                              ${profile.privacyConsent.displaySettings.institutionDisplay === option.value
                                ? 'bg-[#58A6FF]/10 border-[#58A6FF] text-[#58A6FF]'
                                : 'bg-[#1C2333] border-[#30363D] text-[#8B949E] hover:border-[#484F58]'}
                            `}
                          >
                            <span className="text-base font-medium block">{option.label}</span>
                            <span className="text-sm opacity-70">예: {option.example}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 직책 표시 설정 */}
                  <div className="p-5 bg-[#161B22] border border-[#30363D] rounded-lg">
                    <div className="flex items-center gap-2.5 mb-4">
                      <UserIcon size={16} className="text-[#1F6FEB]" />
                      <h4 className="text-white font-medium text-base">직책 표시</h4>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <input
                          type="text"
                          value={profile.position}
                          onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                          placeholder="직책 입력 (선택사항) — 예: CEO, PM, CFO, 최고기술책임자"
                          className="w-full bg-[#1C2333] border border-[#30363D] text-white rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-[#58A6FF] placeholder-[#484F58]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'full', label: '공개', example: profile.position || '직책' },
                          { value: 'hidden', label: '비공개', example: '표시 안 함' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setProfile({
                              ...profile,
                              privacyConsent: {
                                ...profile.privacyConsent,
                                displaySettings: {
                                  ...profile.privacyConsent.displaySettings,
                                  positionDisplay: option.value as 'full' | 'level' | 'hidden'
                                }
                              }
                            })}
                            className={`
                              p-4 rounded-lg border transition-all text-left
                              ${profile.privacyConsent.displaySettings.positionDisplay === option.value
                                ? 'bg-[#58A6FF]/10 border-[#58A6FF] text-[#58A6FF]'
                                : 'bg-[#1C2333] border-[#30363D] text-[#8B949E] hover:border-[#484F58]'}
                            `}
                          >
                            <span className="text-sm font-medium block">{option.label}</span>
                            <span className="text-xs opacity-70 truncate block">{option.example}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 미리보기 */}
                  <div className="p-5 bg-[#1C2333] border border-[#30363D] rounded-xl">
                    <h4 className="text-[#8B949E] text-sm font-medium mb-4 flex items-center gap-2">
                      <Eye size={14} />
                      다른 회원에게 표시되는 모습
                    </h4>
                    <div className="flex items-center gap-4 p-4 bg-[#161B22] rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#58A6FF] to-[#1F6FEB] flex items-center justify-center text-white font-bold text-sm">
                        {profile.name?.[0] || '?'}
                      </div>
                      <div>
                        <p className="text-white font-medium text-base">
                          {profile.privacyConsent.displaySettings.nameDisplay === 'partial'
                            ? `${profile.name?.[0] || '?'}*님`
                            : profile.name || '이름'}
                        </p>
                        <p className="text-[#8B949E] text-sm">
                          {(() => {
                            const parts = [];
                            if (profile.privacyConsent.displaySettings.institutionDisplay !== 'hidden') {
                              if (profile.privacyConsent.displaySettings.institutionDisplay === 'department') {
                                parts.push('학과/부서');
                              } else {
                                parts.push(profile.institution || '소속 기관');
                              }
                            }
                            if (profile.privacyConsent.displaySettings.positionDisplay !== 'hidden') {
                              parts.push(profile.position || '직책');
                            }
                            return parts.length > 0 ? parts.join(' · ') : '비공개';
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 비공개 선택 시 안내 */}
            {!profile.privacyConsent.allowProfileDiscovery && (
              <div className="p-5 bg-[#1C2333] border border-[#30363D] rounded-xl">
                <div className="flex items-start gap-4">
                  <EyeOff size={20} className="text-[#8B949E] flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium text-base mb-1">비공개 모드</h4>
                    <p className="text-[#8B949E] text-sm leading-relaxed">
                      네트워크에서 검색되지 않으며, 다른 회원이 나를 발견할 수 없습니다.
                      초대 링크를 통해서만 연결할 수 있습니다.
                      나중에 설정에서 언제든지 변경할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setStep(2)}
                className="flex-1"
                size="lg"
              >
                이전
              </Button>
              <Button
                onClick={handleNext}
                className="flex-[2] bg-gradient-to-r from-[#58A6FF] to-[#1F6FEB] hover:from-[#58A6FF] hover:to-[#8B7EFF]"
                size="lg"
                isLoading={isLoading}
              >
                완료
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
