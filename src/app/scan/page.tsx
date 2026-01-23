'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Camera,
  Flashlight,
  Image as ImageIcon,
  X,
  Check,
  Building2,
  Briefcase,
  Users,
  Plus
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuthStore } from '@/store/authStore';
import { useCardStore } from '@/store/cardStore';
import { BusinessCard, SavedCard } from '@/types';
import Avatar from '@/components/ui/Avatar';
import BottomNav from '@/components/ui/BottomNav';
import { v4 as uuidv4 } from 'uuid';

export default function ScanPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { savedCards, addSavedCard } = useCardStore();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCard, setScannedCard] = useState<BusinessCard | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanning = async () => {
    setError(null);
    setIsScanning(true);

    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleScan(decodedText);
          html5QrCode.stop().catch(console.error);
          setIsScanning(false);
        },
        () => {}
      );
    } catch (err) {
      console.error('Scanner error:', err);
      setError('카메라에 접근할 수 없습니다. 카메라 권한을 확인해주세요.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(console.error);
    }
    setIsScanning(false);
  };

  const handleScan = (data: string) => {
    try {
      // URL 형태의 QR 코드 처리 (새로운 형식)
      if (data.includes('/view/') && data.includes('data=')) {
        const url = new URL(data);
        const cardDataParam = url.searchParams.get('data');
        if (cardDataParam) {
          const parsed = JSON.parse(decodeURIComponent(cardDataParam));
          const card: BusinessCard = {
            id: parsed.id,
            userId: parsed.id,
            name: parsed.name,
            email: parsed.email,
            phone: parsed.phone,
            company: parsed.company,
            position: parsed.position,
            bio: parsed.bio,
            profileImage: parsed.profileImage,
            keywords: parsed.keywords || [],
            networkVisibility: 'connections_only',
            qrCode: data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setScannedCard(card);
          return;
        }
      }

      // 기존 JSON 형태의 QR 코드 처리 (레거시)
      const parsed = JSON.parse(data);
      if (parsed.type === 'nexus_card') {
        const card: BusinessCard = {
          id: parsed.id,
          userId: parsed.id,
          name: parsed.name,
          company: parsed.company,
          position: parsed.position,
          keywords: parsed.keywords || [],
          networkVisibility: 'connections_only',
          qrCode: data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setScannedCard(card);
      } else {
        setError('올바른 NEXUS 명함 QR 코드가 아닙니다.');
      }
    } catch {
      setError('QR 코드를 인식할 수 없습니다.');
    }
  };

  const handleSaveCard = () => {
    if (!scannedCard) return;

    // 이미 저장된 명함인지 확인
    const alreadySaved = savedCards.some(c => c.cardId === scannedCard.id);
    if (alreadySaved) {
      setError('이미 저장된 명함입니다.');
      return;
    }

    // 비로그인 사용자도 로컬에 저장 가능
    const savedCard: SavedCard = {
      id: uuidv4(),
      ownerId: user?.id || 'guest',
      cardId: scannedCard.id,
      card: scannedCard,
      savedAt: new Date(),
    };

    addSavedCard(savedCard);
    setSaveSuccess(true);

    setTimeout(() => {
      setSaveSuccess(false);
      setScannedCard(null);
      router.push('/cards');
    }, 1500);
  };

  const handleViewNetwork = () => {
    if (scannedCard) {
      router.push(`/network/${scannedCard.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0A0E1A]/80 backdrop-blur-xl border-b border-[#21262D]">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white">명함 스캔</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* 스캔 영역 */}
        {!scannedCard && (
          <div className="relative">
            <div
              id="qr-reader"
              className={`w-full aspect-square rounded-2xl overflow-hidden bg-[#161B22] ${
                isScanning ? '' : 'hidden'
              }`}
            />

            {!isScanning && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full aspect-square rounded-2xl bg-[#161B22] border border-[#21262D] flex flex-col items-center justify-center"
              >
                <div className="w-24 h-24 rounded-2xl bg-[#21262D] flex items-center justify-center mb-6">
                  <Camera size={40} className="text-[#484F58]" />
                </div>
                <p className="text-white font-medium mb-2">QR 코드를 스캔하세요</p>
                <p className="text-sm text-[#8B949E] text-center px-8">
                  상대방의 명함 QR 코드를 카메라로 스캔하면<br />
                  명함이 자동으로 저장됩니다
                </p>
              </motion.div>
            )}

            {/* 스캔 프레임 오버레이 */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 relative">
                    {/* 코너 */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#00E5FF]" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#00E5FF]" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#00E5FF]" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#00E5FF]" />
                    {/* 스캔 라인 */}
                    <motion.div
                      initial={{ top: 0 }}
                      animate={{ top: '100%' }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-[#FF5252]/10 border border-[#FF5252]/30"
          >
            <p className="text-sm text-[#FF5252]">{error}</p>
          </motion.div>
        )}

        {/* 스캔 버튼 */}
        {!scannedCard && (
          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={isScanning ? stopScanning : startScanning}
              className={`flex-1 py-4 rounded-xl font-medium flex items-center justify-center gap-2 ${
                isScanning
                  ? 'bg-[#FF5252] text-white'
                  : 'bg-gradient-to-r from-[#00E5FF] to-[#7C4DFF] text-black'
              }`}
            >
              {isScanning ? (
                <>
                  <X size={20} />
                  스캔 중지
                </>
              ) : (
                <>
                  <Camera size={20} />
                  스캔 시작
                </>
              )}
            </motion.button>

            {isScanning && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setFlashOn(!flashOn)}
                className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  flashOn ? 'bg-[#FFD54F] text-black' : 'bg-[#161B22] text-white border border-[#21262D]'
                }`}
              >
                <Flashlight size={24} />
              </motion.button>
            )}
          </div>
        )}

        {/* 스캔된 명함 미리보기 */}
        <AnimatePresence>
          {scannedCard && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* 명함 카드 */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#161B22] to-[#0D1117] border border-[#21262D]">
                <div className="flex items-start gap-4">
                  <Avatar
                    src={scannedCard.profileImage}
                    name={scannedCard.name}
                    size="lg"
                    hasGlow
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{scannedCard.name}</h3>
                    {scannedCard.position && (
                      <div className="flex items-center gap-2 text-[#8B949E] mb-1">
                        <Briefcase size={14} />
                        <span className="text-sm">{scannedCard.position}</span>
                      </div>
                    )}
                    {scannedCard.company && (
                      <div className="flex items-center gap-2 text-[#8B949E]">
                        <Building2 size={14} />
                        <span className="text-sm">{scannedCard.company}</span>
                      </div>
                    )}
                  </div>
                </div>

                {scannedCard.keywords && scannedCard.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#21262D]">
                    {scannedCard.keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 text-xs rounded-full bg-[#7C4DFF]/10 text-[#7C4DFF]"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 성공 메시지 */}
              {saveSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-xl bg-[#00E676]/10 border border-[#00E676]/30 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-[#00E676] flex items-center justify-center">
                    <Check size={18} className="text-black" />
                  </div>
                  <p className="text-[#00E676] font-medium">명함이 저장되었습니다!</p>
                </motion.div>
              )}

              {/* 액션 버튼 */}
              {!saveSuccess && (
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSaveCard}
                    className="py-4 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#7C4DFF] text-black font-medium flex items-center justify-center gap-2"
                  >
                    <Plus size={20} />
                    명함 저장
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleViewNetwork}
                    className="py-4 rounded-xl bg-[#161B22] border border-[#21262D] text-white font-medium flex items-center justify-center gap-2"
                  >
                    <Users size={20} />
                    인맥 보기
                  </motion.button>
                </div>
              )}

              {/* 다시 스캔 */}
              {!saveSuccess && (
                <button
                  onClick={() => setScannedCard(null)}
                  className="w-full py-3 text-[#8B949E] text-sm"
                >
                  다른 명함 스캔하기
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  );
}
