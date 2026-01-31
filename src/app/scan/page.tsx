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
import { useAuthStore } from '@/store/authStore';
import { useCardStore } from '@/store/cardStore';
import { BusinessCard, SavedCard } from '@/types';
import Avatar from '@/components/ui/Avatar';
import BottomNav from '@/components/ui/BottomNav';
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
  const qrReaderIdRef = useRef(`qr-reader-${Date.now()}`);

  // Paper card
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [paperCardInfo, setPaperCardInfo] = useState<PaperCardInfo>({
    name: '', company: '', position: '', phone: '', email: '',
  });
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
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

    try {
      // QR 스캐너 시작 (백그라운드 QR 감지)
      const qrReaderId = qrReaderIdRef.current;
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
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    startUnifiedCamera();

    return () => {
      isMountedRef.current = false;
      stopQrScanning();
      stopCamera();
    };
  }, [startUnifiedCamera, stopQrScanning, stopCamera]);

  // ==================== QR 처리 ====================
  const handleQrScan = (data: string) => {
    try {
      if (data.includes('/view/') && data.includes('data=')) {
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
    setTimeout(() => {
      setSaveSuccess(false);
      setScannedCard(null);
      router.push('/cards');
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

  // ==================== OCR ====================
  const parseBusinessCardText = (text: string): PaperCardInfo => {
    const cleanedText = text.replace(/[|}{[\]<>]/g, '').replace(/\s{2,}/g, ' ');
    const lines = cleanedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const info: PaperCardInfo = { name: '', company: '', position: '', phone: '', email: '' };

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
      for (const line of textLines) {
        const inlineMatch = line.match(/([가-힣]{2,4})\s+(?:대표|이사|부장|차장|과장|대리|사원|매니저|팀장|실장|본부장|센터장|수석|선임|책임|주임|파트장|지점장|부서장|총괄|전무|상무)/);
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
      'Associate', 'Principal', 'Senior', 'Junior', 'Staff',
      'Head', 'Chief', 'Officer', 'President',
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
  };

  const runOcr = async (imageData: string) => {
    setIsOcrProcessing(true);
    setViewState('ocr-processing');
    try {
      const processedImage = await preprocessImage(imageData);
      const result = await Tesseract.recognize(processedImage, 'kor+eng', { logger: () => {} });
      const parsed = parseBusinessCardText(result.data.text);
      const fieldCount = [parsed.name, parsed.company, parsed.phone, parsed.email].filter(v => v.length > 0).length;

      if (fieldCount < 2) {
        const fallbackResult = await Tesseract.recognize(imageData, 'kor+eng', { logger: () => {} });
        const fallbackParsed = parseBusinessCardText(fallbackResult.data.text);
        const fallbackCount = [fallbackParsed.name, fallbackParsed.company, fallbackParsed.phone, fallbackParsed.email].filter(v => v.length > 0).length;
        setPaperCardInfo(fallbackCount > fieldCount ? fallbackParsed : parsed);
      } else {
        setPaperCardInfo(parsed);
      }
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
    const qrReaderEl = document.getElementById(qrReaderIdRef.current);
    const video = qrReaderEl?.querySelector('video');
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/png');
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
    setTimeout(() => {
      setSaveSuccess(false);
      router.push('/cards');
    }, 1500);
  };

  const resetAndRestart = () => {
    setCardImage(null);
    setPaperCardInfo({ name: '', company: '', position: '', phone: '', email: '' });
    setScannedCard(null);
    setError(null);
    setViewState('camera');
    startUnifiedCamera();
  };

  const goBack = () => {
    if (viewState === 'camera') {
      stopQrScanning();
      stopCamera();
      router.back();
    } else {
      stopQrScanning();
      stopCamera();
      resetAndRestart();
    }
  };

  // ==================== 렌더링 ====================
  return (
    <div className="min-h-screen bg-[#0B162C] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0B162C]/80 backdrop-blur-xl border-b border-[#1E3A5F]">
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
                id={qrReaderIdRef.current}
                className="w-full aspect-[3/4] rounded-2xl overflow-hidden bg-[#162A4A]"
              />

              {/* 오버레이 가이드 */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                {/* QR 가이드 (상단) */}
                <div className="w-48 h-48 relative mb-4">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#86C9F2]" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#86C9F2]" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#86C9F2]" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#86C9F2]" />
                  <motion.div
                    initial={{ top: 0 }}
                    animate={{ top: '100%' }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#86C9F2] to-transparent"
                  />
                </div>

                {/* 안내 텍스트 */}
                <div className="bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2">
                  <div className="flex items-center gap-2 text-sm">
                    <QrCode size={14} className="text-[#86C9F2]" />
                    <span className="text-[#86C9F2]">QR 자동 감지 중</span>
                    <span className="text-[#8BA4C4] mx-1">|</span>
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
                  className="absolute inset-0 bg-[#00E676]/20 flex items-center justify-center rounded-2xl"
                >
                  <div className="bg-[#00E676] rounded-full p-4">
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
                className="flex-1 py-4 rounded-xl bg-gradient-to-r from-[#86C9F2] to-[#2C529C] text-white font-medium flex items-center justify-center gap-2"
              >
                <Camera size={20} />
                종이 명함 촬영
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                className="w-14 h-14 rounded-xl bg-[#162A4A] border border-[#1E3A5F] text-white flex items-center justify-center"
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
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#162A4A] to-[#101D33] border border-[#1E3A5F]">
                <div className="flex items-start gap-4">
                  <Avatar src={scannedCard.profileImage} name={scannedCard.name} size="lg" hasGlow />
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
                      <span key={idx} className="px-3 py-1 text-xs rounded-full bg-[#2C529C]/10 text-[#2C529C]">
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
                      onClick={() => router.push(`/network/${scannedCard.id}`)}
                      className="py-4 rounded-xl bg-[#162A4A] border border-[#1E3A5F] text-white font-medium flex items-center justify-center gap-2"
                    >
                      <Users size={20} />
                      인맥 보기
                    </motion.button>
                  </div>
                  <button onClick={resetAndRestart} className="w-full py-3 text-[#8BA4C4] text-sm">
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
                className="w-full aspect-[3/2] object-cover rounded-2xl border border-[#1E3A5F] mb-4 opacity-60"
              />
            )}
            <Loader2 size={40} className="text-[#86C9F2] animate-spin" />
            <p className="text-[#86C9F2] font-medium">명함 정보를 인식하고 있습니다...</p>
            <p className="text-sm text-[#8BA4C4]">잠시만 기다려주세요</p>
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
                  className="w-full aspect-[3/2] object-cover rounded-2xl border border-[#1E3A5F]"
                />
                <button
                  onClick={resetAndRestart}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
                >
                  <RotateCcw size={16} className="text-white" />
                </button>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-[#162A4A] border border-[#1E3A5F] space-y-4">
              <h3 className="text-white font-medium mb-2">명함 정보 확인</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-[#101D33] rounded-xl px-4 py-3">
                  <User size={18} className="text-[#8BA4C4]" />
                  <input type="text" placeholder="이름 *" value={paperCardInfo.name}
                    onChange={(e) => setPaperCardInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="flex-1 bg-transparent text-white placeholder-[#4A5E7A] outline-none" />
                </div>
                <div className="flex items-center gap-3 bg-[#101D33] rounded-xl px-4 py-3">
                  <Building2 size={18} className="text-[#8BA4C4]" />
                  <input type="text" placeholder="회사" value={paperCardInfo.company}
                    onChange={(e) => setPaperCardInfo(prev => ({ ...prev, company: e.target.value }))}
                    className="flex-1 bg-transparent text-white placeholder-[#4A5E7A] outline-none" />
                </div>
                <div className="flex items-center gap-3 bg-[#101D33] rounded-xl px-4 py-3">
                  <Briefcase size={18} className="text-[#8BA4C4]" />
                  <input type="text" placeholder="직책" value={paperCardInfo.position}
                    onChange={(e) => setPaperCardInfo(prev => ({ ...prev, position: e.target.value }))}
                    className="flex-1 bg-transparent text-white placeholder-[#4A5E7A] outline-none" />
                </div>
                <div className="flex items-center gap-3 bg-[#101D33] rounded-xl px-4 py-3">
                  <Phone size={18} className="text-[#8BA4C4]" />
                  <input type="tel" placeholder="전화번호" value={paperCardInfo.phone}
                    onChange={(e) => setPaperCardInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="flex-1 bg-transparent text-white placeholder-[#4A5E7A] outline-none" />
                </div>
                <div className="flex items-center gap-3 bg-[#101D33] rounded-xl px-4 py-3">
                  <Mail size={18} className="text-[#8BA4C4]" />
                  <input type="email" placeholder="이메일" value={paperCardInfo.email}
                    onChange={(e) => setPaperCardInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="flex-1 bg-transparent text-white placeholder-[#4A5E7A] outline-none" />
                </div>
              </div>
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
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSavePaperCard}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#86C9F2] to-[#2C529C] text-white font-medium flex items-center justify-center gap-2"
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
