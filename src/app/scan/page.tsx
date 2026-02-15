'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  X,
  Check,
  Building2,
  Briefcase,
  Users,
  Plus,
  QrCode,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuthStore } from '@/store/authStore';
import { useCardStore } from '@/store/cardStore';
import { BusinessCard } from '@/types';
import Avatar from '@/components/ui/Avatar';
import BottomNav from '@/components/ui/BottomNav';
import KakaoInvitePrompt from '@/components/invite/KakaoInvitePrompt';
import { v4 as uuidv4 } from 'uuid';

type ViewState = 'camera' | 'qr-result';

export default function ScanPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { savedCards, addSavedCard } = useCardStore();

  const [viewState, setViewState] = useState<ViewState>('camera');
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // QR
  const [scannedCard, setScannedCard] = useState<BusinessCard | null>(null);
  const [qrDetected, setQrDetected] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [qrReaderId, setQrReaderId] = useState(`qr-reader-${Date.now()}`);

  const [showKakaoPrompt, setShowKakaoPrompt] = useState(false);
  const [savedCardForInvite, setSavedCardForInvite] = useState<{ name: string; phone?: string; email?: string } | null>(null);
  const isMountedRef = useRef(true);

  // ==================== QR 카메라 시작 ====================
  const stopQrScanning = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
  }, []);

  const startUnifiedCamera = useCallback(async () => {
    setError(null);
    setQrDetected(false);

    const el = document.getElementById(qrReaderId);
    if (!el) return;

    try {
      const html5QrCode = new Html5Qrcode(qrReaderId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          videoConstraints: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            // @ts-ignore - focusMode is valid on mobile browsers
            focusMode: { ideal: 'continuous' },
          },
        },
        (decodedText) => {
          setQrDetected(true);
          handleQrScan(decodedText);
          html5QrCode.stop().catch(() => {});
          scannerRef.current = null;
        },
        () => {}
      );
    } catch (err) {
      console.error('Camera error:', err);
      setError('카메라에 접근할 수 없습니다. 카메라 권한을 확인해주세요.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrReaderId]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopQrScanning();
    };
  }, [stopQrScanning]);

  useEffect(() => {
    if (viewState === 'camera' && !scannerRef.current) {
      const rafId = requestAnimationFrame(() => {
        if (isMountedRef.current) {
          startUnifiedCamera();
        }
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [viewState, startUnifiedCamera]);

  // ==================== QR 처리 ====================
  const handleQrScan = (data: string) => {
    try {
      if (data.includes('/view/')) {
        const url = new URL(data);
        const cardDataParam = url.searchParams.get('data');
        if (cardDataParam) {
          const parsed = JSON.parse(decodeURIComponent(cardDataParam));
          const card: BusinessCard = {
            id: parsed.id, userId: parsed.id,
            name: parsed.name, email: parsed.email, phone: parsed.phone,
            company: parsed.company, position: parsed.position,
            bio: parsed.bio, profileImage: parsed.profileImage,
            keywords: parsed.keywords || [],
            networkVisibility: 'connections_only', qrCode: data,
            createdAt: new Date(), updatedAt: new Date(),
          };
          setScannedCard(card);
          setViewState('qr-result');
          return;
        }
        window.location.href = data;
        return;
      }

      const parsed = JSON.parse(data);
      if (parsed.type === 'nexus_card') {
        const card: BusinessCard = {
          id: parsed.id, userId: parsed.id,
          name: parsed.name, company: parsed.company, position: parsed.position,
          keywords: parsed.keywords || [],
          networkVisibility: 'connections_only', qrCode: data,
          createdAt: new Date(), updatedAt: new Date(),
        };
        setScannedCard(card);
        setViewState('qr-result');
      } else {
        setError('올바른 NODDED 명함 QR 코드가 아닙니다.');
      }
    } catch {
      setError('QR 코드를 인식할 수 없습니다.');
    }
  };

  const handleSaveQrCard = () => {
    if (!scannedCard) return;
    const alreadySaved = savedCards.some(c => c.cardId === scannedCard.id);
    if (alreadySaved) { setError('이미 저장된 명함입니다.'); return; }

    addSavedCard({
      id: uuidv4(), ownerId: user?.id || 'guest',
      cardId: scannedCard.id, card: scannedCard, savedAt: new Date(),
    });
    setSaveSuccess(true);
    setSavedCardForInvite({
      name: scannedCard.name,
      phone: scannedCard.phone,
      email: scannedCard.email,
    });
    setTimeout(() => {
      setSaveSuccess(false);
      setScannedCard(null);
      setShowKakaoPrompt(true);
    }, 1500);
  };

  const resetAndRestart = () => {
    stopQrScanning();
    setScannedCard(null);
    setError(null);
    setQrReaderId(`qr-reader-${Date.now()}`);
    setViewState('camera');
  };

  const goBack = () => {
    if (viewState === 'camera') {
      stopQrScanning();
      router.back();
    } else {
      resetAndRestart();
    }
  };

  // ==================== 렌더링 ====================
  return (
    <div className="min-h-screen bg-[#0D1117] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0D1117]/80 backdrop-blur-xl border-b border-[#30363D]">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={goBack} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white">
            {viewState === 'camera' && 'QR 명함 스캔'}
            {viewState === 'qr-result' && 'QR 명함 인식'}
          </h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* QR 카메라 뷰 */}
        {viewState === 'camera' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="relative">
              <div
                id={qrReaderId}
                className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-[#1C2333]"
              />

              {/* 오버레이 가이드 */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-48 h-48 relative mb-4">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#58A6FF]" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#58A6FF]" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#58A6FF]" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#58A6FF]" />
                  <motion.div
                    initial={{ top: 0 }}
                    animate={{ top: '100%' }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#58A6FF] to-transparent"
                  />
                </div>

                <div className="bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2">
                  <div className="flex items-center gap-2 text-base">
                    <QrCode size={14} className="text-[#58A6FF]" />
                    <span className="text-[#58A6FF]">QR 코드를 화면에 맞춰주세요</span>
                  </div>
                </div>
              </div>

              {/* QR 감지 표시 */}
              {qrDetected && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 bg-[#3FB950]/20 flex items-center justify-center rounded-xl"
                >
                  <div className="bg-[#3FB950] rounded-full p-4">
                    <Check size={32} className="text-black" />
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* QR 스캔 결과 */}
        {viewState === 'qr-result' && scannedCard && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="p-6 rounded-xl bg-gradient-to-br from-[#1C2333] to-[#161B22] border border-[#30363D]">
                <div className="flex items-start gap-4">
                  <Avatar src={scannedCard.profileImage} name={scannedCard.name} size="lg" hasGlow />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{scannedCard.name}</h3>
                    {scannedCard.position && (
                      <div className="flex items-center gap-2 text-[#8B949E] mb-1">
                        <Briefcase size={14} />
                        <span className="text-base">{scannedCard.position}</span>
                      </div>
                    )}
                    {scannedCard.company && (
                      <div className="flex items-center gap-2 text-[#8B949E]">
                        <Building2 size={14} />
                        <span className="text-base">{scannedCard.company}</span>
                      </div>
                    )}
                  </div>
                </div>

                {scannedCard.keywords && scannedCard.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#30363D]">
                    {scannedCard.keywords.map((keyword, idx) => (
                      <span key={idx} className="px-3 py-1 text-sm rounded-full bg-[#1F6FEB]/10 text-[#1F6FEB]">
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {saveSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-xl bg-[#3FB950]/10 border border-[#3FB950]/30 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-[#3FB950] flex items-center justify-center">
                    <Check size={18} className="text-black" />
                  </div>
                  <p className="text-[#3FB950] font-medium">명함이 저장되었습니다!</p>
                </motion.div>
              )}

              {!saveSuccess && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSaveQrCard}
                      className="py-4 rounded-xl bg-gradient-to-r from-[#58A6FF] to-[#1F6FEB] text-white font-medium flex items-center justify-center gap-2"
                    >
                      <Plus size={20} />
                      명함 저장
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => router.push(`/network/${scannedCard.id}`)}
                      className="py-4 rounded-xl bg-[#1C2333] border border-[#30363D] text-white font-medium flex items-center justify-center gap-2"
                    >
                      <Users size={20} />
                      인맥 보기
                    </motion.button>
                  </div>
                  <button onClick={resetAndRestart} className="w-full py-3 text-[#8B949E] text-base">
                    다른 명함 스캔하기
                  </button>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* 에러 메시지 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-[#F85149]/10 border border-[#F85149]/30"
          >
            <p className="text-base text-[#F85149]">{error}</p>
          </motion.div>
        )}
      </div>

      {showKakaoPrompt && savedCardForInvite && (
        <KakaoInvitePrompt
          recipientName={savedCardForInvite.name}
          recipientPhone={savedCardForInvite.phone}
          recipientEmail={savedCardForInvite.email}
          onClose={() => {
            setShowKakaoPrompt(false);
            setSavedCardForInvite(null);
            router.push('/cards');
          }}
          onSent={() => {
            router.push('/cards');
          }}
        />
      )}

      <BottomNav />
    </div>
  );
}