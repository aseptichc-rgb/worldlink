'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  X,
  Check,
  Building2,
  Briefcase,
  Users,
  Plus,
  QrCode,
  Phone,
  Mail,
  User,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import Tesseract from 'tesseract.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useAuthStore } from '@/store/authStore';
import { useCardStore } from '@/store/cardStore';
import { BusinessCard, SavedCard } from '@/types';
import Avatar from '@/components/ui/Avatar';
import BottomNav from '@/components/ui/BottomNav';
import { auth } from '@/lib/firebase';
import KakaoInvitePrompt from '@/components/invite/KakaoInvitePrompt';
import { v4 as uuidv4 } from 'uuid';

interface PaperCardInfo {
  name: string;
  company: string;
  position: string;
  phone: string;
  email: string;
}

type ViewState = 'camera' | 'qr-result' | 'ocr-processing' | 'paper-form';

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

  // Paper card
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [paperCardInfo, setPaperCardInfo] = useState<PaperCardInfo>({
    name: '', company: '', position: '', phone: '', email: '',
  });
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [showKakaoPrompt, setShowKakaoPrompt] = useState(false);
  const [savedCardForInvite, setSavedCardForInvite] = useState<{ name: string; phone?: string; email?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef(true);

  // ==================== 통합 카메라 시작 ====================
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const stopQrScanning = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
  }, []);

  const startUnifiedCamera = useCallback(async () => {
    setError(null);
    setQrDetected(false);

    // DOM 요소가 렌더링될 때까지 대기
    const el = document.getElementById(qrReaderId);
    if (!el) {
      return;
    }

    try {
      // QR 스캐너 시작 (백그라운드 QR 감지)
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
          // QR 감지됨
          setQrDetected(true);
          handleQrScan(decodedText);
          html5QrCode.stop().catch(() => {});
          scannerRef.current = null;
        },
        () => {} // QR 미감지 (무시)
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
      stopCamera();
    };
  }, [stopQrScanning, stopCamera]);

  // viewState가 'camera'이고 스캐너가 없을 때 카메라 시작 (재시작 포함)
  useEffect(() => {
    if (viewState === 'camera' && !scannerRef.current) {
      // DOM이 렌더링된 후 시작하기 위해 requestAnimationFrame 사용
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
        // 새 형식: /view/{cardId} (data 파라미터 없음) → view 페이지로 이동
        const url = new URL(data);
        const cardDataParam = url.searchParams.get('data');
        if (cardDataParam) {
          // 하위 호환: 이전 형식 (data 파라미터 포함)
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
        // 새 형식: Firebase에서 fetch하도록 view 페이지로 리다이렉트
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

  // ==================== 이미지 전처리 ====================
  const preprocessImage = (imageData: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.max(2, 2000 / Math.max(img.width, img.height));
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
  };

  // ==================== Gemini Vision API (이미지 직접 분석) ====================
  const parseWithGeminiVision = async (imageData: string): Promise<PaperCardInfo> => {
    try {
      const idToken = await auth?.currentUser?.getIdToken();
      const res = await fetch('/api/parse-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ imageBase64: imageData }),
      });

      if (!res.ok) {
        console.warn('Vision API failed, falling back to OCR');
        return await fallbackOcrParse(imageData);
      }

      const parsed = await res.json();
      return {
        name: parsed.name || '',
        company: parsed.company || '',
        position: parsed.position || '',
        phone: parsed.phone || '',
        email: parsed.email || '',
      };
    } catch (err) {
      console.error('Parse card API error:', err);
      return await fallbackOcrParse(imageData);
    }
  };

  // Vision API 실패 시 Tesseract OCR 폴백
  const fallbackOcrParse = async (imageData: string): Promise<PaperCardInfo> => {
    try {
      const processedImage = await preprocessImage(imageData);
      const result = await Tesseract.recognize(processedImage, 'kor+eng', { logger: () => {} });
      let ocrText = result.data.text;

      // 전처리 이미지 결과가 부실하면 원본으로 재시도
      if (ocrText.trim().length < 10) {
        const fallbackResult = await Tesseract.recognize(imageData, 'kor+eng', { logger: () => {} });
        if (fallbackResult.data.text.trim().length > ocrText.trim().length) {
          ocrText = fallbackResult.data.text;
        }
      }

      // 서버 API로 텍스트 파싱 시도
      try {
        const idToken = await auth?.currentUser?.getIdToken();
        const res = await fetch('/api/parse-card', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {}),
          },
          body: JSON.stringify({ ocrText }),
        });
        if (res.ok) {
          const parsed = await res.json();
          return {
            name: parsed.name || '',
            company: parsed.company || '',
            position: parsed.position || '',
            phone: parsed.phone || '',
            email: parsed.email || '',
          };
        }
      } catch {}

      // 최종 폴백: 로컬 정규식 파싱
      return localRegexParse(ocrText);
    } catch (err) {
      console.error('Fallback OCR error:', err);
      return { name: '', company: '', position: '', phone: '', email: '' };
    }
  };

  // 로컬 정규식 파싱 (최종 폴백)
  const localRegexParse = (text: string): PaperCardInfo => {
    const info: PaperCardInfo = { name: '', company: '', position: '', phone: '', email: '' };
    const cleaned = text.replace(/[|}{[\]<>]/g, '').replace(/\s{2,}/g, ' ');

    const emailMatch = cleaned.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) info.email = emailMatch[0];

    const phoneMatch = cleaned.match(/(?:\+?82[-.\s]?|0)(?:10|11|16|17|18|19)[-.\s]?\d{3,4}[-.\s]?\d{4}/);
    if (phoneMatch) info.phone = phoneMatch[0].replace(/^[A-Za-z가-힣.\s:]+/, '').trim();

    const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    for (const line of lines) {
      const nameMatch = line.match(/^[가-힣]{2,4}$/);
      if (nameMatch) { info.name = nameMatch[0]; break; }
    }

    return info;
  };

  const runOcr = async (imageData: string) => {
    setIsOcrProcessing(true);
    setViewState('ocr-processing');
    try {
      // Gemini Vision API로 이미지 직접 분석 (OCR 불필요)
      const parsed = await parseWithGeminiVision(imageData);
      setPaperCardInfo(parsed);
    } catch (err) {
      console.error('OCR error:', err);
    } finally {
      setIsOcrProcessing(false);
      if (isMountedRef.current) setViewState('paper-form');
    }
  };

  // ==================== 종이 명함 촬영 ====================
  const captureFromQrCamera = () => {
    // html5-qrcode의 비디오 엘리먼트에서 캡처
    const qrReaderEl = document.getElementById(qrReaderId);
    const video = qrReaderEl?.querySelector('video');
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.95);
    setCardImage(imageData);

    // QR 스캐너 중지 후 OCR 실행
    stopQrScanning();
    runOcr(imageData);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setCardImage(imageData);
      stopQrScanning();
      runOcr(imageData);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePaperCard = () => {
    if (!paperCardInfo.name.trim()) { setError('이름을 입력해주세요.'); return; }

    const cardId = uuidv4();
    const card: BusinessCard = {
      id: cardId, userId: cardId,
      name: paperCardInfo.name.trim(),
      company: paperCardInfo.company.trim() || undefined,
      position: paperCardInfo.position.trim() || undefined,
      phone: paperCardInfo.phone.trim() || undefined,
      email: paperCardInfo.email.trim() || undefined,
      keywords: [], networkVisibility: 'private', qrCode: '',
      createdAt: new Date(), updatedAt: new Date(),
    };

    addSavedCard({
      id: uuidv4(), ownerId: user?.id || 'guest',
      cardId: card.id, card, cardImage: cardImage || undefined, savedAt: new Date(),
    });
    setSaveSuccess(true);
    setSavedCardForInvite({
      name: card.name,
      phone: card.phone,
      email: card.email,
    });
    setTimeout(() => {
      setSaveSuccess(false);
      setShowKakaoPrompt(true);
    }, 1500);
  };

  const resetAndRestart = () => {
    stopQrScanning();
    setCardImage(null);
    setPaperCardInfo({ name: '', company: '', position: '', phone: '', email: '' });
    setScannedCard(null);
    setError(null);
    // 새 ID를 생성하여 깨끗한 DOM 요소에서 카메라 시작
    setQrReaderId(`qr-reader-${Date.now()}`);
    setViewState('camera');
  };

  const goBack = () => {
    if (viewState === 'camera') {
      stopQrScanning();
      stopCamera();
      router.back();
    } else {
      // 다른 뷰에서 카메라로 돌아갈 때 카메라 중지 없이 재시작
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
            {viewState === 'camera' && '명함 스캔'}
            {viewState === 'qr-result' && 'QR 명함 인식'}
            {viewState === 'ocr-processing' && '명함 인식 중'}
            {viewState === 'paper-form' && '명함 정보 확인'}
          </h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* 통합 카메라 뷰 */}
        {viewState === 'camera' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* QR 리더 (카메라 프리뷰 역할) */}
            <div className="relative">
              <div
                id={qrReaderId}
                className="w-full aspect-[3/4] rounded-2xl overflow-hidden bg-[#1C2333]"
              />

              {/* 오버레이 가이드 */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                {/* QR 가이드 (상단) */}
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

                {/* 안내 텍스트 */}
                <div className="bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2">
                  <div className="flex items-center gap-2 text-sm">
                    <QrCode size={14} className="text-[#58A6FF]" />
                    <span className="text-[#58A6FF]">QR 자동 감지 중</span>
                    <span className="text-[#8B949E] mx-1">|</span>
                    <Camera size={14} className="text-white" />
                    <span className="text-white">종이 명함은 촬영 버튼</span>
                  </div>
                </div>
              </div>

              {/* QR 감지 표시 */}
              {qrDetected && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 bg-[#3FB950]/20 flex items-center justify-center rounded-2xl"
                >
                  <div className="bg-[#3FB950] rounded-full p-4">
                    <Check size={32} className="text-black" />
                  </div>
                </motion.div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {/* 하단 버튼: 촬영 + 갤러리 */}
            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={captureFromQrCamera}
                className="flex-1 py-4 rounded-xl bg-gradient-to-r from-[#58A6FF] to-[#1F6FEB] text-white font-medium flex items-center justify-center gap-2"
              >
                <Camera size={20} />
                종이 명함 촬영
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                className="w-14 h-14 rounded-xl bg-[#1C2333] border border-[#30363D] text-white flex items-center justify-center"
              >
                <ImageIcon size={24} />
              </motion.button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
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
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1C2333] to-[#161B22] border border-[#30363D]">
                <div className="flex items-start gap-4">
                  <Avatar src={scannedCard.profileImage} name={scannedCard.name} size="lg" hasGlow />
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
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#30363D]">
                    {scannedCard.keywords.map((keyword, idx) => (
                      <span key={idx} className="px-3 py-1 text-xs rounded-full bg-[#1F6FEB]/10 text-[#1F6FEB]">
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
                  <button onClick={resetAndRestart} className="w-full py-3 text-[#8B949E] text-sm">
                    다른 명함 스캔하기
                  </button>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* OCR 처리 중 */}
        {viewState === 'ocr-processing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 space-y-4"
          >
            {cardImage && (
              <img
                src={cardImage}
                alt="촬영된 명함"
                className="w-full aspect-[3/2] object-cover rounded-2xl border border-[#30363D] mb-4 opacity-60"
              />
            )}
            <Loader2 size={40} className="text-[#58A6FF] animate-spin" />
            <p className="text-[#58A6FF] font-medium">명함 정보를 인식하고 있습니다...</p>
            <p className="text-sm text-[#8B949E]">잠시만 기다려주세요</p>
          </motion.div>
        )}

        {/* 종이 명함 정보 입력 폼 */}
        {viewState === 'paper-form' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {cardImage && (
              <div className="relative">
                <img
                  src={cardImage}
                  alt="촬영된 명함"
                  className="w-full aspect-[3/2] object-cover rounded-2xl border border-[#30363D]"
                />
                <button
                  onClick={resetAndRestart}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
                >
                  <RotateCcw size={16} className="text-white" />
                </button>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-[#1C2333] border border-[#30363D] space-y-4">
              <h3 className="text-white font-medium mb-2">명함 정보 확인</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-[#161B22] rounded-xl px-4 py-3">
                  <User size={18} className="text-[#8B949E]" />
                  <input type="text" placeholder="이름 *" value={paperCardInfo.name}
                    onChange={(e) => setPaperCardInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="flex-1 bg-transparent text-white placeholder-[#484F58] outline-none" />
                </div>
                <div className="flex items-center gap-3 bg-[#161B22] rounded-xl px-4 py-3">
                  <Building2 size={18} className="text-[#8B949E]" />
                  <input type="text" placeholder="회사" value={paperCardInfo.company}
                    onChange={(e) => setPaperCardInfo(prev => ({ ...prev, company: e.target.value }))}
                    className="flex-1 bg-transparent text-white placeholder-[#484F58] outline-none" />
                </div>
                <div className="flex items-center gap-3 bg-[#161B22] rounded-xl px-4 py-3">
                  <Briefcase size={18} className="text-[#8B949E]" />
                  <input type="text" placeholder="직책" value={paperCardInfo.position}
                    onChange={(e) => setPaperCardInfo(prev => ({ ...prev, position: e.target.value }))}
                    className="flex-1 bg-transparent text-white placeholder-[#484F58] outline-none" />
                </div>
                <div className="flex items-center gap-3 bg-[#161B22] rounded-xl px-4 py-3">
                  <Phone size={18} className="text-[#8B949E]" />
                  <input type="tel" placeholder="전화번호" value={paperCardInfo.phone}
                    onChange={(e) => setPaperCardInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="flex-1 bg-transparent text-white placeholder-[#484F58] outline-none" />
                </div>
                <div className="flex items-center gap-3 bg-[#161B22] rounded-xl px-4 py-3">
                  <Mail size={18} className="text-[#8B949E]" />
                  <input type="email" placeholder="이메일" value={paperCardInfo.email}
                    onChange={(e) => setPaperCardInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="flex-1 bg-transparent text-white placeholder-[#484F58] outline-none" />
                </div>
              </div>
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
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSavePaperCard}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#58A6FF] to-[#1F6FEB] text-white font-medium flex items-center justify-center gap-2"
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
            className="p-4 rounded-xl bg-[#F85149]/10 border border-[#F85149]/30"
          >
            <p className="text-sm text-[#F85149]">{error}</p>
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
