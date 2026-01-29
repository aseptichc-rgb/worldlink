'use client';

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
  Crown,
  Sparkles,
  X
} from 'lucide-react';
import QRCode from 'qrcode';
import { useAuthStore } from '@/store/authStore';
import { useCardStore } from '@/store/cardStore';
import { BusinessCard } from '@/types';
import Avatar from '@/components/ui/Avatar';
import BottomNav from '@/components/ui/BottomNav';
import { isPremiumUser, PREMIUM_PRICE, PREMIUM_FEATURES, FREE_FEATURES } from '@/lib/subscription-utils';

export default function MyCardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { myCard, setMyCard, updateMyCard } = useCardStore();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 프리미엄 여부 확인
  const isPremium = isPremiumUser(user);

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

  // QR 코드 생성 - 공개 URL로 생성
  useEffect(() => {
    if (myCard && typeof window !== 'undefined') {
      // QR 코드에 공개 명함 보기 URL과 데이터 포함
      const cardData = {
        id: myCard.id,
        name: myCard.name,
        company: myCard.company,
        position: myCard.position,
        email: myCard.email,
        phone: myCard.phone,
        bio: myCard.bio,
        profileImage: myCard.profileImage,
        keywords: myCard.keywords,
      };
      const encodedData = encodeURIComponent(JSON.stringify(cardData));
      const qrUrl = `${window.location.origin}/view/${myCard.id}?data=${encodedData}`;

      QRCode.toDataURL(qrUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#86C9F2',
          light: '#0B162C',
        },
      }).then(setQrDataUrl);
    }
  }, [myCard]);

  const getShareUrl = () => {
    if (!myCard) return '';
    const cardData = {
      id: myCard.id,
      name: myCard.name,
      company: myCard.company,
      position: myCard.position,
      email: myCard.email,
      phone: myCard.phone,
      bio: myCard.bio,
      profileImage: myCard.profileImage,
      keywords: myCard.keywords,
    };
    const encodedData = encodeURIComponent(JSON.stringify(cardData));
    return `${window.location.origin}/view/${myCard.id}?data=${encodedData}`;
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
      <div className="min-h-screen bg-[#0B162C] flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B162C] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0B162C]/80 backdrop-blur-xl border-b border-[#1E3A5F]">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white">내 명함</h1>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 -mr-2"
          >
            <Settings size={24} className="text-[#8BA4C4]" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* 명함 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#162A4A] to-[#101D33] border border-[#1E3A5F]"
        >
          {/* 배경 장식 */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#86C9F2]/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[#2C529C]/10 to-transparent rounded-full blur-3xl" />

          <div className="relative p-6">
            {/* 프로필 섹션 */}
            <div className="flex items-start gap-4 mb-6">
              <Avatar
                src={myCard.profileImage}
                name={myCard.name}
                size="xl"
                hasGlow
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white mb-1">{myCard.name}</h2>
                {myCard.position && (
                  <div className="flex items-center gap-2 text-[#8BA4C4] mb-1">
                    <Briefcase size={14} />
                    <span className="text-sm">{myCard.position}</span>
                  </div>
                )}
                {myCard.company && (
                  <div className="flex items-center gap-2 text-[#8BA4C4]">
                    <Building2 size={14} />
                    <span className="text-sm">{myCard.company}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 키워드 태그 */}
            {myCard.keywords && myCard.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {myCard.keywords.slice(0, 5).map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 text-xs font-medium rounded-full bg-[#86C9F2]/10 text-[#86C9F2] border border-[#86C9F2]/20"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}

            {/* QR 코드 섹션 */}
            <div className="flex flex-col items-center py-6 border-t border-[#1E3A5F]">
              {isPremium ? (
                // 프리미엄 사용자: QR 코드 표시
                qrDataUrl ? (
                  <motion.img
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    src={qrDataUrl}
                    alt="My QR Code"
                    className="w-48 h-48 rounded-xl"
                  />
                ) : (
                  <div className="w-48 h-48 rounded-xl bg-[#162A4A] flex items-center justify-center">
                    <QrCode size={48} className="text-[#4A5E7A]" />
                  </div>
                )
              ) : (
                // 무료 사용자: 잠금 상태
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="relative w-48 h-48 rounded-xl bg-[#162A4A] flex flex-col items-center justify-center group overflow-hidden"
                >
                  {/* 블러된 QR 코드 배경 */}
                  <div className="absolute inset-0 opacity-30 blur-sm">
                    <QrCode size={120} className="text-[#4A5E7A] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  {/* 잠금 오버레이 */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Crown size={28} className="text-white" />
                    </div>
                    <span className="text-white font-medium text-sm">프리미엄 기능</span>
                    <span className="text-[#8BA4C4] text-xs mt-1">탭하여 업그레이드</span>
                  </div>
                </button>
              )}
              <p className="mt-4 text-sm text-[#8BA4C4]">
                {isPremium
                  ? 'QR 코드를 스캔하면 명함을 저장할 수 있어요'
                  : '프리미엄으로 업그레이드하여 QR 명함을 만들어보세요'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* 액션 버튼들 */}
        <div className="grid grid-cols-3 gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={isPremium ? handleShare : () => setShowUpgradeModal(true)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl bg-[#162A4A] border border-[#1E3A5F] relative ${!isPremium ? 'opacity-60' : ''}`}
          >
            <Share2 size={24} className="text-[#86C9F2]" />
            <span className="text-sm text-white">공유하기</span>
            {!isPremium && (
              <div className="absolute top-2 right-2">
                <Crown size={14} className="text-[#FFD700]" />
              </div>
            )}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={isPremium ? handleCopyLink : () => setShowUpgradeModal(true)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl bg-[#162A4A] border border-[#1E3A5F] relative ${!isPremium ? 'opacity-60' : ''}`}
          >
            {copied ? (
              <Check size={24} className="text-[#00E676]" />
            ) : (
              <Copy size={24} className="text-[#86C9F2]" />
            )}
            <span className="text-sm text-white">{copied ? '복사됨!' : '링크 복사'}</span>
            {!isPremium && (
              <div className="absolute top-2 right-2">
                <Crown size={14} className="text-[#FFD700]" />
              </div>
            )}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={isPremium ? handleDownloadQR : () => setShowUpgradeModal(true)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl bg-[#162A4A] border border-[#1E3A5F] relative ${!isPremium ? 'opacity-60' : ''}`}
          >
            <Download size={24} className="text-[#86C9F2]" />
            <span className="text-sm text-white">QR 저장</span>
            {!isPremium && (
              <div className="absolute top-2 right-2">
                <Crown size={14} className="text-[#FFD700]" />
              </div>
            )}
          </motion.button>
        </div>

        {/* 무료 사용자용 프리미엄 안내 배너 */}
        {!isPremium && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setShowUpgradeModal(true)}
            className="w-full p-4 rounded-xl bg-gradient-to-r from-[#FFD700]/20 to-[#FFA500]/20 border border-[#FFD700]/30 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] flex items-center justify-center flex-shrink-0">
              <Sparkles size={24} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-white font-semibold">프리미엄으로 업그레이드</h3>
              <p className="text-[#8BA4C4] text-sm">QR 명함 생성 및 공유 기능을 이용하세요</p>
            </div>
            <span className="text-[#FFD700] font-bold text-sm">
              ₩{PREMIUM_PRICE.monthly.toLocaleString()}/월
            </span>
          </motion.button>
        )}

        {/* 인맥 공개 설정 미리보기 */}
        <div className="p-4 rounded-xl bg-[#162A4A] border border-[#1E3A5F]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-[#2C529C]" />
              <span className="text-sm font-medium text-white">인맥 공개 설정</span>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="text-xs text-[#86C9F2]"
            >
              변경
            </button>
          </div>
          <div className="flex items-center gap-2 text-[#8BA4C4]">
            {(() => {
              const option = visibilityOptions.find(o => o.value === myCard.networkVisibility);
              if (option) {
                const Icon = option.icon;
                return (
                  <>
                    <Icon size={16} />
                    <span className="text-sm">{option.label}: {option.desc}</span>
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
              className="w-full bg-[#162A4A] rounded-t-3xl border-t border-[#1E3A5F] p-6"
            >
              <div className="w-12 h-1 bg-[#4A5E7A] rounded-full mx-auto mb-6" />

              <h3 className="text-lg font-semibold text-white mb-4">인맥 공개 범위</h3>
              <p className="text-sm text-[#8BA4C4] mb-6">
                내 명함을 받은 사람이 내 인맥을 얼마나 볼 수 있을지 설정하세요
              </p>

              <div className="space-y-3">
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
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-[#86C9F2]/10 border-[#86C9F2]'
                          : 'bg-[#101D33] border-[#1E3A5F] hover:border-[#4A5E7A]'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#86C9F2]/20' : 'bg-[#1E3A5F]'}`}>
                        <Icon size={20} className={isSelected ? 'text-[#86C9F2]' : 'text-[#8BA4C4]'} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`font-medium ${isSelected ? 'text-[#86C9F2]' : 'text-white'}`}>
                          {option.label}
                        </p>
                        <p className="text-sm text-[#8BA4C4]">{option.desc}</p>
                      </div>
                      {isSelected && (
                        <Check size={20} className="text-[#86C9F2]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 프리미엄 업그레이드 모달 */}
      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end"
            onClick={() => setShowUpgradeModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-h-[90vh] bg-[#162A4A] rounded-t-3xl border-t border-[#1E3A5F] overflow-hidden"
            >
              {/* 헤더 */}
              <div className="relative px-6 pt-6 pb-4">
                <div className="w-12 h-1 bg-[#4A5E7A] rounded-full mx-auto mb-4" />
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="absolute top-6 right-4 p-2 rounded-full hover:bg-[#1E3A5F] transition-colors"
                >
                  <X size={20} className="text-[#8BA4C4]" />
                </button>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] flex items-center justify-center">
                    <Crown size={32} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">NODDED 프리미엄</h2>
                  <p className="text-[#8BA4C4] text-sm">나만의 QR 명함으로 네트워킹을 시작하세요</p>
                </div>
              </div>

              {/* 가격 옵션 */}
              <div className="px-6 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <button className="p-4 rounded-xl border-2 border-[#86C9F2] bg-[#86C9F2]/10 text-left">
                    <div className="text-xs text-[#86C9F2] font-medium mb-1">월간 구독</div>
                    <div className="text-2xl font-bold text-white">₩{PREMIUM_PRICE.monthly.toLocaleString()}</div>
                    <div className="text-xs text-[#8BA4C4]">매월 결제</div>
                  </button>
                  <button className="p-4 rounded-xl border border-[#1E3A5F] bg-[#101D33] text-left relative">
                    <div className="absolute -top-2 right-2 px-2 py-0.5 bg-[#00E676] text-black text-[10px] font-bold rounded-full">
                      33% 할인
                    </div>
                    <div className="text-xs text-[#8BA4C4] font-medium mb-1">연간 구독</div>
                    <div className="text-2xl font-bold text-white">₩{PREMIUM_PRICE.yearly.toLocaleString()}</div>
                    <div className="text-xs text-[#8BA4C4]">연 1회 결제</div>
                  </button>
                </div>
              </div>

              {/* 프리미엄 기능 목록 */}
              <div className="px-6 py-4 overflow-y-auto max-h-[40vh]">
                <h3 className="text-sm font-semibold text-[#FFD700] mb-3 flex items-center gap-2">
                  <Crown size={14} />
                  프리미엄 기능
                </h3>
                <div className="space-y-3">
                  {PREMIUM_FEATURES.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#FFD700]/20 flex items-center justify-center flex-shrink-0">
                        <Check size={16} className="text-[#FFD700]" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium text-sm">{feature.title}</h4>
                        <p className="text-[#8BA4C4] text-xs">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <h3 className="text-sm font-semibold text-[#8BA4C4] mt-6 mb-3">무료 기능 (모든 사용자)</h3>
                <div className="space-y-2">
                  {FREE_FEATURES.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <Check size={14} className="text-[#00E676]" />
                      <span className="text-[#8BA4C4] text-sm">{feature.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA 버튼 */}
              <div className="px-6 py-6 border-t border-[#1E3A5F] bg-[#101D33]">
                <button
                  onClick={() => {
                    // TODO: 실제 결제 연동
                    alert('결제 기능은 준비 중입니다.');
                  }}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white font-bold text-lg flex items-center justify-center gap-2"
                >
                  <Crown size={20} />
                  프리미엄 시작하기
                </button>
                <p className="text-center text-[#4A5E7A] text-xs mt-3">
                  언제든지 해지 가능 · 7일 무료 체험
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
