'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Upload,
  Check,
  ArrowRight,
  CreditCard,
  User,
  Hash,
  Loader2,
  X,
  Building2,
  Briefcase,
  Phone,
  Mail,
  RotateCcw,
  ImageIcon,
  Sparkles,
} from 'lucide-react';
import Tesseract from 'tesseract.js';
import { useAuthStore } from '@/store/authStore';
import {
  getUser,
  updateUser,
  uploadProfileImage,
} from '@/lib/firebase-services';
import { User as UserType } from '@/types';
import Avatar from '@/components/ui/Avatar';

type WelcomeStep = 'greeting' | 'photo' | 'card-ocr' | 'card-form' | 'keywords' | 'done';

interface CardInfo {
  name: string;
  company: string;
  position: string;
  phone: string;
  email: string;
}

function WelcomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviterId = searchParams.get('inviter');
  const { user, setUser } = useAuthStore();

  const [step, setStep] = useState<WelcomeStep>('greeting');
  const [inviterName, setInviterName] = useState<string>('');
  const [profileImage, setProfileImage] = useState<string | undefined>(user?.profileImage);
  const [isUploading, setIsUploading] = useState(false);

  // OCR
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [cardInfo, setCardInfo] = useState<CardInfo>({
    name: user?.name || '',
    company: user?.company || '',
    position: user?.position || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Keywords
  const [keywords, setKeywords] = useState<string[]>(user?.keywords || []);
  const [newKeyword, setNewKeyword] = useState('');

  const suggestedKeywords = [
    '스타트업', '투자', 'AI', '마케팅', '디자인', '개발',
    '영업', '기획', '데이터', '블록체인', '핀테크', 'SaaS',
    'HR', '브랜딩', '콘텐츠', 'UX', 'PM', '창업',
  ];

  // 초대자 정보 조회
  useEffect(() => {
    if (inviterId) {
      getUser(inviterId).then((inviter) => {
        if (inviter) setInviterName(inviter.name);
      });
    }
  }, [inviterId]);

  // ==================== 이미지 전처리 & OCR ====================
  const preprocessImage = useCallback((imageData: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 2000;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d')!;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageDataObj.data;

        // 그레이스케일
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          data[i] = gray; data[i + 1] = gray; data[i + 2] = gray;
        }

        // 대비 강화
        let min = 255, max = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] < min) min = data[i];
          if (data[i] > max) max = data[i];
        }
        const range = max - min || 1;
        for (let i = 0; i < data.length; i += 4) {
          const val = Math.round(((data[i] - min) / range) * 255);
          data[i] = val; data[i + 1] = val; data[i + 2] = val;
        }

        // Otsu 이진화
        const histogram = new Array(256).fill(0);
        for (let i = 0; i < data.length; i += 4) histogram[data[i]]++;
        const totalPixels = data.length / 4;
        let sum = 0;
        for (let i = 0; i < 256; i++) sum += i * histogram[i];
        let sumB = 0, wB = 0, maxVariance = 0, threshold = 128;
        for (let t = 0; t < 256; t++) {
          wB += histogram[t];
          if (wB === 0) continue;
          const wF = totalPixels - wB;
          if (wF === 0) break;
          sumB += t * histogram[t];
          const mB = sumB / wB;
          const mF = (sum - sumB) / wF;
          const variance = wB * wF * (mB - mF) * (mB - mF);
          if (variance > maxVariance) { maxVariance = variance; threshold = t; }
        }
        for (let i = 0; i < data.length; i += 4) {
          const val = data[i] > threshold ? 255 : 0;
          data[i] = val; data[i + 1] = val; data[i + 2] = val;
        }

        ctx.putImageData(imageDataObj, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = imageData;
    });
  }, []);

  const parseBusinessCardText = useCallback((text: string): CardInfo => {
    const cleanedText = text.replace(/[|}{[\]<>]/g, '').replace(/\s{2,}/g, ' ');
    const lines = cleanedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const info: CardInfo = { name: '', company: '', position: '', phone: '', email: '' };

    // 이메일
    const emailMatch = cleanedText.match(/[a-zA-Z0-9._%+\-]+\s*@\s*[a-zA-Z0-9.\-]+\.\s*[a-zA-Z]{2,}/);
    if (emailMatch) info.email = emailMatch[0].replace(/\s/g, '');

    // 전화번호
    const phonePatterns = [
      /(?:T(?:el)?\.?\s*|M\.?\s*|H\.?\s*|HP\.?\s*|핸드폰\s*|휴대폰\s*|전화\s*|연락처\s*)?(?:\+?82[-.\s]?|0)(?:10|11|16|17|18|19)[-.\s]?\d{3,4}[-.\s]?\d{4}/i,
      /(?:T(?:el)?\.?\s*|전화\s*)?(?:\+?82[-.\s]?|0)(?:2|3[1-3]|4[1-4]|5[1-5]|6[1-4])[-.\s]?\d{3,4}[-.\s]?\d{4}/i,
      /(\d{2,4}[-.\s]\d{3,4}[-.\s]\d{4})/,
    ];
    for (const pattern of phonePatterns) {
      const match = cleanedText.match(pattern);
      if (match) {
        const numOnly = match[0].replace(/^[A-Za-z가-힣.\s:]+/, '').trim();
        info.phone = numOnly || match[0];
        break;
      }
    }

    const textLines = lines.filter(line => {
      if (/[a-zA-Z0-9._%+\-]+@/.test(line)) return false;
      if (/\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{4}/.test(line)) return false;
      if (/https?:\/\/|www\./i.test(line)) return false;
      if (/[Ff]ax|팩스|FAX/i.test(line)) return false;
      if (/[시구군동로길번지층호]/.test(line) && /\d/.test(line)) return false;
      if (/^[0-9\-.\s()+]+$/.test(line)) return false;
      return true;
    });

    // 이름
    for (const line of textLines) {
      const exactMatch = line.match(/^[가-힣]{2,4}$/);
      if (exactMatch) { info.name = exactMatch[0]; break; }
    }
    if (!info.name) {
      const posKw = '대표|이사|부장|차장|과장|대리|사원|매니저|팀장|실장|본부장|센터장|수석|선임|책임|주임|파트장|지점장|부서장|총괄|전무|상무';
      for (const line of textLines) {
        const inlineMatch = line.match(new RegExp(`([가-힣]{2,4})\\s+(?:${posKw})`));
        if (inlineMatch) { info.name = inlineMatch[1]; break; }
      }
    }
    if (!info.name) {
      for (const line of textLines) {
        const engName = line.match(/^[A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+$/);
        if (engName) { info.name = engName[0]; break; }
      }
    }
    if (!info.name) {
      for (const line of textLines) {
        if (line.length <= 10) {
          const nameInLine = line.match(/[가-힣]{2,4}/);
          if (nameInLine && !/대표|이사|부장|주식|회사|그룹/.test(line)) {
            info.name = nameInLine[0]; break;
          }
        }
      }
    }

    // 직책
    const positionKeywords = [
      '대표이사', '대표', '이사', '전무', '상무', '부사장', '사장',
      '부장', '차장', '과장', '대리', '사원', '주임', '계장',
      '매니저', '팀장', '실장', '본부장', '센터장', '지점장', '부서장',
      '수석', '선임', '책임', '파트장', '총괄', '리더', '파트너',
      'CEO', 'CTO', 'CFO', 'COO', 'CIO', 'CMO', 'CPO',
      'VP', 'SVP', 'EVP', 'Director', 'Manager', 'Lead',
      'Engineer', 'Developer', 'Designer', 'Analyst', 'Consultant',
    ];
    for (const line of textLines) {
      if (line === info.name) continue;
      if (positionKeywords.some(kw => line.toLowerCase().includes(kw.toLowerCase()))) {
        info.position = line.replace(info.name, '').trim();
        break;
      }
    }

    // 회사
    const companyKeywords = [
      '(주)', '주식회사', '㈜', '(株)', '유한회사',
      'Inc', 'Corp', 'Ltd', 'LLC', 'Co.', 'Co,',
      '그룹', '컴퍼니', 'Company', 'Group', 'Labs', 'Studio',
      '재단', '법인', '연구소', '협회', '학회',
    ];
    for (const line of textLines) {
      if (line === info.name || line === info.position) continue;
      if (companyKeywords.some(kw => line.includes(kw))) { info.company = line; break; }
    }
    if (!info.company) {
      for (const line of textLines) {
        if (line === info.name || line === info.position) continue;
        if (line.length >= 2 && line.length <= 30) { info.company = line; break; }
      }
    }

    return info;
  }, []);

  const runOcr = useCallback(async (imageData: string) => {
    setIsOcrProcessing(true);
    try {
      const processedImage = await preprocessImage(imageData);
      const result = await Tesseract.recognize(processedImage, 'kor+eng', { logger: () => {} });
      const parsed = parseBusinessCardText(result.data.text);
      const fieldCount = [parsed.name, parsed.company, parsed.phone, parsed.email].filter(v => v.length > 0).length;

      if (fieldCount < 2) {
        const fallbackResult = await Tesseract.recognize(imageData, 'kor+eng', { logger: () => {} });
        const fallbackParsed = parseBusinessCardText(fallbackResult.data.text);
        const fallbackCount = [fallbackParsed.name, fallbackParsed.company, fallbackParsed.phone, fallbackParsed.email].filter(v => v.length > 0).length;
        setCardInfo(prev => ({
          ...prev,
          ...(fallbackCount > fieldCount ? fallbackParsed : parsed),
        }));
      } else {
        setCardInfo(prev => ({ ...prev, ...parsed }));
      }
    } catch (err) {
      console.error('OCR error:', err);
    } finally {
      setIsOcrProcessing(false);
      setStep('card-form');
    }
  }, [preprocessImage, parseBusinessCardText]);

  // ==================== 핸들러 ====================
  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const imageUrl = await uploadProfileImage(user.id, file);
      await updateUser(user.id, { profileImage: imageUrl });
      setProfileImage(imageUrl);
      setUser({ ...user, profileImage: imageUrl });
    } catch (err) {
      console.error('Image upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCardImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setCardImage(imageData);
      runOcr(imageData);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCardInfo = async () => {
    if (!user) return;
    try {
      const updates: Partial<UserType> = {};
      if (cardInfo.name) updates.name = cardInfo.name;
      if (cardInfo.company) updates.company = cardInfo.company;
      if (cardInfo.position) updates.position = cardInfo.position;
      if (cardInfo.phone) updates.phone = cardInfo.phone;

      await updateUser(user.id, updates);
      setUser({ ...user, ...updates });
      setStep('keywords');
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  const toggleKeyword = (keyword: string) => {
    if (keywords.includes(keyword)) {
      setKeywords(keywords.filter(k => k !== keyword));
    } else if (keywords.length < 5) {
      setKeywords([...keywords, keyword]);
    }
  };

  const addCustomKeyword = () => {
    const kw = newKeyword.trim().replace(/^#/, '');
    if (kw && !keywords.includes(kw) && keywords.length < 5) {
      setKeywords([...keywords, kw]);
      setNewKeyword('');
    }
  };

  const handleSaveKeywords = async () => {
    if (!user) return;
    try {
      await updateUser(user.id, { keywords });
      setUser({ ...user, keywords });
      setStep('done');
      setTimeout(() => router.push('/card'), 2000);
    } catch (err) {
      console.error('Save keywords error:', err);
    }
  };

  const handleSkipToEnd = async () => {
    router.push('/card');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B162C] flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B162C] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="stars-bg" />
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-[#86C9F2]/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-[#2C529C]/10 rounded-full blur-[100px]" />

      <AnimatePresence mode="wait">
        {/* Step 1: 환영 인사 */}
        {step === 'greeting' && (
          <motion.div
            key="greeting"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center w-full max-w-[400px]"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-[#86C9F2] to-[#2C529C] flex items-center justify-center"
            >
              <Check size={48} className="text-white" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-bold text-white mb-3"
            >
              가입을 환영합니다!
            </motion.h1>

            {inviterName && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mb-6 p-4 bg-[#101D33]/80 border border-[#1E3A5F]/60 rounded-xl"
              >
                <p className="text-[#86C9F2] font-medium">
                  {inviterName}님과 인맥이 되었습니다!
                </p>
                <p className="text-[#4A5E7A] text-sm mt-1">
                  이제 서로의 네트워크를 확인할 수 있습니다
                </p>
              </motion.div>
            )}

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-[#8BA4C4] mb-8"
            >
              프로필을 완성하면 더 많은 인맥을 만들 수 있어요
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="space-y-3"
            >
              <button
                onClick={() => setStep('photo')}
                className="w-full py-3.5 bg-gradient-to-r from-[#86C9F2] to-[#2C529C] text-white font-semibold rounded-xl flex items-center justify-center gap-2"
              >
                프로필 완성하기
                <ArrowRight size={18} />
              </button>
              <button
                onClick={handleSkipToEnd}
                className="w-full py-3 text-[#4A5E7A] text-sm hover:text-[#8BA4C4] transition-colors"
              >
                나중에 하기
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Step 2: 프로필 사진 */}
        {step === 'photo' && (
          <motion.div
            key="photo"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="text-center w-full max-w-[400px]"
          >
            <div className="bg-[#101D33]/80 backdrop-blur-2xl border border-[#1E3A5F]/60 rounded-2xl p-8">
              <div className="flex items-center gap-2 mb-6">
                <Camera size={20} className="text-[#86C9F2]" />
                <h2 className="text-lg font-bold text-white">프로필 사진</h2>
              </div>

              <div className="relative inline-block mb-6">
                <Avatar
                  src={profileImage}
                  name={user.name}
                  size="xl"
                  hasGlow
                />
                <label className="absolute bottom-0 right-0 w-10 h-10 bg-gradient-to-r from-[#86C9F2] to-[#2C529C] rounded-full flex items-center justify-center cursor-pointer shadow-lg">
                  {isUploading ? (
                    <Loader2 size={18} className="text-white animate-spin" />
                  ) : (
                    <Camera size={18} className="text-white" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleProfileImageUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>

              <p className="text-[#8BA4C4] text-sm mb-6">
                프로필 사진을 등록하면 신뢰도가 높아져요
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => setStep('card-ocr')}
                  className="w-full py-3 bg-gradient-to-r from-[#86C9F2] to-[#2C529C] text-white font-semibold rounded-xl flex items-center justify-center gap-2"
                >
                  다음
                  <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => setStep('card-ocr')}
                  className="w-full py-2.5 text-[#4A5E7A] text-sm hover:text-[#8BA4C4] transition-colors"
                >
                  건너뛰기
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: 명함 촬영 */}
        {step === 'card-ocr' && (
          <motion.div
            key="card-ocr"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="text-center w-full max-w-[400px]"
          >
            <div className="bg-[#101D33]/80 backdrop-blur-2xl border border-[#1E3A5F]/60 rounded-2xl p-8">
              <div className="flex items-center gap-2 mb-6">
                <CreditCard size={20} className="text-[#86C9F2]" />
                <h2 className="text-lg font-bold text-white">명함으로 정보 입력</h2>
              </div>

              <p className="text-[#8BA4C4] text-sm mb-6">
                명함을 촬영하면 이름, 회사, 직책 등이<br />자동으로 입력됩니다
              </p>

              {isOcrProcessing ? (
                <div className="py-12">
                  <Loader2 size={40} className="text-[#86C9F2] animate-spin mx-auto mb-4" />
                  <p className="text-[#8BA4C4]">명함을 인식하고 있습니다...</p>
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full py-4 bg-[#162A4A] border border-[#1E3A5F] rounded-xl flex items-center justify-center gap-3 text-white hover:border-[#86C9F2] transition-colors"
                  >
                    <Camera size={22} className="text-[#86C9F2]" />
                    <span>명함 촬영하기</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 bg-[#162A4A] border border-[#1E3A5F] rounded-xl flex items-center justify-center gap-3 text-white hover:border-[#86C9F2] transition-colors"
                  >
                    <ImageIcon size={22} className="text-[#86C9F2]" />
                    <span>갤러리에서 선택</span>
                  </button>
                </div>
              )}

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCardImageSelect}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCardImageSelect}
                className="hidden"
              />

              <div className="space-y-3">
                <button
                  onClick={() => setStep('card-form')}
                  className="w-full py-2.5 text-[#86C9F2] text-sm hover:text-[#86C9F2]/80 transition-colors"
                >
                  직접 입력하기
                </button>
                <button
                  onClick={() => setStep('keywords')}
                  className="w-full py-2.5 text-[#4A5E7A] text-sm hover:text-[#8BA4C4] transition-colors"
                >
                  건너뛰기
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: 명함 정보 확인/수정 */}
        {step === 'card-form' && (
          <motion.div
            key="card-form"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="w-full max-w-[400px]"
          >
            <div className="bg-[#101D33]/80 backdrop-blur-2xl border border-[#1E3A5F]/60 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <CreditCard size={20} className="text-[#86C9F2]" />
                  <h2 className="text-lg font-bold text-white">정보 확인</h2>
                </div>
                {cardImage && (
                  <button
                    onClick={() => {
                      setCardImage(null);
                      setStep('card-ocr');
                    }}
                    className="text-sm text-[#4A5E7A] flex items-center gap-1 hover:text-[#8BA4C4]"
                  >
                    <RotateCcw size={14} />
                    다시 촬영
                  </button>
                )}
              </div>

              {cardImage && (
                <div className="mb-4 rounded-lg overflow-hidden border border-[#1E3A5F]">
                  <img src={cardImage} alt="명함" className="w-full h-32 object-cover" />
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-[#8BA4C4] text-xs mb-1 flex items-center gap-1">
                    <User size={12} /> 이름
                  </label>
                  <input
                    value={cardInfo.name}
                    onChange={(e) => setCardInfo({ ...cardInfo, name: e.target.value })}
                    placeholder="이름"
                    className="w-full bg-[#162A4A] border border-[#1E3A5F] text-white rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#86C9F2] placeholder:text-[#4A5E7A]"
                  />
                </div>
                <div>
                  <label className="text-[#8BA4C4] text-xs mb-1 flex items-center gap-1">
                    <Building2 size={12} /> 회사
                  </label>
                  <input
                    value={cardInfo.company}
                    onChange={(e) => setCardInfo({ ...cardInfo, company: e.target.value })}
                    placeholder="회사명"
                    className="w-full bg-[#162A4A] border border-[#1E3A5F] text-white rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#86C9F2] placeholder:text-[#4A5E7A]"
                  />
                </div>
                <div>
                  <label className="text-[#8BA4C4] text-xs mb-1 flex items-center gap-1">
                    <Briefcase size={12} /> 직책
                  </label>
                  <input
                    value={cardInfo.position}
                    onChange={(e) => setCardInfo({ ...cardInfo, position: e.target.value })}
                    placeholder="직책"
                    className="w-full bg-[#162A4A] border border-[#1E3A5F] text-white rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#86C9F2] placeholder:text-[#4A5E7A]"
                  />
                </div>
                <div>
                  <label className="text-[#8BA4C4] text-xs mb-1 flex items-center gap-1">
                    <Phone size={12} /> 전화번호
                  </label>
                  <input
                    value={cardInfo.phone}
                    onChange={(e) => setCardInfo({ ...cardInfo, phone: e.target.value })}
                    placeholder="010-0000-0000"
                    className="w-full bg-[#162A4A] border border-[#1E3A5F] text-white rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#86C9F2] placeholder:text-[#4A5E7A]"
                  />
                </div>
                <div>
                  <label className="text-[#8BA4C4] text-xs mb-1 flex items-center gap-1">
                    <Mail size={12} /> 이메일
                  </label>
                  <input
                    value={cardInfo.email}
                    onChange={(e) => setCardInfo({ ...cardInfo, email: e.target.value })}
                    placeholder="email@example.com"
                    className="w-full bg-[#162A4A] border border-[#1E3A5F] text-white rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#86C9F2] placeholder:text-[#4A5E7A]"
                    readOnly
                  />
                </div>
              </div>

              <button
                onClick={handleSaveCardInfo}
                className="w-full py-3 bg-gradient-to-r from-[#86C9F2] to-[#2C529C] text-white font-semibold rounded-xl flex items-center justify-center gap-2"
              >
                저장하고 다음
                <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 5: 키워드 선택 */}
        {step === 'keywords' && (
          <motion.div
            key="keywords"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="w-full max-w-[400px]"
          >
            <div className="bg-[#101D33]/80 backdrop-blur-2xl border border-[#1E3A5F]/60 rounded-2xl p-8">
              <div className="flex items-center gap-2 mb-2">
                <Hash size={20} className="text-[#86C9F2]" />
                <h2 className="text-lg font-bold text-white">나를 표현하는 #태그</h2>
              </div>
              <p className="text-[#4A5E7A] text-sm mb-6">
                관심 분야, 소속 단체 등 나를 표현하는 태그를 추가해보세요 (최대 5개)
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {suggestedKeywords.map((kw) => (
                  <button
                    key={kw}
                    onClick={() => toggleKeyword(kw)}
                    className={`
                      px-3 py-1.5 rounded-full text-sm transition-all
                      ${keywords.includes(kw)
                        ? 'bg-[#86C9F2]/20 text-[#86C9F2] border border-[#86C9F2]/40'
                        : 'bg-[#162A4A] text-[#8BA4C4] border border-[#1E3A5F] hover:border-[#4A5E7A]'}
                    `}
                  >
                    #{kw}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 mb-6">
                <input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomKeyword()}
                  placeholder="소속 단체, 동아리, 관심사 등"
                  className="flex-1 bg-[#162A4A] border border-[#1E3A5F] text-white rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-[#86C9F2] placeholder:text-[#4A5E7A]"
                />
                <button
                  onClick={addCustomKeyword}
                  disabled={!newKeyword.trim() || keywords.length >= 5}
                  className="px-4 py-2 bg-[#1E3A5F] text-[#86C9F2] rounded-lg text-sm disabled:opacity-40"
                >
                  추가
                </button>
              </div>

              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6 p-3 bg-[#162A4A]/50 rounded-lg">
                  {keywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-3 py-1 bg-[#86C9F2]/20 text-[#86C9F2] rounded-full text-sm flex items-center gap-1"
                    >
                      #{kw}
                      <button onClick={() => toggleKeyword(kw)}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleSaveKeywords}
                  className="w-full py-3 bg-gradient-to-r from-[#86C9F2] to-[#2C529C] text-white font-semibold rounded-xl flex items-center justify-center gap-2"
                >
                  완료
                  <Check size={18} />
                </button>
                <button
                  onClick={handleSkipToEnd}
                  className="w-full py-2.5 text-[#4A5E7A] text-sm hover:text-[#8BA4C4] transition-colors"
                >
                  건너뛰기
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 6: 완료 */}
        {step === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-[#00E676] to-[#00C853] flex items-center justify-center"
            >
              <Sparkles size={48} className="text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">프로필 완성!</h2>
            <p className="text-[#8BA4C4]">내 명함 페이지로 이동합니다...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 진행 표시 */}
      {step !== 'greeting' && step !== 'done' && (
        <div className="fixed bottom-8 flex gap-2">
          {['photo', 'card-ocr', 'keywords'].map((s, i) => {
            const stepOrder = ['photo', 'card-ocr', 'card-form', 'keywords'];
            const currentIdx = stepOrder.indexOf(step);
            const targetIdx = i;
            return (
              <div
                key={s}
                className={`w-2 h-2 rounded-full transition-all ${
                  targetIdx <= currentIdx ? 'bg-[#86C9F2]' : 'bg-[#1E3A5F]'
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B162C] flex items-center justify-center">
          <div className="spinner" />
        </div>
      }
    >
      <WelcomeContent />
    </Suspense>
  );
}
