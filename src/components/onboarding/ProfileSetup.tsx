'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Plus, X, Search } from 'lucide-react';
import { Button, Input, Tag, Avatar } from '@/components/ui';
import { getPopularKeywords } from '@/lib/firebase-services';

interface ProfileSetupProps {
  onComplete: (profile: ProfileData) => void;
  isLoading?: boolean;
  onBack?: () => void;
}

export interface ProfileData {
  name: string;
  phone: string;
  company: string;
  position: string;
  bio: string;
  keywords: string[];
  profileImage?: File;
}

const suggestedKeywords = [
  '스타트업', 'SaaS', 'AI', '마케팅', '투자', '개발',
  'UX디자인', 'PM', '세일즈', '콘텐츠', '브랜딩', 'B2B',
  'Web3', '핀테크', '이커머스', '헬스케어', '에듀테크', 'HR'
];

export default function ProfileSetup({ onComplete, isLoading, onBack }: ProfileSetupProps) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    phone: '',
    company: '',
    position: '',
    bio: '',
    keywords: [],
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
        {[1, 2].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              s <= step ? 'bg-gradient-to-r from-[#00E5FF] to-[#7C4DFF]' : 'bg-[#21262D]'
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
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">프로필 설정</h2>
              <p className="text-[#8B949E]">나를 소개하는 첫 번째 단계입니다</p>
            </div>

            {/* Profile Image */}
            <div className="flex justify-center mb-6">
              <label className="relative cursor-pointer group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <div className={`
                  w-24 h-24 rounded-full overflow-hidden
                  border-2 border-dashed border-[#21262D]
                  flex items-center justify-center
                  bg-[#0D1117]
                  transition-all duration-300
                  group-hover:border-[#00E5FF]
                `}>
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="text-[#484F58] group-hover:text-[#00E5FF] transition-colors" size={32} />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-r from-[#00E5FF] to-[#7C4DFF] flex items-center justify-center">
                  <Plus size={16} className="text-black" />
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
              <label className="block text-sm font-medium text-[#8B949E] mb-2">
                한 줄 소개 (선택)
              </label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="나를 한 문장으로 표현해주세요"
                maxLength={100}
                className="
                  w-full bg-[#0D1117] border border-[#21262D] text-white
                  rounded-xl py-3.5 px-4 text-base
                  transition-all duration-300 resize-none
                  focus:outline-none focus:border-[#00E5FF] focus:shadow-[0_0_0_3px_rgba(0,229,255,0.25)]
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
                className={onBack ? "flex-[2] bg-gradient-to-r from-[#00D9FF] to-[#7B68EE] hover:from-[#00E5FF] hover:to-[#8B7EFF]" : "w-full bg-gradient-to-r from-[#00D9FF] to-[#7B68EE] hover:from-[#00E5FF] hover:to-[#8B7EFF]"}
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
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">관심 키워드</h2>
              <p className="text-[#8B949E]">
                나를 표현하는 키워드를 선택해주세요 (1~5개)
              </p>
            </div>

            {/* Selected Keywords */}
            <div className="min-h-[60px] p-4 bg-[#0D1117] border border-[#21262D] rounded-xl">
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
                <p className="text-[#484F58] text-sm text-center">
                  아래에서 키워드를 선택하거나 직접 입력하세요
                </p>
              )}
            </div>

            {errors.keywords && (
              <p className="text-[#FF4081] text-sm">{errors.keywords}</p>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 text-sm rounded-full bg-[#21262D] text-white hover:bg-[#30363D] transition-colors"
                >
                  추가
                </button>
              )}
            </div>

            {/* Suggested Keywords */}
            <div>
              <p className="text-sm text-[#8B949E] mb-3">추천 키워드</p>
              <div className="flex flex-wrap gap-2">
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
                className="flex-[2] bg-gradient-to-r from-[#00D9FF] to-[#7B68EE] hover:from-[#00E5FF] hover:to-[#8B7EFF]"
                size="lg"
                isLoading={isLoading}
                disabled={profile.keywords.length === 0}
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
