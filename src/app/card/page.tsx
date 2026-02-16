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
          dark: '#2563EB',
          light: '#FFFFFF',
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
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-[#E2E8F0]">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-[#1A1A2E]" />
          </button>
          <h1 className="text-lg font-semibold text-[#1A1A2E]">내 명함</h1>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 -mr-2"
          >
            <Settings size={24} className="text-[#64748B]" />
          </button>
        </div>
      </div>

      <div className="px-5 py-6 space-y-7">
        {/* 명함 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl bg-white border border-[#E2E8F0] shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
        >
          {/* 배경 장식 */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#2563EB]/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[#3B82F6]/10 to-transparent rounded-full blur-3xl" />

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
                <h2 className="text-2xl font-bold text-[#1A1A2E] mb-1">{myCard.name}</h2>
                {myCard.position && (
                  <div className="flex items-center gap-2 text-[#64748B] mb-1">
                    <Briefcase size={14} />
                    <span className="text-base">{myCard.position}</span>
                  </div>
                )}
                {myCard.company && (
                  <div className="flex items-center gap-2 text-[#64748B]">
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
                    className="px-3.5 py-1.5 text-sm font-medium rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}

            {/* QR 코드 섹션 */}
            <div className="flex flex-col items-center py-7 border-t border-[#E2E8F0]">
              {qrDataUrl ? (
                <motion.img
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  src={qrDataUrl}
                  alt="My QR Code"
                  className="w-48 h-48 rounded-xl"
                />
              ) : (
                <div className="w-48 h-48 rounded-xl bg-[#F1F3F5] flex items-center justify-center">
                  <QrCode size={48} className="text-[#94A3B8]" />
                </div>
              )}
              <p className="mt-4 text-base text-[#64748B]">
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
            className="flex flex-col items-center gap-3 p-5 rounded-xl bg-white border border-[#E2E8F0]"
          >
            <Share2 size={24} className="text-[#2563EB]" />
            <span className="text-base text-[#1A1A2E]">공유하기</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCopyLink}
            className="flex flex-col items-center gap-3 p-5 rounded-xl bg-white border border-[#E2E8F0]"
          >
            {copied ? (
              <Check size={24} className="text-[#10B981]" />
            ) : (
              <Copy size={24} className="text-[#2563EB]" />
            )}
            <span className="text-base text-[#1A1A2E]">{copied ? '복사됨!' : '링크 복사'}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleDownloadQR}
            className="flex flex-col items-center gap-3 p-5 rounded-xl bg-white border border-[#E2E8F0]"
          >
            <Download size={24} className="text-[#2563EB]" />
            <span className="text-base text-[#1A1A2E]">QR 저장</span>
          </motion.button>
        </div>

        {/* 인맥 공개 설정 미리보기 */}
        <div className="p-5 rounded-xl bg-white border border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users size={18} className="text-[#3B82F6]" />
              <span className="text-base font-medium text-[#1A1A2E]">인맥 공개 설정</span>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="text-sm text-[#2563EB]"
            >
              변경
            </button>
          </div>
          <div className="flex items-center gap-2 text-[#64748B]">
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
            className="fixed inset-0 z-50 bg-[rgba(0,0,0,0.3)] backdrop-blur-sm flex items-end"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-white rounded-t-2xl border-t border-[#E2E8F0] px-8 py-7"
            >
              <div className="w-12 h-1 bg-[#CBD5E1] rounded-full mx-auto mb-6" />

              <h3 className="text-lg font-semibold text-[#1A1A2E] mb-4">인맥 공개 범위</h3>
              <p className="text-base text-[#64748B] mb-7 leading-relaxed">
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
                          ? 'bg-[#EFF6FF] border-[#2563EB]'
                          : 'bg-[#F8F9FA] border-[#E2E8F0] hover:border-[#94A3B8]'
                      }`}
                    >
                      <div className={`p-2.5 rounded-lg ${isSelected ? 'bg-[#DBEAFE]' : 'bg-[#E2E8F0]'}`}>
                        <Icon size={20} className={isSelected ? 'text-[#2563EB]' : 'text-[#64748B]'} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`font-medium ${isSelected ? 'text-[#2563EB]' : 'text-[#1A1A2E]'}`}>
                          {option.label}
                        </p>
                        <p className="text-base text-[#64748B] mt-0.5">{option.desc}</p>
                      </div>
                      {isSelected && (
                        <Check size={20} className="text-[#2563EB]" />
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
