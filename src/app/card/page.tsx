'use client';

// Force dynamic rendering to prevent build-time Firebase initialization
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Share2,
  Download,
  Settings,
  QrCode,
  Copy,
  Check,
  Users,
  Building2,
  Briefcase,
  Globe,
  Lock,
  UserCheck,
} from 'lucide-react';
import QRCode from 'qrcode';
import { useAuthStore } from '@/store/authStore';
import { useCardStore } from '@/store/cardStore';
import { BusinessCard } from '@/types';
import { savePublicCard } from '@/lib/firebase-services';
import Avatar from '@/components/ui/Avatar';
import BottomNav from '@/components/ui/BottomNav';

export default function MyCardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { myCard, setMyCard, updateMyCard } = useCardStore();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 명함이 없으면 자동 생성, 있으면 user 데이터와 동기화
  useEffect(() => {
    if (user) {
      if (!myCard) {
        const newCard: BusinessCard = {
          id: user.id,
          userId: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          company: user.company,
          position: user.position,
          bio: user.bio,
          profileImage: user.profileImage,
          keywords: user.keywords || [],
          networkVisibility: 'connections_only',
          qrCode: `nexus://card/${user.id}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setMyCard(newCard);
      } else {
        // user 데이터가 변경되면 명함도 동기화
        const needsUpdate =
          myCard.name !== user.name ||
          myCard.email !== user.email ||
          myCard.phone !== user.phone ||
          myCard.company !== user.company ||
          myCard.position !== user.position ||
          myCard.bio !== user.bio ||
          myCard.profileImage !== user.profileImage ||
          JSON.stringify(myCard.keywords) !== JSON.stringify(user.keywords || []);

        if (needsUpdate) {
          updateMyCard({
            name: user.name,
            email: user.email,
            phone: user.phone,
            company: user.company,
            position: user.position,
            bio: user.bio,
            profileImage: user.profileImage,
            keywords: user.keywords || [],
            updatedAt: new Date(),
          });
        }
      }
    }
  }, [user, myCard, setMyCard, updateMyCard]);

  // Firebase에 공개 명함 데이터 저장 + QR 코드 생성
  useEffect(() => {
    if (myCard && typeof window !== 'undefined') {
      // Firebase에 공개 명함 저장
      savePublicCard({
        id: myCard.id,
        name: myCard.name,
        company: myCard.company,
        position: myCard.position,
        email: myCard.email,
        phone: myCard.phone,
        bio: myCard.bio,
        profileImage: myCard.profileImage,
        keywords: myCard.keywords,
      }).catch(console.error);

      // QR 코드에는 간결한 URL만 포함 (데이터는 Firebase에서 fetch)
      const qrUrl = `${window.location.origin}/view/${myCard.id}`;

      QRCode.toDataURL(qrUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#58A6FF',
          light: '#0D1117',
        },
      }).then(setQrDataUrl);
    }
  }, [myCard]);

  const getShareUrl = () => {
    if (!myCard) return '';
    return `${window.location.origin}/view/${myCard.id}`;
  };

  const handleCopyLink = async () => {
    if (myCard) {
      const shareUrl = getShareUrl();
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (myCard && navigator.share) {
      try {
        await navigator.share({
          title: `${myCard.name}의 명함`,
          text: `${myCard.name} | ${myCard.position} @ ${myCard.company}`,
          url: getShareUrl(),
        });
      } catch (err) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadQR = () => {
    if (qrDataUrl) {
      const link = document.createElement('a');
      link.download = `${myCard?.name || 'nexus'}_qr.png`;
      link.href = qrDataUrl;
      link.click();
    }
  };

  const visibilityOptions = [
    { value: 'public', label: '전체 공개', icon: Globe, desc: '누구나 내 인맥을 볼 수 있음' },
    { value: 'connections_only', label: '1촌만', icon: UserCheck, desc: '명함 교환한 사람만' },
    { value: 'private', label: '비공개', icon: Lock, desc: '아무도 볼 수 없음' },
  ] as const;

  if (!user || !myCard) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1117] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0D1117]/80 backdrop-blur-xl border-b border-[#30363D]">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white">내 명함</h1>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 -mr-2"
          >
            <Settings size={24} className="text-[#8B949E]" />
          </button>
        </div>
      </div>

      <div className="px-5 py-6 space-y-7">
        {/* 명함 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1C2333] to-[#161B22] border border-[#30363D]"
        >
          {/* 배경 장식 */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#58A6FF]/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[#1F6FEB]/10 to-transparent rounded-full blur-3xl" />

          <div className="relative p-7">
            {/* 프로필 섹션 */}
            <div className="flex items-start gap-5 mb-7">
              <Avatar
                src={myCard.profileImage}
                name={myCard.name}
                size="xl"
                hasGlow
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white mb-2">{myCard.name}</h2>
                {myCard.position && (
                  <div className="flex items-center gap-2 text-[#8B949E] mb-1.5">
                    <Briefcase size={14} />
                    <span className="text-base">{myCard.position}</span>
                  </div>
                )}
                {myCard.company && (
                  <div className="flex items-center gap-2 text-[#8B949E]">
                    <Building2 size={14} />
                    <span className="text-base">{myCard.company}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 키워드 태그 */}
            {myCard.keywords && myCard.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2.5 mb-7">
                {myCard.keywords.slice(0, 5).map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 text-sm font-medium rounded-full bg-transparent text-[#7EE0FF] border border-[#7EE0FF]"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}

            {/* QR 코드 섹션 */}
            <div className="flex flex-col items-center py-7 border-t border-[#30363D]">
              {qrDataUrl ? (
                <motion.img
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  src={qrDataUrl}
                  alt="My QR Code"
                  className="w-48 h-48 rounded-xl"
                />
              ) : (
                <div className="w-48 h-48 rounded-xl bg-[#1C2333] flex items-center justify-center">
                  <QrCode size={48} className="text-[#484F58]" />
                </div>
              )}
              <p className="mt-5 text-base text-[#8B949E]">
                QR 코드를 스캔하면 명함을 저장할 수 있어요
              </p>
            </div>
          </div>
        </motion.div>

        {/* 액션 버튼들 */}
        <div className="grid grid-cols-3 gap-3.5">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleShare}
            className="flex flex-col items-center gap-3 p-5 rounded-xl bg-[#1C2333] border border-[#30363D]"
          >
            <Share2 size={24} className="text-[#58A6FF]" />
            <span className="text-base text-white">공유하기</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCopyLink}
            className="flex flex-col items-center gap-3 p-5 rounded-xl bg-[#1C2333] border border-[#30363D]"
          >
            {copied ? (
              <Check size={24} className="text-[#3FB950]" />
            ) : (
              <Copy size={24} className="text-[#58A6FF]" />
            )}
            <span className="text-base text-white">{copied ? '복사됨!' : '링크 복사'}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleDownloadQR}
            className="flex flex-col items-center gap-3 p-5 rounded-xl bg-[#1C2333] border border-[#30363D]"
          >
            <Download size={24} className="text-[#58A6FF]" />
            <span className="text-base text-white">QR 저장</span>
          </motion.button>
        </div>

        {/* 인맥 공개 설정 미리보기 */}
        <div className="p-5 rounded-xl bg-[#1C2333] border border-[#30363D]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users size={18} className="text-[#1F6FEB]" />
              <span className="text-base font-medium text-white">인맥 공개 설정</span>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="text-sm text-[#58A6FF]"
            >
              변경
            </button>
          </div>
          <div className="flex items-center gap-2 text-[#8B949E]">
            {(() => {
              const option = visibilityOptions.find(o => o.value === myCard.networkVisibility);
              if (option) {
                const Icon = option.icon;
                return (
                  <>
                    <Icon size={16} />
                    <span className="text-base">{option.label}: {option.desc}</span>
                  </>
                );
              }
              return null;
            })()}
          </div>
        </div>
      </div>

      {/* 인맥 공개 설정 모달 */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-[#1C2333] rounded-t-2xl border-t border-[#30363D] px-8 py-7"
            >
              <div className="w-12 h-1 bg-[#484F58] rounded-full mx-auto mb-6" />

              <h3 className="text-lg font-semibold text-white mb-4">인맥 공개 범위</h3>
              <p className="text-base text-[#8B949E] mb-7 leading-relaxed">
                내 명함을 받은 사람이 내 인맥을 얼마나 볼 수 있을지 설정하세요
              </p>

              <div className="space-y-3.5">
                {visibilityOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = myCard.networkVisibility === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        updateMyCard({ networkVisibility: option.value });
                        setShowSettings(false);
                      }}
                      className={`w-full flex items-center gap-4 p-5 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-[#58A6FF]/10 border-[#58A6FF]'
                          : 'bg-[#161B22] border-[#30363D] hover:border-[#484F58]'
                      }`}
                    >
                      <div className={`p-2.5 rounded-lg ${isSelected ? 'bg-[#58A6FF]/20' : 'bg-[#30363D]'}`}>
                        <Icon size={20} className={isSelected ? 'text-[#58A6FF]' : 'text-[#8B949E]'} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`font-medium ${isSelected ? 'text-[#58A6FF]' : 'text-white'}`}>
                          {option.label}
                        </p>
                        <p className="text-base text-[#8B949E] mt-0.5">{option.desc}</p>
                      </div>
                      {isSelected && (
                        <Check size={20} className="text-[#58A6FF]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
