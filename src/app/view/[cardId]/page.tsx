'use client';

import { useState, useEffect, useCallback, use } from 'react';
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
import { getPublicCard, getUser, savePublicCard } from '@/lib/firebase-services';

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
  const [loadError, setLoadError] = useState(false);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadCard = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    let firebaseError = false;

    // 1. Firebase에서 공개 명함 조회
    try {
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
    } catch (e) {
      console.error('publicCards lookup failed', e);
      firebaseError = true;
    }

    // 2. 폴백: users 컬렉션에서 조회 (기존 사용자 지원)
    try {
      const userData = await getUser(cardId);
      if (userData) {
        // 찾은 데이터로 공개 명함 자동 생성
        savePublicCard({
          id: userData.id,
          name: userData.name,
          company: userData.company,
          position: userData.position,
          email: userData.email,
          phone: userData.phone,
          bio: userData.bio,
          profileImage: userData.profileImage,
          keywords: userData.keywords,
        }).catch(() => {});

        setCard({
          id: userData.id,
          userId: userData.id,
          name: userData.name,
          company: userData.company,
          position: userData.position,
          email: userData.email,
          phone: userData.phone,
          bio: userData.bio,
          profileImage: userData.profileImage,
          keywords: userData.keywords || [],
          networkVisibility: 'connections_only',
          qrCode: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        setLoading(false);
        return;
      }
    } catch (e) {
      console.error('users lookup failed', e);
      firebaseError = true;
    }

    // 3. 하위 호환: URL data 파라미터 (이전 QR 코드 지원)
    try {
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
    } catch (e) {
      console.error('URL data parse failed', e);
    }

    // 4. localStorage 폴백
    try {
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
      console.error('localStorage lookup failed', e);
    }

    // Firebase 에러로 인해 못 찾은 경우 에러 상태 표시
    if (firebaseError) {
      setLoadError(true);
    }
    setLoading(false);
  }, [cardId]);

  useEffect(() => {
    loadCard();
  }, [loadCard]);

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
    router.push(`/messages?to=${card?.id}`);
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
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#F1F3F5] flex items-center justify-center">
            <UserPlus size={32} className="text-[#94A3B8]" />
          </div>
          {loadError ? (
            <>
              <h1 className="text-xl font-semibold text-[#1A1A2E] mb-2">연결에 실패했습니다</h1>
              <p className="text-[#64748B] mb-6">네트워크 상태를 확인하고 다시 시도해주세요</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => loadCard()}
                  className="px-6 py-3 bg-[#2563EB] text-white font-semibold rounded-xl"
                >
                  다시 시도
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-3 bg-[#F1F3F5] text-[#1A1A2E] font-semibold rounded-xl border border-[#E2E8F0]"
                >
                  홈으로 이동
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-[#1A1A2E] mb-2">명함을 찾을 수 없습니다</h1>
              <p className="text-[#64748B] mb-6">QR 코드가 유효하지 않거나 만료되었습니다</p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-[#2563EB] text-white font-semibold rounded-xl"
              >
                홈으로 이동
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* 헤더 */}
      <div className="sticky top-0 z-30 bg-[#FAFBFC]/80 backdrop-blur-sm border-b border-[#E2E8F0]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center">
              <span className="text-xs font-bold text-white">N</span>
            </div>
            <span className="text-lg font-bold text-[#1A1A2E]">NODDED</span>
          </div>
          <button onClick={handleShare} className="p-2">
            <Share2 size={20} className="text-[#64748B]" />
          </button>
        </div>
      </div>

      <div className="p-4 pb-32 space-y-6">
        {/* 명함 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-sm"
        >
          {/* 배경 장식 */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#2563EB]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#3B82F6]/5 rounded-full blur-3xl" />

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
                <h2 className="text-2xl font-bold text-[#1A1A2E] mb-1">{card.name}</h2>
                {card.position && (
                  <div className="flex items-center gap-2 text-[#64748B] mb-1">
                    <Briefcase size={14} />
                    <span className="text-base">{card.position}</span>
                  </div>
                )}
                {card.company && (
                  <div className="flex items-center gap-2 text-[#64748B]">
                    <Building2 size={14} />
                    <span className="text-base">{card.company}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 연락처 정보 */}
            {(card.email || card.phone) && (
              <div className="space-y-2 mb-6 p-4 rounded-lg bg-[#F8F9FA]">
                {card.email && (
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-[#2563EB]" />
                    <span className="text-base text-[#1A1A2E]">{card.email}</span>
                  </div>
                )}
                {card.phone && (
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-[#2563EB]" />
                    <span className="text-base text-[#1A1A2E]">{card.phone}</span>
                  </div>
                )}
              </div>
            )}

            {/* 소개 */}
            {card.bio && (
              <p className="text-base text-[#64748B] mb-6 leading-relaxed">
                {card.bio}
              </p>
            )}

            {/* 키워드 태그 */}
            {card.keywords && card.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {card.keywords.slice(0, 6).map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 text-sm font-medium rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/20"
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
            className="p-4 rounded-xl bg-[#EFF6FF] border border-[#2563EB]/20"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#2563EB]/10">
                <Smartphone size={20} className="text-[#2563EB]" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-[#1A1A2E] mb-1">
                  앱으로 저장하기
                </h3>
                {isIos ? (
                  <div className="space-y-2">
                    <p className="text-sm text-[#64748B]">
                      Safari에서 아래 단계를 따라주세요:
                    </p>
                    <div className="space-y-1.5 text-sm text-[#64748B]">
                      <p>1. 하단 <span className="text-[#1A1A2E] font-medium">공유 버튼</span> (□↑) 탭</p>
                      <p>2. <span className="text-[#1A1A2E] font-medium">&quot;홈 화면에 추가&quot;</span> 선택</p>
                      <p>3. <span className="text-[#1A1A2E] font-medium">&quot;추가&quot;</span> 탭</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-[#64748B] mb-3">
                      홈 화면에 추가하면 언제든 명함을 확인할 수 있어요
                    </p>
                    <button
                      onClick={handleInstallPwa}
                      className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white text-base font-medium rounded-lg"
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
            className="p-4 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#10B981]/20 flex items-center justify-center">
                <UserPlus size={20} className="text-[#10B981]" />
              </div>
              <div>
                <p className="text-base font-medium text-[#10B981]">명함이 저장되었습니다!</p>
                <p className="text-sm text-[#64748B]">내 명함첩에서 확인할 수 있어요</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#FAFBFC] via-[#FAFBFC] to-transparent pt-8">
        <div className="flex gap-3 max-w-lg mx-auto">
          {!saved ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveCard}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#2563EB] text-white font-semibold rounded-xl"
            >
              <Plus size={20} />
              명함 저장하기
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSendMessage}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#2563EB] text-white font-semibold rounded-xl"
            >
              <MessageCircle size={20} />
              메시지 보내기
            </motion.button>
          )}
        </div>
        <p className="text-center text-sm text-[#64748B] mt-3">
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
            className="fixed inset-0 z-50 bg-[rgba(0,0,0,0.3)] backdrop-blur-sm flex items-end"
            onClick={() => setShowAuthModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-[#FFFFFF] rounded-t-2xl border-t border-[#E2E8F0] p-6 shadow-lg"
            >
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 p-2"
              >
                <X size={20} className="text-[#64748B]" />
              </button>

              <div className="w-12 h-1 bg-[#CBD5E1] rounded-full mx-auto mb-6" />

              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#EFF6FF] flex items-center justify-center">
                  <MessageCircle size={28} className="text-[#2563EB]" />
                </div>
                <h3 className="text-xl font-semibold text-[#1A1A2E] mb-2">
                  {authAction === 'message' ? '메시지를 보내시겠어요?' : '명함을 저장하시겠어요?'}
                </h3>
                <p className="text-base text-[#64748B]">
                  {authAction === 'message'
                    ? '메시지를 보내려면 간단한 가입이 필요해요'
                    : '내 명함을 만들고 네트워크를 확장해보세요'}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleAuthRedirect}
                  className="w-full py-4 bg-[#2563EB] text-white font-semibold rounded-xl"
                >
                  30초만에 가입하기
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="w-full py-4 bg-[#F1F3F5] text-[#1A1A2E] font-medium rounded-xl border border-[#E2E8F0]"
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
            className="fixed inset-0 z-50 bg-[rgba(0,0,0,0.3)] backdrop-blur-sm flex items-end"
            onClick={() => setShowPwaPrompt(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-[#FFFFFF] rounded-t-2xl border-t border-[#E2E8F0] p-6 shadow-lg"
            >
              <button
                onClick={() => setShowPwaPrompt(false)}
                className="absolute top-4 right-4 p-2"
              >
                <X size={20} className="text-[#64748B]" />
              </button>

              <div className="w-12 h-1 bg-[#CBD5E1] rounded-full mx-auto mb-6" />

              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#EFF6FF] flex items-center justify-center">
                  <Smartphone size={28} className="text-[#2563EB]" />
                </div>
                <h3 className="text-xl font-semibold text-[#1A1A2E] mb-2">
                  홈 화면에 추가하시겠어요?
                </h3>
                <p className="text-base text-[#64748B]">
                  앱처럼 사용하고 언제든 {card.name}님의 명함을 확인하세요
                </p>
              </div>

              <div className="space-y-3">
                {isIos ? (
                  <div className="p-4 rounded-lg bg-[#F8F9FA] space-y-3 text-base text-[#64748B]">
                    <p>1. Safari 하단의 <span className="text-[#1A1A2E] font-medium">공유 버튼</span> (□↑)을 탭하세요</p>
                    <p>2. 메뉴에서 <span className="text-[#1A1A2E] font-medium">&quot;홈 화면에 추가&quot;</span>를 선택하세요</p>
                    <p>3. 우측 상단 <span className="text-[#1A1A2E] font-medium">&quot;추가&quot;</span>를 탭하세요</p>
                  </div>
                ) : (
                  <button
                    onClick={handleInstallPwa}
                    className="w-full py-4 bg-[#2563EB] text-white font-semibold rounded-xl flex items-center justify-center gap-2"
                  >
                    <Download size={20} />
                    홈 화면에 추가
                  </button>
                )}
                <button
                  onClick={() => setShowPwaPrompt(false)}
                  className="w-full py-4 text-[#64748B] font-medium"
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
