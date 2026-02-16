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
    companyDisplay: 'full' | 'industry' | 'size' | 'hidden';
    positionDisplay: 'full' | 'level' | 'hidden';
  };
}

export interface ProfileData {
  name: string;
  phone: string;
  company: string;
  position: string;
  // 회사 규모 (비식별화 표시용)
  companySize?: 'startup' | 'sme' | 'enterprise' | 'freelance';
  // 업종 (비식별화 표시용)
  industry?: string;
  // 직급 수준 (비식별화 표시용)
  positionLevel?: 'entry' | 'staff' | 'manager' | 'executive';
  bio: string;
  keywords: string[];
  profileImage?: File;
  // 개인정보 공개 동의
  privacyConsent: PrivacyConsentData;
}

const suggestedKeywords = [
  '스타트업', 'SaaS', 'AI', '마케팅', '투자', '개발',
  'UX디자인', 'PM', '세일즈', '콘텐츠', '브랜딩', 'B2B',
  'Web3', '핀테크', '이커머스', '헬스케어', '에듀테크', 'HR'
];

const industryOptions = [
  'IT/소프트웨어', '금융/핀테크', '제조업', '유통/물류', '의료/헬스케어',
  '교육', '미디어/엔터테인먼트', '컨설팅', '마케팅/광고', '기타'
];

const companySizeOptions = [
  { value: 'startup', label: '스타트업 (1-50명)' },
  { value: 'sme', label: '중소기업 (51-300명)' },
  { value: 'enterprise', label: '대기업 (300명+)' },
  { value: 'freelance', label: '프리랜서/1인 기업' },
];

const positionLevelOptions = [
  { value: 'entry', label: '사원/주니어급' },
  { value: 'staff', label: '실무자/시니어급' },
  { value: 'manager', label: '관리자/팀장급' },
  { value: 'executive', label: '임원/C-Level' },
];

export default function ProfileSetup({ onComplete, isLoading, onBack }: ProfileSetupProps) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    phone: '',
    company: '',
    position: '',
    companySize: undefined,
    industry: undefined,
    positionLevel: undefined,
    bio: '',
    keywords: [],
    privacyConsent: {
      allowProfileDiscovery: false,
      displaySettings: {
        nameDisplay: 'partial',
        companyDisplay: 'industry',
        positionDisplay: 'level',
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
        // 인기 키워드 로드 실패 시 기본 키워드 사용
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
      !profile.keywords.includes(cleanKeyword) &&
      profile.keywords.length < 5
    ) {
      setProfile({ ...profile, keywords: [...profile.keywords, cleanKeyword] });
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setProfile({
      ...profile,
      keywords: profile.keywords.filter((k) => k !== keyword),
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
    if (!profile.company.trim()) {
      newErrors.company = '소속을 입력해주세요';
    }
    if (!profile.position.trim()) {
      newErrors.position = '직함을 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    if (profile.keywords.length === 0) {
      setErrors({ keywords: '최소 1개의 키워드를 선택해주세요' });
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
        !profile.keywords.includes(k) &&
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
              s <= step ? 'bg-[#2563EB]' : 'bg-[#E2E8F0]'
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
              <h2 className="text-2xl font-bold text-[#1A1A2E] mb-3">프로필 설정</h2>
              <p className="text-[#64748B]">나를 소개하는 첫 번째 단계입니다</p>
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
                  border-2 border-dashed border-[#E2E8F0]
                  flex items-center justify-center
                  bg-[#F8F9FA]
                  transition-all duration-300
                  group-hover:border-[#2563EB]
                `}>
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="text-[#94A3B8] group-hover:text-[#2563EB] transition-colors" size={32} />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center">
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
              label="소속"
              placeholder="회사명 또는 소속 기관"
              value={profile.company}
              onChange={(e) => setProfile({ ...profile, company: e.target.value })}
              error={errors.company}
            />

            <Input
              label="직함"
              placeholder="예: CEO, 개발팀장, 프리랜서 디자이너"
              value={profile.position}
              onChange={(e) => setProfile({ ...profile, position: e.target.value })}
              error={errors.position}
            />

            <div>
              <label className="block text-base font-medium text-[#64748B] mb-3">
                한 줄 소개 (선택)
              </label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="나를 한 문장으로 표현해주세요"
                maxLength={100}
                className="
                  w-full bg-[#FFFFFF] border border-[#E2E8F0] text-[#1A1A2E]
                  rounded-lg py-4 px-5 text-base leading-relaxed
                  transition-all duration-300 resize-none
                  focus:outline-none focus:border-[#2563EB] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)]
                  placeholder:text-[#94A3B8]
                "
                rows={3}
              />
              <p className="text-xs text-[#94A3B8] mt-1 text-right">
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
                className={onBack ? "flex-[2] bg-[#2563EB] hover:bg-[#3B82F6]" : "w-full bg-[#2563EB] hover:bg-[#3B82F6]"}
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
              <h2 className="text-2xl font-bold text-[#1A1A2E] mb-3">관심 키워드</h2>
              <p className="text-[#64748B]">
                나를 표현하는 키워드를 선택해주세요 (1~5개)
              </p>
            </div>

            {/* Selected Keywords */}
            <div className="min-h-[60px] p-5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg">
              {profile.keywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.keywords.map((keyword) => (
                    <Tag
                      key={keyword}
                      label={keyword}
                      isActive
                      onRemove={() => removeKeyword(keyword)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-[#94A3B8] text-base text-center">
                  아래에서 키워드를 선택하거나 직접 입력하세요
                </p>
              )}
            </div>

            {errors.keywords && (
              <p className="text-[#EF4444] text-base">{errors.keywords}</p>
            )}

            {/* Keyword Input */}
            <div className="relative">
              <Input
                placeholder="키워드 검색 또는 직접 입력"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 text-sm rounded-full bg-[#E2E8F0] text-[#1A1A2E] hover:bg-[#E2E8F0] transition-colors"
                >
                  추가
                </button>
              )}
            </div>

            {/* Suggested Keywords */}
            <div>
              <p className="text-base text-[#64748B] mb-4">추천 키워드</p>
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
                className="flex-[2] bg-[#2563EB] hover:bg-[#3B82F6]"
                size="lg"
                disabled={profile.keywords.length === 0}
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
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[#2563EB]/10 flex items-center justify-center">
                <Shield size={32} className="text-[#2563EB]" />
              </div>
              <h2 className="text-2xl font-bold text-[#1A1A2E] mb-3">개인정보 공개 설정</h2>
              <p className="text-[#64748B] text-base">
                네트워크에서 내 정보가 어떻게 표시될지 선택하세요
              </p>
            </div>

            {/* 공개 동의 토글 */}
            <div className="p-5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg">
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
                      ? 'bg-[#2563EB]'
                      : 'bg-[#E2E8F0]'}
                  `}
                >
                  <div className={`
                    w-5 h-5 mt-1 rounded-full bg-white shadow-md transition-transform duration-300
                    ${profile.privacyConsent.allowProfileDiscovery ? 'translate-x-6' : 'translate-x-1'}
                  `} />
                </button>
                <div className="flex-1">
                  <h3 className="text-[#1A1A2E] font-medium mb-1">네트워크에 내 프로필 공개</h3>
                  <p className="text-[#64748B] text-base leading-relaxed">
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
                  <div className="p-4 bg-[#2563EB]/10 border border-[#2563EB]/20 rounded-xl">
                    <div className="flex items-start gap-2">
                      <Info size={16} className="text-[#2563EB] flex-shrink-0 mt-0.5" />
                      <p className="text-[#2563EB] text-sm leading-relaxed">
                        개인정보 보호를 위해 기본적으로 비식별화된 형태로 표시됩니다.
                        원하시면 더 많은 정보를 공개할 수 있습니다.
                      </p>
                    </div>
                  </div>

                  {/* 이름 표시 설정 */}
                  <div className="p-5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg">
                    <div className="flex items-center gap-2.5 mb-4">
                      <UserIcon size={16} className="text-[#3B82F6]" />
                      <h4 className="text-[#1A1A2E] font-medium text-base">이름 표시</h4>
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
                              ? 'bg-[#2563EB]/10 border-[#2563EB] text-[#2563EB]'
                              : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#64748B] hover:border-[#94A3B8]'}
                          `}
                        >
                          <span className="text-base font-medium block">{option.label}</span>
                          <span className="text-sm opacity-70">예: {option.example}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 회사 표시 설정 */}
                  <div className="p-5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg">
                    <div className="flex items-center gap-2.5 mb-4">
                      <Building2 size={16} className="text-[#3B82F6]" />
                      <h4 className="text-[#1A1A2E] font-medium text-base">회사 표시</h4>
                    </div>
                    <div className="space-y-3">
                      {/* 업종/규모 선택이 없으면 먼저 선택하도록 안내 */}
                      {(!profile.industry || !profile.companySize) && (
                        <div className="mb-3 space-y-2">
                          <select
                            value={profile.industry || ''}
                            onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                            className="w-full bg-[#FFFFFF] border border-[#E2E8F0] text-[#1A1A2E] rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-[#2563EB]"
                          >
                            <option value="">업종 선택</option>
                            {industryOptions.map((industry) => (
                              <option key={industry} value={industry}>{industry}</option>
                            ))}
                          </select>
                          <select
                            value={profile.companySize || ''}
                            onChange={(e) => setProfile({ ...profile, companySize: e.target.value as ProfileData['companySize'] })}
                            className="w-full bg-[#FFFFFF] border border-[#E2E8F0] text-[#1A1A2E] rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-[#2563EB]"
                          >
                            <option value="">회사 규모 선택</option>
                            {companySizeOptions.map((size) => (
                              <option key={size.value} value={size.value}>{size.label}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'industry', label: '업종만', example: profile.industry || 'IT/소프트웨어' },
                          { value: 'size', label: '규모만', example: companySizeOptions.find(s => s.value === profile.companySize)?.label?.split(' ')[0] || '대기업' },
                          { value: 'full', label: '회사명 공개', example: profile.company || '회사명' },
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
                                  companyDisplay: option.value as 'full' | 'industry' | 'size' | 'hidden'
                                }
                              }
                            })}
                            className={`
                              p-4 rounded-lg border transition-all text-left
                              ${profile.privacyConsent.displaySettings.companyDisplay === option.value
                                ? 'bg-[#2563EB]/10 border-[#2563EB] text-[#2563EB]'
                                : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#64748B] hover:border-[#94A3B8]'}
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
                  <div className="p-5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg">
                    <div className="flex items-center gap-2.5 mb-4">
                      <UserIcon size={16} className="text-[#3B82F6]" />
                      <h4 className="text-[#1A1A2E] font-medium text-base">직책 표시</h4>
                    </div>
                    <div className="space-y-3">
                      {!profile.positionLevel && (
                        <select
                          value={profile.positionLevel || ''}
                          onChange={(e) => setProfile({ ...profile, positionLevel: e.target.value as ProfileData['positionLevel'] })}
                          className="w-full bg-[#FFFFFF] border border-[#E2E8F0] text-[#1A1A2E] rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-[#2563EB] mb-3"
                        >
                          <option value="">직급 수준 선택</option>
                          {positionLevelOptions.map((level) => (
                            <option key={level.value} value={level.value}>{level.label}</option>
                          ))}
                        </select>
                      )}
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 'level', label: '직급 수준', example: positionLevelOptions.find(l => l.value === profile.positionLevel)?.label?.split('/')[0] || '실무자급' },
                          { value: 'full', label: '전체 공개', example: profile.position || '직책' },
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
                                ? 'bg-[#2563EB]/10 border-[#2563EB] text-[#2563EB]'
                                : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#64748B] hover:border-[#94A3B8]'}
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
                  <div className="p-5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl">
                    <h4 className="text-[#64748B] text-sm font-medium mb-4 flex items-center gap-2">
                      <Eye size={14} />
                      다른 회원에게 표시되는 모습
                    </h4>
                    <div className="flex items-center gap-4 p-4 bg-[#F8F9FA] rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-[#2563EB] flex items-center justify-center text-white font-bold text-sm">
                        {profile.name?.[0] || '?'}
                      </div>
                      <div>
                        <p className="text-[#1A1A2E] font-medium text-base">
                          {profile.privacyConsent.displaySettings.nameDisplay === 'partial'
                            ? `${profile.name?.[0] || '?'}*님`
                            : profile.name || '이름'}
                        </p>
                        <p className="text-[#64748B] text-sm">
                          {(() => {
                            const parts = [];
                            if (profile.privacyConsent.displaySettings.companyDisplay !== 'hidden') {
                              if (profile.privacyConsent.displaySettings.companyDisplay === 'industry') {
                                parts.push(profile.industry || 'IT/소프트웨어');
                              } else if (profile.privacyConsent.displaySettings.companyDisplay === 'size') {
                                parts.push(companySizeOptions.find(s => s.value === profile.companySize)?.label?.split(' ')[0] || '대기업');
                              } else {
                                parts.push(profile.company || '회사명');
                              }
                            }
                            if (profile.privacyConsent.displaySettings.positionDisplay !== 'hidden') {
                              if (profile.privacyConsent.displaySettings.positionDisplay === 'level') {
                                parts.push(positionLevelOptions.find(l => l.value === profile.positionLevel)?.label?.split('/')[0] || '실무자급');
                              } else {
                                parts.push(profile.position || '직책');
                              }
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
              <div className="p-5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl">
                <div className="flex items-start gap-4">
                  <EyeOff size={20} className="text-[#64748B] flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[#1A1A2E] font-medium text-base mb-1">비공개 모드</h4>
                    <p className="text-[#64748B] text-sm leading-relaxed">
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
                className="flex-[2] bg-[#2563EB] hover:bg-[#3B82F6]"
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
