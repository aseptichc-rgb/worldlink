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
  Plus,
  QrCode,
  CreditCard,
  Phone,
  Mail,
  User,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuthStore } from '@/store/authStore';
import { useCardStore } from '@/store/cardStore';
import { BusinessCard, SavedCard } from '@/types';
import Avatar from '@/components/ui/Avatar';
import BottomNav from '@/components/ui/BottomNav';
import { v4 as uuidv4 } from 'uuid';

type ScanMode = 'select' | 'qr' | 'paper';

interface PaperCardInfo {
  name: string;
  company: string;
  position: string;
  phone: string;
  email: string;
}

export default function ScanPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { savedCards, addSavedCard } = useCardStore();

  // 공통 상태
  const [scanMode, setScanMode] = useState<ScanMode>('select');
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // QR 스캔 상태
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCard, setScannedCard] = useState<BusinessCard | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // 종이 명함 스캔 상태
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [paperCardInfo, setPaperCardInfo] = useState<PaperCardInfo>({
    name: '',
    company: '',
    position: '',
    phone: '',
    email: '',
  });
  const [showInfoForm, setShowInfoForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
      stopCamera();
    };
  }, []);

  // ==================== QR 스캔 관련 함수 ====================
  const startQrScanning = async () => {
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
          handleQrScan(decodedText);
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

  const stopQrScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(console.error);
    }
    setIsScanning(false);
  };

  const handleQrScan = (data: string) => {
    try {
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
        setError('올바른 NODDED 명함 QR 코드가 아닙니다.');
      }
    } catch {
      setError('QR 코드를 인식할 수 없습니다.');
    }
  };

  const handleSaveQrCard = () => {
    if (!scannedCard) return;

    const alreadySaved = savedCards.some(c => c.cardId === scannedCard.id);
    if (alreadySaved) {
      setError('이미 저장된 명함입니다.');
      return;
    }

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

  // ==================== 종이 명함 스캔 관련 함수 ====================
  const startCamera = async () => {
    setError(null);
    setIsCapturing(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('카메라에 접근할 수 없습니다. 카메라 권한을 확인해주세요.');
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setCardImage(imageData);
      stopCamera();
      setShowInfoForm(true);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setCardImage(imageData);
      setShowInfoForm(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePaperCard = () => {
    if (!paperCardInfo.name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    const cardId = uuidv4();
    const card: BusinessCard = {
      id: cardId,
      userId: cardId,
      name: paperCardInfo.name.trim(),
      company: paperCardInfo.company.trim() || undefined,
      position: paperCardInfo.position.trim() || undefined,
      phone: paperCardInfo.phone.trim() || undefined,
      email: paperCardInfo.email.trim() || undefined,
      keywords: [],
      networkVisibility: 'private',
      qrCode: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const savedCard: SavedCard = {
      id: uuidv4(),
      ownerId: user?.id || 'guest',
      cardId: card.id,
      card: card,
      cardImage: cardImage || undefined,
      savedAt: new Date(),
    };

    addSavedCard(savedCard);
    setSaveSuccess(true);

    setTimeout(() => {
      setSaveSuccess(false);
      resetPaperCardState();
      router.push('/cards');
    }, 1500);
  };

  const resetPaperCardState = () => {
    setCardImage(null);
    setPaperCardInfo({ name: '', company: '', position: '', phone: '', email: '' });
    setShowInfoForm(false);
    stopCamera();
  };

  const handleViewNetwork = () => {
    if (scannedCard) {
      router.push(`/network/${scannedCard.id}`);
    }
  };

  const goBack = () => {
    if (scanMode === 'qr') {
      stopQrScanning();
      setScannedCard(null);
    } else if (scanMode === 'paper') {
      resetPaperCardState();
    }
    setScanMode('select');
    setError(null);
  };

  // ==================== 렌더링 ====================
  return (
    <div className="min-h-screen bg-[#0B162C] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0B162C]/80 backdrop-blur-xl border-b border-[#1E3A5F]">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={scanMode === 'select' ? () => router.back() : goBack} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white">
            {scanMode === 'select' && '명함 스캔'}
            {scanMode === 'qr' && 'QR 코드 스캔'}
            {scanMode === 'paper' && '종이 명함 스캔'}
          </h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* 모드 선택 */}
        {scanMode === 'select' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <p className="text-center text-[#8BA4C4] mb-6">
              어떤 방식으로 명함을 스캔하시겠습니까?
            </p>

            {/* QR 코드 스캔 */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setScanMode('qr')}
              className="w-full p-6 rounded-2xl bg-gradient-to-br from-[#162A4A] to-[#101D33] border border-[#1E3A5F] flex items-center gap-4"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-[#86C9F2]/20 to-[#2C529C]/20 flex items-center justify-center">
                <QrCode size={32} className="text-[#86C9F2]" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-semibold text-white mb-1">QR 코드 스캔</h3>
                <p className="text-sm text-[#8BA4C4]">
                  NODDED 앱 사용자의 QR 명함을 스캔합니다
                </p>
              </div>
            </motion.button>

            {/* 종이 명함 스캔 */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setScanMode('paper')}
              className="w-full p-6 rounded-2xl bg-gradient-to-br from-[#162A4A] to-[#101D33] border border-[#1E3A5F] flex items-center gap-4"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-[#2C529C]/20 to-[#FF6B6B]/20 flex items-center justify-center">
                <CreditCard size={32} className="text-[#2C529C]" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-semibold text-white mb-1">종이 명함 스캔</h3>
                <p className="text-sm text-[#8BA4C4]">
                  종이 명함을 촬영하여 정보와 이미지를 저장합니다
                </p>
              </div>
            </motion.button>
          </motion.div>
        )}

        {/* QR 스캔 모드 */}
        {scanMode === 'qr' && !scannedCard && (
          <>
            <div className="relative">
              <div
                id="qr-reader"
                className={`w-full aspect-square rounded-2xl overflow-hidden bg-[#162A4A] ${
                  isScanning ? '' : 'hidden'
                }`}
              />

              {!isScanning && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full aspect-square rounded-2xl bg-[#162A4A] border border-[#1E3A5F] flex flex-col items-center justify-center"
                >
                  <div className="w-24 h-24 rounded-2xl bg-[#1E3A5F] flex items-center justify-center mb-6">
                    <QrCode size={40} className="text-[#4A5E7A]" />
                  </div>
                  <p className="text-white font-medium mb-2">QR 코드를 스캔하세요</p>
                  <p className="text-sm text-[#8BA4C4] text-center px-8">
                    상대방의 명함 QR 코드를 카메라로 스캔하면<br />
                    명함이 자동으로 저장됩니다
                  </p>
                </motion.div>
              )}

              {isScanning && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-64 h-64 relative">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#86C9F2]" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#86C9F2]" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#86C9F2]" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#86C9F2]" />
                      <motion.div
                        initial={{ top: 0 }}
                        animate={{ top: '100%' }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#86C9F2] to-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={isScanning ? stopQrScanning : startQrScanning}
                className={`flex-1 py-4 rounded-xl font-medium flex items-center justify-center gap-2 ${
                  isScanning
                    ? 'bg-[#FF5252] text-white'
                    : 'bg-gradient-to-r from-[#86C9F2] to-[#2C529C] text-white'
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
                    flashOn ? 'bg-[#FFD54F] text-black' : 'bg-[#162A4A] text-white border border-[#1E3A5F]'
                  }`}
                >
                  <Flashlight size={24} />
                </motion.button>
              )}
            </div>
          </>
        )}

        {/* QR 스캔 결과 */}
        {scanMode === 'qr' && scannedCard && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#162A4A] to-[#101D33] border border-[#1E3A5F]">
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
                      <div className="flex items-center gap-2 text-[#8BA4C4] mb-1">
                        <Briefcase size={14} />
                        <span className="text-sm">{scannedCard.position}</span>
                      </div>
                    )}
                    {scannedCard.company && (
                      <div className="flex items-center gap-2 text-[#8BA4C4]">
                        <Building2 size={14} />
                        <span className="text-sm">{scannedCard.company}</span>
                      </div>
                    )}
                  </div>
                </div>

                {scannedCard.keywords && scannedCard.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#1E3A5F]">
                    {scannedCard.keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 text-xs rounded-full bg-[#2C529C]/10 text-[#2C529C]"
                      >
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
                  className="p-4 rounded-xl bg-[#00E676]/10 border border-[#00E676]/30 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-[#00E676] flex items-center justify-center">
                    <Check size={18} className="text-black" />
                  </div>
                  <p className="text-[#00E676] font-medium">명함이 저장되었습니다!</p>
                </motion.div>
              )}

              {!saveSuccess && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSaveQrCard}
                      className="py-4 rounded-xl bg-gradient-to-r from-[#86C9F2] to-[#2C529C] text-white font-medium flex items-center justify-center gap-2"
                    >
                      <Plus size={20} />
                      명함 저장
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleViewNetwork}
                      className="py-4 rounded-xl bg-[#162A4A] border border-[#1E3A5F] text-white font-medium flex items-center justify-center gap-2"
                    >
                      <Users size={20} />
                      인맥 보기
                    </motion.button>
                  </div>

                  <button
                    onClick={() => setScannedCard(null)}
                    className="w-full py-3 text-[#8BA4C4] text-sm"
                  >
                    다른 명함 스캔하기
                  </button>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* 종이 명함 스캔 모드 */}
        {scanMode === 'paper' && !showInfoForm && (
          <>
            <div className="relative">
              {isCapturing ? (
                <div className="relative w-full aspect-[3/2] rounded-2xl overflow-hidden bg-[#162A4A]">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {/* 명함 가이드 프레임 */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[90%] h-[85%] border-2 border-dashed border-[#2C529C]/50 rounded-xl">
                      <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-[#2C529C]" />
                      <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-[#2C529C]" />
                      <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-[#2C529C]" />
                      <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-[#2C529C]" />
                    </div>
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full aspect-[3/2] rounded-2xl bg-[#162A4A] border border-[#1E3A5F] flex flex-col items-center justify-center"
                >
                  <div className="w-24 h-24 rounded-2xl bg-[#1E3A5F] flex items-center justify-center mb-6">
                    <CreditCard size={40} className="text-[#4A5E7A]" />
                  </div>
                  <p className="text-white font-medium mb-2">명함을 촬영하세요</p>
                  <p className="text-sm text-[#8BA4C4] text-center px-8">
                    종이 명함을 카메라로 촬영하면<br />
                    이미지와 정보가 함께 저장됩니다
                  </p>
                </motion.div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex gap-3">
              {isCapturing ? (
                <>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={captureImage}
                    className="flex-1 py-4 rounded-xl bg-gradient-to-r from-[#2C529C] to-[#FF6B6B] text-white font-medium flex items-center justify-center gap-2"
                  >
                    <Camera size={20} />
                    촬영하기
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={stopCamera}
                    className="w-14 h-14 rounded-xl bg-[#FF5252] text-white flex items-center justify-center"
                  >
                    <X size={24} />
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={startCamera}
                    className="flex-1 py-4 rounded-xl bg-gradient-to-r from-[#2C529C] to-[#FF6B6B] text-white font-medium flex items-center justify-center gap-2"
                  >
                    <Camera size={20} />
                    카메라로 촬영
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-14 h-14 rounded-xl bg-[#162A4A] border border-[#1E3A5F] text-white flex items-center justify-center"
                  >
                    <ImageIcon size={24} />
                  </motion.button>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </>
        )}

        {/* 종이 명함 정보 입력 폼 */}
        {scanMode === 'paper' && showInfoForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* 촬영된 이미지 미리보기 */}
            {cardImage && (
              <div className="relative">
                <img
                  src={cardImage}
                  alt="촬영된 명함"
                  className="w-full aspect-[3/2] object-cover rounded-2xl border border-[#1E3A5F]"
                />
                <button
                  onClick={() => {
                    setCardImage(null);
                    setShowInfoForm(false);
                  }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
                >
                  <RotateCcw size={16} className="text-white" />
                </button>
              </div>
            )}

            {/* 정보 입력 폼 */}
            <div className="p-4 rounded-2xl bg-[#162A4A] border border-[#1E3A5F] space-y-4">
              <h3 className="text-white font-medium mb-2">명함 정보 입력</h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-[#101D33] rounded-xl px-4 py-3">
                  <User size={18} className="text-[#8BA4C4]" />
                  <input
                    type="text"
                    placeholder="이름 *"
                    value={paperCardInfo.name}
                    onChange={(e) => setPaperCardInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="flex-1 bg-transparent text-white placeholder-[#4A5E7A] outline-none"
                  />
                </div>

                <div className="flex items-center gap-3 bg-[#101D33] rounded-xl px-4 py-3">
                  <Building2 size={18} className="text-[#8BA4C4]" />
                  <input
                    type="text"
                    placeholder="회사"
                    value={paperCardInfo.company}
                    onChange={(e) => setPaperCardInfo(prev => ({ ...prev, company: e.target.value }))}
                    className="flex-1 bg-transparent text-white placeholder-[#4A5E7A] outline-none"
                  />
                </div>

                <div className="flex items-center gap-3 bg-[#101D33] rounded-xl px-4 py-3">
                  <Briefcase size={18} className="text-[#8BA4C4]" />
                  <input
                    type="text"
                    placeholder="직책"
                    value={paperCardInfo.position}
                    onChange={(e) => setPaperCardInfo(prev => ({ ...prev, position: e.target.value }))}
                    className="flex-1 bg-transparent text-white placeholder-[#4A5E7A] outline-none"
                  />
                </div>

                <div className="flex items-center gap-3 bg-[#101D33] rounded-xl px-4 py-3">
                  <Phone size={18} className="text-[#8BA4C4]" />
                  <input
                    type="tel"
                    placeholder="전화번호"
                    value={paperCardInfo.phone}
                    onChange={(e) => setPaperCardInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="flex-1 bg-transparent text-white placeholder-[#4A5E7A] outline-none"
                  />
                </div>

                <div className="flex items-center gap-3 bg-[#101D33] rounded-xl px-4 py-3">
                  <Mail size={18} className="text-[#8BA4C4]" />
                  <input
                    type="email"
                    placeholder="이메일"
                    value={paperCardInfo.email}
                    onChange={(e) => setPaperCardInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="flex-1 bg-transparent text-white placeholder-[#4A5E7A] outline-none"
                  />
                </div>
              </div>
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

            {/* 저장 버튼 */}
            {!saveSuccess && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSavePaperCard}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#2C529C] to-[#FF6B6B] text-white font-medium flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                명함 저장
              </motion.button>
            )}
          </motion.div>
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
      </div>

      <BottomNav />
    </div>
  );
}
