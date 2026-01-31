'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2,
  Download,
  Building2,
  Briefcase,
  Phone,
  Mail,
  MessageCircle,
  UserPlus,
  X,
  Smartphone,
  Plus,
} from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { BusinessCard } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useCardStore } from '@/store/cardStore';
import { getPublicCard } from '@/lib/firebase-services';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PublicCardViewPage({ params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = use(params);
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { addSavedCard, savedCards } = useCardStore();

  const [card, setCard] = useState<BusinessCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authAction, setAuthAction] = useState<'message' | 'save' | null>(null);
  const [showPwaPrompt, setShowPwaPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isIos, setIsIos] = useState(false);

  // PWA 설치 프롬프트 캡처
  useEffect(() => {
    // 이미 설치되었는지 확인
    if (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true) {
      setIsInstalled(true);
    }

    // iOS 감지
    const ua = window.navigator.userAgent;
    const isIosDevice = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIos(isIosDevice);

    if (!isIosDevice) {
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setTimeout(() => setShowPwaPrompt(true), 2000);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    } else {
      // iOS: 자동으로 안내 표시
      setTimeout(() => setShowPwaPrompt(true), 2000);
    }
  }, []);

  // 명함 데이터 로드 (Firebase에서 가져오기)
  useEffect(() => {
    const loadCard = async () => {
      setLoading(true);
      try {
        // 1. Firebase에서 공개 명함 조회
        const publicCard = await getPublicCard(cardId);
        if (publicCard) {
          setCard({
            id: publicCard.id,
            userId: publicCard.id,
            name: publicCard.name,
            company: publicCard.company,
            position: publicCard.position,
            email: publicCard.email,
            phone: publicCard.phone,
            bio: publicCard.bio,
            profileImage: publicCard.profileImage,
            keywords: publicCard.keywords || [],
            networkVisibility: 'connections_only',
            qrCode: '',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          setLoading(false);
          return;
        }

        // 2. 하위 호환: URL data 파라미터 (이전 QR 코드 지원)
        const urlParams = new URLSearchParams(window.location.search);
        const cardData = urlParams.get('data');
        if (cardData) {
          const parsed = JSON.parse(decodeURIComponent(cardData));
          setCard({
            id: parsed.id,
            userId: parsed.id,
            name: parsed.name,
            company: parsed.company,
            position: parsed.position,
            email: parsed.email,
            phone: parsed.phone,
            bio: parsed.bio,
            profileImage: parsed.profileImage,
            keywords: parsed.keywords || [],
            networkVisibility: 'connections_only',
            qrCode: '',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          setLoading(false);
          return;
        }

        // 3. localStorage 폴백
        const cardStore = localStorage.getItem('nexus-cards');
        if (cardStore) {
          const parsed = JSON.parse(cardStore);
          if (parsed.state?.myCard?.id === cardId) {
            setCard(parsed.state.myCard);
            setLoading(false);
            return;
          }
          const savedCard = parsed.state?.savedCards?.find(
            (sc: { card: BusinessCard }) => sc.card.id === cardId
          );
          if (savedCard) {
            setCard(savedCard.card);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error('Failed to load card data', e);
      }
      setLoading(false);
    };
    loadCard();
  }, [cardId]);

  // 이미 저장된 카드인지 확인
  useEffect(() => {
    if (card && savedCards.some(sc => sc.cardId === card.id)) {
      setSaved(true);
    }
  }, [card, savedCards]);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
    setShowPwaPrompt(false);
  };

  const handleSaveCard = () => {
    if (!card) return;

    // 로그인 없이 로컬에 저장
    const savedCard = {
      id: `saved_${Date.now()}`,
      ownerId: 'guest',
      cardId: card.id,
      card: card,
      savedAt: new Date(),
    };
    addSavedCard(savedCard);
    setSaved(true);
  };

  const handleSendMessage = () => {
    if (!isAuthenticated) {
      setAuthAction('message');
      setShowAuthModal(true);
      return;
    }
    // 메시지 보내기 페이지로 이동
    router.push(`/messages/new?to=${card?.id}`);
  };

  const handleShare = async () => {
    if (card && navigator.share) {
      try {
        await navigator.share({
          title: `${card.name}의 명함`,
          text: `${card.name} | ${card.position} @ ${card.company}`,
          url: window.location.href,
        });
      } catch {
        // 공유 취소 시 무시
      }
    }
  };

  const handleAuthRedirect = () => {
    // 인증 후 돌아올 URL 저장
    sessionStorage.setItem('redirectAfterAuth', window.location.href);
    router.push('/onboarding');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B162C] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#86C9F2] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-[#0B162C] flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#162A4A] flex items-center justify-center">
            <UserPlus size={32} className="text-[#4A5E7A]" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">명함을 찾을 수 없습니다</h1>
          <p className="text-[#8BA4C4] mb-6">QR 코드가 유효하지 않거나 만료되었습니다</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-[#86C9F2] text-[#0B162C] font-semibold rounded-xl"
          >
            홈으로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B162C]">
      {/* 헤더 */}
      <div className="sticky top-0 z-30 bg-[#0B162C]/80 backdrop-blur-xl border-b border-[#1E3A5F]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#86C9F2] to-[#2C529C] flex items-center justify-center">
              <span className="text-xs font-bold text-white">N</span>
            </div>
            <span className="text-lg font-bold text-white">NODDED</span>
          </div>
          <button onClick={handleShare} className="p-2">
            <Share2 size={20} className="text-[#8BA4C4]" />
          </button>
        </div>
      </div>

      <div className="p-4 pb-32 space-y-6">
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
                src={card.profileImage}
                name={card.name}
                size="xl"
                hasGlow
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white mb-1">{card.name}</h2>
                {card.position && (
                  <div className="flex items-center gap-2 text-[#8BA4C4] mb-1">
                    <Briefcase size={14} />
                    <span className="text-sm">{card.position}</span>
                  </div>
                )}
                {card.company && (
                  <div className="flex items-center gap-2 text-[#8BA4C4]">
                    <Building2 size={14} />
                    <span className="text-sm">{card.company}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 연락처 정보 */}
            {(card.email || card.phone) && (
              <div className="space-y-2 mb-6 p-4 rounded-xl bg-[#101D33]/50">
                {card.email && (
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-[#86C9F2]" />
                    <span className="text-sm text-white">{card.email}</span>
                  </div>
                )}
                {card.phone && (
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-[#86C9F2]" />
                    <span className="text-sm text-white">{card.phone}</span>
                  </div>
                )}
              </div>
            )}

            {/* 소개 */}
            {card.bio && (
              <p className="text-sm text-[#8BA4C4] mb-6 leading-relaxed">
                {card.bio}
              </p>
            )}

            {/* 키워드 태그 */}
            {card.keywords && card.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {card.keywords.slice(0, 6).map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 text-xs font-medium rounded-full bg-[#86C9F2]/10 text-[#86C9F2] border border-[#86C9F2]/20"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* PWA 설치 안내 */}
        {!isInstalled && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-gradient-to-r from-[#2C529C]/20 to-[#86C9F2]/20 border border-[#2C529C]/30"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#2C529C]/20">
                <Smartphone size={20} className="text-[#2C529C]" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white mb-1">
                  앱으로 저장하기
                </h3>
                {isIos ? (
                  <div className="space-y-2">
                    <p className="text-xs text-[#8BA4C4]">
                      Safari에서 아래 단계를 따라주세요:
                    </p>
                    <div className="space-y-1.5 text-xs text-[#8BA4C4]">
                      <p>1. 하단 <span className="text-white font-medium">공유 버튼</span> (□↑) 탭</p>
                      <p>2. <span className="text-white font-medium">&quot;홈 화면에 추가&quot;</span> 선택</p>
                      <p>3. <span className="text-white font-medium">&quot;추가&quot;</span> 탭</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-[#8BA4C4] mb-3">
                      홈 화면에 추가하면 언제든 명함을 확인할 수 있어요
                    </p>
                    <button
                      onClick={handleInstallPwa}
                      className="flex items-center gap-2 px-4 py-2 bg-[#2C529C] text-white text-sm font-medium rounded-lg"
                    >
                      <Download size={16} />
                      홈 화면에 추가
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* 저장 완료 알림 */}
        {saved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-xl bg-[#00E676]/10 border border-[#00E676]/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#00E676]/20 flex items-center justify-center">
                <UserPlus size={20} className="text-[#00E676]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#00E676]">명함이 저장되었습니다!</p>
                <p className="text-xs text-[#8BA4C4]">내 명함첩에서 확인할 수 있어요</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0B162C] via-[#0B162C] to-transparent pt-8">
        <div className="flex gap-3 max-w-lg mx-auto">
          {!saved ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveCard}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#86C9F2] text-[#0B162C] font-semibold rounded-xl"
            >
              <Plus size={20} />
              명함 저장하기
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSendMessage}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#86C9F2] text-[#0B162C] font-semibold rounded-xl"
            >
              <MessageCircle size={20} />
              메시지 보내기
            </motion.button>
          )}
        </div>
        <p className="text-center text-xs text-[#8BA4C4] mt-3">
          {!isAuthenticated && '메시지를 보내려면 가입이 필요해요'}
        </p>
      </div>

      {/* 인증 필요 모달 */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end"
            onClick={() => setShowAuthModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-[#162A4A] rounded-t-3xl border-t border-[#1E3A5F] p-6"
            >
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 p-2"
              >
                <X size={20} className="text-[#8BA4C4]" />
              </button>

              <div className="w-12 h-1 bg-[#4A5E7A] rounded-full mx-auto mb-6" />

              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#86C9F2]/20 to-[#2C529C]/20 flex items-center justify-center">
                  <MessageCircle size={28} className="text-[#86C9F2]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {authAction === 'message' ? '메시지를 보내시겠어요?' : '명함을 저장하시겠어요?'}
                </h3>
                <p className="text-sm text-[#8BA4C4]">
                  {authAction === 'message'
                    ? '메시지를 보내려면 간단한 가입이 필요해요'
                    : '내 명함을 만들고 네트워크를 확장해보세요'}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleAuthRedirect}
                  className="w-full py-4 bg-[#86C9F2] text-[#0B162C] font-semibold rounded-xl"
                >
                  30초만에 가입하기
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="w-full py-4 bg-[#162A4A] text-white font-medium rounded-xl border border-[#1E3A5F]"
                >
                  이미 계정이 있어요
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PWA 설치 프롬프트 모달 */}
      <AnimatePresence>
        {showPwaPrompt && !isInstalled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end"
            onClick={() => setShowPwaPrompt(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-[#162A4A] rounded-t-3xl border-t border-[#1E3A5F] p-6"
            >
              <button
                onClick={() => setShowPwaPrompt(false)}
                className="absolute top-4 right-4 p-2"
              >
                <X size={20} className="text-[#8BA4C4]" />
              </button>

              <div className="w-12 h-1 bg-[#4A5E7A] rounded-full mx-auto mb-6" />

              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#86C9F2]/20 to-[#2C529C]/20 flex items-center justify-center">
                  <Smartphone size={28} className="text-[#86C9F2]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  홈 화면에 추가하시겠어요?
                </h3>
                <p className="text-sm text-[#8BA4C4]">
                  앱처럼 사용하고 언제든 {card.name}님의 명함을 확인하세요
                </p>
              </div>

              <div className="space-y-3">
                {isIos ? (
                  <div className="p-4 rounded-xl bg-[#101D33] space-y-3 text-sm text-[#8BA4C4]">
                    <p>1. Safari 하단의 <span className="text-white font-medium">공유 버튼</span> (□↑)을 탭하세요</p>
                    <p>2. 메뉴에서 <span className="text-white font-medium">&quot;홈 화면에 추가&quot;</span>를 선택하세요</p>
                    <p>3. 우측 상단 <span className="text-white font-medium">&quot;추가&quot;</span>를 탭하세요</p>
                  </div>
                ) : (
                  <button
                    onClick={handleInstallPwa}
                    className="w-full py-4 bg-[#86C9F2] text-[#0B162C] font-semibold rounded-xl flex items-center justify-center gap-2"
                  >
                    <Download size={20} />
                    홈 화면에 추가
                  </button>
                )}
                <button
                  onClick={() => setShowPwaPrompt(false)}
                  className="w-full py-4 text-[#8BA4C4] font-medium"
                >
                  나중에 하기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
